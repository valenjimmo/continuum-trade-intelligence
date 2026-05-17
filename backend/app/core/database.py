from collections.abc import Generator
import logging

from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()
logger = logging.getLogger(__name__)
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app.models import regime  # noqa: F401

    try:
        Base.metadata.create_all(bind=engine)
    except SQLAlchemyError as exc:
        logger.warning("Database initialization skipped after connection error: %s", exc)
