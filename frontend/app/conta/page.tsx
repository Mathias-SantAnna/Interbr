"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const TIER_CFG: Record<string, { bg: string; color: string; label: string }> = {
  bronze:   { bg: "#fff7ed", color: "#c2410c", label: "Bronze" },
  silver:   { bg: "#f8fafc", color: "#475569", label: "Prata" },
  gold:     { bg: "#fefce8", color: "#a16207", label: "Ouro" },
  platinum: { bg: "#faf5ff", color: "#7e22ce", label: "Platina" },
  distribuidor: { bg: "#f0fdf4", color: "#1e3177", label: "Distribuidor" },
  revendedor:   { bg: "#eff6ff", color: "#1d4ed8", label: "Revendedor" },
  consumidor:   { bg: "#fffbeb", color: "#b45309", label: "Consumidor Final" },
};

export default function ContaPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/conta");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-12">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }
  if (!user) return null;

  const tier = user.company ? (TIER_CFG[user.company.tier] ?? { bg: "#f9fafb", color: "#374151", label: user.company.tier_display }) : null;
  const initials = user.full_name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-gray-900">{user.full_name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <button
          onClick={async () => { await logout(); router.push("/"); }}
          className="inline-flex h-9 items-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          Sair
        </button>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Perfil</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><p className="text-xs text-gray-400">Nome</p><p className="mt-0.5 font-medium text-gray-900">{user.full_name}</p></div>
          <div><p className="text-xs text-gray-400">E-mail</p><p className="mt-0.5 font-medium text-gray-900">{user.email}</p></div>
          {user.phone && <div><p className="text-xs text-gray-400">Telefone</p><p className="mt-0.5 font-medium text-gray-900">{user.phone}</p></div>}
          <div>
            <p className="text-xs text-gray-400">Perfil</p>
            <p className="mt-0.5 font-medium text-gray-900 capitalize">{user.role_display}</p>
          </div>
        </div>
      </div>

      {/* Company */}
      {user.company && tier && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Empresa</p>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: tier.bg, color: tier.color }}>
              {tier.label}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs text-gray-400">Razão social</p><p className="mt-0.5 font-medium text-gray-900">{user.company.razao_social}</p></div>
            {user.company.nome_fantasia && <div><p className="text-xs text-gray-400">Nome fantasia</p><p className="mt-0.5 font-medium text-gray-900">{user.company.nome_fantasia}</p></div>}
            <div>
              <p className="text-xs text-gray-400">CNPJ</p>
              <p className="mt-0.5 font-mono font-medium text-gray-900">{user.company.cnpj}</p>
            </div>
            {user.company.city && (
              <div>
                <p className="text-xs text-gray-400">Localização</p>
                <p className="mt-0.5 font-medium text-gray-900">{user.company.city}{user.company.state ? ` — ${user.company.state}` : ""}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { href: "/pedidos", icon: "📦", title: "Meus pedidos", desc: "Histórico e status de entregas" },
          { href: "/catalog", icon: "🛒", title: "Catálogo", desc: "Explorar produtos e preços" },
        ].map((link) => (
          <Link key={link.href} href={link.href}
            className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-primary/30 hover:bg-primary/5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl">{link.icon}</div>
            <div>
              <p className="font-semibold text-gray-900">{link.title}</p>
              <p className="text-sm text-gray-500">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
