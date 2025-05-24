import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AgentCard from '@/components/dashboard/AgentCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Plus, 
  Search, 
  Filter as FilterIcon,
  MoreVertical,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Trash2,
  Archive,
  Play,
  Pause,
  Bot,
  PlusCircle,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectItem } from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { listAgents } from '@/utils/api';
import { Project as Agent } from '@/types/index';
import { extractErrorInfo } from '@/utils/error';
import dynamic from 'next/dynamic';

const DashboardLayoutDynamic = dynamic(() => import('@/components/dashboard/DashboardLayout'), { 
  loading: () => <div className="flex items-center justify-center h-screen"><LoadingSpinner size="lg" /></div>, 
  ssr: false 
});
const AgentCardDynamic = dynamic(() => import('@/components/dashboard/AgentCard'), { 
  loading: () => <div className="rounded-lg bg-card p-4 shadow-sm animate-pulse min-h-[200px]"></div>, 
  ssr: false 
});

const agentTypes = [
  { key: 'customer_support', label: 'Customer Support', color: 'primary' },
  { key: 'sales', label: 'Sales', color: 'secondary' },
  { key: 'hr', label: 'HR', color: 'success' },
  { key: 'general', label: 'General', color: 'warning' }
];

const statusConfig = {
  active: { color: 'success' as const, label: 'Active' },
  paused: { color: 'warning' as const, label: 'Paused' },
  training: { color: 'primary' as const, label: 'Training' },
  error: { color: 'danger' as const, label: 'Error' }
};

export default function AgentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name-asc');

  const {
    data: agents = [],
    isLoading,
    error,
    refetch
  } = useQuery<Agent[], Error>(['agents'], listAgents, {
    // staleTime: 5 * 60 * 1000, // Example: 5 minutes
  });

  const filteredAndSortedAgents = useMemo(() => {
    let processedAgents = agents.map(project => ({
      ...project,
      status: project.status || 'active',
            metrics: {
        totalChats: 0,
        avgResponseTime: 0,
        successRate: 0
      }
    }));

    if (filterStatus !== 'all') {
      processedAgents = processedAgents.filter(agent => agent.status === filterStatus);
    }

    if (searchTerm) {
      processedAgents = processedAgents.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sorting logic
    processedAgents.sort((a, b) => {
      const [field, order] = sortBy.split('-');
      const valA = a[field as keyof Agent];
      const valB = b[field as keyof Agent];

      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return order === 'desc' ? comparison * -1 : comparison;
    });

    return processedAgents;
  }, [agents, filterStatus, searchTerm, sortBy]);

  const pageError = error ? extractErrorInfo(error) : null;

  return (
    <DashboardLayoutDynamic>
      <Head>
        <title>Manage Agents - Nova AI</title>
      </Head>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI Agents</h1>
            <p className="text-muted-foreground">
              Manage and create your AI agents to automate tasks.
            </p>
          </div>
          <Button size="lg" className="flex items-center gap-2">
            <PlusCircle size={20} /> Create New Agent
            </Button>
        </header>

        <div className="bg-card p-4 sm:p-6 rounded-xl shadow-lg border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search agents by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 h-11 text-base"
                />
            </div>
                <Select
              value={filterStatus} 
              onValueChange={setFilterStatus}
              placeholder="Filter by status"
            >
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="error">Error</SelectItem>
                </Select>
                <Select
              value={sortBy} 
              onValueChange={setSortBy}
                  placeholder="Sort by"
            >
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="created_at-desc">Newest</SelectItem>
              <SelectItem value="created_at-asc">Oldest</SelectItem>
              <SelectItem value="status-asc">Status</SelectItem>
                </Select>
          </div>

          <div className="flex justify-end items-center mb-4">
            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
                  <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                    onClick={() => setViewMode('grid')}
                className={`p-2 h-auto ${viewMode === 'grid' ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                aria-label="Grid view"
                  >
                <LayoutGrid size={20} />
                </Button>
                  <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                    onClick={() => setViewMode('list')}
                className={`p-2 h-auto ${viewMode === 'list' ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                aria-label="List view"
                  >
                <ListIcon size={20} />
                  </Button>
                </div>
              </div>

          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <LoadingSpinner size="lg" />
            </div>
          )}
          
          {pageError && (
             <ErrorMessage 
                message={`Failed to load agents: ${pageError.message}`}
                code={pageError.code}
                onRetry={refetch}
             />
          )}

          {!isLoading && !pageError && filteredAndSortedAgents.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <FilterIcon size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Agents Found</h3>
              <p>Try adjusting your search or filters, or create a new agent.</p>
            </div>
          )}

          {!isLoading && !pageError && filteredAndSortedAgents.length > 0 && (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedAgents.map(agent => (
                  <AgentCardDynamic key={agent.id} agent={agent} />
            ))}
          </div>
        ) : (
              <div className="space-y-4">
                {filteredAndSortedAgents.map(agent => (
                  <AgentCardDynamic key={agent.id} agent={agent} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </DashboardLayoutDynamic>
  );
} 