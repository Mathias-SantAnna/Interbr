"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getReports, type ReportData } from "@/lib/reports-api";
import { formatPrice } from "@/lib/catalog-api";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/order-api";

const PERIOD_OPTIONS = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
];

function BarChart({ data, valueKey, labelKey, color = "bg-primary" }: {
  data: Record<string, unknown>[];
  valueKey: string;
  labelKey: string;
  color?: string;
}) {
  if (!data.length) return <p className="text-sm text-gray-500 py-4 text-center">Sem dados.</p>;
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0));
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const pct = max > 0 ? (val / max) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="w-32 truncate text-xs text-gray-500 shrink-0">{String(d[labelKey])}</span>
            <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
              <div className={`h-full rounded ${color} transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-24 text-right text-xs font-medium shrink-0">{String(d.label ?? val)}</span>
          </div>
        );
      })}
    </div>
  );
}

function RevenueSparkline({ daily }: { daily: ReportData["daily"] }) {
  if (!daily.length) return null;
  const max = Math.max(...daily.map((d) => d.revenue), 1);
  const W = 600, H = 80, pad = 4;
  const pts = daily.map((d, i) => {
    const x = pad + (i / (daily.length - 1 || 1)) * (W - pad * 2);
    const y = H - pad - ((d.revenue / max) * (H - pad * 2));
    return `${x},${y}`;
  });
  const area = `M ${pts[0]} ` + pts.slice(1).map((p) => `L ${p}`).join(" ") + ` L ${W - pad},${H - pad} L ${pad},${H - pad} Z`;
  const line = `M ${pts[0]} ` + pts.slice(1).map((p) => `L ${p}`).join(" ");

  return (
    <div className="space-y-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20">
        <path d={area} fill="hsl(var(--primary))" fillOpacity="0.15" />
        <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>{daily[0]?.date?.slice(5)}</span>
        <span>{daily[Math.floor(daily.length / 2)]?.date?.slice(5)}</span>
        <span>{daily[daily.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  );
}

export default function RelatoriosPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<ReportData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    getReports(accessToken, days)
      .then(setData)
      .finally(() => setLoading(false));
  }, [accessToken, days]);

  const totalOrders = data?.summary.total_orders ?? 0;
  const totalRevenue = data?.summary.total_revenue ?? 0;
  const newClients = data?.summary.new_clients ?? 0;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const topProductsChart = (data?.top_products ?? []).map((p) => ({
    name: p.name.length > 28 ? p.name.slice(0, 28) + "…" : p.name,
    revenue: p.revenue,
    label: formatPrice(p.revenue),
  }));

  const topClientsChart = (data?.top_clients ?? []).map((c) => ({
    name: c.name.length > 28 ? c.name.slice(0, 28) + "…" : c.name,
    spend: c.spend,
    label: formatPrice(c.spend),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-gray-500">Análise de desempenho</p>
        </div>
        <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${days === opt.value ? "bg-background shadow-sm" : "text-gray-500 hover:text-foreground"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Receita", value: formatPrice(totalRevenue), sub: `últimos ${days} dias` },
          { label: "Pedidos", value: totalOrders, sub: `ticket médio: ${formatPrice(avgOrder)}` },
          { label: "Novos clientes", value: newClients, sub: `últimos ${days} dias` },
          {
            label: "Pedidos pagos",
            value: data?.by_status.filter((s) => ["confirmed","invoiced","shipped","delivered"].includes(s.status)).reduce((a, s) => a + s.count, 0) ?? 0,
            sub: "confirmados + enviados"
          },
        ].map((card) => (
          <div key={card.label} className={`rounded-2xl border border-gray-100 bg-white shadow-sm bg-background p-5 space-y-1 ${loading ? "animate-pulse" : ""}`}>
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-gray-500">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-3">
        <h2 className="font-semibold">Receita diária</h2>
        {loading ? <div className="h-20 rounded bg-gray-100 animate-pulse" /> : <RevenueSparkline daily={data?.daily ?? []} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top products */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-4">
          <h2 className="font-semibold">Top produtos por receita</h2>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-5 rounded bg-gray-100 animate-pulse" />)}</div>
          ) : (
            <BarChart data={topProductsChart} valueKey="revenue" labelKey="name" color="bg-primary" />
          )}
        </div>

        {/* Top clients */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-4">
          <h2 className="font-semibold">Top clientes por gasto</h2>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-5 rounded bg-gray-100 animate-pulse" />)}</div>
          ) : (
            <BarChart data={topClientsChart} valueKey="spend" labelKey="name" color="bg-blue-500" />
          )}
        </div>
      </div>

      {/* Orders by status */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-4">
        <h2 className="font-semibold">Pedidos por status</h2>
        {loading ? (
          <div className="flex gap-3 flex-wrap">{[...Array(5)].map((_, i) => <div key={i} className="h-16 w-28 rounded-xl bg-gray-100 animate-pulse" />)}</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {(data?.by_status ?? []).map((s) => (
              <div key={s.status} className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white shadow-sm p-4 min-w-[100px]">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium mb-2 ${ORDER_STATUS_COLOR[s.status] ?? "bg-gray-100 text-gray-700"}`}>
                  {ORDER_STATUS_LABEL[s.status] ?? s.status}
                </span>
                <p className="text-2xl font-bold">{s.count}</p>
              </div>
            ))}
            {(!data?.by_status.length) && <p className="text-sm text-gray-500">Sem pedidos no período.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
