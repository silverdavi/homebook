#!/usr/bin/env node
/** Day 14 (Wed Jun 3 2026) — review lap 2. Scheduled for 12:50 UTC = 8:50 EDT. */

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

const SUBJECT = "Day 14 — review lap 2. Inverses + valence.";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

Lap 2 of the review week.

Math today brings back the inverse (flip the fraction: 3/7 becomes 7/3),
plus two-digit multiplication breakdowns. Slow down on the last addition
— that's where the points leak.

Valence again: S is 6, Al is 3, Ne is 8. Read the group number. Run the
practice list in the lesson first.

History is the 1970s cluster: Camp David (1978), Israel-Egypt (1979),
Dayton (1995), and Westphalia (1648) as an anchor.

22 questions. 9:30-12:30 NY time.

  https://teacher.ninja/daily/2026-06-03

— Dad

(CC: Mom, Enny)
`;

const HTML = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
<div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:24px 28px;">
<p style="margin:0 0 14px 0;">Yerachmiel —</p>
<p style="margin:0 0 14px 0;">Lap 2 of the review week.</p>
<p style="margin:0 0 14px 0;">Math today brings back the inverse (flip the fraction: 3/7 becomes 7/3), plus two-digit multiplication breakdowns. Slow down on the last addition — that's where the points leak.</p>
<p style="margin:0 0 14px 0;">Valence again: S is 6, Al is 3, Ne is 8. Read the group number. Run the practice list in the lesson first.</p>
<p style="margin:0 0 14px 0;">History is the 1970s cluster: Camp David (1978), Israel-Egypt (1979), Dayton (1995), and Westphalia (1648) as an anchor.</p>
<p style="margin:0 0 14px 0;">22 questions. 9:30–12:30 NY time.</p>
<p style="margin:18px 0;"><a href="https://teacher.ninja/daily/2026-06-03" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">teacher.ninja/daily/2026-06-03 →</a></p>
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
