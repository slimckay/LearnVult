from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.api import admin, auth, resources, sync
from app.config import settings
from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.models import User

app = FastAPI(title=settings.app_name, version="0.2.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)
app.include_router(resources.router)
app.include_router(sync.router)
app.include_router(admin.router)

def ensure_schema() -> None:
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("users")}
    statements = []
    if "is_verified" not in columns:
        statements.append("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0")
    if "reset_code_hash" not in columns:
        statements.append("ALTER TABLE users ADD COLUMN reset_code_hash VARCHAR(255)")
    if "reset_expires_at" not in columns:
        statements.append("ALTER TABLE users ADD COLUMN reset_expires_at DATETIME")
    if "reset_requested" not in columns:
        statements.append("ALTER TABLE users ADD COLUMN reset_requested BOOLEAN DEFAULT 0")
    if statements:
        with engine.begin() as conn:
            for sql in statements:
                conn.execute(text(sql))

def seed_users() -> None:
    db = SessionLocal()
    try:
        teacher = db.query(User).filter(User.email == "teacher@learnvult.sl").first()
        if not teacher:
            db.add(User(
                full_name="Aminata Teacher",
                email="teacher@learnvult.sl",
                hashed_password=hash_password("Teacher123!"),
                role="teacher",
                school_name="Demo Secondary School",
                is_verified=True,
            ))
        student = db.query(User).filter(User.email == "student@learnvult.sl").first()
        if not student:
            db.add(User(
                full_name="Sorie Student",
                email="student@learnvult.sl",
                hashed_password=hash_password("Student123!"),
                role="student",
                school_name="Demo Secondary School",
                is_verified=True,
            ))

        email = (settings.admin_email or "").strip().lower()
        password = (settings.admin_password or "").strip()
        if email and password:
            admin_user = db.query(User).filter(User.email == email).first()
            if admin_user:
                admin_user.role = "admin"
                admin_user.is_verified = True
                admin_user.hashed_password = hash_password(password)
            else:
                db.add(User(
                    full_name=settings.admin_name or "LearnVult Admin",
                    email=email,
                    hashed_password=hash_password(password),
                    role="admin",
                    school_name="LearnVult",
                    is_verified=True,
                ))
        db.commit()
    finally:
        db.close()

@app.on_event("startup")
def on_startup() -> None:
    ensure_schema()
    seed_users()

@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name}
