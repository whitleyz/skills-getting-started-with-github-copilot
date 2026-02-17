from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Should return the activities mapping and contain known keys
    assert isinstance(data, dict)
    assert "Basketball" in data


def test_signup_and_duplicate_blocked():
    activity = "Basketball"
    email = "testuser@example.com"

    # Ensure not already present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Sign up
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Signed up {email} for {activity}"
    assert email in activities[activity]["participants"]

    # Duplicate signup should be rejected
    resp2 = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp2.status_code == 400

    # Cleanup
    activities[activity]["participants"].remove(email)


def test_unregister_participant():
    activity = "Tennis"
    email = "unregister-me@example.com"

    # Add if missing
    if email not in activities[activity]["participants"]:
        activities[activity]["participants"].append(email)

    # Unregister via DELETE
    resp = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Unregistered {email} from {activity}"
    assert email not in activities[activity]["participants"]


def test_unregister_nonexistent():
    activity = "Tennis"
    email = "not-registered@example.com"

    # Ensure not present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    resp = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 400

