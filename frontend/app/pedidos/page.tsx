"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getOrders,
  type Order,
} from "@/lib/order-api";

// ── Design tokens (light theme — InterBR design system) ─────────────────────
const DS = {
  green:      "#16a34a",
  greenDark:  "#15803d",
  greenLight: "#f0fdf4",
  greenBorder:"#bbf7d0",
  white:      "#ffffff",
  gray50:     "#f9fafb",
  gray100:    "#f3f4f6",
  gray200:    "#e5e7eb",
  gray400:    "#9ca3af",
  gray500:    "#6b7280",
  gray700:    "#374151",
  gray900:    "#111827",
} as const;

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  pending_payment: { label: "Aguardando pagamento", bg: "#fffbeb", color: "#92400e", dot: "#f59e0b" },
  paid:            { label: "Pago",                 bg: "#eff6ff", color: "#1e40af", dot: "#3b82f6" },
  processing:      { label: "Em processamento",     bg: "#f5f3ff", color: "#5b21b6", dot: "#7c3aed" },
  shipped:         { label: "Enviado",              bg: "#f0f9ff", color: "#075985", dot: "#0ea5e9" },
  delivered:       { label: "Entregue",             bg: "#f0fdf4", color: "#14532d", dot: "#16a34a" },
  invoiced:        { label: "Faturado",             bg: "#f0fdf4", color: "#166534", dot: "#22c55e" },
  cancelled:       { label: "Cancelado",            bg: "#fef2f2", color: "#991b1b", dot: "#ef4444" },
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, bg: DS.gray100, color: DS.gray700, dot: DS.gray400 };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 600, padding: "3px 9px",
      borderRadius: 99, letterSpacing: "0.01em", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function NFeBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: DS.greenLight, color: "#15803d",
      fontSize: 11, fontWeight: 600, padding: "3px 9px",
      borderRadius: 99, border: `1px solid ${DS.greenBorder}`, whiteSpace: "nowrap",
    }}>
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
        <path d="M2 6.5l2.5 2.5 5.5-5.5" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      NF-e emitida
    </span>
  );
}

