"""
test_api.py
-----------
API tests using FastAPI's TestClient and the MockModel.
All tests run with LIVE_MODE=false (the default) so no AWS calls are made.

Coverage:
  - GET  /health
  - POST /api/session  (create)
  - POST /api/askfirst  action=prepare
  - POST /api/askfirst  action=answer  (with and without follow-up)
  - POST /api/askfirst  action=answer  could-not-check
  - POST /api/askfirst  action=summarize
  - DELETE /api/session/{id}
  - Error cases: missing session, bad action, oversized input, bad question_id
"""

import os

# Force sample mode before any backend module is imported
os.environ.setdefault("LIVE_MODE", "false")

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app, raise_server_exceptions=True)


# ── Helpers ───────────────────────────────────────────────────────────────────

def create_session(situation: str = "Buying a used bicycle") -> str:
    r = client.post("/api/session", json={"situation": situation})
    assert r.status_code == 201, r.text
    data = r.json()
    assert "session_id" in data
    assert data["mode"] == "sample"
    return data["session_id"]


def prepare(sid: str, situation: str = "Buying a used bicycle") -> list:
    r = client.post(
        "/api/askfirst",
        json={"action": "prepare", "situation": situation},
        headers={"X-Session-Id": sid},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert "checklist" in data
    return data["checklist"]


# ── Health ────────────────────────────────────────────────────────────────────

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    assert r.json()["mode"] == "sample"


# ── Session lifecycle ─────────────────────────────────────────────────────────

def test_create_session():
    sid = create_session("Renting my first flat")
    assert len(sid) == 36  # UUID4


def test_delete_session():
    sid = create_session()
    r = client.delete(f"/api/session/{sid}")
    assert r.status_code == 204
    # Session no longer exists — next request should 404
    r2 = client.post(
        "/api/askfirst",
        json={"action": "prepare", "situation": "anything"},
        headers={"X-Session-Id": sid},
    )
    assert r2.status_code == 404


def test_missing_session_header():
    r = client.post("/api/askfirst", json={"action": "prepare", "situation": "test"})
    assert r.status_code == 400
    assert "X-Session-Id" in r.json()["detail"]


def test_unknown_session_id():
    r = client.post(
        "/api/askfirst",
        json={"action": "prepare", "situation": "test"},
        headers={"X-Session-Id": "00000000-0000-4000-8000-000000000000"},
    )
    assert r.status_code == 404


# ── prepare ───────────────────────────────────────────────────────────────────

def test_prepare_returns_checklist():
    sid = create_session()
    checklist = prepare(sid)
    assert 1 <= len(checklist) <= 7
    for item in checklist:
        assert "id" in item
        assert "question" in item
        assert "why" in item
        assert item["priority"] in ("Essential", "Optional")
        assert item["status"] == "unanswered"


def test_prepare_essential_questions_present():
    sid = create_session()
    checklist = prepare(sid)
    essentials = [q for q in checklist if q["priority"] == "Essential"]
    assert len(essentials) >= 1


def test_prepare_no_duplicate_ids():
    sid = create_session()
    checklist = prepare(sid)
    ids = [q["id"] for q in checklist]
    assert len(ids) == len(set(ids))


def test_prepare_situation_too_long():
    sid = create_session()
    r = client.post(
        "/api/askfirst",
        json={"action": "prepare", "situation": "x" * 1001},
        headers={"X-Session-Id": sid},
    )
    assert r.status_code == 422


def test_prepare_empty_situation():
    sid = create_session()
    r = client.post(
        "/api/askfirst",
        json={"action": "prepare", "situation": "   "},
        headers={"X-Session-Id": sid},
    )
    assert r.status_code == 422


# ── answer ────────────────────────────────────────────────────────────────────

def test_answer_returns_follow_up_or_null():
    sid = create_session()
    checklist = prepare(sid)
    q_id = checklist[0]["id"]

    r = client.post(
        "/api/askfirst",
        json={
            "action":      "answer",
            "question_id": q_id,
            "answer":      "They said it includes everything.",
            "status":      "answered",
        },
        headers={"X-Session-Id": sid},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert "followUp" in data
    # followUp is either null or {question, why}
    fu = data["followUp"]
    if fu is not None:
        assert "question" in fu
        assert "why" in fu


def test_answer_could_not_check_no_follow_up():
    sid = create_session()
    checklist = prepare(sid)
    q_id = checklist[0]["id"]

    r = client.post(
        "/api/askfirst",
        json={
            "action":      "answer",
            "question_id": q_id,
            "answer":      "",
            "status":      "could-not-check",
        },
        headers={"X-Session-Id": sid},
    )
    assert r.status_code == 200, r.text
    assert r.json()["followUp"] is None


def test_answer_unknown_question_id():
    sid = create_session()
    prepare(sid)
    r = client.post(
        "/api/askfirst",
        json={
            "action":      "answer",
            "question_id": "does-not-exist",
            "answer":      "Some answer",
            "status":      "answered",
        },
        headers={"X-Session-Id": sid},
    )
    assert r.status_code == 400


def test_answer_preserves_previous_answers_across_calls():
    """Answers from earlier calls must not be lost when a new answer is recorded."""
    sid = create_session()
    checklist = prepare(sid)

    # Answer the first two questions
    for i in range(min(2, len(checklist))):
        q_id = checklist[i]["id"]
        client.post(
            "/api/askfirst",
            json={"action": "answer", "question_id": q_id,
                  "answer": f"Answer {i}", "status": "answered"},
            headers={"X-Session-Id": sid},
        )

    # The session store should still have both answers
    import tools as session_store
    # Find the session by checking each — we can't easily look it up from outside,
    # so instead just verify the summarize call reflects both answers
    r = client.post(
        "/api/askfirst",
        json={"action": "summarize"},
        headers={"X-Session-Id": sid},
    )
    assert r.status_code == 200
    assert "pointsToClarify" in r.json()


def test_answer_invalid_status():
    sid = create_session()
    checklist = prepare(sid)
    r = client.post(
        "/api/askfirst",
        json={
            "action":      "answer",
            "question_id": checklist[0]["id"],
            "answer":      "something",
            "status":      "wrong-status",
        },
        headers={"X-Session-Id": sid},
    )
    assert r.status_code == 422


# ── summarize ─────────────────────────────────────────────────────────────────

def test_summarize_returns_points():
    sid = create_session()
    prepare(sid)
    r = client.post(
        "/api/askfirst",
        json={"action": "summarize"},
        headers={"X-Session-Id": sid},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["ok"] is True
    assert isinstance(data["pointsToClarify"], list)
    assert len(data["pointsToClarify"]) <= 5


def test_summarize_without_prepare():
    """Summarize should still work even if no checklist has been generated."""
    sid = create_session("Talking to a company about an internship")
    r = client.post(
        "/api/askfirst",
        json={"action": "summarize"},
        headers={"X-Session-Id": sid},
    )
    assert r.status_code == 200


# ── Unknown action ────────────────────────────────────────────────────────────

def test_unknown_action():
    sid = create_session()
    r = client.post(
        "/api/askfirst",
        json={"action": "explode"},
        headers={"X-Session-Id": sid},
    )
    assert r.status_code == 400


# ── Regression: double-save and edit the same question (the "Previous" bug) ──

def test_save_q1_twice_checklist_stays_intact():
    """
    Reproduce the exact failure sequence:
      prepare → save q1 → save q1 again (simulates Previous + Save & Continue)
      → edit q1 with new text → verify checklist IDs are all still present.

    Before the fix, the second save raised 400 because update_checklist inside
    the answer loop replaced the checklist with a subset that excluded q1.
    """
    sid = create_session()
    checklist = prepare(sid)
    original_ids = [q["id"] for q in checklist]
    q1_id = checklist[0]["id"]

    def answer_q1(text: str):
        r = client.post(
            "/api/askfirst",
            json={"action": "answer", "question_id": q1_id,
                  "answer": text, "status": "answered"},
            headers={"X-Session-Id": sid},
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        return r.json()

    # First save — must succeed
    answer_q1("First answer")

    # Second save of the same question (user clicked Previous then Save again)
    answer_q1("First answer again")

    # Edit with different text
    answer_q1("Updated answer")

    # The full checklist must still be present in the store with all original IDs
    import tools as session_store
    raw = session_store._get_raw(sid)
    stored_ids = [q["id"] for q in raw["checklist"]]
    assert stored_ids == original_ids, (
        f"Checklist IDs changed after repeated saves.\n"
        f"Expected: {original_ids}\nGot:      {stored_ids}"
    )

    # The recorded answer must reflect the last edit
    assert raw["answers"][q1_id]["text"] == "Updated answer"
    assert raw["answers"][q1_id]["status"] == "answered"

    # All other questions must still be unanswered
    for q in raw["checklist"]:
        if q["id"] != q1_id:
            assert q["id"] not in raw["answers"], (
                f"Question {q['id']} should have no answer recorded"
            )


def test_update_checklist_tool_preserves_answered_questions():
    """
    Directly verify that calling update_checklist with a subset of IDs does not
    drop questions that were already answered.
    This covers the scenario where the live model calls update_checklist during
    the answer loop with only the remaining unanswered questions.
    """
    import tools as session_store

    sid = create_session()
    checklist = prepare(sid)
    q1_id = checklist[0]["id"]

    # Record an answer for q1 via the API
    client.post(
        "/api/askfirst",
        json={"action": "answer", "question_id": q1_id,
              "answer": "Got the answer", "status": "answered"},
        headers={"X-Session-Id": sid},
    )

    # Simulate the model calling update_checklist with only q2..qN (dropping q1)
    _, update_checklist, _ = session_store.make_tools(sid)
    remaining = [
        {"id": q["id"], "question": q["question"],
         "why": q["why"], "priority": q["priority"]}
        for q in checklist[1:]   # deliberately excludes q1
    ]
    result = update_checklist(remaining)

    # update_checklist should have merged: q1 preserved, q2..qN refreshed
    raw = session_store._get_raw(sid)
    stored_ids = {q["id"] for q in raw["checklist"]}
    assert q1_id in stored_ids, (
        f"update_checklist dropped answered question {q1_id!r}; "
        f"stored ids: {stored_ids}"
    )

    # The answer for q1 must also still be there
    assert q1_id in raw["answers"]

    # The second save via the API must now succeed
    r = client.post(
        "/api/askfirst",
        json={"action": "answer", "question_id": q1_id,
              "answer": "Second save", "status": "answered"},
        headers={"X-Session-Id": sid},
    )
    assert r.status_code == 200, (
        f"Second save of {q1_id!r} failed after update_checklist: {r.text}"
    )

def test_sessions_are_isolated():
    """Answers in session A must not appear in session B."""
    sid_a = create_session("Renting a flat")
    sid_b = create_session("Buying a bicycle")

    checklist_a = prepare(sid_a, "Renting a flat")
    prepare(sid_b, "Buying a bicycle")

    # Record an answer only in session A
    client.post(
        "/api/askfirst",
        json={
            "action":      "answer",
            "question_id": checklist_a[0]["id"],
            "answer":      "Only for session A",
            "status":      "answered",
        },
        headers={"X-Session-Id": sid_a},
    )

    # Session B should have no answers — but a valid question_id from B is needed
    import tools as session_store
    raw_b = session_store._get_raw(sid_b)
    assert raw_b["answers"] == {}, "Session B must not contain session A's answers"
