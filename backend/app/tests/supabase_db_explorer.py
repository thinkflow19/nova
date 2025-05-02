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

def explore_supabase_db():
    """Explore the Supabase database structure and connection options"""
    print_header("SUPABASE DATABASE EXPLORER")
    
    # Get credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase credentials not found in environment variables")
        return False
    
    print(f"Connecting to Supabase at {supabase_url}")
    print(f"Service Key: {supabase_key[:5]}...{supabase_key[-5:]}")
    if supabase_anon_key:
        print(f"Anon Key: {supabase_anon_key[:5]}...{supabase_anon_key[-5:]}")
    
    # Create clients with different keys to test
    supabase_service = create_client(supabase_url, supabase_key)
    print("✅ Successfully created Supabase client with service role key")
    
    if supabase_anon_key:
        supabase_anon = create_client(supabase_url, supabase_anon_key)
        print("✅ Successfully created Supabase client with anon key")
    
    # Try direct HTTP API call to gather info about available tables
    try:
        print_header("EXPLORING DATABASE STRUCTURE")
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}"
        }
        
        # Use the Supabase REST API to list tables
        response = requests.get(f"{supabase_url}/rest/v1/", headers=headers)
        print(f"Database structure response status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"Available tables/routes: {response.text}")
        else:
            print(f"Error exploring database: {response.text}")
            
        # Try to get information schema
        print("\nQuerying information_schema.tables to list all tables:")
        sql_query = """
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY table_schema, table_name;
        """
        
        try:
            # Try using the supabase-py client
            response = supabase_service.rpc('exec_sql', {"query": sql_query}).execute()
            print(f"Response: {json.dumps(response.data) if hasattr(response, 'data') else 'No data'}")
        except Exception as e:
            print(f"Error with supabase-py client: {str(e)}")
            
            # Try direct REST API call
            print("\nTrying direct REST API call:")
            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
            
            payload = {"query": sql_query}
            response = requests.post(f"{supabase_url}/rest/v1/rpc/exec_sql", json=payload, headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
    
    except Exception as e:
        print(f"❌ Error exploring database structure: {str(e)}")
    
    # Try different schema names for insert
    try:
        print_header("TESTING TABLE INSERTIONS WITH DIFFERENT PREFIXES")
        test_data = {
            "name": "Test Project",
            "description": "Created by database explorer"
        }
        
        # Try various combinations
        table_paths_to_try = [
            "projects",  # no schema prefix
            "public.projects",
            "api.projects",
            "auth.projects",
            "storage.projects",
            # Try the table without schema but with auth headers
            {"path": "projects", "headers": {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}}
        ]
        
        for table_path in table_paths_to_try:
            try:
                if isinstance(table_path, dict):
                    path = table_path["path"]
                    print(f"\nTrying direct API call to '{path}' with auth headers:")
                    
                    response = requests.post(
                        f"{supabase_url}/rest/v1/{path}", 
                        json=test_data,
                        headers=table_path["headers"]
                    )
                    
                    print(f"Status: {response.status_code}")
                    print(f"Response: {response.text}")
                else:
                    print(f"\nTrying path: '{table_path}'")
                    response = supabase_service.from_(table_path).insert(test_data).execute()
                    print(f"Success with '{table_path}': {json.dumps(response.data)}")
            except Exception as e:
                print(f"Error with '{table_path}': {str(e)}")
    
    except Exception as e:
        print(f"❌ Error testing table insertions: {str(e)}")
    
    # Try an "api." prefix table with REST syntax (no "from_" method)
    try:
        print_header("TESTING DIRECT REST API ACCESS")
        
        # Request headers
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        # Try to get data from projects table
        print("\nGET request to projects:")
        response = requests.get(f"{supabase_url}/rest/v1/projects", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:1000]}")  # Limit output length
        
        # Try with api prefix
        print("\nGET request to api/projects:")
        response = requests.get(f"{supabase_url}/rest/v1/api/projects", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:1000]}")  # Limit output length
        
    except Exception as e:
        print(f"❌ Error with direct REST API access: {str(e)}")
    
    print_header("EXPLORATION COMPLETE")

if __name__ == "__main__":
    explore_supabase_db() 