import { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Bot, MessageSquare, Settings, Trash, AlertCircle, Search, Calendar, RefreshCw, Filter, Grid, List, FileText, Upload } from 'lucide-react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { API } from '../../../utils/api';
import CustomButton from '../../../components/ui/CustomButton';
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
              <h1 className="text-2xl font-bold premium-text-gradient">My Agents</h1>
              <p className="text-muted-foreground mt-1">
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-premium pl-10 w-full md:w-60"
                />
              </div>
              
              <div className="flex gap-2 items-center">
                <CustomButton
                  variant="outline"
                  size="icon"
                  className={viewMode === 'grid' ? 'bg-accent/10 text-accent' : ''}
                  onClick={setGridView}
                >
                  <Grid className="w-5 h-5" />
                </CustomButton>
                <CustomButton
                  variant="outline"
                  size="icon"
                  className={viewMode === 'list' ? 'bg-accent/10 text-accent' : ''}
                  onClick={setListView}
                >
                  <List className="w-5 h-5" />
                </CustomButton>
                
                <div className="relative">
                  <CustomButton
                    variant="outline"
                    size="sm"
                    onClick={toggleFilter}
                    className="flex items-center"
                  >
                    <Filter className="w-5 h-5 mr-2" />
                    Filter
                  </CustomButton>
                  
                  {filterOpen && (
                    <div className="absolute right-0 mt-2 z-10 w-64">
                      <GlassCard className="p-4">
                        <h3 className="font-medium mb-3">Sort by</h3>
                        <div className="space-y-2 mb-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="sortBy"
                              checked={filters.sortBy === 'recent'}
                              onChange={() => handleSortChange('recent')}
                              className="mr-2"
                            />
                            <span className="text-sm">Most recent</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="sortBy"
                              checked={filters.sortBy === 'name'}
                              onChange={() => handleSortChange('name')}
                              className="mr-2"
                            />
                            <span className="text-sm">Name</span>
                          </label>
                        </div>
                        
                        <div className="flex justify-end mt-4">
                          <CustomButton
                            variant="outline"
                            size="sm"
                            onClick={toggleFilter}
                          >
                            Apply
                          </CustomButton>
                        </div>
                      </GlassCard>
                    </div>
                  )}
                </div>
                
                <Link href="/dashboard/agents/new">
                  <CustomButton variant="default" size="sm" className="flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    New Agent
                  </CustomButton>
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
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-3" />
              {error}
            </div>
          )}

          {!loading && !error && sortedProjects.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No agents found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? "Try adjusting your search or filter criteria." : "Get started by creating a new AI agent."}
              </p>
              {!searchQuery && (
                <Link href="/dashboard/agents/new">
                  <CustomButton variant="default">
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Agent
                  </CustomButton>
                </Link>
              )}
            </div>
          )}

          {!loading && !error && sortedProjects.length > 0 && (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative group"
                    >
                      <Link href={`/dashboard/bot/${project.id}`} className="block">
                        <GlassCard 
                          variant="agent" 
                          gradient 
                          glow 
                          color={project.color}
                          className="p-6 h-full flex flex-col justify-between hover:shadow-xl dark:hover:shadow-2xl"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3 flex-grow min-w-0">
                                <div className="p-2.5 bg-accent/10 backdrop-blur-md rounded-md shadow-inner">
                                  <Bot className={`w-6 h-6 ${project.color ? '' : 'text-accent'}`} style={{ color: project.color }} />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground truncate" title={project.name}>
                                  {project.name}
                                </h3>
                              </div>
                              {project.model_type && (
                                <span className="text-xs px-2 py-1 bg-accent/5 backdrop-blur-sm border border-accent/10 rounded-md font-medium text-accent dark:text-accent/90 ml-2 whitespace-nowrap">
                                  {project.model_type}
                                </span>
                              )}
                            </div>
                            {project.description && (
                              <p className="text-sm text-muted-foreground mb-5 line-clamp-2" title={project.description}>
                                {project.description}
                              </p>
                            )}
                            
                            {/* Tags - Modern Style */}
                            {project.tags && project.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-5">
                                {project.tags.slice(0, 3).map((tag, index) => (
                                  <span 
                                    key={index} 
                                    className="text-xs px-2 py-0.5 bg-background/50 backdrop-blur-sm border border-border/30 text-muted-foreground rounded-md truncate max-w-[120px]"
                                    title={tag}
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {project.tags.length > 3 && (
                                  <span className="text-xs px-2 py-0.5 bg-background/30 backdrop-blur-sm border border-border/20 text-muted-foreground rounded-md">
                                    +{project.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Usage Stats - Enhanced */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="flex flex-col gap-1 p-2 bg-background/40 backdrop-blur-sm rounded-md border border-border/20">
                                <span className="text-xs text-muted-foreground">Files</span>
                                <div className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-foreground/70" />
                                  <span className="text-sm font-medium">{project.stats?.file_count || 0}</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 p-2 bg-background/40 backdrop-blur-sm rounded-md border border-border/20">
                                <span className="text-xs text-muted-foreground">Chats</span>
                                <div className="flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-foreground/70" />
                                  <span className="text-sm font-medium">{project.stats?.session_count || 0}</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 p-2 bg-background/40 backdrop-blur-sm rounded-md border border-border/20">
                                <span className="text-xs text-muted-foreground">Created</span>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-foreground/70" />
                                  <span className="text-xs font-medium">
                                    {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto pt-4 border-t border-border/20">
                            <div className="flex items-center justify-between">
                              <Link 
                                href={`/dashboard/agents/${project.id}/knowledge`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 text-xs text-foreground/70 hover:text-accent py-1 px-2 rounded-md hover:bg-accent/5 transition-colors"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload Files</span>
                              </Link>
                              <div className="flex items-center gap-1">
                                <CustomButton
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    router.push(`/dashboard/agents/${project.id}/settings`);
                                  }}
                                  className="p-1.5 h-7 w-7 bg-background/40 border border-border/20"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                </CustomButton>
                                <CustomButton
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => handleDeleteProject(project.id, e)}
                                  disabled={deletingId === project.id}
                                  className="p-1.5 h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10 bg-background/40 border border-border/20"
                                >
                                  {deletingId === project.id ? <LoadingSpinner size="sm" /> : <Trash className="w-3.5 h-3.5" />}
                                </CustomButton>
                              </div>
                            </div>
                          </div>
                        </GlassCard>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative group"
                    >
                      <Link href={`/dashboard/bot/${project.id}`} className="block">
                        <GlassCard 
                          variant="agent" 
                          gradient 
                          glow 
                          color={project.color}
                          className="p-6 h-full flex flex-col justify-between hover:shadow-xl dark:hover:shadow-2xl"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3 flex-grow min-w-0">
                                <div className="p-2.5 bg-accent/10 backdrop-blur-md rounded-md shadow-inner">
                                  <Bot className={`w-6 h-6 ${project.color ? '' : 'text-accent'}`} style={{ color: project.color }} />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground truncate" title={project.name}>
                                  {project.name}
                                </h3>
                              </div>
                              {project.model_type && (
                                <span className="text-xs px-2 py-1 bg-accent/5 backdrop-blur-sm border border-accent/10 rounded-md font-medium text-accent dark:text-accent/90 ml-2 whitespace-nowrap">
                                  {project.model_type}
                                </span>
                              )}
                            </div>
                            {project.description && (
                              <p className="text-sm text-muted-foreground mb-5 line-clamp-2" title={project.description}>
                                {project.description}
                              </p>
                            )}
                            
                            {/* Tags - Modern Style */}
                            {project.tags && project.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-5">
                                {project.tags.slice(0, 3).map((tag, index) => (
                                  <span 
                                    key={index} 
                                    className="text-xs px-2 py-0.5 bg-background/50 backdrop-blur-sm border border-border/30 text-muted-foreground rounded-md truncate max-w-[120px]"
                                    title={tag}
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {project.tags.length > 3 && (
                                  <span className="text-xs px-2 py-0.5 bg-background/30 backdrop-blur-sm border border-border/20 text-muted-foreground rounded-md">
                                    +{project.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Usage Stats - Enhanced */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="flex flex-col gap-1 p-2 bg-background/40 backdrop-blur-sm rounded-md border border-border/20">
                                <span className="text-xs text-muted-foreground">Files</span>
                                <div className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-foreground/70" />
                                  <span className="text-sm font-medium">{project.stats?.file_count || 0}</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 p-2 bg-background/40 backdrop-blur-sm rounded-md border border-border/20">
                                <span className="text-xs text-muted-foreground">Chats</span>
                                <div className="flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-foreground/70" />
                                  <span className="text-sm font-medium">{project.stats?.session_count || 0}</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 p-2 bg-background/40 backdrop-blur-sm rounded-md border border-border/20">
                                <span className="text-xs text-muted-foreground">Created</span>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-foreground/70" />
                                  <span className="text-xs font-medium">
                                    {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto pt-4 border-t border-border/20">
                            <div className="flex items-center justify-between">
                              <Link 
                                href={`/dashboard/agents/${project.id}/knowledge`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 text-xs text-foreground/70 hover:text-accent py-1 px-2 rounded-md hover:bg-accent/5 transition-colors"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload Files</span>
                              </Link>
                              <div className="flex items-center gap-1">
                                <CustomButton
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    router.push(`/dashboard/agents/${project.id}/settings`);
                                  }}
                                  className="p-1.5 h-7 w-7 bg-background/40 border border-border/20"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                </CustomButton>
                                <CustomButton
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => handleDeleteProject(project.id, e)}
                                  disabled={deletingId === project.id}
                                  className="p-1.5 h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10 bg-background/40 border border-border/20"
                                >
                                  {deletingId === project.id ? <LoadingSpinner size="sm" /> : <Trash className="w-3.5 h-3.5" />}
                                </CustomButton>
                              </div>
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