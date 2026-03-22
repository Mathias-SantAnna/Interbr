"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getMyClients, type ClientCompany, TIER_COLOR, TIER_LABEL } from "@/lib/salesman-api";
import { getOrders, type Order } from "@/lib/order-api";
import { formatPrice } from "@/lib/catalog-api";
import { useDraftStore } from "@/lib/draft-store";

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  pending_payment: { label: "Aguardando pagamento", bg: "#fffbeb", color: "#92400e" },
  paid:            { label: "Pago",                 bg: "#eff6ff", color: "#1e40af" },
  invoiced:        { label: "Faturado",             bg: "#f0fdf4", color: "#166534" },
  shipped:         { label: "Enviado",              bg: "#f0f9ff", color: "#075985" },
  delivered:       { label: "Entregue",             bg: "#f0fdf4", color: "#14532d" },
  cancelled:       { label: "Cancelado",            bg: "#fef2f2", color: "#991b1b" },
};

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function SalesmanDashboard() {
  const { user, accessToken } = useAuth();
  const [clients, setClients] = useState<ClientCompany[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const draft = useDraftStore();

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([getMyClients(accessToken), getOrders(accessToken)])
      .then(([c, { orders }]) => { setClients(c); setOrders(orders); })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const pendingOrders = orders.filter((o) => o.status === "pending_payment");
  const recentOrders = orders.slice(0, 5);
  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total), 0);
  const initials = user?.full_name?.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() ?? "V";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
        <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{initials}</div>
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-gray-900">Portal do Vendedor</h1>
            <p className="text-sm text-gray-500">Visão geral da sua carteira</p>
          </div>
        </div>
        <Link href="/salesman/novo-pedido"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition shadow-sm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
          Novo pedido
        </Link>
        <Link href="/salesman/novo-cliente"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-8 0v2M12 11a4 4 0 100-8 4 4 0 000 8zM19 11v6M22 14h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Novo cliente
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Clientes ativos",    value: clients.filter((c) => c.is_active).length,      color: "#111827" },
          { label: "Pedidos pendentes",  value: pendingOrders.length,                           color: "#d97706" },
          { label: "Total em pedidos",   value: fmt(totalRevenue),                              color: "#16a34a" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{s.label}</p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.03em]" style={{ color: s.color, fontFamily: "var(--font-dm-mono), monospace" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Draft banner */}
      {draft.items.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-amber-800">Rascunho salvo</p>
            <p className="text-sm text-amber-700">
              {draft.items.length} {draft.items.length === 1 ? "produto" : "produtos"}
              {draft.client ? ` · ${draft.client.display_name}` : ""}
              {draft.savedAt ? ` · Salvo às ${new Date(draft.savedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}
            </p>
          </div>
          <Link href="/salesman/novo-pedido"
            className="inline-flex h-8 items-center rounded-xl bg-amber-600 px-4 text-sm font-medium text-white hover:bg-amber-700 transition">
            Continuar →
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-900">Pedidos recentes</h2>
            <Link href="/pedidos" className="text-xs font-medium text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-sm text-center text-gray-400">Nenhum pedido ainda.</p>
            ) : recentOrders.map((order) => {
              const sc = STATUS_CFG[order.status];
              return (
                <Link key={order.id} href={`/pedidos/${order.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition">
                  <div>
                    <p className="text-sm font-medium text-gray-900" style={{ fontFamily: "var(--font-dm-mono), monospace" }}>#{order.order_number}</p>
                    <p className="text-xs text-gray-400">{order.on_behalf_of.razao_social}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: "var(--font-dm-mono), monospace" }}>{fmt(parseFloat(order.total))}</p>
                    {sc && <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Client list */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-900">Minha carteira</h2>
            <Link href="/salesman/clientes" className="text-xs font-medium text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {clients.length === 0 ? (
              <p className="px-5 py-8 text-sm text-center text-gray-400">Nenhum cliente atribuído.</p>
            ) : clients.slice(0, 5).map((c) => (
              <Link key={c.id} href={`/salesman/clientes/${c.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {c.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.display_name}</p>
                    <p className="text-xs text-gray-400">{c.city} / {c.state}</p>
                  </div>
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${TIER_COLOR[c.tier]}`}>{TIER_LABEL[c.tier]}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
