from datetime import datetime, timedelta
from secrets import randbelow
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.user import User
from app.schemas.user import ForgotPasswordIn, ResetPasswordIn, TokenOut, UserCreate, UserLogin, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])
ALLOWED_ROLES = {"student", "teacher"}
RESET_HOURS = 2
UNKNOWN = "If that email is on LearnVult, use the code shown on this page to create a new password."

def assign_reset_code(user: User) -> str:
    code = f"{randbelow(1000000):06d}"
    user.reset_code_hash = hash_password(code)
    user.reset_expires_at = datetime.utcnow() + timedelta(hours=RESET_HOURS)
    user.reset_requested = True
    return code

@router.post("/register", response_model=TokenOut)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    role = payload.role.lower()
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Role must be student or teacher")
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        role=role,
        school_name=payload.school_name,
        is_verified=(role != "teacher"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.email, user.role)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))

@router.post("/login", response_model=TokenOut)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(user.email, user.role)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))

@router.post("/forgot")
def forgot_password(payload: ForgotPasswordIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        return {"ok": True, "detail": UNKNOWN, "code": None}
    code = assign_reset_code(user)
    db.commit()
    return {
        "ok": True,
        "code": code,
        "expires_in_hours": RESET_HOURS,
        "detail": "Use this code now to create a new password. It expires in 2 hours.",
    }

@router.post("/reset")
def reset_password(payload: ResetPasswordIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not user.reset_code_hash or not user.reset_expires_at:
        raise HTTPException(status_code=400, detail="Reset code is invalid or has expired")
    if user.reset_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset code is invalid or has expired")
    if not verify_password(payload.code.strip(), user.reset_code_hash):
        raise HTTPException(status_code=400, detail="Reset code is invalid or has expired")
    user.hashed_password = hash_password(payload.new_password)
    user.reset_code_hash = None
    user.reset_expires_at = None
    user.reset_requested = False
    db.commit()
    return {"ok": True, "detail": "Password updated. You can sign in now."}
