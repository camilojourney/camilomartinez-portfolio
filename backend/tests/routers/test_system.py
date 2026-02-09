"""
Tests for system router endpoints.
"""

from fastapi.testclient import TestClient


class TestHealthEndpoints:
    """Tests for health check endpoints."""

    def test_health_check_returns_200(self, client: TestClient):
        """Health check should return 200 with healthy status."""
        response = client.get("/api/system/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data
        assert data["service"] == "camilo-ai-analytics-backend"

    def test_status_endpoint_returns_system_info(self, client: TestClient):
        """Status endpoint should return system information."""
        response = client.get("/api/system/status")

        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "camilo-ai-analytics-backend"
        assert "version" in data
        assert "environment" in data
        assert "features" in data
        assert isinstance(data["features"], dict)


class TestRootEndpoints:
    """Tests for root application endpoints."""

    def test_root_endpoint(self, client: TestClient):
        """Root endpoint should return service info."""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "operational"
        assert "version" in data
        assert "endpoints" in data

    def test_root_health_endpoint(self, client: TestClient):
        """Root health endpoint should return healthy status."""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestOpenAPIDocumentation:
    """Tests for API documentation endpoints."""

    def test_openapi_docs_accessible(self, client: TestClient):
        """OpenAPI docs should be accessible."""
        response = client.get("/docs")
        assert response.status_code == 200

    def test_openapi_json_accessible(self, client: TestClient):
        """OpenAPI JSON should be accessible."""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "info" in data
        assert "paths" in data
