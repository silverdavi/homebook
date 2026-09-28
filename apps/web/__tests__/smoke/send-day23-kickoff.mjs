#!/usr/bin/env node
/** Day 23 (Tue Sep 29 2026). No treaties. Dry-run unless --send. */

import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
function getEnv(key) {
  if (process.env[key]) return process.env[key];
  for (const f of [".env", "resend.txt"]) {
    const p = path.join(REPO_ROOT, f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      const k = t.slice(0, eq).trim();
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (k === key && v) return v;
    }
  }
  return null;
}

const SUBJECT = "Day 23 — four wars, no treaties.";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

No treaties today. Not one.

Four wars you have not been drilled on. Learn the story, then the year:

  Mexican-American War — 1846. The fight over the southwest.
  Spanish-American War — 1898. Short war with Spain.
  Gulf War — 1990. Iraq invaded Kuwait.
  Iraq War — 2003. A different war. Do not swap it with 1990.

Same clock: 2 hours 30 minutes of work, a 20-minute break after every 40. Exam 12:30–1:00. Phones off until 1:30.

  https://teacher.ninja/daily/2026-09-29

The bar mitzvah reading is still 20 minutes on its own, not inside this block: https://thesilvers.app/bar-mitzvah

— Dad

(CC: Mom, Enny)
`;

const HTML = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
<div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:24px 28px;">
<p style="margin:0 0 14px 0;">Yerachmiel —</p>
<p style="margin:0 0 14px 0;">No treaties today. Not one.</p>
<p style="margin:0 0 14px 0;">Four wars you have not been drilled on. Mexican-American <strong>1846</strong>. Spanish-American <strong>1898</strong>. Gulf War <strong>1990</strong> (Iraq invaded Kuwait). Iraq War <strong>2003</strong> — a different war, do not swap it with 1990.</p>
<p style="margin:0 0 14px 0;">Same clock: <strong>2 hours 30 minutes</strong> of work, a 20-minute break after every 40. Exam 12:30–1:00. Phones off until 1:30.</p>
<p style="margin:18px 0;"><a href="https://teacher.ninja/daily/2026-09-29" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">teacher.ninja/daily/2026-09-29 →</a></p>
<p style="margin:0 0 14px 0;">The bar mitzvah reading is still 20 minutes on its own, not inside this block. <a href="https://thesilvers.app/bar-mitzvah" style="color:#4f46e5;font-weight:600;text-decoration:none;">thesilvers.app/bar-mitzvah</a></p>
<p style="margin:0 0 6px 0;">— Dad</p>
<p style="margin:0;color:#94a3b8;font-size:12px;">CC: Mom, Enny</p>
</div></body></html>`;

const args = new Set(process.argv.slice(2));
const send = args.has("--send");
const body = { from: FROM, to: TO, cc: CC, reply_to: REPLY_TO, subject: SUBJECT, html: HTML, text: TEXT };
if (!send) { console.log("Dry run.\n"); console.log(JSON.stringify({ ...body, html: `[${HTML.length} chars]` }, null, 2)); process.exit(0); }
const key = getEnv("RESEND_API_KEY");
if (!key) { console.error("no key"); process.exit(2); }
const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify(body) });
const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = null; }
if (!res.ok) { console.error("rejected", res.status, text); process.exit(1); }
console.log("Sent.", json?.id, SUBJECT);
