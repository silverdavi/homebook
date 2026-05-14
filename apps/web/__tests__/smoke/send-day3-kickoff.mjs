#!/usr/bin/env node
/**
 * One-off: send the Day-3-begins email to Yerachmiel, CC Dad and Eni.
 *
 *   node __tests__/smoke/send-day3-kickoff.mjs            # dry-run
 *   node __tests__/smoke/send-day3-kickoff.mjs --send     # actually dispatch
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

const SUBJECT = "Day 3 — drill day. Practice 20 before you take the exam.";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

Day 2 was 14/18 on A and 14/18 on B — 28/36 total. You took both
versions; that gave us double the data, and the picture is clear.

What's solid: periodic table 8/8, wars 6/6, evolution 6/6.
Memorization is working.

What's not:

  • Fraction addition: 0 / 4. You don't have a model yet. You
    wrote: "if I have half an apple and a 4th of an apple I'd
    have a third of an apple so 2/3." That's a guess, and the
    rule is different. The real rule is in today's brief.

  • LCM: 3 / 6. Two specific issues — once you confused LCM
    with GCF (listed factors instead of multiples), once you
    listed correctly but picked the wrong "first common", once
    you had a typo (34 vs 35).

  • GCF: 5 / 6. Mostly fine. The miss was a factor list with
    extra numbers in it.

So today is a DRILL DAY. No subtraction, no multiplication, no
new periodic-table elements, no new wars. Today is 22 questions:
two GCF, four LCM, six addition, ten review (periodic / wars /
evolution that you have cold).

Practice, practice, practice.

  Do NOT assume you can solve a fraction-add problem because
  you read the lesson once. Do at least 20 addition problems
  on paper or on /fractions BEFORE you start the exam. Same
  with LCM — do 20 LCM problems first. The lesson explains the
  rule. Practice makes the rule yours.

This week is to start. Next week we'll give you better tools
and more ideas about how to study. For now, the tool is your
paper, the /fractions drill page, and time.

Same deal: 9:00 – 13:30 NY time, no phone, no PC outside this
window. Eli's computer or Daniel's, like the other days.

  Today's brief, study, and exam:
  https://teacher.ninja/daily/2026-05-14

Plan on about 3 – 4 hours. Submit before 13:30.

— Dad

(CC: Mom, Eni)
`;

const HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Day 3 — drill day, practice 20 first</title>
  </head>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.55;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="padding:24px 28px;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#fef3c7,#fde68a);">
        <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#a16207;font-weight:700;margin-bottom:4px;">
          Independent learner trial · Day 3 of 4
        </div>
        <div style="font-size:22px;font-weight:700;color:#0f172a;">
          Day 2: 14 / 18 on each version. Today is a drill day.
        </div>
        <div style="font-size:14px;color:#92400e;margin-top:4px;">
          Thursday, May 14, 2026
        </div>
      </div>

      <div style="padding:24px 28px;font-size:15px;color:#0f172a;">
        <p style="margin:0 0 14px 0;">Yerachmiel —</p>

        <p style="margin:0 0 14px 0;">
          You took both versions yesterday — that gave us double the data,
          and the picture is clear.
        </p>

        <p style="margin:0 0 8px 0;color:#475569;">
          <strong>What's solid:</strong> periodic table 8/8, wars 6/6,
          evolution 6/6. Memorization is working.
        </p>

        <p style="margin:18px 0 8px 0;color:#475569;">
          <strong>What's not:</strong>
        </p>

        <ul style="margin:0 0 18px 0;padding-left:20px;">
          <li style="margin-bottom:12px;">
            <strong style="color:#b91c1c;">Fraction addition: 0 / 4.</strong>
            You don't have a model yet. You wrote
            <em>"if I have half an apple and a 4th of an apple I'd have
            a third of an apple so 2/3."</em> That's a guess, and the rule
            is different. The real three-step rule is in today's brief.
          </li>
          <li style="margin-bottom:12px;">
            <strong style="color:#b45309;">LCM: 3 / 6.</strong> Three
            specific mistakes — once confused LCM with GCF, once picked
            the wrong "first common", once a typo. Today's exam has four
            LCM questions, three of them direct repeats of yesterday's
            misses.
          </li>
          <li style="margin-bottom:0;">
            <strong style="color:#65a30d;">GCF: 5 / 6.</strong> Mostly fine.
            The miss was a factor list with non-factors in it.
          </li>
        </ul>

        <p style="margin:0 0 14px 0;padding:12px 16px;background:#fef3c7;border-left:3px solid #d97706;color:#78350f;font-size:14px;">
          <strong>Today is a drill day.</strong> No subtraction, no
          multiplication, no new periodic-table elements, no new wars.
          Today is <strong>22 questions</strong>: two GCF, four LCM, six
          addition, ten review.
        </p>

        <div style="margin:18px 0;padding:16px 20px;background:#1e293b;color:#f8fafc;border-radius:10px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#fbbf24;font-weight:700;margin-bottom:8px;">
            Practice, practice, practice
          </div>
          <p style="margin:0 0 8px 0;font-size:15px;line-height:1.55;">
            Do <strong>not</strong> assume you can solve a fraction-add
            problem because you read the lesson once.
          </p>
          <p style="margin:0;font-size:15px;line-height:1.55;">
            Do at least <strong style="color:#fbbf24;">20 addition problems</strong>
            on paper or on
            <a href="https://teacher.ninja/fractions" style="color:#fbbf24;">/fractions</a>
            <strong>before</strong> you start the exam. Same for LCM — do
            <strong style="color:#fbbf24;">20 LCM problems</strong> first.
            The lesson explains the rule. Practice makes the rule yours.
          </p>
        </div>

        <p style="margin:0 0 14px 0;color:#475569;font-size:14px;font-style:italic;">
          This week is to start. Next week we'll give you better tools
          and more ideas about how to study. For now, the tool is your
          paper, the /fractions drill page, and time.
        </p>

        <p style="margin:0 0 14px 0;">
          Same deal: <strong>9:00 – 13:30 NY time</strong>, no phone, no
          PC outside this window. Eli's computer or Daniel's, like the
          other days.
        </p>

        <div style="margin:18px 0;padding:14px 18px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#4338ca;font-weight:700;margin-bottom:6px;">
            Today's brief, study, and exam
          </div>
          <a href="https://teacher.ninja/daily/2026-05-14" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">
            teacher.ninja/daily/2026-05-14 →
          </a>
        </div>

        <p style="margin:0 0 14px 0;">
          Plan on about <strong>3 – 4 hours</strong>. Submit before
          <strong>13:30 NY time</strong>.
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
