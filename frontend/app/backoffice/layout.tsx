"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { href: "/backoffice", label: "Dashboard", icon: "📊" },
  { href: "/backoffice/pedidos", label: "Pedidos", icon: "📦" },
  { href: "/backoffice/produtos", label: "Produtos", icon: "🏷️" },
  { href: "/backoffice/clientes", label: "Clientes", icon: "🏢" },
  { href: "/backoffice/relatorios", label: "Relatórios", icon: "📈" },
  { href: "/backoffice/tabelas-preco", label: "Tabelas Preço", icon: "💲" },
  { href: "/backoffice/categorias", label: "Categorias", icon: "🗂️" },
  { href: "/backoffice/promo-codes", label: "Promo Codes", icon: "🎟️" },
];

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/backoffice");
    if (!loading && user && user.role !== "admin") router.push("/");
  }, [loading, user, router]);

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Carregando...</div>;
  }
  if (!user || user.role !== "admin") return null;

  return (
    <div className="flex min-h-[calc(100vh-64px)] gap-0">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r bg-muted/30 lg:block">
        <nav className="sticky top-20 space-y-1 p-3">
          <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Backoffice
          </p>
          {NAV.map((item) => {
            const active = item.href === "/backoffice"
              ? pathname === "/backoffice"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex border-t bg-background lg:hidden">
        {NAV.map((item) => {
          const active = item.href === "/backoffice" ? pathname === "/backoffice" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden p-4 pb-24 lg:p-6 lg:pb-6">
        {children}
      </main>
    </div>
  );
}
