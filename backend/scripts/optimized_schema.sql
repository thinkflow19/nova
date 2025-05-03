-- Python App Database Schema
-- Creates all tables, indexes, and policies for the Python application

-- ====================================
-- TABLES
-- ====================================

-- Create user profiles table (for extended user profiles beyond auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
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

-- Create documents table (metadata only, content stored in vector database)
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

-- Create chat sessions table
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

-- Create chat messages table
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

-- Create shared objects table
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

-- ====================================
-- INDEXES
-- ====================================

-- Gin indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_project_config ON projects USING GIN (model_config);
CREATE INDEX IF NOT EXISTS idx_document_metadata ON documents USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_message_metadata ON chat_messages USING GIN (metadata);

-- Regular indexes for foreign keys and common query fields
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
CREATE INDEX IF NOT EXISTS idx_shared_objects_object_id ON shared_objects(object_id);
CREATE INDEX IF NOT EXISTS idx_shared_objects_user_id ON shared_objects(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_objects_shared_with ON shared_objects(shared_with);

-- ====================================
-- ROW LEVEL SECURITY POLICIES
-- ====================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_objects ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY user_profiles_select ON user_profiles 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY user_profiles_insert ON user_profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY user_profiles_update ON user_profiles 
    FOR UPDATE USING (auth.uid() = id);

-- Projects Policies
CREATE POLICY projects_select_own ON projects 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY projects_select_public ON projects 
    FOR SELECT USING (is_public = true);

CREATE POLICY projects_select_shared ON projects 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shared_objects 
            WHERE object_type = 'project' 
            AND object_id = projects.id 
            AND shared_with = auth.uid()
        )
    );

CREATE POLICY projects_insert ON projects 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY projects_update ON projects 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY projects_delete ON projects 
    FOR DELETE USING (auth.uid() = user_id);

-- Documents Policies
CREATE POLICY documents_select_own ON documents 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY documents_select_shared ON documents 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = documents.project_id
            AND (
                projects.is_public = true
                OR EXISTS (
                    SELECT 1 FROM shared_objects 
                    WHERE object_type = 'project' 
                    AND object_id = projects.id 
                    AND shared_with = auth.uid()
                )
            )
        )
    );

CREATE POLICY documents_insert ON documents 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY documents_update_own ON documents 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY documents_delete_own ON documents 
    FOR DELETE USING (auth.uid() = user_id);

-- Chat Sessions Policies
CREATE POLICY chat_sessions_select_own ON chat_sessions 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY chat_sessions_select_shared ON chat_sessions 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = chat_sessions.project_id
            AND (
                projects.is_public = true
                OR EXISTS (
                    SELECT 1 FROM shared_objects 
                    WHERE object_type = 'project' 
                    AND object_id = projects.id 
                    AND shared_with = auth.uid()
                )
            )
        )
    );

CREATE POLICY chat_sessions_insert ON chat_sessions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY chat_sessions_update_own ON chat_sessions 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY chat_sessions_delete_own ON chat_sessions 
    FOR DELETE USING (auth.uid() = user_id);

-- Chat Messages Policies
CREATE POLICY chat_messages_select_own ON chat_messages 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY chat_messages_select_shared ON chat_messages 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_sessions 
            WHERE chat_sessions.id = chat_messages.session_id
            AND EXISTS (
                SELECT 1 FROM projects 
                WHERE projects.id = chat_sessions.project_id
                AND (
                    projects.is_public = true
                    OR EXISTS (
                        SELECT 1 FROM shared_objects 
                        WHERE object_type = 'project' 
                        AND object_id = projects.id 
                        AND shared_with = auth.uid()
                    )
                )
            )
        )
    );

CREATE POLICY chat_messages_insert ON chat_messages 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY chat_messages_update_own ON chat_messages 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY chat_messages_delete_own ON chat_messages 
    FOR DELETE USING (auth.uid() = user_id);

-- Shared Objects Policies
CREATE POLICY shared_objects_select_owner ON shared_objects 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY shared_objects_select_shared ON shared_objects 
    FOR SELECT USING (auth.uid() = shared_with);

CREATE POLICY shared_objects_insert ON shared_objects 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY shared_objects_update_owner ON shared_objects 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY shared_objects_delete_owner ON shared_objects 
    FOR DELETE USING (auth.uid() = user_id);

-- ====================================
-- TRIGGERS
-- ====================================

-- Create a function to update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with 'updated_at' column
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
BEFORE UPDATE ON chat_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_objects_updated_at
BEFORE UPDATE ON shared_objects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Document cleanup trigger
CREATE OR REPLACE FUNCTION delete_document_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Record deletion event for background processing
    -- This is a placeholder - in production, you'd insert a record into a queue table
    RAISE NOTICE 'Document % deleted, cleanup required for namespace: %', 
                 OLD.id, OLD.pinecone_namespace;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_document_delete
BEFORE DELETE ON documents
FOR EACH ROW
EXECUTE FUNCTION delete_document_data();

-- Document status change trigger
CREATE OR REPLACE FUNCTION update_document_status()
RETURNS TRIGGER AS $$
BEGIN
    -- You can add logic here to handle status changes
    -- For example, notify users or trigger additional processes
    
    -- Log the status change
    RAISE NOTICE 'Document % status changed from % to %', 
                 NEW.id, OLD.status, NEW.status;
                 
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_document_status_change
AFTER UPDATE OF status ON documents
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_document_status(); 