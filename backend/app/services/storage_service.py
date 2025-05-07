import os
import io
import uuid
import logging
from typing import BinaryIO, Union, Optional, Dict, Any, List
from enum import Enum
from abc import ABC, abstractmethod
from fastapi import HTTPException, status
from dotenv import load_dotenv
from supabase import create_client, Client
import boto3
from botocore.exceptions import ClientError
import base64
import requests
from datetime import datetime, timedelta
import asyncio
import re
import aioboto3
import httpx

# Load environment variables
load_dotenv()

# Import settings from centralized config
from app.config.settings import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Storage provider enum
class StorageProvider(str, Enum):
    SUPABASE = "supabase"
    AWS_S3 = "aws_s3"
    # Add more providers as needed
    # AZURE_BLOB = "azure_blob"
    # GOOGLE_CLOUD = "google_cloud"


# Abstract storage interface
class StorageInterface(ABC):
    @abstractmethod
    async def initialize(self):
        """Perform any asynchronous initialization required."""
        pass

    @abstractmethod
    async def upload_file(
        self, file_content: Union[bytes, BinaryIO], file_name: str, content_type: str
    ) -> Dict[str, Any]:
        """Upload a file to storage and return the URL"""
        pass

    @abstractmethod
    def download_file(self, file_path: str) -> bytes:
        """Download a file from storage"""
        pass

    @abstractmethod
    def delete_file(self, file_path: str) -> bool:
        """Delete a file from storage"""
        pass

    @abstractmethod
    def generate_presigned_url(self, file_path: str, expiration: int = 3600) -> str:
        """Generate a presigned URL for file access"""
        pass

    @abstractmethod
    async def generate_presigned_upload_url(self, file_path: str, expiration: int = 3600) -> str:
        """Generate a presigned URL specifically for uploading a file"""
        pass


