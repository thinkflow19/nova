import os
import sys
import json
import requests
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def print_header(text):
    """Print a styled header for test sections"""
    print("\n" + "=" * 50)
    print(f" {text} ".center(50, "="))
    print("=" * 50)

def inspect_projects_table():
    """Inspect the structure of the projects table in Supabase"""
    print_header("INSPECTING PROJECTS TABLE")
    
    # Get credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase credentials not found in environment variables")
        return False
    
    print(f"Connecting to Supabase at {supabase_url}")
    
    # Create direct API headers for REST calls
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # Try to get the schema information directly via REST API
    print("\nFetching OpenAPI specification to list available tables...")
    response = requests.get(f"{supabase_url}/rest/v1/", headers=headers)
    print(f"Status: {response.status_code}")
    
    # Try a simpler test record without the description field
    print("\nTesting minimal record insertion...")
    test_data = {
        "name": "Test Project Minimal"
    }
    
    # Try POST request directly
    response = requests.post(
        f"{supabase_url}/rest/v1/projects",
        headers=headers,
        json=test_data
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code >= 400:
        print("\nFetching table information via REST API...")
        # Try using the OPTIONS method to get table information
        options_response = requests.options(
            f"{supabase_url}/rest/v1/projects",
            headers=headers
        )
        print(f"OPTIONS Status: {options_response.status_code}")
        print(f"OPTIONS Headers: {options_response.headers}")

    # Try direct SQL query to inspect table structure
    print("\nExecuting SQL query to inspect table columns...")
    try:
        supabase = create_client(supabase_url, supabase_key)
        
        # Try with plain query first to see if table exists
        print("Querying empty data:")
        query_response = supabase.from_("projects").select("*").limit(1).execute()
        print(f"Query response: {query_response.data}")
        
        print("\nGetting table structure via column information...")
        column_query = """
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'api' AND table_name = 'projects'
        ORDER BY ordinal_position;
        """
        
        try:
            # Try with the "exec_sql" RPC function
            print("Trying direct SQL via RPC...")
            response = supabase.rpc('exec_sql', {"query": column_query}).execute()
            if hasattr(response, 'data'):
                print(f"Column information: {json.dumps(response.data, indent=2)}")
            else:
                print(f"No data in response: {response}")
        except Exception as e:
            print(f"RPC execution failed: {str(e)}")
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    print_header("INSPECTION COMPLETE")

if __name__ == "__main__":
    inspect_projects_table() 