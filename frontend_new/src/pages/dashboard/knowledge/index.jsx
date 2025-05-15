import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  Search, 
  Upload, 
  Trash, 
  RefreshCw, 
  AlertCircle, 
  ChevronDown, 
  Filter,
  Download,
  FileUp,
  X,
  Check
} from 'lucide-react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { API } from '../../../utils/api';
import Button from '../../../components/ui/Button';
import GlassCard from '../../../components/ui/GlassCard';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

export default function KnowledgeBase() {
  const { user, loading: authLoading } = useAuth({ redirectTo: '/login' });
  
  // State for projects
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  
  // State for documents
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  
  // UI state
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Deletion state
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  // Load projects when component mounts
  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);
  
  // Load documents when selected project changes
  useEffect(() => {
    if (selectedProject) {
      loadDocuments(selectedProject.id);
    }
  }, [selectedProject]);
  
  // Clear success message after 3 seconds
  useEffect(() => {
    if (uploadSuccess) {
      const timer = setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess]);
  
  const loadProjects = async () => {
    try {
      setProjectsLoading(true);
      setError(null);
      
      const projectsData = await API.listProjects();
      const projectsList = projectsData.items || projectsData;
      setProjects(projectsList);
      
      // Select first project by default if available
      if (projectsList.length > 0 && !selectedProject) {
        setSelectedProject(projectsList[0]);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load your projects. Please try again.');
    } finally {
      setProjectsLoading(false);
    }
  };
  
  const loadDocuments = async (projectId) => {
    if (!projectId) return;
    
    try {
      setDocumentsLoading(true);
      setError(null);
      
      console.log('Attempting to load documents for project:', projectId);
      
      try {
        const docsData = await API.listDocuments(projectId);
        
        console.log('Documents data received:', docsData);
        
        if (Array.isArray(docsData)) {
          setDocuments(docsData);
        } else if (docsData && Array.isArray(docsData.items)) {
          setDocuments(docsData.items);
        } else if (docsData && Array.isArray(docsData.data)) {
          setDocuments(docsData.data);
        } else {
          console.warn('Unexpected document data format:', docsData);
          setDocuments([]);
        }
      } catch (apiError) {
        console.error(`Error loading documents for project ${projectId}:`, apiError);
        
        // Check if it's a 404 error (not found)
        if (apiError.status === 404) {
          setError('Document storage is not yet available for this project. Please contact support or try again later.');
        } else {
          setError('Failed to load documents. Please check your connection and try again.');
        }
        
        setDocuments([]);
      }
    } finally {
      setDocumentsLoading(false);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadingFile(file);
      setDocumentName(file.name.split('.')[0]); // Set default name to filename without extension
    }
  };
  
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadingFile || !selectedProject) {
      setUploadError('Please select a file and project');
      return;
    }
    
    if (!documentName.trim()) {
      setUploadError('Please provide a document name');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);
      
      // Use the direct upload method instead of the multi-step process
      const metadata = {
        name: documentName,
        description: documentDescription
      };
      
      // Show file upload progress
      const uploadProgressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + 5, 95);
          return newProgress;
        });
      }, 300);
      
      try {
        await API.uploadDocument(selectedProject.id, uploadingFile, metadata);
        
        clearInterval(uploadProgressInterval);
        setUploadProgress(100);
        
        // Refresh document list
        await loadDocuments(selectedProject.id);
        
        // Reset form
        setUploadingFile(null);
        setDocumentName('');
        setDocumentDescription('');
        setUploadProgress(0);
        setUploadSuccess(true);
        setShowUploadModal(false);
      } catch (apiError) {
        clearInterval(uploadProgressInterval);
        setUploadProgress(0);
        
        console.error('Error uploading document:', apiError);
        
        // Check for specific error types
        if (apiError.status === 404) {
          setUploadError('Document upload feature is not available yet. This feature is coming soon.');
        } else {
          setUploadError(apiError.message || 'Upload failed. Please try again.');
        }
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteDocument = async (documentId) => {
    if (deleteConfirm !== documentId) {
      setDeleteConfirm(documentId);
      return;
    }
    
    try {
      setDeletingId(documentId);
      await API.deleteDocument(documentId);
      
      // Remove from list
      setDocuments(documents.filter(d => d.id !== documentId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };
  
  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  function getFileIcon(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="text-red-400" />;
      case 'doc':
      case 'docx':
        return <FileText className="text-blue-400" />;
      case 'txt':
        return <FileText className="text-gray-400" />;
      case 'csv':
      case 'xls':
      case 'xlsx':
        return <FileText className="text-green-400" />;
      default:
        return <FileText className="text-accent" />;
    }
  }
  
  if (authLoading) return null; // DashboardLayout handles loading state
  
  return (
    <DashboardLayout>
      <Head>
        <title>Knowledge Base | Nova AI</title>
        <meta name="description" content="Manage your knowledge documents" />
      </Head>
      
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold premium-text-gradient">Knowledge Base</h1>
              <p className="text-muted-foreground mt-1">
                Manage documents that power your AI agents
              </p>
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-premium pl-9 w-full md:w-60"
                />
              </div>
              
              <Button 
                variant="premium" 
                className="whitespace-nowrap"
                onClick={() => setShowUploadModal(true)}
                disabled={!selectedProject}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>
          
          {/* Project selector */}
          <div className="mb-6">
            <div className="relative">
              <Button
                variant="outline"
                className="w-full md:w-auto flex items-center justify-between"
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              >
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  {selectedProject ? selectedProject.name : 'Select a project'}
                </span>
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              
              {showProjectDropdown && (
                <div className="absolute z-10 mt-2 w-full md:w-64 rounded-md shadow-lg">
                  <GlassCard className="p-1 max-h-64 overflow-y-auto">
                    {projectsLoading ? (
                      <div className="flex justify-center py-4">
                        <LoadingSpinner />
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">No projects found</p>
                        <Link href="/dashboard/agents/new">
                          <Button variant="link" className="mt-2 text-xs" size="sm">
                            Create your first project
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="py-1">
                        {projects.map((project) => (
                          <button
                            key={project.id}
                            className={`w-full text-left px-4 py-2 text-sm rounded-md hover:bg-card-foreground/10 ${
                              selectedProject?.id === project.id ? 'bg-accent/10 text-accent' : ''
                            }`}
                            onClick={() => {
                              setSelectedProject(project);
                              setShowProjectDropdown(false);
                            }}
                          >
                            {project.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="bg-destructive/10 border border-destructive text-foreground rounded-lg p-4 mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p>{error}</p>
                <Button
                  onClick={() => selectedProject && loadDocuments(selectedProject.id)}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {uploadSuccess && (
            <div className="bg-green-500/10 border border-green-500 text-foreground rounded-lg p-4 mb-6 flex items-start">
              <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <p>Document uploaded successfully!</p>
            </div>
          )}
          
          {/* Document list */}
          {!selectedProject ? (
            <GlassCard gradient className="p-12 text-center">
              <div className="flex flex-col items-center">
                <FileText className="w-16 h-16 text-accent/50 mb-4" />
                <h2 className="text-xl font-bold mb-2">Select a Project</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Please select a project to view and manage its documents.
                </p>
                
                {projectsLoading ? (
                  <LoadingSpinner size="lg" />
                ) : projects.length === 0 ? (
                  <Link href="/dashboard/agents/new">
                    <Button variant="premium" size="lg">
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Project
                    </Button>
                  </Link>
                ) : null}
              </div>
            </GlassCard>
          ) : documentsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : documents.length === 0 ? (
            <GlassCard gradient className="p-12 text-center">
              <div className="flex flex-col items-center">
                <FileUp className="w-16 h-16 text-accent/50 mb-4" />
                <h2 className="text-xl font-bold mb-2">No Documents Yet</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Document management is currently in development. You'll be able to upload documents to enhance your AI agent with custom knowledge soon.
                </p>
                <Button 
                  variant="premium" 
                  size="lg"
                  onClick={() => setShowUploadModal(true)}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Try Document Upload
                </Button>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="divide-y divide-border">
              <div className="p-4 flex items-center text-muted-foreground text-sm font-medium">
                <div className="w-12 text-center">#</div>
                <div className="flex-1">Name</div>
                <div className="w-48 hidden md:block">Type</div>
                <div className="w-48 hidden md:block">Size</div>
                <div className="w-48 hidden md:block">Uploaded</div>
                <div className="w-24 text-right">Actions</div>
              </div>
              
              {filteredDocuments.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">No documents found matching your search.</p>
                </div>
              ) : (
                filteredDocuments.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="p-4 flex items-center hover:bg-card-foreground/5"
                  >
                    <div className="w-12 text-center flex-shrink-0">
                      {getFileIcon(doc.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                      )}
                    </div>
                    <div className="w-48 hidden md:block text-sm text-muted-foreground">
                      {doc.file_type || 'Unknown type'}
                    </div>
                    <div className="w-48 hidden md:block text-sm text-muted-foreground">
                      {doc.file_size 
                        ? `${Math.round(doc.file_size / 1024)} KB` 
                        : 'Unknown size'}
                    </div>
                    <div className="w-48 hidden md:block text-sm text-muted-foreground">
                      {doc.created_at 
                        ? new Date(doc.created_at).toLocaleDateString() 
                        : 'Unknown date'}
                    </div>
                    <div className="w-24 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 h-9 w-9 text-blue-500 hover:bg-blue-500/10 hover:text-blue-600"
                        title="Download"
                        disabled={!doc.download_url}
                        onClick={() => window.open(doc.download_url, '_blank')}
                      >
                        <Download className="w-5 h-5" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-2 h-9 w-9 hover:bg-red-500/10 hover:text-red-500 ${deleteConfirm === doc.id ? 'text-destructive bg-destructive/10' : ''}`}
                        title={deleteConfirm === doc.id ? 'Click again to confirm deletion' : 'Delete'}
                        onClick={() => handleDeleteDocument(doc.id)}
                        disabled={deletingId === doc.id}
                      >
                        {deletingId === doc.id ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </GlassCard>
          )}
        </div>
      </div>
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <GlassCard gradient glow className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Upload Document</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {uploadError && (
                <div className="bg-destructive/10 border border-destructive text-foreground rounded-lg p-3 mb-4 text-sm">
                  {uploadError}
                </div>
              )}
              
              <form onSubmit={handleUpload}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Project
                    </label>
                    <div className="input-premium p-3 flex items-center">
                      {selectedProject ? selectedProject.name : 'No project selected'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      File
                    </label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-accent/50 transition-colors">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.json"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <Upload className="w-8 h-8 text-accent mb-2" />
                          {uploadingFile ? (
                            <p className="text-sm">{uploadingFile.name}</p>
                          ) : (
                            <>
                              <p className="font-medium mb-1">Click to upload</p>
                              <p className="text-xs text-muted-foreground">
                                PDF, DOC, TXT, CSV, XLS, JSON (max 10MB)
                              </p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="documentName" className="block text-sm font-medium mb-1">
                      Document Name
                    </label>
                    <input
                      type="text"
                      id="documentName"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      placeholder="Enter a name for this document"
                      className="input-premium"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="documentDescription" className="block text-sm font-medium mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      id="documentDescription"
                      value={documentDescription}
                      onChange={(e) => setDocumentDescription(e.target.value)}
                      placeholder="Enter a description"
                      className="input-premium"
                      rows={3}
                    />
                  </div>
                  
                  {isUploading && (
                    <div>
                      <div className="flex justify-between mb-1 text-xs">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-card h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowUploadModal(false)}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="premium"
                      className="flex-1"
                      loading={isUploading}
                      disabled={!uploadingFile || !documentName.trim() || isUploading}
                    >
                      Upload
                    </Button>
                  </div>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
} 