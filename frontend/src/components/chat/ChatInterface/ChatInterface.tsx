import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ChatCompletionRequest } from '@/types';
import MessageBubble from '../MessageBubble';
import InputArea from '../InputArea';
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Generate unique message ID
  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle sending messages
  const handleSendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    const userMessageId = generateMessageId();
    const assistantMessageId = generateMessageId();

    // Create user message
    const userMessage: ChatMessage = {
      id: userMessageId,
      session_id: sessionId || 'default',
      project_id: projectId || 'default',
      user_id: 'current-user', // This should come from auth context
      role: 'user',
      content: content.trim(),
      tokens: Math.ceil(content.length / 4), // Rough token estimation
      is_indexed: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    onMessageSent?.(userMessage);

    // Start loading state
    setIsLoading(true);
    onTypingStart?.();

    try {
      // Create assistant message placeholder for streaming
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        session_id: sessionId || 'default',
        project_id: projectId || 'default',
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

      // Prepare chat completion request
      const chatRequest: ChatCompletionRequest = {
        messages: [...messages, userMessage],
        session_id: sessionId || 'default',
        project_id: projectId || 'default',
        stream: true,
        model: 'gpt-4', // This should come from project config
        temperature: 0.7,
        max_tokens: 2000,
      };

      // TODO: Replace with actual API call
      // For now, simulate streaming response
      await simulateStreamingResponse(assistantMessageId, content);

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        session_id: sessionId || 'default',
        project_id: projectId || 'default',
        user_id: 'system',
        role: 'system',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        tokens: 0,
        is_indexed: false,
        is_pinned: false,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMessageId(null);
      onTypingEnd?.();
    }
  }, [messages, sessionId, projectId, onMessageSent, onTypingStart, onTypingEnd]);

  // Simulate streaming response (replace with actual API call)
  const simulateStreamingResponse = async (messageId: string, userContent: string) => {
    const responses = [
      "I understand you're asking about ",
      userContent.slice(0, 20) + "... ",
      "Let me help you with that. ",
      "Here's what I think: ",
      "This is an interesting question that requires careful consideration. ",
      "Based on the information provided, I can offer some insights. ",
      "Thank you for sharing this with me!"
    ];

    for (let i = 0; i < responses.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              content: responses.slice(0, i + 1).join(''),
              tokens: Math.ceil(responses.slice(0, i + 1).join('').length / 4)
            }
          : msg
      ));
    }
  };

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

  // Handle message reactions
  const handleReaction = useCallback((messageId: string, reaction: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...msg.reactions };
        if (reactions[reaction]) {
          reactions[reaction] = (reactions[reaction] as number) + 1;
        } else {
          reactions[reaction] = 1;
        }
        return { ...msg, reactions };
      }
      return msg;
    }));
  }, []);

  // Handle message editing
  const handleEdit = useCallback((messageId: string, newContent: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: newContent }
        : msg
    ));
  }, []);

  // Handle message deletion
  const handleDelete = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  const containerStyle = {
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div className={`${styles.chatInterface} ${className}`} style={containerStyle}>
      {/* Neural gradient mesh background */}
      <div className={styles.neuralMesh} />
      
      {/* Messages container */}
      <div 
        ref={messagesContainerRef}
        className={styles.messagesContainer}
      >
        <div className={styles.messagesList}>
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={isStreaming && message.id === streamingMessageId}
              onReaction={handleReaction}
              onEdit={handleEdit}
              onDelete={handleDelete}
              className={`stagger-${Math.min(index % 6 + 1, 6)}`}
            />
          ))}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className={styles.inputContainer}>
        <InputArea
          onSendMessage={handleSendMessage}
          onVoiceRecording={handleVoiceRecording}
          disabled={isLoading}
          isLoading={isLoading}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
        />
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}>
            <div className={styles.neuralSpinner} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface; 