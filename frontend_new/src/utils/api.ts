import config from './config';
import type { Project, ChatSession, ChatMessage, Document, ApiResponse } from '../types';

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
const RETRYABLE_ERROR_CODES = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH'];

// Global state to track backend connectivity
let isBackendConnected = true;
let lastConnectivityCheck = 0;
const CONNECTIVITY_CHECK_INTERVAL = 30000; // Check every 30 seconds at most

/**
 * Base API client for making requests to the backend
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.apiUrl;
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  /**
   * Build headers for API requests
   */
  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
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
      let errorData: any = {};
      
      try {
        errorData = await response.json();
        console.error("Detailed API Error Data (from api.ts handleResponse):", errorData); // Enhanced log
        // FastAPI often puts detailed validation errors in errorData.detail
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) { // Pydantic validation errors can be an array
            errorMessage = errorData.detail.map((err: any) => `Field: ${err.loc?.join('.') || 'unknown'}, Message: ${err.msg} (${err.type})`).join('; ');
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
      
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).data = errorData; // Attach full error data as well
      throw error;
    }

    // Check for empty response (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    try {
      // Parse JSON response
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Invalid JSON response from server');
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
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: this.getHeaders(),
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
        // Check connectivity before making request
        if (retries > 0 && !await this.checkBackendConnectivity()) {
          throw new Error('Backend server is not reachable');
        }
        
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

        return await this.handleResponse<T>(response);
      } catch (error: any) {
        const status = error.status;
        const errorCode = error.code;
        
        // Check if we should retry
        if (retries < MAX_RETRIES && this.shouldRetry(status, errorCode)) {
          retries++;
          // Exponential backoff with jitter
          const delay = RETRY_DELAY_MS * Math.pow(2, retries) + Math.random() * 100;
          console.log(`Retrying GET request to ${path} (attempt ${retries}/${MAX_RETRIES}) after ${delay}ms`);
          await this.wait(delay);
          continue;
        }
        
        // If we shouldn't retry or exceeded max retries, rethrow the error
        console.error(`GET ${path} failed after ${retries} retries:`, error);
      throw error;
    }
    }
    
    // This should never happen due to the while loop condition
    throw new Error(`Failed to complete request after ${MAX_RETRIES} retries`);
  }

  /**
   * Make a POST request to the API with retry logic
   */
  async post<T>(path: string, data?: any): Promise<T> {
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
    try {
        // Check connectivity before making request
        if (retries > 0 && !await this.checkBackendConnectivity()) {
          throw new Error('Backend server is not reachable');
        }
        
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

        return await this.handleResponse<T>(response);
      } catch (error: any) {
        const status = error.status;
        const errorCode = error.code;
        
        // Only retry idempotent requests or on connection errors
        if (retries < MAX_RETRIES && this.shouldRetry(status, errorCode)) {
          retries++;
          // Exponential backoff with jitter
          const delay = RETRY_DELAY_MS * Math.pow(2, retries) + Math.random() * 100;
          console.log(`Retrying POST request to ${path} (attempt ${retries}/${MAX_RETRIES}) after ${delay}ms`);
          await this.wait(delay);
          continue;
        }
        
        console.error(`POST ${path} failed after ${retries} retries:`, error);
      throw error;
    }
    }
    
    throw new Error(`Failed to complete request after ${MAX_RETRIES} retries`);
  }

  /**
   * Make a PUT request to the API with retry logic
   */
  async put<T>(path: string, data?: any): Promise<T> {
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
    try {
        // Check connectivity before making request
        if (retries > 0 && !await this.checkBackendConnectivity()) {
          throw new Error('Backend server is not reachable');
        }
        
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

        return await this.handleResponse<T>(response);
      } catch (error: any) {
        const status = error.status;
        const errorCode = error.code;
        
        // Only retry idempotent requests or on connection errors
        if (retries < MAX_RETRIES && this.shouldRetry(status, errorCode)) {
          retries++;
          // Exponential backoff with jitter
          const delay = RETRY_DELAY_MS * Math.pow(2, retries) + Math.random() * 100;
          console.log(`Retrying PUT request to ${path} (attempt ${retries}/${MAX_RETRIES}) after ${delay}ms`);
          await this.wait(delay);
          continue;
        }
        
        console.error(`PUT ${path} failed after ${retries} retries:`, error);
      throw error;
    }
    }
    
    throw new Error(`Failed to complete request after ${MAX_RETRIES} retries`);
  }

  /**
   * Make a PATCH request to the API with retry logic
   */
  async patch<T>(path: string, data?: any): Promise<T> {
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
    try {
        // Check connectivity before making request
        if (retries > 0 && !await this.checkBackendConnectivity()) {
          throw new Error('Backend server is not reachable');
        }
        
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

        return await this.handleResponse<T>(response);
      } catch (error: any) {
        const status = error.status;
        const errorCode = error.code;
        
        // Check if we should retry
        if (retries < MAX_RETRIES && this.shouldRetry(status, errorCode)) {
          retries++;
          // Exponential backoff with jitter
          const delay = RETRY_DELAY_MS * Math.pow(2, retries) + Math.random() * 100;
          console.log(`Retrying PATCH request to ${path} (attempt ${retries}/${MAX_RETRIES}) after ${delay}ms`);
          await this.wait(delay);
          continue;
        }
        
        console.error(`PATCH ${path} failed after ${retries} retries:`, error);
      throw error;
    }
    }
    
    throw new Error(`Failed to complete request after ${MAX_RETRIES} retries`);
  }

  /**
   * Make a DELETE request to the API with retry logic
   */
  async delete<T>(path: string): Promise<T> {
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
    try {
        // Check connectivity before making request
        if (retries > 0 && !await this.checkBackendConnectivity()) {
          throw new Error('Backend server is not reachable');
        }
        
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

        return await this.handleResponse<T>(response);
      } catch (error: any) {
        const status = error.status;
        const errorCode = error.code;
        
        // Check if we should retry
        if (retries < MAX_RETRIES && this.shouldRetry(status, errorCode)) {
          retries++;
          // Exponential backoff with jitter
          const delay = RETRY_DELAY_MS * Math.pow(2, retries) + Math.random() * 100;
          console.log(`Retrying DELETE request to ${path} (attempt ${retries}/${MAX_RETRIES}) after ${delay}ms`);
          await this.wait(delay);
          continue;
        }
        
        console.error(`DELETE ${path} failed after ${retries} retries:`, error);
      throw error;
    }
    }
    
    throw new Error(`Failed to complete request after ${MAX_RETRIES} retries`);
  }

  /**
   * Upload a file to the API with retry logic
   */
  async uploadFile<T>(path: string, file: File, metadata?: Record<string, any>): Promise<T> {
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
    try {
        // Check connectivity before making request
        if (retries > 0 && !await this.checkBackendConnectivity()) {
          throw new Error('Backend server is not reachable');
        }
        
      const formData = new FormData();
      formData.append('file', file);
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      // Don't include Content-Type when using FormData
      // The browser will set it automatically with the proper boundary
      const headers = this.getHeaders({});
      delete headers['Content-Type'];

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: formData,
      });

        return await this.handleResponse<T>(response);
      } catch (error: any) {
        const status = error.status;
        const errorCode = error.code;
        
        // Only retry on connection errors for file uploads
        if (retries < MAX_RETRIES && this.shouldRetry(status, errorCode)) {
          retries++;
          // Exponential backoff with jitter
          const delay = RETRY_DELAY_MS * Math.pow(2, retries) + Math.random() * 100;
          console.log(`Retrying file upload to ${path} (attempt ${retries}/${MAX_RETRIES}) after ${delay}ms`);
          await this.wait(delay);
          continue;
        }
        
        console.error(`File upload to ${path} failed after ${retries} retries:`, error);
      throw error;
      }
    }
    
    throw new Error(`Failed to complete request after ${MAX_RETRIES} retries`);
  }

  /**
   * Process API response data to handle both array and items property formats
   */
  private processApiResponse<T>(data: any): T[] {
    // Check if the response has an items property or is the array itself
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.items)) {
      return data.items;
    } else if (data && Array.isArray(data.data)) { // Add check for data property containing an array
      return data.data;
    } else {
      console.warn('Unexpected API response format in processApiResponse:', data);
      return [];
    }
  }

  /**
   * Get data from API with consistent response handling
   */
  async getItems<T>(path: string, params: Record<string, string> = {}): Promise<T[]> {
    const data = await this.get<any>(path, params);
    return this.processApiResponse<T>(data);
  }
}

