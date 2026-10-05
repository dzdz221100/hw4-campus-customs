import { useEffect, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchProduct, imageSrc, type ProductDetail as ProductDetailType } from "../api/products";
import { usePageContext } from "../pageContext/PageContextContext";
import { addRecentlyViewed } from "../recentlyViewed";
import { colorToSwatch } from "../colorSwatch";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<ProductDetailType | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const { setViewedProduct } = usePageContext();

  useEffect(() => {
    if (!productId) return;
    setStatus("loading");
    fetchProduct(productId)
      .then((data) => {
        setProduct(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [productId]);

  // Tells the chat assistant which product page the shopper is on, so "do
  // you have this in pink?" can resolve to a real product without them
  // having to name it again. Cleared when they navigate away.
  useEffect(() => {
    if (!product) return;
    setViewedProduct({ productId: product.product_id, productName: product.name });
    return () => setViewedProduct(null);
  }, [product, setViewedProduct]);

  // Remember products a shopper has looked at so they can find them again
  // from the Home page without re-searching (see "Recently Viewed" there).
  useEffect(() => {
    if (!product) return;
    addRecentlyViewed({
      product_id: product.product_id,
      name: product.name,
      garment_type: product.garment_type,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
    });
  }, [product]);

  if (status === "loading") return <div className="product-detail-status">Loading…</div>;
  if (status === "error" || !product)
    return (
      <div className="product-detail-status">
        <p>Couldn't find that product.</p>
        <Link to="/products">Back to all products</Link>
      </div>
    );

  return (
    <div className="product-detail">
      <div className="product-detail-image rise-in">
        <img src={imageSrc(product.image_url)} alt={product.name} />
      </div>
      <div className="product-detail-info rise-in" style={{ "--rise-delay": 80 } as CSSProperties}>
        <Link to="/products" className="back-link">
          ← All products
        </Link>
        <h1>{product.name}</h1>
        <p className="product-detail-price">${product.price.toFixed(2)}</p>
        <p className="product-detail-type">{product.garment_type}</p>
        <p className="product-detail-desc">{product.description}</p>

        <div className="product-detail-section">
          <h2>Colors</h2>
          <div className="color-swatches">
            {product.colors.map((c) => (
              <span key={c} className="color-swatch">
                <span className="swatch-dot" style={{ background: colorToSwatch(c) }} />
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="product-detail-section">
          <h2>Sizes &amp; Stock</h2>
          {product.sizes.length === 0 ? (
            <p>No stock information available.</p>
          ) : (
            <ul className="size-list">
              {product.sizes.map((s) => (
                <li key={s.size} className={s.quantity === 0 ? "out-of-stock" : ""}>
                  <span className="size-label">{s.size}</span>
                  <span className="size-qty">
                    {s.quantity === 0 ? "Sold out" : `${s.quantity} in stock`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
