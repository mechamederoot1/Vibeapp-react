from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database.database import get_db
from ..models.user import User
from ..models.testimonial import Testimonial
from ..models.testimonial_save import TestimonialSave
from .auth import get_current_user

router = APIRouter()

class TestimonialCreate(BaseModel):
    recipientId: int
    title: Optional[str] = None
    content: str
    backgroundColor: Optional[str] = None
    font: Optional[str] = None

@router.post("/")
async def create_testimonial(data: TestimonialCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not data.content or not data.recipientId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recipient and content required")

    t = Testimonial(
        author_id=current_user.id,
        recipient_id=data.recipientId,
        title=data.title,
        content=data.content,
        background_color=data.backgroundColor,
        font=data.font
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t.to_dict(current_user.id)

@router.get("/user/{user_id}")
async def get_testimonials_for_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Testimonial).filter(Testimonial.recipient_id == user_id, Testimonial.is_active == True).order_by(Testimonial.created_at.desc()).all()
    return [r.to_dict(current_user.id) for r in rows]

@router.get("/{id}")
async def get_testimonial(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    t = db.query(Testimonial).filter(Testimonial.id == id, Testimonial.is_active == True).first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return t.to_dict(current_user.id)

@router.post("/{id}/save")
async def toggle_save(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(Testimonial).filter(Testimonial.id == id, Testimonial.is_active == True).first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    exists = db.query(TestimonialSave).filter(TestimonialSave.user_id == current_user.id, TestimonialSave.testimonial_id == id).first()
    if exists:
        db.delete(exists)
        db.commit()
        return {"saved": False}
    else:
        s = TestimonialSave(user_id=current_user.id, testimonial_id=id)
        db.add(s)
        db.commit()
        db.refresh(s)
        return {"saved": True}
