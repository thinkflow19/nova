import React from 'react';
import Link from 'next/link';
import {
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar'; // Assuming Avatar component exists or will be created
import { Badge } from '@/components/ui/Badge'; // Assuming Badge component exists or will be created
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown'; // Corrected: DropdownMenu is the content container
import { cn } from '@/utils/cn';
import {
  Bot, 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  PlayCircle, 
  BarChartHorizontalBig,
  Settings2,
  MoreVertical, // Import MoreVertical icon
  Edit3,        // For Edit action
  Trash2,       // For Delete action
  Archive       // For Archive action
} from 'lucide-react';

export interface Agent {
  id: string;
  name: string;
  description?: string;
  avatar?: string; // URL or identifier for icon/image
  status: 'active' | 'paused' | 'training' | 'error';
  metrics: {
    totalChats: number;
    avgResponseTime: number; // in seconds
    successRate: number; // percentage
  };
  // Add other fields as necessary from your Agent type
}

interface AgentCardProps {
  agent: Agent;
  // Add viewMode if you want different layouts or menu interactions for list vs grid
  // viewMode?: 'grid' | 'list'; 
}

const statusColors: Record<Agent['status'], string> = {
  active: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  paused: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
  training: 'bg-sky-500/20 text-sky-700 dark:text-sky-400 border-sky-500/30',
  error: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
};

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Placeholder actions - replace with actual handlers or links
  const handleEdit = () => console.log('Edit agent:', agent.id);
  const handleDelete = () => console.log('Delete agent:', agent.id);
  const handleArchive = () => console.log('Archive agent:', agent.id);

  return (
    <Card 
      className={cn(
        "transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full group",
        "bg-card/70 dark:bg-card/50 backdrop-blur-md border border-border/50 hover:border-primary/30"
      )}
      variant="glass" // Use a glass variant if defined, otherwise relies on above classes
    >
      <CardHeader className="pb-4 relative"> {/* Added relative positioning parent for absolute menu */} 
        <div className="flex items-start justify-between">
          <Avatar className="w-12 h-12 text-lg bg-primary/10 text-primary ring-2 ring-primary/20">
            {agent.avatar ? (
              <img src={agent.avatar} alt={agent.name} className="rounded-full" />
            ) : (
              <span className="font-semibold">{getInitials(agent.name)}</span>
            )}
          </Avatar>
          <Badge 
            variant="outline"
            className={cn(
              "capitalize text-xs px-2.5 py-1 rounded-full font-medium border h-fit whitespace-nowrap",
              statusColors[agent.status]
            )}
          >
            {agent.status}
          </Badge>
        </div>
        <CardTitle className="mt-4 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {agent.name}
        </CardTitle>
        {agent.description && (
          <CardDescription className="text-sm text-muted-foreground line-clamp-2 mt-1 h-[40px]">
            {agent.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-3 pt-0 pb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center"><TrendingUp size={16} className="mr-1.5 text-green-500"/> Success Rate</span>
          <span className="font-medium text-foreground">{agent.metrics.successRate.toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center"><MessageSquare size={16} className="mr-1.5 text-sky-500"/> Total Chats</span>
          <span className="font-medium text-foreground">{agent.metrics.totalChats}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center"><Clock size={16} className="mr-1.5 text-amber-500"/> Avg. Response</span>
          <span className="font-medium text-foreground">{agent.metrics.avgResponseTime.toFixed(1)}s</span>
        </div>
      </CardContent>
      <CardFooter className="gap-2 pt-0 border-t border-border/50 p-4">
        <Link href={`/dashboard/chats?agent=${agent.id}`} passHref className="flex-1">
          <Button className="w-full group/action border border-input hover:bg-accent hover:text-accent-foreground">
            <PlayCircle size={16} className="mr-2 group-hover/action:fill-primary/20" /> Chat
          </Button>
        </Link>
        <Link href={`/dashboard/agents/${agent.id}/analyze`} passHref className="flex-1">
          <Button className="w-full group/action border border-input hover:bg-accent hover:text-accent-foreground">
            <BarChartHorizontalBig size={16} className="mr-2" /> Analyze
          </Button>
        </Link>
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-7 w-7">
              <MoreVertical size={18} />
            </Button>
          </DropdownTrigger>
          <DropdownMenu>
            <DropdownItem onSelect={handleEdit} className="flex items-center gap-2">
              <Edit3 size={14}/> Edit
            </DropdownItem>
            <DropdownItem onSelect={() => window.location.href = `/dashboard/agents/${agent.id}/settings` } className="flex items-center gap-2">
              <Settings2 size={14}/> Configure
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem onSelect={handleArchive} className="flex items-center gap-2">
              <Archive size={14}/> Archive
            </DropdownItem>
            <DropdownItem onSelect={handleDelete} className="text-destructive hover:!bg-destructive/10 flex items-center gap-2">
              <Trash2 size={14}/> Delete
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardFooter>
    </Card>
  );
};

export default AgentCard; 