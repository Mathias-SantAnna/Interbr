"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-context";
import { CartDrawer } from "./cart-drawer";

export function StoreHeader() {
  const itemCount = useCartStore((s) => s.itemCount)();
  const openCart = useCartStore((s) => s.openCart);
  const { user, logout, loading } = useAuth();

  const initials = user?.full_name
    ? user.full_name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : null;

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur shadow-[0_1px_0_#f3f4f6]">
        <div className="mx-auto flex min-h-[60px] w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 text-decoration-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-gray-900">InterBR</span>
          </Link>

          {/* Search */}
          <form action="/catalog" className="flex w-full max-w-xs items-center gap-2 order-3 md:order-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="1.5"/>
                <path d="m21 21-4.35-4.35" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                name="search"
                placeholder="Buscar produtos..."
                className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-3 order-2 md:order-3">
            {!loading && (
              <div className="flex items-center gap-3 text-sm">
                {user ? (
                  <>
                    {(user.role === "salesman" || user.role === "admin") && (
                      <Link
                        href="/salesman"
                        className="hidden md:inline-flex h-7 items-center rounded-lg bg-primary/10 px-2.5 text-xs font-semibold text-primary hover:bg-primary/20 transition"
                      >
                        Vendedor
                      </Link>
                    )}
                    {user.role === "admin" && (
                      <Link
                        href="/backoffice"
                        className="hidden md:inline-flex h-7 items-center rounded-lg bg-amber-50 px-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition border border-amber-200"
                      >
                        Admin
                      </Link>
                    )}
                    <Link
                      href="/pedidos"
                      className="hidden md:block text-[13px] text-gray-500 hover:text-gray-900 transition font-medium"
                    >
                      Pedidos
                    </Link>
                    <Link
                      href="/suporte"
                      className="hidden md:block text-[13px] text-gray-500 hover:text-gray-900 transition font-medium"
                    >
                      Suporte
                    </Link>
                    {/* Avatar + name */}
                    <Link href="/conta" className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                        {initials}
                      </div>
                      <span className="hidden lg:block text-[13px] font-medium text-gray-700 max-w-[100px] truncate">
                        {user.full_name.split(" ")[0]}
                      </span>
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="text-[13px] text-gray-400 hover:text-gray-700 transition"
                    >
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-[13px] text-gray-500 hover:text-gray-900 transition font-medium">
                      Entrar
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex h-8 items-center rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white hover:bg-primary/90 transition"
                    >
                      Cadastrar
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Cart */}
            <button
              onClick={openCart}
              aria-label="Carrinho"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      <CartDrawer />
    </>
  );
}
