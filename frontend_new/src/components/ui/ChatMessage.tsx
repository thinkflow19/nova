import React from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Bot, Copy, AlertTriangle, Check, CheckCheck, Clock, Edit3, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import type { ChatMessage as ChatMessageType } from '@/types';

export interface ChatMessageProps extends ChatMessageType {
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  onEdit?: () => void;
  onCopy?: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  role,
  isLoading,
  error,
  onRetry,
  onEdit,
  onCopy,
}) => {
  const [isCopied, setIsCopied] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  // Check dark mode on mount and when system preference changes
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDarkMode(e.matches);
    };

    updateTheme(mediaQuery);
    mediaQuery.addEventListener('change', updateTheme);

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, []);

  const handleCopy = async () => {
    if (onCopy) {
      onCopy();
    } else {
      try {
        await navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy message:', err);
      }
    }
  };

  const renderIcon = () => {
    switch (role) {
      case 'user':
        return <UserCircle className="w-6 h-6 text-primary" />;
      case 'assistant':
        return <Bot className="w-6 h-6 text-secondary" />;
      case 'system':
        return <MessageSquare className="w-6 h-6 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Clock className="w-4 h-4 animate-spin" />
          <span>Generating response...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center space-x-2 text-destructive">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-2 py-1 text-xs font-medium text-destructive-foreground bg-destructive rounded hover:bg-destructive/90"
            >
              Retry
            </button>
          )}
        </div>
      );
    }

    const components: Components = {
      code(props) {
        const { className, children, ...rest } = props;
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';
        const isInline = !match;
        
        if (isInline) {
          return (
            <code className={className} {...rest}>
              {children}
            </code>
          );
        }

        return (
          <div className="relative">
            <SyntaxHighlighter
              style={isDarkMode ? oneDark : oneLight}
              language={language}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderRadius: '0.5rem',
                background: isDarkMode ? 'hsl(var(--code))' : 'hsl(var(--code-light))',
              }}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }
    };

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex items-start space-x-4 p-4 ${
        role === 'assistant' ? 'bg-muted/50' : ''
      }`}
    >
      <div className="flex-shrink-0">{renderIcon()}</div>
      <div className="flex-grow space-y-2">
        <div className="prose dark:prose-invert max-w-none">
          {renderContent()}
        </div>
        {!isLoading && !error && (
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleCopy}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              {isCopied ? (
                <CheckCheck className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage; 