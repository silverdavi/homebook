/**
 * Daily — markdown loader (server-only)
 *
 * The canonical markdown source lives at `<repo>/content/daily/`. The
 * Next.js app runs with cwd = apps/web, so we resolve up two levels.
 * Falls back to `apps/web/content/daily/` if a copy exists there (used
 * if we ever publish the files closer to the app).
 */

import fs from "fs";
import path from "path";

const REPO_ROOT_CONTENT = path.resolve(process.cwd(), "..", "..", "content", "daily");
const APP_CONTENT = path.resolve(process.cwd(), "content", "daily");

function locate(relPath: string): string {
  const a = path.join(REPO_ROOT_CONTENT, relPath);
  if (fs.existsSync(a)) return a;
  const b = path.join(APP_CONTENT, relPath);
  if (fs.existsSync(b)) return b;
  throw new Error(
    `daily content not found: ${relPath} (looked in ${REPO_ROOT_CONTENT} and ${APP_CONTENT})`,
  );
}

export function loadMarkdown(relPath: string): string {
  return fs.readFileSync(locate(relPath), "utf8");
}
