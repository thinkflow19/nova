'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';
import { Card, Loading } from '@/components/ui';

interface AnalyticsData {
  totalProjects: number;
  totalSessions: number;
  totalMessages: number;
  averageSessionLength: string;
  topModels: Array<{ name: string; usage: number }>;
  weeklyActivity: Array<{ day: string; messages: number; sessions: number }>;
  projectStats: Array<{ name: string; messages: number; lastActive: string }>;
}

const sampleAnalytics: AnalyticsData = {
  totalProjects: 5,
  totalSessions: 42,
  totalMessages: 1247,
  averageSessionLength: '12.5 min',
  topModels: [
    { name: 'GPT-4', usage: 75 },
    { name: 'GPT-3.5', usage: 20 },
    { name: 'Claude', usage: 5 }
  ],
  weeklyActivity: [
    { day: 'Mon', messages: 45, sessions: 8 },
    { day: 'Tue', messages: 62, sessions: 12 },
    { day: 'Wed', messages: 38, sessions: 6 },
    { day: 'Thu', messages: 71, sessions: 15 },
    { day: 'Fri', messages: 55, sessions: 9 },
    { day: 'Sat', messages: 28, sessions: 4 },
    { day: 'Sun', messages: 33, sessions: 5 }
  ],
  projectStats: [
    { name: 'Nova AI', messages: 456, lastActive: '2 hours ago' },
    { name: 'Project Alpha', messages: 324, lastActive: '1 day ago' },
    { name: 'Research Bot', messages: 267, lastActive: '3 days ago' },
    { name: 'Content Helper', messages: 200, lastActive: '1 week ago' }
  ]
};

const AnalyticsPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [analytics] = useState<AnalyticsData>(sampleAnalytics);
  const [timeRange, setTimeRange] = useState<string>('7d');

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  // Don't render while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <Loading size="lg" text="Checking authentication..." variant="neural" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <Loading size="lg" text="Redirecting to login..." variant="neural" />
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: string;
  }) => (
    <Card variant="glass" className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-1">{title}</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mb-1">{value}</p>
          <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </Card>
  );

  const SimpleBarChart = ({ data, maxValue }: {
    data: Array<{ day: string; messages: number }>;
    maxValue: number;
  }) => (
    <div className="flex items-end justify-between h-32 px-4">
      {data.map((item) => (
        <div key={item.day} className="flex flex-col items-center gap-2">
          <div
            className="bg-gradient-to-t from-[var(--accent-electric)] to-[var(--accent-purple)] rounded-t-md w-8 transition-all duration-300"
            style={{
              height: `${(item.messages / maxValue) * 100}%`,
              minHeight: '4px'
            }}
          />
          <span className="text-xs text-[var(--text-muted)]">{item.day}</span>
        </div>
      ))}
    </div>
  );

  const maxMessages = Math.max(...analytics.weeklyActivity.map(d => d.messages));

  return (
    <AppLayout 
      headerTitle="Analytics" 
      headerSubtitle="Track your AI usage and insights"
    >
      <div className="p-6 max-w-7xl mx-auto">
        {/* Time Range Selector */}
        <div className="flex justify-end mb-8">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-electric)]"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Projects"
            value={analytics.totalProjects}
            subtitle="+2 this month"
            icon="📁"
          />
          <StatCard
            title="Chat Sessions"
            value={analytics.totalSessions}
            subtitle="+8 this week"
            icon="💬"
          />
          <StatCard
            title="Messages Sent"
            value={analytics.totalMessages.toLocaleString()}
            subtitle="+156 this week"
            icon="📨"
          />
          <StatCard
            title="Avg Session"
            value={analytics.averageSessionLength}
            subtitle="↑ 15% vs last week"
            icon="⏱️"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Activity */}
          <Card variant="glass" className="p-6">
            <h3 className="text-heading-lg text-[var(--text-primary)] mb-6">
              Weekly Activity
            </h3>
            <SimpleBarChart data={analytics.weeklyActivity} maxValue={maxMessages} />
          </Card>

          {/* Model Usage */}
          <Card variant="glass" className="p-6">
            <h3 className="text-heading-lg text-[var(--text-primary)] mb-6">
              Model Usage
            </h3>
            <div className="space-y-4">
              {analytics.topModels.map((model) => (
                <div key={model.name} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-primary)]">{model.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--accent-electric)] to-[var(--accent-purple)] rounded-full transition-all duration-300"
                        style={{ width: `${model.usage}%` }}
                      />
                    </div>
                    <span className="text-sm text-[var(--text-secondary)] w-8">
                      {model.usage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Project Performance */}
        <Card variant="glass" className="p-6 mb-8">
          <h3 className="text-heading-lg text-[var(--text-primary)] mb-6">
            Project Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-[var(--border-secondary)]">
                  <th className="pb-3 text-sm font-medium text-[var(--text-muted)]">Project</th>
                  <th className="pb-3 text-sm font-medium text-[var(--text-muted)]">Messages</th>
                  <th className="pb-3 text-sm font-medium text-[var(--text-muted)]">Last Active</th>
                  <th className="pb-3 text-sm font-medium text-[var(--text-muted)]">Activity</th>
                </tr>
              </thead>
              <tbody>
                {analytics.projectStats.map((project) => (
                  <tr key={project.name} className="border-b border-[var(--border-secondary)]/50">
                    <td className="py-4 text-[var(--text-primary)]">{project.name}</td>
                    <td className="py-4 text-[var(--text-secondary)]">{project.messages}</td>
                    <td className="py-4 text-[var(--text-secondary)]">{project.lastActive}</td>
                    <td className="py-4">
                      <div className="w-20 h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--accent-plasma)] to-[var(--accent-gold)] rounded-full"
                          style={{ width: `${(project.messages / 500) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="neural" className="p-6 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-heading-lg text-[var(--text-primary)] mb-2">
              Peak Usage
            </h3>
            <p className="text-body-sm text-[var(--text-secondary)]">
              Your most active time is Thursday afternoons with 71 messages
            </p>
          </Card>
          
          <Card variant="neural" className="p-6 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-heading-lg text-[var(--text-primary)] mb-2">
              Efficiency Boost
            </h3>
            <p className="text-body-sm text-[var(--text-secondary)]">
              Your session length increased 15% this week, showing deeper engagement
            </p>
          </Card>
          
          <Card variant="neural" className="p-6 text-center">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-heading-lg text-[var(--text-primary)] mb-2">
              Growth Trend
            </h3>
            <p className="text-body-sm text-[var(--text-secondary)]">
              Your AI usage has grown 43% compared to last month
            </p>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default AnalyticsPage; 