import React, { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import { Send, AlertCircle, Loader2 } from 'lucide-react';
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
    <div className="flex flex-col h-full overflow-hidden bg-bg-panel rounded-2xl border border-border-color shadow-xl">
      {/* Message Display Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide no-scrollbar">
        {messages.length === 1 && messages[0].id === 'welcome' && messages[0].role === 'assistant' && !isLoading && !isStreaming && (
          <EmptyChatState welcomeMessage={messages[0].content} />
        ) }
        { (messages.length > 1 || (messages.length === 1 && (messages[0].id !== 'welcome' || messages[0].role !== 'assistant')) || isLoading || isStreaming) &&
          messages.map((msg) => (
            <ChatMessageComponent 
              key={msg.id} 
              message={msg}
              isLoadingOverall={msg.isLoading && msg.role === 'assistant'} 
              userName={msg.role === 'user' ? "You" : undefined}
            />
          ))
        }
        
        {/* Typing indicator for assistant response loading */}
        {isLoading && isStreaming && messages.some(m => m.isLoading && m.role === 'assistant') && <TypingIndicator />}
        {!isLoading && isStreaming && messages.some(m => m.isLoading && m.role === 'assistant') && <TypingIndicator />}
        {/* General loading for initial fetch or non-streaming action if needed, but streaming indicator is primary for response generation */}
        {isLoading && !isStreaming && <TypingIndicator />} 

        {/* Error message */}
        {error && (
          <div className="flex justify-center my-2 px-2">
            <div className="px-4 py-2.5 bg-error-color/10 border border-error-color/30 rounded-lg text-error-color text-sm max-w-md w-full flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-error-color flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-3 md:p-4 border-t border-border-color/80 bg-bg-main/50">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 md:gap-3">
          <div className="relative flex-1 group">
            <AutoResizeTextarea 
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              className="pr-12 chat-input-top-shadow" 
              variant="default"
              size="default"
              minRows={1}
              maxRows={6}
              disabled={isLoading || isStreaming}
            />
          </div>
          
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading || isStreaming}
            isLoading={isLoading && !isStreaming}
            className="flex-shrink-0 w-[42px] h-[42px] p-0"
            variant="default"
            size="icon"
            aria-label="Send message"
          >
            {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
        <div className="mt-2.5 text-xs text-text-muted text-center">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-bg-panel border border-border-color text-text-muted text-xs mx-0.5">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-bg-panel border border-border-color text-text-muted text-xs mx-0.5">Shift+Enter</kbd> for new line</span>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface; 