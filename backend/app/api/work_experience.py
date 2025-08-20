from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.models.work_experience import WorkExperience
from app.schemas.work_education import WorkExperienceCreate, WorkExperienceUpdate, WorkExperienceResponse
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/work-experience", response_model=List[WorkExperienceResponse])
async def get_work_experiences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all work experiences for the current user"""
    try:
        work_experiences = db.query(WorkExperience).filter(
            WorkExperience.user_id == current_user.id
        ).order_by(WorkExperience.order_index.desc(), WorkExperience.created_at.desc()).all()
        
        return [
            WorkExperienceResponse(
                id=we.id,
                user_id=we.user_id,
                company=we.company,
                position=we.position,
                description=we.description,
                start_date=we.start_date,
                end_date=we.end_date,
                is_current=we.is_current,
                order_index=we.order_index,
                display_text=we._format_display_text(),
                created_at=we.created_at,
                updated_at=we.updated_at
            ) for we in work_experiences
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error loading work experiences: {str(e)}"
        )

@router.post("/work-experience", response_model=WorkExperienceResponse)
async def create_work_experience(
    work_experience: WorkExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new work experience"""
    try:
        new_work_experience = WorkExperience(
            user_id=current_user.id,
            company=work_experience.company,
            position=work_experience.position,
            description=work_experience.description,
            start_date=work_experience.start_date,
            end_date=work_experience.end_date,
            is_current=work_experience.is_current,
            order_index=work_experience.order_index
        )
        
        db.add(new_work_experience)
        db.commit()
        db.refresh(new_work_experience)
        
        return WorkExperienceResponse(
            id=new_work_experience.id,
            user_id=new_work_experience.user_id,
            company=new_work_experience.company,
            position=new_work_experience.position,
            description=new_work_experience.description,
            start_date=new_work_experience.start_date,
            end_date=new_work_experience.end_date,
            is_current=new_work_experience.is_current,
            order_index=new_work_experience.order_index,
            display_text=new_work_experience._format_display_text(),
            created_at=new_work_experience.created_at,
            updated_at=new_work_experience.updated_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating work experience: {str(e)}"
        )

@router.put("/work-experience/{work_experience_id}", response_model=WorkExperienceResponse)
async def update_work_experience(
    work_experience_id: int,
    work_experience_data: WorkExperienceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a work experience"""
    try:
        work_experience = db.query(WorkExperience).filter(
            WorkExperience.id == work_experience_id,
            WorkExperience.user_id == current_user.id
        ).first()
        
        if not work_experience:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work experience not found"
            )
        
        # Update fields
        for field, value in work_experience_data.model_dump(exclude_unset=True).items():
            setattr(work_experience, field, value)
        
        db.commit()
        db.refresh(work_experience)
        
        return WorkExperienceResponse(
            id=work_experience.id,
            user_id=work_experience.user_id,
            company=work_experience.company,
            position=work_experience.position,
            description=work_experience.description,
            start_date=work_experience.start_date,
            end_date=work_experience.end_date,
            is_current=work_experience.is_current,
            order_index=work_experience.order_index,
            display_text=work_experience._format_display_text(),
            created_at=work_experience.created_at,
            updated_at=work_experience.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating work experience: {str(e)}"
        )

@router.delete("/work-experience/{work_experience_id}")
async def delete_work_experience(
    work_experience_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a work experience"""
    try:
        work_experience = db.query(WorkExperience).filter(
            WorkExperience.id == work_experience_id,
            WorkExperience.user_id == current_user.id
        ).first()
        
        if not work_experience:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Work experience not found"
            )
        
        db.delete(work_experience)
        db.commit()
        
        return {"message": "Work experience deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting work experience: {str(e)}"
        )
