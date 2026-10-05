import { Link } from "react-router-dom";
import type { ProductSummary } from "../api/products";
import { imageSrc } from "../api/products";
import "./ProductCard.css";

export default function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link to={`/products/${product.product_id}`} className="product-card">
      <div className="product-card-image">
        <img src={imageSrc(product.image_url)} alt={product.name} loading="lazy" />
      </div>
      <div className="product-card-body">
        <h3>{product.name}</h3>
        <p className="product-card-desc">{product.description}</p>
        <p className="product-card-price">${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
