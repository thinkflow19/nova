import { useState, useEffect, useCallback } from 'react';
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
  MoreHorizontal
} from 'lucide-react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import type { Project, ChatSession } from '../../../types/index';
import { listProjects, listChatSessions, deleteChatSession } from '../../../utils/api';
import Button from '../../../components/ui/Button';
import GlassCard from '../../../components/ui/GlassCard';
import { SkeletonLoader } from '../../../components/ui/LoadingSpinner';

export default function ChatHistory() {
  const { user, loading: authLoading } = useAuth();
  
  // State for projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(true);
  
  // State for chat sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);
  
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showProjectDropdown, setShowProjectDropdown] = useState<boolean>(false);
  
  // Deletion state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const loadAllChatSessions = useCallback(async (): Promise<void> => {
    try {
      setSessionsLoading(true);
      setError(null);
      const allSessions: ChatSession[] = [];
      for (const project of projects) {
        try {
          const sessions = await listChatSessions(project.id);
          allSessions.push(...sessions);
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
  }, [projects]);
  
  const loadProjects = useCallback(async (): Promise<void> => {
    try {
      setProjectsLoading(true);
      setError(null);
      const projectsList = await listProjects();
      setProjects(projectsList);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load your projects. Please try again.');
    } finally {
      setProjectsLoading(false);
    }
  }, []);
  
  const loadChatSessions = useCallback(async (projectId: string): Promise<void> => {
    try {
      setSessionsLoading(true);
      setError(null);
      const sessions = await listChatSessions(projectId);
      setSessions(sessions);
    } catch (err) {
      console.error(`Error loading chat sessions for project ${projectId}:`, err);
      setError('Failed to load chat sessions. Please try again.');
    } finally {
      setSessionsLoading(false);
    }
  }, []);
  
  const handleDeleteSession = async (sessionId: string): Promise<void> => {
    if (deleteConfirm !== sessionId) {
      setDeleteConfirm(sessionId);
      return;
    }
    
    try {
      setDeletingId(sessionId);
      await deleteChatSession(sessionId);
      
      // Remove from list
      setSessions(sessions.filter(s => s.id !== sessionId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting chat session:', err);
      setError('Failed to delete chat session. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };
  
  // Filter sessions based on search query
  const filteredSessions = sessions.filter((session) => 
    session.title && session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort sessions by date (most recent first)
  const sortedSessions = [...filteredSessions].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  const getRelativeTime = (timestamp: string): string => {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
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
  
  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user, loadProjects]);
  
  useEffect(() => {
    if (selectedProject) {
      loadChatSessions(selectedProject.id);
    } else if (projects.length > 0) {
      loadAllChatSessions();
    }
  }, [selectedProject, projects, loadChatSessions, loadAllChatSessions]);
  
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
              <h1 className="text-2xl font-bold premium-text-gradient">Chat History</h1>
              <p className="text-muted-foreground mt-1">
                View and manage your conversations with AI agents
              </p>
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-premium pl-9 w-full md:w-60"
                />
              </div>
              
              <Link href={`/chat${selectedProject ? `?project=${selectedProject.id}` : ''}`}>
                <Button variant="primary" className="whitespace-nowrap">
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Project selector */}
          <div className="mb-6">
            <div className="relative">
              <Button
                variant="outline"
                className="w-full md:w-auto flex items-center justify-between"
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              >
                <span className="flex items-center">
                  <Bot className="w-4 h-4 mr-2" />
                  {selectedProject ? selectedProject.name : 'All Agents'}
                </span>
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              
              {showProjectDropdown && (
                <div className="absolute z-10 mt-2 w-full md:w-64 rounded-md shadow-lg">
                  <GlassCard className="p-1 max-h-64 overflow-y-auto">
                    {projectsLoading ? (
                      <div className="flex justify-center py-4">
                        <SkeletonLoader width="w-8" height="h-8" />
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">No agents found</p>
                        <Link href="/dashboard/agents/new">
                          <Button variant="outline" className="mt-2 text-xs" size="sm">
                            Create your first agent
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="py-1">
                        <button
                          className={`w-full text-left px-4 py-2 text-sm rounded-md hover:bg-card-foreground/10 ${
                            !selectedProject ? 'bg-accent/10 text-accent' : ''
                          }`}
                          onClick={() => {
                            setSelectedProject(null);
                            setShowProjectDropdown(false);
                          }}
                        >
                          All Agents
                        </button>
                        
                        {projects.map((project) => (
                          <button
                            key={project.id}
                            className={`w-full text-left px-4 py-2 text-sm rounded-md hover:bg-card-foreground/10 ${
                              selectedProject?.id === project.id ? 'bg-accent/10 text-accent' : ''
                            }`}
                            onClick={() => {
                              setSelectedProject(project);
                              setShowProjectDropdown(false);
                            }}
                          >
                            {project.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="bg-destructive/10 border border-destructive text-foreground rounded-lg p-4 mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p>{error}</p>
                <Button
                  onClick={() => selectedProject ? loadChatSessions(selectedProject.id) : loadAllChatSessions()}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {/* Chat sessions list */}
          {sessionsLoading ? (
            <div className="flex justify-center py-12">
              <SkeletonLoader width="w-12" height="h-12" />
            </div>
          ) : sortedSessions.length === 0 ? (
            <GlassCard gradient className="p-12 text-center">
              <div className="flex flex-col items-center">
                <MessageSquare className="w-16 h-16 text-accent/50 mb-4" />
                <h2 className="text-xl font-bold mb-2">No Chat History</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Start a conversation with an AI agent to see your chat history here.
                </p>
                <Link href={`/chat${selectedProject ? `?project=${selectedProject.id}` : ''}`}>
                  <Button variant="primary" size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Start a New Chat
                  </Button>
                </Link>
              </div>
            </GlassCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedSessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className="h-full overflow-hidden">
                    <Link 
                      href={`/chat?session=${session.id}`}
                      className="block h-full"
                    >
                      <div className="p-5 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                          {/* Project info (if in all agents view) */}
                          {!selectedProject && session.project && (
                            <div className="flex items-center">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-2"
                                style={{ backgroundColor: session.project.color || '#8B5CF6' }}
                              >
                                <span className="text-white text-xs">
                                  {session.project.icon || <Bot className="w-3 h-3" />}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                {session.project.name}
                              </span>
                            </div>
                          )}
                          
                          {/* Session time */}
                          <div className="flex items-center text-xs text-muted-foreground ml-auto">
                            <Timer className="w-3 h-3 mr-1" />
                            {getRelativeTime(session.created_at)}
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-medium mb-2 truncate">
                          {session.title || 'Untitled Chat'}
                        </h3>
                        
                        {session.last_message && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {session.last_message}
                          </p>
                        )}
                        
                        <div className="mt-auto pt-3 flex items-center justify-between">
                          <div className="text-xs text-muted-foreground flex items-center">
                            <MessageSquare className="w-3.5 h-3.5 mr-1" />
                            {session.message_count || '—'} messages
                          </div>
                          
                          <div className="flex items-center text-accent">
                            <span className="text-xs">Continue</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </div>
                        </div>
                      </div>
                    </Link>
                    
                    {/* Delete button (absolute positioned at top right with stopPropagation) */}
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className={`p-1.5 rounded-full bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors ${
                          deleteConfirm === session.id ? 'text-destructive' : 'text-muted-foreground'
                        }`}
                      >
                        {deletingId === session.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash className="w-4 h-4" />
                        )}
                      </button>
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