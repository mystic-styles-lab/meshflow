from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class ConfigHistory(Base):
    __tablename__ = "config_history"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    content = Column(Text)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=True)
    admin = relationship("Admin")
    note = Column(String(255), nullable=True)
