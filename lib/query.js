import { TABLES } from "./tables.js";

export async function getPublishedContent(db) {
  const [rows] = await db.query(`
    SELECT
      ID,
      post_title,
      post_name,
      post_content,
	  post_excerpt,
      post_date_gmt,
      post_modified_gmt,
	  post_author,
      post_type
    FROM ${TABLES.posts}
    WHERE post_status = 'publish'
      AND post_type IN ('post', 'page')
  `);

  return rows;
}
