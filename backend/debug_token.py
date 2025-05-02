import os
import sys
import jwt
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# JWT settings
SECRET_KEY = (
    os.getenv("JWT_SECRET_KEY")
    or "d7d0e01590142dd1e0e66694a6d2a1d0e97dac09e6c57a88c9e3c8c4e076ece0"
)
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Supabase client
supabase_url = os.getenv("SUPABASE_URL") or "https://orzhsdggsdbaacbemxav.supabase.co"
supabase_key = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhzZGdnc2RiYWFjYmVteGF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNDEzODU4NiwiZXhwIjoyMDI5NzE0NTg2fQ.qkjV-qyfcQyzdG5gJZHo6iSFuSN-DSJ9-jcbBXgSgFs"
)


def debug_token():
    """Debug a JWT token by trying to decode it and find the user."""
    print("\n==== Nova Token Debugger ====")

    # Check if token was provided as command-line arg
    if len(sys.argv) > 1:
        token = sys.argv[1]
    else:
        token = input("Enter the JWT token to debug: ")

    print(f"\nToken: {token[:10]}...")
    print(f"JWT Secret: {SECRET_KEY[:10]}...")
    print(f"Supabase URL: {supabase_url}")

    # Try to decode the token
    try:
        print("\nDecoding token...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("✅ Token decoded successfully!")
        print(f"Payload: {payload}")

        # Extract user_id
        user_id = payload.get("sub")
        if not user_id:
            print("❌ No 'sub' claim found in token - this should contain the user ID")
            return

        print(f"User ID from token: {user_id}")

        # Try to find the user in Supabase
        try:
            print("\nConnecting to Supabase...")
            supabase = create_client(supabase_url, supabase_key)
            print("✅ Connected to Supabase")

            print(f"\nLooking up user with ID: {user_id}")
            response = supabase.table("users").select("*").eq("id", user_id).execute()

            if response.data and len(response.data) > 0:
                print("✅ User found in database!")
                user = response.data[0]
                print(f"Email: {user.get('email')}")
                print(f"Plan: {user.get('plan')}")
            else:
                print("❌ No user found with this ID in the database")

                # Show all users for debugging
                all_users = supabase.table("users").select("id, email").execute()
                print(f"\nAll users in database ({len(all_users.data)}):")
                for user in all_users.data:
                    print(f"- {user.get('id')}: {user.get('email')}")

        except Exception as e:
            print(f"❌ Supabase error: {str(e)}")

    except jwt.ExpiredSignatureError:
        print("❌ Token has expired!")
    except jwt.InvalidTokenError:
        print("❌ Invalid token! The signature verification failed.")
    except Exception as e:
        print(f"❌ Error decoding token: {str(e)}")

    print("\n==== Debugging Complete ====")


if __name__ == "__main__":
    debug_token()
