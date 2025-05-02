import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_direct_api():
    """Test direct API calls to Supabase Database"""
    # Get credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Missing environment variables for Supabase")
        return
    
    # Remove trailing slash if present
    if supabase_url.endswith('/'):
        supabase_url = supabase_url[:-1]
    
    rest_url = f"{supabase_url}/rest/v1"
    
    print(f"Testing direct REST API calls to {rest_url}")
    
    # Common headers
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }
    
    # 1. First, try to discover available tables
    print("\n==== Checking API capabilities ====")
    try:
        options_response = requests.options(
            f"{rest_url}/",
            headers=headers
        )
        print(f"OPTIONS Status: {options_response.status_code}")
        print(f"Available headers: {options_response.headers}")
    except Exception as e:
        print(f"❌ Error during OPTIONS request: {str(e)}")
    
    # 2. Try to discover projects table specifically
    print("\n==== Checking projects table ====")
    try:
        options_response = requests.options(
            f"{rest_url}/projects",
            headers=headers
        )
        print(f"OPTIONS projects Status: {options_response.status_code}")
        if options_response.status_code == 200:
            print(f"Definition headers: {options_response.headers}")
    except Exception as e:
        print(f"❌ Error during projects OPTIONS request: {str(e)}")
    
    # 3. Try to list projects (GET)
    print("\n==== Listing projects (GET) ====")
    try:
        get_response = requests.get(
            f"{rest_url}/projects",
            headers=headers
        )
        print(f"GET Status: {get_response.status_code}")
        if get_response.status_code == 200:
            projects = get_response.json()
            print(f"Projects found: {len(projects)}")
            for project in projects[:3]:  # Show first 3 projects only
                print(f"  - {project}")
        else:
            print(f"Response: {get_response.text}")
    except Exception as e:
        print(f"❌ Error during GET request: {str(e)}")
    
    # 4. Try to create a project (POST)
    print("\n==== Creating a test project (POST) ====")
    test_project = {
        "name": "Test Project via Direct API"
    }
    
    try:
        post_response = requests.post(
            f"{rest_url}/projects",
            headers=headers,
            json=test_project
        )
        print(f"POST Status: {post_response.status_code}")
        
        if post_response.status_code in (200, 201):
            created_project = post_response.json()
            print(f"✅ Created project: {created_project}")
            
            # Clean up by deleting the test project
            project_id = created_project[0]["id"]
            delete_response = requests.delete(
                f"{rest_url}/projects?id=eq.{project_id}",
                headers=headers
            )
            print(f"DELETE Status: {delete_response.status_code}")
            if delete_response.status_code == 200:
                print("✅ Test project deleted successfully")
            else:
                print(f"❌ Failed to delete test project: {delete_response.text}")
        else:
            print(f"❌ Failed to create project: {post_response.text}")
    except Exception as e:
        print(f"❌ Error during POST/DELETE operations: {str(e)}")
    
    # 5. Try to view table definitions
    print("\n==== Viewing table definitions ====")
    try:
        # Directly query information_schema
        headers["Accept"] = "application/json"
        columns_response = requests.get(
            f"{rest_url}/information_schema/columns?select=table_schema,table_name,column_name,data_type&table_name=eq.projects",
            headers=headers
        )
        print(f"Information Schema Status: {columns_response.status_code}")
        if columns_response.status_code == 200:
            columns = columns_response.json()
            print(f"Columns found: {len(columns)}")
            for column in columns:
                print(f"  - {column}")
        else:
            print(f"Response: {columns_response.text}")
    except Exception as e:
        print(f"❌ Error during schema query: {str(e)}")

if __name__ == "__main__":
    test_direct_api() 