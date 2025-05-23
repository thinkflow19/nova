import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { IconBrain, IconMessage, IconArrowLeft, IconSettings, IconLoader } from '@tabler/icons-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getProject, listChatSessions } from '@/utils/api';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Project, ChatSession } from '@/types/index';
import { useQuery } from '@tanstack/react-query';

export default function ProjectDetailsPage() {
  const router = useRouter();
  const { projectId } = router.query;
  const { user } = useAuth();
  
  // Fetch project details
  const {
    data: project,
    isLoading: loadingProject,
    error: projectError,
  } = useQuery(['project', projectId], () => getProject(projectId as string), { enabled: !!projectId && !!user });

  // Fetch recent sessions (limit 5)
  const {
    data: sessions = [],
    isLoading: loadingSessions,
    error: sessionsError,
  } = useQuery(['sessions', projectId, { limit: 5 }], () => listChatSessions(projectId as string), { enabled: !!projectId && !!user });
  
  const handleStartChat = () => {
    router.push(`/dashboard/bot/${projectId}`);
  };
  
  const handleSettings = () => {
    router.push(`/dashboard/agents/${projectId}/settings`);
  };
  
  const handleBack = () => {
    router.push('/dashboard/agents');
  };
  
  if (loadingProject) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (projectError || !project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <IconBrain size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Agent</h2>
          <p className="text-gray-500 mb-6">{projectError?.toString() || 'Agent not found'}</p>
          <Button onClick={handleBack} variant="outline" leftIcon={<IconArrowLeft size={16} />}>
            Back to Agents
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <Head>
        <title>{project.name} | Nova AI</title>
        <meta name="description" content={`Details for ${project.name}`} />
      </Head>
      
      <div className="max-w-6xl mx-auto">
        {/* Header with back button */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-text-muted hover:text-text-primary mb-4 transition-colors"
          >
            <IconArrowLeft size={16} className="mr-1" />
            <span>Back to Agents</span>
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-inner ${project.color ? '' : 'bg-theme-primary/10'}`} style={{ backgroundColor: project.color ? project.color+'20' : undefined }}>
                <IconBrain size={32} className={project.color ? 'opacity-80' : 'text-theme-primary'} style={{color: project.color || undefined}} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-primary">{project.name}</h1>
                <p className="text-text-muted">{project.description || 'No description provided'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <Button variant="outline" leftIcon={<IconSettings size={18} />} onClick={handleSettings}>
                Settings
              </Button>
              <Button leftIcon={<IconMessage size={18} />} onClick={handleStartChat}>
                Start Chat
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-theme-primary/10 flex items-center justify-center">
                <IconMessage size={24} className="text-theme-primary" />
              </div>
              <div>
                <p className="text-text-muted">Total Chats</p>
                <p className="text-2xl font-semibold text-text-primary">{project.stats?.session_count || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-theme-primary/10 flex items-center justify-center">
                <IconBrain size={24} className="text-theme-primary" />
              </div>
              <div>
                <p className="text-text-muted">Knowledge Documents</p>
                <p className="text-2xl font-semibold text-text-primary">{project.stats?.document_count || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-theme-primary/10 flex items-center justify-center">
                <IconLoader size={24} className="text-theme-primary" />
              </div>
              <div>
                <p className="text-text-muted">Created</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent chats */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Recent Chats</h2>
          {loadingSessions ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : sessionsError ? (
            <div className="text-center text-red-500 py-8">Failed to load recent chats.</div>
          ) : sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.slice(0, 5).map((session: ChatSession) => (
                <div key={session.id} className="card flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-medium">{session.title || 'Untitled Chat'}</h3>
                    <p className="text-sm text-text-muted">
                      {session.created_at ? new Date(session.created_at).toLocaleDateString() : 'N/A'}
                      {session.message_count != null ? ` · ${session.message_count} messages` : ''}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/bot/${projectId}?session=${session.id}`)}
                  >
                    Continue
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-text-muted mb-4">No chat sessions yet</p>
              <Button onClick={handleStartChat}>Start your first chat</Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 