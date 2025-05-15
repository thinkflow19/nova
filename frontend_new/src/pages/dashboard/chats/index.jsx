import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Plus, 
  MessageSquare, 
  Search, 
  Trash, 
  RefreshCw, 
  AlertCircle, 
  Calendar, 
  ArrowRight, 
  ChevronDown,
  Bot,
  Timer,
  MoreHorizontal,
  CheckCheck
} from 'lucide-react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../utils/auth';
import { API } from '../../../utils/api';
import Button from '../../../components/ui/Button';
import GlassCard from '../../../components/ui/GlassCard';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

export default function ChatHistory() {
  const { user, loading: authLoading } = useAuth({ redirectTo: '/login' });
  
  // State for projects
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  
  // State for chat sessions
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  
  // UI state
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  
  // Deletion state
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  // Add new state variable for success message
  const [successMessage, setSuccessMessage] = useState(null);
  
  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);
  
  useEffect(() => {
    if (selectedProject) {
      loadChatSessions(selectedProject.id);
    } else if (projects.length > 0) {
      // Load all sessions if no specific project is selected
      loadAllChatSessions();
    }
  }, [selectedProject, projects]);
  
  const loadProjects = async () => {
    try {
      setProjectsLoading(true);
      setError(null);
      
      const projectsData = await API.listProjects();
      const projectsList = projectsData.items || projectsData;
      setProjects(projectsList);
      
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load your projects. Please try again.');
    } finally {
      setProjectsLoading(false);
    }
  };
  
  const loadChatSessions = async (projectId) => {
    try {
      setSessionsLoading(true);
      setError(null);
      
      const sessionsData = await API.listChatSessions(projectId);
      setSessions(sessionsData.items || sessionsData);
    } catch (err) {
      console.error(`Error loading chat sessions for project ${projectId}:`, err);
      setError('Failed to load chat sessions. Please try again.');
    } finally {
      setSessionsLoading(false);
    }
  };
  
  const loadAllChatSessions = async () => {
    try {
      setSessionsLoading(true);
      setError(null);
      
      // This would ideally be a single API call, but for now we'll aggregate sessions from all projects
      const allSessions = [];
      
      for (const project of projects) {
        try {
          const sessionsData = await API.listChatSessions(project.id);
          const sessions = sessionsData.items || sessionsData;
          
          // Add project info to each session
          const sessionsWithProject = sessions.map(session => ({
            ...session,
            project: {
              id: project.id,
              name: project.name,
              color: project.color,
              icon: project.icon
            }
          }));
          
          allSessions.push(...sessionsWithProject);
        } catch (err) {
          console.error(`Error loading chat sessions for project ${project.id}:`, err);
        }
      }
      
      setSessions(allSessions);
    } catch (err) {
      console.error('Error loading all chat sessions:', err);
      setError('Failed to load chat sessions. Please try again.');
    } finally {
      setSessionsLoading(false);
    }
  };
  
  const handleDeleteSession = async (sessionId) => {
    if (deleteConfirm !== sessionId) {
      setDeleteConfirm(sessionId);
      return;
    }
    
    try {
      setDeletingId(sessionId);
      await API.deleteChatSession(sessionId);
      
      // Remove from list
      setSessions(sessions.filter(s => s.id !== sessionId));
      setDeleteConfirm(null);
      
      // Show a success message
      setSuccessMessage("Chat history deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting chat session:', err);
      setError('Failed to delete chat session. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };
  
  // Filter sessions based on search query
  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort sessions by date (most recent first)
  const sortedSessions = [...filteredSessions].sort((a, b) => 
    new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)
  );
  
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  if (authLoading) return null; // DashboardLayout handles loading state
  
  return (
    <DashboardLayout>
      <Head>
        <title>Chat History | Nova AI</title>
        <meta name="description" content="View your chat history" />
      </Head>
      
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Chat History</h1>
              <p className="text-text-secondary mt-1">
                View and manage your conversations with AI agents
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-themed pl-10 w-full md:w-64"
                />
              </div>
              
              <Link href={selectedProject ? `/dashboard/bot/${selectedProject.id}` : '/dashboard/bot/new'} passHref>
                <Button variant="default" size="default">
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="relative">
              <Button
                variant="outline"
                className="w-full md:w-72 flex items-center justify-between text-text-secondary hover:text-text-primary hover:border-primary/50"
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                aria-expanded={showProjectDropdown}
                aria-controls="project-dropdown"
              >
                <span className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary/90" />
                  {selectedProject ? selectedProject.name : 'All Agents'}
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${showProjectDropdown ? 'rotate-180' : ''}`} />
              </Button>
              
              {showProjectDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-20 mt-2 w-full md:w-72" 
                  id="project-dropdown"
                >
                  <GlassCard className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {projectsLoading ? (
                      <div className="p-4 text-center text-text-muted">Loading agents...</div>
                    ) : (
                      <ul className="space-y-1">
                        <li>
                          <button
                            onClick={() => { setSelectedProject(null); setShowProjectDropdown(false); }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2
                                        ${!selectedProject ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-hover-glass hover:text-text-primary'}`}
                          >
                            <MessageSquare className="w-4 h-4" /> All Agents
                          </button>
                        </li>
                        {projects.map((project) => (
                          <li key={project.id}>
                            <button
                              onClick={() => { setSelectedProject(project); setShowProjectDropdown(false); }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2
                                          ${selectedProject?.id === project.id ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-hover-glass hover:text-text-primary'}`}
                            >
                              <Bot className="w-4 h-4" /> {project.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </GlassCard>
                </motion.div>
              )}
            </div>
          </div>
          
          {error && (
            <GlassCard className="mb-6 p-4 bg-error-color/10 border-error-color text-error-color flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </GlassCard>
          )}
          
          {successMessage && (
            <GlassCard className="mb-6 p-4 bg-primary/10 border-primary text-primary flex items-start gap-3">
              <CheckCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Success</p>
                <p className="text-sm">{successMessage}</p>
              </div>
            </GlassCard>
          )}
          
          {(sessionsLoading || projectsLoading) && !error && (
            <div className="flex justify-center items-center h-60">
              <LoadingSpinner size="lg" />
            </div>
          )}
          
          {sessionsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : sortedSessions.length === 0 ? (
            <GlassCard gradient className="p-12 text-center">
              <div className="flex flex-col items-center">
                <MessageSquare className="w-16 h-16 text-accent/50 mb-4" />
                <h2 className="text-xl font-bold mb-2">No Chat History</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Start a conversation with an AI agent to see your chat history here.
                </p>
                <Link href={selectedProject ? `/dashboard/bot/${selectedProject.id}` : '/dashboard/bot/new'}>
                  <Button variant="premium" size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Start a New Chat
                  </Button>
                </Link>
              </div>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedSessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <GlassCard className="p-0 h-full flex flex-col overflow-hidden group">
                    <Link href={`/dashboard/bot/${session.project_id}?session=${session.id}`} className="block p-5 flex-grow">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-md font-semibold text-text-primary group-hover:text-primary transition-colors duration-200 line-clamp-2 pr-4">
                          {session.title || 'Untitled Chat'}
                        </h3>
                        <div className="relative -mr-2 -mt-1 flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="p-1.5 h-7 w-7 text-text-muted hover:text-error-color hover:bg-error-color/10 opacity-60 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (deleteConfirm === session.id) {
                                handleDeleteSession(session.id);
                              } else {
                                setDeleteConfirm(session.id);
                                sortedSessions.forEach(s => { if (s.id !== session.id) setDeleteConfirm(prev => prev === s.id ? null : prev); });
                              }
                            }}
                            aria-label={deleteConfirm === session.id ? "Confirm delete" : "Delete chat"}
                          >
                            {deletingId === session.id ? <LoadingSpinner size="xs" /> : <Trash className="w-4 h-4" />}
                          </Button>
                          {deleteConfirm === session.id && deletingId !== session.id && (
                             <p className="absolute right-full top-0 mr-2 text-xs bg-error-color text-white px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                               Click again to confirm
                             </p>
                          )}
                        </div>
                      </div>

                      {session.summary && (
                        <p className="text-sm text-text-secondary mb-3 line-clamp-3">
                          {session.summary}
                        </p>
                      )}
                      
                      {!selectedProject && session.project && (
                        <div className="flex items-center text-xs text-text-muted mb-3">
                          <Bot className="w-4 h-4 mr-1.5 flex-shrink-0" style={{ color: session.project.color || 'var(--primary)' }}/>
                          <span className="truncate">Agent: {session.project.name}</span>
                        </div>
                      )}
                    </Link>
                    
                    <div className="px-5 py-3 border-t border-border-color/50 bg-bg-main/30">
                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{getRelativeTime(session.created_at || session.timestamp)}</span>
                        </div>
                        {session.message_count !== undefined && (
                          <div className="flex items-center gap-1.5">
                             <MessageSquare className="w-3.5 h-3.5" /> 
                             <span>{session.message_count} messages</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 