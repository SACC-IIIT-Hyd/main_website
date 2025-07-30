"""
API endpoints for Connect page functionality.

This module provides REST API endpoints for managing alumni communities,
user profiles, and join requests with proper authentication and authorization.

@module: app.api.v1.connect
@author: unignoramus11
@version: 1.0.0
@since: 2025

Example:
    ```python
    from fastapi import APIRouter, Depends
    from app.api.v1.connect import router

    app.include_router(router, prefix="/api/connect")
    ```
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_current_user
from app.core.logging import get_logger
from app.models.auth import UserResponse
from app.models.connect import (
    CommunityResponse, CommunityCreate, CommunityUpdate,
    UserProfileCreate, UserProfileResponse,
    JoinRequestCreate, JoinRequestResponse,
    CommunityAdminCreate, CommunityAdmin,
    IdentifierVerificationRequest, IdentifierVerificationResponse
)

from fastapi import HTTPException, status
from app.services.connect_service import ConnectService

# Initialize router and logger
router = APIRouter(prefix="/connect", tags=["connect"])
logger = get_logger(__name__)

@router.delete("/communities/{community_id}")
async def delete_community(
    community_id: int,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Delete a community (super admin only).

    Args:
        community_id: ID of the community to delete
        user: Current authenticated user (must be super admin)
        connect_service: Connect service instance

    Returns:
        Dict: Success status
    """
    if not await connect_service.delete_community(community_id, user.email):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found or not deleted")
    return {"success": True, "message": "Community deleted successfully"}


def get_connect_service() -> ConnectService:
    """Dependency to get ConnectService instance."""
    return ConnectService()


@router.get("/communities", response_model=List[CommunityResponse])
async def get_communities(
    search: Optional[str] = Query(
        None, description="Search communities by name or description"),
    platform: Optional[str] = Query(
        None, description="Filter by platform type"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    sort_by: str = Query(
        "name", description="Sort by: name, member_count, created_at"),
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Get list of communities with optional filtering and sorting.

    This endpoint returns all active communities that the authenticated user
    can see, with optional search, platform, and tag filters.

    Args:
        search: Optional search term for community name or description
        platform: Optional platform type filter (discord, whatsapp, etc.)
        tag: Optional tag filter
        sort_by: Sort field (name, member_count, created_at)
        user: Current authenticated user
        connect_service: Connect service instance

    Returns:
        List[CommunityResponse]: List of filtered and sorted communities
    """
    logger.info(
        "Fetching communities list",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "search": search,
            "platform": platform,
            "tag": tag,
            "sort_by": sort_by,
            "component": "connect_api"
        }
    )

    communities = await connect_service.get_communities(
        user_email=user.email,
        search=search,
        platform_filter=platform,
        tag_filter=tag,
        sort_by=sort_by
    )

    logger.info(
        "Communities list fetched successfully",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "communities_count": len(communities),
            "component": "connect_api"
        }
    )

    return communities


@router.post("/communities", response_model=CommunityResponse)
async def create_community(
    community_data: CommunityCreate,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Create a new community (super admin only).

    This endpoint allows super admins to create new alumni communities
    with all necessary information and settings.

    Args:
        community_data: Community creation data
        user: Current authenticated user (must be super admin)
        connect_service: Connect service instance

    Returns:
        CommunityResponse: Created community information

    Raises:
        HTTPException: If user is not super admin
    """
    logger.info(
        "Creating new community",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "community_name": community_data.name,
            "platform_type": community_data.platform_type,
            "component": "connect_api"
        }
    )

    community = await connect_service.create_community(
        community_data=community_data,
        creator_email=user.email
    )

    logger.info(
        "Community created successfully",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "community_id": community.id,
            "community_name": community.name,
            "component": "connect_api"
        }
    )

    return community


