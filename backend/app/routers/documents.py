from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Form,
    BackgroundTasks,
    Query,
)
from typing import List, Optional
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from app.models.document import (
    DocumentCreate,
    DocumentResponse,
    PresignedUrlResponse,
    DocumentUpdate,
)
from app.services.dependencies import (
    get_current_user,
    get_embedding_service,
    get_vector_store_service,
)
from app.services.storage_service import (
    default_storage_service,
    StorageService,
    StorageProvider,
)
from app.services.embedding_service import EmbeddingService
from app.services.vector_store_service import VectorStoreService
from datetime import datetime
import uuid
import logging
import tempfile  # Added for temporary file handling
from app.services.document_service import DocumentService
from app.services.database_service import DatabaseService

# Langchain imports for loading and splitting
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain.text_splitter import (
    RecursiveCharacterTextSplitter,
)  # Using recursive splitter

# Load environment variables
load_dotenv()

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

router = APIRouter(
    prefix="/api/documents",
    tags=["documents"],
)

logger = logging.getLogger(__name__)

# Initialize services
db_service = DatabaseService()
document_service = DocumentService()


@router.post(
    "/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED
)
async def upload_document(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user=Depends(get_current_user),
):
    """Upload a document to a project."""
    try:
        if not name:
            name = file.filename

        logger.info(f"Uploading document '{name}' to project {project_id}")

        # Verify project exists and user has access to it
        project = db_service.get_project(project_id)
        if project["user_id"] != current_user["id"]:
            # Check if project is shared with the user
            shared_access = db_service.execute_custom_query(
                table="shared_objects",
                query_params={
                    "select": "*",
                    "filters": {
                        "object_type": "eq.project",
                        "object_id": f"eq.{project_id}",
                        "shared_with": f"eq.{current_user['id']}",
                    },
                },
            )

            if not shared_access and not project["is_public"]:
                logger.warning(
                    f"User {current_user['id']} not authorized to upload to project {project_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to upload to this project",
                )

        # Process and upload the document
        result = await document_service.process_document_upload(
            file=file,
            project_id=project_id,
            user_id=current_user["id"],
            name=name,
            description=description,
        )

        logger.info(f"Document uploaded successfully with ID: {result['id']}")
        return result
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}",
        )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, current_user=Depends(get_current_user)):
    """Get a specific document by ID."""
    try:
        logger.info(f"Getting document with ID: {document_id}")

        # Get document from database
        document = db_service.get_document(document_id)

        # Verify access
        if document["user_id"] != current_user["id"]:
            # Get the project to check if it's public
            project = db_service.get_project(document["project_id"])

            if not project["is_public"]:
                # Check if the project is shared with the user
                shared_access = db_service.execute_custom_query(
                    table="shared_objects",
                    query_params={
                        "select": "*",
                        "filters": {
                            "object_type": "eq.project",
                            "object_id": f"eq.{document['project_id']}",
                            "shared_with": f"eq.{current_user['id']}",
                        },
                    },
                )

                if not shared_access:
                    logger.warning(
                        f"User {current_user['id']} not authorized to access document {document_id}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Not authorized to access this document",
                    )

        logger.info(f"Document found: {document['name']}")
        return document
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error getting document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get document: {str(e)}",
        )


