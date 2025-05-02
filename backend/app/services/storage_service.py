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

# Load environment variables
load_dotenv()

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
    def upload_file(
        self, file_content: Union[bytes, BinaryIO], file_name: str, content_type: str
    ) -> str:
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


# Supabase Storage implementation
class SupabaseStorage(StorageInterface):
    def __init__(self, bucket_name: str = "documents"):
        """Initialize Supabase storage with specified bucket"""
        self.bucket_name = bucket_name

        # Get credentials from environment variables
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

        # Initialize Supabase client
        self.supabase: Client = create_client(supabase_url, supabase_key)

        # Ensure bucket exists
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Make sure the specified bucket exists, create if it doesn't"""
        try:
            # Get list of buckets
            buckets_response = self.supabase.storage.list_buckets()
            bucket_exists = False

            # Handle different response formats based on Supabase client version
            if isinstance(buckets_response, list):
                bucket_exists = any(
                    bucket.get("name") == self.bucket_name
                    for bucket in buckets_response
                )
            else:
                # Try various ways to extract bucket names
                try:
                    # Try accessing buckets as objects with name attribute
                    bucket_exists = any(
                        bucket.name == self.bucket_name for bucket in buckets_response
                    )
                except AttributeError:
                    # Try accessing buckets as objects that can be converted to dict
                    try:
                        bucket_exists = any(
                            bucket.to_dict().get("name") == self.bucket_name
                            for bucket in buckets_response
                        )
                    except (AttributeError, TypeError):
                        # As a fallback, just log and continue
                        logger.warning(
                            f"Could not determine if bucket '{self.bucket_name}' exists, attempting to create it anyway"
                        )

            if not bucket_exists:
                logger.info(f"Creating Supabase Storage bucket: {self.bucket_name}")
                try:
                    # Try the public flag parameter
                    self.supabase.storage.create_bucket(
                        self.bucket_name, {"public": False}
                    )
                except TypeError:
                    # If the client doesn't support the options parameter
                    self.supabase.storage.create_bucket(self.bucket_name)
                logger.info(f"Created bucket: {self.bucket_name}")
        except Exception as e:
            logger.error(f"Error checking/creating bucket: {str(e)}")
            logger.warning(f"Continuing without bucket creation: {self.bucket_name}")
            pass

    def upload_file(
        self, file_content: Union[bytes, BinaryIO], file_name: str, content_type: str
    ) -> str:
        """Upload a file to Supabase storage and return the URL"""
        try:
            # Generate a unique path to avoid collisions
            file_extension = file_name.split(".")[-1] if "." in file_name else ""
            unique_id = str(uuid.uuid4())
            file_path = f"{unique_id}/{file_name}"

            # Upload the file
            logger.info(
                f"Uploading file {file_name} to Supabase Storage as {file_path}"
            )
            self.supabase.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=file_content,
                file_options={"content-type": content_type},
            )

            # Create a URL for the file
            # Note: This creates a temporary URL that expires, use generate_presigned_url for permanent links
            file_url = self.generate_presigned_url(file_path)

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

    def download_file(self, file_path: str) -> bytes:
        """Download a file from Supabase storage"""
        try:
            return self.supabase.storage.from_(self.bucket_name).download(file_path)
        except Exception as e:
            logger.error(f"Error downloading file from Supabase: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to download file: {str(e)}",
            )

    def delete_file(self, file_path: str) -> bool:
        """Delete a file from Supabase storage"""
        try:
            self.supabase.storage.from_(self.bucket_name).remove([file_path])
            return True
        except Exception as e:
            logger.error(f"Error deleting file from Supabase: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete file: {str(e)}",
            )

    def generate_presigned_url(self, file_path: str, expiration: int = 3600) -> str:
        """Generate a presigned URL for file access in Supabase storage"""
        try:
            signed_url = self.supabase.storage.from_(
                self.bucket_name
            ).create_signed_url(path=file_path, expires_in=expiration)
            return signed_url["signedURL"]
        except Exception as e:
            logger.error(f"Error generating presigned URL in Supabase: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate URL: {str(e)}",
            )


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

        # Ensure bucket exists
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Make sure the specified bucket exists, create if it doesn't"""
        # Skip if S3 client wasn't initialized
        if not self.s3_client:
            return

        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"S3 bucket exists: {self.bucket_name}")
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code")
            if error_code == "404":
                logger.info(
                    f"Creating S3 bucket: {self.bucket_name} in region {os.getenv('AWS_REGION')}"
                )
                try:
                    # Use the region from env var directly
                    self.s3_client.create_bucket(
                        Bucket=self.bucket_name,
                        CreateBucketConfiguration={
                            "LocationConstraint": os.getenv("AWS_REGION")
                        },
                    )
                    logger.info(f"Created S3 bucket: {self.bucket_name}")
                except Exception as create_err:
                    logger.error(
                        f"Failed to automatically create S3 bucket {self.bucket_name}: {create_err}"
                    )
                    # Don't raise HTTPException here, let caller handle potential downstream errors
                    pass
            else:
                logger.error(f"Error checking S3 bucket: {str(e)}")
                # Don't raise HTTPException here during init
                pass

    def upload_file(
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
            file_url = self.generate_presigned_url(file_path)

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

    def download_file(self, file_path: str) -> bytes:
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

    def delete_file(self, file_path: str) -> bool:
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
                detail=f"Failed to delete file from S3: {str(e)}",
            )

    def generate_presigned_url(self, file_path: str, expiration: int = 3600) -> str:
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


# Main storage service with high-level operations
class StorageService:
    def __init__(self, provider: StorageProvider = None, bucket_name: str = None):
        """Initialize the storage service with the specified provider"""
        self.storage = StorageFactory.get_storage(provider, bucket_name)
        logger.info(
            f"Storage service initialized with provider: {self.storage.__class__.__name__}"
        )

    def upload_document(
        self, file_content: Union[bytes, BinaryIO], file_name: str, content_type: str
    ) -> Dict[str, Any]:
        """Upload a document and return metadata"""
        return self.storage.upload_file(file_content, file_name, content_type)

    def get_document(self, file_path: str) -> bytes:
        """Get document content by its path"""
        return self.storage.download_file(file_path)

    def delete_document(self, file_path: str) -> bool:
        """Delete a document by its path"""
        return self.storage.delete_file(file_path)

    def get_document_url(self, file_path: str, expiration: int = 3600) -> str:
        """Generate a URL for accessing the document"""
        return self.storage.generate_presigned_url(file_path, expiration)


# Default storage service instance with Supabase provider
default_storage_service = StorageService()
