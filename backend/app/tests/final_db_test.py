import os
import requests
import json
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_direct_api():
    """Test the Supabase database with direct REST API calls to avoid schema cache issues"""
    # Get credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Missing environment variables for Supabase")
        return False
    
    # Remove trailing slash if present
    if supabase_url.endswith('/'):
        supabase_url = supabase_url[:-1]
    
    rest_url = f"{supabase_url}/rest/v1"
    
    print(f"Testing direct REST API calls to {rest_url}")
    
    # Common headers
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # Create a test project with only the name field
    print("\n==== Creating a test project (POST) ====")
    test_project = {
        "name": f"Test Project via Direct API {uuid.uuid4()}"
    }
    
    try:
        # POST request to create record
        print(f"Creating project with data: {test_project}")
        post_response = requests.post(
            f"{rest_url}/projects",
            headers=headers,
            json=test_project
        )
        print(f"POST Status: {post_response.status_code}")
        
        if post_response.status_code in (200, 201):
            created_project = post_response.json()
            print(f"✅ Created project: {created_project}")
            
            # Get the ID of the inserted record
            project_id = created_project[0]["id"]
            
            # Test querying the record
            print("\n==== Querying the created project (GET) ====")
            get_response = requests.get(
                f"{rest_url}/projects?id=eq.{project_id}",
                headers=headers
            )
            print(f"GET Status: {get_response.status_code}")
            
            if get_response.status_code == 200:
                queried_project = get_response.json()
                print(f"✅ Retrieved project: {queried_project}")
                
                # Clean up by deleting the test project
                print("\n==== Deleting the test project (DELETE) ====")
                delete_response = requests.delete(
                    f"{rest_url}/projects?id=eq.{project_id}",
                    headers=headers
                )
                print(f"DELETE Status: {delete_response.status_code}")
                
                if delete_response.status_code == 200:
                    print("✅ Test project deleted successfully")
                    print("\n==== Supabase Database Test PASSED ====")
                    return True
                else:
                    print(f"❌ Failed to delete test project: {delete_response.text}")
            else:
                print(f"❌ Failed to query project: {get_response.text}")
        else:
            print(f"❌ Failed to create project: {post_response.text}")
            
            # Try to get column information to debug
            print("\n==== Getting column information ====")
            options_response = requests.options(
                f"{rest_url}/projects",
                headers=headers
            )
            print(f"OPTIONS Status: {options_response.status_code}")
            if options_response.status_code == 200:
                print(f"Definition headers: {options_response.headers}")
                
                if 'Content-Profile' in options_response.headers:
                    print(f"Content profile: {options_response.headers['Content-Profile']}")
            
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
    
    print("\n==== Supabase Database Test FAILED ====")
    return False

if __name__ == "__main__":
    test_direct_api() 