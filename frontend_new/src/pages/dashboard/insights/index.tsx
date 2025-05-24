import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  BarChart3, 
  PieChart, 
  Bot, 
  MessageSquare, 
  FileText, 
  Sparkles,
  Clock,
  Calendar,
  ChevronDown,
  Download,
  RefreshCw,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  CheckCircle,
  Zap,
  Brain,
  Target,
  Users
} from 'lucide-react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { listProjects, listChatSessions } from '../../../utils/api';
import GlassCard from '../../../components/ui/GlassCard';
import { SkeletonLoader } from '../../../components/ui/LoadingSpinner';
import type { Project } from '../../../types/index';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Select,
  SelectItem,
  Chip,
  Avatar,
  Progress,
  Divider,
  Tooltip,
  Tabs,
  Tab,
  Button
} from '@heroui/react';

// Add interfaces for project, insightsData, etc. as needed.
// Use explicit types for useState and function parameters.

// Add interfaces for Project and InsightsData
interface ActivityDay {
  date: string;
  count: number;
}

interface TopQuestion {
  question: string;
  count: number;
}

interface TopTopic {
  topic: string;
  count: number;
}

interface InsightsData {
  messageCount: number;
  sessionCount: number;
  topQuestions: TopQuestion[];
  activityByDay: ActivityDay[];
  responseTime: string | number;
  topTopics: TopTopic[];
}

interface ConversationAnalytics {
  totalConversations: number;
  avgDuration: number;
  successRate: number;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topTopics: Array<{
    topic: string;
    frequency: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  intentRecognition: Array<{
    intent: string;
    accuracy: number;
    volume: number;
  }>;
}

interface AgentPerformance {
  id: string;
  name: string;
  avatar?: string;
  metrics: {
    conversations: number;
    successRate: number;
    avgResponseTime: number;
    userSatisfaction: number;
    improvement: number;
  };
  status: 'excellent' | 'good' | 'needs_attention';
}

interface TimeSeriesData {
  date: string;
  conversations: number;
  satisfaction: number;
  responseTime: number;
}

const InsightsPage = () => {
  const { user, loading: authLoading } = useAuth();
  
  // State
  const [activeTimeFrame, setActiveTimeFrame] = useState<string>('week'); // week, month, year
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState<boolean>(false);
  const [insightsData, setInsightsData] = useState<InsightsData>({
    messageCount: 0,
    sessionCount: 0,
    topQuestions: [],
    activityByDay: [],
    responseTime: 0,
    topTopics: []
  });
  
  // Loading state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState<ConversationAnalytics | null>(null);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  
  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);
  
  useEffect(() => {
    if (selectedProject || projects.length > 0) {
      const projectId = selectedProject ? selectedProject.id : 'all';
      loadInsightsData(projectId, activeTimeFrame);
    }
  }, [selectedProject, activeTimeFrame, projects]);
  
  useEffect(() => {
    fetchInsightsData();
  }, [timeRange]);
  
  const loadProjects = async () => {
    try {
      const projectsList = await listProjects();
      setProjects(projectsList);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load your agents. Please try again.');
    }
  };
  
