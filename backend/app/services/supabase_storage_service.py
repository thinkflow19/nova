import os
import uuid
import logging
from dotenv import load_dotenv
from fastapi import HTTPException, status
from supabase import create_client, Client
from datetime import datetime, timedelta
from app.settingsconfig.settings import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_SERVICE_ROLE_KEY

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Bucket name
BUCKET_NAME = "documents"

# File size limits
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB limit for free tier

# Ensure the bucket exists
def ensure_bucket_exists():
    """Create the 'documents' bucket if it doesn't exist."""
    try:
        # List buckets to check if documents bucket exists
        logger.info(f"Checking if bucket '{BUCKET_NAME}' exists...")
        buckets = supabase.storage.list_buckets()
        logger.info(f"Found {len(buckets)} buckets: {[b.get('name') for b in buckets]}")

        bucket_exists = any(bucket.get("name") == BUCKET_NAME for bucket in buckets)

        if not bucket_exists:
            logger.info(f"Bucket '{BUCKET_NAME}' does not exist. Creating now...")
            # Create a new private bucket
            create_result = supabase.storage.create_bucket(
                BUCKET_NAME,
                options={
                    "public": True,  # Make bucket public for easier debugging
                    "file_size_limit": MAX_FILE_SIZE,  # 50MB limit for free tier
                    "allowed_mime_types": [
                        "application/pdf",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "text/plain",
                        "text/markdown",
                        "text/csv",
                        "application/json",
                    ],
                },
            )
            logger.info(f"Bucket creation result: {create_result}")
            logger.info(f"Created bucket: {BUCKET_NAME}")
        else:
            logger.info(f"Bucket '{BUCKET_NAME}' already exists")
            
            # Update bucket configuration if it exists
            try:
                logger.info(f"Updating bucket configuration for {BUCKET_NAME}")
                update_result = supabase.storage.update_bucket(
                    BUCKET_NAME,
                    options={
                        "public": True,  # Make bucket public for easier access
                        "file_size_limit": MAX_FILE_SIZE,  # 50MB limit for free tier
                    }
                )
                logger.info(f"Bucket update result: {update_result}")
            except Exception as update_err:
                logger.warning(f"Unable to update bucket configuration: {update_err}")

        # Verify bucket exists after creation attempt
        buckets_after = supabase.storage.list_buckets()
        logger.info(f"After creation check: {len(buckets_after)} buckets: {[b.get('name') for b in buckets_after]}")
        
        # Return status for caller
        return True

    except Exception as e:
        logger.error(f"Error ensuring bucket exists: {str(e)}", exc_info=True)
        # Log Supabase credentials info (without exposing actual keys)
        logger.error(f"Supabase URL set: {'Yes' if SUPABASE_URL else 'No'}")
        logger.error(f"Supabase Key set: {'Yes' if SUPABASE_KEY else 'No'}")
        logger.error(f"Supabase URL length: {len(SUPABASE_URL) if SUPABASE_URL else 0}")
        logger.error(f"Supabase Key length: {len(SUPABASE_KEY) if SUPABASE_KEY else 0}")
        return False


def generate_upload_url(file_name: str, content_type: str, user_id: str) -> dict:
    """Generate a signed URL for uploading to Supabase Storage."""
    try:
        # Ensure bucket exists
        logger.info(f"Generating upload URL for file: {file_name}, content-type: {content_type}")
        bucket_status = ensure_bucket_exists()
        if not bucket_status:
            logger.error("Bucket could not be created or verified, but continuing...")

        # Validate file type
        file_extension = file_name.split(".")[-1].lower()
        allowed_extensions = ["pdf", "docx", "txt", "md", "csv", "json"]

        if file_extension not in allowed_extensions:
            error_msg = f"File type not allowed. Supported types: {', '.join(allowed_extensions)}"
            logger.error(error_msg)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg,
            )
            
        # Check approximate file size if provided in content_type as "size=NNN" parameter
        estimated_size = None
        size_param = None
        
        if "size=" in content_type:
            try:
                size_part = content_type.split("size=")[1].split(";")[0]
                size_param = int(size_part)
                estimated_size = size_param
            except (ValueError, IndexError):
                logger.warning(f"Could not parse size from content_type: {content_type}")
                
        if estimated_size and estimated_size > MAX_FILE_SIZE:
            error_msg = f"File exceeds the maximum size limit of {MAX_FILE_SIZE/1024/1024}MB"
            logger.error(f"{error_msg}. Estimated size: {estimated_size/1024/1024}MB")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg,
            )

        # Generate unique file path with user ID prefix for security
        file_path = f"{user_id}/{uuid.uuid4()}.{file_extension}"
        logger.info(f"Generated file path: {file_path}")

        # Generate signed URL for upload
        logger.info(f"Requesting signed upload URL from Supabase for path: {file_path}")
        try:
            # Try using the standard upload method first
            upload_data = supabase.storage.from_(BUCKET_NAME).create_signed_upload_url(
                file_path
            )
            
            if not upload_data:
                logger.error("Supabase returned empty response for signed upload URL")
                raise ValueError("Empty response from storage provider")
                
            logger.info(f"Upload URL response: {upload_data}")
            
            # Return upload URL and file path
            result = {"presigned_url": upload_data.get("signedURL"), "file_key": file_path}
            logger.info(f"Returning upload URL data: {result}")
            return result
            
        except Exception as upload_err:
            logger.error(f"Error getting signed URL from Supabase: {str(upload_err)}", exc_info=True)
            
            # Try alternative methods in sequence
            methods_to_try = [
                # Method 1: Use standard signed URL with PUT method
                lambda: {"method": "signed_url", "data": supabase.storage.from_(BUCKET_NAME).create_signed_url(
                    file_path, 3600, {"method": "PUT"}
                )},
                # Method 2: Try to get a direct public URL for the file
                lambda: {"method": "public_url", "data": {"signedURL": supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)}},
                # Method 3: Try S3-compatible endpoint if available
                lambda: {"method": "s3_compatible", "data": {"signedURL": f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{file_path}"}}
            ]
            
            for i, method_fn in enumerate(methods_to_try):
                try:
                    logger.info(f"Trying upload method {i+1}")
                    method_result = method_fn()
                    method_data = method_result["data"]
                    
                    if method_data and ("signedURL" in method_data or "url" in method_data):
                        logger.info(f"Method {i+1} ({method_result['method']}) successful: {method_data}")
                        
                        # Extract the URL from appropriate field
                        url = method_data.get("signedURL") or method_data.get("url")
                        if url:
                            return {"presigned_url": url, "file_key": file_path}
                    
                    logger.warning(f"Method {i+1} returned invalid data format: {method_data}")
                except Exception as method_err:
                    logger.error(f"Method {i+1} failed: {str(method_err)}")
            
            # If all methods fail, raise the original error
            raise ValueError("All upload URL generation methods failed")

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Failed to generate upload URL: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate upload URL: {str(e)}",
        )


