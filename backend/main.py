"""
Main FastAPI application for the SACC Website Backend.

This module creates and configures the FastAPI application instance,
including middleware, routers, exception handlers, and startup/shutdown events.

@module: app.main
@author: unignoramus11
@version: 2.0.0
@since: 2025

Example:
    Run the application:
    ```bash
    uvicorn app.main:app --host 0.0.0.0 --port 80
    ```
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1 import auth, trial, connect
from app.core.config import get_settings
from app.core.exceptions import SACCBackendException
from app.core.logging import configure_logging, get_logger
from app.models.common import ErrorResponse, HealthCheckResponse


# Configure logging before creating the app
configure_logging()
logger = get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    """
    Application lifespan manager.

    This function handles application startup and shutdown events,
    including resource initialization and cleanup.

    Args:
        _ (FastAPI): FastAPI application instance (unused)

    Yields:
        None: Control to the application runtime
    """
    # Startup
    logger.info("Starting SACC Website Backend")
    logger.info(
        "Version: %s, Debug: %s", settings.project_version, settings.debug)

    # Initialize database
    try:
        from app.core.database import init_database, check_database_connection
        
        logger.info("Initializing database connection...")
        await init_database()
        
        # Check database connectivity
        db_connected = await check_database_connection()
        if db_connected:
            logger.info("Database connection successful")
        else:
            logger.error("Database connection failed")
            
    except Exception as e:
        logger.error("Failed to initialize database: %s", str(e))
        # Don't prevent startup, but log the error

    yield

    # Shutdown
    logger.info("Shutting down SACC Website Backend")

    # Cleanup database connections
    try:
        from app.core.database import close_database
        await close_database()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error("Error closing database connections: %s", str(e))


# Create FastAPI application instance
app = FastAPI(
    title=settings.project_name,
    description="SACC Website Backend API - \
This is the backend API for the Student Alumni Cell Committee (SACC) website.",
    version=settings.project_version,
    debug=settings.debug,
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(SACCBackendException)
async def sacc_exception_handler(
    request: Request,
    exc: SACCBackendException
) -> JSONResponse:
    """
    Handle custom SACC backend exceptions.

    Args:
        request (Request): HTTP request that caused the exception
        exc (SACCBackendException): The custom exception

    Returns:
        JSONResponse: Error response with appropriate status code
    """
    logger.error(
        "SACC backend exception - %s (Code: %s) Path: %s Method: %s",
        exc.message, exc.error_code, request.url.path, request.method
    )

    # Map exception types to HTTP status codes
    status_code_map = {
        "AUTHENTICATION_ERROR": status.HTTP_401_UNAUTHORIZED,
        "AUTHORIZATION_ERROR": status.HTTP_403_FORBIDDEN,
        "VALIDATION_ERROR": status.HTTP_422_UNPROCESSABLE_ENTITY,
        "CAS_ERROR": status.HTTP_401_UNAUTHORIZED,
        "DATABASE_ERROR": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "CONFIGURATION_ERROR": status.HTTP_500_INTERNAL_SERVER_ERROR,
    }

    status_code = status_code_map.get(
        exc.error_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    error_response = ErrorResponse(
        error=exc.message,
        error_code=exc.error_code,
        details=exc.details
    )

    return JSONResponse(
        status_code=status_code,
        content=error_response.model_dump()
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(
    request: Request,
    exc: HTTPException
) -> JSONResponse:
    """
    Handle FastAPI HTTP exceptions.

    Args:
        request (Request): HTTP request that caused the exception
        exc (HTTPException): The HTTP exception

    Returns:
        JSONResponse: Error response with exception details
    """
    logger.warning(
        "HTTP exception - Status: %s, Detail: %s Path: %s Method: %s",
        exc.status_code, exc.detail, request.url.path, request.method
    )

    error_response = ErrorResponse(
        error=str(exc.detail),
        error_code=f"HTTP_{exc.status_code}",
        details={"status_code": exc.status_code}
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump()
    )


@app.exception_handler(Exception)
async def general_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """
    Handle unexpected exceptions.

    Args:
        request (Request): HTTP request that caused the exception
        exc (Exception): The unexpected exception

    Returns:
        JSONResponse: Generic error response
    """
    logger.error(
        "Unexpected exception - %s: %s Path: %s Method: %s",
        type(exc).__name__, str(exc), request.url.path, request.method,
        exc_info=True
    )

    error_response = ErrorResponse(
        error="Internal server error",
        error_code="INTERNAL_ERROR",
        details={"error_type": type(exc).__name__} if settings.debug else {}
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response.model_dump()
    )


# Health check endpoint
@app.get(
    "/health",
    summary="Health check endpoint",
    description="Returns the health status of the application",
    response_model=HealthCheckResponse,
    tags=["Health"]
)
async def health_check() -> HealthCheckResponse:
    """
    Health check endpoint.

    This endpoint provides health status information for monitoring
    and load balancer health checks.

    Returns:
        HealthCheckResponse: Application health status
    """
    return HealthCheckResponse(
        status="healthy",
        version=settings.project_version,
        timestamp=datetime.now(timezone.utc).isoformat(),
        details={
            "debug_mode": settings.debug,
            "environment": "development" if settings.debug else "production"
        }
    )


# Root API endpoint (matching original Flask behavior)
@app.get(
    f"{settings.api_v1_prefix}/",
    summary="API root endpoint",
    description="Returns a simple message indicating the API is running",
    response_model=str,
    tags=["Root"]
)
async def api_root() -> str:
    """
    API root endpoint.

    This endpoint maintains exact compatibility with the
    original Flask implementation that returned "App is running!!"
    from the root API endpoint.

    Returns:
        str: Simple status message
    """
    logger.info("API root endpoint accessed")
    return "App is running!!"


# Include API routers
app.include_router(
    auth.router,
    prefix=settings.api_v1_prefix,
    tags=["Authentication"]
)

app.include_router(
    trial.router,
    prefix=settings.api_v1_prefix,
    tags=["Trial"]
)

app.include_router(
    connect.router,
    prefix=settings.api_v1_prefix,
    tags=["Connect"]
)


# Log application startup
logger.info(
    "FastAPI application configured - %s v%s Debug: %s API Prefix: %s",
    settings.project_name,
    settings.project_version,
    settings.debug,
    settings.api_v1_prefix
)

# Log loaded settings for debugging if enabled
if settings.debug:
    logger.debug("Application settings loaded: %s", settings.model_dump())


# Run the application directly when executed as a script
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=80,
        reload=settings.debug
    )
