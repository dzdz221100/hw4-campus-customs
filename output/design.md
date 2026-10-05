# HW4 Design

A warm, elevated Yale identity layered onto the existing Yale-blue brand, built around Yale's own official marks (the Y shield and Handsome Dan) instead of flat blue-and-gray or an invented mascot. Concrete changes below; each one is live across every page.

## Typography

**Changed:** Added `Fraunces` (a characterful serif with real personality) for all headings and the nav/chat wordmark, paired with `Inter` for body text. Replaced the generic system-font look everywhere.
**Why it helps:** a distinct serif makes the site read as a real, considered storefront rather than a generic template — the first thing that builds trust that the products are curated, not dropshipped.

## Color & Palette

**Changed:** New design-token palette (`index.css`) — Yale blue deepened into a two-tone navy gradient, plus warm parchment/cream backgrounds, pumpkin-rust and ivy-green accents, replacing the old flat light-gray background and single blue/gold combo.
**Why it helps:** a navy-and-gray site feels corporate/cold; parchment + autumn accents feels like New Haven in October — warmer, more specific, more memorable, which is what makes a shopper associate the *brand* with the school rather than just the logo.

## Hierarchy & Layout

**Changed:** Bigger, confident hero type scale, bordered feature cards with icons (shield / leaf / ribbon), color-token-driven headings, consistent card borders/radii/shadows across Products, Home, and chat.
**Why it helps:** clearer visual hierarchy gets a shopper to "what do I click next" faster — less friction between landing on the page and reaching a product.

## Motion

**Changed:** A single understated `rise-in` entrance (fade + rise, staggered) applied to the hero, feature cards, product grids, and the About page; the chat panel now pops open with a soft scale+fade instead of appearing instantly. Respects `prefers-reduced-motion`.
**Why it helps:** subtle motion signals polish without being distracting or slow — it makes the site feel finished and cared-for, which correlates with shoppers trusting a store enough to check out.

## Product Presentation

**Changed:** Product cards now zoom the photo slightly on hover and highlight with a gold border; the detail page renders each real color as a small swatch dot + label instead of a plain comma list; in-stock/sold-out sizes get a small ivy/pumpkin status dot instead of relying on text alone.
**Why it helps:** these are real data (actual colors, actual stock) presented more legibly — a shopper can scan sizes/colors at a glance instead of reading a sentence, which shortens the path to "yes, this works for me, add to cart."

## Chat Feel

**Changed:** The chat panel header carries the Yale "Y" shield; the floating toggle button itself shows Handsome Dan's face with a small gold speech-bubble badge (💬) overlapping its corner, plus an always-visible "Chat with us" text label next to it. Warmer parchment bubble colors, a gold top border, and a softer pop-in animation throughout.
**Why it helps:** the chat is the one part of the site having a "conversation" with the shopper — a mascot face plus an explicit badge and label makes it unmistakable that the button opens a chatbot (not just a logo), and feeling like a branded concierge makes shoppers more willing to actually ask it a question instead of bouncing to search elsewhere.

## Real Yale Marks, Not Invented Ones

**Changed:** Initially built a hand-drawn bulldog mascot; replaced it with Yale's own official marks instead, at the user's request — the Yale "Y" shield (used small in the nav and chat) and the real Handsome Dan illustration (used large in the hero). No invented branding, just Yale's actual identity.
**Why it helps:** a made-up mascot reads as a knockoff; the real shield and Handsome Dan read as authentic and officially licensed, which is exactly the trust signal a Yale shopper is looking for before they buy branded gear.

## Interactivity

**Changed:** The hero's Handsome Dan illustration is clickable — "pet" him and he barks a random, in-character line ("Boola boola!", "Handsome Dan approves.") in a speech bubble, with a playful scale/tilt on hover.
**Why it helps:** a static hero is scrolled past; one with a hidden, charming interaction invites a shopper to linger a few extra seconds and actually read the page below it — small delight, longer attention, better odds they keep scrolling into the catalogue.

## More Yale, Everywhere

**Changed:** The Yale "Y" now also appears as a large, faint watermark behind the hero text, in a new site-wide footer ("Campus Customs — officially licensed Yale gear, made for the whole Bulldog family"), and as the browser tab's favicon — on top of the nav and chat placements above.
**Why it helps:** a shopper should feel the Yale connection at every touchpoint, not just the header — the watermark and footer reinforce authenticity on the page itself, and the favicon keeps that identity visible even when the tab is just sitting in a row of other open tabs.
