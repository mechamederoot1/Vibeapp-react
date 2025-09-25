#!/usr/bin/env python3
"""
Migration script to create work experience and education tables
and migrate existing data from personal_info table
"""

import os
import sys
from datetime import datetime

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.database import engine, SessionLocal, Base
from app.models.user import User
from app.models.personal_info import PersonalInfo
from app.models.work_experience import WorkExperience
from app.models.education import Education
from sqlalchemy import inspect

def migrate_work_education():
    """Migrate existing work and education data to new tables"""
    print("🔄 Starting migration for work experience and education...")
    
    # Create all tables
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False
    
    # Check if new tables exist
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    if 'work_experiences' not in existing_tables:
        print("��� work_experiences table not found")
        return False
    
    if 'education' not in existing_tables:
        print("❌ education table not found")
        return False
    
    print("✅ New tables verified")
    
    # Start migration
    db = SessionLocal()
    try:
        # Get all personal info records with work or education data
        personal_infos = db.query(PersonalInfo).filter(
            (PersonalInfo.work_company.isnot(None)) |
            (PersonalInfo.education_institution.isnot(None))
        ).all()
        
        print(f"📋 Found {len(personal_infos)} personal info records to migrate")
        
        migrated_work = 0
        migrated_education = 0
        
        for personal_info in personal_infos:
            user_id = personal_info.user_id
            
            # Migrate work experience
            if personal_info.work_company or personal_info.work_position:
                # Check if already migrated
                existing_work = db.query(WorkExperience).filter(
                    WorkExperience.user_id == user_id
                ).first()
                
                if not existing_work:
                    work_experience = WorkExperience(
                        user_id=user_id,
                        company=personal_info.work_company or "Empresa",
                        position=personal_info.work_position or "Cargo",
                        description=personal_info.work_description,
                        start_date=personal_info.work_start_date,
                        end_date=personal_info.work_end_date,
                        is_current=personal_info.work_is_current or False,
                        order_index=0
                    )
                    db.add(work_experience)
                    migrated_work += 1
                    print(f"  ➕ Migrated work experience for user {user_id}")
            
            # Migrate education
            if personal_info.education_institution or personal_info.education_degree:
                # Check if already migrated
                existing_education = db.query(Education).filter(
                    Education.user_id == user_id
                ).first()
                
                if not existing_education:
                    education = Education(
                        user_id=user_id,
                        institution=personal_info.education_institution or "Instituição",
                        degree=personal_info.education_degree or "Curso",
                        field=personal_info.education_field,
                        start_date=personal_info.education_start_date,
                        end_date=personal_info.education_end_date,
                        is_current=personal_info.education_is_current or False,
                        order_index=0
                    )
                    db.add(education)
                    migrated_education += 1
                    print(f"  ➕ Migrated education for user {user_id}")
        
        # Commit all changes
        db.commit()
        
        print(f"✅ Migration completed successfully!")
        print(f"   - Work experiences migrated: {migrated_work}")
        print(f"   - Education entries migrated: {migrated_education}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def verify_migration():
    """Verify the migration was successful"""
    print("\n🔍 Verifying migration...")
    
    db = SessionLocal()
    try:
        work_count = db.query(WorkExperience).count()
        education_count = db.query(Education).count()
        
        print(f"📊 Current counts:")
        print(f"   - Work experiences: {work_count}")
        print(f"   - Education entries: {education_count}")
        
        # Sample some records
        if work_count > 0:
            sample_work = db.query(WorkExperience).first()
            print(f"   - Sample work: {sample_work.position} at {sample_work.company}")
        
        if education_count > 0:
            sample_education = db.query(Education).first()
            print(f"   - Sample education: {sample_education.degree} at {sample_education.institution}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Work Experience and Education Migration Script")
    print("=" * 50)
    
    success = migrate_work_education()
    if success:
        verify_migration()
        print("\n✅ Migration completed successfully!")
        print("💡 You can now use the new multiple work experiences and education features.")
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)
