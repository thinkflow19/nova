import React from 'react';

interface ErrorMessageProps {
  message: string;
  code?: string | number;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, code, onRetry }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center flex flex-col items-center gap-2">
    <div className="text-red-600 dark:text-red-400 font-semibold text-lg flex items-center gap-2">
      <svg className="w-6 h-6 text-red-500 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" /></svg>
      {message}
    </div>
    {code && <div className="text-xs text-red-400">Error code: {code}</div>}
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors text-sm"
      >
        Retry
      </button>
    )}
  </div>
);

export default ErrorMessage; 