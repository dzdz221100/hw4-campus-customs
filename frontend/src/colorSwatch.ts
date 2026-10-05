// Catalogue colors are free-text ("heather gray", "navy blue", ...). This
// maps common keywords to an approximate CSS color so they can render as a
// small swatch dot next to the label, instead of a plain comma-separated
// list -- a real, concrete presentation upgrade using the same data.
const KEYWORD_COLORS: [string, string][] = [
  ["navy", "#1b2a4a"],
  ["charcoal", "#3d3f42"],
  ["heather gray", "#9aa0a6"],
  ["heather grey", "#9aa0a6"],
  ["gray", "#9aa0a6"],
  ["grey", "#9aa0a6"],
  ["white", "#f5f5f0"],
  ["black", "#1a1a1a"],
  ["red", "#b3261e"],
  ["pink", "#e8a0bf"],
  ["gold", "#c9a227"],
  ["yellow", "#e4c441"],
  ["green", "#3c6349"],
  ["orange", "#bf5b30"],
  ["blue", "#2a5ea8"],
  ["cream", "#f1e7d6"],
  ["tan", "#c9b38b"],
  ["brown", "#6b4a33"],
  ["maroon", "#6c1f2c"],
  ["purple", "#5b3a73"],
];

export function colorToSwatch(name: string): string {
  const lower = name.toLowerCase();
  for (const [keyword, hex] of KEYWORD_COLORS) {
    if (lower.includes(keyword)) return hex;
  }
  return "#cbd3dd";
}
