from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.auth import assign_reset_code
from app.api.deps import require_admin
from app.core.security import hash_password
from app.database import get_db
from app.models.feedback import Feedback
from app.models.file_blob import FileBlob
from app.models.resource import Resource, ResourceVersion
from app.models.sync import SyncRecord
from app.models.user import User
from app.schemas.user import AdminPasswordIn, UserOut
from app.services.storage import blob_id_from_path, is_db_file

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/summary")
def summary(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).count()
    teachers = db.query(User).filter(User.role == "teacher").count()
    pending = db.query(User).filter(User.role == "teacher", User.is_verified.is_(False)).count()
    resets = db.query(User).filter(User.reset_requested.is_(True)).count()
    resources = db.query(Resource).count()
    notes = db.query(Feedback).count()
    return {"users": users, "teachers": teachers, "pending_teachers": pending, "password_resets": resets, "resources": resources, "feedback": notes}

@router.get("/users", response_model=list[UserOut])
def list_users(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.post("/users/{user_id}/verify", response_model=UserOut)
def verify_teacher(user_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != "teacher":
        raise HTTPException(status_code=400, detail="Only teachers can be verified")
    user.is_verified = True
    db.commit()
    db.refresh(user)
    return user

@router.post("/users/{user_id}/unverify", response_model=UserOut)
def unverify_teacher(user_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != "teacher":
        raise HTTPException(status_code=400, detail="Only teachers can be unverified")
    user.is_verified = False
    db.commit()
    db.refresh(user)
    return user

@router.post("/users/{user_id}/reset-code")
def issue_reset_code(user_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Use environment variables to change the admin password")
    code = assign_reset_code(user)
    db.commit()
    return {"ok": True, "email": user.email, "code": code, "detail": f"Give {user.full_name} this code. It expires in 2 hours."}

@router.post("/users/{user_id}/password", response_model=UserOut)
def set_password(user_id: int, payload: AdminPasswordIn, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Use environment variables to change the admin password")
    user.hashed_password = hash_password(payload.password)
    user.reset_code_hash = None
    user.reset_expires_at = None
    user.reset_requested = False
    db.commit()
    db.refresh(user)
    return user

@router.get("/resources")
def list_all_resources(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.query(Resource).order_by(Resource.created_at.desc()).all()
    out = []
    for item in rows:
        owner = item.owner
        out.append({
            "id": item.id,
            "title": item.title,
            "subject": item.subject,
            "class_level": item.class_level,
            "resource_type": item.resource_type,
            "filename": item.filename,
            "owner_id": item.owner_id,
            "owner_name": owner.full_name if owner else None,
            "owner_email": owner.email if owner else None,
            "created_at": item.created_at,
        })
    return out

@router.delete("/resources/{resource_id}")
def delete_resource(resource_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    stored_path = resource.stored_path
    db.query(SyncRecord).filter(SyncRecord.resource_id == resource_id).delete()
    db.query(ResourceVersion).filter(ResourceVersion.resource_id == resource_id).delete()
    db.delete(resource)
    if is_db_file(stored_path):
        blob = db.query(FileBlob).filter(FileBlob.id == blob_id_from_path(stored_path)).first()
        if blob:
            db.delete(blob)
    db.commit()
    if stored_path and not is_db_file(stored_path):
        path = Path(stored_path)
        if path.exists():
            path.unlink()
    return {"ok": True, "deleted": resource_id}

@router.get("/feedback")
def list_feedback(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.query(Feedback).order_by(Feedback.created_at.desc()).all()
    people = {user.id: user for user in db.query(User).all()}
    out = []
    for row in rows:
        person = people.get(row.user_id)
        out.append({
            "id": row.id,
            "category": row.category,
            "message": row.message,
            "created_at": row.created_at,
            "user_id": row.user_id,
            "user_name": person.full_name if person else "Unknown",
            "user_email": person.email if person else None,
            "user_role": person.role if person else None,
        })
    return out

@router.delete("/feedback/{feedback_id}")
def delete_feedback(feedback_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Feedback not found")
    db.delete(row)
    db.commit()
    return {"ok": True}
