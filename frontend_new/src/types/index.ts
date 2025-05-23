import { z, type ZodTypeAny } from 'zod';

export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export const ProjectSchema: ZodTypeAny = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  user_id: z.string().optional(),
  status: z.enum(['active', 'archived', 'deleted']).optional(),
  is_public: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
  color: z.string().optional(),
  icon: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  stats: z.object({
    session_count: z.number().optional(),
    document_count: z.number().optional(),
  }).optional(),
  sessions: z.array(z.lazy<ZodTypeAny>(() => ChatSessionSchema)).optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const ChatSessionSchema: ZodTypeAny = z.object({
  id: z.string(),
  title: z.string(),
  project_id: z.string(),
  user_id: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  status: z.enum(['active', 'archived', 'deleted']).optional(),
  metadata: z.record(z.any()).optional(),
  message_count: z.number().optional(),
}).extend({
  project: ProjectSchema.optional(),
  last_message: z.string().optional(),
});

export type ChatSession = z.infer<typeof ChatSessionSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  session_id: z.string(),
  content: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  created_at: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const DocumentSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  file_type: z.string(),
  file_size: z.number(),
  status: z.enum(['pending', 'processing', 'ready', 'error']),
  created_at: z.string(),
  updated_at: z.string(),
  metadata: z.record(z.any()).optional(),
  user_id: z.string().optional(),
  filename: z.string().optional(),
  content_type: z.string().optional(),
  size: z.number().optional(),
}).extend({
  chunk_count: z.number().optional(),
  processing_error: z.string().optional(),
});

export type Document = z.infer<typeof DocumentSchema>; 