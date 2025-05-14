import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, UserCircle, Bot, AlertCircle, RefreshCw, ChevronDown, FileText, MessageSquare, Settings, ArrowLeft, Plus, Trash, Clock, Edit3, Menu, X, Search, ExternalLink, LogOut, RefreshCcw, Paperclip, ChevronUp } from 'lucide-react';
import DashboardLayout from '../../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../../contexts/AuthContext';
import { API } from '../../../../utils/api';
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
    { title: 'Get fresh perspectives on tricky problems' },
    { title: 'Brainstorm creative ideas' },
    { title: 'Rewrite message for maximum impact' },
    { title: 'Summarize key points' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-50 dark:bg-neutral-900 text-gray-700 dark:text-neutral-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center shadow-2xl">
          <Bot className="w-12 h-12 text-white opacity-90" /> 
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-neutral-600 dark:to-neutral-700 blur-xl animate-pulse opacity-50 dark:opacity-40"></div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
        className="text-3xl md:text-4xl font-medium text-gray-700 dark:text-neutral-200 mb-2"
      >
        {greeting()}
      </motion.h1>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
        className="text-xl md:text-2xl text-gray-600 dark:text-neutral-300 mb-4"
      >
        Ready to chat{agentName ? ` with ${agentName}` : ''}?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
        className="text-sm text-gray-500 dark:text-neutral-400 mb-8 max-w-md"
      >
        Choose a prompt below or type your message to start the conversation.
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mb-6">
        {prompts.map((prompt, index) => (
          <motion.button
            key={prompt.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.07, duration: 0.3, ease: "easeOut" }}
            onClick={() => onPromptClick && onPromptClick(prompt.title)}
            className="text-left p-3.5 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700/70 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent focus-visible:ring-opacity-75"
          >
            <span className="text-sm text-gray-700 dark:text-neutral-200 group-hover:text-gray-900 dark:group-hover:text-neutral-100">{prompt.title}</span>
          </motion.button>
        ))}
      </div>
      {onRefreshPrompts && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4, ease: "easeOut" }}
          onClick={onRefreshPrompts}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 transition-colors"
        >
          <RefreshCcw className="w-3 h-3" /> Refresh prompts
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
    if (!confirm('Are you sure you want to delete this chat?')) return;
    try {
      await API.deleteChatSession(sessionId);
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
      if (currentSession?.id === sessionId) {
        if (updatedSessions.length > 0) {
          setCurrentSession(updatedSessions[0]);
        } else {
          setCurrentSession(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete chat session:', err);
      setError(`Failed to delete chat. ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'inherit';
    // Simple auto-resize, max 5 lines roughly
    const maxHeight = 5 * 24; // Assuming line height around 24px
    e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`; 
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

  const createChatMessageComponentProps = (msg: ChatMessage) => ({
    key: msg.id,
    message: msg, 
    isLoading: msg.isLoading,
    isNew: msg.id.startsWith('pending-'), 
    userName: user?.email?.split('@')[0] || user?.user_metadata?.full_name || "User",
  });

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
        <title>{`Chat with ${project?.name || 'Agent'}`} | Nova</title>
      </Head>
      <div className="flex h-[calc(100vh-var(--header-height,theme(space.16)))] bg-gray-100 dark:bg-neutral-900 text-gray-800 dark:text-neutral-100 antialiased">
        {/* Desktop Sidebar */} 
        <div className={`relative hidden md:flex transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-72' : 'w-0'}`}>
          <div className={`${sidebarOpen ? 'opacity-100 w-72' : 'opacity-0 w-0'} transition-all duration-300 ease-in-out h-full flex flex-col bg-white dark:bg-neutral-900 overflow-hidden`}>
            <div className="flex items-center p-2.5">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400 dark:text-neutral-500" />
            </div>
                    <input 
                        type="text"
                        placeholder="Search chats..."
                        value={sessionSearchTerm}
                        onChange={(e) => setSessionSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-800 rounded-lg text-sm text-gray-700 dark:text-neutral-200 placeholder-gray-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-accent focus:border-accent dark:focus:ring-accent dark:focus:border-accent outline-none transition-all"
                />
                <button 
                  onClick={handleNewChat}
                  disabled={isProcessing}
                  title="New Chat"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <Plus className="w-4 h-4 text-gray-500 hover:text-accent dark:text-neutral-400 dark:hover:text-accent" />
                </button>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto p-2 pb-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent">
            {isLoadingSessions ? (
                <div className="flex-grow flex items-center justify-center h-full"><LoadingSpinner size="sm"/></div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-8 px-4 text-gray-500 dark:text-neutral-400">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40"/>
                  <p className="text-sm">No chat history found.</p>
                  {sessionSearchTerm && <p className="text-xs mt-1">Try a different search term.</p>}
                    </div>
              ) : filteredSessions.map(session => (
                  <motion.div
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                  className={`p-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                    currentSession?.id === session.id 
                      ? 'bg-accent/5 shadow-sm border border-accent/10 dark:bg-accent/10 dark:border-accent/20' 
                      : 'hover:bg-gray-100 dark:hover:bg-neutral-800/70 border border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center">
                        <MessageSquare className={`w-3.5 h-3.5 mr-2 ${
                          currentSession?.id === session.id 
                            ? 'text-accent' 
                            : 'text-gray-500 dark:text-neutral-400'
                        }`} />
                        <span className={`text-sm font-medium truncate ${
                          currentSession?.id === session.id 
                            ? 'text-accent' 
                            : 'text-gray-700 dark:text-neutral-300'
                        }`}>
                          {session.title || `Chat ${new Date(session.created_at || Date.now()).toLocaleDateString()}`}
                        </span>
                    </div>
                      <div className={`text-xs mt-0.5 ml-6 ${
                        currentSession?.id === session.id 
                          ? 'text-accent/80' 
                          : 'text-gray-500 dark:text-neutral-400'
                      }`}>
                        {new Date(session.updated_at || session.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id, e); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                      title="Delete chat"
                    >
                        <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  </motion.div>
                ))}
            </div>
            <div className="px-2.5 py-3 mt-auto flex justify-center items-center">
              <div className="flex justify-between w-full">
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                  <Search className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar (Off-canvas) */} 
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-40 flex md:hidden"
            >
              <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)}></div>
              <div className="relative flex flex-col w-full max-w-xs bg-white dark:bg-neutral-900 shadow-xl">
                <div className="p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                      {/* Nova logo for mobile sidebar header */} 
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
                          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                          <path d="M12 6C9.24 6 7 8.24 7 11C7 12.38 7.57 13.63 8.5 14.5L5.5 17.5C5.11 17.89 5.11 18.51 5.5 18.9C5.89 19.29 6.51 19.29 6.9 18.9L9.9 15.9C10.77 16.43 11.38 17 12.76 17C15.52 17 17.76 14.76 17.76 12C17.76 8.24 15.52 6 12.76 6H12ZM12.76 15C10.36 15 9.76 12.62 9.76 12C9.76 10.38 10.36 9 12.76 9C14.38 9 15.76 10.38 15.76 12C15.76 13.62 14.38 15 12.76 15Z" fill="currentColor"/>
                      </svg>
                      <h2 className="text-md font-semibold text-gray-800 dark:text-white">Nova AI</h2>
                  </div>
                  <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-2.5 pb-0">
                  <div className="flex items-center p-2.5">
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-gray-400 dark:text-neutral-500" />
                      </div>
                        <input 
                            type="text"
                            placeholder="Search chats..."
                            value={sessionSearchTerm}
                            onChange={(e) => setSessionSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-800 rounded-lg text-sm text-gray-700 dark:text-neutral-200 placeholder-gray-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-accent focus:border-accent dark:focus:ring-accent dark:focus:border-accent outline-none transition-all"
                      />
                      <button 
                        onClick={handleNewChat}
                        disabled={isProcessing}
                        title="New Chat"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <Plus className="w-4 h-4 text-gray-500 hover:text-accent dark:text-neutral-400 dark:hover:text-accent" />
                      </button>
                    </div>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto p-2 pb-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                    {isLoadingSessions ? (
                        <div className="flex-grow flex items-center justify-center h-full"><LoadingSpinner size="sm"/></div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="text-center py-8 px-4 text-gray-500 dark:text-neutral-400">
                            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40"/>
                            <p className="text-sm">No chat history found.</p>
                            {sessionSearchTerm && <p className="text-xs mt-1">Try a different search term.</p>}
                        </div>
                    ) : filteredSessions.map(session => (
                        <motion.div
                            key={session.id}
                            onClick={() => handleSessionClick(session)}
                            className={`p-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                              currentSession?.id === session.id 
                                ? 'bg-accent/5 shadow-sm border border-accent/10 dark:bg-accent/10 dark:border-accent/20' 
                                : 'hover:bg-gray-100 dark:hover:bg-neutral-800/70 border border-transparent'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center">
                                        <MessageSquare className={`w-3.5 h-3.5 mr-2 ${
                                          currentSession?.id === session.id 
                                            ? 'text-accent' 
                                            : 'text-gray-500 dark:text-neutral-400'
                                        }`} />
                                        <span className={`text-sm font-medium truncate ${
                                          currentSession?.id === session.id 
                                            ? 'text-accent' 
                                            : 'text-gray-700 dark:text-neutral-300'
                                        }`}>
                                            {session.title || `Chat ${new Date(session.created_at || Date.now()).toLocaleDateString()}`}
                                        </span>
                                    </div>
                                    <div className={`text-xs mt-0.5 ml-6 ${
                                      currentSession?.id === session.id 
                                        ? 'text-accent/80' 
                                        : 'text-gray-500 dark:text-neutral-400'
                                    }`}>
                                {new Date(session.updated_at || session.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id, e); }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                                    title="Delete chat"
                                >
                                    <Trash className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
                <div className="px-2.5 py-3 mt-auto flex justify-center items-center">
                  <div className="flex justify-between w-full">
                    <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                      <Plus className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                      <Search className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 flex flex-col h-full max-h-full overflow-hidden bg-white dark:bg-neutral-900">
          <header className="flex-shrink-0 flex items-center justify-between p-3 md:px-4 md:py-3 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 shadow-sm">
            <div className="flex items-center gap-2">
              <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-1.5 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200">
                <Menu className="w-5 h-5" />
              </button>
              <button onClick={toggleSidebar} className="hidden md:flex items-center justify-center p-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200">
                 {sidebarOpen ? <X className="w-5 h-5" /> : 
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="">
                     <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                     <path d="M12 6C9.24 6 7 8.24 7 11C7 12.38 7.57 13.63 8.5 14.5L5.5 17.5C5.11 17.89 5.11 18.51 5.5 18.9C5.89 19.29 6.51 19.29 6.9 18.9L9.9 15.9C10.77 16.43 11.38 17 12.76 17C15.52 17 17.76 14.76 17.76 12C17.76 8.24 15.52 6 12.76 6H12ZM12.76 15C10.36 15 9.76 12.62 9.76 12C9.76 10.38 10.36 9 12.76 9C14.38 9 15.76 10.38 15.76 12C15.76 13.62 14.38 15 12.76 15Z" fill="currentColor"/>
                 </svg>}
              </button>
              <h1 className="text-base font-semibold text-gray-700 dark:text-neutral-200 truncate">
                {project?.name || 'Chat'}
              </h1>
             </div>
          </header>

          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-1.5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent dark:scrollbar-track-transparent">
            {(isLoadingMessages && messages.length === 0 && !currentSession) && (
              <div className="flex h-full items-center justify-center">
                <LoadingSpinner size="md" />
              </div>
            )}
            
            {(!currentSession || (currentSession && messages.length === 0 && !isLoadingMessages)) && project && (
              <WelcomeChatScreen 
                userName={user?.email?.split('@')[0] || user?.user_metadata?.full_name}
                agentName={project.name}
                onPromptClick={handlePromptClick}
                onRefreshPrompts={handleRefreshPrompts}
              />
            )}

            {(currentSession && messages.length > 0 && systemInitialMessage && messages[0]?.id !== systemInitialMessage.id) && (
                <ChatMessageComponent {...createChatMessageComponentProps(systemInitialMessage)} />
            )}
            
            <AnimatePresence initial={false}>
              {messages.map(msg => {
                const props = createChatMessageComponentProps(msg);
                return <ChatMessageComponent key={props.key} message={props.message} isLoadingOverall={props.isLoading} userName={props.userName} />;
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={scrollToBottom}
              className="absolute bottom-24 right-5 z-10 p-2 bg-gray-600 hover:bg-gray-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-full shadow-lg transition-colors"
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          )}

          <div className="flex-shrink-0 p-3 md:p-4 bg-white dark:bg-neutral-800">
            {error && (
                <div className="mb-2 p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-md flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0"/> 
                    <span>{error}</span>
                </div>
            )}
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg overflow-hidden transition-all duration-150">
              <form onSubmit={handleSendMessage} className="flex flex-col">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as any); 
                    }
                  }}
                  placeholder={currentSession && project ? `Message ${project.name}...` : "Ask anything..."}
                  className="w-full p-3.5 pr-12 bg-white dark:bg-neutral-900 text-sm text-gray-800 dark:text-neutral-100 placeholder-gray-500 dark:placeholder-neutral-400 resize-none outline-none min-h-[60px] max-h-[200px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-transparent border-0"
                  rows={1} 
                  disabled={!project || isProcessing}
                />
                <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-neutral-900">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-neutral-400 select-none">Nova 1.0 Pro</span>
                    <button type="button" className="flex items-center gap-1 text-xs text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 p-1 rounded-md transition-colors">
                      Formal
                      <ChevronDown className="w-3 h-3 opacity-70" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      title="Attach files"
                      className="p-1.5 text-gray-500 hover:text-accent dark:text-neutral-400 dark:hover:text-accent rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button 
                      type="submit" 
                      title="Send message"
                      disabled={isProcessing || !input.trim() || !project}
                      className="p-2 bg-accent hover:bg-accent/90 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/70 flex-shrink-0"
                      style={{ width: '36px', height: '36px' }}
                    >
                      <Send className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="text-center mt-1">
                <p className="text-[10px] text-gray-500 dark:text-neutral-500">
                    AI responses may be inaccurate. Consider verifying important information.
                </p>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
} 