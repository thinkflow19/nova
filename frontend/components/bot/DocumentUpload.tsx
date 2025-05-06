'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { useAuth } from '../../contexts/AuthContext';
import API from '../../utils/api'; // Import API for production mode
import { Button, Spinner } from '../ui';
import { FiUploadCloud, FiXCircle, FiCheckCircle, FiFileText, FiTrash2, FiUpload, FiX, FiAlertCircle, FiAlertTriangle, FiClock, FiFile } from 'react-icons/fi';
import { PiSpinnerGapBold } from 'react-icons/pi';

interface UploadedDocument {
  id: string; // The ID returned by the backend after confirmation
  name: string;
  size: number;
  type: string;
}

// File upload status types
type UploadStatus = 
  | 'idle'       // Initial state
  | 'uploading'  // Currently uploading to storage
  | 'processing' // Uploaded and being processed (text extraction, embedding, etc.)
  | 'complete'   // Successfully processed
  | 'error';     // Error occurred

interface FileUploadState {
  localId: string;
  file: File;
  status: UploadStatus;
  progress: number; // 0-100
  error?: string;
  finalId?: string; // Database ID once available
  processingStartTime?: number;
  message?: string;
}

interface DocumentUploadProps {
  onSubmit: (documents: { id: string; name: string; status: string }[]) => void;
  onBack: () => void;
  projectId: string;
}

