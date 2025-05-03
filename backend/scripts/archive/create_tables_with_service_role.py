#!/usr/bin/env python3
"""
Database setup script that uses Supabase service role key.
"""

import os
import sys
import logging
from dotenv import load_dotenv
import requests
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get Supabase URL and service role key
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    logger.error(
        "Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    )
    sys.exit(1)

logger.info(f"Using Supabase URL: {SUPABASE_URL}")


# Create tables using REST API
def create_tables():
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    # Projects table SQL
    projects_sql = """
    CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        user_id VARCHAR(255) NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    """

    # Chat messages table SQL
    chat_messages_sql = """
    CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY,
        project_id UUID NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL, 
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSON
    );
    
    CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
    
    ALTER TABLE chat_messages ADD CONSTRAINT IF NOT EXISTS fk_chat_messages_project_id 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    """

    # RLS policies
    rls_policies = """
    ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY IF NOT EXISTS chat_messages_select_policy ON chat_messages 
    FOR SELECT 
    USING (
      auth.uid() = user_id 
      OR 
      project_id IN (SELECT id FROM projects WHERE is_public = true)
      OR
      project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );
    
    CREATE POLICY IF NOT EXISTS chat_messages_insert_policy ON chat_messages 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY IF NOT EXISTS chat_messages_update_policy ON chat_messages 
    FOR UPDATE 
    USING (auth.uid() = user_id);
    
    CREATE POLICY IF NOT EXISTS chat_messages_delete_policy ON chat_messages 
    FOR DELETE 
    USING (auth.uid() = user_id);
    
    ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY IF NOT EXISTS projects_select_policy ON projects 
    FOR SELECT 
    USING (is_public OR auth.uid() = user_id);
    
    CREATE POLICY IF NOT EXISTS projects_insert_policy ON projects 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY IF NOT EXISTS projects_update_policy ON projects 
    FOR UPDATE 
    USING (auth.uid() = user_id);
    
    CREATE POLICY IF NOT EXISTS projects_delete_policy ON projects 
    FOR DELETE 
    USING (auth.uid() = user_id);
    """

    endpoint = f"{SUPABASE_URL}/rest/v1/rpc/execute_sql"

    # Execute SQL statements
    for name, sql in [
        ("Projects table", projects_sql),
        ("Chat messages table", chat_messages_sql),
        ("RLS policies", rls_policies),
    ]:
        try:
            payload = {"query": sql}

            response = requests.post(endpoint, headers=headers, json=payload)

            if response.status_code == 200:
                logger.info(f"✅ Successfully created {name}")
            else:
                logger.error(
                    f"❌ Failed to create {name}: {response.status_code} - {response.text}"
                )

        except Exception as e:
            logger.error(f"Error executing SQL for {name}: {str(e)}")
            return False

    return True


def main():
    logger.info("Creating database tables using Supabase service role key")

    if create_tables():
        logger.info("✅ Database setup completed successfully")
        return 0
    else:
        logger.error("❌ Database setup failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
