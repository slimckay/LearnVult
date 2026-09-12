from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.user import User
from app.schemas.user import TokenOut, UserCreate, UserLogin, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])
ALLOWED_ROLES = {"student", "teacher", "admin"}

@router.post("/register", response_model=TokenOut)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    role = payload.role.lower()
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Role must be student, teacher, or admin")
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(full_name=payload.full_name.strip(), email=payload.email.lower(), hashed_password=hash_password(payload.password), role=role, school_name=payload.school_name)
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
