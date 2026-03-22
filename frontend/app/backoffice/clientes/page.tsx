"use client";

import { useEffect, useState, FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getAdminCompanies,
  updateCompany,
  assignSalesman,
  getAdminUsers,
  type AdminCompany,
  type AdminUser,
} from "@/lib/admin-api";
import { getPriceLists, assignPriceListToCompany, type PriceList } from "@/lib/reports-api";
import { TIER_COLOR, TIER_LABEL } from "@/lib/salesman-api";

function formatMoney(v: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(v || "0"));
}

const TIERS = [
  { value: "consumidor", label: "Consumidor Final", max: 10 },
  { value: "revendedor", label: "Revendedor", max: 15 },
  { value: "distribuidor", label: "Distribuidor", max: 20 },
];

const PAYMENT_TERMS = [
  { value: "immediate", label: "À vista" },
  { value: "net_30", label: "30 dias" },
  { value: "net_60", label: "60 dias" },
  { value: "net_90", label: "90 dias" },
];

function EditModal({
  company,
  token,
  priceLists,
  onClose,
  onSaved,
}: {
  company: AdminCompany;
  token: string;
  priceLists: PriceList[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    tier: company.tier,
    credit_limit: company.credit_limit,
    payment_terms: company.payment_terms,
    is_active: company.is_active,
  });
  const [selectedPriceList, setSelectedPriceList] = useState("");
  const [assigningPL, setAssigningPL] = useState(false);
  const [plMsg, setPlMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateCompany(token, company.id, form);
      onSaved();
    } catch {
      setError("Erro ao salvar. Verifique os dados.");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Editar cliente</h2>
              <p className="text-sm text-gray-500">{company.display_name}</p>
            </div>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-foreground text-xl">✕</button>
          </div>

          {error && <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tier comercial</label>
            <select
              value={form.tier}
              onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
              className={fieldClass}
            >
              {TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label} (desconto máx: {t.max}%)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Limite de crédito (R$)</label>
            <input
              type="number"
              min="0"
              step="100"
              value={form.credit_limit}
              onChange={(e) => setForm((f) => ({ ...f, credit_limit: e.target.value }))}
              className={fieldClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Prazo de pagamento</label>
            <select
              value={form.payment_terms}
              onChange={(e) => setForm((f) => ({ ...f, payment_terms: e.target.value }))}
              className={fieldClass}
            >
              {PAYMENT_TERMS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 rounded-lg border border-dashed p-3">
            <label className="text-sm font-medium">Tabela de preços</label>
            <div className="flex gap-2">
              <select
                value={selectedPriceList}
                onChange={(e) => setSelectedPriceList(e.target.value)}
                className="flex-1 h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
              >
                <option value="">Preço padrão (sem tabela)</option>
                {priceLists.filter((pl) => pl.is_active).map((pl) => (
                  <option key={pl.id} value={pl.id}>{pl.name}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={assigningPL || !selectedPriceList}
                onClick={async () => {
                  setAssigningPL(true);
                  await assignPriceListToCompany(token, selectedPriceList, company.id).catch(() => null);
                  setPlMsg("Tabela atribuída!");
                  setAssigningPL(false);
                  setTimeout(() => setPlMsg(""), 2000);
                }}
                className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 shrink-0"
              >
                {assigningPL ? "..." : "Atribuir"}
              </button>
            </div>
            {plMsg && <p className="text-xs text-green-600">{plMsg}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="accent-primary"
            />
            Conta ativa
          </label>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg border bg-background text-sm font-medium hover:bg-muted">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 h-9 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignModal({
  company,
  salesmen,
  token,
  onClose,
}: {
  company: AdminCompany;
  salesmen: AdminUser[];
  token: string;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleAssign(e: FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await assignSalesman(token, company.id, selectedId) as { detail: string };
      setMsg(res.detail ?? "Vendedor atribuído!");
    } catch {
      setMsg("Erro ao atribuir vendedor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-background shadow-xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Atribuir vendedor</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-foreground">✕</button>
        </div>
        <p className="text-sm text-gray-500">{company.display_name}</p>

        {msg ? (
          <p className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">{msg}</p>
        ) : (
          <form onSubmit={handleAssign} className="space-y-3">
            <select
              required
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
            >
              <option value="">Selecionar vendedor...</option>
              {salesmen.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} — {s.email}</option>
              ))}
            </select>
            <button type="submit" disabled={saving || !selectedId} className="w-full h-9 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50">
              {saving ? "Atribuindo..." : "Atribuir"}
            </button>
          </form>
        )}
        <button onClick={onClose} className="w-full h-8 rounded-lg border bg-background text-sm hover:bg-muted">
          {msg ? "Fechar" : "Cancelar"}
        </button>
      </div>
    </div>
  );
}

export default function AdminClientsPage() {
  const { accessToken } = useAuth();
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [salesmen, setSalesmen] = useState<AdminUser[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<AdminCompany | null>(null);
  const [assignModal, setAssignModal] = useState<AdminCompany | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      getAdminCompanies(accessToken, { q: search || undefined, tier: tierFilter || undefined }),
      getAdminUsers(accessToken, "salesman"),
      getPriceLists(accessToken),
    ])
      .then(([c, s, pl]) => { setCompanies(c); setSalesmen(s); setPriceLists(pl); })
      .finally(() => setLoading(false));
  }, [accessToken, search, tierFilter, refresh]);

  const TIER_FILTERS = [
    { value: "", label: "Todos os tiers" },
    { value: "consumidor", label: "Consumidor" },
    { value: "revendedor", label: "Revendedor" },
    { value: "distribuidor", label: "Distribuidor" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-gray-500">{companies.length} empresas</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, CNPJ..."
          className="h-9 w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
        />
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
        >
          {TIER_FILTERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              {["Empresa", "CNPJ", "Tier", "Prazo", "Limite Créd.", "Status", "Ações"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-gray-100 animate-pulse" /></td>)}</tr>
              ))
            ) : companies.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Nenhuma empresa encontrada.</td></tr>
            ) : (
              companies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium max-w-[160px] truncate">{c.display_name}</p>
                      {c.email && <p className="text-xs text-gray-500 truncate max-w-[160px]">{c.email}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.cnpj}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${TIER_COLOR[c.tier]}`}>
                      {TIER_LABEL[c.tier] ?? c.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.payment_terms_display}</td>
                  <td className="px-4 py-3 text-sm">{formatMoney(c.credit_limit)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${c.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {c.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => setEditModal(c)}
                        className="h-7 rounded-md bg-primary/10 border border-primary/20 px-2.5 text-xs font-medium text-primary hover:bg-primary/20"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setAssignModal(c)}
                        className="h-7 rounded-md border bg-background px-2.5 text-xs hover:bg-muted"
                      >
                        Vendedor
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editModal && (
        <EditModal
          company={editModal}
          token={accessToken!}
          priceLists={priceLists}
          onClose={() => setEditModal(null)}
          onSaved={() => { setEditModal(null); setRefresh((r) => r + 1); }}
        />
      )}
      {assignModal && (
        <AssignModal
          company={assignModal}
          salesmen={salesmen}
          token={accessToken!}
          onClose={() => { setAssignModal(null); setRefresh((r) => r + 1); }}
        />
      )}
    </div>
  );
}
