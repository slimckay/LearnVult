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
    if "is_verified" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0"))

def seed_demo_users() -> None:
    db = SessionLocal()
    try:
        def upsert(email, full_name, password, role, school, verified):
            user = db.query(User).filter(User.email == email).first()
            if user:
                user.is_verified = verified
                return
            db.add(User(full_name=full_name, email=email, hashed_password=hash_password(password), role=role, school_name=school, is_verified=verified))
        upsert("admin@learnvult.sl", "LearnVult Admin", "Admin123!", "admin", "LearnVult", True)
        upsert("teacher@learnvult.sl", "Aminata Teacher", "Teacher123!", "teacher", "Demo Secondary School", True)
        upsert("student@learnvult.sl", "Sorie Student", "Student123!", "student", "Demo Secondary School", True)
        db.commit()
    finally:
        db.close()

@app.on_event("startup")
def on_startup() -> None:
    ensure_schema()
    seed_demo_users()

@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name}
