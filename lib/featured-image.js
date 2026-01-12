import { TABLES } from "./tables.js";
import { unserialize } from "php-serialize";

export async function getFeaturedImage(db, postId) {
  // 1. Get attachment ID
  const [[thumb]] = await db.query(
    `
    SELECT meta_value
    FROM ${TABLES.postmeta}
    WHERE post_id = ?
      AND meta_key = '_thumbnail_id'
    LIMIT 1
    `,
    [postId]
  );

  if (!thumb) return null;

  const attachmentId = thumb.meta_value;

  // 2. Get attachment metadata
  const [[meta]] = await db.query(
    `
    SELECT meta_value
    FROM ${TABLES.postmeta}
    WHERE post_id = ?
      AND meta_key = '_wp_attachment_metadata'
    LIMIT 1
    `,
    [attachmentId]
  );

  if (!meta) return null;

  let metadata;
  try {
    metadata = unserialize(meta.meta_value);
  } catch {
    return null;
  }

  if (!metadata) return null;

  // 3. Prefer true original if available
  let relativePath;

  if (metadata.original_image) {
    // Same directory as metadata.file
    const dir = metadata.file.substring(
      0,
      metadata.file.lastIndexOf("/")
    );
    relativePath = `${dir}/${metadata.original_image}`;
  } else if (metadata.file) {
    relativePath = metadata.file;
  } else {
    return null;
  }

  return {
    attachmentId,
    relativePath,
  };
}
