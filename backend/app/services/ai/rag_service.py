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
from app.models.ai_query import Embedding, QueryHistory
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
        embedding_type: str,
        metadata: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        is_validated: bool = True,
    ) -> Dict[str, Any]:
        """
        Process a document by chunking and creating embeddings.

        UPDATED: Now uses unified Embedding model instead of EmbeddingDocument.

        Args:
            content: Document content to embed
            embedding_type: Type classification ('schema', 'profile', 'learning', 'hyde')
            metadata: Additional metadata to store (document_id, table_name, etc.)
            user_id: User ID for access control
            is_validated: Whether embedding is pre-validated (default True for non-learning types)

        Returns:
            Dict with embedding results and statistics

        Raises:
            RAGError: For processing or storage errors
        """
        try:
            if not content or not content.strip():
                raise RAGError("Document content cannot be empty")

            logger.info(f"Processing document of type {embedding_type}")

            # Create content hash for duplicate detection
            content_hash = hashlib.sha256(content.encode()).hexdigest()

            # Check for existing embedding with same content and type
            async with get_database_session() as session:
                existing = await session.execute(
                    select(Embedding).where(
                        Embedding.metadata_['content_hash'].astext == content_hash,
                        Embedding.embedding_type == embedding_type
                    )
                )
                if existing.scalar_one_or_none():
                    logger.info(f"Embedding already exists with hash {content_hash[:8]}")
                    return {"status": "exists", "chunks_created": 0}

                # Chunk the document
                base_metadata = {
                    "content_hash": content_hash,
                    "embedding_type": embedding_type,
                    "created_at": datetime.utcnow().isoformat()
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

                # Store chunks and embeddings in database using new unified model
                created_chunks = 0

                for chunk, embedding_vector in zip(chunks, embeddings):
                    chunk_metadata = chunk.copy()
                    chunk_metadata.pop("text", None)  # Remove text from metadata

                    doc = Embedding(
                        content=chunk["text"],
                        embedding=embedding_vector,
                        embedding_type=embedding_type,
                        metadata=chunk_metadata,
                        is_validated=is_validated,
                        created_at=datetime.utcnow()
                    )
                    session.add(doc)
                    created_chunks += 1

                await session.commit()

                logger.info(f"Successfully embedded document: {created_chunks} chunks created")

                return {
                    "status": "created",
                    "chunks_created": created_chunks,
                    "total_tokens": sum(len(text.split()) for text in chunk_texts),
                    "content_hash": content_hash[:8]
                }

        except OpenAIError as e:
            logger.error(f"OpenAI error during document embedding: {e}")
            raise RAGError(f"Failed to create embeddings: {e}")

        except Exception as e:
            logger.error(f"Error embedding document: {e}")
            raise RAGError(f"Document embedding failed: {e}")

    async def similarity_search(
        self,
        query: str,
        limit: int = 5,
        similarity_threshold: float = 0.7,
        embedding_types: Optional[List[str]] = None,
        only_validated: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Perform similarity search for relevant document chunks.

        UPDATED: Now uses unified Embedding model and can filter by validation status.

        Args:
            query: Search query text
            limit: Maximum number of results to return
            similarity_threshold: Minimum cosine similarity score (0.0 to 1.0)
            embedding_types: Filter by embedding types (e.g., ['schema', 'hyde'])
            only_validated: Whether to only return validated embeddings (default True)

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
            embedding_result = await openai_service.create_embedding(query)
            query_embedding = embedding_result["embeddings"]

            # Build search query with filters
            async with get_database_session() as session:
                # Base similarity search using cosine distance
                query_stmt = select(
                    Embedding,
                    (1 - Embedding.embedding.cosine_distance(query_embedding)).label('similarity')
                ).where(
                    (1 - Embedding.embedding.cosine_distance(query_embedding)) >= similarity_threshold
                )

                # Apply filters
                if embedding_types:
                    query_stmt = query_stmt.where(Embedding.embedding_type.in_(embedding_types))

                if only_validated:
                    query_stmt = query_stmt.where(Embedding.is_validated == True)

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
                        "embedding_type": doc.embedding_type,
                        "metadata": doc.metadata_ or {},
                        "is_validated": doc.is_validated,
                        "confidence_score": doc.confidence_score,
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

        UPDATED: Now uses unified embeddings table with embedding_type='schema'.

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
                # Vector similarity search against embeddings table (schema type only)
                # Using raw SQL for pgvector operations (more reliable than SQLAlchemy)
                sql_query = text("""
                SELECT CONCAT('View: ', metadata->>'table_name', ', Column: ', metadata->>'column_name', '. Description: ', content) as context,
                       metadata->>'table_name' as table_name,
                       metadata->>'column_name' as column_name
                FROM embeddings
                WHERE embedding_type = 'schema' AND is_validated = true
                ORDER BY embedding <=> CAST(:embedding AS vector)
                LIMIT :limit
                """)

                # Convert embedding to pgvector format
                embedding_str = f"[{','.join(map(str, query_embedding))}]"

                result = await session.execute(
                    sql_query,
                    {"embedding": embedding_str, "limit": limit}
                )

                rows = result.fetchall()

                if not rows:
                    raise RAGError("No schema embeddings found. The embeddings table may be empty or have no schema type.")

                logger.info(f"Found {len(rows)} schema matches")

                # Collect contexts and detect temporal needs
                contexts = []
                context_set = set()
                view_names = set()

                for row in rows:
                    context = row[0]  # context column
                    table_name = row[1]  # table_name from metadata
                    if context not in context_set:
                        contexts.append(context)
                        context_set.add(context)

                        # Store view names for temporal enhancement
                        if table_name:
                            view_names.add(table_name)
                
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
                                    temporal_sql = text("""
                                    SELECT CONCAT('View: ', metadata->>'table_name', ', Column: ', metadata->>'column_name', '. Description: ', content) AS context
                                    FROM embeddings
                                    WHERE embedding_type = 'schema'
                                      AND is_validated = true
                                      AND metadata->>'table_name' = :view_name
                                      AND metadata->>'column_name' = :column_name
                                    LIMIT 1
                                    """)

                                    temporal_result = await session.execute(
                                        temporal_sql,
                                        {"view_name": view_name, "column_name": column_name}
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
                embedding_types=None,  # Search all types
                only_validated=True  # Only validated embeddings
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
                    "embedding_id": doc["id"],
                    "embedding_type": doc["embedding_type"],
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

    async def delete_embeddings_by_type(
        self,
        embedding_type: str,
        metadata_filter: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Delete embeddings by type and optional metadata filters.

        UPDATED: Uses unified Embedding model.

        Args:
            embedding_type: Type to delete ('schema', 'profile', 'learning', 'hyde')
            metadata_filter: Optional JSONB metadata filters

        Returns:
            Dict with deletion statistics
        """
        try:
            async with get_database_session() as session:
                # Build delete query
                delete_query = select(Embedding).where(
                    Embedding.embedding_type == embedding_type
                )

                # Add metadata filters if provided
                if metadata_filter:
                    for key, value in metadata_filter.items():
                        delete_query = delete_query.where(
                            Embedding.metadata_[key].astext == str(value)
                        )

                # Get embeddings to delete (for counting)
                results = await session.execute(delete_query)
                docs_to_delete = results.scalars().all()

                if not docs_to_delete:
                    return {"status": "not_found", "deleted_count": 0}

                # Delete the embeddings
                for doc in docs_to_delete:
                    await session.delete(doc)

                await session.commit()

                deleted_count = len(docs_to_delete)
                logger.info(f"Deleted {deleted_count} embeddings of type {embedding_type}")

                return {
                    "status": "deleted",
                    "embedding_type": embedding_type,
                    "deleted_count": deleted_count
                }

        except Exception as e:
            logger.error(f"Error deleting embeddings: {e}")
            raise RAGError(f"Embedding deletion failed: {e}")

    async def get_embedding_stats(self) -> Dict[str, Any]:
        """
        Get statistics about stored embeddings.

        UPDATED: Uses unified Embedding model.

        Returns:
            Dict with embedding statistics
        """
        try:
            async with async_session_factory() as session:
                # Total embedding count
                total_result = await session.execute(
                    select(func.count(Embedding.id))
                )
                total_embeddings = total_result.scalar() or 0

                # Count by embedding type
                type_result = await session.execute(
                    select(
                        Embedding.embedding_type,
                        func.count(Embedding.id)
                    ).group_by(Embedding.embedding_type)
                )
                type_counts = dict(type_result.fetchall())

                # Count validated vs pending
                validated_result = await session.execute(
                    select(
                        Embedding.is_validated,
                        func.count(Embedding.id)
                    ).group_by(Embedding.is_validated)
                )
                validation_counts = dict(validated_result.fetchall())

                return {
                    "total_embeddings": total_embeddings,
                    "by_type": type_counts,
                    "validated": validation_counts.get(True, 0),
                    "pending_validation": validation_counts.get(False, 0),
                    "embedding_dimensions": self.embedding_dimensions
                }

        except Exception as e:
            logger.error(f"Error getting embedding stats: {e}")
            raise RAGError(f"Stats retrieval failed: {e}")

    async def generate_and_store_hyde_embedding(
        self,
        question: str,
        context_used: str,
        source_query_id: int
    ) -> int:
        """
        Generates and stores a HyDE (Hypothetical Document Embedding) for missing context.

        This method is called by the Self-Improving Agent when it detects MISSING_CONTEXT failures.

        Args:
            question: The user's question that failed
            context_used: Context that was retrieved (insufficient)
            source_query_id: ID of the query that triggered this

        Returns:
            Embedding ID of created HyDE embedding

        Raises:
            RAGError: For generation or storage errors
        """
        try:
            logger.info(f"Generating HyDE embedding for query {source_query_id}")

            # Generate hypothetical perfect document using GPT-4
            hyde_prompt = f"""Generate an ideal database schema description that would perfectly
enable answering: "{question}"

Context already available: {context_used[:300] if context_used else 'None'}

Generate ONLY the missing schema description that would have helped answer this question.

Format as:
"View: [view_name], Column: [column_name]. Description: [detailed description with data type, use cases, and examples]"

Be specific about:
- Data types
- When to use this column
- Example values
- Relationships to other columns

If multiple columns are needed, create separate descriptions for each."""

            response = await openai_service.create_chat_completion(
                messages=[{"role": "user", "content": hyde_prompt}],
                temperature=0.3,  # Moderate creativity for quality descriptions
                max_tokens=400
            )

            hypothetical_document = response["content"].strip()

            # Create embedding from hypothetical document
            embedding_result = await openai_service.create_embedding(hypothetical_document)

            # Store in embeddings table
            async with get_database_session() as session:
                new_embedding = Embedding(
                    content=hypothetical_document,
                    embedding=embedding_result["embeddings"],
                    embedding_type="hyde",
                    metadata={
                        "method": "hyde",
                        "question": question[:200],
                        "generated_at": datetime.utcnow().isoformat(),
                        "pattern_type": "MISSING_CONTEXT"
                    },
                    confidence_score=0.85,  # Default confidence for HyDE
                    source_query_id=source_query_id,
                    is_validated=False  # Requires HITL approval
                )

                session.add(new_embedding)
                await session.commit()
                await session.refresh(new_embedding)

                logger.info(f"Created HyDE embedding {new_embedding.id} for query {source_query_id}")
                return new_embedding.id

        except OpenAIError as e:
            logger.error(f"OpenAI error generating HyDE: {e}")
            raise RAGError(f"Failed to generate HyDE embedding: {e}")

        except Exception as e:
            logger.error(f"Error generating HyDE embedding: {e}")
            raise RAGError(f"HyDE embedding generation failed: {e}")


# Global service instance
rag_service = RAGService()