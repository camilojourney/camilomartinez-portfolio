"""
RAG (Retrieval-Augmented Generation) Service for vector embeddings and similarity search.
Integrates with PostgreSQL pgvector for document storage and retrieval.
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple, Union
import hashlib
import re
from datetime import datetime
from sqlalchemy import text, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pgvector.sqlalchemy import Vector

from app.config.database import get_database_session, async_session_factory
from app.models.ai_query import EmbeddingDocument
from app.services.ai.openai_client import openai_service, OpenAIError

logger = logging.getLogger(__name__)


class RAGError(Exception):
    """Custom exception for RAG service errors."""
    pass


class DocumentChunker:
    """
    Text chunking service for preparing documents for embedding.
    Handles various chunking strategies and content preprocessing.
    """
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        min_chunk_size: int = 100,
    ):
        """
        Initialize document chunker.
        
        Args:
            chunk_size: Target size for each chunk in characters
            chunk_overlap: Overlap between consecutive chunks
            min_chunk_size: Minimum chunk size to avoid tiny fragments
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        
    def chunk_text(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Split text into overlapping chunks for embedding.
        
        Args:
            text: Input text to chunk
            metadata: Optional metadata to attach to chunks
            
        Returns:
            List of chunk dictionaries with text and metadata
        """
        if not text or len(text.strip()) < self.min_chunk_size:
            return []
            
        # Clean and normalize text
        cleaned_text = self._clean_text(text)
        
        # Split into sentences for better chunk boundaries
        sentences = self._split_sentences(cleaned_text)
        
        chunks = []
        current_chunk = ""
        current_size = 0
        
        for sentence in sentences:
            sentence_size = len(sentence)
            
            # If adding this sentence would exceed chunk size, save current chunk
            if current_size + sentence_size > self.chunk_size and current_chunk:
                chunks.append(self._create_chunk(current_chunk, metadata, len(chunks)))
                
                # Start new chunk with overlap
                overlap_text = self._get_overlap_text(current_chunk)
                current_chunk = overlap_text + sentence
                current_size = len(current_chunk)
            else:
                current_chunk += sentence
                current_size += sentence_size
                
        # Add final chunk if it meets minimum size
        if current_chunk and len(current_chunk.strip()) >= self.min_chunk_size:
            chunks.append(self._create_chunk(current_chunk, metadata, len(chunks)))
            
        logger.info(f"Chunked text into {len(chunks)} chunks")
        return chunks
        
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text content."""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove special characters that might interfere with embeddings
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
        
        return text
        
    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences for better chunk boundaries."""
        # Simple sentence splitting - could be enhanced with NLP library
        sentences = re.split(r'[.!?]+\s+', text)
        
        # Clean up sentences and add back punctuation
        cleaned_sentences = []
        for i, sentence in enumerate(sentences):
            sentence = sentence.strip()
            if sentence:
                # Add back sentence ending if not the last sentence
                if i < len(sentences) - 1:
                    sentence += '. '
                cleaned_sentences.append(sentence)
                
        return cleaned_sentences
        
    def _get_overlap_text(self, text: str) -> str:
        """Extract overlap text from the end of current chunk."""
        if len(text) <= self.chunk_overlap:
            return text
            
        # Find a good break point within overlap region
        overlap_start = len(text) - self.chunk_overlap
        overlap_text = text[overlap_start:]
        
        # Try to find a sentence boundary
        sentence_end = overlap_text.find('. ')
        if sentence_end > 0:
            return overlap_text[sentence_end + 2:]
            
        return overlap_text
        
    def _create_chunk(self, text: str, metadata: Optional[Dict[str, Any]], chunk_index: int) -> Dict[str, Any]:
        """Create a chunk dictionary with text and metadata."""
        chunk = {
            "text": text.strip(),
            "chunk_index": chunk_index,
            "character_count": len(text.strip()),
            "created_at": datetime.utcnow(),
        }
        
        if metadata:
            chunk.update(metadata)
            
        return chunk


class RAGService:
    """
    Retrieval-Augmented Generation service for document embedding and similarity search.
    
    Features:
    - Document chunking and embedding storage
    - Vector similarity search with pgvector
    - Context retrieval for AI queries
    - Duplicate detection and content management
    """
    
    def __init__(self):
        """Initialize RAG service with configuration."""
        self.chunker = DocumentChunker(
            chunk_size=1000,  # ~250 tokens at 4 chars/token
            chunk_overlap=200,  # ~50 tokens overlap
            min_chunk_size=100,  # ~25 tokens minimum
        )
        self.embedding_dimensions = 1536  # text-embedding-3-small default dimensions
        
        logger.info("RAG service initialized")

    async def embed_document(
        self,
        content: str,
        document_type: str,
        document_id: str,
        metadata: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process a document by chunking and creating embeddings.
        
        Args:
            content: Document content to embed
            document_type: Type classification (e.g., 'fitness_data', 'user_query', 'knowledge_base')
            document_id: Unique identifier for the document
            metadata: Additional metadata to store with chunks
            user_id: User ID for access control
            
        Returns:
            Dict with embedding results and statistics
            
        Raises:
            RAGError: For processing or storage errors
        """
        try:
            if not content or not content.strip():
                raise RAGError("Document content cannot be empty")
                
            logger.info(f"Processing document {document_id} of type {document_type}")
            
            # Create document hash for duplicate detection
            content_hash = hashlib.sha256(content.encode()).hexdigest()
            
            # Check for existing document
            async with get_database_session() as session:
                existing = await session.execute(
                    select(EmbeddingDocument).where(
                        EmbeddingDocument.content_hash == content_hash,
                        EmbeddingDocument.document_type == document_type
                    )
                )
                if existing.scalar_one_or_none():
                    logger.info(f"Document {document_id} already exists with hash {content_hash[:8]}")
                    return {"status": "exists", "document_id": document_id, "chunks_created": 0}
                
                # Chunk the document
                base_metadata = {
                    "document_type": document_type,
                    "document_id": document_id,
                    "user_id": user_id,
                }
                if metadata:
                    base_metadata.update(metadata)
                    
                chunks = self.chunker.chunk_text(content, base_metadata)
                
                if not chunks:
                    raise RAGError("No valid chunks created from document content")
                    
                # Create embeddings for all chunks
                chunk_texts = [chunk["text"] for chunk in chunks]
                embeddings = await openai_service.create_embeddings_batch(
                    chunk_texts,
                    user_id=user_id
                )
                
                # Store chunks and embeddings in database
                created_chunks = 0
                
                for chunk, embedding in zip(chunks, embeddings):
                    doc = EmbeddingDocument(
                        content=chunk["text"],
                        embedding=embedding,
                        document_type=document_type,
                        document_id=document_id,
                        metadata=chunk,
                        content_hash=hashlib.sha256(chunk["text"].encode()).hexdigest(),
                        user_id=user_id,
                        created_at=datetime.utcnow()
                    )
                    session.add(doc)
                    created_chunks += 1
                    
                await session.commit()
                
                logger.info(f"Successfully embedded document {document_id}: {created_chunks} chunks created")
                
                return {
                    "status": "created",
                    "document_id": document_id,
                    "chunks_created": created_chunks,
                    "total_tokens": sum(len(text.split()) for text in chunk_texts),
                    "content_hash": content_hash[:8]
                }
                
        except OpenAIError as e:
            logger.error(f"OpenAI error during document embedding: {e}")
            raise RAGError(f"Failed to create embeddings: {e}")
            
        except Exception as e:
            logger.error(f"Error embedding document {document_id}: {e}")
            raise RAGError(f"Document embedding failed: {e}")

    async def similarity_search(
        self,
        query: str,
        limit: int = 5,
        similarity_threshold: float = 0.7,
        document_types: Optional[List[str]] = None,
        user_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Perform similarity search for relevant document chunks.
        
        Args:
            query: Search query text
            limit: Maximum number of results to return
            similarity_threshold: Minimum cosine similarity score (0.0 to 1.0)
            document_types: Filter by document types
            user_id: Filter by user ID for access control
            
        Returns:
            List of matching document chunks with similarity scores
            
        Raises:
            RAGError: For search errors
        """
        try:
            if not query or not query.strip():
                raise RAGError("Search query cannot be empty")
                
            logger.info(f"Performing similarity search for: '{query[:50]}...'")
            
            # Create query embedding
            embedding_result = await openai_service.create_embedding(query, user_id=user_id)
            query_embedding = embedding_result["embeddings"]
            
            # Build search query with filters
            async with get_database_session() as session:
                # Base similarity search using cosine distance
                query_stmt = select(
                    EmbeddingDocument,
                    (1 - EmbeddingDocument.embedding.cosine_distance(query_embedding)).label('similarity')
                ).where(
                    (1 - EmbeddingDocument.embedding.cosine_distance(query_embedding)) >= similarity_threshold
                )
                
                # Apply filters
                if document_types:
                    query_stmt = query_stmt.where(EmbeddingDocument.document_type.in_(document_types))
                    
                if user_id:
                    # Allow access to user's own documents or public documents
                    query_stmt = query_stmt.where(
                        (EmbeddingDocument.user_id == user_id) |
                        (EmbeddingDocument.user_id.is_(None))
                    )
                    
                # Order by similarity and limit results
                query_stmt = query_stmt.order_by(text('similarity DESC')).limit(limit)
                
                results = await session.execute(query_stmt)
                matches = results.fetchall()
                
                # Format results
                formatted_results = []
                for doc, similarity in matches:
                    result = {
                        "id": doc.id,
                        "content": doc.content,
                        "similarity": float(similarity),
                        "document_type": doc.document_type,
                        "document_id": doc.document_id,
                        "metadata": doc.metadata or {},
                        "created_at": doc.created_at.isoformat() if doc.created_at else None,
                    }
                    formatted_results.append(result)
                    
                logger.info(f"Found {len(formatted_results)} similar documents")
                return formatted_results
                
        except OpenAIError as e:
            logger.error(f"OpenAI error during similarity search: {e}")
            raise RAGError(f"Failed to create query embedding: {e}")
            
        except Exception as e:
            logger.error(f"Error in similarity search: {e}")
            raise RAGError(f"Similarity search failed: {e}")

    async def schema_vector_search(
        self,
        query: str,
        limit: int = 12,
    ) -> str:
        """
        Perform vector similarity search against schema embeddings for query context.
        
        This method replicates the TypeScript performVectorSearch functionality
        for schema-aware context retrieval in AI query processing.
        
        Args:
            query: Natural language question to find relevant schema context for
            limit: Maximum number of relevant schema descriptions to return
            
        Returns:
            String containing relevant schema descriptions, separated by newlines
            
        Raises:
            RAGError: For search or processing errors
        """
        try:
            logger.info(f"Schema vector search for: '{query[:50]}...'")
            
            # Generate query embedding
            embedding_result = await openai_service.create_embedding(query)
            query_embedding = embedding_result["embeddings"]
            
            async with async_session_factory() as session:
                # Vector similarity search against schema_embeddings table
                # Using raw SQL for pgvector operations (more reliable than SQLAlchemy)
                sql_query = """
                SELECT CONCAT('View: ', table_name, ', Column: ', column_name, '. Description: ', description) as context
                FROM schema_embeddings
                ORDER BY embedding <=> %s
                LIMIT %s
                """
                
                # Convert embedding to pgvector format
                embedding_str = f"[{','.join(map(str, query_embedding))}]"
                
                result = await session.execute(
                    text(sql_query),
                    (embedding_str, limit)
                )
                
                rows = result.fetchall()
                
                if not rows:
                    raise RAGError("No schema embeddings found. The schema_embeddings table may be empty.")
                
                logger.info(f"Found {len(rows)} schema matches")
                
                # Collect contexts and detect temporal needs
                contexts = []
                context_set = set()
                view_names = set()
                
                for row in rows:
                    context = row[0]  # Access by index for raw SQL result
                    if context not in context_set:
                        contexts.append(context)
                        context_set.add(context)
                        
                        # Extract view names for temporal enhancement
                        import re
                        match = re.search(r'View:\s*([^,]+)', context, re.IGNORECASE)
                        if match:
                            view_names.add(match.group(1).strip())
                
                # Check if query needs temporal context
                temporal_keywords = [
                    'recent', 'latest', 'today', 'yesterday', 'last', 'current', 'newest',
                    'trend', 'over time', 'past', 'this week', 'this month', 'this year',
                    'day', 'week', 'month', 'year', 'days', 'weeks', 'months', 'years',
                    'daily', 'weekly', 'monthly', 'yearly', 'previous', 'prior',
                    'jan', 'january', 'feb', 'february', 'mar', 'march', 'apr', 'april',
                    'may', 'jun', 'june', 'jul', 'july', 'aug', 'august',
                    'sep', 'sept', 'september', 'oct', 'october', 'nov', 'november', 'dec', 'december'
                ]
                
                lower_query = query.lower()
                needs_temporal_context = any(keyword in lower_query for keyword in temporal_keywords)
                
                # Always include temporal columns for daily_fitness_snapshot
                always_include_temporal = {
                    'daily_fitness_snapshot': ['snapshot_date']
                }
                
                # Enhance with temporal context if needed
                if needs_temporal_context:
                    for view_name in view_names:
                        if view_name in always_include_temporal:
                            for column_name in always_include_temporal[view_name]:
                                try:
                                    temporal_sql = """
                                    SELECT CONCAT('View: ', table_name, ', Column: ', column_name, '. Description: ', description) AS context
                                    FROM schema_embeddings
                                    WHERE table_name = %s AND column_name = %s
                                    LIMIT 1
                                    """
                                    
                                    temporal_result = await session.execute(
                                        text(temporal_sql),
                                        (view_name, column_name)
                                    )
                                    
                                    temporal_rows = temporal_result.fetchall()
                                    for temporal_row in temporal_rows:
                                        temporal_context = temporal_row[0]
                                        if temporal_context not in context_set:
                                            contexts.append(temporal_context)
                                            context_set.add(temporal_context)
                                            
                                except Exception as e:
                                    logger.warning(f"Failed to include temporal column {view_name}.{column_name}: {e}")
                
                context_string = '\n'.join(contexts)
                
                if not context_string.strip():
                    raise RAGError("Schema embeddings returned empty context.")
                
                logger.info(f"Schema search returned {len(contexts)} context items")
                return context_string
        
        except Exception as e:
            logger.error(f"Error in schema vector search: {e}")
            raise RAGError(f"Schema vector search failed: {e}")

    async def get_context_for_query(
        self,
        query: str,
        max_context_length: int = 3000,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retrieve relevant context for an AI query using similarity search.
        
        Args:
            query: User's query text
            max_context_length: Maximum characters in context
            user_id: User ID for personalized context
            
        Returns:
            Dict with context text, sources, and metadata
        """
        try:
            # Search for relevant documents
            relevant_docs = await self.similarity_search(
                query=query,
                limit=10,  # Get more docs to build context
                similarity_threshold=0.6,  # Lower threshold for broader context
                user_id=user_id
            )
            
            if not relevant_docs:
                logger.info("No relevant context found for query")
                return {
                    "context": "",
                    "sources": [],
                    "total_similarity": 0.0,
                    "context_length": 0
                }
                
            # Build context string within character limit
            context_parts = []
            sources = []
            total_similarity = 0.0
            current_length = 0
            
            for doc in relevant_docs:
                content = doc["content"]
                
                # Check if adding this content would exceed limit
                if current_length + len(content) > max_context_length:
                    # Try to fit partial content
                    remaining_space = max_context_length - current_length
                    if remaining_space > 100:  # Only if meaningful space remains
                        content = content[:remaining_space - 3] + "..."
                    else:
                        break
                        
                context_parts.append(content)
                sources.append({
                    "document_id": doc["document_id"],
                    "document_type": doc["document_type"],
                    "similarity": doc["similarity"],
                    "created_at": doc["created_at"]
                })
                
                total_similarity += doc["similarity"]
                current_length += len(content)
                
            # Join context with separators
            context = "\n\n---\n\n".join(context_parts)
            
            logger.info(f"Built context from {len(sources)} sources, {len(context)} characters")
            
            return {
                "context": context,
                "sources": sources,
                "total_similarity": total_similarity,
                "context_length": len(context),
                "sources_count": len(sources)
            }
            
        except Exception as e:
            logger.error(f"Error building context for query: {e}")
            raise RAGError(f"Context retrieval failed: {e}")

    async def delete_document(
        self,
        document_id: str,
        document_type: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Delete all chunks for a specific document.
        
        Args:
            document_id: Document identifier
            document_type: Optional type filter
            user_id: User ID for access control
            
        Returns:
            Dict with deletion statistics
        """
        try:
            async with get_database_session() as session:
                # Build delete query with filters
                delete_query = select(EmbeddingDocument).where(
                    EmbeddingDocument.document_id == document_id
                )
                
                if document_type:
                    delete_query = delete_query.where(EmbeddingDocument.document_type == document_type)
                    
                if user_id:
                    delete_query = delete_query.where(EmbeddingDocument.user_id == user_id)
                    
                # Get documents to delete (for counting)
                results = await session.execute(delete_query)
                docs_to_delete = results.fetchall()
                
                if not docs_to_delete:
                    return {"status": "not_found", "deleted_chunks": 0}
                    
                # Delete the documents
                for doc in docs_to_delete:
                    await session.delete(doc[0])
                    
                await session.commit()
                
                deleted_count = len(docs_to_delete)
                logger.info(f"Deleted {deleted_count} chunks for document {document_id}")
                
                return {
                    "status": "deleted",
                    "document_id": document_id,
                    "deleted_chunks": deleted_count
                }
                
        except Exception as e:
            logger.error(f"Error deleting document {document_id}: {e}")
            raise RAGError(f"Document deletion failed: {e}")

    async def get_document_stats(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get statistics about stored documents and embeddings.
        
        Args:
            user_id: Optional user filter
            
        Returns:
            Dict with document statistics
        """
        try:
            # Use the async session factory directly instead of the generator
            async with async_session_factory() as session:
                # Base query
                base_query = select(EmbeddingDocument)
                
                if user_id:
                    base_query = base_query.where(
                        (EmbeddingDocument.user_id == user_id) |
                        (EmbeddingDocument.user_id.is_(None))
                    )
                    
                # Total document count
                total_result = await session.execute(
                    select(func.count(EmbeddingDocument.id)).select_from(base_query.subquery())
                )
                total_docs = total_result.scalar()
                
                # Count by document type
                type_result = await session.execute(
                    select(
                        EmbeddingDocument.document_type,
                        func.count(EmbeddingDocument.id)
                    ).group_by(EmbeddingDocument.document_type)
                )
                type_counts = dict(type_result.fetchall())
                
                return {
                    "total_documents": total_docs,
                    "documents_by_type": type_counts,
                    "embedding_dimensions": self.embedding_dimensions,
                    "user_filtered": user_id is not None
                }
                
        except Exception as e:
            logger.error(f"Error getting document stats: {e}")
            raise RAGError(f"Stats retrieval failed: {e}")


# Global service instance
rag_service = RAGService()