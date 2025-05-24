import React, { useState, useRef, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button, 
  Input,
  Avatar,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tabs,
  Tab,
  Tooltip,
  Progress,
  Divider,
  ScrollShadow
} from '@heroui/react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  MoreVertical,
  X,
  Plus,
  Volume2,
  VolumeX,
  Copy,
  RefreshCw,
  Bot,
  User,
  Zap,
  Clock,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  type?: 'text' | 'voice' | 'file';
  isTyping?: boolean;
}

interface ChatSession {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  messages: ChatMessage[];
  isActive: boolean;
  status: 'connected' | 'typing' | 'offline';
  unreadCount: number;
}

interface ConversationTemplate {
  id: string;
  title: string;
  content: string;
  category: 'customer_support' | 'sales' | 'general';
}

interface MultiTabChatInterfaceProps {
  initialSessions?: ChatSession[];
  availableAgents?: Array<{
    id: string;
    name: string;
    avatar?: string;
    status: 'online' | 'offline';
  }>;
  onSendMessage?: (sessionId: string, message: string) => void;
  onNewSession?: (agentId: string) => void;
  onCloseSession?: (sessionId: string) => void;
}

const conversationTemplates: ConversationTemplate[] = [
  {
    id: '1',
    title: 'Product Inquiry',
    content: "Hi! I'm interested in learning more about your products. Can you help me?",
    category: 'sales'
  },
  {
    id: '2',
    title: 'Technical Support',
    content: "I'm experiencing an issue with my account. Can you assist me?",
    category: 'customer_support'
  },
  {
    id: '3',
    title: 'General Question',
    content: "Hello! I have a question about your services.",
    category: 'general'
  }
];

