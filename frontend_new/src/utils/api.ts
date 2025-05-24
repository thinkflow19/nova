import config from './config';
import type { Project, ChatSession, ChatMessage, Document, ApiResponse } from '../types/index';
import { createSupabaseClient } from './supabase';
import { ChatSessionSchema, ProjectSchema, ChatMessageSchema, DocumentSchema } from '../types/index';
import { z } from 'zod';

// Define the expected structure for the completion response from the backend
interface BackendCompletionResponse {
  completion: string;
  session_id: string;
  // Add any other fields the /completions endpoint sends for non-streaming if necessary
}

// Constants for retry mechanism
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504]; // Retryable status codes
// Network-related errors that should trigger retries
const RETRYABLE_ERROR_CODES = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'];

// Global state to track backend connectivity
let isBackendConnected = true;
let lastConnectivityCheck = 0;
const CONNECTIVITY_CHECK_INTERVAL = 30000; // Check every 30 seconds at most

const supabase = createSupabaseClient();

// Custom error class for API errors
class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, any>;

  constructor({ message, status, code, details }: {
    message: string;
    status: number;
    code?: string;
    details?: Record<string, any>;
  }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Base API client for making requests to the backend
 */
class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get authentication token from Supabase session
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Build headers for API requests
   */
  private async getHeaders(additionalHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
    const headers = { ...this.defaultHeaders };
    
    // Add auth token if available
    const token = await this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return { ...headers, ...additionalHeaders };
  }

  /**
   * Check if error should be retried
   */
  private shouldRetry(status: number, errorCode?: string): boolean {
    // Retry based on status code
    if (status && RETRY_STATUS_CODES.includes(status)) {
      return true;
    }

    // Retry based on network error code
    if (errorCode && RETRYABLE_ERROR_CODES.includes(errorCode)) {
      return true;
    }

    return false;
  }

  /**
   * Wait for a specified delay
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle API response and throw error if needed
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Check for not-ok responses
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      let errorData: Record<string, any> = {};
      
      try {
        errorData = await response.json();
        console.error("Detailed API Error Data (from api.ts handleResponse):", errorData); // Enhanced log
        // FastAPI often puts detailed validation errors in errorData.detail
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) { // Pydantic validation errors can be an array
            errorMessage = errorData.detail.map((err: any) => `${err.loc?.join('.') || 'unknown'}: ${err.msg}`).join('; ');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          }
        } else {
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      } catch (e) {
        // If parsing fails, use the status text
        console.error('Failed to parse error response JSON:', e);
      }
      
      throw new ApiError({
        message: errorMessage,
        status: response.status,
        code: errorData.code,
        details: errorData
      });
    }

    // Check for empty response (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    try {
      // Parse JSON response
      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new ApiError({
        message: 'Invalid JSON response from server',
        status: response.status
      });
    }
  }

  /**
   * Check and update backend connectivity status
   */
  private async checkBackendConnectivity(): Promise<boolean> {
    const now = Date.now();
    // Only check periodically to avoid too many requests
    if (now - lastConnectivityCheck < CONNECTIVITY_CHECK_INTERVAL) {
      return isBackendConnected;
    }

    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers,
      });
      isBackendConnected = response.ok;
    } catch (error) {
      isBackendConnected = false;
    }

    lastConnectivityCheck = now;
    return isBackendConnected;
  }

  /**
   * Make a GET request to the API with retry logic
   */
  async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    // Build query string
    const queryParams = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}${path}${queryParams ? `?${queryParams}` : ''}`;

    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
    try {
        // Get headers including auth token
        const headers = await this.getHeaders();
        
      const response = await fetch(url, {
        method: 'GET',
          headers,
      });

        return await this.handleResponse<T>(response);
      } catch (error) {
        if (error instanceof ApiError && this.shouldRetry(error.status)) {
          retries++;
          if (retries <= MAX_RETRIES) {
            console.warn(`Retry ${retries}/${MAX_RETRIES} for ${path} due to status ${error.status}`);
            await this.wait(RETRY_DELAY_MS * retries);
            continue;
          }
        } else if (error instanceof Error && RETRYABLE_ERROR_CODES.some(code => error.message.includes(code))) {
          retries++;
          if (retries <= MAX_RETRIES) {
            console.warn(`Retry ${retries}/${MAX_RETRIES} for ${path} due to network error: ${error.message}`);
            await this.wait(RETRY_DELAY_MS * retries);
          continue;
          }
        }
      throw error;
    }
    }
    
    // This should never happen since the loop either returns or throws
    throw new Error('Maximum retries exceeded');
  }

  /**
   * Make a POST request to the API with retry logic
   */
  async post<T>(path: string, data?: any): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
    try {
        const headers = await this.getHeaders();
        
        const response = await fetch(url, {
        method: 'POST',
          headers,
        body: data ? JSON.stringify(data) : undefined,
      });

        return await this.handleResponse<T>(response);
      } catch (error) {
        if (error instanceof ApiError && this.shouldRetry(error.status)) {
          retries++;
          if (retries <= MAX_RETRIES) {
            console.warn(`Retry ${retries}/${MAX_RETRIES} for ${path} due to status ${error.status}`);
            await this.wait(RETRY_DELAY_MS * retries);
            continue;
          }
        } else if (error instanceof Error && RETRYABLE_ERROR_CODES.some(code => error.message.includes(code))) {
          retries++;
          if (retries <= MAX_RETRIES) {
            console.warn(`Retry ${retries}/${MAX_RETRIES} for ${path} due to network error: ${error.message}`);
            await this.wait(RETRY_DELAY_MS * retries);
          continue;
          }
        }
      throw error;
    }
    }
    
    throw new Error('Maximum retries exceeded');
  }

  /**
   * Make a PUT request to the API with retry logic
   */
  async put<T>(path: string, data?: any): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
    try {
        const headers = await this.getHeaders();
        
        const response = await fetch(url, {
        method: 'PUT',
          headers,
        body: data ? JSON.stringify(data) : undefined,
      });

        return await this.handleResponse<T>(response);
      } catch (error) {
        if (error instanceof ApiError && this.shouldRetry(error.status)) {
          retries++;
          if (retries <= MAX_RETRIES) {
            console.warn(`Retry ${retries}/${MAX_RETRIES} for ${path} due to status ${error.status}`);
            await this.wait(RETRY_DELAY_MS * retries);
            continue;
          }
        } else if (error instanceof Error && RETRYABLE_ERROR_CODES.some(code => error.message.includes(code))) {
          retries++;
          if (retries <= MAX_RETRIES) {
            console.warn(`Retry ${retries}/${MAX_RETRIES} for ${path} due to network error: ${error.message}`);
            await this.wait(RETRY_DELAY_MS * retries);
          continue;
          }
        }
      throw error;
    }
    }
    
    throw new Error('Maximum retries exceeded');
  }

  /**
   * Make a PATCH request to the API with retry logic
   */
  async patch<T>(path: string, data?: any): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
    try {
        const headers = await this.getHeaders();
        
        const response = await fetch(url, {
        method: 'PATCH',
          headers,
        body: data ? JSON.stringify(data) : undefined,
      });

        return await this.handleResponse<T>(response);
      } catch (error) {
        if (error instanceof ApiError && this.shouldRetry(error.status)) {
          retries++;
          if (retries <= MAX_RETRIES) {
            console.warn(`Retry ${retries}/${MAX_RETRIES} for ${path} due to status ${error.status}`);
            await this.wait(RETRY_DELAY_MS * retries);
            continue;
          }
        } else if (error instanceof Error && RETRYABLE_ERROR_CODES.some(code => error.message.includes(code))) {
          retries++;
          if (retries <= MAX_RETRIES) {
            console.warn(`Retry ${retries}/${MAX_RETRIES} for ${path} due to network error: ${error.message}`);
            await this.wait(RETRY_DELAY_MS * retries);
          continue;
          }
        }
      throw error;
    }
    }
    
    throw new Error('Maximum retries exceeded');
  }

  /**
   * Make a DELETE request to the API with retry logic
   */
  async delete<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
    try {
        const headers = await this.getHeaders();
        
        const response = await fetch(url, {
        method: 'DELETE',
          headers,
      });

        return await this.handleResponse<T>(response);
      } catch (error) {
        if (error instanceof ApiError && this.shouldRetry(error.status)) {
          retries++;
          if (retries <= MAX_RETRIES) {
            console.warn(`Retry ${retries}/${MAX_RETRIES} for ${path} due to status ${error.status}`);
            await this.wait(RETRY_DELAY_MS * retries);
            continue;
          }
        } else if (error instanceof Error && RETRYABLE_ERROR_CODES.some(code => error.message.includes(code))) {
          retries++;
          if (retries <= MAX_RETRIES) {
            console.warn(`Retry ${retries}/${MAX_RETRIES} for ${path} due to network error: ${error.message}`);
            await this.wait(RETRY_DELAY_MS * retries);
          continue;
          }
        }
      throw error;
    }
    }
    
    throw new Error('Maximum retries exceeded');
  }

  /**
   * Upload a file to the API
   */
  async uploadFile<T>(path: string, file: File, metadata?: Record<string, any>): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      // Don't include Content-Type when using FormData
      // The browser will set it automatically with the proper boundary
        const headers = await this.getHeaders({});
      delete headers['Content-Type'];

        const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

        return await this.handleResponse<T>(response);
      } catch (error) {
        if (error instanceof ApiError && this.shouldRetry(error.status)) {
          retries++;
          if (retries <= MAX_RETRIES) {
            console.warn(`Retry ${retries}/${MAX_RETRIES} for ${path} due to status ${error.status}`);
            await this.wait(RETRY_DELAY_MS * retries);
            continue;
          }
        } else if (error instanceof Error && RETRYABLE_ERROR_CODES.some(code => error.message.includes(code))) {
          retries++;
          if (retries <= MAX_RETRIES) {
            console.warn(`Retry ${retries}/${MAX_RETRIES} for ${path} due to network error: ${error.message}`);
            await this.wait(RETRY_DELAY_MS * retries);
          continue;
          }
        }
      throw error;
      }
    }
    
    throw new Error('Maximum retries exceeded');
  }

  /**
   * Process API response data to handle both array and items property formats
   */
  private processApiResponse<T>(data: any): T[] {
    if (Array.isArray(data)) {
      return data as T[];
    }
    
    if (data.items && Array.isArray(data.items)) {
      return data.items as T[];
    }
    
    return [data] as T[];
  }

  /**
   * Get data from API with consistent response handling
   */
  async getItems<T>(path: string, params: Record<string, string> = {}): Promise<T[]> {
    const data = await this.get<any>(path, params);
    return this.processApiResponse<T>(data);
  }
}

// Create API client instance with base URL from config
export const API = new ApiClient(config.apiUrl);

/**
 * Utility function to ensure UUID is in the correct format
 * Backend expects UUID strings without hyphens or with proper hyphen format
 */
const formatUUID = (id: string): string => {
  // Regular expression to check if string is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  // If it's already a valid UUID, just return it
  if (uuidRegex.test(id)) {
    return id;
  }
  
  // If it's not, ensure it's a valid ID format to prevent attacks
  if (!/^[0-9a-zA-Z_-]+$/.test(id)) {
    throw new Error('Invalid ID format');
  }
  
  // Just return the ID as-is
  return id;
};

// API methods for projects
export const listProjects = async (): Promise<Project[]> => {
  const data = await API.get<Project[]>('/api/projects/');
  return data;
};

// Updated Agent interface to match AgentCard.tsx
export interface Agent extends Omit<Project, 'status'> { // Omit Project's status if AgentCard has its own
  avatar?: string; // Make avatar consistent with AgentCard (optional string)
  status: 'active' | 'paused' | 'training' | 'error'; // Status from AgentCard
  metrics: {
    totalChats: number;
    avgResponseTime: number; // in seconds
    successRate: number; // percentage
  };
  lastActive?: string;
  tags?: string[];
}

export const listAgents = async (): Promise<Agent[]> => {
  const data = await API.get<Agent[]>('/api/projects/');
  return data;
};

export const getProject = async (id: string): Promise<Project> => {
  const data = await API.get<Project>(`/api/projects/${id}/`);
  const parseResult = ProjectSchema.safeParse(data);
  if (!parseResult.success) {
    throw new Error('Invalid project data received from API: ' + JSON.stringify(parseResult.error.issues));
  }
  return parseResult.data;
};

export const createProject = async (data: Partial<Project>): Promise<Project> => {
  return API.post<Project>('/api/projects/', data);
};

export const updateProject = async (id: string, data: Partial<Project>): Promise<Project> => {
  return API.put<Project>(`/api/projects/${id}/`, data);
};

export const deleteProject = async (id: string): Promise<void> => {
  return API.delete<void>(`/api/projects/${id}/`);
};

// API methods for chat sessions
export const listChatSessions = async (projectId: string): Promise<ChatSession[]> => {
  const formattedProjectId = formatUUID(projectId);
  const data = await API.get<ChatSession[]>(`/api/chat/sessions/project/${formattedProjectId}/`);
  const parseResult = z.array(ChatSessionSchema).safeParse(data);
  if (!parseResult.success) {
    throw new Error('Invalid chat session data received from API: ' + JSON.stringify(parseResult.error.issues));
  }
  return parseResult.data;
};

export const getChatSession = async (id: string): Promise<ChatSession> => {
  const data = await API.get<ChatSession>(`/api/chat/sessions/${id}/`);
  const parseResult = ChatSessionSchema.safeParse(data);
  if (!parseResult.success) {
    throw new Error('Invalid chat session data received from API: ' + JSON.stringify(parseResult.error.issues));
  }
  return parseResult.data;
};

export const initChatSession = async (projectId: string, title: string): Promise<ChatSession> => {
  const formattedProjectId = formatUUID(projectId);
  return API.post<ChatSession>('/api/chat/sessions/', { project_id: formattedProjectId, title });
};

export const updateChatSession = async (id: string, data: Partial<ChatSession>): Promise<ChatSession> => {
  const formattedId = formatUUID(id);
  return API.patch<ChatSession>(`/api/chat/sessions/${formattedId}/`, data);
};

export const deleteChatSession = async (id: string): Promise<void> => {
  const formattedId = formatUUID(id);
  return API.delete<void>(`/api/chat/sessions/${formattedId}/`);
};

// API methods for chat messages
export const getChatMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  const formattedSessionId = formatUUID(sessionId);
  const data = await API.getItems<ChatMessage>(`/api/chat/messages/${formattedSessionId}/`);
  const parseResult = z.array(ChatMessageSchema).safeParse(data);
  if (!parseResult.success) {
    throw new Error('Invalid chat message data received from API: ' + JSON.stringify(parseResult.error.issues));
  }
  return parseResult.data;
};

export const sendChatMessage = async (sessionId: string, projectId: string, content: string): Promise<BackendCompletionResponse> => {
  const formattedSessionId = formatUUID(sessionId);
  const formattedProjectId = formatUUID(projectId);
  // This sends the minimal requirement for ChatService to reconstruct history and process
  return API.post<BackendCompletionResponse>(`/api/chat/completions/`, {
    session_id: formattedSessionId,
    project_id: formattedProjectId,
    messages: [{ role: 'user', content }], 
    // stream: false, // Optional: backend defaults or handles this
  });
};

// Function to create a user message - distinct from getting a completion
// This might not be strictly needed if ChatService always creates the user message.
export const createUserChatMessage = async (sessionId: string, content: string, projectId?: string): Promise<ChatMessage> => {
  const formattedSessionId = formatUUID(sessionId);
  return API.post<ChatMessage>(`/api/chat/messages/`, { 
    session_id: formattedSessionId, 
    content, 
    role: 'user',
    project_id: projectId ? formatUUID(projectId) : undefined
  });
};

// API methods for documents
export const listDocuments = async (projectId: string): Promise<Document[]> => {
  const formattedProjectId = formatUUID(projectId);
  const data = await API.getItems<Document>(`/api/doc/${formattedProjectId}/list/`);
  const parseResult = z.array(DocumentSchema).safeParse(data);
  if (!parseResult.success) {
    throw new Error('Invalid document data received from API: ' + JSON.stringify(parseResult.error.issues));
  }
  return parseResult.data;
};

export const getDocument = async (id: string): Promise<Document> => {
  const data = await API.get<Document>(`/api/doc/${id}/`);
  const parseResult = DocumentSchema.safeParse(data);
  if (!parseResult.success) {
    throw new Error('Invalid document data received from API: ' + JSON.stringify(parseResult.error.issues));
  }
  return parseResult.data;
};

export const getDocumentUploadUrl = async (
  projectId: string,
  fileName: string,
  fileType: string
): Promise<{ upload_url: string; document_id: string }> => {
  const formattedProjectId = formatUUID(projectId);
  return API.post<{ upload_url: string; document_id: string }>(
    '/api/documents/upload-url/',
    { project_id: formattedProjectId, file_name: fileName, file_type: fileType }
  );
};

export const completeDocumentUpload = async (
  documentId: string,
  name: string,
  description?: string
): Promise<Document> => {
  return API.post<Document>(
    `/api/documents/${documentId}/complete-upload/`,
    { name, description }
  );
};

export const uploadDocument = async (
  projectId: string,
  file: File,
  metadata?: Record<string, any>
): Promise<Document> => {
  try {
    // The backend expects a multipart form upload to /api/doc/upload-complete
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);
    
    if (metadata?.name) {
      formData.append('file_name', metadata.name);
    } else {
      formData.append('file_name', file.name);
    }

    // Create authentication headers manually
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${config.apiUrl}/api/doc/upload-complete`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      let errorData: any = {};
      
      try {
        errorData = await response.json();
        console.error("Document upload error:", errorData);
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        console.error('Failed to parse error response JSON:', e);
      }
      
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
    }
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    // Add a specific message for document upload errors
    if (error.status === 404) {
      console.error('Document upload endpoint not found. The document upload feature may not be implemented yet.');
      const enhancedError = new Error('Document upload feature is not available yet');
      (enhancedError as any).status = 404;
      throw enhancedError;
    }
    throw error;
  }
};

export const deleteDocument = async (id: string): Promise<void> => {
  return API.delete<void>(`/api/doc/${id}/`);
};

// Export the API client instance
export default API; 