import React, { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Menu, X, ArrowLeft, Settings, Download, Trash2, User, Bot, Loader2, Paperclip, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { ChatMessage, Project } from '../types/index';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import TextareaAutosize from 'react-textarea-autosize';
import { AutoResizeTextarea } from '../components/ui/AutoResizeTextarea';
import ChatMessageComponent from '../components/ui/ChatMessage';

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
      className="sticky bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 shadow-[-4px_0_12px_rgba(0,0,0,0.1)]"
    >
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <div className="relative flex-grow bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-theme-primary transition-all">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="w-full resize-none rounded-xl border-none bg-transparent p-3 pr-10 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none disabled:opacity-60"
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
  const router = useRouter();
  const { projectId } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (projectId) {
      const fetchProjectData = async () => {
        setIsLoadingMessage(true);
        try {
          // TODO: Replace with actual API call
          setProject({
            id: projectId as string,
            name: 'Customer Support Bot',
            description: 'AI assistant for customer support',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: '',
            is_public: false,
            model_type: 'gpt-4',
            model_config: {
              temperature: 0.7,
              max_tokens: 2000
            }
          });
          
          setMessages([
            {
              id: '1',
              session_id: '123',
              role: 'assistant',
              content: 'Hello! I am Nova, your AI assistant. How can I assist you today?',
              created_at: new Date().toISOString()
            }
          ]);
        } catch (err) {
          console.error('Error fetching project data:', err);
          setError('Failed to load project data');
        } finally {
          setIsLoadingMessage(false);
        }
      };
      
      fetchProjectData();
    }
  }, [projectId]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim() || isLoadingMessage) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      session_id: '123',
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoadingMessage(true);
    
    try {
      // TODO: Replace with actual API call
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          session_id: '123',
          role: 'assistant',
          content: 'I understand you need help. Could you please provide more details about your question?',
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoadingMessage(false);
      }, 1000);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      setIsLoadingMessage(false);
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>{project.name} - Nova AI</title>
      </Head>
      
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div>
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>
        </header>
        
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ChatMessageComponent {...message} />
              </motion.div>
            ))}
            
            {isLoadingMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChatMessageComponent
                  id="loading"
                  session_id="123"
                  role="assistant"
                  content=""
                  created_at={new Date().toISOString()}
                  isLoading={true}
                />
              </motion.div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive"
              >
                <AlertCircle size={18} />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input form */}
        <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative">
              <AutoResizeTextarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoadingMessage}
                className="w-full pr-12"
                maxHeight={120}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoadingMessage}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoadingMessage ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 