# Supabase Storage implementation
class SupabaseStorage(StorageInterface):
    def __init__(self, bucket_name: str = "documents"):
        """Initialize Supabase storage with specified bucket"""
        self.bucket_name = bucket_name

        # Get credentials from config
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

        # Initialize Supabase client
        try:
            self.supabase: Client = create_client(
                settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
            )
        except ImportError:
            logger.error("Failed to import supabase client library")
            raise

    async def initialize(self):
        """Ensure the Supabase bucket exists."""
        await self._ensure_bucket_exists()

    async def _ensure_bucket_exists(self):
        """Make sure the specified bucket exists, create if it doesn't"""
        try:
            logger.info(f"Checking for Supabase storage bucket: {self.bucket_name}")
            # Get list of buckets - Wrap synchronous call
            buckets_response = await asyncio.to_thread(self.supabase.storage.list_buckets)
            logger.info(f"Bucket response: {buckets_response}")
            
            # Always attempt to create the bucket - Supabase will return an error if it already exists
            # but this is a more reliable approach
            try:
                logger.info(f"Attempting to create Supabase Storage bucket: {self.bucket_name}")
                try:
                    # Try creating with options - Wrap synchronous call
                    await asyncio.to_thread(
                        self.supabase.storage.create_bucket,
                        self.bucket_name, 
                        {"public": True}  # Make bucket public to simplify access
                    )
                except (TypeError, ValueError):
                    # If options aren't supported, try without options
                    await asyncio.to_thread(self.supabase.storage.create_bucket, self.bucket_name)
                    
                logger.info(f"Successfully created bucket: {self.bucket_name}")
            except Exception as bucket_err:
                # Check if error indicates bucket already exists
                if "already exists" in str(bucket_err).lower():
                    logger.info(f"Bucket '{self.bucket_name}' already exists")
                else:
                    logger.warning(f"Failed to create bucket '{self.bucket_name}': {bucket_err}")
                    
            # Verify bucket exists in the list after creation attempt
            buckets_response = await asyncio.to_thread(self.supabase.storage.list_buckets)
            bucket_exists = False

            if isinstance(buckets_response, list):
                bucket_exists = any(
                    (hasattr(bucket, 'name') and bucket.name == self.bucket_name) or
                    (isinstance(bucket, dict) and bucket.get("name") == self.bucket_name)
                    for bucket in buckets_response
                )
            
            if bucket_exists:
                logger.info(f"Confirmed bucket '{self.bucket_name}' exists")
            else:
                logger.warning(f"Could not confirm bucket '{self.bucket_name}' exists after creation attempt")
                
        except Exception as e:
            logger.error(f"Error handling bucket existence: {str(e)}", exc_info=True)
            # We'll continue anyway and let specific operations fail if bucket doesn't exist

    async def upload_file(
        self, file_content: Union[bytes, BinaryIO], file_name: str, content_type: str
    ) -> Dict[str, Any]:
        """Upload a file to Supabase storage and return the URL"""
        try:
            # Generate a unique path to avoid collisions
            file_extension = file_name.split(".")[-1] if "." in file_name else ""
            unique_id = str(uuid.uuid4())
            file_path = f"{unique_id}/{file_name}"

            # Upload the file - Wrap synchronous call
            logger.info(
                f"Uploading file {file_name} to Supabase Storage as {file_path}"
            )
            await asyncio.to_thread(self.supabase.storage.from_(self.bucket_name).upload,
                path=file_path,
                file=file_content,
                file_options={"content-type": content_type},
            )

            # Create a URL for the file
            # Note: This creates a temporary URL that expires, use generate_presigned_url for permanent links
            file_url = await self.generate_presigned_url(file_path)

            return {
                "url": file_url,
                "key": file_path,
                "provider": StorageProvider.SUPABASE,
            }
        except Exception as e:
            logger.error(f"Error uploading file to Supabase: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file: {str(e)}",
            )

    async def download_file(self, file_path: str) -> bytes:
        """Download a file from Supabase storage"""
        try:
            # Download the file - Wrap synchronous call
            return await asyncio.to_thread(self.supabase.storage.from_(self.bucket_name).download, file_path)
        except Exception as e:
            logger.error(f"Error downloading file from Supabase: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to download file: {str(e)}",
            )

    async def delete_file(self, file_path: str) -> bool:
        """Delete a file from Supabase storage"""
        try:
            # Delete the file - Wrap synchronous call
            await asyncio.to_thread(self.supabase.storage.from_(self.bucket_name).remove, [file_path])
            return True
        except Exception as e:
            logger.error(f"Error deleting file from Supabase: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete file: {str(e)}",
            )

    async def generate_presigned_url(self, file_path: str, expiration: int = 3600) -> str:
        """Generate a presigned URL for file access in Supabase storage"""
        try:
            # Generate the signed URL - Wrap synchronous call
            signed_url = await asyncio.to_thread(self.supabase.storage.from_(self.bucket_name).create_signed_url,
                path=file_path, expires_in=expiration
            )
            return signed_url["signedURL"]
        except Exception as e:
            logger.error(f"Error generating presigned URL in Supabase: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate presigned URL: {str(e)}",
            )

    async def generate_presigned_upload_url(self, file_path: str, expiration: int = 3600) -> str:
        """Generate a presigned URL specifically for uploading a file to Supabase storage"""
        try:
            # Generate the signed upload URL - Wrap synchronous call
            signed_url = await asyncio.to_thread(self.supabase.storage.from_(self.bucket_name).create_signed_upload_url,
                path=file_path
            )
            # Return the URL directly as that's what our API expects
            if "signedURL" in signed_url:
                return signed_url["signedURL"]
            elif "url" in signed_url:  # Different versions of Supabase client may return different keys
                return signed_url["url"]
            else:
                # Fall back to returning the full response if we can't find a URL key
                logger.warning(f"Unexpected signed upload URL format: {signed_url}")
                return signed_url
        except Exception as e:
            logger.error(f"Error generating presigned upload URL in Supabase: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate presigned upload URL: {str(e)}",
            )

    async def check_file_exists(self, path: str, bucket: str = None) -> bool:
        """
        Check if a file exists in storage using direct Supabase API calls.
        
        Args:
            path: The file path in storage
            bucket: The storage bucket name (defaults to self.bucket_name)
            
        Returns:
            bool: True if file exists, False otherwise
        """
        try:
            # Get bucket name from parameter or class attribute if available
            bucket_name = bucket
            if bucket_name is None and hasattr(self, 'bucket_name'):
                bucket_name = self.bucket_name
            elif bucket_name is None:
                bucket_name = "documents"  # Default fallback
                
            logger.info(f"Checking if file exists: {path} in bucket {bucket_name}")
            
            # Get Supabase URL and key from settings directly
            supabase_url = settings.SUPABASE_URL
            supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY
            
            if not supabase_url or not supabase_key:
                logger.error("Supabase credentials not found in settings")
                return False
            
            # Use httpx for direct API calls to Supabase
            # Construct the URL for the HEAD request
            url = f"{supabase_url}/storage/v1/object/{bucket_name}/{path}"
            
            # Prepare headers with authentication
            headers = {
                "Authorization": f"Bearer {supabase_key}",
                "apikey": supabase_key,
            }
            
            # Make a HEAD request to check if file exists
            async with httpx.AsyncClient() as client:
                try:
                    response = await client.head(url, headers=headers, timeout=5.0)
                    
                    if response.status_code == 200:
                        logger.info(f"File exists: {path}")
                        return True
                    else:
                        logger.warning(f"File does not exist (status {response.status_code}): {path}")
                        return False
                except Exception as head_error:
                    logger.error(f"Error checking if file exists via HEAD: {str(head_error)}")
                    
                    # Fall back to list method
                    try:
                        # Try to list files with the path as prefix
                        list_url = f"{supabase_url}/storage/v1/object/list/{bucket_name}"
                        list_params = {"prefix": path}
                        
                        list_response = await client.get(
                            list_url, 
                            headers=headers, 
                            params=list_params,
                            timeout=5.0
                        )
                        
                        if list_response.status_code == 200:
                            files = list_response.json()
                            # Check if our file is in the list
                            exists = any(file.get("name") == path for file in files)
                            logger.info(f"File existence check via list: {exists}")
                            return exists
                        else:
                            logger.warning(f"Failed to list files (status {list_response.status_code})")
                            return False
                            
                    except Exception as list_error:
                        logger.error(f"Error checking file via list: {str(list_error)}")
                        return False
        
        except Exception as e:
            logger.error(f"Error in check_file_exists: {str(e)}")
            return False


