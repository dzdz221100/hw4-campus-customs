import { useEffect, useMemo, useState, type CSSProperties } from "react";
import ProductCard from "../components/ProductCard";
import { fetchProducts, type ProductSummary } from "../api/products";
import "./Products.css";

type SortOrder = "default" | "price-asc" | "price-desc";

// The catalogue's raw garment_type text is inconsistent (e.g. "short-sleeve
// t-shirt" vs "short-sleeve T-shirt", "quarter-zip pullover sweatshirt" vs
// "quarter-zip pullover") -- too granular and messy to use directly as
// filter chips. Bucket into a small, stable set of shopper-facing categories
// instead.
const CATEGORY_RULES: { label: string; test: (garmentType: string) => boolean }[] = [
  { label: "Hoodies", test: (gt) => gt.includes("hoodie") || gt.includes("hooded") },
  { label: "Crewnecks", test: (gt) => gt.includes("crewneck") || gt.includes("mockneck") },
  { label: "T-Shirts", test: (gt) => gt.includes("t-shirt") },
  { label: "Quarter-Zips", test: (gt) => gt.includes("quarter-zip") },
  { label: "Jackets", test: (gt) => gt.includes("jacket") },
];

function categoryFor(garmentType: string): string {
  const lower = garmentType.toLowerCase();
  return CATEGORY_RULES.find((rule) => rule.test(lower))?.label ?? "Other";
}

export default function Products() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [category, setCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProducts(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      const cat = categoryFor(p.garment_type);
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const visibleProducts = useMemo(() => {
    let list = category ? products.filter((p) => categoryFor(p.garment_type) === category) : products;
    if (sortOrder !== "default") {
      list = [...list].sort((a, b) => (sortOrder === "price-asc" ? a.price - b.price : b.price - a.price));
    }
    return list;
  }, [products, category, sortOrder]);

  if (status === "loading") return <div className="products-status">Loading products…</div>;
  if (status === "error")
    return (
      <div className="products-status">
        Couldn't load products. Is the backend running at localhost:8000?
      </div>
    );

  return (
    <div className="products-page">
      <h1>Products</h1>

      <div className="products-controls">
        <div className="category-chips">
          <button className={category === null ? "active" : ""} onClick={() => setCategory(null)}>
            All ({products.length})
          </button>
          {[...categoryCounts.entries()].map(([label, count]) => (
            <button key={label} className={category === label ? "active" : ""} onClick={() => setCategory(label)}>
              {label} ({count})
            </button>
          ))}
        </div>
        <select
          className="sort-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          aria-label="Sort by price"
        >
          <option value="default">Sort: Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {visibleProducts.length === 0 ? (
        <p className="products-empty">No products in this category.</p>
      ) : (
        <div className="products-grid">
          {visibleProducts.map((p, i) => (
            <div
              key={p.product_id}
              className="rise-in"
              style={{ "--rise-delay": Math.min(i, 10) * 35 } as CSSProperties}
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
