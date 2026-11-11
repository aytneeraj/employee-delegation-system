import pytest
import os
import sys

# Ensure backend folder is on python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.db.seed import seed_database
from app.core.security import create_access_token
from app.models.user import User, UserRole

# Use in-memory SQLite database with StaticPool for tests
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers(db):
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    token = create_access_token(subject=admin.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def manager_headers(db):
    manager = db.query(User).filter(User.role == UserRole.MANAGER).first()
    token = create_access_token(subject=manager.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def employee_headers(db):
    emp = db.query(User).filter(User.email == "alex.dev@company.com").first()
    token = create_access_token(subject=emp.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_employee_headers(db):
    emp = db.query(User).filter(User.email == "david.backend@company.com").first()
    token = create_access_token(subject=emp.id)
    return {"Authorization": f"Bearer {token}"}

