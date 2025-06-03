// User types
export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
  role?: string;
  preferences?: Record<string, any>;
}

export interface UserProfile {
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  preferences?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  expires_in: number;
  refresh_token?: string;
}

// Project types
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  icon?: string;
  color?: string;
  ai_config?: Record<string, any>;
  memory_type?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  is_public?: boolean;
  icon?: string;
  color?: string;
  ai_config?: Record<string, any>;
  memory_type?: string;
  tags?: string[];
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  is_public?: boolean;
  icon?: string;
  color?: string;
  ai_config?: Record<string, any>;
  memory_type?: string;
  tags?: string[];
}

// Agent types
export interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  capabilities: string[];
  model: string;
  status: 'available' | 'coming_soon' | 'beta';
  icon: string;
  color: string;
  autonomous?: boolean;
}

// Chat types
export interface ChatSession {
  id: string;
  project_id: string;
  user_id: string;
  title?: string;
  summary?: string;
  is_pinned: boolean;
  ai_config?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionCreate {
  project_id: string;
  title?: string;
  summary?: string;
  is_pinned?: boolean;
  ai_config?: Record<string, any>;
}

export interface ChatSessionUpdate {
  title?: string;
  summary?: string;
  is_pinned?: boolean;
  ai_config?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  project_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  is_indexed: boolean;
  is_pinned: boolean;
  reactions?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ChatMessageCreate {
  session_id: string;
  project_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  is_indexed?: boolean;
  is_pinned?: boolean;
  reactions?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  session_id: string;
  project_id: string;
  stream?: boolean;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  completion: string;
  session_id: string;
  model?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// UI State types
export interface Theme {
  mode: 'light' | 'dark';
  primaryColor: string;
  accentColor: string;
}

export interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  loading: boolean;
  error?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  password: string;
  display_name?: string;
}

export interface ProjectForm {
  name: string;
  description?: string;
  is_public: boolean;
  icon?: string;
  color?: string;
  tags?: string[];
}

// Component props types
export interface BaseComponentProps {
  className?: string;
  children?: any;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends BaseComponentProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  step?: string | number;
  min?: string | number;
  max?: string | number;
  name?: string;
  id?: string;
}

// Animation types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface MotionVariants {
  initial: Record<string, any>;
  animate: Record<string, any>;
  exit?: Record<string, any>;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Navigation types
export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavItem[];
}

// Search types
export interface SearchResult {
  id: string;
  type: 'project' | 'session' | 'message';
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface SearchFilters {
  type?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
} 