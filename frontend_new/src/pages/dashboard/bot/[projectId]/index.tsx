import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, UserCircle, Bot, AlertCircle, RefreshCw, ChevronDown, FileText, MessageSquare, Settings, ArrowLeft, Plus, Trash, Clock } from 'lucide-react';
import DashboardLayout from '../../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../../contexts/AuthContext';
import { API } from '../../../../utils/api';
import CustomButton from '../../../../components/ui/CustomButton';
import GlassCard from '../../../../components/ui/GlassCard';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import type { Project, ChatSession, ChatMessage as ChatMessageType, ApiResponse } from '../../../../types';
import ChatMessageComponent, { EmptyChatState, TypingIndicator } from '../../../../components/ui/ChatMessage';

// Local UI Message type
interface UIMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: string;
  isLoading?: boolean;
}

export default function BotChat() {
  const router = useRouter();
  const { projectId } = router.query;
  const { user, loading: authLoading } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState<boolean>(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(true);
  
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId || !user) return;
      
      try {
        setIsLoadingProject(true);
        setError(null);
        
        console.log('Loading project data for ID:', projectId);
        const projectData = await API.getProject(projectId as string);
        console.log('Project data loaded:', projectData);
        setProject(projectData);
        document.title = `Chat with ${projectData.name} | Nova AI`;
      } catch (err) {
        console.error('Failed to load project:', err);
        setError(`Failed to load agent data. ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoadingProject(false);
      }
    };
    
    loadProject();
  }, [projectId, user]);
  
  // Load chat sessions
  useEffect(() => {
    const loadSessions = async () => {
      if (!projectId || !user) return;
      try {
        setIsLoadingSessions(true);
        const sessionsData: ChatSession[] = await API.listChatSessions(projectId as string);
        console.log('Sessions data from API:', sessionsData); 
        setSessions(sessionsData);
        if (sessionsData.length > 0) {
          const sortedSessions = [...sessionsData].sort(
            (a, b) => new Date(b.updated_at || b.created_at || Date.now()).getTime() - 
                     new Date(a.updated_at || a.created_at || Date.now()).getTime()
          );
          setCurrentSession(sortedSessions[0]);
        }
      } catch (err) {
        console.error('Failed to load chat sessions:', err);
        setError('Failed to load chat sessions. Please refresh the page and try again.');
      } finally {
        setIsLoadingSessions(false);
      }
    };
    loadSessions();
  }, [projectId, user]);
  
  // Load messages when current session changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentSession) return;
      try {
        setIsLoadingMessages(true);
        const messagesDataFromAPI: ChatMessageType[] = await API.getChatMessages(currentSession.id);
        console.log('Messages data from API:', messagesDataFromAPI);
        setMessages(messagesDataFromAPI.map(apiMsg => ({
          id: apiMsg.id,
          content: apiMsg.content,
          sender: apiMsg.role,
          timestamp: apiMsg.created_at || new Date().toISOString(),
        })));
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError('Failed to load chat history. Please refresh and try again.');
      } finally {
        setIsLoadingMessages(false);
      }
    };
    if (currentSession) loadMessages(); else setMessages([]);
  }, [currentSession]);
  
  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Track scroll position for "scroll to bottom" button
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
  
  // Start a new chat session
  const handleNewChat = async () => {
    if (!projectId) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      console.log('Creating new chat session for project:', projectId);
      // Initialize a new chat session
      const session = await API.initChatSession(projectId as string, 'New Chat');
      console.log('New session created:', session);
      
      // Add the new session to the list
      setSessions(prev => [session, ...prev]);
      
      // Set as current session
      setCurrentSession(session);
      
      // Clear messages and add welcome message
      setMessages([{
        id: Date.now().toString(),
        content: `Hello! I'm ${project?.name || 'your AI assistant'}. How can I help you today?`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      }]);
      
      // Focus the input field
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (err) {
      console.error('Failed to start new chat:', err);
      setError(`Failed to start new chat. ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Delete a chat session
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat?')) return;
    
    try {
      console.log('Deleting chat session:', sessionId);
      await API.deleteChatSession(sessionId);
      
      // Remove session from list
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If current session was deleted, set to most recent one
      if (currentSession?.id === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          setCurrentSession(remainingSessions[0]);
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
  
  // Auto-resize the textarea and provide a more modern typing experience
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize the textarea
    e.target.style.height = 'inherit';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };
  
  // Send a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || !projectId) return;
    
    // Make sure we have a session
    if (!currentSession) {
      await handleNewChat();
      // We need to wait a moment for the session to be created and set in state
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!currentSession) {
        console.error("Failed to create a new chat session");
        setError("Failed to create a new chat session. Please try again.");
        return;
      }
    }
    
    const userMessage: UIMessage = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    const placeholderMessage: UIMessage = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      isLoading: true
    };
    
    setMessages(prev => [...prev, userMessage, placeholderMessage]);
    setInput('');
    setIsProcessing(true);
    setError(null);
    
    try {
      const sessionId = currentSession.id;
      // Ensure projectId is a string before passing
      if (typeof projectId !== 'string') {
        setError('Project ID is missing or invalid. Cannot send message.');
        setIsProcessing(false);
        return;
      }
      const backendResponse = await API.sendChatMessage(sessionId, projectId, input);
      console.log('AI completion response:', backendResponse);
      
      setMessages(prev => prev.map(uiMsg => 
        uiMsg.isLoading && uiMsg.sender === 'assistant' ? {
          id: uiMsg.id,
          content: backendResponse.completion,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          isLoading: false
        } : uiMsg
      ));
    } catch (err) {
      console.error('Failed to send message:', err);
      
      // Update the placeholder with an error message
      setMessages(prev => prev.map(uiMsg => 
        uiMsg.isLoading && uiMsg.sender === 'assistant' ? {
          ...uiMsg,
          content: `I encountered an error. ${err instanceof Error ? err.message : 'Please try again.'}`,
          isLoading: false
        } : uiMsg
      ));
      
      setError(`Failed to send message. ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      // Focus back on input
      inputRef.current?.focus();
    }
  };
  
  // Switch to a different session
  const handleSessionClick = (session: ChatSession) => {
    setCurrentSession(session);
  };
  
  // Scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  if (authLoading) return null; // DashboardLayout handles loading state
  
  return (
    <DashboardLayout>
      <Head>
        <title>{project ? `Chat with ${project.name}` : 'AI Chat'} | Nova AI</title>
        <meta name="description" content="Chat with your AI assistant" />
      </Head>
      
      <div className="h-[calc(100vh-4rem)] lg:h-screen flex flex-col lg:flex-row overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-lg text-[hsl(var(--foreground))]"
          >
            {sidebarOpen ? <ArrowLeft className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Chat sidebar - Sessions list */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full lg:w-[280px] xl:w-[320px] border-r border-[hsl(var(--border))] 
                bg-[hsl(var(--secondary))]
                h-full lg:h-full flex flex-col overflow-hidden fixed lg:relative z-40 left-0 top-0"
            >
              <div className="p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                <div className="flex items-center justify-between mb-3">
                  <Link 
                    href="/dashboard/agents" 
                    className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors p-1.5 rounded-md hover:bg-[hsl(var(--muted))]"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                  
                  <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                    {project ? project.name : 'Loading...'}
                  </h2>
                  
                  <Link 
                    href={`/dashboard/bot/${projectId}/settings`} 
                    className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors p-1.5 rounded-md hover:bg-[hsl(var(--muted))]"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                </div>
                
                <CustomButton 
                  onClick={handleNewChat} 
                  variant="default"
                  className="w-full bg-[hsl(var(--chat-accent-light))] text-[hsl(var(--chat-accent-foreground-light))] hover:bg-[hsl(var(--chat-accent-light))]/90"
                  disabled={isProcessing || isLoadingProject}
                  leftIcon={<Plus className="w-4 h-4 mr-1.5" />}
                >
                  New Chat
                </CustomButton>
                
                {error && (
                  <div className="mt-3 p-2.5 text-xs text-[hsl(var(--destructive-foreground))] bg-[hsl(var(--destructive))] rounded-md border border-[hsl(var(--destructive))]/30 flex items-start">
                    <AlertCircle className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {isLoadingSessions ? (
                  <div className="flex justify-center items-center h-full">
                    <LoadingSpinner size="sm" text="Loading chats..." className="text-[hsl(var(--muted-foreground))]" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center pt-8 px-4">
                    <MessageSquare className="w-10 h-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3 opacity-50" />
                    <p className="text-[hsl(var(--muted-foreground))] text-sm font-medium">No chat history</p>
                    <p className="text-[hsl(var(--muted-foreground))] text-xs mt-1">Start a new conversation.</p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {sessions.map(session => (
                      <li key={session.id}>
                        <div
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-all cursor-pointer group
                            ${currentSession?.id === session.id ? 
                              'bg-[hsl(var(--chat-accent-light))] text-[hsl(var(--chat-accent-foreground-light))] shadow-sm' : 
                              'hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                            } flex justify-between items-center`}
                            onClick={() => handleSessionClick(session)}
                        >
                          <div className="flex items-center overflow-hidden flex-1">
                            <MessageSquare className={`w-4 h-4 mr-2.5 flex-shrink-0 
                              ${currentSession?.id === session.id ? 'text-[hsl(var(--chat-accent-foreground-light))]' : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]'}`} />
                            <div className="overflow-hidden flex-1">
                              <p className={`font-medium truncate text-sm ${currentSession?.id === session.id ? '' : 'text-[hsl(var(--foreground))]'}`}>
                                {session.title || 'New Chat'}
                              </p>
                              <p className={`text-xs truncate flex items-center gap-1 ${currentSession?.id === session.id ? 'opacity-80' : 'opacity-60'}`}>
                                <Clock className="w-3 h-3" />
                                {session.updated_at ? 
                                  new Date(session.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric'}) : 
                                  'Just now'}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className={`opacity-0 group-hover:opacity-100 p-1 rounded-md 
                                        hover:bg-[hsl(var(--destructive))]/10 hover:text-[hsl(var(--destructive))] 
                                        ${currentSession?.id === session.id ? 'text-[hsl(var(--chat-accent-foreground-light))]/70 hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--background))] ' : 'text-[hsl(var(--muted-foreground))]'}
                                        transition-all ml-2`}
                            aria-label="Delete chat"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main chat area - ensure it takes remaining space */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[hsl(var(--background))]">
          {/* Chat messages */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto py-2 custom-scrollbar"
          >
            {isLoadingProject && !project ? (
                <div className="flex justify-center items-center h-full">
                    <LoadingSpinner size="lg" text="Loading Agent..." />
                </div>
            ) : isLoadingMessages && messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <LoadingSpinner size="md" text="Loading messages..." />
              </div>
            ) : !isLoadingMessages && messages.length === 0 && currentSession ? (
                // Use the new EmptyChatState component from ChatMessage.tsx
                <EmptyChatState />
            ) : messages.length === 0 && !currentSession && !isLoadingSessions ? (
              <div className="pt-8 text-center">
                 <GlassCard animate={false} glow={false} className="inline-block p-8 max-w-lg mx-auto bg-[hsl(var(--card))] border-[hsl(var(--border))]">
                  <Bot className="w-12 h-12 text-[hsl(var(--chat-accent-light))] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-1.5">
                    {project ? `Chat with ${project.name}` : 'Welcome!'}
                  </h3>
                  <p className="text-[hsl(var(--muted-foreground))] mb-6">
                    Select a chat on the left or start a new one.
                  </p>
                  <CustomButton
                    onClick={handleNewChat}
                    variant="default"
                    className="bg-[hsl(var(--chat-accent-light))] text-[hsl(var(--chat-accent-foreground-light))] hover:bg-[hsl(var(--chat-accent-light))]/90"
                  >
                    Start New Chat
                  </CustomButton>
                </GlassCard>
              </div>
            ) : (
              <div className="w-full mx-auto px-2 sm:px-3 md:px-4">
                {messages.map((uiMessage, index) => {
                  const componentMessage: ChatMessageType = {
                    id: uiMessage.id,
                    session_id: currentSession?.id || 'unknown-session-' + uiMessage.id,
                    content: uiMessage.content,
                    role: uiMessage.sender,
                    created_at: uiMessage.timestamp,
                  };
                  return (
                    <div key={componentMessage.id} className="mb-2">
                      <ChatMessageComponent 
                        message={componentMessage}
                        isNew={index === messages.length - (isProcessing ? 2 : 1) && !isProcessing && componentMessage.role === 'assistant'}
                        isLoading={uiMessage.isLoading}
                      />
                    </div>
                  );
                })}
                
                {/* Placeholder for typing indicator if isProcessing and no assistant message yet */}
                {isProcessing && !messages.find(m => m.isLoading && m.sender === 'assistant') && (
                  <div className="mb-2">
                    <TypingIndicator />
                  </div>
                )}
                
                {/* Invisible element for scrolling to bottom */}
                <div ref={messagesEndRef} className="h-1" /> 
              </div>
            )}
            
            {/* Scroll to bottom button */}
            <AnimatePresence>
              {showScrollButton && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={scrollToBottom}
                  className="fixed bottom-28 right-6 md:bottom-24 md:right-8 bg-blue-500 text-white rounded-full p-2 shadow-lg hover:bg-blue-600 transition-colors z-10"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          
          {/* Clean, minimal chat input */}
          <div className="p-2 sm:p-3 border-t border-gray-200 bg-white">
            <form onSubmit={handleSendMessage} className="w-full mx-auto">
              <div className="flex flex-wrap gap-1 mb-1.5">
                <button
                  type="button"
                  className="inline-flex items-center px-2.5 py-0.5 text-xs rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <svg className="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                  Upload file
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-2.5 py-0.5 text-xs rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <svg className="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Draft for me
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-2.5 py-0.5 text-xs rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <svg className="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                  </svg>
                  Voice input
                </button>
              </div>
              
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleTextareaChange}
                  placeholder={`Message ${project?.name || 'AI assistant'}...`}
                  className="w-full border border-gray-200 rounded-xl px-3 py-1.5 pr-11 text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:border-gray-200 min-h-[38px] max-h-[100px]"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  disabled={!currentSession && !isLoadingSessions}
                />
                
                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing || (!currentSession && !isLoadingSessions)}
                  className="absolute right-1.5 bottom-[6px] p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:bg-blue-400 transition-colors"
                  aria-label="Send message"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              
              <div className="text-xs text-center mt-1 text-gray-500">
                {project ? project.name : 'CS'} may display inaccurate info, including about people, places, or facts.
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 