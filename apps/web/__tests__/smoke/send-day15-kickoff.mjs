#!/usr/bin/env node
/** Day 15 (Thu Jun 4 2026) — review lap 3. Scheduled for 12:50 UTC = 8:50 EDT. */

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

const SUBJECT = "Day 15 — review lap 3. Division + valence rows 1-3.";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

Lap 3. Division comes back: flip the second fraction, then multiply.

Valence spans all three rows today — H is 1, C is 4, P is 5. If you can
do those without looking at the table, valence is solved.

History is held-vs-failed: Westphalia and Paris held because they
included everyone; Good Friday held because both sides voted for it;
the Abraham Accords left the Palestinians out. The pattern is the point.

You said B was basically A with two numbers swapped, so why bother. Fair.
From today A and B share nothing — different numbers, different elements,
different treaties. B is the harder set: bigger multiplications and
tougher fractions. Do A, then take B if you want the real test.

22 questions. Study 9:30-12:00 NY time, two 20-minute breaks. Phones off
the whole block, 9:30 to 1:00 — the last hour is yours, no screen.

  https://teacher.ninja/daily/2026-06-04

— Dad

(CC: Mom, Enny)
`;

const HTML = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
<div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:24px 28px;">
<p style="margin:0 0 14px 0;">Yerachmiel —</p>
<p style="margin:0 0 14px 0;">Lap 3. Division comes back: flip the second fraction, then multiply.</p>
<p style="margin:0 0 14px 0;">Valence spans all three rows today — H is 1, C is 4, P is 5. If you can do those without looking at the table, valence is solved.</p>
<p style="margin:0 0 14px 0;">History is held-vs-failed: Westphalia and Paris held because they included everyone; Good Friday held because both sides voted for it; the Abraham Accords left the Palestinians out. The pattern is the point.</p>
<p style="margin:0 0 14px 0;">You said B was basically A with two numbers swapped, so why bother. Fair. From today A and B share nothing — different numbers, different elements, different treaties. B is the harder set: bigger multiplications and tougher fractions. Do A, then take B if you want the real test.</p>
<p style="margin:0 0 14px 0;">22 questions. Study 9:30–12:00 NY time, two 20-minute breaks. Phones off the whole block, 9:30 to 1:00 — the last hour is yours, no screen.</p>
<p style="margin:18px 0;"><a href="https://teacher.ninja/daily/2026-06-04" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">teacher.ninja/daily/2026-06-04 →</a></p>
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