# AWS S3 implementation
class AWSS3Storage(StorageInterface):
    def __init__(self, bucket_name: Optional[str] = None):
        """Initialize AWS S3 storage with specified bucket"""
        # Get credentials from environment variables
        aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        # Removed default fallbacks
        aws_region = os.getenv("AWS_REGION")
        self.bucket_name = bucket_name or os.getenv("AWS_S3_BUCKET_NAME")

        # Check if AWS S3 is intended to be used
        # Only raise errors if keys/config are missing *and* AWS is the selected provider
        provider_str = os.getenv("STORAGE_PROVIDER", StorageProvider.SUPABASE)
        if provider_str == StorageProvider.AWS_S3:
            if (
                not aws_access_key
                or not aws_secret_key
                or not aws_region
                or not self.bucket_name
            ):
                raise ValueError(
                    "AWS S3 is the selected storage provider, but AWS_ACCESS_KEY_ID, "
                    "AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_S3_BUCKET_NAME must be set in .env"
                )
        elif (
            aws_access_key or aws_secret_key
        ):  # Log if keys present but S3 not selected
            logger.info(
                "AWS keys found in environment, but STORAGE_PROVIDER is not set to 'aws_s3'. AWS S3 Storage will not be used."
            )
            # Don't proceed with S3 client init if not selected
            self.s3_client = None
            return
        else:  # No keys and S3 not selected
            self.s3_client = None
            return

        # Initialize AWS S3 client only if S3 is selected and configured
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=aws_region,
        )

        # Bucket existence check moved to initialize method
        # self._ensure_bucket_exists()

    async def initialize(self):
        """Ensure the AWS S3 bucket exists."""
        await self._ensure_bucket_exists()

    async def _ensure_bucket_exists(self):
        """Make sure the specified bucket exists, create if it doesn't"""
        if not self.s3_client:
            logger.warning("AWS S3 client not initialized. Cannot check/create bucket.")
            return

        try:
            async with aioboto3.client("s3",
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                region_name=os.getenv("AWS_REGION")) as s3:
                await s3.head_bucket(Bucket=self.bucket_name)
            logger.info(f"AWS S3 bucket '{self.bucket_name}' already exists.")
        except ClientError as e:
            # If a ClientError is thrown, then check the error code
            # for a missing bucket or insufficient permissions.
            error_code = int(e.response['Error']['Code'])
            if error_code == 404:
                logger.info(f"AWS S3 bucket '{self.bucket_name}' does not exist. Creating...")
                try:
                    async with aioboto3.client("s3",
                        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                        region_name=os.getenv("AWS_REGION")) as s3:
                        await s3.create_bucket(Bucket=self.bucket_name)
                    logger.info(f"AWS S3 bucket '{self.bucket_name}' created successfully.")
                except ClientError as ce:
                    logger.error(f"Error creating AWS S3 bucket '{self.bucket_name}': {ce}")
                    raise
            else:
                logger.error(f"Error checking AWS S3 bucket '{self.bucket_name}': {e}")
                raise
        except Exception as e:
            logger.error(f"Unexpected error checking/creating AWS S3 bucket: {e}")
            raise

    async def upload_file(
        self, file_content: Union[bytes, BinaryIO], file_name: str, content_type: str
    ) -> Dict[str, Any]:
        """Upload a file to AWS S3 and return the URL"""
        if not self.s3_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AWS S3 Storage is not configured or enabled.",
            )
        try:
            # Generate a unique path to avoid collisions
            unique_id = str(uuid.uuid4())
            file_path = f"{unique_id}/{file_name}"

            # Upload the file
            logger.info(f"Uploading file {file_name} to S3 as {file_path}")

            # If file_content is a file-like object, no need to wrap in BytesIO
            if isinstance(file_content, bytes):
                file_obj = io.BytesIO(file_content)
            else:
                file_obj = file_content

            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                file_path,
                ExtraArgs={"ContentType": content_type},
            )

            # Create a URL for the file
            # await needed here
            file_url = await self.generate_presigned_url(file_path)

            return {
                "url": file_url,
                "key": file_path,
                "provider": StorageProvider.AWS_S3,
            }
        except Exception as e:
            logger.error(f"Error uploading file to S3: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file to S3: {str(e)}",
            )

    async def download_file(self, file_path: str) -> bytes:
        """Download a file from AWS S3"""
        if not self.s3_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AWS S3 Storage is not configured or enabled.",
            )
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=file_path)
            return response["Body"].read()
        except Exception as e:
            logger.error(f"Error downloading file from S3: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to download file from S3: {str(e)}",
            )

    async def delete_file(self, file_path: str) -> bool:
        """Delete a file from AWS S3"""
        if not self.s3_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AWS S3 Storage is not configured or enabled.",
            )
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=file_path)
            return True
        except Exception as e:
            logger.error(f"Error deleting file from S3: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete file: {str(e)}",
            )

    async def generate_presigned_url(self, file_path: str, expiration: int = 3600) -> str:
        """Generate a presigned URL for file access in AWS S3"""
        if not self.s3_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AWS S3 Storage is not configured or enabled.",
            )
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": file_path},
                ExpiresIn=expiration,
            )
            return url
        except Exception as e:
            logger.error(f"Error generating presigned URL in S3: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate URL from S3: {str(e)}",
            )

    async def generate_presigned_upload_url(self, file_path: str, expiration: int = 3600) -> str:
        """Generate a presigned URL specifically for uploading a file to AWS S3"""
        if not self.s3_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AWS S3 Storage is not configured or enabled.",
            )
        try:
            url = self.s3_client.generate_presigned_url(
                "put_object",
                Params={"Bucket": self.bucket_name, "Key": file_path},
                ExpiresIn=expiration,
            )
            return url
        except Exception as e:
            logger.error(f"Error generating presigned upload URL in S3: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate upload URL from S3: {str(e)}",
            )


