"""
Agent responsible for embedding operations.
"""
import logging
from typing import List, Dict, Any, Optional

from app.services.database_service import DatabaseService
from app.services.embedding_service import get_embedding_service, extract_text_from_file, chunk_text
from app.services.storage_service import get_storage_service
from app.services.vector_store_service import get_vector_store_service

logger = logging.getLogger(__name__)

class EmbeddingAgent:
    def __init__(self):
        self.db_service = DatabaseService()
        self.embedding_service = get_embedding_service()
        self.storage_service = get_storage_service()
        self.vector_store_service = get_vector_store_service()

    async def _check_document_access(self, document_id: str, user_id: str) -> tuple[Dict[str, Any], Dict[str, Any]]:
        """Helper method to check if user has access to a document."""
        logger.info(f"EmbeddingAgent checking access to document {document_id} for user {user_id}")
        
        try:
            document = await self.db_service.get_document(document_id)
        except Exception as e:
            logger.error(f"EmbeddingAgent: Document {document_id} not found: {e}")
            raise ValueError(f"Document not found: {document_id}")
        
        # Get the project to check ownership
        try:
            project = await self.db_service.get_project(document["project_id"])
        except Exception as e:
            logger.error(f"EmbeddingAgent: Project {document['project_id']} not found: {e}")
            raise ValueError(f"Project not found for document")
        
        # Check if user owns the project or if project is public
        if project["user_id"] == user_id or project.get("is_public", False):
            return document, project
        
        logger.warning(f"EmbeddingAgent: User {user_id} does not have access to document {document_id}")
        raise ValueError("You don't have access to this document")

    async def _check_project_access(self, project_id: str, user_id: str) -> Dict[str, Any]:
        """Helper method to check if user has access to a project."""
        logger.info(f"EmbeddingAgent checking access to project {project_id} for user {user_id}")
        
        try:
            project = await self.db_service.get_project(project_id)
        except Exception as e:
            logger.error(f"EmbeddingAgent: Project {project_id} not found: {e}")
            raise ValueError(f"Project not found: {project_id}")
        
        # Check if user owns the project
        if project["user_id"] == user_id:
            return project
        
        logger.warning(f"EmbeddingAgent: User {user_id} does not have access to project {project_id}")
        raise ValueError("You don't have access to this project")

    async def embed_document(self, document_id: str, user_id: str) -> Dict[str, Any]:
        """
        Embed a specific document in the vector store.
        """
        logger.info(f"EmbeddingAgent starting embedding process for document {document_id}")
        
        # Check access to document
        document, project = await self._check_document_access(document_id, user_id)
        
        # Check if document is already embedded or processing
        if document.get("status") == "indexed":
            logger.info(f"EmbeddingAgent: Document {document_id} is already embedded")
            return {
                "message": "Document is already embedded",
                "document_id": document_id,
                "status": "already_embedded"
            }
        
        try:
            # Update document status to processing
            await self.db_service.update_document_status(document_id, "processing")
            
            # Download document from storage
            storage_path = document["storage_path"]
            storage_bucket = document["storage_bucket"]
            
            logger.info(f"EmbeddingAgent: Downloading document from storage: {storage_bucket}/{storage_path}")
            file_content = await self.storage_service.get_file(storage_path, storage_bucket)
            
            # Extract text from document
            logger.info(f"EmbeddingAgent: Extracting text from document {document['name']}")
            text = await extract_text_from_file(file_content, document["name"])
            
            if not text or len(text.strip()) == 0:
                raise ValueError("No text could be extracted from the document")
            
            # Chunk the text
            logger.info(f"EmbeddingAgent: Chunking text for document {document_id}")
            chunks = chunk_text(text)
            
            if not chunks:
                raise ValueError("No chunks could be created from the extracted text")
            
            # Generate embeddings
            logger.info(f"EmbeddingAgent: Generating embeddings for {len(chunks)} chunks")
            embeddings = await self.embedding_service.generate_embeddings(chunks)
            
            if not embeddings or len(embeddings) != len(chunks):
                raise ValueError("Failed to generate embeddings for all chunks")
            
            # Store in vector database
            namespace = f"user_{project['user_id']}"
            logger.info(f"EmbeddingAgent: Storing embeddings in vector store (namespace: {namespace})")
            
            # Prepare metadata for each chunk
            chunk_data = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                chunk_metadata = {
                    "document_id": document_id,
                    "project_id": document["project_id"],
                    "user_id": user_id,
                    "chunk_index": i,
                    "filename": document["name"],
                    "file_type": document.get("file_type", ""),
                    "total_chunks": len(chunks)
                }
                
                chunk_data.append({
                    "id": f"{document_id}_chunk_{i}",
                    "embedding": embedding,
                    "text": chunk,
                    "metadata": chunk_metadata
                })
            
            # Store all chunks in vector database
            stored_count = await self.vector_store_service.store_embeddings(
                embeddings=chunk_data,
                namespace=namespace
            )
            
            if stored_count != len(chunks):
                logger.warning(f"EmbeddingAgent: Only {stored_count} out of {len(chunks)} chunks were stored")
            
            # Update document status and metadata
            await self.db_service.update_document_pinecone_namespace_and_chunk_count(
                document_id, namespace, len(chunks)
            )
            await self.db_service.update_document_status(document_id, "indexed")
            
            logger.info(f"EmbeddingAgent: Successfully embedded document {document_id} with {len(chunks)} chunks")
            
            return {
                "message": "Document embedded successfully",
                "document_id": document_id,
                "status": "embedded",
                "chunks_created": len(chunks),
                "chunks_stored": stored_count,
                "namespace": namespace
            }
            
        except Exception as e:
            logger.error(f"EmbeddingAgent: Error embedding document {document_id}: {e}")
            # Update document status to failed
            await self.db_service.update_document_status(
                document_id, "failed", f"Embedding failed: {str(e)}"
            )
            raise ValueError(f"Failed to embed document: {str(e)}")

    async def batch_embed_documents(self, project_id: str, user_id: str) -> Dict[str, Any]:
        """
        Embed all unprocessed documents in a project.
        """
        logger.info(f"EmbeddingAgent starting batch embedding for project {project_id}")
        
        # Check access to project
        project = await self._check_project_access(project_id, user_id)
        
        # Get all documents in the project that are not yet embedded
        try:
            all_documents = await self.db_service.list_documents(project_id)
            unembedded_documents = [
                doc for doc in all_documents 
                if doc.get("status") not in ["indexed", "processing"]
            ]
        except Exception as e:
            logger.error(f"EmbeddingAgent: Error fetching documents for project {project_id}: {e}")
            raise ValueError(f"Failed to fetch project documents: {e}")
        
        if not unembedded_documents:
            logger.info(f"EmbeddingAgent: No unembedded documents found in project {project_id}")
            return {
                "message": "No documents need embedding",
                "project_id": project_id,
                "documents_processed": 0,
                "documents_total": len(all_documents)
            }
        
        # Process each document
        success_count = 0
        failed_documents = []
        
        for document in unembedded_documents:
            try:
                logger.info(f"EmbeddingAgent: Processing document {document['id']} in batch")
                result = await self.embed_document(document["id"], user_id)
                if result.get("status") in ["embedded", "already_embedded"]:
                    success_count += 1
                else:
                    failed_documents.append({
                        "document_id": document["id"],
                        "document_name": document["name"],
                        "error": "Unknown embedding result"
                    })
            except Exception as e:
                logger.error(f"EmbeddingAgent: Failed to embed document {document['id']} in batch: {e}")
                failed_documents.append({
                    "document_id": document["id"],
                    "document_name": document["name"],
                    "error": str(e)
                })
        
        logger.info(f"EmbeddingAgent: Batch embedding completed. Success: {success_count}, Failed: {len(failed_documents)}")
        
        return {
            "message": f"Batch embedding completed",
            "project_id": project_id,
            "documents_processed": len(unembedded_documents),
            "documents_successful": success_count,
            "documents_failed": len(failed_documents),
            "failed_documents": failed_documents if failed_documents else None
        } 