"""
Configuration management using Pydantic Settings.
Automatically loads and validates environment variables.
"""
import os
from pathlib import Path
from urllib.parse import urlparse

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with automatic env var loading and validation."""

    # Application
    APP_NAME: str = "Camilo AI Analytics Backend"
    VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Database Configuration
    #
    # Production deployments should set DATABASE_URL (e.g. Postgres/Neon).
    # Local development and CI can run without a database, in which case we
    # skip DB initialization and DB-backed features return 503.
    DATABASE_URL: str | None = None
    DATABASE_URL_SYNC: str | None = None  # For migrations

    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"

    # OpenAI Configuration (optional for standalone scripts)
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Translation Services
    DEEPL_API_KEY: str | None = None

    # Strava API (optional for standalone scripts)
    STRAVA_CLIENT_ID: str | None = None
    STRAVA_CLIENT_SECRET: str | None = None
    STRAVA_ACCESS_TOKEN: str | None = None
    STRAVA_REFRESH_TOKEN: str | None = None

    # WHOOP API (optional for standalone scripts)
    WHOOP_CLIENT_ID: str | None = None
    WHOOP_CLIENT_SECRET: str | None = None

    # Authentication & Security (optional for standalone scripts)
    SECRET_KEY: str | None = None
    ADMIN_API_KEY: str | None = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Rate Limiting (maintaining your existing 5/day limit)
    RATE_LIMIT_DEFAULT: int = 5
    RATE_LIMIT_PER_DAY: int = 5  # For compatibility with existing .env
    RATE_LIMIT_WINDOW: int = 86400  # 24 hours in seconds
    RATE_LIMIT_BYPASS_SECRET: str | None = None

    # Cron Job Security (optional for standalone scripts)
    CRON_SECRET: str | None = None

    # External Services
    NEXTAUTH_URL: str = "http://localhost:3000"
    VERCEL_OIDC_TOKEN: str | None = None

    # Development
    CORS_ORIGINS: str = '["http://localhost:3000", "http://127.0.0.1:3000"]'
    TRUSTED_HOSTS: str = '["*"]'
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = os.getenv(
            "CAMILO_ENV_PATH",
            str(Path.home() / ".config" / "secrets" / "camilomartinez-portfolio-local.env"),
        )
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env file

    @property
    def database_url_async(self) -> str | None:
        """Convert sync PostgreSQL URL to async (psycopg driver)."""
        if not self.DATABASE_URL:
            return None
        # Handle both postgres:// (old) and postgresql:// (new) formats
        if self.DATABASE_URL.startswith("postgres://"):
            return self.DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
        elif self.DATABASE_URL.startswith("postgresql://"):
            return self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
        return self.DATABASE_URL

    @property
    def redis_url_parsed(self) -> str:
        """Ensure Redis URL is properly formatted."""
        return self.REDIS_URL

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS string into a list."""
        import json
        try:
            return json.loads(self.CORS_ORIGINS)
        except (json.JSONDecodeError, TypeError):
            # Fallback to default origins
            return ["http://localhost:3000", "http://127.0.0.1:3000"]

    @property
    def trusted_hosts_list(self) -> list[str]:
        """Parse TRUSTED_HOSTS and include deployment hostnames when available."""
        import json

        parsed_hosts: list[str]
        try:
            parsed = json.loads(self.TRUSTED_HOSTS)
            parsed_hosts = [str(host).strip() for host in parsed if str(host).strip()]
        except (json.JSONDecodeError, TypeError):
            parsed_hosts = []

        if self.NEXTAUTH_URL:
            try:
                hostname = urlparse(self.NEXTAUTH_URL).hostname
                if hostname:
                    parsed_hosts.append(hostname)
            except Exception:
                pass

        if not parsed_hosts:
            return ["*"]

        # Preserve order while removing duplicates
        deduplicated: list[str] = []
        for host in parsed_hosts:
            if host not in deduplicated:
                deduplicated.append(host)
        return deduplicated


# Create global settings instance
settings = Settings()
