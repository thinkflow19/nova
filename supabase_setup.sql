-- ================================================
-- NOVA DATABASE SETUP SCRIPT FOR SUPABASE
-- ================================================

-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- Create SQL Function for the init_db.py script
-- ================================================
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE query;
END;
$$;

-- ================================================
-- 1. Users Table
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    plan VARCHAR NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 2. Projects (Bots) Table
-- ================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    project_name VARCHAR NOT NULL,
    embed_code TEXT,
    branding_color VARCHAR NOT NULL DEFAULT '#6366F1',
    tone VARCHAR NOT NULL DEFAULT 'friendly',
    status VARCHAR NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 3. Documents Table
-- ================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    file_name VARCHAR NOT NULL,
    file_url TEXT NOT NULL,
    file_key VARCHAR NOT NULL,
    embedding_id TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 4. Chat History Table
-- ================================================
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    user_query TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- Create Row Level Security Policies
-- ================================================

-- Users table RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_policy ON users
    USING (id = auth.uid());

-- Projects table RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_policy ON projects
    USING (user_id = auth.uid());

-- Documents table RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_policy ON documents
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Chat history table RLS
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_history_policy ON chat_history
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- ================================================
-- Add indexes for better performance
-- ================================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_project_id ON chat_history(project_id);

-- ================================================
-- Grant necessary permissions
-- ================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_history TO authenticated;

-- ================================================
-- Create an example user for testing (optional)
-- ================================================
-- Password: test123 (bcrypt hash)
INSERT INTO users (email, password_hash)
VALUES ('test@example.com', '$2b$12$GNPUcDAIE4jJwNGK7kR9PewpkfUYQbHO7wAaC9YEjh1iZYbfXNJHm')
ON CONFLICT (email) DO NOTHING; 