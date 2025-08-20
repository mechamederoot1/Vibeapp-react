from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    bio: Optional[str] = None
    location: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    birthDate: Optional[str] = None  # Format: YYYY-MM-DD
    gender: Optional[str] = None
    avatar: Optional[str] = None
    coverPhoto: Optional[str] = None
    currentCity: Optional[str] = None
    relationship: Optional[str] = None
    work: Optional[str] = None
    education: Optional[str] = None
    avatar_url: Optional[str] = None  # Legacy field
    cover_url: Optional[str] = None   # Legacy field
    is_private: Optional[bool] = None
    show_profile_visitors: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    is_verified: bool
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    is_private: bool
    show_profile_visitors: bool
    created_at: datetime
    last_active: datetime

    class Config:
        from_attributes = True

class UserProfile(UserResponse):
    posts_count: int
    followers_count: int
    following_count: int
    friends_count: int

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
