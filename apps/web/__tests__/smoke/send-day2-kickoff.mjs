#!/usr/bin/env node
/**
 * One-off: send the Day-2-begins email to Yerachmiel, CC'ing Dad and Eni.
 *
 *   node __tests__/smoke/send-day2-kickoff.mjs            # dry-run
 *   node __tests__/smoke/send-day2-kickoff.mjs --send     # actually dispatch
 *
 * Reads RESEND_API_KEY from process.env, falling back to <repo-root>/resend.txt
 * (same convention as lib/daily/env.ts).
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
      ) {
        v = v.slice(1, -1);
      }
      if (k === key && v) return v;
    }
  }
  return null;
}

const SUBJECT = "Day 2 — yesterday was 10/18, here's today";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

Day 1 result: 10 / 18 in 14 minutes. Notes were excellent — even
the questions you got wrong showed your reasoning, and that's what
we wanted.

Today's brief opens with a real review of yesterday — what worked,
what didn't, and how today's exam reflects it. Read it before you
start studying. The short version:

  • GCF (4/8). Your concept is fine; your factor lists broke. On
    (14, 35) you wrote "1, 3, 5, 10, 15, 20, 25, 30, 35" for 35 —
    those are multiples of 5, not factors of 35. You missed 7. Today
    the GCF refresh repeats those exact problem types. Try Euclid's
    algorithm — it doesn't care about your factor lists.

  • Wars 1-4 (0/3). You wrote "I don't really remember these" and
    moved on. Today you're responsible for wars 1-8. One of today's
    three war questions is from yesterday's set.

  • Periodic (4/4) and Evolution (2/3). Solid. The one evolution
    miss looked like end-of-exam rush — you wrote "3700" in the
    note, but the answer field was blank. Two fields, two purposes.

Today, version A and version B both stay open — single-attempt
per version, but you can take both if you want, on the same day.

Same deal: 9:00 – 13:30, no phone, no PC outside this window.
Eli's computer or Daniel's, like yesterday.

  Today's brief, study, and exam:
  https://teacher.ninja/daily/2026-05-13

Plan on about 3 – 4 hours. Submit before 13:30.

— Dad

(CC: Mom, Eni)
`;

const HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Day 2 — yesterday was 10/18, here's today</title>
  </head>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.55;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="padding:24px 28px;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#dbeafe,#c7d2fe);">
        <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#3730a3;font-weight:700;margin-bottom:4px;">
          Independent learner trial · Day 2 of 4
        </div>
        <div style="font-size:22px;font-weight:700;color:#0f172a;">
          Yesterday: 10 / 18 in 14 minutes
        </div>
        <div style="font-size:14px;color:#3730a3;margin-top:4px;">
          Wednesday, May 13, 2026
        </div>
      </div>

      <div style="padding:24px 28px;font-size:15px;color:#0f172a;">
        <p style="margin:0 0 14px 0;">Yerachmiel —</p>

        <p style="margin:0 0 14px 0;">
          Notes were excellent — even the questions you got wrong showed
          your reasoning, and that's what we wanted.
        </p>

        <p style="margin:0 0 8px 0;color:#475569;">
          Today's brief opens with a real review of yesterday — what
          worked, what didn't, and how today's exam reflects it. Read
          it before you start studying. The short version:
        </p>

        <ul style="margin:0 0 18px 0;padding-left:20px;">
          <li style="margin-bottom:12px;">
            <strong>GCF — 4 / 8.</strong> Your concept is fine; your
            <em>factor lists</em> broke. On (14, 35) you wrote
            <code style="background:#f1f5f9;padding:1px 5px;border-radius:3px;font-size:13px;">1, 3, 5, 10, 15, 20, 25, 30, 35</code>
            for 35 — those are <em>multiples</em> of 5, not <em>factors</em>
            of 35. You missed 7. Today's GCF refresh repeats those exact
            problem types. Try <strong>Euclid's algorithm</strong> — it
            doesn't care about your factor lists.
          </li>
          <li style="margin-bottom:12px;">
            <strong>Wars 1-4 — 0 / 3.</strong> You wrote "I don't really
            remember these" and moved on. Today you're responsible for
            <strong>wars 1-8</strong>. One of today's three war questions
            is from yesterday's set.
          </li>
          <li style="margin-bottom:0;">
            <strong>Periodic — 4 / 4. Evolution — 2 / 3.</strong> Solid.
            The one evolution miss looked like end-of-exam rush — you
            wrote <code style="background:#f1f5f9;padding:1px 5px;border-radius:3px;font-size:13px;">3700</code>
            in the <strong>note</strong>, but the <strong>answer</strong>
            field was blank. Two fields, two purposes.
          </li>
        </ul>

        <p style="margin:0 0 14px 0;padding:10px 14px;background:#ecfdf5;border-left:3px solid #10b981;color:#065f46;font-size:14px;">
          <strong>New today:</strong> version A <em>and</em> version B
          both stay open. Single-attempt per version, but you can take
          both today if you want — totally optional.
        </p>

        <p style="margin:0 0 14px 0;">
          Same deal: 9:00 – 13:30, no phone, no PC outside this window.
          Eli's computer or Daniel's, like yesterday.
        </p>

        <div style="margin:18px 0;padding:14px 18px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#4338ca;font-weight:700;margin-bottom:6px;">
            Today's brief, study, and exam
          </div>
          <a href="https://teacher.ninja/daily/2026-05-13" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">
            teacher.ninja/daily/2026-05-13 →
          </a>
        </div>

        <p style="margin:0 0 14px 0;">
          Plan on about <strong>3 – 4 hours</strong>. Submit before <strong>13:30</strong>.
        </p>

        <p style="margin:0 0 6px 0;">— Dad</p>
        <p style="margin:0;color:#94a3b8;font-size:12px;">CC: Mom, Eni</p>
      </div>

      <div style="padding:14px 28px;background:#f9fafb;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;">
        Sent automatically. Reply to this email to talk to Dad.
      </div>
    </div>
  </body>
</html>`;

const args = new Set(process.argv.slice(2));
const send = args.has("--send");

const body = {
  from: FROM,
  to: TO,
  cc: CC,
  reply_to: REPLY_TO,
  subject: SUBJECT,
  html: HTML,
  text: TEXT,
};

if (!send) {
  console.log("Dry run. Pass --send to actually dispatch.\n");
  console.log(JSON.stringify({ ...body, html: `[${HTML.length} chars]` }, null, 2));
  process.exit(0);
}

const key = getEnv("RESEND_API_KEY");
if (!key) {
  console.error("RESEND_API_KEY not set (and no resend.txt fallback found).");
  process.exit(2);
}

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  },
  body: JSON.stringify(body),
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  json = null;
}

if (!res.ok) {
  console.error(`Resend rejected the message (HTTP ${res.status}):`);
  console.error(text);
  process.exit(1);
}

console.log("✅ Sent.");
console.log(`  message id : ${json?.id ?? "(unknown)"}`);
console.log(`  to         : ${TO.join(", ")}`);
console.log(`  cc         : ${CC.join(", ")}`);
console.log(`  subject    : ${SUBJECT}`);
