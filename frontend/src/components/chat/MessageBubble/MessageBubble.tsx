'use client';

import React, { useState } from 'react';
import { ChatMessage } from '@/types';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onReaction?: (messageId: string, reaction: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  className?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isStreaming = false,
  onReaction,
  onEdit,
  onDelete,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  const bubbleClasses = `
    ${styles.messageBubble}
    ${isUser ? styles.userMessage : ''}
    ${isAssistant ? styles.assistantMessage : ''}
    ${isSystem ? styles.systemMessage : ''}
    ${isStreaming ? styles.streaming : ''}
    ${className}
  `;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderTypingIndicator = () => (
    <div className={styles.typingAnimation}>
      <span className={styles.typingDot}></span>
      <span className={styles.typingDot}></span>
      <span className={styles.typingDot}></span>
    </div>
  );

  const renderMessageContent = () => {
    if (isStreaming && !message.content) {
      return renderTypingIndicator();
    }

    // Handle code blocks, markdown, etc.
    const content = message.content;
    
    // Simple markdown-like formatting for now
    const formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');

    return (
      <div 
        className={styles.messageContent}
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    );
  };

  const renderReactions = () => {
    if (!message.reactions || Object.keys(message.reactions).length === 0) {
      return null;
    }

    return (
      <div className={styles.reactions}>
        {Object.entries(message.reactions).map(([emoji, count]) => (
          <button
            key={emoji}
            className={styles.reactionButton}
            onClick={() => onReaction?.(message.id, emoji)}
          >
            <span className={styles.reactionEmoji}>{emoji}</span>
            <span className={styles.reactionCount}>{count}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderActions = () => {
    if (!showActions) return null;

    return (
      <div className={styles.messageActions}>
        <button
          className={styles.actionButton}
          onClick={() => onReaction?.(message.id, '👍')}
          title="Like"
        >
          👍
        </button>
        <button
          className={styles.actionButton}
          onClick={() => onReaction?.(message.id, '👎')}
          title="Dislike"
        >
          👎
        </button>
        {isUser && (
          <button
            className={styles.actionButton}
            onClick={() => onEdit?.(message.id, message.content)}
            title="Edit"
          >
            ✏️
          </button>
        )}
        <button
          className={styles.actionButton}
          onClick={() => onDelete?.(message.id)}
          title="Delete"
        >
          🗑️
        </button>
      </div>
    );
  };

  return (
    <div
      className={bubbleClasses}
      onMouseEnter={() => {
        setIsHovered(true);
        setShowActions(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
    >
      {/* Avatar for assistant messages */}
      {isAssistant && (
        <div className={styles.avatar}>
          <div className={styles.avatarIcon}>🤖</div>
        </div>
      )}

      <div className={styles.messageWrapper}>
        {/* Message content */}
        <div className={styles.messageBody}>
          {renderMessageContent()}
        </div>

        {/* Reactions */}
        {renderReactions()}

        {/* Message metadata */}
        <div className={styles.messageMetadata}>
          <span className={styles.timestamp}>
            {formatTimestamp(message.created_at)}
          </span>
          {message.tokens && (
            <span className={styles.tokenCount}>
              {message.tokens} tokens
            </span>
          )}
          {message.is_pinned && (
            <span className={styles.pinnedIndicator}>📌</span>
          )}
        </div>

        {/* Actions */}
        {renderActions()}
      </div>

      {/* Neural glow effect for assistant messages */}
      {isAssistant && isHovered && (
        <div className={styles.neuralGlow}></div>
      )}
    </div>
  );
};

export default MessageBubble; 