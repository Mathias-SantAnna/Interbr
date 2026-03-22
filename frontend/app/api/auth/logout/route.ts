import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("interbr-refresh")?.value;
  const authHeader = req.headers.get("authorization");

  if (refreshToken) {
    await fetch(`${API_BASE}/auth/token/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({ refresh: refreshToken }),
    }).catch(() => {});
  }

  const r = NextResponse.json({ ok: true });
  r.cookies.delete("interbr-refresh");
  r.cookies.delete("interbr-role");
  return r;
}
