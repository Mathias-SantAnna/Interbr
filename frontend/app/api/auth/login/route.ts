import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${API_BASE}/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  // Fetch user profile to include role info
  const meRes = await fetch(`${API_BASE}/auth/me/`, {
    headers: { Authorization: `Bearer ${data.access}` },
  });
  const userData = meRes.ok ? await meRes.json() : null;

  const response = NextResponse.json({
    access: data.access,
    role: userData?.role ?? null,
  });

  // Refresh token in httpOnly cookie (not accessible by JS — XSS safe)
  response.cookies.set("interbr-refresh", data.refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  // Role in non-httpOnly cookie so middleware can read it for role guards
  if (userData?.role) {
    response.cookies.set("interbr-role", userData.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  }

  return response;
}
