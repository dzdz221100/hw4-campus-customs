import json
import sqlite3
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, field_validator

from agent import ChatDeps, run_chat
from auth import hash_password, verify_password
from models import ChatRequest, ChatResponse, ChatTurn
from tools import get_product_card

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DATA_DIR / "campus_customs.db"

app = FastAPI(title="Campus Customs API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=DATA_DIR), name="static")


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


class SizeStock(BaseModel):
    size: str
    quantity: int


class ProductSummary(BaseModel):
    product_id: str
    name: str
    garment_type: str
    description: str
    price: float
    image_url: str


class ProductDetail(ProductSummary):
    colors: list[str]
    search_tags: list[str]
    sizes: list[SizeStock]


def row_to_summary(row: sqlite3.Row) -> ProductSummary:
    return ProductSummary(
        product_id=row["product_id"],
        name=row["name"],
        garment_type=row["garment_type"],
        description=row["description"],
        price=row["price"],
        image_url=f"/static/{row['image_file_path']}",
    )


@app.get("/api/products", response_model=list[ProductSummary])
def list_products():
    conn = get_db()
    rows = conn.execute("SELECT * FROM catalogue ORDER BY name").fetchall()
    conn.close()
    return [row_to_summary(row) for row in rows]


@app.get("/api/products/{product_id}", response_model=ProductDetail)
def get_product(product_id: str):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM catalogue WHERE product_id = ?", (product_id,)
    ).fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    size_rows = conn.execute(
        "SELECT size, quantity FROM inventory WHERE product_id = ? ORDER BY id",
        (product_id,),
    ).fetchall()
    conn.close()

    summary = row_to_summary(row)
    return ProductDetail(
        **summary.model_dump(),
        colors=json.loads(row["colors"]),
        search_tags=json.loads(row["search_tags"]),
        sizes=[SizeStock(size=r["size"], quantity=r["quantity"]) for r in size_rows],
    )


class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator("first_name", "last_name")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value.strip()

    @field_validator("password")
    @classmethod
    def min_length(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("password must be at least 8 characters")
        return value

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, value: str, info):
        if value != info.data.get("password"):
            raise ValueError("passwords do not match")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: int
    first_name: str | None
    last_name: str | None
    email: str
    created_at: str


def row_to_user(row: sqlite3.Row) -> UserPublic:
    return UserPublic(
        id=row["id"],
        first_name=row["first_name"],
        last_name=row["last_name"],
        email=row["email"],
        created_at=row["created_at"],
    )


@app.post("/api/signup", response_model=UserPublic, status_code=201)
def signup(payload: SignupRequest):
    conn = get_db()
    existing = conn.execute(
        "SELECT id FROM users WHERE email = ?", (payload.email,)
    ).fetchone()
    if existing is not None:
        conn.close()
        raise HTTPException(status_code=409, detail="An account with that email already exists")

    full_name = f"{payload.first_name} {payload.last_name}"
    password_hash = hash_password(payload.password)
    cursor = conn.execute(
        """
        INSERT INTO users (name, email, password_hash, first_name, last_name)
        VALUES (?, ?, ?, ?, ?)
        """,
        (full_name, payload.email, password_hash, payload.first_name, payload.last_name),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return row_to_user(row)


@app.post("/api/login", response_model=UserPublic)
def login(payload: LoginRequest):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (payload.email,)).fetchone()
    conn.close()
    if row is None or not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return row_to_user(row)


def save_chat_message(user_id: int, role: str, content: str, product_ids: list[str]) -> None:
    conn = get_db()
    conn.execute(
        "INSERT INTO chat_messages (user_id, role, content, products_json) VALUES (?, ?, ?, ?)",
        (user_id, role, content, json.dumps(product_ids) if product_ids else None),
    )
    conn.commit()
    conn.close()


@app.get("/api/chat/history/{user_id}", response_model=list[ChatTurn])
def get_chat_history(user_id: int):
    conn = get_db()
    rows = conn.execute(
        "SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY id", (user_id,)
    ).fetchall()
    conn.close()
    return [ChatTurn(role=r["role"], content=r["content"]) for r in rows]


@app.post("/api/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    customer = None
    if payload.user_id is not None:
        conn = get_db()
        row = conn.execute("SELECT * FROM users WHERE id = ?", (payload.user_id,)).fetchone()
        conn.close()
        if row is not None:
            customer = row_to_user(row)

    deps = ChatDeps(
        is_logged_in=customer is not None,
        customer_name=f"{customer.first_name} {customer.last_name}".strip() if customer else None,
        customer_email=customer.email if customer else None,
        page_context=payload.page_context,
    )

    try:
        agent_reply = await run_chat(payload.message, payload.history, deps)
    except Exception:
        # The agent/model layer already wrote an "error: ..." entry to
        # output/audit_trail.json (see agent.run_chat) -- this is just the
        # graceful reply a shopper actually sees instead of a raw 500,
        # e.g. when the model provider's own content filter rejects a
        # jailbreak-style message before any reply is generated.
        return ChatResponse(
            reply="Sorry, I couldn't process that message. Could you try rephrasing it?",
            products=[],
            suggested_replies=[],
        )

    # Only trust product_ids that still resolve to a real catalogue row --
    # drops anything the model might have hallucinated.
    products = []
    for product_id in agent_reply.product_ids:
        card = get_product_card(product_id)
        if card is not None:
            products.append(card)

    # Chat history only persists for logged-in shoppers; guests chat without
    # anything being written to the database.
    if customer is not None:
        save_chat_message(customer.id, "user", payload.message, [])
        save_chat_message(customer.id, "assistant", agent_reply.message, [p.product_id for p in products])

    return ChatResponse(
        reply=agent_reply.message,
        products=products,
        suggested_replies=agent_reply.suggested_replies[:3],
    )


@app.get("/api/health")
def health():
    return {"status": "ok"}
