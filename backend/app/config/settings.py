"""
Configuration management using Pydantic Settings.
Automatically loads and validates environment variables.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings with automatic env var loading and validation."""
    
    # Application
    APP_NAME: str = "Camilo AI Analytics Backend"
    VERSION: str = "0.1.0"
    DEBUG: bool = False
    
    # Database Configuration (using your existing Neon setup)
    DATABASE_URL: str
    DATABASE_URL_SYNC: Optional[str] = None  # For migrations
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # OpenAI Configuration (optional for standalone scripts)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    
    # Translation Services
    DEEPL_API_KEY: Optional[str] = None
    
    # Strava API (optional for standalone scripts)
    STRAVA_CLIENT_ID: Optional[str] = None
    STRAVA_CLIENT_SECRET: Optional[str] = None
    STRAVA_ACCESS_TOKEN: Optional[str] = None
    STRAVA_REFRESH_TOKEN: Optional[str] = None
    
    # WHOOP API (optional for standalone scripts)
    WHOOP_CLIENT_ID: Optional[str] = None
    WHOOP_CLIENT_SECRET: Optional[str] = None
    
    # Authentication & Security (optional for standalone scripts)
    SECRET_KEY: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Rate Limiting (maintaining your existing 5/day limit)
    RATE_LIMIT_DEFAULT: int = 5
    RATE_LIMIT_PER_DAY: int = 5  # For compatibility with existing .env
    RATE_LIMIT_WINDOW: int = 86400  # 24 hours in seconds
    RATE_LIMIT_BYPASS_SECRET: Optional[str] = None
    
    # Cron Job Security (optional for standalone scripts)
    CRON_SECRET: Optional[str] = None
    
    # External Services
    NEXTAUTH_URL: str = "http://localhost:3000"
    VERCEL_OIDC_TOKEN: Optional[str] = None
    
    # Development
    CORS_ORIGINS: str = '["http://localhost:3000", "http://127.0.0.1:3000"]'
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env file
        
    @property
    def database_url_async(self) -> str:
        """Convert sync PostgreSQL URL to async (psycopg driver)."""
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


# Create global settings instance
settings = Settings()