# Storage factory to switch between providers
class StorageFactory:
    @staticmethod
    def get_storage(
        provider: StorageProvider = None, bucket_name: str = None
    ) -> StorageInterface:
        """Factory method to get the appropriate storage implementation"""
        # Use environment variable if provider not specified
        if provider is None:
            provider_str = os.getenv("STORAGE_PROVIDER", StorageProvider.SUPABASE)
            try:
                provider = StorageProvider(provider_str)
            except ValueError:
                logger.warning(
                    f"Invalid storage provider {provider_str}, using Supabase"
                )
                provider = StorageProvider.SUPABASE

        # Return the appropriate storage implementation
        if provider == StorageProvider.SUPABASE:
            bucket = bucket_name or "documents"
            return SupabaseStorage(bucket)
        elif provider == StorageProvider.AWS_S3:
            return AWSS3Storage(bucket_name)
        else:
            logger.warning(f"Unsupported storage provider {provider}, using Supabase")
            return SupabaseStorage(bucket_name or "documents")


# Storage Service Facade
class StorageService:
    """Service to manage interactions with the configured storage provider."""

    def __init__(self):
        """Initialize the storage service by getting the configured provider."""
        provider_str = settings.STORAGE_PROVIDER
        try:
            provider = StorageProvider(provider_str)
            logger.info(f"Using storage provider: {provider.value}")
            # Assuming bucket name comes from settings or a default
            bucket_name = settings.SUPABASE_DEFAULT_BUCKET if provider == StorageProvider.SUPABASE else settings.AWS_S3_BUCKET_NAME
            self.storage_instance = StorageFactory.get_storage(provider, bucket_name)
        except ValueError:
            logger.error(f"Invalid STORAGE_PROVIDER: {provider_str}. Using Supabase as default.")
            self.storage_instance = StorageFactory.get_storage(StorageProvider.SUPABASE, settings.SUPABASE_DEFAULT_BUCKET)
        except Exception as e:
            logger.error(f"Failed to initialize storage provider: {e}", exc_info=True)
            # Handle fallback or raise critical error
            raise RuntimeError("Storage service could not be initialized.")

    async def initialize(self):
        """Perform asynchronous initialization for the storage service."""
        logger.info("Initializing storage service backend...")
        if hasattr(self.storage_instance, 'initialize') and asyncio.iscoroutinefunction(self.storage_instance.initialize):
            await self.storage_instance.initialize()
            logger.info("Storage service backend initialized successfully.")
        else:
            logger.warning("Storage provider instance does not have an async initialize method.")

    # --- Make methods async and add await --- 

    async def _ensure_buckets_exist(self, bucket_names: list[str]) -> None:
         # Implementation likely involves awaiting provider methods
         # This method might not be strictly needed if handled in provider __init__
         logger.warning("_ensure_buckets_exist not fully implemented in StorageService")
         pass 

    async def upload_document(
        self,
        file_content: bytes,
        storage_path: str,
        storage_bucket: str = "documents",
        content_type: str = "application/octet-stream",
    ) -> Dict[str, Any]:
        """Uploads a document using the configured storage provider."""
        # Ensure instance has the correct bucket context if necessary
        # (Assuming provider handles bucket internally or was initialized with it)
        logger.info(f"StorageService: Uploading {storage_path} to bucket {storage_bucket}")
        # Add await here
        result = await self.storage_instance.upload_file(
            file_content=file_content, file_name=storage_path, content_type=content_type
        )
        return result

    async def get_document(self, path: str, bucket: str = "documents") -> bytes:
        """Gets document content from the configured storage provider."""
        logger.info(f"StorageService: Getting {path} from bucket {bucket}")
        # Add await here
        content = await self.storage_instance.download_file(file_path=path)
        return content

    async def get_document_url(
        self, path: str, bucket: str = "documents", expires_in: int = 3600
    ) -> str:
        """Generates a presigned URL for a document."""
        logger.info(f"StorageService: Generating URL for {path} in bucket {bucket}")
        # Add await here
        url = await self.storage_instance.generate_presigned_url(file_path=path, expiration=expires_in)
        return url

    async def delete_document(self, path: str, bucket: str = "documents") -> None:
        """Deletes a document from the configured storage provider."""
        logger.info(f"StorageService: Deleting {path} from bucket {bucket}")
        # Add await here
        await self.storage_instance.delete_file(file_path=path)

    async def list_files(
        self, prefix: str = "", bucket: str = "documents", limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Lists files in the configured storage provider."""
        logger.info(f"StorageService: Listing files with prefix '{prefix}' in bucket {bucket}")
        # Add await here - Assuming list_files exists and is async in the interface/provider
        if hasattr(self.storage_instance, 'list_files') and asyncio.iscoroutinefunction(self.storage_instance.list_files):
             files = await self.storage_instance.list_files(prefix=prefix, limit=limit)
             return files
        else:
             logger.warning(f"Storage provider {type(self.storage_instance)} does not have an async list_files method.")
             return [] # Return empty list if method doesn't exist or isn't async

    # Presigned URL generation specific method
    # Make this async and add await
    async def generate_presigned_upload_url(
        self, 
        storage_bucket: str, 
        storage_path: str, 
        content_type: str, # Keep content_type argument, might be needed by some providers
        expiry: int = 300
    ) -> str:
         """Generates a presigned URL specifically for uploads."""
         logger.info(f"StorageService: Generating presigned upload URL for {storage_path} in {storage_bucket}")
         # Use the specialized upload URL generation method
         url = await self.storage_instance.generate_presigned_upload_url(file_path=storage_path, expiration=expiry)
         return url

    async def check_file_exists(self, path: str, bucket: str = None) -> bool:
        """
        Check if a file exists in storage using direct Supabase API calls.
        
        Args:
            path: The file path in storage
            bucket: The storage bucket name (defaults to self.bucket_name)
            
        Returns:
            bool: True if file exists, False otherwise
        """
        try:
            # Get bucket name from parameter or class attribute if available
            bucket_name = bucket
            if bucket_name is None and hasattr(self.storage_instance, 'bucket_name'):
                bucket_name = self.storage_instance.bucket_name
            elif bucket_name is None:
                bucket_name = "documents"  # Default fallback
                
            logger.info(f"Checking if file exists: {path} in bucket {bucket_name}")
            
            # Get Supabase URL and key from settings directly
            supabase_url = settings.SUPABASE_URL
            supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY
            
            if not supabase_url or not supabase_key:
                logger.error("Supabase credentials not found in settings")
                return False
            
            # Use httpx for direct API calls to Supabase
            # Construct the URL for the HEAD request
            url = f"{supabase_url}/storage/v1/object/{bucket_name}/{path}"
            
            # Prepare headers with authentication
            headers = {
                "Authorization": f"Bearer {supabase_key}",
                "apikey": supabase_key,
            }
            
            # Make a HEAD request to check if file exists
            async with httpx.AsyncClient() as client:
                try:
                    response = await client.head(url, headers=headers, timeout=5.0)
                    
                    if response.status_code == 200:
                        logger.info(f"File exists: {path}")
                        return True
                    else:
                        logger.warning(f"File does not exist (status {response.status_code}): {path}")
                        return False
                except Exception as head_error:
                    logger.error(f"Error checking if file exists via HEAD: {str(head_error)}")
                    
                    # Fall back to list method
                    try:
                        # Try to list files with the path as prefix
                        list_url = f"{supabase_url}/storage/v1/object/list/{bucket_name}"
                        list_params = {"prefix": path}
                        
                        list_response = await client.get(
                            list_url, 
                            headers=headers, 
                            params=list_params,
                            timeout=5.0
                        )
                        
                        if list_response.status_code == 200:
                            files = list_response.json()
                            # Check if our file is in the list
                            exists = any(file.get("name") == path for file in files)
                            logger.info(f"File existence check via list: {exists}")
                            return exists
                        else:
                            logger.warning(f"Failed to list files (status {list_response.status_code})")
                            return False
                            
                    except Exception as list_error:
                        logger.error(f"Error checking file via list: {str(list_error)}")
                        return False
        
        except Exception as e:
            logger.error(f"Error in check_file_exists: {str(e)}")
            return False

# Global storage service instance
_storage_service = None


def get_storage_service() -> StorageService:
    """Get or create a singleton instance of StorageService."""
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
        # NOTE: The caller of get_storage_service MUST now await
        # _storage_service.initialize() after getting the instance.
        # This should typically happen during application startup.
        # Example (in main.py or similar):
        #
        # @app.on_event("startup")
        # async def startup_event():
        #     storage_service = get_storage_service()
        #     await storage_service.initialize()
        #
    return _storage_service


# TODO: Refactor StorageService initialization to use an async setup method
# to properly await _ensure_buckets_exist and other async setup tasks.
# Currently, _ensure_buckets_exist is not called automatically after init.
