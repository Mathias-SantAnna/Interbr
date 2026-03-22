const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type ClientCompany = {
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
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  credit_limit: string;
  payment_terms: string;
  payment_terms_display: string;
  is_active: boolean;
  created_at: string;
};

async function authFetch(path: string, accessToken: string) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

export async function getMyClients(accessToken: string): Promise<ClientCompany[]> {
  const data = await authFetch("/auth/my-clients/", accessToken);
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export async function getClientById(
  id: string,
  accessToken: string
): Promise<ClientCompany> {
  // No single-client endpoint — find from list
  const clients = await getMyClients(accessToken);
  const found = clients.find((c) => c.id === id);
  if (!found) throw new Error("Cliente não encontrado");
  return found;
}

export async function getClientOrders(
  companyId: string,
  accessToken: string
) {
  // Orders endpoint filters by company for salesman automatically
  const data = await authFetch(`/orders/?company_id=${companyId}`, accessToken);
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export const TIER_COLOR: Record<string, string> = {
  consumidor: "bg-gray-100 text-gray-700",
  revendedor: "bg-blue-100 text-blue-700",
  distribuidor: "bg-purple-100 text-purple-700",
};

export const TIER_LABEL: Record<string, string> = {
  consumidor: "Consumidor",
  revendedor: "Revendedor",
  distribuidor: "Distribuidor",
};
