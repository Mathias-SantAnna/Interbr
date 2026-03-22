"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getAdminStats, type AdminOrder } from "@/lib/admin-api";
import { formatPrice } from "@/lib/catalog-api";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/order-api";

function StatCard({ label, value, color = "" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl border bg-background p-5 space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function BackofficeDashboard() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAdminStats>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    getAdminStats(accessToken)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }
  if (!stats) return <p className="text-destructive">Erro ao carregar dados.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-gray-900">Backoffice</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral da operação</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Receita total" value={formatPrice(stats.totalRevenue)} />
        <StatCard label="Total de pedidos" value={stats.totalOrders} />
        <StatCard label="Aguardando pagamento" value={stats.pendingCount} color="text-yellow-600" />
        <StatCard label="Clientes cadastrados" value={stats.clientCount} />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <h2 className="font-semibold">Pedidos recentes</h2>
          <Link href="/backoffice/pedidos" className="text-xs text-primary hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="divide-y">
          {stats.recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-sm text-center text-gray-400">Nenhum pedido ainda.</p>
          ) : (
            stats.recentOrders.map((order: AdminOrder) => (
              <Link
                key={order.id}
                href={`/pedidos/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium">#{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">{order.on_behalf_of.razao_social}</p>
                  </div>
                  <p className="hidden text-xs text-muted-foreground sm:block">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${ORDER_STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {ORDER_STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <p className="text-sm font-semibold">{formatPrice(parseFloat(order.total))}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
