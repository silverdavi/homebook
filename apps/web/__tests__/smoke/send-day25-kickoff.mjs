#!/usr/bin/env node
/** Day 25 (Thu Oct 1 2026). Neutrons. Dry-run unless --send. */

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

const SUBJECT = "Day 25 — neutrons.";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const TEXT = `Yerachmiel —

No treaties, and no valence counting.

Protons name the element. Carbon is carbon because it has 6 protons. Neutrons are extra weight. Common carbon has 6 neutrons. More neutrons, still carbon. That is an isotope.

Have these:

  Beryllium  4 protons, 5 neutrons
  Fluorine   9 protons, 10 neutrons
  Magnesium  12 and 12
  Argon      18 protons, 22 neutrons — not 18

Same clock: 2 hours 30 minutes, a 20-minute break after every 40. Exam 12:30–1:00. Phones off until 1:30.

  https://teacher.ninja/daily/2026-10-01

Bar mitzvah reading stays 20 minutes, separate: https://thesilvers.app/bar-mitzvah

— Dad

(CC: Mom, Enny)
`;

const HTML = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
<div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:24px 28px;">
<p style="margin:0 0 14px 0;">Yerachmiel —</p>
<p style="margin:0 0 14px 0;">No treaties, and no valence counting.</p>
<p style="margin:0 0 14px 0;">Protons name the element. Neutrons are extra weight. Same protons and more neutrons is still that element — an isotope. Beryllium is 4 and 5. Fluorine is 9 and 10. Magnesium is 12 and 12. Argon is 18 protons and <strong>22</strong> neutrons.</p>
<p style="margin:0 0 14px 0;">Same clock: <strong>2 hours 30 minutes</strong>, a 20-minute break after every 40. Exam 12:30–1:00. Phones off until 1:30.</p>
<p style="margin:18px 0;"><a href="https://teacher.ninja/daily/2026-10-01" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">teacher.ninja/daily/2026-10-01 →</a></p>
<p style="margin:0 0 14px 0;">Bar mitzvah reading stays 20 minutes, separate. <a href="https://thesilvers.app/bar-mitzvah" style="color:#4f46e5;font-weight:600;text-decoration:none;">thesilvers.app/bar-mitzvah</a></p>
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
