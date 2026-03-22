"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice, type CatalogProduct } from "@/lib/catalog-api";

const CARD_W = 176; // px — matches w-44
const GAP    = 12;  // px — gap-3

function ShovelerCard({ product }: { product: CatalogProduct }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex-shrink-0 w-44 flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-150"
    >
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl || product.fallbackImage}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-gray-800 leading-snug line-clamp-3 group-hover:text-primary transition-colors">
          {product.name}
        </p>
      </div>
      <p className="text-sm font-bold text-primary tracking-[-0.02em]" style={{ fontFamily: "var(--font-dm-mono, monospace)" }}>
        {formatPrice(product.price)}
      </p>
    </Link>
  );
}

type CarouselProduct = CatalogProduct & { fallbackImage: string };

export function ProductCarousel({
  products,
  category,
  categorySlug,
}: {
  products: CarouselProduct[];
  category: string;
  categorySlug: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  function checkScroll() {
    const el = railRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    checkScroll();
    const el = railRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [products]);

  function scroll(dir: "prev" | "next") {
    const el = railRef.current;
    if (!el) return;
    const step = (CARD_W + GAP) * 3;
    el.scrollBy({ left: dir === "next" ? step : -step, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section className="mt-12 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-gray-900">
            Frequentemente comprados juntos
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Outros produtos em{" "}
            <span className="font-medium text-primary">{category}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Prev */}
          <button
            onClick={() => scroll("prev")}
            disabled={!canPrev}
            aria-label="Anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition hover:bg-primary hover:border-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Next */}
          <button
            onClick={() => scroll("next")}
            disabled={!canNext}
            aria-label="Próximo"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition hover:bg-primary hover:border-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <Link
            href={`/catalog?category=${categorySlug}`}
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline ml-2 whitespace-nowrap"
          >
            Ver todos →
          </Link>
        </div>
      </div>

      {/* Rail */}
      <div className="relative overflow-hidden">
        {/* Left fade */}
        <div className={`pointer-events-none absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-[#f9fafb] to-transparent z-10 transition-opacity duration-200 ${canPrev ? "opacity-100" : "opacity-0"}`} />
        {/* Right fade */}
        <div className={`pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-[#f9fafb] to-transparent z-10 transition-opacity duration-200 ${canNext ? "opacity-100" : "opacity-0"}`} />

        <div
          ref={railRef}
          className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => (
            <ShovelerCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      <Link
        href={`/catalog?category=${categorySlug}`}
        className="sm:hidden inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Ver todos em {category} →
      </Link>
    </section>
  );
}
