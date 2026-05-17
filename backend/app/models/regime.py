from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RegimeSnapshotRecord(Base):
    __tablename__ = "regime_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    symbol: Mapped[str] = mapped_column(String(16), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    timeframe: Mapped[str] = mapped_column(String(16), index=True)
    regime: Mapped[str] = mapped_column(String(48), index=True)
    confidence: Mapped[str] = mapped_column(String(16))
    confidence_score: Mapped[int] = mapped_column(Integer)
    engine_version: Mapped[str] = mapped_column(String(64), index=True)
    payload: Mapped[dict] = mapped_column(JSONB)
