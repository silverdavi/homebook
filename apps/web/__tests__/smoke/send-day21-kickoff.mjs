#!/usr/bin/env node
/** Day 21 (Thu Sep 24 2026) — back from summer, the whole trial once. Dry-run unless --send. */

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

const SUBJECT = "Day 21 — the whole trial, once.";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

First day back. Nothing new. This is the whole May–June trial on one page, then one exam that touches every thread once.

Where June left off, through the day before the victory lap:

Days completed    19
Exams submitted   27 (both versions on 8 days)
Questions answered 568
Correct           421 (74%)
Total time        6h 46m (avg 15m, fastest 4m)
Best day          2026-05-19 — 22/22
Accuracy trend    63% → 71%

School is 2 hours 30 minutes of work. A 20-minute break after every 40 minutes, no phone on the breaks:

  9:30–10:10   read the page
  10:10–10:30  outside, food, nothing
  10:30–11:10  paper, answers covered
  11:10–11:30  break
  11:30–12:10  the one thread that felt fuzzy
  12:10–12:30  break
  12:30–13:00  exam — 18 questions, A or B

Phones stay off until 1:30. After you submit, the screen is done.

  https://teacher.ninja/daily/2026-09-24

Tomorrow is the three places the points kept falling out. Today is just the map.

— Dad

(CC: Mom, Enny)
`;

const HTML = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
<div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:24px 28px;">
<p style="margin:0 0 14px 0;">Yerachmiel —</p>
<p style="margin:0 0 14px 0;">First day back. Nothing new. This is the whole May–June trial on one page, then one exam that touches every thread once.</p>
<p style="margin:0 0 8px 0;">Where June left off, through the day before the victory lap:</p>
<table style="border-collapse:collapse;margin:0 0 14px 0;font-size:14px;">
<tr><td style="padding:2px 16px 2px 0;">Days completed</td><td>19</td></tr>
<tr><td style="padding:2px 16px 2px 0;">Exams submitted</td><td>27 (both versions on 8 days)</td></tr>
<tr><td style="padding:2px 16px 2px 0;">Questions answered</td><td>568</td></tr>
<tr><td style="padding:2px 16px 2px 0;">Correct</td><td>421 (74%)</td></tr>
<tr><td style="padding:2px 16px 2px 0;">Total time</td><td>6h 46m (avg 15m, fastest 4m)</td></tr>
<tr><td style="padding:2px 16px 2px 0;">Best day</td><td>2026-05-19 — 22/22</td></tr>
<tr><td style="padding:2px 16px 2px 0;">Accuracy trend</td><td>63% → 71%</td></tr>
</table>
<p style="margin:0 0 14px 0;">School is <strong>2 hours 30 minutes</strong> of work. A 20-minute break after every 40 minutes, no phone on the breaks: 9:30–10:10 read, break, 10:30–11:10 on paper, break, 11:30–12:10 the fuzzy thread, break, <strong>12:30–1:00 the exam</strong> (18 questions, A or B). Phones stay off until 1:30.</p>
<p style="margin:18px 0;"><a href="https://teacher.ninja/daily/2026-09-24" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">teacher.ninja/daily/2026-09-24 →</a></p>
<p style="margin:0 0 14px 0;">Tomorrow is the three places the points kept falling out. Today is just the map.</p>
<p style="margin:0 0 6px 0;">— Dad</p>
<p style="margin:0;color:#94a3b8;font-size:12px;">CC: Mom, Enny</p>
</div></body></html>`;

const args = new Set(process.argv.slice(2));
const send = args.has("--send");
const body = { from: FROM, to: TO, cc: CC, reply_to: REPLY_TO, subject: SUBJECT, html: HTML, text: TEXT };
if (!send) { console.log("Dry run.\n"); console.log(JSON.stringify({ ...body, html: `[${HTML.length} chars]` }, null, 2)); process.exit(0); }
const key = getEnv("RESEND_API_KEY");
if (!key) { console.error("no key"); process.exit(2); }
const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify(body) });
const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = null; }
if (!res.ok) { console.error("rejected", res.status, text); process.exit(1); }
console.log("Sent.", json?.id, SUBJECT);
