'use client';

import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { Card, Button, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

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

export default function NovaWorkspace() {
  const { session } = useAuth();
  const [projects, setProjects] = useState<ProjectFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

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
        const projectsData = await API.listProjects(token);
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

  // Define performDeletion before handleDeleteProject so it's in scope
  const performDeletion = async (projectId: string) => {
    const toastId = toast.loading('Deleting project...');
    try {
      await API.deleteProject(projectId);
      // Important: Update state based on the previous state to avoid stale closures
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      toast.success('Project deleted successfully.', { id: toastId });
      // Clear the general error state if deletion was successful
      setError(null); 
    } catch (err) { // Correctly capture error in this scope
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project.';
      toast.error(errorMessage, { id: toastId });
      setError(errorMessage); // Set the general error state
      console.error('Delete error:', err);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    // Use toast for confirmation
    toast((t) => (
      <span className="flex flex-col items-center">
        <p className="mb-2">Are you sure you want to delete this project?</p>
        <div className="space-x-2">
          <Button 
            variant="danger" 
            size="sm"
            onClick={() => {
              toast.dismiss(t.id);
              // Call the deletion function defined above
              performDeletion(projectId).catch(err => {
                 // Handle potential unhandled promise rejection from performDeletion
                 // Although errors are caught inside performDeletion, this is good practice
                 console.error("Error during deletion confirmation flow:", err);
                 toast.error("An unexpected error occurred during deletion.");
              }); 
            }}
          >
            Delete
          </Button>
          <Button 
            variant="secondary"
            size="sm"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </Button>
        </div>
      </span>
    ), { 
      duration: 6000, // Keep toast open longer for confirmation
      position: 'top-center',
    });
  };

  const handleAIChatClick = async () => {
    setIsNavigating(true);
    try {
      await router.push('/dashboard/projects');
    } catch (error) {
      console.error('Navigation failed:', error);
      setIsNavigating(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <main className="max-w-screen-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Welcome to Nova</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AI Chat Section */}
          <motion.div
            className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-all relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={handleAIChatClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <h2 className="text-lg font-semibold mb-4">AI Chat</h2>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative">
              {isNavigating ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500">Loading projects...</p>
                </div>
              ) : (
                <p className="text-gray-500">View your AI projects</p>
              )}
            </div>
          </motion.div>

          {/* Automation Builder Section */}
          <motion.div
            className="bg-white rounded-lg shadow-sm p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold mb-4">Automation Builder</h2>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Automation builder coming soon...</p>
            </div>
          </motion.div>

          {/* Documents Section */}
          <motion.div
            className="bg-white rounded-lg shadow-sm p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg font-semibold mb-4">Documents</h2>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Document management coming soon...</p>
            </div>
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
}