// Create a singleton instance
const apiClient = new ApiClient();

/**
 * Utility function to ensure UUID is in the correct format
 * Backend expects UUID strings without hyphens or with proper hyphen format
 */
const formatUUID = (id: string): string => {
  // Return as is if it's null, undefined or empty
  if (!id) return id;
  
  // Remove any non-alphanumeric characters
  const cleanId = id.replace(/[^a-zA-Z0-9]/g, '');
  
  // If it's already formatted without hyphens, return it
  if (/^[0-9a-fA-F]{32}$/.test(cleanId)) {
    return cleanId;
  }
  
  // If it's a UUID with hyphens, return it formatted properly
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
    return id;
  }
  
  // Try to format it as a UUID with hyphens
  if (cleanId.length === 32) {
    return `${cleanId.slice(0, 8)}-${cleanId.slice(8, 12)}-${cleanId.slice(12, 16)}-${cleanId.slice(16, 20)}-${cleanId.slice(20)}`;
  }
  
  // Return as is if we can't format it
  return id;
};

// API methods for projects
export const listProjects = async (): Promise<Project[]> => {
  return apiClient.getItems<Project>('/api/projects');
};

export const getProject = async (id: string): Promise<Project> => {
  return apiClient.get<Project>(`/api/projects/${id}`);
};

