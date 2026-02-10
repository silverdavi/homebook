"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Check, X, Heart } from "lucide-react";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, HeartRecovery, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxGameOver, sfxAchievement, sfxHeart, sfxCountdownGo } from "@/lib/games/audio";
import { createAdaptiveState, adaptiveUpdate, getFractionParams, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import Link from "next/link";

type GamePhase = "menu" | "countdown" | "playing" | "feedback" | "complete";
type ChallengeType = "identify" | "compare" | "add" | "subtract" | "multiply" | "equivalent" | "simplify" | "mixed-to-improper" | "improper-to-mixed" | "fraction-of-number" | "gcf" | "lcm";

/** Visual hint level — fades as player progresses */
type VisualHint = "full" | "reduced" | "none";

interface Challenge {
  type: ChallengeType;
  question: string;
  visual: { n: number; d: number }[];
  choices: string[];
  answer: string;
  explanation: string;
  visualHint: VisualHint;
}

/** Determine visual hint level based on difficulty and toggle */
function getVisualHint(solved: number, difficulty: string, showHints: boolean): VisualHint {
  if (!showHints) return "none";
  if (difficulty === "expert") return "none";
  if (difficulty === "advanced") return solved < 4 ? "reduced" : "none";
  if (difficulty === "intermediate") return solved < 6 ? "full" : solved < 14 ? "reduced" : "none";
  // beginner: generous visuals
  return solved < 10 ? "full" : solved < 20 ? "reduced" : "none";
}

// ── Visual fraction bar ──

function FractionBar({
  n,
  d,
  color,
  width = "100%",
  height = 32,
  showLabel = true,
  animate = false,
}: {
  n: number;
  d: number;
  color: string;
  width?: string | number;
  height?: number;
  showLabel?: boolean;
  animate?: boolean;
}) {
  // For improper fractions (n > d), show multiple bars
  const wholeBars = Math.floor(n / d);
  const remainder = n % d;
  const barCount = wholeBars + (remainder > 0 ? 1 : 0);

  if (barCount > 1) {
    return (
      <div className="flex flex-col items-center gap-1" style={{ width }}>
        <div className="flex gap-1 w-full">
          {Array.from({ length: barCount }).map((_, barIdx) => {
            const filled = barIdx < wholeBars ? d : remainder;
            return (
              <div
                key={barIdx}
                className="flex-1 rounded-lg overflow-hidden border border-white/20 relative"
                style={{ height }}
              >
                {Array.from({ length: d }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0"
                    style={{
                      left: `${(i / d) * 100}%`,
                      width: `${(1 / d) * 100}%`,
                      borderRight: i < d - 1 ? "1px solid rgba(255,255,255,0.15)" : "none",
                    }}
                  >
                    <div
                      className={`h-full ${animate ? "transition-all duration-500" : ""}`}
                      style={{
                        backgroundColor: i < filled ? color : "rgba(255,255,255,0.05)",
                        opacity: i < filled ? 0.8 : 1,
                      }}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {showLabel && (
          <span className="text-xs text-slate-400 tabular-nums">
            {n}/{d}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1" style={{ width }}>
      <div
        className="w-full rounded-lg overflow-hidden border border-white/20 relative"
        style={{ height }}
      >
        {/* Divisions */}
        {Array.from({ length: d }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{
              left: `${(i / d) * 100}%`,
              width: `${(1 / d) * 100}%`,
              borderRight: i < d - 1 ? "1px solid rgba(255,255,255,0.15)" : "none",
            }}
          >
            <div
              className={`h-full ${animate ? "transition-all duration-500" : ""}`}
              style={{
                backgroundColor: i < n ? color : "rgba(255,255,255,0.05)",
                opacity: i < n ? 0.8 : 1,
              }}
            />
          </div>
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-slate-400 tabular-nums">
          {n}/{d}
        </span>
      )}
    </div>
  );
}

// ── Pie fraction visual ──

function FractionPie({ n, d, color, size = 80, showLabel = false }: { n: number; d: number; color: string; size?: number; showLabel?: boolean }) {
  const sliceAngle = 360 / d;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        {Array.from({ length: d }).map((_, i) => {
          const startAngle = (i * sliceAngle - 90) * (Math.PI / 180);
          const endAngle = ((i + 1) * sliceAngle - 90) * (Math.PI / 180);
          const x1 = 50 + 48 * Math.cos(startAngle);
          const y1 = 50 + 48 * Math.sin(startAngle);
          const x2 = 50 + 48 * Math.cos(endAngle);
          const y2 = 50 + 48 * Math.sin(endAngle);
          const largeArc = sliceAngle > 180 ? 1 : 0;
          return (
            <g key={i}>
              <path
                d={`M 50 50 L ${x1} ${y1} A 48 48 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={i < n ? color : "rgba(255,255,255,0.05)"}
                opacity={i < n ? 0.8 : 1}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="0.5"
              />
            </g>
          );
        })}
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white/80">{n}/{d}</span>
        </div>
      )}
    </div>
  );
}

// ── Challenge generators ──

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

function lcm(a: number, b: number): number { return (a * b) / gcd(a, b); }

function genIdentify(level: number, vh: VisualHint): Challenge {
  const maxD = Math.min(3 + level, 12);
  const d = Math.floor(Math.random() * (maxD - 1)) + 2;
  const n = Math.floor(Math.random() * d) + 1;

  const wrongs: string[] = [];
  while (wrongs.length < 3) {
    const wn = Math.floor(Math.random() * d) + 1;
    const wd = d + (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.5 ? 1 : 0);
    const s = `${wn}/${Math.max(2, wd)}`;
    if (s !== `${n}/${d}` && !wrongs.includes(s)) wrongs.push(s);
  }

  return {
    type: "identify",
    question: vh === "none" ? `A shape has ${n} out of ${d} parts shaded. What fraction is that?` : "What fraction is shown?",
    visual: [{ n, d }],
    choices: [...wrongs, `${n}/${d}`].sort(() => Math.random() - 0.5),
    answer: `${n}/${d}`,
    explanation: `Step 1: Count the shaded parts — ${n}.\nStep 2: Count the total parts — ${d}.\nStep 3: Write as a fraction: ${n}/${d} (${(n / d * 100).toFixed(0)}% of the whole).`,
    visualHint: vh,
  };
}

function genCompare(level: number, vh: VisualHint): Challenge {
  const maxD = Math.min(4 + level, 12);

  // ~25% chance of equal fractions (using equivalent fractions, not identical)
  if (Math.random() < 0.25) {
    const d1 = Math.floor(Math.random() * (maxD - 2)) + 2;
    const n1 = Math.floor(Math.random() * (d1 - 1)) + 1;
    const mult = Math.floor(Math.random() * 3) + 2;
    const n2 = n1 * mult;
    const d2 = d1 * mult;
    return {
      type: "compare",
      question: "Which fraction is larger?",
      visual: [{ n: n1, d: d1 }, { n: n2, d: d2 }],
      choices: [`${n1}/${d1}`, `${n2}/${d2}`, "Equal"],
      answer: "Equal",
      explanation: `Step 1: Convert to decimals — ${n1}/${d1} = ${(n1 / d1).toFixed(3)} and ${n2}/${d2} = ${(n2 / d2).toFixed(3)}.\nStep 2: They are equal! ${n2}/${d2} simplifies to ${n1}/${d1} (divide top and bottom by ${mult}).\nCross-multiply check: ${n1}×${d2} = ${n1 * d2} and ${n2}×${d1} = ${n2 * d1} — equal!`,
      visualHint: vh,
    };
  }

  // Generate unequal fractions
  const d1 = Math.floor(Math.random() * (maxD - 2)) + 2;
  const d2 = Math.floor(Math.random() * (maxD - 2)) + 2;
  const n1 = Math.floor(Math.random() * (d1 - 1)) + 1;
  const n2 = Math.floor(Math.random() * (d2 - 1)) + 1;
  const v1 = n1 / d1;
  const v2 = n2 / d2;
  if (Math.abs(v1 - v2) < 0.01) return genCompare(level, vh);
  const larger = v1 > v2 ? `${n1}/${d1}` : `${n2}/${d2}`;
  const answer = larger;
  return {
    type: "compare",
    question: "Which fraction is larger?",
    visual: [{ n: n1, d: d1 }, { n: n2, d: d2 }],
    choices: [`${n1}/${d1}`, `${n2}/${d2}`, "Equal"],
    answer,
    explanation: `Step 1: Convert to decimals — ${n1}/${d1} = ${v1.toFixed(3)}, ${n2}/${d2} = ${v2.toFixed(3)}.\nStep 2: ${v1 > v2 ? `${n1}/${d1}` : `${n2}/${d2}`} is larger.\nCross-multiply: ${n1}×${d2} = ${n1 * d2} vs ${n2}×${d1} = ${n2 * d1} — ${n1 * d2 > n2 * d1 ? `${n1 * d2} > ${n2 * d1}` : `${n2 * d1} > ${n1 * d2}`}.`,
    visualHint: vh,
  };
}

function genAdd(level: number, vh: VisualHint): Challenge {
  const d = Math.min(2 + Math.floor(level / 2), 10);
  const n1 = Math.floor(Math.random() * (d - 1)) + 1;
  const n2 = Math.floor(Math.random() * (d - n1)) + 1;
  const sum = n1 + n2;
  const g = gcd(sum, d);
  const simplified = `${sum / g}/${d / g}`;
  const unsimplified = `${sum}/${d}`;
  const answer = sum === d ? "1" : sum / g === sum && d / g === d ? unsimplified : simplified;

  const wrongs: string[] = [];
  while (wrongs.length < 3) {
    const wn = Math.floor(Math.random() * d) + 1;
    const wd = d + (Math.random() > 0.5 ? 1 : 0);
    const s = wn === wd ? "1" : `${wn}/${wd}`;
    if (s !== answer && !wrongs.includes(s)) wrongs.push(s);
  }

  return {
    type: "add",
    question: `${n1}/${d} + ${n2}/${d} = ?`,
    visual: [{ n: n1, d }, { n: n2, d }],
    choices: [...wrongs, answer].sort(() => Math.random() - 0.5),
    answer,
    explanation: `Step 1: Same denominator (${d}) — add numerators: ${n1} + ${n2} = ${sum}.\nStep 2: Result = ${sum}/${d}.${sum !== d && g > 1 ? `\nStep 3: Simplify — GCF(${sum}, ${d}) = ${g}, so ${sum}÷${g} / ${d}÷${g} = ${simplified}.` : sum === d ? `\nStep 3: ${sum}/${d} = 1 (a whole!).` : ""}`,
    visualHint: vh,
  };
}

function genEquivalent(level: number, vh: VisualHint): Challenge {
  const d = Math.min(2 + level, 8);
  const n = Math.floor(Math.random() * (d - 1)) + 1;
  const mult = Math.floor(Math.random() * 3) + 2;
  const eqN = n * mult;
  const eqD = d * mult;

  const wrongs: string[] = [];
  while (wrongs.length < 3) {
    const wm = Math.floor(Math.random() * 4) + 2;
    const wn = n * wm + (Math.random() > 0.5 ? 1 : -1);
    const wd = d * wm;
    const s = `${Math.max(1, wn)}/${wd}`;
    if (s !== `${eqN}/${eqD}` && !wrongs.includes(s)) wrongs.push(s);
  }

  return {
    type: "equivalent",
    question: `Which fraction equals ${n}/${d}?`,
    visual: [{ n, d }],
    choices: [...wrongs, `${eqN}/${eqD}`].sort(() => Math.random() - 0.5),
    answer: `${eqN}/${eqD}`,
    explanation: `Step 1: Multiply numerator and denominator by ${mult}.\nStep 2: ${n}×${mult} = ${eqN}, ${d}×${mult} = ${eqD}.\nStep 3: ${n}/${d} = ${eqN}/${eqD} — same value, different form!`,
    visualHint: vh,
  };
}

// ── NEW: Simplify fractions (uses GCF) ──

function genSimplify(level: number, vh: VisualHint): Challenge {
  const baseDenoms = [2, 3, 4, 5, 6, 8, 10, 12];
  const d0 = baseDenoms[Math.min(level, baseDenoms.length - 1)];
  const n0 = Math.floor(Math.random() * (d0 - 1)) + 1;
  const g = gcd(n0, d0);
  // Make sure we have something to simplify
  const mult = g === 1 ? (Math.floor(Math.random() * 3) + 2) : 1;
  const n = n0 * mult;
  const d = d0 * mult;
  const simpN = n / gcd(n, d);
  const simpD = d / gcd(n, d);
  const answer = simpN === simpD ? "1" : `${simpN}/${simpD}`;

  const wrongs: string[] = [];
  while (wrongs.length < 3) {
    const wn = Math.max(1, simpN + Math.floor(Math.random() * 3) - 1);
    const wd = Math.max(2, simpD + Math.floor(Math.random() * 3) - 1);
    const s = wn === wd ? "1" : `${wn}/${wd}`;
    if (s !== answer && !wrongs.includes(s)) wrongs.push(s);
  }

  return {
    type: "simplify",
    question: `Simplify ${n}/${d}`,
    visual: [{ n, d }],
    choices: [...wrongs, answer].sort(() => Math.random() - 0.5),
    answer,
    explanation: `Step 1: Find GCF(${n}, ${d}) = ${gcd(n, d)}.\nStep 2: Divide numerator: ${n} ÷ ${gcd(n, d)} = ${n / gcd(n, d)}.\nStep 3: Divide denominator: ${d} ÷ ${gcd(n, d)} = ${d / gcd(n, d)}.\nResult: ${answer}.`,
    visualHint: vh,
  };
}

// ── NEW: GCF (Greatest Common Factor) ──

function genGCF(level: number, vh: VisualHint): Challenge {
  const ranges = [
    [4, 12], [6, 18], [8, 24], [10, 36], [12, 48],
  ];
  const [lo, hi] = ranges[Math.min(level - 1, ranges.length - 1)];
  const a = lo + Math.floor(Math.random() * (hi - lo + 1));
  let b = lo + Math.floor(Math.random() * (hi - lo + 1));
  if (b === a) b = a + Math.floor(Math.random() * 4) + 1;
  const ans = gcd(a, b);

  const wrongs: string[] = [];
  const candidates = [1, 2, 3, 4, 5, 6, 8, 9, 10, 12].filter((c) => c !== ans && c <= Math.max(a, b));
  while (wrongs.length < 3 && candidates.length > 0) {
    const idx = Math.floor(Math.random() * candidates.length);
    wrongs.push(String(candidates[idx]));
    candidates.splice(idx, 1);
  }

  // Visual: show a as a fraction visual (a parts of a whole) — optional
  return {
    type: "gcf",
    question: `What is the GCF of ${a} and ${b}?`,
    visual: [{ n: a, d: a }, { n: b, d: b }], // placeholder — visuals are custom for GCF
    choices: [...wrongs, String(ans)].sort(() => Math.random() - 0.5),
    answer: String(ans),
    explanation: `Step 1: Factors of ${a} = {${getFactors(a).join(", ")}}.\nStep 2: Factors of ${b} = {${getFactors(b).join(", ")}}.\nStep 3: Common factors = {${getFactors(a).filter(f => b % f === 0).join(", ")}}.\nGreatest = ${ans}.`,
    visualHint: vh,
  };
}

function getFactors(n: number): number[] {
  const f: number[] = [];
  for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i);
  return f;
}

// ── NEW: LCM (Least Common Multiple) ──

function genLCM(level: number, vh: VisualHint): Challenge {
  const small = [2, 3, 4, 5, 6, 8, 9, 10, 12];
  const a = small[Math.floor(Math.random() * Math.min(3 + level, small.length))];
  let b = small[Math.floor(Math.random() * Math.min(3 + level, small.length))];
  if (b === a) b = small[(small.indexOf(a) + 1) % small.length];
  const ans = lcm(a, b);

  const wrongs: string[] = [];
  const candidates = [a * b, a + b, Math.max(a, b), ans * 2, ans - a].filter(
    (c) => c !== ans && c > 0 && !wrongs.includes(String(c))
  );
  while (wrongs.length < 3 && candidates.length > 0) {
    const idx = Math.floor(Math.random() * candidates.length);
    wrongs.push(String(candidates[idx]));
    candidates.splice(idx, 1);
  }
  // Fill remaining wrongs if needed
  let fill = ans + 1;
  while (wrongs.length < 3) {
    if (fill !== ans && !wrongs.includes(String(fill))) wrongs.push(String(fill));
    fill++;
  }

  const multiplesA = Array.from({ length: 6 }, (_, i) => a * (i + 1));
  const multiplesB = Array.from({ length: 6 }, (_, i) => b * (i + 1));

  return {
    type: "lcm",
    question: `What is the LCM of ${a} and ${b}?`,
    visual: [{ n: a, d: a }, { n: b, d: b }], // placeholder
    choices: [...wrongs, String(ans)].sort(() => Math.random() - 0.5),
    answer: String(ans),
    explanation: `Step 1: Multiples of ${a}: ${multiplesA.join(", ")}…\nStep 2: Multiples of ${b}: ${multiplesB.join(", ")}…\nStep 3: Smallest common multiple = ${ans}.\nShortcut: LCM = (${a}×${b}) ÷ GCF(${a},${b}) = ${a * b} ÷ ${gcd(a, b)} = ${ans}.`,
    visualHint: vh,
  };
}

// ── Subtract fractions (same denominator) ──

function genSubtract(level: number, vh: VisualHint): Challenge {
  const d = Math.min(2 + Math.floor(level / 2), 10);
  const n1 = Math.floor(Math.random() * (d - 1)) + 2; // at least 2 so we can subtract
  const n2 = Math.floor(Math.random() * (n1 - 1)) + 1; // smaller than n1
  const diff = n1 - n2;
  const g = gcd(diff, d);
  const simplified = `${diff / g}/${d / g}`;
  const answer = diff === 0 ? "0" : diff === d ? "1" : g > 1 ? simplified : `${diff}/${d}`;

  const wrongs: string[] = [];
  while (wrongs.length < 3) {
    const wn = Math.floor(Math.random() * d) + 1;
    const wd = d + (Math.random() > 0.5 ? 1 : 0);
    const s = wn === wd ? "1" : `${wn}/${Math.max(2, wd)}`;
    if (s !== answer && !wrongs.includes(s)) wrongs.push(s);
  }

  return {
    type: "subtract",
    question: `${n1}/${d} − ${n2}/${d} = ?`,
    visual: [{ n: n1, d }, { n: n2, d }],
    choices: [...wrongs, answer].sort(() => Math.random() - 0.5),
    answer,
    explanation: `Step 1: Same denominator (${d}) — subtract numerators: ${n1} − ${n2} = ${diff}.\nStep 2: Result = ${diff}/${d}.${g > 1 ? `\nStep 3: Simplify — GCF(${diff}, ${d}) = ${g}, so ${diff}÷${g} / ${d}÷${g} = ${simplified}.` : ""}`,
    visualHint: vh,
  };
}

// ── Multiply two fractions ──

function genMultiply(level: number, vh: VisualHint): Challenge {
  const maxD = Math.min(3 + level, 8);
  const d1 = Math.floor(Math.random() * (maxD - 1)) + 2;
  const d2 = Math.floor(Math.random() * (maxD - 1)) + 2;
  const n1 = Math.floor(Math.random() * (d1 - 1)) + 1;
  const n2 = Math.floor(Math.random() * (d2 - 1)) + 1;
  const prodN = n1 * n2;
  const prodD = d1 * d2;
  const g = gcd(prodN, prodD);
  const simpN = prodN / g;
  const simpD = prodD / g;
  const answer = simpN === simpD ? "1" : simpD === 1 ? `${simpN}` : `${simpN}/${simpD}`;

  const wrongs: string[] = [];
  while (wrongs.length < 3) {
    const wn = Math.max(1, simpN + Math.floor(Math.random() * 5) - 2);
    const wd = Math.max(2, simpD + Math.floor(Math.random() * 5) - 2);
    const s = wn === wd ? "1" : wd === 1 ? `${wn}` : `${wn}/${wd}`;
    if (s !== answer && !wrongs.includes(s)) wrongs.push(s);
  }

  return {
    type: "multiply",
    question: `${n1}/${d1} × ${n2}/${d2} = ?`,
    visual: [{ n: n1, d: d1 }, { n: n2, d: d2 }],
    choices: [...wrongs, answer].sort(() => Math.random() - 0.5),
    answer,
    explanation: `Step 1: Multiply numerators: ${n1} × ${n2} = ${prodN}.\nStep 2: Multiply denominators: ${d1} × ${d2} = ${prodD}.\nStep 3: ${prodN}/${prodD}${g > 1 ? ` — simplify by GCF(${prodN},${prodD})=${g} → ${answer}` : ""}.`,
    visualHint: vh,
  };
}

// ── Mixed number to improper fraction ──

function genMixedToImproper(level: number, vh: VisualHint): Challenge {
  const maxD = Math.min(3 + level, 8);
  const d = Math.floor(Math.random() * (maxD - 1)) + 2;
  const whole = Math.floor(Math.random() * 3) + 1;
  const n = Math.floor(Math.random() * (d - 1)) + 1;
  const impN = whole * d + n;
  const answer = `${impN}/${d}`;

  const wrongs: string[] = [];
  while (wrongs.length < 3) {
    const w = impN + Math.floor(Math.random() * 5) - 2;
    const s = `${Math.max(1, w)}/${d}`;
    if (s !== answer && !wrongs.includes(s)) wrongs.push(s);
  }

  return {
    type: "mixed-to-improper",
    question: `Convert ${whole} ${n}/${d} to an improper fraction`,
    visual: [{ n: impN, d }],
    choices: [...wrongs, answer].sort(() => Math.random() - 0.5),
    answer,
    explanation: `Step 1: Multiply whole by denominator: ${whole} × ${d} = ${whole * d}.\nStep 2: Add the numerator: ${whole * d} + ${n} = ${impN}.\nStep 3: Keep the denominator: ${impN}/${d}.\nSo ${whole} ${n}/${d} = ${impN}/${d}.`,
    visualHint: vh,
  };
}

// ── Improper fraction to mixed number ──

function genImproperToMixed(level: number, vh: VisualHint): Challenge {
  const maxD = Math.min(3 + level, 8);
  const d = Math.floor(Math.random() * (maxD - 1)) + 2;
  const whole = Math.floor(Math.random() * 3) + 1;
  const remainder = Math.floor(Math.random() * (d - 1)) + 1;
  const impN = whole * d + remainder;
  const answer = `${whole} ${remainder}/${d}`;

  const wrongs: string[] = [];
  while (wrongs.length < 3) {
    const ww = whole + Math.floor(Math.random() * 3) - 1;
    const wr = Math.max(1, remainder + Math.floor(Math.random() * 3) - 1);
    const s = `${Math.max(1, ww)} ${Math.min(wr, d - 1)}/${d}`;
    if (s !== answer && !wrongs.includes(s)) wrongs.push(s);
  }

  return {
    type: "improper-to-mixed",
    question: `Convert ${impN}/${d} to a mixed number`,
    visual: [{ n: impN, d }],
    choices: [...wrongs, answer].sort(() => Math.random() - 0.5),
    answer,
    explanation: `Step 1: Divide ${impN} ÷ ${d} = ${whole} remainder ${remainder}.\nStep 2: Whole number = ${whole}, remainder = ${remainder}.\nStep 3: ${impN}/${d} = ${whole} ${remainder}/${d}.`,
    visualHint: vh,
  };
}

// ── Fraction of a number ──

function genFractionOfNumber(level: number, vh: VisualHint): Challenge {
  const denoms = [2, 3, 4, 5, 6, 8, 10];
  const d = denoms[Math.min(level - 1, denoms.length - 1)];
  const n = Math.floor(Math.random() * (d - 1)) + 1;
  const multiples = [d, d * 2, d * 3, d * 4, d * 5].filter(m => m <= 50);
  const whole = multiples[Math.floor(Math.random() * multiples.length)];
  const answer = String((n * whole) / d);

  const wrongs: string[] = [];
  while (wrongs.length < 3) {
    const w = parseInt(answer) + Math.floor(Math.random() * 7) - 3;
    if (String(w) !== answer && w > 0 && !wrongs.includes(String(w))) wrongs.push(String(w));
  }

  return {
    type: "fraction-of-number",
    question: `What is ${n}/${d} of ${whole}?`,
    visual: [{ n, d }],
    choices: [...wrongs, answer].sort(() => Math.random() - 0.5),
    answer,
    explanation: `Step 1: Divide ${whole} by the denominator: ${whole} ÷ ${d} = ${whole / d}.\nStep 2: Multiply by the numerator: ${whole / d} × ${n} = ${answer}.\nSo ${n}/${d} of ${whole} = ${answer}. (Same as ${n}/${d} × ${whole}.)`,
    visualHint: vh,
  };
}

function generateChallenge(level: number, types: ChallengeType[], solved: number, diff: string, showHints: boolean): Challenge {
  const type = types[Math.floor(Math.random() * types.length)];
  const vh = getVisualHint(solved, diff, showHints);
  // Difficulty scales effective level
  const effLevel = diff === "beginner" ? Math.max(1, level - 1) : diff === "advanced" ? level + 2 : diff === "expert" ? level + 4 : level;
  switch (type) {
    case "identify": return genIdentify(effLevel, vh);
    case "compare": return genCompare(effLevel, vh);
    case "add": return genAdd(effLevel, vh);
    case "subtract": return genSubtract(effLevel, vh);
    case "multiply": return genMultiply(effLevel, vh);
    case "equivalent": return genEquivalent(effLevel, vh);
    case "simplify": return genSimplify(effLevel, vh);
    case "mixed-to-improper": return genMixedToImproper(effLevel, vh);
    case "improper-to-mixed": return genImproperToMixed(effLevel, vh);
    case "fraction-of-number": return genFractionOfNumber(effLevel, vh);
    case "gcf": return genGCF(effLevel, vh);
    case "lcm": return genLCM(effLevel, vh);
  }
}

const CHALLENGE_SETS = [
  { label: "Identify", emoji: "👀", desc: "Name the fraction shown", types: ["identify"] as ChallengeType[], color: "#22c55e" },
  { label: "Compare", emoji: "⚖️", desc: "Which fraction is larger? (includes equal!)", types: ["compare"] as ChallengeType[], color: "#3b82f6" },
  { label: "Add", emoji: "➕", desc: "Add fractions together", types: ["add"] as ChallengeType[], color: "#f59e0b" },
  { label: "Subtract", emoji: "➖", desc: "Subtract fractions", types: ["subtract"] as ChallengeType[], color: "#ef4444" },
  { label: "Multiply", emoji: "✖️", desc: "Multiply two fractions", types: ["multiply"] as ChallengeType[], color: "#10b981" },
  { label: "Equivalent", emoji: "🔄", desc: "Find equal fractions", types: ["equivalent"] as ChallengeType[], color: "#a855f7" },
  { label: "Simplify", emoji: "✂️", desc: "Reduce to lowest terms", types: ["simplify"] as ChallengeType[], color: "#06b6d4" },
  { label: "Mixed ↔ Improper", emoji: "🔀", desc: "Convert between mixed and improper fractions", types: ["mixed-to-improper", "improper-to-mixed"] as ChallengeType[], color: "#f97316" },
  { label: "Fraction of Number", emoji: "🎯", desc: "What is 3/4 of 20?", types: ["fraction-of-number"] as ChallengeType[], color: "#14b8a6" },
  { label: "GCF", emoji: "🔢", desc: "Greatest Common Factor", types: ["gcf"] as ChallengeType[], color: "#8b5cf6" },
  { label: "LCM", emoji: "📐", desc: "Least Common Multiple", types: ["lcm"] as ChallengeType[], color: "#ec4899" },
  { label: "Mixed", emoji: "🎲", desc: "All challenge types", types: ["identify", "compare", "add", "subtract", "multiply", "equivalent", "simplify", "mixed-to-improper", "improper-to-mixed", "fraction-of-number", "gcf", "lcm"] as ChallengeType[], color: "#ef4444" },
];

const FRACTION_TIPS: Record<ChallengeType, string[]> = {
  identify: [
    "The numerator is the top number — it tells you how many parts you have.",
    "The denominator is the bottom number — it tells how many equal parts make a whole.",
    "A fraction bar shows parts of a whole visually.",
    "3/4 means 3 out of 4 equal parts.",
  ],
  compare: [
    "To compare fractions with the same denominator, just compare the numerators.",
    "Cross-multiply to compare: a/b vs c/d → compare a×d with b×c.",
    "A bigger denominator means smaller pieces (if numerators are the same).",
    "Convert to the same denominator to compare fractions easily.",
    "Some fractions look different but are equal — like 1/2 and 3/6!",
  ],
  add: [
    "You can only add fractions that have the same denominator.",
    "Find the Least Common Denominator (LCD) before adding fractions.",
    "When adding fractions: add the numerators, keep the denominator.",
    "Always simplify your answer by dividing by the GCD.",
  ],
  subtract: [
    "Subtracting fractions with the same denominator: subtract the numerators, keep the denominator.",
    "Always simplify your answer by dividing by the GCD.",
    "If fractions have different denominators, find the LCD first.",
    "5/8 − 3/8 = (5−3)/8 = 2/8 = 1/4.",
  ],
  multiply: [
    "To multiply fractions: multiply the numerators, multiply the denominators.",
    "2/3 × 4/5 = (2×4)/(3×5) = 8/15.",
    "You can cross-cancel before multiplying to simplify.",
    "Multiplying by a fraction less than 1 makes the result smaller.",
    "A fraction times its reciprocal always equals 1.",
  ],
  equivalent: [
    "Multiply both numerator and denominator by the same number to get an equivalent fraction.",
    "1/2 = 2/4 = 3/6 = 4/8 — all equivalent!",
    "Dividing both parts by their GCD gives the simplest form.",
    "Equivalent fractions represent the same point on a number line.",
  ],
  simplify: [
    "Find the GCF of numerator and denominator, then divide both by it.",
    "A fraction is fully simplified when GCF(numerator, denominator) = 1.",
    "6/8 → GCF(6,8) = 2 → 6÷2 / 8÷2 = 3/4.",
    "Simplifying doesn't change the value — just makes it easier to read.",
    "Always check: can both numbers be divided by 2? 3? 5?",
  ],
  "mixed-to-improper": [
    "Multiply the whole number by the denominator, then add the numerator.",
    "2 3/4 → (2×4)+3 = 11, so 2 3/4 = 11/4.",
    "The denominator stays the same when converting.",
    "Think of it as: how many pieces total?",
  ],
  "improper-to-mixed": [
    "Divide the numerator by the denominator to get the whole number part.",
    "The remainder becomes the new numerator over the same denominator.",
    "11/4 → 11÷4 = 2 remainder 3, so 11/4 = 2 3/4.",
    "An improper fraction has a numerator ≥ the denominator.",
  ],
  "fraction-of-number": [
    "To find a fraction of a number: divide by the denominator, multiply by the numerator.",
    "3/4 of 20 = (20 ÷ 4) × 3 = 5 × 3 = 15.",
    "This is the same as multiplying: 3/4 × 20.",
    "'Of' in math means multiply.",
  ],
  gcf: [
    "GCF = Greatest Common Factor — the largest number that divides both evenly.",
    "List all factors of each number, then find the biggest one they share.",
    "GCF(12, 8): Factors of 12 = {1,2,3,4,6,12}, Factors of 8 = {1,2,4,8} → GCF = 4.",
    "GCF is essential for simplifying fractions to lowest terms.",
    "If GCF = 1, the numbers are 'coprime' (no common factors).",
    "Use prime factorization: break each number into primes, multiply the shared ones.",
  ],
  lcm: [
    "LCM = Least Common Multiple — the smallest number both divide into evenly.",
    "List multiples of each number until you find the first one they share.",
    "LCM(4, 6): Multiples of 4 = {4,8,12,16…}, Multiples of 6 = {6,12,18…} → LCM = 12.",
    "LCM is used to find common denominators when adding fractions.",
    "Shortcut: LCM(a,b) = (a × b) ÷ GCF(a,b).",
    "If one number is a multiple of the other, that's the LCM.",
  ],
};

const LIVES = 5;

export function FractionLabGame() {
  useGameMusic();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [solved, setSolved] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showHeartRecovery, setShowHeartRecovery] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [challengeTypes, setChallengeTypes] = useState<ChallengeType[]>(["identify"]);
  const [setIdx, setSetIdx] = useState(0);
  const [usePie, setUsePie] = useState(false);
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced" | "expert">("beginner");
  const [showVisualHints, setShowVisualHints] = useState(true);
  const [timedMode, setTimedMode] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(0); // 0 = no timer, >0 = seconds
  const [questionTimer, setQuestionTimer] = useState(0);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("fractionLab_highScore"));
  const [achievementQueue, setAchievementQueue] = useState<Array<{ name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceCorrect, setPracticeCorrect] = useState(0);
  const [practiceTotal, setPracticeTotal] = useState(0);
  const [practiceWaiting, setPracticeWaiting] = useState(false); // waiting for "Next" click
  const [pendingStart, setPendingStart] = useState<{ types: ChallengeType[]; idx: number; diff: string; showHints: boolean; timed: boolean; timePerQ: number; practice: boolean } | null>(null);
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));

  useEffect(() => {
    if (challenge) setTipIdx(Math.floor(Math.random() * 100));
  }, [challenge]);

  useEffect(() => {
    if (phase !== "complete") return;
    trackGamePlayed("fraction-lab", score);
    const profile = getProfile();
    const newOnes = checkAchievements(
      { gameId: "fraction-lab", score, level, solved, bestStreak, accuracy: solved + wrong > 0 ? Math.round((solved / (solved + wrong)) * 100) : 100 },
      profile.totalGamesPlayed,
      profile.gamesPlayedByGameId
    );
    if (newOnes.length > 0) { sfxAchievement(); setAchievementQueue(newOnes); }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps -- run once on complete

  // Countdown (skip in practice mode)
  useEffect(() => {
    if (phase !== "countdown") return;
    if (pendingStart?.practice) {
      // Practice mode: skip countdown, go straight to playing
      setChallengeTypes(pendingStart.types);
      setSetIdx(pendingStart.idx);
      setScore(0);
      setLives(LIVES);
      setSolved(0);
      setWrong(0);
      setStreak(0);
      setBestStreak(0);
            setShowHeartRecovery(false);
            setLevel(1);
            setAdaptive(createAdaptiveState(1));
            setAchievementQueue([]);
            setShowAchievementIndex(0);
            setPracticeCorrect(0);
            setPracticeTotal(0);
            setPracticeWaiting(false);
            setChallenge(generateChallenge(1, pendingStart.types, 0, pendingStart.diff, pendingStart.showHints));
            setTimePerQuestion(0);
            setFeedback(null);
            setSelectedAnswer(null);
            setPendingStart(null);
            setPhase("playing");
            return;
    }
    const t = setTimeout(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (pendingStart) {
            setChallengeTypes(pendingStart.types);
            setSetIdx(pendingStart.idx);
            setScore(0);
            setLives(LIVES);
            setSolved(0);
            setWrong(0);
            setStreak(0);
            setBestStreak(0);
            setShowHeartRecovery(false);
            setLevel(1);
            setAdaptive(createAdaptiveState(1));
            setAchievementQueue([]);
            setShowAchievementIndex(0);
            setPracticeCorrect(0);
            setPracticeTotal(0);
            setPracticeWaiting(false);
            setChallenge(generateChallenge(1, pendingStart.types, 0, pendingStart.diff, pendingStart.showHints));
            if (pendingStart.timed && pendingStart.timePerQ > 0) {
              setTimePerQuestion(pendingStart.timePerQ);
            } else {
              setTimePerQuestion(0);
            }
            setFeedback(null);
            setSelectedAnswer(null);
            setPendingStart(null);
          }
          setPhase("playing");
          sfxCountdownGo();
          return 3;
        }
        return c - 1;
      });
    }, 800);
    return () => clearTimeout(t);
  }, [phase, countdown, pendingStart]);

  const nextChallenge = useCallback((currentSolved: number) => {
    const lvl = Math.max(1, Math.round(adaptive.level));
    setLevel(lvl);
    setChallenge(generateChallenge(lvl, challengeTypes, currentSolved, difficulty, showVisualHints));
    setFeedback(null);
    setSelectedAnswer(null);
    setPracticeWaiting(false);
    setPhase("playing");
  }, [challengeTypes, difficulty, showVisualHints, adaptive.level]);

  // Question timer (for timed mode)
  useEffect(() => {
    if (phase !== "playing" || timePerQuestion <= 0 || feedback !== null) {
      if (phase !== "playing" || timePerQuestion <= 0) {
        setQuestionTimer(0);
      }
      return;
    }
    setQuestionTimer(timePerQuestion);
    const interval = setInterval(() => {
      setQuestionTimer((t) => {
        if (t <= 1 || feedback !== null) {
          clearInterval(interval);
          if (feedback === null) {
            // Time's up — treat as wrong
            sfxWrong();
            setStreak(0);
            setWrong((w) => w + 1);
            setFeedback("wrong");
            setLives((l) => {
              const nl = l - 1;
              if (nl <= 0) {
                sfxGameOver();
                setTimeout(() => setPhase("complete"), 1000);
              } else {
                setTimeout(() => {
                  setFeedback(null);
                  setSelectedAnswer(null);
                  nextChallenge(solved);
                }, 800);
              }
              return nl;
            });
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, challenge, timePerQuestion, solved, nextChallenge, feedback]);

  const handleAnswer = useCallback(
    (choice: string) => {
      if (phase !== "playing" || !challenge || practiceWaiting) return;
      setSelectedAnswer(choice);

      if (practiceMode) {
        // Practice mode: no lives, always show explanation, wait for "Next"
        setPracticeTotal((t) => t + 1);
        if (choice === challenge.answer) {
          sfxCorrect();
          setPracticeCorrect((c) => c + 1);
          const newSolved = solved + 1;
          setSolved(newSolved);
          setStreak((s) => s + 1);
          setFeedback("correct");
        } else {
          sfxWrong();
          setStreak(0);
          setWrong((w) => w + 1);
          setFeedback("wrong");
        }
        setAdaptive(prev => adaptiveUpdate(prev, choice === challenge.answer, false));
        setPracticeWaiting(true); // Wait for "Next" click
        return;
      }

      if (choice === challenge.answer) {
        sfxCorrect();
        const newStreak = streak + 1;
        const { mult } = getMultiplierFromStreak(newStreak);
        const points = Math.round(10 * mult);
        setScore((s) => s + points);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        const newSolved = solved + 1;
        setSolved(newSolved);
        if (newStreak >= 10 && newStreak % 10 === 0 && lives < LIVES) {
          sfxHeart();
          setShowHeartRecovery(true);
          setTimeout(() => {
            setPhase(currentPhase => {
              if (currentPhase !== "playing") return currentPhase;
              setShowHeartRecovery(false);
              return currentPhase;
            });
          }, 1500);
          setLives((l) => Math.min(LIVES, l + 1));
        }
        setFeedback("correct");
        setAdaptive(prev => adaptiveUpdate(prev, true, false)); // FractionLab doesn't have a speed timer in normal mode
        setTimeout(() => {
          setPhase(currentPhase => {
            if (currentPhase !== "playing") return currentPhase;
            nextChallenge(newSolved);
            return currentPhase;
          });
        }, 1200);
      } else {
        sfxWrong();
        setStreak(0);
        setWrong((w) => w + 1);
        setFeedback("wrong");
        setAdaptive(prev => adaptiveUpdate(prev, false, false));
        const nl = lives - 1;
        setLives(nl);
        if (nl <= 0) {
          sfxGameOver();
          setTimeout(() => {
            setPhase(currentPhase => {
              if (currentPhase !== "playing") return currentPhase;
              setScore((s) => {
                if (s > highScore) { setHighScore(s); setLocalHighScore("fractionLab_highScore", s); }
                return s;
              });
              return "complete";
            });
          }, 1500);
        } else {
          setTimeout(() => {
            setPhase(currentPhase => {
              if (currentPhase !== "playing") return currentPhase;
              setFeedback(null);
              setSelectedAnswer(null);
              return currentPhase;
            });
          }, 1000);
        }
      }
    },
    [phase, challenge, lives, highScore, streak, solved, nextChallenge, practiceMode, practiceWaiting]
  );

  const startGame = (types: ChallengeType[], idx: number) => {
    setPendingStart({ types, idx, diff: difficulty, showHints: showVisualHints, timed: practiceMode ? false : timedMode, timePerQ: !practiceMode && timedMode ? ({ beginner: 30, intermediate: 20, advanced: 15, expert: 10 }[difficulty]) : 0, practice: practiceMode });
    setCountdown(3);
    setPhase("countdown");
  };

  const accuracy = solved + wrong > 0 ? Math.round((solved / (solved + wrong)) * 100) : 100;
  const currentColor = CHALLENGE_SETS[setIdx].color;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-orange-950/30 to-slate-950 flex flex-col items-center">
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Fraction Lab</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* MENU */}
        {phase === "menu" && (
          <div className="w-full space-y-5 text-center">
            <div>
              <div className="text-5xl mb-2">🧪</div>
              <h2 className="text-3xl font-bold text-white mb-1">Fraction Lab</h2>
              <p className="text-slate-400 text-sm">See, compare, and calculate fractions visually</p>
            </div>

            {/* Visual style toggle */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setUsePie(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!usePie ? "bg-white/10 text-white border border-white/20" : "text-slate-400 hover:text-white"}`}
              >
                📊 Bars
              </button>
              <button
                onClick={() => setUsePie(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${usePie ? "bg-white/10 text-white border border-white/20" : "text-slate-400 hover:text-white"}`}
              >
                🥧 Pies
              </button>
            </div>

            {/* Difficulty selector */}
            <div className="space-y-2">
              <div className="text-xs text-slate-400 text-left">Difficulty</div>
              <div className="grid grid-cols-4 gap-1.5">
                {(["beginner", "intermediate", "advanced", "expert"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                      difficulty === d
                        ? "bg-orange-500/20 text-orange-400 border border-orange-400/30"
                        : "text-slate-500 hover:text-white bg-white/[0.03] border border-white/5"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-slate-600">
                {difficulty === "beginner" && "Small denominators (2-6), generous visual hints"}
                {difficulty === "intermediate" && "Medium denominators (2-10), hints fade faster"}
                {difficulty === "advanced" && "Larger denominators (2-12), minimal hints"}
                {difficulty === "expert" && "Full range (2-16), no visual hints, tougher problems"}
              </div>
            </div>

            {/* Settings toggles */}
            <div className="space-y-2">
              <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
                <span className="text-xs text-slate-400">Show visual hints</span>
                <input type="checkbox" checked={showVisualHints} onChange={(e) => setShowVisualHints(e.target.checked)}
                  className="rounded accent-orange-500 w-4 h-4" />
              </label>
              <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
                <span className="text-xs text-slate-400">Timed mode</span>
                <input type="checkbox" checked={timedMode} onChange={(e) => setTimedMode(e.target.checked)}
                  className="rounded accent-orange-500 w-4 h-4" />
              </label>
              <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
                <div>
                  <span className="text-xs text-slate-400">Practice mode</span>
                  <div className="text-[10px] text-slate-600">No lives, detailed explanations, learn at your own pace</div>
                </div>
                <input type="checkbox" checked={practiceMode} onChange={(e) => setPracticeMode(e.target.checked)}
                  className="rounded accent-orange-500 w-4 h-4" />
              </label>
            </div>

            <div className="space-y-2">
              {CHALLENGE_SETS.map((cs, i) => (
                <button
                  key={cs.label}
                  onClick={() => startGame(cs.types, i)}
                  className="w-full py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-3 active:scale-[0.98]"
                >
                  <span className="text-2xl">{cs.emoji}</span>
                  <div className="text-left flex-1">
                    <div className="text-white font-bold text-sm">{cs.label}</div>
                    <div className="text-slate-500 text-[10px]">{cs.desc}</div>
                  </div>
                  <span className="text-slate-600">→</span>
                </button>
              ))}
            </div>

            <div className="text-[10px] text-slate-600 text-center px-4">
              Visuals start strong and fade as you progress — train your mental math!
            </div>

            {highScore > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-yellow-400/70 text-xs">
                <Trophy className="w-3 h-3" /> Best: {highScore}
              </div>
            )}
          </div>
        )}

        {/* COUNTDOWN */}
        {phase === "countdown" && (
          <div className="text-center py-20">
            <div className="text-8xl font-bold text-orange-400 animate-pulse">
              {countdown || "GO!"}
            </div>
            <p className="mt-4 text-slate-400">Get ready...</p>
          </div>
        )}

        {/* PLAYING */}
        {(phase === "playing" || phase === "feedback") && challenge && (
          <div className="w-full space-y-5">
            {/* HUD */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {practiceMode ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 font-medium">Practice</span>
                    <span className="text-slate-400 tabular-nums">
                      {practiceCorrect}/{practiceTotal}
                      {practiceTotal > 0 && ` (${Math.round((practiceCorrect / practiceTotal) * 100)}%)`}
                    </span>
                    <button onClick={() => setPhase("menu")} className="ml-2 px-2 py-0.5 rounded-md bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 text-[10px] transition-colors">
                      End
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-0.5">
                      {Array.from({ length: LIVES }).map((_, i) => (
                        <Heart key={i} className={`w-4 h-4 transition-all ${i < lives ? "text-red-400 fill-red-400" : "text-slate-800 scale-75"}`} />
                      ))}
                    </div>
                    <StreakBadge streak={streak} />
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                {!practiceMode && timePerQuestion > 0 && questionTimer > 0 && (
                  <div className={`text-sm font-bold tabular-nums ${questionTimer <= 5 ? "text-red-400 animate-pulse" : "text-slate-400"}`}>
                    {questionTimer}s
                  </div>
                )}
                {!practiceMode && <div className="text-white font-bold tabular-nums">{score}</div>}
              </div>
            </div>
            <HeartRecovery show={showHeartRecovery} />
            <div className="text-xs text-slate-500 text-center -mt-2">
              {(() => {
                const dl = getDifficultyLabel(adaptive.level);
                return (
                  <span className="inline-flex items-center gap-2">
                    <span>Lvl {adaptive.level.toFixed(1)} · {solved} solved</span>
                    <span className="font-bold px-1.5 py-0.5 rounded text-[10px]" style={{ color: dl.color, backgroundColor: dl.color + "15" }}>{dl.emoji} {dl.label}</span>
                    {adaptive.lastAdjust && Date.now() - adaptive.lastAdjustTime < 2000 && (
                      <span className={`text-[10px] font-bold animate-bounce ${adaptive.lastAdjust === "up" ? "text-red-400" : "text-green-400"}`}>
                        {adaptive.lastAdjust === "up" ? "↑ Harder!" : "↓ Easier"}
                      </span>
                    )}
                  </span>
                );
              })()}
            </div>

            {/* Educational tip */}
            {!feedback && (
              <div className="text-center text-[11px] text-slate-500 italic px-4">
                💡 {FRACTION_TIPS[challenge.type][tipIdx % FRACTION_TIPS[challenge.type].length]}
              </div>
            )}

            {/* Question */}
            <div className="text-center text-white text-lg font-semibold drop-shadow-sm">
              {challenge.question}
            </div>

            {/* Visual — progressive scaffolding */}
            {challenge.visualHint !== "none" && challenge.type !== "gcf" && challenge.type !== "lcm" && (
              <div className={`flex items-center justify-center gap-4 flex-wrap transition-opacity duration-300 ${challenge.visualHint === "reduced" ? "opacity-60" : ""}`}>
                {challenge.visual.map((v, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    {usePie ? (
                      <FractionPie
                        n={v.n} d={v.d} color={currentColor}
                        size={challenge.visualHint === "reduced" ? 60 : 90}
                        showLabel={challenge.visualHint === "full" && challenge.type !== "identify"}
                      />
                    ) : (
                      <FractionBar
                        n={v.n} d={v.d} color={currentColor}
                        width={challenge.visualHint === "reduced" ? 120 : 180}
                        height={challenge.visualHint === "reduced" ? 24 : 36}
                        showLabel={challenge.visualHint === "full" && challenge.type !== "identify"}
                        animate
                      />
                    )}
                    {challenge.type === "add" && i < challenge.visual.length - 1 && (
                      <span className="text-2xl text-white font-bold mt-2">+</span>
                    )}
                    {challenge.type === "subtract" && i < challenge.visual.length - 1 && (
                      <span className="text-2xl text-white font-bold mt-2">−</span>
                    )}
                    {challenge.type === "multiply" && i < challenge.visual.length - 1 && (
                      <span className="text-2xl text-white font-bold mt-2">×</span>
                    )}
                  </div>
                ))}
                {challenge.visualHint === "reduced" && (
                  <div className="w-full text-center text-[10px] text-slate-600 mt-1">Visual hint fading — use your math skills!</div>
                )}
              </div>
            )}

            {/* GCF visual: factor lists */}
            {challenge.type === "gcf" && challenge.visualHint !== "none" && (
              <div className="text-center space-y-2">
                {challenge.visual.map((v, i) => {
                  const num = v.n;
                  const factors = getFactors(num);
                  return (
                    <div key={i} className="bg-white/5 rounded-lg px-4 py-2 border border-white/10">
                      <span className="text-slate-400 text-xs">Factors of </span>
                      <span className="text-white font-bold">{num}</span>
                      {challenge.visualHint === "full" && (
                        <span className="text-slate-400 text-xs">: {factors.map((f) => (
                          <span key={f} className="text-slate-400 mx-0.5">{f}</span>
                        ))}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* LCM visual: multiples lists */}
            {challenge.type === "lcm" && challenge.visualHint !== "none" && (
              <div className="text-center space-y-2">
                {challenge.visual.map((v, i) => {
                  const num = v.n;
                  const mults = Array.from({ length: challenge.visualHint === "full" ? 8 : 4 }, (_, j) => num * (j + 1));
                  return (
                    <div key={i} className="bg-white/5 rounded-lg px-4 py-2 border border-white/10">
                      <span className="text-slate-400 text-xs">Multiples of </span>
                      <span className="text-white font-bold">{num}</span>
                      <span className="text-slate-400 text-xs">: {mults.map((m) => (
                        <span key={m} className="text-slate-400 mx-0.5">{m}</span>
                      ))}…</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Explanation on feedback */}
            {feedback && (
              <div className={`text-center text-sm font-medium ${feedback === "correct" ? "text-green-400" : "text-red-400"}`}>
                {feedback === "correct" ? (
                  <div className="space-y-1">
                    <span className="flex items-center justify-center gap-1"><Check className="w-4 h-4" /> Correct!</span>
                    {practiceMode && (
                      <div className="text-xs text-slate-400 whitespace-pre-line text-left bg-white/5 rounded-lg px-4 py-2 mt-2 border border-white/10">
                        {challenge.explanation}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="flex items-center justify-center gap-1"><X className="w-4 h-4" /> Wrong — the answer is {challenge.answer}</span>
                    <div className="text-xs text-slate-400 whitespace-pre-line text-left bg-white/5 rounded-lg px-4 py-2 mt-2 border border-white/10">
                      {challenge.explanation}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Practice mode: Next button */}
            {practiceMode && practiceWaiting && (
              <div className="flex justify-center">
                <button
                  onClick={() => nextChallenge(solved)}
                  className="px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  Next →
                </button>
              </div>
            )}

            {/* Choices */}
            <div className="grid grid-cols-2 gap-2.5">
              {challenge.choices.map((choice, i) => {
                const isSelected = selectedAnswer === choice;
                const isCorrect = choice === challenge.answer;
                const showResult = feedback !== null;
                return (
                  <button
                    key={`${choice}-${i}`}
                    onClick={() => handleAnswer(choice)}
                    disabled={feedback !== null}
                    className={`py-4 rounded-xl text-lg sm:text-xl font-bold transition-all duration-200 min-h-[52px] shadow-md ${
                      showResult && isCorrect
                        ? "bg-green-500/20 border-2 border-green-400 text-green-400 shadow-green-500/20"
                        : showResult && isSelected && !isCorrect
                        ? "bg-red-500/20 border-2 border-red-400 text-red-400 shadow-red-500/20"
                        : showResult
                        ? "bg-white/5 border border-white/5 text-slate-600"
                        : "bg-white/10 border border-white/10 text-white hover:bg-orange-500/20 hover:border-orange-400/40 hover:shadow-lg hover:shadow-orange-500/20 active:scale-95"
                    }`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* COMPLETE */}
        {phase === "complete" && (
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-white">Game Over</h3>
            <div className="text-4xl font-bold text-orange-400">{score}</div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div><div className="text-xl font-bold text-white">{solved}</div><div className="text-[10px] text-slate-500 uppercase">Solved</div></div>
              <div><div className="text-xl font-bold text-green-400">{accuracy}%</div><div className="text-[10px] text-slate-500 uppercase">Accuracy</div></div>
              <div><div className="text-xl font-bold text-cyan-400">{adaptive.level.toFixed(1)}</div><div className="text-[10px] text-slate-500 uppercase">Difficulty</div></div>
            </div>

            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-sm font-medium flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" /> New High Score!
              </p>
            )}

            <ScoreSubmit game="fraction-lab" score={score} level={level} stats={{ solved, accuracy: `${accuracy}%` }} />

            {achievementQueue.length > 0 && showAchievementIndex < achievementQueue.length && (
              <AchievementToast
                name={achievementQueue[showAchievementIndex].name}
                tier={achievementQueue[showAchievementIndex].tier}
                onDismiss={() => {
                  if (showAchievementIndex + 1 >= achievementQueue.length) setAchievementQueue([]);
                  setShowAchievementIndex((i) => i + 1);
                }}
              />
            )}

            <div className="flex gap-3 justify-center">
              <button onClick={() => startGame(challengeTypes, setIdx)} className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Again
              </button>
              <button onClick={() => setPhase("menu")} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all">
                Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
