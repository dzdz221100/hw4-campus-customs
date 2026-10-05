"""Structured models for the Campus Customs chat agent.

Kept separate from the ad-hoc Pydantic models already in main.py (used for
the plain product-listing/auth endpoints) so the agent's input/output shapes
can grow independently.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ProductCard(BaseModel):
    """A product, shaped for display as a card in the chat panel.

    Also doubles as the agent's "product description + price" lookup
    result -- both questions are answered from the same catalogue row, so
    one tool/model covers both rather than two near-identical ones.
    """

    product_id: str
    name: str
    garment_type: str
    description: str
    price: float
    image_url: str
    colors: list[str] = Field(default_factory=list, description="Colors this product actually comes in, from the catalogue.")


class SizeAvailability(BaseModel):
    """Real stock for one size of one product, straight from `inventory`."""

    size: str
    quantity: int
    in_stock: bool = Field(description="True iff quantity > 0 -- lets the agent state 'out of stock' without doing its own arithmetic.")


class StockResult(BaseModel):
    """Full per-size stock picture for one product, from the `check_stock` tool.

    `sizes` is empty when `product_id` doesn't match any catalogue row --
    the agent should tell the shopper the product couldn't be found rather
    than guessing at stock.
    """

    product_id: str
    product_name: str
    sizes: list[SizeAvailability] = Field(default_factory=list)


class ChatTurn(BaseModel):
    """One prior message in the conversation, as sent by the front end."""

    role: Literal["user", "assistant"]
    content: str


class PageContext(BaseModel):
    """Which product page (if any) the shopper is currently looking at.

    Sent by the front end on every message so a reference like "do you have
    this in pink?" can be resolved to a real product_id without the shopper
    having to name it again.
    """

    product_id: str
    product_name: str


class ChatRequest(BaseModel):
    """What the front end's chat widget posts to /api/chat."""

    message: str
    history: list[ChatTurn] = Field(default_factory=list)
    user_id: int | None = Field(default=None, description="Logged-in shopper's user id, or None for a guest.")
    page_context: PageContext | None = Field(default=None, description="The product page the shopper is currently viewing, if any.")


class AgentReply(BaseModel):
    """The agent's own structured output.

    `product_ids` must only ever contain ids the agent actually saw come back
    from a tool call (search_catalogue / get_product_card) -- never a
    guessed id. The chat endpoint re-fetches each id from the database
    before returning it to the front end, so a hallucinated id is simply
    dropped rather than shown to the shopper.
    """

    message: str = Field(description="Reply text to show the shopper, written in the Campus Customs voice.")
    product_ids: list[str] = Field(
        default_factory=list,
        description="product_id(s) worth showing as cards, taken only from ids returned by a tool call.",
    )
    suggested_replies: list[str] = Field(
        default_factory=list,
        max_length=3,
        description="Up to 3 short next-message suggestions, phrased as something the shopper would say.",
    )


class ChatResponse(BaseModel):
    """What /api/chat actually returns to the front end."""

    reply: str
    products: list[ProductCard] = Field(default_factory=list)
    suggested_replies: list[str] = Field(default_factory=list)


class AuditEntry(BaseModel):
    """One logged event from an agent run, appended to output/audit_trail.json.

    One entry per tool call the agent actually made (`tool_name` set), plus
    one closing entry per run with `stop_reason` set and `tool_name` null.
    Deliberately flat and minimal -- no customer name/email/message text is
    ever logged here, only tool activity, so this file stays safe to keep
    around indefinitely without becoming a store of personal data.
    """

    timestamp: str = Field(description="UTC ISO-8601 timestamp of this event.")
    run_id: str = Field(description="Groups every entry from the same /api/chat call together.")
    tool_name: str | None = Field(default=None, description="Name of the tool called, or null for the run's closing entry.")
    args: dict = Field(default_factory=dict, description="Short/truncated tool arguments, {} for the closing entry.")
    result: str = Field(default="", description="Short/truncated tool result, or a final summary for the closing entry.")
    stop_reason: str | None = Field(
        default=None, description="Set only on the closing entry, e.g. 'completed' or 'error: ValueError'."
    )
