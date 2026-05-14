/**
 * Daily — exam summary email pipeline.
 *
 * Given a graded exam, build:
 *   1. A structured digest (deterministic, JSON-shaped).
 *   2. An LLM-authored narrative (parent-friendly, blunt, non-coaching).
 *   3. An HTML email combining both.
 *   4. Send via Resend to the parents.
 *
 * The pipeline is fire-and-forget from the API route, but every stage is
 * exported so the manual /daily/api/summary endpoint can re-run it.
 */

import "server-only";
import type { Day, ExamResult, Question } from "./types";
import type { Profile } from "@/lib/db";
import { chatComplete } from "./openai";
import { sendEmail, type SendEmailResult } from "./email";
import {
  gcd,
  fracAdd,
  fracSub,
  fracMul,
  fracDiv,
  fmtFrac,
  type Frac,
} from "./math";

// All times in this email are reported in the kid's local timezone (New
// York). The data is stored UTC; we just format for display.
const TZ = "America/New_York";

function fmtNyDateTime(input: Date | string | number | null | undefined): string {
  if (input === null || input === undefined || input === "") return "";
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.valueOf())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}

// Recipients are hard-coded — this is a single-family deployment for now.
export const PARENT_EMAILS = [
  "silverdavi@gmail.com",
  "yersilver@gmail.com",
] as const;

// ── Prompt question rendering (matches what Adam saw on screen) ─────────

function renderPrompt(q: Question): string {
  switch (q.kind) {
    case "gcf":
      return `GCF(${q.a}, ${q.b})`;
    case "lcm":
      return `LCM(${q.a}, ${q.b})`;
    case "fracAdd":
      return `${fmt(q.x)} + ${fmt(q.y)}`;
    case "fracSub":
      return `${fmt(q.x)} − ${fmt(q.y)}`;
    case "fracMul":
      return `${fmt(q.x)} × ${fmt(q.y)}`;
    case "fracDiv":
      return `${fmt(q.x)} ÷ ${fmt(q.y)}`;
    case "fracInverse": {
      const v =
        typeof q.value === "number" ? `${q.value}` : fmt(q.value);
      return `inverse of ${v}`;
    }
    case "periodic": {
      const ask =
        q.ask === "P" ? "protons" : q.ask === "N" ? "neutrons" : "electrons";
      return `${ask} in ${q.symbol} (${q.elementName})`;
    }
    case "war":
      return `start year of ${q.name}`;
    case "evolution":
      return `${q.event} (mya)`;
  }
}

function fmt(f: [number, number]): string {
  if (f[1] === 1) return `${f[0]}`;
  if (f[0] === 0) return "0";
  return `${f[0]}/${f[1]}`;
}

// ── Per-question explanation: walk a parent (or the kid, post-hoc)
//    through *why* the correct answer is what it is. Pure functions
//    of the question — same string regardless of what the user typed.
//    Multi-line; rendered as <pre> in the email.

function explainGcf(a: number, b: number): string {
  const factors = (n: number) => {
    const out: number[] = [];
    for (let i = 1; i <= n; i += 1) if (n % i === 0) out.push(i);
    return out;
  };
  const fa = factors(a);
  const fb = factors(b);
  const common = fa.filter((x) => fb.includes(x));
  const ans = gcd(a, b);
  return [
    `Factors of ${a}: ${fa.join(", ")}`,
    `Factors of ${b}: ${fb.join(", ")}`,
    `In both lists: ${common.join(", ")}`,
    `Largest one — that's the GCF: ${ans}.`,
  ].join("\n");
}

function explainLcm(a: number, b: number): string {
  const ans = (a * b) / gcd(a, b);
  // Show first few multiples of each, up to and including the LCM.
  const mulList = (n: number, stopAt: number): number[] => {
    const out: number[] = [];
    let k = n;
    while (k <= stopAt && out.length < 12) {
      out.push(k);
      k += n;
    }
    return out;
  };
  const ma = mulList(a, ans);
  const mb = mulList(b, ans);
  return [
    `Multiples of ${a}: ${ma.join(", ")}…`,
    `Multiples of ${b}: ${mb.join(", ")}…`,
    `First number in BOTH lists — that's the LCM: ${ans}.`,
    `(Or via formula: GCF(${a}, ${b}) = ${gcd(a, b)}; LCM = ${a}×${b} / ${gcd(a, b)} = ${ans}.)`,
  ].join("\n");
}

