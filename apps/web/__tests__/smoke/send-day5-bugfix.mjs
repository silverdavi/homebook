#!/usr/bin/env node
/**
 * One-off: thank-you + bug-fix announcement to Yerachmiel after his
 * Day 5 v B bug report on b-lcm-1.
 *
 *   node __tests__/smoke/send-day5-bugfix.mjs            # dry-run
 *   node __tests__/smoke/send-day5-bugfix.mjs --send     # actually dispatch
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

const SUBJECT = "You were right — bug fixed, point credited (21 / 22)";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

Thank you for the bug report. You were right, and we owe you a
point.

You wrote:

  "in lcm 6, 4 i did 12 i even remember messing up and doing 21
   and changing it to 12 it SOMEHOW thought i said blank"

That is exactly what happened. We checked the saved record for
b-lcm-1 (the LCM 6, 4 question on version B) and it showed up as
blank — but with your note "note 1..." attached. That combination
is the smoking gun that told us where the bug was.

WHAT THE BUG WAS

Each question on the page has three parts that you can edit:
  1. the answer field
  2. the note field
  3. the "I used the help" tracker

The page was wired up so that whenever you typed in any one of
those, it sent an update that included a snapshot of the OTHER two
fields as it had last seen them. Normally fine. But if you typed
in two of them faster than the page could re-draw between
keystrokes — say, you typed "12" in the answer and immediately
started typing your note — the note's update was carrying an old
snapshot of the answer field (where it was still empty), and so
the note's save accidentally overwrote your "12" with empty.

That's why your record shows {value: blank, note: "note 1..."} —
the note write was the last one to land, and it stomped on top of
your answer with what it thought the answer used to be.

This wasn't your mistake. It was a real bug on our side, and it
had been there since Day 1. You're the first person to catch it.

WHAT WE FIXED

The page now sends ONLY the field that actually changed (just the
answer, or just the note, or just the help-click), and the parent
merges that one field into whatever the latest answer is. There
is no longer a way for the note write to know — let alone
overwrite — what was in the answer field. Each input lives in its
own lane.

We also added an automatic test that reproduces your exact
scenario (saved row with {value: blank, note: "note 1..."}) so
this can never come back without a test failing on us first.

The fix is live as of about ten minutes ago. Subject to your
confirmation tomorrow morning, the page should work the way you
expect: type the answer, type the note, both stick.

YOUR SCORE

We re-credited b-lcm-1. Your Day 5 v B is now 21 / 22 instead of
20 / 22 (your A is still 20 / 22 on its own merit). You can see
it here, refreshed:

  https://teacher.ninja/daily/2026-05-18/results?version=b

ONE FAVOR

When you take Day 6 tomorrow, please try the same thing on
purpose at least once: type an answer, then start typing in the
note before the page settles. If your answer survives, the fix
worked. If it doesn't, leave a bug report exactly like the one
you left today and we'll keep digging.

Your bug report was clear, specific, and gave us the exact
question and what you typed. That is what made finding the
bug take twenty minutes instead of two days. Keep doing that.

— Dad

(CC: Mom, Enny)
`;

const HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>You were right — bug fixed</title>
  </head>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="padding:24px 28px;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#dbeafe,#bfdbfe);">
        <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#1e3a8a;font-weight:700;margin-bottom:4px;">
          Bug report received · Bug fixed · Point credited
        </div>
        <div style="font-size:22px;font-weight:700;color:#0f172a;">
          You were right.
        </div>
        <div style="font-size:14px;color:#1e40af;margin-top:4px;">
          Day 5 v B now 21 / 22 · Mon May 18, 2026
        </div>
      </div>

      <div style="padding:24px 28px;font-size:15px;color:#0f172a;">
        <p style="margin:0 0 14px 0;">Yerachmiel —</p>

        <p style="margin:0 0 14px 0;">
          Thank you for the bug report. You were right, and we owe you
          a point.
        </p>

        <div style="margin:18px 0;padding:14px 18px;background:#f1f5f9;border-left:3px solid #475569;color:#334155;font-size:14px;font-style:italic;">
          "in lcm 6, 4 i did 12 i even remember messing up and doing
          21 and changing it to 12 it SOMEHOW thought i said blank"
        </div>

        <p style="margin:0 0 14px 0;">
          That is exactly what happened. We checked the saved record
          for <strong>b-lcm-1</strong> (the LCM 6, 4 question on
          version B). It showed up as blank — but with your note
          <em>"note 1..."</em> attached. That combination is the
          smoking gun that told us where the bug was.
        </p>

        <h3 style="margin:24px 0 8px 0;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#0f172a;">
          What the bug was
        </h3>

        <p style="margin:0 0 12px 0;">
          Each question on the page has three things you can edit:
        </p>

        <ol style="margin:0 0 14px 0;padding-left:22px;color:#475569;font-size:14px;">
          <li>the <strong>answer</strong> field</li>
          <li>the <strong>note</strong> field</li>
          <li>the <strong>help-link</strong> click tracker</li>
        </ol>

        <p style="margin:0 0 14px 0;">
          The page was wired up so that whenever you typed in any one
          of those, it sent an update that <strong>included a snapshot
          of the other two fields</strong> as it had last seen them.
          Normally fine. But if you typed in two of them faster than
          the page could re-draw between keystrokes — say, you typed
          <strong>"12"</strong> in the answer and immediately started
          typing your note — the note's update was carrying an
          <em>old</em> snapshot of the answer field (where it was still
          empty), and the note's save accidentally overwrote your
          <strong>12</strong> with <strong>blank</strong>.
        </p>

        <div style="margin:18px 0;padding:14px 18px;background:#fef3c7;border-left:3px solid #d97706;color:#78350f;font-size:14px;">
          That's why your record shows
          <code style="background:#fde68a;padding:1px 6px;border-radius:4px;">{ value: blank, note: "note 1..." }</code>
          — the note write was the last one to land, and it stomped on
          top of your answer with what it thought the answer used to
          be.
        </div>

        <p style="margin:0 0 14px 0;">
          This wasn't your mistake. It was a real bug on our side, and
          it had been there since Day 1. You're the first person to
          catch it.
        </p>

        <h3 style="margin:24px 0 8px 0;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#0f172a;">
          What we fixed
        </h3>

        <p style="margin:0 0 14px 0;">
          The page now sends <strong>only the field that actually
          changed</strong> (just the answer, or just the note, or just
          the help click), and the parent merges that one field into
          whatever the latest answer is. There is no longer a way for
          the note write to know — let alone overwrite — what was in
          the answer field. Each input lives in its own lane.
        </p>

        <p style="margin:0 0 14px 0;">
          We also added an automatic test that reproduces your exact
          scenario (saved row with
          <code style="background:#e2e8f0;padding:1px 6px;border-radius:4px;">{ value: blank, note: "note 1..." }</code>),
          so this bug can never come back without a test failing on us
          first.
        </p>

        <p style="margin:0 0 14px 0;color:#475569;font-size:14px;">
          Fix went live about ten minutes ago. Subject to your
          confirmation tomorrow, the page should work the way you
          expect: type the answer, type the note, both stick.
        </p>

        <h3 style="margin:24px 0 8px 0;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#0f172a;">
          Your score
        </h3>

        <p style="margin:0 0 14px 0;">
          We re-credited <strong>b-lcm-1</strong>. Your Day 5 v B is
          now <strong style="color:#047857;">21 / 22</strong> instead
          of 20 / 22 (your A is still 20 / 22 on its own merit). You
          can see it here, refreshed:
        </p>

        <div style="margin:14px 0;padding:14px 18px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;">
          <a href="https://teacher.ninja/daily/2026-05-18/results?version=b" style="color:#4f46e5;font-weight:600;font-size:15px;text-decoration:none;">
            teacher.ninja/daily/2026-05-18/results?version=b →
          </a>
        </div>

        <h3 style="margin:24px 0 8px 0;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#0f172a;">
          One favor
        </h3>

        <p style="margin:0 0 14px 0;padding:14px 18px;background:#ecfdf5;border:1px solid #a7f3d0;color:#064e3b;border-radius:10px;font-size:14px;">
          When you take Day 6 tomorrow, please try the same thing on
          purpose at least once: <strong>type an answer, then start
          typing in the note before the page settles.</strong> If your
          answer survives, the fix worked. If it doesn't, leave a bug
          report exactly like the one you left today and we'll keep
          digging.
        </p>

        <p style="margin:18px 0 14px 0;">
          Your bug report was clear, specific, and gave us the exact
          question and what you typed. That is what made finding the
          bug take twenty minutes instead of two days. Keep doing
          that.
        </p>

        <p style="margin:0 0 6px 0;">— Dad</p>
        <p style="margin:0;color:#94a3b8;font-size:12px;">CC: Mom, Enny</p>
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
  console.log(
    JSON.stringify({ ...body, html: `[${HTML.length} chars]` }, null, 2),
  );
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
