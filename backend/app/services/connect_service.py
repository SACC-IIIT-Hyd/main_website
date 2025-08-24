"""
Service layer for Connect page functionality.

This module provides business logic for managing alumni communities,
user profiles, and identifiers with proper security and validation using PostgreSQL.

@module: app.services.connect_service
@author: unignoramus11
@version: 2.0.0
@since: 2025

Example:
    ```python
    from app.services.connect_service import ConnectService

    service = ConnectService()
    communities = await service.get_communities()
    ```
"""

import hashlib
from datetime import datetime
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select, and_, or_
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import selectinload, joinedload

from app.core.config import get_settings
from app.core.database import get_db_session
from app.core.logging import get_logger
from app.core.exceptions import ValidationError, NotFoundError
from app.models.connect import (
    # ORM Models
    CommunityORM, UserProfileORM, CommunityAdminORM, IdentifierORM,
    # Pydantic Models
    CommunityCreate, CommunityUpdate, CommunityResponse,
    UserProfileCreate, UserProfileResponse,
    CommunityAdmin, CommunityAdminCreate,  IdentifierCreate,
    IdentifierVerificationRequest, IdentifierVerificationResponse
)

logger = get_logger(__name__)


class ConnectService:
    """
    Service class for Connect page functionality.

    This class handles all business logic for community management and
    user profiles with proper security measures using PostgreSQL.
    """

    def __init__(self):
        """Initialize the ConnectService."""
        self.settings = get_settings()
        logger.debug(
            "ConnectService initialized",
            extra={"component": "connect_service"}
        )

    def _hash_identifier(self, identifier: str) -> str:
        """
        Hash an identifier using the application's hash key.

        Args:
            identifier: The identifier to hash

        Returns:
            str: Hashed identifier
        """
        secret = self.settings.hash_key.encode('utf-8')
        identifier_bytes = identifier.lower().strip().encode('utf-8')
        combined = secret + identifier_bytes + secret
        return hashlib.sha256(combined).hexdigest()

    def _is_super_admin(self, email: str) -> bool:
        """
        Check if user is a super admin.

        Args:
            email: User's email address

        Returns:
            bool: True if user is super admin
        """
        return email in self.settings.get_super_admin_emails_list()

    async def _is_community_admin(self, email: str, community_id: Optional[int] = None) -> bool:
        """
        Check if user is a community admin.
        Super admins are considered admins for all communities.

        Args:
            email: User's email address
            community_id: Optional specific community ID to check

        Returns:
            bool: True if user is community admin
        """
        # Super admins are admins for all communities
        if self._is_super_admin(email):
            return True
            
        async with get_db_session() as session:
            query = select(CommunityAdminORM).where(
                CommunityAdminORM.admin_email == email)

            if community_id:
                query = query.where(
                    CommunityAdminORM.community_id == community_id)

            result = await session.execute(query)
            return result.scalars().first() is not None

    async def _get_user_admin_communities(self, email: str) -> List[int]:
        """
        Get list of community IDs that user is admin for.
        For super admins, this returns ALL community IDs.

        Args:
            email: User's email address

        Returns:
            List[int]: List of community IDs
        """
        # If user is super admin, return all community IDs
        if self._is_super_admin(email):
            async with get_db_session() as session:
                query = select(CommunityORM.id)
                result = await session.execute(query)
                return [row[0] for row in result.fetchall()]
        
        # Otherwise, return only communities where user is an admin
        async with get_db_session() as session:
            query = select(CommunityAdminORM.community_id).where(
                CommunityAdminORM.admin_email == email
            )
            result = await session.execute(query)
            return [row[0] for row in result.fetchall()]

    async def _get_or_create_user_profile(
        self,
        uid: str,
        email: str,
        name: str
    ) -> Tuple[UserProfileORM, bool]:
        """
        Get existing user profile or create a new one.

        Args:
            uid: User's unique identifier
            email: User's institutional email
            name: User's full name

        Returns:
            Tuple[UserProfileORM, bool]: (user_profile, created)
                where created is True if a new profile was created
        """
        async with get_db_session() as session:
            query = select(UserProfileORM).where(UserProfileORM.uid == uid)
            result = await session.execute(query)
            profile = result.scalars().first()

            if profile:
                return profile, False

            # Create new profile
            profile = UserProfileORM(
                uid=uid,
                email=email,
                name=name
            )

            # By default, add the email as an identifier,
            # with label as "CAS email"
            identifier_hash = self._hash_identifier(email)
            identifier = IdentifierORM(
                user_id=profile.id,
                label="CAS email",
                identifier_hash=identifier_hash
            )

            profile.identifiers.append(identifier)

            session.add(profile)
            await session.commit()
            await session.refresh(profile)

            logger.info(
                "Created new user profile",
                extra={
                    "user_uid": uid,
                    "email": email,
                    "component": "connect_service"
                }
            )

            return profile, True

    async def update_user_profile(
        self,
        uid: str,
        email: str,
        name: str,
        profile_data: UserProfileCreate
    ) -> UserProfileResponse:
        """
        Update user profile.

        Args:
            uid: User's unique identifier
            email: User's institutional email
            name: User's full name
            profile_data: Identifiers to store

        Returns:
            UserProfileResponse: Created/updated profile
        """
        logger.info(
            "Updating user profile with identifiers",
            extra={
                "user_uid": uid,
                "email": email,
                "component": "connect_service"
            }
        )

        try:
            async with get_db_session() as session:
                # Get or create profile
                profile, _created = await self._get_or_create_user_profile(uid, email, name)

                # Create identifiers for the user
                identifiers_data = []
                for identifier_create in profile_data.identifiers:
                    identifier_hash = self._hash_identifier(
                        identifier_create.value)

                    # Create new identifier
                    identifier = IdentifierORM(
                        user_id=profile.id,
                        label=identifier_create.label,
                        identifier_hash=identifier_hash
                    )

                    session.add(identifier)
                    identifiers_data.append({
                        "label": identifier_create.label,
                        "created_at": datetime.utcnow()
                    })

                await session.commit()

                # Get all identifiers for the user
                query = select(IdentifierORM).where(
                    IdentifierORM.user_id == profile.id)
                result = await session.execute(query)
                identifiers = result.scalars().all()

                # Build response
                return UserProfileResponse(
                    id=profile.id,
                    uid=profile.uid,
                    email=profile.email,
                    name=profile.name,
                    created_at=profile.created_at,
                    updated_at=profile.updated_at,
                    identifiers=identifiers_data,
                    identifiers_count=len(identifiers)
                )

        except SQLAlchemyError as e:
            logger.error(
                "Database error creating user profile",
                extra={
                    "user_uid": uid,
                    "email": email,
                    "error": str(e),
                    "component": "connect_service"
                }
            )
            raise ValidationError(f"Failed to create user profile: {str(e)}")
        except Exception as e:
            logger.error(
                "Unexpected error creating user profile",
                extra={
                    "user_uid": uid,
                    "email": email,
                    "error": str(e),
                    "component": "connect_service"
                }
            )
            raise ValidationError(f"Failed to create user profile: {str(e)}")

    async def get_user_profile(self, uid: str, current_user_uid: Optional[str] = None) -> UserProfileResponse:
        """
        Get user profile by UID, including identifiers if it's the current user.

        Args:
            uid: User's unique identifier
            current_user_uid: UID of the requesting user (for permission checks)

        Returns:
            UserProfileResponse: User profile data
        """
        logger.info(
            "Getting user profile",
            extra={
                "user_uid": uid,
                "component": "connect_service"
            }
        )

        async with get_db_session() as session:
            # Get profile with identifiers
            query = select(UserProfileORM).where(UserProfileORM.uid == uid).options(
                selectinload(UserProfileORM.identifiers)
            )
            result = await session.execute(query)
            profile = result.scalars().first()

            if not profile:
                logger.warning(
                    "User profile not found",
                    extra={
                        "user_uid": uid,
                        "component": "connect_service"
                    }
                )
                raise NotFoundError(f"User profile not found for UID: {uid}")

            # Build identifier response - only include details for current user
            identifiers_data = None
            identifiers_count = len(profile.identifiers)

            if current_user_uid == uid:  # Only show identifiers to the profile owner
                identifiers_data = [
                    {
                        "id": identifier.id,
                        "label": identifier.label,
                        "created_at": identifier.created_at
                    } for identifier in profile.identifiers
                ]

            return UserProfileResponse(
                id=profile.id,
                uid=profile.uid,
                email=profile.email,
                name=profile.name,
                created_at=profile.created_at,
                updated_at=profile.updated_at,
                identifiers=identifiers_data,
                identifiers_count=identifiers_count
            )

    async def add_identifier(
        self,
        uid: str,
        identifier_data: IdentifierCreate
    ) -> UserProfileResponse:
        """
        Add a new identifier to user profile.

        Args:
            uid: User's unique identifier
            identifier_data: Identifier to add

        Returns:
            UserProfileResponse: Updated profile
        """
        logger.info(
            "Adding identifier to user profile",
            extra={
                "user_uid": uid,
                "label": identifier_data.label,
                "component": "connect_service"
            }
        )

        async with get_db_session() as session:
            # Get profile
            query = select(UserProfileORM).where(UserProfileORM.uid == uid)
            result = await session.execute(query)
            profile = result.scalars().first()

            if not profile:
                logger.warning(
                    "User profile not found",
                    extra={
                        "user_uid": uid,
                        "component": "connect_service"
                    }
                )
                raise NotFoundError(f"User profile not found for UID: {uid}")

            # Hash the identifier value
            identifier_hash = self._hash_identifier(identifier_data.value)

            # Create new identifier
            identifier = IdentifierORM(
                user_id=profile.id,
                label=identifier_data.label,
                identifier_hash=identifier_hash
            )

            session.add(identifier)
            await session.commit()

            # Get all identifiers for the user
            query = select(IdentifierORM).where(
                IdentifierORM.user_id == profile.id)
            result = await session.execute(query)
            identifiers = result.scalars().all()

            # Build response
            identifiers_data = [
                {
                    "id": i.id,
                    "label": i.label,
                    "created_at": i.created_at
                } for i in identifiers
            ]

            return UserProfileResponse(
                id=profile.id,
                uid=profile.uid,
                email=profile.email,
                name=profile.name,
                created_at=profile.created_at,
                updated_at=profile.updated_at,
                identifiers=identifiers_data,
                identifiers_count=len(identifiers)
            )

    async def delete_identifier(
        self,
        uid: str,
        identifier_id: int
    ) -> UserProfileResponse:
        """
        Delete an identifier from user profile.

        Args:
            uid: User's unique identifier
            identifier_id: ID of identifier to delete

        Returns:
            UserProfileResponse: Updated profile
        """
        logger.info(
            "Deleting identifier from user profile",
            extra={
                "user_uid": uid,
                "identifier_id": identifier_id,
                "component": "connect_service"
            }
        )

        async with get_db_session() as session:
            # Get profile
            query = select(UserProfileORM).where(UserProfileORM.uid == uid)
            result = await session.execute(query)
            profile = result.scalars().first()

            if not profile:
                logger.warning(
                    "User profile not found",
                    extra={
                        "user_uid": uid,
                        "component": "connect_service"
                    }
                )
                raise NotFoundError(f"User profile not found for UID: {uid}")

            # Check if identifier exists and belongs to this user
            query = select(IdentifierORM).where(
                and_(
                    IdentifierORM.id == identifier_id,
                    IdentifierORM.user_id == profile.id
                )
            )
            result = await session.execute(query)
            identifier = result.scalars().first()

            if not identifier:
                logger.warning(
                    "Identifier not found or does not belong to user",
                    extra={
                        "user_uid": uid,
                        "identifier_id": identifier_id,
                        "component": "connect_service"
                    }
                )
                raise NotFoundError(
                    f"Identifier not found or does not belong to user")

            # Delete the identifier
            await session.delete(identifier)
            await session.commit()

            # Get remaining identifiers
            query = select(IdentifierORM).where(
                IdentifierORM.user_id == profile.id)
            result = await session.execute(query)
            identifiers = result.scalars().all()

            # Build response
            identifiers_data = [
                {
                    "id": i.id,
                    "label": i.label,
                    "created_at": i.created_at
                } for i in identifiers
            ]

            return UserProfileResponse(
                id=profile.id,
                uid=profile.uid,
                email=profile.email,
                name=profile.name,
                created_at=profile.created_at,
                updated_at=profile.updated_at,
                identifiers=identifiers_data,
                identifiers_count=len(identifiers)
            )

    async def verify_identifier(
        self,
        verification_request: IdentifierVerificationRequest,
        admin_email: str
    ) -> IdentifierVerificationResponse:
        """
        Verify an identifier for community admins.

        Args:
            verification_request: Identifier to verify
            admin_email: Email of admin making the request

        Returns:
            IdentifierVerificationResponse: Verification result
        """
        logger.info(
            "Verifying identifier",
            extra={
                "admin_email": admin_email,
                "component": "connect_service"
            }
        )

        # Check admin permissions
        is_super_admin = self._is_super_admin(admin_email)
        is_community_admin = await self._is_community_admin(admin_email)

        if not (is_super_admin or is_community_admin):
            logger.warning(
                "Unauthorized identifier verification attempt",
                extra={
                    "admin_email": admin_email,
                    "component": "connect_service"
                }
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can verify identifiers"
            )

        # Hash the provided identifier
        identifier_hash = self._hash_identifier(
            verification_request.identifier)

        async with get_db_session() as session:
            # Find matching identifier
            query = select(IdentifierORM).where(
                IdentifierORM.identifier_hash == identifier_hash
            ).options(
                joinedload(IdentifierORM.user_profile)
            )

            result = await session.execute(query)
            identifier = result.scalars().first()

            if not identifier:
                return IdentifierVerificationResponse(
                    found=False
                )

            # Get user information
            user = identifier.user_profile

            return IdentifierVerificationResponse(
                found=True
            )

    async def create_community(
        self,
        community_data: CommunityCreate,
        creator_email: str
    ) -> CommunityResponse:
        """
        Create a new community.

        Args:
            community_data: Community information
            creator_email: Email of the creator (super admin)

        Returns:
            CommunityResponse: Created community
        """
        logger.info(
            "Creating new community",
            extra={
                "creator_email": creator_email,
                "component": "connect_service"
            }
        )

        # Check if user is super admin
        if not self._is_super_admin(creator_email):
            logger.warning(
                "Unauthorized community creation attempt",
                extra={
                    "creator_email": creator_email,
                    "component": "connect_service"
                }
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only super admins can create communities"
            )

        async with get_db_session() as session:
            # Create community
            community = CommunityORM(
                name=community_data.name,
                description=community_data.description,
                platform_type=community_data.platform_type,
                tags=community_data.tags,
                member_count=community_data.member_count,
                invite_link=community_data.invite_link,
                identifier_format_instruction=community_data.identifier_format_instruction
            )

            session.add(community)
            await session.commit()
            await session.refresh(community)

            logger.info(
                "Community created successfully",
                extra={
                    "community_id": community.id,
                    "creator_email": creator_email,
                    "component": "connect_service"
                }
            )

            return CommunityResponse(
                id=community.id,
                name=community.name,
                description=community.description,
                platform_type=community.platform_type,
                tags=community.tags,
                member_count=community.member_count,
                invite_link=community.invite_link,
                identifier_format_instruction=community.identifier_format_instruction,
                created_at=community.created_at,
                updated_at=community.updated_at,
                user_is_admin=False
            )

    async def update_community(
        self,
        community_id: int,
        community_data: CommunityUpdate,
        user_email: str
    ) -> CommunityResponse:
        """
        Update an existing community.

        Args:
            community_id: ID of community to update
            community_data: Updated community information
            user_email: Email of the updater (admin)

        Returns:
            CommunityResponse: Updated community
        """
        logger.info(
            "Updating community",
            extra={
                "community_id": community_id,
                "user_email": user_email,
                "component": "connect_service"
            }
        )

        # Check if user is super admin or community admin
        is_super_admin = self._is_super_admin(user_email)
        is_admin = await self._is_community_admin(user_email, community_id)

        if not (is_super_admin or is_admin):
            logger.warning(
                "Unauthorized community update attempt",
                extra={
                    "community_id": community_id,
                    "user_email": user_email,
                    "component": "connect_service"
                }
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can update communities"
            )

        async with get_db_session() as session:
            # Get community
            query = select(CommunityORM).where(CommunityORM.id == community_id)
            result = await session.execute(query)
            community = result.scalars().first()

            if not community:
                logger.warning(
                    "Community not found",
                    extra={
                        "community_id": community_id,
                        "component": "connect_service"
                    }
                )
                raise NotFoundError(
                    f"Community not found with ID: {community_id}")

            # Update fields
            if community_data.name is not None:
                community.name = community_data.name
            if community_data.description is not None:
                community.description = community_data.description
            if community_data.platform_type is not None:
                community.platform_type = community_data.platform_type
            if community_data.tags is not None:
                community.tags = community_data.tags
            if community_data.member_count is not None:
                community.member_count = community_data.member_count
            if community_data.invite_link is not None:
                community.invite_link = community_data.invite_link
            if community_data.identifier_format_instruction is not None:
                community.identifier_format_instruction = community_data.identifier_format_instruction

            await session.commit()
            await session.refresh(community)

            logger.info(
                "Community updated successfully",
                extra={
                    "community_id": community.id,
                    "user_email": user_email,
                    "component": "connect_service"
                }
            )

            return CommunityResponse(
                id=community.id,
                name=community.name,
                description=community.description,
                platform_type=community.platform_type,
                tags=community.tags,
                member_count=community.member_count,
                invite_link=community.invite_link,
                identifier_format_instruction=community.identifier_format_instruction,
                created_at=community.created_at,
                updated_at=community.updated_at,
                user_is_admin=is_admin
            )

    async def get_community(
        self,
        community_id: int,
        user_email: Optional[str] = None
    ) -> CommunityResponse:
        """
        Get a specific community by ID.

        Args:
            community_id: ID of community to retrieve
            user_email: Email of the requester (for admin status)

        Returns:
            CommunityResponse: Community details
        """
        logger.info(
            "Getting community details",
            extra={
                "community_id": community_id,
                "component": "connect_service"
            }
        )

        async with get_db_session() as session:
            # Get community
            query = select(CommunityORM).where(CommunityORM.id == community_id)
            result = await session.execute(query)
            community = result.scalars().first()

            if not community:
                logger.warning(
                    "Community not found",
                    extra={
                        "community_id": community_id,
                        "component": "connect_service"
                    }
                )
                raise NotFoundError(
                    f"Community not found with ID: {community_id}")

            # Check if user is admin
            user_is_admin = False
            if user_email:
                user_is_admin = await self._is_community_admin(user_email, community_id)

            return CommunityResponse(
                id=community.id,
                name=community.name,
                description=community.description,
                platform_type=community.platform_type,
                tags=community.tags,
                member_count=community.member_count,
                invite_link=community.invite_link,
                identifier_format_instruction=community.identifier_format_instruction,
                created_at=community.created_at,
                updated_at=community.updated_at,
                user_is_admin=user_is_admin
            )

    async def get_communities(
        self,
        user_email: Optional[str] = None,
        search: Optional[str] = None,
        platform_filter: Optional[str] = None,
        tag_filter: Optional[str] = None,
        sort_by: str = "name"
    ) -> List[CommunityResponse]:
        """
        Get list of communities with filters and user context.

        Args:
            user_email: Current user's email for admin context
            search: Search term for name/description
            platform_filter: Filter by platform type
            tag_filter: Filter by tag
            sort_by: Sort field (name, member_count, created_at)

        Returns:
            List[CommunityResponse]: Filtered and sorted communities
        """
        logger.info(
            "Getting communities list",
            extra={
                "filters": {
                    "search": search,
                    "platform": platform_filter,
                    "tag": tag_filter,
                    "sort_by": sort_by
                },
                "component": "connect_service"
            }
        )

        # Get admin status for communities
        user_admin_communities = []
        is_super_admin = False

        if user_email:
            user_admin_communities = await self._get_user_admin_communities(user_email)

        async with get_db_session() as session:
            # Build query with filters
            query = select(CommunityORM)

            # Apply search filter
            if search:
                search_term = f"%{search}%"
                query = query.where(
                    or_(
                        CommunityORM.name.ilike(search_term),
                        CommunityORM.description.ilike(search_term)
                    )
                )

            # Apply platform filter
            if platform_filter:
                query = query.where(
                    CommunityORM.platform_type == platform_filter)

            # Apply tag filter (more complex due to JSON array)
            if tag_filter:
                query = query.where(
                    CommunityORM.tags.contains([tag_filter])
                )

            # Apply sorting
            if sort_by == "member_count":
                query = query.order_by(CommunityORM.member_count.desc())
            elif sort_by == "created_at":
                query = query.order_by(CommunityORM.created_at.desc())
            else:  # Default to name
                query = query.order_by(CommunityORM.name)

            # Execute query
            result = await session.execute(query)
            communities = result.scalars().all()

            # Build response
            community_responses = []
            for community in communities:
                # Check if user is admin for this community
                user_is_admin = community.id in user_admin_communities

                community_responses.append(
                    CommunityResponse(
                        id=community.id,
                        name=community.name,
                        description=community.description,
                        platform_type=community.platform_type,
                        tags=community.tags,
                        member_count=community.member_count,
                        invite_link=community.invite_link,
                        identifier_format_instruction=community.identifier_format_instruction,
                        created_at=community.created_at,
                        updated_at=community.updated_at,
                        user_is_admin=user_is_admin
                    )
                )

            return community_responses

    async def delete_community(
        self,
        community_id: int,
        deleter_email: str
    ) -> None:
        """
        Delete a community and all associated data.

        Args:
            community_id: ID of community to delete
            deleter_email: Email of the super admin making the deletion

        Raises:
            HTTPException: If user is not super admin or community not found
        """
        logger.info(
            "Deleting community",
            extra={
                "community_id": community_id,
                "deleter_email": deleter_email,
                "component": "connect_service"
            }
        )

        # Check if user is super admin
        if not self._is_super_admin(deleter_email):
            logger.warning(
                "Unauthorized community deletion attempt",
                extra={
                    "community_id": community_id,
                    "deleter_email": deleter_email,
                    "component": "connect_service"
                }
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only super admins can delete communities"
            )

        async with get_db_session() as session:
            try:
                # Check if community exists
                query = select(CommunityORM).where(CommunityORM.id == community_id)
                result = await session.execute(query)
                community = result.scalars().first()

                if not community:
                    logger.warning(
                        "Community not found for deletion",
                        extra={
                            "community_id": community_id,
                            "deleter_email": deleter_email,
                            "component": "connect_service"
                        }
                    )
                    raise NotFoundError(f"Community not found with ID: {community_id}")

                # Delete associated admins first (cascade should handle this, but let's be explicit)
                admin_query = select(CommunityAdminORM).where(
                    CommunityAdminORM.community_id == community_id
                )
                admin_result = await session.execute(admin_query)
                admins = admin_result.scalars().all()
                
                for admin in admins:
                    await session.delete(admin)

                # Delete the community
                await session.delete(community)
                await session.commit()

                logger.info(
                    "Community deleted successfully",
                    extra={
                        "community_id": community_id,
                        "community_name": community.name,
                        "deleted_admins_count": len(admins),
                        "deleter_email": deleter_email,
                        "component": "connect_service"
                    }
                )

            except SQLAlchemyError as e:
                await session.rollback()
                logger.error(
                    "Database error during community deletion",
                    extra={
                        "community_id": community_id,
                        "deleter_email": deleter_email,
                        "error": str(e),
                        "component": "connect_service"
                    }
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database error occurred during community deletion"
                )

    async def add_community_admin(
        self,
        admin_data: CommunityAdminCreate,
        assigner_email: str
    ) -> CommunityAdmin:
        """
        Add a new admin to a community.

        Args:
            admin_data: Admin information
            assigner_email: Email of the super admin making the assignment

        Returns:
            CommunityAdmin: Created admin
        """
        logger.info(
            "Adding community admin",
            extra={
                "community_id": admin_data.community_id,
                "admin_email": admin_data.admin_email,
                "assigner_email": assigner_email,
                "component": "connect_service"
            }
        )

        # Check if assigner is super admin
        if not self._is_super_admin(assigner_email):
            logger.warning(
                "Unauthorized admin assignment attempt",
                extra={
                    "assigner_email": assigner_email,
                    "component": "connect_service"
                }
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only super admins can assign community admins"
            )

        async with get_db_session() as session:
            # Check if community exists
            query = select(CommunityORM).where(
                CommunityORM.id == admin_data.community_id)
            result = await session.execute(query)
            community = result.scalars().first()

            if not community:
                logger.warning(
                    "Community not found",
                    extra={
                        "community_id": admin_data.community_id,
                        "component": "connect_service"
                    }
                )
                raise NotFoundError(
                    f"Community not found with ID: {admin_data.community_id}")

            # Check if admin already exists
            query = select(CommunityAdminORM).where(
                and_(
                    CommunityAdminORM.community_id == admin_data.community_id,
                    CommunityAdminORM.admin_email == admin_data.admin_email
                )
            )
            result = await session.execute(query)
            existing_admin = result.scalars().first()

            if existing_admin:
                logger.warning(
                    "Admin already exists for this community",
                    extra={
                        "community_id": admin_data.community_id,
                        "admin_email": admin_data.admin_email,
                        "component": "connect_service"
                    }
                )
                raise ValidationError(
                    "This user is already an admin for this community")

            # Create new admin
            admin = CommunityAdminORM(
                community_id=admin_data.community_id,
                admin_email=admin_data.admin_email,
                admin_name=admin_data.admin_name,
                assigned_by=assigner_email
            )

            session.add(admin)
            await session.commit()
            await session.refresh(admin)

            logger.info(
                "Community admin added successfully",
                extra={
                    "admin_id": admin.id,
                    "community_id": admin.community_id,
                    "admin_email": admin.admin_email,
                    "component": "connect_service"
                }
            )

            return CommunityAdmin(
                id=admin.id,
                community_id=admin.community_id,
                admin_email=admin.admin_email,
                admin_name=admin.admin_name,
                assigned_by=admin.assigned_by,
                created_at=admin.created_at
            )

    async def remove_community_admin(
        self,
        admin_id: int,
        remover_email: str
    ) -> None:
        """
        Remove an admin from a community.

        Args:
            admin_id: ID of admin to remove
            remover_email: Email of the super admin removing the assignment

        Returns:
            None
        """
        logger.info(
            "Removing community admin",
            extra={
                "admin_id": admin_id,
                "remover_email": remover_email,
                "component": "connect_service"
            }
        )

        # Check if remover is super admin
        if not self._is_super_admin(remover_email):
            logger.warning(
                "Unauthorized admin removal attempt",
                extra={
                    "remover_email": remover_email,
                    "component": "connect_service"
                }
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only super admins can remove community admins"
            )

        async with get_db_session() as session:
            # Get admin
            query = select(CommunityAdminORM).where(
                CommunityAdminORM.id == admin_id)
            result = await session.execute(query)
            admin = result.scalars().first()

            if not admin:
                logger.warning(
                    "Admin not found",
                    extra={
                        "admin_id": admin_id,
                        "component": "connect_service"
                    }
                )
                raise NotFoundError(f"Admin not found with ID: {admin_id}")

            # Delete admin
            await session.delete(admin)
            await session.commit()

            logger.info(
                "Community admin removed successfully",
                extra={
                    "admin_id": admin_id,
                    "community_id": admin.community_id,
                    "admin_email": admin.admin_email,
                    "component": "connect_service"
                }
            )

    async def get_community_admins(
        self,
        community_id: int,
        user_email: str
    ) -> List[CommunityAdmin]:
        """
        Get list of admins for a community.

        Args:
            community_id: ID of community
            user_email: Email of the requester (for permission check)

        Returns:
            List[CommunityAdmin]: List of community admins
        """
        logger.info(
            "Getting community admins",
            extra={
                "community_id": community_id,
                "component": "connect_service"
            }
        )

        # Check if user is super admin or community admin
        is_super_admin = self._is_super_admin(user_email)
        is_admin = await self._is_community_admin(user_email, community_id)

        if not (is_super_admin or is_admin):
            logger.warning(
                "Unauthorized attempt to view community admins",
                extra={
                    "community_id": community_id,
                    "user_email": user_email,
                    "component": "connect_service"
                }
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can view community admins"
            )

        async with get_db_session() as session:
            # Get admins
            query = select(CommunityAdminORM).where(
                CommunityAdminORM.community_id == community_id
            ).order_by(CommunityAdminORM.created_at)

            result = await session.execute(query)
            admins = result.scalars().all()

            return [
                CommunityAdmin(
                    id=admin.id,
                    community_id=admin.community_id,
                    admin_email=admin.admin_email,
                    admin_name=admin.admin_name,
                    assigned_by=admin.assigned_by,
                    created_at=admin.created_at
                ) for admin in admins
            ]
