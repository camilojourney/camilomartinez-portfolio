"""
Tests for integrations router endpoints.
"""

from fastapi.testclient import TestClient


class TestIntegrationsPlaceholder:
    """Tests for integrations placeholder endpoints."""

    def test_integrations_placeholder_returns_planned_endpoints(
        self,
        client: TestClient
    ):
        """Integrations placeholder should return planned endpoints info."""
        response = client.get("/api/integrations/")

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Integration services not yet implemented"
        assert "planned_endpoints" in data
        assert "strava" in data["planned_endpoints"]
        assert "whoop" in data["planned_endpoints"]
        assert "phases" in data

    def test_integrations_returns_correct_structure(self, client: TestClient):
        """Integrations response should have correct structure."""
        response = client.get("/api/integrations/")

        assert response.status_code == 200
        data = response.json()

        # Verify Strava endpoints are documented
        strava_endpoints = data["planned_endpoints"]["strava"]
        assert isinstance(strava_endpoints, list)
        assert len(strava_endpoints) > 0

        # Verify WHOOP endpoints are documented
        whoop_endpoints = data["planned_endpoints"]["whoop"]
        assert isinstance(whoop_endpoints, list)
        assert len(whoop_endpoints) > 0
