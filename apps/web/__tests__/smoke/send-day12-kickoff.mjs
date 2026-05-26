#!/usr/bin/env node
/** Day 12 (Fri May 29 2026) — last day. Scheduled for 12:50 UTC = 8:50 EDT. */

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

const SUBJECT = "Day 12 — last day. Mental-math fluency + Abraham Accords.";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

Day 12. Last day of the trial.

No new technique today — fluency drill on everything from this
week. Times tables to 15 × 15. (a+b)(c+d) breakdown for two-digit
× two-digit. Valence across all three rows. GCF / LCM / fractions
as keep-alive.

History today: Abraham Accords (2020), plus a review pull across
the twelve. The week's through-line is "who's at the table" —
Versailles failed because the losers had no stake, Oslo failed
because Palestinians were promised statehood and got more
occupation, Abraham Accords skipped the Palestinian question
entirely. The lesson is structural, not partisan.

20 questions. 9:30-12:30 NY time.

  https://teacher.ninja/daily/2026-05-29

Three weeks. Twelve days. You went from not knowing GCF to
mental-math on 17 × 25 and a working theory of why some peace
deals work and others don't. That is a lot.

— Dad

(CC: Mom, Enny)
`;

const HTML = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
<div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:24px 28px;">
<p style="margin:0 0 14px 0;">Yerachmiel —</p>
<p style="margin:0 0 14px 0;">Day 12. Last day of the trial.</p>
<p style="margin:0 0 14px 0;">No new technique today — fluency drill on everything from this week. Times tables to 15 × 15. (a+b)(c+d) breakdown for two-digit × two-digit. Valence across all three rows. GCF / LCM / fractions as keep-alive.</p>
<p style="margin:0 0 14px 0;">History today: Abraham Accords (2020), plus a review pull across the twelve. The week's through-line is <em>who's at the table</em> — Versailles failed because the losers had no stake, Oslo failed because Palestinians were promised statehood and got more occupation, Abraham Accords skipped the Palestinian question entirely. The lesson is structural, not partisan.</p>
<p style="margin:0 0 14px 0;">20 questions. 9:30–12:30 NY time.</p>
<p style="margin:18px 0;"><a href="https://teacher.ninja/daily/2026-05-29" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">teacher.ninja/daily/2026-05-29 →</a></p>
<p style="margin:0 0 14px 0;">Three weeks. Twelve days. You went from not knowing GCF to mental-math on 17 × 25 and a working theory of why some peace deals work and others don't. That is a lot.</p>
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
