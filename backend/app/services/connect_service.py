"""
Service layer for Connect page functionality.

This module provides business logic for managing alumni communities,
user profiles, and join requests with proper security and validation.

@module: app.services.connect_service
@author: unignoramus11
@version: 1.0.0
@since: 2025

Example:
    ```python
    from app.services.connect_service import ConnectService
    
    service = ConnectService()
    communities = await service.get_communities()
    ```
"""

import hashlib
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.exceptions import ValidationError, NotFoundError
from app.models.connect import (
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
    user profiles, and join requests with proper security measures.
    """
    
    def __init__(self):
        """Initialize the ConnectService."""
        self.settings = get_settings()
        # In a real implementation, this would be a database connection
        # For now, we'll use in-memory storage for demonstration
        self._communities: Dict[int, Community] = {}
        self._user_profiles: Dict[str, UserProfile] = {}
        self._join_requests: Dict[int, JoinRequest] = {}
        self._community_admins: Dict[int, List[CommunityAdmin]] = {}
        self._next_id = 1
        
    def _get_next_id(self) -> int:
        """Get next available ID."""
        current = self._next_id
        self._next_id += 1
        return current
    
    def _hash_identifier(self, identifier: str) -> str:
        """
        Hash an identifier using the application's hash key.
        
        Args:
            identifier: The identifier to hash
            
        Returns:
            str: Hashed identifier
        """
        # Use HMAC-like approach with hash key from env
        secret = self.settings.hash_key.encode('utf-8')
        identifier_bytes = identifier.lower().strip().encode('utf-8')
        
        # Create hash using hash key and identifier
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
    
    def _is_community_admin(self, email: str, community_id: Optional[int] = None) -> bool:
        """
        Check if user is a community admin.
        
        Args:
            email: User's email address
            community_id: Optional specific community ID to check
            
        Returns:
            bool: True if user is community admin
        """
        if community_id:
            admins = self._community_admins.get(community_id, [])
            return any(admin.admin_email == email for admin in admins)
        else:
            # Check if admin for any community
            for admins in self._community_admins.values():
                if any(admin.admin_email == email for admin in admins):
                    return True
        return False
    
    def _get_user_admin_communities(self, email: str) -> List[int]:
        """
        Get list of community IDs that user is admin for.
        
        Args:
            email: User's email address
            
        Returns:
            List[int]: List of community IDs
        """
        admin_communities = []
        for community_id, admins in self._community_admins.items():
            if any(admin.admin_email == email for admin in admins):
                admin_communities.append(community_id)
        return admin_communities
    
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
            personal_email_hash = self._hash_identifier(profile_data.personal_email)
            phone_hash = self._hash_identifier(profile_data.phone_number)
            
            # Create or update profile
            existing_profile = self._user_profiles.get(uid)
            
            if existing_profile:
                # Update existing profile
                existing_profile.personal_email_hash = personal_email_hash
                existing_profile.phone_hash = phone_hash
                existing_profile.updated_at = datetime.utcnow()
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
                profile = UserProfile(
                    id=self._get_next_id(),
                    uid=uid,
                    email=email,
                    name=name,
                    personal_email_hash=personal_email_hash,
                    phone_hash=phone_hash,
                    custom_identifiers=[],
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                self._user_profiles[uid] = profile
                
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
                custom_identifiers_count=len(profile.custom_identifiers),
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
        profile = self._user_profiles.get(uid)
        if not profile:
            return None
            
        return UserProfileResponse(
            id=profile.id,
            uid=profile.uid,
            email=profile.email,
            name=profile.name,
            has_personal_info=bool(profile.personal_email_hash and profile.phone_hash),
            custom_identifiers_count=len(profile.custom_identifiers),
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
        
        communities = list(self._communities.values())
        
        # Filter inactive communities (unless user is admin)
        if not user_email or not (self._is_super_admin(user_email) or 
                                 self._is_community_admin(user_email)):
            communities = [c for c in communities if c.is_active]
        
        # Apply filters
        if search:
            search_lower = search.lower()
            communities = [
                c for c in communities 
                if search_lower in c.name.lower() or search_lower in c.description.lower()
            ]
        
        if platform_filter:
            communities = [c for c in communities if c.platform_type == platform_filter]
        
        if tag_filter:
            communities = [c for c in communities if tag_filter.lower() in [t.lower() for t in c.tags]]
        
        # Sort communities
        if sort_by == "member_count":
            communities.sort(key=lambda x: x.member_count, reverse=True)
        elif sort_by == "created_at":
            communities.sort(key=lambda x: x.created_at or datetime.min, reverse=True)
        else:  # default to name
            communities.sort(key=lambda x: x.name.lower())
        
        # Convert to response format
        responses = []
        for community in communities:
            # Check if user is admin for this community
            user_is_admin = False
            if user_email:
                user_is_admin = (self._is_super_admin(user_email) or 
                               self._is_community_admin(user_email, community.id))
            
            # Check if user has pending join request
            join_request_exists = False
            if user_email:
                # Find user profile to get UID
                user_profile = next((p for p in self._user_profiles.values() 
                                   if p.email == user_email), None)
                if user_profile:
                    join_request_exists = any(
                        r.community_id == community.id and r.user_uid == user_profile.uid
                        for r in self._join_requests.values()
                    )
            
            responses.append(CommunityResponse(
                id=community.id,
                name=community.name,
                description=community.description,
                icon=community.icon,
                platform_type=community.platform_type,
                tags=community.tags,
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
        
        # Create community
        community_id = self._get_next_id()
        community = Community(
            id=community_id,
            name=community_data.name,
            description=community_data.description,
            icon=community_data.icon,
            platform_type=community_data.platform_type,
            tags=community_data.tags,
            member_count=community_data.member_count,
            invite_link=community_data.invite_link,
            identifier_format_instruction=community_data.identifier_format_instruction,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        self._communities[community_id] = community
        
        logger.info(
            "Community created successfully",
            extra={
                "community_id": community_id,
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
            tags=community.tags,
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
        community = self._communities.get(community_id)
        if not community:
            raise NotFoundError("Community not found")
        
        # Check permissions
        if not (self._is_super_admin(user_email) or 
                self._is_community_admin(user_email, community_id)):
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
            setattr(community, field, value)
        
        community.updated_at = datetime.utcnow()
        
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
            tags=community.tags,
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
        community = self._communities.get(request_data.community_id)
        if not community:
            raise NotFoundError("Community not found")
        
        user_profile = self._user_profiles.get(user_uid)
        if not user_profile:
            raise ValidationError("User profile not found. Please complete profile setup first.")
        
        # Check if user already has a pending request
        existing_request = any(
            r.community_id == request_data.community_id and r.user_uid == user_uid
            for r in self._join_requests.values()
        )
        if existing_request:
            raise ValidationError("You already have a pending request for this community")
        
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
            custom_hash = self._hash_identifier(request_data.identifier_value)
            
            # Add to user's custom identifiers
            custom_identifier = {
                "name": request_data.identifier_name,
                "hash": custom_hash
            }
            user_profile.custom_identifiers.append(custom_identifier)
            user_profile.updated_at = datetime.utcnow()
            
            identifier_hash = custom_hash
        
        if not identifier_hash:
            raise ValidationError("Unable to generate identifier hash")
        
        # Create join request
        request_id = self._get_next_id()
        join_request = JoinRequest(
            id=request_id,
            community_id=request_data.community_id,
            user_uid=user_uid,
            user_email=user_email,
            identifier_hash=identifier_hash,
            status="pending",
            created_at=datetime.utcnow()
        )
        
        self._join_requests[request_id] = join_request
        
        logger.info(
            "Join request created successfully",
            extra={
                "request_id": request_id,
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
        if not (self._is_super_admin(admin_email) or 
                self._is_community_admin(admin_email, community_id)):
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
        
        # Search for matching join request
        for join_request in self._join_requests.values():
            if (join_request.community_id == community_id and 
                join_request.identifier_hash == identifier_hash):
                
                # Get user profile for additional info
                user_profile = self._user_profiles.get(join_request.user_uid)
                user_name = user_profile.name if user_profile else "Unknown"
                
                logger.info(
                    "Identifier verification successful",
                    extra={
                        "community_id": community_id,
                        "found_user_email": join_request.user_email,
                        "email_id": admin_email,
                        "component": "connect_service"
                    }
                )
                
                return IdentifierVerificationResponse(
                    found=True,
                    user_email=join_request.user_email,
                    user_name=user_name,
                    request_date=join_request.created_at
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
        
        community = self._communities.get(admin_data.community_id)
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
        admin = CommunityAdmin(
            id=self._get_next_id(),
            community_id=admin_data.community_id,
            admin_email=admin_data.admin_email,
            admin_name=admin_data.admin_name,
            assigned_by=assigner_email,
            created_at=datetime.utcnow()
        )
        
        # Add to community admins
        if admin_data.community_id not in self._community_admins:
            self._community_admins[admin_data.community_id] = []
        self._community_admins[admin_data.community_id].append(admin)
        
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
        
        return admin
    
    async def get_user_admin_communities(self, user_email: str) -> List[CommunityResponse]:
        """
        Get communities that user is admin for.
        
        Args:
            user_email: User's email address
            
        Returns:
            List[CommunityResponse]: Communities user can admin
        """
        admin_community_ids = self._get_user_admin_communities(user_email)
        
        communities = []
        for community_id in admin_community_ids:
            community = self._communities.get(community_id)
            if community:
                communities.append(CommunityResponse(
                    id=community.id,
                    name=community.name,
                    description=community.description,
                    icon=community.icon,
                    platform_type=community.platform_type,
                    tags=community.tags,
                    member_count=community.member_count,
                    invite_link=community.invite_link,
                    identifier_format_instruction=community.identifier_format_instruction,
                    is_active=community.is_active,
                    created_at=community.created_at,
                    updated_at=community.updated_at,
                    user_is_admin=True
                ))
        
        return communities
    
    def get_user_roles(self, user_email: str) -> Dict[str, bool]:
        """
        Get user roles (super admin, community admin).
        
        Args:
            user_email: User's email address
            
        Returns:
            Dict[str, bool]: Role information
        """
        return {
            "is_super_admin": self._is_super_admin(user_email),
            "is_community_admin": self._is_community_admin(user_email),
            "admin_communities": self._get_user_admin_communities(user_email)
        }