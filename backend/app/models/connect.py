"""
Database models for the Connect page functionality.

This module defines both SQLAlchemy ORM models and Pydantic models for alumni community management,
including communities, community admins, user profiles, and join requests.

@module: app.models.connect
@author: unignoramus11
@version: 1.0.0
@since: 2025

Example:
    ```python
    from app.models.connect import Community, UserProfile
    
    community = Community(name="IIITH Discord", description="Official Discord")
    ```
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from enum import Enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class CommunityType(str, Enum):
    """Enum for community platform types."""
    DISCORD = "discord"
    WHATSAPP = "whatsapp" 
    TEAMS = "teams"
    SLACK = "slack"
    TELEGRAM = "telegram"
    LINKEDIN = "linkedin"
    OTHER = "other"


# SQLAlchemy ORM Models

class UserProfileORM(Base):
    """SQLAlchemy ORM model for user profiles."""
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    uid = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(100), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    
    personal_email_hash = Column(String(255), nullable=True)
    phone_hash = Column(String(255), nullable=True)
    custom_identifiers = Column(JSON, default=list, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    join_requests = relationship("JoinRequestORM", back_populates="user_profile")


class CommunityORM(Base):
    """SQLAlchemy ORM model for communities."""
    __tablename__ = "communities"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(String(500), nullable=False)
    icon = Column(String(255), nullable=True)
    platform_type = Column(String(50), nullable=False, index=True)
    tags = Column(JSON, default=list, nullable=False)
    member_count = Column(Integer, default=0, nullable=False)
    invite_link = Column(String(500), nullable=True)
    identifier_format_instruction = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    admins = relationship("CommunityAdminORM", back_populates="community")
    join_requests = relationship("JoinRequestORM", back_populates="community")


class CommunityAdminORM(Base):
    """SQLAlchemy ORM model for community admins."""
    __tablename__ = "community_admins"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False, index=True)
    admin_email = Column(String(100), nullable=False, index=True)
    admin_name = Column(String(200), nullable=False)
    assigned_by = Column(String(100), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    community = relationship("CommunityORM", back_populates="admins")


class JoinRequestORM(Base):
    """SQLAlchemy ORM model for join requests."""
    __tablename__ = "join_requests"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False, index=True)
    user_uid = Column(String(100), ForeignKey("user_profiles.uid"), nullable=False, index=True)
    user_email = Column(String(100), nullable=False, index=True)
    identifier_hash = Column(String(255), nullable=False, index=True)
    status = Column(String(50), default="pending", nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    community = relationship("CommunityORM", back_populates="join_requests")
    user_profile = relationship("UserProfileORM", back_populates="join_requests")


# Pydantic Models

class UserProfile(BaseModel):
    """
    User profile model for storing user personal information.
    
    This model stores hashed personal email and phone for verification purposes.
    """
    id: Optional[int] = None
    uid: str = Field(..., max_length=100, description="Unique user identifier from CAS")
    email: str = Field(..., max_length=100, description="Official/institutional email from CAS")
    name: str = Field(..., max_length=200, description="Full name from CAS")
    
    # Hashed personal information for verification
    personal_email_hash: Optional[str] = Field(None, max_length=255, description="Hashed personal email")
    phone_hash: Optional[str] = Field(None, max_length=255, description="Hashed phone number")
    
    # Custom identifiers with names
    custom_identifiers: List[dict] = Field(default_factory=list, description="List of custom identifier objects")
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @validator('custom_identifiers')
    def validate_custom_identifiers(cls, v):
        """Validate custom identifiers structure."""
        for identifier in v:
            if not isinstance(identifier, dict):
                raise ValueError("Each identifier must be a dictionary")
            if 'name' not in identifier or 'hash' not in identifier:
                raise ValueError("Each identifier must have 'name' and 'hash' fields")
        return v

    class Config:
        from_attributes = True


class Community(BaseModel):
    """
    Community model for storing alumni community information.
    """
    id: Optional[int] = None
    name: str = Field(..., max_length=100, description="Community name")
    description: str = Field(..., max_length=500, description="Community description")
    icon: Optional[str] = Field(None, max_length=255, description="Community icon URL or base64")
    platform_type: CommunityType = Field(..., description="Platform type (discord, whatsapp, etc.)")
    tags: List[str] = Field(default_factory=list, description="Community tags for categorization")
    member_count: int = Field(default=0, ge=0, description="Number of members in the community")
    invite_link: Optional[str] = Field(None, max_length=500, description="Invite link for the community")
    identifier_format_instruction: str = Field(..., max_length=1000, description="Instructions for joining")
    is_active: bool = Field(default=True, description="Whether the community is active")
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @validator('tags')
    def validate_tags(cls, v):
        """Validate tags list."""
        if len(v) > 10:
            raise ValueError("Maximum 10 tags allowed")
        for tag in v:
            if len(tag) > 50:
                raise ValueError("Each tag must be 50 characters or less")
        return v

    class Config:
        from_attributes = True


class CommunityAdmin(BaseModel):
    """
    Community admin model for managing admin permissions.
    """
    id: Optional[int] = None
    community_id: int = Field(..., description="Community ID")
    admin_email: str = Field(..., max_length=100, description="Admin email address from CAS")
    admin_name: str = Field(..., max_length=200, description="Admin name")
    assigned_by: str = Field(..., max_length=100, description="Super admin who assigned this role")
    
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class JoinRequest(BaseModel):
    """
    Join request model for tracking community join requests.
    """
    id: Optional[int] = None
    community_id: int = Field(..., description="Community ID")
    user_uid: str = Field(..., max_length=100, description="User's UID")
    user_email: str = Field(..., max_length=100, description="User's email for tracking")
    identifier_hash: str = Field(..., max_length=255, description="Hashed identifier used for joining")
    status: str = Field(default="pending", description="Request status")
    
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Request/Response models for API

class UserProfileCreate(BaseModel):
    """Model for creating user profile with personal information."""
    personal_email: str = Field(..., max_length=100, description="Personal email address")
    phone_number: str = Field(..., max_length=20, description="Phone number")
    
    @validator('personal_email')
    def validate_email(cls, v):
        """Basic email validation."""
        if '@' not in v or '.' not in v:
            raise ValueError("Invalid email format")
        return v.lower().strip()
    
    @validator('phone_number')
    def validate_phone(cls, v):
        """Basic phone validation."""
        # Remove spaces and special characters, keep only digits and + 
        clean_phone = ''.join(c for c in v if c.isdigit() or c == '+')
        if len(clean_phone) < 10 or len(clean_phone) > 15:
            raise ValueError("Phone number must be between 10-15 digits")
        return clean_phone


class CommunityCreate(BaseModel):
    """Model for creating a new community."""
    name: str = Field(..., max_length=100, min_length=3, description="Community name")
    description: str = Field(..., max_length=500, min_length=10, description="Community description")
    platform_type: CommunityType = Field(..., description="Platform type")
    tags: List[str] = Field(default_factory=list, description="Community tags")
    member_count: int = Field(default=0, ge=0, le=100000, description="Member count")
    invite_link: Optional[str] = Field(None, max_length=500, description="Invite link")
    identifier_format_instruction: str = Field(..., max_length=1000, min_length=10, description="Join instructions")
    icon: Optional[str] = Field(None, max_length=2000, description="Icon data or URL")


class CommunityUpdate(BaseModel):
    """Model for updating community information."""
    name: Optional[str] = Field(None, max_length=100, min_length=3)
    description: Optional[str] = Field(None, max_length=500, min_length=10)
    platform_type: Optional[CommunityType] = None
    tags: Optional[List[str]] = None
    member_count: Optional[int] = Field(None, ge=0, le=100000)
    invite_link: Optional[str] = Field(None, max_length=500)
    identifier_format_instruction: Optional[str] = Field(None, max_length=1000, min_length=10)
    icon: Optional[str] = Field(None, max_length=2000)
    is_active: Optional[bool] = None


class JoinRequestCreate(BaseModel):
    """Model for creating a join request."""
    community_id: int = Field(..., description="Community ID to join")
    identifier_type: str = Field(..., description="Type: 'email', 'phone', or 'custom'")
    identifier_value: Optional[str] = Field(None, max_length=255, description="Custom identifier value")
    identifier_name: Optional[str] = Field(None, max_length=100, description="Name for custom identifier")
    
    @validator('identifier_type')
    def validate_identifier_type(cls, v):
        """Validate identifier type."""
        if v not in ['email', 'phone', 'custom']:
            raise ValueError("identifier_type must be 'email', 'phone', or 'custom'")
        return v
    
    @validator('identifier_value')
    def validate_custom_identifier(cls, v, values):
        """Validate custom identifier value when type is custom."""
        if values.get('identifier_type') == 'custom' and not v:
            raise ValueError("identifier_value is required for custom type")
        return v
    
    @validator('identifier_name')
    def validate_custom_name(cls, v, values):
        """Validate custom identifier name when type is custom."""
        if values.get('identifier_type') == 'custom' and not v:
            raise ValueError("identifier_name is required for custom type")
        return v


class CommunityAdminCreate(BaseModel):
    """Model for creating community admin."""
    community_id: int = Field(..., description="Community ID")
    admin_email: str = Field(..., max_length=100, description="Admin email address")
    admin_name: str = Field(..., max_length=200, description="Admin name")


class CommunityResponse(BaseModel):
    """Response model for community data."""
    id: int
    name: str
    description: str
    icon: Optional[str]
    platform_type: str
    tags: List[str]
    member_count: int
    invite_link: Optional[str]
    identifier_format_instruction: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Additional fields for response
    user_is_admin: Optional[bool] = False
    join_request_exists: Optional[bool] = False


class UserProfileResponse(BaseModel):
    """Response model for user profile."""
    id: int
    uid: str
    email: str
    name: str
    has_personal_info: bool = False
    custom_identifiers_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime]


class JoinRequestResponse(BaseModel):
    """Response model for join requests."""
    id: int
    community_id: int
    user_uid: str
    user_email: str
    status: str
    created_at: datetime
    
    # Additional community info
    community_name: Optional[str] = None


class IdentifierVerificationRequest(BaseModel):
    """Model for admin identifier verification."""
    identifier: str = Field(..., max_length=255, description="Identifier to verify")


class IdentifierVerificationResponse(BaseModel):
    """Response model for identifier verification."""
    found: bool = False
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    request_date: Optional[datetime] = None