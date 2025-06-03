'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';
import { Button, Card, Loading } from '@/components/ui';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ChatInterface } from '@/components/chat';
import api from '@/lib/api';
import { Project, ChatSession } from '@/types';

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // Handle authentication redirect only after auth is fully loaded
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    // Load projects immediately when authenticated
    loadProjects();
  }, [isAuthenticated, router]);

  // Handle project selection from URL
  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
        createSession(project);
      }
    }
  }, [searchParams, projects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.projects.getProjects();
      
      // Backend returns array directly, not nested in data property
      const projectsData = Array.isArray(response) ? response : response?.data || [];
      setProjects(projectsData);
      
      // Auto-select first project if available
      if (projectsData.length > 0 && !currentProject) {
        setCurrentProject(projectsData[0]);
        await createSession(projectsData[0]);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects. Please try again.');
      // Ensure projects is still an array on error
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (project: Project) => {
    try {
      const session = await api.chat.createSession({
        project_id: project.id,
        title: 'New Chat Session'
      });
      setCurrentSession(session);
    } catch (err) {
      console.error('Failed to create session:', err);
      setError('Failed to create session. Please try again.');
    }
  };

  const handleCreateProject = async () => {
    try {
      // Create project data that matches backend schema exactly
      const projectData = {
        name: `Project ${(projects || []).length + 1}`,
        description: 'A new AI project',
        is_public: false,
        icon: '🚀', // Simple emoji string, not URL
        color: '#3b82f6',
        ai_config: {}, // Required empty object
        memory_type: 'default', // Required default value
        tags: ['ai', 'chat']
      };

      console.log('Creating project with data:', projectData);
      
      const newProject = await api.projects.createProject(projectData);
      
      setProjects(prev => [newProject, ...(prev || [])]);
      setCurrentProject(newProject);
      setShowNewProjectModal(false);
    } catch (err) {
      console.error('Failed to create project:', err);
      
      // Enhanced error logging for debugging
      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          stack: err.stack
        });
      }
      
      // Try to extract more detailed error info from response
      if ((err as any)?.response) {
        const response = (err as any).response;
        console.error('API Response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
      }
      
      setError('Failed to create project. Please check the console for details.');
    }
  };

  const handleProjectSelect = async (project: Project) => {
    setCurrentProject(project);
    setCurrentSession(null);
    await createSession(project);
  };

  const handleProjectDelete = async (projectId: string) => {
    try {
      await api.projects.deleteProject(projectId);
      setProjects(prev => (prev || []).filter(p => p.id !== projectId));
      
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
        setCurrentSession(null);
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
      setError('Failed to delete project. Please try again.');
    }
  };

  const handleMessageSent = useCallback((message: any) => {
    console.log('Message sent:', message);
  }, []);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

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
      <div className="h-full flex">
        {/* Projects Sidebar */}
        <div className="w-80 border-r border-[var(--border-secondary)] bg-[var(--bg-secondary)] p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading-lg text-[var(--text-primary)]">
              Projects
            </h2>
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleCreateProject}
            >
              + New
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
                  </div>
          )}

          <div className="space-y-3">
            {(projects || []).map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectSelect(project)}
                onDelete={handleProjectDelete}
                className={`
                  cursor-pointer transition-all duration-200
                  ${currentProject?.id === project.id ? 'ring-2 ring-[var(--accent-electric)]' : ''}
                  animate-fade-in-up stagger-${Math.min(index + 1, 6)}
                `}
              />
            ))}
            
            {(!projects || projects.length === 0) && (
              <Card variant="glass" className="text-center p-6">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-heading-md text-[var(--text-primary)] mb-2">
                  No Projects Yet
                </h3>
                <p className="text-body-sm text-[var(--text-secondary)] mb-4">
                  Create your first AI project to get started
                </p>
                <Button
                  variant="primary"
                  onClick={handleCreateProject}
                >
                  Create Project
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {currentProject && currentSession ? (
            <ChatInterface
              projectId={currentProject.id}
              sessionId={currentSession.id}
              height="100%"
              onMessageSent={handleMessageSent}
            />
          ) : currentProject ? (
            <div className="flex-1 flex items-center justify-center">
              <Loading size="lg" text="Setting up chat session..." variant="neural" />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card variant="glass" className="text-center p-8 max-w-md">
                <div className="text-6xl mb-6 animate-float">💬</div>
                <h2 className="text-heading-xl text-[var(--text-primary)] mb-4">
                  Select a Project
                </h2>
                <p className="text-body-md text-[var(--text-secondary)] mb-6">
                  Choose a project from the sidebar to start chatting with AI
                </p>
                <Button
                  variant="primary"
                  onClick={handleCreateProject}
                >
                  Create Your First Project
                </Button>
                </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage; 