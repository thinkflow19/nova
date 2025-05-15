import { useState, useEffect } from 'react';
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
  TrendingUp
} from 'lucide-react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../utils/auth';
import { listProjects, listChatSessions } from '../../../utils/api';
import Button from '../../../components/ui/Button';
import GlassCard from '../../../components/ui/GlassCard';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

export default function Insights() {
  const { user, loading: authLoading } = useAuth({ redirectTo: '/login' });
  
  // State
  const [activeTimeFrame, setActiveTimeFrame] = useState('week'); // week, month, year
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [insightsData, setInsightsData] = useState({
    messageCount: 0,
    sessionCount: 0,
    topQuestions: [],
    activityByDay: [],
    responseTime: 0,
    topTopics: []
  });
  
  // Loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  
  const loadProjects = async () => {
    try {
      const projectsData = await listProjects();
      const projectsList = projectsData.items || projectsData || [];
      setProjects(projectsList);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load your agents. Please try again.');
    }
  };
  
  const loadInsightsData = async (projectId, timeFrame) => {
    try {
      setLoading(true);
      setError(null);
      
      // Here we would normally fetch real analytics data from the API
      // For now, we'll use mock data
      
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
  
  const formatDateRange = () => {
    const now = new Date();
    const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
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
    const max = Math.max(...data.map(d => d.count)) * 1.1;
    
    return (
      <div className="h-72 mt-4 flex items-end">
        {data.map((day, index) => {
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
  
  if (authLoading) return null; // DashboardLayout handles loading state
  
  return (
    <DashboardLayout>
      <Head>
        <title>Insights | Nova AI</title>
        <meta name="description" content="Analytics and insights for your AI agents" />
      </Head>
      
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold premium-text-gradient">Insights & Analytics</h1>
              <p className="text-muted-foreground mt-1">
                Discover patterns and optimize your AI agents
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                >
                  <Bot className="w-4 h-4" />
                  <span>{selectedProject ? selectedProject.name : 'All Agents'}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                
                {showProjectDropdown && (
                  <div className="absolute right-0 mt-2 z-10 w-64">
                    <GlassCard className="p-1 max-h-60 overflow-y-auto">
                      <div className="divide-y divide-border">
                        <button
                          className={`w-full text-left px-4 py-2 hover:bg-card-foreground/5 ${!selectedProject ? 'text-accent' : ''}`}
                          onClick={() => {
                            setSelectedProject(null);
                            setShowProjectDropdown(false);
                          }}
                        >
                          All Agents
                        </button>
                        
                        {projects.map(project => (
                          <button
                            key={project.id}
                            className={`w-full text-left px-4 py-2 hover:bg-card-foreground/5 ${selectedProject?.id === project.id ? 'text-accent' : ''}`}
                            onClick={() => {
                              setSelectedProject(project);
                              setShowProjectDropdown(false);
                            }}
                          >
                            {project.name}
                          </button>
                        ))}
                      </div>
                    </GlassCard>
                  </div>
                )}
              </div>
              
              <div className="flex rounded-md overflow-hidden border border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-none ${activeTimeFrame === 'week' ? 'bg-accent/10 text-accent' : ''}`}
                  onClick={() => setActiveTimeFrame('week')}
                >
                  Week
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-none ${activeTimeFrame === 'month' ? 'bg-accent/10 text-accent' : ''}`}
                  onClick={() => setActiveTimeFrame('month')}
                >
                  Month
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-none ${activeTimeFrame === 'year' ? 'bg-accent/10 text-accent' : ''}`}
                  onClick={() => setActiveTimeFrame('year')}
                >
                  Year
                </Button>
              </div>
              
              <Button variant="outline" className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="bg-destructive/10 border border-destructive text-foreground rounded-lg p-4 mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p>{error}</p>
                <Button
                  onClick={() => {
                    const projectId = selectedProject ? selectedProject.id : 'all';
                    loadInsightsData(projectId, activeTimeFrame);
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Date range banner */}
              <div className="mb-6">
                <GlassCard gradient className="py-4 px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-accent" />
                      <h2 className="font-medium">{formatDateRange()}</h2>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Showing data for: <span className="font-medium text-foreground">{selectedProject ? selectedProject.name : 'All Agents'}</span>
                    </div>
                  </div>
                </GlassCard>
              </div>
              
              {/* Metrics overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-muted-foreground">Messages</h3>
                      <div className="p-2 bg-blue-500/10 rounded-full">
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold mb-1">{insightsData.messageCount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3 inline mr-1 text-green-500" />
                      23% increase
                    </p>
                  </GlassCard>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-muted-foreground">Sessions</h3>
                      <div className="p-2 bg-violet-500/10 rounded-full">
                        <Bot className="w-5 h-5 text-violet-500" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold mb-1">{insightsData.sessionCount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3 inline mr-1 text-green-500" />
                      15% increase
                    </p>
                  </GlassCard>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-muted-foreground">Avg. Response Time</h3>
                      <div className="p-2 bg-amber-500/10 rounded-full">
                        <Clock className="w-5 h-5 text-amber-500" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold mb-1">{insightsData.responseTime}s</p>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3 inline mr-1 text-green-500" />
                      7% faster
                    </p>
                  </GlassCard>
                </motion.div>
              </div>
              
              {/* Activity chart */}
              <div className="mb-8">
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium flex items-center">
                      <LineChart className="w-5 h-5 mr-2 text-accent" />
                      Message Activity
                    </h2>
                  </div>
                  
                  {renderActivityChart()}
                </GlassCard>
              </div>
              
              {/* Top questions and topics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2 text-accent" />
                      Most Asked Questions
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    {insightsData.topQuestions.map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="font-medium text-accent">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.question}</p>
                          <p className="text-xs text-muted-foreground">{item.count} times asked</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border">
                    <Link href="/dashboard/chat">
                      <Button variant="outline" className="w-full">
                        View All Messages
                      </Button>
                    </Link>
                  </div>
                </GlassCard>
                
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium flex items-center">
                      <PieChart className="w-5 h-5 mr-2 text-accent" />
                      Popular Topics
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    {insightsData.topTopics.map((topic, index) => {
                      const percentage = Math.round((topic.count / insightsData.topTopics.reduce((sum, t) => sum + t.count, 0)) * 100);
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{topic.topic}</span>
                            <span className="text-sm text-muted-foreground">{percentage}%</span>
                          </div>
                          <div className="w-full bg-card-foreground/10 rounded-full h-2">
                            <div 
                              className="bg-accent h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border">
                    <Button variant="outline" className="w-full">
                      Export Topic Analysis
                    </Button>
                  </div>
                </GlassCard>
              </div>
              
              {/* AI-generated insights */}
              <GlassCard gradient glow className="p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="bg-accent/20 p-3 rounded-full">
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold mb-2">AI-Generated Insights</h2>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>
                          Users are asking more technical questions on weekdays, while general inquiries happen more on weekends.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>
                          Response times for pricing questions are 27% slower than other topics. Consider enhancing the pricing knowledge base.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>
                          There's a 43% increase in API integration questions this month. You might want to update your documentation.
                        </span>
                      </li>
                    </ul>
                    <Button variant="premium" className="mt-4">
                      Generate More Insights
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 