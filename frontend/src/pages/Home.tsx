import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { ShieldIcon, LeafIcon, RibbonIcon } from "../components/icons";
import yaleBulldog from "../assets/yale-bulldog.png";
import yaleY from "../assets/yale-y.png";
import type { ProductSummary } from "../api/products";
import { getRecentlyViewed } from "../recentlyViewed";
import "./Home.css";

const BARKS = [
  "Woof! Go Bulldogs!",
  "Boola boola!",
  "Sniffing out the best gear for you...",
  "Handsome Dan approves.",
  "Bulldogs don't do basic.",
];

export default function Home() {
  const [recentlyViewed, setRecentlyViewed] = useState<ProductSummary[]>([]);
  const [bark, setBark] = useState<string | null>(null);
  const barkTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    setRecentlyViewed(getRecentlyViewed());
    return () => window.clearTimeout(barkTimeout.current);
  }, []);

  function handlePetDog() {
    setBark(BARKS[Math.floor(Math.random() * BARKS.length)]);
    window.clearTimeout(barkTimeout.current);
    barkTimeout.current = window.setTimeout(() => setBark(null), 2200);
  }

  return (
    <div className="home">
      <section className="hero">
        <img src={yaleY} className="hero-watermark" alt="" aria-hidden="true" />
        <button
          type="button"
          className="hero-mascot-button rise-in"
          style={{ "--rise-delay": 40 } as CSSProperties}
          onClick={handlePetDog}
          aria-label="Pet Handsome Dan"
        >
          <img src={yaleBulldog} className="hero-mascot" alt="Handsome Dan, the Yale Bulldog" />
          {bark && <span className="hero-bark">{bark}</span>}
        </button>

        <h1 className="rise-in" style={{ "--rise-delay": 80 } as CSSProperties}>
          Wear the Blue. Live the Game.
        </h1>
        <p className="rise-in" style={{ "--rise-delay": 160 } as CSSProperties}>
          Campus Customs is where Yale pride shows up on game day, move-in day, and every
          ordinary Tuesday in between. We make gear for students pulling an all-nighter in
          Bass Library, grads back for reunion weekend, and parents who never stopped
          cheering from the stands.
        </p>
        <Link to="/products" className="hero-cta rise-in" style={{ "--rise-delay": 240 } as CSSProperties}>
          Shop the Collection
        </Link>
      </section>

      <section className="features">
        <div className="feature rise-in" style={{ "--rise-delay": 0 } as CSSProperties}>
          <ShieldIcon className="feature-icon" />
          <h2>Built for Every Bulldog</h2>
          <p>
            From Timothy Dwight to the Divinity School, we cut gear for every residential
            college, program, and class year — because Yale spirit doesn't stop at one
            building.
          </p>
        </div>
        <div className="feature rise-in" style={{ "--rise-delay": 90 } as CSSProperties}>
          <LeafIcon className="feature-icon" />
          <h2>Comfort First, Tradition Always</h2>
          <p>
            Soft fleece, heavyweight cotton, and classic cuts that hold up through a season
            of tailgates — details that nod to Yale's history without feeling stiff.
          </p>
        </div>
        <div className="feature rise-in" style={{ "--rise-delay": 180 } as CSSProperties}>
          <RibbonIcon className="feature-icon" />
          <h2>Officially Yale</h2>
          <p>
            Every design is officially licensed, so you can wear it knowing it's the real
            thing, not a knockoff from off campus.
          </p>
        </div>
      </section>

      {recentlyViewed.length > 0 && (
        <section className="recently-viewed">
          <h2>Recently Viewed</h2>
          <div className="recently-viewed-grid">
            {recentlyViewed.map((p, i) => (
              <div key={p.product_id} className="rise-in" style={{ "--rise-delay": i * 60 } as CSSProperties}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
