'use client';

import React, { useState, FormEvent, useRef, useEffect, ChangeEvent } from 'react';
import { Button, Input, Spinner } from '../ui';
// import { toast } from '../ui/Toast'; // Assuming you have a toast component
import { FiSend, FiUser, FiClipboard, FiCheck } from 'react-icons/fi';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  projectId: string;
  onSendMessage: (projectId: string, message: string) => Promise<string>; 
  welcomeMessage?: string;
}

export default function ChatInterface({ 
  projectId, 
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

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
      const botReplyText = await onSendMessage(projectId, userMessage.text);
      
      const botMessage: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: botReplyText,
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, botMessage]);
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center">
                    <span className="text-white font-bold">AI</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-hidden">
                <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                <div className="text-xs mt-2 opacity-60">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              {msg.sender === 'assistant' && (
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
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-2xl flex items-center">
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

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 px-3 transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
          <Input
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
            className="flex-1 py-3 px-0 border-none focus:ring-0 bg-transparent"
            disabled={isLoading}
            aria-label="Chat message input"
            ref={inputRef}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !inputValue.trim()} 
            aria-label="Send message"
            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
          >
            {isLoading ? <Spinner size="sm" /> : <FiSend />}
          </Button>
        </div>
        <div className="text-xs text-center mt-2 text-gray-500">
          Our AI assistant provides general guidance. Please review its responses before implementing any suggestions.
        </div>
      </form>
    </div>
  );
} 