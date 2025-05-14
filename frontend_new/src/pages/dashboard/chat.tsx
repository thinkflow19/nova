import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  MessageSquare,
  Plus,
  RefreshCw,
  Settings,
  Trash,
  X
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import {
  listChatSessions,
  getChatMessages,
  initChatSession,
  sendChatMessage,
  listProjects,
  getProject,
  deleteChatSession,
  updateChatSession
} from '../../utils/api';
import Button from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { EmptyChatState } from '../../components/ui/ChatMessage';
import ChatInterface from '../../components/chat/ChatInterface';
import type { Project, ChatSession } from '../../types';

export default function DashboardChat() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // URL params
  const { session: sessionId, project: projectId } = router.query;
  
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(true);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showProjectSelector, setShowProjectSelector] = useState<boolean>(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugConsole, setShowDebugConsole] = useState<boolean>(false);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  
  // Refs
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Load projects
  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);
  
  // Set current project when projectId changes or projects load
  useEffect(() => {
    if (projectId && projects.length > 0 && typeof projectId === 'string') {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
        loadSessions(projectId);
      } else {
        // If project not found in list, fetch it directly
        loadProjectById(projectId);
      }
    } else if (projects.length > 0 && !projectId && !currentProject) {
      // Default to first project if no projectId specified
      setCurrentProject(projects[0]);
      loadSessions(projects[0].id);
    }
  }, [projectId, projects]);
  
  // Initialize chat when sessionId or currentProject changes
  useEffect(() => {
    if (sessionId && typeof sessionId === 'string') {
      loadExistingSession(sessionId);
    } else if (currentProject && !currentSession) {
      startNewSession();
    }
  }, [sessionId, currentProject, router.isReady]);
  
  // Track scroll position to show/hide scroll button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const isScrolledUp = container.scrollTop < container.scrollHeight - container.clientHeight - 100;
      setShowScrollButton(isScrolledUp);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Helper functions
  const debugLog = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = data 
      ? `${timestamp}: ${message} ${JSON.stringify(data)}`
      : `${timestamp}: ${message}`;
    
    console.log(logMessage);
    setDebugLogs(prev => [...prev.slice(-19), logMessage]);
  };
  
  const loadProjects = async () => {
    try {
      setProjectsLoading(true);
      debugLog('Loading projects');
      const projects = await listProjects();
      setProjects(projects);
      debugLog('Projects loaded', { count: projects.length });
    } catch (err) {
      console.error('Error loading projects:', err);
      debugLog('Error loading projects', err);
    } finally {
      setProjectsLoading(false);
    }
  };
  
  const loadProjectById = async (id: string) => {
    try {
      const project = await getProject(id);
      setCurrentProject(project);
      loadSessions(id);
    } catch (err) {
      console.error(`Error loading project ${id}:`, err);
    }
  };
  
  const loadSessions = async (projectId: string) => {
    try {
      setSessionsLoading(true);
      const sessions = await listChatSessions(projectId);
      setSessions(sessions);
    } catch (err) {
      console.error(`Error loading sessions for project ${projectId}:`, err);
    } finally {
      setSessionsLoading(false);
    }
  };
  
  const loadExistingSession = async (id: string) => {
    try {
      setIsInitializing(true);
      setChatError(null);
      
      // Get session details
      const session = await getSingleChatSession(id);
      setCurrentSession(session);
      
      // Load project if needed
      if (session.project_id && (!currentProject || currentProject.id !== session.project_id)) {
        await loadProjectById(session.project_id);
      }
    } catch (err) {
      console.error(`Error loading session ${id}:`, err);
      setChatError('Failed to load chat session. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };
  
  const startNewSession = async () => {
    if (!currentProject) return;
    
    try {
      setIsInitializing(true);
      setChatError(null);
      
      const title = 'New Chat';
      const session = await initChatSession(currentProject.id, title);
      
      setCurrentSession(session);
      
      // Update URL without reloading page
      router.replace(
        {
          pathname: router.pathname,
          query: { session: session.id, project: currentProject.id },
        },
        undefined,
        { shallow: true }
      );
    } catch (err) {
      console.error('Error creating new session:', err);
      setChatError('Failed to create a new chat session. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };
  
  const scrollToBottom = () => {
    messagesContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };
  
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleDeleteSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return;
    
    try {
      await deleteChatSession(id);
      
      // Remove from sessions list
      setSessions(prev => prev.filter(s => s.id !== id));
      
      // If current session was deleted, start a new one
      if (currentSession?.id === id) {
        // Clear current session
        setCurrentSession(null);
        
        // Start new session if we have a project
        if (currentProject) {
          startNewSession();
        }
      }
    } catch (err) {
      console.error(`Error deleting session ${id}:`, err);
    }
  };
  
  const selectProject = (project: Project) => {
    // Only switch if different project
    if (project.id !== currentProject?.id) {
      setCurrentProject(project);
      loadSessions(project.id);
      
      // Clear current session
      setCurrentSession(null);
      
      // Update URL
      router.replace(
        {
          pathname: router.pathname,
          query: { project: project.id },
        },
        undefined,
        { shallow: true }
      );
    }
    
    setShowProjectSelector(false);
  };
  
  const handleNewChat = () => {
    if (currentProject) {
      startNewSession();
    }
  };
  
  const selectSession = (session: ChatSession) => {
    // Only load if different session
    if (session.id !== currentSession?.id) {
      router.replace(
        {
          pathname: router.pathname,
          query: { session: session.id, project: currentProject?.id },
        },
        undefined,
        { shallow: true }
      );
    }
    
    // Close mobile menu
    setMobileMenuOpen(false);
  };
  
  const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    // For older dates
    return date.toLocaleDateString();
  };

  const getSingleChatSession = async (id: string): Promise<ChatSession> => {
    try {
      // Try to extract session from one of the existing sessions
      const existingSession = sessions.find(s => s.id === id);
      if (existingSession) {
        return existingSession;
      }
      
      // If the session isn't in our current list, we'll need to get it
      // This might not be the most efficient solution but will work for now
      const allSessions = await listChatSessions(id);
      const targetSession = Array.isArray(allSessions) 
        ? allSessions.find(s => s.id === id) 
        : null;
        
      if (targetSession) {
        return targetSession;
      }
      
      throw new Error('Session not found');
    } catch (error) {
      console.error('Error getting chat session:', error);
      // Return a minimal session object if all else fails
      return {
        id,
        title: 'Chat Session',
        project_id: currentProject?.id || '',
        user_id: user?.id || ''
      };
    }
  };

  // Block rendering during authentication
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <Head>
        <title>{currentSession?.title ? `${currentSession.title} | Nova AI` : 'Chat | Nova AI'}</title>
        <meta name="description" content="Chat with your AI assistants" />
      </Head>
      
      <div className="flex h-screen flex-col">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/90 backdrop-blur-sm p-4 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMobileMenu}
                className="mr-2 block lg:hidden text-muted-foreground hover:text-foreground"
                aria-label="Toggle mobile menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="flex items-center">
                <div 
                  className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/80 text-white shadow-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                </div>
                
                <div className="ml-3">
                  <h1 
                    className="text-lg font-medium"
                  >
                    {currentSession?.title || 'Untitled Chat'}
                  </h1>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDebugConsole(!showDebugConsole)}
                className="flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-full transition-colors"
                aria-label="Toggle debug console"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-full transition-colors"
                aria-label={showSidebar ? "Hide sidebar" : "Show sidebar"}
              >
                {showSidebar ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </button>
              
              <button
                onClick={handleNewChat}
                className="flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-full transition-colors"
                aria-label="New chat"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {showSidebar && (
            <div className="hidden lg:block w-64 border-r border-border bg-card overflow-y-auto">
              <div className="p-4">
                <div className="mb-4">
                  <div className="relative">
                    <button
                      onClick={() => setShowProjectSelector(!showProjectSelector)}
                      className="flex items-center justify-between w-full p-2 border border-border rounded-md bg-background text-sm font-medium"
                    >
                      <div className="flex items-center">
                        <span>{currentProject?.name || 'Select Project'}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                    
                    {showProjectSelector && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-1 border border-border rounded-md bg-card shadow-lg">
                        {projects.map(project => (
                          <button
                            key={project.id}
                            className={`flex items-center w-full p-2 text-sm hover:bg-muted text-left ${
                              currentProject?.id === project.id ? 'bg-accent/10 text-accent' : ''
                            }`}
                            onClick={() => selectProject(project)}
                          >
                            {project.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <Button 
                    onClick={handleNewChat}
                    className="w-full"
                    variant="default"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>
                </div>
                
                <div className="space-y-1">
                  {sessionsLoading ? (
                    <div className="py-4 text-center">
                      <Loader size="sm" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="py-4 text-center text-muted-foreground">
                      <p>No chat sessions yet</p>
                    </div>
                  ) : (
                    <>
                      {sessions.map(session => (
                        <div 
                          key={session.id}
                          className={`flex items-center justify-between rounded-md p-2 cursor-pointer group ${
                            currentSession?.id === session.id 
                              ? 'bg-accent/10 text-accent' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className="flex-1 min-w-0" onClick={() => selectSession(session)}>
                            <div className="font-medium truncate">
                              {session.title || 'Untitled Chat'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getRelativeTime(session.updated_at || session.created_at || '')}
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                            aria-label="Delete chat"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Chat area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {isInitializing ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader size="lg" />
              </div>
            ) : (
              <>
                {/* Debug console */}
                {showDebugConsole && (
                  <div className="relative border-b border-border bg-background/95 p-2 backdrop-blur-sm text-xs font-mono text-muted-foreground">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-xs font-semibold">Debug Console</h3>
                      <div>
                        <button 
                          onClick={() => setDebugLogs([])} 
                          className="text-xs text-muted-foreground hover:text-accent mr-2"
                        >
                          Clear
                        </button>
                        <button 
                          onClick={() => setShowDebugConsole(false)}
                          className="text-xs text-muted-foreground hover:text-accent"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                    
                    <div className="overflow-auto max-h-40">
                      {debugLogs.length === 0 ? (
                        <div className="text-center py-2">No logs yet</div>
                      ) : (
                        <div className="space-y-1">
                          {debugLogs.map((log, i) => (
                            <div key={i} className="py-1 border-t border-border/30 first:border-t-0">
                              {log}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="text-xs">
                        <span className="text-accent-foreground">Session:</span> {currentSession?.id || 'None'}
                      </div>
                      <div className="text-xs">
                        <span className="text-accent-foreground">Project:</span> {currentProject?.id || 'None'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto px-4 py-2 bg-background"
                >
                  {chatError && (
                    <div className="mb-6 mx-auto max-w-2xl p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 flex items-center shadow-sm">
                      <AlertCircle className="mr-3 h-5 w-5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{chatError}</p>
                        <button 
                          onClick={() => {
                            setChatError(null);
                            currentSession ? loadExistingSession(currentSession.id) : startNewSession();
                          }}
                          className="text-sm underline mt-1 hover:text-destructive/80"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Chat Interface Component */}
                  <div className="h-full">
                    {currentSession && currentProject ? (
                      <ChatInterface
                        projectId={currentProject.id}
                        sessionId={currentSession.id}
                        onSendMessage={async (pid: string, message: string): Promise<string | AsyncIterable<string>> => {
                          // Use the existing sendMessage functionality but adapt it to the interface
                          if (!currentSession) return "Error: No active session";
                          
                          try {
                            setIsProcessing(true);
                            
                            // Send message
                            const result = await sendChatMessage(
                              currentSession.id,
                              message,
                              pid
                            );
                            
                            // Return the response content for direct display 
                            if (result && typeof result === 'object' && 'content' in result) {
                              return result.content as string;
                            } else {
                              // Fallback to just returning success if no proper content
                              return "Message sent successfully";
                            }
                          } catch (err) {
                            console.error('Error in handleSendMessage:', err);
                            return err instanceof Error 
                              ? `Error: ${err.message}` 
                              : "An error occurred while sending the message";
                          } finally {
                            setIsProcessing(false);
                          }
                        }}
                        welcomeMessage={`Hello! I'm your AI assistant. How can I help you today?`}
                      />
                    ) : (
                      <EmptyChatState />
                    )}
                  </div>
                  
                  {showScrollButton && (
                    <button
                      className="fixed bottom-24 right-8 p-2 bg-accent text-white rounded-full shadow-lg hover:bg-accent/90 transition-all z-10"
                      onClick={scrollToBottom}
                      aria-label="Scroll to bottom"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 