@router.get("/project/{project_id}", response_model=List[DocumentResponse])
async def list_project_documents(
    project_id: str,
    current_user=Depends(get_current_user),
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List all documents in a project."""
    try:
        logger.info(f"Listing documents for project ID: {project_id}")

        # Verify project exists and user has access to it
        project = db_service.get_project(project_id)
        if project["user_id"] != current_user["id"] and not project["is_public"]:
            # Check if project is shared with the user
            shared_access = db_service.execute_custom_query(
                table="shared_objects",
                query_params={
                    "select": "*",
                    "filters": {
                        "object_type": "eq.project",
                        "object_id": f"eq.{project_id}",
                        "shared_with": f"eq.{current_user['id']}",
                    },
                },
            )

            if not shared_access:
                logger.warning(
                    f"User {current_user['id']} not authorized to access project {project_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to access documents in this project",
                )

        # Query documents from database
        documents = db_service.list_documents(
            project_id=project_id, limit=limit, offset=offset
        )

        logger.info(f"Found {len(documents)} documents for project")
        return documents
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list documents: {str(e)}",
        )


@router.patch("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    document_update: DocumentUpdate,
    current_user=Depends(get_current_user),
):
    """Update a document's metadata."""
    try:
        logger.info(f"Updating document with ID: {document_id}")

        # First get the document to check ownership
        existing_document = db_service.get_document(document_id)

        # Verify ownership
        if existing_document["user_id"] != current_user["id"]:
            # Check if the user has write access through project sharing
            project = db_service.get_project(existing_document["project_id"])

            if project["user_id"] != current_user["id"]:
                shared_access = db_service.execute_custom_query(
                    table="shared_objects",
                    query_params={
                        "select": "*",
                        "filters": {
                            "object_type": "eq.project",
                            "object_id": f"eq.{existing_document['project_id']}",
                            "shared_with": f"eq.{current_user['id']}",
                            "permission_level": "in.(write,admin)",
                        },
                    },
                )

                if not shared_access:
                    logger.warning(
                        f"User {current_user['id']} not authorized to update document {document_id}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Not authorized to update this document",
                    )

        # Prepare update data
        update_data = document_update.dict(exclude_unset=True)

        # Update document in database
        updated_document = db_service.update_document(document_id, update_data)

        logger.info(f"Document updated successfully: {updated_document['name']}")
        return updated_document
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error updating document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update document: {str(e)}",
        )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(document_id: str, current_user=Depends(get_current_user)):
    """Delete a document."""
    try:
        logger.info(f"Deleting document with ID: {document_id}")

        # First get the document to check ownership
        existing_document = db_service.get_document(document_id)

        # Check if user owns the document or has admin access to the project
        if existing_document["user_id"] != current_user["id"]:
            # Check if user is the project owner or has admin access to the project
            project = db_service.get_project(existing_document["project_id"])

            if project["user_id"] != current_user["id"]:
                shared_access = db_service.execute_custom_query(
                    table="shared_objects",
                    query_params={
                        "select": "*",
                        "filters": {
                            "object_type": "eq.project",
                            "object_id": f"eq.{existing_document['project_id']}",
                            "shared_with": f"eq.{current_user['id']}",
                            "permission_level": "eq.admin",
                        },
                    },
                )

                if not shared_access:
                    logger.warning(
                        f"User {current_user['id']} not authorized to delete document {document_id}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Not authorized to delete this document",
                    )

        # Delete document from Pinecone if it's been indexed
        if (
            existing_document["status"] == "indexed"
            and existing_document["pinecone_namespace"]
        ):
            try:
                await document_service.delete_document_embeddings(
                    existing_document["pinecone_namespace"]
                )
            except Exception as e:
                logger.error(f"Failed to delete document embeddings: {str(e)}")
                # Continue with database deletion even if vector deletion fails

        # Delete document from storage
        try:
            await document_service.delete_document_from_storage(
                bucket=existing_document["storage_bucket"],
                path=existing_document["storage_path"],
            )
        except Exception as e:
            logger.error(f"Failed to delete document from storage: {str(e)}")
            # Continue with database deletion even if storage deletion fails

        # Delete document from database
        db_service.delete_document(document_id)

        logger.info(f"Document {document_id} deleted successfully")
        return None
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}",
        )


@router.post("/{document_id}/reprocess", response_model=DocumentResponse)
async def reprocess_document(document_id: str, current_user=Depends(get_current_user)):
    """Reprocess a document that may have failed indexing previously."""
    try:
        logger.info(f"Reprocessing document with ID: {document_id}")

        # First get the document to check ownership
        existing_document = db_service.get_document(document_id)

        # Verify ownership or admin access
        if existing_document["user_id"] != current_user["id"]:
            project = db_service.get_project(existing_document["project_id"])

            if project["user_id"] != current_user["id"]:
                shared_access = db_service.execute_custom_query(
                    table="shared_objects",
                    query_params={
                        "select": "*",
                        "filters": {
                            "object_type": "eq.project",
                            "object_id": f"eq.{existing_document['project_id']}",
                            "shared_with": f"eq.{current_user['id']}",
                            "permission_level": "in.(write,admin)",
                        },
                    },
                )

                if not shared_access:
                    logger.warning(
                        f"User {current_user['id']} not authorized to reprocess document {document_id}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Not authorized to reprocess this document",
                    )

        # Update document status to processing
        db_service.update_document(
            document_id, {"status": "processing", "processing_error": None}
        )

        # Trigger background processing
        await document_service.queue_document_processing(document_id)

        # Get updated document
        updated_document = db_service.get_document(document_id)

        logger.info(f"Document {document_id} queued for reprocessing")
        return updated_document
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error reprocessing document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reprocess document: {str(e)}",
        )
