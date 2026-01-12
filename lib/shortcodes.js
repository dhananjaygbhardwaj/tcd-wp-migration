export function normalizeShortcodes(html) {
  return html.replace(
    /\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/gi,
    (_, inner) => {
      const imgMatch = inner.match(
        /(<a[\s\S]*?>\s*)?(<img[\s\S]*?>)(\s*<\/a>)?/i
      );

      return imgMatch ? imgMatch[2] : "";
    }
  );
}
