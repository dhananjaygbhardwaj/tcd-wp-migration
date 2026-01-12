export function normalizeExcerpt(html) {
  if (!html) return null;

  return html
    .replace(/<[^>]*>/g, "")      // strip HTML tags
    .replace(/\s+/g, " ")         // normalize whitespace
    .trim();
}
