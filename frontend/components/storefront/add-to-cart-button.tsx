"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import type { CatalogProduct } from "@/lib/catalog-api";

type Props = {
  product: CatalogProduct;
  className?: string;
  fullWidth?: boolean;
};

export function AddToCartButton({ product, className = "", fullWidth = false }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const base = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none";
  const w = fullWidth ? " w-full" : "";
  const state = added
    ? " bg-green-600 text-white"
    : " bg-primary text-primary-foreground hover:opacity-90";

  return (
    <button onClick={handleAdd} className={`${base}${w}${state} h-9 px-4${className ? " " + className : ""}`}>
      {added ? "Adicionado!" : "Adicionar ao carrinho"}
    </button>
  );
}
