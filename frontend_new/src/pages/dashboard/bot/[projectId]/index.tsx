import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, UserCircle, Bot, AlertCircle, RefreshCw, ChevronDown, FileText, MessageSquare, Settings, ArrowLeft, Plus, Trash, Clock, Edit3, Menu, X, Search, ExternalLink, LogOut, RefreshCcw, Paperclip, ChevronUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '../../../../contexts/AuthContext';
import { getProject, listChatSessions, getChatMessages, initChatSession, deleteChatSession, sendChatMessage } from '@/utils/api';
import type { Project, ChatSession, ChatMessage as ChatMessageTypeFromTypes, ApiResponse } from '@/types/index';
import { SkeletonLoader } from '../../../../components/ui/LoadingSpinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import { extractErrorInfo } from '../../../../utils/error';

const LoadingSpinner = dynamic(() => import('../../../../components/ui/LoadingSpinner'), { ssr: false });
const DashboardLayout = dynamic(() => import('../../../../components/dashboard/DashboardLayout'), { loading: () => <div className="flex items-center justify-center h-screen"><LoadingSpinner size="lg" /></div>, ssr: false });
const ChatMessageComponent = dynamic(() => import('../../../../components/ui/ChatMessage'), { loading: () => <LoadingSpinner size="sm" />, ssr: false });

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
    <div className="flex flex-col items-center justify-center h-full w-full text-center p-2 md:p-4 text-gray-700 dark:text-neutral-300 max-h-full overflow-hidden mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative mb-4"
      >
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center shadow-2xl">
          <Bot className="w-10 h-10 md:w-12 md:h-12 text-white opacity-90" />
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-neutral-600 dark:to-neutral-700 blur-xl animate-pulse opacity-30 dark:opacity-20"></div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
        className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-neutral-100 mb-1"
      >
        {greeting()}
      </motion.h1>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
        className="text-base md:text-lg text-gray-600 dark:text-neutral-300 mb-3"
      >
        Ready to chat{agentName ? ` with ${agentName}` : ''}?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
        className="text-xs md:text-sm text-gray-500 dark:text-neutral-400 mb-4 max-w-md"
      >
        Choose a prompt below or type your message to start the conversation.
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md mb-4">
        {prompts.map((prompt, index) => (
          <motion.button
            key={prompt.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.07, duration: 0.3, ease: "easeOut" }}
            onClick={() => onPromptClick && onPromptClick(prompt.title)}
            className="text-center p-4 bg-white dark:bg-neutral-800/70 hover:bg-gray-50 dark:hover:bg-neutral-700/90 rounded-xl shadow-md border border-gray-200 dark:border-neutral-700/80 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accent focus-visible:ring-opacity-75 group"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-neutral-200 group-hover:text-gray-800 dark:group-hover:text-neutral-100">{prompt.title}</span>
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
  
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState<string>('');
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
  
  const {
    data: project,
    isLoading: isLoadingProject,
    error: projectError,
    refetch: refetchProject,
  } = useQuery(['project', projectId], () => getProject(projectId as string), {
    enabled: !!projectId && !!user,
    retry: 2,
  });
  
  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    error: sessionsError,
    refetch: refetchSessions,
  } = useQuery(['sessions', projectId], () => listChatSessions(projectId as string), {
    enabled: !!projectId && !!user,
    retry: 2,
  });
  
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages,
  } = useQuery(['messages', currentSession?.id], () => currentSession ? getChatMessages(currentSession.id) : [], {
    enabled: !!currentSession,
    retry: 2,
  });

  // Debugging useEffect for chat input state
  useEffect(() => {
    console.log('[Chat Input Debug]', {
      projectExists: !!project,
      isLoadingMessages,
      isInputEmpty: !input.trim(),
      isProjectLoading: isLoadingProject,
      currentSessionExists: !!currentSession
    });
  }, [project, isLoadingMessages, input, isLoadingProject, currentSession]);

  const queryClient = useQueryClient();
  
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
      const session = await initChatSession(projectId as string, 'New Chat ' +  new Date().toLocaleTimeString());
      queryClient.setQueryData(['sessions', projectId], (oldData: ChatSession[] = []) => [session, ...oldData]);
      setCurrentSession(session);
      refetchMessages();
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error('Failed to start new chat:', err);
      setError(`Failed to start new chat. ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat?')) return;
    try {
      await deleteChatSession(sessionId);
      queryClient.setQueryData(['sessions', projectId], (oldData: ChatSession[] = []) => oldData.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        if (sessions.length > 0) {
          setCurrentSession(sessions[0]);
        } else {
          setCurrentSession(null);
          refetchMessages();
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
    if (!input.trim() || !projectId || (!!currentSession && isLoadingMessages)) return;
    
    let sessionToUse = currentSession;
    if (!sessionToUse) {
      try {
        const newSession = await initChatSession(projectId as string, 'New Chat ' + new Date().toISOString());
        queryClient.setQueryData(['sessions', projectId], (oldData: ChatSession[] = []) => [newSession, ...oldData]);
        setCurrentSession(newSession);
        refetchMessages();
        sessionToUse = newSession; 
      } catch (err) {
        console.error("Failed to create a new chat session before sending message:", err);
        setError("Failed to start a new chat. Please try again.");
        return;
      } 
    }

    if (!sessionToUse) {
      setError("Could not establish a chat session. Please refresh and try again.");
      return;
    }

    try {
      setError(null); 
      
      if (typeof sessionToUse.id !== 'string' || sessionToUse.id.trim() === '') {
        throw new Error("Invalid session ID for sending message.");
      }
      if (typeof projectId !== 'string' || projectId.trim() === '') {
        throw new Error("Invalid project ID for sending message.");
      }

      console.log(`Sending message to session: ${sessionToUse.id}, project: ${projectId}, content: "${input}"`);

      const response = await sendChatMessage(sessionToUse.id, projectId as string, input);
      
      queryClient.setQueryData(['messages', sessionToUse.id], (oldData: ChatMessage[] = []) => [
        ...oldData,
        {
        id: Date.now().toString() + '-assistant',
        session_id: response.session_id || sessionToUse.id,
        content: response.completion,
          role: 'assistant' as 'assistant',
        created_at: new Date().toISOString(), 
        isLoading: false,
        },
      ]);
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if ((err as any)?.response?.data) {
        console.error("API Error Response:", JSON.stringify((err as any).response.data, null, 2));
      }
      queryClient.setQueryData(['messages', sessionToUse.id], (oldData: ChatMessage[] = []) => oldData.map(msg => 
        msg.isLoading && msg.role === 'assistant' ? {
          ...msg,
          content: `I encountered an error. ${errorMessage}`,
          isLoading: false,
          error: errorMessage
        } : msg
      ));
      setError(`Failed to send message. ${errorMessage}`);
    } finally {
      setInput('');
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

  const filteredSessions: ChatSession[] = (sessions as ChatSession[]).filter((session: ChatSession) =>
    (session.id)?.toLowerCase().includes(sessionSearchTerm.toLowerCase()) ||
    (session.title && session.title.toLowerCase().includes(sessionSearchTerm.toLowerCase()))
  ).sort((a: ChatSession, b: ChatSession) => new Date(b.updated_at || b.created_at || Date.now()).getTime() - new Date(a.updated_at || a.created_at || Date.now()).getTime());

  const createChatMessageComponentProps = (msg: ChatMessage, user: any) => ({
    key: msg.id,
    id: msg.id,
    session_id: msg.session_id,
    content: msg.content,
    role: msg.role,
    created_at: msg.created_at,
    metadata: msg.metadata,
    isLoading: msg.isLoading,
    error: msg.error,
    userName: user?.email?.split('@')[0] || user?.user_metadata?.full_name || "User",
  });

  if (authLoading || isLoadingProject) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-var(--header-height,theme(space.16)))] bg-gray-50 dark:bg-neutral-900">
          <SkeletonLoader width="w-32" height="h-8" />
        </div>
      </DashboardLayout>
    );
  }

  if (projectError) {
    const { message, code } = extractErrorInfo(projectError);
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <ErrorMessage
            message={message || 'Failed to load project.'}
            code={code}
            onRetry={() => refetchProject()}
          />
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
          <Link href="/dashboard/projects" prefetch={true} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors">
            Back to Agents List
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (sessionsError) {
    const { message, code } = extractErrorInfo(sessionsError);
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <ErrorMessage
            message={message || 'Failed to load sessions.'}
            code={code}
            onRetry={() => refetchSessions()}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (messagesError) {
    const { message, code } = extractErrorInfo(messagesError);
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <ErrorMessage
            message={message || 'Failed to load messages.'}
            code={code}
            onRetry={() => refetchMessages()}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>{`Chat with ${project?.name || 'Agent'}`} | Nova</title>
      </Head>
      <div className="flex h-screen bg-gray-50 dark:bg-neutral-950 text-gray-800 dark:text-neutral-100 antialiased overflow-hidden">
        {/* Desktop Sidebar */} 
        <div className={`relative hidden md:flex transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-72 lg:w-80' : 'w-16'}`}>
          <div className={`${sidebarOpen ? 'opacity-100 w-72 lg:w-80' : 'opacity-0 w-16'} transition-all duration-300 ease-in-out h-full flex flex-col bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 overflow-hidden`}>
            {/* Back bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-neutral-800">
              <Link href="/dashboard/agents" passHref legacyBehavior>
                <a className="p-1 text-gray-600 hover:text-gray-800 dark:text-neutral-300 dark:hover:text-neutral-100 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </a>
              </Link>
              <span className="text-md font-semibold text-gray-800 dark:text-neutral-100">Chats</span>
              <button onClick={toggleSidebar} className="p-1 text-gray-600 hover:text-gray-800 dark:text-neutral-300 dark:hover:text-neutral-100 transition-colors">
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex items-center p-3">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400 dark:text-neutral-500" />
                </div>
                <input 
                  type="text"
                  placeholder="Search chats..."
                  value={sessionSearchTerm}
                  onChange={(e) => setSessionSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700/80 rounded-lg text-sm text-gray-700 dark:text-neutral-200 placeholder-gray-500 dark:placeholder-neutral-400 focus:ring-1 focus:ring-accent focus:border-accent dark:focus:ring-accent dark:focus:border-accent outline-none transition-all"
                />
                <button 
                  onClick={handleNewChat}
                  disabled={isLoadingMessages}
                  title="New Chat"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-accent dark:text-neutral-400 dark:hover:text-accent transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent">
              {isLoadingSessions ? (
                <div className="flex flex-col space-y-3 p-4">
                  {[...Array(3)].map((_, idx) => (
                    <SkeletonLoader key={idx} width="w-full" height="h-10" />
                  ))}
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-10 px-4 text-gray-500 dark:text-neutral-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30"/>
                  <p className="text-sm font-medium">No chat history.</p>
                  {sessionSearchTerm ? <p className="text-xs mt-1">Try a different search.</p> : <p className="text-xs mt-1">Start a new conversation!</p>}
                </div>
              ) : filteredSessions.map(session => (
                <motion.div
                  key={session.id}
                  onClick={() => handleSessionClick(session)}
                  className={`group p-3 rounded-lg cursor-pointer transition-all duration-150 ease-in-out ${
                    currentSession?.id === session.id 
                      ? 'bg-accent/10 dark:bg-accent/15 shadow-sm' 
                      : 'hover:bg-gray-100 dark:hover:bg-neutral-800/70'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
                          currentSession?.id === session.id 
                            ? 'text-accent' 
                            : 'text-gray-500 dark:text-neutral-400 group-hover:text-gray-600 dark:group-hover:text-neutral-300'
                        }`} />
                        <span className={`text-sm font-medium truncate ${
                          currentSession?.id === session.id 
                            ? 'text-accent' 
                            : 'text-gray-700 dark:text-neutral-200 group-hover:text-gray-800 dark:group-hover:text-neutral-100'
                        }`}>
                          {session.title || `Chat ${new Date(session.created_at || Date.now()).toLocaleDateString()}`}
                        </span>
                      </div>
                      <div className={`text-xs mt-1 ml-[24px] ${
                        currentSession?.id === session.id 
                          ? 'text-accent/80' 
                          : 'text-gray-500 dark:text-neutral-500 group-hover:text-gray-500 dark:group-hover:text-neutral-400'
                      }`}>
                        {new Date(session.updated_at || session.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id, e); }}
                      className="p-1 text-gray-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-500 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all focus:outline-none"
                      title="Delete chat"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
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
              <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)}></div>
              <div className="relative flex flex-col w-full max-w-xs bg-white dark:bg-neutral-900 shadow-xl border-r border-gray-200 dark:border-neutral-800">
                <div className="p-3 flex items-center justify-between border-b border-gray-200 dark:border-neutral-800">
                  <Link href="/dashboard/agents" passHref legacyBehavior>
                    <a className="p-1 text-gray-600 hover:text-gray-800 dark:text-neutral-300 dark:hover:text-neutral-100 transition-colors">
                      <ArrowLeft className="w-5 h-5" />
                    </a>
                  </Link>
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">Chats</span>
                  <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-3">
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400 dark:text-neutral-500" />
                    </div>
                    <input 
                      type="text"
                      placeholder="Search chats..."
                      value={sessionSearchTerm}
                      onChange={(e) => setSessionSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700/80 rounded-lg text-sm text-gray-700 dark:text-neutral-200 placeholder-gray-500 dark:placeholder-neutral-400 focus:ring-1 focus:ring-accent focus:border-accent dark:focus:ring-accent dark:focus:border-accent outline-none transition-all"
                    />
                    <button 
                      onClick={handleNewChat}
                      disabled={isLoadingMessages}
                      title="New Chat"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-accent dark:text-neutral-400 dark:hover:text-accent transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                  {isLoadingSessions ? (
                    <div className="flex flex-col space-y-3 p-4">
                      {[...Array(3)].map((_, idx) => (
                        <SkeletonLoader key={idx} width="w-full" height="h-10" />
                      ))}
                    </div>
                  ) : filteredSessions.length === 0 ? (
                    <div className="text-center py-10 px-4 text-gray-500 dark:text-neutral-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30"/>
                      <p className="text-sm font-medium">No chat history.</p>
                      {sessionSearchTerm ? <p className="text-xs mt-1">Try a different search.</p> : <p className="text-xs mt-1">Start a new conversation!</p>}
                    </div>
                  ) : filteredSessions.map(session => (
                    <motion.div
                      key={session.id}
                      onClick={() => handleSessionClick(session)}
                      className={`group p-3 rounded-lg cursor-pointer transition-all duration-150 ease-in-out ${
                        currentSession?.id === session.id 
                          ? 'bg-accent/10 dark:bg-accent/15 shadow-sm' 
                          : 'hover:bg-gray-100 dark:hover:bg-neutral-800/70'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2">
                            <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
                              currentSession?.id === session.id 
                                ? 'text-accent' 
                                : 'text-gray-500 dark:text-neutral-400 group-hover:text-gray-600 dark:group-hover:text-neutral-300'
                            }`} />
                            <span className={`text-sm font-medium truncate ${
                              currentSession?.id === session.id 
                                ? 'text-accent' 
                                : 'text-gray-700 dark:text-neutral-200 group-hover:text-gray-800 dark:group-hover:text-neutral-100'
                            }`}>
                              {session.title || `Chat ${new Date(session.created_at || Date.now()).toLocaleDateString()}`}
                            </span>
                          </div>
                          <div className={`text-xs mt-1 ml-[24px] ${
                            currentSession?.id === session.id 
                              ? 'text-accent/80' 
                              : 'text-gray-500 dark:text-neutral-500 group-hover:text-gray-500 dark:group-hover:text-neutral-400'
                          }`}>
                            {new Date(session.updated_at || session.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id, e); }}
                          className="p-1 text-gray-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-500 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all focus:outline-none"
                          title="Delete chat"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 flex flex-col h-full min-h-0 max-h-screen bg-gray-50 dark:bg-neutral-900">
          {/* Header with Back button and standardized padding */}
          <header className="flex-shrink-0 flex items-center justify-between p-3.5 md:p-4 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-850 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Link href="/dashboard/agents" passHref legacyBehavior>
                <a className="p-1.5 text-gray-600 hover:text-gray-800 dark:text-neutral-300 dark:hover:text-neutral-100 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700/60 transition-colors" aria-label="Back to agents list">
                  <ArrowLeft className="w-5 h-5" />
                </a>
              </Link>
              <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-1.5 text-gray-600 hover:text-gray-800 dark:text-neutral-300 dark:hover:text-neutral-100 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700/60 transition-colors">
                <Menu className="w-5 h-5" />
              </button>
              <button onClick={toggleSidebar} className="hidden md:flex items-center justify-center p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700/60 text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-100 transition-colors">
                 {sidebarOpen ? <X className="w-5 h-5" /> : 
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="">
                     <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                     <path d="M12 6C9.24 6 7 8.24 7 11C7 12.38 7.57 13.63 8.5 14.5L5.5 17.5C5.11 17.89 5.11 18.51 5.5 18.9C5.89 19.29 6.51 19.29 6.9 18.9L9.9 15.9C10.77 16.43 11.38 17 12.76 17C15.52 17 17.76 14.76 17.76 12C17.76 8.24 15.52 6 12.76 6H12ZM12.76 15C10.36 15 9.76 12.62 9.76 12C9.76 10.38 10.36 9 12.76 9C14.38 9 15.76 10.38 15.76 12C15.76 13.62 14.38 15 12.76 15Z" fill="currentColor"/>
                 </svg>}
              </button>
              <h1 className="text-md font-semibold text-gray-800 dark:text-neutral-100 truncate">
                {project?.name || 'Chat'}
              </h1>
             </div>
          </header>

          <div className="flex-1 min-h-0 flex flex-col w-full overflow-hidden">
            <div ref={messagesContainerRef} className="flex-1 min-h-0 p-4 md:p-6 space-y-4 w-full overflow-hidden">
              {(isLoadingMessages && messages.length === 0 && !currentSession) && (
                <div className="flex h-full items-center justify-center">
                  <SkeletonLoader width="w-32" height="h-8" />
                </div>
              )}
              
              {(!currentSession || (currentSession && messages.length === 0 && !isLoadingMessages)) && project && (
                <div className="flex items-center justify-center h-full w-full overflow-hidden">
                  <div className="w-full max-w-xl h-full flex items-center justify-center overflow-hidden">
                    <WelcomeChatScreen 
                      userName={user?.email?.split('@')[0] || user?.user_metadata?.full_name}
                      agentName={project.name}
                      onPromptClick={handlePromptClick}
                      onRefreshPrompts={handleRefreshPrompts}
                    />
                  </div>
                </div>
              )}
              
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <ChatMessageComponent {...createChatMessageComponentProps(msg, user)} />
                ))}
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
          </div>

          {/* Input Footer with standardized padding */}
          <div className="flex-shrink-0 p-3 md:p-4 bg-white dark:bg-neutral-850 border-t border-gray-200 dark:border-neutral-800 z-10">
            {error && (
                <div className="mb-2 p-2.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 text-xs rounded-lg flex items-center gap-2 shadow-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0"/> 
                    <span>{error}</span>
                </div>
            )}
            {/* Form Wrapper Div - Chat input bar with its own background and focus effects */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg transition-all duration-150 focus-within:ring-2 focus-within:ring-accent/80 dark:focus-within:ring-accent focus-within:shadow-xl border border-transparent dark:border-neutral-700/50">
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
                  placeholder={currentSession && project ? `Message ${project.name}...` : "Type your message here..."}
                  className="w-full p-4 pr-12 bg-transparent text-sm text-gray-800 dark:text-neutral-100 placeholder-gray-500 dark:placeholder-neutral-400 resize-none outline-none min-h-[60px] max-h-[200px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-transparent rounded-t-xl"
                  rows={1} 
                  disabled={!project || (!!currentSession && isLoadingMessages)}
                />
                <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-neutral-800/70 border-t border-gray-200 dark:border-neutral-700 rounded-b-xl">
                  <div className="flex items-center gap-2">
                     <button type="button" className="flex items-center gap-1 text-xs text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-700 p-1.5 rounded-md transition-colors">
                      <Settings className="w-3.5 h-3.5 opacity-80" />
                      <span>Model</span> 
                      <ChevronDown className="w-3 h-3 opacity-70" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      title="Attach files"
                      className="p-2 text-gray-500 hover:text-accent dark:text-neutral-400 dark:hover:text-accent rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/70"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button 
                      type="submit" 
                      title="Send message"
                      disabled={!project || !input.trim() || (!!currentSession && isLoadingMessages)}
                      className="p-2 bg-accent hover:bg-accent/90 text-white rounded-lg transition-all duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-800 flex-shrink-0 transform active:scale-95"
                      style={{ width: '40px', height: '40px' }}
                    >
                      <Send className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
} 