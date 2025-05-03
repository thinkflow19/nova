#!/usr/bin/env python3
"""
Nova Project - Create Database Tables Script

This script connects to Supabase and creates all tables needed for the Nova project.
It uses the Supabase PostgreSQL connection to execute the SQL commands.

Requirements:
- A Supabase project with the proper credentials
- Environment variables set for SUPABASE_URL and SUPABASE_SERVICE_KEY

Usage:
python create_nova_tables.py
"""

import os
import sys
import time
from datetime import datetime
from dotenv import load_dotenv
import requests
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Load environment variables from .env file
load_dotenv()

# Get Supabase credentials from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print(
        "Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables or .env file"
    )
    sys.exit(1)

# Extract host and database information from Supabase URL
# Example: https://project-ref.supabase.co
project_ref = SUPABASE_URL.split("//")[1].split(".")[0]
host = f"{project_ref}.supabase.co"
database = "postgres"
user = "postgres"
port = 5432


# Function to get database connection information from Supabase
def get_db_connection_info():
    endpoint = f"{SUPABASE_URL}/rest/v1/"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    }

    try:
        response = requests.get(endpoint, headers=headers)
        if response.status_code == 200:
            print("Successfully connected to Supabase API")
            return True
        else:
            print(
                f"Error connecting to Supabase API: {response.status_code} {response.text}"
            )
            return False
    except Exception as e:
        print(f"Exception while connecting to Supabase: {e}")
        return False


