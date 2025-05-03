-- Nova Project Database Schema
-- Optimized for Pinecone vector store and Supabase Storage
-- Last updated: May 2, 2025

-- Create Users Table (for extended user profiles beyond auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Projects Table (Enhanced)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    icon TEXT,
    color VARCHAR(20),
    model_config JSONB DEFAULT '{}'::jsonb,
    memory_type VARCHAR(50) DEFAULT 'default',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Documents Table (for tracking Supabase Storage files)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    storage_path TEXT NOT NULL,  -- Path in Supabase Storage
    storage_bucket VARCHAR(255) NOT NULL, -- Bucket name in Supabase Storage
    file_type VARCHAR(100),
    file_size BIGINT,
    status VARCHAR(50) DEFAULT 'processing', -- 'processing', 'indexed', 'failed'
    processing_error TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Document Chunks Table (for tracking chunks in Pinecone)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL, -- Store actual content for retrieval
    tokens INTEGER,
    pinecone_id TEXT NOT NULL, -- ID in Pinecone vector store
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Chat Sessions Table (chat history grouping)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title VARCHAR(255),
    summary TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    model_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Chat Messages Table (Enhanced)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    tokens INTEGER,
    pinecone_id TEXT, -- ID in Pinecone if message is indexed (for semantic search)
    is_pinned BOOLEAN DEFAULT FALSE,
    reactions JSONB DEFAULT '{}'::jsonb,
    references JSONB DEFAULT '[]'::jsonb, -- document sources/citations
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Shared Objects Table (for collaborative features)
CREATE TABLE IF NOT EXISTS shared_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_type VARCHAR(50) NOT NULL, -- 'project', 'document', 'session'
    object_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    shared_with UUID NOT NULL REFERENCES auth.users(id),
    permission_level VARCHAR(50) NOT NULL DEFAULT 'read', -- 'read', 'write', 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(object_type, object_id, shared_with)
);

-- Create AI Agents Table (for custom bots/agents)
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    system_prompt TEXT NOT NULL,
    model_config JSONB DEFAULT '{}'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Agent Skills Table (for agent capabilities)
CREATE TABLE IF NOT EXISTS agent_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    skill_type VARCHAR(50) NOT NULL, -- 'tool', 'capability', 'integration'
    parameters JSONB DEFAULT '{}'::jsonb,
    code TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Project Agent Assignments
CREATE TABLE IF NOT EXISTS project_agents (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, agent_id)
);

-- Create Usage Stats & Analytics
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_tokens BIGINT DEFAULT 0,
    prompt_tokens BIGINT DEFAULT 0,
    completion_tokens BIGINT DEFAULT 0,
    total_embeddings BIGINT DEFAULT 0,
    total_documents BIGINT DEFAULT 0,
    storage_bytes_used BIGINT DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    costs JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Create Scheduled Tasks Table (for background jobs)
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    params JSONB DEFAULT '{}'::jsonb,
    result JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create Webhooks & Integrations
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    integration_type VARCHAR(100) NOT NULL, -- 'slack', 'discord', 'notion', etc.
    name VARCHAR(255) NOT NULL,
    config JSONB NOT NULL,
    auth_data JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create GIN index on JSONB columns for performance
CREATE INDEX IF NOT EXISTS idx_project_config ON projects USING GIN (model_config);
CREATE INDEX IF NOT EXISTS idx_document_metadata ON documents USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_message_metadata ON chat_messages USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_message_references ON chat_messages USING GIN (references);
CREATE INDEX IF NOT EXISTS idx_agent_skills ON ai_agents USING GIN (skills);

