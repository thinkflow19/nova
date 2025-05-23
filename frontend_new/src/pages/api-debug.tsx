import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listProjects } from '../utils/api';
import config from '../utils/config';

export default function ApiDebug() {
  const { user, session } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, success: boolean, data: any, error?: any) => {
    setResults(prev => [...prev, {
      test,
      success,
      data,
      error: error?.message || error,
      timestamp: new Date().toISOString()
    }]);
  };

  const testHealthCheck = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/health`);
      const data = await response.json();
      addResult('Health Check', response.ok, data);
    } catch (error) {
      addResult('Health Check', false, null, error);
    }
  };

  const testProjectsEndpoint = async () => {
    try {
      const projects = await listProjects();
      addResult('Projects API', true, projects);
    } catch (error: any) {
      addResult('Projects API', false, null, error);
    }
  };

  const testDirectFetch = async () => {
    try {
      const token = session?.access_token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${config.apiUrl}/api/projects/`, {
        headers
      });
      
      const data = response.ok ? await response.json() : await response.text();
      addResult('Direct Fetch', response.ok, { status: response.status, data });
    } catch (error) {
      addResult('Direct Fetch', false, null, error);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);
    
    await testHealthCheck();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testDirectFetch();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testProjectsEndpoint();
    
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      runAllTests();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">API Debug Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="space-y-2 text-sm">
            <p><strong>API URL:</strong> {config.apiUrl}</p>
            <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
            <p><strong>Session:</strong> {session ? '✅ Valid' : '❌ None'}</p>
            <p><strong>Token:</strong> {session?.access_token ? '✅ Available' : '❌ Missing'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            <button
              onClick={runAllTests}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Run Tests'}
            </button>
          </div>
          
          {results.length === 0 && !loading && (
            <p className="text-gray-500">No tests run yet. Click "Run Tests" to start.</p>
          )}
          
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className={`border rounded p-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{result.test}</h3>
                  <span className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.success ? '✅ Success' : '❌ Failed'}
                  </span>
                </div>
                
                {result.error && (
                  <div className="mb-2">
                    <strong className="text-red-600">Error:</strong>
                    <pre className="text-sm bg-red-100 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(result.error, null, 2)}
                    </pre>
                  </div>
                )}
                
                {result.data && (
                  <div>
                    <strong>Response:</strong>
                    <pre className="text-sm bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(result.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={testHealthCheck}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Test Health
            </button>
            <button
              onClick={testDirectFetch}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Direct Fetch
            </button>
            <button
              onClick={testProjectsEndpoint}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Test Projects API
            </button>
            <a
              href="/login"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 inline-block"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 