from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from ..database.database import get_db
from ..models import User, PersonalInfo, WorkExperience, Education
from ..api.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

# Schemas para validação
class WorkInfoSchema(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    description: Optional[str] = None
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    isCurrent: bool = True

class EducationInfoSchema(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    field: Optional[str] = None
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    isCurrent: bool = False

class LocationInfoSchema(BaseModel):
    currentCity: Optional[str] = None
    hometown: Optional[str] = None
    country: Optional[str] = None

class RelationshipInfoSchema(BaseModel):
    status: Optional[str] = None  # single, in_relationship, married, complicated, divorced, widowed
    partnerName: Optional[str] = None
    anniversary: Optional[date] = None

class ContactInfoSchema(BaseModel):
    websitePersonal: Optional[str] = None
    websiteProfessional: Optional[str] = None
    phoneMobile: Optional[str] = None
    phoneWork: Optional[str] = None

class AdditionalInfoSchema(BaseModel):
    languages: Optional[str] = None
    interests: Optional[str] = None
    aboutMe: Optional[str] = None

class PrivacySettingsSchema(BaseModel):
    showWorkInfo: bool = True
    showEducationInfo: bool = True
    showLocationInfo: bool = True
    showRelationshipInfo: bool = True
    showContactInfo: bool = False

class PersonalInfoUpdateSchema(BaseModel):
    work: Optional[WorkInfoSchema] = None
    education: Optional[EducationInfoSchema] = None
    location: Optional[LocationInfoSchema] = None
    relationship: Optional[RelationshipInfoSchema] = None
    contact: Optional[ContactInfoSchema] = None
    additional: Optional[AdditionalInfoSchema] = None
    privacy: Optional[PrivacySettingsSchema] = None

@router.get("/personal-info")
async def get_personal_info(
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obter informações pessoais do usuário.
    Se user_id não for fornecido, retorna as informações do usuário atual.
    """
    target_user_id = user_id or current_user.id
    
    # Buscar informações pessoais
    personal_info = db.query(PersonalInfo).filter(
        PersonalInfo.user_id == target_user_id
    ).first()
    
    if not personal_info:
        # Se não existir, criar um registro vazio
        personal_info = PersonalInfo(user_id=target_user_id)
        db.add(personal_info)
        db.commit()
        db.refresh(personal_info)
    
    # Se estiver visualizando o perfil de outro usuário, aplicar filtros de privacidade
    if target_user_id != current_user.id:
        data = personal_info.to_dict()
        
        # Aplicar configurações de privacidade
        if not personal_info.show_work_info:
            data["work"] = None
        if not personal_info.show_education_info:
            data["education"] = None
        if not personal_info.show_location_info:
            data["location"] = None
        if not personal_info.show_relationship_info:
            data["relationship"] = None
        if not personal_info.show_contact_info:
            data["contact"] = None
        
        return {"personalInfo": data}
    
    return {"personalInfo": personal_info.to_dict()}

@router.put("/personal-info")
async def update_personal_info(
    data: PersonalInfoUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualizar informações pessoais do usuário atual"""
    
    # Buscar ou criar informações pessoais
    personal_info = db.query(PersonalInfo).filter(
        PersonalInfo.user_id == current_user.id
    ).first()
    
    if not personal_info:
        personal_info = PersonalInfo(user_id=current_user.id)
        db.add(personal_info)
    
    # Atualizar informações de trabalho
    if data.work:
        personal_info.work_company = data.work.company
        personal_info.work_position = data.work.position
        personal_info.work_description = data.work.description
        personal_info.work_start_date = data.work.startDate
        personal_info.work_end_date = data.work.endDate
        personal_info.work_is_current = data.work.isCurrent
    
    # Atualizar informações de educação
    if data.education:
        personal_info.education_institution = data.education.institution
        personal_info.education_degree = data.education.degree
        personal_info.education_field = data.education.field
        personal_info.education_start_date = data.education.startDate
        personal_info.education_end_date = data.education.endDate
        personal_info.education_is_current = data.education.isCurrent
    
    # Atualizar informações de localização
    if data.location:
        personal_info.current_city = data.location.currentCity
        personal_info.hometown = data.location.hometown
        personal_info.country = data.location.country
    
    # Atualizar informações de relacionamento
    if data.relationship:
        personal_info.relationship_status = data.relationship.status
        personal_info.relationship_partner_name = data.relationship.partnerName
        personal_info.relationship_anniversary = data.relationship.anniversary
    
    # Atualizar informações de contato
    if data.contact:
        personal_info.website_personal = data.contact.websitePersonal
        personal_info.website_professional = data.contact.websiteProfessional
        personal_info.phone_mobile = data.contact.phoneMobile
        personal_info.phone_work = data.contact.phoneWork
    
    # Atualizar informações adicionais
    if data.additional:
        personal_info.languages = data.additional.languages
        personal_info.interests = data.additional.interests
        personal_info.about_me = data.additional.aboutMe
    
    # Atualizar configurações de privacidade
    if data.privacy:
        personal_info.show_work_info = data.privacy.showWorkInfo
        personal_info.show_education_info = data.privacy.showEducationInfo
        personal_info.show_location_info = data.privacy.showLocationInfo
        personal_info.show_relationship_info = data.privacy.showRelationshipInfo
        personal_info.show_contact_info = data.privacy.showContactInfo
    
    try:
        db.commit()
        db.refresh(personal_info)
        return {
            "message": "Informações pessoais atualizadas com sucesso",
            "personalInfo": personal_info.to_dict()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar informações pessoais: {str(e)}"
        )

@router.delete("/personal-info")
async def delete_personal_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletar todas as informações pessoais do usuário atual"""
    
    personal_info = db.query(PersonalInfo).filter(
        PersonalInfo.user_id == current_user.id
    ).first()
    
    if not personal_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Informações pessoais não encontradas"
        )
    
    try:
        db.delete(personal_info)
        db.commit()
        return {"message": "Informações pessoais deletadas com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar informações pessoais: {str(e)}"
        )

@router.put("/personal-info/privacy")
async def update_privacy_settings(
    privacy: PrivacySettingsSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualizar apenas as configurações de privacidade das informações pessoais"""
    
    # Buscar ou criar informações pessoais
    personal_info = db.query(PersonalInfo).filter(
        PersonalInfo.user_id == current_user.id
    ).first()
    
    if not personal_info:
        personal_info = PersonalInfo(user_id=current_user.id)
        db.add(personal_info)
    
    # Atualizar apenas configurações de privacidade
    personal_info.show_work_info = privacy.showWorkInfo
    personal_info.show_education_info = privacy.showEducationInfo
    personal_info.show_location_info = privacy.showLocationInfo
    personal_info.show_relationship_info = privacy.showRelationshipInfo
    personal_info.show_contact_info = privacy.showContactInfo
    
    try:
        db.commit()
        db.refresh(personal_info)
        return {
            "message": "Configurações de privacidade atualizadas com sucesso",
            "privacy": {
                "showWorkInfo": personal_info.show_work_info,
                "showEducationInfo": personal_info.show_education_info,
                "showLocationInfo": personal_info.show_location_info,
                "showRelationshipInfo": personal_info.show_relationship_info,
                "showContactInfo": personal_info.show_contact_info
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar configurações de privacidade: {str(e)}"
        )
