from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import settings

url = settings.sqlalchemy_url
connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
engine_kwargs = {"connect_args": connect_args}
if settings.uses_postgres:
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
