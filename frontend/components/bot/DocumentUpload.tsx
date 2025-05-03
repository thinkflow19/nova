'use client';

import { useState, useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { useAuth } from '../../contexts/AuthContext';
import API from '../../utils/api'; // Import API for production mode
import { Button, Spinner } from '../ui';
import { FiUploadCloud, FiXCircle, FiCheckCircle, FiFileText, FiTrash2 } from 'react-icons/fi';

interface UploadedDocument {
  id: string; // The ID returned by the backend after confirmation
  name: string;
  size: number;
  type: string;
}

interface FileUploadState {
  localId: string; // Temporary ID for UI tracking
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
  finalId?: string; // ID from backend
}

interface DocumentUploadProps {
  onSubmit: (documents: UploadedDocument[]) => void;
  onBack: () => void;
  projectId: string;
}

export default function DocumentUpload({ onSubmit, onBack, projectId }: DocumentUploadProps) {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { session } = useAuth();

  const updateUploadState = (localId: string, updates: Partial<FileUploadState>) => {
    setUploads(prev => 
      prev.map(up => (up.localId === localId ? { ...up, ...updates } : up))
    );
  };

  const uploadFile = async (upload: FileUploadState) => {
    if (!session?.access_token) {
      updateUploadState(upload.localId, { status: 'error', error: 'Authentication required' });
      return;
    }

    const { localId, file } = upload;

    try {
      // Step 1: Get presigned URL from our backend
      updateUploadState(localId, { status: 'uploading', progress: 10 });
      const uploadUrlData = await API.getDocumentUploadUrl(file, projectId);
      
      // Step 2: Upload file to Storage (Supabase/S3) using the presigned URL
      updateUploadState(localId, { status: 'uploading', progress: 40 });
      await API.uploadDocumentToSignedUrl(file, uploadUrlData.presigned_url);
      
      // Step 3: Confirm upload in our backend (triggers processing)
      updateUploadState(localId, { status: 'processing', progress: 70 });
      const confirmedDoc = await API.confirmDocumentUpload(
        file.name,
        uploadUrlData.file_key,
        projectId
      );
      
      // Update document with success status and real document ID
      updateUploadState(localId, {
        status: 'success',
        progress: 100,
        finalId: confirmedDoc.id // Store the real ID from backend
      });

    } catch (error) {
      console.error(`Error uploading file: ${file.name}`, error);
      updateUploadState(localId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  };
  
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setIsDragging(false);
    const newUploads: FileUploadState[] = acceptedFiles.map(file => ({
      localId: `file-${Date.now()}-${Math.random()}`,
      file: file,
      status: 'pending',
      progress: 0,
    }));
    
    setUploads(prev => [...prev, ...newUploads]);
    newUploads.forEach(uploadFile); // Start upload for each new file
    
    // Show errors for rejected files
    if (fileRejections.length > 0) {
      const errors = fileRejections.map(rej => 
         `${rej.file.name}: ${rej.errors.map(e => e.message).join(', ')}`
      ).join('\n');
      alert(`Some files were rejected:\n${errors}`); // Improve UI later (e.g., Toast)
    }
  }, [projectId, session]); // Dependencies for useCallback

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragOver: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'], // Added support for markdown files
      'text/csv': ['.csv']      // Added support for CSV files
    },
    maxSize: 10 * 1024 * 1024, // 10MB size limit
    disabled: !session // Disable if not logged in
  });

  const removeUpload = (localId: string) => {
    setUploads(prev => {
      const upload = prev.find(up => up.localId === localId);
      
      // If the file was successfully uploaded and has a finalId, 
      // attempt to delete it from the backend
      if (upload?.status === 'success' && upload.finalId) {
        try {
          API.deleteDocument(upload.finalId)
            .catch(err => console.error(`Failed to delete document ${upload.finalId} from server:`, err));
        } catch (error) {
          console.error('Error deleting document:', error);
        }
      }
      
      return prev.filter(up => up.localId !== localId);
    });
  };

  const handleSubmit = () => {
    const successfulDocuments: UploadedDocument[] = uploads
      .filter(up => up.status === 'success' && up.finalId)
      .map(up => ({
        id: up.finalId!,
        name: up.file.name,
        size: up.file.size,
        type: up.file.type,
      }));
    onSubmit(successfulDocuments);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasSuccessfulUploads = uploads.some(up => up.status === 'success');
  const isUploading = uploads.some(up => up.status === 'uploading' || up.status === 'processing');

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Upload Documents</h2>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'}
        `}
      >
        <input {...getInputProps()} />
        <FiUploadCloud className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {isDragging ? 'Drop files here' : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          PDF, DOCX, TXT, MD, CSV up to 10MB
        </p>
      </div>

      {uploads.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Upload Queue</h3>
          {uploads.map((up) => (
            <div key={up.localId} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <FiFileText className="w-6 h-6 text-indigo-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{up.file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(up.file.size)}</p>
                {(up.status === 'uploading' || up.status === 'processing') && (
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300 ease-linear"
                      style={{ width: `${up.progress}%` }}
                    ></div>
                  </div>
                )}
                 {up.status === 'error' && (
                    <p className="text-xs text-red-500 mt-1">Error: {up.error}</p>
                 )}
              </div>
              <div className="flex-shrink-0">
                {up.status === 'success' && <FiCheckCircle className="w-5 h-5 text-green-500" />}
                {up.status === 'error' && <FiXCircle className="w-5 h-5 text-red-500" />}
                {(up.status === 'uploading' || up.status === 'processing') && <Spinner size="sm" />}
                <button 
                  onClick={() => removeUpload(up.localId)}
                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove file"
                  disabled={up.status === 'uploading' || up.status === 'processing'}
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button 
          onClick={handleSubmit}
          disabled={!hasSuccessfulUploads || isUploading}
        >
          {isUploading 
           ? 'Processing... ' 
           : 'Finish & Start Training'}
        </Button>
      </div>
    </div>
  );
} 