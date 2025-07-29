"""
Service layer for Connect page functionality.

This module provides business logic for managing alumni communities,
user profiles, and join requests with proper security and validation using PostgreSQL.

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
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy import select, and_, or_, func, update, delete
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.database import get_db_session
from app.core.logging import get_logger
from app.core.exceptions import ValidationError, NotFoundError
from app.models.connect import (
    # ORM Models
    CommunityORM, UserProfileORM, JoinRequestORM, CommunityAdminORM,
    # Pydantic Models
    Community, CommunityCreate, CommunityUpdate, CommunityResponse,
    UserProfile, UserProfileCreate, UserProfileResponse,
    JoinRequest, JoinRequestCreate, JoinRequestResponse,
    CommunityAdmin, CommunityAdminCreate,
    IdentifierVerificationRequest, IdentifierVerificationResponse
)

logger = get_logger(__name__)


class ConnectService:
    """
    Service class for Connect page functionality.

    This class handles all business logic for community management,
    user profiles, and join requests with proper security measures using PostgreSQL.
    """

    def __init__(self):
        """Initialize the ConnectService."""
        self.settings = get_settings()

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

        Args:
            email: User's email address
            community_id: Optional specific community ID to check

        Returns:
            bool: True if user is community admin
        """
        async with get_db_session() as session:
            query = select(CommunityAdminORM).where(
                CommunityAdminORM.admin_email == email)

            if community_id:
                query = query.where(
                    CommunityAdminORM.community_id == community_id)

            result = await session.execute(query)
            return result.first() is not None

    async def _get_user_admin_communities(self, email: str) -> List[int]:
        """
        Get list of community IDs that user is admin for.

        Args:
            email: User's email address

        Returns:
            List[int]: List of community IDs
        """
        async with get_db_session() as session:
            query = select(CommunityAdminORM.community_id).where(
                CommunityAdminORM.admin_email == email
            )
            result = await session.execute(query)
            return [row[0] for row in result.fetchall()]

    async def create_user_profile(
        self,
        uid: str,
        email: str,
        name: str,
        profile_data: UserProfileCreate
    ) -> UserProfileResponse:
        """
        Create or update user profile with personal information.

        Args:
            uid: User's unique identifier
            email: User's institutional email
            name: User's full name
            profile_data: Personal information to store

        Returns:
            UserProfileResponse: Created/updated profile
        """
        logger.info(
            "Creating user profile",
            extra={
                "user_uid": uid,
                "email_id": email,
                "component": "connect_service"
            }
        )

        try:
            # Hash personal information
            personal_email_hash = self._hash_identifier(
                profile_data.personal_email)
            phone_hash = self._hash_identifier(profile_data.phone_number)

            async with get_db_session() as session:
                # Check if profile exists
                existing_profile = await session.execute(
                    select(UserProfileORM).where(UserProfileORM.uid == uid)
                )
                existing_profile = existing_profile.scalar_one_or_none()

                if existing_profile:
                    # Update existing profile
                    existing_profile.personal_email_hash = personal_email_hash
                    existing_profile.phone_hash = phone_hash
                    existing_profile.updated_at = datetime.utcnow()

                    await session.commit()
                    await session.refresh(existing_profile)
                    profile = existing_profile

                    logger.info(
                        "User profile updated",
                        extra={
                            "user_uid": uid,
                            "email_id": email,
                            "component": "connect_service"
                        }
                    )
                else:
                    # Create new profile
                    profile = UserProfileORM(
                        uid=uid,
                        email=email,
                        name=name,
                        personal_email_hash=personal_email_hash,
                        phone_hash=phone_hash,
                        custom_identifiers=[]
                    )

                    session.add(profile)
                    await session.commit()
                    await session.refresh(profile)

                    logger.info(
                        "User profile created",
                        extra={
                            "user_uid": uid,
                            "email_id": email,
                            "component": "connect_service"
                        }
                    )

            return UserProfileResponse(
                id=profile.id,
                uid=profile.uid,
                email=profile.email,
                name=profile.name,
                has_personal_info=True,
                custom_identifiers_count=len(profile.custom_identifiers or []),
                created_at=profile.created_at,
                updated_at=profile.updated_at
            )

        except Exception as e:
            logger.error(
                "Failed to create user profile",
                extra={
                    "user_uid": uid,
                    "email_id": email,
                    "error": str(e),
                    "component": "connect_service"
                }
            )
            raise ValidationError(f"Failed to create user profile: {str(e)}")

    async def get_user_profile(self, uid: str) -> Optional[UserProfileResponse]:
        """
        Get user profile by UID.

        Args:
            uid: User's unique identifier

        Returns:
            Optional[UserProfileResponse]: User profile if exists
        """
        async with get_db_session() as session:
            profile = await session.execute(
                select(UserProfileORM).where(UserProfileORM.uid == uid)
            )
            profile = profile.scalar_one_or_none()

            if not profile:
                return None

            return UserProfileResponse(
                id=profile.id,
                uid=profile.uid,
                email=profile.email,
                name=profile.name,
                has_personal_info=bool(
                    profile.personal_email_hash and profile.phone_hash),
                custom_identifiers_count=len(profile.custom_identifiers or []),
                created_at=profile.created_at,
                updated_at=profile.updated_at
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
            "Fetching communities",
            extra={
                "user_email": user_email,
                "search": search,
                "platform_filter": platform_filter,
                "tag_filter": tag_filter,
                "sort_by": sort_by,
                "component": "connect_service"
            }
        )

        async with get_db_session() as session:
            query = select(CommunityORM)

            # Filter inactive communities (unless user is admin)
            user_is_super_admin = self._is_super_admin(
                user_email) if user_email else False
            user_is_community_admin = await self._is_community_admin(user_email) if user_email else False

            if not user_is_super_admin and not user_is_community_admin:
                query = query.where(CommunityORM.is_active == True)

            # Apply search filter
            if search:
                search_term = f"%{search.lower()}%"
                query = query.where(
                    or_(
                        func.lower(CommunityORM.name).like(search_term),
                        func.lower(CommunityORM.description).like(search_term)
                    )
                )

            # Apply platform filter
            if platform_filter:
                query = query.where(
                    CommunityORM.platform_type == platform_filter)

            # Apply tag filter (PostgreSQL JSON contains operation)
            if tag_filter:
                query = query.where(CommunityORM.tags.op('?')(tag_filter))

            # Apply sorting
            if sort_by == "member_count":
                query = query.order_by(CommunityORM.member_count.desc())
            elif sort_by == "created_at":
                query = query.order_by(CommunityORM.created_at.desc())
            else:  # default to name
                query = query.order_by(CommunityORM.name)

            result = await session.execute(query)
            communities = result.scalars().all()

            # Get user profile if email provided
            user_profile = None
            if user_email:
                user_query = select(UserProfileORM).where(
                    UserProfileORM.email == user_email)
                user_result = await session.execute(user_query)
                user_profile = user_result.scalar_one_or_none()

            # Convert to response format
            responses = []
            for community in communities:
                # Check if user is admin for this community
                user_is_admin = False
                if user_email:
                    user_is_admin = (user_is_super_admin or
                                     await self._is_community_admin(user_email, community.id))

                # Check if user has pending join request
                join_request_exists = False
                if user_profile:
                    join_query = select(JoinRequestORM).where(
                        and_(
                            JoinRequestORM.community_id == community.id,
                            JoinRequestORM.user_uid == user_profile.uid
                        )
                    )
                    join_result = await session.execute(join_query)
                    join_request_exists = join_result.scalar_one_or_none() is not None

                responses.append(CommunityResponse(
                    id=community.id,
                    name=community.name,
                    description=community.description,
                    icon=community.icon,
                    platform_type=community.platform_type,
                    tags=community.tags or [],
                    member_count=community.member_count,
                    invite_link=community.invite_link if user_is_admin else None,
                    identifier_format_instruction=community.identifier_format_instruction,
                    is_active=community.is_active,
                    created_at=community.created_at,
                    updated_at=community.updated_at,
                    user_is_admin=user_is_admin,
                    join_request_exists=join_request_exists
                ))

        return responses

    async def create_community(
        self,
        community_data: CommunityCreate,
        creator_email: str
    ) -> CommunityResponse:
        """
        Create a new community (super admin only).

        Args:
            community_data: Community creation data
            creator_email: Email of the creator

        Returns:
            CommunityResponse: Created community

        Raises:
            HTTPException: If user is not super admin
        """
        if not self._is_super_admin(creator_email):
            logger.warning(
                "Unauthorized community creation attempt",
                extra={
                    "email_id": creator_email,
                    "component": "connect_service"
                }
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only super admins can create communities"
            )

        logger.info(
            "Creating new community",
            extra={
                "community_name": community_data.name,
                "creator_email": creator_email,
                "email_id": creator_email,
                "component": "connect_service"
            }
        )

        async with get_db_session() as session:
            # Create community
            community = CommunityORM(
                name=community_data.name,
                description=community_data.description,
                icon=community_data.icon,
                platform_type=community_data.platform_type.value,
                tags=community_data.tags,
                member_count=community_data.member_count,
                invite_link=community_data.invite_link,
                identifier_format_instruction=community_data.identifier_format_instruction,
                is_active=True
            )

            session.add(community)
            await session.commit()
            await session.refresh(community)

            logger.info(
                "Community created successfully",
                extra={
                    "community_id": community.id,
                    "community_name": community.name,
                    "creator_email": creator_email,
                    "email_id": creator_email,
                    "component": "connect_service"
                }
            )

            return CommunityResponse(
                id=community.id,
                name=community.name,
                description=community.description,
                icon=community.icon,
                platform_type=community.platform_type,
                tags=community.tags or [],
                member_count=community.member_count,
                invite_link=community.invite_link,
                identifier_format_instruction=community.identifier_format_instruction,
                is_active=community.is_active,
                created_at=community.created_at,
                updated_at=community.updated_at,
                user_is_admin=True
            )

    async def update_community(
        self,
        community_id: int,
        update_data: CommunityUpdate,
        user_email: str
    ) -> CommunityResponse:
        """
        Update community information.

        Args:
            community_id: Community ID to update
            update_data: Update data
            user_email: Email of the user making the update

        Returns:
            CommunityResponse: Updated community

        Raises:
            HTTPException: If user is not authorized or community not found
        """
        async with get_db_session() as session:
            community = await session.execute(
                select(CommunityORM).where(CommunityORM.id == community_id)
            )
            community = community.scalar_one_or_none()

            if not community:
                raise NotFoundError("Community not found")

            # Check permissions
            user_is_super_admin = self._is_super_admin(user_email)
            user_is_community_admin = await self._is_community_admin(user_email, community_id)

            if not (user_is_super_admin or user_is_community_admin):
                logger.warning(
                    "Unauthorized community update attempt",
                    extra={
                        "community_id": community_id,
                        "email_id": user_email,
                        "component": "connect_service"
                    }
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to update this community"
                )

            logger.info(
                "Updating community",
                extra={
                    "community_id": community_id,
                    "email_id": user_email,
                    "component": "connect_service"
                }
            )

            # Update fields
            update_dict = update_data.dict(exclude_unset=True)
            for field, value in update_dict.items():
                if hasattr(community, field):
                    if field == "platform_type" and hasattr(value, "value"):
                        setattr(community, field, value.value)
                    else:
                        setattr(community, field, value)

            community.updated_at = datetime.utcnow()

            await session.commit()
            await session.refresh(community)

            logger.info(
                "Community updated successfully",
                extra={
                    "community_id": community_id,
                    "email_id": user_email,
                    "component": "connect_service"
                }
            )

            return CommunityResponse(
                id=community.id,
                name=community.name,
                description=community.description,
                icon=community.icon,
                platform_type=community.platform_type,
                tags=community.tags or [],
                member_count=community.member_count,
                invite_link=community.invite_link,
                identifier_format_instruction=community.identifier_format_instruction,
                is_active=community.is_active,
                created_at=community.created_at,
                updated_at=community.updated_at,
                user_is_admin=True
            )

    async def create_join_request(
        self,
        request_data: JoinRequestCreate,
        user_uid: str,
        user_email: str
    ) -> JoinRequestResponse:
        """
        Create a join request for a community.

        Args:
            request_data: Join request data
            user_uid: User's UID
            user_email: User's email

        Returns:
            JoinRequestResponse: Created join request
        """
        async with get_db_session() as session:
            # Check if community exists
            community = await session.execute(
                select(CommunityORM).where(
                    CommunityORM.id == request_data.community_id)
            )
            community = community.scalar_one_or_none()

            if not community:
                raise NotFoundError("Community not found")

            # Check if user profile exists
            user_profile = await session.execute(
                select(UserProfileORM).where(UserProfileORM.uid == user_uid)
            )
            user_profile = user_profile.scalar_one_or_none()

            if not user_profile:
                raise ValidationError(
                    "User profile not found. Please complete profile setup first.")

            # Check if user already has a pending request
            existing_request = await session.execute(
                select(JoinRequestORM).where(
                    and_(
                        JoinRequestORM.community_id == request_data.community_id,
                        JoinRequestORM.user_uid == user_uid
                    )
                )
            )
            existing_request = existing_request.scalar_one_or_none()

            if existing_request:
                raise ValidationError(
                    "You already have a pending request for this community")

            logger.info(
                "Creating join request",
                extra={
                    "community_id": request_data.community_id,
                    "user_uid": user_uid,
                    "email_id": user_email,
                    "identifier_type": request_data.identifier_type,
                    "component": "connect_service"
                }
            )

            # Get the identifier hash based on type
            identifier_hash = None

            if request_data.identifier_type == "email":
                identifier_hash = user_profile.personal_email_hash
            elif request_data.identifier_type == "phone":
                identifier_hash = user_profile.phone_hash
            elif request_data.identifier_type == "custom":
                # Hash the custom identifier and add to user profile
                custom_hash = self._hash_identifier(
                    request_data.identifier_value)

                # Add to user's custom identifiers
                custom_identifiers = user_profile.custom_identifiers or []
                custom_identifier = {
                    "name": request_data.identifier_name,
                    "hash": custom_hash
                }
                custom_identifiers.append(custom_identifier)
                user_profile.custom_identifiers = custom_identifiers
                user_profile.updated_at = datetime.utcnow()

                identifier_hash = custom_hash

            if not identifier_hash:
                raise ValidationError("Unable to generate identifier hash")

            # Create join request
            join_request = JoinRequestORM(
                community_id=request_data.community_id,
                user_uid=user_uid,
                user_email=user_email,
                identifier_hash=identifier_hash,
                status="pending"
            )

            session.add(join_request)
            await session.commit()
            await session.refresh(join_request)

            logger.info(
                "Join request created successfully",
                extra={
                    "request_id": join_request.id,
                    "community_id": request_data.community_id,
                    "user_uid": user_uid,
                    "email_id": user_email,
                    "component": "connect_service"
                }
            )

            return JoinRequestResponse(
                id=join_request.id,
                community_id=join_request.community_id,
                user_uid=join_request.user_uid,
                user_email=join_request.user_email,
                status=join_request.status,
                created_at=join_request.created_at,
                community_name=community.name
            )

    async def verify_identifier(
        self,
        community_id: int,
        identifier: str,
        admin_email: str
    ) -> IdentifierVerificationResponse:
        """
        Verify if a user has submitted a join request with given identifier.

        Args:
            community_id: Community ID to check
            identifier: Identifier to verify
            admin_email: Admin email making the request

        Returns:
            IdentifierVerificationResponse: Verification result
        """
        # Check permissions
        user_is_super_admin = self._is_super_admin(admin_email)
        user_is_community_admin = await self._is_community_admin(admin_email, community_id)

        if not (user_is_super_admin or user_is_community_admin):
            logger.warning(
                "Unauthorized identifier verification attempt",
                extra={
                    "community_id": community_id,
                    "email_id": admin_email,
                    "component": "connect_service"
                }
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to verify identifiers for this community"
            )

        logger.info(
            "Verifying identifier",
            extra={
                "community_id": community_id,
                "email_id": admin_email,
                "component": "connect_service"
            }
        )

        # Hash the provided identifier
        identifier_hash = self._hash_identifier(identifier)

        async with get_db_session() as session:
            # Search for matching join request with user profile
            join_request = await session.execute(
                select(JoinRequestORM, UserProfileORM)
                .join(UserProfileORM, JoinRequestORM.user_uid == UserProfileORM.uid)
                .where(
                    and_(
                        JoinRequestORM.community_id == community_id,
                        JoinRequestORM.identifier_hash == identifier_hash
                    )
                )
            )
            result = join_request.first()

            if result:
                join_request_obj, user_profile = result

                logger.info(
                    "Identifier verification successful",
                    extra={
                        "community_id": community_id,
                        "found_user_email": join_request_obj.user_email,
                        "email_id": admin_email,
                        "component": "connect_service"
                    }
                )

                return IdentifierVerificationResponse(
                    found=True,
                    user_email=join_request_obj.user_email,
                    user_name=user_profile.name,
                    request_date=join_request_obj.created_at
                )

        logger.info(
            "Identifier verification - not found",
            extra={
                "community_id": community_id,
                "email_id": admin_email,
                "component": "connect_service"
            }
        )

        return IdentifierVerificationResponse(found=False)

    async def create_community_admin(
        self,
        admin_data: CommunityAdminCreate,
        assigner_email: str
    ) -> CommunityAdmin:
        """
        Create a community admin (super admin only).

        Args:
            admin_data: Admin creation data
            assigner_email: Email of the super admin assigning the role

        Returns:
            CommunityAdmin: Created admin record
        """
        if not self._is_super_admin(assigner_email):
            logger.warning(
                "Unauthorized community admin creation attempt",
                extra={
                    "email_id": assigner_email,
                    "component": "connect_service"
                }
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only super admins can assign community admins"
            )

        async with get_db_session() as session:
            # Check if community exists
            community = await session.execute(
                select(CommunityORM).where(
                    CommunityORM.id == admin_data.community_id)
            )
            community = community.scalar_one_or_none()

            if not community:
                raise NotFoundError("Community not found")

            logger.info(
                "Creating community admin",
                extra={
                    "community_id": admin_data.community_id,
                    "admin_email": admin_data.admin_email,
                    "assigner_email": assigner_email,
                    "email_id": assigner_email,
                    "component": "connect_service"
                }
            )

            # Create admin record
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
                "Community admin created successfully",
                extra={
                    "admin_id": admin.id,
                    "community_id": admin_data.community_id,
                    "admin_email": admin_data.admin_email,
                    "assigner_email": assigner_email,
                    "email_id": assigner_email,
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

    async def get_user_admin_communities(self, user_email: str) -> List[CommunityResponse]:
        """
        Get communities that user is admin for.

        Args:
            user_email: User's email address

        Returns:
            List[CommunityResponse]: Communities user can admin
        """
        async with get_db_session() as session:
            if self._is_super_admin(user_email):
                # Super admin can see all communities
                query = select(CommunityORM)
            else:
                # Regular admin can only see communities they admin
                query = (
                    select(CommunityORM)
                    .join(CommunityAdminORM)
                    .where(CommunityAdminORM.admin_email == user_email)
                )

            result = await session.execute(query)
            communities = result.scalars().all()

            return [
                CommunityResponse(
                    id=community.id,
                    name=community.name,
                    description=community.description,
                    icon=community.icon,
                    platform_type=community.platform_type,
                    tags=community.tags or [],
                    member_count=community.member_count,
                    invite_link=community.invite_link,
                    identifier_format_instruction=community.identifier_format_instruction,
                    is_active=community.is_active,
                    created_at=community.created_at,
                    updated_at=community.updated_at,
                    user_is_admin=True
                )
                for community in communities
            ]

    async def get_user_roles(self, user_email: str) -> Dict[str, Any]:
        """
        Get user roles (super admin, community admin).

        Args:
            user_email: User's email address

        Returns:
            Dict[str, Any]: Role information
        """
        is_super_admin = self._is_super_admin(user_email)
        is_community_admin = await self._is_community_admin(user_email)
        admin_communities = await self._get_user_admin_communities(user_email) if is_community_admin else []
        
        return {
            "is_super_admin": is_super_admin,
            "is_community_admin": is_community_admin,
            "admin_communities": admin_communities
        }

    async def get_community_admins(self, community_id: int, requester_email: str) -> List[Dict[str, Any]]:
        """
        Get list of admins for a specific community (super admin only).
        
        Args:
            community_id: Community ID
            requester_email: Email of the requester
            
        Returns:
            List[Dict[str, Any]]: List of community admins
        """
        if not self._is_super_admin(requester_email):
            logger.warning(
                "Unauthorized attempt to get community admins",
                extra={
                    "community_id": community_id,
                    "email_id": requester_email,
                    "component": "connect_service"
                }
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only super admins can view community admins"
            )
        
        async with get_db_session() as session:
            # Check if community exists
            community = await session.execute(
                select(CommunityORM).where(CommunityORM.id == community_id)
            )
            community = community.scalar_one_or_none()
            
            if not community:
                raise NotFoundError("Community not found")
            
            # Get admins
            admins_query = select(CommunityAdminORM).where(
                CommunityAdminORM.community_id == community_id
            ).order_by(CommunityAdminORM.created_at.desc())
            
            result = await session.execute(admins_query)
            admins = result.scalars().all()
            
            return [
                {
                    "id": admin.id,
                    "admin_email": admin.admin_email,
                    "admin_name": admin.admin_name,
                    "assigned_by": admin.assigned_by,
                    "created_at": admin.created_at
                }
                for admin in admins
            ]
    
    async def remove_community_admin(self, admin_id: int, requester_email: str) -> bool:
        """
        Remove a community admin (super admin only).
        
        Args:
            admin_id: Admin record ID to remove
            requester_email: Email of the requester
            
        Returns:
            bool: True if successfully removed
        """
        if not self._is_super_admin(requester_email):
            logger.warning(
                "Unauthorized attempt to remove community admin",
                extra={
                    "admin_id": admin_id,
                    "email_id": requester_email,
                    "component": "connect_service"
                }
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only super admins can remove community admins"
            )
        
        async with get_db_session() as session:
            # Find the admin record
            admin = await session.execute(
                select(CommunityAdminORM).where(CommunityAdminORM.id == admin_id)
            )
            admin = admin.scalar_one_or_none()
            
            if not admin:
                raise NotFoundError("Admin record not found")
            
            logger.info(
                "Removing community admin",
                extra={
                    "admin_id": admin_id,
                    "admin_email": admin.admin_email,
                    "community_id": admin.community_id,
                    "email_id": requester_email,
                    "component": "connect_service"
                }
            )
            
            await session.delete(admin)
            await session.commit()
            
            logger.info(
                "Community admin removed successfully",
                extra={
                    "admin_id": admin_id,
                    "admin_email": admin.admin_email,
                    "email_id": requester_email,
                    "component": "connect_service"
                }
            )
            
            return True
