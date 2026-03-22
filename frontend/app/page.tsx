import Link from "next/link";
import { HeroBanner } from "@/components/storefront/hero-banner";
import { ProductCard } from "@/components/storefront/product-card";
import { cookies } from "next/headers";
import { getCatalogCategories, getFeaturedProducts } from "@/lib/catalog-api";

export default async function Home() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("interbr-access")?.value;
  const featuredProducts = await getFeaturedProducts(8, accessToken);
  const categories = await getCatalogCategories();

  return (
    <div className="space-y-16">
      {/* Hero — rotating banner */}
      <HeroBanner />

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { value: "20+", label: "Anos de mercado" },
          { value: "5.000+", label: "Produtos no catálogo" },
          { value: "2.000+", label: "Empresas atendidas" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white px-4 py-5 text-center shadow-sm">
            <p className="text-2xl font-bold tracking-[-0.03em] text-primary" style={{ fontFamily: "var(--font-dm-mono), monospace" }}>{s.value}</p>
            <p className="mt-1 text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Categories */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-gray-900">Categorias</h2>
          <Link href="/catalog" className="text-sm font-medium text-primary hover:underline">Ver todos</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {categories.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 text-sm text-gray-400 sm:col-span-2 lg:col-span-5 text-center">
              Nenhuma categoria ainda.
            </div>
          ) : (
            categories.slice(0, 10).map((category) => (
              <Link
                key={category.slug || category.name}
                href={`/catalog?category=${category.slug}`}
                className="flex items-center justify-center rounded-xl border border-gray-100 bg-white px-4 py-4 text-[13px] font-medium text-gray-700 shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                {category.name}
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Featured products */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-gray-900">Produtos em destaque</h2>
          <Link href="/catalog" className="text-sm font-medium text-primary hover:underline">Ver todos</Link>
        </div>
        {featuredProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-gray-400">
            Nenhum produto em destaque. Verifique se o backend está rodando em <code className="font-mono text-xs">localhost:8000</code>.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* CTA footer band */}
      <section className="rounded-2xl border border-primary/20 bg-primary/5 px-8 py-10 text-center">
        <h3 className="text-xl font-semibold tracking-[-0.02em] text-gray-900">Pronto para fazer seu primeiro pedido?</h3>
        <p className="mt-2 text-sm text-gray-500">Crie sua conta em 2 minutos e acesse preços exclusivos por tabela.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="inline-flex h-10 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 transition">
            Criar conta
          </Link>
          <Link href="/contato" className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
            Falar com vendedor
          </Link>
        </div>
      </section>
    </div>
  );
}
