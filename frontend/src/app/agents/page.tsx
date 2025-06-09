'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';
import { Input, Loading, Button, Card } from '@/components/ui';
import { AgentCard } from '@/components/agents';
import type { Agent } from '@/types';

const predefinedAgents: Agent[] = [
  {
    id: 'assistant',
    name: 'General Assistant',
    description: 'A versatile AI assistant for general tasks, questions, and conversations.',
    category: 'General',
    capabilities: ['Q&A', 'Writing', 'Analysis', 'Coding'],
    model: 'GPT-4',
    status: 'available',
    icon: '🤖',
    color: '#3b82f6',
    autonomous: true
  },
  {
    id: 'researcher',
    name: 'Research Agent',
    description: 'Specialized in research, data analysis, and information synthesis.',
    category: 'Research',
    capabilities: ['Research', 'Analysis', 'Summarization', 'Fact-checking'],
    model: 'GPT-4',
    status: 'available',
    icon: '🔬',
    color: '#10b981',
    autonomous: true
  },
  {
    id: 'coder',
    name: 'Code Assistant',
    description: 'Expert programming assistant for code review, debugging, and development.',
    category: 'Development',
    capabilities: ['Code Review', 'Debugging', 'Architecture', 'Testing'],
    model: 'GPT-4',
    status: 'available',
    icon: '💻',
    color: '#8b5cf6',
    autonomous: true
  },
  {
    id: 'writer',
    name: 'Content Writer',
    description: 'Creative writing assistant for blogs, articles, and marketing content.',
    category: 'Writing',
    capabilities: ['Blog Writing', 'Copywriting', 'Editing', 'SEO'],
    model: 'GPT-4',
    status: 'available',
    icon: '✍️',
    color: '#f59e0b',
    autonomous: true
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    description: 'Specialized in data analysis, visualization, and business insights.',
    category: 'Analytics',
    capabilities: ['Data Analysis', 'Visualization', 'Reporting', 'Insights'],
    model: 'GPT-4',
    status: 'beta',
    icon: '📊',
    color: '#ef4444',
    autonomous: true
  },
  {
    id: 'designer',
    name: 'Design Assistant',
    description: 'Creative assistant for UI/UX design, branding, and visual concepts.',
    category: 'Design',
    capabilities: ['UI/UX', 'Branding', 'Color Theory', 'Typography'],
    model: 'GPT-4',
    status: 'coming_soon',
    icon: '🎨',
    color: '#ec4899',
    autonomous: false
  }
];

const AgentsPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [agents] = useState<Agent[]>(predefinedAgents);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>(predefinedAgents);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  // Filter agents based on search and filters
  useEffect(() => {
    let filtered = agents;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.capabilities.some(cap => cap.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(agent => agent.category === filterCategory);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(agent => agent.status === filterStatus);
    }

    setFilteredAgents(filtered);
  }, [agents, searchQuery, filterCategory, filterStatus]);

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

  const handleAgentSelect = (agent: Agent) => {
    if (agent.status === 'available' || agent.status === 'beta') {
      // Create a new chat session with this agent
      router.push(`/chat?agent=${agent.id}`);
    }
  };


  // Get unique categories for filter
  const categories = Array.from(new Set(agents.map(agent => agent.category)));

  return (
    <AppLayout 
      headerTitle="AI Agents" 
      headerSubtitle="Choose your specialized AI assistant"
    >
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search agents by name, description, or capabilities..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-electric)]"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-electric)]"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="beta">Beta</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
          </div>
        </div>

        {/* Agents Grid */}
        {filteredAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent, index) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onSelect={handleAgentSelect}
                className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
              />
            ))}
          </div>
        ) : (
          <Card variant="glass" className="text-center p-12">
            <div className="text-6xl mb-6 animate-float">🤖</div>
            <h2 className="text-heading-xl text-[var(--text-primary)] mb-4">
              No Agents Found
            </h2>
            <p className="text-body-md text-[var(--text-secondary)]">
              Try adjusting your search or filter criteria
            </p>
          </Card>
        )}

        {/* Custom Agent Section */}
        <div className="mt-12 pt-8 border-t border-[var(--border-secondary)]">
          <Card variant="neural" className="p-8 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h2 className="text-heading-xl text-[var(--text-primary)] mb-4">
              Create Custom Agent
            </h2>
            <p className="text-body-md text-[var(--text-secondary)] mb-6">
              Build your own specialized AI agent with custom prompts, knowledge base, and capabilities.
            </p>
            <Button
              variant="primary"
              onClick={() => alert('Custom agent creation coming soon!')}
            >
              Coming Soon
            </Button>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default AgentsPage; 