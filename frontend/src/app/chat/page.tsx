'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';
import { ChatInterface } from '@/components/chat';
import { Button, Card, Loading } from '@/components/ui';
import api from '@/lib/api';
import { Project, ChatSession } from '@/types';

const ChatPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle authentication redirect
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    // Load projects immediately when authenticated
    loadProjects();
  }, [isAuthenticated, router]);

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
      
      // Auto-select first project if available
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0]);
        await createSession(projectsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects. Please try again.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (projectId: string) => {
    try {
      const session = await api.chat.createSession({
        project_id: projectId,
        title: 'AI Chat Session'
      });
      setCurrentSession(session);
    } catch (err) {
      console.error('Failed to create session:', err);
      setError('Failed to start chat session. Please try again.');
    }
  };

  const handleProjectChange = async (project: Project) => {
    setSelectedProject(project);
    setCurrentSession(null);
    await createSession(project.id);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loading size="lg" text="Loading chat interface..." variant="neural" />
        </div>
      </AppLayout>
    );
  }

  if (projects.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Card variant="glass" className="text-center p-8 max-w-md">
            <div className="text-6xl mb-6 animate-float">🤖</div>
            <h2 className="text-heading-xl text-[var(--text-primary)] mb-4">
              No Projects Found
            </h2>
            <p className="text-body-md text-[var(--text-secondary)] mb-6">
              Create your first project to start chatting with AI
            </p>
            <Button
              variant="primary"
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Project Selector */}
        <div className="border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)] p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Project:
            </label>
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = projects.find(p => p.id === e.target.value);
                if (project) handleProjectChange(project);
              }}
              className="bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-electric)]"
            >
              <option value="">Select a project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.icon} {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Chat Interface */}
        <div className="flex-1">
          {selectedProject && currentSession ? (
            <ChatInterface
              projectId={selectedProject.id}
              sessionId={currentSession.id}
              height="100%"
              onMessageSent={(message) => {
                console.log('Message sent:', message);
              }}
            />
          ) : selectedProject ? (
            <div className="flex items-center justify-center h-full">
              <Loading size="lg" text="Starting chat session..." variant="neural" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Card variant="glass" className="text-center p-8 max-w-md">
                <div className="text-6xl mb-6 animate-float">💬</div>
                <h2 className="text-heading-xl text-[var(--text-primary)] mb-4">
                  Ready to Chat
                </h2>
                <p className="text-body-md text-[var(--text-secondary)]">
                  Select a project above to start your AI conversation
                </p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ChatPage; 