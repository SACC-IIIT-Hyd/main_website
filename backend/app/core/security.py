"""
Security utilities for the SACC Website Backend.

This module provides security-related functionality including JWT token
handling,
password hashing, and authentication utilities.

@module: app.core.security
@author: unignoramus11
@version: 2.0.0
@since: 2025

Example:
    ```python
    from app.core.security import create_access_token, verify_token
    token = create_access_token({"user_id": "123"})
    payload = verify_token(token)
    ```
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt
from passlib.context import CryptContext

from app.core.config import get_settings
from app.core.exceptions import AuthenticationError


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.

    This function generates a JWT token with the provided payload data and
    an expiration time. The token is signed using the application's secret key.

    Args:
        data (Dict[str, Any]): Payload data to include in the token
        expires_delta (Optional[timedelta]): Custom expiration time

    Returns:
        str: Encoded JWT token

    Raises:
        AuthenticationError: If token creation fails

    Example:
        ```python
        from app.core.security import create_access_token
        from datetime import timedelta

        payload = {
            "uid": "user123",
            "email": "user@example.com",
            "name": "John Doe"
        }

        token = create_access_token(
            payload,
            expires_delta=timedelta(hours=2)
        )
        ```
    """
    settings = get_settings()

    try:
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = (datetime.now(timezone.utc) +
                      timedelta(hours=settings.jwt_expiry_hours))

        to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})

        encoded_jwt = jwt.encode(
            to_encode,
            settings.jwt_secret_key,
            algorithm="HS256"
        )

        return encoded_jwt

    except Exception as e:
        raise AuthenticationError(
            "Failed to create access token",
            details={"error": str(e)}
        ) from e


def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify and decode a JWT token.

    This function verifies the signature and expiration of a JWT token,
    returning the decoded payload if valid.

    Args:
        token (str): JWT token to verify

    Returns:
        Dict[str, Any]: Decoded token payload

    Raises:
        AuthenticationError: If token is invalid, expired, or malformed

    Example:
        ```python
        from app.core.security import verify_token

        try:
            payload = verify_token(user_token)
            user_id = payload.get("uid")
        except AuthenticationError:
            # Handle invalid token
            pass
        ```
    """
    settings = get_settings()

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=["HS256"]
        )
        return payload

    except jwt.ExpiredSignatureError as exc:
        raise AuthenticationError(
            "Token has expired",
            details={"error_type": "expired_token"}
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise AuthenticationError(
            "Invalid token",
            details={"error_type": "invalid_token"}
        ) from exc
    except Exception as e:
        raise AuthenticationError(
            "Token verification failed",
            details={"error": str(e)}
        ) from e


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    This function securely hashes a plain text password using bcrypt
    with automatic salt generation.

    Args:
        password (str): Plain text password to hash

    Returns:
        str: Hashed password

    Example:
        ```python
        from app.core.security import hash_password

        plain_password = "user_password_123"
        hashed = hash_password(plain_password)
        ```
    """
    if pwd_context is None:
        raise RuntimeError("Password context not initialized")
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    This function verifies if a plain text password matches its
    bcrypt hash.

    Args:
        plain_password (str): Plain text password to verify
        hashed_password (str): Hashed password to compare against

    Returns:
        bool: True if password matches, False otherwise

    Example:
        ```python
        from app.core.security import verify_password

        is_valid = verify_password("user_input", stored_hash)
        if is_valid:
            # Password is correct
            pass
        ```
    """
    if pwd_context is None:
        raise RuntimeError("Password context not initialized")
    return pwd_context.verify(plain_password, hashed_password)


def generate_password_reset_token(email: str) -> str:
    """
    Generate a password reset token.

    This function creates a time-limited token for password reset
    functionality.

    Args:
        email (str): User email address

    Returns:
        str: Password reset token

    Example:
        ```python
        from app.core.security import generate_password_reset_token

        reset_token = generate_password_reset_token("user@example.com")
        ```
    """
    data = {"email": email, "type": "password_reset"}
    return create_access_token(data, expires_delta=timedelta(hours=1))


def verify_password_reset_token(token: str) -> Optional[str]:
    """
    Verify a password reset token and extract email.

    This function verifies a password reset token and returns the
    associated email address if valid.

    Args:
        token (str): Password reset token to verify

    Returns:
        Optional[str]: Email address if token is valid, None otherwise

    Example:
        ```python
        from app.core.security import verify_password_reset_token

        email = verify_password_reset_token(reset_token)
        if email:
            # Token is valid, proceed with reset
            pass
        ```
    """
    try:
        payload = verify_token(token)
        if payload.get("type") == "password_reset":
            return payload.get("email")
        return None
    except AuthenticationError:
        return None
