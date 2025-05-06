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
  if (!token) {
    throw new Error('Authentication token not found. Please log in again.');
  }

  // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
  const isFormData = options?.body instanceof FormData;
  
  const headers = {
    // Only set Content-Type for JSON requests, not FormData
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    'Authorization': `Bearer ${token}`,
    ...(options?.headers),
  };

  try {
    console.log(`Making API request to ${endpoint}`);
    console.log('Request options:', {
      method: options?.method,
      isFormData,
      body: isFormData ? 'FormData instance' : options?.body,
    });
    
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
    console.log(`API response from ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
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
  
  uploadDocumentToSignedUrl: async (file: File, uploadData: any) => {
    try {
      console.log('Upload data received:', uploadData);
      
      // For backward compatibility, handle both new and old formats
      const uploadType = uploadData.uploadType || 'direct';
      
      // If we have presigned_url in old format, use that
      if (uploadData.presigned_url) {
        console.log('Using presigned_url from old format');
        try {
          const response = await fetch(uploadData.presigned_url, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          });
          
          if (!response.ok) {
            console.error('Upload failed with status:', response.status, response.statusText);
            try {
              const errorText = await response.text();
              console.error('Error response:', errorText);
            } catch (e) {
              // Ignore error reading response body
            }
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
          }
          
          return true;
        } catch (error) {
          console.error('Error with presigned URL upload:', error);
          throw error;
        }
      }
      
      // New format handling
      const url = uploadData.url;
      
      if (!url) {
        console.error('Missing URL in upload data:', uploadData);
        
        // Fall back to direct upload if we have bucket and file_key
        if (uploadData.bucket && uploadData.file_key) {
          console.log('Attempting fallback to direct upload using bucket and file_key');
          // We don't have the infrastructure to do direct uploads without a token
          // Just return true and let the confirmation step handle it
          return true;
        }
        
        throw new Error('Missing URL in upload data');
      }
      
      console.log(`Uploading file to URL: ${url} using ${uploadType} method`);
      
      let response;
      
      try {
        if (uploadType === 'tokenAuth') {
          // Token-based Supabase upload (newer version)
          console.log('Using token-based Supabase upload');
          const token = uploadData.token;
          
          if (!token) {
            throw new Error('Missing token for token-based upload');
          }
          
          // For token-based uploads, the URL includes the path
          console.log('Token-based upload with token:', token);
          response = await fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type,
              'Authorization': `Bearer ${token}`,
              'x-upsert': 'false'
            },
            body: file
          });
        } else {
          // Standard presigned URL upload
          console.log('Using standard presigned URL upload');
          response = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          });
        }
        
        if (!response.ok) {
          console.error('Upload failed with status:', response.status, response.statusText);
          try {
            const errorText = await response.text();
            console.error('Error response:', errorText);
          } catch (e) {
            // Ignore error reading response body
          }
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
        
        return true;
      } catch (fetchError) {
        console.error('Fetch error during upload:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  },
  
  confirmDocumentUpload: (fileName: string, fileKey: string, projectId: string) => {
    console.log(`Confirming upload - fileName: ${fileName}, fileKey: ${fileKey}, projectId: ${projectId}`);
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