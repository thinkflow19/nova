'use client';

import ProtectedRoute from '../../../components/auth/ProtectedRoute'; // Adjusted path
import { useAuth } from '../../../contexts/AuthContext'; // Adjusted path
import Link from 'next/link';
import { useState, useEffect } from 'react';
import API from '../../../utils/api'; // Adjusted path
import { Card, Button, Spinner } from '../../../components/ui'; // Adjusted path
import toast from 'react-hot-toast'; // Keep toast
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import WorkspaceHeader from "../../../components/layout/WorkspaceHeader";
import ChatInterface from '../../../components/chat/ChatInterface';

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
  const [selectedProject, setSelectedProject] = useState<ProjectFromAPI | null>(null);
  const router = useRouter();

  // Fetch projects logic (keep as is)
  useEffect(() => {
    async function fetchProjects() {
       // ... same fetching logic ...
      try {
        setIsLoading(true);
        setError(null); 
        
        if (!session?.access_token) {
          console.warn("No auth token found");
          setError("Login required.");
          return;
        }

        const projectsData = await API.listProjects(session.access_token);
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

  const handleProjectClick = (project: ProjectFromAPI) => {
    setSelectedProject(project);
  };

  const handleSendMessage = async (projectId: string, message: string): Promise<string | AsyncIterable<string>> => {
    try {
      const response = await API.chat(projectId, message);
      
      if (response && typeof response.completion === 'string') {
        return response.completion;
      } else {
        console.error("Unexpected response structure from chat API:", response);
        return "I'm sorry, I received an unexpected response.";
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      if (error instanceof Error) {
        return `Failed to send message: ${error.message}`;
      } else {
        return "An unknown error occurred while sending the message.";
      }
    }
  };

  // Return statement 
  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <WorkspaceHeader />
      
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Workspace
          </button>
        </div>

        <div className="flex gap-6">
          {/* Projects List */}
          <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Your AI Projects</h2>
              <button
                onClick={() => router.push('/dashboard/new-bot')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                New Project
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-12">{error}</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No projects yet</p>
                <button
                  onClick={() => router.push('/dashboard/new-bot')}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Create your first project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedProject?.id === project.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                    onClick={() => handleProjectClick(project)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center mb-3">
                      <div
                        className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white"
                        style={{ backgroundColor: project.color || '#6366F1' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold">{project.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Interface */}
          <AnimatePresence>
            {selectedProject && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-[600px] bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Chat with {selectedProject.name}</h3>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="h-[calc(100vh-200px)]">
                  <ChatInterface
                    projectId={selectedProject.id}
                    onSendMessage={handleSendMessage}
                    welcomeMessage={`Hello! I'm ${selectedProject.name}. How can I assist you today?`}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  );
} 