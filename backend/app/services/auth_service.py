"""
Authentication service for the SACC Website Backend.

This module provides authentication-related business logic including
CAS integration, JWT token management, and user session handling.
It integrates with the Connect service to manage user profiles.

@module: app.services.auth_service
@author: unignoramus11
@version: 2.0.0
@since: 2025

Example:
    ```python
    from app.services.auth_service import AuthService

    auth_service = AuthService()
    login_url = auth_service.get_cas_login_url()
    ```
"""

from typing import Dict, Any, Optional
from urllib.parse import quote_plus
try:
    from cas import CASClient
except ImportError:
    # CAS library not available
    CASClient = None
from app.core.config import get_settings
from app.core.exceptions import (
    AuthenticationError, CASError, ConfigurationError
)
from app.core.security import create_access_token, verify_token
from app.core.logging import get_logger, log_with_context
from app.models.auth import UserResponse, LoginResponse
from app.services.connect_service import ConnectService


class AuthService:
    """
    Authentication service class.

    This service handles all authentication-related operations including
    CAS integration, JWT token management, and user validation.

    Attributes:
        settings: Application settings instance
        cas_client: CAS client for authentication
        logger: Structured logger instance

    Example:
        ```python
        from app.services.auth_service import AuthService

        auth_service = AuthService()

        # Get CAS login URL
        login_url = auth_service.get_cas_login_url()

        # Verify CAS ticket
        user_data = auth_service.verify_cas_ticket("ST-123456")
        ```
    """

    def __init__(self):
        """
        Initialize the authentication service.

        Sets up the CAS client configuration and validates required settings.
        Initializes the ConnectService for user profile management.

        Raises:
            ConfigurationError: If required CAS settings are missing
        """
        self.settings = get_settings()
        self.logger = get_logger(__name__)
        self.connect_service = ConnectService()

        # Validate required CAS configuration
        if not self.settings.cas_server_url:
            raise ConfigurationError(
                "CAS server URL is required for authentication",
                details={"missing_setting": "CAS_SERVER_URL"}
            )

        if not self.settings.service_url:
            raise ConfigurationError(
                "Service URL is required for CAS authentication",
                details={"missing_setting": "SERVICE_URL"}
            )

        # Initialize CAS client if the library is available
        if CASClient:
            service_url = (
                f"{self.settings.service_url}?next="
                f"{quote_plus(self.settings.redirect_url)}"
            )

            self.cas_client = CASClient(
                version=3,
                service_url=service_url,
                server_url=self.settings.cas_server_url,
            )
        else:
            self.cas_client = None
            self.logger.warning(
                "CAS client could not be initialized - library not available",
                extra={"component": "auth_service"}
            )

        # Use the log_with_context function for structured logging
        log_with_context(
            self.logger,
            "info",
            "Authentication service initialized",
            cas_server=self.settings.cas_server_url,
            service_url=service_url,
            component="auth_service"
        )

    def get_cas_login_url(self) -> str:
        """
        Get the CAS login URL.

        This method generates the URL that users should be redirected to
        for CAS authentication.

        Returns:
            str: CAS login URL

        Example:
            ```python
            auth_service = AuthService()
            login_url = auth_service.get_cas_login_url()
            # Redirect user to login_url
            ```
        """
        try:
            if not self.cas_client:
                raise CASError(
                    "CAS client not properly initialized",
                    details={"error": "CAS library not available"}
                )

            login_url = self.cas_client.get_login_url()

            log_with_context(
                self.logger,
                "info",
                "Generated CAS login URL",
                login_url=login_url,
                component="auth_service"
            )

            return login_url

        except Exception as e:
            log_with_context(
                self.logger,
                "error",
                "Failed to generate CAS login URL",
                error=str(e),
                component="auth_service"
            )
            raise CASError(
                "Failed to generate login URL",
                details={"error": str(e)}
            ) from e

    def verify_cas_ticket(self, ticket: str) -> Dict[str, Any]:
        """
        Verify a CAS ticket and extract user information.

        This method validates a CAS ticket with the CAS server and
        extracts user attributes from the response.

        Args:
            ticket (str): CAS authentication ticket

        Returns:
            Dict[str, Any]: User information from CAS

        Raises:
            CASError: If ticket verification fails
            AuthenticationError: If user information is invalid

        Example:
            ```python
            auth_service = AuthService()
            try:
                user_info = auth_service.verify_cas_ticket("ST-123456")
                print(f"Authenticated user: {user_info['email']}")
            except CASError:
                print("CAS authentication failed")
            ```
        """
        try:
            log_with_context(
                self.logger,
                "info",
                "Verifying CAS ticket",
                ticket=ticket[:20] + "..." if len(ticket) > 20 else ticket,
                component="auth_service"
            )

            if not self.cas_client:
                raise CASError(
                    "CAS client not properly initialized",
                    details={"error": "CAS library not available"}
                )

            user, attributes, _ = self.cas_client.verify_ticket(ticket)

            # If attributes is None, create an empty dict to avoid errors
            if attributes is None:
                attributes = {}

            if not user:
                log_with_context(
                    self.logger,
                    "warning",
                    "CAS ticket verification failed",
                    ticket=ticket[:20] + "..." if len(ticket) > 20 else ticket,
                    component="auth_service"
                )
                raise CASError(
                    "Failed to verify CAS ticket",
                    details={"ticket": ticket}
                )

            # Extract user information
            user_data = {
                "uid": attributes.get("uid", ""),
                "email": user,
                "name": attributes.get("Name", ""),
                "roll_no": attributes.get("RollNo", ""),
                "first_name": attributes.get("FirstName", ""),
                "last_name": attributes.get("LastName", ""),
            }

            log_with_context(
                self.logger,
                "info",
                "CAS ticket verified successfully",
                user_email=user,
                user_uid=attributes.get("uid", ""),
                component="auth_service"
            )

            return user_data

        except CASError:
            raise
        except Exception as e:
            log_with_context(
                self.logger,
                "error",
                "CAS ticket verification error",
                error=str(e),
                ticket=ticket[:20] + "..." if len(ticket) > 20 else ticket,
                component="auth_service"
            )
            raise CASError(
                "CAS ticket verification failed",
                details={"error": str(e), "ticket": ticket}
            ) from e

    async def create_user_session(self, user_data: Dict[str, Any]) -> LoginResponse:
        """
        Create a user session with JWT token.

        This method creates a JWT token for the authenticated user and
        returns a complete login response. It also ensures the user
        profile is created or updated in the database via ConnectService.

        Args:
            user_data (Dict[str, Any]): User information from CAS

        Returns:
            LoginResponse: Complete login response with token and user data

        Raises:
            AuthenticationError: If token creation fails

        Example:
            ```python
            auth_service = AuthService()
            user_info = {"uid": "123", "email": "user@example.com"}
            login_response = auth_service.create_user_session(user_info)
            ```
        """
        try:
            # Get or create user profile in the database
            cas_uid = user_data.get("uid", "")
            email = user_data.get("email", "")
            name = user_data.get("name", "")

            # If name is not provided, try to build it from first and last name
            if not name:
                first_name = user_data.get("first_name", "")
                last_name = user_data.get("last_name", "")
                if first_name or last_name:
                    name = f"{first_name} {last_name}".strip()
                else:
                    # Use email as fallback for name
                    name = email.split("@")[0]

            # Ensure user exists in the database
            user_profile, created = await self.connect_service._get_or_create_user_profile(
                uid=cas_uid,
                email=email,
                name=name
            )

            # Use the actual DB uid in the user_data for token creation
            user_data["uid"] = user_profile.uid

            # Log user profile creation/retrieval
            if created:
                log_with_context(
                    self.logger,
                    "info",
                    "Created new user profile in database",
                    user_uid=user_profile.uid,
                    user_email=email,
                    component="auth_service"
                )
            else:
                log_with_context(
                    self.logger,
                    "info",
                    "Retrieved existing user profile from database",
                    user_uid=user_profile.uid,
                    user_email=email,
                    component="auth_service"
                )

            # Create JWT token
            token = create_access_token(user_data)

            # Create user response model
            user_response = UserResponse(
                uid=user_profile.uid,  # Use the actual DB uid
                email=user_data.get("email", ""),
                name=user_data.get("name"),
                first_name=user_data.get("first_name"),
                last_name=user_data.get("last_name"),
                roll_no=user_data.get("roll_no"),
                is_authenticated=True
            )

            # Create login response
            login_response = LoginResponse(
                user=user_response,
                access_token=token,
                token_type="bearer",
                expires_in=self.settings.jwt_expiry_hours * 3600  # seconds
            )

            log_with_context(
                self.logger,
                "info",
                "Created user session",
                user_uid=user_profile.uid,
                user_email=user_data.get("email"),
                token_expires_in=self.settings.jwt_expiry_hours,
                component="auth_service"
            )

            return login_response

        except Exception as e:
            log_with_context(
                self.logger,
                "error",
                "Failed to create user session",
                error=str(e),
                user_uid=user_data.get("uid"),
                component="auth_service"
            )
            raise AuthenticationError(
                "Failed to create user session",
                details={"error": str(e)}
            ) from e

    def verify_user_token(self, token: str) -> UserResponse:
        """
        Verify a JWT token and return user information.

        This method validates a JWT token and extracts user information
        from the token payload.

        Args:
            token (str): JWT token to verify

        Returns:
            UserResponse: User information from token

        Raises:
            AuthenticationError: If token is invalid or expired

        Example:
            ```python
            auth_service = AuthService()
            try:
                user = auth_service.verify_user_token(token)
                print(f"Authenticated user: {user.email}")
            except AuthenticationError:
                print("Invalid token")
            ```
        """
        try:
            # Verify and decode token
            payload = verify_token(token)

            # Create user response from token payload
            user_response = UserResponse(
                # This is now the DB uid from connect service
                uid=payload.get("uid", ""),
                email=payload.get("email", ""),
                name=payload.get("name"),
                first_name=payload.get("first_name"),
                last_name=payload.get("last_name"),
                roll_no=payload.get("roll_no"),
                is_authenticated=True
            )

            log_with_context(
                self.logger,
                "info",
                "Token verified successfully",
                user_uid=payload.get("uid"),
                user_email=payload.get("email"),
                component="auth_service"
            )

            return user_response

        except AuthenticationError:
            log_with_context(
                self.logger,
                "warning",
                "Token verification failed",
                component="auth_service"
            )
            raise
        except Exception as e:
            log_with_context(
                self.logger,
                "error",
                "Token verification error",
                error=str(e),
                component="auth_service"
            )
            raise AuthenticationError(
                "Token verification failed",
                details={"error": str(e)}
            ) from e

    def get_cas_logout_url(self, redirect_url: Optional[str] = None) -> str:
        """
        Get the CAS logout URL.

        This method generates the URL for CAS logout, optionally including
        a redirect URL for after logout completion.

        Args:
            redirect_url (Optional[str]): URL to redirect after logout

        Returns:
            str: CAS logout URL

        Example:
            ```python
            auth_service = AuthService()
            logout_url = auth_service.get_cas_logout_url("/login")
            # Redirect user to logout_url
            ```
        """
        try:
            if not self.cas_client:
                raise CASError(
                    "CAS client not properly initialized",
                    details={"error": "CAS library not available"}
                )

            logout_url = self.cas_client.get_logout_url(redirect_url)

            log_with_context(
                self.logger,
                "info",
                "Generated CAS logout URL",
                logout_url=logout_url,
                redirect_url=redirect_url,
                component="auth_service"
            )

            return logout_url

        except Exception as e:
            log_with_context(
                self.logger,
                "error",
                "Failed to generate CAS logout URL",
                error=str(e),
                redirect_url=redirect_url,
                component="auth_service"
            )
            raise CASError(
                "Failed to generate logout URL",
                details={"error": str(e)}
            ) from e

    def is_token_valid(self, token: str) -> bool:
        """
        Check if a JWT token is valid.

        This method performs a simple validation check on a JWT token
        without raising exceptions.

        Args:
            token (str): JWT token to validate

        Returns:
            bool: True if token is valid, False otherwise

        Example:
            ```python
            auth_service = AuthService()
            if auth_service.is_token_valid(user_token):
                # Token is valid, proceed
                pass
            else:
                # Token is invalid, redirect to login
                pass
            ```
        """
        try:
            verify_token(token)
            return True
        except AuthenticationError:
            return False
        except Exception:  # pylint: disable=broad-except
            return False
