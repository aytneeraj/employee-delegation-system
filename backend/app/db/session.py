import logging
import os
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger(__name__)

# Determine active database engine
is_mysql = False
db_url = settings.DATABASE_URL

if "YOUR_PASSWORD_HERE" not in db_url:
    try:
        # Try MySQL connection
        test_engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={"charset": "utf8mb4"}
        )
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = test_engine
        is_mysql = True
        logger.info("[Database] Connected successfully to MySQL at %s", db_url.split("@")[-1])
    except Exception as exc:
        logger.warning("[Database] Could not connect to MySQL: %s", exc)
        if settings.SQLITE_FALLBACK:
            sqlite_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), settings.SQLITE_DB_PATH)
            sqlite_url = f"sqlite:///{sqlite_path}"
            logger.info("[Database] Falling back to SQLite dev database: %s", sqlite_url)
            engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        else:
            raise exc
else:
    if settings.SQLITE_FALLBACK:
        sqlite_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), settings.SQLITE_DB_PATH)
        sqlite_url = f"sqlite:///{sqlite_path}"
        logger.info("[Database] MySQL placeholder detected. Initializing SQLite dev engine: %s", sqlite_url)
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(db_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining a SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
