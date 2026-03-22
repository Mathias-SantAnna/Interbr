const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type CatalogProduct = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  categorySlug: string;
  price: number;
  unit: string;
  imageUrl: string | null;
  stock: number;
  isLowStock: boolean;
  isFeatured: boolean;
};

export type ProductCompatibility = {
  id: string;
  equipment_brand: string;
  equipment_model: string;
  year_from: number | null;
  year_to: number | null;
  notes: string;
};

export type ProductDetail = CatalogProduct & {
  ncmCode: string;
  weightKg: number;
  compatibilities: ProductCompatibility[];
};

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

export type CatalogListResult = {
  products: CatalogProduct[];
  count: number;
  next: string | null;
  previous: string | null;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ProductFilters = {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  ordering?: string;
  page?: number;
  pageSize?: number;
};

type UnknownRecord = Record<string, unknown>;

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function mapProduct(raw: UnknownRecord): CatalogProduct {
  const categoryValue = raw.category;
  // List serializer returns category_name + category_slug as flat fields.
  // Detail serializer returns category as a nested object.
  const categoryName =
    typeof categoryValue === "object" && categoryValue !== null
      ? asString((categoryValue as UnknownRecord).name)
      : asString(raw.category_name || categoryValue);
  const categorySlug =
    typeof categoryValue === "object" && categoryValue !== null
      ? asString((categoryValue as UnknownRecord).slug)
      : asString(raw.category_slug);

  // display_image is a @property on the model (returns image.url or image_url).
  const imageValue = raw.display_image ?? raw.image_url ?? raw.image;

  return {
    id: asString(raw.id),
    sku: asString(raw.sku),
    slug: asString(raw.slug),
    name: asString(raw.name, "Produto sem nome"),
    description: asString(raw.description),
    category: categoryName,
    categorySlug,
    price: asNumber(raw.price ?? raw.base_price),
    unit: asString(raw.unit, "un"),
    imageUrl: typeof imageValue === "string" && imageValue ? imageValue : null,
    stock: asNumber(raw.stock_qty ?? raw.stock),
    isLowStock: asBoolean(raw.is_low_stock),
    isFeatured: asBoolean(raw.is_featured),
  };
}

function mapCompatibility(raw: UnknownRecord): ProductCompatibility {
  return {
    id: asString(raw.id),
    equipment_brand: asString(raw.equipment_brand),
    equipment_model: asString(raw.equipment_model),
    year_from: typeof raw.year_from === "number" ? raw.year_from : null,
    year_to: typeof raw.year_to === "number" ? raw.year_to : null,
    notes: asString(raw.notes),
  };
}

function mapCategory(raw: UnknownRecord): CatalogCategory {
  const id = asString(raw.id);
  const name = asString(raw.name) || asString(raw.title) || `Categoria ${id || "desconhecida"}`;
  const slug = asString(raw.slug, name.toLowerCase().replaceAll(" ", "-"));
  return { id, name, slug, productCount: asNumber(raw.product_count) };
}

async function requestJson(path: string, params?: URLSearchParams, token?: string) {
  const query = params && params.toString() ? `?${params.toString()}` : "";
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}${path}${query}`, {
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Catalog API error: ${response.status} ${path}`);
  }

  return response.json() as Promise<unknown>;
}

function extractList(payload: unknown): UnknownRecord[] {
  if (Array.isArray(payload)) return payload as UnknownRecord[];
  if (payload && typeof payload === "object") {
    const maybeResults = (payload as UnknownRecord).results;
    if (Array.isArray(maybeResults)) return maybeResults as UnknownRecord[];
  }
  return [];
}

function extractPagination(payload: unknown): {
  count: number;
  next: string | null;
  previous: string | null;
} {
  if (payload && typeof payload === "object") {
    const record = payload as UnknownRecord;
    return {
      count: asNumber(record.count, 0),
      next: typeof record.next === "string" ? record.next : null,
      previous: typeof record.previous === "string" ? record.previous : null,
    };
  }
  return { count: 0, next: null, previous: null };
}

function dedupeCategories(categories: CatalogCategory[]): CatalogCategory[] {
  const bySlug = new Map<string, CatalogCategory>();
  for (const cat of categories) {
    if (!cat.slug) continue;
    if (!bySlug.has(cat.slug)) bySlug.set(cat.slug, cat);
  }
  return Array.from(bySlug.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getFeaturedProducts(limit = 8, token?: string): Promise<CatalogProduct[]> {
  try {
    const json = await requestJson("/catalog/products/featured/", undefined, token);
    return extractList(json).slice(0, limit).map(mapProduct);
  } catch {
    return [];
  }
}

export async function getCatalogProducts(filters: ProductFilters = {}, token?: string): Promise<CatalogListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, filters.pageSize ?? 12);
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (typeof filters.minPrice === "number") params.set("price_min", String(filters.minPrice));
  if (typeof filters.maxPrice === "number") params.set("price_max", String(filters.maxPrice));
  if (filters.inStock) params.set("in_stock", "true");
  if (filters.ordering) params.set("ordering", filters.ordering);
  params.set("page", String(page));
  params.set("page_size", String(pageSize));

  try {
    const json = await requestJson("/catalog/products/", params, token);
    const products = extractList(json).map(mapProduct);
    const pagination = extractPagination(json);
    const count = pagination.count || products.length;
    const totalPages = Math.max(1, Math.ceil(count / pageSize));

    return {
      products,
      count,
      next: pagination.next,
      previous: pagination.previous,
      page,
      pageSize,
      totalPages,
    };
  } catch {
    return { products: [], count: 0, next: null, previous: null, page, pageSize, totalPages: 1 };
  }
}

export async function getCatalogCategories(): Promise<CatalogCategory[]> {
  try {
    const json = await requestJson("/catalog/categories/");
    const categories = extractList(json).map(mapCategory);
    if (categories.length > 0) return dedupeCategories(categories);
  } catch {
    // fall through to product-based fallback
  }

  // Fallback: derive categories from first page of products
  const { products } = await getCatalogProducts({ page: 1, pageSize: 100 });
  const fallback: CatalogCategory[] = products
    .filter((p) => p.category && p.categorySlug)
    .map((p) => ({ id: "", name: p.category, slug: p.categorySlug, productCount: 0 }));
  return dedupeCategories(fallback);
}

export async function getProductBySlug(slug: string, token?: string): Promise<ProductDetail | null> {
  try {
    const json = await requestJson(`/catalog/products/${slug}/`, undefined, token);
    if (!json || typeof json !== "object") return null;
    const raw = json as UnknownRecord;
    const base = mapProduct(raw);
    const compat = Array.isArray(raw.compatibilities)
      ? (raw.compatibilities as UnknownRecord[]).map(mapCompatibility)
      : [];
    return {
      ...base,
      ncmCode: asString(raw.ncm_code),
      weightKg: asNumber(raw.weight_kg),
      compatibilities: compat,
    };
  } catch {
    return null;
  }
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
