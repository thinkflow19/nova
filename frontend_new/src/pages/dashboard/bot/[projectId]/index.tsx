import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, UserCircle, Bot, AlertCircle, RefreshCw, ChevronDown, FileText, MessageSquare, Settings, ArrowLeft, Plus, Trash, Clock, Edit3, Menu, X, Search, ExternalLink, LogOut, RefreshCcw, Paperclip, ChevronUp, Sparkles, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '../../../../contexts/AuthContext';
import { getProject, listChatSessions, getChatMessages, initChatSession, deleteChatSession, sendChatMessage } from '@/utils/api';
import type { Project, ChatSession, ChatMessage as ChatMessageTypeFromTypes, ApiResponse } from '@/types/index';
import { SkeletonLoader } from '../../../../components/ui/LoadingSpinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ErrorMessage from '../../../../components/ui/ErrorMessage';
import { extractErrorInfo } from '../../../../utils/error';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import TextareaAutosize from 'react-textarea-autosize';
import { Avatar } from '@/components/ui/Avatar';

const LoadingSpinner = dynamic(() => import('../../../../components/ui/LoadingSpinner'), { ssr: false });
const DashboardLayout = dynamic(() => import('../../../../components/dashboard/DashboardLayout'), { loading: () => <div className="flex items-center justify-center h-screen"><LoadingSpinner size="lg" /></div>, ssr: false });
const ChatMessageComponent = dynamic(() => import('../../../../components/ui/ChatMessage'), { loading: () => <LoadingSpinner size="sm" />, ssr: false });

// Extended ChatMessage interface for UI state, building upon the base type from types.ts
interface ChatMessage extends ChatMessageTypeFromTypes {
  project_id: string;
  isLoading?: boolean;
  error?: string; 
  userAvatar?: string;
  userName?: string;
  agentAvatar?: string;
  agentName?: string;
}

// Modern Welcome Screen Component
interface WelcomeChatScreenProps {
  userName?: string;
  agentName?: string;
  onPromptClick?: (prompt: string) => void;
  onRefreshPrompts?: () => void;
}

