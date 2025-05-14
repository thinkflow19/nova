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
  AlertCircle
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { API } from '../../utils/api';
import CustomButton from '../../components/ui/CustomButton';
import GlassCard from '../../components/ui/GlassCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { Project, ChatSession, Document, UserStats, ApiResponse } from '../../types';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  
  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalChats: 0,
    totalAgents: 0,
    totalDocuments: 0,
    messagesExchanged: 0
  });
  
  // Loading state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);
  
  const loadDashboardData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting to load dashboard data...');
      
      // Load projects/agents
      try {
        console.log('Fetching projects...');
        const projectsData = await API.listProjects() as Project[] | ApiResponse<Project>;
        console.log('Projects response:', projectsData);
        const projectsList = Array.isArray(projectsData) ? projectsData : 
                            (projectsData?.items ? projectsData.items : []);
        setProjects(projectsList);
        
        // Load recent chats across all projects
        let allChats: ChatSession[] = [];
        
        for (const project of projectsList.slice(0, 3)) { // Limit to 3 projects to avoid too many requests
          try {
            const chatsData = await API.listChatSessions(project.id) as ChatSession[] | ApiResponse<ChatSession>;
            const chats = Array.isArray(chatsData) ? chatsData : 
                         (chatsData?.items ? chatsData.items : []);
            
            // Add project info to each chat
            const chatsWithProject = chats.map((chat: ChatSession) => ({
              ...chat,
              project: {
                id: project.id,
                name: project.name,
                color: project.color
              }
            }));
            
            allChats = [...allChats, ...chatsWithProject];
          } catch (err) {
            console.error(`Error loading chats for project ${project.id}:`, err);
          }
        }
        
        // Sort by date and take most recent 5
        allChats.sort((a, b) => {
          const dateA = new Date(b.updated_at || b.created_at);
          const dateB = new Date(a.updated_at || a.created_at);
          return dateA.getTime() - dateB.getTime();
        });
        setRecentChats(allChats.slice(0, 5));
        
        // Load documents (from first project if available)
        if (projectsList.length > 0) {
          try {
            const docsData = await API.listDocuments(projectsList[0].id) as Document[] | ApiResponse<Document>;
            const docsList = Array.isArray(docsData) ? docsData : 
                            (docsData?.items ? docsData.items : []);
            setDocuments(docsList.slice(0, 5));
          } catch (err) {
            console.error('Error loading documents:', err);
          }
        }
        
        // Set user stats
        setUserStats({
          totalChats: allChats.length,
          totalAgents: projectsList.length,
          totalDocuments: Math.floor(Math.random() * 20) + 5, // Mock data
          messagesExchanged: Math.floor(Math.random() * 500) + 50 // Mock data
        });
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('Failed to load projects. Please try again.');
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load your dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (authLoading) return null; // DashboardLayout handles loading state
  
  return (
    <DashboardLayout>
      <Head>
        <title>Dashboard | Nova AI</title>
        <meta name="description" content="Your AI assistant dashboard" />
      </Head>
      
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold premium-text-gradient mb-2">
            Welcome back, {user?.name || user?.full_name || user?.email?.split('@')[0] || 'there'}
          </h1>
          <p className="text-muted-foreground">
            Your AI workspace
          </p>
        </div>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive text-foreground rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p>{error}</p>
              <CustomButton
                onClick={loadDashboardData}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Refresh Data
              </CustomButton>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-muted-foreground">Total Agents</h3>
                    <div className="p-2 bg-blue-500/10 rounded-full">
                      <Bot className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">{userStats.totalAgents}</p>
                </GlassCard>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-muted-foreground">Chat Sessions</h3>
                    <div className="p-2 bg-violet-500/10 rounded-full">
                      <MessageSquare className="w-5 h-5 text-violet-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">{userStats.totalChats}</p>
                </GlassCard>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-muted-foreground">Documents</h3>
                    <div className="p-2 bg-amber-500/10 rounded-full">
                      <FileText className="w-5 h-5 text-amber-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">{userStats.totalDocuments}</p>
                </GlassCard>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-muted-foreground">Messages Exchanged</h3>
                    <div className="p-2 bg-emerald-500/10 rounded-full">
                      <Zap className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">{userStats.messagesExchanged}</p>
                </GlassCard>
              </motion.div>
            </div>
            
            {/* Recent activity and quick actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Recent Agents */}
              <GlassCard className="p-6 col-span-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Your Agents</h2>
                  <Link 
                    href="/dashboard/new-bot" 
                    className="text-primary hover:text-primary-dark transition flex items-center gap-1 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Agent
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {projects.slice(0, 3).map((project) => (
                    <Link 
                      key={project.id} 
                      href={`/dashboard/bot/${project.id}`} 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: project.color || '#4f46e5' }}
                      >
                        {project.icon ? (
                          <span>{project.icon}</span>
                        ) : (
                          <Bot className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{project.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {project.description || 'AI Assistant'}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                  
                  {projects.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">You don't have any agents yet</p>
                      <Link href="/dashboard/new-bot">
                        <CustomButton>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Agent
                        </CustomButton>
                      </Link>
                    </div>
                  )}
                  
                  {projects.length > 3 && (
                    <Link 
                      href="/dashboard/agents" 
                      className="block text-center text-sm text-primary hover:text-primary-dark transition mt-2"
                    >
                      View all agents
                    </Link>
                  )}
                </div>
              </GlassCard>
              
              {/* Recent Chats */}
              <GlassCard className="p-6 col-span-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Recent Chats</h2>
                  <Link 
                    href="/dashboard/chats" 
                    className="text-primary hover:text-primary-dark transition flex items-center gap-1 text-sm"
                  >
                    All chats
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {recentChats.slice(0, 4).map((chat) => (
                    <Link 
                      key={chat.id} 
                      href={`/dashboard/bot/${chat.project.id}?chat=${chat.id}`} 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: chat.project?.color || '#4f46e5' }}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{chat.title || 'Untitled Chat'}</h3>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(chat.updated_at || chat.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                  
                  {recentChats.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">No recent chats</p>
                      {projects.length > 0 && (
                        <Link href={`/dashboard/bot/${projects[0].id}`}>
                          <CustomButton>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Start a Chat
                          </CustomButton>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>
              
              {/* Knowledge Base */}
              <GlassCard className="p-6 col-span-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Knowledge Base</h2>
                  <Link 
                    href="/dashboard/knowledge" 
                    className="text-primary hover:text-primary-dark transition flex items-center gap-1 text-sm"
                  >
                    <BookOpen className="w-4 h-4" />
                    View All
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {documents.slice(0, 4).map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{doc.filename}</h3>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(doc.created_at).toLocaleDateString()}
                          {doc.status !== 'completed' && (
                            <span className="inline-flex items-center ml-2 px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              {doc.status}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {documents.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">No documents in knowledge base</p>
                      {projects.length > 0 && (
                        <Link href={`/dashboard/knowledge`}>
                          <CustomButton>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Documents
                          </CustomButton>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
            
            {/* Features & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Quick Insights */}
              <GlassCard className="p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Quick Insights</h2>
                  <Link 
                    href="/dashboard/insights" 
                    className="text-primary hover:text-primary-dark transition flex items-center gap-1 text-sm"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Full Analytics
                  </Link>
                </div>
                
                <div className="flex items-center justify-center h-[200px]">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Detailed insights coming soon</p>
                  </div>
                </div>
              </GlassCard>
              
              {/* Helpful Resources */}
              <GlassCard className="p-6 lg:col-span-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Resources</h2>
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                
                <div className="space-y-4">
                  <Link 
                    href="https://docs.nova.ai" 
                    target="_blank"
                    className="block p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <h3 className="font-medium flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      Documentation
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Learn how to get the most out of Nova
                    </p>
                  </Link>
                  
                  <Link 
                    href="https://github.com/nova/examples" 
                    target="_blank"
                    className="block p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <h3 className="font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Example Agents
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Explore pre-built agent templates
                    </p>
                  </Link>
                  
                  <Link 
                    href="/dashboard/settings" 
                    className="block p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <h3 className="font-medium flex items-center gap-2">
                      <Settings className="w-4 h-4 text-primary" />
                      Account Settings
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage your account and preferences
                    </p>
                  </Link>
                </div>
              </GlassCard>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
} 