import os
import uuid
import logging
from typing import Dict, List, Any, Optional
import aiofiles
from fastapi import UploadFile
from datetime import datetime
import asyncio
import json

from app.services.database_service import DatabaseService
from app.services.storage_service import StorageService, get_storage_service
from app.services.embedding_service import EmbeddingService, get_embedding_service
from app.services.vector_store_service import (
    VectorStoreService,
    get_vector_store_service,
)

# Configure logging
logger = logging.getLogger(__name__)


class DocumentService:
    """Service for document-related operations including uploads, processing and indexing."""

    def __init__(self):
        """Initialize the document service with required services."""
        self.db_service = DatabaseService()
        self.storage_service = get_storage_service()
        self.embedding_service = get_embedding_service()
        self.vector_store_service = get_vector_store_service()
        logger.info("Document service initialized")

    async def process_document_upload(
        self,
        file: UploadFile,
        project_id: str,
        user_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process an uploaded document file.

        This method:
        1. Validates the upload
        2. Stores the file in cloud storage
        3. Creates a database record for the document
        4. Queues the document for processing
        """
        try:
            logger.info(f"Processing document upload: {name or file.filename}")

            # 1. Validate file
            file_name = file.filename
            file_size = 0
            file_extension = (
                file_name.split(".")[-1].lower() if "." in file_name else ""
            )

            # Check file type
            allowed_extensions = ["pdf", "docx", "txt", "md", "csv", "json"]
            if file_extension not in allowed_extensions:
                raise ValueError(
                    f"Unsupported file type: {file_extension}. Supported types: {', '.join(allowed_extensions)}"
                )

            # Read file content
            file_content = await file.read()
            file_size = len(file_content)

            # Check file size (10MB limit)
            file_size_limit = 10 * 1024 * 1024  # 10MB
            if file_size > file_size_limit:
                raise ValueError(f"File too large. Maximum size: 10MB")

            # 2. Upload to storage
            storage_bucket = "documents"
            storage_path = f"{project_id}/{uuid.uuid4()}-{file_name}"

            upload_result = self.storage_service.upload_document(
                file_content=file_content,
                storage_path=storage_path,
                storage_bucket=storage_bucket,
                content_type=file.content_type or "application/octet-stream",
            )

            # 3. Create document in database
            document = self.db_service.create_document(
                name=name or file_name,
                description=description,
                project_id=project_id,
                user_id=user_id,
                storage_path=storage_path,
                storage_bucket=storage_bucket,
                file_type=file_extension,
                file_size=file_size,
                metadata={
                    "original_filename": file_name,
                    "content_type": file.content_type,
                    "upload_timestamp": datetime.utcnow().isoformat(),
                },
            )

            # 4. Queue document for processing
            asyncio.create_task(self.queue_document_processing(document["id"]))

            # Return the document record
            return document

        except Exception as e:
            logger.error(f"Error in document upload processing: {str(e)}")
            raise

    async def queue_document_processing(self, document_id: str) -> None:
        """Queue a document for background processing."""
        # This would ideally be a message to a queue system like RabbitMQ, Kafka, or a cloud queue
        # For simplicity, we'll create a background task directly
        try:
            logger.info(f"Queueing document ID {document_id} for processing")

            # Spawn a background task for processing
            # Don't await this task - let it run in the background
            asyncio.create_task(self.process_document(document_id))

            logger.info(f"Document {document_id} successfully queued for processing")
        except Exception as e:
            logger.error(
                f"Failed to queue document {document_id} for processing: {str(e)}"
            )
            # Update document status to failed
            self.db_service.update_document(
                document_id,
                {
                    "status": "failed",
                    "processing_error": f"Failed to queue for processing: {str(e)}",
                },
            )
            raise

    async def process_document(self, document_id: str) -> None:
        """
        Process a document for semantic search indexing.

        This method:
        1. Retrieves the document from database
        2. Downloads the file from storage
        3. Extracts text content based on file type
        4. Chunks the text
        5. Creates embeddings
        6. Stores embeddings in vector database
        7. Updates document status
        """
        logger.info(f"Starting document processing for ID: {document_id}")

        # Update document status to processing
        self.db_service.update_document(
            document_id, {"status": "processing", "processing_error": None}
        )

        try:
            # 1. Get document details
            document = self.db_service.get_document(document_id)
            storage_path = document["storage_path"]
            storage_bucket = document["storage_bucket"]
            file_type = document["file_type"]

            # 2. Download file from storage
            file_content = self.storage_service.get_document(
                path=storage_path, bucket=storage_bucket
            )

            # 3. Extract text based on file type
            text_content = await self._extract_text_from_file(
                file_content=file_content, file_type=file_type, document_id=document_id
            )

            if not text_content:
                logger.warning(
                    f"No extractable text content found in document {document_id}"
                )
                self.db_service.update_document(
                    document_id,
                    {
                        "status": "failed",
                        "processing_error": "No extractable text content found in document",
                    },
                )
                return

            # 4. Chunk the text
            chunks = self._chunk_text(text_content)
            logger.info(f"Document {document_id} chunked into {len(chunks)} segments")

            if not chunks:
                logger.warning(f"No chunks produced for document {document_id}")
                self.db_service.update_document(
                    document_id,
                    {
                        "status": "failed",
                        "processing_error": "Document chunking failed - no chunks produced",
                    },
                )
                return

            # 5. Generate embeddings for chunks
            embeddings = await self.embedding_service.generate_embeddings(chunks)

            if len(embeddings) != len(chunks):
                error_msg = f"Mismatch between chunks ({len(chunks)}) and embeddings ({len(embeddings)})"
                logger.error(f"{error_msg} for document {document_id}")
                self.db_service.update_document(
                    document_id, {"status": "failed", "processing_error": error_msg}
                )
                return

            # 6. Prepare vectors for storage
            namespace = f"doc_{document_id}"
            vectors = []

            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                vector_id = f"{document_id}_{i}"
                metadata = {
                    "document_id": document_id,
                    "project_id": document["project_id"],
                    "text": chunk,
                    "chunk_index": i,
                    "file_type": file_type,
                    "timestamp": datetime.utcnow().isoformat(),
                }
                vectors.append((vector_id, embedding, metadata))

            # 7. Store vectors in vector database
            await self.vector_store_service.upsert_vectors(vectors, namespace)

            # 8. Update document status to indexed
            self.db_service.update_document(
                document_id,
                {
                    "status": "indexed",
                    "pinecone_namespace": namespace,
                    "chunk_count": len(chunks),
                },
            )

            logger.info(
                f"Document {document_id} processing completed successfully with {len(chunks)} chunks indexed"
            )

        except Exception as e:
            logger.error(f"Error processing document {document_id}: {str(e)}")
            error_msg = str(e)
            if len(error_msg) > 1000:
                error_msg = error_msg[:997] + "..."

            self.db_service.update_document(
                document_id, {"status": "failed", "processing_error": error_msg}
            )

    async def _extract_text_from_file(
        self, file_content: bytes, file_type: str, document_id: str
    ) -> str:
        """Extract text content from a file based on its type."""
        try:
            logger.info(
                f"Extracting text from {file_type} file for document {document_id}"
            )

            if file_type == "txt" or file_type == "md":
                # For text files, just decode the content
                return file_content.decode("utf-8", errors="replace")

            elif file_type == "pdf":
                # Use PyPDF to extract text from PDF
                # In a real implementation, would use a temporary file and PyPDF
                # For this example, simulate PDF extraction
                return f"Simulated PDF content extraction for document {document_id}"

            elif file_type == "docx":
                # Use docx2txt to extract text from DOCX
                # In a real implementation, would use a temporary file and docx2txt
                # For this example, simulate DOCX extraction
                return f"Simulated DOCX content extraction for document {document_id}"

            elif file_type == "csv":
                # For CSV, convert to text with a simple table representation
                return file_content.decode("utf-8", errors="replace")

            elif file_type == "json":
                # For JSON, pretty-print to text
                try:
                    json_data = json.loads(
                        file_content.decode("utf-8", errors="replace")
                    )
                    return json.dumps(json_data, indent=2)
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON content in document {document_id}")
                    return file_content.decode("utf-8", errors="replace")

            else:
                raise ValueError(
                    f"Unsupported file type for text extraction: {file_type}"
                )

        except Exception as e:
            logger.error(f"Error extracting text from {file_type} file: {str(e)}")
            raise

    def _chunk_text(
        self, text: str, chunk_size: int = 1000, overlap: int = 200
    ) -> List[str]:
        """Split text into overlapping chunks of specified size."""
        # Basic chunking strategy - in a real implementation, would use more sophisticated chunking
        # such as LangChain's text splitters or semantic chunking

        if not text:
            return []

        chunks = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = min(start + chunk_size, text_len)

            # If we're not at the beginning, try to find a good break point
            if start > 0:
                # Look for a sentence break (period followed by space) within the first 100 chars
                # of the chunk to create a better starting point
                search_range = min(100, end - start)
                for i in range(search_range):
                    if (
                        i + 1 < len(text)
                        and text[start + i] == "."
                        and text[start + i + 1] == " "
                    ):
                        start = start + i + 2
                        break

            chunk = text[start:end]
            chunks.append(chunk)

            # Calculate next start position with overlap
            next_start = start + (chunk_size - overlap)

            # If we're not at the end yet, try to find a good break point for the next chunk
            if next_start < text_len:
                # Look for a sentence break within ±50 chars of the next_start point
                search_start = max(0, next_start - 50)
                search_end = min(text_len, next_start + 50)

                # Default to next_start if no better break point is found
                break_point = next_start

                # Look for sentence breaks (period followed by space)
                for i in range(search_start, search_end):
                    if i + 1 < text_len and text[i] == "." and text[i + 1] == " ":
                        break_point = i + 2
                        if break_point > next_start:
                            # If we found a break after the next_start, use it
                            break

                start = break_point
            else:
                # We've reached the end
                break

        return chunks

    async def delete_document_embeddings(self, namespace: str) -> None:
        """Delete all embeddings for a document."""
        try:
            logger.info(f"Deleting embeddings for namespace: {namespace}")
            await self.vector_store_service.delete_namespace(namespace)
            logger.info(f"Successfully deleted embeddings for namespace: {namespace}")
        except Exception as e:
            logger.error(
                f"Error deleting embeddings for namespace {namespace}: {str(e)}"
            )
            raise

    async def delete_document_from_storage(self, bucket: str, path: str) -> None:
        """Delete a document file from storage."""
        try:
            logger.info(f"Deleting document from storage: {bucket}/{path}")
            self.storage_service.delete_document(path=path, bucket=bucket)
            logger.info(f"Successfully deleted document from storage: {bucket}/{path}")
        except Exception as e:
            logger.error(
                f"Error deleting document from storage {bucket}/{path}: {str(e)}"
            )
            raise


# Dependency to get the document service
def get_document_service() -> DocumentService:
    """Dependency that returns a document service instance."""
    return DocumentService()