export const createProject = async (data: Partial<Project>): Promise<Project> => {
  return apiClient.post<Project>('/api/projects', data);
};

export const updateProject = async (id: string, data: Partial<Project>): Promise<Project> => {
  return apiClient.put<Project>(`/api/projects/${id}`, data);
};

export const deleteProject = async (id: string): Promise<void> => {
  return apiClient.delete<void>(`/api/projects/${id}`);
};

// API methods for chat sessions
export const listChatSessions = async (projectId: string): Promise<ChatSession[]> => {
  const formattedProjectId = formatUUID(projectId);
  return apiClient.getItems<ChatSession>(`/api/chat/sessions/project/${formattedProjectId}`);
};

export const getChatSession = async (id: string): Promise<ChatSession> => {
  const formattedId = formatUUID(id);
  return apiClient.get<ChatSession>(`/api/chat/sessions/${formattedId}`);
};

export const initChatSession = async (projectId: string, title: string): Promise<ChatSession> => {
  const formattedProjectId = formatUUID(projectId);
  return apiClient.post<ChatSession>('/api/chat/sessions', { project_id: formattedProjectId, title });
};

export const updateChatSession = async (id: string, data: Partial<ChatSession>): Promise<ChatSession> => {
  const formattedId = formatUUID(id);
  return apiClient.patch<ChatSession>(`/api/chat/sessions/${formattedId}`, data);
};

export const deleteChatSession = async (id: string): Promise<void> => {
  const formattedId = formatUUID(id);
  return apiClient.delete<void>(`/api/chat/sessions/${formattedId}`);
};

// API methods for chat messages
export const getChatMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  const formattedSessionId = formatUUID(sessionId);
  return apiClient.getItems<ChatMessage>(`/api/chat/messages/${formattedSessionId}`);
};

export const sendChatMessage = async (sessionId: string, projectId: string, content: string): Promise<BackendCompletionResponse> => {
  const formattedSessionId = formatUUID(sessionId);
  const formattedProjectId = formatUUID(projectId);
  // This sends the minimal requirement for ChatService to reconstruct history and process
  return apiClient.post<BackendCompletionResponse>(`/api/chat/completions`, {
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
  return apiClient.post<ChatMessage>(`/api/chat/messages`, { 
    session_id: formattedSessionId, 
    content, 
    role: 'user',
    project_id: projectId ? formatUUID(projectId) : undefined
  });
};

// API methods for documents
export const listDocuments = async (projectId: string): Promise<Document[]> => {
  const formattedProjectId = formatUUID(projectId);
  console.log('Fetching documents for project:', formattedProjectId);
  try {
    const documents = await apiClient.getItems<Document>(`/api/documents/project/${formattedProjectId}`);
    console.log('Documents fetched successfully:', documents);
    return documents;
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    
    // Handle specific error types
    if (error.status === 404) {
      console.warn('Document API endpoint not found. The document feature might not be implemented yet.');
      // Return empty array but with a specific error that can be detected
      const emptyResult: Document[] = [];
      (emptyResult as any).errorStatus = 404;
      (emptyResult as any).errorMessage = 'Document storage not available';
      return emptyResult;
    }
    
    // Return empty array instead of failing completely
    return [];
  }
};

export const getDocument = async (id: string): Promise<Document> => {
  return apiClient.get<Document>(`/api/documents/${id}`);
};

export const getDocumentUploadUrl = async (
  projectId: string,
  fileName: string,
  fileType: string
): Promise<{ upload_url: string; document_id: string }> => {
  const formattedProjectId = formatUUID(projectId);
  return apiClient.post<{ upload_url: string; document_id: string }>(
    '/api/documents/upload-url',
    { project_id: formattedProjectId, file_name: fileName, file_type: fileType }
  );
};

export const completeDocumentUpload = async (
  documentId: string,
  name: string,
  description?: string
): Promise<Document> => {
  return apiClient.post<Document>(
    `/api/documents/${documentId}/complete-upload`,
    { name, description }
  );
};

export const uploadDocument = async (
  projectId: string,
  file: File,
  metadata?: Record<string, any>
): Promise<Document> => {
  try {
    const data = {
      project_id: projectId,
      ...metadata
    };
    return await apiClient.uploadFile<Document>('/api/documents/upload', file, data);
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
  return apiClient.delete<void>(`/api/documents/${id}`);
};

// Create alias for API methods
export const API = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  listChatSessions,
  getChatSession,
  initChatSession,
  updateChatSession,
  deleteChatSession,
  getChatMessages,
  sendChatMessage,
  createUserChatMessage,
  listDocuments,
  getDocument,
  getDocumentUploadUrl,
  completeDocumentUpload,
  uploadDocument,
  deleteDocument
};

export default apiClient; 