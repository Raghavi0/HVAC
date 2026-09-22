from collections.abc import Generator
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from .config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def migrate_organization_columns() -> None:
    """Keep the local demo database usable after adding organization scoping."""
    inspector = inspect(engine)
    with engine.begin() as connection:
        if "users" in inspector.get_table_names() and "organization_id" not in {column["name"] for column in inspector.get_columns("users")}:
            connection.execute(text("ALTER TABLE users ADD COLUMN organization_id VARCHAR(36)"))
        if "buildings" in inspector.get_table_names() and "organization_id" not in {column["name"] for column in inspector.get_columns("buildings")}:
            connection.execute(text("ALTER TABLE buildings ADD COLUMN organization_id VARCHAR(36)"))
