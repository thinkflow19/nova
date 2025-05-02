import os
import uuid
from dotenv import load_dotenv
from fastapi import HTTPException, status
from supabase import create_client, Client
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Bucket name
BUCKET_NAME = "documents"


# Ensure the bucket exists
def ensure_bucket_exists():
    """Create the 'documents' bucket if it doesn't exist."""
    try:
        # List buckets to check if documents bucket exists
        buckets = supabase.storage.list_buckets()

        bucket_exists = any(bucket.get("name") == BUCKET_NAME for bucket in buckets)

        if not bucket_exists:
            # Create a new private bucket
            supabase.storage.create_bucket(
                BUCKET_NAME,
                options={
                    "public": False,  # Private bucket
                    "file_size_limit": 5242880,  # 5MB limit in bytes
                    "allowed_mime_types": [
                        "application/pdf",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "text/plain",
                    ],
                },
            )

            # Add RLS policy to only allow users to access their own files
            # This would typically be done in SQL migrations in Supabase
            print(f"Created bucket: {BUCKET_NAME}")

    except Exception as e:
        print(f"Error ensuring bucket exists: {str(e)}")


def generate_upload_url(file_name: str, content_type: str, user_id: str) -> dict:
    """Generate a signed URL for uploading to Supabase Storage."""
    try:
        # Ensure bucket exists
        ensure_bucket_exists()

        # Validate file type
        file_extension = file_name.split(".")[-1].lower()
        allowed_extensions = ["pdf", "docx", "txt"]

        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Supported types: {', '.join(allowed_extensions)}",
            )

        # Generate unique file path with user ID prefix for security
        file_path = f"{user_id}/{uuid.uuid4()}.{file_extension}"

        # Generate signed URL for upload
        upload_data = supabase.storage.from_(BUCKET_NAME).create_signed_upload_url(
            file_path
        )

        # Return upload URL and file path
        return {"presigned_url": upload_data["signedURL"], "file_key": file_path}

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate upload URL: {str(e)}",
        )


def get_file_url(file_key: str, user_id: str) -> str:
    """Get a signed URL for accessing the file."""
    try:
        # Generate signed URL valid for 1 hour
        signed_url = supabase.storage.from_(BUCKET_NAME).create_signed_url(
            file_key, 3600
        )

        # Verify the file belongs to the user (additional security check)
        if not file_key.startswith(f"{user_id}/"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this file",
            )

        return signed_url["signedURL"]

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get file URL: {str(e)}",
        )


def delete_file(file_key: str, user_id: str) -> bool:
    """Delete a file from Supabase Storage."""
    try:
        # Security check - ensure the file belongs to the user
        if not file_key.startswith(f"{user_id}/"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this file",
            )

        # Delete the file
        supabase.storage.from_(BUCKET_NAME).remove([file_key])
        return True

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}",
        )
