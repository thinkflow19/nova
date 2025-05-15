import { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Bot, MessageSquare, Settings, Trash, AlertCircle, Search, Calendar, RefreshCw, Filter, Grid, List, FileText, Upload } from 'lucide-react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { API } from '../../../utils/api';
import { Button } from '../../../components/ui/Button';
import GlassCard from '../../../components/ui/GlassCard';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import type { Project, ApiResponse } from '../../../types';
import { useRouter } from 'next/router';

type SortBy = 'recent' | 'name';
type ViewMode = 'grid' | 'list';

interface FilterOptions {
  sortBy: SortBy;
  tags: string[];
}

// Add premium variant to Button props
declare module '../../../components/ui/CustomButton' {
  interface CustomButtonProps {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'premium';
  }
}

export default function Agents() {
  console.log('Applying agent card style fixes');
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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
  
  // Only reload projects when user changes
  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);
  
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching projects...');
      const projectsList = await API.listProjects(); 
      console.log('Projects response (should be Project[]):', projectsList);
      
      setProjects(Array.isArray(projectsList) ? projectsList : []);
    } catch (err: any) { 
      console.error('Error loading projects:', err);
      setError(err.message || 'Failed to load your agents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Memoize the delete handler to prevent unnecessary function recreations
  const handleDeleteProject = useCallback(async (projectId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (deleteConfirm !== projectId) {
      setDeleteConfirm(projectId);
      return;
    }
    
    try {
      setDeletingId(projectId);
      await API.deleteProject(projectId);
      
      // Remove from list with functional update pattern
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete agent. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }, [deleteConfirm]);
  
  // Memoize filtered and sorted projects to avoid recalculating on every render
  const filteredProjects = useMemo(() => 
    projects.filter(project => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
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
  
  // Memoize the filter toggle handler
  const toggleFilter = useCallback(() => {
    setFilterOpen(prev => !prev);
  }, []);
  
  // Handle view mode toggle
  const setGridView = useCallback(() => setViewMode('grid'), []);
  const setListView = useCallback(() => setViewMode('list'), []);
  
  // Handle filter change
  const handleSortChange = useCallback((value: SortBy) => {
    setFilters(prev => ({ ...prev, sortBy: value }));
  }, []);
  
  if (authLoading) return null; // DashboardLayout handles loading state
  
  return (
    <DashboardLayout>
      <Head>
        <title>My Agents | Nova AI</title>
        <meta name="description" content="Manage your AI agents" />
      </Head>
      
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">My Agents</h1>
              <p className="text-text-secondary mt-1">
                Create and manage your AI agents
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="input-themed pl-10 w-full md:w-60"
                />
              </div>
              
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className={viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:bg-primary/10 hover:text-primary'}
                  onClick={setGridView}
                >
                  <Grid className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={viewMode === 'list' ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:bg-primary/10 hover:text-primary'}
                  onClick={setListView}
                >
                  <List className="w-5 h-5" />
                </Button>
                
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFilter}
                    className="flex items-center text-text-secondary hover:bg-primary/10 hover:text-primary"
                  >
                    <Filter className="w-5 h-5 mr-2" />
                    Filter
                  </Button>
                  
                  {filterOpen && (
                    <div className="absolute right-0 mt-2 z-10 w-64">
                      <GlassCard className="p-4">
                        <h3 className="font-medium mb-3 text-text-primary">Sort by</h3>
                        <div className="space-y-2 mb-4">
                          <label className="flex items-center text-text-secondary">
                            <input
                              type="radio"
                              name="sortBy"
                              checked={filters.sortBy === 'recent'}
                              onChange={() => handleSortChange('recent')}
                              className="mr-2 radio-themed"
                            />
                            <span className="text-sm">Most recent</span>
                          </label>
                          <label className="flex items-center text-text-secondary">
                            <input
                              type="radio"
                              name="sortBy"
                              checked={filters.sortBy === 'name'}
                              onChange={() => handleSortChange('name')}
                              className="mr-2 radio-themed"
                            />
                            <span className="text-sm">Name</span>
                          </label>
                        </div>
                        
                        <div className="flex justify-end mt-4">
                          <Button
                            variant="themed-secondary"
                            size="sm"
                            onClick={toggleFilter}
                          >
                            Apply
                          </Button>
                        </div>
                      </GlassCard>
                    </div>
                  )}
                </div>
                
                <Link href="/dashboard/agents/new">
                  <Button variant="default" size="sm" className="flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    New Agent
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {loading && (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <div className="bg-error-color/10 border border-error-color text-error-color p-4 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-3" />
              {error}
            </div>
          )}

          {!loading && !error && sortedProjects.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border-color rounded-lg">
              <Bot className="mx-auto h-12 w-12 text-text-secondary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-text-primary">No agents found</h3>
              <p className="text-text-secondary mb-6">
                {searchQuery ? "Try adjusting your search or filter criteria." : "Get started by creating a new AI agent."}
              </p>
              {!searchQuery && (
                <Link href="/dashboard/agents/new">
                  <Button variant="default">
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Agent
                  </Button>
                </Link>
              )}
            </div>
          )}

          {!loading && !error && sortedProjects.length > 0 && (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative group"
                  >
                    <Link href="/dashboard/agents/new" className="block h-full">
                      <GlassCard className="p-6 h-full flex flex-col items-center justify-center text-center hover:border-primary/70 transition-colors duration-300">
                        <div className="p-3 bg-primary/10 rounded-full mb-4">
                          <Plus className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-1">Create New Agent</h3>
                        <p className="text-sm text-text-secondary">Start a new AI project</p>
                      </GlassCard>
                    </Link>
                  </motion.div>

                  {sortedProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative group"
                    >
                      <Link href={`/dashboard/bot/${project.id}`} className="block h-full">
                        <GlassCard 
                          className="p-5 h-full flex flex-col justify-between transition-all duration-300 ease-in-out hover:border-primary/70"
                        >
                          <div>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-grow min-w-0">
                                <div className="p-2.5 bg-primary/10 backdrop-blur-sm rounded-lg shadow-inner">
                                  <Bot className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-grow min-w-0">
                                  <h3 className="text-lg font-semibold text-text-primary truncate" title={project.name}>
                                    {project.name}
                                  </h3>
                                  {project.model_type && (
                                    <span className="text-xs px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded-md font-medium text-primary whitespace-nowrap inline-block mt-1">
                                      {project.model_type}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {project.description && (
                              <p className="text-sm text-text-secondary mb-4 line-clamp-2" title={project.description}>
                                {project.description}
                              </p>
                            )}
                            
                            {project.tags && project.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                {project.tags.slice(0, 3).map((tag, index) => (
                                  <span 
                                    key={index} 
                                    className="text-xs px-2 py-0.5 bg-bg-secondary backdrop-blur-sm border border-border-color text-text-tertiary rounded-md truncate max-w-[100px]"
                                    title={tag}
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {project.tags.length > 3 && (
                                  <span className="text-xs px-2 py-0.5 bg-bg-secondary backdrop-blur-sm border border-border-color text-text-tertiary rounded-md">
                                    +{project.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-text-secondary">
                              {[
                                { icon: FileText, label: "Files", value: project.stats?.file_count || 0 },
                                { icon: MessageSquare, label: "Chats", value: project.stats?.session_count || 0 },
                                { icon: Calendar, label: "Created", value: project.created_at ? new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A' }
                              ].map(stat => (
                                <div key={stat.label} className="p-2 bg-bg-secondary/50 backdrop-blur-sm rounded-lg border border-border-color/50 flex flex-col items-center text-center">
                                  <stat.icon className="w-4 h-4 mb-1 text-primary/80" />
                                  <span className="font-medium text-sm text-text-primary">{stat.value}</span>
                                  <span className="text-xs text-text-tertiary">{stat.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-auto pt-3 border-t border-border-color/30">
                            <div className="flex items-center justify-between gap-2">
                               <Button
                                variant="link"
                                size="sm"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation(); 
                                  router.push(`/dashboard/agents/${project.id}/knowledge`);
                                }}
                                className="text-primary/90 hover:text-primary p-0 flex items-center gap-1.5"
                              >
                                <Upload className="w-4 h-4" />
                                Knowledge
                              </Button>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e: React.MouseEvent) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    router.push(`/dashboard/agents/${project.id}/settings`);
                                  }}
                                  className="p-1.5 h-7 w-7 text-text-secondary hover:text-primary hover:bg-primary/10"
                                  aria-label="Settings"
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e: React.MouseEvent) => handleDeleteProject(project.id, e)}
                                  disabled={deletingId === project.id}
                                  className="p-1.5 h-7 w-7 text-error-color/70 hover:text-error-color hover:bg-error-color/10"
                                  aria-label="Delete"
                                >
                                  {deletingId === project.id ? <LoadingSpinner size="sm" /> : <Trash className="w-4 h-4" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </GlassCard>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <Link href="/dashboard/agents/new" className="block">
                    <GlassCard className="p-4 hover:border-primary/70 transition-colors duration-300 flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-md font-semibold text-text-primary">Create New Agent</h3>
                        <p className="text-sm text-text-secondary">Start a new AI project</p>
                      </div>
                    </GlassCard>
                  </Link>

                  {sortedProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Link href={`/dashboard/bot/${project.id}`} className="block">
                        <GlassCard className="p-4 transition-all duration-300 ease-in-out hover:border-primary/70">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-grow min-w-0">
                              <div className="p-2 bg-primary/10 backdrop-blur-sm rounded-lg shadow-inner flex-shrink-0">
                                <Bot className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-grow min-w-0">
                                <h3 className="text-md font-semibold text-text-primary truncate" title={project.name}>
                                  {project.name}
                                </h3>
                                {project.description && (
                                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-1" title={project.description}>
                                    {project.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-end sm:gap-4 gap-2 w-full sm:w-auto flex-shrink-0">
                              <div className="flex items-center gap-1.5 text-xs text-text-secondary whitespace-nowrap">
                                <FileText className="w-3.5 h-3.5 text-primary/80 flex-shrink-0" />
                                <span>{project.stats?.file_count || 0} Files</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-text-secondary whitespace-nowrap">
                                <MessageSquare className="w-3.5 h-3.5 text-primary/80 flex-shrink-0" />
                                <span>{project.stats?.session_count || 0} Chats</span>
                              </div>
                              {project.model_type && (
                                <span className="text-xs px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded-md font-medium text-primary whitespace-nowrap">
                                  {project.model_type}
                                </span>
                              )}
                              <div className="text-xs text-text-secondary whitespace-nowrap">
                                {project.created_at ? new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0 mt-2 sm:mt-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/agents/${project.id}/knowledge`);
                                }}
                                className="p-1.5 h-7 w-7 text-text-secondary hover:text-primary hover:bg-primary/10"
                                aria-label="Upload Knowledge"
                              >
                                <Upload className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e: React.MouseEvent) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  router.push(`/dashboard/agents/${project.id}/settings`);
                                }}
                                className="p-1.5 h-7 w-7 text-text-secondary hover:text-primary hover:bg-primary/10"
                                aria-label="Settings"
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e: React.MouseEvent) => handleDeleteProject(project.id, e)}
                                disabled={deletingId === project.id}
                                className="p-1.5 h-7 w-7 text-error-color/70 hover:text-error-color hover:bg-error-color/10"
                                aria-label="Delete"
                              >
                                {deletingId === project.id ? <LoadingSpinner size="sm" /> : <Trash className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        </GlassCard>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 