"""
main.py
-------
FastAPI application for AskFirst.

Endpoints
---------
POST /api/session          — create a new session, return session_id
POST /api/askfirst         — main action handler (prepare / answer / summarize)
DELETE /api/session/{id}   — discard a session (optional cleanup)
GET  /health               — liveness check

All model calls go through agent.py.  Session state lives in tools.py.
CORS is restricted to the configured frontend origin (default: localhost:5173).
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Literal

import dotenv
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

import tools as session_store
import prompts
# ── Env / logging ─────────────────────────────────────────────────────────────
dotenv.load_dotenv()
from agent import make_agent, LIVE_MODE, MAX_TOOL_STEPS

logging.basicConfig(
    level=logging.DEBUG if os.getenv("LOG_LEVEL", "INFO").upper() == "DEBUG" else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
log = logging.getLogger(__name__)

# ── Limits ────────────────────────────────────────────────────────────────────
_MAX_SITUATION   = 1_000
_MAX_ANSWER      = 1_000
_MAX_QUESTION_ID = 64
_UUID_RE         = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="AskFirst API", version="1.0.0")

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-Session-Id"],
    allow_credentials=False,
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return 422 for Pydantic validation errors instead of letting them bubble to 500."""
    return await request_validation_exception_handler(request, exc)

# ── Pydantic models ───────────────────────────────────────────────────────────

class CreateSessionRequest(BaseModel):
    situation: str = Field(..., min_length=1, max_length=_MAX_SITUATION)


class CreateSessionResponse(BaseModel):
    session_id: str
    mode: str   # "sample" | "live"


class PrepareRequest(BaseModel):
    action: Literal["prepare"]
    situation: str = Field(..., min_length=1, max_length=_MAX_SITUATION)

    @field_validator("situation")
    @classmethod
    def strip_situation(cls, v: str) -> str:
        return v.strip()


class AnswerRequest(BaseModel):
    action: Literal["answer"]
    question_id: str = Field(..., min_length=1, max_length=_MAX_QUESTION_ID)
    answer: str = Field("", max_length=_MAX_ANSWER)
    status: Literal["answered", "could-not-check"]

    @field_validator("answer")
    @classmethod
    def strip_answer(cls, v: str) -> str:
        return v.strip()


class SummarizeRequest(BaseModel):
    action: Literal["summarize"]


# Union handled by a single endpoint via a discriminated union approach
class AnyRequest(BaseModel):
    action: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require_session(session_id: str | None) -> str:
    if not session_id:
        raise HTTPException(status_code=400, detail="X-Session-Id header is required")
    if not _UUID_RE.match(session_id.strip()):
        raise HTTPException(status_code=400, detail="Invalid session ID format")
    sid = session_id.strip()
    if not session_store.session_exists(sid):
        raise HTTPException(status_code=404, detail="Session not found or expired")
    return sid


def _parse_json_from_agent(text: str) -> dict:
    """
    Extract and parse the JSON object from the agent's response text.
    The model is instructed to return only JSON, but may occasionally wrap it
    in prose.  We find the first {...} block.
    """
    text = text.strip()
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Find the first top-level {...}
    start = text.find("{")
    end   = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass
    raise ValueError(f"Agent response contained no valid JSON: {text[:200]!r}")


def _validate_checklist(raw: list) -> list[dict]:
    """Validate checklist items returned by the agent before sending to frontend."""
    if not isinstance(raw, list):
        raise ValueError("checklist must be a list")
    if not (1 <= len(raw) <= 7):
        raise ValueError(f"checklist must have 1–7 items, got {len(raw)}")
    items = []
    seen = set()
    for item in raw:
        if not isinstance(item, dict):
            raise ValueError("each checklist item must be a dict")
        q_id = str(item.get("id", "")).strip()
        if not q_id or q_id in seen:
            raise ValueError(f"missing or duplicate question id: {q_id!r}")
        seen.add(q_id)
        priority = str(item.get("priority", "")).strip()
        if priority not in ("Essential", "Optional"):
            raise ValueError(f"invalid priority: {priority!r}")
        items.append({
            "id":       q_id,
            "question": str(item.get("question", "")).strip()[:400],
            "why":      str(item.get("why", "")).strip()[:400],
            "priority": priority,
            "status":   "unanswered",
        })
    return items


def _validate_follow_up(raw: Any) -> dict | None:
    """Validate an optional follow-up dict."""
    if raw is None:
        return None
    if not isinstance(raw, dict):
        return None
    q = str(raw.get("question", "")).strip()[:400]
    w = str(raw.get("why", "")).strip()[:400]
    if not q:
        return None
    return {"question": q, "why": w}


def _run_agent(tools_tuple: tuple, system_prompt: str, user_prompt: str) -> str:
    """
    Create a fresh agent per request (keeps sessions isolated, context window small).
    Returns the final assistant text from the AgentResult.
    """
    tool_list = list(tools_tuple)
    agent = make_agent(tool_list, system_prompt)
    result = agent(user_prompt)
    # AgentResult.message is {"role": "assistant", "content": [{"text": "..."}]}
    text = ""
    if hasattr(result, "message"):
        content = result.message.get("content", [])
        for block in content:
            if isinstance(block, dict) and "text" in block:
                text += block["text"]
    if not text:
        text = str(result)
    return text.strip()


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "mode": "live" if LIVE_MODE else "sample"}


