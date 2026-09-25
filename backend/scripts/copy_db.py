"""Copy LearnVult tables from one Postgres database to another.

Usage from the backend folder, with the venv active:

    set SOURCE_DATABASE_URL=postgresql://...
    set DEST_DATABASE_URL=postgresql://...
    python -m scripts.copy_db
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.models.file_blob import FileBlob
from app.models.resource import Resource, ResourceVersion
from app.models.sync import SyncRecord
from app.models.user import User

TABLES = [User, FileBlob, Resource, ResourceVersion, SyncRecord]


def normalize(url: str) -> str:
    url = (url or "").strip().strip('"').strip("'")
    if url.startswith("postgres://"):
        url = "postgresql+psycopg2://" + url[len("postgres://"):]
    elif url.startswith("postgresql://") and "+psycopg2" not in url:
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    if url.startswith("postgresql") and "sslmode=" not in url:
        url += ("&" if "?" in url else "?") + "sslmode=require"
    return url


def copy_table(src, dest, model) -> int:
    rows = src.query(model).all()
    if not rows:
        return 0
    dest.bulk_save_objects(rows)
    dest.commit()
    return len(rows)


def reset_sequences(dest_engine) -> None:
    statements = [
        "SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1))",
        "SELECT setval(pg_get_serial_sequence('resources', 'id'), COALESCE((SELECT MAX(id) FROM resources), 1))",
        "SELECT setval(pg_get_serial_sequence('resource_versions', 'id'), COALESCE((SELECT MAX(id) FROM resource_versions), 1))",
        "SELECT setval(pg_get_serial_sequence('sync_records', 'id'), COALESCE((SELECT MAX(id) FROM sync_records), 1))",
    ]
    with dest_engine.begin() as conn:
        for sql in statements:
            try:
                conn.execute(text(sql))
            except Exception:
                pass


def main() -> None:
    source = normalize(os.environ.get("SOURCE_DATABASE_URL", ""))
    dest = normalize(os.environ.get("DEST_DATABASE_URL", ""))
    if not source or not dest:
        raise SystemExit("Set SOURCE_DATABASE_URL and DEST_DATABASE_URL first.")
    if source == dest:
        raise SystemExit("Source and destination are the same URL.")

    src_engine = create_engine(source, pool_pre_ping=True)
    dest_engine = create_engine(dest, pool_pre_ping=True)
    Src = sessionmaker(bind=src_engine)()
    Dest = sessionmaker(bind=dest_engine)()
    try:
        from app.database import Base

        Base.metadata.create_all(bind=dest_engine)
        print("Copying...")
        for model in TABLES:
            count = copy_table(Src, Dest, model)
            print(f"  {model.__tablename__}: {count}")
        reset_sequences(dest_engine)
        print("Done. Neon now has a copy of the Render data.")
    finally:
        Src.close()
        Dest.close()


if __name__ == "__main__":
    main()
