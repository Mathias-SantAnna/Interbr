import Link from "next/link";
import { CatalogProduct, formatPrice } from "@/lib/catalog-api";
import { AddToCartButton } from "./add-to-cart-button";

const CATEGORY_IMAGES: Record<string, string> = {
  florestal:  "https://images.unsplash.com/photo-1597349881767-0fc8bf5a8acd?w=600&h=600&fit=crop",
  solar:      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=600&fit=crop",
  epi:        "https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=600&h=600&fit=crop",
  limpeza:    "https://images.unsplash.com/photo-1631625285793-b2fc4e59dfd9?w=600&h=600&fit=crop",
  ferramentas:"https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=600&fit=crop",
  eletrico:   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop",
  agricola:   "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=600&fit=crop",
  industrial: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=600&fit=crop",
};

function getProductImage(imageUrl: string | null, category: string): string {
  if (imageUrl) return imageUrl;
  const key = (category || "").toLowerCase().replace(/[^a-z]/g, "");
  for (const [k, url] of Object.entries(CATEGORY_IMAGES)) {
    if (key.includes(k) || k.includes(key.slice(0, 4))) return url;
  }
  return CATEGORY_IMAGES.industrial;
}

export function ProductCard({ product }: { product: CatalogProduct }) {
  const imgSrc = getProductImage(product.imageUrl, product.category);

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-150">
      {/* Image */}
      <Link href={`/product/${product.slug}`} className="block overflow-hidden">
        <div className="aspect-[4/3] w-full overflow-hidden bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 gap-2">
        {/* Category + stock badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {product.category && (
            <span className="inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {product.category}
            </span>
          )}
          {product.isLowStock && product.stock > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Pouco estoque
            </span>
          )}
          {product.stock === 0 && (
            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
              Sem estoque
            </span>
          )}
        </div>

        {/* Name */}
        <Link href={`/product/${product.slug}`} className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div>
          <p className="text-lg font-bold tracking-[-0.03em] text-primary" style={{ fontFamily: "var(--font-dm-mono), monospace" }}>
            {formatPrice(product.price)}
          </p>
          <p className="text-[11px] text-gray-400">por {product.unit}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <Link href={`/product/${product.slug}`}
            className="text-xs font-medium text-gray-500 hover:text-primary transition-colors">
            Ver detalhes
          </Link>
          {product.stock > 0 && <AddToCartButton product={product} className="h-8 px-3 text-xs" />}
        </div>
      </div>
    </div>
  );
}
