/**
 * Search over the manifest.json icon catalog that ships with the package.
 * Pure and dependency-free so it can be unit-tested without a generated dist.
 */

/** Score one icon against a single lower-cased term. 0 = no match. */
function scoreTerm(icon, term) {
  const name = icon.name.toLowerCase();
  const component = icon.component.toLowerCase();
  if (name === term || component === term) return 100;
  if (name.split('_').includes(term)) return 50;
  if (name.includes(term) || component.includes(term)) return 30;
  const tags = icon.tags ?? [];
  if (tags.some((t) => t.toLowerCase() === term)) return 25;
  if (tags.some((t) => t.toLowerCase().includes(term))) return 10;
  const categories = icon.categories ?? [];
  if (categories.some((c) => c.toLowerCase().includes(term))) return 5;
  return 0;
}

/**
 * Rank icons against query terms. Every term must match somewhere
 * (name, component, tags or categories) for an icon to qualify.
 */
export function searchIcons(icons, query, limit = 10) {
  const terms = query.map((t) => t.toLowerCase().trim()).filter(Boolean);
  if (terms.length === 0) return [];

  const scored = [];
  for (const icon of icons) {
    let total = 0;
    for (const term of terms) {
      const s = scoreTerm(icon, term);
      if (s === 0) {
        total = 0;
        break;
      }
      total += s;
    }
    if (total > 0) scored.push({ icon, score: total });
  }

  scored.sort(
    (a, b) => b.score - a.score || a.icon.name.localeCompare(b.icon.name)
  );
  return scored.slice(0, limit).map((s) => s.icon);
}
