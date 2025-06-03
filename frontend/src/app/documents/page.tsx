'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';
import { Button, Card, Input, Loading } from '@/components/ui';
import api from '@/lib/api';
import { Project } from '@/types';

interface Document {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  project_id?: string;
  status: 'processing' | 'indexed' | 'failed';
  processing_error?: string;
  storage_path: string;
  chunk_count: number;
}

const DocumentsPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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

  // Load documents when project is selected
  useEffect(() => {
    if (selectedProject) {
      loadDocuments();
    }
  }, [selectedProject]);

  // Filter documents based on search and filters
  useEffect(() => {
    let filtered = documents;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => doc.file_type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(doc => doc.status === filterStatus);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchQuery, filterType, filterStatus]);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const loadProjects = async () => {
    try {
      setError(null);
      const response = await api.projects.getProjects();
      // Backend returns array directly, not nested in data property
      const projectsData = Array.isArray(response) ? response : response?.data || [];
      setProjects(projectsData);
      
      // Auto-select first project if available
      if (projectsData.length > 0 && !selectedProject) {
        setSelectedProject(projectsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects. Please try again.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      setError(null);
      const documentsData = await api.documents.listDocuments(selectedProject);
      setDocuments(documentsData || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents. Please try again.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedProject) {
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File size must be less than 50MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload file directly using the upload-complete endpoint
      const result = await api.documents.uploadComplete(file, selectedProject, file.name);
      
      // Refresh documents list
      await loadDocuments();
      
      // Reset file input
      event.target.value = '';
    } catch (err) {
      console.error('Upload failed:', err);
      setError(`Failed to upload file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await api.documents.deleteDocument(documentId);
      setDocuments(prev => prev.filter(d => d.id !== documentId));
    } catch (err) {
      console.error('Failed to delete document:', err);
      setError('Failed to delete document. Please try again.');
    }
  };

  const getStatusBadge = (status: Document['status']) => {
    const badges = {
      indexed: { text: 'Ready', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      processing: { text: 'Processing', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      failed: { text: 'Error', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
    };
    return badges[status];
  };

  const getFileIcon = (type: string) => {
    const icons: Record<string, string> = {
      'application/pdf': '📄',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
      'text/plain': '📃',
      'text/markdown': '📋',
      'application/json': '🗂️',
      'text/csv': '📊',
      default: '📁'
    };
    return icons[type] || icons.default;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get unique types for filter
  const types = Array.from(new Set(documents.map(doc => doc.file_type).filter(Boolean)));

  if (loading && !selectedProject) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loading size="lg" text="Loading your projects..." variant="neural" />
        </div>
      </AppLayout>
    );
  }

  if (projects.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Card variant="glass" className="text-center p-8 max-w-md">
            <div className="text-6xl mb-6 animate-float">📁</div>
            <h2 className="text-heading-xl text-[var(--text-primary)] mb-4">
              No Projects Found
            </h2>
            <p className="text-body-md text-[var(--text-secondary)] mb-6">
              Create a project first to start uploading documents
            </p>
            <Button
              variant="primary"
              onClick={() => router.push('/projects')}
            >
              Create Project
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Knowledge Base</h1>
          <p className="text-[var(--text-secondary)]">
            Manage your documents and knowledge
          </p>
        </div>

        {/* Project Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Select Project
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-electric)]"
          >
            <option value="">Select a project...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.icon} {project.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProject && (
          <>
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1">
                <Input
                  placeholder="Search documents by name..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-3">
                {types.length > 0 && (
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-electric)]"
                  >
                    <option value="all">All Types</option>
                    {types.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                )}
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-electric)]"
                >
                  <option value="all">All Status</option>
                  <option value="indexed">Ready</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Error</option>
                </select>
                
                <div className="relative">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.txt,.md,.csv,.json"
                    disabled={uploading}
                  />
                  <Button 
                    variant="primary" 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    loading={uploading}
                    disabled={uploading || !selectedProject}
                  >
                    {uploading ? 'Uploading...' : '+ Upload'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loading size="lg" text="Loading documents..." variant="neural" />
              </div>
            ) : (
              <>
                {/* Documents List */}
                {filteredDocuments.length > 0 ? (
                  <div className="space-y-4">
                    {filteredDocuments.map((document, index) => {
                      const statusBadge = getStatusBadge(document.status);
                      
                      return (
                        <Card 
                          key={document.id}
                          variant="glass" 
                          hover
                          className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
                        >
                          <div className="p-6">
                            <div className="flex items-center justify-between">
                              {/* File Info */}
                              <div className="flex items-center gap-4">
                                <div className="text-3xl">
                                  {getFileIcon(document.file_type)}
                                </div>
                                
                                <div className="flex-1">
                                  <h3 className="text-heading-md text-[var(--text-primary)] mb-1">
                                    {document.name}
                                  </h3>
                                  
                                  <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                                    <span>{document.file_type}</span>
                                    <span>{formatFileSize(document.file_size)}</span>
                                    <span>Uploaded {formatDate(document.created_at)}</span>
                                    {document.chunk_count > 0 && (
                                      <span className="px-2 py-1 bg-[var(--bg-tertiary)] rounded-md">
                                        {document.chunk_count} chunks
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Error Message */}
                                  {document.status === 'failed' && document.processing_error && (
                                    <div className="mt-2 text-xs text-red-400">
                                      Error: {document.processing_error}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Status & Actions */}
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-md text-xs border ${statusBadge.color}`}>
                                  {statusBadge.text}
                                </span>
                                
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteDocument(document.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card variant="glass" className="text-center p-12">
                    <div className="text-6xl mb-6 animate-float">📚</div>
                    <h2 className="text-heading-xl text-[var(--text-primary)] mb-4">
                      {searchQuery || filterType !== 'all' || filterStatus !== 'all' ? 'No Documents Found' : 'No Documents Yet'}
                    </h2>
                    <p className="text-body-md text-[var(--text-secondary)] mb-6">
                      {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                        ? 'Try adjusting your search or filter criteria'
                        : 'Upload your first document to build your knowledge base'
                      }
                    </p>
                    {(!searchQuery && filterType === 'all' && filterStatus === 'all') && (
                      <Button
                        variant="primary"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        Upload Your First Document
                      </Button>
                    )}
                  </Card>
                )}
              </>
            )}
          </>
        )}

        {!selectedProject && (
          <Card variant="glass" className="text-center p-12">
            <div className="text-6xl mb-6 animate-float">📁</div>
            <h2 className="text-heading-xl text-[var(--text-primary)] mb-4">
              Select a Project
            </h2>
            <p className="text-body-md text-[var(--text-secondary)]">
              Choose a project above to view and manage documents
            </p>
          </Card>
        )}

        {/* Knowledge Base Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="glass" className="p-6 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-heading-lg text-[var(--text-primary)] mb-2">
              AI Search
            </h3>
            <p className="text-body-sm text-[var(--text-secondary)]">
              Find information across all your documents with intelligent semantic search
            </p>
          </Card>
          
          <Card variant="glass" className="p-6 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-heading-lg text-[var(--text-primary)] mb-2">
              Auto Insights
            </h3>
            <p className="text-body-sm text-[var(--text-secondary)]">
              Automatically extract key insights and summaries from your documents
            </p>
          </Card>
          
          <Card variant="glass" className="p-6 text-center">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-heading-lg text-[var(--text-primary)] mb-2">
              Smart Connections
            </h3>
            <p className="text-body-sm text-[var(--text-secondary)]">
              Discover relationships and connections between different documents
            </p>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default DocumentsPage; 