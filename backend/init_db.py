import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
import time

# Load environment variables
load_dotenv()

# Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# SQL queries to create tables
CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    plan VARCHAR NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
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
"""

CREATE_CHAT_HISTORY_TABLE = """
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    user_query TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"""


# Execute SQL queries
def execute_query(query, description):
    try:
        print(f"Creating {description}...")
        # Test connection first
        supabase.table("users").select("*").limit(1).execute()
        
        # Use the new direct SQL execution method in newer Supabase client
        response = supabase.sql(query).execute()
        print(f"✅ {description} created successfully")
        return True
    except Exception as e:
        print(f"❌ Error creating {description}: {str(e)}")
        # Fallback to older method if the new one doesn't work
        try:
            response = supabase.postgrest.rpc("exec_sql", {"query": query}).execute()
            print(f"✅ {description} created successfully using fallback method")
            return True
        except Exception as fallback_error:
            print(f"❌ Fallback method also failed: {str(fallback_error)}")
            return False


# Initialize database
def init_db():
    print("Initializing Nova database in Supabase...")

    # Create RPC function to execute SQL if it doesn't exist
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
        # Try using direct SQL execution first
        supabase.sql("SELECT 1").execute()
        print("✅ SQL execution capability exists")
    except:
        try:
            # Try the RPC method as fallback
            supabase.postgrest.rpc("exec_sql", {"query": "SELECT 1"}).execute()
            print("✅ RPC SQL execution function exists")
        except:
            # If neither work, guide the user to create the RPC function
            print("Creating exec_sql RPC function...")
            print("Please create the exec_sql function in Supabase SQL Editor:")
            print(create_rpc_func)
            input("Press Enter once you've created the function...")

    # Create tables
    execute_query(CREATE_USERS_TABLE, "users table")
    time.sleep(1)  # Brief pause to ensure tables are created in sequence

    execute_query(CREATE_PROJECTS_TABLE, "projects table")
    time.sleep(1)

    execute_query(CREATE_DOCUMENTS_TABLE, "documents table")
    time.sleep(1)

    execute_query(CREATE_CHAT_HISTORY_TABLE, "chat_history table")

    print("\nDatabase initialization complete!")
    print("You can now run the Nova backend.")


if __name__ == "__main__":
    init_db()
