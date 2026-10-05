import type { ProductSummary } from "./api/products";

const STORAGE_KEY = "campus-customs-recently-viewed";
const MAX_ITEMS = 6;

export function addRecentlyViewed(product: ProductSummary): void {
  const existing = getRecentlyViewed().filter((p) => p.product_id !== product.product_id);
  const updated = [product, ...existing].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getRecentlyViewed(): ProductSummary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProductSummary[]) : [];
  } catch {
    return [];
  }
}
