'use client';

import ProtectedRoute from '../../../components/auth/ProtectedRoute'; // Adjusted path
import { useAuth } from '../../../contexts/AuthContext'; // Adjusted path
import Link from 'next/link';
import { useState, useEffect } from 'react';
import API from '../../../utils/api'; // Adjusted path
import { Card, Button, Spinner } from '../../../components/ui'; // Adjusted path
import toast from 'react-hot-toast'; // Keep toast

// Projects Interface (keep as is)
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
  ai_config: { tone?: string; [key: string]: unknown; } | null;
  memory_type: string | null;
  tags: string[] | null;
}

// Renamed component to ProjectsPage
export default function ProjectsPage() {
  const { session } = useAuth(); // Keep auth context if needed
  const [projects, setProjects] = useState<ProjectFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects logic (keep as is)
  useEffect(() => {
    async function fetchProjects() {
       // ... same fetching logic ...
      try {
        setIsLoading(true);
        setError(null); 
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.warn("No auth token found");
          setError("Login required.");
          return;
        }

        const projectsData = await API.listProjects();
        setProjects(projectsData || []);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        if (err instanceof Error) {
          setError(err.message || 'Failed to load projects.');
        } else {
          setError('An unexpected error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  // Deletion logic (keep as is)
  const performDeletion = async (projectId: string) => {
     // ... same deletion logic ...
    const toastId = toast.loading('Deleting project...');
    try {
      await API.deleteProject(projectId);
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      toast.success('Project deleted successfully.', { id: toastId });
      setError(null); 
    } catch (err) { 
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project.';
      toast.error(errorMessage, { id: toastId });
      setError(errorMessage); 
      console.error('Delete error:', err);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    // ... same toast confirmation logic ...
    toast((t) => (
      <span className="flex flex-col items-center">
        <p className="mb-2">Are you sure?</p>
        <div className="space-x-2">
          <Button variant="danger" size="sm" onClick={() => { toast.dismiss(t.id); performDeletion(projectId).catch(err => console.error(err)); }}>Delete</Button>
          <Button variant="secondary" size="sm" onClick={() => toast.dismiss(t.id)}>Cancel</Button>
        </div>
      </span>
    ), { duration: 6000, position: 'top-center' });
  };

  // Return statement 
  return (
    <ProtectedRoute>
      {/* Removed outer bg-white wrapper, will inherit from layout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">My Projects</h1>
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        // Use a fragment <> to wrap the conditional logic correctly
        <>
          {projects.length > 0 ? (
            // Display projects grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animation-fade-in">
              {projects.map((project) => (
                <Card key={project.id} hoverable className="p-5 transition-all duration-200 ease-in-out transform hover:scale-[1.03] bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-700/50">
                  {/* Project Card content (keep as is) */}
                  {/* ... Icon, Name, Details, Buttons ... */}
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
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1">
                    <p>Created: {new Date(project.created_at).toLocaleDateString()}</p>
                    <p>Tone: {project.ai_config?.tone || 'Default'}</p>
                    <p>Status: 
                      <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                         Active
                      </span>
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-4 space-x-2"> 
                    <Link href={`/dashboard/bot/${project.id}`}>
                      <Button variant="secondary" size="sm" className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg> View
                      </Button>
                    </Link>
                    <Button variant="primary" size="sm" className="flex items-center" onClick={() => toast.error('Embed feature coming soon!')}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg> Embed
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => handleDeleteProject(project.id)}
                      aria-label={`Delete project ${project.name}`}
                      className="opacity-70 hover:opacity-100 transition-opacity flex items-center p-1.5" 
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            // Display "No projects" message - Ensure correct JSX closing
            <Card className="p-8 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50">
               <div className="text-center py-12">
                  <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No projects yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">Create your first AI assistant project to get started.</p>
                  <Link href="/dashboard/new-bot">
                     <Button variant="primary">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create a Project
                     </Button>
                  </Link>
               </div>
            </Card>
          )}
        </>
      )}
    </ProtectedRoute>
  );
} 