def get_file_url(file_key: str, user_id: str) -> str:
    """Get a signed URL for accessing the file."""
    try:
        logger.info(f"Generating signed URL for file: {file_key}")
        
        # Verify the file belongs to the user (additional security check)
        if not file_key.startswith(f"{user_id}/"):
            logger.warning(f"Security check failed: File {file_key} does not belong to user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this file",
            )
        
        # Generate signed URL valid for 1 hour
        try:
            signed_url = supabase.storage.from_(BUCKET_NAME).create_signed_url(
                file_key, 3600
            )
            
            logger.info(f"Signed URL response: {signed_url}")
            
            if not signed_url or "signedURL" not in signed_url:
                logger.error(f"Invalid response format from Supabase: {signed_url}")
                raise ValueError("Invalid response format from storage provider")
                
            return signed_url["signedURL"]
            
        except Exception as url_err:
            logger.error(f"Error generating signed URL: {str(url_err)}", exc_info=True)
            
            # Try alternative public URL as fallback
            try:
                logger.info(f"Attempting to get public URL for {file_key}")
                public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_key)
                logger.info(f"Public URL result: {public_url}")
                return public_url
            except Exception as pub_err:
                logger.error(f"Failed to get public URL: {str(pub_err)}")
                raise url_err  # Re-raise original error

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Failed to get file URL: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get file URL: {str(e)}",
        )


def delete_file(file_key: str, user_id: str) -> bool:
    """Delete a file from Supabase Storage."""
    try:
        logger.info(f"Attempting to delete file: {file_key}")
        
        # Security check - ensure the file belongs to the user
        if not file_key.startswith(f"{user_id}/"):
            logger.warning(f"Security check failed: File {file_key} does not belong to user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this file",
            )

        # Delete the file
        try:
            delete_result = supabase.storage.from_(BUCKET_NAME).remove([file_key])
            logger.info(f"Delete result: {delete_result}")
            return True
        except Exception as del_err:
            logger.error(f"Error during delete operation: {str(del_err)}", exc_info=True)
            raise

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Failed to delete file: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}",
        )


def upload_file_direct(file_content: bytes, file_path: str, content_type: str) -> dict:
    """Upload a file directly to Supabase Storage (bypassing presigned URLs)."""
    try:
        logger.info(f"Direct upload of file to path: {file_path}")
        
        # Validate file size
        file_size = len(file_content)
        if file_size > MAX_FILE_SIZE:
            error_msg = f"File size ({file_size/1024/1024:.2f}MB) exceeds the maximum size limit of {MAX_FILE_SIZE/1024/1024}MB"
            logger.error(error_msg)
            raise ValueError(error_msg)
            
        # Ensure bucket exists
        bucket_status = ensure_bucket_exists()
        if not bucket_status:
            logger.error("Bucket could not be created or verified, but continuing with upload...")
            
        # Perform the upload directly
        try:
            logger.info(f"Uploading {file_size} bytes to {BUCKET_NAME}/{file_path}")
            
            # Upload options
            options = {
                "content-type": content_type,
                "x-upsert": "true"  # Overwrite if exists
            }
            
            # Call the upload method
            upload_result = supabase.storage.from_(BUCKET_NAME).upload(
                path=file_path,
                file=file_content,
                file_options=options
            )
            
            logger.info(f"Direct upload result: {upload_result}")
            
            # Get a URL for the uploaded file
            try:
                signed_url = supabase.storage.from_(BUCKET_NAME).create_signed_url(
                    path=file_path, 
                    expires_in=3600  # 1 hour
                )
                file_url = signed_url.get("signedURL")
            except Exception as url_err:
                logger.error(f"Error getting URL for uploaded file: {str(url_err)}")
                # Try public URL as fallback
                try:
                    file_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
                except Exception:
                    file_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_path}"
            
            return {
                "key": file_path,
                "url": file_url,
                "bucket": BUCKET_NAME,
                "size": file_size
            }
            
        except Exception as upload_err:
            logger.error(f"Error during direct upload: {str(upload_err)}", exc_info=True)
            raise
            
    except Exception as e:
        logger.error(f"Direct upload failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}",
        )
