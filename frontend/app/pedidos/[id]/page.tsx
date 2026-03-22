"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getOrderById,
  type Order,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
} from "@/lib/order-api";
import { formatPrice } from "@/lib/catalog-api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBanner({ status, paymentLink, orderId, accessToken, onSimulated }: {
  status: string;
  paymentLink: string | null;
  orderId: string;
  accessToken: string | null;
  onSimulated: () => void;
}) {
  if (status === "delivered") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-semibold text-green-800">Pedido entregue!</p>
          <p className="text-sm text-green-700">Obrigado por comprar na InterBR.</p>
        </div>
      </div>
    );
  }
  if (status === "shipped") {
    return (
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 flex items-center gap-3">
        <span className="text-2xl">🚚</span>
        <div>
          <p className="font-semibold text-purple-800">Pedido enviado</p>
          <p className="text-sm text-purple-700">Seu pedido está a caminho.</p>
        </div>
      </div>
    );
  }
  if (status === "invoiced") {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 flex items-center gap-3">
        <span className="text-2xl">📄</span>
        <div>
          <p className="font-semibold text-indigo-800">Nota Fiscal emitida</p>
          <p className="text-sm text-indigo-700">Em breve seu pedido será enviado.</p>
        </div>
      </div>
    );
  }
  if (status === "paid") {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
        <span className="text-2xl">💳</span>
        <div>
          <p className="font-semibold text-blue-800">Pagamento confirmado!</p>
          <p className="text-sm text-blue-700">Estamos preparando sua NF-e.</p>
        </div>
      </div>
    );
  }
  if (status === "pending_payment") {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="font-semibold text-yellow-800">Aguardando pagamento</p>
            <p className="text-sm text-yellow-700">Complete o pagamento para confirmar o pedido.</p>
          </div>
        </div>
        {paymentLink && (
          <a
            href={paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center rounded-lg bg-yellow-600 px-5 text-sm font-semibold text-white hover:bg-yellow-700"
          >
            Ir para pagamento →
          </a>
        )}
        <SimulatePaymentButton orderId={orderId} accessToken={accessToken} onSuccess={onSimulated} />
      </div>
    );
  }
  if (status === "cancelled") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
        <span className="text-2xl">❌</span>
        <div>
          <p className="font-semibold text-red-800">Pedido cancelado</p>
          <p className="text-sm text-red-700">Entre em contato conosco se precisar de ajuda.</p>
        </div>
      </div>
    );
  }
  return null;
}

function SimulatePaymentButton({
  orderId,
  accessToken,
  onSuccess,
}: {
  orderId: string;
  accessToken: string | null;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

  async function simulate() {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/orders/${orderId}/simulate-payment/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setDone(true);
        setTimeout(onSuccess, 1500);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm font-medium text-green-700">
        ✓ Pagamento simulado! Gerando NF-e...
      </p>
    );
  }

  return (
    <button
      onClick={simulate}
      disabled={loading}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-dashed border-yellow-400 px-4 text-xs font-medium text-yellow-800 hover:bg-yellow-100 disabled:opacity-50"
    >
      {loading ? "Simulando..." : "🧪 Simular pagamento aprovado (demo)"}
    </button>
  );
}

function OrderDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentReturn = searchParams.get("payment"); // "success" | "failure" | "pending"
  const { user, accessToken, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?next=/pedidos/" + id);
    }
  }, [authLoading, user, router, id]);

  useEffect(() => {
    if (!accessToken) return;
    getOrderById(id, accessToken)
      .then(setOrder)
      .catch(() => setError("Pedido não encontrado."))
      .finally(() => setLoading(false));
  }, [id, accessToken]);

  function refetch() {
    if (!accessToken) return;
    getOrderById(id, accessToken).then(setOrder).catch(() => {});
  }

  if (authLoading || loading) {
    return (
      <div className="space-y-4 py-10">
        <div className="h-8 w-64 rounded-xl bg-gray-100 animate-pulse" />
        <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-lg font-medium text-destructive">{error || "Pedido não encontrado."}</p>
        <Link href="/pedidos" className="text-sm font-medium text-primary hover:underline">
          Ver todos os pedidos
        </Link>
      </div>
    );
  }

  const subtotal = parseFloat(order.subtotal);
  const discountAmt = parseFloat(order.discount_amount);
  const promoAmt = parseFloat(order.promo_discount_amount);
  const freight = parseFloat(order.freight_cost);
  const total = parseFloat(order.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-gray-900">
              Pedido <span className="font-mono">#{order.order_number}</span>
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLOR[order.status] ?? "bg-muted text-muted-foreground"}`}
            >
              {ORDER_STATUS_LABEL[order.status] ?? order.status_display}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Realizado em {formatDate(order.created_at)}
          </p>
        </div>
        <Link
          href="/pedidos"
          className="inline-flex h-9 items-center rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          ← Meus pedidos
        </Link>
      </div>

      {/* MP return message */}
      {paymentReturn === "success" && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          ✅ Pagamento aprovado! Estamos processando seu pedido.
        </div>
      )}
      {paymentReturn === "failure" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          ❌ Pagamento não aprovado. Tente novamente pelo link abaixo.
        </div>
      )}
      {paymentReturn === "pending" && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-800">
          ⏳ Pagamento em análise. Avisaremos por e-mail quando confirmado.
        </div>
      )}

      {/* Status banner */}
      <StatusBanner status={order.status} paymentLink={order.payment_link} orderId={order.id} accessToken={accessToken} onSimulated={() => refetch()} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left — items */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b px-5 py-3">
              <h2 className="font-semibold">
                {order.items.length} {order.items.length === 1 ? "item" : "itens"}
              </h2>
            </div>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
                    {item.product.display_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.display_image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.product.slug}`}
                      className="font-medium hover:underline line-clamp-2 text-sm leading-snug"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      SKU: {item.product.sku} · Qtd: {item.quantity} ·{" "}
                      {formatPrice(parseFloat(item.unit_price))} / un
                    </p>
                  </div>
                  <p className="font-semibold text-sm shrink-0">
                    {formatPrice(parseFloat(item.line_total))}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
            <h2 className="font-semibold">Entrega</h2>
            <p className="text-sm text-muted-foreground">
              {order.delivery_city} / {order.delivery_state} · CEP {order.delivery_cep}
            </p>
            {order.tracking_code && (
              <p className="text-sm">
                Código de rastreio:{" "}
                <span className="font-mono font-medium">{order.tracking_code}</span>
              </p>
            )}
            {order.shipped_at && (
              <p className="text-xs text-muted-foreground">
                Enviado em {formatDate(order.shipped_at)}
              </p>
            )}
            {order.delivered_at && (
              <p className="text-xs text-muted-foreground">
                Entregue em {formatDate(order.delivered_at)}
              </p>
            )}
          </div>

          {/* NF-e */}
          {order.nfe_key && (
            <div className="rounded-2xl border border-green-200 bg-green-50/50 p-5 space-y-3">
              <h2 className="font-semibold">Nota Fiscal Eletrônica</h2>
              <p className="text-xs font-mono text-muted-foreground break-all">{order.nfe_key}</p>
              <div className="flex flex-wrap gap-2">
                {order.nfe_pdf_url && (
                  <a
                    href={order.nfe_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    📄 Download DANFE (PDF)
                  </a>
                )}
              </div>
            </div>
          )}
          {order.nfe_status === "processing" && (
            <div className="rounded-2xl border border-gray-100 p-4 text-sm text-gray-500 flex items-center gap-2 bg-white shadow-sm">
              <span className="animate-spin text-base">⟳</span>
              Emitindo Nota Fiscal...
            </div>
          )}
          {order.nfe_status === "error" && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Erro na emissão da NF-e. Nossa equipe foi notificada.
            </div>
          )}
        </div>

        {/* Right — summary */}
        <div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4 sticky top-24">
            <h2 className="font-semibold">Resumo financeiro</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-green-700">
                  <dt>Desconto comercial ({order.discount_pct}%)</dt>
                  <dd>− {formatPrice(discountAmt)}</dd>
                </div>
              )}
              {promoAmt > 0 && (
                <div className="flex justify-between text-green-700">
                  <dt>Desconto promo</dt>
                  <dd>− {formatPrice(promoAmt)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Frete</dt>
                <dd>{freight === 0 ? <span className="text-green-600">Grátis</span> : formatPrice(freight)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold text-base">
                <dt>Total</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>

            <div className="border-t pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pagamento</span>
                <span className="font-medium">{order.payment_method_display}</span>
              </div>
              {order.paid_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pago em</span>
                  <span>{formatDate(order.paid_at)}</span>
                </div>
              )}
            </div>

            {order.status === "pending_payment" && order.payment_link && (
              <a
                href={order.payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary/90 transition"
              >
                Ir para pagamento
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <OrderDetailContent params={params} />
    </Suspense>
  );
}
