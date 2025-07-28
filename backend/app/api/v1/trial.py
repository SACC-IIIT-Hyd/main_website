"""
Trial endpoints for the SACC Website Backend API v1.

This module contains trial/test endpoints for development and testing purposes.
It maintains compatibility with the original Flask backend interface.

@module: app.api.v1.trial
@author: unignoramus11
@version: 2.0.0
@since: 2025

Example:
    ```python
    from fastapi import APIRouter
    from app.api.v1.trial import router

    app.include_router(router, prefix="/api")
    ```
"""

from fastapi import APIRouter, Depends
from app.api.dependencies import get_current_user
from app.core.logging import get_logger
from app.models.auth import UserResponse


# Initialize router with tags for OpenAPI documentation
router = APIRouter(
    prefix="",
    tags=["Trial"],
    responses={404: {"description": "Not found"}},
)

logger = get_logger(__name__)


@router.get(
    "/trial",
    summary="Trial endpoint for testing authentication",
    description="""
    Trial endpoint that returns current user information.

    This endpoint is used for testing authentication and retrieving
    user data from JWT tokens. It requires valid authentication.

    **Authentication Required:** Yes

    **Returns:**
    - User information from JWT token payload
    - All user attributes including uid, email, name, roll_no, etc.

    **Use Cases:**
    - Testing authentication flow
    - Debugging user token data
    - Development and testing purposes

    **Original Flask Behavior:**
    This endpoint maintains exact compatibility with the original Flask
    implementation that returned the current_user dictionary directly.
    """,
    response_model=dict,
    responses={
        200: {
            "description": "User information",
            "content": {
                "application/json": {
                    "example": {
                        "uid": "student123",
                        "email": "student@iiit.ac.in",
                        "name": "John Doe",
                        "roll_no": "2021101001",
                        "first_name": "John",
                        "last_name": "Doe"
                    }
                }
            }
        },
        401: {"description": "Authentication required"},
        500: {"description": "Server error"}
    }
)
async def trial_endpoint(
    current_user: UserResponse = Depends(get_current_user)
) -> dict:
    """
    Trial endpoint that returns current user information.

    This endpoint maintains exact compatibility
    with the original Flask implementation.
    It returns the current user's information extracted from the JWT token.

    The original Flask code returned the current_user dictionary directly:
    ```python
    @blueprint.route("/trial")
    @login_required
    def index(current_user=None):
        return current_user
    ```

    This FastAPI implementation preserves
    the same behavior and response format.

    Args:
        current_user (UserResponse): Current authenticated user from JWT token

    Returns:
        dict: User information dictionary matching original Flask format

    Example Response:
        ```json
        {
            "uid": "student123",
            "email": "student@iiit.ac.in",
            "name": "John Doe",
            "roll_no": "2021101001",
            "first_name": "John",
            "last_name": "Doe"
        }
        ```
    """
    logger.info("Trial endpoint accessed")

    # Convert UserResponse back to dictionary
    # format to match original Flask behavior
    user_dict = {
        "uid": current_user.uid,
        "email": current_user.email,
    }

    # Add optional fields only if they exist (matching original behavior)
    if current_user.name:
        user_dict["name"] = current_user.name
    if current_user.first_name:
        user_dict["first_name"] = current_user.first_name
    if current_user.last_name:
        user_dict["last_name"] = current_user.last_name
    if current_user.roll_no:
        user_dict["roll_no"] = current_user.roll_no

    logger.info("Returning user data from trial endpoint")

    return user_dict
