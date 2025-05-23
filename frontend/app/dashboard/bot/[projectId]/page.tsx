'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import ChatInterface from '../../../../components/chat/ChatInterface';
import ChatSessionSelector from '../../../../components/chat/ChatSessionSelector';
import API from '../../../../utils/api';
// import { useProject } from '../../../../hooks/useProject';
import { Spinner } from '../../../../components/ui';
import { FiArrowLeft, FiHelpCircle, FiSettings, FiClock, FiList } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import config from '../../../../config/config';

// Use API URL from config
const API_URL = config.apiUrl;

interface Project {
  id: string;
  name: string;
  description?: string | null;
  is_public?: boolean;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  icon?: string | null;
  color?: string | null;
  ai_config?: Record<string, unknown> | null;
  memory_type?: string | null;
  tags?: string[] | null;
  isLoading?: boolean;
  tone: string;
  status: string;
}

export default function BotPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  
  const [project, setProject] = useState<Project>({ id: projectId, name: 'AI Assistant', isLoading: true, tone: 'friendly', status: 'offline' as const });
  const [isMobile, setIsMobile] = useState(false);
  // State to store the active chat session ID
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  // State to toggle the session selector visibility
  const [showSessionSelector, setShowSessionSelector] = useState(false);
  // Flag to check if streaming is enabled
  const [streamingEnabled, setStreamingEnabled] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load saved session ID on initial render
  useEffect(() => {
    // Only run in browser context
    if (typeof window !== 'undefined') {
      const savedSessionId = localStorage.getItem(`nova_chat_session_${projectId}`);
      if (savedSessionId) {
        console.log(`Loaded saved chat session: ${savedSessionId} for project: ${projectId}`);
        setActiveSessionId(savedSessionId);
      }
      
      // Check for streaming preference
      const streamingPreference = localStorage.getItem('nova_streaming_enabled');
      setStreamingEnabled(streamingPreference === 'true');
    }
  }, [projectId]);

  // Save session ID whenever it changes
  useEffect(() => {
    if (activeSessionId && typeof window !== 'undefined') {
      console.log(`Saving chat session: ${activeSessionId} for project: ${projectId}`);
      localStorage.setItem(`nova_chat_session_${projectId}`, activeSessionId);
    }
  }, [activeSessionId, projectId]);

  // Handler function to send messages
  const handleSendMessage = async (pid: string, message: string): Promise<string | AsyncIterable<string>> => {
    try {
      console.log(`Sending message to backend for project ${pid}`);
      
      // Handle streaming mode
      if (streamingEnabled) {
        console.log('Using streaming mode');
        return API.streamChat(pid, message, activeSessionId || undefined);
      } 
      
      // Handle regular non-streaming mode
      const response = await API.chat(pid, message, activeSessionId || undefined); 
      
      // Update active session if we just created a new one
      if (!activeSessionId && response.session_id) {
        setActiveSessionId(response.session_id);
      }
      
      // Check if the response has the expected structure
      if (response && typeof response.completion === 'string') {
        return response.completion;
      } else {
        console.error("Unexpected response structure from chat API:", response);
        return "I'm sorry, I received an unexpected response.";
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      // Provide a more user-friendly error message based on the error type
      if (error instanceof Error) {
         // You could add more specific checks here, e.g., for network errors
         return `Failed to send message: ${error.message}`;
      } else {
         return "An unknown error occurred while sending the message.";
      }
    }
  };
  
  // TODO: Optimize project fetching. Currently fetches all projects.
  // Replace with a dedicated API endpoint: GET /api/projects/{projectId}
  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error("No auth token found in localStorage");
          throw new Error("Authentication token not found. Please log in again.");
        }
        
        // Get project details from API
        const projects = await API.listProjects(token);
        const currentProject = projects.find((p: { id: string; name?: string; description?: string }) => p.id === projectId);
        
        if (currentProject) {
          setProject({
            id: projectId,
            name: currentProject.name || 'AI Assistant',
            description: currentProject.description,
            isLoading: false,
            tone: currentProject.ai_config?.tone || 'friendly',
            status: 'online' as const
          });
        } else {
          setProject({
            id: projectId,
            name: 'AI Assistant',
            isLoading: false,
            tone: 'friendly',
            status: 'offline' as const
          });
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        setProject({
          id: projectId,
          name: 'AI Assistant',
          isLoading: false,
          tone: 'friendly',
          status: 'offline' as const
        });
      }
    };
    
    fetchProject();
  }, [projectId]);

  // Create a new chat session
  const handleCreateSession = async () => {
    try {
      const session = await API.createChatSession(projectId);
      setActiveSessionId(session.id);
      setShowSessionSelector(false);
    } catch (error) {
      console.error("Error creating new session:", error);
      alert("Failed to create a new chat session.");
    }
  };

  // Switch to a different chat session
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    localStorage.setItem(`nova_chat_session_${projectId}`, sessionId);
    setShowSessionSelector(false);
  };

  // Toggle streaming mode
  const toggleStreamingMode = () => {
    const newValue = !streamingEnabled;
    setStreamingEnabled(newValue);
    localStorage.setItem('nova_streaming_enabled', String(newValue));
  };

  if (project.isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="text-center">
          <Spinner size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your assistant...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700 p-3 md:p-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <FiArrowLeft className="text-gray-600 dark:text-gray-300" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                {project.name}
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                  AI
                </span>
                {streamingEnabled && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Streaming
                  </span>
                )}
              </h1>
              {project.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Chat History"
              onClick={() => setShowSessionSelector(!showSessionSelector)}
            >
              <FiClock className="text-gray-600 dark:text-gray-300" />
            </button>
            <button 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle Streaming"
              onClick={toggleStreamingMode}
              title={streamingEnabled ? "Disable streaming mode" : "Enable streaming mode"}
            >
              <FiList className="text-gray-600 dark:text-gray-300" />
            </button>
            <button 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Help"
            >
              <FiHelpCircle className="text-gray-600 dark:text-gray-300" />
            </button>
            <button 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Settings"
              onClick={() => router.push(`/dashboard/edit-bot/${projectId}`)}
            >
              <FiSettings className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </header>

        {/* Main Chat Area with Session Selector */}
        <main className="flex-1 overflow-hidden p-2 md:p-6 max-w-5xl mx-auto w-full">
          <div className="h-full rounded-xl overflow-hidden shadow-xl relative">
            {/* Chat Session Selector (conditionally shown) */}
            {showSessionSelector && (
              <div className="absolute top-4 right-4 z-10 w-64">
                <ChatSessionSelector
                  projectId={projectId}
                  activeSessionId={activeSessionId}
                  onSelectSession={handleSelectSession}
                  onCreateSession={handleCreateSession}
                />
              </div>
            )}
            
            <ChatInterface 
              projectId={projectId} 
              onSendMessage={handleSendMessage} 
              welcomeMessage={`Hello! I'm ${project.name}. How can I assist you today?`}
            />
          </div>
        </main>

        {/* Optional: Footer for mobile devices */}
        {isMobile && (
          <footer className="p-2 text-center text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
            Powered by AI Assistant
          </footer>
        )}
      </div>
    </ProtectedRoute>
  );
} 