import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { IconBrain, IconMessage, IconArrowRight, IconTrendingUp } from '@tabler/icons-react';

const stats = [
  {
    name: 'Total Agents',
    value: '12',
    change: '+20%',
    changeType: 'increase',
    icon: IconBrain,
  },
  {
    name: 'Active Chats',
    value: '89',
    change: '+12.5%',
    changeType: 'increase',
    icon: IconMessage,
  },
  {
    name: 'Messages Today',
    value: '2,847',
    change: '+18.2%',
    changeType: 'increase',
    icon: IconTrendingUp,
  },
];

const quickActions = [
  {
    name: 'Create New Agent',
    description: 'Build a custom AI agent for your specific needs',
    href: '/dashboard/agents/new',
    icon: IconBrain,
  },
  {
    name: 'Start Chat',
    description: 'Begin a new conversation with any of your agents',
    href: '/dashboard/chats',
    icon: IconMessage,
  },
];

const DashboardPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-muted mt-2">Welcome back! Here&apos;s what&apos;s happening with your agents.</p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-theme-primary/10 flex items-center justify-center">
                    <Icon size={24} className="text-theme-primary" />
            </div>
                  <div>
                    <p className="text-text-muted">{stat.name}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-semibold text-text-primary">{stat.value}</p>
                      <span className="text-sm font-medium text-green-500">{stat.change}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
                </div>
                
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-heading font-semibold text-text-primary mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.name} href={action.href} className="glass-card group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-theme-primary/10 flex items-center justify-center">
                      <Icon size={24} className="text-theme-primary" />
                      </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-text-primary">{action.name}</h3>
                      <p className="text-sm text-text-muted">{action.description}</p>
                    </div>
                    <IconArrowRight
                      size={20}
                      className="text-text-muted group-hover:text-theme-primary transition-colors"
                    />
                </div>
                </Link>
              );
            })}
              </div>
            </div>
            
        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-heading font-semibold text-text-primary mb-4">Recent Activity</h2>
          <div className="card">
            <div className="space-y-6">
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="flex items-start gap-4 pb-6 last:pb-0 last:border-b-0 border-b border-border">
                  <div className="w-10 h-10 rounded-lg bg-theme-primary/10 flex items-center justify-center">
                    <IconMessage size={20} className="text-theme-primary" />
                </div>
                  <div className="flex-1">
                    <p className="text-text-primary font-medium">New chat session started</p>
                    <p className="text-sm text-text-muted">Customer Support Agent • 2 hours ago</p>
                  </div>
                </div>
              ))}
                </div>
              </div>
            </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage; 