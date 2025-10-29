"""
Configuration management for the SACC Website Backend.

This module handles all configuration settings using Pydantic Settings,
providing type-safe configuration management with environment variable support.

@module: app.core.config
@author: unignoramus11
@version: 2.0.0
@since: 2025

Example:
    ```python
    from app.core.config import get_settings

    settings = get_settings()
    print(settings.debug)
    ```
"""

from functools import lru_cache
from typing import Optional
from pydantic import Field, validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings configuration class.

    This class defines all configuration parameters for the application,
    with support for environment variable overrides and default values.

    Attributes:
        debug (bool): Enable debug mode
        secret_key (str): Application secret key for security
        jwt_secret_key (str): JWT token signing secret
        cas_server_url (Optional[str]): CAS server URL for authentication
        service_url (Optional[str]): Service URL for CAS callbacks
        redirect_url (str): Default redirect URL after login
        database_url (Optional[str]): Database connection URL
        cors_origins (list[str]): Allowed CORS origins
        api_v1_prefix (str): API version 1 URL prefix
        project_name (str): Project display name
        project_version (str): Project version
        log_level (str): Logging level

    Example:
        ```python
        settings = Settings()
        if settings.debug:
            print("Running in debug mode")
        ```
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Core application settings
    debug: bool = Field(
        default=False,
        description="Enable debug mode for development"
    )

    secret_key: str = Field(
        default="secret-key-change-in-production",
        description="Application secret key for security operations"
    )

    jwt_secret_key: str = Field(
        default="jwt-secret-change-in-production",
        description="Secret key for JWT token signing and verification"
    )

    # CAS Authentication settings
    cas_server_url: Optional[str] = Field(
        default=None,
        description="CAS server URL for single sign-on authentication"
    )

    service_url: Optional[str] = Field(
        default=None,
        description="Service URL for CAS authentication callbacks"
    )

    redirect_url: str = Field(
        default="/home",
        description="Default URL to redirect users after successful login"
    )

    # Database settings
    database_url: Optional[str] = Field(
        default=None,
        description="Database connection URL (PostgreSQL format)"
    )
    
    # Individual database components (fallback if DATABASE_URL not set)
    postgres_host: str = Field(
        default="postgres",
        description="PostgreSQL host"
    )
    
    postgres_port: str = Field(
        default="5432",
        description="PostgreSQL port"
    )
    
    postgres_db: str = Field(
        default="sacc_db",
        description="PostgreSQL database name"
    )
    
    postgres_user: str = Field(
        default="sacc_user",
        description="PostgreSQL username"
    )
    
    postgres_password: str = Field(
        default="sacc_password",
        description="PostgreSQL password"
    )

    # CORS settings
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="List of allowed CORS origins for cross-origin requests"
    )

    # API settings
    api_v1_prefix: str = Field(
        default="/api",
        description="URL prefix for API version 1 endpoints"
    )

    # Project metadata
    project_name: str = Field(
        default="SACC Website Backend",
        description="Display name of the project"
    )

    project_version: str = Field(
        default="2.0.0",
        description="Current version of the project"
    )

    # Logging configuration
    log_level: str = Field(
        default="INFO",
        description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)"
    )

    # JWT Configuration
    jwt_expiry_hours: int = Field(
        default=24,
        description="JWT token expiry time in hours"
    )

    # Server configuration
    host: str = Field(
        default="0.0.0.0",
        description="Host address to bind the server"
    )

    port: int = Field(
        default=80,
        description="Port number to bind the server"
    )

    # Connect page configuration
    super_admin_emails: str = Field(
        default="",
        description="Comma-separated list of super admin email addresses"
    )

    hash_key: str = Field(
        default="default-hash-key-change-in-production",
        description="Secret key for hashing identifiers"
    )

    def get_super_admin_emails_list(self) -> list[str]:
        """Get super admin emails as a list."""
        if self.super_admin_emails:
            return [email.strip() for email in self.super_admin_emails.split(',') if email.strip()]
        return []


@lru_cache()
def get_settings() -> Settings:
    """
    Get application settings instance.

    This function returns a cached instance of the Settings class,
    ensuring that settings are loaded only once during application lifetime.
    The @lru_cache decorator provides automatic caching.

    Returns:
        Settings: Configured settings instance

    Example:
        ```python
        from app.core.config import get_settings

        settings = get_settings()
        app_name = settings.project_name
        ```
    """
    return Settings()


# Global settings instance for convenience
settings = get_settings()
