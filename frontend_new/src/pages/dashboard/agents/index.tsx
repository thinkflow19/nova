import { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Bot, MessageSquare, Settings, Trash, AlertCircle, Search, Calendar, RefreshCw, Filter, Grid, List, FileText } from 'lucide-react';
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
  
  // Memoize loadProjects to prevent unnecessary function recreations
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching projects...');
      const projectsData = await API.listProjects();
      console.log('Projects response:', projectsData);
      
      // Add defensive coding to handle different response formats
      let projectsList: Project[] = [];
      if (Array.isArray(projectsData)) {
        projectsList = projectsData;
      } else if (projectsData && typeof projectsData === 'object') {
        // Handle ApiResponse format
        if (Array.isArray(projectsData.items)) {
          projectsList = projectsData.items;
        } else if (projectsData.data && Array.isArray(projectsData.data)) {
          projectsList = projectsData.data;
        }
      }
      
      console.log('Processed projects list:', projectsList);
      setProjects(projectsList);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load your agents. Please try again.');
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
                  <CustomButton variant="premium" className="whitespace-nowrap">
                    <Plus className="w-5 h-5 mr-2" />
                    New Agent
                  </CustomButton>
                </Link>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="bg-destructive/10 border border-destructive text-foreground rounded-lg p-4 mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p>{error}</p>
                <CustomButton
                  onClick={loadProjects}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Try Again
                </CustomButton>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : projects.length === 0 ? (
            <GlassCard gradient className="p-12 text-center">
              <div className="flex flex-col items-center">
                <Bot className="w-16 h-16 text-accent/50 mb-4" />
                <h2 className="text-xl font-bold mb-2">No Agents Yet</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Create your first AI agent to start building intelligent solutions that can chat with your data.
                </p>
                <Link href="/dashboard/agents/new">
                  <CustomButton variant="premium" size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Agent
                  </CustomButton>
                </Link>
              </div>
            </GlassCard>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {sortedProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: Math.min(index * 0.08, 0.5),
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    y: -5,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
                  }}
                  layoutId={`project-${project.id}`}
                  className="rounded-lg overflow-hidden"
                >
                  <Link href={`/dashboard/bot/${project.id}`}>
                    <GlassCard className="h-full overflow-hidden hover:shadow-xl transition-all duration-500 group">
                      <div className="p-6 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: project.color || '#8B5CF6' }}
                          >
                            <span className="text-white text-xl">
                              <Bot className="w-6 h-6" />
                            </span>
                          </div>
                          
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => handleDeleteProject(project.id, e)}
                              className={`p-2.5 rounded-full hover:bg-card-foreground/10 ${deleteConfirm === project.id ? 'text-destructive' : 'text-muted-foreground'} transition-colors`}
                              disabled={deletingId === project.id}
                            >
                              {deletingId === project.id ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                              ) : (
                                <Trash className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-medium mb-2 group-hover:text-accent transition-colors">{project.name}</h3>
                        
                        {project.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.tags.map((tag, i) => (
                              <span 
                                key={`${project.id}-tag-${i}`}
                                className="text-xs bg-white/5 backdrop-blur-sm rounded-full px-2 py-1"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-auto pt-4 flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>
                              {project.created_at 
                                ? new Date(project.created_at).toLocaleDateString()
                                : 'Unknown date'}
                            </span>
                          </div>
                          
                          <div>
                            <span className="flex items-center">
                              <FileText className="w-4 h-4 mr-1" />
                              <span>{project.stats?.document_count || 0} docs</span>
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <CustomButton 
                            onClick={(e) => {
                              e.preventDefault();
                              router.push(`/dashboard/bot/${project.id}/knowledge`);
                            }}
                            variant="outline" 
                            className="transition-colors py-2.5"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">Knowledge</span>
                          </CustomButton>
                          
                          <CustomButton 
                            onClick={(e) => {
                              e.preventDefault();
                              router.push(`/dashboard/bot/${project.id}`);
                            }}
                            variant="outline" 
                            className="transition-colors py-2.5"
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">Configure</span>
                          </CustomButton>
                          
                          <CustomButton 
                            onClick={(e) => {
                              e.preventDefault();
                              router.push(`/dashboard/bot/${project.id}`);
                            }}
                            variant="premium" 
                            className="py-2.5"
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">Chat</span>
                          </CustomButton>
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <GlassCard className="overflow-hidden">
              <div className="divide-y divide-border">
                <div className="px-6 py-3 bg-card-foreground/5 text-sm font-medium grid grid-cols-12">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-3 hidden md:block">Created</div>
                  <div className="col-span-2 hidden md:block">Messages</div>
                  <div className="col-span-4 md:col-span-2">Actions</div>
                </div>
                
                {sortedProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    className="hover:bg-card-foreground/5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.3) }}
                    layoutId={`project-list-${project.id}`}
                  >
                    <div className="px-6 py-4 grid grid-cols-12 items-center">
                      <div className="col-span-5 flex items-center">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-3"
                          style={{ backgroundColor: project.color || '#8B5CF6' }}
                        >
                          <span className="text-white">
                            <Bot className="w-5 h-5" />
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium">{project.name}</h3>
                          {project.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="col-span-3 text-sm text-muted-foreground hidden md:block">
                        {project.created_at 
                          ? new Date(project.created_at).toLocaleDateString()
                          : 'Unknown date'}
                      </div>
                      
                      <div className="col-span-2 text-sm text-muted-foreground hidden md:block">
                        {project.stats?.message_count || 0} messages
                      </div>
                      
                      <div className="col-span-4 md:col-span-2 flex items-center gap-2 justify-end">
                        <Link href={`/dashboard/bot/${project.id}`}>
                          <CustomButton variant="outline" size="sm" className="px-3 py-2">
                            <Settings className="w-5 h-5 mr-2" />
                            <span className="text-sm">Edit</span>
                          </CustomButton>
                        </Link>
                        
                        <Link href={`/dashboard/chat?project=${project.id}`}>
                          <CustomButton variant="premium" size="sm" className="px-3 py-2">
                            <MessageSquare className="w-5 h-5 mr-2" />
                            <span className="text-sm">Chat</span>
                          </CustomButton>
                        </Link>
                        
                        <button
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className={`p-2.5 rounded-full hover:bg-card-foreground/10 ${deleteConfirm === project.id ? 'text-destructive' : 'text-muted-foreground'}`}
                          disabled={deletingId === project.id}
                        >
                          {deletingId === project.id ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 