import React from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Bot, Copy, AlertTriangle, Check, CheckCheck, Clock, Edit3, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import type { ChatMessage as ChatMessageTypeFromServer } from '../../types';

// Define an extended message type for UI purposes, including error and loading states
export interface ChatMessageForUI extends ChatMessageTypeFromServer {
  isLoading?: boolean; // isLoading specific to this message's content rendering
  error?: string;      // Error specific to this message
}

// Message animations
const messageVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
  exit: { opacity: 0, y: -5, scale: 0.98, transition: { duration: 0.15, ease: "easeIn" } }
};  

interface ChatMessageProps {
  message: ChatMessageForUI;
  isLoadingOverall?: boolean;
  userName?: string;
}

export const ChatMessage = ({ message, isLoadingOverall, userName }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      // Optional: add a visual feedback, e.g., set a state to show "Copied!"
    }).catch(err => console.error("Failed to copy text: ", err));
  };
  
  const timestamp = message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  // Base classes for message bubbles
  const bubbleBaseClasses = "px-3.5 py-2.5 rounded-2xl shadow-md break-words overflow-hidden transition-colors duration-200";
  // Specific classes for user and assistant messages
  const userBubbleClasses = `bg-bg-panel border border-border-color text-text-main rounded-br-none`;
  const assistantBubbleClasses = `bg-primary/10 border border-primary/20 text-text-main rounded-bl-none`;

  return (
    <motion.div 
      className={`flex w-full items-end my-2 ${isUser ? 'justify-end pl-10 sm:pl-12' : 'justify-start pr-10 sm:pr-12'}`}
      layout
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={messageVariants}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-2 self-end mb-1">
          <Bot className="w-6 h-6 text-primary/80" />
        </div>
      )}
      <div 
        className={'relative flex flex-col max-w-[85%] sm:max-w-[75%] group'}
      >
        <div
          className={`${bubbleBaseClasses} 
                      ${isLoadingOverall ? 'opacity-70 animate-pulse-slow' : ''}
                      ${isUser ? userBubbleClasses : assistantBubbleClasses}`}
        >
          {!isUser && (
            <div className="text-xs font-semibold text-primary mb-1">
              Assistant
            </div>
          )}
          {isUser && userName && (
             <div className="text-xs font-medium text-text-muted mb-1">{userName}</div>
          )}
          
          <div 
            className={`prose prose-sm max-w-none prose-p:my-1 prose-p:leading-normal
                       text-text-main prose-headings:text-text-primary prose-strong:text-text-primary 
                       prose-a:text-accent hover:prose-a:text-accent/80 prose-a:break-words
                       prose-code:bg-primary/15 prose-code:text-primary/90 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:break-words
                       prose-blockquote:border-l-primary/70 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-text-muted
                       overflow-hidden`}
          >
            {message.isLoading && message.role === 'assistant' ? (
              <div className="flex items-center space-x-1.5 py-1.5">
                <div className={`h-2 w-2 rounded-full bg-primary/70 animate-pulse-slow`} style={{ animationDelay: '0ms' }}></div>
                <div className={`h-2 w-2 rounded-full bg-primary/70 animate-pulse-slow`} style={{ animationDelay: '200ms' }}></div>
                <div className={`h-2 w-2 rounded-full bg-primary/70 animate-pulse-slow`} style={{ animationDelay: '400ms' }}></div>
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  code({ node, inline, className, children, ...props }: { node?: any; inline?: boolean; className?: string; children?: React.ReactNode; [key: string]: any; }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const lang = match && match[1] ? match[1] : '';
                    if (!inline && match) {
                      return (
                        <div className="relative group/code my-2 rounded-lg overflow-hidden border border-border-color bg-bg-main/30">
                          <div className="flex items-center justify-between px-3 py-1.5 bg-bg-panel/50 border-b border-border-color">
                            <span className="text-xs text-text-muted">{lang || 'code'}</span>
                            <button 
                              onClick={() => handleCopy(String(children))}
                              className="p-1 rounded-md text-text-muted hover:text-text-main hover:bg-hover-glass opacity-50 group-hover/code:opacity-100 transition-all duration-150"
                              aria-label="Copy code"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <SyntaxHighlighter
                            style={tomorrow as any}
                            language={lang}
                            PreTag="div"
                            className="!text-sm !leading-relaxed !bg-transparent !p-3 max-w-full overflow-x-auto custom-scrollbar"
                            customStyle={{ margin: 0, background: 'transparent' }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }
                    return (
                      <code className={`${className} text-sm`} {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ node, ...props }) => <pre className="max-w-full overflow-auto !bg-transparent !p-0 my-0" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0 text-inherit" {...props} />,
                  a: ({ node, ...props }) => <a className="font-medium text-primary hover:text-primary/80 hover:underline break-all" target="_blank" rel="noopener noreferrer" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2 text-inherit marker:text-text-muted" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2 text-inherit marker:text-text-muted" {...props} />,
                  li: ({ node, ...props }) => <li className="mb-1 text-inherit" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="pl-3 border-l-2 border-primary/50 italic my-2 text-text-muted" {...props} />,
                  table: ({node, ...props}) => <table className="table-auto w-full my-2 text-sm border-collapse border border-border-color" {...props} />,
                  thead: ({node, ...props}) => <thead className="bg-bg-panel/50" {...props} />,
                  th: ({node, ...props}) => <th className="border border-border-color px-2 py-1.5 text-left font-semibold text-text-primary" {...props} />,
                  td: ({node, ...props}) => <td className="border border-border-color px-2 py-1.5 text-inherit" {...props} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        </div>
        
        {timestamp && !message.isLoading && (
          <div 
              className={`text-[10px] mt-0.5 transition-opacity duration-300 ease-in-out group-hover:opacity-100
                          ${isUser ? 'text-right text-gray-400 opacity-0 dark:text-neutral-500' : 'text-left text-gray-400 dark:text-neutral-500 opacity-0'}`}
          >
            {timestamp}
          </div>
        )}
         {message.error && (
            <div className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-500 bg-red-100/60 dark:bg-red-500/10 px-2 py-1 rounded-md">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>{message.error}</span>
            </div>
         )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 ml-2 self-end mb-1">
          <UserCircle className="w-6 h-6 text-gray-300 dark:text-neutral-600" />
        </div>
      )}
    </motion.div>
  );
};

interface TypingIndicatorProps {
  isLoadingOverall?: boolean;
}

export const TypingIndicator = ({ isLoadingOverall }: TypingIndicatorProps) => (
  <motion.div 
    className={`flex w-full items-start my-2 justify-start pr-10 sm:pr-12 ${isLoadingOverall ? 'opacity-70' : ''}`}
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={messageVariants}
  >
    <div className="flex-shrink-0 mr-2 self-end mb-1">
      <Bot className="w-6 h-6 text-primary/80" />
    </div>
    <div className={`relative max-w-[75%] md:max-w-[70%] px-3.5 py-2.5 rounded-2xl rounded-bl-none shadow-md 
                   bg-primary/10 border border-primary/20`}>
      <div className="flex items-center space-x-1.5 py-1">
        <div className="h-2 w-2 rounded-full bg-primary/70 animate-pulse-slow" style={{ animationDelay: '0ms' }}></div>
        <div className="h-2 w-2 rounded-full bg-primary/70 animate-pulse-slow" style={{ animationDelay: '200ms' }}></div>
        <div className="h-2 w-2 rounded-full bg-primary/70 animate-pulse-slow" style={{ animationDelay: '400ms' }}></div>
      </div>
    </div>
  </motion.div>
);

// Add EmptyChatState component
interface EmptyChatStateProps {
  welcomeMessage?: string;
}

export const EmptyChatState = ({ welcomeMessage }: EmptyChatStateProps) => (
  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
    <div className="p-4 mb-4 bg-primary/10 rounded-full">
      <MessageSquare className="w-10 h-10 text-primary" />
    </div>
    <h3 className="text-xl font-semibold text-text-primary mb-2">Chat Ready!</h3>
    <p className="text-sm text-text-muted max-w-md px-4">
      {welcomeMessage || "Start a conversation with the AI assistant. Your chat history will appear here."}
    </p>
  </div>
);

export default ChatMessage; 