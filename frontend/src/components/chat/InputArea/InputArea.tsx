import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui';
import styles from './InputArea.module.css';

interface InputAreaProps {
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  onVoiceRecording?: (audioBlob: Blob) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  supportedFileTypes?: string[];
  disabled?: boolean;
  isLoading?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  onVoiceRecording,
  placeholder = "Type your message...",
  maxLength = 4000,
  supportedFileTypes = ['.txt', '.pdf', '.doc', '.docx', '.md'],
  disabled = false,
  isLoading = false,
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  // Handle message sending
  const handleSend = useCallback(async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (disabled || isLoading) return;

    try {
      await onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
      adjustTextareaHeight();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [message, attachments, disabled, isLoading, onSendMessage, adjustTextareaHeight]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line
        return;
      } else if (e.metaKey || e.ctrlKey) {
        // Cmd/Ctrl + Enter to send
        e.preventDefault();
        handleSend();
      } else {
        // Enter to send (can be configured)
        e.preventDefault();
        handleSend();
      }
    }
  }, [handleSend]);

  // File upload handling
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return supportedFileTypes.includes(extension);
    });

    setAttachments(prev => [...prev, ...validFiles]);
  }, [supportedFileTypes]);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Drag and drop handling
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        if (onVoiceRecording) {
          await onVoiceRecording(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [onVoiceRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  }, [isRecording]);

  // Emoji picker (simplified)
  const emojis = ['😀', '😂', '🤔', '👍', '❤️', '🎉', '🔥', '💡'];

  const insertEmoji = useCallback((emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  }, []);

  // Character count and progress
  const characterCount = message.length;
  const progressPercentage = (characterCount / maxLength) * 100;

  return (
    <div className={styles.inputArea}>
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className={styles.attachments}>
          {attachments.map((file, index) => (
            <div key={index} className={styles.attachment}>
              <span className={styles.attachmentName}>{file.name}</span>
              <button
                className={styles.removeAttachment}
                onClick={() => removeAttachment(index)}
                type="button"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input container */}
      <div
        className={`${styles.inputContainer} ${isDragOver ? styles.dragOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Textarea */}
        <div className={styles.textareaWrapper}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            maxLength={maxLength}
            className={styles.textarea}
            rows={1}
          />
          
          {/* Character count indicator */}
          {characterCount > maxLength * 0.8 && (
            <div className={styles.characterCount}>
              <div 
                className={styles.progressBar}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
              <span className={styles.countText}>
                {characterCount}/{maxLength}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          {/* File upload */}
          <button
            className={styles.actionButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            type="button"
            title="Attach file"
          >
            📎
          </button>

          {/* Emoji picker */}
          <div className={styles.emojiContainer}>
            <button
              className={styles.actionButton}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              type="button"
              title="Add emoji"
            >
              😀
            </button>
            
            {showEmojiPicker && (
              <div className={styles.emojiPicker}>
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    className={styles.emojiButton}
                    onClick={() => insertEmoji(emoji)}
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice recording */}
          {onVoiceRecording && (
            <button
              className={`${styles.actionButton} ${isRecording ? styles.recording : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled}
              type="button"
              title={isRecording ? `Recording... ${recordingTime}s` : 'Voice message'}
            >
              {isRecording ? '⏹️' : '🎤'}
            </button>
          )}

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={disabled || isLoading || (!message.trim() && attachments.length === 0)}
            loading={isLoading}
            variant="primary"
            size="md"
            className={styles.sendButton}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={supportedFileTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className={styles.hiddenFileInput}
        />
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className={styles.recordingIndicator}>
          <div className={styles.recordingDot} />
          <span>Recording... {recordingTime}s</span>
        </div>
      )}

      {/* Drag overlay */}
      {isDragOver && (
        <div className={styles.dragOverlay}>
          <div className={styles.dragMessage}>
            Drop files here to attach
          </div>
        </div>
      )}
    </div>
  );
};

export default InputArea; 