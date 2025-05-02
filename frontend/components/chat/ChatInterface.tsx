'use client';

import React, { useState, FormEvent, useRef, useEffect, ChangeEvent } from 'react';
import { Button, Input, Spinner } from '../ui'; // Assuming ui components exist

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

interface ChatInterfaceProps {
  projectId: string;
  // Function to call the backend API
  onSendMessage: (projectId: string, message: string) => Promise<string>; 
}

export default function ChatInterface({ projectId, onSendMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

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
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Call the backend API function provided via props
      const botReplyText = await onSendMessage(projectId, userMessage.text);
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botReplyText,
      };
      setMessages((prev) => [...prev, botMessage]);

    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : 'Failed to get response from bot.');
      // Optionally remove the user message or add an error indicator
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow overflow-hidden">
      {/* Message Display Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[75%] px-4 py-2 rounded-lg ${ 
                msg.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {/* Loader */}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center">
                <Spinner size="sm" className="mr-2" /> Typing...
             </div>
          </div>
        )}
         {/* Error Message */}
         {error && (
          <div className="flex justify-center">
            <p className="text-red-500 text-sm">Error: {error}</p>
          </div>
        )}
        {/* Scroll anchor */}
        <div ref={messagesEndRef} /> 
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
            className="flex-1"
            disabled={isLoading}
            aria-label="Chat message input"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()} aria-label="Send message">
            {isLoading ? <Spinner size="sm" /> : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
} 