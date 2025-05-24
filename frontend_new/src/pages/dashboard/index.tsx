import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button, 
  Chip
} from '@heroui/react';
import { 
  Bot, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  Activity,
  BarChart3,
  Plus,
  RefreshCw,
  Loader2,
  FileText,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { listProjects } from '@/utils/api';
import type { Project } from '@/types/index';

interface DashboardStats {
  totalAgents: number;
  totalChats: number;
  messagesCount: number;
  avgResponseTime: number;
  activeUsers: number;
  uptime: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

interface RecentActivity {
  id: string;
  type: 'chat' | 'agent' | 'knowledge' | 'system';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'error';
}

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: listProjects,
  });

  // Mock data for demo - in real app, this would come from API
  const [stats] = useState<DashboardStats>({
    totalAgents: projects.length || 3,
    totalChats: 127,
    messagesCount: 2840,
    avgResponseTime: 1.2,
    activeUsers: 24,
    uptime: 99.9
  });

  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'chat',
      title: 'New conversation started',
      description: 'Customer support agent handled a billing inquiry',
      timestamp: '2 minutes ago',
      status: 'success'
    },
    {
      id: '2',
      type: 'agent',
      title: 'Agent updated',
      description: 'Sales agent knowledge base was updated with new product info',
      timestamp: '15 minutes ago',
      status: 'success'
    },
    {
      id: '3',
      type: 'system',
      title: 'System maintenance',
      description: 'Scheduled maintenance completed successfully',
      timestamp: '1 hour ago',
      status: 'success'
    },
    {
      id: '4',
      type: 'knowledge',
      title: 'Knowledge base sync',
      description: 'Documentation updated from external source',
      timestamp: '2 hours ago',
      status: 'pending'
    }
  ]);

  const quickActions: QuickAction[] = [
    {
      title: 'Start New Chat',
      description: 'Begin a conversation with an AI agent',
      icon: <MessageSquare className="w-6 h-6" />,
      href: '/dashboard/chats',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'Create Agent',
      description: 'Build a new AI assistant',
      icon: <Bot className="w-6 h-6" />,
      href: '/dashboard/agents',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      title: 'Upload Knowledge',
      description: 'Add documents to knowledge base',
      icon: <FileText className="w-6 h-6" />,
      href: '/dashboard/knowledge',
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'View Analytics',
      description: 'Analyze performance metrics',
      icon: <BarChart3 className="w-6 h-6" />,
      href: '/dashboard/insights',
      color: 'from-amber-500 to-orange-600'
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  if (loading || isLoadingProjects) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'chat': return <MessageSquare className="w-4 h-4" />;
      case 'agent': return <Bot className="w-4 h-4" />;
      case 'knowledge': return <FileText className="w-4 h-4" />;
      case 'system': return <Settings className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'pending': return 'text-amber-600 dark:text-amber-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Dashboard - Nova AI Workspace</title>
        <meta name="description" content="Nova AI Workspace Dashboard - Your intelligent assistant control center" />
      </Head>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {userName}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
              Here's what's happening in your workspace today.
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="ghost" 
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link href="/dashboard/chats" passHref>
              <Button
                className="bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Agents</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalAgents}</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    +2 this week
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Chats</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalChats}</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    +12% from yesterday
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Messages Today</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.messagesCount.toLocaleString()}</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    +18% from yesterday
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.avgResponseTime}s</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    15% faster
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href} passHref>
                  <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 cursor-pointer group">
                    <CardBody className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}>
                          {action.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200" />
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Agents Overview */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Agents</h2>
                <Link href="/dashboard/agents" passHref>
                  <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.slice(0, 4).map((agent) => (
                  <Card key={agent.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <CardBody className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold">
                          {agent.name ? agent.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {agent.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {agent.description || 'AI Assistant'}
                          </p>
                        </div>
                        <Chip size="sm" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          Active
                        </Chip>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
              
              {projects.length === 0 && (
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardBody className="p-8 text-center">
                    <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Agents Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Create your first AI agent to get started
                    </p>
                    <Link href="/dashboard/agents" passHref>
                      <Button className="bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Agent
                      </Button>
                    </Link>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>

          {/* Recent Activity Sidebar */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardBody className="p-0">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentActivity.map((activity, index) => (
                    <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${getStatusColor(activity.status)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="ghost" size="sm" className="w-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    View All Activity
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* System Status */}
            <Card className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Status</h3>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">API Status</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600 dark:text-green-400">Operational</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                    <span className="text-sm text-gray-900 dark:text-white">{stats.avgResponseTime}s avg</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                    <span className="text-sm text-gray-900 dark:text-white">{stats.uptime}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                    <span className="text-sm text-gray-900 dark:text-white">{stats.activeUsers}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default DashboardPage; 