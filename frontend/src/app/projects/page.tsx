'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';
import { Button, Card, Input, Loading } from '@/components/ui';
import { ProjectCard } from '@/components/projects/ProjectCard';
import api from '@/lib/api';
import { Project } from '@/types';

const ProjectsPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');

  // Handle authentication redirect
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    // Load projects immediately when authenticated
    loadProjects();
  }, [isAuthenticated, router]);

  // Filter projects based on search and tag filter
  useEffect(() => {
    let filtered = projects;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by tag
    if (filterTag !== 'all') {
      filtered = filtered.filter(project =>
        project.tags?.includes(filterTag)
      );
    }

    setFilteredProjects(filtered);
  }, [projects, searchQuery, filterTag]);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.projects.getProjects();
      // Backend returns array directly, not nested in data property
      const projectsData = Array.isArray(response) ? response : response?.data || [];
      setProjects(projectsData);
      setFilteredProjects(projectsData);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects. Please try again.');
      setProjects([]);
      setFilteredProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const projectData = {
        name: `Project ${projects.length + 1}`,
        description: 'A new AI project',
        is_public: false,
        icon: '🚀',
        color: '#3b82f6',
        ai_config: {},
        memory_type: 'default',
        tags: ['ai', 'new']
      };

      const newProject = await api.projects.createProject(projectData);
      setProjects(prev => [newProject, ...prev]);
      setFilteredProjects(prev => [newProject, ...prev]);
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('Failed to create project. Please try again.');
    }
  };

  const handleProjectSelect = (project: Project) => {
    // Navigate to dashboard with the selected project
    router.push(`/dashboard?project=${project.id}`);
  };

  const handleProjectDelete = async (projectId: string) => {
    try {
      await api.projects.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setFilteredProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      console.error('Failed to delete project:', err);
      setError('Failed to delete project. Please try again.');
    }
  };

  // Get unique tags for filter dropdown
  const allTags = Array.from(new Set(projects.flatMap(p => p.tags || [])));

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loading size="lg" text="Loading your projects..." variant="neural" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Projects</h1>
          <p className="text-[var(--text-secondary)]">
            {projects.length} project{projects.length !== 1 ? 's' : ''} total
          </p>
        </div>

        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-electric)]"
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            
            <Button 
              variant="primary" 
              onClick={handleCreateProject}
            >
              + New Project
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectSelect(project)}
                onDelete={handleProjectDelete}
                className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
              />
            ))}
          </div>
        ) : (
          <Card variant="glass" className="text-center p-12">
            <div className="text-6xl mb-6 animate-float">📁</div>
            <h2 className="text-heading-xl text-[var(--text-primary)] mb-4">
              {searchQuery || filterTag !== 'all' ? 'No Projects Found' : 'No Projects Yet'}
            </h2>
            <p className="text-body-md text-[var(--text-secondary)] mb-6">
              {searchQuery || filterTag !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first AI project to get started'
              }
            </p>
            {(!searchQuery && filterTag === 'all') && (
              <Button
                variant="primary"
                onClick={handleCreateProject}
              >
                Create Your First Project
              </Button>
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ProjectsPage; 