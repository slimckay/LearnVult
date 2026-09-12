from datetime import datetime
from pydantic import BaseModel

class ResourceOut(BaseModel):
    id: int
    title: str
    description: str | None
    subject: str
    class_level: str
    resource_type: str
    academic_year: str | None
    filename: str
    mime_type: str | None
    size_bytes: int
    version: int
    sync_status: str
    owner_id: int
    created_at: datetime
    model_config = {"from_attributes": True}

class SyncRecordOut(BaseModel):
    id: int
    resource_id: int | None
    action: str
    status: str
    detail: str | None
    created_at: datetime
    model_config = {"from_attributes": True}
