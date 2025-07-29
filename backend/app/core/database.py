"""
Database connection and session management for the SACC Website Backend.

This module provides database connection utilities using SQLAlchemy 2.0
with async support for PostgreSQL connections.

@module: app.core.database
@author: unignoramus11  
@version: 1.0.0
@since: 2025

Example:
    ```python
    from app.core.database import get_db_session
    
    async with get_db_session() as session:
        result = await session.execute(select(User))
    ```
"""

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import (
    AsyncSession, 
    async_sessionmaker, 
    create_async_engine,
    AsyncEngine
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

# Create declarative base for ORM models
Base = declarative_base()

# Global engine instance
_engine: Optional[AsyncEngine] = None
_sessionmaker: Optional[async_sessionmaker[AsyncSession]] = None


def get_database_url() -> str:
    """
    Get the database URL for connection.
    
    Returns:
        str: Database connection URL
        
    Raises:
        ValueError: If DATABASE_URL is not configured
    """
    if not settings.database_url:
        # Construct from individual components if DATABASE_URL not set
        if hasattr(settings, 'postgres_host'):
            return f"postgresql+asyncpg://{settings.postgres_user}:{settings.postgres_password}@{settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}"
        else:
            raise ValueError("DATABASE_URL not configured and individual database settings not available")
    
    # Convert postgresql:// to postgresql+asyncpg:// for async support
    db_url = settings.database_url
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    return db_url


def create_engine() -> AsyncEngine:
    """
    Create SQLAlchemy async engine.
    
    Returns:
        AsyncEngine: Configured async database engine
    """
    database_url = get_database_url()
    
    logger.info("Creating database engine", extra={"database_url": database_url.split('@')[0] + "@***"})
    
    engine = create_async_engine(
        database_url,
        echo=settings.debug,  # Log SQL queries in debug mode
        poolclass=NullPool if settings.debug else None,  # Disable pooling in debug
        pool_pre_ping=True,  # Validate connections before use
        pool_recycle=3600,   # Recycle connections after 1 hour
    )
    
    return engine


def get_engine() -> AsyncEngine:
    """
    Get or create the global database engine.
    
    Returns:
        AsyncEngine: Database engine instance
    """
    global _engine
    if _engine is None:
        _engine = create_engine()
    return _engine


def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    """
    Get or create the global session maker.
    
    Returns:
        async_sessionmaker[AsyncSession]: Session maker for creating database sessions
    """
    global _sessionmaker
    if _sessionmaker is None:
        engine = get_engine()
        _sessionmaker = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=True,
            autocommit=False
        )
    return _sessionmaker


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Get async database session context manager.
    
    This function provides a database session that automatically handles
    commits, rollbacks, and cleanup.
    
    Yields:
        AsyncSession: Database session
        
    Example:
        ```python
        async with get_db_session() as session:
            user = await session.get(User, user_id)
            user.name = "Updated name"
            await session.commit()
        ```
    """
    sessionmaker = get_sessionmaker()
    
    async with sessionmaker() as session:
        try:
            logger.debug("Database session created")
            yield session
        except Exception as e:
            logger.error("Database session error, rolling back", extra={"error": str(e)})
            await session.rollback()
            raise
        finally:
            logger.debug("Database session closed")


async def init_database() -> None:
    """
    Initialize database by creating all tables.
    
    This function should be called during application startup
    to ensure all database tables exist.
    """
    logger.info("Initializing database tables")
    
    engine = get_engine()
    
    try:
        async with engine.begin() as conn:
            # Import all models to ensure they're registered with Base
            from app.models import auth, connect  # noqa: F401
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            
        logger.info("Database tables initialized successfully")
        
    except Exception as e:
        logger.error("Failed to initialize database", extra={"error": str(e)})
        raise


async def check_database_connection() -> bool:
    """
    Check if database connection is working.
    
    Returns:
        bool: True if connection is successful, False otherwise
    """
    try:
        async with get_db_session() as session:
            # Execute a simple query to test connection
            result = await session.execute("SELECT 1")
            result.fetchone()
            
        logger.info("Database connection check successful")
        return True
        
    except Exception as e:
        logger.error("Database connection check failed", extra={"error": str(e)})
        return False


async def close_database() -> None:
    """
    Close database connections and cleanup resources.
    
    This function should be called during application shutdown.
    """
    global _engine, _sessionmaker
    
    if _engine:
        logger.info("Closing database connections")
        await _engine.dispose()
        _engine = None
        _sessionmaker = None
        logger.info("Database connections closed")


# Dependency for FastAPI to get database session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency to get database session.
    
    Yields:
        AsyncSession: Database session for request handling
        
    Example:
        ```python
        @app.get("/users/{user_id}")
        async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
            return await db.get(User, user_id)
        ```
    """
    async with get_db_session() as session:
        yield session