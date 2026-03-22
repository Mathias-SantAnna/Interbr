const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function adminFetch<T>(
  path: string,
  token: string,
  opts?: RequestInit
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(`API ${res.status}: ${path}`) as Error & { data: unknown };
    err.data = body;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Orders ────────────────────────────────────────────────────────────────────
export type AdminOrder = {
  id: string;
  order_number: string;
  status: string;
  status_display: string;
  placed_by: { id: string; full_name: string; email: string };
  on_behalf_of: { id: string; razao_social: string; cnpj: string };
  subtotal: string;
  discount_pct: string;
  discount_amount: string;
  freight_cost: string;
  total: string;
  payment_method: string;
  payment_method_display: string;
  payment_link: string | null;
  nfe_status: string | null;
  created_at: string;
};

export type AdminOrdersResult = { results: AdminOrder[]; count: number; next: string | null };

export async function getAdminOrders(
  token: string,
  params: { status?: string; page?: number } = {}
): Promise<AdminOrdersResult> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  const data = await adminFetch<AdminOrdersResult | AdminOrder[]>(
    `/admin/orders/?${qs}`,
    token
  );
  if (Array.isArray(data)) return { results: data, count: data.length, next: null };
  return data;
}

export async function setOrderStatus(
  token: string,
  orderId: string,
  status: string
): Promise<AdminOrder> {
  return adminFetch<AdminOrder>(`/admin/orders/${orderId}/set_status/`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ── Products ──────────────────────────────────────────────────────────────────
export type AdminProduct = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description?: string;
  category: string | null;
  category_name?: string;
  base_price: string;
  unit: string;
  stock_qty: number;
  weight_kg: string;
  ncm_code: string;
  image_url: string;
  is_featured: boolean;
  is_active: boolean;
  created_at?: string;
};

export type AdminProductsResult = { results: AdminProduct[]; count: number; next: string | null };

export async function getAdminProducts(
  token: string,
  params: { q?: string; category?: string; active?: string; page?: number } = {}
): Promise<AdminProductsResult> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.category) qs.set("category", params.category);
  if (params.active) qs.set("active", params.active);
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  const data = await adminFetch<AdminProductsResult | AdminProduct[]>(
    `/admin/products/?${qs}`,
    token
  );
  if (Array.isArray(data)) return { results: data, count: data.length, next: null };
  return data;
}

export async function createProduct(token: string, payload: Partial<AdminProduct>): Promise<AdminProduct> {
  return adminFetch<AdminProduct>("/admin/products/", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(
  token: string,
  slug: string,
  payload: Partial<AdminProduct>
): Promise<AdminProduct> {
  return adminFetch<AdminProduct>(`/admin/products/${slug}/`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(token: string, slug: string): Promise<void> {
  return adminFetch<void>(`/admin/products/${slug}/`, token, { method: "DELETE" });
}

// ── Promo Codes ───────────────────────────────────────────────────────────────
export type AdminPromoCode = {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_type_display: string;
  discount_value: string;
  min_order_value: string;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  is_valid_now: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
};

export async function getAdminPromoCodes(token: string): Promise<AdminPromoCode[]> {
  const data = await adminFetch<AdminPromoCode[] | { results: AdminPromoCode[] }>("/admin/promo-codes/", token);
  if (Array.isArray(data)) return data;
  return data.results;
}

export async function createPromoCode(token: string, payload: Partial<AdminPromoCode>): Promise<AdminPromoCode> {
  return adminFetch<AdminPromoCode>("/admin/promo-codes/", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePromoCode(
  token: string,
  id: string,
  payload: Partial<AdminPromoCode>
): Promise<AdminPromoCode> {
  return adminFetch<AdminPromoCode>(`/admin/promo-codes/${id}/`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePromoCode(token: string, id: string): Promise<void> {
  return adminFetch<void>(`/admin/promo-codes/${id}/`, token, { method: "DELETE" });
}

// ── Companies ─────────────────────────────────────────────────────────────────
export type AdminCompany = {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  display_name: string;
  tier: string;
  tier_display: string;
  max_discount: number;
  email: string;
  phone: string;
  city: string;
  state: string;
  credit_limit: string;
  payment_terms: string;
  payment_terms_display: string;
  is_active: boolean;
  created_at: string;
};

export async function getAdminCompanies(
  token: string,
  params: { q?: string; tier?: string } = {}
): Promise<AdminCompany[]> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.tier) qs.set("tier", params.tier);
  const data = await adminFetch<AdminCompany[] | { results: AdminCompany[] }>(`/admin/companies/?${qs}`, token);
  if (Array.isArray(data)) return data;
  return data.results;
}

export async function updateCompany(
  token: string,
  id: string,
  payload: Partial<AdminCompany>
): Promise<AdminCompany> {
  return adminFetch<AdminCompany>(`/admin/companies/${id}/`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function assignSalesman(token: string, companyId: string, salesmanId: string) {
  return adminFetch(`/admin/companies/${companyId}/assign_salesman/`, token, {
    method: "POST",
    body: JSON.stringify({ salesman_id: salesmanId }),
  });
}

export async function removeSalesman(token: string, companyId: string, salesmanId: string) {
  return adminFetch(`/admin/companies/${companyId}/remove_salesman/`, token, {
    method: "POST",
    body: JSON.stringify({ salesman_id: salesmanId }),
  });
}

// ── Users (salesmen list) ─────────────────────────────────────────────────────
export type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  role_display: string;
  is_active: boolean;
  created_at: string;
};

export async function getAdminUsers(token: string, role?: string): Promise<AdminUser[]> {
  const qs = role ? `?role=${role}` : "";
  const data = await adminFetch<AdminUser[] | { results: AdminUser[] }>(`/admin/users/${qs}`, token);
  if (Array.isArray(data)) return data;
  return data.results;
}

// ── Stats (built from orders) ─────────────────────────────────────────────────
export async function getAdminStats(token: string) {
  // Fetch all pages to compute accurate revenue
  const [firstPage, companies] = await Promise.all([
    getAdminOrders(token, {}),
    getAdminCompanies(token, {}),
  ]);

  let allOrders = [...firstPage.results];
  // Fetch remaining pages if any
  if (firstPage.next) {
    let page = 2;
    while (true) {
      const next = await getAdminOrders(token, { page }).catch(() => null);
      if (!next || !next.results.length) break;
      allOrders = [...allOrders, ...next.results];
      if (!next.next) break;
      page++;
    }
  }

  const totalRevenue = allOrders.reduce((s, o) => s + parseFloat(o.total), 0);
  const pending = allOrders.filter((o) => o.status === "pending_payment").length;
  const confirmed = allOrders.filter((o) =>
    ["confirmed", "invoiced", "shipped"].includes(o.status)
  ).length;
  return {
    totalOrders: firstPage.count,
    totalRevenue,
    pendingCount: pending,
    confirmedCount: confirmed,
    clientCount: companies.length,
    recentOrders: firstPage.results.slice(0, 8),
  };
}
