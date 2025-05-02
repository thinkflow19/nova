import os
import sys
import json
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Add the parent directory to the path for imports
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
sys.path.append(parent_dir)

def print_header(text):
    """Print a styled header for test sections"""
    print("\n" + "=" * 50)
    print(f" {text} ".center(50, "="))
    print("=" * 50)

def setup_supabase_db():
    """Set up the necessary database structure in Supabase"""
    print_header("SUPABASE DATABASE SETUP")
    
    # Get credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase credentials not found in environment variables")
        return False
    
    print(f"Connecting to Supabase at {supabase_url}")
    
    # Create direct API headers
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # Try to create the projects table in the api schema
    try:
        print_header("SETTING UP DATABASE TABLES")
        
        # First, check if we can access the SQL API to confirm our permissions
        print("Testing SQL access...")
        
        # Use direct SQL to create the projects table in the api schema
        create_table_sql = """
        -- Create projects table in the api schema
        CREATE TABLE IF NOT EXISTS api.projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            user_id UUID,
            is_public BOOLEAN DEFAULT false
        );
        
        -- Add comments to the table
        COMMENT ON TABLE api.projects IS 'User projects for document storage and analysis';
        
        -- Grant permissions (since we're in api schema)
        GRANT ALL ON api.projects TO postgres, service_role;
        GRANT SELECT, INSERT, UPDATE ON api.projects TO authenticated;
        """
        
        # Try using direct connection through REST API
        print("\nAttempting to create projects table via SQL...")
        
        # Set up REST API endpoints for Supabase SQL API
        sql_url = f"{supabase_url}/rest/v1/pg_dump"  # Custom endpoint for raw SQL
        
        # Try to direct SQL execution via the SQL API
        response = requests.post(
            sql_url,
            headers=headers,
            json={"query": create_table_sql}
        )
        
        print(f"SQL API Response Status: {response.status_code}")
        print(f"Response: {response.text if response.text else 'No response body'}")
        
        if response.status_code >= 400:
            print("❌ Failed to execute SQL directly")
            
            # Try alternate approach with Supabase Dashboard SQL editor
            print("\nAlternative method:")
            print("Please run the following SQL in your Supabase Dashboard SQL Editor:")
            print("=" * 50)
            print(create_table_sql)
            print("=" * 50)
            print("After running the SQL, re-run the integration tests.")
        
        # Try to create a test record in the projects table
        print("\nTesting table by creating a record...")
        test_data = {
            "name": "Test Project",
            "description": "Created by setup script",
            "is_public": True
        }
        
        response = requests.post(
            f"{supabase_url}/rest/v1/projects",
            headers=headers,
            json=test_data
        )
        
        print(f"Insert Status: {response.status_code}")
        print(f"Response: {response.text if response.text else 'No response body'}")
        
    except Exception as e:
        print(f"❌ Error setting up database: {str(e)}")
    
    print_header("SETUP INSTRUCTIONS COMPLETE")
    print("""
To complete setup:
1. Go to your Supabase Dashboard (https://app.supabase.io)
2. Navigate to the SQL Editor
3. Run the SQL commands shown above to create the projects table in the api schema
4. Re-run the integration tests
""")

if __name__ == "__main__":
    setup_supabase_db() 