"""
Authentication-related Pydantic models for the SACC Website Backend.

This module defines data models for authentication requests, responses,
and user data structures used throughout the authentication system.

@module: app.models.auth
@author: unignoramus11
@version: 2.0.0
@since: 2025

Example:
    ```python
    from app.models.auth import UserResponse, LoginRequest

    user = UserResponse(uid="123", email="user@example.com", name="John")
    ```
"""

from typing import Optional
from pydantic import BaseModel, Field


class UserBase(BaseModel):
    """
    Base user model with common user attributes.

    This model defines the basic structure for user data that is
    shared across different user-related operations.

    Attributes:
        uid (str): Unique user identifier
        email (str): User email address
        name (Optional[str]): Full name of the user
        first_name (Optional[str]): User's first name
        last_name (Optional[str]): User's last name
        roll_no (Optional[str]): Student roll number

    Example:
        ```python
        user = UserBase(
            uid="student123",
            email="student@iiit.ac.in",
            name="John Doe",
            roll_no="2021101001"
        )
        ```
    """

    uid: str = Field(
        description="Unique user identifier from authentication system",
        examples=["student123"]
    )

    email: str = Field(
        description="User email address",
        examples=["student@iiit.ac.in"]
    )

    name: Optional[str] = Field(
        default=None,
        description="Full name of the user",
        examples=["John Doe"]
    )

    first_name: Optional[str] = Field(
        default=None,
        description="User's first name",
        examples=["John"]
    )

    last_name: Optional[str] = Field(
        default=None,
        description="User's last name",
        examples=["Doe"]
    )

    roll_no: Optional[str] = Field(
        default=None,
        description="Student roll number",
        examples=["2021101001"]
    )


class UserResponse(UserBase):
    """
    User response model for API responses.

    This model extends UserBase and is used for returning user data
    in API responses. It includes all user information that should
    be exposed to clients.

    Example:
        ```python
        user_response = UserResponse(
            uid="student123",
            email="student@iiit.ac.in",
            name="John Doe",
            roll_no="2021101001",
            is_authenticated=True
        )
        ```
    """

    is_authenticated: bool = Field(
        default=True,
        description="Whether the user is currently authenticated",
        examples=[True]
    )


class LoginRequest(BaseModel):
    """
    Login request model for authentication endpoints.

    This model defines the structure for login requests, typically
    used when redirecting to or from CAS authentication.

    Attributes:
        next_url (Optional[str]): URL to redirect after successful login
        ticket (Optional[str]): CAS authentication ticket

    Example:
        ```python
        login_req = LoginRequest(
            next_url="/dashboard",
            ticket="ST-123456-abcdef"
        )
        ```
    """

    next_url: Optional[str] = Field(
        default=None,
        alias="next",
        description="URL to redirect after successful login",
        examples=["/dashboard"]
    )

    ticket: Optional[str] = Field(
        default=None,
        description="CAS authentication ticket",
        examples=["ST-123456-abcdef-cas.example.com"]
    )


class LoginResponse(BaseModel):
    """
    Login response model for successful authentication.

    This model defines the structure of responses returned after
    successful authentication, including user data and tokens.

    Attributes:
        user (UserResponse): Authenticated user information
        access_token (str): JWT access token
        token_type (str): Type of the token (typically "bearer")
        expires_in (int): Token expiration time in seconds

    Example:
        ```python
        response = LoginResponse(
            user=user_data,
            access_token="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
            token_type="bearer",
            expires_in=86400
        )
        ```
    """

    user: UserResponse = Field(
        ...,
        description="Authenticated user information"
    )

    access_token: str = Field(
        description="JWT access token for API authentication",
        examples=["eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."]
    )

    token_type: str = Field(
        default="bearer",
        description="Type of the authentication token",
        examples=["bearer"]
    )

    expires_in: int = Field(
        description="Token expiration time in seconds",
        examples=[86400]
    )


class LogoutRequest(BaseModel):
    """
    Logout request model for logout endpoints.

    This model defines the structure for logout requests, including
    optional redirect URLs.

    Attributes:
        redirect_url (Optional[str]): URL to redirect after logout

    Example:
        ```python
        logout_req = LogoutRequest(redirect_url="/login")
        ```
    """

    redirect_url: Optional[str] = Field(
        default=None,
        description="URL to redirect after successful logout",
        examples=["/login"]
    )


class LogoutResponse(BaseModel):
    """
    Logout response model for logout confirmations.

    This model defines the structure of responses returned after
    successful logout operations.

    Attributes:
        message (str): Logout confirmation message
        logout_url (Optional[str]): CAS logout URL if applicable

    Example:
        ```python
        response = LogoutResponse(
            message="Successfully logged out",
            logout_url="https://cas.example.com/logout"
        )
        ```
    """

    message: str = Field(
        default="Successfully logged out",
        description="Logout confirmation message",
        examples=["Successfully logged out"]
    )

    logout_url: Optional[str] = Field(
        default=None,
        description="CAS logout URL for complete logout",
        examples=["https://cas.example.com/logout"]
    )


class TokenValidationRequest(BaseModel):
    """
    Token validation request model.

    This model defines the structure for token validation requests,
    used to verify JWT tokens.

    Attributes:
        token (str): JWT token to validate

    Example:
        ```python
        validation_req = TokenValidationRequest(
            token="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
        )
        ```
    """

    token: str = Field(
        description="JWT token to validate",
        examples=["eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."]
    )


class TokenValidationResponse(BaseModel):
    """
    Token validation response model.

    This model defines the structure of responses returned after
    token validation operations.

    Attributes:
        is_valid (bool): Whether the token is valid
        user (Optional[UserResponse]): User data if token is valid
        error (Optional[str]): Error message if token is invalid

    Example:
        ```python
        response = TokenValidationResponse(
            is_valid=True,
            user=user_data,
            error=None
        )
        ```
    """

    is_valid: bool = Field(
        description="Whether the provided token is valid",
        examples=[True]
    )

    user: Optional[UserResponse] = Field(
        None,
        description="User information if token is valid"
    )

    error: Optional[str] = Field(
        default=None,
        description="Error message if token validation failed",
        examples=["Token has expired"]
    )
