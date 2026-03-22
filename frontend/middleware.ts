import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/conta",
  "/pedidos",
  "/checkout",
  "/salesman",
  "/backoffice",
];

const ROLE_GUARDS: Record<string, string[]> = {
  "/backoffice": ["admin"],
  "/salesman": ["salesman", "admin"],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const refreshCookie = req.cookies.get("interbr-refresh");
  if (!refreshCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Role guards: check JWT payload (access token not available in middleware,
  // layout components handle role-specific access — middleware only checks auth)
  // We do a best-effort check via the role stored in a non-httpOnly cookie set at login.
  const roleCookie = req.cookies.get("interbr-role")?.value;
  if (roleCookie) {
    const allowed = ROLE_GUARDS[
      Object.keys(ROLE_GUARDS).find((k) => pathname.startsWith(k)) ?? ""
    ];
    if (allowed && !allowed.includes(roleCookie)) {
      const url = req.nextUrl.clone();
      url.pathname = roleCookie === "salesman" ? "/salesman" : "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/conta/:path*",
    "/pedidos/:path*",
    "/checkout/:path*",
    "/salesman/:path*",
    "/backoffice/:path*",
  ],
};
