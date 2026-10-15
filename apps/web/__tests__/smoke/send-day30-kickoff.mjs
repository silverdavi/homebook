#!/usr/bin/env node
/** Day 30 (Thu Oct 15 2026). Estimate, then check. Dry-run unless --send. */

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

const SUBJECT = "Day 30 — start at 10:10.";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

Today's page is ready. Start at 10:10.

The full plan is on the website. The email is only the link.

New tool: estimate first, calculate exactly, then check whether the answer makes sense. Science: mass number is protons plus neutrons.

The Thursday Day 30 sheet is on the desk. Three work blocks. The exam usually takes about 12 minutes; submit when you finish.

Phone away. Computer only for this page and its lesson links. Phone stays away until 1:40.

https://teacher.ninja/daily/2026-10-15

— Dad

(CC: Mom, Enny)
`;

const HTML = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
<div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:24px 28px;">
<p style="margin:0 0 14px 0;">Yerachmiel —</p>
<p style="margin:0 0 14px 0;">Today&apos;s page is ready. <strong>Start at 10:10.</strong></p>
<p style="margin:0 0 14px 0;">The full plan is on the website. The email is only the link.</p>
<p style="margin:0 0 14px 0;">New tool: estimate first, calculate exactly, then check whether the answer makes sense. Science: mass number is protons plus neutrons.</p>
<p style="margin:0 0 14px 0;">The Thursday Day 30 sheet is on the desk. Three work blocks. The exam usually takes about 12 minutes; submit when you finish.</p>
<p style="margin:0 0 14px 0;">Phone away. Computer only for this page and its lesson links. Phone stays away until 1:40.</p>
<p style="margin:18px 0;"><a href="https://teacher.ninja/daily/2026-10-15" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">teacher.ninja/daily/2026-10-15 →</a></p>
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
