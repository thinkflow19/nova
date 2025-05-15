// API Response Types for Nova
import { UUID } from 'crypto';

// Base interfaces
export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  created_at: string;
  last_login?: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  icon?: string;
  color?: string;
  ai_config?: Record<string, any>;
  memory_type?: string;
  tags?: string[];
}

export interface ProjectResponse extends ApiResponse {
  project: Project;
}

export interface ProjectsListResponse extends ApiResponse {
  projects: Project[];
}

// Document types
export interface Document {
  id: string;
  name: string;
  project_id: string;
  user_id: string;
  file_key: string;
  file_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  chunks_count?: number;
}

export interface DocumentResponse extends ApiResponse {
  document: Document;
}

export interface DocumentsListResponse extends ApiResponse {
  documents: Document[];
}

export interface DocumentUploadResponse extends ApiResponse {
  url: string;
  file_key: string;
  token?: string;
  uploadType?: string;
}

// Chat types
export interface ChatSession {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  summary?: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  ai_config?: Record<string, any>;
}

export interface ChatSessionResponse extends ApiResponse {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  summary?: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  ai_config?: Record<string, any>;
}

export interface ChatSessionsListResponse extends ApiResponse {
  sessions: ChatSession[];
}

export interface ChatMessage {
  id: string;
  session_id: string;
  project_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  created_at: string;
  tokens?: number;
  is_indexed: boolean;
  is_pinned: boolean;
  reactions?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ChatMessagesListResponse extends ApiResponse {
  messages: ChatMessage[];
}

export interface ChatMessageResponse {
  message: ChatMessage;
  success?: boolean;
  error?: string;
}

export interface ChatCompletionResponse extends ApiResponse {
  completion: string;
  session_id: string;
  model?: string;
}

// Health check
export interface HealthCheckResponse extends ApiResponse {
  status: string;
  timestamp: string;
  version?: string;
  uptime?: number;
}

// Analytics types
export interface UserStats {
  total_sessions: number;
  total_messages: number;
  total_tokens: number;
  last_activity: string;
}

export interface UserStatsResponse extends ApiResponse {
  stats: UserStats;
} 