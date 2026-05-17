#!/usr/bin/env node
/**
 * One-off: send the Day-5-begins email to Yerachmiel, CC Mom and Enny.
 * Day 5 = first day of week 2 (Mon May 18 2026).
 *
 *   node __tests__/smoke/send-day5-kickoff.mjs            # dry-run
 *   node __tests__/smoke/send-day5-kickoff.mjs --send     # actually dispatch
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

const SUBJECT = "Day 5 — Week 2 begins. Just try.";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

Good morning. Week 2 starts today.

Last week was the introduction. This week is shorter — we agreed:
9:00 to 12:30, with two 15-minute breaks. That's about 3 hours of
real work. One hour shorter than last week.

A few things I want you to read before you start:

  • You did good work last week. The notes you wrote — like
    "for 9 i did 1, 3, and 9, like in the video i saw at the
    start of this morning, good thing i watched it" — that is
    exactly what an independent learner sounds like. You found
    a tool, you used it, you got the answer.

  • Friday's exam wasn't fair to you. We dumped four brand-new
    operations on you at once with no real teaching first. That
    was on us, not on you. We've fixed it for this week:
    one new thing per day, with practice. Never thrown at you
    cold.

  • Today there is no expectation beyond TRYING. Read the brief.
    Do some practice. Take the exam. If something is hard, leave
    a note in the question — your notes last week are the most
    useful thing in this whole experiment, please keep doing that.

  • We really hope this works. We think you can do it. The point
    of this trial is not the score on any one day — it is whether
    you can show up to a desk and do focused work without anyone
    standing over you. That is the skill. The math is just the
    excuse to practice that skill.

Today's plan: 22 questions. Three GCF, two LCM, six fraction
addition (mostly the same shape you already saw on Wednesday and
Thursday last week), four periodic-table review (rows 1-2, you have
these), four wars (the early American set, 1-4), three evolution
(Big Bang, Earth, first life). One new thing for the math: cement
fraction addition with different denominators. Three steps: common
denominator, rewrite, add the tops. The brief walks through it.

Do at least 15 fraction-addition problems on /fractions before you
start the exam. That's the warm-up. Then sit down with the exam
when you're ready.

Same rules as last week:
  • 9:00 – 12:30 NY time. No phone. No PC outside this window.
  • Eli's computer or Daniel's, like the other days.
  • You can take version A or B. Either one. Both, if you want.

  Today's brief, study links, and exam:
  https://teacher.ninja/daily/2026-05-18

Submit before 12:30 NY time. After you submit, the system emails
me your full results with step-by-step explanations for every
question, so you'll see exactly where each step went.

Just try. We're proud of you for showing up to this.

— Dad

(CC: Mom, Enny)
`;

const HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Day 5 — Week 2 begins</title>
  </head>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="padding:24px 28px;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#dcfce7,#bbf7d0);">
        <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#166534;font-weight:700;margin-bottom:4px;">
          Independent learner trial · Week 2 · Day 5 of 8
        </div>
        <div style="font-size:22px;font-weight:700;color:#0f172a;">
          Good morning. Just try.
        </div>
        <div style="font-size:14px;color:#15803d;margin-top:4px;">
          Monday, May 18, 2026 · 9:00 – 12:30 NY time
        </div>
      </div>

      <div style="padding:24px 28px;font-size:15px;color:#0f172a;">
        <p style="margin:0 0 14px 0;">Yerachmiel —</p>

        <p style="margin:0 0 14px 0;">
          Week 2 starts today. Shorter day this week — 9:00 to 12:30
          with two 15-minute breaks, about 3 hours of real work. One
          hour shorter than last week.
        </p>

        <div style="margin:18px 0;padding:16px 20px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#047857;font-weight:700;margin-bottom:8px;">
            What we want from you today
          </div>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#064e3b;">
            <strong>Just try.</strong> Read the brief. Do some practice.
            Take the exam. If something is hard, leave a note in the
            question — your notes last week were the most useful thing
            in this whole experiment. Please keep doing that.
          </p>
        </div>

        <p style="margin:18px 0 14px 0;">
          A few things I want you to read before you start:
        </p>

        <ul style="margin:0 0 18px 0;padding-left:20px;">
          <li style="margin-bottom:14px;">
            <strong style="color:#047857;">You did good work last week.</strong>
            The notes you wrote —
            <em>"for 9 i did 1, 3, and 9, like in the video i saw at
            the start of this morning, good thing i watched it"</em>
            — that is exactly what an independent learner sounds like.
            You found a tool, you used it, you got the answer.
          </li>
          <li style="margin-bottom:14px;">
            <strong style="color:#0e7490;">Friday wasn't fair to you.</strong>
            We dumped four brand-new operations on you at once with no
            real teaching first. That was on us, not on you. We've
            fixed it for this week: <strong>one new thing per day</strong>,
            with practice. Never thrown at you cold.
          </li>
          <li style="margin-bottom:0;">
            <strong style="color:#7c3aed;">No expectations beyond trying.</strong>
            The point of this trial is not the score on any one day —
            it is whether you can show up to a desk and do focused work
            without anyone standing over you. That is the skill. The
            math is just the excuse to practice that skill.
          </li>
        </ul>

        <p style="margin:0 0 14px 0;padding:14px 18px;background:#fef9c3;border-left:3px solid #ca8a04;color:#713f12;font-size:14px;">
          We really hope this works. We think you can do it. Whatever
          today's score is, the fact that you sat down and did the
          work is the win.
        </p>

        <p style="margin:18px 0 8px 0;color:#475569;">
          <strong>Today's plan:</strong>
        </p>

        <ul style="margin:0 0 18px 0;padding-left:20px;color:#475569;font-size:14px;">
          <li>22 questions total.</li>
          <li>3 GCF · 2 LCM · 6 fraction addition (the focus today).</li>
          <li>4 periodic table — rows 1-2 review (you have these).</li>
          <li>4 wars — the early American set (1-4).</li>
          <li>3 evolution — Big Bang, Earth, first life.</li>
          <li>
            One new thing for math: cement <em>fraction addition with
            different denominators</em>. Three steps: common
            denominator, rewrite, add the tops. The brief walks
            through it.
          </li>
        </ul>

        <p style="margin:0 0 14px 0;">
          Do at least <strong>15 fraction-addition problems</strong> on
          <a href="https://teacher.ninja/fractions" style="color:#4f46e5;">/fractions</a>
          before you start the exam. That's the warm-up.
        </p>

        <p style="margin:0 0 8px 0;color:#475569;"><strong>Same rules as last week:</strong></p>
        <ul style="margin:0 0 18px 0;padding-left:20px;color:#475569;font-size:14px;">
          <li>9:00 – 12:30 NY time. No phone. No PC outside this window.</li>
          <li>Eli's computer or Daniel's, like the other days.</li>
          <li>You can take version A or B. Either one. Both, if you want.</li>
        </ul>

        <div style="margin:18px 0;padding:14px 18px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#4338ca;font-weight:700;margin-bottom:6px;">
            Today's brief, study links, and exam
          </div>
          <a href="https://teacher.ninja/daily/2026-05-18" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">
            teacher.ninja/daily/2026-05-18 →
          </a>
        </div>

        <p style="margin:0 0 14px 0;">
          Submit before <strong>12:30 NY time</strong>. After you
          submit, the system emails me your full results with
          step-by-step explanations for every question, so you'll see
          exactly where each step went.
        </p>

        <p style="margin:18px 0 14px 0;font-size:16px;color:#0f172a;">
          <strong>Just try. We're proud of you for showing up to this.</strong>
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
