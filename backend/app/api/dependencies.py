"""
FastAPI dependencies for the SACC Website Backend.

This module defines dependency functions for authentication, authorization,
and common request handling used across API endpoints.

@module: app.api.dependencies
@author: unignoramus11
@version: 2.0.0
@since: 2025

Example:
    ```python
    from fastapi import Depends
    from app.api.dependencies import get_current_user

    @router.get("/protected")
    async def protected_endpoint(user = Depends(get_current_user)):
        return {"user": user.email}
    ```
"""

from typing import Optional
from fastapi import Cookie, Depends, HTTPException, status
from app.core.exceptions import AuthenticationError
from app.core.logging import get_logger
from app.models.auth import UserResponse
from app.services.auth_service import AuthService


logger = get_logger(__name__)


def get_auth_service() -> AuthService:
    """
    Get authentication service instance.

    This dependency provides a configured AuthService instance
    for handling authentication operations.

    Returns:
        AuthService: Configured authentication service

    Example:
        ```python
        from fastapi import Depends
        from app.api.dependencies import get_auth_service

        @router.post("/login")
        async def login(auth_service: AuthService = Depends(get_auth_service)):
            return auth_service.get_cas_login_url()
        ```
    """
    return AuthService()


async def get_current_user(
    authorization_yearbook: Optional[str] = Cookie(
        None, alias="Authorization_YearBook"),
    auth_service: AuthService = Depends(get_auth_service)
) -> UserResponse:
    """
    Get the current authenticated user from JWT token.

    This dependency extracts and validates the JWT token from the
    Authorization_YearBook cookie and returns the user information.

    Args:
        authorization_yearbook (Optional[str]): JWT token from
            cookie
        auth_service (AuthService): Authentication service instance

    Returns:
        UserResponse: Current authenticated user information

    Raises:
        HTTPException: If token is missing, invalid, or expired

    Example:
        ```python
        from fastapi import Depends
        from app.api.dependencies import get_current_user

        @router.get("/profile")
        async def get_profile(user = Depends(get_current_user)):
            return {"user_id": user.uid, "email": user.email}
        ```
    """
    if not authorization_yearbook:
        logger.warning(
            "Authentication required - no token provided",
            extra={"component": "dependencies"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user = auth_service.verify_user_token(authorization_yearbook)

        logger.info(
            "User authenticated successfully",
            extra={
                "user_uid": user.uid,
                "user_email": user.email,
                "component": "dependencies"
            }
        )

        return user

    except AuthenticationError as e:
        logger.warning(
            "Authentication failed",
            extra={
                "error": str(e),
                "error_code": e.error_code,
                "component": "dependencies"
            }
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def get_optional_current_user(
    authorization_yearbook: Optional[str] = Cookie(
        None, alias="Authorization_YearBook"),
    auth_service: AuthService = Depends(get_auth_service)
) -> Optional[UserResponse]:
    """
    Get the current user if authenticated, otherwise return None.

    This dependency is similar to get_current_user but doesn't raise
    an exception if no valid token is provided. Useful for endpoints
    that have optional authentication.

    Args:
        authorization_yearbook (Optional[str]): JWT token from
            cookie
        auth_service (AuthService): Authentication service instance

    Returns:
        Optional[UserResponse]: User information if authenticated,
        None otherwise

    Example:
        ```python
        from fastapi import Depends
        from app.api.dependencies import get_optional_current_user

        @router.get("/public")
        async def public_endpoint(
            user = Depends(get_optional_current_user)
        ):
            if user:
                return {"message": f"Hello {user.name}!"}
            else:
                return {"message": "Hello anonymous user!"}
        ```
    """
    if not authorization_yearbook:
        return None

    try:
        user = auth_service.verify_user_token(authorization_yearbook)

        logger.info(
            "Optional authentication successful",
            extra={
                "user_uid": user.uid,
                "user_email": user.email,
                "component": "dependencies"
            }
        )

        return user

    except AuthenticationError as e:
        logger.info(
            "Optional authentication failed",
            extra={
                "error": str(e),
                "component": "dependencies"
            }
        )
        return None


def verify_token_validity(
    authorization_yearbook: Optional[str] = Cookie(
        None, alias="Authorization_YearBook"),
    auth_service: AuthService = Depends(get_auth_service)
) -> bool:
    """
    Verify if the provided token is valid.

    This dependency only checks token validity without returning user data.
    Useful for token validation endpoints.

    Args:
        authorization_yearbook (Optional[str]): JWT token from
            cookie
        auth_service (AuthService): Authentication service instance

    Returns:
        bool: True if token is valid, False otherwise

    Example:
        ```python
        from fastapi import Depends
        from app.api.dependencies import verify_token_validity

        @router.get("/verify")
        async def verify_token(
            is_valid: bool = Depends(verify_token_validity)
        ):
            return {"valid": is_valid}
        ```
    """
    if not authorization_yearbook:
        return False

    return auth_service.is_token_valid(authorization_yearbook)
