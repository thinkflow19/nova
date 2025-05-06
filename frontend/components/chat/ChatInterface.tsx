'use client';

import React, { useState, FormEvent, useRef, useEffect, ChangeEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button, Input, Spinner } from '../ui';
// import { toast } from '../ui/Toast'; // Assuming you have a toast component
import { FiSend, FiUser, FiClipboard, FiCheck } from 'react-icons/fi';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatInterfaceProps {
  projectId: string;
  sessionId?: string;
  onSendMessage: (projectId: string, message: string) => Promise<string | AsyncIterable<string>>;
  welcomeMessage?: string;
}

export default function ChatInterface({ 
  projectId, 
  sessionId,
  onSendMessage,
  welcomeMessage = "Hello! I'm your AI assistant. How can I help you today?"
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: welcomeMessage,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  // Focus on input field when component loads
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helper to create a placeholder streaming message
  const createStreamingMessage = (): Message => ({
    id: `assistant-${Date.now()}`,
    sender: 'assistant',
    text: '',
    isStreaming: true,
    timestamp: new Date()
  });

  // Helper to update a streaming message
  const updateStreamingMessage = (messageId: string, textChunk: string) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId 
          ? { ...msg, text: msg.text + textChunk } 
          : msg
      )
    );
  };

  // Helper to finalize a streaming message
  const finalizeStreamingMessage = (messageId: string) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId 
          ? { ...msg, isStreaming: false } 
          : msg
      )
    );
    setIsStreaming(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || isStreaming) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const result = await onSendMessage(projectId, userMessage.text);
      
      // If result is a string, it's a non-streaming response
      if (typeof result === 'string') {
        const botMessage: Message = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: result,
          timestamp: new Date()
        };
        
        setMessages((prev) => [...prev, botMessage]);
      } else {
        // Handle streaming response (AsyncIterable)
        setIsStreaming(true);
        const streamingMessageId = `assistant-${Date.now()}`;
        
        // Add initial empty message for streaming
        setMessages(prev => [...prev, {
          id: streamingMessageId,
          sender: 'assistant',
          text: '',
          isStreaming: true,
          timestamp: new Date()
        }]);
        
        // Process stream
        try {
          // The result is an AsyncIterable
          if (Symbol.asyncIterator in result) {
            for await (const chunk of result) {
              updateStreamingMessage(streamingMessageId, chunk);
            }
          } else {
            // Fallback for unexpected response format
            updateStreamingMessage(streamingMessageId, String(result));
          }
          finalizeStreamingMessage(streamingMessageId);
        } catch (streamError) {
          console.error("Error during streaming:", streamError);
          setError(streamError instanceof Error ? streamError.message : 'Streaming error occurred');
          finalizeStreamingMessage(streamingMessageId);
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : 'Failed to get response.');
    } finally {
      setIsLoading(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
      },
      (err) => {
        console.error('Failed to copy: ', err);
        setError('Failed to copy message to clipboard.');
      }
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Message Display Area */}
      <div className="flex-1 overflow-y-auto py-4 px-3 md:px-6 space-y-6">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} group`}
          >
            <div 
              className={`
                flex items-start max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl
                ${msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }
                shadow-sm
              `}
            >
              <div className="flex-shrink-0 mr-3 mt-1">
                {msg.sender === 'user' ? (
                  <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center">
                    <FiUser className="text-white" />
                  </div>
                ) : (
                  // Original AI avatar
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center">
                    <span className="text-white font-bold">AI</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-hidden">
                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                  {msg.isStreaming && <span className="animate-pulse">▋</span>}
                </div>
                <div className="text-xs mt-2 opacity-60">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              {msg.sender === 'assistant' && !msg.isStreaming && (
                <button 
                  onClick={() => copyToClipboard(msg.text, msg.id)}
                  className="ml-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Copy message"
                >
                  {copiedMessageId === msg.id ? (
                    <FiCheck className="text-green-500" />
                  ) : (
                    <FiClipboard className="text-gray-500 dark:text-gray-400" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && !isStreaming && (
          <div className="flex justify-start">
             <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-2xl flex items-center">
                {/* Original Loading Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center mr-3">
                  <span className="text-white font-bold">AI</span>
                </div>
                <Spinner size="sm" className="mr-2" /> 
                <span>Thinking...</span>
             </div>
          </div>
        )}
        
         {/* Error Message */}
         {error && (
          <div className="flex justify-center">
            <p className="text-red-500 text-sm px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              Error: {error}
            </p>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} /> 
      </div>

      {/* Input Area - Styling closer to ChatGPT */}
      <div className="px-4 pb-4 pt-2 md:px-6 lg:px-8 xl:px-10 bg-white dark:bg-background-dark border-t border-gray-200 dark:border-gray-700/50">
        <div className="w-full max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            {/* Use a textarea for potentially multi-line input, styled */}
            <textarea
              rows={1} // Start with 1 row, auto-expand TBD
              placeholder="Ask anything..." // Changed placeholder
              value={inputValue}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)} // Change type hint
              onKeyDown={(e) => { // Submit on Enter, new line on Shift+Enter
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              className="w-full py-3 pl-4 pr-12 border border-gray-300 dark:border-gray-600/80 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700/80 text-text-light dark:text-text-dark shadow-sm resize-none text-base leading-tight" // Added resize-none, text styles
              disabled={isLoading || isStreaming}
              aria-label="Chat message input"
              // ref={inputRef} // Need to adjust ref type if using textarea
            />
            <Button
              type="submit"
              disabled={isLoading || isStreaming || !inputValue.trim()}
              aria-label="Send message"
              className="absolute right-2.5 bottom-2.5 p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent disabled:opacity-40 transition-colors"
            >
              {isLoading || isStreaming ? <Spinner size="sm" /> : <FiSend className="w-5 h-5" />}
            </Button>
          </form>
          {/* Disclaimer */}
          <div className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
            ChatGPT can make mistakes. Check important info.
          </div>
        </div>
      </div>
    </div>
  );
} 