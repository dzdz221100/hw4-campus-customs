"""PydanticAI agent setup for the Campus Customs shop assistant."""

from __future__ import annotations

import os
import uuid
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from pydantic_ai import Agent, RunContext
from pydantic_ai.messages import ModelMessage, ToolCallPart, ToolReturnPart
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.usage import UsageLimits

from audit import append_audit_entries
from models import AgentReply, AuditEntry, ChatTurn, PageContext
from tools import check_stock, get_product_card, search_catalogue

BACKEND_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_ROOT.parent
PROMPT_PATH = BACKEND_ROOT / "prompts" / "prompt.md"
ENV_PATH = PROJECT_ROOT / ".env"
MODEL_NAME = "gpt-5.6-luna"

# Loop limits: this agent only ever needs 1-3 tool calls to answer a real
# shopper question (find a product, then maybe check its description/stock).
# Capping well above that still leaves headroom while guaranteeing a single
# /api/chat call can never spin into an unbounded (and unboundedly
# expensive) tool-calling loop.
LOOP_REQUEST_LIMIT = 8
LOOP_TOOL_CALLS_LIMIT = 6

# How much of a tool's args/result gets written to the audit trail -- "short"
# per the assignment, and also keeps the file from ballooning on a tool that
# returns several products at once.
AUDIT_LOG_CHAR_LIMIT = 300

load_dotenv(ENV_PATH, override=False)


@dataclass
class ChatDeps:
    """Per-request context the agent needs beyond the message itself.

    Built fresh in main.py for every /api/chat call (never cached), so it
    always reflects who's actually logged in right now and what page
    they're actually on right now -- not stale state from an earlier turn.
    """

    is_logged_in: bool
    customer_name: str | None
    customer_email: str | None
    page_context: PageContext | None


def make_model() -> OpenAIChatModel:
    portkey_api_key = os.getenv("PORTKEY_API_KEY")
    if not portkey_api_key:
        raise RuntimeError(f"PORTKEY_API_KEY is missing. Expected it in {ENV_PATH}.")
    return OpenAIChatModel(
        MODEL_NAME,
        provider=OpenAIProvider(base_url="https://api.portkey.ai/v1", api_key=portkey_api_key),
    )


def build_agent() -> Agent:
    system_prompt = PROMPT_PATH.read_text(encoding="utf-8")
    agent: Agent[ChatDeps, AgentReply] = Agent(
        make_model(),
        output_type=AgentReply,
        system_prompt=system_prompt,
        deps_type=ChatDeps,
        tools=[search_catalogue, get_product_card, check_stock],
        retries=2,
    )

    @agent.system_prompt
    def customer_and_page_context(ctx: RunContext[ChatDeps]) -> str:
        deps = ctx.deps
        lines = []
        if deps.is_logged_in:
            lines.append(
                f"This shopper is logged in as {deps.customer_name} ({deps.customer_email}). "
                "You already know their name and email -- greet them by name or answer "
                "'what's my name' directly, you don't need a tool for this."
            )
        else:
            lines.append(
                "This shopper is browsing as a guest (not logged in). You don't know their "
                "name or email -- don't guess one, and don't claim to remember a guest from "
                "an earlier visit."
            )
        if deps.page_context is not None:
            lines.append(
                f"They are currently viewing this product's page: '{deps.page_context.product_name}' "
                f"(product_id='{deps.page_context.product_id}'). If they refer to 'this', 'it', or "
                "this item without naming a product, assume they mean this one -- look it up with "
                "get_product_card/check_stock using this exact product_id rather than asking which "
                "product they mean, unless they've clearly switched to discussing something else."
            )
        return "\n".join(lines)

    return agent


agent = build_agent()


def _render_prompt(message: str, history: list[ChatTurn]) -> str:
    """Fold prior turns into the prompt text instead of PydanticAI's own
    message_history.

    PydanticAI only re-evaluates system prompts (including our
    customer_and_page_context function above) when message_history is
    empty -- it assumes a non-empty history already carries a system
    message from an earlier call in the same run. Since every /api/chat
    request reconstructs history from scratch (the real conversation lives
    in chat_messages / the browser, not in PydanticAI's own state), passing
    it back in as message_history would silently skip our customer/page
    context -- and the system prompt entirely -- on every turn after the
    first. Running fresh each time with history folded into the prompt
    keeps that context live on every single turn.
    """
    if not history:
        return message
    lines = ["Conversation so far:"]
    for turn in history:
        speaker = "Shopper" if turn.role == "user" else "You"
        lines.append(f"{speaker}: {turn.content}")
    lines.append("")
    lines.append(f"New message from the shopper: {message}")
    return "\n".join(lines)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _truncate(text: str) -> str:
    text = text.strip()
    if len(text) <= AUDIT_LOG_CHAR_LIMIT:
        return text
    return text[: AUDIT_LOG_CHAR_LIMIT - 1] + "…"


def _tool_call_entries(run_id: str, messages: Sequence[ModelMessage]) -> list[AuditEntry]:
    """Pair each ToolCallPart with its matching ToolReturnPart (by
    tool_call_id) across this run's messages, and turn each pair into one
    short audit entry. Never includes the shopper's message text or any
    customer name/email -- only the tool name, its arguments, and a
    truncated result."""
    pending: dict[str, tuple[str, dict]] = {}
    entries: list[AuditEntry] = []
    for msg in messages:
        for part in msg.parts:
            if isinstance(part, ToolCallPart):
                try:
                    args = part.args_as_dict()
                except Exception:
                    args = {}
                pending[part.tool_call_id] = (part.tool_name, args)
            elif isinstance(part, ToolReturnPart):
                tool_name, args = pending.pop(part.tool_call_id, (part.tool_name, {}))
                entries.append(
                    AuditEntry(
                        timestamp=_now(),
                        run_id=run_id,
                        tool_name=tool_name,
                        args={k: _truncate(str(v)) for k, v in args.items()},
                        result=_truncate(str(part.content)),
                    )
                )
    return entries


async def run_chat(message: str, history: list[ChatTurn], deps: ChatDeps) -> AgentReply:
    run_id = uuid.uuid4().hex[:12]
    try:
        result = await agent.run(
            _render_prompt(message, history),
            deps=deps,
            usage_limits=UsageLimits(request_limit=LOOP_REQUEST_LIMIT, tool_calls_limit=LOOP_TOOL_CALLS_LIMIT),
        )
    except Exception as exc:
        append_audit_entries(
            [AuditEntry(timestamp=_now(), run_id=run_id, stop_reason=f"error: {type(exc).__name__}")]
        )
        raise

    entries = _tool_call_entries(run_id, result.new_messages())
    entries.append(
        AuditEntry(
            timestamp=_now(),
            run_id=run_id,
            stop_reason="completed",
            result=_truncate(
                f"reply_chars={len(result.output.message)}, "
                f"product_ids={result.output.product_ids}, "
                f"suggested_replies={len(result.output.suggested_replies)}"
            ),
        )
    )
    append_audit_entries(entries)

    return result.output
