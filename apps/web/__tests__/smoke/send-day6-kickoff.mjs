#!/usr/bin/env node
/**
 * Day 6 (Tue May 19) kickoff. Concise, per .cursor/rules/email-style.mdc.
 *
 *   node __tests__/smoke/send-day6-kickoff.mjs            # dry-run
 *   node __tests__/smoke/send-day6-kickoff.mjs --send     # dispatch
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

const SUBJECT = "Day 6 — fraction subtraction. Same rule, new symbol.";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

Day 5: 21/22 on B (after the bug credit), 20/22 on A. Strong.

Today is Day 6. New thing: fraction subtraction. Exact same
three-step rule as addition; the only thing that changes is one
symbol. The brief shows it in five lines.

Same shape: 22 questions, 9:00-12:30 NY time, no phone, no PC
outside that window. Eli's or Daniel's computer.

Warm-up before you start: 10-15 subtractions on /fractions plus 5
LCM problems on paper. That practice is what moved fraction-add
from 0/4 to 4/6 last week.

  https://teacher.ninja/daily/2026-05-19

If the inputs do anything weird again, hit "Report a problem". The
fix should hold, but please poke at it on purpose at least once.

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
        Day 5: <strong>21/22</strong> on B (after the bug credit),
        <strong>20/22</strong> on A. Strong.
      </p>

      <p style="margin:0 0 14px 0;">
        Today is Day 6. New thing: <strong>fraction subtraction</strong>.
        Exact same three-step rule as addition; the only thing that
        changes is one symbol. The brief shows it in five lines.
      </p>

      <p style="margin:0 0 14px 0;">
        Same shape: 22 questions, 9:00-12:30 NY time, no phone, no PC
        outside that window. Eli's or Daniel's computer.
      </p>

      <p style="margin:0 0 14px 0;">
        Warm-up before you start: 10-15 subtractions on
        <a href="https://teacher.ninja/fractions" style="color:#4f46e5;">/fractions</a>
        plus 5 LCM problems on paper. That practice is what moved
        fraction-add from 0/4 to 4/6 last week.
      </p>

      <p style="margin:18px 0;">
        <a href="https://teacher.ninja/daily/2026-05-19" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">
          teacher.ninja/daily/2026-05-19 →
        </a>
      </p>

      <p style="margin:0 0 14px 0;">
        If the inputs do anything weird again, hit
        <em>Report a problem</em>. The fix should hold, but please
        poke at it on purpose at least once.
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
