"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useDraftStore } from "@/lib/draft-store";
import { getMyClients, type ClientCompany } from "@/lib/salesman-api";
import { getCatalogProducts, formatPrice, type CatalogProduct } from "@/lib/catalog-api";
import { createOrder } from "@/lib/order-api";

const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "boleto", label: "Boleto" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "bank_transfer", label: "Transferência" },
];

const STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

type Step = "client" | "products" | "discount" | "delivery" | "confirm";
const STEPS: { key: Step; label: string }[] = [
  { key: "client", label: "1. Cliente" },
  { key: "products", label: "2. Produtos" },
  { key: "discount", label: "3. Desconto" },
  { key: "delivery", label: "4. Entrega" },
  { key: "confirm", label: "5. Confirmar" },
];

function NovoPedidoContent() {
  const { accessToken } = useAuth();
  const draft = useDraftStore();

  const [step, setStep] = useState<Step>("client");
  const [clients, setClients] = useState<ClientCompany[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<CatalogProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdOrder, setCreatedOrder] = useState<{ id: string; number: string } | null>(null);

  // Load clients
  useEffect(() => {
    if (!accessToken) return;
    getMyClients(accessToken).then(setClients);
  }, [accessToken]);

  // Product search
  useEffect(() => {
    if (!productSearch.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const result = await getCatalogProducts({ search: productSearch, pageSize: 8 });
      setSearchResults(result.products);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [productSearch]);

  const filteredClients = clients.filter((c) => {
    const q = clientSearch.toLowerCase();
    return c.display_name.toLowerCase().includes(q) || c.cnpj.includes(q);
  });

  function canProceed(): boolean {
    if (step === "client") return !!draft.client;
    if (step === "products") return draft.items.length > 0;
    if (step === "discount") return true;
    if (step === "delivery") return !!(draft.delivery_cep && draft.delivery_street && draft.delivery_number && draft.delivery_city && draft.delivery_state);
    return true;
  }

  function nextStep() {
    const order: Step[] = ["client", "products", "discount", "delivery", "confirm"];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  }

  function prevStep() {
    const order: Step[] = ["client", "products", "discount", "delivery", "confirm"];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !draft.client || draft.items.length === 0) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const order = await createOrder({
        items: draft.items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        payment_method: draft.payment_method as "pix" | "boleto" | "credit_card" | "bank_transfer",
        delivery_cep: draft.delivery_cep,
        delivery_street: draft.delivery_street,
        delivery_number: draft.delivery_number,
        delivery_complement: draft.delivery_complement,
        delivery_neighborhood: draft.delivery_neighborhood,
        delivery_city: draft.delivery_city,
        delivery_state: draft.delivery_state,
        company_id: draft.client.id,
        discount_pct: draft.discount_pct,
        discount_note: draft.discount_note,
      }, accessToken);
      setCreatedOrder({ id: order.id, number: order.order_number });
      draft.clearDraft();
    } catch (err: unknown) {
      const e = err as { data?: Record<string, unknown> };
      setSubmitError(
        e?.data ? Object.values(e.data).flat().join(" ") : "Erro ao criar pedido."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const subtotal = draft.subtotal();
  const maxDiscount = draft.client?.max_discount ?? 0;
  const discountAmount = subtotal * (draft.discount_pct / 100);
  const fieldClass = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  // ── Success screen ───────────────────────────────────────────────────────────
  if (createdOrder) {
    return (
      <div className="mx-auto max-w-md space-y-6 py-16 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="text-3xl font-bold">Pedido criado!</h1>
        <p className="text-muted-foreground">
          Pedido <span className="font-mono font-semibold text-foreground">#{createdOrder.number}</span> para{" "}
          {draft.client?.display_name ?? "cliente"} criado com sucesso.
          O link de pagamento foi enviado por e-mail.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={"/pedidos/" + createdOrder.id}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Ver pedido
          </Link>
          <button
            onClick={() => { setCreatedOrder(null); setStep("client"); }}
            className="inline-flex h-10 items-center rounded-lg border bg-background px-5 text-sm font-medium hover:bg-muted"
          >
            Novo pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Novo Pedido</h1>
        {draft.items.length > 0 && (
          <button
            onClick={() => draft.saveDraft()}
            className="inline-flex h-8 items-center rounded-lg border bg-background px-3 text-xs font-medium hover:bg-muted"
          >
            💾 Salvar rascunho
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, idx) => (
          <button
            key={s.key}
            onClick={() => setStep(s.key)}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              step === s.key
                ? "bg-primary text-primary-foreground"
                : idx < STEPS.findIndex((x) => x.key === step)
                ? "bg-green-100 text-green-800"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Step 1: Select client ──────────────────────────────────────── */}
        {step === "client" && (
          <div className="space-y-4">
            <h2 className="font-semibold">Selecionar cliente</h2>
            <input
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Buscar por nome ou CNPJ..."
              className={fieldClass}
            />
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredClients.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => draft.setClient(c)}
                  className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition hover:bg-muted/50 ${
                    draft.client?.id === c.id ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium">{c.display_name}</p>
                    <p className="text-xs text-muted-foreground">{c.cnpj} · {c.city}/{c.state} · Desconto máx: {c.max_discount}%</p>
                  </div>
                  {draft.client?.id === c.id && <span className="text-primary text-lg">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Products ───────────────────────────────────────────── */}
        {step === "products" && (
          <div className="space-y-4">
            <h2 className="font-semibold">Adicionar produtos</h2>
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar por nome ou SKU..."
              className={fieldClass}
            />
            {searching && <p className="text-sm text-muted-foreground">Buscando...</p>}
            {searchResults.length > 0 && (
              <div className="space-y-2 rounded-xl border p-3">
                {searchResults.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {p.sku} · {formatPrice(p.price)} · Estoque: {p.stock}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => draft.addItem(p)}
                      disabled={p.stock === 0}
                      className="h-7 shrink-0 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
                    >
                      + Adicionar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {draft.items.length > 0 && (
              <div className="rounded-xl border">
                <div className="border-b px-4 py-2.5">
                  <p className="text-sm font-semibold">Itens no pedido ({draft.items.length})</p>
                </div>
                <div className="divide-y">
                  {draft.items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(item.product.price)} / {item.product.unit}</p>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg border">
                        <button type="button" onClick={() => draft.updateQty(item.product.id, item.quantity - 1)} className="px-2 py-1 text-sm hover:bg-muted">−</button>
                        <span className="min-w-6 text-center text-sm">{item.quantity}</span>
                        <button type="button" onClick={() => draft.updateQty(item.product.id, item.quantity + 1)} className="px-2 py-1 text-sm hover:bg-muted">+</button>
                      </div>
                      <p className="text-sm font-semibold w-20 text-right shrink-0">{formatPrice(item.product.price * item.quantity)}</p>
                      <button type="button" onClick={() => draft.removeItem(item.product.id)} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
                    </div>
                  ))}
                </div>
                <div className="border-t px-4 py-3 flex justify-between text-sm font-semibold">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Discount ───────────────────────────────────────────── */}
        {step === "discount" && (
          <div className="space-y-6">
            <h2 className="font-semibold">Desconto comercial</h2>
            <div className="rounded-xl border p-5 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Desconto máximo para {draft.client?.display_name ?? "este cliente"} ({draft.client?.tier_display}):
                </p>
                <span className="font-semibold">{maxDiscount}%</span>
              </div>

              {/* Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Desconto aplicado</label>
                  <span className="text-2xl font-bold text-primary">{draft.discount_pct}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxDiscount}
                  step={0.5}
                  value={draft.discount_pct}
                  onChange={(e) => draft.setDiscount(parseFloat(e.target.value), draft.discount_note)}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>{maxDiscount / 2}%</span>
                  <span>{maxDiscount}%</span>
                </div>
              </div>

              {draft.discount_pct > 0 && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800 flex justify-between">
                  <span>Economia do cliente</span>
                  <span className="font-semibold">− {formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Motivo do desconto {draft.discount_pct > 0 ? "*" : "(opcional)"}</label>
                <input
                  value={draft.discount_note}
                  onChange={(e) => draft.setDiscount(draft.discount_pct, e.target.value)}
                  required={draft.discount_pct > 0}
                  placeholder="Ex: Volume, fidelidade, negociação especial..."
                  className={fieldClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Delivery ───────────────────────────────────────────── */}
        {step === "delivery" && (
          <div className="space-y-4">
            <h2 className="font-semibold">Endereço de entrega e pagamento</h2>
            <div className="grid gap-4 sm:grid-cols-2 rounded-xl border p-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">CEP *</label>
                <input required value={draft.delivery_cep} onChange={(e) => draft.setDelivery({ delivery_cep: e.target.value })} className={fieldClass} placeholder="00000-000" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium">Rua *</label>
                <input required value={draft.delivery_street} onChange={(e) => draft.setDelivery({ delivery_street: e.target.value })} className={fieldClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Número *</label>
                <input required value={draft.delivery_number} onChange={(e) => draft.setDelivery({ delivery_number: e.target.value })} className={fieldClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Complemento</label>
                <input value={draft.delivery_complement} onChange={(e) => draft.setDelivery({ delivery_complement: e.target.value })} className={fieldClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Bairro</label>
                <input value={draft.delivery_neighborhood} onChange={(e) => draft.setDelivery({ delivery_neighborhood: e.target.value })} className={fieldClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Cidade *</label>
                <input required value={draft.delivery_city} onChange={(e) => draft.setDelivery({ delivery_city: e.target.value })} className={fieldClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Estado *</label>
                <select required value={draft.delivery_state} onChange={(e) => draft.setDelivery({ delivery_state: e.target.value })} className={fieldClass}>
                  <option value="">Selecionar...</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium">Forma de pagamento</label>
                <div className="grid gap-2 sm:grid-cols-4">
                  {PAYMENT_METHODS.map((m) => (
                    <label key={m.value} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition hover:bg-muted ${draft.payment_method === m.value ? "border-primary bg-primary/5" : ""}`}>
                      <input type="radio" name="payment" value={m.value} checked={draft.payment_method === m.value} onChange={() => draft.setDelivery({ payment_method: m.value })} className="accent-primary" />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Confirm ────────────────────────────────────────────── */}
        {step === "confirm" && (
          <div className="space-y-4">
            <h2 className="font-semibold">Confirmar pedido</h2>
            <div className="rounded-xl border divide-y">
              <div className="px-5 py-4 flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{draft.client?.display_name}</span>
              </div>
              <div className="px-5 py-4 flex justify-between text-sm">
                <span className="text-muted-foreground">Itens</span>
                <span className="font-medium">{draft.itemCount()} produtos</span>
              </div>
              <div className="px-5 py-4 flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              {draft.discount_pct > 0 && (
                <div className="px-5 py-4 flex justify-between text-sm text-green-700">
                  <span>Desconto ({draft.discount_pct}%)</span>
                  <span className="font-medium">− {formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="px-5 py-4 flex justify-between text-sm">
                <span className="text-muted-foreground">Entrega</span>
                <span className="font-medium">{draft.delivery_city} / {draft.delivery_state}</span>
              </div>
              <div className="px-5 py-4 flex justify-between text-sm">
                <span className="text-muted-foreground">Pagamento</span>
                <span className="font-medium capitalize">{draft.payment_method.replace("_", " ")}</span>
              </div>
            </div>

            {submitError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {submitError}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === "client"}
            className="inline-flex h-9 items-center rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted disabled:opacity-40"
          >
            ← Anterior
          </button>
          {step !== "confirm" ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className="inline-flex h-9 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              Próximo →
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting || !canProceed()}
              className="inline-flex h-9 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? "Criando pedido..." : "Confirmar e criar pedido"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function NovoPedidoPage() {
  return (
    <Suspense>
      <NovoPedidoContent />
    </Suspense>
  );
}
