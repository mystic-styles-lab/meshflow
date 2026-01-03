from pydantic import BaseModel


class CoreStats(BaseModel):
    version: str
    started: bool
    logs_websocket: str


from datetime import datetime
from typing import Optional

class ConfigHistoryResponse(BaseModel):
    id: int
    created_at: datetime
    content: str
    admin_id: Optional[int]
    note: Optional[str]

    class Config:
        orm_mode = True
