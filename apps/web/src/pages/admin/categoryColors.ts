// A small, curated set of muted hues (not a full rainbow) so category charts stay legible and
// still feel at home next to the site's single-accent dark palette. Assignment is deterministic
// (hash of the category name) so the same category always gets the same color across renders/sessions.
const PALETTE = [
  "#34d399", // emerald (site accent)
  "#60a5fa", // blue
  "#fbbf24", // amber
  "#f472b6", // pink
  "#a78bfa", // violet
  "#fb923c", // orange
  "#2dd4bf", // teal
  "#f87171", // red
  "#818cf8", // indigo
  "#a3e635", // lime
  "#94a3b8", // slate — reserved for "Diğer"
];

export function categoryColor(category: string): string {
  if (category === "Diğer") return PALETTE[PALETTE.length - 1];
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  return PALETTE[hash % (PALETTE.length - 1)];
}
