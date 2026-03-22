"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getClientById, getClientOrders, type ClientCompany, TIER_COLOR, TIER_LABEL } from "@/lib/salesman-api";
import { useDraftStore } from "@/lib/draft-store";
import { type Order, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/order-api";
import { formatPrice } from "@/lib/catalog-api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { accessToken } = useAuth();
  const router = useRouter();
  const setClient = useDraftStore((s) => s.setClient);

  const [client, setClientData] = useState<ClientCompany | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      getClientById(id, accessToken),
      getClientOrders(id, accessToken),
    ])
      .then(([c, o]) => { setClientData(c); setOrders(o); })
      .finally(() => setLoading(false));
  }, [id, accessToken]);

  function startOrder() {
    if (client) { setClient(client); router.push("/salesman/novo-pedido"); }
  }

  if (loading) {
    return <div className="space-y-4">
      <div className="h-8 w-64 rounded-lg bg-muted animate-pulse" />
      <div className="h-40 rounded-xl bg-muted animate-pulse" />
    </div>;
  }
  if (!client) return <p className="text-destructive">Cliente não encontrado.</p>;

  const totalSpend = orders.reduce((s, o) => s + parseFloat(o.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{client.display_name}</h1>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${TIER_COLOR[client.tier]}`}>
              {TIER_LABEL[client.tier]}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{client.cnpj}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/salesman/clientes" className="inline-flex h-9 items-center rounded-lg border bg-background px-3 text-sm hover:bg-muted">
            ← Carteira
          </Link>
          <button
            onClick={startOrder}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Fazer pedido
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-4 space-y-0.5">
          <p className="text-xs text-muted-foreground">Desconto máximo</p>
          <p className="text-2xl font-bold">{client.max_discount}%</p>
        </div>
        <div className="rounded-xl border p-4 space-y-0.5">
          <p className="text-xs text-muted-foreground">Total em pedidos</p>
          <p className="text-2xl font-bold">{formatPrice(totalSpend)}</p>
        </div>
        <div className="rounded-xl border p-4 space-y-0.5">
          <p className="text-xs text-muted-foreground">Limite de crédito</p>
          <p className="text-2xl font-bold">{formatPrice(parseFloat(client.credit_limit))}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company info */}
        <div className="rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold">Dados cadastrais</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {[
              ["Razão Social", client.razao_social],
              ["Nome Fantasia", client.nome_fantasia || "—"],
              ["E-mail", client.email || "—"],
              ["Telefone", client.phone || "—"],
              ["Endereço", [client.street, client.number, client.city, client.state].filter(Boolean).join(", ") || "—"],
              ["CEP", client.cep || "—"],
              ["Pagamento", client.payment_terms_display],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Order history */}
        <div className="space-y-3">
          <h2 className="font-semibold">Histórico de pedidos</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pedido para este cliente.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/pedidos/${order.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition"
                >
                  <div>
                    <p className="text-sm font-medium">#{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-semibold">{formatPrice(parseFloat(order.total))}</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${ORDER_STATUS_COLOR[order.status]}`}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