  const loadInsightsData = async (projectId: string, timeFrame: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Here we would normally fetch real analytics data from the API
      // For now, we&apos;ll use mock data
      
      // Simulating API call
      await new Promise(r => setTimeout(r, 1000));
      
      // Generate different data based on the selected timeframe
      const multiplier = timeFrame === 'week' ? 1 : timeFrame === 'month' ? 4 : 12;
      
      // Mock data
      const activityData = Array(timeFrame === 'week' ? 7 : timeFrame === 'month' ? 30 : 52)
        .fill(0)
        .map((_, i) => ({
          date: new Date(Date.now() - (i * 86400000)).toLocaleDateString(),
          count: Math.floor(Math.random() * 15 * multiplier) + 1
        }))
        .reverse();
      
      const mockTopics = [
        'Product features', 'Technical support', 'Pricing', 
        'Account help', 'Integration', 'API usage', 
        'Best practices', 'Documentation', 'Troubleshooting'
      ];
      
      const topTopics = mockTopics
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map(topic => ({
          topic,
          count: Math.floor(Math.random() * 100 * multiplier) + 10
        }))
        .sort((a, b) => b.count - a.count);
      
      const mockQuestions = [
        'How do I integrate with your API?',
        'What are the pricing options?',
        'How do I reset my password?',
        'Can I export my data?',
        'How do I create a new agent?',
        'What models are available?',
        'How do I upload documents?',
        'Can I customize the UI?',
        'What are the usage limits?'
      ];
      
      const topQuestions = mockQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map(question => ({
          question,
          count: Math.floor(Math.random() * 50 * multiplier) + 5
        }))
        .sort((a, b) => b.count - a.count);
      
      setInsightsData({
        messageCount: Math.floor(Math.random() * 1000 * multiplier) + 100,
        sessionCount: Math.floor(Math.random() * 100 * multiplier) + 10,
        topQuestions,
        activityByDay: activityData,
        responseTime: (Math.random() * 2 + 0.5).toFixed(1),
        topTopics
      });
    } catch (err) {
      console.error('Error loading insights data:', err);
      setError('Failed to load insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchInsightsData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      // const analyticsData = await fetch(`/api/analytics/conversations?time_range=${timeRange}`);
      // const performanceData = await fetch(`/api/analytics/performance/comparison?time_range=${timeRange}`);
      
      // Mock data for now
      setTimeout(() => {
        setAnalytics({
          totalConversations: 12847,
          avgDuration: 4.2,
          successRate: 94.8,
          sentimentAnalysis: {
            positive: 0.72,
            neutral: 0.23,
            negative: 0.05
          },
          topTopics: [
            { topic: 'Product Support', frequency: 0.35, trend: 'up' },
            { topic: 'Billing', frequency: 0.28, trend: 'down' },
            { topic: 'Technical Issues', frequency: 0.22, trend: 'stable' },
            { topic: 'Feature Requests', frequency: 0.15, trend: 'up' }
          ],
          intentRecognition: [
            { intent: 'Get Help', accuracy: 96.5, volume: 4200 },
            { intent: 'Make Purchase', accuracy: 94.2, volume: 2800 },
            { intent: 'Cancel Service', accuracy: 91.8, volume: 1200 },
            { intent: 'Get Information', accuracy: 89.3, volume: 3100 }
          ]
        });

        setAgentPerformance([
          {
            id: '1',
            name: 'Customer Support Bot',
            metrics: {
              conversations: 5247,
              successRate: 98.5,
              avgResponseTime: 0.8,
              userSatisfaction: 4.8,
              improvement: 12.3
            },
            status: 'excellent'
          },
          {
            id: '2',
            name: 'Sales Assistant',
            metrics: {
              conversations: 3856,
              successRate: 94.2,
              avgResponseTime: 1.1,
              userSatisfaction: 4.6,
              improvement: 8.7
            },
            status: 'good'
          },
          {
            id: '3',
            name: 'Technical Support',
            metrics: {
              conversations: 2432,
              successRate: 89.7,
              avgResponseTime: 2.1,
              userSatisfaction: 4.2,
              improvement: -2.1
            },
            status: 'needs_attention'
          }
        ]);

        // Generate mock time series data
        const mockTimeSeriesData: TimeSeriesData[] = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          mockTimeSeriesData.push({
            date: date.toISOString().split('T')[0],
            conversations: Math.floor(Math.random() * 200) + 300,
            satisfaction: Math.random() * 0.5 + 4.5,
            responseTime: Math.random() * 0.8 + 0.8
          });
        }
        setTimeSeriesData(mockTimeSeriesData);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch insights data:', error);
      setLoading(false);
    }
  };
  
  const formatDateRange = () => {
    const now = new Date();
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (activeTimeFrame === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      return `${formatDate(weekStart)} - ${formatDate(now)}`;
    } else if (activeTimeFrame === 'month') {
      const monthStart = new Date(now);
      monthStart.setDate(now.getDate() - 30);
      return `${formatDate(monthStart)} - ${formatDate(now)}`;
    } else {
      const yearStart = new Date(now);
      yearStart.setDate(now.getDate() - 365);
      return `${formatDate(yearStart)} - ${formatDate(now)}`;
    }
  };
  
  const renderActivityChart = () => {
    const data = insightsData.activityByDay;
    const max = Math.max(...data.map((d: ActivityDay) => d.count)) * 1.1;
    
    return (
      <div className="h-72 mt-4 flex items-end">
        {data.map((day: ActivityDay, index: number) => {
          const height = (day.count / max) * 100;
          return (
            <div key={index} className="flex flex-col items-center flex-1 group">
              <div className="relative w-full px-1">
                <div 
                  className="w-full bg-accent/20 rounded-t-sm hover:bg-accent/30 transition-all cursor-pointer group-hover:bg-accent/40"
                  style={{ height: `${height}%`, minHeight: '1px' }}
                ></div>
                <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-card p-2 rounded shadow-md z-10 text-xs pointer-events-none text-center">
                  {day.count} messages<br/>
                  {day.date}
                </div>
              </div>
              {activeTimeFrame !== 'year' && (
                <div className="text-xs text-muted-foreground mt-1 w-full text-center truncate">
                  {new Date(day.date).toLocaleDateString('en-US', { 
                    weekday: activeTimeFrame === 'week' ? 'short' : undefined,
                    month: activeTimeFrame === 'month' ? 'short' : undefined,
                    day: 'numeric'
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'success';
      case 'good': return 'warning';
      case 'needs_attention': return 'danger';
      default: return 'default';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4" />;
      case 'good': return <Target className="w-4 h-4" />;
      case 'needs_attention': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-success" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-danger" />;
      default: return <div className="w-3 h-3 bg-muted-foreground rounded-full" />;
    }
  };
  
  if (authLoading) return null; // DashboardLayout handles loading state
  
  return (
    <DashboardLayout>
      <Head>
        <title>Insights & Analytics - Nova AI</title>
        <meta name="description" content="Analytics and insights for your AI agents - Nova AI" />
      </Head>
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
            <h1 className="text-3xl font-bold text-foreground">Insights & Analytics</h1>
              <p className="text-muted-foreground mt-1">
              Deep dive into your AI agent performance and conversation analytics
              </p>
            </div>
            <div className="flex items-center gap-3">
            <Select
                  size="sm"
              placeholder="Time Range"
              selectedKeys={[timeRange]}
              onSelectionChange={(keys) => setTimeRange(Array.from(keys)[0] as string)}
              className="w-32"
            >
              <SelectItem key="7d">Last 7 days</SelectItem>
              <SelectItem key="30d">Last 30 days</SelectItem>
              <SelectItem key="90d">Last 90 days</SelectItem>
              <SelectItem key="1y">Last year</SelectItem>
            </Select>
                <Button
              variant="bordered"
              startContent={<Download className="w-4 h-4" />}
                >
              Export Report
                </Button>
                <Button
              isIconOnly
              variant="bordered"
              onClick={fetchInsightsData}
              aria-label="Refresh data"
                >
              <RefreshCw className="w-4 h-4" />
                </Button>
            </div>
          </div>
          
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Conversations</p>
                    <p className="text-3xl font-bold text-foreground">
                      {analytics?.totalConversations.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-success mr-1" />
                      <span className="text-sm text-success font-medium">+18.7%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-full">
                    <MessageSquare className="w-6 h-6 text-primary" />
              </div>
            </div>
              </CardBody>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
              <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                    <p className="text-3xl font-bold text-foreground">{analytics?.successRate}%</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-success mr-1" />
                      <span className="text-sm text-success font-medium">+2.3%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-success/10 rounded-full">
                    <Target className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Avg Duration</p>
                    <p className="text-3xl font-bold text-foreground">{analytics?.avgDuration}m</p>
                    <div className="flex items-center mt-2">
                      <TrendingDown className="w-4 h-4 text-success mr-1" />
                      <span className="text-sm text-success font-medium">-8.5%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-warning/10 rounded-full">
                    <Clock className="w-6 h-6 text-warning" />
                      </div>
                    </div>
              </CardBody>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Positive Sentiment</p>
                    <p className="text-3xl font-bold text-foreground">
                      {Math.round((analytics?.sentimentAnalysis.positive || 0) * 100)}%
                    </p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-success mr-1" />
                      <span className="text-sm text-success font-medium">+5.2%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-secondary/10 rounded-full">
                    <Star className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </CardBody>
            </Card>
                </motion.div>
        </div>

        {/* Main Analytics Tabs */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Detailed Analytics</h2>
          </CardHeader>
          <CardBody>
            <Tabs aria-label="Analytics tabs" color="primary" variant="underlined">
              <Tab key="sentiment" title="Sentiment Analysis">
                <div className="py-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sentiment Breakdown */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-success rounded-full"></div>
                            <span>Positive</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Progress 
                              value={(analytics?.sentimentAnalysis.positive || 0) * 100} 
                              color="success"
                              className="w-32"
                            />
                            <span className="font-medium w-12 text-right">
                              {Math.round((analytics?.sentimentAnalysis.positive || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-default-400 rounded-full"></div>
                            <span>Neutral</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Progress 
                              value={(analytics?.sentimentAnalysis.neutral || 0) * 100} 
                              color="default"
                              className="w-32"
                            />
                            <span className="font-medium w-12 text-right">
                              {Math.round((analytics?.sentimentAnalysis.neutral || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-danger rounded-full"></div>
                            <span>Negative</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Progress 
                              value={(analytics?.sentimentAnalysis.negative || 0) * 100} 
                              color="danger"
                              className="w-32"
                            />
                            <span className="font-medium w-12 text-right">
                              {Math.round((analytics?.sentimentAnalysis.negative || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Topics */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Top Conversation Topics</h3>
                      <div className="space-y-3">
                        {analytics?.topTopics.map((topic, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{topic.topic}</span>
                              {getTrendIcon(topic.trend)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={topic.frequency * 100} 
                                color="primary"
                                className="w-20"
                                size="sm"
                              />
                              <span className="text-sm font-medium w-12 text-right">
                                {Math.round(topic.frequency * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
              </div>
              </Tab>

              <Tab key="performance" title="Agent Performance">
                <div className="py-6">
                  <div className="space-y-4">
                    {agentPerformance.map((agent) => (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-6 border border-border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar 
                              size="sm" 
                              name={agent.name}
                              className="bg-primary/10 text-primary"
                            />
                            <div>
                              <h3 className="font-semibold">{agent.name}</h3>
                              <div className="flex items-center gap-2">
                                <Chip 
                                  size="sm" 
                                  color={getStatusColor(agent.status)}
                                  variant="flat"
                                  startContent={getStatusIcon(agent.status)}
                                >
                                  {agent.status.replace('_', ' ')}
                                </Chip>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {agent.metrics.improvement > 0 ? (
                              <TrendingUp className="w-4 h-4 text-success" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-danger" />
                            )}
                            <span className={`text-sm font-medium ${
                              agent.metrics.improvement > 0 ? 'text-success' : 'text-danger'
                            }`}>
                              {agent.metrics.improvement > 0 ? '+' : ''}{agent.metrics.improvement}%
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Conversations</p>
                            <p className="text-2xl font-bold">{agent.metrics.conversations.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                            <p className="text-2xl font-bold">{agent.metrics.successRate}%</p>
                            <Progress value={agent.metrics.successRate} color="success" size="sm" className="mt-1" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Avg Response</p>
                            <p className="text-2xl font-bold">{agent.metrics.avgResponseTime}s</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Satisfaction</p>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-warning fill-current" />
                              <p className="text-2xl font-bold">{agent.metrics.userSatisfaction}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  </div>
              </Tab>
                
              <Tab key="intents" title="Intent Recognition">
                <div className="py-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Intent Recognition Accuracy</h3>
                    {analytics?.intentRecognition.map((intent, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{intent.intent}</h4>
                            <p className="text-sm text-muted-foreground">
                              {intent.volume.toLocaleString()} conversations
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">{intent.accuracy}%</p>
                            <p className="text-sm text-muted-foreground">Accuracy</p>
                          </div>
                        </div>
                        <Progress 
                          value={intent.accuracy} 
                          color={intent.accuracy > 95 ? 'success' : intent.accuracy > 90 ? 'warning' : 'danger'}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">AI-Powered Recommendations</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-warning mb-1">Improve Response Times</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Technical Support agent has 2.1s average response time. Consider optimizing the knowledge base or increasing model performance.
                    </p>
                    <Button size="sm" color="warning" variant="bordered">
                      View Suggestions
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Training Opportunity</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      47% of conversations are FAQ-related. Consider creating a dedicated FAQ agent to improve efficiency.
                    </p>
                    <Button size="sm" color="primary" variant="bordered">
                      Create FAQ Agent
                    </Button>
                  </div>
                </div>
              </div>
        </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InsightsPage; 