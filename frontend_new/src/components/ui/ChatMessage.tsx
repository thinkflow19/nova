import React from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Bot, Copy, AlertTriangle, Check, CheckCheck, Clock, Edit3, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
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
    navigator.clipboard.writeText(textToCopy);
  };
  
  const timestamp = message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <motion.div 
      className={`flex w-full items-start my-2 ${isUser ? 'justify-end pl-8 sm:pl-10' : 'justify-start pr-8 sm:pr-10'}`}
      layout
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={messageVariants}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-1.5 self-end mb-0.5">
          <Bot className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
        </div>
      )}
      <div 
        className={'relative flex flex-col max-w-[85%] sm:max-w-[75%] group'}
      >
        <div
          className={`px-3.5 py-2 rounded-lg shadow-sm break-words overflow-hidden
                      ${isLoadingOverall ? 'opacity-70 animate-pulse' : ''}
                      ${isUser 
                        ? 'bg-white text-gray-700 border border-gray-200/70 rounded-br-none dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700/70'
                        : 'bg-white text-gray-700 border border-gray-200/70 rounded-bl-none dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700/70'
                      }`}
        >
          {!isUser && (
            <div className="text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-0.5">
              Assistant
            </div>
          )}
          {isUser && userName && (
             <div className="text-xs font-medium text-gray-600 dark:text-neutral-400 mb-0.5">{userName}</div>
          )}
          
          <div 
            className={`prose prose-sm max-w-none 
                       prose-p:text-gray-700 dark:prose-p:text-neutral-200 
                       prose-strong:text-gray-800 dark:prose-strong:text-neutral-100 
                       prose-a:text-accent hover:prose-a:text-accent/80 dark:prose-a:text-accent dark:hover:prose-a:text-accent/80 
                       prose-li:text-gray-700 dark:prose-li:text-neutral-200 
                       prose-ol:text-gray-700 dark:prose-ol:text-neutral-200 
                       prose-ul:text-gray-700 dark:prose-ul:text-neutral-200 
                       prose-headings:text-gray-800 dark:prose-headings:text-neutral-100
                       prose-p:my-1 prose-p:leading-snug
                       prose-code:bg-gray-100 prose-code:text-gray-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm prose-code:text-xs prose-code:font-mono
                       dark:prose-code:bg-neutral-700 dark:prose-code:text-neutral-200
                       prose-blockquote:border-l-accent/70 prose-blockquote:pl-2 prose-blockquote:italic prose-blockquote:text-gray-600 dark:prose-blockquote:text-neutral-400
                       overflow-hidden`}
          >
            {message.isLoading ? (
              <div className="flex items-center space-x-1.5 py-1">
                <div className={`h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-neutral-500 animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                <div className={`h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-neutral-500 animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                <div className={`h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-neutral-500 animate-bounce`} style={{ animationDelay: '300ms' }}></div>
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  code({ node, inline, className, children, ...props }: { node?: any; inline?: boolean; className?: string; children?: React.ReactNode; [key: string]: any; }) {
                    const match = /language-(\\w+)/.exec(className || '');
                    const lang = match && match[1] ? match[1] : '';
                    if (!inline && match) {
                      return (
                        <div className="relative group/code my-1.5 rounded-md overflow-hidden border border-gray-200/80 dark:border-neutral-700/80 bg-gray-50 dark:bg-neutral-900">
                          <div className="flex items-center justify-between px-2 py-1 bg-gray-100 dark:bg-neutral-800/90 border-b border-gray-200/80 dark:border-neutral-700/80">
                            <span className="text-[10px] text-gray-500 dark:text-neutral-400">{lang || 'code'}</span>
                            <button 
                              onClick={() => handleCopy(String(children))}
                              className="p-0.5 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 opacity-0 group-hover/code:opacity-100 transition-opacity"
                              aria-label="Copy code"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <SyntaxHighlighter
                            style={oneLight as any}
                            language={lang}
                            PreTag="div"
                            className="!text-xs !leading-normal !bg-gray-50 dark:!bg-neutral-900 !p-2.5 max-w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-gray-100 dark:scrollbar-track-neutral-700/50"
                            customStyle={{ margin: 0 }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }
                    return (
                      <code className={`${className} bg-gray-100 dark:bg-neutral-700/80 text-accent dark:text-accent/90 px-1 py-0.5 rounded text-[0.85em] font-mono break-words`} {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ node, ...props }) => <pre className="max-w-full overflow-auto !bg-transparent !p-0 my-0" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
                  a: ({ node, ...props }) => <a className="font-medium hover:underline break-all" target="_blank" rel="noopener noreferrer" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-1 text-inherit" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-1 text-inherit" {...props} />,
                  li: ({ node, ...props }) => <li className="mb-0.5 text-inherit" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="pl-2 italic my-1.5 text-inherit" {...props} />,
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
        <div className="flex-shrink-0 ml-1.5 self-end mb-0.5">
          <UserCircle className="w-5 h-5 text-gray-300 dark:text-neutral-600" />
        </div>
      )}
    </motion.div>
  );
};

export const TypingIndicator = () => (
  <motion.div 
    className="flex w-full items-start my-2 justify-start pr-8 sm:pr-10"
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={messageVariants}
  >
    <div className="flex-shrink-0 mr-1.5 self-end mb-0.5">
      <Bot className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
    </div>
    <div className="relative max-w-[75%] md:max-w-[70%] px-3.5 py-2 rounded-lg rounded-bl-none shadow-sm bg-white dark:bg-neutral-800 border border-gray-200/70 dark:border-neutral-700/70">
      <div className="flex items-center space-x-1.5 py-1">
        <div className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  </motion.div>
);

// Add EmptyChatState component
export const EmptyChatState = () => (
  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
    <div className="p-4 mb-4 bg-gray-50 dark:bg-neutral-800/50 rounded-full">
      <MessageSquare className="w-8 h-8 text-accent/70" />
    </div>
    <h3 className="text-lg font-medium text-gray-700 dark:text-neutral-200 mb-2">Welcome to Chat</h3>
    <p className="text-sm text-gray-500 dark:text-neutral-400 max-w-md px-4">
      Start a conversation with the AI assistant. Your chat history will appear here.
    </p>
  </div>
);

export default ChatMessage; 