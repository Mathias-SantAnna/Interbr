import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice, getProductBySlug } from "@/lib/catalog-api";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { ProductShoveler } from "@/components/storefront/product-shoveler";

// Category → Unsplash fallback image
const CATEGORY_IMAGES: Record<string, string> = {
  florestal:  "https://images.unsplash.com/photo-1597349881767-0fc8bf5a8acd?w=800&h=800&fit=crop",
  solar:      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=800&fit=crop",
  epi:        "https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=800&h=800&fit=crop",
  limpeza:    "https://images.unsplash.com/photo-1631625285793-b2fc4e59dfd9?w=800&h=800&fit=crop",
  ferramentas:"https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=800&fit=crop",
  eletrico:   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop",
  agricola:   "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=800&fit=crop",
  industrial: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=800&fit=crop",
};

function getProductImage(imageUrl: string | null, category: string): string {
  if (imageUrl) return imageUrl;
  const key = category.toLowerCase().replace(/[^a-z]/g, "");
  for (const [k, url] of Object.entries(CATEGORY_IMAGES)) {
    if (key.includes(k) || k.includes(key.slice(0, 4))) return url;
  }
  return CATEGORY_IMAGES.industrial;
}

type ProductDetailsPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("interbr-access")?.value;
  const product = await getProductBySlug(slug, accessToken);
  if (!product) return { title: "Produto não encontrado — InterBR" };
  return {
    title: `${product.name} — InterBR`,
    description: product.description?.slice(0, 160) || `Compre ${product.name} na Interbrasil Distribuidora.`,
    openGraph: {
      title: product.name,
      description: product.description ?? `${product.name} na InterBR`,
      images: [{ url: getProductImage(product.imageUrl, product.category) }],
    },
  };
}

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("interbr-access")?.value;
  const product = await getProductBySlug(slug, accessToken);

  if (!product) notFound();

  const imgSrc = getProductImage(product.imageUrl, product.category);

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-primary transition">Início</Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-primary transition">Catálogo</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/catalog?category=${product.categorySlug}`} className="hover:text-primary transition">{product.category}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-600 line-clamp-1">{product.name}</span>
      </nav>

      {/* Main product layout */}
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Left — image */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={product.name}
              className="aspect-square h-full w-full object-cover"
            />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Especificações</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-400">Categoria</dt>
                <dd className="font-medium text-gray-900">{product.category || "Não informado"}</dd>
              </div>
              <div>
                <dt className="text-gray-400">SKU</dt>
                <dd className="font-medium text-gray-900" style={{ fontFamily: "var(--font-dm-mono), monospace" }}>
                  {product.sku || product.slug.toUpperCase()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">Unidade</dt>
                <dd className="font-medium text-gray-900">{product.unit}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Estoque</dt>
                <dd className={`font-medium ${product.stock === 0 ? "text-red-600" : product.isLowStock ? "text-amber-600" : "text-green-600"}`}>
                  {product.stock === 0 ? "Sem estoque" : product.isLowStock ? `${product.stock} (baixo)` : `${product.stock} disponível`}
                </dd>
              </div>
              {product.ncmCode && (
                <div className="col-span-2">
                  <dt className="text-gray-400">Código NCM</dt>
                  <dd className="font-medium text-gray-900" style={{ fontFamily: "var(--font-dm-mono), monospace" }}>{product.ncmCode}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Right — details */}
        <div className="space-y-5">
          <div>
            <Link
              href={`/catalog?category=${product.categorySlug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition mb-3"
            >
              {product.category}
            </Link>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-gray-900 leading-tight">
              {product.name}
            </h1>
            <p className="mt-1 text-xs text-gray-400">SKU: <span style={{ fontFamily: "var(--font-dm-mono), monospace" }}>{product.sku}</span></p>
          </div>

          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold tracking-[-0.03em] text-primary" style={{ fontFamily: "var(--font-dm-mono), monospace" }}>
              {formatPrice(product.price)}
            </p>
            <span className="text-sm text-gray-400">por {product.unit}</span>
          </div>

          {product.description && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Descrição</h2>
              <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
            </div>
          )}

          {/* Compatibility */}
          {product.compatibilities && product.compatibilities.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Compatibilidade</h2>
              <div className="space-y-2">
                {product.compatibilities.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    {c.equipment_brand} {c.equipment_model}
                    {c.year_from && ` (${c.year_from}${c.year_to ? `–${c.year_to}` : "+"})`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${product.stock === 0 ? "bg-red-400" : product.isLowStock ? "bg-amber-400" : "bg-green-500"}`} />
              <span className="text-sm text-gray-600">
                {product.stock === 0 ? "Produto sem estoque" : product.isLowStock ? `Apenas ${product.stock} em estoque` : "Em estoque — pronto para envio"}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {product.stock > 0 ? (
                <AddToCartButton product={product} fullWidth />
              ) : (
                <p className="text-sm font-semibold text-red-600">Produto sem estoque</p>
              )}
              <Link href="/catalog"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                ← Catálogo
              </Link>
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: "🚚", label: "Frete grátis", sub: "acima de R$ 500" },
              { icon: "🧾", label: "NF-e automática", sub: "após pagamento" },
              { icon: "🔒", label: "Pagamento seguro", sub: "Mercado Pago" },
            ].map((b) => (
              <div key={b.label} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="text-xl">{b.icon}</div>
                <p className="mt-1 text-[11px] font-semibold text-gray-700">{b.label}</p>
                <p className="text-[10px] text-gray-400">{b.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Shoveler ─────────────────────────────────────────────────── */}
      <ProductShoveler
        currentSlug={product.slug}
        category={product.category}
        categorySlug={product.categorySlug}
        accessToken={accessToken}
      />
    </div>
  );
}
