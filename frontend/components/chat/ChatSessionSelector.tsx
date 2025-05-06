import React, { useState, useEffect } from 'react';
import { FiClock, FiPlus, FiTrash, FiFolder, FiEdit } from 'react-icons/fi';
import API from '../../utils/api';
import { fetchAPI } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { ChatSession } from '../../utils/types';

interface ChatSessionSelectorProps {
  projectId: string;
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
  className?: string;
}

export default function ChatSessionSelector({
  projectId,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  className = ''
}: ChatSessionSelectorProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchSessions() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await API.listChatSessions(projectId);
        if (response && Array.isArray(response)) {
          const sortedSessions = response.sort((a, b) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
          setSessions(sortedSessions);
        } else {
          setError('Invalid response format from server');
        }
      } catch (err) {
        console.error('Error fetching chat sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chat sessions');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (projectId) {
      fetchSessions();
    }
  }, [projectId]);
  
  async function handleDeleteSession(sessionId: string, e: React.MouseEvent) {
    e.stopPropagation(); // Prevent triggering the parent onClick
    
    if (!window.confirm('Are you sure you want to delete this chat session?')) {
      return;
    }
    
    try {
      await fetchAPI(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' });
      setSessions(sessions.filter(s => s.id !== sessionId));
      
      // If the deleted session was active, notify parent
      if (activeSessionId === sessionId) {
        onCreateSession();
      }
    } catch (err) {
      console.error('Error deleting session:', err);
      alert('Failed to delete session');
    }
  }
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <FiFolder className="mr-2" /> Chat Sessions
        </h3>
        <button 
          onClick={onCreateSession}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          title="New chat session"
        >
          <FiPlus />
        </button>
      </div>
      
      <div className="overflow-y-auto max-h-96">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Loading sessions...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            {error}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No chat sessions found
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {sessions.map(session => (
              <li 
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 flex justify-between items-center group ${
                  activeSessionId === session.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    activeSessionId === session.id 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {session.title || 'Untitled Chat'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                    <FiClock className="mr-1" size={12} />
                    {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                  </p>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    title="Delete session"
                  >
                    <FiTrash size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 