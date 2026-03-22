"use client";

import { useEffect, useState, FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getAdminPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  type AdminPromoCode,
} from "@/lib/admin-api";
import { formatPrice } from "@/lib/catalog-api";

type FormState = Partial<AdminPromoCode>;
const EMPTY: FormState = {
  code: "", description: "", discount_type: "percentage",
  discount_value: "0", min_order_value: "0",
  max_uses: undefined, is_active: true,
  valid_from: null, valid_until: null,
};

const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  percentage: "Percentual (%)",
  fixed: "Valor fixo (R$)",
  free_shipping: "Frete grátis",
};

function PromoModal({
  promo,
  onClose,
  onSaved,
  token,
}: {
  promo: FormState;
  onClose: () => void;
  onSaved: () => void;
  token: string;
}) {
  const [form, setForm] = useState<FormState>(promo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!form.id;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await updatePromoCode(token, form.id!, form);
      } else {
        await createPromoCode(token, form);
      }
      onSaved();
    } catch (err: unknown) {
      const e = err as { data?: Record<string, unknown> };
      setError(e?.data ? Object.values(e.data).flat().join(" ") : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const f = (label: string, key: keyof FormState, type = "text", required = false) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}{required && " *"}</label>
      <input
        type={type}
        required={required}
        value={String(form[key] ?? "")}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            [key]: type === "number" ? (e.target.value === "" ? undefined : parseFloat(e.target.value)) : e.target.value || null,
          }))
        }
        className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{isEdit ? "Editar" : "Novo"} promo code</h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-foreground">✕</button>
          </div>

          {error && <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          {f("Código", "code", "text", true)}
          {f("Descrição", "description")}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tipo de desconto *</label>
            <select
              required
              value={form.discount_type ?? "percentage"}
              onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value }))}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
            >
              {Object.entries(DISCOUNT_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          {form.discount_type !== "free_shipping" && f("Valor do desconto", "discount_value", "number", true)}
          <div className="grid gap-3 sm:grid-cols-2">
            {f("Pedido mínimo (R$)", "min_order_value", "number")}
            {f("Máx. usos (vazio = ilimitado)", "max_uses", "number")}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {f("Válido de", "valid_from", "datetime-local")}
            {f("Válido até", "valid_until", "datetime-local")}
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="accent-primary"
            />
            Ativo
          </label>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg border bg-background text-sm font-medium hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 h-9 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPromoCodesPage() {
  const { accessToken } = useAuth();
  const [promos, setPromos] = useState<AdminPromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<FormState | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    getAdminPromoCodes(accessToken)
      .then(setPromos)
      .finally(() => setLoading(false));
  }, [accessToken, refresh]);

  async function handleDelete(id: string) {
    if (!accessToken || !confirm("Excluir este promo code?")) return;
    setDeleting(id);
    await deletePromoCode(accessToken, id).catch(() => null);
    setRefresh((r) => r + 1);
    setDeleting(null);
  }

  function formatDiscountValue(p: AdminPromoCode) {
    if (p.discount_type === "free_shipping") return "Frete grátis";
    if (p.discount_type === "percentage") return `${p.discount_value}%`;
    return formatPrice(parseFloat(p.discount_value));
  }

  function formatDateShort(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Promo Codes</h1>
          <p className="text-sm text-gray-500">{promos.length} códigos</p>
        </div>
        <button
          onClick={() => setModal({ ...EMPTY })}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
        >
          + Novo código
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              {["Código", "Desconto", "Usos", "Mín. pedido", "Validade", "Status", "Ações"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-gray-100 animate-pulse" /></td>)}</tr>
              ))
            ) : promos.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Nenhum código cadastrado.</td></tr>
            ) : (
              promos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono font-semibold">{p.code}</td>
                  <td className="px-4 py-3">{formatDiscountValue(p)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.uses_count}{p.max_uses ? ` / ${p.max_uses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatPrice(parseFloat(p.min_order_value))}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {formatDateShort(p.valid_from)} → {formatDateShort(p.valid_until)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      p.is_valid_now ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {p.is_valid_now ? "Válido" : p.is_active ? "Expirado" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => setModal(p)} className="h-7 rounded-md border bg-background px-2.5 text-xs hover:bg-muted">Editar</button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="h-7 rounded-md bg-red-50 border border-red-200 px-2.5 text-xs text-red-600 hover:bg-red-100 disabled:opacity-40"
                      >
                        {deleting === p.id ? "..." : "Excluir"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <PromoModal
          promo={modal}
          token={accessToken!}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); setRefresh((r) => r + 1); }}
        />
      )}
    </div>
  );
}
