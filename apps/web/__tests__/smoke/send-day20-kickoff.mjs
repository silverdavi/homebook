#!/usr/bin/env node
/**
 * Day 20 (Fri Jun 12 2026) — LAST day of the trial. Scheduled 12:50 UTC = 8:50 EDT.
 * This one celebrates with real stats: it reads the SQLite profile at send
 * time and reports the whole trial in numbers (through yesterday's exams).
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
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (k === key && v) return v;
    }
  }
  return null;
}

function fmtDuration(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.round((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Read the DB and compute trial stats. Returns null if unavailable. */
async function buildStats() {
  try {
    return computeStats(await loadDb());
  } catch (e) {
    console.error("[stats] unavailable:", e?.message || e);
    return null;
  }
}

async function loadDb() {
  const Database = (await import("better-sqlite3")).default;
  const dbPath = path.resolve(process.cwd(), ".data", "profiles.db");
  if (!fs.existsSync(dbPath)) throw new Error(`no db at ${dbPath}`);
  return new Database(dbPath, { readonly: true });
}

function computeStats(db) {
  // Pick the profile with the most exam submissions (Adam).
  const top = db
    .prepare(
      `SELECT profile_id, COUNT(*) c FROM daily_exams GROUP BY profile_id ORDER BY c DESC LIMIT 1`,
    )
    .get();
  if (!top) return null;
  const rows = db
    .prepare(
      `SELECT date, version, score, total, answers_json FROM daily_exams WHERE profile_id = ? ORDER BY date, version`,
    )
    .all(top.profile_id);
  if (!rows.length) return null;

  let examCount = 0;
  let totalQ = 0;
  let totalCorrect = 0;
  let totalSec = 0;
  let bothVersionDays = 0;
  let best = { date: "", pct: -1, score: 0, total: 0 };
  let fastest = Infinity;
  const byDate = new Map(); // date -> {correct,total,versions:Set}
  const weekBucket = (d) =>
    d < "2026-05-18" ? "first" : d >= "2026-06-09" ? "last" : "mid";
  const weekAcc = { first: { c: 0, t: 0 }, mid: { c: 0, t: 0 }, last: { c: 0, t: 0 } };

  for (const r of rows) {
    examCount++;
    totalQ += r.total;
    totalCorrect += r.score;
    let dur = 0;
    try {
      const blob = JSON.parse(r.answers_json);
      dur = Number(blob.durationSec) || 0;
    } catch {}
    totalSec += dur;
    if (dur > 0 && dur < fastest) fastest = dur;
    const pct = r.total ? (r.score / r.total) * 100 : 0;
    if (pct > best.pct) best = { date: r.date, pct, score: r.score, total: r.total };
    const b = weekBucket(r.date);
    weekAcc[b].c += r.score;
    weekAcc[b].t += r.total;
    if (!byDate.has(r.date)) byDate.set(r.date, { versions: new Set() });
    byDate.get(r.date).versions.add(r.version);
  }
  for (const [, v] of byDate) if (v.versions.size >= 2) bothVersionDays++;

  const accuracy = totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0;
  const firstAcc = weekAcc.first.t ? Math.round((weekAcc.first.c / weekAcc.first.t) * 100) : null;
  const lastAcc = weekAcc.last.t ? Math.round((weekAcc.last.c / weekAcc.last.t) * 100) : null;

  return {
    daysCompleted: byDate.size,
    examCount,
    totalQ,
    totalCorrect,
    accuracy,
    studyTime: fmtDuration(totalSec),
    avgExam: examCount ? fmtDuration(Math.round(totalSec / examCount)) : "—",
    fastest: Number.isFinite(fastest) ? fmtDuration(fastest) : "—",
    bothVersionDays,
    best,
    firstAcc,
    lastAcc,
  };
}

const s = await buildStats();

const SUBJECT = "Day 20 — last day. Here's the whole trial in numbers.";
const TO = ["yersilver@gmail.com"];
const CC = ["silverdavi@gmail.com", "enny412@gmail.com"];
const REPLY_TO = "silverdavi@gmail.com";
const FROM = "Dad <dad@dichotomies.me>";

const statLinesText = s
  ? [
      `  Days completed:      ${s.daysCompleted}`,
      `  Exams submitted:     ${s.examCount}  (both versions on ${s.bothVersionDays} days)`,
      `  Questions answered:  ${s.totalQ}`,
      `  Correct:             ${s.totalCorrect}  (${s.accuracy}%)`,
      `  Total time:          ${s.studyTime}  (avg ${s.avgExam}/exam, fastest ${s.fastest})`,
      s.best.total ? `  Best day:            ${s.best.date} — ${s.best.score}/${s.best.total}` : null,
      s.firstAcc != null && s.lastAcc != null
        ? `  Accuracy trend:      ${s.firstAcc}% in week 1  →  ${s.lastAcc}% this week`
        : null,
    ].filter(Boolean).join("\n")
  : "  (Stats will be in the wrap-up — couldn't read the profile this morning.)";

