import fs from "fs-extra";
import path from "path";
import { db } from "./lib/db.js";
import { getPublishedContent } from "./lib/query.js";
import { turndown } from "./lib/turndown.js";
import { getTaxonomies } from "./lib/taxonomies.js";
import { getAuthor } from "./lib/authors.js";
import { normalizeExcerpt } from "./lib/excerpt.js";
import { getFeaturedImage } from "./lib/featured-image.js";
import { copyFeaturedImage } from "./lib/copy-image.js";
import { unwrapLinkedImages } from "./lib/unwrap-linked-images.js";
import { processInlineImages } from "./lib/inline-images.js";
import { normalizeShortcodes } from "./lib/shortcodes.js";

const POSTS_DIR = "src/content/posts";
const PAGES_DIR = "src/content/pages";
const WP_UPLOADS_DIR =
  "/home/dhananjay/Projects/tcd-migration-workspace/wp-content/uploads";

/**
 * ----------------------------------------
 * TAG REGISTRY GENERATOR (ONE-TIME)
 * ----------------------------------------
 */
async function generateTagRegistry(db) {
  const [rows] = await db.query(`
    SELECT DISTINCT
      t.slug,
      t.name
    FROM wplx_terms t
    INNER JOIN wplx_term_taxonomy tt
      ON t.term_id = tt.term_id
    WHERE tt.taxonomy = 'post_tag'
    ORDER BY t.slug ASC
  `);

  if (!rows.length) {
    console.warn("⚠ No tags found. Skipping tag registry generation.");
    return;
  }

  const lines = [];

  lines.push(`/**
 * Tag registry
 *
 * - slug: URL identifier (matches WP exactly)
 * - name: Display label
 *
 * NOTE:
 * - Generated during migration
 * - Maintained manually after go-live
 */
`);
  lines.push(`export const TAGS = {`);

  for (const tag of rows) {
    lines.push(
      `  "${tag.slug}": { slug: "${tag.slug}", name: ${JSON.stringify(
        tag.name
      )} },`
    );
  }

  lines.push(`} as const;\n`);
  lines.push(`export type TagSlug = keyof typeof TAGS;\n`);

  const outputPath = "src/data/tags.ts";
  await fs.ensureDir("src/data");
  await fs.writeFile(outputPath, lines.join("\n"));

  console.log(`✓ Tag registry generated (${rows.length} tags)`);
}

/**
 * ----------------------------------------
 * HELPERS
 * ----------------------------------------
 */
function yamlString(value) {
  if (value === undefined || value === null) return undefined;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function iso(date) {
  return new Date(date).toISOString();
}

function frontmatter(data) {
  return `---
title: ${yamlString(data.title)}
${data.description ? `description: ${yamlString(data.description)}` : ""}
${data.coverImage ? `coverImage: ${yamlString(data.coverImage)}` : ""}
date: ${yamlString(data.date)}
lastModified: ${yamlString(data.lastModified)}
${data.author ? `author: ${yamlString(data.author)}` : ""}
${
  data.categories?.length
    ? `categories:\n${data.categories
        .map((c) => `  - ${yamlString(c)}`)
        .join("\n")}`
    : ""
}
${
  data.tags?.length
    ? `tags:\n${data.tags.map((t) => `  - ${yamlString(t)}`).join("\n")}`
    : ""
}
---
`;
}

/**
 * ----------------------------------------
 * MAIN EXPORT
 * ----------------------------------------
 */
async function run() {
  // ✅ 0. Generate tag registry ONCE
  await generateTagRegistry(db);

  const rows = await getPublishedContent(db);

  for (const row of rows) {
    // 1. Resolve output directory
    const base =
      row.post_type === "post" ? POSTS_DIR : PAGES_DIR;

    const dir = path.join(base, row.post_name);
    await fs.ensureDir(dir);

    // 2. FETCH TAXONOMIES
    let categories = [];
    let tags = [];

    if (row.post_type === "post") {
      const tax = await getTaxonomies(db, row.ID);
      categories = tax.categories;
      tags = tax.tags;
    }

    // 3. FETCH AUTHOR (POSTS ONLY)
    let authorSlug = null;

    if (row.post_type === "post") {
      authorSlug = await getAuthor(db, row.post_author);
    }

    if (row.post_type === "post" && !authorSlug) {
      throw new Error(`Missing author for post ID ${row.ID}`);
    }

    // 4. RESOLVE DESCRIPTION (POSTS ONLY)
    let description = null;

    if (row.post_type === "post" && row.post_excerpt) {
      description = normalizeExcerpt(row.post_excerpt);
    }

    // 5. RESOLVE FEATURED IMAGE (POSTS ONLY)
    let coverImage = null;

    if (row.post_type === "post") {
      const featured = await getFeaturedImage(db, row.ID);

      if (featured) {
        coverImage = await copyFeaturedImage({
          wpUploadsDir: WP_UPLOADS_DIR,
          relativePath: featured.relativePath,
          postSlug: row.post_name,
          postType: "posts",
        });
      }
    }

    if (row.post_type === "post" && !coverImage) {
      console.warn(
        `⚠ Post ${row.post_name} has no featured image`
      );
    }

	// 6. NORMALIZE + CONVERT CONTENT
	let html = row.post_content;

	// Normalize WP shortcode
	html = normalizeShortcodes(html);

	html = unwrapLinkedImages(html);

    if (row.post_type === "post") {
      html = await processInlineImages({
        html,
        wpUploadsDir: WP_UPLOADS_DIR,
        postSlug: row.post_name,
        postType: "posts",
      });
    }

    const markdown = turndown.turndown(html);

    // 7. BUILD FRONTMATTER
    const fm = frontmatter({
      title: row.post_title,
      description,
      coverImage,
      date: iso(row.post_date_gmt),
      lastModified: iso(row.post_modified_gmt),
      author: authorSlug,
      categories,
      tags,
    });

    // 8. WRITE FILE
    await fs.writeFile(
      path.join(dir, "index.md"),
      fm + "\n" + markdown
    );

    console.log(`✓ ${row.post_type}: ${row.post_name}`);
  }

  process.exit(0);
}

run();
