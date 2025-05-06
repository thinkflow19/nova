'use client';

import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { Card, Button, Spinner } from '../../components/ui';

// Projects
interface ProjectFromAPI {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  icon: string | null;
  color: string | null;
  ai_config: {
    tone?: string;
    [key: string]: unknown;
  } | null;
  memory_type: string | null;
  tags: string[] | null;
}

export default function DashboardPage() {
  const { session } = useAuth();
  const [projects, setProjects] = useState<ProjectFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the user's projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        setIsLoading(true);
        setError(null); // Reset error state
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.warn("No auth token found in localStorage");
          setError("Please log in to view your projects.");
          return;
        }

        console.log("Fetching projects with token:", token.substring(0, 10) + "...");
        const projectsData = await API.listProjects();
        console.log("Projects data received:", projectsData);
        setProjects(projectsData || []);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        if (err instanceof Error) {
          setError(err.message || 'Failed to load your projects. Please try again later.');
        } else {
          setError('An unexpected error occurred. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, []); // Remove session dependency since we're using localStorage directly

  return (
    <ProtectedRoute>
      <div className="bg-white p-8 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your AI Assistants</h1>
          <Link href="/dashboard/new-bot">
            <Button variant="primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Bot
            </Button>
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} hoverable className="p-6">
                <div className="flex items-center mb-4">
                  <div 
                    className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white"
                    style={{ backgroundColor: project.color || '#6366F1' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold">{project.name}</h3>
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  <p>Created: {new Date(project.created_at).toLocaleDateString()}</p>
                  <p>Tone: {project.ai_config?.tone || 'Friendly'}</p>
                  <p>Status: <span className={project.memory_type === 'active' ? 'text-green-500' : 'text-yellow-500'}>{project.memory_type || 'In progress'}</span></p>
                </div>
                <div className="flex justify-between mt-4">
                  <Link href={`/dashboard/bot/${project.id}`}>
                    <Button variant="secondary" size="sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      View
                    </Button>
                  </Link>
                  <Button variant="primary" size="sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Embed
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8">
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-6">
                <svg
                  className="h-10 w-10"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No bots yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">Create your first AI assistant to start answering questions from your documents.</p>
              <Link href="/dashboard/new-bot">
                <Button variant="primary">
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create a bot
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}