export default function DocumentUpload({ onSubmit, onBack, projectId }: DocumentUploadProps) {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { session } = useAuth();

  const updateUploadState = (localId: string, update: Partial<FileUploadState>) => {
    setUploads(prev => 
      prev.map(up => (up.localId === localId ? { ...up, ...update } : up))
    );
  };

  // Start polling for document status
  const startPolling = useCallback(() => {
    if (!isPolling && uploads.some(u => u.status === 'processing' && u.finalId)) {
      setIsPolling(true);
      pollIntervalRef.current = setInterval(pollDocumentStatus, 5000); // Poll every 5 seconds
    }
  }, [isPolling, uploads]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      setIsPolling(false);
    }
  }, []);

  // Poll document status until complete or failed
  const pollDocumentStatus = async (localId: string, documentId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for up to 5 minutes (60 x 5s = 300s)
    const pollInterval = 5000; // 5 seconds
    
    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        updateUploadState(localId, { 
          status: 'error', 
          error: 'Document processing timed out. Please try again.' 
        });
        return;
      }
      
      try {
        const status = await API.getDocumentStatus(documentId);
        console.log(`Document ${documentId} status:`, status);
        
        if (status.status === 'complete') {
          updateUploadState(localId, { 
            status: 'complete', 
            progress: 100,
            message: 'Document processed successfully!'
          });
          return;
        } else if (status.status === 'failed') {
          updateUploadState(localId, { 
            status: 'error', 
            error: status.processing_error || 'Document processing failed'
          });
          return;
        } else if (status.status === 'processing') {
          // Update progress if available, otherwise use incremental progress
          const progress = status.processing_progress || Math.min(50 + (attempts * 5), 90);
          updateUploadState(localId, { 
            status: 'processing', 
            progress,
            message: status.processing_message || 'Processing document...'
          });
        }
        
        // Continue polling
        attempts++;
        window.setTimeout(checkStatus, pollInterval);
      } catch (error) {
        console.error('Error checking document status:', error);
        // Don't fail immediately on status check errors, keep trying
        attempts++;
        window.setTimeout(checkStatus, pollInterval);
      }
    };
    
    // Start polling
    window.setTimeout(checkStatus, pollInterval);
  };

  const uploadFile = async (upload: FileUploadState) => {
    if (!session?.access_token) {
      updateUploadState(upload.localId, { status: 'error', error: 'Authentication required' });
      return;
    }

    const { localId, file } = upload;

    try {
      // Update state to show upload progress
      updateUploadState(localId, { status: 'uploading', progress: 10 });
      
      console.log(`Starting upload of ${file.name} (${formatFileSize(file.size)}) to project ${projectId}`);
      
      // Direct upload to backend - this handles both upload and processing in one call
      const response = await API.uploadDocument(file, projectId);
      
      if (!response || !response.id) {
        throw new Error('Upload failed: Missing document ID in response');
      }
      
      console.log('Upload successful', response);
      
      // Update the upload state with the document ID
      updateUploadState(localId, { 
        status: 'processing', 
        progress: 50,
        finalId: response.id,
        message: 'Document uploaded. Now processing...'
      });
      
      // Start polling for document status
      pollDocumentStatus(localId, response.id);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      let errorMessage = 'Failed to upload document';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle API error responses
        errorMessage = (error as any).detail || (error as any).message || JSON.stringify(error);
      }
      
      updateUploadState(localId, { 
        status: 'error', 
        error: errorMessage,
        progress: 0
      });
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setIsDragging(false);
    setGlobalError(null);
    
    // Validate files against Supabase limits
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for free tier
    const validFiles: File[] = [];
    const invalidFiles: {file: File, reason: string}[] = [];
    
    // Check each file against size limits
    acceptedFiles.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push({
          file, 
          reason: `File exceeds the 50MB limit (${Math.round(file.size/1024/1024)}MB)`
        });
      } else {
        validFiles.push(file);
      }
    });
    
    // Create upload states for valid files
    const newUploads: FileUploadState[] = validFiles.map(file => ({
      localId: `file-${Date.now()}-${Math.random()}`,
      file: file,
      status: 'idle' as UploadStatus,
      progress: 0,
    }));
    
    setUploads(prev => [...prev, ...newUploads]);
    newUploads.forEach(uploadFile); // Start upload for each new file
    
    // Add size-rejected files to the formal rejections
    const allRejections = [...fileRejections];
    invalidFiles.forEach(({file, reason}) => {
      allRejections.push({
        file,
        errors: [{
          code: 'file-too-large',
          message: reason
        }]
      });
    });
    
    // Show errors for all rejected files
    if (allRejections.length > 0) {
      const errors = allRejections.map(rej => 
         `${rej.file.name}: ${rej.errors.map(e => e.message).join(', ')}`
      ).join('\n');
      setGlobalError(errors);
    }
  }, [uploadFile, projectId, session]); // Dependencies for useCallback

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
      if (upload?.status === 'complete' && upload.finalId) {
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
    const completedDocs = uploads
      .filter(upload => upload.status === 'complete' && upload.finalId)
      .map(upload => ({
        id: upload.finalId!,
        name: upload.file.name,
        status: 'complete'
      }));
    
    if (completedDocs.length > 0) {
      onSubmit(completedDocs);
    } else {
      setGlobalError('Please upload at least one document and wait for processing to complete');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const anyProcessing = uploads.some(u => u.status === 'uploading' || u.status === 'processing');
  const allComplete = uploads.length > 0 && uploads.every(u => u.status === 'complete' || u.status === 'error');
  const anyComplete = uploads.some(u => u.status === 'complete');

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Upload Documents</h2>
      
      {globalError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded flex items-center">
          <FiAlertCircle className="mr-2 flex-shrink-0" />
          <p>{globalError}</p>
          <button 
            onClick={() => setGlobalError(null)} 
            className="ml-auto text-red-700 hover:text-red-900"
          >
            <FiX />
          </button>
        </div>
      )}
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'}
        `}
      >
        <input {...getInputProps()} />
        <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
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
              <FiFile className="w-6 h-6 text-indigo-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{up.file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(up.file.size)}</p>
                {(up.status === 'uploading' || up.status === 'processing') && (
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                    <div 
                      className={`bg-indigo-600 h-1.5 rounded-full transition-all duration-300 ease-linear ${
                        up.status === 'uploading' || up.status === 'processing' ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${up.progress}%` }}
                    ></div>
                  </div>
                )}
                 {up.status === 'error' && (
                    <p className="text-xs text-red-500 mt-1">Error: {up.error}</p>
                 )}
              </div>
              <div className="flex-shrink-0">
                {up.status === 'complete' && <FiCheckCircle className="w-5 h-5 text-green-500" />}
                {up.status === 'error' && <FiXCircle className="w-5 h-5 text-red-500" />}
                {(up.status === 'uploading' || up.status === 'processing') && <Spinner size="sm" />}
                <button 
                  onClick={() => removeUpload(up.localId)}
                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove file"
                  disabled={anyProcessing}
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={anyProcessing}>Back</Button>
        <Button 
          onClick={handleSubmit}
          disabled={!anyComplete || anyProcessing}
        >
          {anyProcessing ? 'Processing...' : 'Finish & Start Training'}
        </Button>
      </div>
    </div>
  );
} 