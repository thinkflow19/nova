import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  UserCircle,
  Bot as BotIcon,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Plus,
  Trash2 as Trash,
  Search,
  Menu,
  X,
  Paperclip,
  MessageSquare,
  Users,
  ChevronLeft,
  LogOut,
  Loader2,
  Settings2,
  Sun,
  Moon,
  ChevronsUpDown,
  Check,
  Edit3,
  Brain,
  FileText,
  Maximize,
  Minimize,
  CornerDownLeft,
  Sparkles,
  Zap,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  getProject,
  listProjects,
  listChatSessions,
  getChatMessages,
  initChatSession,
  deleteChatSession,
  sendChatMessage,
} from '@/utils/api';
import type { Project, ChatSession, ChatMessage as APIChatMessageType } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ErrorMessage from '../../../components/ui/ErrorMessage';
import { extractErrorInfo } from '../../../utils/error';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import TextareaAutosize from 'react-textarea-autosize';
import { Avatar } from '@/components/ui/Avatar';
import { Select, SelectItem } from '@/components/ui/Select';
import ChatMessage, { ChatMessageProps } from '../../../components/ui/ChatMessage';

const LoadingSpinner = dynamic(() => import('../../../components/ui/LoadingSpinner'), { ssr: false });
const DashboardLayout = dynamic(() => import('../../../components/dashboard/DashboardLayout'), {
  loading: () => <div className="flex items-center justify-center h-screen bg-background text-foreground"><LoadingSpinner size="lg" /></div>,
  ssr: false 
});

interface UIMessage extends ChatMessageProps {
  session_id?: string;
}