@app.post("/api/session", response_model=CreateSessionResponse, status_code=201)
def create_session(body: CreateSessionRequest):
    sid = session_store.create_session(body.situation.strip())
    log.info("Session created: %s", sid)
    return CreateSessionResponse(
        session_id=sid,
        mode="live" if LIVE_MODE else "sample",
    )


@app.delete("/api/session/{session_id}", status_code=204)
def discard_session(session_id: str):
    if _UUID_RE.match(session_id.strip()):
        session_store.delete_session(session_id.strip())
    return None


@app.post("/api/askfirst")
async def askfirst(request: Request, x_session_id: str | None = Header(default=None)):
    body: dict = await request.json()
    action = str(body.get("action", "")).strip()

    if action not in ("prepare", "answer", "summarize"):
        raise HTTPException(status_code=400, detail=f"Unknown action: {action!r}")

    sid = _require_session(x_session_id)
    tools_tuple = session_store.make_tools(sid)

    # ── prepare ──────────────────────────────────────────────────
    if action == "prepare":
        try:
            req = PrepareRequest(**body)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        # Reject whitespace-only situations after stripping
        if not req.situation:
            raise HTTPException(status_code=422, detail="situation must not be blank")

        # Reset checklist so old data doesn't bleed through on retry
        raw_data = session_store._get_raw(sid)
        raw_data["checklist"] = []
        raw_data["answers"]   = {}
        raw_data["situation"] = req.situation
        session_store._set_raw(sid, raw_data)

        try:
            text = _run_agent(
                tools_tuple,
                prompts.SYSTEM_PROMPT,
                prompts.prepare_prompt(req.situation),
            )
            parsed    = _parse_json_from_agent(text)
            checklist = _validate_checklist(parsed.get("checklist", []))
        except Exception as exc:
            log.warning("prepare failed: %s", exc)
            raise HTTPException(status_code=502, detail=f"Agent error: {exc}") from exc

        # Always write the validated checklist back to the store.
        # In live mode the agent already called update_checklist() which wrote
        # the model's version; we overwrite with our validated copy so the store
        # is always consistent with what we return to the frontend.
        # In sample mode the mock never calls the tool, so this is the only write.
        persisted = session_store._get_raw(sid)
        persisted["checklist"] = checklist
        session_store._set_raw(sid, persisted)

        return {"checklist": checklist}

    # ── answer ───────────────────────────────────────────────────
    if action == "answer":
        try:
            req = AnswerRequest(**body)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        # Find the question text for the prompt
        raw_data = session_store._get_raw(sid)
        situation = raw_data.get("situation", "")
        q_map = {q["id"]: q for q in raw_data.get("checklist", [])}
        q_obj = q_map.get(req.question_id)
        if not q_obj:
            raise HTTPException(
                status_code=400,
                detail=f"question_id {req.question_id!r} not found in checklist",
            )

        try:
            text = _run_agent(
                tools_tuple,
                prompts.SYSTEM_PROMPT,
                prompts.answer_prompt(
                    situation=situation,
                    question_text=q_obj["question"],
                    question_id=req.question_id,
                    answer_text=req.answer,
                    status=req.status,
                ),
            )
            parsed    = _parse_json_from_agent(text)
            follow_up = _validate_follow_up(parsed.get("follow_up"))
        except Exception as exc:
            log.warning("answer failed: %s", exc)
            raise HTTPException(status_code=502, detail=f"Agent error: {exc}") from exc

        # Always write the answer directly to the store.
        # In live mode the agent called record_answer() as a tool, which already
        # wrote it.  In sample mode the mock returns JSON without calling the tool,
        # so this is the only write.  Writing unconditionally is safe: it is
        # idempotent and ensures both modes stay consistent.
        answered_data = session_store._get_raw(sid)
        answered_data["answers"][req.question_id] = {
            "text":   req.answer,
            "status": req.status,
        }
        for q in answered_data["checklist"]:
            if q["id"] == req.question_id:
                q["status"] = req.status
                break
        session_store._set_raw(sid, answered_data)

        return {"followUp": follow_up}

    # ── summarize ────────────────────────────────────────────────
    if action == "summarize":
        raw_data  = session_store._get_raw(sid)
        situation = raw_data.get("situation", "")
        try:
            text   = _run_agent(
                tools_tuple,
                prompts.SYSTEM_PROMPT,
                prompts.summarize_prompt(situation),
            )
            parsed = _parse_json_from_agent(text)
            pts    = parsed.get("points_to_clarify", [])
            if not isinstance(pts, list):
                pts = []
            pts = [str(p).strip()[:300] for p in pts[:5] if str(p).strip()]
        except Exception as exc:
            log.warning("summarize failed: %s", exc)
            raise HTTPException(status_code=502, detail=f"Agent error: {exc}") from exc

        return {"ok": True, "pointsToClarify": pts}


# ── Global error handler ──────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    log.exception("Unhandled error for %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Your progress has been preserved."},
    )