const WelcomeChatScreen = ({ userName, agentName, onPromptClick, onRefreshPrompts }: WelcomeChatScreenProps) => {
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${userName || 'there'}`;
    if (hour < 18) return `Good afternoon, ${userName || 'there'}`;
    return `Good evening, ${userName || 'there'}`;
  };

  const prompts = [
    { title: 'Help me brainstorm ideas for a project', icon: '💡' },
    { title: 'Explain a complex concept simply', icon: '🧠' },
    { title: 'Review and improve my writing', icon: '✍️' },
    { title: 'Plan my day effectively', icon: '📅' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-8"
      >
        <div className="relative mb-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-gray-500/10 to-gray-600/10 dark:from-gray-400/20 dark:to-gray-500/20 flex items-center justify-center border border-gray-200/20 dark:border-gray-400/20 backdrop-blur-sm">
            <Sparkles className="w-10 h-10 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gray-500/5 to-gray-600/5 blur-xl"></div>
        </div>
        
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">
          {greeting()}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
          How can I help you today?
        </p>
        {agentName && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You're chatting with <span className="font-medium text-gray-600 dark:text-gray-300">{agentName}</span>
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mb-8"
      >
        {prompts.map((prompt, index) => (
          <motion.button
            key={prompt.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
            onClick={() => onPromptClick && onPromptClick(prompt.title)}
            className="group relative p-4 text-left rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/30 hover:bg-white/80 dark:hover:bg-gray-800/50 hover:border-gray-300/50 dark:hover:border-gray-600/50 transition-all duration-200 backdrop-blur-sm"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{prompt.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {prompt.title}
              </span>
            </div>
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="text-center"
      >
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Choose a suggestion above or start typing below
        </p>
        {onRefreshPrompts && (
          <button
            onClick={onRefreshPrompts}
            className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <RefreshCcw className="w-3 h-3" />
            New suggestions
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default function BotChat() {
  const router = useRouter();
  const { projectId: projectSlug } = router.query;
  const { user, loading: authLoading, signOut } = useAuth();
  
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState<string>('');
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [pageLevelError, setPageLevelError] = useState<string | null>(null);
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
    error: projectQueryError,
    refetch: refetchProject,
  } = useQuery(['project', projectSlug], () => getProject(projectSlug as string), {
    enabled: !!projectSlug && !!user,
    retry: 2,
  });
  
  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    error: sessionsQueryError,
    refetch: refetchSessions,
  } = useQuery(['sessions', project?.id], () => listChatSessions(project?.id as string), {
    enabled: !!project?.id && !!user,
    retry: 2,
  });
  
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    error: messagesQueryError,
    refetch: refetchMessages,
  } = useQuery<ChatMessage[], Error>(
    ['messages', currentSession?.id],
    async () => {
      if (!currentSession) return [];
      const rawMessages: ChatMessageTypeFromTypes[] = await getChatMessages(currentSession.id);
      return rawMessages.map(m => ({
        ...m,
        project_id: project?.id as string,
        isLoading: false,
        error: undefined,
      })) as ChatMessage[];
    },
    {
      enabled: !!currentSession,
      retry: 2,
    }
  );

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
  
  useEffect(() => {
    if (router.query.session && sessions.length > 0) {
      const sessionId = router.query.session as string;
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setCurrentSession(session);
      }
    }
  }, [router.query.session, sessions]);
  
  const handleNewChat = async () => {
    if (!project?.id) return;
    setPageLevelError(null);
    try {
      const session = await initChatSession(project?.id as string, 'New Chat ' +  new Date().toLocaleTimeString());
      queryClient.setQueryData(['sessions', project?.id], (oldData: ChatSession[] = []) => [session, ...oldData]);
      setCurrentSession(session);
      refetchMessages();
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error('Failed to start new chat:', err);
      const errorInfo = extractErrorInfo(err);
      setPageLevelError(`Failed to start new chat. ${errorInfo.message}`);
    }
  };
  
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat?')) return;
    setPageLevelError(null);
    try {
      await deleteChatSession(sessionId);
      queryClient.setQueryData(['sessions', project?.id], (oldData: ChatSession[] = []) => oldData.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          setCurrentSession(remainingSessions[0]);
        } else {
          refetchMessages();
        }
      }
    } catch (err) {
      console.error('Failed to delete chat session:', err);
      const errorInfo = extractErrorInfo(err);
      setPageLevelError(`Failed to delete chat. ${errorInfo.message}`);
    }
  };
  
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'inherit';
    const maxHeight = 5 * 24; 
    e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`; 
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !project?.id || (!!currentSession && isLoadingMessages)) return;
    setPageLevelError(null);
    
    let sessionToUse = currentSession;
    const tempUserMessageId = 'temp-user-' + Date.now();
    const optimisticUserMessage: ChatMessage = {
      id: tempUserMessageId,
      project_id: project?.id as string,
      session_id: sessionToUse ? sessionToUse.id : 'temp-session',
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
      userAvatar: user?.user_metadata?.avatar_url,
      userName: user?.user_metadata?.full_name || 'User',
    };

    queryClient.setQueryData<ChatMessage[]>(['messages', sessionToUse?.id], (oldMessages = []) => [
      ...oldMessages,
      optimisticUserMessage,
    ]);

    const currentInput = input;
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'inherit';
    }

    if (!sessionToUse) {
      try {
        const newSession = await initChatSession(project?.id as string, currentInput.substring(0, 30));
        queryClient.setQueryData(['sessions', project?.id], (oldData: ChatSession[] = []) => [newSession, ...oldData]);
        setCurrentSession(newSession);
        sessionToUse = newSession; 
        
        queryClient.setQueryData<ChatMessage[]>(['messages', newSession.id], (oldMsgs) => {
            const currentMessages = Array.isArray(oldMsgs) ? oldMsgs : [];
            const userMsgIndex = currentMessages.findIndex(m => m.id === tempUserMessageId);
            if(userMsgIndex !== -1) {
                const updatedMessages = [...currentMessages];
                updatedMessages[userMsgIndex] = {
                    ...updatedMessages[userMsgIndex],
                    session_id: newSession.id,
                 };
                return updatedMessages;
            }
            return [{ ...optimisticUserMessage, session_id: newSession.id }]; 
        });

      } catch (err) {
        console.error('Failed to initialize session:', err);
        const errorInfo = extractErrorInfo(err);
        setPageLevelError(`Failed to start chat. ${errorInfo.message}`);
        queryClient.setQueryData<ChatMessage[]>(['messages', sessionToUse?.id], (oldMessages = []) => 
            oldMessages.filter(m => m.id !== tempUserMessageId)
        );
        setInput(currentInput);
        return;
      } 
    }

    const tempAssistantMessageId = 'temp-assistant-' + Date.now();
    const optimisticAssistantMessage: ChatMessage = {
      id: tempAssistantMessageId,
      project_id: project?.id as string,
      session_id: sessionToUse.id,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isLoading: true,
      agentAvatar: project?.avatar_url, 
      agentName: project?.name || 'Agent',
    };

     queryClient.setQueryData<ChatMessage[]>(['messages', sessionToUse.id], (oldMessages = []) => [
      ...oldMessages,
      optimisticAssistantMessage,
    ]);

    try {
      const response = await sendChatMessage(sessionToUse.id, project?.id as string, currentInput);
      queryClient.setQueryData<ChatMessage[]>(['messages', sessionToUse.id], (oldMessages = []) => 
        oldMessages.map(msg => 
          msg.id === tempAssistantMessageId 
            ? { 
                ...msg,
        content: response.completion,
                session_id: response.session_id,
        isLoading: false,
                error: undefined,
              } 
            : msg
        )
      );
      refetchSessions(); 
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorInfo = extractErrorInfo(err);
      queryClient.setQueryData<ChatMessage[]>(['messages', sessionToUse.id], (oldMessages = []) => 
        oldMessages.map(msg => 
          msg.id === tempAssistantMessageId 
            ? { ...msg, isLoading: false, error: `Failed to get response. ${errorInfo.message}`, content: '' } 
            : msg
        )
      );
    }
  };
  
  const handleSessionClick = (session: ChatSession) => {
    setCurrentSession(session);
    setMobileSidebarOpen(false);
    setPageLevelError(null);
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleRefreshPrompts = () => {
    // Placeholder for future implementation
  };

  const filteredSessions = sessions.filter(s => s.name?.toLowerCase().includes(sessionSearchTerm.toLowerCase()));

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (authLoading || isLoadingProject) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (projectQueryError || !project) {
    const errorInfo = extractErrorInfo(projectQueryError);
    return <DashboardLayout><ErrorMessage message={`Error loading project: ${errorInfo.message}`} code={errorInfo.code} onRetry={refetchProject} /></DashboardLayout>;
  }

  const handleRetryMessage = (messageId: string) => {
    console.log("Retrying message (not fully implemented):", messageId);
    if (currentSession) {
      refetchMessages();
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>{project ? `${project.name} - Chat` : 'Chat'} - Nova AI</title>
      </Head>

      {/* Fixed Height Container */}
      <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
        
        {/* Desktop Sidebar - Fixed Width & Height */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              key="sidebar"
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="hidden md:flex w-80 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col"
            >
              {/* Sidebar Header - Fixed Height */}
              <div className="h-20 flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Conversations</h2>
                  <button 
                    onClick={handleNewChat} 
                    className="w-9 h-9 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input 
                    type="search"
                    placeholder="Search..."
                    className="w-full h-9 pl-10 pr-3 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100 text-gray-900 dark:text-white"
                    value={sessionSearchTerm}
                    onChange={(e) => setSessionSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Sessions List - Scrollable */}
              <div className="flex-1 overflow-y-auto p-2">
                {isLoadingSessions ? (
                  <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Loading...
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <MessageSquare className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No conversations</p>
                  </div>
                ) : (
                  filteredSessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => handleSessionClick(session)}
                      className={`group p-3 m-1 rounded-lg cursor-pointer transition-colors ${
                        currentSession?.id === session.id 
                          ? "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600" 
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {session.name || 'New Chat'}
                          </p>
                          {session.last_message_at && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(session.last_message_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button 
                          onClick={(e) => handleDeleteSession(session.id, e)} 
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 transition-all"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Sidebar Footer - Fixed Height */}
              <div className="h-16 flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => { signOut(); router.push('/login');}} 
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut size={16}/>
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Mobile Sidebar */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
              <motion.div 
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                className="relative w-80 h-full bg-white dark:bg-gray-800 shadow-xl"
              >
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="h-full pt-16">
                  {/* Same content as desktop sidebar */}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Chat Area - Fixed Height */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-gray-800">
          
          {/* Chat Header - Fixed Height */}
          {currentSession && project && (
            <div className="h-16 flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setMobileSidebarOpen(true)}
                  className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gray-700 dark:bg-gray-300 rounded-full flex items-center justify-center text-white dark:text-gray-800 font-medium text-sm">
                      {project?.name ? project.name.charAt(0).toUpperCase() : "A"}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  </div>
                  <div>
                    <h1 className="text-sm font-semibold text-gray-900 dark:text-white">{project?.name || "Agent"}</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{currentSession.name || 'Active conversation'}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => refetchMessages()} 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Messages Area - Flexible Height with Scroll */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            <div 
              ref={messagesContainerRef} 
              className="flex-1 overflow-y-auto px-6 py-6"
            >
              {/* Loading */}
              {isLoadingMessages && messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center gap-3 text-gray-500">
                    <LoadingSpinner size="lg" />
                    <span>Loading messages...</span>
                  </div>
                </div>
              )}

              {/* Welcome Screen */}
              {!currentSession && !isLoadingSessions && (
                <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                      Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">How can I help you today?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                    {[
                      { title: 'Help me brainstorm ideas', icon: '💡' },
                      { title: 'Explain a complex concept', icon: '🧠' },
                      { title: 'Review my writing', icon: '✍️' },
                      { title: 'Plan my schedule', icon: '📅' },
                    ].map((prompt) => (
                      <button
                        key={prompt.title}
                        onClick={() => handlePromptClick(prompt.title)}
                        className="p-4 text-left rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{prompt.icon}</span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {prompt.title}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="space-y-6">
                {messages.map((msg) => (
                  <ChatMessageComponent
                    key={msg.id}
                    {...msg} 
                    userAvatar={user?.user_metadata?.avatar_url}
                    agentAvatar={project?.avatar_url}
                    agentName={project?.name || 'Agent'}
                    userName={user?.user_metadata?.full_name || 'You'}
                    onRetry={msg.role === 'assistant' && msg.error ? () => handleRetryMessage(msg.id) : undefined}
                  />
                ))}
              </div>
              
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll Button */}
            {showScrollButton && (
              <div className="absolute bottom-24 right-6">
                <button
                  onClick={scrollToBottom}
                  className="w-10 h-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {/* Error */}
          {pageLevelError && (
            <div className="flex-shrink-0 p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
              <div className="text-sm text-red-700 dark:text-red-300">{pageLevelError}</div>
            </div>
          )}

          {/* Input Area - Fixed Height */}
          {(currentSession || !isLoadingSessions) && (
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
                <div className="relative">
                  <div className="flex items-start gap-2">
                    {/* Input Options */}
                    <div className="flex flex-col gap-1 pt-3">
                      <button
                        type="button"
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Attach file"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Add emoji"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Text Input */}
                    <div className="flex-1 relative">
                      <TextareaAutosize
                        ref={inputRef}
                        value={input}
                        onChange={handleTextareaChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e as any); 
                          }
                        }}
                        placeholder={`Message ${project?.name || 'AI'}...`}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-gray-900 dark:focus:border-gray-100 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none min-h-[96px] max-h-[200px]"
                        minRows={3}
                        maxRows={6}
                        disabled={isLoadingMessages}
                      />
                      
                      {/* Send Button */}
                      <button 
                        type="submit" 
                        disabled={!input.trim() || isLoadingMessages} 
                        className="absolute right-2 bottom-2 w-10 h-10 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white dark:text-gray-900 rounded-lg flex items-center justify-center transition-colors disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Voice Input Option */}
                    <div className="flex flex-col gap-1 pt-3">
                      <button
                        type="button"
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Voice input"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}