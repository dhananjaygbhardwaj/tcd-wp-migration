import { TABLES } from "./tables.js";

export async function getAuthor(db, authorId) {
  const [rows] = await db.query(
    `
    SELECT user_nicename
    FROM ${TABLES.users}
    WHERE ID = ?
    LIMIT 1
    `,
    [authorId]
  );

  if (!rows.length) {
    return null;
  }

  // This is the AUTHOR SLUG (e.g. "dhananjay")
  return rows[0].user_nicename;
}
