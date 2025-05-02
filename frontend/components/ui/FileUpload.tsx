import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Spinner } from './Spinner';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  isLoading?: boolean;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
  label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  isLoading = false,
  accept,
  maxFiles = 1,
  maxSize = 10485760, // 10MB
  className = '',
  label = 'Drag and drop files here, or click to select files',
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onUpload(acceptedFiles);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  const getUploadZoneClasses = () => {
    if (isDragActive) return 'upload-zone upload-zone-active';
    if (isDragReject) return 'upload-zone border-red-500 bg-red-50';
    return 'upload-zone';
  };

  return (
    <div
      {...getRootProps()}
      className={`${getUploadZoneClasses()} ${className}`}
      aria-label="File upload area"
    >
      <input {...getInputProps()} />
      {isLoading ? (
        <div className="flex flex-col items-center justify-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-center text-gray-600">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <svg
            className="w-10 h-10 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-center text-gray-600">{label}</p>
          {isDragReject && (
            <p className="text-center text-red-500 mt-2">
              Some files are not accepted. Please check file type and size.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload; 