@router.put("/communities/{community_id}", response_model=CommunityResponse)
async def update_community(
    community_id: int,
    update_data: CommunityUpdate,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Update community information (admin only).

    This endpoint allows super admins and community admins to update
    community information including description, tags, member count, etc.

    Args:
        community_id: ID of the community to update
        update_data: Updated community data
        user: Current authenticated user (must be admin)
        connect_service: Connect service instance

    Returns:
        CommunityResponse: Updated community information

    Raises:
        HTTPException: If user is not authorized or community not found
    """
    logger.info(
        "Updating community",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "community_id": community_id,
            "component": "connect_api"
        }
    )

    community = await connect_service.update_community(
        community_id=community_id,
        update_data=update_data,
        user_email=user.email
    )

    logger.info(
        "Community updated successfully",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "community_id": community_id,
            "component": "connect_api"
        }
    )

    return community


@router.get("/profile", response_model=Optional[UserProfileResponse])
async def get_user_profile(
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Get current user's profile information.

    This endpoint returns the user's profile including whether they have
    completed personal information setup and their custom identifiers count.

    Args:
        user: Current authenticated user
        connect_service: Connect service instance

    Returns:
        Optional[UserProfileResponse]: User profile if exists, None otherwise
    """
    logger.info(
        "Fetching user profile",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "component": "connect_api"
        }
    )

    profile = await connect_service.get_user_profile(user.uid)

    if profile:
        logger.info(
            "User profile fetched successfully",
            extra={
                "user_uid": user.uid,
                "email_id": user.email,
                "has_personal_info": profile.has_personal_info,
                "component": "connect_api"
            }
        )
    else:
        logger.info(
            "User profile not found",
            extra={
                "user_uid": user.uid,
                "email_id": user.email,
                "component": "connect_api"
            }
        )

    return profile


@router.post("/profile", response_model=UserProfileResponse)
async def create_user_profile(
    profile_data: UserProfileCreate,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Create or update user profile with personal information.

    This endpoint allows users to set up their personal email and phone
    number which will be hashed and stored for verification purposes.

    Args:
        profile_data: Personal information (email and phone)
        user: Current authenticated user
        connect_service: Connect service instance

    Returns:
        UserProfileResponse: Created/updated profile information
    """
    logger.info(
        "Creating/updating user profile",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "component": "connect_api"
        }
    )

    profile = await connect_service.create_user_profile(
        uid=user.uid,
        email=user.email,
        name=user.name or "Unknown User",
        profile_data=profile_data
    )

    logger.info(
        "User profile created/updated successfully",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "profile_id": profile.id,
            "component": "connect_api"
        }
    )

    return profile


@router.post("/join-requests", response_model=JoinRequestResponse)
async def create_join_request(
    request_data: JoinRequestCreate,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Create a join request for a community.

    This endpoint allows users to submit join requests for communities
    using their personal email, phone, or custom identifiers.

    Args:
        request_data: Join request data including community ID and identifier
        user: Current authenticated user
        connect_service: Connect service instance

    Returns:
        JoinRequestResponse: Created join request information

    Raises:
        HTTPException: If profile not set up or request already exists
    """
    logger.info(
        "Creating join request",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "community_id": request_data.community_id,
            "identifier_type": request_data.identifier_type,
            "component": "connect_api"
        }
    )

    join_request = await connect_service.create_join_request(
        request_data=request_data,
        user_uid=user.uid,
        user_email=user.email
    )

    logger.info(
        "Join request created successfully",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "request_id": join_request.id,
            "community_id": request_data.community_id,
            "component": "connect_api"
        }
    )

    return join_request


@router.post("/communities/{community_id}/verify-identifier")
async def verify_identifier(
    community_id: int,
    verification_data: IdentifierVerificationRequest,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
) -> IdentifierVerificationResponse:
    """
    Verify if a user has submitted a join request with given identifier
    (admin only).

    This endpoint allows community admins to check if someone has submitted
    a join request with a specific identifier for their community.

    Args:
        community_id: Community ID to check
        verification_data: Identifier to verify
        user: Current authenticated user (must be admin)
        connect_service: Connect service instance

    Returns:
        IdentifierVerificationResponse: Verification result
        with user info if found

    Raises:
        HTTPException: If user is not authorized for this community
    """
    logger.info(
        "Verifying identifier for community",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "community_id": community_id,
            "component": "connect_api"
        }
    )

    result = await connect_service.verify_identifier(
        community_id=community_id,
        identifier=verification_data.identifier,
        admin_email=user.email
    )

    logger.info(
        "Identifier verification completed",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "community_id": community_id,
            "found": result.found,
            "component": "connect_api"
        }
    )

    return result


