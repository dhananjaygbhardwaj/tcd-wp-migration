import { TABLES } from "./tables.js";

export async function getTaxonomies(db, postId) {
  const [rows] = await db.query(`
    SELECT
      t.slug,
      tt.taxonomy
    FROM ${TABLES.terms} t
    INNER JOIN ${TABLES.termTaxonomy} tt
      ON t.term_id = tt.term_id
    INNER JOIN ${TABLES.termRelationships} tr
      ON tr.term_taxonomy_id = tt.term_taxonomy_id
    WHERE tr.object_id = ?
      AND tt.taxonomy IN ('category', 'post_tag')
  `, [postId]);

  const categories = [];
  const tags = [];

  for (const row of rows) {
    if (row.taxonomy === "category") {
      categories.push(row.slug);
    } else if (row.taxonomy === "post_tag") {
      tags.push(row.slug);
    }
  }

  return { categories, tags };
}
