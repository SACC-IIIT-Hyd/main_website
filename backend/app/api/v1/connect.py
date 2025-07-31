"""
API endpoints for Connect page functionality.

This module provides REST API endpoints for managing alumni communities,
user profiles, and identifiers with proper authentication and authorization using PostgreSQL.

@module: app.api.v1.connect
@author: unignoramus11
@version: 2.0.0
@since: 2025

Example:
    ```python
    from fastapi import APIRouter, Depends
    from app.api.v1.connect import router

    app.include_router(router, prefix="/api/v1")
    ```
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.api.dependencies import get_current_user
from app.core.logging import get_logger
from app.models.auth import UserResponse
from app.models.connect import (
    # Response models
    CommunityResponse, UserProfileResponse, CommunityAdmin,
    IdentifierVerificationResponse,
    # Request models
    CommunityCreate, CommunityUpdate, UserProfileCreate,
    CommunityAdminCreate, IdentifierCreate, IdentifierVerificationRequest
)
from app.services.connect_service import ConnectService

# Initialize router and logger
router = APIRouter(prefix="/connect", tags=["connect"])
logger = get_logger(__name__)


def get_connect_service() -> ConnectService:
    """
    Dependency to get ConnectService instance.

    Returns:
        ConnectService: Service instance for connect operations
    """
    return ConnectService()


# =============================================================================
# USER PROFILE MANAGEMENT ROUTES
# =============================================================================

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Get current user's profile information including identifiers.

    This endpoint returns the authenticated user's profile with their identifiers.
    Only the profile owner can see their identifiers.

    Args:
        user: Current authenticated user
        connect_service: Connect service instance

    Returns:
        UserProfileResponse: User profile with identifiers (if owner)

    Raises:
        HTTPException: If profile not found (404)
    """
    logger.info(
        "Fetching user profile",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "component": "connect_api"
        }
    )

    profile = await connect_service.get_user_profile(
        uid=user.uid,
        current_user_uid=user.uid  # User can see their own identifiers
    )

    logger.info(
        "User profile fetched successfully",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "profile_id": profile.id,
            "identifiers_count": profile.identifiers_count,
            "component": "connect_api"
        }
    )

    return profile


@router.post("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_data: UserProfileCreate,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Create or update user profile with identifiers.

    This endpoint allows users to set up their profile with custom identifiers
    for community verification (email, phone, social handles, etc.).

    Args:
        profile_data: Profile data with identifiers to create/update
        user: Current authenticated user
        connect_service: Connect service instance

    Returns:
        UserProfileResponse: Created/updated profile information

    Raises:
        HTTPException: If profile creation fails (400)
    """
    logger.info(
        "Creating/updating user profile",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "identifiers_count": len(profile_data.identifiers),
            "component": "connect_api"
        }
    )

    profile = await connect_service.update_user_profile(
        uid=user.uid,
        email=user.email,
        name=user.name or "Unknown User",
        profile_data=profile_data
    )

    logger.info(
        "User profile updated successfully",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "profile_id": profile.id,
            "identifiers_count": profile.identifiers_count,
            "component": "connect_api"
        }
    )

    return profile


@router.post("/profile/identifiers", response_model=UserProfileResponse)
async def add_identifier(
    identifier_data: IdentifierCreate,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Add a new identifier to user profile.

    This endpoint allows users to add additional identifiers to their profile
    for community verification purposes.

    Args:
        identifier_data: Identifier to add (label and value)
        user: Current authenticated user
        connect_service: Connect service instance

    Returns:
        UserProfileResponse: Updated profile with new identifier

    Raises:
        HTTPException: If profile not found (404) or creation fails (400)
    """
    logger.info(
        "Adding identifier to user profile",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "identifier_label": identifier_data.label,
            "component": "connect_api"
        }
    )

    profile = await connect_service.add_identifier(
        uid=user.uid,
        identifier_data=identifier_data
    )

    logger.info(
        "Identifier added successfully",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "identifier_label": identifier_data.label,
            "identifiers_count": profile.identifiers_count,
            "component": "connect_api"
        }
    )

    return profile


