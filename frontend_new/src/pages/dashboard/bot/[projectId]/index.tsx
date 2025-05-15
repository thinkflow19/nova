import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, UserCircle, Bot, AlertCircle, RefreshCw, ChevronDown, FileText, MessageSquare, Settings, ArrowLeft, Plus, Trash, Clock, Edit3, Menu, X, Search, ExternalLink, LogOut, RefreshCcw, Paperclip, ChevronUp } from 'lucide-react';
import DashboardLayout from '../../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../../contexts/AuthContext';
import { API } from '../../../../utils/api';
import Button from '../../../../components/ui/Button';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import type { Project, ChatSession, ChatMessage as ChatMessageTypeFromTypes, ApiResponse } from '../../../../types';
import { ChatMessage as ChatMessageComponent } from '../../../../components/ui/ChatMessage';

// Extended ChatMessage interface for UI state, building upon the base type from types.ts
interface ChatMessage extends ChatMessageTypeFromTypes {
  isLoading?: boolean;
  error?: string; 
}

// Renamed Empty state component
interface WelcomeChatScreenProps {
  userName?: string;
  agentName?: string;
  onPromptClick?: (prompt: string) => void;
  onRefreshPrompts?: () => void;
}

const WelcomeChatScreen = ({ userName, agentName, onPromptClick, onRefreshPrompts }: WelcomeChatScreenProps) => {
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${userName || 'Explorer'}`;
    if (hour < 18) return `Good afternoon, ${userName || 'Explorer'}`;
    return `Good evening, ${userName || 'Explorer'}`;
  };

  const prompts = [
    { title: 'Explain this concept in simple terms' },
    { title: 'Brainstorm ideas for a new project' },
    { title: 'Draft a polite refusal email' },
    { title: 'Summarize the attached document' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 md:p-8 bg-bg-panel text-text-main">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "circOut" }}
        className="relative mb-8"
      >
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/70 to-accent/70 flex items-center justify-center shadow-2xl ring-4 ring-bg-panel">
          <Bot className="w-14 h-14 text-primary-foreground opacity-90" /> 
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-2xl animate-pulse-slow opacity-50"></div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: "circOut" }}
        className="text-3xl md:text-4xl font-bold text-text-primary mb-2"
      >
        {greeting()}
      </motion.h1>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: "circOut" }}
        className="text-xl md:text-2xl text-primary mb-4"
      >
        Ready to chat{agentName ? ` with ${agentName}` : ''}?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4, ease: "circOut" }}
        className="text-sm text-text-muted mb-10 max-w-md"
      >
        Select a suggested prompt or type your message below to begin interacting with your AI assistant.
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl mb-8">
        {prompts.map((prompt, index) => (
          <motion.button
            key={prompt.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.07, duration: 0.3, ease: "circOut" }}
            onClick={() => onPromptClick && onPromptClick(prompt.title)}
            className={`text-left p-4 bg-bg-main hover:bg-hover-glass rounded-xl shadow-lg border border-border-color 
                        hover:border-primary/60 transition-all duration-200 ease-in-out group 
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-panel`}
          >
            <span className="text-sm font-medium text-text-secondary group-hover:text-primary transition-colors duration-150">{prompt.title}</span>
          </motion.button>
        ))}
      </div>
      {onRefreshPrompts && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4, ease: "circOut" }}
          onClick={onRefreshPrompts}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> Try other suggestions
        </motion.button>
      )}
    </div>
  );
};

export default function BotChat() {
  console.log("BotChat component rendering"); // Test log
  const router = useRouter();
  const { projectId } = router.query;
  const { user, loading: authLoading, signOut } = useAuth(); // Changed logout to signOut
  
  const [project, setProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState<boolean>(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(true);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null); // Page-level error
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [sessionSearchTerm, setSessionSearchTerm] = useState<string>("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null); // For delete confirmation

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId || !user) return;
      try {
        setIsLoadingProject(true);
        setError(null);
        const projectData = await API.getProject(projectId as string);
        setProject(projectData);
      } catch (err) {
        console.error('Failed to load project:', err);
        setError(`Failed to load agent data. ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoadingProject(false);
      }
    };
    loadProject();
  }, [projectId, user]);
  
  useEffect(() => {
    const loadSessions = async () => {
      if (!projectId || !user) return;
      try {
        setIsLoadingSessions(true);
        const sessionsData: ChatSession[] = await API.listChatSessions(projectId as string);
        const sortedSessionsData = [...sessionsData].sort(
          (a, b) => 
            new Date(b.updated_at || b.created_at || 0).getTime() - 
            new Date(a.updated_at || a.created_at || 0).getTime()
        );
        setSessions(sortedSessionsData);
        if (sortedSessionsData.length > 0 && !currentSession) {
           setCurrentSession(sortedSessionsData[0]);
        }
      } catch (err) {
        console.error('Failed to load chat sessions:', err);
        setError('Failed to load chat sessions. Please refresh the page and try again.');
      } finally {
        setIsLoadingSessions(false);
      }
    };
    loadSessions();
  }, [projectId, user, currentSession]);
  
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentSession) return;
      try {
        setIsLoadingMessages(true);
        const messagesDataFromAPI: ChatMessageTypeFromTypes[] = await API.getChatMessages(currentSession.id);
        setMessages(
          messagesDataFromAPI.map((apiMsg): ChatMessage => {
            const message: ChatMessage = {
              id: apiMsg.id,
              session_id: apiMsg.session_id,
              content: apiMsg.content,
              role: apiMsg.role,
              created_at: apiMsg.created_at || new Date().toISOString(),
              ...(apiMsg.metadata && { metadata: apiMsg.metadata }),
            };
            return message;
          })
        );
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError('Failed to load chat history. Please refresh and try again.');
      } finally {
        setIsLoadingMessages(false);
      }
    };
    if (currentSession) loadMessages(); else setMessages([]);
  }, [currentSession]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
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
  
  useEffect(() => {
    if (currentSession && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentSession]);
  
  const handleNewChat = async () => {
    if (!projectId) return;
    try {
      setIsProcessing(true);
      setError(null);
      const session = await API.initChatSession(projectId as string, 'New Chat ' +  new Date().toLocaleTimeString());
      setSessions(prev => [session, ...prev]);
      setCurrentSession(session);
      setMessages([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error('Failed to start new chat:', err);
      setError(`Failed to start new chat. ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // If this session is already marked for delete confirmation, proceed to delete
    if (showDeleteConfirm === sessionId) {
      try {
        setIsProcessing(true); // Use isProcessing for general loading state during delete
        await API.deleteChatSession(sessionId);
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSession?.id === sessionId) {
          setCurrentSession(sessions.length > 1 ? sessions.find(s => s.id !== sessionId) || null : null);
          setMessages([]);
        }
        setShowDeleteConfirm(null); // Reset confirmation
      } catch (err) {
        console.error('Failed to delete session:', err);
        setError(`Failed to delete chat. ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Otherwise, mark this session for delete confirmation
      setShowDeleteConfirm(sessionId);
    }
  };
  
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Define handleTextareaKeyDown
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent); // Type assertion to reuse handleSendMessage
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || !projectId) return;
    
    let sessionToUse = currentSession;
    if (!sessionToUse) {
      try {
        setIsProcessing(true); 
        const newSession = await API.initChatSession(projectId as string, 'New Chat ' + new Date().toISOString());
        setSessions(prev => [newSession, ...prev]);
        setCurrentSession(newSession);
        sessionToUse = newSession; 
        setMessages([]);
      } catch (err) {
        console.error("Failed to create a new chat session before sending message:", err);
        setError("Failed to start a new chat. Please try again.");
        setIsProcessing(false);
        return;
      } 
    }

    if (!sessionToUse) {
      setError("Could not establish a chat session. Please refresh and try again.");
      setIsProcessing(false);
      return;
    }
    
    setIsProcessing(true); 

    const userMessageForState: ChatMessage = {
      id: Date.now().toString(),
      session_id: sessionToUse.id,
      content: input,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    
    const placeholderMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      session_id: sessionToUse.id,
      content: '',
      role: 'assistant',
      created_at: new Date().toISOString(),
      isLoading: true,
    };
    
    setMessages(prev => [...prev, userMessageForState, placeholderMessage]);
    const currentInputText = input;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = '46px'; // Reset to initial height

    try {
      setError(null); 
      
      if (typeof sessionToUse.id !== 'string' || sessionToUse.id.trim() === '') {
        throw new Error("Invalid session ID for sending message.");
      }
      if (typeof projectId !== 'string' || projectId.trim() === '') {
        throw new Error("Invalid project ID for sending message.");
      }

      console.log(`Sending message to session: ${sessionToUse.id}, project: ${projectId}, content: "${currentInputText}"`);

      const response = await API.sendChatMessage(sessionToUse.id, projectId as string, currentInputText);
      
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        session_id: response.session_id || sessionToUse.id,
        content: response.completion,
        role: 'assistant',
        created_at: new Date().toISOString(), 
        isLoading: false,
      };
      
      setMessages(prev => prev.map(msg => 
        msg.isLoading && msg.role === 'assistant' ? assistantMessage : msg
      ));
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if ((err as any)?.response?.data) {
        console.error("API Error Response:", JSON.stringify((err as any).response.data, null, 2));
      }
      setMessages(prev => prev.map(msg => 
        msg.isLoading && msg.role === 'assistant' ? {
          ...msg,
          content: `I encountered an error. ${errorMessage}`,
          isLoading: false,
          error: errorMessage
        } : msg
      ));
      setError(`Failed to send message. ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };
  
  const handleSessionClick = (session: ChatSession) => {
    setCurrentSession(session);
    setMobileSidebarOpen(false);
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleRefreshPrompts = () => {
    console.log("Refresh prompts clicked");
  };

  const filteredSessions = sessions.filter(session => 
    (session.id)?.toLowerCase().includes(sessionSearchTerm.toLowerCase()) ||
    (session.title && session.title.toLowerCase().includes(sessionSearchTerm.toLowerCase()))
  ).sort((a, b) => new Date(b.updated_at || b.created_at || Date.now()).getTime() - new Date(a.updated_at || a.created_at || Date.now()).getTime());

  if (authLoading || isLoadingProject) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-var(--header-height,theme(space.16)))] bg-gray-50 dark:bg-neutral-900">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--header-height,theme(space.16)))] p-4 text-center bg-gray-50 dark:bg-neutral-900">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-neutral-100 mb-2">Error Loading Agent</h2>
          <p className="text-gray-600 dark:text-neutral-400 mb-6">
            {error || 'The agent data could not be loaded. Ensure the agent ID is correct or try again later.'}
          </p>
          <Link href="/dashboard/projects" className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors">
            Back to Agents List
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const createChatMessageComponentProps = (msg: ChatMessage) => {
    return {
      message: msg, 
      isLoading: msg.isLoading,
      isNew: msg.id.startsWith('pending-'), 
      userName: user?.email?.split('@')[0] || user?.user_metadata?.full_name || "User",
    };
  };

  const systemInitialMessage: ChatMessage | null = currentSession && project ? {
    id: 'system-initial-empty',
    session_id: currentSession.id,
    content: `This is the beginning of your chat with ${project.name || 'the agent'}.`,
    role: 'system',
    created_at: new Date().toISOString(),
  } : null;

  return (
    <DashboardLayout>
      <Head>
        <title>{project ? `${project.name} | Chat` : 'Chat'} | Nova AI</title>
        <meta name="description" content={project ? `Chat with ${project.name}` : 'Chat with your AI agent'} />
      </Head>
      <div className="flex h-[calc(100vh-var(--header-height,0px))] bg-bg-main">
        {/* Sidebar for Sessions - Themed */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside 
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={`fixed inset-y-0 left-0 z-20 flex flex-col bg-bg-panel border-r border-border-color shadow-lg 
                         lg:relative lg:translate-x-0 lg:opacity-100 lg:z-auto 
                         ${sidebarOpen ? 'w-72 md:w-80' : 'w-0'}`}
            >
              <div className="flex items-center justify-between p-3 border-b border-border-color h-16 flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Bot className="w-6 h-6 text-primary flex-shrink-0" />
                  <h2 className="text-lg font-semibold text-text-primary truncate">
                    {project?.name || 'Agent Chats'}
                  </h2>
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)} 
                  className="lg:hidden p-1.5 rounded-md text-text-muted hover:text-text-main hover:bg-hover-glass"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 flex-shrink-0">
                <Button 
                  variant="default" 
                  size="default" 
                  className="w-full" 
                  onClick={handleNewChat}
                  disabled={isProcessing}
                  isLoading={isProcessing && !currentSession} 
                >
                  <Plus className="w-4 h-4 mr-2" /> New Chat
                </Button>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text"
                    placeholder="Search chats..."
                    value={sessionSearchTerm}
                    onChange={(e) => setSessionSearchTerm(e.target.value)}
                    className="input-themed pl-9 w-full text-sm"
                  />
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto p-3 pt-0 space-y-1.5 custom-scrollbar">
                {isLoadingSessions && !sessions.length ? (
                  <div className="p-4 text-center text-text-muted">
                    <LoadingSpinner /> Loading chats...
                  </div>
                ) : sessions.filter(s => s.title.toLowerCase().includes(sessionSearchTerm.toLowerCase())).length === 0 ? (
                  <div className="p-4 text-center text-text-muted text-sm">
                    No chats found {sessionSearchTerm && 'matching your search'}.
                  </div>
                ) : (
                  sessions.filter(s => s.title.toLowerCase().includes(sessionSearchTerm.toLowerCase())).map(session => (
                    <motion.button
                      key={session.id}
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => { handleSessionClick(session); setMobileSidebarOpen(false); setShowDeleteConfirm(null); }}
                      onBlur={() => setTimeout(() => setShowDeleteConfirm(null), 100)} // Delay to allow delete click
                      className={`w-full text-left p-2.5 rounded-lg transition-all duration-150 ease-in-out group relative 
                                  ${currentSession?.id === session.id 
                                    ? 'bg-primary/15 text-primary shadow-sm' // Themed active state
                                    : 'text-text-secondary hover:bg-hover-glass hover:text-text-primary'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate pr-8">{session.title || 'Untitled Chat'}</span>
                        {/* Themed Delete Button - more visible on hover of the item */}
                        <button 
                          onClick={(e) => handleDeleteSession(session.id, e)} 
                          disabled={isProcessing && currentSession?.id === session.id && showDeleteConfirm === session.id}
                          className={`absolute top-1/2 right-1.5 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-150 
                                      ${showDeleteConfirm === session.id ? 'bg-error-color text-white opacity-100' : 'text-text-muted hover:text-error-color hover:bg-error-color/10'}`}
                          aria-label={showDeleteConfirm === session.id ? 'Confirm delete chat' : 'Delete chat'}
                        > 
                          {(isProcessing && currentSession?.id === session.id && showDeleteConfirm === session.id) ? 
                           <LoadingSpinner size="sm" /> : 
                           <Trash className="w-4 h-4" />
                          }
                        </button>
                      </div>
                      {/* Confirmation text appears below title if delete is pending */}
                      {showDeleteConfirm === session.id && (
                        <p className="mt-1 text-xs text-error-color font-semibold">Click trash again to confirm.</p>
                      )}
                      <div className={`text-xs mt-1 flex items-center gap-1.5 ${showDeleteConfirm === session.id ? 'opacity-50' : 'opacity-70 group-hover:opacity-100'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(session.updated_at || session.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</span>
                      </div>
                    </motion.button>
                  ))
                )}
              </nav>
              {/* User profile / logout in sidebar footer - This will be handled by DashboardLayout */}
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Chat Area - Themed */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-bg-main">
          {/* Mobile Header for Chat */}
          <div className="lg:hidden flex items-center justify-between p-3 border-b border-border-color h-16 bg-bg-panel sticky top-0 z-10 shadow-md">
            <button 
              onClick={() => setMobileSidebarOpen(true)} 
              className="p-1.5 rounded-md text-text-muted hover:text-text-main hover:bg-hover-glass transition-colors"
              aria-label="Open chat sessions"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-center flex-1 min-w-0">
              <h2 className="text-md font-semibold text-text-primary truncate">
                {currentSession?.title || project?.name || 'Chat'}
              </h2>
              {project && <p className="text-xs text-text-muted truncate">with {project.name}</p>}
            </div>
            {/* Placeholder for potential actions like agent settings, ensure it doesn't cause overflow */}
            {project && (
              <Link href={`/dashboard/agents/${projectId}/settings`} passHref>
                <a className="p-1.5 rounded-md text-text-muted hover:text-text-main hover:bg-hover-glass transition-colors ml-2 flex-shrink-0" aria-label="Agent settings">
                  <Settings className="w-5 h-5" />
                </a>
              </Link>
            )}
            {!project && <div className="w-8 h-8 ml-2 flex-shrink-0" /> /* Keep spacing balanced if no settings icon */} 
          </div>

          {/* Page level error - Themed */}
          {error && !isLoadingProject && (
            <div className="m-4 rounded-xl bg-error-color/10 border border-error-color/30 text-error-color flex items-start gap-3 p-4 shadow-lg">
              <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0 text-error-color" />
              <div className="flex-1">
                <p className="text-md font-semibold mb-1">An Error Occurred</p>
                <p className="text-sm mb-3">{error}</p>
                 <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => router.reload()} 
                    className="border-error-color text-error-color hover:bg-error-color/10 hover:text-error-color focus:ring-error-color/50"
                 >
                    <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                 </Button>
              </div>
            </div>
          )}

          {isLoadingProject ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted p-6 bg-bg-main">
              <LoadingSpinner size="xl" />
              <p className="mt-6 text-lg font-medium">Loading Agent...</p>
            </div>
          ) : !project ? (
            <div className="flex flex-col items-center justify-center h-full text-text-primary p-6 bg-bg-main">
              <div className="p-5 bg-primary/10 rounded-full mb-6">
                 <Bot className="w-16 h-16 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Agent Not Found</h2>
              <p className="text-center max-w-md mb-6 text-text-secondary">
                The agent you are looking for could not be found or you may not have access. 
                Please check the ID or select another agent from your list.
              </p>
              <Link href="/dashboard/agents" passHref>
                <Button variant="default" size="lg">
                  <ArrowLeft className="w-5 h-5 mr-2" /> Go to My Agents
                </Button>
              </Link>
            </div>
          ) : (
            // This div will now correctly wrap WelcomeChatScreen OR the messages list + input area
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Message Display Area - Themed */}
              {(!currentSession && !isLoadingSessions && !isProcessing && !isLoadingMessages) ? (
                <WelcomeChatScreen 
                  userName={user?.name || user?.full_name || user?.email?.split('@')[0]}
                  agentName={project.name}
                  onPromptClick={handlePromptClick} 
                  onRefreshPrompts={handleRefreshPrompts}
                />
              ) : (
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-bg-main relative">
                  {isLoadingMessages && messages.length === 0 && (
                    <div className="flex justify-center items-center h-full">
                      <LoadingSpinner size="xl" />
                      <p className="ml-3 text-text-muted">Loading messages...</p>
                    </div>
                  )}
                  {messages.map(msg => (
                    <ChatMessageComponent key={msg.id} {...createChatMessageComponentProps(msg)} />
                  ))}
                  <div ref={messagesEndRef} className="h-0.5" /> {/* Scroll anchor */}
                </div>
              )}
              {/* Input Area - Themed (only if a session is active or project is loaded) */}
              {(currentSession || project) && !isLoadingProject && (
                <div className={`p-3 md:p-4 border-t border-border-color bg-bg-panel shadow-[0_-4px_12px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_12px_-5px_rgba(var(--primary-rgb),0.15)] relative ${currentSession === null && (isLoadingMessages || isLoadingSessions) ? 'opacity-60 pointer-events-none' : ''}`}>
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2 md:gap-3">
                    {/* Optional: File upload button - Themed */}
                    {/* 
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="flex-shrink-0 w-10 h-10 border-border-color hover:border-primary/70 text-text-muted hover:text-primary"
                      aria-label="Attach file"
                      disabled={isProcessing || isLoadingMessages || !currentSession}
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button> 
                    */}
                    <div className="relative flex-1 group">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleTextareaChange}
                        onKeyDown={handleTextareaKeyDown}
                        placeholder={currentSession ? `Message ${project?.name || 'Agent'}...` : 'Select or start a new chat to send a message'}
                        className={`w-full rounded-xl border border-border-color bg-bg-main p-3.5 pr-12 text-sm text-text-main 
                                    placeholder:text-text-muted/70 
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary 
                                    disabled:cursor-not-allowed disabled:opacity-50 
                                    resize-none overflow-y-auto custom-scrollbar 
                                    min-h-[52px] max-h-[180px] 
                                    transition-all duration-200 ease-in-out hover:border-border-color 
                                    group-focus-within:border-primary 
                                    ${currentSession === null ? 'cursor-not-allowed' : ''}`}
                        rows={1}
                        disabled={isProcessing || isLoadingMessages || isLoadingSessions || !currentSession}
                      />
                       <Button
                        type="submit"
                        disabled={!input.trim() || isProcessing || isLoadingMessages || isLoadingSessions || !currentSession}
                        // Show loader if processing and it's not a streaming response (where assistant message shows its own loader)
                        isLoading={isProcessing && !messages.some(m => m.role === 'assistant' && m.isLoading)}
                        className="absolute right-2.5 bottom-2.5 flex-shrink-0 w-9 h-9 p-0" // Adjusted positioning
                        variant="default" // Themed primary button
                        size="icon"
                        aria-label="Send message"
                      >
                        {/* Show spinner if processing and it is a streaming response, otherwise Send icon */}
                        {isProcessing && messages.some(m => m.role === 'assistant' && m.isLoading) ? <LoadingSpinner className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </form>
                  <div className="mt-2.5 text-xs text-text-muted text-center">
                    <span>Press <kbd className="px-1.5 py-0.5 rounded bg-bg-main border border-border-color text-text-muted text-xs mx-0.5">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-bg-main border border-border-color text-text-muted text-xs mx-0.5">Shift+Enter</kbd> for new line.</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
} 