import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dropdown as UIDropdown, DropdownTrigger as UIDropdownTrigger, DropdownMenu as UIDropdownMenu, DropdownItem as UIDropdownItem } from '@/components/ui/Dropdown';
import { Progress as UIProgress } from '@/components/ui/Progress';
import { Tooltip as UITooltip } from '@/components/ui/Tooltip';
import { Badge as UIBadge } from '@/components/ui/Badge';
import type { VariantProps } from 'class-variance-authority';
import { 
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Progress,
  Chip,
  Avatar,
  AvatarGroup,
  Tooltip,
  Badge,
  Tabs,
  Tab
} from '@heroui/react';
import { 
  Upload, 
  Search, 
  Filter as FilterIcon,
  MoreVertical,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Trash2,
  Download,
  Eye,
  RefreshCw,
  Tag,
  Calendar,
  BarChart3,
  TrendingUp,
  Clock,
  Star,
  Plus,
  X,
  CheckSquare,
  Archive,
  Share,
  Edit,
  Settings,
  ChevronDown,
  AlertCircle,
  Check,
  FileUp,
  Link2,
  Globe,
  Loader2,
  ListFilter,
  GripVertical,
  GripHorizontal,
  Rows,
  Columns
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import type { Project, Document as DocumentType } from '../../../types/index';
import { listProjects, listDocuments, deleteDocument, uploadDocument as apiUploadDocument } from '../../../utils/api';
import { SkeletonLoader } from '../../../components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
import { extractErrorInfo } from '@/utils/error';

// HELPER FUNCTIONS (defined at module level)
const formatFileSize = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const documentTypeUIAttributesDefinition: Record<string, { icon: React.ElementType, label: string, color?: string }> = {
  pdf: { icon: FileText, label: 'PDF', color: 'text-red-500' },
  docx: { icon: FileText, label: 'Word Doc', color: 'text-blue-500' },
  txt: { icon: FileText, label: 'Text File', color: 'text-gray-500' },
  csv: { icon: FileText, label: 'CSV', color: 'text-green-500' },
  json: { icon: FileIcon, label: 'JSON', color: 'text-yellow-500' },
  md: { icon: FileText, label: 'Markdown', color: 'text-indigo-500' },
  html: { icon: Globe, label: 'Web Page', color: 'text-sky-500' },
  png: { icon: ImageIcon, label: 'PNG Image', color: 'text-purple-500' },
  jpg: { icon: ImageIcon, label: 'JPEG Image', color: 'text-pink-500' },
  default: { icon: FileIcon, label: 'File', color: 'text-slate-500' },
};

const getDocumentUIAttributes = (fileName: string, fileTypeMime?: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  let keyToUse = extension;
  if (fileTypeMime) {
    if (fileTypeMime.includes('pdf')) keyToUse = 'pdf';
    else if (fileTypeMime.includes('wordprocessingml')) keyToUse = 'docx';
    else if (fileTypeMime.includes('text/plain')) keyToUse = 'txt';
    else if (fileTypeMime.includes('csv')) keyToUse = 'csv';
    else if (fileTypeMime.includes('json')) keyToUse = 'json';
    else if (fileTypeMime.includes('markdown')) keyToUse = 'md';
    else if (fileTypeMime.includes('html')) keyToUse = 'html';
    else if (fileTypeMime.includes('png')) keyToUse = 'png';
    else if (fileTypeMime.includes('jpeg') || fileTypeMime.includes('jpg')) keyToUse = 'jpg';
  }
  const attr = documentTypeUIAttributesDefinition[keyToUse] || documentTypeUIAttributesDefinition.default;
  return { typeIcon: attr.icon, typeLabel: attr.label, typeColor: attr.color, type: keyToUse };
};

// INTERFACES
interface DocumentUI extends DocumentType {
  typeIcon: React.ElementType;
  typeLabel: string;
  typeColor?: string;
  type: string;
  sizeFormatted: string;
  uploadedAtFormatted: string;
  effectiveness?: number;
  viewCount?: number;
  referenceCount?: number;
  uploader?: { name: string; avatar?: string };
  tags?: string[];
  category?: string;
  // status is directly inherited from DocumentType
}

interface KnowledgeStats {
  totalDocuments: number;
  indexedDocuments: number;
  processingDocuments: number;
  totalSize: number;
  avgEffectiveness: number;
  mostReferenced: DocumentUI[];
  recentUploads: DocumentUI[];
}

interface FilterOptions {
  status: string[];
  type: string[];
  category: string[];
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  customStartDate?: string;
  customEndDate?: string;
}

const documentTypes = [
  { key: 'pdf', label: 'PDF', icon: FileText, color: 'danger' },
  { key: 'docx', label: 'Word Doc', icon: FileText, color: 'primary' },
  { key: 'txt', label: 'Text', icon: File, color: 'default' },
  { key: 'image', label: 'Image', icon: ImageIcon, color: 'secondary' },
  { key: 'other', label: 'Other', icon: File, color: 'warning' }
];

const categories = [
  'Product Information',
  'Customer Support',
  'Company Policies',
  'Technical Documentation',
  'Training Materials',
  'Marketing Content'
];

// COMPONENT
export default function KnowledgePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(true);
  
  const [documents, setDocuments] = useState<DocumentUI[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    type: [],
    category: [],
    dateRange: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOpen: isUploadModalOpen, onOpen: onUploadModalOpen, onClose: onUploadModalClose } = useDisclosure();
  const { isOpen: isBulkModalOpen, onOpen: onBulkModalOpen, onClose: onBulkModalClose } = useDisclosure();
  const [bulkAction, setBulkAction] = useState('');
  
  const [pageError, setPageError] = useState<string | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [deleteConfirmDocumentId, setDeleteConfirmDocumentId] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  
  const loadProjects = useCallback(async (): Promise<void> => {
    try {
      setProjectsLoading(true);
      setPageError(null);
      const projectsList = await listProjects();
      setProjects(projectsList);
      if (projectsList.length > 0 && !selectedProject) {
        setSelectedProject(projectsList[0]);
      } else if (projectsList.length === 0) {
        setSelectedProject(null);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setPageError(`Failed to load your projects. ${extractErrorInfo(err)}`);
    } finally {
      setProjectsLoading(false);
    }
  }, [selectedProject]);
  
  const loadDocuments = useCallback(async (projectId: string): Promise<void> => {
    if (!projectId) {
      setDocuments([]);
      setDocumentsLoading(false);
      return;
    }
    try {
      setDocumentsLoading(true);
      setPageError(null);
        const docsData = await listDocuments(projectId);
      const transformedDocs: DocumentUI[] = docsData.map((doc: DocumentType): DocumentUI => {
        const { typeIcon, typeLabel, typeColor, type } = getDocumentUIAttributes(doc.name, doc.file_type);
        return {
          ...doc,
          typeIcon,
          typeLabel,
          typeColor,
          type,
          sizeFormatted: formatFileSize(doc.file_size || 0),
          uploadedAtFormatted: new Date(doc.created_at).toLocaleDateString(),
          effectiveness: doc.metadata?.effectiveness || Math.floor(Math.random() * 50) + 50,
          viewCount: doc.metadata?.viewCount || Math.floor(Math.random() * 100),
          referenceCount: doc.metadata?.referenceCount || Math.floor(Math.random() * 50),
          uploader: { name: doc.metadata?.uploaderName || user?.email || 'System', avatar: user?.user_metadata?.avatar_url },
          tags: doc.metadata?.tags || ['untagged'],
          category: doc.metadata?.category || 'Uncategorized',
        };
      });
        setDocuments(transformedDocs);
    } catch (err) {
      console.error('Error loading documents:', err);
        setDocuments([]);
      const errorInfo = extractErrorInfo(err);
      setPageError(`Failed to load documents. ${errorInfo.message || 'Unknown error'}`);
    } finally {
      setDocumentsLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    if (user && !authLoading) {
      loadProjects();
    } else if (!user && !authLoading) {
      router.push('/login');
    }
  }, [user, authLoading, loadProjects, router]);
  
  useEffect(() => {
    if (selectedProject) {
      loadDocuments(selectedProject.id);
    } else {
      setDocuments([]);
      setDocumentsLoading(false);
    }
  }, [selectedProject, loadDocuments]);
  
  useEffect(() => {
    if (uploadSuccess) {
      const timer = setTimeout(() => setUploadSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingFile(file);
      setDocumentName(file.name);
      setDocumentDescription('');
    }
  };
  
  const handleUploadFormSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!uploadingFile || !selectedProject) {
      setUploadError('Please select a file and project.');
      return;
    }
    if (!documentName.trim()) {
      setUploadError('Please provide a document name.');
      return;
    }
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);
    let progressInterval: NodeJS.Timeout | undefined = undefined;
    try {
      const metadata = { description: documentDescription, uploaderName: user?.email || 'Unknown User' };
      let currentProgress = 0;
      setUploadProgress(currentProgress);
      progressInterval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 10) + 5;
        if (currentProgress >= 90) {
          if(progressInterval) clearInterval(progressInterval);
        }
        setUploadProgress(Math.min(currentProgress, 90));
      }, 300);

      await apiUploadDocument(selectedProject.id, uploadingFile, metadata);
      
      if(progressInterval) clearInterval(progressInterval);
        setUploadProgress(100);
      setUploadSuccess(true);
        await loadDocuments(selectedProject.id);
        setUploadingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
        setDocumentName('');
        setDocumentDescription('');
        setShowUploadModal(false);
      } catch (apiError: any) {
      if(progressInterval) clearInterval(progressInterval);
        setUploadProgress(0);
          setUploadError(apiError?.message || 'Upload failed. Please try again.');
      console.error("Upload error:", apiError);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteDocument = async (documentId: string): Promise<void> => {
    if (deleteConfirmDocumentId !== documentId) {
      setDeleteConfirmDocumentId(documentId);
      return;
    }
    setDeletingDocumentId(documentId);
    try {
      await deleteDocument(documentId);
      setDocuments(prevDocs => prevDocs.filter(d => d.id !== documentId));
      setDeleteConfirmDocumentId(null);
    } catch (err) {
      console.error('Error deleting document:', err);
      setPageError(`Failed to delete document. ${extractErrorInfo(err)}`);
    } finally {
      setDeletingDocumentId(null);
    }
  };
  
  const processedDocuments = useMemo(() => {
    return documents
      .filter(doc => {
        const searchableText = `${doc.name} ${doc.description || ''} ${doc.tags?.join(' ') || ''} ${doc.category || ''} ${doc.typeLabel}`.toLowerCase();
        return searchableText.includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [documents, searchQuery, filters]);
  
  const getStatusBadgeVariant = (status: DocumentType['status']): VariantProps<typeof UIBadge>['variant'] => {
    switch (status) {
      case 'ready': return 'default'; 
      case 'processing': case 'pending': return 'secondary';
      case 'failed': case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getDisplayStatus = (status: DocumentType['status']): string => {
    if (status === 'ready') return 'indexed';
    return status;
  }

  const handleFileUploadFromDropOrSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadingFile(file);
    setDocumentName(file.name);
    setDocumentDescription('');
    setUploadError(null);
    setUploadProgress(0);
    setShowUploadModal(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files?.length && selectedProject) {
      handleFileUploadFromDropOrSelect(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleBulkActionModalConfirm = async () => {
    if (!selectedProject) return;
    setIsUploading(true);
    try {
      if (bulkAction === 'delete' && selectedDocumentIds.size > 0) {
        await Promise.all(Array.from(selectedDocumentIds).map(id => deleteDocument(id)));
        await loadDocuments(selectedProject.id);
        setSelectedDocumentIds(new Set());
      }
    } catch (err) {
      setPageError(`Failed to ${bulkAction} documents. ${extractErrorInfo(err)}`);
    } finally {
      setIsUploading(false);
    }
    onBulkModalClose();
  };
  
  if (authLoading && !user) {
    return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }
  
  return (
    <DashboardLayout>
      <Head>
        <title>Knowledge Base | Nova AI</title>
        <meta name="description" content="Manage your knowledge documents" />
      </Head>
      <div className="p-4 md:p-6 lg:p-8" onDragOver={handleDragOver} onDrop={handleDrop}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Knowledge Base</h1>
              <p className="text-muted-foreground mt-1">Manage documents that power your AI agents.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input type="text" placeholder="Search documents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 w-full sm:w-64 h-11 rounded-lg border-input bg-background focus:border-primary" />
              </div>
              <Button onClick={() => {
                if (!selectedProject) {
                  setPageError("Please select a project first to upload documents.");
                  setShowProjectDropdown(true);
                  return;
                }
                setUploadingFile(null);
                setDocumentName('');
                setDocumentDescription('');
                setUploadError(null);
                setUploadProgress(0);
                setShowUploadModal(true);
              }} className="h-11 px-5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2" disabled={projectsLoading || !selectedProject}>
                <Upload className="w-5 h-5" /> Upload Document
              </Button>
            </div>
          </div>
          
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
            <UIDropdown>
              <UIDropdownTrigger asChild>
                <Button className="w-full md:w-auto flex items-center justify-between text-left h-11 px-4 rounded-lg border border-input bg-card hover:bg-muted" disabled={projectsLoading}>
                  <span className="flex items-center gap-2 truncate">
                    {projectsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-5 h-5 text-muted-foreground" />}
                    <span className="truncate">{selectedProject ? selectedProject.name : (projectsLoading ? 'Loading projects...' : 'Select a project')}</span>
                </span>
                  <ChevronDown className="w-5 h-5 text-muted-foreground ml-2 shrink-0" />
              </Button>
              </UIDropdownTrigger>
              <UIDropdownMenu className="w-full md:w-72">
                    {projectsLoading ? (
                  <div className="flex justify-center py-2 px-4 text-sm text-muted-foreground cursor-default">
                    <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                ) :
                 projects.length === 0 ? (
                  <div className="p-2 px-4 text-center text-sm text-muted-foreground cursor-default">
                    No projects found. <Link href="/dashboard/agents/new" className="text-primary hover:underline ml-1">Create one?</Link>
                      </div>
                 ) :
                 projects.map(project => (
                  <UIDropdownItem 
                            key={project.id}
                    onSelect={() => setSelectedProject(project)} 
                    className={cn(
                        "text-sm", // Ensure base text size is applied
                        selectedProject?.id === project.id && "bg-muted font-semibold text-foreground"
                    )}
                  >
                    {project.name}
                  </UIDropdownItem>
                ))}
              </UIDropdownMenu>
            </UIDropdown>
          </div>
          
          {pageError && <Card className="bg-destructive/10 border border-destructive text-destructive-foreground p-4 mb-6 flex items-start gap-3"><AlertCircle className="w-5 h-5 mt-0.5 shrink-0" /><div className="flex-1"><p className="font-medium">Error</p><p className="text-sm">{pageError}</p>{selectedProject && <Button onClick={() => loadDocuments(selectedProject.id)} className="mt-2 border-destructive text-destructive hover:bg-destructive/20 hover:text-destructive-foreground text-xs h-8 px-3 border rounded-md"><RefreshCw className="w-3 h-3 mr-1.5" />Try Again</Button>}</div></Card>}
          {uploadSuccess && <Card className="bg-green-500/10 border border-green-600 text-green-700 dark:text-green-400 p-4 mb-6 flex items-center gap-3"><Check className="w-5 h-5 shrink-0" /><p className="text-sm font-medium">Document uploaded successfully!</p></Card>}

          {!selectedProject && !projectsLoading && projects.length > 0 && <Card className="p-8 md:p-12 text-center border-dashed border-2 border-border bg-card/50"><div className="flex flex-col items-center"><FileText className="w-12 h-12 text-muted-foreground mb-4" /><h2 className="text-xl font-semibold text-foreground mb-2">Select a Project</h2><p className="text-muted-foreground max-w-md mx-auto mb-6">Please select a project to view its documents.</p></div></Card>}
          {!selectedProject && projects.length === 0 && !projectsLoading && <Card className="p-8 md:p-12 text-center border-dashed border-2 border-border bg-card/50"><div className="flex flex-col items-center"><Plus className="w-12 h-12 text-muted-foreground mb-4" /><h2 className="text-xl font-semibold text-foreground mb-2">No Projects Found</h2><p className="text-muted-foreground max-w-md mx-auto mb-6">Create a project to add documents.</p><Link href="/dashboard/new-bot" passHref><Button className="h-11 px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="w-5 h-5 mr-2"/>Create Project</Button></Link></div></Card>}
          {selectedProject && documentsLoading && <div className="flex justify-center py-12"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}
          {selectedProject && !documentsLoading && processedDocuments.length === 0 && <Card className="p-8 md:p-12 text-center border-dashed border-2 border-border bg-card/50" onDragOver={handleDragOver} onDrop={handleDrop}><div className="flex flex-col items-center"><FileUp className="w-12 h-12 text-muted-foreground mb-4" /><h2 className="text-xl font-semibold text-foreground mb-2">No Documents Yet</h2><p className="text-muted-foreground max-w-md mx-auto mb-4">Drag & drop files or use the upload button to add to "{selectedProject.name}".</p><Button onClick={() => { setUploadingFile(null); setDocumentName(''); setDocumentDescription(''); setUploadError(null); setUploadProgress(0); setShowUploadModal(true);}} className="h-11 px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"><Upload className="w-5 h-5 mr-2" />Upload First Document</Button></div></Card>}

          {selectedProject && !documentsLoading && processedDocuments.length > 0 && (
            <Card className="overflow-hidden shadow-sm border border-border">
              <div className="hidden md:grid grid-cols-[auto_1fr_120px_120px_120px_100px] items-center gap-4 p-4 border-b border-border bg-muted/50">
                <FileIcon size={16} className="text-muted-foreground mx-auto opacity-0" />
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Size</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Uploaded</div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</div>
              </div>
              {processedDocuments.map((doc, index) => (
                <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.03 }} className="grid md:grid-cols-[auto_1fr_120px_120px_120px_100px] items-center gap-4 p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                  <div className={cn("w-8 h-8 flex items-center justify-center rounded-md text-xl", doc.typeColor || 'text-muted-foreground')}><doc.typeIcon /></div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate" title={doc.name}>{doc.name}</p>
                    {doc.description && <p className="text-xs text-muted-foreground truncate" title={doc.description}>{doc.description}</p>}
                    <UIBadge variant={getStatusBadgeVariant(doc.status)} className="capitalize mt-1 text-[10px] px-1.5 py-0 leading-snug">{getDisplayStatus(doc.status)}</UIBadge>
            </div>
                  <div className="text-sm text-muted-foreground hidden md:block">{doc.typeLabel}</div>
                  <div className="text-sm text-muted-foreground hidden md:block">{doc.sizeFormatted}</div>
                  <div className="text-sm text-muted-foreground hidden md:block">{doc.uploadedAtFormatted}</div>
                  <div className="flex justify-end items-center gap-1">
                    <UITooltip content="Download">
                      <Button className="p-2 h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md" disabled={!(doc as any).download_url} onClick={() => (doc as any).download_url && window.open((doc as any).download_url, '_blank')}><Download className="w-4 h-4" /></Button>
                    </UITooltip>
                    <UITooltip content={deleteConfirmDocumentId === doc.id ? 'Confirm Delete' : 'Delete'}>
                      <Button className={cn("p-2 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md", deleteConfirmDocumentId === doc.id && "bg-destructive/10 text-destructive")} onClick={() => handleDeleteDocument(doc.id)} disabled={deletingDocumentId === doc.id}>
                        {deletingDocumentId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </UITooltip>
                    </div>
                  </motion.div>
              ))}
            </Card>
          )}
        </div>
      </div>
      
      <Modal isOpen={showUploadModal} onOpenChange={(isOpen) => {
        setShowUploadModal(isOpen);
        if (!isOpen) {
          setUploadingFile(null);
          setDocumentName('');
          setDocumentDescription('');
          setUploadError(null);
          setUploadProgress(0);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      }} size="xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-lg font-semibold">Upload Document</ModalHeader>
          <ModalBody>
                {uploadError && <Card className="bg-destructive/10 border border-destructive text-destructive-foreground p-3 mb-4 text-sm">{uploadError}</Card>}
                <form onSubmit={handleUploadFormSubmit} className="space-y-4">
                <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Project</label>
                      <div className="p-3 rounded-md border border-input bg-muted/50 flex items-center text-sm">{selectedProject ? selectedProject.name : 'No project selected'}</div>
                </div>
                <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">File</label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors bg-background hover:bg-muted/30" onDragOver={handleDragOver} onDrop={(e) => {e.preventDefault(); e.stopPropagation(); if(e.dataTransfer.files?.length) handleFileChange({ target: { files: e.dataTransfer.files } } as any );}}>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" id="file-upload-input" accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.json,.md,.html,.png,.jpg,.jpeg" />
                        <label htmlFor="file-upload-input" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                            <Upload className="w-10 h-10 text-primary mb-2" />
                            {uploadingFile ? <p className="text-sm font-medium text-foreground">{uploadingFile.name}</p> :
                              <><p className="font-semibold text-foreground mb-1">Click to browse or drag & drop</p><p className="text-xs text-muted-foreground">Max 25MB. PDF, DOCX, TXT, MD, CSV, JSON, HTML, PNG, JPG supported.</p></>}
                      </div>
                    </label>
                  </div>
                </div>
                <div>
                      <label htmlFor="documentNameInput" className="block text-sm font-medium mb-1 text-muted-foreground">Display Name</label>
                      <Input type="text" id="documentNameInput" value={documentName} onChange={e => setDocumentName(e.target.value)} placeholder="Enter a name for this document" className="w-full h-11 rounded-lg border-input bg-background focus:border-primary" required />
                    </div>
                    <div>
                      <label htmlFor="documentDescriptionInput" className="block text-sm font-medium mb-1 text-muted-foreground">Description (optional)</label>
                      <textarea id="documentDescriptionInput" value={documentDescription} onChange={e => setDocumentDescription(e.target.value)} placeholder="Enter a short description for this document" className="w-full p-2.5 rounded-lg border border-input bg-background focus:border-primary min-h-[60px] text-sm" rows={2} />
                    </div>
                    {isUploading && <div><div className="flex justify-between mb-1 text-xs text-muted-foreground"><span>Uploading...</span><span>{uploadProgress}%</span></div><UIProgress value={uploadProgress} className="h-2" /></div>}
                    <ModalFooter className="pt-4 pb-0 px-0">
                      <Button onClick={() => { onClose(); }} disabled={isUploading} className="h-10 px-4 rounded-lg border border-input hover:bg-muted text-foreground">Cancel</Button>
                      <Button type="submit" className="h-10 px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90" disabled={!uploadingFile || !documentName.trim() || isUploading || !selectedProject}>{isUploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}{isUploading ? 'Uploading...' : 'Upload Document'}</Button>
                    </ModalFooter>
            </form>
          </ModalBody>
            </>
          )}
        </ModalContent>
        </Modal>
    </DashboardLayout>
  );
} 