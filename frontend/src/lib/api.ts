import { 
  User, 
  Project, 
  ChatSession, 
  ChatMessage, 
  AuthTokens,
  LoginForm,
  SignupForm,
  ProjectCreate,
  ProjectUpdate,
  ChatSessionCreate,
  ChatMessageCreate,
  ApiResponse,
  PaginatedResponse
} from '@/types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api';

// Auth token management
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'nova_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'nova_refresh_token';
  private static readonly USER_KEY = 'nova_user';

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static setAccessToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    }
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }
  }

  static getUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const user = localStorage.getItem(this.USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  static setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  static clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  static setTokens(tokens: AuthTokens): void {
    this.setAccessToken(tokens.access_token);
    if (tokens.refresh_token) {
      this.setRefreshToken(tokens.refresh_token);
    }
  }
}

// HTTP Client with automatic token handling
class ApiClient {
  private baseURL: string;
  private refreshingPromise: Promise<boolean> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${API_PREFIX}${endpoint}`;
    const token = TokenManager.getAccessToken();

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      let response = await fetch(url, config);

      // Handle 401 errors with token refresh
      if (response.status === 401 && token) {
        const refreshSuccessful = await this.refreshToken();
        
        if (refreshSuccessful) {
          // Retry the request with new token
          const newToken = TokenManager.getAccessToken();
          const retryConfig: RequestInit = {
            ...config,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${newToken}`,
            },
          };
          response = await fetch(url, retryConfig);
        } else {
          // Refresh failed, clear tokens and throw error
          TokenManager.clearTokens();
          throw new Error('Authentication failed');
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.detail || errorMessage;
      } catch {
        // Use default error message if JSON parsing fails
      }
      
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  private async refreshToken(): Promise<boolean> {
    // Prevent multiple concurrent refresh attempts
    if (this.refreshingPromise) {
      return this.refreshingPromise;
    }

    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    this.refreshingPromise = this.performTokenRefresh(refreshToken);
    
    try {
      const result = await this.refreshingPromise;
      return result;
    } finally {
      this.refreshingPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const tokens: AuthTokens = await response.json();
        TokenManager.setTokens(tokens);
        return true;
      } else {
        console.warn('Token refresh failed:', response.status, response.statusText);
        TokenManager.clearTokens();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      TokenManager.clearTokens();
      return false;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL);

// Authentication API
export const authApi = {
  async login(credentials: LoginForm): Promise<AuthTokens> {
    const response = await apiClient.post<AuthTokens>('/auth/signin', credentials);
    TokenManager.setTokens(response);
    
    // Get user profile after successful login
    const user = await this.getCurrentUser();
    TokenManager.setUser(user);
    
    return response;
  },

  async signup(userData: SignupForm): Promise<{ id: string; email: string; message: string }> {
    return apiClient.post('/auth/signup', userData);
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/signout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      TokenManager.clearTokens();
    }
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.patch<User>('/auth/me', data);
  },

  async resetPassword(email: string): Promise<{ message: string }> {
    return apiClient.post('/auth/reset-password', { email });
  },

  isAuthenticated(): boolean {
    return !!TokenManager.getAccessToken();
  },

  getStoredUser(): User | null {
    return TokenManager.getUser();
  },
};

// Projects API
export const projectsApi = {
  async getProjects(page = 1, limit = 20): Promise<PaginatedResponse<Project>> {
    return apiClient.get<PaginatedResponse<Project>>(`/projects?limit=${limit}&offset=${(page - 1) * limit}`);
  },

  async getProject(id: string): Promise<Project> {
    return apiClient.get<Project>(`/projects/${id}`);
  },

  async createProject(data: ProjectCreate): Promise<Project> {
    return apiClient.post<Project>('/projects', data);
  },

  async updateProject(id: string, data: ProjectUpdate): Promise<Project> {
    return apiClient.patch<Project>(`/projects/${id}`, data);
  },

  async deleteProject(id: string): Promise<void> {
    return apiClient.delete(`/projects/${id}`);
  },

  async duplicateProject(id: string): Promise<Project> {
    return apiClient.post<Project>(`/projects/${id}/duplicate`);
  },
};

// Documents API
export const documentsApi = {
  async generateUploadUrl(data: {
    file_name: string;
    content_type: string;
    project_id: string;
  }): Promise<{
    presigned_url: string;
    file_key: string;
    bucket: string;
    document_id: string;
    expires_in: number;
  }> {
    return apiClient.post('/doc/upload', data);
  },

  async confirmUpload(data: {
    file_name: string;
    file_key: string;
    project_id: string;
    bucket: string;
    content_type: string;
    file_size?: number;
  }): Promise<any> {
    return apiClient.post('/doc/confirm', data);
  },

  async uploadComplete(file: File, projectId: string, fileName?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);
    if (fileName) {
      formData.append('file_name', fileName);
    }

    const token = TokenManager.getAccessToken();
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/doc/upload-complete`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  async listDocuments(projectId: string, limit = 100, offset = 0): Promise<any[]> {
    return apiClient.get(`/doc/${projectId}/list?limit=${limit}&offset=${offset}`);
  },

  async getDocument(documentId: string): Promise<any> {
    return apiClient.get(`/doc/${documentId}`);
  },

  async deleteDocument(documentId: string): Promise<any> {
    return apiClient.delete(`/doc/${documentId}`);
  },
};

// Chat API
export const chatApi = {
  async getSessions(projectId: string): Promise<ChatSession[]> {
    return apiClient.get<ChatSession[]>(`/chat/sessions/project/${projectId}`);
  },

  async createSession(data: ChatSessionCreate): Promise<ChatSession> {
    return apiClient.post<ChatSession>('/chat/sessions', data);
  },

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    return apiClient.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`);
  },

  async sendMessage(data: ChatMessageCreate): Promise<ChatMessage> {
    return apiClient.post<ChatMessage>('/chat/messages', data);
  },

  async deleteMessage(messageId: string): Promise<void> {
    return apiClient.delete(`/chat/messages/${messageId}`);
  },

  async updateMessage(messageId: string, data: Partial<ChatMessage>): Promise<ChatMessage> {
    return apiClient.patch<ChatMessage>(`/chat/messages/${messageId}`, data);
  },

  // Streaming chat completion
  async streamCompletion(
    messages: ChatMessage[],
    sessionId: string,
    projectId: string,
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const token = TokenManager.getAccessToken();
    
    try {
      const response = await fetch(`${API_BASE_URL}${API_PREFIX}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          messages,
          session_id: sessionId,
          project_id: projectId,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === '') continue;
            
            if (trimmedLine.startsWith('data: ')) {
              const data = trimmedLine.substring(6);
              
              if (data === '[DONE]') {
                onComplete(fullResponse);
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullResponse += content;
                  onChunk(content);
                }
              } catch (e) {
                console.warn('Failed to parse SSE data:', data);
              }
            }
          }
        }
        
        onComplete(fullResponse);
      } catch (error) {
        onError(new Error('Stream reading failed'));
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  },
};

// Health check API
export const healthApi = {
  async check(): Promise<{ status: string; timestamp: string }> {
    return apiClient.get('/health');
  },
};

// Export the token manager for use in components
export { TokenManager };

// Default export
export default {
  auth: authApi,
  projects: projectsApi,
  chat: chatApi,
  documents: documentsApi,
  health: healthApi,
}; 