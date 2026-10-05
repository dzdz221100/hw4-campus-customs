import type { CSSProperties } from "react";
import "./About.css";

export default function About() {
  return (
    <div className="about">
      <h1 className="rise-in">About Campus Customs</h1>
      <p className="rise-in" style={{ "--rise-delay": 60 } as CSSProperties}>
        Campus Customs started as a side project between two Yale seniors who were tired of
        choosing between "overpriced bookstore hoodie" and "generic blue sweatshirt from a
        gift shop downtown." We wanted gear that actually felt like it belonged on campus —
        designed by people who'd sat through the same Sunday night reading period and stood
        in the same Yale Bowl rain.
      </p>
      <p className="rise-in" style={{ "--rise-delay": 120 } as CSSProperties}>
        Today we design and stock everything ourselves, working directly with Yale's
        licensing office so every graphic, every mascot, and every shade of blue is the real
        deal. No outsourced templates, no stock clip art of a bulldog that looks nothing like
        Handsome Dan.
      </p>
      <p className="rise-in" style={{ "--rise-delay": 180 } as CSSProperties}>
        We make gear for the whole Yale family: first-years figuring out which residential
        college is actually theirs, seniors stocking up before graduation, and parents who
        want something nicer than a t-shirt from the campus tour to bring home. Whatever your
        connection to Yale, there's a piece in our catalogue that's meant for you.
      </p>
      <p className="rise-in" style={{ "--rise-delay": 240 } as CSSProperties}>
        Our chatbot in the corner can help you find the right size, check what's in stock,
        or just talk through which hoodie matches your residential college colors — think of
        it as a very enthusiastic store associate who never needs a lunch break.
      </p>
    </div>
  );
}
