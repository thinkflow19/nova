import config from '../config/config'; // Import centralized config

// Use API URL from config
const API_URL = config.apiUrl;

/**
 * Gets auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('authToken');
  console.log('Auth token retrieved from localStorage:', token ? `${token.substring(0, 10)}...` : 'null');
  return token;
}

/**
 * Makes a fetch request to the API with proper error handling
 */
export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }), // Add auth header if token exists
    ...(options?.headers),
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json(); // Try to parse JSON error response
      } catch (e) {
        errorData = { detail: response.statusText }; // Fallback to status text
      }
      console.error('API Error:', errorData);
      // Throw an error object that includes status and details if possible
      const error = new Error(errorData.detail || `API request failed with status ${response.status}`) as any;
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    // Handle responses with no content (e.g., 204 No Content)
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Fetch API error for endpoint ${endpoint}:`, error);
    // Re-throw the error so calling components can handle it
    throw error;
  }
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
  listProjects: () => {
    return fetchAPI('/api/projects');
  },
  
  createProject: (projectData: {
    name: string;
    description?: string;
    is_public?: boolean;
    color?: string;
    icon?: string;
    ai_model_config?: Record<string, unknown>;
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
    ai_model_config?: Record<string, unknown>;
    memory_type?: string;
    tags?: string[];
  }) => {
    return fetchAPI(`/api/projects/${projectData.id}`, {
      method: 'PATCH',
      body: JSON.stringify(projectData),
    });
  },

  // Documents
  getDocumentUploadUrl: (file: File, projectId: string) => {
    const formData = new FormData();
    formData.append('file_name', file.name);
    formData.append('content_type', file.type);
    formData.append('project_id', projectId);
    
    // Don't specify Content-Type with FormData, browser will set it with boundary
    return fetchAPI('/api/doc/upload', {
      method: 'POST',
      body: formData,
    });
  },
  
  uploadDocumentToSignedUrl: async (file: File, presignedUrl: string) => {
    try {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  },
  
  confirmDocumentUpload: (fileName: string, fileKey: string, projectId: string) => {
    return fetchAPI('/api/doc/confirm', {
      method: 'POST',
      body: JSON.stringify({
        file_name: fileName,
        file_key: fileKey,
        project_id: projectId,
      }),
    });
  },
  
  listProjectDocuments: (projectId: string) => {
    return fetchAPI(`/api/doc/${projectId}/list`);
  },
  
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
  chat: (projectId: string, message: string) => {
    return fetchAPI(`/api/chat/${projectId}`, {
      method: 'POST',
      body: JSON.stringify({ message: message }),
    });
  },
};

export default API; 