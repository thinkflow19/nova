import config from '../config/config'; // Import centralized config
import { ApiResponse } from './types';

// Use API URL from config
const API_URL = config.apiUrl;

// Constants for retry mechanism
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504]; // Retryable status codes
// Network-related errors that should trigger retries
const RETRYABLE_ERROR_CODES = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH'];

// Global state to track backend connectivity
let isBackendConnected = true;
let lastConnectivityCheck = 0;
const CONNECTIVITY_CHECK_INTERVAL = 30000; // Check every 30 seconds at most

/**
 * Gets auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.warn('No auth token found in localStorage');
  }
  return token;
}

/**
 * Sets auth token in localStorage
 */
function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('authToken', token);
  console.log('Auth token set in localStorage:', token ? `${token.substring(0, 10)}...` : 'null');
}

/**
 * Refreshes the auth token
 */
async function refreshAuthToken(): Promise<string | null> {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const data = await response.json();
    if (data.access_token) {
      setAuthToken(data.access_token);
      // Optionally update refresh token too if the API returns a new one
      if (data.refresh_token) {
        localStorage.setItem('refreshToken', data.refresh_token);
      }
      return data.access_token;
    }
    return null;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return null;
  }
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if the backend server is reachable
 */
async function checkBackendConnectivity(): Promise<boolean> {
  // Don't check too frequently
  const now = Date.now();
  if (now - lastConnectivityCheck < CONNECTIVITY_CHECK_INTERVAL) {
    return isBackendConnected;
  }
  
  lastConnectivityCheck = now;
  
  try {
    // Use GET instead of HEAD since the endpoint only supports GET
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    
    isBackendConnected = response.ok;
    return isBackendConnected;
  } catch (error) {
    console.warn('Backend connectivity check failed:', error);
    isBackendConnected = false;
    return false;
  }
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: any): boolean {
  // Check for network errors
  if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
    return true;
  }
  
  // Check for specific error codes
  if (error.code && RETRYABLE_ERROR_CODES.includes(error.code)) {
    return true;
  }
  
  return false;
}

/**
 * Makes a fetch request to the API with proper error handling and retry mechanism
 */