function explainFracAdd(x: Frac, y: Frac): string {
  const lcmDen = (x[1] * y[1]) / gcd(x[1], y[1]);
  const xMul = lcmDen / x[1];
  const yMul = lcmDen / y[1];
  const xConv: Frac = [x[0] * xMul, lcmDen];
  const yConv: Frac = [y[0] * yMul, lcmDen];
  const sumTop = xConv[0] + yConv[0];
  const ans = fracAdd(x, y);
  const lines: string[] = [];
  if (x[1] === y[1]) {
    lines.push(`Same denominator — just add the tops.`);
    lines.push(`(${x[0]} + ${y[0]}) / ${x[1]} = ${sumTop}/${x[1]} = ${fmtFrac(ans)}.`);
  } else {
    lines.push(`Step 1: LCM(${x[1]}, ${y[1]}) = ${lcmDen}. That's the common denominator.`);
    lines.push(`Step 2: rewrite each fraction with denominator ${lcmDen}.`);
    lines.push(`  ${fmt(x)} → multiplier is ${lcmDen}/${x[1]} = ${xMul} → top×${xMul} = ${xConv[0]}, bottom×${xMul} = ${lcmDen} → ${fmt(xConv)}.`);
    lines.push(`  ${fmt(y)} → multiplier is ${lcmDen}/${y[1]} = ${yMul} → top×${yMul} = ${yConv[0]}, bottom×${yMul} = ${lcmDen} → ${fmt(yConv)}.`);
    lines.push(`Step 3: add the tops. ${xConv[0]}/${lcmDen} + ${yConv[0]}/${lcmDen} = ${sumTop}/${lcmDen}.`);
    if (fmt([sumTop, lcmDen]) !== fmtFrac(ans)) {
      lines.push(`Reduce: ${sumTop}/${lcmDen} = ${fmtFrac(ans)} (divided top and bottom by ${gcd(Math.abs(sumTop), lcmDen)}).`);
    } else {
      lines.push(`Already in lowest terms: ${fmtFrac(ans)}.`);
    }
  }
  return lines.join("\n");
}

function explainFracSub(x: Frac, y: Frac): string {
  const lcmDen = (x[1] * y[1]) / gcd(x[1], y[1]);
  const xMul = lcmDen / x[1];
  const yMul = lcmDen / y[1];
  const xConv: Frac = [x[0] * xMul, lcmDen];
  const yConv: Frac = [y[0] * yMul, lcmDen];
  const ans = fracSub(x, y);
  const lines: string[] = [];
  if (x[1] === y[1]) {
    lines.push(`Same denominator — subtract the tops.`);
    lines.push(`(${x[0]} − ${y[0]}) / ${x[1]} = ${x[0] - y[0]}/${x[1]} = ${fmtFrac(ans)}.`);
  } else {
    lines.push(`Step 1: LCM(${x[1]}, ${y[1]}) = ${lcmDen}.`);
    lines.push(`Step 2: rewrite. ${fmt(x)} = ${fmt(xConv)}; ${fmt(y)} = ${fmt(yConv)}.`);
    lines.push(`Step 3: ${xConv[0]}/${lcmDen} − ${yConv[0]}/${lcmDen} = ${xConv[0] - yConv[0]}/${lcmDen} = ${fmtFrac(ans)}.`);
  }
  return lines.join("\n");
}

function explainFracMul(x: Frac, y: Frac): string {
  const ans = fracMul(x, y);
  return [
    `Multiply tops, multiply bottoms.`,
    `(${x[0]} × ${y[0]}) / (${x[1]} × ${y[1]}) = ${x[0] * y[0]}/${x[1] * y[1]} = ${fmtFrac(ans)}.`,
  ].join("\n");
}

function explainFracDiv(x: Frac, y: Frac): string {
  const ans = fracDiv(x, y);
  return [
    `Divide by a fraction = multiply by its inverse.`,
    `${fmt(x)} ÷ ${fmt(y)} = ${fmt(x)} × ${fmt([y[1], y[0]])} = ${fmtFrac(ans)}.`,
  ].join("\n");
}

function explainPeriodic(q: {
  symbol: string;
  elementName: string;
  ask: "P" | "N" | "e";
  answer: number;
}): string {
  const what =
    q.ask === "P"
      ? "protons (its atomic number)"
      : q.ask === "N"
        ? "neutrons (most common isotope)"
        : "electrons (neutral atom — same as protons)";
  return `${q.elementName} (${q.symbol}) has ${q.answer} ${what}.`;
}

