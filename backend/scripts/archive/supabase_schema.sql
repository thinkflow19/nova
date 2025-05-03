-- Nova Project Database Schema - Optimized for RAG
-- Separates Supabase (relational data) and Pinecone (vector embeddings) concerns

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

-- Create Projects Table 
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

-- Create Documents Table (metadata only, content stored in Pinecone)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    storage_path TEXT NOT NULL,
    storage_bucket VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    status VARCHAR(50) DEFAULT 'processing',
    processing_error TEXT,
    pinecone_namespace TEXT,
    chunk_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Chat Sessions Table
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

-- Create Chat Messages Table (minimal retrieval data, search via Pinecone)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    tokens INTEGER,
    is_indexed BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    reactions JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Shared Objects Table
CREATE TABLE IF NOT EXISTS shared_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_type VARCHAR(50) NOT NULL,
    object_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    shared_with UUID NOT NULL REFERENCES auth.users(id),
    permission_level VARCHAR(50) NOT NULL DEFAULT 'read',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(object_type, object_id, shared_with)
);

-- Create AI Agents Table
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

-- Create Agent Skills Table
CREATE TABLE IF NOT EXISTS agent_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    skill_type VARCHAR(50) NOT NULL,
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
    status VARCHAR(50) DEFAULT 'pending',
    params JSONB DEFAULT '{}'::jsonb,
    result JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create Integration Table (for webhooks & external connections)
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    integration_type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    config JSONB NOT NULL,
    auth_data JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Pinecone Index Tracking Table (to track what's in Pinecone)
CREATE TABLE IF NOT EXISTS pinecone_indexes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    index_name VARCHAR(255) NOT NULL,
    namespace VARCHAR(255) NOT NULL,
    vector_count INTEGER DEFAULT 0,
    dimension INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(index_name, namespace)
);

-- Now that all tables are created, we can create the indexes
CREATE INDEX IF NOT EXISTS idx_project_config ON projects USING GIN (model_config);
CREATE INDEX IF NOT EXISTS idx_document_metadata ON documents USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_message_metadata ON chat_messages USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_agent_skills ON ai_agents USING GIN (skills);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_namespace ON documents(pinecone_namespace);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_project_id ON chat_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_indexed ON chat_messages(is_indexed);
CREATE INDEX IF NOT EXISTS idx_shared_objects_object_id ON shared_objects(object_id);
CREATE INDEX IF NOT EXISTS idx_shared_objects_user_id ON shared_objects(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_objects_shared_with ON shared_objects(shared_with);
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id_date ON user_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_type ON scheduled_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_pinecone_indexes_name ON pinecone_indexes(index_name);

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

-- Enable RLS for other tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinecone_indexes ENABLE ROW LEVEL SECURITY;

-- Basic policies for other tables (add more specific ones as needed)
CREATE POLICY user_profiles_select ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY user_profiles_insert ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY user_profiles_update ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY user_profiles_delete ON user_profiles FOR DELETE USING (auth.uid() = id);

-- Storage triggers for document cleanup (when documents are deleted, schedule Pinecone cleanup)
CREATE OR REPLACE FUNCTION delete_document_data()
RETURNS TRIGGER AS $$
BEGIN
    -- When a document is deleted, schedule a task to clean up Pinecone vectors
    INSERT INTO scheduled_tasks (task_type, params)
    VALUES ('delete_from_pinecone', jsonb_build_object(
        'namespace', OLD.pinecone_namespace,
        'document_id', OLD.id,
        'storage_bucket', OLD.storage_bucket, 
        'storage_path', OLD.storage_path
    ));
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_document_delete
BEFORE DELETE ON documents
FOR EACH ROW
EXECUTE FUNCTION delete_document_data();

-- Function to handle document status updates
CREATE OR REPLACE FUNCTION update_document_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'indexed' AND OLD.status = 'processing' THEN
        -- Notify when a document has been successfully indexed
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