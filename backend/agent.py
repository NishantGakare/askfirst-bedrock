"""
agent.py
--------
Agent factory.

LIVE_MODE=false (default): a MockModel is used that returns canned JSON via
Strands' async stream() interface.  No network calls are made.

LIVE_MODE=true: uses BedrockModel with the configured region and model ID.
Credentials come from the standard boto3 credential chain.
Set LIVE_MODE=true only after verifying credentials, model access, and billing.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, AsyncGenerator

from strands import Agent, tool
from strands.models import Model

log = logging.getLogger(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────
LIVE_MODE      = os.getenv("LIVE_MODE", "false").lower() == "true"
AWS_REGION     = os.getenv("AWS_REGION", "us-east-1")
BEDROCK_MODEL  = os.getenv("BEDROCK_MODEL_ID", "us.amazon.nova-lite-v1:0")
MAX_TOOL_STEPS = int(os.getenv("MAX_TOOL_STEPS", "6"))
MAX_TOKENS     = int(os.getenv("MAX_TOKENS", "1024"))

if LIVE_MODE:
    log.warning(
        "LIVE_MODE=true — Bedrock requests are ENABLED. "
        "Verify billing and model access before use."
    )
else:
    log.info("LIVE_MODE=false — using MockModel. No AWS calls will be made.")


# ── Mock model (sample mode) ──────────────────────────────────────────────────

class MockModel(Model):
    """
    Strands-compatible model stub that returns canned JSON for each action type.
    Implements the full Model ABC via an async stream() generator.
    Never makes any network calls.

    Response selection:
      - Prompt contains "update_checklist" or "checklist"  → PREPARE response
      - Prompt contains "record_answer" and "follow_up"    → ANSWER response
          (no follow-up when status is could-not-check)
      - Prompt contains "points_to_clarify"               → SUMMARIZE response
    """

    _PREPARE = json.dumps({
        "checklist": [
            {
                "id": "q1",
                "question": "What is the total cost, including all fees?",
                "why": "Advertised prices often exclude compulsory extras.",
                "priority": "Essential",
            },
            {
                "id": "q2",
                "question": "What does the cancellation policy look like?",
                "why": "Understanding exit terms before committing avoids expensive surprises.",
                "priority": "Essential",
            },
            {
                "id": "q3",
                "question": "Who is responsible if something goes wrong?",
                "why": "Knowing who carries liability is critical when problems arise.",
                "priority": "Essential",
            },
            {
                "id": "q4",
                "question": "How long will this take?",
                "why": "Unclear timelines lead to missed expectations.",
                "priority": "Optional",
            },
            {
                "id": "q5",
                "question": "Are there reviews or references I can check?",
                "why": "Independent verification reduces decisions based solely on the seller's claims.",
                "priority": "Optional",
            },
        ]
    })

    _ANSWER_WITH_FOLLOWUP = json.dumps({
        "follow_up": {
            "question": "Can you confirm that in writing before we proceed?",
            "why": "Written confirmation prevents misremembering and protects both parties.",
        }
    })

    _ANSWER_NO_FOLLOWUP = json.dumps({"follow_up": None})

    _SUMMARIZE = json.dumps({
        "points_to_clarify": [
            "Confirm the full payment terms in writing.",
            "Clarify what happens if the arrangement falls through.",
        ]
    })

    def _pick_text(self, prompt: str) -> str:
        p = prompt.lower()
        if "points_to_clarify" in p:
            return self._SUMMARIZE
        if "record_answer" in p and "follow_up" in p:
            if "could-not-check" in p or "could not check" in p:
                return self._ANSWER_NO_FOLLOWUP
            return self._ANSWER_WITH_FOLLOWUP
        if "update_checklist" in p or "checklist" in p:
            return self._PREPARE
        return json.dumps({"error": "mock: unrecognised prompt"})

    # ── Model ABC implementation ──────────────────────────────────────────────

    def update_config(self, **model_config: Any) -> None:  # noqa: D102
        pass

    def get_config(self) -> dict:  # noqa: D102
        return {}

    async def structured_output(self, *args: Any, **kwargs: Any) -> Any:  # noqa: D102
        raise NotImplementedError("MockModel does not support structured_output")

    async def stream(  # noqa: D102
        self,
        messages: Any,
        tool_specs: Any = None,
        system_prompt: str | None = None,
        **kwargs: Any,
    ) -> AsyncGenerator[dict, None]:
        # Flatten all message text to decide which canned response to return
        flat = system_prompt or ""
        for msg in messages or []:
            content = msg.get("content", [])
            if isinstance(content, list):
                for block in content:
                    if isinstance(block, dict):
                        flat += " " + block.get("text", "")
            elif isinstance(content, str):
                flat += " " + content

        text = self._pick_text(flat)

        # Emit the minimal event sequence Strands expects for a text response
        yield {"messageStart": {"role": "assistant"}}
        yield {"contentBlockStart": {"contentBlockIndex": 0, "start": {}}}
        yield {"contentBlockDelta": {"contentBlockIndex": 0, "delta": {"text": text}}}
        yield {"contentBlockStop": {"contentBlockIndex": 0}}
        yield {"messageStop": {"stopReason": "end_turn"}}
        yield {"metadata": {"usage": {"inputTokens": 0, "outputTokens": 0, "totalTokens": 0}}}


# ── Agent factory ─────────────────────────────────────────────────────────────

def make_agent(tools: list, system_prompt: str) -> Agent:
    """
    Build and return a Strands Agent bound to the given tools and system prompt.
    Uses MockModel when LIVE_MODE=false — safe to call without any AWS config.
    Uses BedrockModel when LIVE_MODE=true — requires valid credentials and model access.
    """
    if LIVE_MODE:
        from strands.models import BedrockModel
        model: Model = BedrockModel(
            model_id=BEDROCK_MODEL,
            region_name=AWS_REGION,
            max_tokens=MAX_TOKENS,
        )
        log.info("Agent created with Bedrock model %s in %s", BEDROCK_MODEL, AWS_REGION)
    else:
        model = MockModel()
        log.debug("Agent created with MockModel (sample mode)")

    return Agent(
        model=model,
        tools=tools,
        system_prompt=system_prompt,
        callback_handler=None,   # silence stdout streaming in API context
    )