function explainWar(q: { name: string; answer: number }): string {
  return `The ${q.name} started in ${q.answer}.`;
}

function explainEvolution(q: {
  event: string;
  answerMya: number;
  tolerance: number;
}): string {
  return `${q.event} happened approximately ${q.answerMya} million years ago (±${q.tolerance} accepted).`;
}

export function renderExplanation(q: Question): string {
  switch (q.kind) {
    case "gcf":
      return explainGcf(q.a, q.b);
    case "lcm":
      return explainLcm(q.a, q.b);
    case "fracAdd":
      return explainFracAdd(q.x, q.y);
    case "fracSub":
      return explainFracSub(q.x, q.y);
    case "fracMul":
      return explainFracMul(q.x, q.y);
    case "fracDiv":
      return explainFracDiv(q.x, q.y);
    case "fracInverse": {
      const v =
        typeof q.value === "number" ? `${q.value}` : fmt(q.value);
      return `Inverse of ${v} = ${fmtFrac(q.answer)} (swap top and bottom).`;
    }
    case "periodic":
      return explainPeriodic(q);
    case "war":
      return explainWar(q);
    case "evolution":
      return explainEvolution(q);
  }
}

const KIND_LABEL: Record<Question["kind"], string> = {
  gcf: "GCF",
  lcm: "LCM",
  fracAdd: "Fraction add",
  fracSub: "Fraction subtract",
  fracMul: "Fraction multiply",
  fracDiv: "Fraction divide",
  fracInverse: "Inverse",
  periodic: "Periodic table",
  war: "History",
  evolution: "Evolution",
};

// ── Digest: a stable JSON-ish shape we feed to the LLM and the template ─

export interface AnswerLine {
  index: number;
  kind: Question["kind"];
  kindLabel: string;
  prompt: string;
  expected: string;
  userDisplay: string;
  correct: boolean;
  note: string;
  usedHelp: boolean;
  secondsSpent: number;
  /** Step-by-step derivation of the correct answer, multi-line plain text. */
  explanation: string;
}

export interface SubjectAgg {
  kind: Question["kind"];
  kindLabel: string;
  total: number;
  correct: number;
  /** Total time spent across questions of this kind, in seconds. */
  totalSeconds: number;
}

export interface Digest {
  studentName: string;
  date: string;
  dayTitle: string;
  version: "a" | "b";
  score: number;
  total: number;
  pct: number;
  durationSec: number;
  startedAtIso: string;
  submittedAtIso: string;
  perKind: SubjectAgg[];
  lines: AnswerLine[];
  notesCount: number;
  helpUsedCount: number;
  blankCount: number;
}

export function buildDigest({
  profile,
  day,
  result,
}: {
  profile: Profile;
  day: Day;
  result: ExamResult;
}): Digest {
  const allQs = [...day.versionA, ...day.versionB];
  const byId = new Map(allQs.map((q) => [q.id, q] as const));

  const lines: AnswerLine[] = result.answers.map((a, i) => {
    const q = byId.get(a.questionId);
    return {
      index: i,
      kind: q?.kind ?? "gcf",
      kindLabel: q ? KIND_LABEL[q.kind] : "Unknown",
      prompt: q ? renderPrompt(q) : a.questionId,
      expected: a.expected,
      userDisplay: a.userDisplay,
      correct: a.correct,
      note: a.note ?? "",
      usedHelp: a.usedHelp,
      secondsSpent: a.secondsSpent,
      explanation: q ? renderExplanation(q) : "",
    };
  });

  const perKindMap = new Map<Question["kind"], SubjectAgg>();
  for (const ln of lines) {
    const cur = perKindMap.get(ln.kind) ?? {
      kind: ln.kind,
      kindLabel: ln.kindLabel,
      total: 0,
      correct: 0,
      totalSeconds: 0,
    };
    cur.total += 1;
    if (ln.correct) cur.correct += 1;
    cur.totalSeconds += ln.secondsSpent;
    perKindMap.set(ln.kind, cur);
  }

  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;

  return {
    studentName: profile.name,
    date: result.date,
    dayTitle: day.title,
    version: result.version,
    score: result.score,
    total: result.total,
    pct,
    durationSec: result.durationSec,
    startedAtIso: result.startedAt
      ? new Date(result.startedAt).toISOString()
      : "",
    submittedAtIso: result.submittedAt,
    perKind: Array.from(perKindMap.values()).sort((a, b) =>
      a.kindLabel.localeCompare(b.kindLabel),
    ),
    lines,
    notesCount: lines.filter((l) => l.note.trim().length > 0).length,
    helpUsedCount: lines.filter((l) => l.usedHelp).length,
    blankCount: lines.filter(
      (l) =>
        l.userDisplay === "(blank)" || l.userDisplay.startsWith("(undefined"),
    ).length,
  };
}

