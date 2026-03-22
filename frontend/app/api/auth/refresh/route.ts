import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function POST(req: NextRequest) {
  const refresh = req.cookies.get("interbr-refresh")?.value;
  if (!refresh) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  const data = await res.json();
  if (!res.ok) {
    const r = NextResponse.json(data, { status: res.status });
    r.cookies.delete("interbr-refresh");
    return r;
  }

  return NextResponse.json({ access: data.access });
}
