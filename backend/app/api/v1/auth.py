"""
Authentication endpoints for the SACC Website Backend API v1.

This module contains all authentication-related API endpoints including
login, logout, and token verification. It maintains compatibility with
the original Flask backend interface.

@module: app.api.v1.auth
@author: unignoramus11
@version: 2.0.0
@since: 2025

Example:
    ```python
    from fastapi import APIRouter
    from app.api.v1.auth import router

    app.include_router(router, prefix="/api")
    ```
"""

from typing import Optional
from fastapi import (APIRouter, Cookie, Depends,
                     HTTPException, Query, Response, status)
from fastapi.responses import RedirectResponse
from app.api.dependencies import get_auth_service
from app.core.config import get_settings
from app.core.exceptions import AuthenticationError, CASError
from app.core.logging import get_logger
from app.services.auth_service import AuthService


# Initialize router with tags for OpenAPI documentation
router = APIRouter(
    prefix="",
    tags=["Authentication"],
    responses={404: {"description": "Not found"}},
)

logger = get_logger(__name__)
settings = get_settings()


@router.get(
    "/login",
    summary="Initiate or handle CAS login",
    description="""
    Handles CAS authentication login process.

    This endpoint serves two purposes:
    1. If no ticket is provided, redirects to CAS login URL
    2. If ticket is provided (CAS callback), verifies ticket
    and creates user session

    **Behavior:**
    - Without ticket: Redirects to CAS server for authentication
    - With ticket: Validates ticket, creates JWT token, sets cookie,
    redirects to next URL
    - If already logged in: Redirects to home page

    **Query Parameters:**
    - `next`: URL to redirect after successful login (optional)
    - `ticket`: CAS authentication ticket (provided by CAS server)

    **Response:**
    - Redirect to CAS login (if no ticket)
    - Redirect to next URL with auth cookie (if ticket valid)
    - Error message (if ticket invalid)
    """,
    responses={
        302: {"description": "Redirect to CAS login or next URL"},
        200: {"description": "Login error message"},
        500: {"description": "Server error"}
    }
)
async def login(
    next_url: Optional[str] = Query(
        None, alias="next", description="URL to redirect after login"),
    ticket: Optional[str] = Query(
        None, description="CAS authentication ticket"),
    authorization_yearbook: Optional[str] = Cookie(
        None, alias="Authorization_YearBook"),
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Handle CAS login process.

    This endpoint maintains exact compatibility
    with the original Flask implementation.
    It handles both the initial redirect to CAS
    and the callback from CAS with a ticket.

    Args:
        next_url (Optional[str]): URL to redirect after successful login
        ticket (Optional[str]): CAS authentication ticket from callback
        authorization_yearbook (Optional[str]): Existing JWT token cookie
        auth_service (AuthService): Authentication service dependency

    Returns:
        RedirectResponse: Redirect to appropriate URL
        str: Error message for failed authentication

    Raises:
        HTTPException: For server errors during authentication
    """
    try:
        # Check if user is already logged in
        if authorization_yearbook and auth_service.is_token_valid(
            authorization_yearbook
        ):
            logger.info("User already authenticated, redirecting to home")
            return RedirectResponse(
                url="/home",
                status_code=status.HTTP_302_FOUND
            )

        # If no ticket, redirect to CAS login
        if not ticket:
            logger.info("No ticket provided, redirecting to CAS login")
            cas_login_url = auth_service.get_cas_login_url()
            return RedirectResponse(
                url=cas_login_url, status_code=status.HTTP_302_FOUND)

        # Verify CAS ticket and get user data
        logger.info("Verifying CAS ticket")

        user_data = auth_service.verify_cas_ticket(ticket)

        if not user_data or not user_data.get("email"):
            logger.warning("CAS ticket verification failed - no user data")
            return 'Failed to verify ticket. <a href="/api/login">Login</a>'

        # Create user session and JWT token
        login_response = auth_service.create_user_session(user_data)

        # Determine redirect URL
        redirect_url = next_url or settings.redirect_url

        logger.info("Login successful, setting cookie and redirecting")

        # Create redirect response and set cookie (original Flask)
        redirect_response = RedirectResponse(
            url=redirect_url,
            status_code=status.HTTP_302_FOUND
        )

        redirect_response.set_cookie(
            key="Authorization_YearBook",
            value=login_response.access_token,
            httponly=False,  # Match original Flask setting
            secure=False,    # Match original Flask setting
            max_age=86400,   # 1 day - match original Flask setting
            samesite="lax"
        )

        return redirect_response

    except CASError as e:
        logger.error("CAS authentication error: %s", str(e))
        return 'Failed to verify ticket. <a href="/api/login">Login</a>'

    except AuthenticationError as e:
        logger.error("Authentication error during login: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        ) from e

    except Exception as e:
        logger.error("Unexpected error during login: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong"
        ) from e


@router.get(
    "/logout",
    summary="Initiate CAS logout",
    description="""
    Initiates the CAS logout process.

    This endpoint redirects the user to the CAS logout URL, which will
    invalidate the CAS session and redirect back to the logout callback.

    **Behavior:**
    - Generates CAS logout URL with callback
    - Redirects user to CAS logout page
    - CAS will redirect back to /logoutCallback after logout

    **Response:**
    - Redirect to CAS logout URL
    """,
    responses={
        302: {"description": "Redirect to CAS logout URL"},
        500: {"description": "Server error"}
    }
)
async def logout(
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Initiate CAS logout process.

    This endpoint maintains exact compatibility
    with the original Flask implementation.
    It redirects the user to the CAS logout URL.

    Args:
        auth_service (AuthService): Authentication service dependency

    Returns:
        RedirectResponse: Redirect to CAS logout URL

    Raises:
        HTTPException: For server errors during logout initiation
    """
    try:
        # Generate logout callback URL
        # Note: In the original Flask code, this used url_for
        # We need to construct the full URL for the logout callback
        logout_callback_url = f"{settings.service_url}/api/logoutCallback"

        logger.info("Initiating CAS logout")

        # Get CAS logout URL
        cas_logout_url = auth_service.get_cas_logout_url(logout_callback_url)

        logger.info("Redirecting to CAS logout")

        return RedirectResponse(
            url=cas_logout_url, status_code=status.HTTP_302_FOUND)

    except CASError as e:
        logger.error("CAS logout error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initiate logout"
        ) from e

    except Exception as e:
        logger.error("Unexpected error during logout: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong"
        ) from e


@router.get(
    "/logoutCallback",
    summary="Handle CAS logout callback",
    description="""
    Handles the callback from CAS after logout completion.

    This endpoint is called by the CAS server after the user has been
    logged out. It clears the authentication cookies and completes
    the logout process.

    **Behavior:**
    - Expires the Authentication_YearBook cookie
    - Expires any logout-related cookies
    - Returns empty response (matching original Flask behavior)

    **Response:**
    - Empty response with expired cookies
    """,
    responses={
        200: {"description": "Logout completed, cookies cleared"}
    }
)
async def logout_callback():
    """
    Handle CAS logout callback.

    This endpoint maintains exact compatibility with the original Flask
    implementation.
    It clears authentication cookies after CAS logout completion.

    Returns:
        Response: Empty response with expired authentication cookies
    """
    logger.info("Processing logout callback")

    # Create response with expired cookies (original Flask)
    response = Response()

    # Expire the authentication cookie
    response.set_cookie(
        key="Authorization_YearBook",
        value="",
        expires=0,
        httponly=False,
        secure=False,
        max_age=0
    )

    # Expire logout cookie (original Flask)
    response.set_cookie(
        key="logout",
        value="",
        expires=0,
        httponly=False,
        secure=False,
        max_age=0
    )

    logger.info("Logout callback completed, cookies expired")

    return response
