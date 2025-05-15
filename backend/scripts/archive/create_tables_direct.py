#!/usr/bin/env python3
"""
Database setup script that connects directly to the Supabase PostgreSQL database.
"""

import os
import sys
import logging
from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

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

# Extract database connection information from the Supabase URL
# https://xxxxx.supabase.co -> db.xxxxx.supabase.co
if SUPABASE_URL.startswith("https://"):
    host_part = SUPABASE_URL[8:].split(".")[0]
    DB_HOST = f"db.{host_part}.supabase.co"
    DB_PORT = 5432
    DB_NAME = "postgres"
    DB_USER = "postgres"
    DB_PASSWORD = os.getenv("SUPABASE_POSTGRES_PASSWORD")

    if not DB_PASSWORD:
        # Try to use service role key as password (not recommended but might work in some setups)
        DB_PASSWORD = SUPABASE_SERVICE_ROLE_KEY
        logger.warning(
            "SUPABASE_POSTGRES_PASSWORD not found, using service role key instead. This may not work."
        )


def connect_to_db():
    """Connect to the PostgreSQL database."""
    try:
        logger.info(f"Connecting to PostgreSQL at {DB_HOST}:{DB_PORT}/{DB_NAME}")
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        return conn
    except Exception as e:
        logger.error(f"PostgreSQL connection error: {str(e)}")
        raise


def execute_sql(conn, sql, description):
    """Execute a SQL statement and log the result."""
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        logger.info(f"✅ Successfully executed: {description}")
        return True
    except Exception as e:
        error_text = str(e).lower()
        if "duplicate" in error_text or "already exists" in error_text:
            logger.warning(f"Object already exists, continuing: {error_text}")
            return True
        logger.error(f"❌ Error executing {description}: {str(e)}")
        return False
    finally:
        cursor.close()


def create_tables(conn):
    """Create the necessary tables and indexes."""
    # Projects table
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
    """
    success = execute_sql(conn, projects_sql, "Projects table")

    # Projects indexes
    projects_index_sql = """
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    """
    success = success and execute_sql(conn, projects_index_sql, "Projects indexes")

    # Chat messages table
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
    """
    success = success and execute_sql(conn, chat_messages_sql, "Chat messages table")

    # Chat messages indexes
    chat_messages_indexes_sql = """
    CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
    """
    success = success and execute_sql(
        conn, chat_messages_indexes_sql, "Chat messages indexes"
    )

    # Foreign keys
    foreign_keys_sql = """
    ALTER TABLE chat_messages 
    ADD CONSTRAINT IF NOT EXISTS fk_chat_messages_project_id 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    """
    success = success and execute_sql(conn, foreign_keys_sql, "Foreign keys")

    # Row Level Security
    rls_chat_messages_sql = """
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
    """
    success = success and execute_sql(conn, rls_chat_messages_sql, "Chat messages RLS")

    # Row Level Security for projects
    rls_projects_sql = """
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
    success = success and execute_sql(conn, rls_projects_sql, "Projects RLS")

    return success


def main():
    """Main function to create database tables."""
    logger.info("Creating database tables in Supabase PostgreSQL")

    try:
        conn = connect_to_db()
        success = create_tables(conn)
        conn.close()

        if success:
            logger.info("✅ Database setup completed successfully")
            return 0
        else:
            logger.error("❌ Database setup had some issues")
            return 1
    except Exception as e:
        logger.error(f"❌ Database setup failed: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
