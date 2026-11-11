from app.core.config import settings


def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@company.com", "password": settings.DEMO_ACCOUNT_PASSWORD}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@company.com"
    assert data["user"]["role"] == "admin"


def test_login_form_data_success(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@company.com", "password": settings.DEMO_ACCOUNT_PASSWORD}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_case_and_whitespace_insensitive(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "  ADMIN@Company.Com  ", "password": settings.DEMO_ACCOUNT_PASSWORD}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "admin@company.com"


def test_oauth2_token_endpoint(client):
    response = client.post(
        "/api/v1/auth/token",
        data={"username": "manager@company.com", "password": settings.DEMO_ACCOUNT_PASSWORD}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    assert data["docs_url"] == "/docs"
    assert data["health_check"] == "/api/health"


def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@company.com", "password": "WrongPassword!"}
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_login_nonexistent_email(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@company.com", "password": "Password123"}
    )
    assert response.status_code == 401


def test_get_me(client, employee_headers):
    response = client.get("/api/v1/auth/me", headers=employee_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "alex.dev@company.com"
    assert data["role"] == "employee"


def test_unauthenticated_request(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


