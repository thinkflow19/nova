'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Button, Card } from '@/components/ui';

// Mock data for the dashboard
const DASHBOARD_DATA = {
  stats: [
    { id: 'active-projects', title: 'Active Projects', value: '3', icon: '📁', change: '+1 this week', trend: 'up' },
    { id: 'active-chats', title: 'Active Chats', value: '12', icon: '💬', change: '+5 this week', trend: 'up' },
    { id: 'total-messages', title: 'Total Messages', value: '1,847', icon: '📊', change: '+326 this week', trend: 'up' },
    { id: 'storage', title: 'Storage Used', value: '2.4GB', icon: '💾', change: '42% of quota', trend: 'neutral' },
  ],
  quickActions: [
    { id: 'new-chat', title: 'New Chat', icon: '💬', color: 'electric' },
    { id: 'import-docs', title: 'Import Docs', icon: '📄', color: 'purple' },
    { id: 'analytics', title: 'Analytics', icon: '📈', color: 'plasma' },
    { id: 'settings', title: 'Settings', icon: '⚙️', color: 'gold' },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'Customer Support AI',
      description: 'AI-powered customer support chatbot with knowledge base integration',
      sessions: 17,
      messages: 342,
      lastActive: '2 hours ago',
      color: 'electric',
    },
    {
      id: 'proj-2',
      name: 'Document Intelligence',
      description: 'Automated document processing and information extraction',
      sessions: 8,
      messages: 205,
      lastActive: '1 day ago',
      color: 'purple',
    },
    {
      id: 'proj-3',
      name: 'Code Assistant Pro',
      description: 'Advanced coding companion for developers',
      sessions: 31,
      messages: 891,
      lastActive: '3 hours ago',
      color: 'plasma',
    },
  ],
  recentActivity: [
    { id: 'act-1', type: 'project_created', title: 'Created new project', project: 'Code Assistant Pro', time: '3 hours ago' },
    { id: 'act-2', type: 'chat_completed', title: 'Completed chat session', project: 'Customer Support AI', time: '5 hours ago' },
    { id: 'act-3', type: 'docs_imported', title: 'Imported 5 documents', project: 'Document Intelligence', time: '1 day ago' },
    { id: 'act-4', type: 'settings_updated', title: 'Updated project settings', project: 'Customer Support AI', time: '2 days ago' },
  ]
};

const DashboardPage: React.FC = () => {
  const [highlightedProject, setHighlightedProject] = useState<string | null>(null);

  return (
    <AppLayout 
      headerTitle="Dashboard" 
      headerSubtitle="Your AI Workspace Overview"
      showSidebar={true}
    >
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                Welcome back, <span className="bg-gradient-to-r from-[var(--accent-electric)] to-[var(--accent-purple)] bg-clip-text text-transparent">John</span>
              </h1>
              <p className="text-[var(--text-secondary)]">
                Here's what's happening with your AI projects today
              </p>
            </div>
            <Button 
              variant="primary" 
              size="md"
              className="mt-4 md:mt-0"
            >
              <span className="mr-2">+</span> New Project
            </Button>
          </div>
        </section>

        {/* Stats Overview Cards */}
        <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DASHBOARD_DATA.stats.map((stat, index) => (
              <Card 
                key={stat.id} 
                variant="glass" 
                className="stagger-animation"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                hover
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[var(--text-tertiary)] text-sm mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{stat.value}</h3>
                    <p className={`text-xs ${stat.trend === 'up' ? 'text-[var(--success)]' : stat.trend === 'down' ? 'text-[var(--error)]' : 'text-[var(--text-tertiary)]'}`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className="text-2xl bg-[var(--bg-tertiary)] p-3 rounded-xl">{stat.icon}</div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {DASHBOARD_DATA.quickActions.map((action, index) => (
              <Card 
                key={action.id} 
                variant="glass" 
                hover
                className={`text-center stagger-animation hover:border-[var(--accent-${action.color})] hover:shadow-[var(--shadow-glow-${action.color})]`}
                style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                onClick={() => console.log(`Quick action: ${action.title}`)}
              >
                <div className="flex flex-col items-center">
                  <div className={`text-4xl mb-3 bg-gradient-to-br from-[var(--accent-${action.color})] to-[var(--accent-${action.color})]/70 text-white p-4 rounded-xl shadow-md`}>
                    {action.icon}
                  </div>
                  <h3 className="text-[var(--text-primary)] font-medium">{action.title}</h3>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Cards */}
          <section className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Your Projects</h2>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {DASHBOARD_DATA.projects.map((project, index) => (
                <Card 
                  key={project.id} 
                  variant="glass" 
                  className={`stagger-animation border-l-4 border-[var(--accent-${project.color})] transform transition-all duration-300 ${highlightedProject === project.id ? 'scale-[1.02] -translate-y-1 shadow-[var(--shadow-glow-' + project.color + ')]' : ''}`}
                  style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                  hover
                  onMouseEnter={() => setHighlightedProject(project.id)}
                  onMouseLeave={() => setHighlightedProject(null)}
                >
                  <div className="flex flex-col md:flex-row justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{project.name}</h3>
                      <p className="text-sm text-[var(--text-secondary)] mb-4">{project.description}</p>
                      <div className="flex flex-wrap gap-3">
                        <span className="inline-flex items-center text-xs bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] px-2 py-1 rounded-md">
                          {project.sessions} Sessions
                        </span>
                        <span className="inline-flex items-center text-xs bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] px-2 py-1 rounded-md">
                          {project.messages} Messages
                        </span>
                        <span className="inline-flex items-center text-xs bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] px-2 py-1 rounded-md">
                          Active {project.lastActive}
                        </span>
                      </div>
                    </div>
                    <div className="flex mt-4 md:mt-0 space-x-2">
                      <Button variant="secondary" size="sm">Open</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Recent Activity</h2>
            <Card variant="glass">
              <div className="space-y-4">
                {DASHBOARD_DATA.recentActivity.map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className={`flex items-start pb-4 ${index < DASHBOARD_DATA.recentActivity.length - 1 ? 'border-b border-[var(--glass-border)]' : ''} stagger-animation`}
                    style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                  >
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-3
                      ${activity.type.includes('project') ? 'bg-[var(--accent-electric)]/10 text-[var(--accent-electric)]' : 
                        activity.type.includes('chat') ? 'bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]' : 
                        activity.type.includes('docs') ? 'bg-[var(--accent-plasma)]/10 text-[var(--accent-plasma)]' : 
                        'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]'}
                    `}>
                      {activity.type.includes('project') ? '📁' : 
                       activity.type.includes('chat') ? '💬' : 
                       activity.type.includes('docs') ? '📄' : '⚙️'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{activity.title}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{activity.project}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage; 