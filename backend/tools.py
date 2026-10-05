"""Tools available to the Campus Customs chat agent.

Each function here is registered on the Agent in agent.py. They are the
agent's only way to touch real catalogue/inventory data -- it must call
these rather than guess a price, a product_id, or stock numbers.
"""

from __future__ import annotations

import difflib
import json
import sqlite3
from pathlib import Path

from models import ProductCard, SizeAvailability, StockResult

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DATA_DIR / "campus_customs.db"

MAX_SEARCH_RESULTS = 5


def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _row_to_card(row: sqlite3.Row) -> ProductCard:
    return ProductCard(
        product_id=row["product_id"],
        name=row["name"],
        garment_type=row["garment_type"],
        description=row["description"],
        price=row["price"],
        image_url=f"/static/{row['image_file_path']}",
        colors=json.loads(row["colors"]),
    )


def _singularize(word: str) -> str:
    """Naive plural -> singular (hoodies -> hoodie, crewnecks -> crewneck).

    Plain substring matching otherwise misses a plural query word against
    catalogue text that only ever uses the singular form (or vice versa),
    which made search results depend on whether the model happened to
    rephrase the shopper's wording before calling this tool.
    """
    return word[:-1] if word.endswith("s") and len(word) > 3 else word


def _closest_known_word(word: str, vocabulary: set[str]) -> str:
    """Typo tolerance: if `word` isn't a real catalogue word, find the closest one.

    Shoppers type casually and mistype things ("hoody", "crewnek",
    "sweetshirt") -- without this, a typo'd query silently returns zero
    results and looks like the store doesn't carry the item at all.
    `difflib` (stdlib, no new dependency) is plenty for single-word
    corrections against a vocabulary this small.
    """
    if word in vocabulary:
        return word
    match = difflib.get_close_matches(word, vocabulary, n=1, cutoff=0.75)
    return match[0] if match else word


def search_catalogue(query: str) -> list[ProductCard]:
    """Search the Campus Customs catalogue for products matching a shopper's query.

    Matches against product name, garment type, description, colors, and
    search tags, tolerating simple typos (e.g. "hoody", "crewnek"). Use this
    whenever a shopper asks for products by keyword, team, occasion, garment
    type, or color (e.g. "hoodies", "something for reunion", "navy
    crewneck"). Returns at most 5 results, best matches first.
    """
    raw_words = {_singularize(w) for w in query.lower().split() if w}
    if not raw_words:
        return []

    conn = _get_db()
    rows = conn.execute("SELECT * FROM catalogue").fetchall()
    conn.close()

    indexed: list[tuple[sqlite3.Row, str, set[str]]] = []
    vocabulary: set[str] = set()
    for row in rows:
        haystack = " ".join(
            [row["name"], row["garment_type"], row["description"], row["colors"], row["search_tags"]]
        ).lower()
        haystack_words = {_singularize(w) for w in haystack.split()}
        indexed.append((row, haystack, haystack_words))
        vocabulary |= haystack_words

    words = {_closest_known_word(w, vocabulary) for w in raw_words}

    scored: list[tuple[int, sqlite3.Row]] = []
    for row, haystack, haystack_words in indexed:
        score = sum(1 for w in words if w in haystack or w in haystack_words)
        if score > 0:
            scored.append((score, row))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [_row_to_card(row) for _, row in scored[:MAX_SEARCH_RESULTS]]


def get_product_card(product_id: str) -> ProductCard | None:
    """Look up one product's display details (name, price, description, image, colors it comes in) by its exact product_id.

    Use this to confirm details about a specific product the shopper already
    named, that came back from search_catalogue, or that they're currently
    looking at (see page context) -- including color questions like "does
    this come in pink?": check the returned `colors` list rather than
    assuming. Never invent these details yourself.
    """
    conn = _get_db()
    row = conn.execute("SELECT * FROM catalogue WHERE product_id = ?", (product_id,)).fetchone()
    conn.close()
    return _row_to_card(row) if row else None


def check_stock(product_id: str) -> StockResult:
    """Look up real-time stock for every size of one product, straight from the inventory table, by its exact product_id.

    Returns the exact quantity for each size plus an in_stock flag (False
    when quantity is 0). Use this whenever a shopper asks about sizes,
    availability, or "is X in stock" -- never guess or estimate a quantity.
    If a size they asked about has quantity 0, say so clearly (e.g. "size M
    is sold out") rather than hedging. An empty `sizes` list means the
    product_id didn't match any catalogue product.
    """
    conn = _get_db()
    product = conn.execute("SELECT name FROM catalogue WHERE product_id = ?", (product_id,)).fetchone()
    if product is None:
        conn.close()
        return StockResult(product_id=product_id, product_name="(unknown product)", sizes=[])

    rows = conn.execute(
        "SELECT size, quantity FROM inventory WHERE product_id = ? ORDER BY id", (product_id,)
    ).fetchall()
    conn.close()

    return StockResult(
        product_id=product_id,
        product_name=product["name"],
        sizes=[SizeAvailability(size=r["size"], quantity=r["quantity"], in_stock=r["quantity"] > 0) for r in rows],
    )
