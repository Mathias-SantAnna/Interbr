const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  role: "client" | "salesman" | "admin";
  role_display: string;
  phone: string;
  company: {
    id: string;
    cnpj: string;
    razao_social: string;
    nome_fantasia: string;
    tier: string;
    tier_display: string;
    max_discount: number;
    city: string;
    state: string;
  } | null;
};

export type RegisterPayload = {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  company_email: string;
  company_phone?: string;
  city?: string;
  state?: string;
  cep?: string;
  full_name: string;
  email: string;
  password: string;
  password_confirm: string;
};

type ApiError = { status: number; data: Record<string, unknown> };

async function post(path: string, body: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw { status: res.status, data } as ApiError;
  }
  return res.json();
}

export async function login(email: string, password: string) {
  return post("/auth/token/", { email, password }) as Promise<{
    access: string;
    refresh: string;
  }>;
}

export async function refreshAccessToken(refresh: string) {
  return post("/auth/token/refresh/", { refresh }) as Promise<{ access: string }>;
}

export async function logout(refresh: string, access: string): Promise<void> {
  await post("/auth/token/logout/", { refresh }, access).catch(() => {});
}

export async function register(payload: RegisterPayload): Promise<{ user: AuthUser }> {
  return post("/auth/register/", payload);
}

export async function getMe(access: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/auth/me/`, {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

export function flattenApiErrors(data: Record<string, unknown>): string {
  return Object.entries(data)
    .map(([, v]) => (Array.isArray(v) ? v.join(" ") : String(v)))
    .join(" ");
}
