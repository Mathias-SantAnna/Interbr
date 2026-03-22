const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type CreateOrderPayload = {
  items: { product_id: string; quantity: number }[];
  payment_method: "boleto" | "pix" | "credit_card" | "bank_transfer";
  promo_code?: string;
  delivery_cep: string;
  delivery_street: string;
  delivery_number: string;
  delivery_complement?: string;
  delivery_neighborhood?: string;
  delivery_city: string;
  delivery_state: string;
  // Salesman-only fields (Track A)
  company_id?: string;
  discount_pct?: number;
  discount_note?: string;
};

export type PromoResult = {
  valid: boolean;
  code?: string;
  discount_type?: "percentage" | "fixed" | "free_shipping";
  discount_amount?: number;
  description?: string;
  detail?: string;
};

export type OrderItem = {
  id: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  product: {
    id: string;
    sku: string;
    name: string;
    slug: string;
    display_image: string | null;
  };
};

export type Order = {
  id: string;
  order_number: string;
  status: string;
  status_display: string;
  placed_by: { id: string; full_name: string; email: string };
  on_behalf_of: { id: string; razao_social: string; nome_fantasia: string; cnpj: string };
  items: OrderItem[];
  subtotal: string;
  discount_pct: string;
  discount_note: string;
  discount_amount: string;
  promo_code: string | null;
  promo_discount_amount: string;
  freight_cost: string;
  total: string;
  payment_method: string;
  payment_method_display: string;
  payment_link: string | null;
  paid_at: string | null;
  delivery_cep: string;
  delivery_city: string;
  delivery_state: string;
  nfe_key: string;
  nfe_pdf_url: string;
  nfe_status: string;
  tracking_code: string;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

export type OrderListResult = {
  orders: Order[];
  count: number;
};

async function authFetch(path: string, accessToken: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, data: err };
  }
  return res.json();
}

export async function validatePromoCode(
  code: string,
  subtotal: number,
  accessToken: string
): Promise<PromoResult> {
  const res = await fetch(`${API_BASE_URL}/orders/validate-promo/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ code, subtotal }),
  });
  return res.json();
}

export async function createOrder(
  payload: CreateOrderPayload,
  accessToken: string
): Promise<Order> {
  return authFetch("/orders/create/", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getOrders(accessToken: string, page = 1): Promise<OrderListResult> {
  const data = await authFetch(`/orders/?page=${page}`, accessToken);
  // DRF returns { count, results } or plain array
  if (Array.isArray(data)) return { orders: data, count: data.length };
  return { orders: data.results ?? [], count: data.count ?? 0 };
}

export async function getOrderById(id: string, accessToken: string): Promise<Order> {
  return authFetch(`/orders/${id}/`, accessToken);
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  pending_payment: "Aguardando pagamento",
  paid: "Pago",
  invoiced: "Faturado",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_COLOR: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_payment: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  invoiced: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};
