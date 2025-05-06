#!/usr/bin/env python3
"""
Supabase Tables Verification Script

This script checks if the required tables exist in Supabase and
attempts to create them if they don't exist. It's helpful for
initial setup or debugging when tables are missing.
"""

import os
import sys
import logging
import json
import requests
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables from different possible locations
env_files = [
    ".env",
    "../.env",
    "backend/.env",
]

for env_file in env_files:
    if os.path.exists(env_file):
        logger.info(f"Loading environment variables from {env_file}")
        load_dotenv(env_file)
        break

# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    logger.error("Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

logger.info(f"Using Supabase URL: {SUPABASE_URL}")

# Standard headers for Supabase REST API
headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
    "X-Client-Info": "service_role"  # Important for bypassing RLS
}

def test_connection():
    """Test connection to Supabase with service role key"""
    logger.info("Testing connection to Supabase...")
    try:
        response = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
        
        logger.info(f"Connection status: {response.status_code}")
        logger.info(f"Response: {response.text}")
        
        if response.status_code == 200:
            logger.info("✅ Successfully connected to Supabase REST API")
            return True
        else:
            logger.error(f"❌ Failed to connect to Supabase: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error connecting to Supabase: {str(e)}")
        return False

def check_table(table_name, schema="public"):
    """Check if a table exists in the given schema"""
    logger.info(f"Checking if table '{schema}.{table_name}' exists...")
    
    # Try different formats for the table
    table_formats = [
        f"{table_name}",  # No schema
        f"{schema}.{table_name}",  # With schema
    ]
    
    table_exists = False
    
    for table_format in table_formats:
        try:
            # Use HEAD request to check if table exists
            url = f"{SUPABASE_URL}/rest/v1/{table_format}"
            response = requests.head(url, headers=headers)
            
            if response.status_code == 200:
                logger.info(f"✅ Table '{table_format}' exists!")
                table_exists = True
                break
                
            # Try a GET request with limit=0 as backup
            params = {"limit": 0}
            response = requests.get(url, headers=headers, params=params)
            
            if response.status_code == 200:
                logger.info(f"✅ Table '{table_format}' exists! (verified with GET)")
                table_exists = True
                break
                
            logger.warning(f"❌ Table '{table_format}' returned status {response.status_code}")
            
        except Exception as e:
            logger.error(f"Error checking table '{table_format}': {str(e)}")
    
    return table_exists

def create_required_tables():
    """Create required tables if they don't exist"""
    # Table definitions
    table_definitions = {
        "user_profiles": """
        CREATE TABLE IF NOT EXISTS public.user_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            display_name VARCHAR(255),
            avatar_url TEXT,
            bio TEXT,
            preferences JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """,
        "projects": """
        CREATE TABLE IF NOT EXISTS public.projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            user_id UUID NOT NULL,
            is_public BOOLEAN DEFAULT FALSE,
            icon TEXT,
            color VARCHAR(20),
            ai_config JSONB DEFAULT '{}'::jsonb,
            memory_type VARCHAR(50) DEFAULT 'default',
            tags TEXT[],
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """,
        "documents": """
        CREATE TABLE IF NOT EXISTS public.documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
            user_id UUID NOT NULL,
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
        """,
        "chat_sessions": """
        CREATE TABLE IF NOT EXISTS public.chat_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
            user_id UUID NOT NULL,
            title VARCHAR(255),
            summary TEXT,
            model_config JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """,
        "chat_messages": """
        CREATE TABLE IF NOT EXISTS public.chat_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
            project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
            user_id UUID NOT NULL,
            role VARCHAR(50) NOT NULL,
            content TEXT NOT NULL,
            tokens INTEGER,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
    }
    
    logger.info("Checking and creating required tables...")
    
    # Tables to check and create if needed
    required_tables = ["user_profiles", "projects", "documents", "chat_sessions", "chat_messages"]
    
    for table in required_tables:
        if not check_table(table):
            logger.warning(f"Table '{table}' does not exist, attempting to create it...")
            
            # Try to create the table using SQL API
            try:
                sql_query = table_definitions[table]
                
                # Using SQL API (assuming Supabase supports it)
                sql_url = f"{SUPABASE_URL}/rest/v1/rpc/execute_sql"
                payload = {
                    "sql": sql_query
                }
                
                response = requests.post(sql_url, headers=headers, json=payload)
                
                if response.status_code == 200 or response.status_code == 201:
                    logger.info(f"✅ Successfully created table '{table}'")
                else:
                    logger.error(f"❌ Failed to create table '{table}': {response.status_code} - {response.text}")
                    
                    # Output the SQL for manual execution
                    logger.info(f"\nManual SQL for '{table}':")
                    logger.info(sql_query)
                    
            except Exception as e:
                logger.error(f"❌ Error creating table '{table}': {str(e)}")
                
                # Output the SQL for manual execution
                logger.info(f"\nManual SQL for '{table}':")
                logger.info(table_definitions[table])
        
def main():
    """Main function to verify and set up Supabase tables"""
    logger.info("Starting Supabase tables verification...")
    
    # Test connection to Supabase
    if not test_connection():
        logger.error("Cannot proceed without connecting to Supabase.")
        sys.exit(1)
    
    # Create tables if needed
    create_required_tables()
    
    logger.info("Verification complete.")

if __name__ == "__main__":
    main() 