import type { ProductSummary } from "./products";

const API_BASE = "http://localhost:8000";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatPageContext {
  product_id: string;
  product_name: string;
}

export interface ChatReply {
  reply: string;
  products: ProductSummary[];
  suggested_replies: string[];
}

export async function sendChatMessage(
  message: string,
  history: ChatTurn[],
  userId: number | null,
  pageContext: ChatPageContext | null
): Promise<ChatReply> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, user_id: userId, page_context: pageContext }),
  });
  if (!res.ok) throw new Error("Failed to reach the shop assistant");
  return res.json();
}

export async function fetchChatHistory(userId: number): Promise<ChatTurn[]> {
  const res = await fetch(`${API_BASE}/api/chat/history/${userId}`);
  if (!res.ok) throw new Error("Failed to load chat history");
  return res.json();
}