const TEXT = `Yerachmiel —

Last day. Before you start, here's the whole thing in numbers (through
yesterday):

${statLinesText}

That's the real result — not any single score, but that you showed up and
ran it yourself, every morning, for five weeks.

No drill today. You're sick of the same year/proton/fraction grind, so
today is just cool facts — random, true, surprising — across everything
you studied. A few to get you to click:

- Sharks are older than trees. And older than Saturn's rings.
- T. rex lived closer in time to you than to Stegosaurus.
- Helium was discovered in the Sun before anyone found it on Earth.
- Mendeleev left blank squares in the table and correctly predicted the
  elements that would fill them.
- Korea never signed peace — the 1953 deal was just a cease-fire, so the
  two Koreas are technically still at war.

The rest are on the page. Read them, tell someone at lunch.

School 9:30-11:00 NY time — 90 minutes, mostly reading. Then no phone
11:00-12:00: outside, food, nothing. There's a short optional 18-question
victory lap at the bottom if you want it — no pressure today.

  https://teacher.ninja/daily/2026-06-12

Finish strong. We're proud of you.

— Dad

(CC: Mom, Enny)
`;

const statRowsHtml = s
  ? `
<table style="width:100%;border-collapse:collapse;font-size:15px;">
  <tr><td style="padding:6px 0;color:#475569;">Days completed</td><td style="padding:6px 0;text-align:right;font-weight:600;">${s.daysCompleted}</td></tr>
  <tr><td style="padding:6px 0;color:#475569;">Exams submitted</td><td style="padding:6px 0;text-align:right;font-weight:600;">${s.examCount} <span style="color:#94a3b8;font-weight:400;">(both versions on ${s.bothVersionDays} days)</span></td></tr>
  <tr><td style="padding:6px 0;color:#475569;">Questions answered</td><td style="padding:6px 0;text-align:right;font-weight:600;">${s.totalQ}</td></tr>
  <tr><td style="padding:6px 0;color:#475569;">Correct</td><td style="padding:6px 0;text-align:right;font-weight:600;">${s.totalCorrect} <span style="color:#16a34a;">(${s.accuracy}%)</span></td></tr>
  <tr><td style="padding:6px 0;color:#475569;">Total time</td><td style="padding:6px 0;text-align:right;font-weight:600;">${s.studyTime} <span style="color:#94a3b8;font-weight:400;">(avg ${s.avgExam}, fastest ${s.fastest})</span></td></tr>
  ${s.best.total ? `<tr><td style="padding:6px 0;color:#475569;">Best day</td><td style="padding:6px 0;text-align:right;font-weight:600;">${s.best.date} — ${s.best.score}/${s.best.total}</td></tr>` : ""}
  ${s.firstAcc != null && s.lastAcc != null ? `<tr><td style="padding:6px 0;color:#475569;">Accuracy trend</td><td style="padding:6px 0;text-align:right;font-weight:600;">${s.firstAcc}% → ${s.lastAcc}%</td></tr>` : ""}
</table>`
  : `<p style="margin:0;color:#94a3b8;">(Stats will be in the wrap-up — couldn't read the profile this morning.)</p>`;

const HTML = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
<div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:24px 28px;">
<p style="margin:0 0 14px 0;">Yerachmiel —</p>
<p style="margin:0 0 16px 0;">Last day. Before you start, here's the whole thing in numbers (through yesterday):</p>
<div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:8px 16px;margin:0 0 16px 0;">${statRowsHtml}</div>
<p style="margin:0 0 14px 0;">That's the real result — not any single score, but that you showed up and ran it yourself, every morning, for five weeks.</p>
<p style="margin:0 0 10px 0;">No drill today. You're sick of the same year/proton/fraction grind, so today is just cool facts — random, true, surprising — across everything you studied. A few to get you to click:</p>
<ul style="margin:0 0 14px 0;padding-left:20px;color:#334155;">
<li style="margin:0 0 6px 0;">Sharks are older than trees. And older than Saturn's rings.</li>
<li style="margin:0 0 6px 0;">T. rex lived closer in time to you than to Stegosaurus.</li>
<li style="margin:0 0 6px 0;">Helium was discovered in the Sun before anyone found it on Earth.</li>
<li style="margin:0 0 6px 0;">Mendeleev left blank squares in the table and correctly predicted the elements that would fill them.</li>
<li style="margin:0;">Korea never signed peace — the 1953 deal was a cease-fire, so the two Koreas are technically still at war.</li>
</ul>
<p style="margin:0 0 14px 0;">The rest are on the page. Read them, tell someone at lunch.</p>
<p style="margin:0 0 14px 0;">School 9:30–11:00 NY time — 90 minutes, mostly reading. Then no phone 11:00–12:00: outside, food, nothing. There's a short optional 18-question victory lap at the bottom if you want it — no pressure today.</p>
<p style="margin:18px 0;"><a href="https://teacher.ninja/daily/2026-06-12" style="color:#4f46e5;font-weight:600;font-size:16px;text-decoration:none;">teacher.ninja/daily/2026-06-12 →</a></p>
<p style="margin:0 0 14px 0;">Finish strong. We're proud of you.</p>
<p style="margin:0 0 6px 0;">— Dad</p>
<p style="margin:0;color:#94a3b8;font-size:12px;">CC: Mom, Enny</p>
</div></body></html>`;

const args = new Set(process.argv.slice(2));
const send = args.has("--send");
const body = { from: FROM, to: TO, cc: CC, reply_to: REPLY_TO, subject: SUBJECT, html: HTML, text: TEXT };
if (!send) { console.log("Dry run.\n"); console.log(TEXT); console.log(`\n[html ${HTML.length} chars, stats=${s ? "yes" : "no"}]`); process.exit(0); }
const key = getEnv("RESEND_API_KEY");
if (!key) { console.error("no key"); process.exit(2); }
const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify(body) });
const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = null; }
if (!res.ok) { console.error("rejected", res.status, text); process.exit(1); }
console.log("✅ Sent.", json?.id, SUBJECT);
