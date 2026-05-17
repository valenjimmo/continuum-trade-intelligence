import logging
from collections.abc import Callable
from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.regime import RegimeSnapshotRecord
from app.schemas.regime import RegimeSnapshot

logger = logging.getLogger(__name__)


class RegimeSnapshotRepository:
    def __init__(self, session_factory: Optional[Callable[[], Session]] = None) -> None:
        self.session_factory = session_factory or SessionLocal

    def save(self, snapshot: RegimeSnapshot) -> None:
        payload = snapshot.model_dump(mode="json")
        record = RegimeSnapshotRecord(
            symbol=snapshot.symbol,
            timestamp=snapshot.timestamp,
            timeframe=snapshot.timeframe,
            regime=snapshot.regime.value,
            confidence=snapshot.confidence.value,
            confidence_score=snapshot.confidence_score,
            engine_version=snapshot.engine_version,
            payload=payload,
        )
        try:
            with self.session_factory() as session:
                session.add(record)
                session.commit()
        except SQLAlchemyError as exc:
            logger.warning("Skipping regime snapshot persistence after database error: %s", exc)

    def recent(self, symbol: str, limit: int = 50) -> list[RegimeSnapshot]:
        limit = max(1, min(limit, 500))
        try:
            with self.session_factory() as session:
                records = session.scalars(
                    select(RegimeSnapshotRecord)
                    .where(RegimeSnapshotRecord.symbol == symbol.upper())
                    .order_by(RegimeSnapshotRecord.timestamp.desc(), RegimeSnapshotRecord.id.desc())
                    .limit(limit)
                ).all()
        except SQLAlchemyError as exc:
            logger.warning("Returning empty regime history after database error: %s", exc)
            return []

        return [RegimeSnapshot.model_validate(record.payload) for record in records]
