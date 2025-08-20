from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.models.education import Education
from app.schemas.work_education import EducationCreate, EducationUpdate, EducationResponse
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/education", response_model=List[EducationResponse])
async def get_education_entries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all education entries for the current user"""
    try:
        education_entries = db.query(Education).filter(
            Education.user_id == current_user.id
        ).order_by(Education.order_index.desc(), Education.created_at.desc()).all()
        
        return [
            EducationResponse(
                id=edu.id,
                user_id=edu.user_id,
                institution=edu.institution,
                degree=edu.degree,
                field=edu.field,
                description=edu.description,
                start_date=edu.start_date,
                end_date=edu.end_date,
                is_current=edu.is_current,
                order_index=edu.order_index,
                display_text=edu._format_display_text(),
                created_at=edu.created_at,
                updated_at=edu.updated_at
            ) for edu in education_entries
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error loading education entries: {str(e)}"
        )

@router.post("/education", response_model=EducationResponse)
async def create_education(
    education: EducationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new education entry"""
    try:
        new_education = Education(
            user_id=current_user.id,
            institution=education.institution,
            degree=education.degree,
            field=education.field,
            description=education.description,
            start_date=education.start_date,
            end_date=education.end_date,
            is_current=education.is_current,
            order_index=education.order_index
        )
        
        db.add(new_education)
        db.commit()
        db.refresh(new_education)
        
        return EducationResponse(
            id=new_education.id,
            user_id=new_education.user_id,
            institution=new_education.institution,
            degree=new_education.degree,
            field=new_education.field,
            description=new_education.description,
            start_date=new_education.start_date,
            end_date=new_education.end_date,
            is_current=new_education.is_current,
            order_index=new_education.order_index,
            display_text=new_education._format_display_text(),
            created_at=new_education.created_at,
            updated_at=new_education.updated_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating education entry: {str(e)}"
        )

@router.put("/education/{education_id}", response_model=EducationResponse)
async def update_education(
    education_id: int,
    education_data: EducationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an education entry"""
    try:
        education = db.query(Education).filter(
            Education.id == education_id,
            Education.user_id == current_user.id
        ).first()
        
        if not education:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Education entry not found"
            )
        
        # Update fields
        for field, value in education_data.model_dump(exclude_unset=True).items():
            setattr(education, field, value)
        
        db.commit()
        db.refresh(education)
        
        return EducationResponse(
            id=education.id,
            user_id=education.user_id,
            institution=education.institution,
            degree=education.degree,
            field=education.field,
            description=education.description,
            start_date=education.start_date,
            end_date=education.end_date,
            is_current=education.is_current,
            order_index=education.order_index,
            display_text=education._format_display_text(),
            created_at=education.created_at,
            updated_at=education.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating education entry: {str(e)}"
        )

@router.delete("/education/{education_id}")
async def delete_education(
    education_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an education entry"""
    try:
        education = db.query(Education).filter(
            Education.id == education_id,
            Education.user_id == current_user.id
        ).first()
        
        if not education:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Education entry not found"
            )
        
        db.delete(education)
        db.commit()
        
        return {"message": "Education entry deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting education entry: {str(e)}"
        )
