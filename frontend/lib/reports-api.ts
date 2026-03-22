const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export type DayData = { date: string; revenue: number; count: number };
export type TopProduct = { name: string; sku: string; qty: number; revenue: number };
export type TopClient = { name: string; id: string; orders: number; spend: number };
export type StatusCount = { status: string; count: number };

export type ReportData = {
  period_days: number;
  summary: { total_orders: number; total_revenue: number; new_clients: number };
  daily: DayData[];
  top_products: TopProduct[];
  top_clients: TopClient[];
  by_status: StatusCount[];
};

export async function getReports(token: string, days = 30): Promise<ReportData> {
  return get<ReportData>(`/admin/reports/?days=${days}`, token);
}

// Price lists
export type PriceListItem = {
  id: string;
  product: string;
  product_name: string;
  product_sku: string;
  price: string;
};

export type PriceList = {
  id: string;
  name: string;
  description: string;
  global_discount_pct: string;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  items: PriceListItem[];
  company_count: number;
  created_at: string;
};

async function authFetch<T>(path: string, token: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw Object.assign(new Error("API error"), { data: b }); }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function getPriceLists(token: string): Promise<PriceList[]> {
  const data = await authFetch<PriceList[] | { results: PriceList[] }>("/admin/price-lists/", token);
  return Array.isArray(data) ? data : data.results;
}

export async function createPriceList(token: string, payload: Partial<PriceList>): Promise<PriceList> {
  return authFetch<PriceList>("/admin/price-lists/", token, { method: "POST", body: JSON.stringify(payload) });
}

export async function updatePriceList(token: string, id: string, payload: Partial<PriceList>): Promise<PriceList> {
  return authFetch<PriceList>(`/admin/price-lists/${id}/`, token, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deletePriceList(token: string, id: string): Promise<void> {
  return authFetch<void>(`/admin/price-lists/${id}/`, token, { method: "DELETE" });
}

export async function setPriceListItems(
  token: string,
  id: string,
  items: { product_id: string; price: number }[]
): Promise<PriceListItem[]> {
  return authFetch<PriceListItem[]>(`/admin/price-lists/${id}/set_items/`, token, {
    method: "POST",
    body: JSON.stringify(items),
  });
}

export async function assignPriceListToCompany(
  token: string,
  priceListId: string,
  companyId: string
): Promise<{ detail: string }> {
  return authFetch(`/admin/price-lists/${priceListId}/assign_to_company/`, token, {
    method: "POST",
    body: JSON.stringify({ company_id: companyId }),
  });
}
