"""
Pytest configuration and fixtures for backend tests.
"""

import asyncio
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client() -> TestClient:
    """Create a FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def mock_db_session():
    """Mock database session for testing without real DB."""
    mock_session = AsyncMock()
    mock_session.execute = AsyncMock(return_value=AsyncMock())
    mock_session.commit = AsyncMock()
    mock_session.rollback = AsyncMock()
    mock_session.close = AsyncMock()
    return mock_session


@pytest.fixture
def auth_headers():
    """Mock authentication headers."""
    return {"Authorization": "Bearer test_token_123"}


@pytest.fixture
def mock_openai_service():
    """Mock OpenAI service for testing AI endpoints."""
    with patch("app.routers.ai.openai_service") as mock:
        mock.create_chat_completion = AsyncMock(return_value={
            "content": "Test response from AI",
            "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30},
            "model": "gpt-4",
            "finish_reason": "stop"
        })
        mock.create_embedding = AsyncMock(return_value={
            "embedding": [0.1] * 1536,
            "usage": {"prompt_tokens": 5, "total_tokens": 5}
        })
        mock.health_check = AsyncMock(return_value={
            "status": "healthy",
            "model": "gpt-4"
        })
        yield mock


@pytest.fixture
def mock_rag_service():
    """Mock RAG service for testing embedding endpoints."""
    with patch("app.routers.ai.rag_service") as mock:
        mock.embed_document = AsyncMock(return_value={
            "document_id": "test_doc_123",
            "chunks_created": 3,
            "status": "success"
        })
        mock.similarity_search = AsyncMock(return_value=[
            {"content": "Test result 1", "similarity": 0.95},
            {"content": "Test result 2", "similarity": 0.85}
        ])
        mock.get_document_stats = AsyncMock(return_value={
            "total_documents": 10,
            "documents_by_type": {"workout": 5, "sleep": 5}
        })
        yield mock


@pytest.fixture
def mock_query_processor():
    """Mock query processor for testing AI query endpoints."""
    with patch("app.routers.ai.query_processor") as mock:
        mock.process_query_with_sql = AsyncMock(return_value={
            "answer": "Based on your data, you slept 7.5 hours on average.",
            "sql_generated": "SELECT AVG(total_hours) FROM sleep_data",
            "data": [{"avg_hours": 7.5}]
        })
        mock.get_query_history = AsyncMock(return_value=[
            {"query": "How did I sleep?", "timestamp": "2026-02-06T10:00:00Z"},
            {"query": "What was my HRV?", "timestamp": "2026-02-06T09:00:00Z"}
        ])
        yield mock
