"""
tools.py
--------
Per-session state store and the three agent tools described in the MVP guide.

Session shape:
  {
    "situation":  str,
    "checklist":  list[ChecklistItem],
    "answers":    dict[question_id, AnswerRecord],
  }

ChecklistItem:
  { id, question, why, priority ("Essential"|"Optional"), status }

AnswerRecord:
  { text: str, status: "answered" | "could-not-check" }

Tool validation is enforced inside each function so the model cannot bypass it.
"""

from __future__ import annotations

import re
import threading
import uuid
from typing import Any

from strands import tool

# ── In-memory session store ───────────────────────────────────────────────────
# Keyed by session_id (UUID4 string).  A backend restart clears all sessions.
_lock: threading.Lock = threading.Lock()
_sessions: dict[str, dict[str, Any]] = {}

_MAX_SITUATION_LEN = 1_000
_MAX_QUESTION_LEN  = 400
_MAX_WHY_LEN       = 400
_MAX_ANSWER_LEN    = 1_000
_MAX_QUESTIONS     = 7
_VALID_PRIORITIES  = {"Essential", "Optional"}
_VALID_STATUSES    = {"answered", "could-not-check"}
_ID_RE             = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")


# ── Session lifecycle (called by main.py, not by the agent) ──────────────────

def create_session(situation: str) -> str:
    """Create a new isolated session and return its ID."""
    session_id = str(uuid.uuid4())
    with _lock:
        _sessions[session_id] = {
            "situation": situation[:_MAX_SITUATION_LEN],
            "checklist": [],
            "answers":   {},
        }
    return session_id


def delete_session(session_id: str) -> None:
    with _lock:
        _sessions.pop(session_id, None)


def session_exists(session_id: str) -> bool:
    with _lock:
        return session_id in _sessions


def _get_raw(session_id: str) -> dict[str, Any]:
    with _lock:
        sess = _sessions.get(session_id)
        if sess is None:
            raise KeyError(f"Session {session_id!r} not found")
        import copy
        return copy.deepcopy(sess)


def _set_raw(session_id: str, data: dict[str, Any]) -> None:
    with _lock:
        if session_id not in _sessions:
            raise KeyError(f"Session {session_id!r} not found")
        _sessions[session_id] = data


# ── Tool builders ─────────────────────────────────────────────────────────────
# Each public function returns a *bound* set of three tools for one session_id.
# This keeps sessions isolated without exposing session_id to the model.

def make_tools(session_id: str):
    """Return a (get_session, update_checklist, record_answer) triple for session_id."""

    @tool
    def get_session() -> dict:
        """
        Retrieve the current session state: situation, checklist questions, and recorded answers.
        Always call this first to understand what has already been asked and answered.

        Returns a dict with keys: situation (str), checklist (list), answers (dict).
        """
        return _get_raw(session_id)

    @tool
    def update_checklist(questions: list[dict]) -> dict:
        """
        Replace or set the checklist with a new list of question objects.
        Use this to create the initial checklist or to add one approved follow-up question.

        Each question object must have:
          - id (str): stable identifier, e.g. "q1", "q2", "followup-1"
          - question (str): the exact question the user can ask
          - why (str): one sentence explaining why this matters
          - priority (str): exactly "Essential" or "Optional"

        Constraints enforced here:
          - 1–7 questions total
          - id must match [a-zA-Z0-9_-]{1,64}
          - priority must be "Essential" or "Optional"
          - question and why are trimmed to 400 chars each
          - Duplicate ids are rejected

        Returns {"ok": true, "count": <n>} on success.
        Raises ValueError on any validation failure.
        """
        if not isinstance(questions, list) or not questions:
            raise ValueError("questions must be a non-empty list")
        if len(questions) > _MAX_QUESTIONS:
            raise ValueError(f"At most {_MAX_QUESTIONS} questions allowed, got {len(questions)}")

        seen_ids: set[str] = set()
        items = []
        for q in questions:
            if not isinstance(q, dict):
                raise ValueError("Each question must be a dict")
            q_id = str(q.get("id", "")).strip()
            if not _ID_RE.match(q_id):
                raise ValueError(f"Invalid question id: {q_id!r}")
            if q_id in seen_ids:
                raise ValueError(f"Duplicate question id: {q_id!r}")
            seen_ids.add(q_id)

            priority = str(q.get("priority", "")).strip()
            if priority not in _VALID_PRIORITIES:
                raise ValueError(f"priority must be 'Essential' or 'Optional', got {priority!r}")

            items.append({
                "id":       q_id,
                "question": str(q.get("question", "")).strip()[:_MAX_QUESTION_LEN],
                "why":      str(q.get("why", "")).strip()[:_MAX_WHY_LEN],
                "priority": priority,
                "status":   "unanswered",
            })

        data = _get_raw(session_id)
        # Merge: keep any existing entries whose IDs are not in the incoming
        # list, then append the new ones.  This ensures answered questions are
        # never silently dropped if the model omits them on a subsequent call
        # (e.g. during the answer-recording loop).
        incoming_ids = {item["id"] for item in items}
        preserved = [q for q in data["checklist"] if q["id"] not in incoming_ids]
        data["checklist"] = preserved + items
        _set_raw(session_id, data)
        return {"ok": True, "count": len(data["checklist"])}

    @tool
    def record_answer(question_id: str, answer_text: str, status: str) -> dict:
        """
        Record a user-provided answer for a checklist question.

        Args:
            question_id: must match an existing question id in the checklist
            answer_text: what the user found out; empty string is allowed when
                         status is "could-not-check"
            status: exactly "answered" or "could-not-check"

        This tool MUST NOT be called unless the user explicitly provided the answer text.
        The model must never invent or assume an answer on the user's behalf.

        Returns {"ok": true, "question_id": <id>, "status": <status>}.
        Raises ValueError if the question_id is unknown or inputs are invalid.
        """
        q_id = str(question_id).strip()
        if not _ID_RE.match(q_id):
            raise ValueError(f"Invalid question_id: {q_id!r}")

        status = str(status).strip()
        if status not in _VALID_STATUSES:
            raise ValueError(f"status must be 'answered' or 'could-not-check', got {status!r}")

        text = str(answer_text).strip()[:_MAX_ANSWER_LEN]
        if status == "answered" and not text:
            raise ValueError("answer_text must not be empty when status is 'answered'")

        data = _get_raw(session_id)
        ids = {q["id"] for q in data["checklist"]}
        if q_id not in ids:
            raise ValueError(f"Unknown question_id: {q_id!r}")

        data["answers"][q_id] = {"text": text, "status": status}
        # Keep checklist status field in sync
        for q in data["checklist"]:
            if q["id"] == q_id:
                q["status"] = status
                break
        _set_raw(session_id, data)
        return {"ok": True, "question_id": q_id, "status": status}

    return get_session, update_checklist, record_answer
