#!/usr/bin/env node
/** Day 11 (Thu May 28 2026) kickoff. Scheduled for 12:50 UTC = 8:50 EDT. */

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

const SUBJECT = "Day 11 — 13/14/15 tables, 17 × 25, Oslo era.";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

Day 11. The big mental-math move:

  17 × 25 = (10 + 7) × (20 + 5)
         = 200 + 50 + 140 + 35 = 425

Split both numbers into tens + ones. Four products. One addition.
Every two-digit × two-digit becomes four times-table facts.

Also: 13, 14, 15 times tables (15 × 15 = 225). Valence as bonding
intuition — C makes 4 bonds, O makes 2, N makes 3. History today
is the 1970s-1990s peace process: Camp David, Israel-Egypt, Oslo,
Good Friday. Oslo is the one that failed Palestinians; we say so
in the brief.

20 questions. 9:30-12:30 NY time.

  https://teacher.ninja/daily/2026-05-28

— Dad

(CC: Mom, Enny)
`;

const HTML = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
<div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:24px 28px;">
<p style="margin:0 0 14px 0;">Yerachmiel —</p>
<p style="margin:0 0 14px 0;">Day 11. The big mental-math move:</p>
<pre style="margin:0 0 14px 0;padding:12px 16px;background:#f1f5f9;border-radius:8px;font-size:14px;line-height:1.5;overflow-x:auto;">17 × 25 = (10 + 7) × (20 + 5)
       = 200 + 50 + 140 + 35 = 425</pre>
<p style="margin:0 0 14px 0;">Split both numbers into tens + ones. Four products. One addition. Every two-digit × two-digit becomes four times-table facts.</p>
<p style="margin:0 0 14px 0;">Also: <strong>13, 14, 15</strong> times tables (15 × 15 = 225). Valence as bonding intuition — C makes 4 bonds, O makes 2, N makes 3. History today is the 1970s–1990s peace process: Camp David, Israel-Egypt, Oslo, Good Friday. Oslo is the one that failed Palestinians; we say so in the brief.</p>
<p style="margin:0 0 14px 0;">20 questions. 9:30–12:30 NY time.</p>
<p style="margin:18px 0;"><a href="https://teacher.ninja/daily/2026-05-28" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">teacher.ninja/daily/2026-05-28 →</a></p>
<p style="margin:0 0 6px 0;">— Dad</p>
<p style="margin:0;color:#94a3b8;font-size:12px;">CC: Mom, Enny</p>
</div></body></html>`;

const args = new Set(process.argv.slice(2));
const send = args.has("--send");
const body = { from: FROM, to: TO, cc: CC, reply_to: REPLY_TO, subject: SUBJECT, html: HTML, text: TEXT };
if (!send) { console.log("Dry run.\n"); console.log(JSON.stringify({...body, html: `[${HTML.length} chars]`}, null, 2)); process.exit(0); }
const key = getEnv("RESEND_API_KEY");
if (!key) { console.error("no key"); process.exit(2); }
const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify(body) });
const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = null; }
if (!res.ok) { console.error("rejected", res.status, text); process.exit(1); }
console.log("✅ Sent.", json?.id, SUBJECT);
