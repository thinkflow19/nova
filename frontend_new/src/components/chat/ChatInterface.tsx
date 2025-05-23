import React, { useState, useRef, useEffect } from 'react';
import { IconSend, IconRefresh, IconCopy, IconCheck } from '@tabler/icons-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AutoResizeTextarea } from '../ui/AutoResizeTextarea';
import { Loader } from '../ui/Loader';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  session_id: string;
  created_at: string;
  isLoading?: boolean;
}

interface ChatInterfaceProps {
  projectId: string;
  sessionId?: string;
  onSendMessage: (projectId: string, message: string) => Promise<string | AsyncIterable<string>>;
  welcomeMessage?: string;
  messages: Message[];
  onRegenerate?: () => void;
  isLoading?: boolean;
}

// Props that ReactMarkdown passes to a custom 'code' renderer
// Based on common usage and react-markdown types
interface CustomCodeProps {
  node?: any; 
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  // To allow other props that might be passed by remark plugins or ReactMarkdown itself
  [key: string]: any;
}

export function ChatInterface({ 
  projectId, 
  sessionId,
  onSendMessage,
  welcomeMessage = "Hello! I'm your AI assistant. How can I help you today?",
  messages: initialMessages,
  onRegenerate,
  isLoading = false,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      session_id: sessionId || '',
      role: 'assistant',
      content: welcomeMessage,
      created_at: new Date().toISOString()
    },
    ...initialMessages
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
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

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setError(null);

    try {
      const result = await onSendMessage(projectId, userMessage.content);
      
      if (typeof result === 'string') {
        const botMessage: Message = {
          id: `assistant-${Date.now()}`,
          session_id: sessionId || '',
          role: 'assistant',
          content: result,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        setIsStreaming(true);
        const streamingMessageId = `assistant-${Date.now()}`;
        const streamingMessage: Message = {
          id: streamingMessageId,
          session_id: sessionId || '',
          role: 'assistant',
          content: '',
          isLoading: true,
          created_at: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, streamingMessage]);
        
        try {
          for await (const chunk of result) {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === streamingMessageId 
                  ? { ...msg, content: msg.content + chunk } 
                  : msg
              )
            );
          }
        } catch (streamError) {
          console.error("Error during streaming:", streamError);
          setError(streamError instanceof Error ? streamError.message : 'Streaming error occurred');
        } finally {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, isLoading: false } 
                : msg
            )
          );
          setIsStreaming(false);
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : 'Failed to get response.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // Define the code component for ReactMarkdown
  const CodeBlockRenderer: React.FC<CustomCodeProps & { messageIndex: number }> = ({ 
    inline, 
    className, 
    children, 
    messageIndex, // Explicitly expect messageIndex
    node, // consume node to prevent it from being spread
    ...rest // a catch-all for other props that might be passed by react-markdown
  }) => {
    const match = /language-(\w+)/.exec(className || '');

    if (inline || !match) {
      // For inline code, pass through className and children. 
      // Avoid spreading `rest` unless sure they are valid for `<code>`.
      const codeProps: React.HTMLAttributes<HTMLElement> = { className: className || "bg-bg-panel/50 px-1.5 py-0.5 rounded text-sm font-mono" };
      if(rest.style) codeProps.style = rest.style; // Example of selectively passing a prop from rest
      return <code {...codeProps}>{children}</code>;
    }

    return (
      <div className="relative group">
        <button
          onClick={() => copyToClipboard(String(children).replace(/\n$/, ''), messageIndex)}
          className="absolute right-2 top-2 p-1 rounded bg-bg-panel/50 hover:bg-bg-panel transition-colors"
        >
          {copiedIndex === messageIndex ? (
            <IconCheck size={16} className="text-green-500" />
          ) : (
            <IconCopy size={16} className="text-text-muted" />
          )}
        </button>
        <SyntaxHighlighter
          style={oneDark} // No `as any` here, if oneDark is correctly typed, it should work.
          language={match[1]}
          PreTag="div"
          // Do not spread `rest` here. Only pass props SyntaxHighlighter expects.
          // If `rest` contains necessary props for SyntaxHighlighter, pass them explicitly.
          // Example: customStyle={rest.customStyleIfAny}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  };


  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
        {messages.map((message, idx) => ( // Use `idx` for key and pass to renderer
          <div
            key={message.id} // Use message.id for key for stability
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
              {message.isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader size="sm" />
                  <span className="text-text-muted">Generating response...</span>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      code: (props) => (
                        <CodeBlockRenderer {...props} messageIndex={idx} />
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="relative">
          <AutoResizeTextarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="chat-textarea"
            maxHeight={180}
            disabled={isLoading || isStreaming}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {messages.length > 0 && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={isLoading}
                className="p-2 text-text-muted hover:text-text-primary transition-colors"
              >
                <IconRefresh size={20} className={isLoading ? 'animate-spin' : ''} />
              </button>
            )}
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || isStreaming}
              className="chat-send-button"
            >
              <IconSend size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatInterface; 