const API_BASE = "http://localhost:8000";

export interface User {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  created_at: string;
}

export interface SignupPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
  } catch {
    // fall through to generic message
  }
  return "Something went wrong. Please try again.";
}

export async function signup(payload: SignupPayload): Promise<User> {
  const res = await fetch(`${API_BASE}/api/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  return res.json();
}

export async function login(payload: LoginPayload): Promise<User> {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  return res.json();
}
