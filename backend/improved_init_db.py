#!/usr/bin/env python3
"""
Nova Database Initialization Script (Improved)
This script initializes the Supabase database with all required tables for Nova.
It connects to Supabase directly and creates the database schema.
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
import time
import json

# Load environment variables
load_dotenv()

# Supabase client configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print(
        "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file"
    )
    print("Please check your .env file and ensure these variables are set.")
    sys.exit(1)

try:
    print(f"🔄 Connecting to Supabase at {SUPABASE_URL}")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connected to Supabase successfully")
except Exception as e:
    print(f"❌ Error connecting to Supabase: {str(e)}")
    print("Please check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY values.")
    sys.exit(1)

# SQL queries to create tables
CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    plan VARCHAR NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS users_policy ON users USING (id = auth.uid());
"""

CREATE_PROJECTS_TABLE = """
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

-- Set up Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS projects_policy ON projects USING (user_id = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
"""

CREATE_DOCUMENTS_TABLE = """
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    file_name VARCHAR NOT NULL,
    file_url TEXT NOT NULL,
    file_key VARCHAR NOT NULL,
    embedding_id TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS documents_policy ON documents 
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
"""

CREATE_CHAT_HISTORY_TABLE = """
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    user_query TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS chat_history_policy ON chat_history
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_chat_history_project_id ON chat_history(project_id);
"""

# Grant permissions
GRANT_PERMISSIONS = """
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_history TO authenticated;
"""


# Check if a table exists
def check_table_exists(table_name):
    try:
        # Try to select 1 row from the table to see if it exists
        response = supabase.table(table_name).select("*").limit(1).execute()
        print(f"✅ Table '{table_name}' already exists")
        return True
    except Exception:
        print(f"❓ Table '{table_name}' does not exist")
        return False


# Execute SQL queries
def execute_query(query, description):
    try:
        print(f"🔄 Creating {description}...")

        # Check if the RPC function exists
        try:
            response = supabase.postgrest.rpc("exec_sql", {"query": query}).execute()
            print(f"✅ {description} created successfully using RPC")
            return True
        except Exception as e:
            print(f"⚠️ RPC method failed: {str(e)}")
            print("Trying direct SQL query method (requires API connection)...")

            # Fallback to REST API
            # This is a simplified approach - in production we'd use a proper SQL connection
            response = supabase.rpc("exec_sql", {"query": query}).execute()
            if "error" in response:
                raise Exception(response["error"])

            print(f"✅ {description} created successfully using REST API")
            return True

    except Exception as e:
        print(f"❌ Error creating {description}: {str(e)}")
        print("You may need to run this SQL directly in Supabase SQL Editor:")
        print("--------------------------------------------------")
        print(query)
        print("--------------------------------------------------")
        return False


# Initialize database
def init_db():
    print("\n📦 Initializing Nova database in Supabase...")
    print("--------------------------------------------------")

    # Create tables
    tables_created = 0

    # 1. Check if exec_sql function exists or needs to be created
    create_rpc_func = """
    CREATE OR REPLACE FUNCTION exec_sql(query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
        EXECUTE query;
    END;
    $$;
    """

    try:
        supabase.rpc("exec_sql", {"query": "SELECT 1"}).execute()
        print("✅ exec_sql RPC function already exists")
    except:
        print("⚠️ exec_sql RPC function does not exist.")
        print("Please create it in Supabase SQL Editor with this SQL:")
        print("--------------------------------------------------")
        print(create_rpc_func)
        print("--------------------------------------------------")
        response = input("Have you created the function? (yes/no): ")
        if response.lower() != "yes":
            print("⚠️ Please create the function and run this script again.")
            return

    # 2. Create the extension if it doesn't exist
    extension_query = """
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    """
    execute_query(extension_query, "uuid-ossp extension")

    # 3. Create tables
    if not check_table_exists("users"):
        if execute_query(CREATE_USERS_TABLE, "users table"):
            tables_created += 1

    time.sleep(1)  # Brief pause to ensure tables are created in sequence

    if not check_table_exists("projects"):
        if execute_query(CREATE_PROJECTS_TABLE, "projects table"):
            tables_created += 1

    time.sleep(1)

    if not check_table_exists("documents"):
        if execute_query(CREATE_DOCUMENTS_TABLE, "documents table"):
            tables_created += 1

    time.sleep(1)

    if not check_table_exists("chat_history"):
        if execute_query(CREATE_CHAT_HISTORY_TABLE, "chat_history table"):
            tables_created += 1

    # 4. Grant permissions
    execute_query(GRANT_PERMISSIONS, "permissions")

    # 5. Create a test user if all tables were created successfully
    if tables_created > 0:
        create_test_user = """
        INSERT INTO users (email, password_hash)
        VALUES ('test@example.com', '$2b$12$GNPUcDAIE4jJwNGK7kR9PewpkfUYQbHO7wAaC9YEjh1iZYbfXNJHm')
        ON CONFLICT (email) DO NOTHING;
        """
        execute_query(create_test_user, "test user (test@example.com / test123)")

    print("\n--------------------------------------------------")
    print("✅ Database initialization complete!")
    print(f"📊 {tables_created} new tables created.")
    print("\nYou can now run the Nova backend.")
    print("--------------------------------------------------")


if __name__ == "__main__":
    init_db()
