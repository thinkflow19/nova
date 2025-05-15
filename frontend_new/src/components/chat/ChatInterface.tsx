import React, { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import { Send } from 'lucide-react';
import { AutoResizeTextarea } from '../ui/AutoResizeTextarea';
import { 
  ChatMessage as ChatMessageComponent, 
  TypingIndicator, 
  EmptyChatState
} from '../ui/ChatMessage';
import type { ChatMessageForUI } from '../ui/ChatMessage';
import { Loader } from '../ui/Loader';

interface ChatInterfaceProps {
  projectId: string;
  sessionId?: string;
  onSendMessage: (projectId: string, message: string) => Promise<string | AsyncIterable<string>>;
  welcomeMessage?: string;
}

// Extended message type that includes streaming state
interface Message extends ChatMessageForUI {
  isStreaming?: boolean;
}

export function ChatInterface({ 
  projectId, 
  sessionId,
  onSendMessage,
  welcomeMessage = "Hello! I'm your AI assistant. How can I help you today?"
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      session_id: sessionId || '',
      role: 'assistant',
      content: welcomeMessage,
      created_at: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    session_id: sessionId || '',
    role: 'assistant',
    content: '',
    isLoading: true,
    created_at: new Date().toISOString()
  });

  // Helper to update a streaming message
  const updateStreamingMessage = (messageId: string, textChunk: string) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: msg.content + textChunk } 
          : msg
      )
    );
  };

  // Helper to finalize a streaming message
  const finalizeStreamingMessage = (messageId: string) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId 
          ? { ...msg, isLoading: false } 
          : msg
      )
    );
    setIsStreaming(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || isStreaming) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      session_id: sessionId || '',
      role: 'user',
      content: inputValue.trim(),
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const result = await onSendMessage(projectId, userMessage.content);
      
      // If result is a string, it's a non-streaming response
      if (typeof result === 'string') {
        const botMessage: Message = {
          id: `assistant-${Date.now()}`,
          session_id: sessionId || '',
          role: 'assistant',
          content: result,
          created_at: new Date().toISOString()
        };
        
        setMessages((prev) => [...prev, botMessage]);
      } else {
        // Handle streaming response (AsyncIterable)
        setIsStreaming(true);
        const streamingMessageId = `assistant-${Date.now()}`;
        
        // Add initial empty message for streaming
        const streamingMessage: Message = {
          id: streamingMessageId,
          session_id: sessionId || '',
          role: 'assistant',
          content: '',
          isLoading: true,
          created_at: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, streamingMessage]);
        
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden border border-gray-200/60 dark:border-gray-700/40 rounded-lg">
      {/* Message Display Area */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2 pb-4 scrollbar-hide no-scrollbar">
        {messages.length === 0 ? (
          <EmptyChatState />
        ) : (
          messages.map((msg) => (
            <ChatMessageComponent 
              key={msg.id} 
              message={msg}
              isLoadingOverall={msg.isLoading}
              userName={msg.role === 'user' ? "You" : undefined}
            />
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && !isStreaming && <TypingIndicator />}
        
        {/* Error message */}
        {error && (
          <div className="flex justify-center my-2">
            <div className="px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm max-w-md">
              {error}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-3 border-t border-border">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="relative flex-1">
            <AutoResizeTextarea 
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="border-2 border-gray-200/80 dark:border-gray-700/80 focus-visible:border-accent/50 chat-input-top-shadow"
              variant="chat"
              size="sm"
              maxRows={5}
              disabled={isLoading || isStreaming}
            />
          </div>
          
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading || isStreaming}
            isLoading={isLoading || isStreaming}
            className="flex-shrink-0"
            variant="default"
            size="default"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <div className="mt-2 text-xs text-muted-foreground text-center">
          <span>Press <kbd className="px-2 py-0.5 rounded bg-muted text-xs mx-1">Enter</kbd> to send, <kbd className="px-2 py-0.5 rounded bg-muted text-xs mx-1">Shift+Enter</kbd> for new line</span>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface; 