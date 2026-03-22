import Link from "next/link";
import { ProductCard } from "@/components/storefront/product-card";
import { cookies } from "next/headers";
import { getCatalogCategories, getCatalogProducts } from "@/lib/catalog-api";

type CatalogPageProps = {
  searchParams: Promise<{
    search?: string;
    category?: string;
    min_price?: string;
    max_price?: string;
    ordering?: string;
    page?: string;
  }>;
};

type PaginationItem = number | "start-ellipsis" | "end-ellipsis";

function getOrderingLabel(ordering: string): string {
  switch (ordering) {
    case "price":
      return "Preco crescente";
    case "-price":
      return "Preco decrescente";
    case "name":
      return "Nome A-Z";
    case "-name":
      return "Nome Z-A";
    default:
      return ordering;
  }
}

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const boundaryCount = 1;
  const siblingCount = 1;

  const startPages = [1];
  const endPages = [totalPages];

  const siblingsStart = Math.max(
    Math.min(
      currentPage - siblingCount,
      totalPages - boundaryCount - siblingCount * 2 - 1,
    ),
    boundaryCount + 2,
  );

  const siblingsEnd = Math.min(
    Math.max(
      currentPage + siblingCount,
      boundaryCount + siblingCount * 2 + 2,
    ),
    totalPages - boundaryCount - 1,
  );

  const items: PaginationItem[] = [...startPages];

  if (siblingsStart > boundaryCount + 2) {
    items.push("start-ellipsis");
  } else if (boundaryCount + 1 < totalPages) {
    items.push(boundaryCount + 1);
  }

  for (let page = siblingsStart; page <= siblingsEnd; page += 1) {
    items.push(page);
  }

  if (siblingsEnd < totalPages - boundaryCount - 1) {
    items.push("end-ellipsis");
  } else if (totalPages - boundaryCount > boundaryCount) {
    items.push(totalPages - boundaryCount);
  }

  items.push(...endPages);

  return items;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const search = params.search ?? "";
  const category = params.category ?? "";
  const ordering = params.ordering ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const minPrice = params.min_price ? Number(params.min_price) : undefined;
  const maxPrice = params.max_price ? Number(params.max_price) : undefined;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("interbr-access")?.value;

  const [catalogResult, categories] = await Promise.all([
    getCatalogProducts({
      search: search || undefined,
      category: category || undefined,
      minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      ordering: ordering || undefined,
      page,
      pageSize: 12,
    }, accessToken),
    getCatalogCategories(),
  ]);

  const { products, count, totalPages } = catalogResult;

  const buildCatalogHref = (targetPage: number) => {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (category) query.set("category", category);
    if (params.min_price) query.set("min_price", params.min_price);
    if (params.max_price) query.set("max_price", params.max_price);
    if (ordering) query.set("ordering", ordering);
    if (targetPage > 1) query.set("page", String(targetPage));
    const queryString = query.toString();
    return queryString ? `/catalog?${queryString}` : "/catalog";
  };

  const buildHrefWithout = (field: "search" | "category" | "min_price" | "max_price" | "ordering") => {
    const query = new URLSearchParams();
    if (search && field !== "search") query.set("search", search);
    if (category && field !== "category") query.set("category", category);
    if (params.min_price && field !== "min_price") query.set("min_price", params.min_price);
    if (params.max_price && field !== "max_price") query.set("max_price", params.max_price);
    if (ordering && field !== "ordering") query.set("ordering", ordering);
    const queryString = query.toString();
    return queryString ? `/catalog?${queryString}` : "/catalog";
  };

  const paginationItems = getPaginationItems(page, totalPages);

  const activeFilters = [
    search ? { label: `Busca: ${search}`, href: buildHrefWithout("search") } : null,
    category ? { label: `Categoria: ${category}`, href: buildHrefWithout("category") } : null,
    params.min_price
      ? { label: `Preco min: ${params.min_price}`, href: buildHrefWithout("min_price") }
      : null,
    params.max_price
      ? { label: `Preco max: ${params.max_price}`, href: buildHrefWithout("max_price") }
      : null,
    ordering
      ? { label: `Ordem: ${getOrderingLabel(ordering)}`, href: buildHrefWithout("ordering") }
      : null,
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  const from = count === 0 ? 0 : (page - 1) * 12 + 1;
  const to = Math.min(page * 12, count);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-gray-900">Catálogo</h1>
          <p className="mt-2 text-sm text-gray-500">
            Pesquise produtos por nome e aplique filtros para acelerar o pedido.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {count > 0 ? `Mostrando ${from}-${to} de ${count} produtos` : "Nenhum resultado"}
        </p>
      </div>

      <form className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-7">
        <input
          name="search"
          defaultValue={search}
          placeholder="Buscar por nome, marca ou SKU"
          className="md:col-span-2 h-9 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
        <select
          name="category"
          defaultValue={category}
          className="h-8 rounded-xl border border-gray-200 bg-white px-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        >
          <option value="">Todas as categorias</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        
        <input
          name="min_price"
          defaultValue={params.min_price ?? ""}
          placeholder="Preço mín"
          type="number"
          min={0}
          step="0.01"
          className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
        <input
          name="max_price"
          defaultValue={params.max_price ?? ""}
          placeholder="Preço máx"
          type="number"
          min={0}
          step="0.01"
          className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
        <select
          name="ordering"
          defaultValue={ordering}
          className="h-8 rounded-xl border border-gray-200 bg-white px-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        >
          <option value="">Ordenacao padrao</option>
          <option value="price">Preco: menor primeiro</option>
          <option value="-price">Preco: maior primeiro</option>
          <option value="name">Nome: A-Z</option>
          <option value="-name">Nome: Z-A</option>
        </select>
        <input type="hidden" name="page" value="1" />
        <div className="md:col-span-7 flex items-center gap-2">
          <button type="submit" className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 transition">Aplicar filtros</button>
          <Link
            href="/catalog"
            className="inline-flex h-8 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Limpar
          </Link>
        </div>
      </form>

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <Link
              key={filter.label}
              href={filter.href}
              className="inline-flex h-7 items-center gap-1 rounded-full border bg-background px-3 text-xs font-medium hover:bg-muted"
            >
              {filter.label}
              <span aria-hidden>×</span>
            </Link>
          ))}
          <Link
            href="/catalog"
            className="inline-flex h-7 items-center rounded-full border border-dashed border-gray-300 px-3 text-xs text-gray-400 hover:bg-gray-50 transition"
          >
            Limpar tudo
          </Link>
        </div>
      ) : null}

      {products.length === 0 ? (
        <div className="space-y-4 rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-sm text-gray-500">
            Nenhum produto encontrado com os filtros atuais.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/catalog"
              className="inline-flex h-8 items-center rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted"
            >
              Limpar filtros
            </Link>
            {categories.slice(0, 4).map((item) => (
              <Link
                key={item.slug || item.name}
                href={`/catalog?category=${item.slug}`}
                className="inline-flex h-8 items-center rounded-lg border bg-background px-3 text-sm hover:bg-muted"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm text-sm">
          <Link
            href={buildCatalogHref(page - 1)}
            className={`inline-flex h-8 items-center rounded-lg px-3 ${
              page <= 1
                ? "pointer-events-none border text-muted-foreground opacity-50"
                : "border border-gray-200 bg-white hover:bg-gray-50 transition"
            }`}
          >
            Anterior
          </Link>
          <span className="text-muted-foreground">
            Pagina {page} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            {paginationItems.map((item, index) => {
              if (item === "start-ellipsis" || item === "end-ellipsis") {
                return (
                  <span key={`${item}-${index}`} className="px-1 text-muted-foreground">
                    ...
                  </span>
                );
              }

              const isActive = item === page;
              return (
                <Link
                  key={item}
                  href={buildCatalogHref(item)}
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 ${
                    isActive
                      ? "bg-primary text-white"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  {item}
                </Link>
              );
            })}
          </div>
          <Link
            href={buildCatalogHref(page + 1)}
            className={`inline-flex h-8 items-center rounded-lg px-3 ${
              page >= totalPages
                ? "pointer-events-none border text-muted-foreground opacity-50"
                : "border border-gray-200 bg-white hover:bg-gray-50 transition"
            }`}
          >
            Proxima
          </Link>
        </div>
      ) : null}
    </div>
  );
}