@router.post("/community-admins", response_model=CommunityAdmin)
async def create_community_admin(
    admin_data: CommunityAdminCreate,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Create a community admin (super admin only).

    This endpoint allows super admins to assign community admin roles
    to other users for specific communities.

    Args:
        admin_data: Admin assignment data
        user: Current authenticated user (must be super admin)
        connect_service: Connect service instance

    Returns:
        CommunityAdmin: Created admin assignment

    Raises:
        HTTPException: If user is not super admin
    """
    logger.info(
        "Creating community admin",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "community_id": admin_data.community_id,
            "admin_email": admin_data.admin_email,
            "component": "connect_api"
        }
    )

    admin = await connect_service.create_community_admin(
        admin_data=admin_data,
        assigner_email=user.email
    )

    logger.info(
        "Community admin created successfully",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "admin_id": admin.id,
            "community_id": admin_data.community_id,
            "admin_email": admin_data.admin_email,
            "component": "connect_api"
        }
    )

    return admin


@router.get("/admin/communities", response_model=List[CommunityResponse])
async def get_admin_communities(
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Get communities that current user is admin for.

    This endpoint returns all communities where the current user has
    admin privileges (either super admin or community admin).

    Args:
        user: Current authenticated user
        connect_service: Connect service instance

    Returns:
        List[CommunityResponse]: Communities user can admin
    """
    logger.info(
        "Fetching admin communities",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "component": "connect_api"
        }
    )

    communities = await connect_service.get_user_admin_communities(user.email)

    logger.info(
        "Admin communities fetched successfully",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "admin_communities_count": len(communities),
            "component": "connect_api"
        }
    )

    return communities


@router.get("/user-roles")
async def get_user_roles(
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Get current user's roles and permissions.

    This endpoint returns information about the user's admin roles,
    including whether they are super admin or community admin.

    Args:
        user: Current authenticated user
        connect_service: Connect service instance

    Returns:
        Dict: User role information
    """
    logger.info(
        "Fetching user roles",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "component": "connect_api"
        }
    )

    roles = await connect_service.get_user_roles(user.email)

    logger.info(
        "User roles fetched successfully",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "is_super_admin": roles["is_super_admin"],
            "is_community_admin": roles["is_community_admin"],
            "component": "connect_api"
        }
    )

    return roles


@router.get("/communities/{community_id}/admins")
async def get_community_admins(
    community_id: int,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Get list of admins for a specific community (super admin only).

    Args:
        community_id: Community ID
        user: Current authenticated user (must be super admin)
        connect_service: Connect service instance

    Returns:
        List[Dict]: List of community admins
    """
    logger.info(
        "Fetching community admins",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "community_id": community_id,
            "component": "connect_api"
        }
    )

    admins = await connect_service.get_community_admins(community_id, user.email)

    logger.info(
        "Community admins fetched successfully",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "community_id": community_id,
            "admins_count": len(admins),
            "component": "connect_api"
        }
    )

    return admins


@router.delete("/community-admins/{admin_id}")
async def remove_community_admin(
    admin_id: int,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Remove a community admin (super admin only).

    Args:
        admin_id: Admin record ID to remove
        user: Current authenticated user (must be super admin)
        connect_service: Connect service instance

    Returns:
        Dict: Success status
    """
    logger.info(
        "Removing community admin",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "admin_id": admin_id,
            "component": "connect_api"
        }
    )

    await connect_service.remove_community_admin(admin_id, user.email)

    logger.info(
        "Community admin removed successfully",
        extra={
            "user_uid": user.uid,
            "email_id": user.email,
            "admin_id": admin_id,
            "component": "connect_api"
        }
    )

    return {"success": True, "message": "Community admin removed successfully"}


# Health check endpoint for the connect service
@router.get("/health")
async def health_check():
    """
    Health check endpoint for Connect service.

    Returns:
        Dict: Health status
    """
    return {
        "status": "healthy",
        "service": "connect",
        "timestamp": "2025-01-28T00:00:00Z"
    }
