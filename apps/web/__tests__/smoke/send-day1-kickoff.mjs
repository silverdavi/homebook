#!/usr/bin/env node
/**
 * One-off: send the Day-1-begins email to Yerachmiel, CC'ing Dad.
 *
 *   node __tests__/smoke/send-day1-kickoff.mjs            # dry-run, prints the JSON
 *   node __tests__/smoke/send-day1-kickoff.mjs --send     # actually dispatch
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

const SUBJECT = "Day 1 — your trial starts today";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

Today's the day. The trial starts now and runs Tue – Fri, May 12 – 15.

The deal, in case you forgot:

  "I have zero involvement in your home schooling. Only no PC,
   no phone between 9:00 and 13:30, and you pass an automated
   test online every day. You find how to learn and how to make
   it work."

Practical note: the rule is *your* PC and *your* phone. To take
the exam you'll need to use Eli's computer or Daniel's — that's
fine.

Open these in this order:

  1. Read the principles first (5 minutes — short):
     https://teacher.ninja/daily/principles

  2. Then today's brief, study, and exam:
     https://teacher.ninja/daily/2026-05-12

Plan on about 3 – 4 hours of focused work. Submit before 13:30.

If something looks broken (not hard — broken), the red
"Report a problem" button bottom-right on every page goes
straight to my inbox.

Good luck. We're rooting for you, even though we're staying out
of it.

— Dad
`;

const HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Day 1 — your trial starts today</title>
  </head>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.55;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="padding:24px 28px;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#fef3c7,#fed7aa);">
        <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#b45309;font-weight:700;margin-bottom:4px;">
          Independent learner trial · Day 1 of 4
        </div>
        <div style="font-size:22px;font-weight:700;color:#0f172a;">
          Your trial starts today
        </div>
        <div style="font-size:14px;color:#7c2d12;margin-top:4px;">
          Tue – Fri, May 12 – 15, 2026
        </div>
      </div>

      <div style="padding:24px 28px;font-size:15px;color:#0f172a;">
        <p style="margin:0 0 14px 0;">Yerachmiel —</p>

        <p style="margin:0 0 14px 0;">
          Today's the day. The trial starts now.
        </p>

        <p style="margin:0 0 8px 0;color:#475569;">
          The deal, in case you forgot:
        </p>
        <blockquote style="margin:0 0 18px 0;padding:10px 16px;border-left:3px solid #6366f1;background:#eef2ff;color:#1e293b;font-style:italic;">
          "I have <strong>zero involvement</strong> in your home schooling. Only
          <strong>no PC, no phone between 9:00 and 13:30</strong>, and you
          <strong>pass an automated test online every day.</strong>
          You find how to learn and how to make it work."
        </blockquote>

        <p style="margin:0 0 14px 0;">
          <strong>Practical note:</strong> the rule is <em>your</em> PC and
          <em>your</em> phone. To take the exam you'll need to use
          <strong>Eli's computer or Daniel's</strong> — that's fine.
        </p>

        <p style="margin:18px 0 8px 0;">Open these in this order:</p>

        <ol style="margin:0 0 18px 0;padding-left:20px;">
          <li style="margin-bottom:10px;">
            <strong>Read the principles first</strong> (5 minutes — short):<br/>
            <a href="https://teacher.ninja/daily/principles" style="color:#4f46e5;font-weight:600;">teacher.ninja/daily/principles</a>
          </li>
          <li>
            <strong>Then today's brief, study, and the exam:</strong><br/>
            <a href="https://teacher.ninja/daily/2026-05-12" style="color:#4f46e5;font-weight:600;">teacher.ninja/daily/2026-05-12</a>
          </li>
        </ol>

        <p style="margin:0 0 14px 0;">
          Plan on about <strong>3 – 4 hours</strong> of focused work. Submit before <strong>13:30</strong>.
        </p>

        <p style="margin:0 0 14px 0;color:#475569;font-size:14px;">
          If something looks broken (not hard — <em>broken</em>), the red
          "Report a problem" button at the bottom-right of every page goes
          straight to my inbox.
        </p>

        <p style="margin:24px 0 6px 0;">Good luck. We're rooting for you, even though we're staying out of it.</p>
        <p style="margin:0;">— Dad</p>
      </div>

      <div style="padding:14px 28px;background:#f9fafb;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;">
        Sent automatically. Reply to this email to talk to Dad — Mom is CC'd.
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
