#!/usr/bin/env node
/** Day 22 (Fri Sep 25 2026) — the three leaks. Dry-run unless --send. */

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

const SUBJECT = "Day 22 — the three leaks.";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

Yesterday was the map. Today is only the three places the points kept falling out.

1. Valence. Don't count chairs across the row. Read the group. H, Li, Na = 1. He = 2 (the exception). Then 3, 4, 5, 6, 7, 8. Carbon is 4. Chlorine is 7.

2. Two-digit multiplication. The method is right. The last addition is where it slips. 17 × 25 = (10+7)×(20+5) = 200 + 50 + 140 + 35 = 425. Write the four pieces before you add.

3. Two dates. Westphalia 1648. Versailles 1919.

Same clock as yesterday: 2 hours 30 minutes of work, a 20-minute break after every 40. Exam 12:30–1:00, 18 questions, A and B share nothing. Phones off until 1:30.

  https://teacher.ninja/daily/2026-09-25

Monday the bar mitzvah reading starts. 20 minutes, not part of this block: https://thesilvers.app/bar-mitzvah

— Dad

(CC: Mom, Enny)
`;

const HTML = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
<div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:24px 28px;">
<p style="margin:0 0 14px 0;">Yerachmiel —</p>
<p style="margin:0 0 14px 0;">Yesterday was the map. Today is only the three places the points kept falling out.</p>
<p style="margin:0 0 14px 0;"><strong>Valence.</strong> Don't count chairs across the row. Read the group. H, Li, Na = 1. He = 2 (the exception). Then 3, 4, 5, 6, 7, 8. Carbon is 4. Chlorine is 7.</p>
<p style="margin:0 0 14px 0;"><strong>Two-digit multiplication.</strong> The method is right. The last addition is where it slips. 17 × 25 = (10+7)×(20+5) = 200 + 50 + 140 + 35 = 425. Write the four pieces before you add.</p>
<p style="margin:0 0 14px 0;"><strong>Two dates.</strong> Westphalia 1648. Versailles 1919.</p>
<p style="margin:0 0 14px 0;">Same clock as yesterday: <strong>2 hours 30 minutes</strong> of work, a 20-minute break after every 40. Exam 12:30–1:00, 18 questions, A and B share nothing. Phones stay off until 1:30.</p>
<p style="margin:18px 0;"><a href="https://teacher.ninja/daily/2026-09-25" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">teacher.ninja/daily/2026-09-25 →</a></p>
<p style="margin:0 0 14px 0;">Monday the bar mitzvah reading starts. 20 minutes, not part of this block. <a href="https://thesilvers.app/bar-mitzvah" style="color:#4f46e5;font-weight:600;text-decoration:none;">thesilvers.app/bar-mitzvah</a></p>
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
