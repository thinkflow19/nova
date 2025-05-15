import { useState, ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Plus, X, Check, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../utils/auth';
import { createProject } from '../../../utils/api';
import Button from '../../../components/ui/Button';
import GlassCard from '../../../components/ui/GlassCard';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface MemoryType {
  value: string;
  label: string;
  description: string;
}

interface ModelOption {
  value: string;
  label: string;
  description: string;
}

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
  temperature: number;
}

interface ProjectData {
  name: string;
  description: string;
  is_public: boolean;
  icon: string | null;
  color: string;
  memory_type: string;
  tags: string[];
  ai_config: {
    system_prompt: string;
    model: string;
    temperature: number;
  };
}

const MEMORY_TYPES: MemoryType[] = [
  { value: 'default', label: 'Default', description: 'Basic conversation memory' },
  { value: 'conversational', label: 'Conversational', description: 'Enhanced memory with context awareness' },
  { value: 'structured', label: 'Structured', description: 'Organized memory with key information retention' },
];

const MODEL_OPTIONS: ModelOption[] = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
  { value: 'gpt-4', label: 'GPT-4', description: 'Most capable model, better reasoning' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Enhanced GPT-4 with improved performance' },
];

export default function NewAgent() {
  const router = useRouter();
  const { user, loading } = useAuth({ redirectTo: '/login' });
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    isPublic: false,
    icon: '',
    color: '#8B5CF6', // Default color (violet)
    memoryType: 'default',
    tags: [],
    systemPrompt: 'You are a helpful AI assistant.',
    model: 'gpt-4',
    temperature: 0.7,
  });
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<string>('');
  
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
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
      setSubmitting(true);
      setError(null);
      
      const projectData: ProjectData = {
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
          temperature: parseFloat(formData.temperature.toString()),
        },
      };
      
      const newProject = await createProject(projectData);
      
      // Redirect to the new project page
      router.push(`/dashboard/bot/${newProject.id}`);
    } catch (err: any) {
      console.error('Failed to create project:', err);
      setError(err.message || 'Failed to create agent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) return null; // DashboardLayout handles loading state
  
  return (
    <DashboardLayout>
      <Head>
        <title>Create New Agent | Nova AI</title>
        <meta name="description" content="Create a new AI agent" />
      </Head>
      
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="mr-4 p-2 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold premium-text-gradient">Create New Agent</h1>
        </div>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive text-foreground rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <GlassCard gradient glow className="p-6 md:p-8">
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
                    placeholder="e.g., Customer Support Assistant"
                    className="input-premium"
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
                    placeholder="What does this agent do?"
                    className="input-premium"
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
                      placeholder="e.g., 🤖 or 🧠"
                      className="input-premium"
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
                        className="ml-2 flex-1 input-premium"
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
                      onChange={handleChange as any}
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
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add a tag"
                    className="input-premium flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="default"
                    size="sm"
                    className="ml-2 p-2"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-white/5 backdrop-blur-sm rounded-full px-3 py-1"
                    >
                      <span className="text-sm">{tag}</span>
                      <Button
                        type="button"
                        onClick={() => removeTag(tag)}
                        variant="ghost"
                        size="sm"
                        className="ml-1.5 p-0.5 rounded-full hover:bg-white/10"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
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
                    className="select-premium"
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
                    className="select-premium"
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
                    className="input-premium"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This instructs the AI how to behave. Be specific about the agent's role and constraints.
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
              
              <div className="pt-4 border-t border-white/10">
                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  isLoading={submitting}
                  className="w-full"
                >
                  {submitting ? 'Creating Agent...' : 'Create Agent'}
                </Button>
              </div>
            </div>
          </form>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
} 