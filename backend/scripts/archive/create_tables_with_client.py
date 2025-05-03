#!/usr/bin/env python3
"""
Database setup script that uses the Supabase REST API to create the necessary tables.
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


def setup_database():
    """Create all necessary database tables and policies."""
    try:
        # Set up headers for Supabase API requests
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

        # Create the exec_sql function if it doesn't exist
        create_function_sql = """
        CREATE OR REPLACE FUNCTION exec_sql(query text) RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER -- Run with privileges of the function creator
        AS $$
        BEGIN
            EXECUTE query;
            RETURN true;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Error executing SQL: %', SQLERRM;
                RETURN false;
        END;
        $$;
        """

        # SQL statements for our tables and policies

        # 1. Create Projects Table
        projects_table_sql = """
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

        # 2. Create Chat Messages Table
        chat_messages_table_sql = """
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
        
        ALTER TABLE chat_messages 
        ADD CONSTRAINT IF NOT EXISTS fk_chat_messages_project_id 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
        """

        # 3. Setup RLS Policies
        rls_policies_sql = """
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
        
        ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS projects_select_policy ON projects;
        CREATE POLICY projects_select_policy ON projects 
        FOR SELECT 
        USING (is_public OR auth.uid() = user_id);
        
        DROP POLICY IF EXISTS projects_insert_policy ON projects;
        CREATE POLICY projects_insert_policy ON projects 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS projects_update_policy ON projects;
        CREATE POLICY projects_update_policy ON projects 
        FOR UPDATE 
        USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS projects_delete_policy ON projects;
        CREATE POLICY projects_delete_policy ON projects 
        FOR DELETE 
        USING (auth.uid() = user_id);
        """

        # Try different approaches to create tables

        # Approach 1: Using SQL API with a single statement
        logger.info("Trying approach 1: Using SQL API...")
        try:
            # Combine all SQL statements
            all_sql = projects_table_sql + chat_messages_table_sql + rls_policies_sql

            # Use the direct SQL query endpoint
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/",
                headers={
                    **headers,
                    "Content-Type": "text/plain",
                    "Prefer": "return=minimal",
                },
                data=all_sql,
            )

            if response.status_code < 300:
                logger.info(
                    "✅ Successfully created all tables and policies with approach 1!"
                )
                return True
            else:
                logger.warning(
                    f"⚠️ Approach 1 failed: {response.status_code} - {response.text}"
                )
        except Exception as e:
            logger.warning(f"⚠️ Approach 1 failed: {str(e)}")

        # Approach 2: Using SQL API with separate statements
        logger.info("Trying approach 2: Using SQL API with separate statements...")
        try:
            success = True
            for name, sql in [
                ("Projects table", projects_table_sql),
                ("Chat messages table", chat_messages_table_sql),
                ("RLS policies", rls_policies_sql),
            ]:
                response = requests.post(
                    f"{SUPABASE_URL}/rest/v1/",
                    headers={
                        **headers,
                        "Content-Type": "text/plain",
                        "Prefer": "return=minimal",
                    },
                    data=sql,
                )

                if response.status_code < 300:
                    logger.info(f"✅ Successfully created {name} with approach 2")
                else:
                    logger.warning(
                        f"⚠️ Failed to create {name} with approach 2: {response.status_code} - {response.text}"
                    )
                    success = False

            if success:
                logger.info(
                    "✅ All tables and policies created successfully with approach 2!"
                )
                return True
            else:
                logger.warning("⚠️ Approach 2 partially failed.")
        except Exception as e:
            logger.warning(f"⚠️ Approach 2 failed: {str(e)}")

        # Approach 3: Using SQL API with pg role
        logger.info("Trying approach 3: Using SQL API with pg role...")
        pg_headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "X-Postgres-Role": "postgres",  # Request execution as postgres role
        }

        try:
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/",
                headers={
                    **pg_headers,
                    "Content-Type": "text/plain",
                    "Prefer": "return=minimal",
                },
                data=projects_table_sql + chat_messages_table_sql + rls_policies_sql,
            )

            if response.status_code < 300:
                logger.info(
                    "✅ Successfully created all tables and policies with approach 3!"
                )
                return True
            else:
                logger.warning(
                    f"⚠️ Approach 3 failed: {response.status_code} - {response.text}"
                )
        except Exception as e:
            logger.warning(f"⚠️ Approach 3 failed: {str(e)}")

        # Approach 4: Create an SQL function first, then use it to execute our SQL
        logger.info("Trying approach 4: Using RPC function...")
        try:
            # First try to create the exec_sql function
            function_response = requests.post(
                f"{SUPABASE_URL}/rest/v1/",
                headers={
                    **pg_headers,
                    "Content-Type": "text/plain",
                    "Prefer": "return=minimal",
                },
                data=create_function_sql,
            )

            if function_response.status_code >= 300:
                logger.warning(
                    f"⚠️ Failed to create function: {function_response.status_code} - {function_response.text}"
                )
            else:
                logger.info("✅ Successfully created exec_sql function")

            # Now try to use the function to create our tables
            success = True
            for name, sql in [
                ("Projects table", projects_table_sql),
                ("Chat messages table", chat_messages_table_sql),
                ("RLS policies", rls_policies_sql),
            ]:
                response = requests.post(
                    f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
                    headers=headers,
                    json={"query": sql},
                )

                if response.status_code < 300:
                    logger.info(f"✅ Successfully created {name} with approach 4")
                else:
                    logger.warning(
                        f"⚠️ Failed to create {name} with approach 4: {response.status_code} - {response.text}"
                    )
                    success = False

            if success:
                logger.info(
                    "✅ All tables and policies created successfully with approach 4!"
                )
                return True
            else:
                logger.warning("⚠️ Approach 4 partially failed.")
        except Exception as e:
            logger.warning(f"⚠️ Approach 4 failed: {str(e)}")

        # If we get here, let's check if the tables got created anyway
        try:
            # Check if the chat_messages table exists by making a simple query
            check_response = requests.get(
                f"{SUPABASE_URL}/rest/v1/chat_messages?limit=1", headers=headers
            )

            if check_response.status_code < 300:
                logger.info("✅ Verified that chat_messages table exists!")
                return True
            else:
                logger.error("❌ Could not verify chat_messages table exists.")
                return False
        except Exception as e:
            logger.error(f"❌ Failed to verify if tables exist: {str(e)}")
            return False

    except Exception as e:
        logger.error(f"❌ Database setup failed: {str(e)}")
        return False


def main():
    """Main function to set up database tables."""
    logger.info("Setting up database tables in Supabase")

    success = setup_database()

    if success:
        logger.info("✅ Database setup completed")
        return 0
    else:
        logger.error("❌ Database setup failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
