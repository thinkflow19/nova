#!/usr/bin/env python3
import os
import sys
import uuid
from dotenv import load_dotenv
from supabase import create_client, Client
from passlib.context import CryptContext

# Load environment variables
load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password):
    """Hash a password for storing."""
    return pwd_context.hash(password)


def create_test_user():
    """Create a test user in Supabase database."""
    print("\n==== Creating Test User in Supabase ====")

    # Supabase client
    supabase_url = (
        os.getenv("SUPABASE_URL") or "https://orzhsdggsdbaacbemxav.supabase.co"
    )
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhzZGdnc2RiYWFjYmVteGF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNDEzODU4NiwiZXhwIjoyMDI5NzE0NTg2fQ.qkjV-qyfcQyzdG5gJZHo6iSFuSN-DSJ9-jcbBXgSgFs"
    )

    # Get user email and password from command line or prompt
    if len(sys.argv) > 2:
        email = sys.argv[1]
        password = sys.argv[2]
    else:
        email = input("Enter email for test user: ")
        password = input("Enter password for test user: ")

    try:
        print(f"\nConnecting to Supabase at {supabase_url}")
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Connected to Supabase")

        # Check if user already exists
        print(f"Checking if user {email} already exists...")
        response = supabase.table("users").select("*").eq("email", email).execute()

        if response.data and len(response.data) > 0:
            print(f"⚠️ User with email {email} already exists")
            user = response.data[0]
            print(f"User ID: {user.get('id')}")

            # Update user's password if requested
            update = input("Update password for this user? (y/n): ")
            if update.lower() == "y":
                hashed_password = get_password_hash(password)
                supabase.table("users").update({"password_hash": hashed_password}).eq(
                    "id", user["id"]
                ).execute()
                print("✅ Password updated")

            return

        # Create new user
        print(f"Creating new user {email}...")
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(password)

        user_data = {
            "id": user_id,
            "email": email,
            "password_hash": hashed_password,
            "plan": "free",
            "created_at": "now()",
        }

        response = supabase.table("users").insert(user_data).execute()

        if response.data and len(response.data) > 0:
            print("✅ User created successfully:")
            user = response.data[0]
            print(f"User ID: {user.get('id')}")
            print(f"Email: {user.get('email')}")

            # Create a test project for this user
            create_project = input("Create a test project for this user? (y/n): ")
            if create_project.lower() == "y":
                project_data = {
                    "user_id": user_id,
                    "project_name": "Test Project",
                    "branding_color": "#6366F1",
                    "tone": "friendly",
                    "embed_code": "<script>console.log('Test project embed code')</script>",
                    "status": "active",
                    "created_at": "now()",
                }

                project_response = (
                    supabase.table("projects").insert(project_data).execute()
                )
                if project_response.data and len(project_response.data) > 0:
                    print("✅ Test project created:")
                    project = project_response.data[0]
                    print(f"Project ID: {project.get('id')}")
                    print(f"Name: {project.get('project_name')}")
        else:
            print("❌ Failed to create user")

    except Exception as e:
        print(f"❌ Error: {str(e)}")

    print("\n==== Done ====")


if __name__ == "__main__":
    create_test_user()
