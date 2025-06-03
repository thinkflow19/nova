import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ChatCompletionRequest } from '@/types';
import { MessageBubble } from '../MessageBubble';
import { InputArea } from '../InputArea';
import { Loading } from '@/components/ui';
import api from '@/lib/api';
import styles from './ChatInterface.module.css';

interface ChatInterfaceProps {
  projectId?: string;
  sessionId?: string;
  className?: string;
  height?: string | number;
  onMessageSent?: (message: ChatMessage) => void;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
  initialMessages?: ChatMessage[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  projectId,
  sessionId,
  className = '',
  height = '100vh',
  onMessageSent,
  onTypingStart,
  onTypingEnd,
  initialMessages = [],
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Load messages when session changes
  const loadMessages = useCallback(async () => {
    if (!sessionId) return;

    try {
      setIsLoading(true);
      setError(null);
      const loadedMessages = await api.chat.getMessages(sessionId);
      setMessages(loadedMessages);
      initializedRef.current = true;
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      initializedRef.current = false; // Reset when session changes
      loadMessages();
    } else {
      // Only set initial messages if we haven't initialized yet
      if (!initializedRef.current && initialMessages.length > 0) {
        setMessages(initialMessages);
        initializedRef.current = true;
      }
    }
  }, [sessionId, loadMessages]); // Removed messages dependency

  // Initialize with initial messages on first mount if no sessionId
  useEffect(() => {
    if (!sessionId && !initializedRef.current && initialMessages.length > 0) {
      setMessages(initialMessages);
      initializedRef.current = true;
    }
  }, []); // Run only once on mount

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, []);

  useEffect(() => {
    // Only scroll if we have messages and the component is not loading
    if (messages.length > 0 && !isLoading) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom, isLoading]); // Only trigger on length change, not full messages array

  // Generate unique message ID
  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle sending messages with real backend integration
  const handleSendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!content.trim() || !sessionId || !projectId) return;

    const userMessageId = generateMessageId();
    const assistantMessageId = generateMessageId();

    // Create user message
    const userMessage: ChatMessage = {
      id: userMessageId,
      session_id: sessionId,
      project_id: projectId,
      user_id: 'current-user', // This should come from auth context
      role: 'user',
      content: content.trim(),
      tokens: Math.ceil(content.length / 4),
      is_indexed: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    onMessageSent?.(userMessage);

    try {
      // Send message to backend
      const savedUserMessage = await api.chat.sendMessage({
        session_id: sessionId,
        project_id: projectId,
        role: 'user',
        content: content.trim(),
      });

      // Update user message with server response
      setMessages(prev => prev.map(msg => 
        msg.id === userMessageId ? savedUserMessage : msg
      ));

      // Create assistant message placeholder for streaming
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        session_id: sessionId,
        project_id: projectId,
        user_id: 'assistant',
        role: 'assistant',
        content: '',
        tokens: 0,
        is_indexed: false,
        is_pinned: false,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsStreaming(true);
      setStreamingMessageId(assistantMessageId);
      onTypingStart?.();

      // Stream the assistant response
      await api.chat.streamCompletion(
        [savedUserMessage],
        sessionId,
        projectId,
        (chunk: string) => {
          // Update streaming message with new content
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: msg.content + chunk }
              : msg
          ));
        },
        async (fullResponse: string) => {
          // Save complete response to backend
          try {
            const savedAssistantMessage = await api.chat.sendMessage({
              session_id: sessionId,
              project_id: projectId,
              role: 'assistant',
              content: fullResponse,
            });

            // Update with saved message
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessageId ? savedAssistantMessage : msg
            ));
            onMessageSent?.(savedAssistantMessage);
          } catch (err) {
            console.error('Failed to save assistant message:', err);
          }

          setIsStreaming(false);
          setStreamingMessageId(null);
          onTypingEnd?.();
        },
        (error: Error) => {
          console.error('Streaming error:', error);
          setError('Failed to get AI response. Please try again.');
          
          // Remove the placeholder message
          setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
          setIsStreaming(false);
          setStreamingMessageId(null);
          onTypingEnd?.();
        }
      );

    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
      
      // Remove user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessageId));
    }
  }, [sessionId, projectId, onMessageSent, onTypingStart, onTypingEnd]);

  // Handle voice recording
  const handleVoiceRecording = useCallback(async (audioBlob: Blob) => {
    try {
      // TODO: Implement speech-to-text conversion
      console.log('Voice recording received:', audioBlob);
      
      // For now, add a placeholder message
      await handleSendMessage('🎤 Voice message received (speech-to-text not implemented yet)');
    } catch (error) {
      console.error('Failed to process voice recording:', error);
    }
  }, [handleSendMessage]);

  // Handle message reactions with backend sync
  const handleReaction = useCallback(async (messageId: string, reaction: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const updatedReactions = { ...message.reactions, [reaction]: true };
      
      await api.chat.updateMessage(messageId, {
        reactions: updatedReactions
      });

      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, reactions: updatedReactions }
          : msg
      ));
    } catch (err) {
      console.error('Failed to add reaction:', err);
      setError('Failed to add reaction. Please try again.');
    }
  }, [messages]);

  // Handle message deletion with backend sync
  const handleDelete = useCallback(async (messageId: string) => {
    try {
      await api.chat.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
      setError('Failed to delete message. Please try again.');
    }
  }, []);

  // Handle message editing (placeholder for future implementation)
  const handleEdit = useCallback((messageId: string, newContent: string) => {
    // TODO: Implement message editing with backend sync
    console.log('Message editing not implemented yet:', messageId, newContent);
  }, []);

  if (isLoading) {
    return (
      <div className={`${styles.chatInterface} ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <Loading size="lg" text="Loading conversation..." />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.chatInterface} ${className}`} style={{ height }}>
      {/* Neural background mesh */}
      <div className={styles.neuralMesh} />

      {/* Error display */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 backdrop-blur-sm">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Messages container */}
      <div 
        ref={messagesContainerRef}
        className={styles.messagesContainer}
      >
        <div className={styles.messagesList}>
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="text-6xl mb-4 animate-float">🤖</div>
              <h3 className="text-heading-lg text-[var(--text-primary)] mb-2">
                Start a Conversation
              </h3>
              <p className="text-body-md text-[var(--text-secondary)] max-w-md">
                Ask me anything! I'm here to help you with your questions and tasks.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={isStreaming && message.id === streamingMessageId}
              onReaction={handleReaction}
              onEdit={handleEdit}
              onDelete={handleDelete}
              className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
            />
          ))}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className={styles.inputContainer}>
        <InputArea
          onSendMessage={handleSendMessage}
          onVoiceRecording={handleVoiceRecording}
          disabled={isStreaming}
          isLoading={isStreaming}
          placeholder={
            isStreaming 
              ? "AI is thinking..." 
              : "Type your message..."
          }
        />
      </div>
    </div>
  );
};

export default ChatInterface; 