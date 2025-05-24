import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot as BotIcon, User as UserIcon, Copy, AlertTriangle, CheckCheck, RefreshCw, Edit3, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus as codeStyle } from 'react-syntax-highlighter/dist/cjs/styles/prism'; // Using vscDarkPlus for a dark theme
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/ui/Avatar';

export interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string | Date;
  isLoading?: boolean;
  error?: string;
  userAvatar?: string | null;
  agentAvatar?: string | null;
  agentName?: string;
  userName?: string;
  onRetry?: (id: string) => void;
  onEdit?: (id: string, newContent: string) => void;
  onFeedback?: (id: string, feedback: 'good' | 'bad') => void;
  isLastMessage?: boolean; 
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  id,
  role,
  content,
  createdAt,
  isLoading,
  error,
  userAvatar,
  agentAvatar,
  agentName = 'Agent',
  userName = 'You',
  onRetry,
  onEdit,
  onFeedback,
  isLastMessage,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleCopyText = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message text:', err);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 1).toUpperCase();
    return parts[0].substring(0, 1).toUpperCase() + parts[parts.length - 1].substring(0, 1).toUpperCase();
  };

  const renderAvatar = () => {
    const isUser = role === 'user';
    const avatarSrc = isUser ? userAvatar : agentAvatar;
    const name = isUser ? userName : agentName;
    const FallbackIcon = isUser ? UserIcon : BotIcon;

    return (
      <Avatar 
        src={avatarSrc || undefined}
        alt={name}
        fallback={<FallbackIcon className="w-5 h-5 text-neutral-400" />}
        className="w-8 h-8 flex-shrink-0 bg-neutral-700 text-neutral-300"
      >
        {!avatarSrc && getInitials(name)}
      </Avatar>
    );
  };
  
  const formattedTime = createdAt ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const components: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';
      const codeContent = String(children).replace(/\n$/, '');
      const isInline = !className || !className.includes('language-');

      if (isInline) {
        return (
          <code className="px-1 py-0.5 bg-neutral-700 rounded text-xs font-mono text-orange-300" {...props}>
            {children}
          </code>
        );
      }

      return (
        <div className="relative my-2 rounded-md overflow-hidden bg-neutral-800 border border-neutral-700/70 shadow-sm">
          <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-750 border-b border-neutral-700/70">
            <span className="text-xs font-medium text-neutral-400 select-none">
              {language}
            </span>
            <button
              onClick={() => handleCopyText(codeContent)}
              className="p-1 text-neutral-400 hover:text-neutral-200 transition-colors"
              title="Copy code"
            >
              {isCopied ? (
                <CheckCheck className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <SyntaxHighlighter
            style={codeStyle}
            language={language}
            PreTag="div"
            customStyle={{ margin: 0, padding: '0.75rem 1rem', background: 'transparent', fontSize: '0.875rem', lineHeight: '1.5' }}
            showLineNumbers={false}
            wrapLines={true}
            wrapLongLines={true}
          >
            {codeContent}
          </SyntaxHighlighter>
        </div>
      );
    },
    p: ({ children, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed text-neutral-200" {...props}>{children}</p>,
    ul: ({ children, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1 text-neutral-200" {...props}>{children}</ul>,
    ol: ({ children, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-neutral-200" {...props}>{children}</ol>,
    li: ({ children, ...props }) => <li className="leading-relaxed text-neutral-200" {...props}>{children}</li>,
    a: ({ children, ...props }) => <a className="text-blue-400 hover:text-blue-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
    blockquote: ({ children, ...props }) => <blockquote className="border-l-4 border-neutral-600 pl-3 my-2 italic text-neutral-400" {...props}>{children}</blockquote>,
    hr: (props) => <hr className="my-3 border-neutral-700" {...props} />,
    strong: ({ children, ...props }) => <strong className="font-semibold text-neutral-100" {...props}>{children}</strong>,
    em: ({ children, ...props }) => <em className="italic text-neutral-300" {...props}>{children}</em>,
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-neutral-400">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <BotIcon className="w-4 h-4" />
          </motion.div>
          <span className="text-sm italic">Generating response...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
            </div>
            {onRetry && (
            <button
                onClick={() => onRetry(id)}
                className="flex items-center gap-1.5 self-start mt-1 px-2 py-1 text-xs font-medium text-amber-300 bg-amber-500/20 rounded-md hover:bg-amber-500/30 transition-colors"
            >
                <RefreshCw className="w-3 h-3" />
                Retry
            </button>
            )}
        </div>
      );
    }

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
        className="prose prose-sm dark:prose-invert max-w-none text-neutral-100"
      >
        {content}
      </ReactMarkdown>
    );
  };
  
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex gap-3 py-3 px-1 group",
        isUser ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isUser && <div className="flex-shrink-0">{renderAvatar()}</div>}

      <div
        className={cn(
          "relative max-w-[80%] lg:max-w-[70%] px-4 py-2.5 rounded-xl shadow-sm",
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-neutral-700 text-neutral-100 rounded-bl-none",
          isLoading && "animate-pulse",
          error && "bg-red-500/20 border border-red-500/40"
        )}
      >
        {!isUser && (
          <p className="text-xs font-semibold mb-1 text-neutral-400">{agentName}</p>
        )}
        {renderContent()}
        {createdAt && <p className={cn("text-xs mt-1.5", isUser ? "text-blue-200/80 text-right" : "text-neutral-500 text-left")}>{formattedTime}</p>}
      
        {/* Action buttons: Copy, Edit (user), Feedback (assistant) */}
        {/* Show on hover, positioned absolutely within the message bubble for better control */}
        <AnimatePresence>
        {showActions && !isLoading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute flex items-center gap-1 p-1 bg-neutral-800/80 backdrop-blur-sm rounded-md shadow-lg border border-neutral-700/50",
              isUser ? "-left-2 top-1/2 -translate-x-full -translate-y-1/2" : "-right-2 top-1/2 translate-x-full -translate-y-1/2"
            )}
          >
            <button
              onClick={() => handleCopyText(content)}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 rounded transition-colors"
              title="Copy message"
            >
              {isCopied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {isUser && onEdit && (
              <button
                onClick={() => onEdit(id, content)}
                className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 rounded transition-colors"
                title="Edit message"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {!isUser && onFeedback && (
              <>
                <button
                  onClick={() => onFeedback(id, 'good')}
                  className="p-1.5 text-neutral-400 hover:text-green-400 hover:bg-neutral-700 rounded transition-colors"
                  title="Good response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onFeedback(id, 'bad')}
                  className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-700 rounded transition-colors"
                  title="Bad response"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {isUser && <div className="flex-shrink-0">{renderAvatar()}</div>}
    </motion.div>
  );
};

export default ChatMessage; 