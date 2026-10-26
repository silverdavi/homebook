#!/usr/bin/env node
// One-off: introduces the daily 20-minute extras. Sent 2026-10-26.
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
function getEnv(key) {
  if (process.env[key]) return process.env[key];
  for (const file of [".env", "resend.txt"]) {
    const p = path.join(REPO_ROOT, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      const eq = t.indexOf("=");
      if (!t || t.startsWith("#") || eq < 0) continue;
      if (t.slice(0, eq).trim() === key) return t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
  return null;
}

const url = "https://teacher.ninja/daily/2026-10-26#extra";
const subject = "New: a 20-minute extra every day (today: pasta)";

const days = [
  ["Today", "20 shapes of pasta", "photos of every shape, which sauce goes with which, and a kitchen hunt for the boxes we have."],
  ["Tuesday", "Breads of the world", "what makes bread rise (or not), from challah to injera, plus scaling a real recipe."],
  ["Wednesday", "Shares, stocks, and options", "what owning a piece of a company means, and how calls and puts work."],
  ["Friday", "20 famous books", "one line on each, and you pick the next book you want — I'll get it."],
];

const text = `Yerachmiel —

Starting today, every school day has an Extra 20 minutes at the bottom of the day's page. It's for when you finish early. Optional, not graded.

Each one has:
• picture cards to learn from
• a "Do it" activity (often in the kitchen or around the house)
• the sheet for it, printed that morning
• an online quiz — 12 questions, a new mix every time, and it saves your best score.

Coming up:
${days.map(([d, t, w]) => `• ${d} — ${t}: ${w}`).join("\n")}

Later: first aid, compound interest, credit cards, spices, how a paycheck works, knife skills, elections… and on December 8 you cook a full meal for the family.

Today's is ready now. The blue "Finished before 1:00?" box links to it, or go straight here:
${url}

Try to beat your quiz score.

— Dad

(CC: Mom, Enny)
`;

const li = days
  .map(([d, t, w]) => `<li style="margin:0 0 8px 0;"><strong>${d} — ${t}:</strong> ${w}</li>`)
  .join("");
const html = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.6;">
<div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:24px 28px;">
<p style="margin:0 0 14px 0;">Yerachmiel —</p>
<p style="margin:0 0 14px 0;">Starting today, every school day has an <strong>Extra 20 minutes</strong> at the bottom of the day&apos;s page. It&apos;s for when you finish early. Optional, not graded.</p>
<p style="margin:0 0 6px 0;">Each one has:</p>
<ul style="margin:0 0 14px 0;padding-left:20px;">
<li>picture cards to learn from</li>
<li>a &ldquo;Do it&rdquo; activity (often in the kitchen or around the house)</li>
<li>the sheet for it, printed that morning</li>
<li>an online quiz &mdash; 12 questions, a new mix every time, and it saves your best score</li>
</ul>
<p style="margin:0 0 6px 0;">Coming up:</p>
<ul style="margin:0 0 14px 0;padding-left:20px;">${li}</ul>
<p style="margin:0 0 14px 0;">Later: first aid, compound interest, credit cards, spices, how a paycheck works, knife skills, elections&hellip; and on December 8 you cook a full meal for the family.</p>
<p style="margin:0 0 14px 0;">Today&apos;s is ready now. The blue &ldquo;Finished before 1:00?&rdquo; box links to it, or go straight here:</p>
<p style="margin:18px 0;"><a href="${url}" style="color:#e11d48;font-weight:600;font-size:16px;text-decoration:none;">Today&apos;s extra: pasta &rarr;</a></p>
<p style="margin:0 0 14px 0;">Try to beat your quiz score.</p>
<p style="margin:0 0 6px 0;">— Dad</p>
<p style="margin:0;color:#94a3b8;font-size:12px;">CC: Mom, Enny</p>
</div></body></html>`;

const body = {
  from: "Dad <dad@dichotomies.me>",
  to: ["yersilver@gmail.com"],
  cc: ["silverdavi@gmail.com", "enny412@gmail.com"],
  reply_to: "silverdavi@gmail.com",
  subject,
  html,
  text,
};

if (!process.argv.includes("--send")) {
  console.log(text);
  process.exit(0);
}
const key = getEnv("RESEND_API_KEY");
if (!key) throw new Error("no RESEND_API_KEY");
const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
  body: JSON.stringify(body),
});
const out = await res.text();
if (!res.ok) throw new Error(`Resend rejected ${res.status}: ${out}`);
console.log("Sent.", JSON.parse(out).id, subject);
