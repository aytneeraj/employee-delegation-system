from datetime import date, timedelta
from app.models.user import User


def test_manager_create_task_for_employee(client, manager_headers, db):
    emp = db.query(User).filter(User.email == "alex.dev@company.com").first()
    payload = {
        "title": "Build Graph Dashboard",
        "description": "Implement Recharts visualization for workload analytics.",
        "current_assignee_id": emp.id,
        "priority": "high",
        "due_date": (date.today() + timedelta(days=5)).isoformat(),
    }
    response = client.post("/api/v1/tasks", json=payload, headers=manager_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Build Graph Dashboard"
    assert data["status"] == "assigned"
    assert data["current_assignee_id"] == emp.id


def test_employee_cannot_assign_task_to_self(client, employee_headers, db):
    alex = db.query(User).filter(User.email == "alex.dev@company.com").first()
    payload = {
        "title": "Self Assigned Task",
        "description": "Should be rejected by validation rule.",
        "current_assignee_id": alex.id,  # Same as current user!
        "priority": "medium",
        "due_date": (date.today() + timedelta(days=5)).isoformat(),
    }
    response = client.post("/api/v1/tasks", json=payload, headers=employee_headers)
    assert response.status_code == 400
    assert "cannot assign tasks to themselves" in response.json()["detail"]


def test_employee_can_assign_task_to_another_employee(client, employee_headers, db):
    david = db.query(User).filter(User.email == "david.backend@company.com").first()
    payload = {
        "title": "Database Indexing Optimization",
        "description": "Optimize task search queries.",
        "current_assignee_id": david.id,
        "priority": "medium",
        "due_date": (date.today() + timedelta(days=4)).isoformat(),
    }
    response = client.post("/api/v1/tasks", json=payload, headers=employee_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "assigned"
    assert data["current_assignee_id"] == david.id


def test_employee_to_employee_delegation_workflow(client, employee_headers, second_employee_headers, db):
    # Step 1: Find task TSK-1001 which is assigned to Alex
    alex = db.query(User).filter(User.email == "alex.dev@company.com").first()
    david = db.query(User).filter(User.email == "david.backend@company.com").first()

    # Create a fresh task assigned to Alex
    create_resp = client.post(
        "/api/v1/tasks",
        json={
            "title": "Frontend Microservice Gateway",
            "description": "Build proxy route.",
            "current_assignee_id": alex.id,
            "priority": "high",
            "due_date": (date.today() + timedelta(days=7)).isoformat()
        },
        headers=second_employee_headers  # David creates for Alex
    )
    assert create_resp.status_code == 201
    task_id = create_resp.json()["id"]

    # Step 2: Alex delegates this task to Priya (QA)
    priya = db.query(User).filter(User.email == "priya.qa@company.com").first()
    delegate_resp = client.post(
        f"/api/v1/tasks/{task_id}/delegate",
        json={
            "to_user_id": priya.id,
            "reassignment_reason": "Delegating integration testing to Priya."
        },
        headers=employee_headers  # Alex delegates
    )
    assert delegate_resp.status_code == 200
    delegated_task = delegate_resp.json()
    assert delegated_task["current_assignee_id"] == priya.id
    assert delegated_task["delegated_by_id"] == alex.id
    assert delegated_task["status"] == "assigned"

    # Step 3: Verify delegation history is preserved
    hist_resp = client.get(f"/api/v1/tasks/{task_id}/history", headers=employee_headers)
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert len(history) == 2  # Initial assignment + delegation!
    assert history[0]["is_current"] is True
    assert history[0]["to_user_id"] == priya.id
    assert history[1]["is_current"] is False


def test_status_workflow_and_review_approval(client, employee_headers, second_employee_headers, db):
    alex = db.query(User).filter(User.email == "alex.dev@company.com").first()
    david = db.query(User).filter(User.email == "david.backend@company.com").first()

    # Alex assigns task to David
    create_resp = client.post(
        "/api/v1/tasks",
        json={
            "title": "API Documentation Swagger Gen",
            "description": "Generate OpenAPI specs.",
            "current_assignee_id": david.id,
            "priority": "low",
            "due_date": (date.today() + timedelta(days=3)).isoformat()
        },
        headers=employee_headers
    )
    task_id = create_resp.json()["id"]

    # 1. David accepts task
    accept_resp = client.patch(
        f"/api/v1/tasks/{task_id}/status",
        json={"status": "accepted", "comment": "Accepted assignment."},
        headers=second_employee_headers
    )
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "accepted"

    # 2. David moves to in_progress
    prog_resp = client.patch(
        f"/api/v1/tasks/{task_id}/status",
        json={"status": "in_progress", "comment": "Started writing docs."},
        headers=second_employee_headers
    )
    assert prog_resp.status_code == 200
    assert prog_resp.json()["status"] == "in_progress"

    # 3. David submits for review
    review_resp = client.patch(
        f"/api/v1/tasks/{task_id}/status",
        json={"status": "under_review", "comment": "Documentation ready for review."},
        headers=second_employee_headers
    )
    assert review_resp.status_code == 200
    assert review_resp.json()["status"] == "under_review"

    # 4. David tries to complete it himself -> FORBIDDEN!
    direct_complete_resp = client.patch(
        f"/api/v1/tasks/{task_id}/status",
        json={"status": "completed", "comment": "I complete it myself."},
        headers=second_employee_headers
    )
    assert direct_complete_resp.status_code == 403
    assert "Employees cannot directly complete their own tasks" in direct_complete_resp.json()["detail"]

    # 5. Alex (the delegator) requests revisions
    rev_resp = client.patch(
        f"/api/v1/tasks/{task_id}/status",
        json={"status": "revision_required", "comment": "Please add schemas for /tasks endpoint."},
        headers=employee_headers
    )
    assert rev_resp.status_code == 200
    assert rev_resp.json()["status"] == "revision_required"

    # 6. David resubmits for review
    resubmit_resp = client.patch(
        f"/api/v1/tasks/{task_id}/status",
        json={"status": "under_review", "comment": "Added schemas."},
        headers=second_employee_headers
    )
    assert resubmit_resp.status_code == 200

    # 7. Alex approves and marks completed
    approved_resp = client.patch(
        f"/api/v1/tasks/{task_id}/status",
        json={"status": "completed", "comment": "Looks fantastic. Approved!"},
        headers=employee_headers
    )
    assert approved_resp.status_code == 200
    assert approved_resp.json()["status"] == "completed"
    assert approved_resp.json()["completed_at"] is not None


def test_my_tasks_and_delegated_by_me(client, employee_headers):
    # My assigned tasks
    my_tasks = client.get("/api/v1/tasks/my-tasks", headers=employee_headers)
    assert my_tasks.status_code == 200
    assert isinstance(my_tasks.json(), list)

    # Tasks delegated by me
    delegated = client.get("/api/v1/tasks/delegated-by-me", headers=employee_headers)
    assert delegated.status_code == 200
    assert isinstance(delegated.json(), list)

