"""
Common Pydantic models for the SACC Website Backend.

This module defines shared data models used across
different parts of the application, including generic response models,
error models, and utility schemas.

@module: app.models.common
@author: unignoramus11
@version: 2.0.0
@since: 2025

Example:
    ```python
    from app.models.common import APIResponse, ErrorResponse

    success_response = APIResponse(message="Success", data={"result": "ok"})
    error_response = ErrorResponse(error="Something went wrong")
    ```
"""

from typing import Any, Dict, Generic, Optional, TypeVar
from pydantic import BaseModel, Field

# Generic type variable for API responses
T = TypeVar('T')


class APIResponse(BaseModel, Generic[T]):
    """
    Generic API response model.

    This model provides a consistent structure for all API responses,
    including success and error scenarios. It includes a message,
    optional data payload, and error information.

    Attributes:
        message (str): Response message
        data (Optional[T]): Response data payload
        error (Optional[str]): Error message if applicable

    Example:
        ```python
        from app.models.common import APIResponse

        # Success response
        response = APIResponse[dict](
            message="User retrieved successfully",
            data={"user_id": "123", "name": "John"},
            error=None
        )

        # Error response
        error_response = APIResponse[None](
            message="Failed to retrieve user",
            data=None,
            error="User not found"
        )
        ```
    """

    message: str = Field(
        description="Human-readable response message",
        examples=["Operation completed successfully"]
    )

    data: Optional[T] = Field(
        None,
        description="Response data payload"
    )

    error: Optional[str] = Field(
        default=None,
        description="Error message if the operation failed",
        examples=["Invalid input provided"]
    )


class ErrorResponse(BaseModel):
    """
    Error response model for API errors.

    This model provides a structured format for error responses,
    including error messages, codes, and additional details.

    Attributes:
        error (str): Main error message
        error_code (str): Unique error code
        details (Optional[Dict[str, Any]]): Additional error details

    Example:
        ```python
        from app.models.common import ErrorResponse

        error = ErrorResponse(
            error="Authentication failed",
            error_code="AUTH_001",
            details={"reason": "Invalid token", "expired": True}
        )
        ```
    """

    error: str = Field(
        description="Main error message",
        examples=["Authentication failed"]
    )

    error_code: str = Field(
        default="GENERIC_ERROR",
        description="Unique error code for programmatic handling",
        examples=["AUTH_001"]
    )

    details: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional error details and context",
        examples=[{"field": "email", "reason": "Invalid format"}]
    )


class HealthCheckResponse(BaseModel):
    """
    Health check response model.

    This model defines the structure for health check endpoints,
    providing system status and version information.

    Attributes:
        status (str): Overall system status
        version (str): Application version
        timestamp (str): Health check timestamp
        details (Optional[Dict[str, Any]]): Additional health details

    Example:
        ```python
        from app.models.common import HealthCheckResponse

        health = HealthCheckResponse(
            status="healthy",
            version="2.0.0",
            timestamp="2025-01-15T10:30:00Z",
            details={"database": "connected", "memory_usage": "45%"}
        )
        ```
    """

    status: str = Field(
        description="Overall system health status",
        examples=["healthy"]
    )

    version: str = Field(
        description="Application version",
        examples=["2.0.0"]
    )

    timestamp: str = Field(
        description="Health check timestamp in ISO format",
        examples=["2025-01-15T10:30:00Z"]
    )

    details: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional health check details",
        examples=[{"database": "connected", "uptime": "2d 4h 30m"}]
    )


class PaginationParams(BaseModel):
    """
    Pagination parameters model.

    This model defines standard pagination parameters for list endpoints,
    including page size, offset, and sorting options.

    Attributes:
        page (int): Page number (1-based)
        per_page (int): Number of items per page
        sort_by (Optional[str]): Field to sort by
        sort_order (str): Sort order (asc or desc)

    Example:
        ```python
        from app.models.common import PaginationParams

        pagination = PaginationParams(
            page=1,
            per_page=25,
            sort_by="created_at",
            sort_order="desc"
        )
        ```
    """

    page: int = Field(
        default=1,
        ge=1,
        description="Page number (1-based)",
        examples=[1]
    )

    per_page: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Number of items per page (max 100)",
        examples=[10]
    )

    sort_by: Optional[str] = Field(
        default=None,
        description="Field name to sort by",
        examples=["created_at"]
    )

    sort_order: str = Field(
        default="asc",
        pattern="^(asc|desc)$",
        description="Sort order: 'asc' for ascending, 'desc' for descending",
        examples=["desc"]
    )


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Paginated response model.

    This model provides a structured format for paginated data responses,
    including the data items and pagination metadata.

    Attributes:
        items (list[T]): List of data items
        total (int): Total number of items
        page (int): Current page number
        per_page (int): Items per page
        total_pages (int): Total number of pages
        has_next (bool): Whether there's a next page
        has_prev (bool): Whether there's a previous page

    Example:
        ```python
        from app.models.common import PaginatedResponse

        response = PaginatedResponse[dict](
            items=[{"id": 1, "name": "Item 1"}],
            total=100,
            page=1,
            per_page=10,
            total_pages=10,
            has_next=True,
            has_prev=False
        )
        ```
    """

    items: list[T] = Field(
        ...,
        description="List of data items for the current page"
    )

    total: int = Field(
        description="Total number of items across all pages",
        examples=[100]
    )

    page: int = Field(
        description="Current page number",
        examples=[1]
    )

    per_page: int = Field(
        description="Number of items per page",
        examples=[10]
    )

    total_pages: int = Field(
        description="Total number of pages",
        examples=[10]
    )

    has_next: bool = Field(
        description="Whether there's a next page available",
        examples=[True]
    )

    has_prev: bool = Field(
        description="Whether there's a previous page available",
        examples=[False]
    )
