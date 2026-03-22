"use client";

import { useEffect, useState, FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type AdminProduct,
} from "@/lib/admin-api";
import { getCatalogCategories, formatPrice } from "@/lib/catalog-api";

type Category = { id: string; name: string; slug: string };
type ModalProduct = Partial<AdminProduct>;

const EMPTY: ModalProduct = {
  sku: "", name: "", description: "", base_price: "0",
  unit: "un", stock_qty: 0, weight_kg: "0", ncm_code: "",
  image_url: "", is_featured: false, is_active: true,
};

function ProductModal({
  product,
  categories,
  onClose,
  onSaved,
  token,
}: {
  product: ModalProduct;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
  token: string;
}) {
  const [form, setForm] = useState<ModalProduct>(product);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!form.slug;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await updateProduct(token, form.slug!, form);
      } else {
        await createProduct(token, form);
      }
      onSaved();
    } catch (err: unknown) {
      const e = err as { data?: Record<string, unknown> };
      setError(e?.data ? Object.values(e.data).flat().join(" ") : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const field = (label: string, key: keyof ModalProduct, type = "text", required = false) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}{required && " *"}</label>
      <input
        type={type}
        required={required}
        value={String(form[key] ?? "")}
        onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))}
        className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-background shadow-xl sm:rounded-l-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{isEdit ? "Editar" : "Novo"} produto</h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-foreground">✕</button>
          </div>

          {error && <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            {field("SKU", "sku", "text", true)}
            {field("Nome", "name", "text", true)}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Categoria</label>
            <select
              value={String(form.category ?? "")}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value || null }))}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {field("Preço base (R$)", "base_price", "number", true)}
            {field("Unidade", "unit")}
            {field("Estoque", "stock_qty", "number")}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {field("Peso (kg)", "weight_kg", "number")}
            {field("NCM", "ncm_code")}
          </div>
          {field("URL da imagem", "image_url")}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.is_featured}
                onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                className="accent-primary"
              />
              Destaque
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="accent-primary"
              />
              Ativo
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-lg border bg-background text-sm font-medium hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-9 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const { accessToken } = useAuth();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalProduct | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<Record<string, number>>({});
  const [savingStock, setSavingStock] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    getAdminProducts(accessToken, { q: search || undefined, page })
      .then((data) => { setProducts(data.results); setTotal(data.count); })
      .finally(() => setLoading(false));
  }, [accessToken, search, page, refresh]);

  useEffect(() => {
    if (!accessToken) return;
    getCatalogCategories().then((cats) => setCategories(cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))));
  }, [accessToken]);

  async function handleDelete(slug: string) {
    if (!accessToken || !confirm("Excluir este produto?")) return;
    setDeleting(slug);
    await deleteProduct(accessToken, slug).catch(() => null);
    setRefresh((r) => r + 1);
    setDeleting(null);
  }

  async function handleStockSave(slug: string) {
    if (!accessToken || editStock[slug] === undefined) return;
    setSavingStock(slug);
    await updateProduct(accessToken, slug, { stock_qty: editStock[slug] });
    setEditStock((prev) => { const n = { ...prev }; delete n[slug]; return n; });
    setRefresh((r) => r + 1);
    setSavingStock(null);
  }

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-gray-500">{total} produtos</p>
        </div>
        <button
          onClick={() => setModal({ ...EMPTY })}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
        >
          + Novo produto
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Buscar por nome ou SKU..."
        className="h-9 w-full max-w-sm rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
      />

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              {["SKU", "Nome", "Categoria", "Preço", "Estoque", "Status", "Ações"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(7)].map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-gray-100 animate-pulse" /></td>
                ))}</tr>
              ))
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Nenhum produto.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.category_name ?? "—"}</td>
                  <td className="px-4 py-3">{formatPrice(parseFloat(p.base_price))}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={editStock[p.slug] ?? p.stock_qty}
                        onChange={(e) => setEditStock((prev) => ({ ...prev, [p.slug]: parseInt(e.target.value) || 0 }))}
                        className={`h-7 w-16 rounded-md border px-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/50 ${p.stock_qty === 0 ? "border-red-300 text-red-600" : p.stock_qty < 5 ? "border-yellow-300 text-yellow-700" : "border-border"}`}
                      />
                      {editStock[p.slug] !== undefined && editStock[p.slug] !== p.stock_qty && (
                        <button
                          onClick={() => handleStockSave(p.slug)}
                          disabled={savingStock === p.slug}
                          className="h-7 rounded-md bg-green-600 px-2 text-[10px] font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {savingStock === p.slug ? "..." : "✓"}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${p.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setModal(p)}
                        className="h-7 rounded-md border bg-background px-2.5 text-xs hover:bg-muted"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p.slug)}
                        disabled={deleting === p.slug}
                        className="h-7 rounded-md bg-red-50 border border-red-200 px-2.5 text-xs text-red-600 hover:bg-red-100 disabled:opacity-40"
                      >
                        {deleting === p.slug ? "..." : "Excluir"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 rounded-lg border bg-background text-sm disabled:opacity-40 hover:bg-muted">‹</button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 w-8 rounded-lg border bg-background text-sm disabled:opacity-40 hover:bg-muted">›</button>
        </div>
      )}

      {modal && (
        <ProductModal
          product={modal}
          categories={categories}
          token={accessToken!}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); setRefresh((r) => r + 1); }}
        />
      )}
    </div>
  );
}
