/**
 * Unwrap <a><img></a> patterns and keep only the <img>
 * This removes "link to media file" behavior from WordPress.
 */
export function unwrapLinkedImages(html) {
  return html.replace(
    /<a[^>]*>\s*(<img[^>]+>)\s*<\/a>/gi,
    "$1"
  );
}
