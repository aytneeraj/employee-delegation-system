import uuid

def test_list_users(client, employee_headers):
    response = client.get("/api/v1/users", headers=employee_headers)
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 7


def test_admin_create_user(client, admin_headers):
    unique_suffix = uuid.uuid4().hex[:6]
    payload = {
        "employee_id": f"EMP{unique_suffix.upper()}",
        "full_name": "New Junior Dev",
        "email": f"junior.{unique_suffix}@company.com",
        "password": "JuniorPassword@123",
        "role": "employee",
        "designation": "Junior Frontend Engineer",
    }
    response = client.post("/api/v1/users", json=payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["employee_id"] == payload["employee_id"]
    assert data["email"] == payload["email"]


def test_non_admin_cannot_create_user(client, employee_headers):
    unique_suffix = uuid.uuid4().hex[:6]
    payload = {
        "employee_id": f"EMP{unique_suffix.upper()}",
        "full_name": "Unauthorized Dev",
        "email": f"unauth.{unique_suffix}@company.com",
        "password": "Password@123",
        "role": "employee",
        "designation": "Developer",
    }
    response = client.post("/api/v1/users", json=payload, headers=employee_headers)
    assert response.status_code == 403


def test_duplicate_email_rejected(client, admin_headers):
    payload = {
        "employee_id": "EMP_DUP",
        "full_name": "Duplicate Dev",
        "email": "admin@company.com",  # Already exists
        "password": "Password@123",
        "role": "employee",
        "designation": "Developer",
    }
    response = client.post("/api/v1/users", json=payload, headers=admin_headers)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_admin_toggle_user_status(client, admin_headers, db):
    # Get an employee
    from app.models.user import User
    emp = db.query(User).filter(User.email == "elena.ai@company.com").first()

    # Deactivate
    response = client.patch(f"/api/v1/users/{emp.id}/status", json={"is_active": False}, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["is_active"] is False

    # Reactivate
    response = client.patch(f"/api/v1/users/{emp.id}/status", json={"is_active": True}, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["is_active"] is True
