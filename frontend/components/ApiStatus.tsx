'use client';

import React, { useState, useEffect } from 'react';
import config from '../config/config';

// API status component to display backend connectivity information
const ApiStatus: React.FC = () => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  const checkApiStatus = async () => {
    try {
      setStatus('checking');
      const response = await fetch(`${config.apiUrl}/health`, {
        method: 'HEAD',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      if (response.ok) {
        setStatus('connected');
        setErrorDetails(null);
      } else {
        setStatus('disconnected');
        setErrorDetails(`Status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setStatus('disconnected');
      setErrorDetails(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLastCheck(new Date());
    }
  };
  
  useEffect(() => {
    // Check on mount
    checkApiStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Only render if disconnected
  if (status === 'connected') {
    return null;
  }
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg 
      ${status === 'checking' ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 
          ${status === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
        <div>
          <h3 className={`font-medium ${status === 'checking' ? 'text-yellow-800 dark:text-yellow-200' : 'text-red-800 dark:text-red-200'}`}>
            {status === 'checking' ? 'Checking API connection...' : 'Backend Server Disconnected'}
          </h3>
          {errorDetails && <p className="text-sm text-red-700 dark:text-red-300 mt-1">{errorDetails}</p>}
          {lastCheck && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Last checked: {lastCheck.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
      {status === 'disconnected' && (
        <div className="mt-3 flex space-x-2">
          <button 
            onClick={checkApiStatus}
            className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-sm"
          >
            Retry Connection
          </button>
          <a 
            href="javascript:void(0)" 
            onClick={() => { window.location.reload(); }}
            className="text-sm px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md shadow-sm"
          >
            Reload Page
          </a>
        </div>
      )}
    </div>
  );
};

export default ApiStatus; 