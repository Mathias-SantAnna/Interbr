"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { formatPrice } from "@/lib/catalog-api";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, subtotal, clearCart } = useCartStore();

  if (!isOpen) return null;

  const total = subtotal();

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={closeCart}
        aria-hidden
      />

      {/* panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l bg-background shadow-xl">
        {/* header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold">Carrinho</h2>
          <button
            onClick={closeCart}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Fechar carrinho"
          >
            ✕
          </button>
        </div>

        {/* items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center text-muted-foreground">
              <p className="text-4xl">🛒</p>
              <p>Seu carrinho está vazio.</p>
              <button onClick={closeCart} className="text-sm font-medium text-primary hover:underline">
                Continuar comprando
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  {item.product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sem imagem</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="line-clamp-2 text-sm font-medium leading-tight">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5 rounded-lg border">
                      <button
                        onClick={() => updateQty(item.product.id, item.quantity - 1)}
                        className="px-2.5 py-1 text-sm hover:bg-muted"
                      >−</button>
                      <span className="min-w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.product.id, item.quantity + 1)}
                        className="px-2.5 py-1 text-sm hover:bg-muted"
                      >+</button>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="self-start text-muted-foreground hover:text-destructive text-xs pt-1"
                  aria-label="Remover item"
                >✕</button>
              </div>
            ))
          )}
        </div>

        {/* footer */}
        {items.length > 0 && (
          <div className="border-t px-5 py-4 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-base">{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Frete e descontos calculados no checkout.</p>
            <div className="flex flex-col gap-2">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Finalizar pedido
              </Link>
              <button
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-foreground text-center"
              >
                Limpar carrinho
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
