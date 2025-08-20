from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database.database import Base

class PersonalInfo(Base):
    __tablename__ = "personal_info"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Informações de trabalho
    work_company = Column(String, nullable=True)  # "TechCorp"
    work_position = Column(String, nullable=True)  # "UX Designer"
    work_description = Column(Text, nullable=True)  # Descrição do trabalho
    work_start_date = Column(Date, nullable=True)
    work_end_date = Column(Date, nullable=True)  # null se ainda trabalha lá
    work_is_current = Column(Boolean, default=True)
    
    # Informações de educação
    education_institution = Column(String, nullable=True)  # "UFPE"
    education_degree = Column(String, nullable=True)  # "Design Digital"
    education_field = Column(String, nullable=True)  # Campo de estudo
    education_start_date = Column(Date, nullable=True)
    education_end_date = Column(Date, nullable=True)
    education_is_current = Column(Boolean, default=False)
    
    # Localização
    current_city = Column(String, nullable=True)  # "Recife, PE"
    hometown = Column(String, nullable=True)  # Cidade natal
    country = Column(String, nullable=True)  # País
    
    # Relacionamento
    relationship_status = Column(String, nullable=True)  # "single", "in_relationship", "married", "complicated", "divorced", "widowed"
    relationship_partner_name = Column(String, nullable=True)  # "João Silva"
    relationship_anniversary = Column(Date, nullable=True)  # Data do relacionamento
    
    # Informações de contato adicionais
    website_personal = Column(String, nullable=True)  # Site pessoal
    website_professional = Column(String, nullable=True)  # Site profissional
    phone_mobile = Column(String, nullable=True)
    phone_work = Column(String, nullable=True)
    
    # Informações pessoais adicionais
    languages = Column(Text, nullable=True)  # JSON com idiomas falados
    interests = Column(Text, nullable=True)  # JSON com interesses
    about_me = Column(Text, nullable=True)  # Sobre mim detalhado
    
    # Configurações de privacidade
    show_work_info = Column(Boolean, default=True)
    show_education_info = Column(Boolean, default=True)
    show_location_info = Column(Boolean, default=True)
    show_relationship_info = Column(Boolean, default=True)
    show_contact_info = Column(Boolean, default=False)  # Mais restritivo por padrão
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamento com usuário
    user = relationship("User", back_populates="personal_info")
    
    def to_dict(self):
        """Convert personal info to dictionary for API responses"""
        return {
            "id": self.id,
            "userId": self.user_id,
            "work": {
                "company": self.work_company,
                "position": self.work_position,
                "description": self.work_description,
                "startDate": self.work_start_date.isoformat() if self.work_start_date else None,
                "endDate": self.work_end_date.isoformat() if self.work_end_date else None,
                "isCurrent": self.work_is_current,
                "displayText": self._format_work_display()
            },
            "education": {
                "institution": self.education_institution,
                "degree": self.education_degree,
                "field": self.education_field,
                "startDate": self.education_start_date.isoformat() if self.education_start_date else None,
                "endDate": self.education_end_date.isoformat() if self.education_end_date else None,
                "isCurrent": self.education_is_current,
                "displayText": self._format_education_display()
            },
            "location": {
                "currentCity": self.current_city,
                "hometown": self.hometown,
                "country": self.country,
                "displayText": self.current_city
            },
            "relationship": {
                "status": self.relationship_status,
                "partnerName": self.relationship_partner_name,
                "anniversary": self.relationship_anniversary.isoformat() if self.relationship_anniversary else None,
                "displayText": self._format_relationship_display()
            },
            "contact": {
                "websitePersonal": self.website_personal,
                "websiteProfessional": self.website_professional,
                "phoneMobile": self.phone_mobile,
                "phoneWork": self.phone_work
            },
            "additional": {
                "languages": self.languages,
                "interests": self.interests,
                "aboutMe": self.about_me
            },
            "privacy": {
                "showWorkInfo": self.show_work_info,
                "showEducationInfo": self.show_education_info,
                "showLocationInfo": self.show_location_info,
                "showRelationshipInfo": self.show_relationship_info,
                "showContactInfo": self.show_contact_info
            },
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat()
        }
    
    def _format_work_display(self):
        """Formatar informações de trabalho para exibição"""
        if not self.work_position and not self.work_company:
            return None
        
        if self.work_position and self.work_company:
            return f"{self.work_position} na {self.work_company}"
        elif self.work_position:
            return self.work_position
        else:
            return f"Trabalha na {self.work_company}"
    
    def _format_education_display(self):
        """Formatar informações de educação para exibição"""
        if not self.education_degree and not self.education_institution:
            return None
        
        if self.education_degree and self.education_institution:
            return f"{self.education_degree} - {self.education_institution}"
        elif self.education_degree:
            return self.education_degree
        else:
            return f"Estudou na {self.education_institution}"
    
    def _format_relationship_display(self):
        """Formatar informações de relacionamento para exibição"""
        if not self.relationship_status:
            return None
        
        status_map = {
            "single": "Solteiro(a)",
            "in_relationship": "Em um relacionamento",
            "married": "Casado(a)",
            "complicated": "É complicado",
            "divorced": "Divorciado(a)",
            "widowed": "Viúvo(a)"
        }
        
        status_text = status_map.get(self.relationship_status, self.relationship_status)
        
        if self.relationship_partner_name and self.relationship_status in ["in_relationship", "married"]:
            return f"{status_text} com {self.relationship_partner_name}"
        
        return status_text
