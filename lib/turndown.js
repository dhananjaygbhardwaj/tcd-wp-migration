import TurndownService from "turndown";

export const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "_",
});

/**
 * KEEP intentional HTML blocks.
 *
 * These elements are:
 * - Authored intentionally
 * - Semantically meaningful
 * - Not representable in pure Markdown
 *
 * Everything else must be converted to Markdown.
 */
turndown.keep([
  "aside",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
]);

/**
 * Defensive keep:
 * Ensures Turndown never strips intentional block-level HTML.
 */
turndown.keep((node) => {
  return (
    node.nodeName === "ASIDE" ||
    node.nodeName === "TABLE"
  );
});
