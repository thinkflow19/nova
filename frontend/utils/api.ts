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
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getAuthToken();
  // console.log(`API Request to ${endpoint} - Token available: ${!!token}`); // Removed for security
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options?.headers,
  };

  // console.log(`Making API request to: ${url}`, { ... }); // Removed for security
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // console.log(`API Response from ${endpoint}: status=${response.status}`); // Removed for security

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      let errorDetails: unknown = null; // Use unknown for better type safety
      
      try {
        // Attempt to parse JSON error response from backend
        const errorData = await response.json();
        // Type guard to check if errorData is an object with a detail property
        if (typeof errorData === 'object' && errorData !== null && 'detail' in errorData) {
           errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData);
        } else {
           errorMessage = JSON.stringify(errorData) || errorMessage;
        }
        errorDetails = errorData;
      } catch (jsonParsingError) { // Renamed variable
        console.warn("Could not parse error response as JSON.", jsonParsingError);
      }
      
      console.error(`API Request Failed [${endpoint}]: ${errorMessage}`);
      // Throw a custom error object with more context
      const error = new Error(errorMessage);
      // Attach status and details using type assertion or a custom error class
      (error as Error & { status?: number; details?: unknown }).status = response.status;
      (error as Error & { status?: number; details?: unknown }).details = errorDetails;
      throw error;
    }

    // Handle responses with no content (e.g., 204 No Content)
    if (response.status === 204) {
      return null;
    }

    // Attempt to parse successful JSON response
    try {
      return await response.json();
    } catch (jsonParsingError) { // Renamed variable
      console.error(`API Request Succeeded but failed to parse JSON response [${endpoint}]:`, jsonParsingError);
      throw new Error("Received invalid JSON response from server.");
    }
  } catch (error) {
    // Catch fetch errors (network issues, etc.) and re-throw
    console.error(`API Request Failed [${endpoint}]:`, error);
    // Ensure it's always an Error object being thrown
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown network or API error occurred.');
    }
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