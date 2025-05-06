#!/usr/bin/env python3
"""
Database setup script for Nova project.
This script creates the required tables and RLS policies in Supabase.
"""

import os
import sys
import logging
import json
from dotenv import load_dotenv
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv("../.env")  # Look for .env in the project root

# Get Supabase URL and service role key
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    logger.error("Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

logger.info(f"Using Supabase URL: {SUPABASE_URL}")

def execute_sql(sql, description="SQL statement"):
    """Execute SQL on Supabase."""
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }
    
    logger.info(f"Executing {description}...")
    
    try:
        # First try with the SQL API
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/sql",
            headers=headers,
            json={"query": sql},
            timeout=30
        )
        
        if response.status_code == 200 or response.status_code == 201:
            logger.info(f"Successfully executed {description}")
            return True, response
            
        # If SQL API fails, try with the dashboard API
        logger.warning(f"SQL API failed ({response.status_code}), trying dashboard API...")
        
        dashboard_response = requests.post(
            f"{SUPABASE_URL}/rest/v1/sql",
            headers={**headers, "x-client-info": "dashboard"},
            json={"query": sql},
            timeout=30
        )
        
        if dashboard_response.status_code == 200 or dashboard_response.status_code == 201:
            logger.info(f"Successfully executed {description} with dashboard API")
            return True, dashboard_response
        
        # If all fails, log detailed error
        logger.error(f"Failed to execute {description}")
        logger.error(f"SQL API Response: {response.status_code} - {response.text}")
        logger.error(f"Dashboard API Response: {dashboard_response.status_code} - {dashboard_response.text}")
        return False, None
        
    except Exception as e:
        logger.error(f"Error executing {description}: {str(e)}")
        return False, None

def setup_database():
    """Set up the database by creating required tables and policies."""
    
    # Define the required tables
    user_profiles_table = """
    CREATE TABLE IF NOT EXISTS public.user_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        display_name VARCHAR(255),
        avatar_url TEXT,
        bio TEXT,
        preferences JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    projects_table = """
    CREATE TABLE IF NOT EXISTS public.projects (
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
    """
    
    documents_table = """
    CREATE TABLE IF NOT EXISTS public.documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
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
    """
    
    chat_sessions_table = """
    CREATE TABLE IF NOT EXISTS public.chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id),
        title VARCHAR(255),
        summary TEXT,
        model_config JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    chat_messages_table = """
    CREATE TABLE IF NOT EXISTS public.chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id),
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        tokens INTEGER,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    shared_objects_table = """
    CREATE TABLE IF NOT EXISTS public.shared_objects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        object_type VARCHAR(50) NOT NULL,
        object_id UUID NOT NULL,
        user_id UUID NOT NULL REFERENCES auth.users(id),
        shared_with UUID NOT NULL REFERENCES auth.users(id),
        permission_level VARCHAR(20) DEFAULT 'read',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(object_type, object_id, shared_with)
    );
    """
    
    # Define RLS policies
    enable_rls = """
    -- Enable RLS on all tables
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.shared_objects ENABLE ROW LEVEL SECURITY;
    """
    
    # Create policy for service_role to bypass RLS
    service_role_bypass = """
    -- Service role bypass policy for all tables
    CREATE POLICY IF NOT EXISTS service_role_bypass_user_profiles ON public.user_profiles FOR ALL TO service_role USING (true);
    CREATE POLICY IF NOT EXISTS service_role_bypass_projects ON public.projects FOR ALL TO service_role USING (true);
    CREATE POLICY IF NOT EXISTS service_role_bypass_documents ON public.documents FOR ALL TO service_role USING (true);
    CREATE POLICY IF NOT EXISTS service_role_bypass_chat_sessions ON public.chat_sessions FOR ALL TO service_role USING (true);
    CREATE POLICY IF NOT EXISTS service_role_bypass_chat_messages ON public.chat_messages FOR ALL TO service_role USING (true);
    CREATE POLICY IF NOT EXISTS service_role_bypass_shared_objects ON public.shared_objects FOR ALL TO service_role USING (true);
    """
    
    # User/Auth policies for regular operation
    user_policies = """
    -- User Profiles Policies
    CREATE POLICY IF NOT EXISTS user_profiles_select ON public.user_profiles 
        FOR SELECT USING (auth.uid() = id);

    CREATE POLICY IF NOT EXISTS user_profiles_insert ON public.user_profiles 
        FOR INSERT WITH CHECK (auth.uid() = id);

    CREATE POLICY IF NOT EXISTS user_profiles_update ON public.user_profiles 
        FOR UPDATE USING (auth.uid() = id);

    -- Projects Policies
    CREATE POLICY IF NOT EXISTS projects_select_own ON public.projects 
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS projects_select_public ON public.projects 
        FOR SELECT USING (is_public = true);

    CREATE POLICY IF NOT EXISTS projects_insert ON public.projects 
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS projects_update ON public.projects 
        FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY IF NOT EXISTS projects_delete ON public.projects 
        FOR DELETE USING (auth.uid() = user_id);
    """
    
    # Table creation status
    tables_created = True
    
    # Execute table creation statements
    if not execute_sql(user_profiles_table, "user_profiles table creation")[0]:
        tables_created = False
    if not execute_sql(projects_table, "projects table creation")[0]:
        tables_created = False
    if not execute_sql(documents_table, "documents table creation")[0]:
        tables_created = False
    if not execute_sql(chat_sessions_table, "chat_sessions table creation")[0]:
        tables_created = False
    if not execute_sql(chat_messages_table, "chat_messages table creation")[0]:
        tables_created = False
    if not execute_sql(shared_objects_table, "shared_objects table creation")[0]:
        tables_created = False
    
    # Execute RLS statements
    execute_sql(enable_rls, "enabling RLS")
    execute_sql(service_role_bypass, "setting up service_role bypass")
    execute_sql(user_policies, "setting up user policies")
    
    return tables_created

if __name__ == "__main__":
    logger.info("Setting up Nova database tables...")
    if setup_database():
        logger.info("✅ Database setup completed successfully")
        sys.exit(0)
    else:
        logger.error("❌ Database setup failed")
        sys.exit(1) 