@router.delete("/profile/identifiers/{identifier_id}", response_model=UserProfileResponse)
async def delete_identifier(
    identifier_id: int,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Delete an identifier from user profile.

    This endpoint allows users to remove identifiers from their profile.
    Users can only delete their own identifiers.

    Args:
        identifier_id: ID of identifier to delete
        user: Current authenticated user
        connect_service: Connect service instance

    Returns:
        UserProfileResponse: Updated profile without deleted identifier

    Raises:
        HTTPException: If identifier not found or doesn't belong to user (404)
    """
    logger.info(
        "Deleting identifier from user profile",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "identifier_id": identifier_id,
            "component": "connect_api"
        }
    )

    profile = await connect_service.delete_identifier(
        uid=user.uid,
        identifier_id=identifier_id
    )

    logger.info(
        "Identifier deleted successfully",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "identifier_id": identifier_id,
            "identifiers_count": profile.identifiers_count,
            "component": "connect_api"
        }
    )

    return profile


# =============================================================================
# COMMUNITY MANAGEMENT ROUTES
# =============================================================================

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

    This endpoint returns all communities with optional search, platform, and tag filters.
    Each community includes whether the current user is an admin for it.

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
            "email": user.email,
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
            "email": user.email,
            "communities_count": len(communities),
            "component": "connect_api"
        }
    )

    return communities


@router.get("/communities/{community_id}", response_model=CommunityResponse)
async def get_community(
    community_id: int,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Get a specific community by ID.

    This endpoint returns detailed information about a specific community,
    including whether the current user is an admin for it.

    Args:
        community_id: ID of community to retrieve
        user: Current authenticated user
        connect_service: Connect service instance

    Returns:
        CommunityResponse: Community details with admin status

    Raises:
        HTTPException: If community not found (404)
    """
    logger.info(
        "Fetching community details",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "community_id": community_id,
            "component": "connect_api"
        }
    )

    community = await connect_service.get_community(
        community_id=community_id,
        user_email=user.email
    )

    logger.info(
        "Community details fetched successfully",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "community_id": community_id,
            "community_name": community.name,
            "user_is_admin": community.user_is_admin,
            "component": "connect_api"
        }
    )

    return community


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
        HTTPException: If user is not super admin (403)
    """
    logger.info(
        "Creating new community",
        extra={
            "user_uid": user.uid,
            "email": user.email,
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
            "email": user.email,
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
        HTTPException: If user is not authorized (403) or community not found (404)
    """
    logger.info(
        "Updating community",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "community_id": community_id,
            "component": "connect_api"
        }
    )

    community = await connect_service.update_community(
        community_id=community_id,
        community_data=update_data,
        user_email=user.email
    )

    logger.info(
        "Community updated successfully",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "community_id": community_id,
            "community_name": community.name,
            "component": "connect_api"
        }
    )

    return community


# =============================================================================
# ADMIN MANAGEMENT ROUTES
# =============================================================================

@router.post("/communities/{community_id}/admins", response_model=CommunityAdmin)
async def add_community_admin(
    community_id: int,
    admin_data: CommunityAdminCreate,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Add a new admin to a community (super admin only).

    This endpoint allows super admins to assign community admin roles
    to other users for specific communities.

    Args:
        community_id: ID of community (must match admin_data.community_id)
        admin_data: Admin assignment data
        user: Current authenticated user (must be super admin)
        connect_service: Connect service instance

    Returns:
        CommunityAdmin: Created admin assignment

    Raises:
        HTTPException: If user is not super admin (403) or validation fails (400)
    """
    # Validate that community_id matches the data
    if community_id != admin_data.community_id:
        logger.warning(
            "Community ID mismatch in admin creation",
            extra={
                "user_uid": user.uid,
                "email": user.email,
                "path_community_id": community_id,
                "data_community_id": admin_data.community_id,
                "component": "connect_api"
            }
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Community ID in path must match community ID in data"
        )

    logger.info(
        "Adding community admin",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "community_id": community_id,
            "admin_email": admin_data.admin_email,
            "component": "connect_api"
        }
    )

    admin = await connect_service.add_community_admin(
        admin_data=admin_data,
        assigner_email=user.email
    )

    logger.info(
        "Community admin added successfully",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "admin_id": admin.id,
            "community_id": community_id,
            "admin_email": admin_data.admin_email,
            "component": "connect_api"
        }
    )

    return admin


@router.get("/communities/{community_id}/admins", response_model=List[CommunityAdmin])
async def get_community_admins(
    community_id: int,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Get list of admins for a specific community (admin only).

    This endpoint returns all admins for a community. Only super admins
    and community admins can access this information.

    Args:
        community_id: Community ID
        user: Current authenticated user (must be admin)
        connect_service: Connect service instance

    Returns:
        List[CommunityAdmin]: List of community admins

    Raises:
        HTTPException: If user is not authorized (403)
    """
    logger.info(
        "Fetching community admins",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "community_id": community_id,
            "component": "connect_api"
        }
    )

    admins = await connect_service.get_community_admins(
        community_id=community_id,
        user_email=user.email
    )

    logger.info(
        "Community admins fetched successfully",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "community_id": community_id,
            "admins_count": len(admins),
            "component": "connect_api"
        }
    )

    return admins


