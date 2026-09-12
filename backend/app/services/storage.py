from pathlib import Path
from uuid import uuid4
from fastapi import UploadFile
from app.config import settings

def save_upload(file: UploadFile) -> tuple[str, str, int]:
    folder = Path(settings.upload_dir)
    folder.mkdir(parents=True, exist_ok=True)
    original = Path(file.filename or "resource.bin").name
    stored_name = f"{uuid4().hex}_{original}"
    destination = folder / stored_name
    size = 0
    with destination.open("wb") as buffer:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            buffer.write(chunk)
    return original, str(destination), size
