from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Resource(Base):
    __tablename__ = "resources"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    subject: Mapped[str] = mapped_column(String(80), index=True)
    class_level: Mapped[str] = mapped_column(String(40), index=True)
    resource_type: Mapped[str] = mapped_column(String(40), default="notes")
    academic_year: Mapped[str | None] = mapped_column(String(20), nullable=True)
    filename: Mapped[str] = mapped_column(String(255))
    stored_path: Mapped[str] = mapped_column(String(500))
    mime_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    version: Mapped[int] = mapped_column(Integer, default=1)
    sync_status: Mapped[str] = mapped_column(String(20), default="synced")
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    owner = relationship("User", back_populates="resources")
    versions = relationship("ResourceVersion", back_populates="resource")

class ResourceVersion(Base):
    __tablename__ = "resource_versions"
    id: Mapped[int] = mapped_column(primary_key=True)
    resource_id: Mapped[int] = mapped_column(ForeignKey("resources.id"))
    version: Mapped[int] = mapped_column(Integer)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    resource = relationship("Resource", back_populates="versions")
