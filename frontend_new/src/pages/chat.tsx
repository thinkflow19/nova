import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Send, Menu, X, ArrowLeft, Settings, Download, Trash2, User, Bot, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { ChatMessage, Project } from '../types';

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
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="relative flex-grow">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="w-full resize-none rounded-lg border border-border bg-background p-3 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
          rows={1}
          disabled={disabled || isLoading}
        />
      </div>
      <button
        type="submit"
        disabled={!message.trim() || isLoading || disabled}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
      </button>
    </form>
  );
};

export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { id: projectId } = router.query;

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch project and chat data when projectId is available
  useEffect(() => {
    if (projectId && typeof projectId === 'string') {
      const fetchProjectData = async () => {
        try {
          setLoading(true);
          // Mock data for now, replace with actual API call
          setProject({
            id: projectId,
            name: 'Customer Support Bot',
            description: 'AI assistant for customer support',
            created_at: new Date().toISOString(),
            user_id: user?.id || 'mock-user-id',
          });
          
          // Mock messages, replace with actual API call
          setMessages([
            {
              id: '1',
              session_id: '123',
              role: 'system',
              content: 'I am your AI assistant. How can I help you today?',
              created_at: new Date().toISOString(),
            },
          ]);
        } catch (error) {
          console.error('Error fetching project data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchProjectData();
    }
  }, [projectId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!project) return;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      session_id: '123', // Use actual session ID
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock AI response, replace with actual API call
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        session_id: '123', // Use actual session ID
        role: 'assistant',
        content: `Thank you for your message. You asked about: "${content}". Is there anything else you'd like to know?`,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (content: string) => {
    // Simple markdown-like rendering
    return content.split('\n').map((line, i) => (
      <p key={i} className={i > 0 ? 'mt-2' : ''}>
        {line}
      </p>
    ));
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Head>
        <title>{project?.name || 'Chat'} | Nova AI</title>
      </Head>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Link href="/dashboard" className="text-lg font-bold flex items-center">
                <span className="text-accent">Nova</span>
                <span className="text-foreground">.ai</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <h2 className="font-medium mb-2">Chat History</h2>
              <div className="space-y-1">
                <div className="rounded-md bg-accent/10 p-2 text-sm hover:bg-accent/20">
                  Current Chat
                </div>
                <div className="rounded-md p-2 text-sm hover:bg-muted">
                  Previous Chat 1
                </div>
                <div className="rounded-md p-2 text-sm hover:bg-muted">
                  Previous Chat 2
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/dashboard" className="flex items-center text-foreground hover:text-accent">
              <ArrowLeft className="mr-2 h-5 w-5" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-muted-foreground hover:text-foreground">
              <Settings className="h-5 w-5" />
            </button>
            <button className="text-muted-foreground hover:text-foreground">
              <Download className="h-5 w-5" />
            </button>
            <button className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col">
        <div className="container flex flex-1 flex-col px-4 py-8">
          {/* Project Title */}
          {project && (
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="mt-2 text-muted-foreground">{project.description}</p>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'justify-end' : ''
                }`}
              >
                {message.role !== 'user' && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-accent text-white'
                      : 'bg-card border border-border'
                  }`}
                >
                  {renderMessageContent(message.content)}
                </div>
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="max-w-[80%] rounded-lg bg-card border border-border p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent/60 animate-pulse"></div>
                    <div className="h-2 w-2 rounded-full bg-accent/60 animate-pulse delay-150"></div>
                    <div className="h-2 w-2 rounded-full bg-accent/60 animate-pulse delay-300"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="mt-6">
            <MessageInput onSendMessage={handleSendMessage} isLoading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
} 