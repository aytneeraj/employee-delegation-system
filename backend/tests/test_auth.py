def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@company.com", "password": "AdminPassword@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@company.com"
    assert data["user"]["role"] == "admin"


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
