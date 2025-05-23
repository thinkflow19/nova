import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Bot, MessageSquare, Settings, Trash, AlertCircle, Search, Calendar, RefreshCw, Filter, Grid, List, FileText, Upload, MoreHorizontal, Edit3, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { listProjects, deleteProject } from '@/utils/api';
import Button from '@/components/ui/Button';
import { SkeletonLoader } from '@/components/ui/LoadingSpinner';
import type { Project } from '@/types/index';
import { useRouter } from 'next/router';
import { IconPlus, IconSearch, IconBrain } from '@tabler/icons-react';

type SortBy = 'recent' | 'name';
type ViewMode = 'grid' | 'list';

interface FilterOptions {
  sortBy: SortBy;
  tags: string[];
}

interface FilterTag {
  id: string;
  label: string;
  value: string;
}

export default function AgentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'recent',
    tags: []
  });
  const router = useRouter();
  
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      try {
        setLoadingData(true);
        setError(null);
        console.log('Fetching projects for user:', user.email);
        const projectsList = await listProjects();
        console.log('Projects received:', projectsList);
        setProjects(projectsList);
      } catch (error: any) {
        console.error('Error fetching projects:', error);
        setError(error?.message || 'Failed to load projects. Please try again.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchProjects();
  }, [user]);
  
  const handleDeleteProject = useCallback(async (projectId: string, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (deleteConfirm !== projectId) { setDeleteConfirm(projectId); return; }
    try {
      setDeletingId(projectId);
      await deleteProject(projectId);
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete agent.');
    } finally {
      setDeletingId(null);
    }
  }, [deleteConfirm]);
  
  const filteredProjects = useMemo(() => 
    projects.filter(project => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    ),
    [projects, searchQuery]
  );
  
  const sortedProjects = useMemo(() => 
    [...filteredProjects].sort((a, b) => {
      if (filters.sortBy === 'recent') {
        return new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime();
      } else if (filters.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    }),
    [filteredProjects, filters.sortBy]
  );
  
  const toggleFilter = useCallback(() => setFilterOpen(prev => !prev), []);
  const handleSortChange = useCallback((value: SortBy) => setFilters(prev => ({ ...prev, sortBy: value })), []);
  
  const handleTagClick = (tag: FilterTag) => {
    // ... implementation ...
  };
  
  if (authLoading || !user) return <DashboardLayout><div className="flex justify-center items-center h-screen"><SkeletonLoader width="w-12" height="h-12" /></div></DashboardLayout>;
  
  const AgentCard = ({ project }: { project: Project }) => (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
      <Link href={`/dashboard/bot/${project.id}`} passHref legacyBehavior>
        <a className="relative block bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg text-gray-900 dark:text-gray-100 border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-2xl p-6 group hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:border-theme-primary/40 transition-all duration-300 h-full flex flex-col justify-between min-h-[20rem] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/30 to-transparent dark:from-gray-700/40 dark:via-gray-700/20 dark:to-transparent pointer-events-none"></div>
          <div className="relative z-10 flex flex-col justify-between flex-1 space-y-4">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${project.color ? '' : 'bg-theme-primary/10'}`} style={{ backgroundColor: project.color ? project.color+'20' : undefined }}>
                   <Bot size={24} className={project.color ? 'opacity-80' : 'text-theme-primary'} style={{color: project.color || undefined}} />
                </div>
                <Button size="icon" variant="ghost" onClick={(e: React.MouseEvent) => {e.preventDefault(); e.stopPropagation(); router.push(`/dashboard/agents/${project.id}/settings`) }} title="Settings">
                  <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-theme-primary" />
                </Button>
              </div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 group-hover:text-theme-primary transition-colors mb-1 truncate">{project.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 h-10">{project.description ?? 'No description provided.'}</p>
            </div>
            
            <div className="mt-auto">
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {project.tags.slice(0,3).map((tag: string) => (
                    <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full shadow-sm">{tag}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <MessageSquare size={14} className="mr-1.5" />
                  <span>{project.stats?.session_count || 0} chats</span>
                </div>
                <div className="flex items-center">
                  <FileText size={14} className="mr-1.5" />
                  <span>{project.stats?.document_count || 0} docs</span>
                </div>
              </div>
               <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4" 
                  onClick={(e: React.MouseEvent) => {e.preventDefault();e.stopPropagation(); router.push(`/dashboard/bot/${project.id}`) }}
               >
                  Chat Now
              </Button>
            </div>
          </div>
        </a>
      </Link>
    </motion.div>
  );

  const AgentListItem = ({ project }: { project: Project }) => (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
       <Link href={`/dashboard/bot/${project.id}`} passHref legacyBehavior>
        <a className="flex items-center bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg hover:shadow-xl backdrop-blur-md p-4 group hover:border-theme-primary/40 transition-all duration-200">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${project.color ? '' : 'bg-theme-primary/10'}`} style={{ backgroundColor: project.color ? project.color+'20' : undefined }}>
                <Bot size={20} className={project.color ? 'opacity-80' : 'text-theme-primary'} style={{color: project.color || undefined}} />
            </div>
            <div className="flex-grow">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-theme-primary transition-colors truncate">{project.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{project.description ?? 'No description.'}</p>
            </div>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mx-4 space-x-4 hidden md:flex">
                <span className="flex items-center"><MessageSquare size={14} className="mr-1" /> {project.stats?.session_count || 0} Chats</span>
                <span className="flex items-center"><FileText size={14} className="mr-1" /> {project.stats?.document_count || 0} Docs</span>
                <span className="flex items-center"><Calendar size={14} className="mr-1" /> Created: {new Date(project.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={(e: React.MouseEvent) => {e.preventDefault(); e.stopPropagation(); router.push(`/dashboard/bot/${project.id}`) }} title="Chat">
                    Chat
                </Button>
                 <Button size="icon" variant="ghost" onClick={(e: React.MouseEvent) => {e.preventDefault(); e.stopPropagation(); router.push(`/dashboard/agents/${project.id}/settings`) }} title="Settings">
                    <Settings className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={(e: React.MouseEvent) => handleDeleteProject(project.id, e)} title={deleteConfirm === project.id ? 'Confirm Delete' : 'Delete Agent'} className={`${deleteConfirm === project.id ? 'text-red-500 hover:text-red-600' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'}`}>
                    {deletingId === project.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash className="w-4 h-4" />}
                </Button>
            </div>
        </a>
      </Link>
    </motion.div>
  );

  return (
    <DashboardLayout>
      <Head>
        <title>My Agents | Nova AI</title>
        <meta name="description" content="Manage your AI agents" />
      </Head>
      
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pt-2">
          <div>
            <h1 className="text-3xl font-bold text-theme-primary">My Agents</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg mt-1">
              Create, manage, and deploy your AI assistants.
            </p>
          </div>
          <Link href="/dashboard/agents/new" passHref legacyBehavior>
            <a className="inline-block">
              <Button size="md" className="flex items-center w-full md:w-auto">
                <IconPlus size={20} className="mr-2" />
                New Agent
              </Button>
            </a>
          </Link>
        </div>

        {/* Toolbar: Search, View Mode, Filter */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl backdrop-blur-md flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-grow w-full md:w-auto">
                <IconSearch
                  size={20}
                  className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search agents by name, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2.5 pl-11 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-theme-primary focus:border-theme-primary shadow-sm placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
            </div>
            <div className="flex gap-2 items-center flex-shrink-0">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <Grid className="w-5 h-5" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </Button>
                
                <div className="relative">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={toggleFilter}
                    className="flex items-center h-10"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  
                  {filterOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0}} transition={{duration: 0.15}}
                        className="absolute right-0 mt-2 z-20 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl backdrop-blur-md p-4">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Sort by</h3>
                        <div className="space-y-2 mb-4">
                          <label className="flex items-center text-sm text-gray-900 dark:text-gray-100 hover:text-theme-primary cursor-pointer">
                            <input
                              type="radio"
                              name="sortBy"
                              checked={filters.sortBy === 'recent'}
                              onChange={() => handleSortChange('recent')}
                              className="mr-2.5 h-4 w-4 accent-theme-primary focus:ring-theme-primary border-gray-200 dark:border-gray-700"
                            />
                            Most Recent
                          </label>
                          <label className="flex items-center text-sm text-gray-900 dark:text-gray-100 hover:text-theme-primary cursor-pointer">
                            <input
                              type="radio"
                              name="sortBy"
                              checked={filters.sortBy === 'name'}
                              onChange={() => handleSortChange('name')}
                              className="mr-2.5 h-4 w-4 accent-theme-primary focus:ring-theme-primary border-gray-200 dark:border-gray-700"
                            />
                            Name (A-Z)
                          </label>
                        </div>
                        <div className="flex justify-end mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                          <Button variant="ghost" size="sm" onClick={toggleFilter}>Done</Button>
                        </div>
                    </motion.div>
                  )}
                </div>
            </div>
        </div>
          
        {loadingData && (
          <div className="flex justify-center items-center h-64">
            <SkeletonLoader width="w-12" height="h-12" />
          </div>
        )}
        
        {!loadingData && error && (
           <div className="bg-red-600/10 border border-red-700/50 text-red-200 rounded-2xl shadow-lg p-6 my-8 flex flex-col items-center text-center backdrop-blur-md">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Oops! Something went wrong.</h3>
            <p className="text-sm text-red-300 mb-4 max-w-md">{error}</p>
            <Button size="md" variant="outline" onClick={() => {
              const retryFetch = async () => {
                if (!user) return;
                try {
                  setLoadingData(true);
                  setError(null);
                  console.log('Retrying projects fetch for user:', user.email);
                  const projectsList = await listProjects();
                  console.log('Projects received on retry:', projectsList);
                  setProjects(projectsList);
                } catch (error: any) {
                  console.error('Error on retry:', error);
                  setError(error?.message || 'Failed to load projects. Please try again.');
                } finally {
                  setLoadingData(false);
                }
              };
              retryFetch();
            }} className="border-red-500/50 text-red-300 hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/70"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Try Again
            </Button>
          </div>
        )}

        {!loadingData && !error && sortedProjects.length === 0 && (
          <div className="text-center py-12">
            <Bot className="mx-auto h-16 w-16 text-gray-500 dark:text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Agents Found</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchQuery ? `No agents match your search for "${searchQuery}". Try a different term or clear the search.` : 'You haven\'t created any AI agents yet. Get started by creating one!'}
            </p>
            <Link href="/dashboard/agents/new" passHref legacyBehavior>
                <a className="inline-block mx-auto">
                    <Button size="lg" className="flex items-center">
                    <IconPlus className="w-5 h-5 mr-2" />
                    Create Your First Agent
                    </Button>
                </a>
            </Link>
          </div>
        )}

        {!loadingData && !error && sortedProjects.length > 0 && (
          viewMode === 'grid' ? (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sortedProjects.map((project) => (
                <AgentCard key={project.id} project={project} />
              ))}
            </motion.div>
          ) : (
            <motion.div layout className="space-y-4">
              {sortedProjects.map((project) => (
                <AgentListItem key={project.id} project={project} />
              ))}
            </motion.div>
          )
        )}
      </div>
    </DashboardLayout>
  );
} 