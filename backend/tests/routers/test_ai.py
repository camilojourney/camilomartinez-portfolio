"""
Tests for AI router endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock


class TestAIServiceInfo:
    """Tests for AI service information endpoints."""

    def test_ai_service_info(self, client: TestClient):
        """AI service info endpoint should return available endpoints."""
        response = client.get("/api/ai/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "data" in data
        assert data["data"]["service"] == "AI Services API"
        assert "endpoints" in data["data"]
        assert "features" in data["data"]


class TestChatCompletion:
    """Tests for chat completion endpoints."""

    def test_chat_completion_success(
        self, 
        client: TestClient, 
        mock_openai_service
    ):
        """Chat completion should return AI response."""
        request_data = {
            "messages": [
                {"role": "user", "content": "Hello, how are you?"}
            ],
            "temperature": 0.7,
            "include_context": False
        }
        
        response = client.post("/api/ai/chat/completion", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "data" in data
        assert "response" in data["data"]

    def test_chat_completion_invalid_role(self, client: TestClient):
        """Chat completion should reject invalid message roles."""
        request_data = {
            "messages": [
                {"role": "invalid_role", "content": "Test message"}
            ]
        }
        
        response = client.post("/api/ai/chat/completion", json=request_data)
        
        assert response.status_code == 422  # Validation error

    def test_chat_completion_empty_messages(self, client: TestClient):
        """Chat completion should reject empty messages list."""
        request_data = {
            "messages": []
        }
        
        response = client.post("/api/ai/chat/completion", json=request_data)
        
        assert response.status_code == 422  # Validation error

    def test_chat_completion_temperature_bounds(self, client: TestClient):
        """Chat completion should reject out-of-bounds temperature."""
        request_data = {
            "messages": [{"role": "user", "content": "Test"}],
            "temperature": 3.0  # Max is 2.0
        }
        
        response = client.post("/api/ai/chat/completion", json=request_data)
        
        assert response.status_code == 422


class TestAIQuery:
    """Tests for AI query endpoints."""

    def test_query_endpoint_success(
        self, 
        client: TestClient, 
        mock_query_processor
    ):
        """AI query endpoint should process queries successfully."""
        request_data = {
            "query": "How did I sleep last week?",
            "include_context": True,
            "context_days": 7
        }
        
        response = client.post("/api/ai/query", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

    def test_query_empty_query_rejected(self, client: TestClient):
        """AI query should reject empty query strings."""
        request_data = {
            "query": "",
            "include_context": True
        }
        
        response = client.post("/api/ai/query", json=request_data)
        
        assert response.status_code == 422

    def test_query_context_days_bounds(self, client: TestClient):
        """AI query should reject out-of-bounds context_days."""
        request_data = {
            "query": "Test query",
            "context_days": 500  # Max is 365
        }
        
        response = client.post("/api/ai/query", json=request_data)
        
        assert response.status_code == 422


class TestEmbeddings:
    """Tests for embedding endpoints."""

    def test_create_embedding_success(
        self, 
        client: TestClient, 
        mock_openai_service
    ):
        """Create embedding should return vector."""
        request_data = {
            "text": "This is a test document for embedding",
            "dimensions": 1536
        }
        
        response = client.post("/api/ai/embeddings/create", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

    def test_create_embedding_empty_text_rejected(self, client: TestClient):
        """Create embedding should reject empty text."""
        request_data = {
            "text": ""
        }
        
        response = client.post("/api/ai/embeddings/create", json=request_data)
        
        assert response.status_code == 422

    def test_similarity_search_success(
        self, 
        client: TestClient, 
        mock_rag_service
    ):
        """Similarity search should return results."""
        request_data = {
            "query": "workout performance",
            "limit": 5,
            "similarity_threshold": 0.7
        }
        
        response = client.post("/api/ai/embeddings/search", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "data" in data

    def test_embedding_stats_success(
        self, 
        client: TestClient, 
        mock_rag_service
    ):
        """Embedding stats should return document statistics."""
        response = client.get("/api/ai/embeddings/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"


class TestAIHealth:
    """Tests for AI health endpoints."""

    def test_ai_health_check(
        self, 
        client: TestClient, 
        mock_openai_service, 
        mock_rag_service
    ):
        """AI health check should return service status."""
        response = client.get("/api/ai/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "data" in data
        assert "overall_status" in data["data"]
