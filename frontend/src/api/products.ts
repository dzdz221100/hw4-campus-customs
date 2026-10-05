const API_BASE = "http://localhost:8000";

export interface ProductSummary {
  product_id: string;
  name: string;
  garment_type: string;
  description: string;
  price: number;
  image_url: string;
}

export interface SizeStock {
  size: string;
  quantity: number;
}

export interface ProductDetail extends ProductSummary {
  colors: string[];
  search_tags: string[];
  sizes: SizeStock[];
}

function imageSrc(path: string): string {
  return `${API_BASE}${path}`;
}

export async function fetchProducts(): Promise<ProductSummary[]> {
  const res = await fetch(`${API_BASE}/api/products`);
  if (!res.ok) throw new Error("Failed to load products");
  return res.json();
}

export async function fetchProduct(productId: string): Promise<ProductDetail> {
  const res = await fetch(`${API_BASE}/api/products/${productId}`);
  if (!res.ok) throw new Error("Failed to load product");
  return res.json();
}

export { imageSrc };
