import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileText, Upload, Trash, AlertCircle, RefreshCw, Search, Filter, MoreHorizontal } from 'lucide-react';
import DashboardLayout from '../../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../../contexts/AuthContext';
import { API } from '../../../../utils/api';
import CustomButton from '../../../../components/ui/CustomButton';
import GlassCard from '../../../../components/ui/GlassCard';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import type { Project, Document, ApiResponse } from '../../../../types';

export default function KnowledgeBase() {
  const router = useRouter();
  const { projectId } = router.query;
  const { user, loading: authLoading } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId || !user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Loading project data for ID:', projectId);
        const projectData = await API.getProject(projectId as string);
        console.log('Project data loaded:', projectData);
        setProject(projectData);
        document.title = `${projectData.name} Knowledge | Nova AI`;
      } catch (err) {
        console.error('Failed to load project:', err);
        setError(`Failed to load agent data. ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProject();
  }, [projectId, user]);
  
  // Load documents
  const loadDocuments = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading documents for project:', projectId);
      const docsResponse = await API.listDocuments(projectId as string);
      console.log('Documents response:', docsResponse);
      
      // Handle different response formats
      let docsData: Document[] = [];
      if (Array.isArray(docsResponse)) {
        docsData = docsResponse;
      } else if (docsResponse && typeof docsResponse === 'object') {
        const typedResponse = docsResponse as Record<string, unknown>;
        if ('items' in typedResponse && Array.isArray(typedResponse.items)) {
          docsData = typedResponse.items;
        } else if ('data' in typedResponse && Array.isArray(typedResponse.data)) {
          docsData = typedResponse.data;
        }
      }
      
      console.log('Processed documents:', docsData);
      setDocuments(docsData);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError(`Failed to load documents. ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);
  
  // Load documents when project id changes
  useEffect(() => {
    if (projectId) {
      loadDocuments();
    }
  }, [projectId, loadDocuments]);
  
  // Filter documents by search query
  const filteredDocuments = documents.filter(doc => 
    doc.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !projectId) return;
    
    const file = e.target.files[0];
    
    try {
      setIsUploading(true);
      setError(null);
      
      console.log('Uploading file:', file.name);
      const uploadedDoc = await API.uploadDocument(projectId as string, file);
      console.log('Upload response:', uploadedDoc);
      
      // Add the new document to the list
      setDocuments(prev => [uploadedDoc, ...prev]);
      
      // Reset the file input
      e.target.value = '';
    } catch (err) {
      console.error('Failed to upload document:', err);
      setError(`Failed to upload document. ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle document deletion
  const handleDeleteDocument = async (docId: string) => {
    if (deleteConfirm !== docId) {
      setDeleteConfirm(docId);
      return;
    }
    
    try {
      setDeletingId(docId);
      console.log('Deleting document:', docId);
      await API.deleteDocument(docId);
      
      // Remove document from the list
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
      setError(`Failed to delete document. ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };
  
  if (authLoading) return null; // DashboardLayout handles loading state
  
  return (
    <DashboardLayout>
      <Head>
        <title>{project ? `${project.name} Knowledge` : 'Knowledge Base'} | Nova AI</title>
        <meta name="description" content="Manage your AI agent's knowledge documents" />
      </Head>
      
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link 
              href={`/dashboard/bot/${projectId}`} 
              className="text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Agent</span>
            </Link>
            
            <div className="h-5 w-px bg-white/10"></div>
            
            <h1 className="text-2xl font-bold premium-text-gradient">Knowledge Base</h1>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-grow md:flex-grow-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-premium pl-10 w-full md:w-60"
              />
            </div>
            
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.txt,.doc,.docx,.csv,.md"
              />
              <label htmlFor="file-upload">
                <CustomButton
                  variant="premium"
                  disabled={isUploading}
                  className="flex items-center whitespace-nowrap"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Document
                    </>
                  )}
                </CustomButton>
              </label>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive text-foreground rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p>{error}</p>
              <CustomButton
                onClick={loadDocuments}
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
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : documents.length === 0 ? (
          <GlassCard gradient className="p-12 text-center">
            <div className="flex flex-col items-center">
              <FileText className="w-16 h-16 text-accent/50 mb-4" />
              <h2 className="text-xl font-bold mb-2">No Documents Yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Upload documents to train your AI agent. Supported formats include PDF, TXT, DOC, DOCX, CSV, and Markdown.
              </p>
              <label htmlFor="file-upload">
                <CustomButton variant="premium" size="lg">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Your First Document
                </CustomButton>
              </label>
            </div>
          </GlassCard>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredDocuments.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
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
                  className="rounded-lg overflow-hidden"
                >
                  <GlassCard className="h-full hover:shadow-xl transition-all duration-500">
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-accent/10">
                          <FileText className="w-6 h-6 text-accent" />
                        </div>
                        
                        <div>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className={`p-2.5 rounded-full hover:bg-card-foreground/10 ${deleteConfirm === doc.id ? 'text-destructive' : 'text-muted-foreground'}`}
                            disabled={deletingId === doc.id}
                          >
                            {deletingId === doc.id ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-medium mb-2 text-accent line-clamp-1">{doc.filename || 'Untitled Document'}</h3>
                      
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {doc.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-xs bg-white/5 rounded-full px-2 py-1 border border-white/10">
                          {doc.content_type?.split('/')[1]?.toUpperCase() || 'DOCUMENT'}
                        </span>
                        
                        {doc.status && (
                          <span className={`text-xs rounded-full px-2 py-1 ${
                            doc.status === 'processed' ? 'bg-emerald-500/20 text-emerald-300' : 
                            doc.status === 'processing' ? 'bg-amber-500/20 text-amber-300' : 
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {doc.status.toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-xs text-muted-foreground">
                        <span>
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown date'}
                        </span>
                        
                        <span className="flex items-center">
                          {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 