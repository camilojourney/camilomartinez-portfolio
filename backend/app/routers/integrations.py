"""
Integration routers for external services (Strava, WHOOP, OAuth).
This will be implemented in Phases 6-7: Strava and WHOOP Integration Services.
"""

from fastapi import APIRouter

router = APIRouter()

# Placeholder - will be implemented in Phases 6-7
@router.get("/")
async def integrations_placeholder():
    """Placeholder for integrations - will be implemented in Phases 6-7."""
    return {
        "message": "Integration services not yet implemented",
        "planned_endpoints": {
            "strava": [
                "GET /api/integrations/strava/sync/status - Sync status monitoring",
                "POST /api/integrations/strava/sync/weekly - Weekly data sync",
                "POST /api/integrations/strava/sync/historical - Historical import",
                "GET /api/integrations/strava/auth/callback - OAuth callback"
            ],
            "whoop": [
                "POST /api/integrations/whoop/collect - WHOOP data collection",
                "GET /api/integrations/whoop/auth/callback - OAuth callback",
                "POST /api/integrations/whoop/sync/daily - Daily fetch automation"
            ]
        },
        "phases": [
            "Phase 6: Strava Integration Services",
            "Phase 7: WHOOP Integration Services"
        ]
    }