export async function fetchAPI(endpoint: string, options?: RequestInit, retryCount = 0, accessToken?: string): Promise<any> {
  // If we've already had connectivity issues, check if backend is now reachable before proceeding
  if (!isBackendConnected) {
    const isConnected = await checkBackendConnectivity();
    if (!isConnected) {
      throw new Error('Backend server is not reachable. Please check your connection and ensure the server is running.');
    }
  }
  
  // If no access token is provided, try to get it from localStorage
  if (!accessToken) {
    const localToken = getAuthToken();
    if (localToken) {
      accessToken = localToken;
    }
  }
  
  // Don't throw error for public endpoints that don't require auth
  const isPublicEndpoint = endpoint.startsWith('/api/auth/') || endpoint === '/health';
  
  if (!accessToken && !isPublicEndpoint) {
    throw new Error('Authentication token not found. Please log in again.');
  }

  // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
  const isFormData = options?.body instanceof FormData;
  
  const headers = {
    // Only set Content-Type for JSON requests, not FormData
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
    ...(options?.headers),
  };

  try {
    console.log(`Making API request to ${endpoint}`);
    
    // Validate API URL before proceeding
    if (!API_URL) {
      throw new Error('API URL is not configured. Please check your environment variables.');
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Backend is reachable if we got here
    isBackendConnected = true;

    // Handle authentication errors with token refresh
    if (response.status === 401 && retryCount === 0) {
      console.log('Token expired, attempting to refresh...');
      const newToken = await refreshAuthToken();
      if (newToken) {
        console.log('Token refreshed successfully, retrying request');
        return fetchAPI(endpoint, options, retryCount + 1, newToken);
      } else {
        throw new Error('Your session has expired. Please log in again.');
      }
    }

    // Handle retryable errors
    if (!response.ok) {
      const isRetryable = RETRY_STATUS_CODES.includes(response.status);
      
      if (isRetryable && retryCount < MAX_RETRIES) {
        console.log(`Retryable error (${response.status}), retrying... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
        await sleep(RETRY_DELAY_MS * Math.pow(2, retryCount)); // Exponential backoff
        return fetchAPI(endpoint, options, retryCount + 1, accessToken);
      }
      
      let errorData;
      let errorMessage;
      try {
        errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || response.statusText;
      } catch (e) {
        errorMessage = response.statusText;
        errorData = { detail: errorMessage };
      }

      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });

      // Handle specific status codes
      switch (response.status) {
        case 401:
          throw new Error('Your session has expired. Please log in again.');
        case 403:
          throw new Error('You do not have permission to perform this action.');
        case 404:
          throw new Error('The requested resource was not found.');
        case 500:
          throw new Error('An internal server error occurred. Please try again later.');
        default:
          throw new Error(errorMessage || `Request failed with status ${response.status}`);
      }
    }

    // Handle responses with no content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('Network error:', error);
      isBackendConnected = false;
    
      // Retry on network errors
      if (retryCount < MAX_RETRIES) {
      console.log(`Network error, retrying... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
      await sleep(RETRY_DELAY_MS * Math.pow(2, retryCount)); // Exponential backoff
      return fetchAPI(endpoint, options, retryCount + 1, accessToken);
    }
    
      throw new Error('Cannot connect to the server. Please check your internet connection and try again.');
    }
    
    throw error;
  }
}

/**
 * Stream chat responses using Server-Sent Events
 */
export async function streamChat(
  endpoint: string,
  options?: RequestInit,
): Promise<AsyncIterable<any>> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication token not found. Please log in again.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    ...(options?.headers),
  };

  try {
    console.log(`Making streaming API request to ${endpoint}`);
    
    // Validate API URL before proceeding
    if (!API_URL) {
      throw new Error('API URL is not configured. Please check your environment variables.');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData;
      let errorMessage;
      try {
        errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || response.statusText;
      } catch (e) {
        errorMessage = response.statusText;
        errorData = { detail: errorMessage };
      }
      console.error('Streaming API Error:', { status: response.status, statusText: response.statusText, errorData });
      throw new Error(`Streaming request failed with status ${response.status}: ${errorMessage}`);
    }

    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error('Failed to get stream reader.');
    }
    
    return (async function*(): AsyncGenerator<string, void, unknown> {
      try {
        let buffer = ''; // Buffer to accumulate incoming data
        const decoder = new TextDecoder(); // Decoder for stream chunks
        
        // Process stream chunks
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('Streaming finished.');
            break;
          }

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process the buffer to find complete SSE events (separated by \n\n)
          const events = buffer.split('\n\n');
          // Keep the last potentially incomplete event in the buffer
          buffer = events.pop() || '';

          for (const event of events) {
            // Skip empty events
            if (!event.trim()) continue;
            
            // Split event into lines to process potential multi-line data
            const lines = event.split('\n');
            let dataLines: string[] = [];
            let eventId: string | null = null;
            let eventType: string | null = null;

            for (const line of lines) {
              if (line.startsWith('data:')) { // Check for data: with potential space
                // Find the position of the first character after "data:" and any whitespace
                const dataPrefixEnd = line.indexOf(':') + 1; // Find the colon
                let contentStart = dataPrefixEnd;
                while (contentStart < line.length && line[contentStart] === ' ') {
                  contentStart++; // Skip leading spaces after colon
                }
                const dataContent = line.substring(contentStart);
                dataLines.push(dataContent);
              } else if (line.startsWith('id:')) { // Check for id: with potential space
                eventId = line.substring('id:'.length).trimStart();
              } else if (line.startsWith('event:')) { // Check for event: with potential space
                eventType = line.substring('event:'.length).trimStart();
              } else if (line.startsWith(':')) {
                // Ignore comments
                continue;
              } else if (line.trim() === '') {
                // Ignore empty lines within an event block
                continue;
              }
            }

            // If data lines were found, concatenate and parse the JSON
            if (dataLines.length > 0) {
              const fullDataString = dataLines.join('\n'); // Concatenate data lines with newline
              try {
                const data = JSON.parse(fullDataString);

                if (data.error) {
                  yield `Error: ${data.error}`;
                  // Decide if an error should stop the stream
                  // return; 
                }

                if (data.content !== undefined) {
                  yield data.content;
                }

                if (data.done) {
                  console.log('Received done signal from stream.');
                  return; // Exit on done signal
                }
              } catch (e) {
                console.error('Error parsing concatenated SSE data JSON:', e, fullDataString);
                // If we can't parse as JSON, just yield the raw content
                yield fullDataString;
        }
            }
          }
        }
      } catch (error) {
        console.error('Error reading stream:', error);
        yield `Error during streaming: ${error instanceof Error ? error.message : 'Unknown error'}`;
      } finally {
        // Ensure the reader is released even if an error occurs
        if (reader && !reader.closed) {
          reader.releaseLock();
        }
      }
    })();
  } catch (error) {
    console.error('Error reading stream:', error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

// Helper to determine backend connectivity status
export function getBackendConnectivityStatus(): boolean {
    return isBackendConnected;
}

export const API = {
  // Auth - Simplified as we're now using Supabase Auth directly
  signup: async (email: string, password: string) => {
    try {
      // This is just to create a user record in our backend database
      // The actual authentication is handled by Supabase Auth
      return await fetchAPI('/api/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch (error) {
      // Make sure we return a properly formatted error
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: 'An unexpected error occurred during signup' };
    }
  },

  // Projects
  listProjects: (accessToken: string) => {
    return fetchAPI('/api/projects', {
      method: 'GET',
    }, 0, accessToken);
  },
  
  createProject: (projectData: {
    name: string;
    description?: string;
    is_public?: boolean;
    color?: string;
    icon?: string;
    ai_config?: Record<string, unknown>;
    memory_type?: string;
    tags?: string[];
  }) => {
    return fetchAPI('/api/projects', { 
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },
  
  updateProject: (projectData: {
    id: string;
    name?: string;
    description?: string;
    is_public?: boolean;
    color?: string;
    icon?: string;
    ai_config?: Record<string, unknown>;
    memory_type?: string;
    tags?: string[];
  }) => {
    return fetchAPI(`/api/projects/${projectData.id}`, {
      method: 'PATCH',
      body: JSON.stringify(projectData),
    });
  },

  // Documents
  uploadDocument: (file: File, projectId: string) => {
    // Create form data for multipart upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);
    formData.append('file_name', file.name);
    
    return fetchAPI('/api/doc/upload-complete', {
      method: 'POST',
      body: formData,
      // Do not set Content-Type header, browser will set it with boundary
    });
  },
  
  // Get document status
  getDocumentStatus: (documentId: string) => {
    return fetchAPI(`/api/doc/${documentId}`);
  },
  
  // List documents in a project
  listProjectDocuments: (projectId: string) => {
    return fetchAPI(`/api/doc/${projectId}/list`);
  },
  
  // Delete a document
  deleteDocument: (documentId: string) => {
    return fetchAPI(`/api/doc/${documentId}`, {
      method: 'DELETE',
    });
  },

  // Health check
  health: () => {
    return fetchAPI('/health');
  },

  // Chat
  // Updated to use the new endpoint structure with sessions and completions
  createChatSession: (projectId: string, title?: string) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    return fetchAPI('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        title: title || 'New Chat'
      }),
    }, 0, token);
  },

  listChatSessions: (projectId: string) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    return fetchAPI(`/api/chat/sessions/project/${projectId}`, {
      method: 'GET',
    }, 0, token);
  },

  getChatSession: (sessionId: string) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    return fetchAPI(`/api/chat/sessions/${sessionId}`, {
      method: 'GET',
    }, 0, token);
  },

  getChatMessages: (sessionId: string) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    return fetchAPI(`/api/chat/messages/${sessionId}`, {
      method: 'GET',
    }, 0, token);
  },

  // Replace the old chat function with the new completions endpoint
  chat: async (projectId: string, message: string, sessionId?: string) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    // If no sessionId is provided, create a new session first
    if (!sessionId) {
      try {
        const session = await API.createChatSession(projectId);
        sessionId = session.id;
      } catch (error) {
        console.error('Failed to create chat session:', error);
        throw error;
      }
    }

    // Send the message using the completions endpoint
    return fetchAPI('/api/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
        session_id: sessionId,
        project_id: projectId
      }),
    }, 0, token);
  },
  
  // Stream chat responses using Server-Sent Events
  streamChat: async (projectId: string, message: string, sessionId?: string): Promise<AsyncGenerator<string, void, unknown>> => {
    // If no sessionId is provided, create a new session first
    if (!sessionId) {
      try {
        const session = await API.createChatSession(projectId);
        sessionId = session.id;
      } catch (error) {
        console.error('Failed to create chat session:', error);
        throw error;
      }
    }
    
    // Create async generator for streaming response
    async function* streamGenerator(): AsyncGenerator<string, void, unknown> {
      try {
        const token = getAuthToken();
        if (!token) {
          yield "Error: Authentication token not found. Please log in again.";
          return;
        }
        
        const streamUrl = new URL(`${API_URL}/api/chat/stream`);
        streamUrl.searchParams.append('project_id', projectId);
        if (sessionId) {
          streamUrl.searchParams.append('session_id', sessionId);
        }
        
        const response = await fetch(streamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            message,
            session_id: sessionId,
            project_id: projectId
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          yield `Error: ${response.status} - ${errorText || response.statusText}`;
          return;
        }
        
        if (!response.body) {
          yield "Error: Stream response body is null";
          return;
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process buffer for SSE format "data: {...}\n\n"
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || ''; // Keep the last incomplete chunk in the buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // Remove "data: " prefix
                const data = JSON.parse(jsonStr);
                
                if (data.error) {
                  yield `Error: ${data.error}`;
                  return;
                }
                
                if (data.content) {
                  yield data.content;
                }
                
                if (data.done) {
                  return;
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e, line);
                // Just yield the raw data if parsing fails
                yield line.slice(6);
              }
            }
          }
        }
        
        // Process any remaining data in the buffer
        if (buffer.startsWith('data: ')) {
          try {
            const jsonStr = buffer.slice(6);
            const data = JSON.parse(jsonStr);
            if (data.content) yield data.content;
          } catch (e) {
            console.error('Error parsing final SSE data:', e);
          }
        }
        
      } catch (error) {
        console.error('Streaming error:', error);
        yield `Error during streaming: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
    
    return streamGenerator();
  },

  // Delete a project
  deleteProject: async (projectId: string): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication token not found.");
    }
    const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    // DELETE requests often return 204 No Content on success, which has no body
    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Failed to delete project (status: ${response.status})`);
    }
    // No content to return for a successful delete
  },

  // Create a new document
};

export default API; 