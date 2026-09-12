from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.database import get_db
from app.models.sync import SyncRecord
from app.models.user import User
from app.schemas.resource import SyncRecordOut

router = APIRouter(prefix="/api/sync", tags=["sync"])

@router.get("/status", response_model=list[SyncRecordOut])
def list_sync_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(SyncRecord).order_by(SyncRecord.created_at.desc())
    if current_user.role != "admin":
        query = query.filter(SyncRecord.user_id == current_user.id)
    return query.limit(50).all()

@router.post("/flush")
def flush_pending(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pending = db.query(SyncRecord).filter(SyncRecord.user_id == current_user.id, SyncRecord.status == "pending").all()
    for record in pending:
        record.status = "synced"
        record.detail = "Flushed when connection returned"
    db.commit()
    return {"flushed": len(pending)}