-- Other indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_pinecone_id ON document_chunks(pinecone_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_project_id ON chat_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_pinecone_id ON chat_messages(pinecone_id);
CREATE INDEX IF NOT EXISTS idx_shared_objects_object_id ON shared_objects(object_id);
CREATE INDEX IF NOT EXISTS idx_shared_objects_user_id ON shared_objects(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_objects_shared_with ON shared_objects(shared_with);
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id_date ON user_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_type ON scheduled_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(integration_type);

-- Add RLS policies for all tables

-- Projects RLS policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS projects_select_policy ON projects;
CREATE POLICY projects_select_policy ON projects 
FOR SELECT 
USING (is_public OR auth.uid() = user_id OR auth.uid() IN (
    SELECT shared_with FROM shared_objects 
    WHERE object_type = 'project' AND object_id = projects.id
));
DROP POLICY IF EXISTS projects_insert_policy ON projects;
CREATE POLICY projects_insert_policy ON projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS projects_update_policy ON projects;
CREATE POLICY projects_update_policy ON projects 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT shared_with FROM shared_objects 
    WHERE object_type = 'project' AND object_id = projects.id AND permission_level IN ('write', 'admin')
));
DROP POLICY IF EXISTS projects_delete_policy ON projects;
CREATE POLICY projects_delete_policy ON projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Documents RLS policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS documents_select_policy ON documents;
CREATE POLICY documents_select_policy ON documents 
FOR SELECT 
USING (
    auth.uid() = user_id 
    OR 
    project_id IN (SELECT id FROM projects WHERE is_public = true)
    OR
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR
    auth.uid() IN (
        SELECT shared_with FROM shared_objects 
        WHERE (object_type = 'document' AND object_id = documents.id)
        OR (object_type = 'project' AND object_id = documents.project_id)
    )
);
DROP POLICY IF EXISTS documents_insert_policy ON documents;
CREATE POLICY documents_insert_policy ON documents 
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id 
    OR 
    project_id IN (
        SELECT object_id FROM shared_objects 
        WHERE object_type = 'project' 
        AND shared_with = auth.uid() 
        AND permission_level IN ('write', 'admin')
    )
);
DROP POLICY IF EXISTS documents_update_policy ON documents;
CREATE POLICY documents_update_policy ON documents 
FOR UPDATE 
USING (
    auth.uid() = user_id 
    OR 
    project_id IN (
        SELECT object_id FROM shared_objects 
        WHERE object_type = 'project' 
        AND shared_with = auth.uid() 
        AND permission_level IN ('write', 'admin')
    )
);
DROP POLICY IF EXISTS documents_delete_policy ON documents;
CREATE POLICY documents_delete_policy ON documents 
FOR DELETE 
USING (
    auth.uid() = user_id 
    OR 
    project_id IN (
        SELECT object_id FROM shared_objects 
        WHERE object_type = 'project' 
        AND shared_with = auth.uid() 
        AND permission_level = 'admin'
    )
);

-- Chat Messages RLS policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chat_messages_select_policy ON chat_messages;
CREATE POLICY chat_messages_select_policy ON chat_messages 
FOR SELECT 
USING (
    auth.uid() = user_id 
    OR 
    project_id IN (SELECT id FROM projects WHERE is_public = true)
    OR
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR
    auth.uid() IN (
        SELECT shared_with FROM shared_objects 
        WHERE (object_type = 'session' AND object_id = chat_messages.session_id)
        OR (object_type = 'project' AND object_id = chat_messages.project_id)
    )
);
DROP POLICY IF EXISTS chat_messages_insert_policy ON chat_messages;
CREATE POLICY chat_messages_insert_policy ON chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS chat_messages_update_policy ON chat_messages;
CREATE POLICY chat_messages_update_policy ON chat_messages 
FOR UPDATE 
USING (auth.uid() = user_id);
DROP POLICY IF EXISTS chat_messages_delete_policy ON chat_messages;
CREATE POLICY chat_messages_delete_policy ON chat_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add RLS for other tables 
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Example basic policies for remaining tables
CREATE POLICY user_profiles_select ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY user_profiles_insert ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY user_profiles_update ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY user_profiles_delete ON user_profiles FOR DELETE USING (auth.uid() = id);

-- Storage triggers for document cleanup (when documents are deleted)
CREATE OR REPLACE FUNCTION delete_storage_object()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be implemented with appropriate Supabase Storage API calls
    -- from your application code since PL/pgSQL can't directly call Storage APIs
    -- Just tracking the deletion need in audit log for now
    INSERT INTO scheduled_tasks (task_type, params)
    VALUES ('delete_storage_file', jsonb_build_object('bucket', OLD.storage_bucket, 'path', OLD.storage_path));
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_document_delete
BEFORE DELETE ON documents
FOR EACH ROW
EXECUTE FUNCTION delete_storage_object();

-- Function to handle document status updates
CREATE OR REPLACE FUNCTION update_document_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'indexed' AND OLD.status = 'processing' THEN
        -- Could trigger notifications or other actions
        INSERT INTO scheduled_tasks (task_type, params, status)
        VALUES ('notify_document_ready', jsonb_build_object('document_id', NEW.id, 'user_id', NEW.user_id), 'pending');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_document_status_change
AFTER UPDATE OF status ON documents
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_document_status(); 