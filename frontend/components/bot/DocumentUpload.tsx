'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../contexts/AuthContext';
// Import API when needed in production mode
// import API from '../../utils/api';

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
  file?: File;
}

interface DocumentUploadProps {
  onSubmit: (documents: Document[]) => void;
  onBack: () => void;
  projectId: string;
}

export default function DocumentUpload({ onSubmit, onBack, projectId }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { session } = useAuth();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Validate file types and sizes
    const validFiles = acceptedFiles.filter(file => {
      const isValidType = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    const invalidFiles = acceptedFiles.filter(file => !validFiles.includes(file));
    
    // Add valid files to documents state
    const newDocuments = validFiles.map(file => ({
      id: `file-${Date.now()}-${file.name}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 0,
      file: file,
    }));
    
    setDocuments(prev => [...prev, ...newDocuments]);
    
    // Upload each file
    validFiles.forEach((file, index) => {
      uploadFile(newDocuments[index].id, file);
    });
    
    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      alert(`${invalidFiles.length} file(s) were not uploaded. Files must be PDF, DOCX, or TXT and less than 5MB.`);
    }
  }, [projectId, session]);

  const uploadFile = async (fileId: string, file: File) => {
    if (!session?.access_token) {
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === fileId 
            ? { ...doc, status: 'error' as const, error: 'Authentication required' } 
            : doc
        )
      );
      return;
    }

    setIsUploading(true);
    
    // DEVELOPMENT MODE: Simulate upload without actual API calls
    try {
      // Update progress to 10%
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === fileId 
            ? { ...doc, progress: 10, status: 'uploading' as const } 
            : doc
        )
      );
      
      // Wait a bit to simulate getting upload URL
      await new Promise(r => setTimeout(r, 500));
      
      // Update progress to 40%
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === fileId 
            ? { ...doc, progress: 40, status: 'uploading' as const } 
            : doc
        )
      );
      
      // Wait a bit to simulate upload
      await new Promise(r => setTimeout(r, 700));
      
      // Update progress to 70%
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === fileId 
            ? { ...doc, progress: 70, status: 'uploading' as const } 
            : doc
        )
      );
      
      // Wait a bit more to simulate confirmation
      await new Promise(r => setTimeout(r, 500));
      
      // Update with success status and mock document ID
      const mockDocId = `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === fileId 
            ? { 
                ...doc, 
                progress: 100, 
                status: 'success' as const,
                id: mockDocId // Update with simulated ID
              } 
            : doc
        )
      );
      
      console.log(`Development mode: Simulated upload of file ${file.name} complete`);
      
      /* PRODUCTION MODE: Uncomment this code for real API usage
      // Step 1: Get presigned URL from our backend
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === fileId 
            ? { ...doc, progress: 10, status: 'uploading' as const } 
            : doc
        )
      );
      
      const uploadUrlData = await API.getDocumentUploadUrl(
        file, 
        projectId, 
        session.access_token
      );
      
      // Step 2: Upload file to Supabase Storage using the presigned URL
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === fileId 
            ? { ...doc, progress: 40, status: 'uploading' as const } 
            : doc
        )
      );
      
      await API.uploadDocumentToSignedUrl(file, uploadUrlData.presigned_url);
      
      // Step 3: Confirm upload in our backend
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === fileId 
            ? { ...doc, progress: 70, status: 'uploading' as const } 
            : doc
        )
      );
      
      const confirmedDoc = await API.confirmDocumentUpload(
        file.name,
        uploadUrlData.file_key,
        projectId,
        session.access_token
      );
      
      // Update document with success status and real document ID
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === fileId 
            ? { 
                ...doc, 
                progress: 100, 
                status: 'success' as const,
                id: confirmedDoc.id // Update with real ID from backend
              } 
            : doc
        )
      );
      */
    } catch (error) {
      console.error(`Error uploading file: ${file.name}`, error);
      
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === fileId 
            ? { 
                ...doc, 
                status: 'error' as const, 
                error: error instanceof Error ? error.message : 'Upload failed'
              } 
            : doc
        )
      );
    } finally {
      // Check if all files have completed upload
      setDocuments(prev => {
        const allCompleted = prev.every(doc => doc.status !== 'uploading');
        if (allCompleted) {
          setIsUploading(false);
        }
        return prev;
      });
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  // Added function to handle browse button click
  const handleBrowseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeDocument = (id: string) => {
    // In development mode, just remove from local state
    // In production, need to delete from server too
    
    /*
    // If document has already been uploaded to the server and has a real ID,
    // try to delete it from the server too
    const doc = documents.find(d => d.id === id);
    if (doc && doc.status === 'success' && session?.access_token) {
      // This is a server-side document, delete it from API
      API.deleteDocument(id, session.access_token)
        .catch(err => console.error('Failed to delete document from server:', err));
    }
    */
    
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const handleSubmit = () => {
    // Filter only successfully uploaded documents
    const successfulDocs = documents.filter(doc => doc.status === 'success');
    onSubmit(successfulDocs);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-gray-900">Upload Documents</h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload PDF, DOCX, or TXT files (max 5MB each) that your AI assistant will use to answer questions.
        </p>
      </div>

      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="mt-3 text-sm text-gray-600">
          Drag and drop files here, or{' '}
          <span 
            onClick={handleBrowseClick} 
            className="text-blue-600 font-medium cursor-pointer hover:underline"
          >
            browse
          </span>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Supported formats: PDF, DOCX, TXT (Max 5MB)
        </p>
      </div>

      {documents.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Uploaded Documents</h3>
          <ul className="space-y-3">
            {documents.map((doc) => (
              <li key={doc.id} className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate max-w-xs">{doc.name}</span>
                  <button 
                    onClick={() => removeDocument(doc.id)}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={isUploading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <span>{formatFileSize(doc.size)}</span>
                  {doc.status === 'uploading' && (
                    <span className="ml-2 text-blue-600">Uploading... {doc.progress}%</span>
                  )}
                  {doc.status === 'success' && (
                    <span className="ml-2 text-green-600">Upload complete</span>
                  )}
                  {doc.status === 'error' && (
                    <span className="ml-2 text-red-600">{doc.error || 'Upload failed'}</span>
                  )}
                </div>
                {doc.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full" 
                      style={{ width: `${doc.progress}%` }}
                    ></div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={documents.length === 0 || isUploading || !documents.some(doc => doc.status === 'success')}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Preview
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
} 