"""
Custom exception classes for the SACC Website Backend.

This module defines custom exception classes
for handling various error scenarios
in the application, providing structured error
handling and informative error messages.

@module: app.core.exceptions
@author: unignoramus11
@version: 2.0.0
@since: 2025

Example:
    ```python
    from app.core.exceptions import AuthenticationError

    raise AuthenticationError("Invalid credentials provided")
    ```
"""

from typing import Any, Dict, Optional


class SACCBackendException(Exception):
    """
    Base exception class for SACC Backend.

    All custom exceptions in the application
    should inherit from this base class.
    This provides a consistent interface for
    error handling throughout the application.

    Attributes:
        message (str): Human-readable error message
        error_code (str): Unique error code for programmatic handling
        details (Optional[Dict[str, Any]]): Additional error details

    Example:
        ```python
        class CustomError(SACCBackendException):
            def __init__(self, message: str):
                super().__init__(message, "CUSTOM_ERROR")
        ```
    """

    def __init__(
        self,
        message: str,
        error_code: str = "GENERIC_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize the base exception.

        Args:
            message (str): Human-readable error message
            error_code (str): Unique error code for the exception
            details (Optional[Dict[str, Any]]): Additional error context

        Example:
            ```python
            raise SACCBackendException(
                "Something went wrong",
                "GENERIC_ERROR",
                {"user_id": "123", "action": "login"}
            )
            ```
        """
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(SACCBackendException):
    """
    Exception raised for authentication-related errors.

    This exception is raised when authentication fails, tokens are invalid,
    or authorization is denied.

    Example:
        ```python
        from app.core.exceptions import AuthenticationError

        if not valid_token:
            raise AuthenticationError(
                "Invalid JWT token",
                details={"token_expired": True}
            )
        ```
    """

    def __init__(
        self,
        message: str = "Authentication failed",
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize authentication error.

        Args:
            message (str): Authentication error message
            details (Optional[Dict[str, Any]]): Additional error context
        """
        super().__init__(message, "AUTHENTICATION_ERROR", details)


class AuthorizationError(SACCBackendException):
    """
    Exception raised for authorization-related errors.

    This exception is raised when a user doesn't have sufficient permissions
    to access a resource or perform an action.

    Example:
        ```python
        from app.core.exceptions import AuthorizationError

        if not user.is_admin:
            raise AuthorizationError(
                "Admin access required",
                details={"required_role": "admin", "user_role": user.role}
            )
        ```
    """

    def __init__(
        self,
        message: str = "Access denied",
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize authorization error.

        Args:
            message (str): Authorization error message
            details (Optional[Dict[str, Any]]): Additional error context
        """
        super().__init__(message, "AUTHORIZATION_ERROR", details)


class ValidationError(SACCBackendException):
    """
    Exception raised for data validation errors.

    This exception is raised when input data
    doesn't meet validation requirements
    or business rules.

    Example:
        ```python
        from app.core.exceptions import ValidationError

        if not email_pattern.match(email):
            raise ValidationError(
                "Invalid email format",
                details={"field": "email", "value": email}
            )
        ```
    """

    def __init__(
        self,
        message: str = "Validation failed",
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize validation error.

        Args:
            message (str): Validation error message
            details (Optional[Dict[str, Any]]): Additional error context
        """
        super().__init__(message, "VALIDATION_ERROR", details)


class CASError(SACCBackendException):
    """
    Exception raised for CAS authentication-related errors.

    This exception is raised when CAS authentication fails,
    tickets are invalid, or CAS server communication fails.

    Example:
        ```python
        from app.core.exceptions import CAS Error

        if not cas_response.success:
            raise CASError(
                "CAS ticket validation failed",
                details={"ticket": ticket, "service_url": service_url}
            )
        ```
    """

    def __init__(
        self,
        message: str = "CAS authentication failed",
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize CAS error.

        Args:
            message (str): CAS error message
            details (Optional[Dict[str, Any]]): Additional error context
        """
        super().__init__(message, "CAS_ERROR", details)


class DatabaseError(SACCBackendException):
    """
    Exception raised for database-related errors.

    This exception is raised when database operations fail,
    connections are lost, or data integrity issues occur.

    Example:
        ```python
        from app.core.exceptions import DatabaseError

        try:
            await db.execute(query)
        except Exception as e:
            raise DatabaseError(
                "Failed to execute query",
                details={"query": str(query), "error": str(e)}
            )
        ```
    """

    def __init__(
        self,
        message: str = "Database operation failed",
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize database error.

        Args:
            message (str): Database error message
            details (Optional[Dict[str, Any]]): Additional error context
        """
        super().__init__(message, "DATABASE_ERROR", details)


class ConfigurationError(SACCBackendException):
    """
    Exception raised for configuration-related errors.

    This exception is raised when required configuration is missing,
    invalid, or when configuration validation fails.

    Example:
        ```python
        from app.core.exceptions import ConfigurationError

        if not settings.cas_server_url:
            raise ConfigurationError(
                "CAS server URL not configured",
                details={"required_setting": "CAS_SERVER_URL"}
            )
        ```
    """

    def __init__(
        self,
        message: str = "Configuration error",
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize configuration error.

        Args:
            message (str): Configuration error message
            details (Optional[Dict[str, Any]]): Additional error context
        """
        super().__init__(message, "CONFIGURATION_ERROR", details)
