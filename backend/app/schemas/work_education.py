from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class WorkExperienceBase(BaseModel):
    company: str
    position: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    order_index: int = 0

class WorkExperienceCreate(WorkExperienceBase):
    pass

class WorkExperienceUpdate(WorkExperienceBase):
    pass

class WorkExperienceResponse(WorkExperienceBase):
    id: int
    user_id: int
    display_text: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class EducationBase(BaseModel):
    institution: str
    degree: str
    field: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    order_index: int = 0

class EducationCreate(EducationBase):
    pass

class EducationUpdate(EducationBase):
    pass

class EducationResponse(EducationBase):
    id: int
    user_id: int
    display_text: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class WorkExperienceListResponse(BaseModel):
    work_experiences: List[WorkExperienceResponse]

class EducationListResponse(BaseModel):
    education_entries: List[EducationResponse]
