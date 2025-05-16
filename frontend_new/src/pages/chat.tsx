import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Send, Menu, X, ArrowLeft, Settings, Download, Trash2, User, Bot, Loader2, Paperclip } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { ChatMessage, Project } from '../types';
import Button from '../components/ui/Button';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const MessageInput = ({ onSendMessage, isLoading, disabled = false }: MessageInputProps) => {
  const [message, setMessage] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <form 
      onSubmit={handleSubmit} 
      className="sticky bottom-0 left-0 right-0 bg-bg-main/80 backdrop-blur-md p-3 md:p-4 border-t border-border-color shadow-[-4px_0_12px_rgba(0,0,0,0.1)]"
    >
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <div className="relative flex-grow bg-bg-panel rounded-xl shadow-md border border-border-color focus-within:ring-2 focus-within:ring-theme-primary transition-all">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="w-full resize-none rounded-xl border-none bg-transparent p-3 pr-10 text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-60"
            rows={1}
            disabled={disabled || isLoading}
          />
        </div>
        <Button
          type="submit"
          disabled={!message.trim() || isLoading || disabled}
          size="icon" 
          className="h-11 w-11 flex-shrink-0 text-lg"
          isLoading={isLoading}
        >
          {!isLoading && <Send className="h-5 w-5" />}
        </Button>
      </div>
    </form>
  );
};

export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessage, setIsLoadingMessage] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { id: projectId } = router.query;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (projectId && typeof projectId === 'string') {
      const fetchProjectData = async () => {
        setIsLoadingMessage(true);
        setProject({ id: projectId, name: 'Customer Support Bot', description: 'AI assistant for customer support', created_at: '', user_id: '' });
        setMessages([
          { id: '1', session_id: '123', role: 'assistant', content: 'Hello! I am Nova, your AI assistant. How can I assist you today?', created_at: new Date().toISOString() },
          { id: '2', session_id: '123', role: 'user', content: 'I need help with my account.', created_at: new Date().toISOString() },
          { id: '3', session_id: '123', role: 'assistant', content: 'Sure, I can help with that. Could you please tell me more about the issue you are facing with your account? For example, are you having trouble logging in, or is it related to billing?' , created_at: new Date().toISOString()},
        ]);
        setIsLoadingMessage(false);
      };
      fetchProjectData();
    }
  }, [projectId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!project) return;
    const userMessage: ChatMessage = {
      id: Date.now().toString(), session_id: '123', role: 'user', content, created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoadingMessage(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const aiResponse: ChatMessage = {
      id: (Date.now() + 1).toString(), session_id: '123', role: 'assistant',
      content: `Received: "${content}". I am processing your request. This is a mock response.`, created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, aiResponse]);
    setIsLoadingMessage(false);
  };

  const renderMessageContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <p key={i} className={`whitespace-pre-wrap ${i > 0 ? 'mt-1' : ''}`}>
        {line}
      </p>
    ));
  };

  if (authLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-main">
        <Loader2 className="h-8 w-8 animate-spin text-theme-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-bg-main overflow-hidden">
      <Head>
        <title>{project?.name || 'Chat'} | Nova AI</title>
      </Head>

      {sidebarOpen && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-50 bg-bg-main/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-bg-panel border-r border-border-color shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border-color">
              <Link href="/dashboard" className="text-lg font-bold flex items-center">
                <span className="text-theme-primary">Nova</span>
                <span className="text-text-primary">.ai</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-hover-glass"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <h2 className="font-semibold text-text-primary mb-3 text-sm uppercase tracking-wider">Chat History</h2>
              <div className="space-y-1">
                <div className="bg-theme-primary/10 text-theme-primary p-3 rounded-lg text-sm font-medium cursor-pointer">
                  Current Chat with {project?.name || 'Agent'}
                </div>
                {[1,2,3,4,5].map(i => (
                    <div key={i} className="text-text-muted hover:text-text-primary hover:bg-hover-glass p-3 rounded-lg text-sm cursor-pointer transition-colors">
                    Previous Chat {i} - Some Summary...
                    </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border-color">
                <Button variant="outline" className="w-full">New Chat</Button>
            </div>
          </div>
        </motion.div>
      )}

      <header className="sticky top-0 z-40 border-b border-border-color bg-bg-panel/80 backdrop-blur-md shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-text-muted hover:text-text-primary p-2 rounded-xl hover:bg-hover-glass"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/dashboard" className="hidden md:flex items-center text-text-muted hover:text-theme-primary transition-colors">
              <ArrowLeft className="mr-2 h-5 w-5" />
              <span className="font-medium text-sm">Back to Dashboard</span>
            </Link>
            <div className="font-semibold text-text-primary text-lg md:ml-4">
              {project?.name || 'Chat Session'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="Download Chat">
                <Download className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" title="Chat Settings" >
                <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <motion.div 
            key={msg.id} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex items-end gap-2 md:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role !== 'user' && (
              <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary shadow-sm">
                <Bot size={18} />
              </div>
            )}
            <div 
              className={`max-w-[70%] md:max-w-[65%] p-3 md:p-3.5 rounded-2xl shadow-md text-sm md:text-base leading-relaxed 
              ${msg.role === 'user' 
                ? 'bg-theme-primary text-white rounded-br-lg' 
                : 'bg-bg-panel text-text-primary border border-border-color rounded-bl-lg'}`}
            >
              {renderMessageContent(msg.content)}
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full bg-bg-panel border border-border-color flex items-center justify-center text-text-muted shadow-sm">
                <User size={18} />
              </div>
            )}
          </motion.div>
        ))}
        {isLoadingMessage && messages.length > 0 && messages[messages.length-1].role === 'user' && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className={`flex items-end gap-3 justify-start`}
            >
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary shadow-sm">
                    <Bot size={18} />
                </div>
                <div className="max-w-[70%] md:max-w-[65%] p-3.5 rounded-2xl shadow-md bg-bg-panel text-text-primary border border-border-color rounded-bl-lg flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                    <span className="ml-2 text-sm text-text-muted">Nova is typing...</span>
                </div>
            </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSendMessage={handleSendMessage} isLoading={isLoadingMessage} disabled={!project} />
    </div>
  );
} 