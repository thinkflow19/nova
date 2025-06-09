'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../Button';
import { Loading } from '../Loading';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  loading?: boolean;
  disabled?: boolean;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  loading = false,
  disabled = false,
  accept = '.pdf,.docx,.txt,.md,.csv,.json',
  maxSize = 50 * 1024 * 1024, // 50MB default
  className = '',
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size must be less than ${(maxSize / (1024 * 1024)).toFixed(0)}MB`;
    }
    
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = accept.split(',').map(type => type.trim());
    
    if (!acceptedTypes.includes(extension)) {
      return `File type not supported. Accepted types: ${accept}`;
    }
    
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    onFileSelect(file);
  }, [onFileSelect, maxSize, accept]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled && !loading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    if (disabled || loading) return;
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && !loading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInputChange}
        accept={accept}
        disabled={disabled || loading}
      />
      
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${dragOver 
            ? 'border-[var(--accent-electric)] bg-[var(--accent-electric)]/5' 
            : 'border-[var(--border-secondary)]'
          }
          ${disabled || loading
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-[var(--accent-electric)] hover:bg-[var(--accent-electric)]/5'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loading size="md" variant="neural" />
            <p className="text-sm text-[var(--text-secondary)]">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="text-4xl">📁</div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Supported: {accept.replace(/\./g, '').toUpperCase()}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Max size: {(maxSize / (1024 * 1024)).toFixed(0)}MB
              </p>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
          {error}
        </div>
      )}
      
      <div className="mt-3">
        <Button
          variant="primary"
          size="sm"
          onClick={handleClick}
          loading={loading}
          disabled={disabled || loading}
          className="w-full"
        >
          {loading ? 'Uploading...' : 'Choose File'}
        </Button>
      </div>
    </div>
  );
}; 