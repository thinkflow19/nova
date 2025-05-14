import { useRouter } from 'next/router';
import BotChat from '../../bot/[projectId]/index';

export default function AgentDetail() {
  const router = useRouter();
  
  // This component just wraps the Bot component
  return <BotChat />;
} 