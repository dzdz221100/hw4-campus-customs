# HW4 Usability Improvements

Two front-end and two agent/backend usability improvements, chosen to be genuinely useful for a shop with 102 unsorted products and a chat assistant -- not cosmetic, not over-engineered (no cart/checkout, no streaming, no new infra).

## Front-end #1 — Filter & sort on the Products page

**What was added:** `Products.tsx` now derives the distinct garment types present in the catalogue and renders them as clickable filter chips ("All", "hoodie", "crewneck", "t-shirt", ...), plus a price sort dropdown (default / low-to-high / high-to-low). Filtering and sorting happen client-side over the already-fetched product list.

**Why it helps:** the catalogue has 102 items in one flat grid with no way to narrow it down -- a shopper who wants "just the hoodies" or "cheapest first" currently has to scroll everything. This directly shortens the path from landing on Products to finding something to buy, which helps the shopper (less scrolling/frustration) and the business (fewer abandoned browsing sessions).

## Front-end #2 — "Recently Viewed" on the Home page

**What was added:** every time a shopper opens a product's detail page, it's saved (most-recent-first, deduplicated, capped at 6) to `localStorage`. The Home page shows a "Recently Viewed" section with those products as the same `ProductCard`s used on Products, when there's at least one.

**Why it helps:** shoppers often browse a few products, leave, and can't remember what they were looking at or how to find it again by searching. Surfacing it right on Home removes that friction entirely, and for the business it keeps a considered item visible instead of forgotten, reducing abandoned consideration.

## Backend/agent #1 — Typo-tolerant catalogue search

**What was added:** `search_catalogue()` now falls back to fuzzy matching (stdlib `difflib.get_close_matches` against the catalogue's own vocabulary) for any query word that isn't literally found anywhere in the catalogue text -- e.g. "hoody", "crewnek", "sweetshirt" now resolve to "hoodie", "crewneck", "sweatshirt" before scoring.

**Why it helps:** shoppers type casually and make typos, especially on mobile. Previously a typo'd query silently returned zero results and the agent had to tell the shopper "I couldn't find that" -- a dead end that looks like the store doesn't carry the item at all. Fuzzy-correcting it keeps a small typo from costing a sale.

## Backend/agent #2 — Suggested quick-reply chips

**What was added:** the agent's structured output now includes up to 3 short `suggested_replies` (phrased as something the shopper would say next, e.g. "What sizes are available?", "Show me more hoodies"), passed through to the front end and rendered as tappable chips under the latest reply. Tapping one sends it as the next message immediately.

**Why it helps:** it turns "what do I ask next?" into one tap instead of typing, which especially matters on mobile. For the business, the suggestions are written to nudge toward stock/size questions and related browsing -- i.e. toward the actions that actually move a shopper closer to buying, not just generic chit-chat.
