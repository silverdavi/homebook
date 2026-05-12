/**
 * Daily — env loader (server-only).
 *
 * Reads sensitive keys with the following precedence:
 *   1. process.env (if set, e.g. by the deploy environment).
 *   2. <repo-root>/.env (parsed as KEY=VALUE lines, supports quoted values).
 *   3. <repo-root>/resend.txt (a single-line KEY=VALUE file).
 *
 * The fallback parsing exists so this works for the local repo layout where
 * keys live at the workspace root rather than apps/web/. In production,
 * always set process.env directly.
 */

import "server-only";
import fs from "fs";
import path from "path";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");

let cache: Record<string, string> | null = null;

function parseEnvFile(filepath: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(filepath)) return out;
  const text = fs.readFileSync(filepath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

function loadFallbackEnv(): Record<string, string> {
  if (cache) return cache;
  cache = {
    ...parseEnvFile(path.join(REPO_ROOT, ".env")),
    ...parseEnvFile(path.join(REPO_ROOT, "resend.txt")),
  };
  return cache;
}

/** Read a key, preferring real process.env over the fallback files. */
export function getEnv(key: string): string | null {
  const live = process.env[key];
  if (live && live.length > 0) return live;
  const fb = loadFallbackEnv();
  return fb[key] ?? null;
}

export function requireEnv(key: string): string {
  const v = getEnv(key);
  if (!v) throw new Error(`missing required env var ${key}`);
  return v;
}