export const MultiTabChatInterface: React.FC<MultiTabChatInterfaceProps> = ({
  initialSessions = [],
  availableAgents = [],
  onSendMessage,
  onNewSession,
  onCloseSession
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessions.length > 0 ? initialSessions[0].id : null
  );
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !activeSessionId) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setSessions(prev => 
      prev.map(session => 
        session.id === activeSessionId
          ? { ...session, messages: [...session.messages, newMessage] }
          : session
      )
    );

    onSendMessage?.(activeSessionId, inputValue);
    setInputValue('');

    // Simulate agent typing
    setTimeout(() => {
      setSessions(prev => 
        prev.map(session => 
          session.id === activeSessionId
            ? { ...session, status: 'typing' }
            : session
        )
      );
    }, 500);

    // Simulate agent response
    setTimeout(() => {
      const agentResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I understand your question. Let me help you with that...",
        sender: 'agent',
        timestamp: new Date(),
        type: 'text'
      };

      setSessions(prev => 
        prev.map(session => 
          session.id === activeSessionId
            ? { 
                ...session, 
                messages: [...session.messages, agentResponse],
                status: 'connected'
              }
            : session
        )
      );
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUseTemplate = (template: ConversationTemplate) => {
    setInputValue(template.content);
    setShowTemplates(false);
    inputRef.current?.focus();
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording logic
  };

  const handleNewChat = (agentId?: string) => {
    const selectedAgent = agentId 
      ? availableAgents.find(a => a.id === agentId)
      : availableAgents[0];

    if (!selectedAgent) return;

    const newSession: ChatSession = {
      id: Date.now().toString(),
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      agentAvatar: selectedAgent.avatar,
      messages: [],
      isActive: true,
      status: 'connected',
      unreadCount: 0
    };

    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    onNewSession?.(selectedAgent.id);
  };

  const handleCloseSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    
    if (activeSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
    }
    
    onCloseSession?.(sessionId);
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border overflow-hidden">
      {/* Chat Tabs */}
      <div className="flex items-center bg-default-50 border-b border-border px-4 py-2">
        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-shrink-0"
            >
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                  activeSessionId === session.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-default-100'
                }`}
                onClick={() => setActiveSessionId(session.id)}
              >
                <Avatar 
                  size="sm" 
                  name={session.agentName}
                  className="w-6 h-6"
                />
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {session.agentName}
                </span>
                {session.unreadCount > 0 && (
                  <Chip size="sm" color="danger" className="text-xs">
                    {session.unreadCount}
                  </Chip>
                )}
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="w-4 h-4 p-0 min-w-4"
                  onClick={(e) => handleCloseSession(session.id, e)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* New Chat Button */}
        <Dropdown>
          <DropdownTrigger>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              className="ml-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Select agent">
            {availableAgents.map((agent) => (
              <DropdownItem
                key={agent.id}
                onClick={() => handleNewChat(agent.id)}
                startContent={
                  <Avatar size="sm" name={agent.name} className="w-6 h-6" />
                }
                endContent={
                  <Chip 
                    size="sm" 
                    color={agent.status === 'online' ? 'success' : 'default'}
                    variant="dot"
                  />
                }
              >
                {agent.name}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {activeSession ? (
        <>
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-default-50">
            <div className="flex items-center gap-3">
              <Avatar 
                size="sm" 
                name={activeSession.agentName}
                className="bg-primary/10 text-primary"
              />
              <div>
                <h3 className="font-semibold text-foreground">{activeSession.agentName}</h3>
                <div className="flex items-center gap-2">
                  <Chip 
                    size="sm" 
                    color={activeSession.status === 'connected' ? 'success' : 'warning'}
                    variant="flat"
                  >
                    {activeSession.status === 'typing' ? 'Typing...' : activeSession.status}
                  </Chip>
                  <span className="text-xs text-muted-foreground">
                    AI Agent • Response time: ~1.2s
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip content="Voice output">
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onClick={() => setIsSpeakerEnabled(!isSpeakerEnabled)}
                >
                  {isSpeakerEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </Tooltip>
              
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="flat">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Chat options">
                  <DropdownItem key="export" startContent={<Copy className="w-4 h-4" />}>
                    Export Chat
                  </DropdownItem>
                  <DropdownItem key="clear" startContent={<RefreshCw className="w-4 h-4" />}>
                    Clear History
                  </DropdownItem>
                  <DropdownItem key="settings" startContent={<MessageSquare className="w-4 h-4" />}>
                    Chat Settings
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>

          {/* Messages */}
          <ScrollShadow className="flex-1 p-4 space-y-4">
            <AnimatePresence>
              {activeSession.messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar 
                    size="sm"
                    name={message.sender === 'user' ? 'You' : activeSession.agentName}
                    className={`${
                      message.sender === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary/10 text-secondary'
                    }`}
                  />
                  <div className={`max-w-[70%] ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <Card 
                      className={`p-3 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-default-100'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </Card>
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {activeSession.status === 'typing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <Avatar 
                  size="sm"
                  name={activeSession.agentName}
                  className="bg-secondary/10 text-secondary"
                />
                <Card className="p-3 bg-default-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </Card>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </ScrollShadow>

          {/* Conversation Templates */}
          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-border bg-default-50 p-3"
              >
                <h4 className="text-sm font-semibold mb-2">Quick Templates</h4>
                <div className="flex gap-2 flex-wrap">
                  {conversationTemplates.map((template) => (
                    <Button
                      key={template.id}
                      size="sm"
                      variant="flat"
                      onClick={() => handleUseTemplate(template)}
                      className="text-xs"
                    >
                      {template.title}
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-background">
            <div className="flex items-end gap-3">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onClick={() => setShowTemplates(!showTemplates)}
                className="mb-1"
              >
                <Zap className="w-4 h-4" />
              </Button>

              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
                endContent={
                  <div className="flex items-center gap-1">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onClick={handleVoiceToggle}
                      color={isRecording ? 'danger' : 'default'}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </div>
                }
              />

              <Button
                isIconOnly
                color="primary"
                onClick={handleSendMessage}
                isDisabled={!inputValue.trim()}
                className="mb-1"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 flex items-center gap-2 text-danger"
              >
                <div className="w-2 h-2 bg-danger rounded-full animate-pulse" />
                <span className="text-sm">Recording... Tap to stop</span>
              </motion.div>
            )}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active chats</h3>
            <p className="text-muted-foreground mb-4">
              Start a conversation with one of your AI agents
            </p>
            <Button color="primary" onClick={() => handleNewChat()}>
              Start New Chat
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiTabChatInterface; 