#!/usr/bin/env node
/**
 * One-off: send the Day-4-begins email to Yerachmiel, CC Dad and Eni.
 *
 *   node __tests__/smoke/send-day4-kickoff.mjs            # dry-run
 *   node __tests__/smoke/send-day4-kickoff.mjs --send     # actually dispatch
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

const SUBJECT =
  "Day 4 — last day of the experiment. Pass and we go to Phase 2.";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

THIS IS THE LAST DAY OF THE EXPERIMENT.

If it works, we go to Phase 2: more breaks, but also more material.
The deal was four mornings. This is morning four. Show up.

Yesterday — 17 / 22 on A (you didn't take B this time, that's fine).

  • GCF: 2 / 2. Locked in. Your factor lists are clean now —
    "20: 1, 2, 4, 5, 10, 20. 25: 1, 2, 5, 25." That's exactly
    how you should write them.
  • Fraction addition: 4 / 6. From 0 / 4 on Day 2. Huge jump.
    You got both same-denom AND unlike-denom (1/3 + 1/4 = 7/12 —
    correct). The two misses (1/4 + 2/4 and 1/2 + 1/4) both
    should be 3/4 — you wrote 2/4. That's an arithmetic slip
    (1 + 2 = 3, not 2), not a missing model. Slow down when you
    add the numerators.
  • LCM: 2 / 4. Same mistake as Day 2 on the coprime pairs.
      LCM(5, 7) — you wrote "5: 1, 5. 7: 1, 7." Those are
      *factors*, not *multiples*. Multiples of 5 go 5, 10, 15,
      20, 25, 30, **35**. Multiples of 7 go 7, 14, 21, 28, **35**.
      First match = 35. You did this with (10, 15) too and got 5
      — that's the GCF, not the LCM.
    When the numbers are unfamiliar, your brain reaches for
    *factors*. Write the word "MULTIPLES" on the page before you
    start an LCM question.
  • Periodic 3 / 4, wars 3 / 3, evolution 3 / 3. Memorization is
    a strength. Keep doing what you're doing there.

Today — Day 4. New stuff is small, the review is wide.

  • Fraction DIVISION — keep, change, flip. If you can multiply
    fractions (you can), you can divide them; you just flip the
    second one first. Five minutes of lesson, ten minutes of
    practice on /fractions, you've got it.
  • Formal INVERSE — only two cases. Inverse of 5 is 1/5.
    Inverse of 3/8 is 8/3. That's the whole lesson.
  • Then everything else from the week shows up again, in
    smaller doses: GCF, LCM, fraction add / sub / mul, three
    new wars (Vietnam, Gulf, Iraq), three final evolution events
    (mammals, hominids, Homo sapiens), and the full periodic
    table rows 1-3.

About 18 questions. Two versions — pick ONE today, not both.

  Practice before the exam (no skipping this):
  • /fractions Divide mode — 10 problems before you start.
  • One more LCM drill (pick five random pairs and find the
    FIRST common MULTIPLE — write the word "multiples" first).
  • Skim the periodic table rows 1-3 once.
  • Read the 15 wars once.

Same deal: 9:00 – 13:30 NY time, no phone, no PC outside this
window. Eli's or Daniel's machine.

  Today's brief, study, and exam:
  https://teacher.ninja/daily/2026-05-15

Plan on 3 – 4 hours. Submit before 13:30.

After you submit, this trial is over. We sit down together this
weekend, look at all four days, and figure out what Phase 2
looks like. You've earned the right to read your own notes back.

— Dad

(CC: Mom, Eni)
`;

const HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Day 4 — last day of the experiment</title>
  </head>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.55;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="padding:24px 28px;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#fde68a,#fb923c);">
        <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#7c2d12;font-weight:700;margin-bottom:4px;">
          Independent learner trial · Day 4 of 4 · Last day
        </div>
        <div style="font-size:24px;font-weight:800;color:#0f172a;line-height:1.25;">
          This is the last day of the experiment.
        </div>
        <div style="font-size:14px;color:#7c2d12;margin-top:6px;line-height:1.45;">
          If it works, we go to <strong>Phase 2</strong> — more breaks,
          but also more material.
        </div>
        <div style="font-size:13px;color:#7c2d12;margin-top:6px;">
          Friday, May 15, 2026
        </div>
      </div>

      <div style="padding:24px 28px;font-size:15px;color:#0f172a;">
        <p style="margin:0 0 14px 0;">Yerachmiel —</p>

        <p style="margin:0 0 14px 0;">
          The deal was four mornings. This is morning four. Show up.
        </p>

        <p style="margin:18px 0 10px 0;color:#475569;">
          <strong>Yesterday — 17 / 22 on A</strong> (you didn't take B,
          that's fine).
        </p>

        <ul style="margin:0 0 18px 0;padding-left:20px;color:#475569;">
          <li style="margin-bottom:10px;">
            <strong style="color:#15803d;">GCF: 2 / 2.</strong> Locked
            in. Your factor lists are clean now —
            <em>"20: 1, 2, 4, 5, 10, 20. 25: 1, 2, 5, 25."</em>
            That's exactly how to write them.
          </li>
          <li style="margin-bottom:10px;">
            <strong style="color:#15803d;">Fraction addition: 4 / 6.</strong>
            From 0 / 4 on Day 2. Huge jump — and you got
            <strong>1/3 + 1/4 = 7/12</strong>, which is the hard case.
            The two misses (<code>1/4 + 2/4</code> and
            <code>1/2 + 1/4</code>) both should be <strong>3/4</strong>;
            you wrote <strong>2/4</strong>. That's an arithmetic slip
            (1 + 2 = 3, not 2), not a missing model. Slow down on the
            numerator step.
          </li>
          <li style="margin-bottom:10px;">
            <strong style="color:#b91c1c;">LCM: 2 / 4.</strong>
            Same mistake as Day 2 on the coprime pairs.
            <ul style="margin:8px 0 0 0;padding-left:18px;">
              <li><strong>LCM(5, 7).</strong> You wrote
                "5: 1, 5. 7: 1, 7." Those are <em>factors</em>, not
                <em>multiples</em>. Multiples of 5 go 5, 10, 15, 20,
                25, 30, <strong>35</strong>. Multiples of 7 go 7, 14,
                21, 28, <strong>35</strong>. First match = 35.</li>
              <li>You did this with <strong>(10, 15)</strong> too and
                got 5 — that's the GCF, not the LCM.</li>
            </ul>
            <div style="margin-top:8px;padding:10px 14px;background:#fef2f2;border-left:3px solid #b91c1c;color:#7f1d1d;font-size:13.5px;">
              When the numbers are unfamiliar, your brain reaches for
              <em>factors</em>. <strong>Write the word "MULTIPLES" on
              the page</strong> before you start an LCM question.
            </div>
          </li>
          <li style="margin-bottom:0;">
            <strong style="color:#15803d;">Periodic 3 / 4, wars 3 / 3,
            evolution 3 / 3.</strong> Memorization is a strength. Keep
            doing what you're doing there.
          </li>
        </ul>

        <p style="margin:18px 0 8px 0;color:#475569;">
          <strong>Today — Day 4.</strong> New stuff is small, the
          review is wide.
        </p>

        <ul style="margin:0 0 18px 0;padding-left:20px;">
          <li style="margin-bottom:10px;">
            <strong style="color:#1d4ed8;">Fraction DIVISION</strong> —
            keep, change, flip. If you can multiply fractions (you can),
            you can divide them; you just flip the second one first.
            Five minutes of lesson, ten minutes of practice on
            <a href="https://teacher.ninja/fractions" style="color:#1d4ed8;">/fractions</a>,
            you've got it.
          </li>
          <li style="margin-bottom:10px;">
            <strong style="color:#1d4ed8;">Formal INVERSE</strong> —
            only two cases. Inverse of 5 is 1/5. Inverse of 3/8 is
            8/3. That's the whole lesson.
          </li>
          <li style="margin-bottom:0;">
            <strong style="color:#475569;">Everything else</strong>
            from the week shows up again in smaller doses: GCF, LCM,
            fraction add / sub / mul, three new wars (Vietnam, Gulf,
            Iraq), three final evolution events (mammals, hominids,
            Homo sapiens), and the full periodic table rows 1-3.
          </li>
        </ul>

        <p style="margin:0 0 14px 0;padding:12px 16px;background:#eef2ff;border-left:3px solid #4f46e5;color:#312e81;font-size:14px;">
          About <strong>18 questions</strong>. Two versions —
          <strong>pick ONE today</strong>, not both.
        </p>

        <div style="margin:18px 0;padding:16px 20px;background:#1e293b;color:#f8fafc;border-radius:10px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#fbbf24;font-weight:700;margin-bottom:8px;">
            Practice before the exam — no skipping this
          </div>
          <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.65;">
            <li><strong style="color:#fbbf24;">/fractions Divide mode</strong> — 10 problems before you start.</li>
            <li>One more LCM drill — pick five random pairs and find the FIRST common <strong style="color:#fbbf24;">MULTIPLE</strong>. Write the word "multiples" on the page first.</li>
            <li>Skim periodic rows 1-3 once.</li>
            <li>Read the 15 wars once.</li>
          </ul>
        </div>

        <p style="margin:0 0 14px 0;">
          Same deal: <strong>9:00 – 13:30 NY time</strong>, no phone,
          no PC outside this window. Eli's or Daniel's machine.
        </p>

        <div style="margin:18px 0;padding:14px 18px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#4338ca;font-weight:700;margin-bottom:6px;">
            Today's brief, study, and exam
          </div>
          <a href="https://teacher.ninja/daily/2026-05-15" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">
            teacher.ninja/daily/2026-05-15 →
          </a>
        </div>

        <p style="margin:0 0 14px 0;">
          Plan on about <strong>3 – 4 hours</strong>. Submit before
          <strong>13:30 NY time</strong>.
        </p>

        <p style="margin:0 0 14px 0;color:#475569;font-size:14px;font-style:italic;">
          After you submit, this trial is over. We sit down together
          this weekend, look at all four days, and figure out what
          Phase 2 looks like. You've earned the right to read your
          own notes back.
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
