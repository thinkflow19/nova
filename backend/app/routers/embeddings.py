from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Dict
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from app.services.dependencies import get_current_user
from app.services.embedding_service import (
    extract_text_from_file,
    chunk_text,
    create_embeddings,
)
import uuid

# Load environment variables
load_dotenv()

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

router = APIRouter(
    prefix="/api/embed",
    tags=["embeddings"],
)


async def process_document_embedding(document_id: str):
    """Background task to process document embedding."""
    try:
        # Get document details
        response = (
            supabase.table("documents").select("*").eq("id", document_id).execute()
        )
        if not response.data:
            print(f"Document not found: {document_id}")
            return

        document = response.data[0]

        # Extract text from document
        text = extract_text_from_file(document["file_url"], document["file_name"])

        # Chunk text
        text_chunks = chunk_text(text)

        # Create metadata
        metadata = {
            "document_id": document["id"],
            "project_id": document["project_id"],
            "file_name": document["file_name"],
        }

        # Create embeddings
        embedding_id = create_embeddings(text_chunks, metadata)

        # Update document with embedding ID
        supabase.table("documents").update({"embedding_id": embedding_id}).eq(
            "id", document_id
        ).execute()

        print(f"Successfully embedded document: {document_id}")

    except Exception as e:
        print(f"Error embedding document {document_id}: {str(e)}")


@router.post("/{document_id}")
async def embed_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    """Embed a document in the vector store."""
    try:
        # Verify document ownership
        response = (
            supabase.table("documents").select("*").eq("id", document_id).execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
            )

        document = response.data[0]

        # Get project
        response = (
            supabase.table("projects")
            .select("*")
            .eq("id", document["project_id"])
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        project = response.data[0]

        # Verify ownership
        if project["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to embed this document",
            )

        # Schedule background task
        background_tasks.add_task(process_document_embedding, document_id)

        return {"message": "Document embedding started", "document_id": document_id}

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start embedding: {str(e)}",
        )


@router.post("/batch/{project_id}")
async def batch_embed_documents(
    project_id: str,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    """Embed all documents for a project."""
    try:
        # Verify project ownership
        response = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        project = response.data[0]

        # Verify ownership
        if project["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this project",
            )

        # Get all documents for project that don't have embeddings yet
        response = (
            supabase.table("documents")
            .select("*")
            .eq("project_id", project_id)
            .is_("embedding_id", "null")
            .execute()
        )

        # Schedule embedding tasks
        for document in response.data:
            background_tasks.add_task(process_document_embedding, document["id"])

        return {
            "message": f"Started embedding {len(response.data)} documents",
            "document_count": len(response.data),
        }

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start batch embedding: {str(e)}",
        )
