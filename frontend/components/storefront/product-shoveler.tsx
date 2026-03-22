import { getCatalogProducts, type CatalogProduct } from "@/lib/catalog-api";
import { ProductCarousel } from "./product-carousel";

// Category -> Unsplash fallback image
const CATEGORY_IMAGES: Record<string, string> = {
  florestal:   "https://images.unsplash.com/photo-1597349881767-0fc8bf5a8acd?w=400&h=400&fit=crop",
  solar:       "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=400&fit=crop",
  epi:         "https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=400&h=400&fit=crop",
  limpeza:     "https://images.unsplash.com/photo-1631625285793-b2fc4e59dfd9?w=400&h=400&fit=crop",
  industrial:  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop",
  ferramentas: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop",
  eletrico:    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
  agricola:    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop",
};

function getFallback(category: string): string {
  const key = (category || "").toLowerCase().replace(/[^a-z]/g, "");
  for (const [k, url] of Object.entries(CATEGORY_IMAGES)) {
    if (key.includes(k) || k.includes(key.slice(0, 4))) return url;
  }
  return CATEGORY_IMAGES.industrial;
}

interface Props {
  currentSlug: string;
  category: string;
  categorySlug: string;
  accessToken?: string;
}

export async function ProductShoveler({ currentSlug, category, categorySlug, accessToken }: Props) {
  if (!categorySlug && !category) return null;

  const { products } = await getCatalogProducts(
    { category: categorySlug || category, pageSize: 20 },
    accessToken
  );

  const related = products
    .filter((p) => p.slug !== currentSlug)
    .slice(0, 16)
    .map((p) => ({ ...p, fallbackImage: getFallback(p.category) }));

  if (related.length === 0) return null;

  return (
    <ProductCarousel
      products={related}
      category={category}
      categorySlug={categorySlug}
    />
  );
}