// ── LLM narrative ───────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You write an end-of-day debrief for parents who have agreed to ZERO involvement in their kid's homeschooling. The deal between the parents and their son is:

> "I have zero involvement in your home schooling. Only no PC, no phone between 9:00 and 13:30, and you pass an automated test online every day. You find how to learn and how to make it work."

Your debrief is the parents' only window into the day. Tone:
- Honest. Not soft, not cheerleading. Don't congratulate; don't scold.
- Concrete. Refer to specific question kinds, specific notes, specific timings.
- Non-prescriptive. NEVER suggest the parents intervene, coach, or talk to him about a specific topic. NEVER suggest he should study X tomorrow. The parents are out by design.
- Brief. 4–8 short paragraphs, max ~250 words. No bullet salad — write like a coach taking notes after a game.
- Always third-person ("Adam") about the student. Address the parents implicitly.

Structure (in order, but no headings):
1. One-line bottom line: did he pass the day's bar (rule of thumb: ≥80% = solid, 60–79% = uneven, <60% = struggled).
2. Where he was strong and where he was weak, by subject area.
3. What his notes reveal about his state of mind (honest engagement vs. flat / vs. frustrated). Quote or paraphrase the most informative note if any.
4. Time signature: how long he took, whether the time looks deliberate or rushed (very fast + many wrong = rushed; long total + many right = methodical; long total + many wrong = stuck).
5. Trial-fit observation: did this look like a kid running his own school, or did it look like a kid going through the motions?

NEVER speculate about emotions you can't see in the data. NEVER end with advice or "next steps". Just observations.`;

function buildUserPrompt(d: Digest): string {
  const lines = d.lines
    .map((l) => {
      const note = l.note.trim()
        ? ` // note: ${JSON.stringify(l.note.trim())}`
        : "";
      const help = l.usedHelp ? " [opened lesson]" : "";
      return `  ${l.index + 1}. [${l.kindLabel}] ${l.prompt} → his "${l.userDisplay}" vs correct "${l.expected}" — ${l.correct ? "RIGHT" : "WRONG"} (${l.secondsSpent}s)${help}${note}`;
    })
    .join("\n");

  const perKind = d.perKind
    .map(
      (k) =>
        `  - ${k.kindLabel}: ${k.correct}/${k.total} correct, ~${k.totalSeconds}s total`,
    )
    .join("\n");

  const totalMin = Math.floor(d.durationSec / 60);
  const totalSec = d.durationSec % 60;

  return `Student: ${d.studentName}
Day: ${d.dayTitle} (${d.date})
Exam version: ${d.version.toUpperCase()}
Score: ${d.score}/${d.total} (${d.pct}%)
Total exam time: ${totalMin}m ${totalSec}s
Notes left: ${d.notesCount}/${d.total}
Lessons opened during exam: ${d.helpUsedCount}/${d.total}
Blank/undefined answers: ${d.blankCount}/${d.total}

Per-subject breakdown:
${perKind}

Per-question detail:
${lines}

Now write the parent debrief, following the structure in the system prompt.`;
}

export async function generateNarrative(d: Digest): Promise<string> {
  const r = await chatComplete({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(d) },
    ],
    temperature: 0.4,
    maxTokens: 700,
  });
  if (r.ok) return r.text.trim();
  // Don't crash the email if the LLM is down — emit a minimal, factual fallback.
  return fallbackNarrative(d, r.error);
}

function fallbackNarrative(d: Digest, err?: string): string {
  return [
    `Adam scored ${d.score}/${d.total} (${d.pct}%) on day ${d.date}.`,
    `Total exam time: ${Math.floor(d.durationSec / 60)}m ${d.durationSec % 60}s.`,
    `${d.notesCount} of ${d.total} questions had notes attached. Lessons were opened during ${d.helpUsedCount} questions.`,
    err
      ? `(LLM narrative unavailable: ${err}. Question-by-question detail follows below.)`
      : `Question-by-question detail follows below.`,
  ].join(" ");
}

