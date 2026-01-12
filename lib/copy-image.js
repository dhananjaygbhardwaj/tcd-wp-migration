import fs from "fs-extra";
import path from "path";

export async function copyFeaturedImage({
  wpUploadsDir,
  relativePath,
  postSlug,
  postType = "posts", // allow reuse for pages later
}) {
  const src = path.join(wpUploadsDir, relativePath);

  if (!(await fs.pathExists(src))) {
    return null;
  }

  const filename = path.basename(relativePath);

  const contentDir = path.join(
    "src/content",
    postType,
    postSlug,
    "images"
  );

  await fs.ensureDir(contentDir);

  await fs.copy(src, path.join(contentDir, filename));

  // IMPORTANT:
  // Return RELATIVE path for Astro content collections
  return `./images/${filename}`;
}