function OrderRow({ order, selected, onSelect }: {
  order: Order;
  selected: Order | null;
  onSelect: (o: Order | null) => void;
}) {
  const isOpen = selected?.id === order.id;
  const total = parseFloat(order.total);
  const productNames = order.items.map(i => i.product.name);

  return (
    <div
      onClick={() => onSelect(isOpen ? null : order)}
      className="ib-fade-up"
      style={{
        border: `1px solid ${isOpen ? DS.green : DS.gray200}`,
        borderRadius: 14,
        padding: "18px 22px",
        cursor: "pointer",
        background: isOpen ? DS.greenLight : DS.white,
        transition: "all 0.15s",
        marginBottom: 10,
        boxShadow: isOpen ? "0 0 0 3px rgba(22,163,74,0.08)" : "none",
      }}
      onMouseEnter={e => {
        if (!isOpen) {
          (e.currentTarget as HTMLDivElement).style.borderColor = DS.gray400;
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
        }
      }}
      onMouseLeave={e => {
        if (!isOpen) {
          (e.currentTarget as HTMLDivElement).style.borderColor = DS.gray200;
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }
      }}
    >
      {/* Main row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{
          fontFamily: "var(--font-dm-mono), monospace",
          fontSize: 14, fontWeight: 600, color: DS.gray900, minWidth: 110,
        }}>
          #{order.order_number}
        </span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
          <StatusBadge status={order.status} />
          {order.nfe_key && <NFeBadge />}
        </div>
        <span style={{
          fontFamily: "var(--font-dm-mono), monospace",
          fontSize: 16, fontWeight: 700, color: DS.gray900, marginLeft: "auto",
        }}>
          {fmt(total)}
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          style={{ transition: "transform 0.15s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6" stroke={DS.gray400} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: DS.gray500 }}>{fmtDate(order.created_at)}</span>
        <span style={{ color: DS.gray200 }}>·</span>
        <span style={{ fontSize: 12, color: DS.gray500 }}>
          {order.items.length} {order.items.length === 1 ? "item" : "itens"}
        </span>
        <span style={{ color: DS.gray200 }}>·</span>
        <span style={{ fontSize: 12, color: DS.gray500 }}>{order.payment_method_display}</span>
        <span style={{ color: DS.gray200 }}>·</span>
        <span style={{ fontSize: 12, color: DS.gray400, fontStyle: "italic" }}>
          {productNames.slice(0, 2).join(", ")}
          {productNames.length > 2 ? ` +${productNames.length - 2}` : ""}
        </span>
      </div>

      {/* Expanded action buttons */}
      {isOpen && (
        <div
          style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${DS.greenBorder}`, display: "flex", gap: 10, flexWrap: "wrap" }}
          onClick={e => e.stopPropagation()}
        >
          {order.nfe_pdf_url && (
            <a
              href={order.nfe_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 9,
                background: DS.green, border: "none", color: "#fff",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                textDecoration: "none", fontFamily: "inherit",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"
                  stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Baixar NF-e PDF
            </a>
          )}
          <Link
            href={`/pedidos/${order.id}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 9,
              background: DS.white, border: `1px solid ${DS.gray200}`, color: DS.gray700,
              fontSize: 13, fontWeight: 500, cursor: "pointer", textDecoration: "none",
              fontFamily: "inherit",
            }}
          >
            Ver detalhes completos
          </Link>
          {order.status === "pending_payment" && order.payment_link && (
            <a
              href={order.payment_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 9,
                background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e",
                fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none",
                fontFamily: "inherit",
              }}
            >
              Pagar agora
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PedidosPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const FILTERS = [
    { key: "all",             label: "Todos" },
    { key: "invoiced",        label: "Faturados" },
    { key: "pending_payment", label: "Aguardando" },
    { key: "cancelled",       label: "Cancelados" },
  ];

  useEffect(() => {
    if (!authLoading && !user) router.push("/login?next=/pedidos");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!accessToken) return;
    getOrders(accessToken)
      .then(({ orders, count }) => { setOrders(orders); setCount(count); })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const filtered = orders.filter(o => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch = !search
      || o.order_number.includes(search)
      || o.items.some(i => i.product.name.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const totalValue = orders
    .filter(o => o.status !== "cancelled")
    .reduce((s, o) => s + parseFloat(o.total), 0);
  const invoicedCount = orders.filter(o => o.status === "invoiced").length;
  const pendingCount  = orders.filter(o => o.status === "pending_payment").length;
  const nfeCount      = orders.filter(o => !!o.nfe_key).length;

  const initials = user?.full_name
    ? user.full_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : "?";

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: "100vh", background: DS.gray50, fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>
        {/* Skeleton header */}
        <div style={{ height: 60, background: DS.white, borderBottom: `1px solid ${DS.gray100}` }} />
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ height: 32, width: 200, borderRadius: 8, background: DS.gray100, animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ height: 72, borderRadius: 12, background: DS.gray100, animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 80, borderRadius: 14, background: DS.gray100, animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: DS.gray50, fontFamily: "var(--font-dm-sans), system-ui, sans-serif", color: DS.gray900 }}>
      <style>{`
        @keyframes ib-fade-up { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .ib-fade-up { animation: ib-fade-up 0.22s ease forwards; }
        input::placeholder { color: ${DS.gray400}; }
        input:focus { border-color: ${DS.green} !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.12) !important; }
      `}</style>

      {/* ── Sticky nav ─────────────────────────────────────────────────────── */}
      <div style={{
        background: DS.white, borderBottom: `1px solid ${DS.gray100}`,
        padding: "0 32px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: DS.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: DS.gray900, letterSpacing: "-0.02em" }}>InterBR</span>
          </Link>
        </div>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%", background: DS.green,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.02em",
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: DS.gray900 }}>{user.full_name}</div>
              <div style={{ fontSize: 11, color: DS.gray400 }}>
                {user.company?.nome_fantasia || user.company?.razao_social || user.role}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: DS.gray900, letterSpacing: "-0.03em", margin: 0, lineHeight: 1.2 }}>
              Meus pedidos
            </h1>
            <p style={{ fontSize: 14, color: DS.gray500, marginTop: 4, marginBottom: 0 }}>
              {count} {count === 1 ? "pedido" : "pedidos"} no total
            </p>
          </div>
          <Link
            href="/catalog"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "10px 18px", borderRadius: 10,
              background: DS.green, color: "#fff", textDecoration: "none",
              fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Novo pedido
          </Link>
        </div>

        {/* ── Stat cards ───────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Valor total (ativos)", value: fmt(totalValue), color: DS.gray900 },
            { label: "Faturados",            value: invoicedCount,    color: DS.green },
            { label: "Aguardando",           value: pendingCount,     color: "#d97706" },
            { label: "NF-e emitidas",        value: nfeCount,         color: "#2563eb" },
          ].map((stat, i) => (
            <div key={i} style={{
              background: DS.white, border: `1px solid ${DS.gray100}`,
              borderRadius: 12, padding: "14px 16px",
            }}>
              <div style={{ fontSize: 11, color: DS.gray400, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: 20, fontWeight: 700, color: stat.color,
                fontFamily: "var(--font-dm-mono), monospace", letterSpacing: "-0.03em",
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters + search ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{
            display: "flex", gap: 4, background: DS.white,
            padding: 4, borderRadius: 10, border: `1px solid ${DS.gray100}`,
          }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "5px 12px", borderRadius: 7, border: "none",
                  fontSize: 12, fontWeight: 500,
                  background: filter === f.key ? DS.green : "transparent",
                  color: filter === f.key ? "#fff" : DS.gray500,
                  cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke={DS.gray400} strokeWidth="1.5"/>
              <path d="m21 21-4.35-4.35" stroke={DS.gray400} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por número ou produto..."
              style={{
                width: "100%", height: 36, border: `1px solid ${DS.gray200}`,
                borderRadius: 9, paddingLeft: 34, paddingRight: 12,
                fontSize: 13, background: DS.white, fontFamily: "inherit",
                color: DS.gray900, transition: "all .15s",
              }}
            />
          </div>
        </div>

        {/* ── Orders list ──────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: DS.gray400 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 12px", display: "block" }}>
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                stroke={DS.gray200} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ fontSize: 14 }}>
              {orders.length === 0 ? "Nenhum pedido ainda." : "Nenhum pedido encontrado."}
            </div>
            {orders.length === 0 && (
              <Link href="/catalog" style={{ display: "inline-block", marginTop: 12, fontSize: 13, color: DS.green, textDecoration: "none", fontWeight: 500 }}>
                Explorar catálogo →
              </Link>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((order, i) => (
              <div key={order.id} style={{ animationDelay: `${i * 40}ms` }}>
                <OrderRow order={order} selected={selected} onSelect={setSelected} />
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 32, fontSize: 12, color: DS.gray200 }}>
          Interbrasil Distribuidora · Dúvidas? contato@interbrasil.com.br
        </div>
      </div>
    </div>
  );
}
