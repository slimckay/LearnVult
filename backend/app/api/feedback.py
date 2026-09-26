from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.database import get_db
from app.models.feedback import Feedback
from app.models.user import User

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

class FeedbackIn(BaseModel):
    category: str = "suggestion"
    message: str = Field(min_length=8, max_length=2000)

@router.post("")
def create_feedback(payload: FeedbackIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    category = (payload.category or "suggestion").strip().lower()
    if category not in {"suggestion", "problem", "praise"}:
        category = "suggestion"
    text = payload.message.strip()
    if len(text) < 8:
        raise HTTPException(status_code=400, detail="Please write a little more so we can understand.")
    row = Feedback(user_id=user.id, category=category, message=text)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"ok": True, "id": row.id, "detail": "Thank you. The LearnVult team can read this."}
