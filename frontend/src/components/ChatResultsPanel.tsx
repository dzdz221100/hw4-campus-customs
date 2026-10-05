import ProductCard from "./ProductCard";
import { useChatResults } from "../search/ChatResultsContext";
import "./ChatResultsPanel.css";

export default function ChatResultsPanel() {
  const { results, clearResults } = useChatResults();
  if (!results || results.products.length === 0) return null;

  return (
    <div className="chat-results-panel">
      <div className="chat-results-header">
        <h2>
          Chat found {results.products.length} product{results.products.length === 1 ? "" : "s"} for "
          {results.query}"
        </h2>
        <button className="chat-results-dismiss" onClick={clearResults} aria-label="Dismiss search results">
          ×
        </button>
      </div>
      <div className="chat-results-grid">
        {results.products.map((p) => (
          <ProductCard key={p.product_id} product={p} />
        ))}
      </div>
    </div>
  );
}
