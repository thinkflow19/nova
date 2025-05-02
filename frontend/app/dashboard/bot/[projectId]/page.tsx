'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import ChatInterface from '../../../../components/chat/ChatInterface';
import API from '../../../../utils/api';
// import { useProject } from '../../../../hooks/useProject';
import { Spinner } from '../../../../components/ui';

export default function BotPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  // Placeholder: Add hook to fetch project data based on projectId
  // const { project, isLoading: projectLoading, error: projectError } = useProject(projectId);
  const projectLoading = false; // Placeholder
  const projectError = null; // Placeholder
  const project = { name: 'Demo Bot' }; // Placeholder

  // Handler function to pass to ChatInterface
  const handleSendMessage = async (pid: string, message: string): Promise<string> => {
    try {
      console.log(`Sending message to backend for project ${pid}:`, message);
      // Call the backend chat endpoint via API utility
      // We need to add this API.chat function to utils/api.ts next
      const response = await API.chat(pid, message); 
      return response.reply; // Assuming backend response has a 'reply' field
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      // Rethrow or return a specific error message to be displayed in the chat
      throw new Error(error instanceof Error ? error.message : "Failed to send message");
    }
  };

  if (projectLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  if (projectError) {
    return (
      <ProtectedRoute>
        <div className="text-center text-red-500 p-8">Error loading bot: {projectError}</div>
      </ProtectedRoute>
    );
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <div className="text-center text-gray-500 p-8">Bot not found.</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Chat with {project.name}</h1>
          {/* Optional: Link back to dashboard? */}
          {/* <Link href="/dashboard">Back to Dashboard</Link> */}
        </header>

        {/* Main Chat Area - Full Height */}
        <main className="flex-1 overflow-hidden p-4">
          {/* Render ChatInterface, taking full height */}
          <div className="h-full">
             <ChatInterface projectId={projectId} onSendMessage={handleSendMessage} />
          </div>
        </main>

      </div>
    </ProtectedRoute>
  );
} 