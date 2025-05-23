import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, Loader2, Check, Save, Trash2, Plus, X } from 'lucide-react';
import DashboardLayout from '../../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../../utils/auth';
import { getProject, updateProject } from '../../../../utils/api';

const MEMORY_TYPES = [
  { value: 'default', label: 'Default', description: 'Basic conversation memory' },
  { value: 'conversational', label: 'Conversational', description: 'Enhanced memory with context awareness' },
  { value: 'structured', label: 'Structured', description: 'Organized memory with key information retention' },
];

const MODEL_OPTIONS = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
  { value: 'gpt-4', label: 'GPT-4', description: 'Most capable model, better reasoning' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Enhanced GPT-4 with improved performance' },
];

export default function AgentSettings() {
  const router = useRouter();
  const { projectId } = router.query;
  const { user, loading: authLoading } = useAuth({ redirectTo: '/login' });
  
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  interface FormData {
    name: string;
    description: string;
    isPublic: boolean;
    icon: string;
    color: string;
    memoryType: string;
    tags: string[];
    systemPrompt: string;
    model: string;
    temperature: string;
  }
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    isPublic: false,
    icon: '',
    color: '#6366F1',
    memoryType: 'default',
    tags: [],
    systemPrompt: 'You are a helpful AI assistant.',
    model: 'gpt-4',
    temperature: '0.7',
  });
  
  const [tagInput, setTagInput] = useState<string>('');
  
  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const projectData = await getProject(projectId as string);
        setProject(projectData);
        
        // Initialize form with project data
        setFormData({
          name: projectData.name || '',
          description: projectData.description || '',
          isPublic: projectData.is_public || false,
          icon: projectData.icon || '',
          color: projectData.color || '#6366F1',
          memoryType: projectData.memory_type || 'default',
          tags: projectData.tags || [],
          systemPrompt: projectData.ai_config?.system_prompt || 'You are a helpful AI assistant.',
          model: projectData.ai_config?.model || 'gpt-4',
          temperature: projectData.ai_config?.temperature?.toString() || '0.7',
        });
      } catch (err: any) {
        console.error('Failed to load project:', err);
        setError('Failed to load agent data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (projectId && user) {
      loadProjectData();
    }
  }, [projectId, user]);
  
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // Narrow target to HTMLInputElement to access 'checked'
    const target = e.target as HTMLInputElement;
    const { name, type, value } = target;
    const newValue = type === 'checkbox' ? target.checked : value;
    setFormData({
      ...formData,
      [name]: newValue,
    });
  };
  
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };
  
  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Agent name is required');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage('');
      
      const projectData = {
        name: formData.name,
        description: formData.description,
        is_public: formData.isPublic,
        icon: formData.icon || null,
        color: formData.color,
        memory_type: formData.memoryType,
        tags: formData.tags,
        ai_config: {
          system_prompt: formData.systemPrompt,
          model: formData.model,
          temperature: parseFloat(formData.temperature),
        },
      };
      
      await updateProject(projectId as string, projectData);
      
      // Update local project data
      setProject({
        ...project,
        ...projectData,
      });
      
      setSuccessMessage('Agent settings updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      console.error('Failed to update project:', err);
      setError(err.message || 'Failed to update agent settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (authLoading) return null; // DashboardLayout handles loading state
  
  return (
    <DashboardLayout>
      <Head>
        <title>{project ? `${project.name} - Settings` : 'Agent Settings'} | Nova AI</title>
        <meta name="description" content="Configure your AI agent settings" />
      </Head>
      
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-full hover:bg-card-foreground/5 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">
            {isLoading ? 'Loading...' : `${project?.name} - Settings`}
          </h1>
        </div>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive text-foreground rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500 text-foreground rounded-lg p-4 mb-6 flex items-start">
            <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-accent animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm"
          >
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                  
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Agent Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label htmlFor="icon" className="block text-sm font-medium mb-1">
                        Icon (Emoji)
                      </label>
                      <input
                        type="text"
                        id="icon"
                        name="icon"
                        value={formData.icon}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                        maxLength={2}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <label htmlFor="color" className="block text-sm font-medium mb-1">
                        Color
                      </label>
                      <div className="flex items-center">
                        <input
                          type="color"
                          id="color"
                          name="color"
                          value={formData.color}
                          onChange={handleChange}
                          className="w-10 h-10 rounded border border-border overflow-hidden cursor-pointer"
                          style={{ padding: 0 }}
                        />
                        <input
                          type="text"
                          value={formData.color}
                          onChange={handleChange}
                          name="color"
                          className="ml-2 flex-1 px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isPublic"
                        checked={formData.isPublic}
                        onChange={handleChange}
                        className="w-4 h-4 text-accent bg-card border-border rounded focus:ring-accent/50"
                      />
                      <span className="ml-2 text-sm">Make this agent public</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Public agents can be accessed by anyone with the link.
                    </p>
                  </div>
                </div>
                
                {/* Tags */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Tags</h2>
                  
                  <div className="flex items-center mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add a tag"
                      className="flex-1 px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="ml-2 p-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-card-foreground/5 rounded-full px-3 py-1"
                      >
                        <span className="text-sm">{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1.5 p-0.5 rounded-full hover:bg-card-foreground/10 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* AI Configuration */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">AI Configuration</h2>
                  
                  <div className="mb-4">
                    <label htmlFor="memoryType" className="block text-sm font-medium mb-1">
                      Memory Type
                    </label>
                    <select
                      id="memoryType"
                      name="memoryType"
                      value={formData.memoryType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                    >
                      {MEMORY_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {MEMORY_TYPES.find(t => t.value === formData.memoryType)?.description}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="model" className="block text-sm font-medium mb-1">
                      AI Model
                    </label>
                    <select
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                    >
                      {MODEL_OPTIONS.map((model) => (
                        <option key={model.value} value={model.value}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {MODEL_OPTIONS.find(m => m.value === formData.model)?.description}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="systemPrompt" className="block text-sm font-medium mb-1">
                      System Prompt
                    </label>
                    <textarea
                      id="systemPrompt"
                      name="systemPrompt"
                      value={formData.systemPrompt}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Instructions that define how the AI should behave.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="temperature" className="block text-sm font-medium mb-1">
                      Temperature: {formData.temperature}
                    </label>
                    <input
                      type="range"
                      id="temperature"
                      name="temperature"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.temperature}
                      onChange={handleChange}
                      className="w-full accent-accent"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Precise (0)</span>
                      <span>Balanced (0.7)</span>
                      <span>Creative (1)</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <button
                    type="button"
                    className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive font-medium rounded-lg transition-colors flex items-center"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Delete Agent
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-accent hover:bg-accent/90 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
} 