import re
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, require_teacher
from app.database import get_db
from app.models.resource import Resource, ResourceVersion
from app.models.sync import SyncRecord
from app.models.user import User
from app.schemas.resource import ResourceOut
from app.services.storage import save_upload

router = APIRouter(prefix="/api/resources", tags=["resources"])

def extract_years(value: str | None) -> list[int]:
    if not value:
        return []
    return [int(part) for part in re.findall(r"(?:19|20)\d{2}", value)]

def year_in_range(value: str | None, year_from: int | None, year_to: int | None) -> bool:
    if year_from is None and year_to is None:
        return True
    years = extract_years(value)
    if not years:
        return False
    low = year_from if year_from is not None else 0
    high = year_to if year_to is not None else 9999
    return any(low <= year <= high for year in years)

@router.get("", response_model=list[ResourceOut])
def list_resources(
    q: str | None = None,
    subject: str | None = None,
    class_level: str | None = None,
    resource_type: str | None = None,
    academic_year: str | None = None,
    year_from: int | None = Query(default=None),
    year_to: int | None = Query(default=None),
    mine: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Resource)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(or_(
            Resource.title.ilike(like),
            Resource.subject.ilike(like),
            Resource.class_level.ilike(like),
            Resource.description.ilike(like),
            Resource.academic_year.ilike(like),
        ))
    if subject:
        query = query.filter(Resource.subject == subject)
    if class_level:
        query = query.filter(Resource.class_level == class_level)
    if resource_type:
        query = query.filter(Resource.resource_type == resource_type)
    if academic_year:
        query = query.filter(Resource.academic_year == academic_year)
    if mine:
        query = query.filter(Resource.owner_id == current_user.id)
    rows = query.order_by(Resource.created_at.desc()).all()
    if year_from is not None or year_to is not None:
        rows = [row for row in rows if year_in_range(row.academic_year, year_from, year_to)]
    return rows

@router.get("/options")
def resource_options(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.query(Resource).all()
    subjects = sorted({row.subject for row in rows if row.subject})
    classes = sorted({row.class_level for row in rows if row.class_level})
    types = sorted({row.resource_type for row in rows if row.resource_type})
    years = sorted({year for row in rows for year in extract_years(row.academic_year)})
    return {"subjects": subjects, "class_levels": classes, "resource_types": types, "years": years}

@router.post("", response_model=ResourceOut)
def upload_resource(
    title: str = Form(...),
    subject: str = Form(...),
    class_level: str = Form(...),
    resource_type: str = Form("notes"),
    academic_year: str | None = Form(None),
    description: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    original, stored_path, size = save_upload(file)
    resource = Resource(
        title=title.strip(),
        description=description,
        subject=subject.strip(),
        class_level=class_level.strip(),
        resource_type=resource_type.strip() or "notes",
        academic_year=(academic_year or "").strip() or None,
        filename=original,
        stored_path=stored_path,
        mime_type=file.content_type,
        size_bytes=size,
        owner_id=current_user.id,
        sync_status="synced",
    )
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
