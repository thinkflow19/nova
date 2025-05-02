const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  try {
    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    // Get auth token from localStorage
    const token = getAuthToken();
    console.log(`API Request to ${endpoint} - Token available: ${!!token}`);
    
    // Prepare headers with auth token if available
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options?.headers,
    };

    // Log detailed request information for debugging
    console.log(`Making API request to: ${url}`, { 
      method: options?.method || 'GET',
      hasAuthHeader: !!token,
      authHeaderValue: token ? `Bearer ${token.substring(0, 10)}...` : 'none',
      headers: JSON.stringify(headers)
    });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Log the response status for debugging
    console.log(`API Response from ${endpoint}: status=${response.status}`);

    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // If JSON parsing fails, use the status text
        errorMessage = `${response.statusText || errorMessage}`;
      }
      
      console.error(`API request failed: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // For responses with no content
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
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
  }) => {
    return fetchAPI('/api/projects', { 
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },
  
  updateProject: (projectData: {
    id: string;
    project_name?: string;
    branding_color?: string;
    tone?: string;
    status?: string;
  }) => {
    return fetchAPI(`/api/project/${projectData.id}/update`, {
      method: 'PUT',
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