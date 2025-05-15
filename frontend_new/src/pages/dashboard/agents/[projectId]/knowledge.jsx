import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, FileText, AlertCircle, Loader2, X, CheckCircle, Download, AlertTriangle, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../../utils/auth';
import { getProject, listDocuments, getDocumentUploadUrl, completeDocumentUpload, getDocument } from '../../../../utils/api';
import GlassCard from '../../../../components/ui/GlassCard';

// Define file type icons/colors
const getFileInfo = (fileType) => {
  const types = {
    'pdf': { icon: 'pdf', color: '#E53E3E' },
    'docx': { icon: 'word', color: '#2B6CB0' },
    'doc': { icon: 'word', color: '#2B6CB0' },
    'txt': { icon: 'text', color: '#718096' },
    'csv': { icon: 'excel', color: '#2F855A' },
    'xlsx': { icon: 'excel', color: '#2F855A' },
    'xls': { icon: 'excel', color: '#2F855A' },
    'ppt': { icon: 'ppt', color: '#C05621' },
    'pptx': { icon: 'ppt', color: '#C05621' },
    'md': { icon: 'markdown', color: '#6B46C1' },
    'json': { icon: 'code', color: '#4C51BF' },
  };
  
  return types[fileType?.toLowerCase()] || { icon: 'file', color: '#718096' };
};

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function ProjectDocuments() {
  const router = useRouter();
  const { projectId } = router.query;
  const { user, loading: authLoading } = useAuth({ redirectTo: '/login' });
  
  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUpload, setCurrentUpload] = useState(null);
  const fileInputRef = useRef(null);
  
  // Document detail form
  const [showDetailForm, setShowDetailForm] = useState(false);
  const [documentDetail, setDocumentDetail] = useState({
    name: '',
    description: '',
    id: null,
  });
  
  // Function to load project and documents
  const loadData = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Load project details
      const projectData = await getProject(projectId);
      setProject(projectData);
      
      // Load documents
      const documentsData = await listDocuments(projectId);
      setDocuments(documentsData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data when projectId changes
  useEffect(() => {
    if (projectId && user) {
      loadData();
    }
  }, [projectId, user]);
  
  // Poll for document processing status
  useEffect(() => {
    if (!documents.length) return;
    
    const processingDocs = documents.filter(doc => doc.status === 'processing');
    if (!processingDocs.length) return;
    
    const intervalId = setInterval(async () => {
      for (const doc of processingDocs) {
        try {
          const updatedDoc = await getDocument(doc.id);
          if (updatedDoc.status !== doc.status) {
            setDocuments(prev => 
              prev.map(d => d.id === updatedDoc.id ? updatedDoc : d)
            );
          }
        } catch (err) {
          console.error(`Error checking document ${doc.id} status:`, err);
        }
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(intervalId);
  }, [documents]);
  
  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      
      // Get filename and content type
      const filename = file.name;
      const contentType = file.type || 'application/octet-stream';
      
      // Get upload URL from API
      const uploadData = await getDocumentUploadUrl(
        projectId,
        filename,
        contentType
      );
      
      // Upload file directly to storage
      const { upload_url, document_id, expires_at } = uploadData;
      
      // Track current upload
      setCurrentUpload({
        file,
        documentId: document_id,
        filename,
      });
      
      // Upload file with progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });
      
      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // File uploaded successfully, now complete the process
          setDocumentDetail({
            id: document_id,
            name: file.name,
            description: '',
          });
          setShowDetailForm(true);
        } else {
          setError(`Upload failed: ${xhr.statusText}`);
          setIsUploading(false);
        }
      });
      
      xhr.addEventListener('error', () => {
        setError('Upload failed. Please try again.');
        setIsUploading(false);
      });
      
      xhr.open('PUT', upload_url);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.send(file);
      
    } catch (err) {
      console.error('Error starting upload:', err);
      setError('Failed to initiate upload: ' + err.message);
      setIsUploading(false);
    }
  };
  
  // Complete document upload with metadata
  const handleCompleteUpload = async (e) => {
    e.preventDefault();
    
    try {
      const result = await completeDocumentUpload(
        documentDetail.id,
        documentDetail.name,
        documentDetail.description
      );
      
      // Add new document to the list
      setDocuments(prev => [
        result,
        ...prev
      ]);
      
      // Reset form
      setShowDetailForm(false);
      setDocumentDetail({ name: '', description: '', id: null });
      setCurrentUpload(null);
      setIsUploading(false);
      setUploadProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    } catch (err) {
      console.error('Error completing upload:', err);
      setError('Failed to process document: ' + err.message);
    }
  };
  
  // Cancel upload
  const handleCancelUpload = () => {
    setShowDetailForm(false);
    setDocumentDetail({ name: '', description: '', id: null });
    setCurrentUpload(null);
    setIsUploading(false);
    setUploadProgress(0);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };
  
  if (authLoading) return null; // DashboardLayout handles loading state
  
  return (
    <DashboardLayout>
      <Head>
        <title>{project ? `${project.name} - Documents` : 'Documents'} | Nova AI</title>
        <meta name="description" content="Manage knowledge documents for your AI agent" />
      </Head>
      
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-full hover:bg-card-foreground/5 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {project ? project.name : 'Loading...'} - Documents
            </h1>
            <p className="text-muted-foreground mt-1">
              Upload and manage documents for your AI agent
            </p>
          </div>
        </div>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive text-foreground rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {/* Upload Section */}
        <GlassCard variant="agent" gradient glow className="mb-8">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Upload Documents</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Add documents for your AI agent to reference during conversations
                </p>
              </div>
              
              <div className="flex-shrink-0">
                <input
                  id="file-upload"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="hidden"
                  accept=".pdf,.docx,.txt,.md,.csv,.json"
                />
                
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                    isUploading
                      ? 'bg-card-foreground/10 text-muted-foreground'
                      : 'bg-accent hover:bg-accent/90 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Upload Document
                    </>
                  )}
                </label>
              </div>
            </div>
            
            {/* Upload Progress */}
            {isUploading && !showDetailForm && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {currentUpload?.filename}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-accent h-2.5 rounded-full transition-all duration-200" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Document Details Form */}
            {showDetailForm && (
              <div className="mt-4 bg-card p-4 rounded-lg border border-border">
                <h3 className="font-medium mb-2">Document Details</h3>
                <form onSubmit={handleCompleteUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={documentDetail.name}
                      onChange={(e) => setDocumentDetail({ ...documentDetail, name: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      value={documentDetail.description}
                      onChange={(e) => setDocumentDetail({ ...documentDetail, description: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancelUpload}
                      className="px-4 py-2 border border-border rounded-md hover:bg-card-foreground/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
                    >
                      Save Document
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Accepted File Types */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { ext: 'PDF', bg: 'bg-red-500/10', color: 'text-red-600' },
                { ext: 'DOCX', bg: 'bg-blue-500/10', color: 'text-blue-600' },
                { ext: 'TXT', bg: 'bg-green-500/10', color: 'text-green-600' },
                { ext: 'MD', bg: 'bg-purple-500/10', color: 'text-purple-600' },
                { ext: 'CSV', bg: 'bg-amber-500/10', color: 'text-amber-600' },
                { ext: 'JSON', bg: 'bg-sky-500/10', color: 'text-sky-600' }
              ].map(file => (
                <div key={file.ext} className={`flex items-center gap-2 p-2 rounded-md ${file.bg} ${file.color} text-xs`}>
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">.{file.ext.toLowerCase()}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
        
        {/* Documents List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Documents</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No documents yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload documents to enhance your AI agent's knowledge
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-card-foreground/5">
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Size</th>
                      <th className="text-left py-3 px-4 font-medium">Type</th>
                      <th className="text-left py-3 px-4 font-medium">Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => {
                      const fileInfo = getFileInfo(doc.file_type);
                      const statusColor = 
                        doc.status === 'indexed' ? 'text-green-500' :
                        doc.status === 'processing' ? 'text-amber-500' :
                        doc.status === 'failed' ? 'text-destructive' : 'text-muted-foreground';
                      
                      return (
                        <tr 
                          key={doc.id} 
                          className="border-t border-border hover:bg-card-foreground/5 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div 
                                className="w-8 h-8 flex items-center justify-center rounded-md mr-3 flex-shrink-0"
                                style={{ backgroundColor: `${fileInfo.color}25` }}
                              >
                                <FileText 
                                  className="h-4 w-4" 
                                  style={{ color: fileInfo.color }} 
                                />
                              </div>
                              <div>
                                <p className="font-medium leading-tight">{doc.name}</p>
                                {doc.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                    {doc.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              {doc.status === 'indexed' ? (
                                <CheckCircle className={`h-4 w-4 mr-1.5 ${statusColor}`} />
                              ) : doc.status === 'processing' ? (
                                <RefreshCw className={`h-4 w-4 mr-1.5 ${statusColor} animate-spin`} />
                              ) : doc.status === 'failed' ? (
                                <AlertTriangle className={`h-4 w-4 mr-1.5 ${statusColor}`} />
                              ) : (
                                <FileText className={`h-4 w-4 mr-1.5 ${statusColor}`} />
                              )}
                              <span className={`capitalize ${statusColor}`}>
                                {doc.status}
                              </span>
                            </div>
                            {doc.status === 'indexed' && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {doc.chunk_count} chunks
                              </p>
                            )}
                            {doc.status === 'failed' && doc.processing_error && (
                              <p className="text-xs text-destructive mt-0.5 line-clamp-1">
                                {doc.processing_error}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm">{formatFileSize(doc.file_size)}</td>
                          <td className="py-3 px-4 text-sm capitalize">{doc.file_type || '—'}</td>
                          <td className="py-3 px-4 text-sm">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 