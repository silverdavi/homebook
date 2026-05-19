#!/usr/bin/env node
/**
 * Day 7 (Wed May 20) kickoff. Concise, per .cursor/rules/email-style.mdc.
 * Scheduled to fire at 12:55 UTC = 8:55 AM EDT.
 *
 *   node __tests__/smoke/send-day7-kickoff.mjs            # dry-run
 *   node __tests__/smoke/send-day7-kickoff.mjs --send     # dispatch
 */

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
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      )
        v = v.slice(1, -1);
      if (k === key && v) return v;
    }
  }
  return null;
}

const SUBJECT = "Day 7 — fraction multiplication. No LCM, just multiply.";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

Today is Day 7. New thing: fraction multiplication. Easier than
add/sub — no common denominator, no LCM. Multiply tops, multiply
bottoms, reduce.

Also new on the side: row 3 of the periodic table starts. Na, Mg,
Al, Si. Just count along the row for protons (11, 12, 13, 14).
Electrons match. Neutrons are memorized.

Same shape: 22 questions, 9:00-12:30 NY time, no phone, no PC
outside that window. Eli's or Daniel's computer.

Warm-up: 10 multiplications on /fractions, then drill the four new
elements until you can rattle them off.

  https://teacher.ninja/daily/2026-05-20

— Dad

(CC: Mom, Enny)
`;

const HTML = `<!doctype html>
<html>
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
    <div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:24px 28px;">
      <p style="margin:0 0 14px 0;">Yerachmiel —</p>

      <p style="margin:0 0 14px 0;">
        Today is Day 7. New thing: <strong>fraction multiplication</strong>.
        Easier than add/sub — no common denominator, no LCM. Multiply
        tops, multiply bottoms, reduce.
      </p>

      <p style="margin:0 0 14px 0;">
        Also new on the side: row 3 of the periodic table starts. Na,
        Mg, Al, Si. Just count along the row for protons (11, 12, 13,
        14). Electrons match. Neutrons are memorized.
      </p>

      <p style="margin:0 0 14px 0;">
        Same shape: 22 questions, 9:00-12:30 NY time, no phone, no PC
        outside that window. Eli's or Daniel's computer.
      </p>

      <p style="margin:0 0 14px 0;">
        Warm-up: 10 multiplications on
        <a href="https://teacher.ninja/fractions" style="color:#4f46e5;">/fractions</a>,
        then drill the four new elements until you can rattle them off.
      </p>

      <p style="margin:18px 0;">
        <a href="https://teacher.ninja/daily/2026-05-20" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">
          teacher.ninja/daily/2026-05-20 →
        </a>
      </p>

      <p style="margin:0 0 6px 0;">— Dad</p>
      <p style="margin:0;color:#94a3b8;font-size:12px;">CC: Mom, Enny</p>
    </div>
  </body>
</html>`;

const args = new Set(process.argv.slice(2));
const send = args.has("--send");
const body = { from: FROM, to: TO, cc: CC, reply_to: REPLY_TO, subject: SUBJECT, html: HTML, text: TEXT };

if (!send) {
  console.log("Dry run. Pass --send to dispatch.\n");
  console.log(JSON.stringify({ ...body, html: `[${HTML.length} chars]` }, null, 2));
  process.exit(0);
}

const key = getEnv("RESEND_API_KEY");
if (!key) { console.error("RESEND_API_KEY not set."); process.exit(2); }

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
  body: JSON.stringify(body),
});
const text = await res.text();
let json; try { json = JSON.parse(text); } catch { json = null; }
if (!res.ok) { console.error(`Resend rejected (HTTP ${res.status}):`, text); process.exit(1); }
console.log("✅ Sent.");
console.log(`  message id : ${json?.id ?? "(unknown)"}`);
console.log(`  subject    : ${SUBJECT}`);
