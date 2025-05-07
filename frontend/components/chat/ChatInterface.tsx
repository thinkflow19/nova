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
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  
  // Clear error on mount
  useEffect(() => {
    setError(null);
  }, []);

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
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Message Display Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} group`}
          >
            <div 
              className={`
                flex items-start max-w-[85%] px-4 py-3 rounded-xl
                ${msg.sender === 'user' 
                  ? 'bg-blue-100 text-gray-800 shadow-sm hover:shadow-md border border-blue-200' 
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-700'
                }
                transition-all duration-200 ease-in-out
              `}
            >
              <div className="flex-shrink-0 mr-3 mt-1">
                {msg.sender === 'user' ? (
                  <div className="w-8 h-8 rounded-full bg-primary-dark flex items-center justify-center shadow-sm">
                    <FiUser className="text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center shadow-sm">
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
                  className="ml-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
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
            <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl flex items-center shadow-sm border border-gray-200 dark:border-gray-700">
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
            <p className="text-red-500 text-sm px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-sm">
              Error: {error}
            </p>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} /> 
      </div>

      {/* Input Bar */}
      <div className="w-full px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-end gap-3">
        <textarea
          ref={inputRef}
          rows={1}
          placeholder="Ask Nova"
          value={inputValue}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          className="flex-grow resize-none overflow-hidden border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow focus:outline-none focus:ring-2 focus:ring-primary transition"
          disabled={isLoading || isStreaming}
          aria-label="Chat message input"
        />
        <button
          type="button"
          onClick={(e) => handleSubmit(e as unknown as FormEvent)}
          disabled={isLoading || isStreaming || !inputValue.trim()}
          aria-label="Send message"
          className="p-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark transition disabled:opacity-50 disabled:hover:bg-primary flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          {isLoading || isStreaming ? (
            <Spinner size="sm" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l14-7-7 14-2-5-5-2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
} 