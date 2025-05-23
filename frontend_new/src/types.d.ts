import { User as SupabaseUser } from '@supabase/supabase-js';

// Extend Supabase User type with additional properties
declare global {
  interface User extends SupabaseUser {
    name?: string;
    full_name?: string;
    avatar_url?: string;
    email_verified?: boolean;
  }
}

export interface User extends SupabaseUser {
  name?: string;
  full_name?: string;
  avatar_url?: string;
  email_verified?: boolean;
}

// Project stats interface
export interface ProjectStats {
  message_count?: number;
  session_count?: number;
  document_count?: number;
  file_count?: number;
  accuracy?: number;
  last_interaction?: string;
}

// Project interface
export interface Project {
  id: string;
  name: string;
  description?: string;
  model_type?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  color?: string;
  tags?: string[];
  is_public?: boolean;
  model_config?: Record<string, any>;
  stats?: ProjectStats;
}

// API Response types
export interface ApiResponse<T> {
  items?: T[];
  data?: T;
  error?: string;
  message?: string;
  status?: number;
  total?: number;
  page?: number;
  limit?: number;
}

// Chat Session interface
export interface ChatSession {
  id: string;
  title: string;
  summary?: string;
  project_id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  project?: Project;
}

// Chat Message interface
export interface ChatMessage {
  id: string;
  session_id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  created_at?: string;
  metadata?: Record<string, any>;
}

// Document interface
export interface Document {
  id: string;
  project_id: string;
  user_id: string;
  filename?: string;
  path?: string;
  content_type?: string;
  size?: number;
  description?: string;
  status?: 'pending' | 'processing' | 'processed' | 'error';
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// User Stats interface
export interface UserStats {
  total_projects: number;
  total_documents: number;
  total_sessions: number;
  total_messages: number;
}

// Make modules importable
export {}; 