"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getAdminOrders,
  setOrderStatus,
  type AdminOrder,
} from "@/lib/admin-api";
import { formatPrice } from "@/lib/catalog-api";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/order-api";

const ALL_STATUSES = Object.entries(ORDER_STATUS_LABEL) as [string, string][];

const NEXT_STATUSES: Record<string, string[]> = {
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["invoiced", "cancelled"],
  invoiced: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export default function AdminOrdersPage() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const data = await getAdminOrders(accessToken, { status: statusFilter || undefined, page });
    setOrders(data.results);
    setTotal(data.count);
    setLoading(false);
  }, [accessToken, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  async function handleStatus(orderId: string, newStatus: string) {
    if (!accessToken) return;
    setUpdating(orderId);
    try {
      const updated = await setOrderStatus(accessToken, orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } finally {
      setUpdating(null);
    }
  }

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-gray-900">Pedidos</h1>
          <p className="text-sm text-muted-foreground">{total} pedidos encontrados</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        >
          <option value="">Todos os status</option>
          {ALL_STATUSES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {["Pedido", "Cliente", "Data", "Valor", "Pgto", "Status", "Ações"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-muted animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <Link href={`/pedidos/${order.id}`} className="font-mono text-primary hover:underline text-sm">
                      #{order.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 max-w-[160px] truncate text-muted-foreground">
                    {order.on_behalf_of.razao_social}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(parseFloat(order.total))}</td>
                  <td className="px-4 py-3 text-muted-foreground">{order.payment_method_display}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${ORDER_STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {NEXT_STATUSES[order.status]?.length > 0 && (
                      <select
                        disabled={updating === order.id}
                        onChange={(e) => handleStatus(order.id, e.target.value)}
                        defaultValue=""
                        className="h-7 rounded-lg border border-gray-200 bg-white px-2 text-xs focus:outline-none disabled:opacity-50"
                      >
                        <option value="" disabled>Mover para...</option>
                        {NEXT_STATUSES[order.status].map((s) => (
                          <option key={s} value={s}>{ORDER_STATUS_LABEL[s] ?? s}</option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 w-8 rounded-xl border border-gray-200 bg-white text-sm disabled:opacity-40 hover:bg-gray-50 transition"
          >
            ‹
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-8 w-8 rounded-xl border border-gray-200 bg-white text-sm disabled:opacity-40 hover:bg-gray-50 transition"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
