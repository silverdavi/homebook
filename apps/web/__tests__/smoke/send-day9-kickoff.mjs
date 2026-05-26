#!/usr/bin/env node
/**
 * Day 9 (Tue May 26 2026) — Week 3 begins. Memorial Day pushed the
 * start to Tuesday. Concise per .cursor/rules/email-style.mdc.
 *
 *   node __tests__/smoke/send-day9-kickoff.mjs            # dry-run
 *   node __tests__/smoke/send-day9-kickoff.mjs --send     # dispatch
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

const SUBJECT = "Week 3 — shorter day, more focus. Multiplication, valence, peace.";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

Week 3. Four days: Tue, Wed, Thu, Fri.

New schedule: 9:30-12:30, with two 20-minute breaks. One hour
shorter than before. We're shortening it because we want focused
time, not endurance — schools burn eight hours covering what an
hour does because the kids are scattered. Don't waste it. The
deal is the same: no phone, no PC outside the window.

The whole week, in one paragraph:

  Math: memorize times tables to 15×15, plus one mental trick —
  17 × 25 = (10+7)(20+5) = 200 + 50 + 140 + 35 = 425. We'll build
  to that by Thursday.

  Science: same 18 elements, new angle. Valence = electrons in the
  outer shell. It's what determines who bonds with whom. Sodium (1)
  gives an electron to chlorine (7) → salt. That kind of thing.

  History: peace, not war. Twelve treaties. Some held for centuries
  (Westphalia, 1648). Some made the next war worse (Versailles →
  WWII). Some sidelined the people whose lives were at stake (Oslo,
  Abraham Accords). The lesson: signing paper is not the same as
  making peace.

Today (Day 9): times tables 2-9, one warmup of the breakdown trick
(12 × 6), valence rows 1-2, the three early accords. 20 questions.

  https://teacher.ninja/daily/2026-05-26

The point of week 3 is that you remember more and need notes less.
That's the real measure.

— Dad

(CC: Mom, Enny)
`;

const HTML = `<!doctype html>
<html>
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:24px 28px;">
      <p style="margin:0 0 14px 0;">Yerachmiel —</p>

      <p style="margin:0 0 14px 0;">
        Week 3. Four days: Tue, Wed, Thu, Fri.
      </p>

      <p style="margin:0 0 14px 0;">
        New schedule: <strong>9:30–12:30, with two 20-minute breaks.</strong>
        One hour shorter than before. We're shortening it because we
        want focused time, not endurance — schools burn eight hours
        covering what an hour does because the kids are scattered.
        Don't waste it. The deal is the same: no phone, no PC outside
        the window.
      </p>

      <p style="margin:0 0 6px 0;"><strong>The whole week, in one paragraph each:</strong></p>

      <p style="margin:0 0 12px 0;">
        <strong>Math.</strong> Memorize times tables to 15 × 15, plus
        one mental trick — <code style="background:#f1f5f9;padding:1px 6px;border-radius:4px;">17 × 25 = (10+7)(20+5) = 200 + 50 + 140 + 35 = 425</code>.
        We build to that by Thursday.
      </p>

      <p style="margin:0 0 12px 0;">
        <strong>Science.</strong> Same 18 elements, new angle.
        Valence = electrons in the outer shell. It's what determines
        who bonds with whom. Sodium (1) gives an electron to chlorine
        (7) → salt. That kind of thing.
      </p>

      <p style="margin:0 0 14px 0;">
        <strong>History.</strong> Peace, not war. Twelve treaties.
        Some held for centuries (Westphalia, 1648). Some made the
        next war worse (Versailles → WWII). Some sidelined the people
        whose lives were at stake (Oslo, Abraham Accords). The
        lesson: signing paper is not the same as making peace.
      </p>

      <p style="margin:0 0 14px 0;">
        <strong>Today (Day 9):</strong> times tables 2–9, one warmup
        of the breakdown trick (12 × 6), valence rows 1–2, the three
        early accords. <strong>20 questions.</strong>
      </p>

      <p style="margin:18px 0;">
        <a href="https://teacher.ninja/daily/2026-05-26" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">
          teacher.ninja/daily/2026-05-26 →
        </a>
      </p>

      <p style="margin:0 0 14px 0;">
        The point of week 3 is that you remember more and need notes
        less. That's the real measure.
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