const scrollbarStyles = {
  '&::-webkit-scrollbar': {
    width: '6px',
    height: '6px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'hsl(var(--nova-muted-foreground) / 0.3)',
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: 'hsl(var(--nova-muted-foreground) / 0.5)',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  scrollbarWidth: 'thin' as 'thin', // For Firefox
  scrollbarColor: 'hsl(var(--nova-muted-foreground) / 0.3) transparent', // For Firefox
};

const suggestedPrompts = [
  { title: "Explain quantum computing in simple terms", description: "Focus on analogies" },
  { title: "Give me 10 blog post ideas about AI ethics", description: "Include pros and cons" },
  { title: "Compare Next.js and Remix for web dev", description: "Highlight key differences" },
  { title: "Write a short poem about space exploration", description: "Evoke wonder and curiosity" },
];

const ChatsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const queryClient = useQueryClient();

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState<string>('');
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [pageLevelError, setPageLevelError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [sessionSearchTerm, setSessionSearchTerm] = useState<string>("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch all projects (agents)
  const { data: projects = [], isLoading: isLoadingProjects, error: projectsError }
    = useQuery<Project[], Error>({
      queryKey: ['projects'], 
      queryFn: listProjects, 
      enabled: !!user 
    });

  const selectedAgent = useMemo(() => projects.find(p => p.id === selectedAgentId), [projects, selectedAgentId]);

  // Auto-select agent from URL query or first available if none in URL
  useEffect(() => {
    if (projects.length > 0) {
      const agentIdFromQuery = router.query.agent as string;
      if (agentIdFromQuery && projects.some(p => p.id === agentIdFromQuery)) {
        setSelectedAgentId(agentIdFromQuery);
      }
    }
  }, [router.query.agent, projects]);

  // Fetch chat sessions for selected agent
  const { data: sessions = [], isLoading: isLoadingSessions, error: sessionsError }
    = useQuery<ChatSession[], Error>({
      queryKey: ['sessions', selectedAgentId], 
      queryFn: () => listChatSessions(selectedAgentId!),
      enabled: !!selectedAgentId && !!user,
    });

  const currentSession = useMemo(() => sessions.find(s => s.id === currentSessionId), [sessions, currentSessionId]);

  // Auto-select session from URL query or most recent for the agent
  useEffect(() => {
    if (sessions.length > 0 && selectedAgentId) {
      const sessionIdFromQuery = router.query.session as string;
      if (sessionIdFromQuery && sessions.some(s => s.id === sessionIdFromQuery)) {
        setCurrentSessionId(sessionIdFromQuery);
      }
    }
  }, [router.query.session, sessions, selectedAgentId]);

  // Fetch messages for current session
  const { data: messages = [], isLoading: isLoadingMessages, error: messagesError, refetch: refetchMessages }
    = useQuery<UIMessage[], Error>({
      queryKey: ['messages', currentSessionId], 
      queryFn: async () => {
        if (!currentSessionId || !selectedAgentId) return [];
        const apiMessages: APIChatMessageType[] = await getChatMessages(currentSessionId);
        return apiMessages.map(m => ({
          ...m,
          session_id: currentSessionId,
          isLoading: false,
          error: undefined,
          userAvatar: user?.user_metadata?.avatar_url,
          userName: user?.user_metadata?.full_name || 'User',
          agentAvatar: selectedAgent?.avatar_url,
          agentName: selectedAgent?.name || 'Agent',
        })) as UIMessage[];
      },
      enabled: !!currentSessionId && !!selectedAgentId && !!user,
    });

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('auto');
    }
  }, [messages, scrollToBottom]);
  
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const isScrolledUp = container.scrollTop < container.scrollHeight - container.clientHeight - 150;
      setShowScrollButton(isScrolledUp);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    setCurrentSessionId(null);
    setPageLevelError(null);
    queryClient.removeQueries(['sessions', selectedAgentId]); // Invalidate old agent sessions
    queryClient.removeQueries(['messages']); // Clear all messages
    router.replace(`/dashboard/chats?agent=${agentId}`, undefined, { shallow: true });
  };

  const handleSessionClick = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setPageLevelError(null);
    router.replace(`/dashboard/chats?agent=${selectedAgentId}&session=${sessionId}`, undefined, { shallow: true });
  };

  const { mutate: createNewSession, isLoading: isCreatingSession } = useMutation(
    async () => {
      if (!selectedAgentId) throw new Error("No agent selected");
      const sessionName = `Chat ${new Date().toLocaleTimeString([], { day: 'numeric', month:'short', hour: '2-digit', minute:'2-digit' })}`;
      return initChatSession(selectedAgentId, sessionName);
    },
    {
      onSuccess: (newSession) => {
        queryClient.setQueryData<ChatSession[]>(['sessions', selectedAgentId], (oldSessions = []) => [newSession, ...oldSessions]);
        setCurrentSessionId(newSession.id);
        router.replace(`/dashboard/chats?agent=${selectedAgentId}&session=${newSession.id}`, undefined, { shallow: true });
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 100);
      },
      onError: (err) => {
        const errorInfo = extractErrorInfo(err);
        setPageLevelError(`Failed to start new chat: ${errorInfo.message}`);
      }
    }
  );

  const { mutate: deleteSession } = useMutation(
    (sessionId: string) => deleteChatSession(sessionId),
    {
      onSuccess: (deletedSessionId, variables) => {
        queryClient.setQueryData<ChatSession[]>(['sessions', selectedAgentId], (oldSessions = []) => 
          oldSessions.filter(s => s.id !== variables)
        );
        if (currentSessionId === variables) {
          const remainingSessions = sessions.filter(s => s.id !== variables);
          if (remainingSessions.length > 0) {
             const mostRecentRemaining = remainingSessions.sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
             setCurrentSessionId(mostRecentRemaining.id);
             router.replace(`/dashboard/chats?agent=${selectedAgentId}&session=${mostRecentRemaining.id}`, undefined, { shallow: true });
          } else {
            setCurrentSessionId(null);
            router.replace(`/dashboard/chats?agent=${selectedAgentId}`, undefined, { shallow: true });
          }
        }
      },
      onError: (err) => {
        const errorInfo = extractErrorInfo(err);
        setPageLevelError(`Failed to delete chat: ${errorInfo.message}`);
      }
    }
  );

  const { mutate: sendMessage, isLoading: isSendingMessage } = useMutation(
    async (messageContent: string) => {
      if (!currentSessionId || !selectedAgentId) throw new Error("No active session or agent");
      
      const tempUserMessageId = 'temp-user-' + Date.now();
      const optimisticUserMessage: UIMessage = {
        id: tempUserMessageId,
        session_id: currentSessionId,
        role: 'user',
        content: messageContent,
        createdAt: new Date().toISOString(),
        userAvatar: user?.user_metadata?.avatar_url,
        userName: user?.user_metadata?.full_name || 'User',
        agentAvatar: selectedAgent?.avatar_url,
        agentName: selectedAgent?.name || 'Agent',
      };

      queryClient.setQueryData<UIMessage[]>(['messages', currentSessionId], (oldMessages = []) => [
        ...oldMessages,
        optimisticUserMessage,
      ]);
      
      const tempBotMessageId = 'temp-assistant-' + Date.now();
      const optimisticBotMessage: UIMessage = {
        id: tempBotMessageId,
        session_id: currentSessionId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        isLoading: true,
        agentAvatar: selectedAgent?.avatar_url,
        agentName: selectedAgent?.name || 'Agent',
      };

      queryClient.setQueryData<UIMessage[]>(['messages', currentSessionId], (oldMessages = []) => [
        ...oldMessages,
        optimisticBotMessage,
      ]);

      return sendChatMessage(currentSessionId, selectedAgentId, messageContent)
        .then(response => ({
            ...response,
            tempBotMessageId
        }))    
    },
    {
      onSuccess: (response) => {
        queryClient.setQueryData<UIMessage[]>(['messages', currentSessionId], (oldMessages = []) => 
          oldMessages.map(msg => 
            msg.id === response.tempBotMessageId
              ? { 
                  ...msg,
                  id: response.id, // Use actual ID from server
                  content: response.completion,
                  isLoading: false,
                } 
              : msg
          )
        );
        // Update session's last_message_at time
        queryClient.invalidateQueries(['sessions', selectedAgentId]);
      },
      onError: (err) => {
        const errorInfo = extractErrorInfo(err);
        queryClient.setQueryData<UIMessage[]>(['messages', currentSessionId], (oldMessages = []) => 
          oldMessages.map(msg => 
            (msg.isLoading && msg.role === 'assistant' && msg.id === (err as any)?.context?.tempBotMessageId) // Ensure we target the correct optimistic message
              ? { ...msg, isLoading: false, error: `Failed to get response. ${errorInfo.message}`, content: '' } 
              : msg
          )
        );
        setPageLevelError(`Failed to send message. ${errorInfo.message}`);
      },
      onSettled: () => {
        //No global refetch here, rely on optimistic updates and specific invalidations
      }
    }
  );

  const handleSendMessage = (e?: React.FormEvent, promptContent?: string) => {
    if (e) e.preventDefault();
    const messageText = promptContent || input;
    if (!messageText.trim() || !selectedAgentId || !currentSessionId || isSendingMessage) return;
    
    sendMessage(messageText);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleRetryMessage = (messageId: string) => {
    const messageToRetry = messages.find(m => m.id === messageId);
    const userMessageIndex = messages.findIndex(m => m.id === messageId) -1; // Assumes user message is right before
    const userMessageBeforeError = userMessageIndex >=0 ? messages[userMessageIndex] : null;

    if (userMessageBeforeError && userMessageBeforeError.role === 'user' && currentSessionId) {
        queryClient.setQueryData<UIMessage[]>(['messages', currentSessionId], (oldMessages = []) => 
            oldMessages.filter(m => m.id !== messageId)
        );
        sendMessage(userMessageBeforeError.content);
    } else {
        setPageLevelError("Could not retry message. Original prompt not found or structure is unexpected.");
    }
  };
  
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions
      .filter(s => 
        s.title?.toLowerCase().includes(sessionSearchTerm.toLowerCase()) || 
        s.id.toLowerCase().includes(sessionSearchTerm.toLowerCase())
      )
      .sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [sessions, sessionSearchTerm]);

  if (authLoading || (isLoadingProjects && !projects.length && !projectsError)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }
  
  const PageNotice = () => {
    const errorToShow = pageLevelError || extractErrorInfo(projectsError || sessionsError || messagesError)?.message;
    if (errorToShow) return <ErrorMessage message={errorToShow} onRetry={() => setPageLevelError(null)} className="m-4" />;
    return null;
  }

  const showWelcomeScreen = !selectedAgentId && !isLoadingProjects;
  const showNoSessionSelected = selectedAgentId && !currentSessionId && !isLoadingSessions && sessions.length === 0;
  const showEmptyChat = selectedAgentId && currentSessionId && messages.length === 0 && !isLoadingMessages;

  return (
    <DashboardLayout>
      <Head>
        <title>{selectedAgent ? `${selectedAgent.name} - Chat` : 'Chat'} - Nova AI</title>
      </Head>

      <div className="flex h-full bg-background text-foreground">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-[280px] flex-shrink-0 bg-card border-r border-border flex flex-col h-full fixed lg:static z-40 shadow-lg lg:shadow-none"
            >
              {/* Agent Selector */}
              <div className="p-3 border-b border-border">
                <Select
                  value={selectedAgentId || ''}
                  onValueChange={(value: string) => { if(value) handleAgentSelect(value); }}
                  placeholder="Select an Agent"
                  disabled={isLoadingProjects}
                >
                  {isLoadingProjects && <SelectItem value="loading" disabled>Loading agents...</SelectItem>}
                  {projects.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <Avatar 
                          src={agent.avatar_url || undefined} 
                          alt={agent.name}
                          fallback={agent.name?.[0]?.toUpperCase()}
                          className="w-5 h-5 text-xs"
                        />
                        {agent.name}
                      </div>
                    </SelectItem>
                  ))}
                  {!isLoadingProjects && projects.length === 0 && (
                      <SelectItem value="no-agents" disabled>No agents found.</SelectItem>
                  )}
                </Select>
              </div>

              {/* Chat History */}
              {selectedAgentId && (
                <div className="p-3 border-b border-border">
                  <div className="flex items-center justify-between mb-2.5">
                    <h2 className="text-sm font-semibold text-foreground/80">Chat History</h2>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => createNewSession()} 
                      disabled={isCreatingSession || !selectedAgentId}
                      className="text-muted-foreground hover:text-primary"
                      title="New Chat"
                    >
                      {isCreatingSession ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search chats..."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-background border-border focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
                      value={sessionSearchTerm}
                      onChange={(e) => setSessionSearchTerm(e.target.value)}
                      disabled={!selectedAgentId || isLoadingSessions}
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              )}

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-2 min-h-0" style={scrollbarStyles}>
                {selectedAgentId ? (
                  isLoadingSessions ? (
                    <div className="flex items-center justify-center h-20">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredSessions.length > 0 ? (
                    filteredSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => handleSessionClick(session.id)}
                        className={cn(
                          "w-full text-left p-2.5 rounded-md mb-1 transition-all duration-150 group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                          session.id === currentSessionId 
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <p className="font-medium text-xs truncate pr-6">
                          {session.title || 'New Chat'}
                        </p>
                        <p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">
                          {session.updated_at ? new Date(session.updated_at).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric'}) : 'No messages'}
                        </p>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete chat"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </Button>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 px-3">
                      <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-xs text-muted-foreground">
                        No chats with {selectedAgent?.name || 'this agent'} yet.
                      </p>
                      <Button variant="link" size="sm" onClick={() => createNewSession()} className="mt-1 text-xs text-primary hover:text-primary/80">
                        Start one now
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 px-3">
                    <Users className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-xs text-muted-foreground">Select an agent to see chat history.</p>
                  </div>
                )}
              </div>
              
              {/* User Info */}
               <div className="p-3 border-t border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Avatar className="w-7 h-7 bg-card text-foreground">
                            {user?.email?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{user?.user_metadata?.full_name || user?.email}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => signOut()} title="Log Out" className="text-muted-foreground hover:text-danger">
                        <LogOut className="w-4 h-4"/>
                    </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative bg-background">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shadow-sm">
            <div className="flex items-center gap-2.5">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="lg:hidden text-muted-foreground hover:text-foreground"
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              {selectedAgent ? (
                <div className="flex items-center gap-2.5">
                  <Avatar 
                    src={selectedAgent.avatar_url || undefined} 
                    alt={selectedAgent.name} 
                    fallback={selectedAgent.name?.[0]?.toUpperCase()} 
                    className="w-8 h-8 text-sm"
                  />
                  <div>
                    <h2 className="font-medium text-sm text-foreground leading-tight">
                      {selectedAgent.name}
                    </h2>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {currentSession?.title ? `Chatting: ${currentSession.title}` : 'Select or start a new chat'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 text-foreground">
                  <Brain className="w-5 h-5 text-muted-foreground" /> 
                  <span className="font-medium text-sm">Nova Chat</span>
                </div>
              )}
            </div>
          </div>
          
          <PageNotice />

          {/* Messages */} 
          <div className="flex-1 flex flex-col min-h-0 relative">
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-1"
              style={scrollbarStyles}
            >
            {showWelcomeScreen && (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1}} transition={{ delay: 0.2, duration: 0.4}}
                        className="p-8 max-w-md bg-card rounded-xl shadow-premium"
                    >
                        <Brain className="w-16 h-16 text-primary mx-auto mb-6" />
                        <h1 className="text-2xl font-semibold text-foreground mb-2">Welcome to Nova Chat</h1>
                        <p className="text-muted-foreground mb-6">
                            Select an AI agent from the sidebar to begin your conversation.
                        </p>
                        {/* Optional: Button to open agent selection if sidebar is closed on mobile */}
                        {projects.length === 0 && !isLoadingProjects &&
                          <p className="text-sm text-warning">No agents found. Please create one first.</p>
                        }
                    </motion.div>
                </div>
            )}

            {showNoSessionSelected && selectedAgent && (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 max-w-md bg-card rounded-xl shadow-premium">
                        <MessageSquare className="w-12 h-12 text-primary/70 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            Start a conversation with {selectedAgent.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Create a new chat session or select an existing one from the history.
                        </p>
                        <Button onClick={() => createNewSession()} disabled={isCreatingSession} className="bg-primary text-primary-foreground hover:bg-primary-hover">
                            {isCreatingSession ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                            New Chat with {selectedAgent.name}
                        </Button>
                    </motion.div>
                </div>
            )}

            {currentSessionId && messages.length > 0 && (
                messages.map((message, index) => (
                    <ChatMessage
                    key={message.id || `msg-${index}`}
                    {...message}
                    onRetry={message.role === 'assistant' && message.error ? handleRetryMessage : undefined}
                    isLastMessage={index === messages.length - 1}
                    />
                ))
            )}

            {showEmptyChat && selectedAgent && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
                        <div className="mb-8">
                            <Avatar 
                                src={selectedAgent.avatar_url || undefined} 
                                alt={selectedAgent.name} 
                                fallback={selectedAgent.name?.[0]?.toUpperCase()} 
                                className="w-16 h-16 text-2xl mx-auto mb-3 ring-2 ring-border p-0.5 shadow-md"
                            />
                            <h2 className="text-xl font-semibold text-foreground">Chat with {selectedAgent.name}</h2>
                            <p className="text-sm text-muted-foreground">No messages yet. Send one below or use a suggestion.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                            {suggestedPrompts.map(prompt => (
                                <button
                                    key={prompt.title}
                                    onClick={() => handleSendMessage(undefined, prompt.title + (prompt.description ? `\n(${prompt.description})` : ''))}
                                    className="text-left p-3 bg-card hover:bg-muted/30 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm border border-border hover:border-primary/50"
                                >
                                    <p className="font-medium text-sm text-foreground">{prompt.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{prompt.description}</p>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}

            {isLoadingMessages && messages.length === 0 && currentSessionId && (
                <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <p className="text-sm">Loading messages...</p>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
            </div>

            {showScrollButton && (
              <button
                onClick={() => scrollToBottom('smooth')}
                className="absolute bottom-24 right-6 z-10 p-2.5 bg-card hover:bg-muted/50 rounded-full shadow-premium border border-border transition-all text-muted-foreground hover:text-foreground"
                aria-label="Scroll to bottom"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}

            {selectedAgentId && currentSessionId && (
              <div className="flex-shrink-0 px-4 md:px-6 py-3.5 bg-card border-t border-border shadow-sm">
                <form onSubmit={handleSendMessage} className="relative flex items-end gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 flex-shrink-0"
                    title="Attach files (coming soon)"
                    disabled
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <TextareaAutosize
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleTextareaKeyDown}
                    placeholder={`Message ${selectedAgent?.name || 'AI assistant'}... (Shift+Enter for newline)`}
                    className="w-full pl-4 pr-12 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground resize-none min-h-[48px] max-h-[200px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm text-sm leading-relaxed transition-all duration-150"
                    minRows={1}
                    maxRows={8}
                    disabled={isSendingMessage || isLoadingMessages || !currentSessionId}
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={!input.trim() || isSendingMessage || isLoadingMessages || !currentSessionId}
                    className={cn(
                      "p-2.5 rounded-lg transition-all duration-150 flex-shrink-0 absolute right-2 bottom-[7px]",
                      (input.trim() && !isSendingMessage && !isLoadingMessages && currentSessionId)
                        ? "bg-primary text-primary-foreground hover:bg-primary-hover shadow-md"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                    title="Send message (Enter)"
                    aria-label="Send message"
                  >
                    {isSendingMessage ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground/70 mt-2 text-center">
                    AI responses can be inaccurate. Verify important information.
                </p>
              </div>
            )}
            
            {selectedAgentId && !currentSessionId && !isLoadingSessions && !showNoSessionSelected && !showWelcomeScreen && (
                 <div className="flex-shrink-0 px-4 md:px-6 py-4 bg-card border-t border-border flex flex-col items-center justify-center h-[140px]">
                    <p className="text-sm text-muted-foreground mb-3 text-center">Select or create a chat session to begin with {selectedAgent?.name}.</p>
                    <Button onClick={() => createNewSession()} disabled={isCreatingSession} className="bg-primary text-primary-foreground hover:bg-primary-hover">
                        {isCreatingSession ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        New Chat with {selectedAgent?.name}
                    </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatsPage; 