# Function to create database connection
def create_db_connection():
    try:
        # Verify API connection first
        if not get_db_connection_info():
            print("Could not verify Supabase API connection. Exiting.")
            return None

        # Try to connect using direct PostgreSQL connection
        conn = psycopg2.connect(
            host=host, database=database, user=user, password=DB_PASSWORD, port=port
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        print("Successfully connected to PostgreSQL database")
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None


# All SQL commands to create the Nova database schema
SQL_COMMANDS = [
    # Users Table
    """
    CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        display_name VARCHAR(255),
        avatar_url TEXT,
        bio TEXT,
        preferences JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """,
    # Projects Table
    """
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
    """,
    # Documents Table
    """
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
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """,
    # Document Chunks Table
    """
    CREATE TABLE IF NOT EXISTS document_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        tokens INTEGER,
        pinecone_id TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """,
    # Chat Sessions Table
    """
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
    """,
    # Chat Messages Table
    """
    CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id),
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        tokens INTEGER,
        pinecone_id TEXT,
        is_pinned BOOLEAN DEFAULT FALSE,
        reactions JSONB DEFAULT '{}'::jsonb,
        references JSONB DEFAULT '[]'::jsonb,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """,
    # Shared Objects Table
    """
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
    """,
    # AI Agents Table
    """
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
    """,
    # Agent Skills Table
    """
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
    """,
    # Project Agent Assignments
    """
    CREATE TABLE IF NOT EXISTS project_agents (
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (project_id, agent_id)
    );
    """,
    # Usage Stats & Analytics
    """
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
    """,
    # Scheduled Tasks Table
    """
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
    """,
    # Integrations Table
    """
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
    """,
]

# Indexes
INDEX_COMMANDS = [
    # GIN Indexes for JSONB
    "CREATE INDEX IF NOT EXISTS idx_project_config ON projects USING GIN (model_config);",
    "CREATE INDEX IF NOT EXISTS idx_document_metadata ON documents USING GIN (metadata);",
    "CREATE INDEX IF NOT EXISTS idx_message_metadata ON chat_messages USING GIN (metadata);",
    "CREATE INDEX IF NOT EXISTS idx_message_references ON chat_messages USING GIN (references);",
    "CREATE INDEX IF NOT EXISTS idx_agent_skills ON ai_agents USING GIN (skills);",
    # Other Performance Indexes
    "CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(id);",
    "CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);",
    "CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);",
    "CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);",
    "CREATE INDEX IF NOT EXISTS idx_document_chunks_pinecone_id ON document_chunks(pinecone_id);",
    "CREATE INDEX IF NOT EXISTS idx_chat_sessions_project_id ON chat_sessions(project_id);",
    "CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);",
    "CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);",
    "CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);",
    "CREATE INDEX IF NOT EXISTS idx_chat_messages_pinecone_id ON chat_messages(pinecone_id);",
    "CREATE INDEX IF NOT EXISTS idx_shared_objects_object_id ON shared_objects(object_id);",
    "CREATE INDEX IF NOT EXISTS idx_shared_objects_user_id ON shared_objects(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_shared_objects_shared_with ON shared_objects(shared_with);",
    "CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_user_usage_user_id_date ON user_usage(user_id, date);",
    "CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);",
    "CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_type ON scheduled_tasks(task_type);",
    "CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(integration_type);",
]

# RLS Policies
RLS_COMMANDS = [
    # Enable RLS on all tables
    "ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE projects ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE documents ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE shared_objects ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE project_agents ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;",
    # Projects policies
    """
    DROP POLICY IF EXISTS projects_select_policy ON projects;
    CREATE POLICY projects_select_policy ON projects 
    FOR SELECT 
    USING (is_public OR auth.uid() = user_id OR auth.uid() IN (
        SELECT shared_with FROM shared_objects 
        WHERE object_type = 'project' AND object_id = projects.id
    ));
    """,
    """
    DROP POLICY IF EXISTS projects_insert_policy ON projects;
    CREATE POLICY projects_insert_policy ON projects 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    """,
    """
    DROP POLICY IF EXISTS projects_update_policy ON projects;
    CREATE POLICY projects_update_policy ON projects 
    FOR UPDATE 
    USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT shared_with FROM shared_objects 
        WHERE object_type = 'project' AND object_id = projects.id AND permission_level IN ('write', 'admin')
    ));
    """,
    """
    DROP POLICY IF EXISTS projects_delete_policy ON projects;
    CREATE POLICY projects_delete_policy ON projects 
    FOR DELETE 
    USING (auth.uid() = user_id);
    """,
    # Documents policies
    """
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
    """,
    """
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
    """,
    """
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
    """,
    """
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
    """,
    # Chat messages policies
    """
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
    """,
    """
    DROP POLICY IF EXISTS chat_messages_insert_policy ON chat_messages;
    CREATE POLICY chat_messages_insert_policy ON chat_messages 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    """,
    """
    DROP POLICY IF EXISTS chat_messages_update_policy ON chat_messages;
    CREATE POLICY chat_messages_update_policy ON chat_messages 
    FOR UPDATE 
    USING (auth.uid() = user_id);
    """,
    """
    DROP POLICY IF EXISTS chat_messages_delete_policy ON chat_messages;
    CREATE POLICY chat_messages_delete_policy ON chat_messages 
    FOR DELETE 
    USING (auth.uid() = user_id);
    """,
    # Basic policies for user_profiles
    """
    CREATE POLICY user_profiles_select ON user_profiles FOR SELECT USING (auth.uid() = id);
    CREATE POLICY user_profiles_insert ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
    CREATE POLICY user_profiles_update ON user_profiles FOR UPDATE USING (auth.uid() = id);
    CREATE POLICY user_profiles_delete ON user_profiles FOR DELETE USING (auth.uid() = id);
    """,
]

# Triggers
TRIGGER_COMMANDS = [
    # Document storage cleanup trigger
    """
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
    """,
    # Document status update trigger
    """
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
    """,
]


def execute_commands(conn, commands, command_type):
    cursor = conn.cursor()
    success_count = 0
    error_count = 0

    print(f"\n=== Executing {command_type} Commands ===")
    for i, command in enumerate(commands):
        try:
            print(f"Executing {command_type} command {i+1}/{len(commands)}...")
            cursor.execute(command)
            success_count += 1
        except Exception as e:
            print(f"Error executing command: {e}")
            print(f"Command was: {command[:100]}...")
            error_count += 1

            # Continue with other commands even if some fail
            continue

    cursor.close()
    print(
        f"Completed {command_type} commands: {success_count} successful, {error_count} failed"
    )
    return success_count, error_count


def main():
    print(
        f"Nova Database Schema Creation - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )
    print(f"Connecting to Supabase project: {SUPABASE_URL}")

    # Connect to the database
    conn = create_db_connection()
    if not conn:
        print("Failed to connect to the database. Exiting.")
        sys.exit(1)

    try:
        # Execute all command groups with timing
        start_time = time.time()

        # 1. Create tables
        print("\n=== Creating Tables ===")
        table_success, table_errors = execute_commands(
            conn, SQL_COMMANDS, "Table Creation"
        )

        # 2. Create indexes
        print("\n=== Creating Indexes ===")
        index_success, index_errors = execute_commands(
            conn, INDEX_COMMANDS, "Index Creation"
        )

        # 3. Setup RLS policies
        print("\n=== Setting up RLS Policies ===")
        rls_success, rls_errors = execute_commands(conn, RLS_COMMANDS, "RLS Policy")

        # 4. Create triggers
        print("\n=== Creating Triggers ===")
        trigger_success, trigger_errors = execute_commands(
            conn, TRIGGER_COMMANDS, "Trigger"
        )

        end_time = time.time()
        duration = end_time - start_time

        # Summary
        print("\n=== Schema Creation Summary ===")
        print(f"Tables: {table_success} created, {table_errors} failed")
        print(f"Indexes: {index_success} created, {index_errors} failed")
        print(f"RLS Policies: {rls_success} created, {rls_errors} failed")
        print(f"Triggers: {trigger_success} created, {trigger_errors} failed")
        print(f"Total execution time: {duration:.2f} seconds")

        if (
            table_errors == 0
            and index_errors == 0
            and rls_errors == 0
            and trigger_errors == 0
        ):
            print(
                "\n🎉 Success! All database schema components were created successfully."
            )
        else:
            print(
                "\n⚠️ Schema creation completed with some errors. See above for details."
            )

    except Exception as e:
        print(f"An error occurred during schema creation: {e}")
    finally:
        # Close the connection
        if conn:
            conn.close()
            print("Database connection closed")


if __name__ == "__main__":
    main()