// ── HTML rendering ──────────────────────────────────────────────────────

function escape(html: string): string {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin: 0 0 14px 0;">${escape(p).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function fmtSec(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export function renderEmailHtml(d: Digest, narrative: string): string {
  const headerColor =
    d.pct >= 80 ? "#059669" : d.pct >= 60 ? "#d97706" : "#dc2626";

  const perKindRows = d.perKind
    .map(
      (k) => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${escape(k.kindLabel)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-variant-numeric:tabular-nums;">${k.correct}/${k.total}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-variant-numeric:tabular-nums;color:#6b7280;">${fmtSec(k.totalSeconds)}</td>
        </tr>`,
    )
    .join("");

  const detailRows = d.lines
    .map((l) => {
      const tone = l.correct
        ? "background:#ecfdf5;color:#065f46;"
        : "background:#fef2f2;color:#991b1b;";
      const helpBadge = l.usedHelp
        ? `<span style="margin-left:6px;padding:1px 6px;border-radius:9999px;background:#eef2ff;color:#3730a3;font-size:10px;font-weight:600;text-transform:uppercase;">opened lesson</span>`
        : "";
      const noteBlock = l.note.trim()
        ? `<div style="margin-top:6px;padding:8px 10px;background:#f9fafb;border-left:3px solid #6366f1;color:#374151;font-size:13px;white-space:pre-wrap;">${escape(l.note.trim())}</div>`
        : "";
      // The explanation is shown for every question, but framed
      // differently when the kid got it wrong (prominent yellow box) vs.
      // right (subtle gray, collapsed visually).
      const explainStyle = l.correct
        ? "margin-top:6px;padding:6px 10px;background:#f9fafb;border-left:3px solid #d1d5db;color:#6b7280;font-size:12px;white-space:pre-wrap;font-family:'SF Mono',Menlo,Consolas,monospace;"
        : "margin-top:6px;padding:8px 10px;background:#fefce8;border-left:3px solid #eab308;color:#713f12;font-size:13px;white-space:pre-wrap;font-family:'SF Mono',Menlo,Consolas,monospace;line-height:1.5;";
      const explainLabel = l.correct
        ? `<div style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#9ca3af;font-weight:600;margin-bottom:2px;">How it works</div>`
        : `<div style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#a16207;font-weight:700;margin-bottom:2px;">Here's the correct path</div>`;
      const explainBlock = l.explanation
        ? `<div style="${explainStyle}">${explainLabel}${escape(l.explanation)}</div>`
        : "";
      return `
        <tr>
          <td style="padding:10px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top;font-variant-numeric:tabular-nums;color:#6b7280;width:32px;">${l.index + 1}</td>
          <td style="padding:10px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#9ca3af;font-weight:600;">${escape(l.kindLabel)}</div>
            <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:14px;color:#111827;margin-top:2px;">${escape(l.prompt)}${helpBadge}</div>
            ${noteBlock}
            ${explainBlock}
          </td>
          <td style="padding:10px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:13px;${tone}border-radius:4px;">${escape(l.userDisplay)}</td>
          <td style="padding:10px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:13px;color:#111827;">${escape(l.expected)}</td>
          <td style="padding:10px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top;font-variant-numeric:tabular-nums;color:#6b7280;font-size:12px;text-align:right;">${l.secondsSpent > 0 ? fmtSec(l.secondsSpent) : "—"}</td>
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Daily Trial — ${escape(d.studentName)} — ${escape(d.date)}</title>
  </head>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="padding:24px 28px;border-bottom:1px solid #e5e7eb;">
        <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#6366f1;font-weight:700;margin-bottom:4px;">
          Daily homeschool trial
        </div>
        <div style="font-size:22px;font-weight:700;color:#0f172a;line-height:1.25;">
          ${escape(d.studentName)} — ${escape(d.date)}
        </div>
        <div style="font-size:14px;color:#4b5563;margin-top:6px;">
          ${escape(d.dayTitle)} · Version ${d.version.toUpperCase()}
        </div>
      </div>

      <div style="padding:20px 28px;display:flex;flex-wrap:wrap;gap:24px;border-bottom:1px solid #e5e7eb;">
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#9ca3af;font-weight:600;letter-spacing:.04em;">Score</div>
          <div style="font-size:28px;font-weight:700;color:${headerColor};font-variant-numeric:tabular-nums;">${d.score} / ${d.total}</div>
          <div style="font-size:13px;color:#6b7280;font-variant-numeric:tabular-nums;">${d.pct}%</div>
        </div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#9ca3af;font-weight:600;letter-spacing:.04em;">Time</div>
          <div style="font-size:28px;font-weight:700;color:#0f172a;font-variant-numeric:tabular-nums;">${fmtSec(d.durationSec)}</div>
          <div style="font-size:13px;color:#6b7280;">${d.startedAtIso ? `started ${escape(fmtNyDateTime(d.startedAtIso))}` : ""}</div>
        </div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#9ca3af;font-weight:600;letter-spacing:.04em;">Notes</div>
          <div style="font-size:28px;font-weight:700;color:#0f172a;font-variant-numeric:tabular-nums;">${d.notesCount}</div>
          <div style="font-size:13px;color:#6b7280;">of ${d.total} questions</div>
        </div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#9ca3af;font-weight:600;letter-spacing:.04em;">Lessons opened</div>
          <div style="font-size:28px;font-weight:700;color:#0f172a;font-variant-numeric:tabular-nums;">${d.helpUsedCount}</div>
          <div style="font-size:13px;color:#6b7280;">during the exam</div>
        </div>
      </div>

      <div style="padding:24px 28px;border-bottom:1px solid #e5e7eb;">
        <div style="font-size:11px;text-transform:uppercase;color:#9ca3af;font-weight:600;letter-spacing:.04em;margin-bottom:10px;">Debrief</div>
        <div style="font-size:15px;line-height:1.55;color:#111827;">${paragraphs(narrative)}</div>
      </div>

      <div style="padding:24px 28px;border-bottom:1px solid #e5e7eb;">
        <div style="font-size:11px;text-transform:uppercase;color:#9ca3af;font-weight:600;letter-spacing:.04em;margin-bottom:10px;">By subject</div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr>
              <th align="left" style="padding:6px 10px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Subject</th>
              <th align="right" style="padding:6px 10px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Correct</th>
              <th align="right" style="padding:6px 10px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Time</th>
            </tr>
          </thead>
          <tbody>${perKindRows}</tbody>
        </table>
      </div>

      <div style="padding:24px 28px;">
        <div style="font-size:11px;text-transform:uppercase;color:#9ca3af;font-weight:600;letter-spacing:.04em;margin-bottom:10px;">Question by question</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr>
              <th align="left" style="padding:6px 10px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">#</th>
              <th align="left" style="padding:6px 10px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Prompt + Note</th>
              <th align="left" style="padding:6px 10px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">His answer</th>
              <th align="left" style="padding:6px 10px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Correct</th>
              <th align="right" style="padding:6px 10px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Time</th>
            </tr>
          </thead>
          <tbody>${detailRows}</tbody>
        </table>
      </div>

      <div style="padding:18px 28px;background:#f9fafb;color:#9ca3af;font-size:12px;">
        Sent automatically by the daily trial app at teacher.ninja/daily.
        The student does not see this email.
      </div>
    </div>
  </body>
</html>`;
}

// ── Top-level entry: build everything and send ──────────────────────────

export interface SendDailySummaryArgs {
  profile: Profile;
  day: Day;
  version: "a" | "b";
  result: ExamResult;
  /** Override recipients; defaults to PARENT_EMAILS. */
  to?: readonly string[];
}

export interface SendDailySummaryResult {
  ok: boolean;
  email?: SendEmailResult;
  digest?: Digest;
  narrative?: string;
  error?: string;
}

export async function sendDailySummary(
  args: SendDailySummaryArgs,
): Promise<SendDailySummaryResult> {
  try {
    const digest = buildDigest({
      profile: args.profile,
      day: args.day,
      result: args.result,
    });
    const narrative = await generateNarrative(digest);
    const html = renderEmailHtml(digest, narrative);
    const subject = `Daily ${digest.date} — ${digest.studentName} ${digest.score}/${digest.total} (${digest.pct}%)`;
    const email = await sendEmail({
      to: [...(args.to ?? PARENT_EMAILS)],
      subject,
      html,
    });
    return { ok: email.ok, email, digest, narrative };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}
