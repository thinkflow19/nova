import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@/components/ui/Dropdown';
import { MessageSquare, Clock, MoreVertical, Archive, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatDistanceToNow } from 'date-fns';

export interface RecentChat {
  id: string;
  projectId: string; // To link to the correct chat bot page
  agentName: string;
  agentAvatar?: string | null;
  lastMessage: string;
  timestamp: Date | string;
  unreadCount: number;
  status: 'active' | 'ended' | 'archived'; // Added 'archived'
  // Potentially add project specific info if needed
}

interface RecentChatCardProps {
  chat: RecentChat;
  onArchive?: (chatId: string) => void;
  onDelete?: (chatId: string) => void;
  // Add other actions as necessary
}

export const RecentChatCard: React.FC<RecentChatCardProps> = ({ chat, onArchive, onDelete }) => {
  const router = useRouter();
  const timeAgo = chat.timestamp ? formatDistanceToNow(new Date(chat.timestamp), { addSuffix: true }) : 'N/A';

  const getStatusVariant = (status: RecentChat['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'ended':
        return 'default';
      case 'archived':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  const handleOpenChat = () => {
    router.push(`/dashboard/bot/${chat.projectId}?session=${chat.id}`);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar 
            src={chat.agentAvatar || undefined} 
            fallback={getInitials(chat.agentName)} 
            size="md" 
            className={cn(
                chat.status === 'active' ? 'border-2 border-green-500 dark:border-green-400' : 'border-border'
            )}
          />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-md font-semibold truncate" title={chat.agentName}>
              {chat.agentName}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {timeAgo}
            </CardDescription>
          </div>
        </div>
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0 -mr-2 -mt-1">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu>
            <DropdownItem onSelect={handleOpenChat} className="flex items-center">
              <ExternalLink className="mr-2 h-4 w-4" /> Open Chat
            </DropdownItem>
            {onArchive && chat.status !== 'archived' && (
              <DropdownItem onSelect={() => onArchive(chat.id)} className="flex items-center">
                <Archive className="mr-2 h-4 w-4" /> Archive
              </DropdownItem>
            )}
            {onDelete && (
              <DropdownItem onSelect={() => onDelete(chat.id)} className="text-destructive flex items-center">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownItem>
            )}
          </DropdownMenu>
        </Dropdown>
      </CardHeader>
      <CardContent className="pb-4 pt-0 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2" title={chat.lastMessage}>
          {chat.lastMessage || "No messages yet."}
        </p>
      </CardContent>
      <CardFooter className="pt-2 pb-4 flex items-center justify-between">
        <Badge variant={getStatusVariant(chat.status)} className="capitalize">
          {chat.status}
        </Badge>
        {chat.unreadCount > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> {chat.unreadCount} New
          </Badge>
        )}
        <Link href={`/dashboard/bot/${chat.projectId}?session=${chat.id}`} passHref>
            <Button variant="outline" size="sm">
                <MessageSquare className="mr-2 h-4 w-4"/> View
            </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default RecentChatCard; 