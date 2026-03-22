"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { OfflineBanner } from "@/components/storefront/offline-banner";

export default function SalesmanLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/salesman");
    if (!loading && user && user.role === "client") router.push("/");
  }, [loading, user, router]);

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Carregando...</div>;
  }
  if (!user || user.role === "client") return null;

  return (
    <div className="space-y-6">
      {/* Sub-nav */}
      <nav className="flex flex-wrap items-center gap-1 rounded-xl border bg-muted/40 p-1">
        {[
          { href: "/salesman", label: "Dashboard" },
          { href: "/salesman/clientes", label: "Meus Clientes" },
          { href: "/salesman/novo-pedido", label: "Novo Pedido" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-4 py-2 text-sm font-medium transition hover:bg-background hover:shadow-sm"
          >
            {item.label}
          </Link>
        ))}
        <span className="ml-auto px-3 py-1 text-xs text-muted-foreground">
          {user.role === "admin" ? "Admin" : "Vendedor"}: {user.full_name.split(" ")[0]}
        </span>
      </nav>

      <OfflineBanner />
      {children}
    </div>
  );
}
