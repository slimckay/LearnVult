from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, require_teacher
from app.database import get_db
from app.models.resource import Resource, ResourceVersion
from app.models.sync import SyncRecord
from app.models.user import User
from app.schemas.resource import ResourceOut
from app.services.storage import save_upload

router = APIRouter(prefix="/api/resources", tags=["resources"])

@router.get("", response_model=list[ResourceOut])
def list_resources(q: str | None = None, subject: str | None = None, class_level: str | None = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    query = db.query(Resource)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(Resource.title.ilike(like))
    if subject:
        query = query.filter(Resource.subject == subject)
    if class_level:
        query = query.filter(Resource.class_level == class_level)
    return query.order_by(Resource.created_at.desc()).all()

@router.post("", response_model=ResourceOut)
def upload_resource(title: str = Form(...), subject: str = Form(...), class_level: str = Form(...), resource_type: str = Form("notes"), academic_year: str | None = Form(None), description: str | None = Form(None), file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(require_teacher)):
    original, stored_path, size = save_upload(file)
    resource = Resource(title=title.strip(), description=description, subject=subject.strip(), class_level=class_level.strip(), resource_type=resource_type.strip() or "notes", academic_year=academic_year, filename=original, stored_path=stored_path, mime_type=file.content_type, size_bytes=size, owner_id=current_user.id, sync_status="synced")
    db.add(resource)
    db.flush()
    db.add(ResourceVersion(resource_id=resource.id, version=1, note="Initial upload"))
    db.add(SyncRecord(user_id=current_user.id, resource_id=resource.id, action="upload", status="synced", detail="Uploaded while online"))
    db.commit()
    db.refresh(resource)
    return resource

@router.get("/{resource_id}", response_model=ResourceOut)
def get_resource(resource_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource

@router.get("/{resource_id}/download")
def download_resource(resource_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    path = Path(resource.stored_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File missing on server")
    return FileResponse(path, filename=resource.filename, media_type=resource.mime_type)
