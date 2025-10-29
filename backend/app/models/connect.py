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
from sqlalchemy import Integer, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class CommunityType(str, Enum):
    """Enum for community platform types."""
    DISCORD = "discord"
    WHATSAPP = "whatsapp"
    FACEBOOK = "facebook"
    TEAMS = "teams"
    SLACK = "slack"
    TELEGRAM = "telegram"
    LINKEDIN = "linkedin"
    OTHER = "other"


# SQLAlchemy ORM Models

class UserProfileORM(Base):
    """SQLAlchemy ORM model for user profiles."""
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True, autoincrement=True)
    uid: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(
        timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    identifiers: Mapped[List["IdentifierORM"]] = relationship(
        "IdentifierORM", back_populates="user_profile")


class IdentifierORM(Base):
    """SQLAlchemy ORM model for user identifiers."""
    __tablename__ = "identifiers"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey(
        "user_profiles.id"), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    identifier_hash: Mapped[str] = mapped_column(
        String(255), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user_profile: Mapped["UserProfileORM"] = relationship(
        "UserProfileORM", back_populates="identifiers")


class CommunityORM(Base):
    """SQLAlchemy ORM model for communities."""
    __tablename__ = "communities"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    platform_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True)
    tags: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    member_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False)
    invite_link: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True)
    identifier_format_instruction: Mapped[str] = mapped_column(
        Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(
        timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    admins: Mapped[List["CommunityAdminORM"]] = relationship(
        "CommunityAdminORM", back_populates="community")


class CommunityAdminORM(Base):
    """SQLAlchemy ORM model for community admins."""
    __tablename__ = "community_admins"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True, autoincrement=True)
    community_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("communities.id"), nullable=False, index=True)
    admin_email: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True)
    admin_name: Mapped[str] = mapped_column(String(200), nullable=False)
    assigned_by: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    community: Mapped["CommunityORM"] = relationship(
        "CommunityORM", back_populates="admins")


# Pydantic Models

class UserProfile(BaseModel):
    """
    User profile model for storing user personal information.
    """
    id: Optional[int] = None
    uid: str = Field(..., max_length=100,
                     description="Unique user identifier from CAS")
    email: str = Field(..., max_length=100,
                       description="Official/institutional email from CAS")
    name: str = Field(..., max_length=200, description="Full name from CAS")

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Not stored in ORM, but for responses
    identifiers: Optional[List[dict]] = None

    class Config:
        from_attributes = True


class Identifier(BaseModel):
    """
    Model for user identifiers.
    """
    id: Optional[int] = None
    user_id: int = Field(..., description="User profile ID")
    label: str = Field(..., max_length=100,
                       description="Identifier label (e.g., 'personal_email', 'phone', etc)")
    identifier_hash: str = Field(..., max_length=255,
                                 description="Hashed identifier value")
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Community(BaseModel):
    """
    Community model for storing alumni community information.
    """
    id: Optional[int] = None
    name: str = Field(..., max_length=100, description="Community name")
    description: str = Field(..., max_length=500,
                             description="Community description")
    platform_type: CommunityType = Field(
        ..., description="Platform type (discord, whatsapp, etc.)")
    tags: List[str] = Field(default_factory=list,
                            description="Community tags for categorization")
    member_count: int = Field(
        default=0, ge=0, description="Number of members in the community")
    invite_link: Optional[str] = Field(
        None, max_length=500, description="Invite link for the community")
    identifier_format_instruction: str = Field(
        ..., max_length=1000, description="Required format for identifier")

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
    admin_email: str = Field(..., max_length=100,
                             description="Admin email address from CAS")
    admin_name: str = Field(..., max_length=200, description="Admin name")
    assigned_by: str = Field(..., max_length=100,
                             description="Super admin who assigned this role")

    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Request/Response models for API

class IdentifierCreate(BaseModel):
    """Model for creating a new identifier."""
    label: str = Field(..., max_length=100, description="Identifier label")
    value: str = Field(..., max_length=255,
                       description="Identifier value to be hashed")

    @validator('label')
    def validate_label(cls, v):
        """Validate label."""
        if not v.strip():
            raise ValueError("Label cannot be empty")
        return v.strip()

    @validator('value')
    def validate_value(cls, v):
        """Validate value."""
        if not v.strip():
            raise ValueError("Value cannot be empty")
        return v.strip()


class UserProfileCreate(BaseModel):
    """Model for creating user profile with identifier information."""
    identifiers: List[IdentifierCreate] = Field(
        ..., description="List of identifiers to create")

    @validator('identifiers')
    def validate_identifiers(cls, v):
        """Validate that at least one identifier is provided."""
        if not v:
            raise ValueError("At least one identifier must be provided")
        return v


class CommunityCreate(BaseModel):
    """Model for creating a new community."""
    name: str = Field(..., max_length=100, min_length=3,
                      description="Community name")
    description: str = Field(..., max_length=500,
                             min_length=10, description="Community description")
    platform_type: CommunityType = Field(..., description="Platform type")
    tags: List[str] = Field(default_factory=list, description="Community tags")
    member_count: int = Field(
        default=0, ge=0, le=100000, description="Member count")
    invite_link: Optional[str] = Field(
        None, max_length=500, description="Invite link")
    identifier_format_instruction: str = Field(
        ..., max_length=1000, min_length=10, description="Join instructions")


class CommunityUpdate(BaseModel):
    """Model for updating community information."""
    name: Optional[str] = Field(None, max_length=100, min_length=3)
    description: Optional[str] = Field(None, max_length=500, min_length=10)
    platform_type: Optional[CommunityType] = None
    tags: Optional[List[str]] = None
    member_count: Optional[int] = Field(None, ge=0, le=100000)
    invite_link: Optional[str] = Field(None, max_length=500)
    identifier_format_instruction: Optional[str] = Field(
        None, max_length=1000, min_length=10)


class CommunityAdminCreate(BaseModel):
    """Model for creating community admin."""
    community_id: int = Field(..., description="Community ID")
    admin_email: str = Field(..., max_length=100,
                             description="Admin email address")
    admin_name: str = Field(..., max_length=200, description="Admin name")


class CommunityResponse(BaseModel):
    """Response model for community data."""
    id: int
    name: str
    description: str
    platform_type: str
    tags: List[str]
    member_count: int
    invite_link: Optional[str]
    identifier_format_instruction: str
    created_at: datetime
    updated_at: Optional[datetime]

    # Additional fields for response
    user_is_admin: Optional[bool] = False


class UserProfileResponse(BaseModel):
    """Response model for user profile, including identifiers for the current user."""
    id: int
    uid: str
    email: str
    name: str
    created_at: datetime
    updated_at: Optional[datetime]
    identifiers: Optional[List[dict]] = None
    identifiers_count: int = 0


class IdentifierVerificationRequest(BaseModel):
    """Model for admin identifier verification."""
    identifier: str = Field(..., max_length=255,
                            description="Identifier to verify")


class IdentifierVerificationResponse(BaseModel):
    """Response model for identifier verification."""
    found: bool = False
