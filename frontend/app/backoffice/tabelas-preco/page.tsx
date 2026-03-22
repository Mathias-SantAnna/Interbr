"use client";

import { useEffect, useState, FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getPriceLists,
  createPriceList,
  updatePriceList,
  deletePriceList,
  setPriceListItems,
  assignPriceListToCompany,
  type PriceList,
} from "@/lib/reports-api";
import { getAdminProducts, type AdminProduct } from "@/lib/admin-api";
import { getAdminCompanies, type AdminCompany } from "@/lib/admin-api";
import { formatPrice } from "@/lib/catalog-api";

const fc = "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary";

// ── Price List Form Modal ─────────────────────────────────────────────────────
function PriceListModal({
  priceList,
  token,
  onClose,
  onSaved,
}: {
  priceList: Partial<PriceList>;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: priceList.name ?? "",
    description: priceList.description ?? "",
    global_discount_pct: priceList.global_discount_pct ?? "0",
    is_active: priceList.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!priceList.id;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit) await updatePriceList(token, priceList.id!, form);
      else await createPriceList(token, form);
      onSaved();
    } catch {
      setError("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{isEdit ? "Editar" : "Nova"} tabela de preços</h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-foreground">✕</button>
          </div>
          {error && <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nome *</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={fc} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descrição</label>
            <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={fc} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Desconto global (%)</label>
            <input type="number" min="0" max="100" step="0.5" value={form.global_discount_pct}
              onChange={(e) => setForm((f) => ({ ...f, global_discount_pct: e.target.value }))} className={fc} />
            <p className="text-xs text-gray-500">Aplicado a todos os produtos que não têm preço específico na tabela.</p>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="accent-primary" />
            Tabela ativa
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

// ── Product Prices Slide-over ─────────────────────────────────────────────────
function PriceItemsDrawer({
  priceList,
  token,
  onClose,
}: {
  priceList: PriceList;
  token: string;
  onClose: () => void;
}) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const initial: Record<string, string> = {};
    priceList.items.forEach((item) => { initial[item.product] = item.price; });
    Promise.all([
      getAdminProducts(token, {}),
    ]).then(([prod]) => {
      setProducts(prod.results);
      setPrices(initial);
    });
  }, [token, priceList]);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const items = Object.entries(prices)
      .filter(([, v]) => v !== "" && !isNaN(parseFloat(v)))
      .map(([product_id, price]) => ({ product_id, price: parseFloat(price) }));
    await setPriceListItems(token, priceList.id, items).catch(() => null);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const overrideCount = Object.values(prices).filter((v) => v !== "").length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-xl overflow-hidden flex flex-col bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">{priceList.name} — Preços</h2>
            <p className="text-xs text-gray-500">{overrideCount} preços específicos definidos</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-8 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar preços"}
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-foreground text-lg">✕</button>
          </div>
        </div>

        <div className="p-4 border-b">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar produtos..."
            className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-gray-500">SKU: {p.sku} · Base: {formatPrice(parseFloat(p.base_price))}</p>
              </div>
              <div className="relative shrink-0">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={String(parseFloat(p.base_price).toFixed(2))}
                  value={prices[p.id] ?? ""}
                  onChange={(e) => setPrices((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  className={`h-8 w-28 rounded-md border border-border pl-7 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 ${prices[p.id] ? "border-primary bg-primary/5" : ""}`}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t px-4 py-3 text-xs text-gray-500 bg-muted/20">
          Deixe o campo vazio para usar o preço base ou desconto global. Clique em &quot;Salvar preços&quot; para aplicar.
        </div>
      </div>
    </div>
  );
}

// ── Assign Company Modal ──────────────────────────────────────────────────────
function AssignCompanyModal({
  priceList,
  token,
  onClose,
}: {
  priceList: PriceList;
  token: string;
  onClose: () => void;
}) {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { getAdminCompanies(token, {}).then(setCompanies); }, [token]);

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase();
    return c.display_name.toLowerCase().includes(q) || c.cnpj.includes(q);
  });

  async function handleAssign(companyId: string) {
    setSaving(true);
    try {
      const res = await assignPriceListToCompany(token, priceList.id, companyId);
      setMsg(res.detail);
    } catch {
      setMsg("Erro ao atribuir.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-background shadow-xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-semibold">Atribuir tabela</h2>
            <p className="text-sm text-gray-500">{priceList.name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-foreground">✕</button>
        </div>
        {msg && <div className="mx-5 mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">{msg}</div>}
        <div className="p-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar empresa..." className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" />
        </div>
        <div className="flex-1 overflow-y-auto divide-y px-2 pb-2">
          {filtered.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium">{c.display_name}</p>
                <p className="text-xs text-gray-500">{c.cnpj}</p>
              </div>
              <button
                onClick={() => handleAssign(c.id)}
                disabled={saving}
                className="h-7 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 shrink-0"
              >
                Atribuir
              </button>
            </div>
          ))}
        </div>
        <div className="border-t p-4">
          <button onClick={onClose} className="w-full h-8 rounded-lg border bg-background text-sm hover:bg-muted">Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TabelasPrecoPage() {
  const { accessToken } = useAuth();
  const [lists, setLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Partial<PriceList> | null>(null);
  const [itemsDrawer, setItemsDrawer] = useState<PriceList | null>(null);
  const [assignModal, setAssignModal] = useState<PriceList | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    getPriceLists(accessToken)
      .then(setLists)
      .finally(() => setLoading(false));
  }, [accessToken, refresh]);

  async function handleDelete(id: string) {
    if (!accessToken || !confirm("Excluir esta tabela? As empresas vinculadas perderão os preços.")) return;
    setDeleting(id);
    await deletePriceList(accessToken, id).catch(() => null);
    setRefresh((r) => r + 1);
    setDeleting(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tabelas de Preços</h1>
          <p className="text-sm text-gray-500">{lists.length} tabelas</p>
        </div>
        <button
          onClick={() => setModal({})}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
        >
          + Nova tabela
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />)}</div>
      ) : lists.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm border-dashed p-16 text-center space-y-2">
          <p className="text-gray-500">Nenhuma tabela de preços cadastrada.</p>
          <button onClick={() => setModal({})} className="text-sm text-primary hover:underline">Criar primeira tabela →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <div key={list.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{list.name}</h3>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${list.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {list.is_active ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                  {list.description && <p className="text-sm text-gray-500 mt-0.5">{list.description}</p>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setItemsDrawer(list)} className="h-7 rounded-md bg-blue-50 border border-blue-200 px-2.5 text-xs text-blue-700 hover:bg-blue-100 font-medium">
                    Preços ({list.items.length})
                  </button>
                  <button onClick={() => setAssignModal(list)} className="h-7 rounded-md border bg-background px-2.5 text-xs hover:bg-muted">
                    Empresas ({list.company_count})
                  </button>
                  <button onClick={() => setModal(list)} className="h-7 rounded-md border bg-background px-2.5 text-xs hover:bg-muted">Editar</button>
                  <button onClick={() => handleDelete(list.id)} disabled={deleting === list.id} className="h-7 rounded-md bg-red-50 border border-red-200 px-2.5 text-xs text-red-600 hover:bg-red-100 disabled:opacity-40">
                    {deleting === list.id ? "..." : "Excluir"}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span>Desconto global: <strong className="text-foreground">{list.global_discount_pct}%</strong></span>
                <span>Preços específicos: <strong className="text-foreground">{list.items.length}</strong></span>
                <span>Empresas vinculadas: <strong className="text-foreground">{list.company_count}</strong></span>
              </div>
              {list.items.length > 0 && (
                <div className="rounded-lg bg-gray-50 p-3 grid gap-1.5 sm:grid-cols-2">
                  {list.items.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 truncate max-w-[140px]">{item.product_name}</span>
                      <span className="font-semibold ml-2 shrink-0">{formatPrice(parseFloat(item.price))}</span>
                    </div>
                  ))}
                  {list.items.length > 4 && (
                    <button onClick={() => setItemsDrawer(list)} className="text-xs text-primary hover:underline text-left">
                      +{list.items.length - 4} mais...
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <PriceListModal
          priceList={modal}
          token={accessToken!}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); setRefresh((r) => r + 1); }}
        />
      )}
      {itemsDrawer && (
        <PriceItemsDrawer
          priceList={itemsDrawer}
          token={accessToken!}
          onClose={() => { setItemsDrawer(null); setRefresh((r) => r + 1); }}
        />
      )}
      {assignModal && (
        <AssignCompanyModal
          priceList={assignModal}
          token={accessToken!}
          onClose={() => { setAssignModal(null); setRefresh((r) => r + 1); }}
        />
      )}
    </div>
  );
}
