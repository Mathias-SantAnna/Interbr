"use client";

import { useEffect, useState, FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { type CatalogCategory } from "@/lib/catalog-api";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function adminFetch<T>(path: string, token: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw Object.assign(new Error("API error"), { data: b }); }
  if (res.status === 204) return undefined as T;
  return res.json();
}

type AdminCategory = CatalogCategory & {
  is_active?: boolean;
  order?: number;
  parent?: string | null;
  description?: string;
  image?: string;
  product_count?: number;
};

function CategoryModal({
  category,
  allCategories,
  token,
  onClose,
  onSaved,
}: {
  category: Partial<AdminCategory>;
  allCategories: AdminCategory[];
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: category.name ?? "",
    description: category.description ?? "",
    image: category.image ?? "",
    order: category.order ?? 0,
    parent: category.slug ? (category.parent ?? "") : "",
    is_active: category.slug ? ((category.is_active ?? true)) : true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!category.slug;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = { ...form, parent: form.parent || null };
    try {
      if (isEdit) {
        await adminFetch(`/admin/categories/${category.slug}/`, token, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await adminFetch("/admin/categories/", token, { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch (err: unknown) {
      const e = err as { data?: Record<string, unknown> };
      setError(e?.data ? Object.values(e.data).flat().join(" ") : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const fc = "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary";
  const roots = allCategories.filter((c) => !c.parent && c.slug !== category.slug);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{isEdit ? "Editar" : "Nova"} categoria</h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-foreground">✕</button>
          </div>
          {error && <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Nome *</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={fc} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Descrição</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={fc} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">URL da imagem</label>
              <input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} className={fc} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Categoria pai</label>
              <select value={form.parent} onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))} className={fc}>
                <option value="">Nenhuma (raiz)</option>
                {roots.map((c) => <option key={c.slug} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Ordem</label>
              <input type="number" min="0" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))} className={fc} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="accent-primary" />
            Ativa
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

export default function AdminCategoriasPage() {
  const { accessToken } = useAuth();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Partial<AdminCategory> | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    adminFetch<AdminCategory[] | { results: AdminCategory[]; count: number }>("/admin/categories/", accessToken)
      .then((data) => setCategories(Array.isArray(data) ? data : data.results))
      .finally(() => setLoading(false));
  }, [accessToken, refresh]);

  async function handleDelete(slug: string) {
    if (!accessToken || !confirm("Excluir esta categoria?")) return;
    setDeleting(slug);
    await adminFetch(`/admin/categories/${slug}/`, accessToken, { method: "DELETE" }).catch(() => null);
    setRefresh((r) => r + 1);
    setDeleting(null);
  }

  const roots = categories.filter((c) => !c.parent);
  const children = categories.filter((c) => c.parent);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-gray-500">{categories.length} categorias</p>
        </div>
        <button
          onClick={() => setModal({})}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
        >
          + Nova categoria
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : roots.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm border-dashed p-12 text-center text-gray-500">Nenhuma categoria.</div>
      ) : (
        <div className="space-y-3">
          {roots.map((cat) => {
            const subs = children.filter((c) => c.parent === cat.id || c.parent === cat.slug);
            return (
              <div key={cat.slug} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                {/* Root category row */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                  <div className="flex items-center gap-3">
                    {cat.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cat.image} alt={cat.name} className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {cat.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{cat.name}</p>
                      <p className="text-xs text-gray-500">{cat.product_count} produtos · slug: {cat.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setModal(cat)} className="h-7 rounded-md border bg-background px-2.5 text-xs hover:bg-muted">Editar</button>
                    <button onClick={() => handleDelete(cat.slug)} disabled={deleting === cat.slug} className="h-7 rounded-md bg-red-50 border border-red-200 px-2.5 text-xs text-red-600 hover:bg-red-100 disabled:opacity-40">
                      {deleting === cat.slug ? "..." : "Excluir"}
                    </button>
                  </div>
                </div>
                {/* Sub-categories */}
                {subs.map((sub) => (
                  <div key={sub.slug} className="flex items-center justify-between px-4 py-2.5 border-t pl-12">
                    <div>
                      <p className="text-sm font-medium">{sub.name}</p>
                      <p className="text-xs text-gray-500">{sub.product_count} produtos · slug: {sub.slug}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setModal(sub)} className="h-7 rounded-md border bg-background px-2.5 text-xs hover:bg-muted">Editar</button>
                      <button onClick={() => handleDelete(sub.slug)} disabled={deleting === sub.slug} className="h-7 rounded-md bg-red-50 border border-red-200 px-2.5 text-xs text-red-600 hover:bg-red-100 disabled:opacity-40">
                        {deleting === sub.slug ? "..." : "Excluir"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {modal !== null && (
        <CategoryModal
          category={modal}
          allCategories={categories}
          token={accessToken!}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); setRefresh((r) => r + 1); }}
        />
      )}
    </div>
  );
}
