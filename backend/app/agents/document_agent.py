"""
Agent responsible for document management operations.
"""
import logging
import uuid
from typing import Dict, Any, List, Optional

from app.services.database_service import DatabaseService
from app.services.storage_service import get_storage_service

logger = logging.getLogger(__name__)

class DocumentAgent:
    def __init__(self):
        self.db_service = DatabaseService()
        self.storage_service = get_storage_service()

    async def _check_project_access(self, project_id: str, user_id: str) -> Dict[str, Any]:
        """Helper method to check if user has access to a project."""
        logger.info(f"DocumentAgent checking access to project {project_id} for user {user_id}")
        
        try:
            project = await self.db_service.get_project(project_id)
        except Exception as e:
            logger.error(f"DocumentAgent: Project {project_id} not found: {e}")
            raise ValueError(f"Project not found: {project_id}")
        
        # Check if user owns the project or has write access
        if project["user_id"] == user_id or project.get("is_public", False):
            return project
        
        # TODO: Check shared access for write permissions
        logger.warning(f"DocumentAgent: User {user_id} does not have access to project {project_id}")
        raise ValueError("You don't have access to this project")

    async def generate_upload_url(
        self, 
        file_name: str, 
        content_type: str, 
        project_id: str, 
        user_id: str
    ) -> Dict[str, Any]:
        """
        Generate a presigned URL for uploading a document.
        """
        logger.info(f"DocumentAgent generating upload URL for file: {file_name}, project: {project_id}")
        
        # Check project access
        await self._check_project_access(project_id, user_id)
        
        # Validate file type
        file_extension = file_name.split(".")[-1].lower() if "." in file_name else ""
        allowed_extensions = ["pdf", "docx", "txt", "md", "csv", "json"]
        
        if file_extension not in allowed_extensions:
            raise ValueError(f"Unsupported file type: {file_extension}. Supported types: {', '.join(allowed_extensions)}")
        
        # Generate storage path
        storage_bucket = "documents"
        storage_path = f"{project_id}/{uuid.uuid4()}-{file_name}"
        
        try:
            # Generate presigned URL
            presigned_url = await self.storage_service.generate_presigned_upload_url(
                storage_bucket=storage_bucket,
                storage_path=storage_path,
                content_type=content_type,
                expiry=300  # 5 minutes
            )
            
            # Prepare response
            response = {}
            if isinstance(presigned_url, dict):
                response = presigned_url.copy()
            else:
                response["presigned_url"] = presigned_url
                
            # Ensure these fields are always present
            response["file_key"] = storage_path
            response["bucket"] = storage_bucket
            response["document_id"] = storage_path  # For frontend compatibility
            
            logger.info(f"DocumentAgent: Generated upload URL for {file_name}")
            return response
            
        except Exception as e:
            logger.error(f"DocumentAgent: Error generating presigned URL: {e}")
            raise ValueError(f"Failed to generate presigned URL: {e}")

    async def confirm_upload(
        self, 
        file_name: str, 
        file_key: str, 
        project_id: str, 
        storage_bucket: str,
        content_type: str,
        user_id: str,
        file_size: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Confirm a document upload and create a database record.
        """
        logger.info(f"DocumentAgent confirming upload for file: {file_name}, project: {project_id}")
        
        # Check project access
        await self._check_project_access(project_id, user_id)
        
        try:
            # Create document record in database
            document_data = {
                "project_id": project_id,
                "user_id": user_id,
                "name": file_name,
                "storage_path": file_key,
                "storage_bucket": storage_bucket,
                "file_type": content_type,
                "file_size": file_size,
                "status": "uploaded"  # Initial status
            }
            
            created_document = await self.db_service.create_document(document_data)
            document_id = created_document["id"]
            
            # Schedule processing task
            task_params = {
                "document_id": document_id,
                "user_id": user_id,
                "storage_path": file_key,
                "storage_bucket": storage_bucket,
                "file_name": file_name
            }
            
            await self.db_service.create_scheduled_task(
                task_type="process_document",
                params=task_params
            )
            
            logger.info(f"DocumentAgent: Document {document_id} confirmed and scheduled for processing")
            
            return {
                "document_id": document_id,
                "status": "confirmed",
                "message": "Document upload confirmed and scheduled for processing"
            }
            
        except Exception as e:
            logger.error(f"DocumentAgent: Error confirming upload: {e}")
            raise ValueError(f"Failed to confirm upload: {e}")

    async def list_documents(
        self, 
        project_id: str, 
        user_id: str, 
        limit: int = 100, 
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        List documents in a project.
        """
        logger.info(f"DocumentAgent listing documents for project {project_id}, user {user_id}")
        
        # Check project access
        await self._check_project_access(project_id, user_id)
        
        try:
            documents = await self.db_service.list_documents(
                project_id=project_id, 
                limit=limit, 
                offset=offset
            )
            
            logger.info(f"DocumentAgent: Found {len(documents)} documents in project {project_id}")
            return documents
            
        except Exception as e:
            logger.error(f"DocumentAgent: Error listing documents: {e}")
            raise ValueError(f"Failed to list documents: {e}")

    async def get_document(self, document_id: str, user_id: str) -> Dict[str, Any]:
        """
        Get a specific document by ID.
        """
        logger.info(f"DocumentAgent getting document {document_id} for user {user_id}")
        
        try:
            document = await self.db_service.get_document(document_id)
        except Exception as e:
            logger.error(f"DocumentAgent: Document {document_id} not found: {e}")
            raise ValueError(f"Document not found: {document_id}")
        
        # Check if user has access to the document's project
        await self._check_project_access(document["project_id"], user_id)
        
        return document

    async def delete_document(self, document_id: str, user_id: str) -> Dict[str, Any]:
        """
        Delete a document and its associated storage.
        """
        logger.info(f"DocumentAgent deleting document {document_id} for user {user_id}")
        
        # Get document and check access
        document = await self.get_document(document_id, user_id)
        
        try:
            # Delete from storage
            await self.storage_service.delete_file(
                document["storage_path"], 
                document["storage_bucket"]
            )
            
            # Delete from database (this should cascade to related records)
            await self.db_service.delete_document(document_id)
            
            logger.info(f"DocumentAgent: Successfully deleted document {document_id}")
            
            return {
                "document_id": document_id,
                "status": "deleted",
                "message": "Document deleted successfully"
            }
            
        except Exception as e:
            logger.error(f"DocumentAgent: Error deleting document {document_id}: {e}")
            raise ValueError(f"Failed to delete document: {e}")

    async def upload_file_complete(
        self, 
        file_content: bytes, 
        file_name: str, 
        project_id: str, 
        user_id: str,
        content_type: str = "application/octet-stream"
    ) -> Dict[str, Any]:
        """
        Handle complete file upload (when file is uploaded directly to backend).
        """
        logger.info(f"DocumentAgent handling direct upload for file: {file_name}, project: {project_id}")
        
        # Check project access
        await self._check_project_access(project_id, user_id)
        
        try:
            # Upload to storage
            storage_bucket = "documents"
            storage_path = f"{project_id}/{uuid.uuid4()}-{file_name}"
            
            upload_result = await self.storage_service.upload_file(
                file_content=file_content,
                filename=file_name,
                bucket=storage_bucket,
                storage_path=storage_path
            )
            
            # Create document record
            document_data = {
                "project_id": project_id,
                "user_id": user_id,
                "name": file_name,
                "storage_path": storage_path,
                "storage_bucket": storage_bucket,
                "file_type": content_type,
                "file_size": len(file_content),
                "status": "uploaded"
            }
            
            created_document = await self.db_service.create_document(document_data)
            document_id = created_document["id"]
            
            # Schedule processing
            task_params = {
                "document_id": document_id,
                "user_id": user_id,
                "storage_path": storage_path,
                "storage_bucket": storage_bucket,
                "file_name": file_name
            }
            
            await self.db_service.create_scheduled_task(
                task_type="process_document",
                params=task_params
            )
            
            logger.info(f"DocumentAgent: Direct upload completed for document {document_id}")
            
            return {
                "document_id": document_id,
                "status": "uploaded",
                "message": "File uploaded and scheduled for processing",
                "storage_path": storage_path
            }
            
        except Exception as e:
            logger.error(f"DocumentAgent: Error in direct upload: {e}")
            raise ValueError(f"Failed to upload file: {e}") 