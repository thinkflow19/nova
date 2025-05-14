import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Check, CheckCheck, Clock, Edit3, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import type { ChatMessage as ChatMessageType } from '../../types';

// Message animations
const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: "easeIn" } }
};

// Refined component styles for a light theme
const getMessageContainerStyle = (isUser: boolean) => {
  return isUser
    ? 'flex max-w-[95%] bg-[hsl(var(--user-message-background-light))] text-[hsl(var(--user-message-foreground-light))] rounded-xl rounded-tr-lg px-3 py-2 shadow-sm break-words overflow-hidden'
    : 'flex max-w-[95%] bg-[hsl(var(--assistant-message-background-light))] text-[hsl(var(--assistant-message-foreground-light))] border border-[hsl(var(--border))] rounded-xl rounded-tl-lg px-3 py-2 shadow-sm break-words overflow-hidden';
};

const getIconContainerStyle = (isUser: boolean) => {
  return isUser 
    ? 'h-7 w-7 bg-[hsl(var(--user-message-background-light))] border border-[hsl(var(--border))] rounded-full flex items-center justify-center shadow-sm' 
    : 'h-7 w-7 bg-[hsl(var(--chat-accent-light))] text-[hsl(var(--chat-accent-foreground-light))] rounded-full flex items-center justify-center shadow-sm';
};

interface ChatMessageProps {
  message: ChatMessageType;
  isNew?: boolean;
  isLoading?: boolean;
  onRetry?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
}

export const ChatMessage = ({ message, isNew, isLoading, onRetry, onEdit }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };
  
  // Format code blocks with syntax highlighting
  const formatCode = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    
    return !inline && match ? (
      <div className="relative group my-1.5">
        <SyntaxHighlighter
          style={oneLight}
          language={language}
          PreTag="div"
          className="rounded-md text-sm border border-[hsl(var(--border))] !bg-[hsl(var(--background))] overflow-x-auto"
          customStyle={{ maxWidth: '100%', overflowX: 'auto', wordBreak: 'break-word' }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
        <button 
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-[hsl(var(--border))]"
          aria-label="Copy code"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
    ) : (
      <code 
        className={`${className} bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] px-1 py-0.5 rounded text-xs font-mono break-words`}
        {...props}
      >
        {children}
      </code>
    );
  };
  
  const timestamp = message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <motion.div 
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} group`}
      layout
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={messageVariants}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className={`flex items-end gap-1.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-full`}>
        <div className={`flex-shrink-0 ${isUser ? 'ml-1.5' : 'mr-1.5'}`}>
          <div className={getIconContainerStyle(isUser)}>
            {isUser ? (
                <User className="h-3.5 w-3.5 text-[hsl(var(--user-message-foreground-light))]" />
            ) : (
                <Bot className="h-3.5 w-3.5" />
            )}
          </div>
        </div>

        <div className={`${getMessageContainerStyle(isUser)} relative`}>
          <div 
            className={`prose prose-sm max-w-none break-words ${isLoading ? 'opacity-70 animate-pulse' : ''} 
                       ${isUser ? "prose-invert-light" : "prose-light"} overflow-hidden`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code: formatCode,
                pre: ({ node, ...props }) => (
                  <pre className="!bg-transparent p-0 overflow-auto max-w-full" {...props} />
                ),
                p: ({ node, ...props }) => <p className="mb-1 last:mb-0 font-normal text-sm leading-relaxed break-words" {...props} />,
                a: ({ node, ...props }) => (
                  <a className="text-[hsl(var(--chat-accent-light))] hover:underline break-all" target="_blank" rel="noopener noreferrer" {...props} />
                ),
                ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-1 text-sm break-words" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-1 text-sm break-words" {...props} />,
                li: ({ node, ...props }) => <li className="mb-0.5 text-sm break-words" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          {timestamp && (
            <div 
                className={`absolute -bottom-4 text-[9px] text-[hsl(var(--muted-foreground))] transition-opacity duration-200 
                            ${isUser ? 'right-1 opacity-0 group-hover:opacity-100' : 'left-1 opacity-0 group-hover:opacity-100'}
                            ${isNew ? 'opacity-100' : ''}`}
            >
              {timestamp}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const TypingIndicator = () => (
  <motion.div 
    className="flex justify-start mb-3"
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={messageVariants}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
  >
    <div className={`flex items-end gap-2 flex-row`}>
        <div className="flex-shrink-0 mr-2">
            <div className={getIconContainerStyle(false)}>
                <Bot className="h-4 w-4" />
            </div>
        </div>
        <div className={`${getMessageContainerStyle(false)} py-3`}>
            <div className="flex items-center space-x-1.5">
                <div className="h-2 w-2 rounded-full bg-[hsl(var(--chat-accent-light))] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 rounded-full bg-[hsl(var(--chat-accent-light))] animate-bounce" style={{ animationDelay: '200ms' }}></div>
                <div className="h-2 w-2 rounded-full bg-[hsl(var(--chat-accent-light))] animate-bounce" style={{ animationDelay: '400ms' }}></div>
            </div>
        </div>
    </div>
  </motion.div>
);

export const EmptyChatState = () => (
  <div className="h-full flex flex-col items-center justify-center text-center p-6">
    <div className={`mb-4 ${getIconContainerStyle(false)} h-12 w-12`}>
      <Bot className="h-6 w-6" />
    </div>
    <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-1.5">
      Start a new conversation
    </h2>
    <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-xs">
      Ask any question, or type / for commands if available.
    </p>
  </div>
);

export default ChatMessage; 