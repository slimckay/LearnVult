from pathlib import Path
from uuid import uuid4
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.config import settings
from app.models.file_blob import FileBlob

DB_PREFIX = "db:"

def save_upload(file: UploadFile, db: Session | None = None) -> tuple[str, str, int]:
    original = Path(file.filename or "resource.bin").name
    chunks: list[bytes] = []
    size = 0
    while True:
        chunk = file.file.read(1024 * 1024)
        if not chunk:
            break
        size += len(chunk)
        chunks.append(chunk)
    payload = b"".join(chunks)

    if settings.uses_postgres:
        if db is None:
            raise RuntimeError("Database session required to store files")
        blob_id = uuid4().hex
        db.add(FileBlob(
            id=blob_id,
            filename=original,
            mime_type=file.content_type,
            size_bytes=size,
            data=payload,
        ))
        db.flush()
        return original, f"{DB_PREFIX}{blob_id}", size

    folder = Path(settings.upload_dir)
    folder.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid4().hex}_{original}"
    destination = folder / stored_name
    destination.write_bytes(payload)
    return original, str(destination), size

def is_db_file(stored_path: str | None) -> bool:
    return bool(stored_path) and stored_path.startswith(DB_PREFIX)

def blob_id_from_path(stored_path: str) -> str:
    return stored_path[len(DB_PREFIX):]
