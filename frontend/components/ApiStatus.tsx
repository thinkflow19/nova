'use client';

import { useEffect, useState } from 'react';
import API from '../utils/api';

export default function ApiStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [message, setMessage] = useState('Checking backend connection...');

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await API.health();
        if (response && response.status === 'ok') {
          setStatus('connected');
          setMessage('Backend API connected');
        } else {
          setStatus('error');
          setMessage('Backend API responded but status is not ok');
        }
      } catch (error) {
        console.error('Backend connection error:', error);
        setStatus('error');
        setMessage('Failed to connect to backend API');
      }
    };

    checkApiStatus();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 p-2 rounded-md text-sm shadow-md bg-opacity-80 backdrop-blur-sm"
      style={{
        backgroundColor: status === 'connected' ? 'rgba(34, 197, 94, 0.2)' : 
                          status === 'error' ? 'rgba(239, 68, 68, 0.2)' : 
                          'rgba(59, 130, 246, 0.2)',
        color: status === 'connected' ? 'rgb(22, 163, 74)' : 
               status === 'error' ? 'rgb(220, 38, 38)' : 
               'rgb(37, 99, 235)'
      }}
    >
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          status === 'connected' ? 'bg-green-500' :
          status === 'error' ? 'bg-red-500' :
          'bg-blue-500'
        }`} style={status === 'loading' ? { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' } : undefined}></div>
        <span>{message}</span>
      </div>
    </div>
  );
} 