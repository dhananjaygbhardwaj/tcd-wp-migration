import fs from "fs-extra";
import path from "path";

export async function processInlineImages({
  html,
  wpUploadsDir,
  postSlug,
  postType = "posts",
}) {
  if (!html.includes("<img")) {
    return html;
  }

  const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let output = html;
  let match;

  while ((match = imgTagRegex.exec(html)) !== null) {
    const originalSrc = match[1];

    if (!originalSrc.includes("/wp-content/uploads/")) {
      continue;
    }

    const uploadsIndex = originalSrc.indexOf("/wp-content/uploads/");
    const relativePath = originalSrc.substring(
      uploadsIndex + "/wp-content/uploads/".length
    );

    const srcFile = path.join(wpUploadsDir, relativePath);

    if (!(await fs.pathExists(srcFile))) {
      console.warn(`⚠ Inline image not found: ${srcFile}`);
      continue;
    }

    const filename = path.basename(relativePath);

    const contentDir = path.join(
      "src/content",
      postType,
      postSlug,
      "images"
    );

    await fs.ensureDir(contentDir);
    await fs.copy(srcFile, path.join(contentDir, filename));

    // IMPORTANT: relative path rewrite
    const newSrc = `./images/${filename}`;

    output = output.replace(originalSrc, newSrc);
  }

  return output;
}
