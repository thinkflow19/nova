import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Bot, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Clock, 
  Settings,
  ArrowRight,
  BookOpen,
  Sparkles,
  Zap,
  RefreshCw,
  AlertCircle,
  HardDrive
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { API } from '../../utils/api';
import Button from '../../components/ui/Button';
import GlassCard from '../../components/ui/GlassCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { Project, ChatSession, Document, UserStats, ApiResponse } from '../../types';

interface ChatWithProject extends ChatSession {
  project: {
    id: string;
    name: string;
    color?: string;
    user_id: string;
  }
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'Unknown date';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Invalid date';
  }
};

const StatCard = ({ title, value, icon: Icon, iconBgColor, iconColor, delay = 0 }: 
  { title: string; value: string | number; icon: React.ElementType; iconBgColor: string; iconColor: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'circOut', delay }}
  >
    <GlassCard className="p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-muted">{title}</h3>
        <div className={`p-2.5 rounded-lg ${iconBgColor}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-primary">{value}</p>
    </GlassCard>
  </motion.div>
);

export default function Dashboard() {
  const { user } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [latestChats, setLatestChats] = useState<ChatWithProject[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    total_projects: 0,
    total_documents: 0,
    total_sessions: 0, 
    total_messages: 0
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);
  
  const loadDashboardData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const projectsData = await API.listProjects() as Project[] | ApiResponse<Project>;
      const projectsList = Array.isArray(projectsData) ? projectsData :
                          (projectsData?.items ? projectsData.items : []);
      setProjects(projectsList);
      
      let allChats: ChatWithProject[] = [];
      for (const project of projectsList.slice(0, 5)) {
        try {
          const chatsData = await API.listChatSessions(project.id) as ChatSession[] | ApiResponse<ChatSession>;
          const chats = Array.isArray(chatsData) ? chatsData : (chatsData?.items ? chatsData.items : []);
          const chatsWithProject = chats.map((chat: ChatSession) => ({
            ...chat,
            project: { id: project.id, name: project.name, color: project.color || '#00bfa6', user_id: project.user_id }
          }));
          allChats = [...allChats, ...chatsWithProject];
        } catch (err) { console.error(`Error loading chats for project ${project.id}:`, err); }
      }
      allChats.sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
      setLatestChats(allChats.slice(0, 5));
      
      if (projectsList.length > 0) {
        try {
          const docsData = await API.listDocuments(projectsList[0].id) as Document[] | ApiResponse<Document>;
          const docsList = Array.isArray(docsData) ? docsData : (docsData?.items ? docsData.items : []);
          setDocuments(docsList.slice(0, 5));
          setUserStats(prev => ({ ...prev, total_documents: docsList.length }));
        } catch (err) { console.error('Error loading documents:', err); }
      }
      
      setUserStats(prev => ({
        ...prev,
        total_projects: projectsList.length,
        total_sessions: allChats.length,
        total_messages: allChats.reduce((sum, chat) => sum + (chat.message_count || 0), 0)
      }));

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load your dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <DashboardLayout>
      <Head>
        <title>Dashboard | Nova AI</title>
        <meta name="description" content="Your AI powered workspace" />
      </Head>
      
      <div className="p-6 md:p-8 space-y-8">
        {/* Welcome section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-1">
            Welcome back, <span className="text-primary">{user?.name || user?.full_name || user?.email?.split('@')[0] || 'Explorer'}</span>!
          </h1>
          <p className="text-lg text-text-muted">
            Here's what's new in your AI workspace.
          </p>
        </motion.div>
        
        {error && (
          <GlassCard variant="accented" className="p-4 bg-error-color/10 border-error-color text-error-color">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Loading Error</p>
                <p className="text-sm">{error}</p>
                <Button onClick={loadDashboardData} variant="outline" size="sm" className="mt-3 border-error-color text-error-color hover:bg-error-color/20">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </GlassCard>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Agents" value={userStats.total_projects} icon={Bot} iconBgColor="bg-primary/10" iconColor="text-primary" delay={0.1} />
              <StatCard title="Chat Sessions" value={userStats.total_sessions} icon={MessageSquare} iconBgColor="bg-primary/10" iconColor="text-primary" delay={0.2} />
              <StatCard title="Knowledge Files" value={userStats.total_documents} icon={HardDrive} iconBgColor="bg-primary/10" iconColor="text-primary" delay={0.3} />
              <StatCard title="Total Messages" value={userStats.total_messages} icon={Sparkles} iconBgColor="bg-primary/10" iconColor="text-primary" delay={0.4} />
            </div>

            {/* Quick Actions & Recent Activity Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="lg:col-span-1">
                <GlassCard className="p-6 h-full">
                  <h2 className="text-xl font-semibold text-primary mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <Link href="/dashboard/agents/new" passHref>
                      <Button variant="default" size="lg" className="w-full">
                        <Plus className="w-5 h-5 mr-2" /> Create New Agent
                      </Button>
                    </Link>
                    <Link href="/dashboard/chats" passHref>
                      <Button variant="themed-secondary" size="lg" className="w-full">
                         <MessageSquare className="w-5 h-5 mr-2" /> View Chat History
                      </Button>
                    </Link>
                    <Link href="/dashboard/knowledge" passHref>
                       <Button variant="outline" size="lg" className="w-full">
                         <BookOpen className="w-5 h-5 mr-2" /> Manage Knowledge
                       </Button>
                    </Link>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Recent Chats */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="lg:col-span-2">
                <GlassCard className="p-6 h-full">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-primary">Recent Chats</h2>
                    <Link href="/dashboard/chats" passHref>
                       <Button variant="ghost" size="sm">
                         View All <ArrowRight className="w-4 h-4 ml-1" />
                       </Button>
                    </Link>
                  </div>
                  {latestChats.length > 0 ? (
                    <ul className="space-y-3">
                      {latestChats.map(chat => (
                        <li key={chat.id} className="p-3 rounded-lg hover:bg-hover-glass transition-colors duration-200">
                          <Link href={`/chat?session=${chat.id}`} className="block">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-text-main truncate pr-4">{chat.title || 'Untitled Chat'}</h4>
                              <span className="text-xs text-text-muted whitespace-nowrap">
                                {formatDate(chat.updated_at || chat.created_at)}
                              </span>
                            </div>
                            {chat.project && (
                               <p className="text-xs text-text-muted mb-1">With: <span style={{ color: chat.project.color || 'var(--primary)'}}>{chat.project.name}</span></p>
                            )}
                            <p className="text-sm text-text-muted line-clamp-2">
                              {chat.last_message_content || 'No messages yet...'}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-text-muted text-center py-8">No recent chats. Start a new conversation!</p>
                  )}
                </GlassCard>
              </motion.div>
            </div>
            
            {/* Placeholder for additional sections if any (e.g., Recent Documents, if data is available) */}
            {documents.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 }}>
                <GlassCard className="p-6 mt-6">
                  <h2 className="text-xl font-semibold text-primary mb-4">Recently Added Files</h2>
                   <ul className="space-y-3">
                      {documents.slice(0,3).map(doc => (
                        <li key={doc.id} className="p-3 rounded-lg hover:bg-hover-glass transition-colors duration-200 flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                            <div>
                              <p className="font-medium text-text-main truncate">{doc.filename}</p>
                              <p className="text-xs text-text-muted">Added on: {formatDate(doc.created_at)}</p>
                            </div>
                          </div>
                          <Link href={`/dashboard/agents/${doc.project_id}/knowledge`} passHref>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </li>
                      ))}
                    </ul>
                </GlassCard>
              </motion.div>
            )}

          </>
        )}
      </div>
    </DashboardLayout>
  );
} 