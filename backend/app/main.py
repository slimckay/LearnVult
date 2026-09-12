from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, resources, sync
from app.config import settings
from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.models import User

app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)
app.include_router(resources.router)
app.include_router(sync.router)

def seed_demo_users() -> None:
    db = SessionLocal()
    try:
        if db.query(User).count():
            return
        db.add_all([
            User(full_name="Aminata Teacher", email="teacher@learnvult.sl", hashed_password=hash_password("Teacher123!"), role="teacher", school_name="Demo Secondary School"),
            User(full_name="Sorie Student", email="student@learnvult.sl", hashed_password=hash_password("Student123!"), role="student", school_name="Demo Secondary School"),
        ])
        db.commit()
    finally:
        db.close()

@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    seed_demo_users()

@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name}