@router.delete("/admins/{admin_id}")
async def remove_community_admin(
    admin_id: int,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Remove a community admin (super admin only).

    This endpoint allows super admins to remove community admin roles.

    Args:
        admin_id: Admin record ID to remove
        user: Current authenticated user (must be super admin)
        connect_service: Connect service instance

    Returns:
        Dict: Success status

    Raises:
        HTTPException: If user is not super admin (403) or admin not found (404)
    """
    logger.info(
        "Removing community admin",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "admin_id": admin_id,
            "component": "connect_api"
        }
    )

    await connect_service.remove_community_admin(
        admin_id=admin_id,
        remover_email=user.email
    )

    logger.info(
        "Community admin removed successfully",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "admin_id": admin_id,
            "component": "connect_api"
        }
    )

    return {"success": True, "message": "Community admin removed successfully"}


# =============================================================================
# IDENTIFIER VERIFICATION ROUTES
# =============================================================================

@router.post("/verify-identifier", response_model=IdentifierVerificationResponse)
async def verify_identifier(
    verification_request: IdentifierVerificationRequest,
    user: UserResponse = Depends(get_current_user),
    connect_service: ConnectService = Depends(get_connect_service)
):
    """
    Verify if an identifier exists in the system (admin only).

    This endpoint allows community admins and super admins to check if someone
    has registered with a specific identifier. This is used for community verification.

    Args:
        verification_request: Identifier to verify
        user: Current authenticated user (must be admin)
        connect_service: Connect service instance

    Returns:
        IdentifierVerificationResponse: Verification result

    Raises:
        HTTPException: If user is not authorized (403)
    """
    logger.info(
        "Verifying identifier",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "component": "connect_api"
        }
    )

    result = await connect_service.verify_identifier(
        verification_request=verification_request,
        admin_email=user.email
    )

    logger.info(
        "Identifier verification completed",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "found": result.found,
            "component": "connect_api"
        }
    )

    return result


# =============================================================================
# UTILITY ROUTES
# =============================================================================

@router.get("/health")
async def health_check():
    """
    Health check endpoint for Connect service.

    This endpoint provides a simple health check for the Connect service
    to verify that it's running properly.

    Returns:
        Dict: Health status information
    """
    from datetime import datetime, timezone

    return {
        "status": "healthy",
        "service": "connect",
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    }


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
        Dict: User role information including admin status and communities
    """
    logger.info(
        "Fetching user roles",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "component": "connect_api"
        }
    )

    # Check if user is super admin
    is_super_admin = connect_service._is_super_admin(user.email)

    # Get communities user is admin for
    admin_community_ids = await connect_service._get_user_admin_communities(user.email)

    # Check if user is community admin
    is_community_admin = len(admin_community_ids) > 0

    roles = {
        "is_super_admin": is_super_admin,
        "is_community_admin": is_community_admin,
        "admin_communities": admin_community_ids,
        "permissions": {
            "can_create_communities": is_super_admin,
            "can_manage_admins": is_super_admin,
            "can_verify_identifiers": is_super_admin or is_community_admin,
            "can_update_communities": is_super_admin or is_community_admin
        }
    }

    logger.info(
        "User roles fetched successfully",
        extra={
            "user_uid": user.uid,
            "email": user.email,
            "is_super_admin": is_super_admin,
            "is_community_admin": is_community_admin,
            "admin_communities_count": len(admin_community_ids),
            "component": "connect_api"
        }
    )

    return roles
