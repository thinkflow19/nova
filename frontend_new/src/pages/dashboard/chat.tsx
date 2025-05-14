import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  UserCircle, 
  Bot, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown, 
  ArrowLeft,
  ChevronLeft,
  FileText,
  ChevronRight,
  MessageSquare,
  Trash,
  X,
  Menu,
  Settings,
  Plus,
  Check
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
import { Card } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { ChatMessage as ChatMessageComponent, TypingIndicator, EmptyChatState } from '../../components/ui/ChatMessage';
import { AutoResizeTextarea } from '../../components/ui/AutoResizeTextarea';
import type { Project, ChatSession, ChatMessage as ChatMessageType } from '../../types';

// Message animations
const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export default function DashboardChat() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // URL params
  const { session: sessionId, project: projectId } = router.query;
  
  // Session state
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [chatError, setChatError] = useState<string | null>(null);
  
  // Projects and sessions state
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(true);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(true);
  
  // UI state
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showProjectSelector, setShowProjectSelector] = useState<boolean>(false);
  const [showDebugConsole, setShowDebugConsole] = useState<boolean>(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Custom logger function
  const debugLog = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = data 
      ? `${timestamp}: ${message} ${JSON.stringify(data)}`
      : `${timestamp}: ${message}`;
    
    console.log(logMessage);
    setDebugLogs(prev => [...prev.slice(-19), logMessage]);
  };

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
  
  // Auto scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
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
  
  // Focus title input when editing
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);
  
  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Focus input on session change or new session
  useEffect(() => {
    if (!isInitializing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInitializing, currentSession?.id]);
  
  const loadProjects = async (): Promise<void> => {
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
  
  const loadProjectById = async (id: string): Promise<void> => {
    try {
      const project = await getProject(id);
      setCurrentProject(project);
      loadSessions(id);
    } catch (err) {
      console.error(`Error loading project ${id}:`, err);
    }
  };
  
  const loadSessions = async (projectId: string): Promise<void> => {
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
  
  const loadExistingSession = async (id: string): Promise<void> => {
    try {
      setIsInitializing(true);
      setChatError(null);
      
      // Load messages
      const messages = await getChatMessages(id);
      setMessages(messages);
      
      // Get session details
      const session = await getSingleChatSession(id);
      setCurrentSession(session);
      setSessionTitle(session.title || 'Untitled Chat');
      
      // Load project if needed
      if (session.project_id && (!currentProject || currentProject.id !== session.project_id)) {
        await loadProjectById(session.project_id);
      }
      
    } catch (err) {
      console.error(`Error loading messages for session ${id}:`, err);
      setChatError('Failed to load chat messages. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };
  
  const startNewSession = async (): Promise<void> => {
    if (!currentProject) return;
    
    try {
      setIsInitializing(true);
      setChatError(null);
      
      const title = 'New Chat';
      const session = await initChatSession(currentProject.id, title);
      
      setCurrentSession(session);
      setSessionTitle(title);
      setMessages([]);
      
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
  
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async (e?: FormEvent): Promise<void> => {
    if (e) e.preventDefault();
    
    if (!input.trim() || !currentSession || isProcessing) return;
    
    // Make sure we have project ID
    if (!currentSession.project_id && !currentProject?.id) {
      setChatError('Unable to send message: missing project information. Please reload the page.');
      debugLog('Missing project ID for message send');
      return;
    }
    
    try {
      setIsProcessing(true);
      setChatError(null);
      
      // Optimistically add user message
      const userMessage: ChatMessageType = {
        id: `temp-${Date.now()}`,
        session_id: currentSession.id,
        content: input,
        role: 'user',
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      
      // Ensure we have project_id
      const projectId = currentSession.project_id || currentProject?.id;
      debugLog('Sending message with project_id', { projectId, sessionId: currentSession.id });
      
      // Send message to API
      const response = await sendChatMessage(
        currentSession.id, 
        input,
        projectId
      );
      
      debugLog('Message sent successfully', { messageId: response.id });
      
      // Update with official message from server
      setMessages(prev => {
        // Replace temp message with official one
        const withoutTemp = prev.filter(m => m.id !== userMessage.id);
        return [...withoutTemp, response];
      });
      
      // Reload all messages to ensure we have everything
      await loadExistingSession(currentSession.id);
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      debugLog('Error sending message', { error: err.message || err });
      
      // Get detailed error message
      let errorMessage = 'Failed to send message. Please try again.';
      if (err?.message) {
        errorMessage = err.message;
      }
      
      setChatError(errorMessage);
      
      // Remove the optimistic message
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setInput(e.target.value);
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const toggleSidebar = (): void => {
    setShowSidebar(!showSidebar);
  };
  
  const toggleMobileMenu = (): void => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const startTitleEdit = (): void => {
    setIsEditingTitle(true);
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSessionTitle(e.target.value);
  };
  
  const handleTitleSave = async (): Promise<void> => {
    if (!currentSession) return;
    
    const title = sessionTitle.trim() || 'Untitled Chat';
    
    try {
      // Only update if title has changed
      if (title !== currentSession.title) {
        await updateChatSession(currentSession.id, { title });
        
        // Update local state
        setCurrentSession({
          ...currentSession,
          title,
        });
        
        // Update in sessions list
        setSessions(prev =>
          prev.map(s =>
            s.id === currentSession.id ? { ...s, title } : s
          )
        );
      }
    } catch (err) {
      console.error('Error updating session title:', err);
    } finally {
      setIsEditingTitle(false);
    }
  };
  
  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Revert to previous title and exit edit mode
      setSessionTitle(currentSession?.title || 'Untitled Chat');
      setIsEditingTitle(false);
    }
  };
  
  const handleDeleteSession = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this chat?')) return;
    
    try {
      await deleteChatSession(id);
      
      // Remove from sessions list
      setSessions(prev => prev.filter(s => s.id !== id));
      
      // If current session was deleted, start a new one
      if (currentSession?.id === id) {
        // Clear current session
        setCurrentSession(null);
        setMessages([]);
        
        // Start new session if we have a project
        if (currentProject) {
          startNewSession();
        }
      }
    } catch (err) {
      console.error(`Error deleting session ${id}:`, err);
    }
  };
  
  const selectProject = (project: Project): void => {
    // Only switch if different project
    if (project.id !== currentProject?.id) {
      setCurrentProject(project);
      loadSessions(project.id);
      
      // Clear current session
      setCurrentSession(null);
      setMessages([]);
      
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
  
  const handleNewChat = (): void => {
    if (currentProject) {
      startNewSession();
    }
  };
  
  const selectSession = (session: ChatSession): void => {
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
        <title>{sessionTitle ? `${sessionTitle} | Nova AI` : 'Chat | Nova AI'}</title>
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
                  {isEditingTitle ? (
                    <div className="flex items-center">
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={sessionTitle}
                        onChange={handleTitleChange}
                        onBlur={handleTitleSave}
                        onKeyDown={handleTitleKeyDown}
                        className="bg-background border border-border rounded-md px-2 py-1 text-sm font-medium w-60 focus:outline-none focus:ring-1 focus:ring-accent/70 shadow-sm"
                        maxLength={50}
                      />
                      <button 
                        onClick={handleTitleSave}
                        className="ml-2 text-accent hover:text-accent/80"
                        aria-label="Save title"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <h1 
                      className="text-lg font-medium cursor-pointer hover:text-accent transition-colors"
                      onClick={startTitleEdit}
                    >
                      {sessionTitle || 'Untitled Chat'}
                    </h1>
                  )}
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
        
        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={toggleMobileMenu}></div>
              <div className="fixed top-0 left-0 bottom-0 w-72 bg-card border-r border-border p-4 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Chat Sessions</h2>
                  <button 
                    onClick={toggleMobileMenu}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
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
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    New Chat
                  </Button>
                </div>
                
                <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
                  {sessionsLoading ? (
                    <div className="py-4 text-center">
                      <Loader size="sm" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="py-4 text-center text-muted-foreground">
                      <p>No chat sessions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {sessions.map(session => (
                        <div 
                          key={session.id}
                          className={`flex items-center justify-between rounded-md p-2 cursor-pointer ${
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
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Delete chat"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
        
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
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
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
                  className="flex-1 overflow-y-auto px-4 py-6 bg-background"
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
                  
                  {messages.length === 0 ? (
                    <EmptyChatState />
                  ) : (
                    <div className="space-y-4 max-w-4xl mx-auto">
                      <AnimatePresence initial={false}>
                        {messages.map(message => (
                          <ChatMessageComponent key={message.id} message={message} />
                        ))}
                      </AnimatePresence>
                      {isProcessing && <TypingIndicator />}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                  
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
                
                {/* Input area */}
                <div className="border-t border-border bg-card py-4 px-4">
                  <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                      <div className="relative flex-1">
                        <AutoResizeTextarea
                          ref={inputRef}
                          value={input}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder="Type your message..."
                          className="pr-10 shadow-sm"
                          size="sm"
                          maxRows={5}
                          disabled={isProcessing || !currentSession}
                        />
                      </div>
                      <Button 
                        type="submit"
                        disabled={!input.trim() || isProcessing || !currentSession}
                        isLoading={isProcessing}
                        className="flex-shrink-0"
                        variant="default"
                        size="default"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                    <div className="mt-2 text-xs text-muted-foreground text-center">
                      <span>Press <kbd className="px-2 py-0.5 rounded bg-muted text-xs mx-1">Enter</kbd> to send, <kbd className="px-2 py-0.5 rounded bg-muted text-xs mx-1">Shift+Enter</kbd> for new line</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 