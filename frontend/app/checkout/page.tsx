"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-context";
import { validatePromoCode, createOrder, getOrderById, type PromoResult } from "@/lib/order-api";
import { getMyClients, type ClientCompany } from "@/lib/salesman-api";
import { formatPrice } from "@/lib/catalog-api";

const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "boleto", label: "Boleto Bancário" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "bank_transfer", label: "Transferência Bancária" },
] as const;

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO"
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, accessToken, loading: authLoading } = useAuth();
  const { items, subtotal, clearCart } = useCartStore();

  const [address, setAddress] = useState({
    cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<{ uuid: string; number: string } | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [clients, setClients] = useState<ClientCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [cepLoading, setCepLoading] = useState(false);
  const isSalesmanOrAdmin = user?.role === "salesman" || user?.role === "admin";

  async function fetchCep(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch {
      // silently ignore
    } finally {
      setCepLoading(false);
    }
  }

  // Pre-fill address from company profile (client) or load client list (salesman/admin)
  useEffect(() => {
    if (!user) return;
    if (user.role === "client" && user.company) {
      setAddress((prev) => ({
        ...prev,
        city: user.company?.city ?? "",
        state: user.company?.state ?? "",
      }));
    }
    if ((user.role === "salesman" || user.role === "admin") && accessToken) {
      getMyClients(accessToken).then(setClients);
    }
  }, [user, accessToken]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?next=/checkout");
    }
  }, [authLoading, user, router]);

  const cartSubtotal = subtotal();
  const promoDiscount = promoResult?.valid ? (promoResult.discount_amount ?? 0) : 0;
  const freightEstimate = cartSubtotal >= 500 ? 0 : 35;
  const total = cartSubtotal - promoDiscount + freightEstimate;

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function handlePromoValidate() {
    if (!promoCode.trim() || !accessToken) return;
    setPromoLoading(true);
    setPromoResult(null);
    try {
      const result = await validatePromoCode(promoCode.trim(), cartSubtotal, accessToken);
      setPromoResult(result);
    } catch {
      setPromoResult({ valid: false, detail: "Erro ao validar o código." });
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || items.length === 0) return;
    setSubmitError("");
    setSubmitting(true);
    try {
      const order = await createOrder(
        {
          items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
          payment_method: paymentMethod as "pix" | "boleto" | "credit_card" | "bank_transfer",
          promo_code: promoResult?.valid ? promoCode.trim() : undefined,
          delivery_cep: address.cep,
          delivery_street: address.street,
          delivery_number: address.number,
          delivery_complement: address.complement,
          delivery_neighborhood: address.neighborhood,
          delivery_city: address.city,
          delivery_state: address.state,
          company_id: isSalesmanOrAdmin ? selectedCompanyId : undefined,
        },
        accessToken
      );
      clearCart();
      setOrderId({ uuid: order.id, number: order.order_number });
      if (order.payment_link) {
        setPaymentLink(order.payment_link);
      } else {
        // Celery generates the MP link async — poll until it appears (max 30s)
        setLinkLoading(true);
        let attempts = 0;
        pollRef.current = setInterval(async () => {
          attempts++;
          try {
            const updated = await getOrderById(order.id, accessToken!);
            if (updated?.payment_link) {
              setPaymentLink(updated.payment_link);
              setLinkLoading(false);
              if (pollRef.current) clearInterval(pollRef.current);
            }
          } catch { /* ignore */ }
          if (attempts >= 15) {
            setLinkLoading(false);
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }, 2000);
      }
    } catch (err: unknown) {
      const e = err as { data?: Record<string, unknown> };
      const msg = e?.data
        ? Object.values(e.data).flat().join(" ")
        : "Erro ao finalizar pedido.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Order confirmed screen ───────────────────────────────────────────────
  if (orderId) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-gray-900">Pedido confirmado!</h1>
            <p className="mt-2 text-sm text-gray-500">
              Pedido <span className="font-mono font-semibold text-gray-900">#{orderId?.number}</span> recebido com sucesso.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap justify-center gap-3">
              {linkLoading && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 h-10 text-sm text-gray-500">
                  <svg className="h-4 w-4 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                  </svg>
                  Gerando link de pagamento...
                </div>
              )}
              {paymentLink && (
                <a href={paymentLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex h-10 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 transition shadow-sm">
                  Ir para pagamento →
                </a>
              )}
              <Link href={"/pedidos/" + (orderId?.uuid ?? "")}
                className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white px-6 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Acompanhar pedido
              </Link>
            </div>
            <Link href="/catalog" className="block text-sm text-primary hover:underline">
              Continuar comprando
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return <div className="py-20 text-center text-sm text-gray-400">Carregando...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
        <div className="text-center space-y-4">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mx-auto text-gray-300">
            <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-base font-medium text-gray-700">Seu carrinho está vazio.</p>
          <Link href="/catalog" className="inline-flex h-9 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 transition">
            Ver catálogo
          </Link>
        </div>
      </div>
    );
  }

  const fieldClass = "h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-gray-900">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* ── Left column ─────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Client selector — only for salesman/admin */}
          {isSalesmanOrAdmin && (
            <fieldset className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
              <legend className="px-1 text-sm font-semibold text-orange-800">Cliente *</legend>
              <p className="text-xs text-orange-700">Você está fazendo um pedido como admin/vendedor. Selecione o cliente abaixo.</p>
              <select
                required
                value={selectedCompanyId}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value);
                  const client = clients.find((c) => c.id === e.target.value);
                  if (client) {
                    setAddress((prev) => ({
                      ...prev,
                      cep: client.cep || prev.cep,
                      street: client.street || prev.street,
                      number: client.number || prev.number,
                      complement: client.complement || prev.complement,
                      neighborhood: client.neighborhood || prev.neighborhood,
                      city: client.city || prev.city,
                      state: client.state || prev.state,
                    }));
                  }
                }}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Selecionar cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name} — {c.cnpj}
                  </option>
                ))}
              </select>
            </fieldset>
          )}

          {/* Delivery address */}
          <fieldset className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <legend className="px-1 text-sm font-semibold text-gray-900">Endereço de entrega</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">CEP *</label>
                <div className="relative">
                  <input
                    required placeholder="00000-000"
                    value={address.cep}
                    onChange={(e) => setAddress({ ...address, cep: e.target.value })}
                    onBlur={(e) => fetchCep(e.target.value)}
                    className={fieldClass}
                  />
                  {cepLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      Buscando...
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium">Rua / Av. *</label>
                <input
                  required
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Número *</label>
                <input
                  required
                  value={address.number}
                  onChange={(e) => setAddress({ ...address, number: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Complemento</label>
                <input
                  value={address.complement}
                  onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Bairro</label>
                <input
                  value={address.neighborhood}
                  onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Cidade *</label>
                <input
                  required
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Estado *</label>
                <select
                  required
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className={fieldClass}
                >
                  <option value="">Selecionar...</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Payment method */}
          <fieldset className="space-y-3 rounded-xl border p-5">
            <legend className="px-1 text-sm font-semibold text-gray-900">Forma de pagamento</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {PAYMENT_METHODS.map((m) => (
                <label key={m.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition hover:bg-muted ${paymentMethod === m.value ? "border-primary bg-primary/5" : ""}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.value}
                    checked={paymentMethod === m.value}
                    onChange={() => setPaymentMethod(m.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium">{m.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Promo code */}
          <div className="rounded-xl border p-5 space-y-3">
            <p className="text-sm font-semibold">Código promocional</p>
            <div className="flex gap-2">
              <input
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
                placeholder="DESCONTO10"
                className={`${fieldClass} flex-1`}
              />
              <button
                type="button"
                onClick={handlePromoValidate}
                disabled={promoLoading || !promoCode.trim()}
                className="h-10 rounded-lg border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {promoLoading ? "..." : "Aplicar"}
              </button>
            </div>
            {promoResult && (
              <p className={`text-sm ${promoResult.valid ? "text-green-600" : "text-destructive"}`}>
                {promoResult.valid
                  ? `✓ ${promoResult.description || promoResult.code} — desconto de ${formatPrice(promoResult.discount_amount ?? 0)}`
                  : `✗ ${promoResult.detail}`}
              </p>
            )}
          </div>
        </div>

        {/* ── Right column: order summary ──────────────────────── */}
        <div className="space-y-4">
          <div className="rounded-xl border p-5 space-y-4 sticky top-24">
            <h2 className="font-semibold">Resumo do pedido</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-start gap-3 text-sm">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded border bg-muted">
                    {item.product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-2 font-medium leading-tight">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                  </div>
                  <p className="font-medium shrink-0">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(cartSubtotal)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto promo</span>
                  <span>− {formatPrice(promoDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete estimado</span>
                <span>
                  {freightEstimate === 0
                    ? <span className="text-green-600 font-medium">Grátis</span>
                    : formatPrice(freightEstimate)}
                </span>
              </div>
              {cartSubtotal < 500 && (
                <p className="text-xs text-muted-foreground">
                  Frete grátis em pedidos acima de {formatPrice(500)}.
                </p>
              )}
              <div className="flex justify-between border-t pt-2 font-semibold text-base">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {submitError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Processando..." : "Confirmar pedido"}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              Ao confirmar, você concorda com os termos de venda.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
