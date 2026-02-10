"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Timer, Star, Hash, ChevronRight } from "lucide-react";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import {
  sfxCorrect, sfxWrong, sfxCombo, sfxGameOver, sfxAchievement,
  sfxCountdown, sfxCountdownGo, sfxClick,
} from "@/lib/games/audio";
import { createAdaptiveState, adaptiveUpdate, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import Link from "next/link";

// ── Types ──

type GamePhase = "menu" | "countdown" | "playing" | "gameOver";
type DecimalMode = "numberline" | "operations" | "compare" | "convert";

interface Problem {
  question: string;
  answer: number | string;
  choices: (number | string)[];
  mode: DecimalMode;
  /** For number line: the range [min, max] and target value */
  numberLineRange?: [number, number];
  numberLineTarget?: number;
  /** Explanation for practice mode */
  explanation?: string;
}

// ── Adaptive → decimal params mapping ──

interface DecimalParams {
  /** Number of decimal places (1-3) */
  decimalPlaces: number;
  /** Max value for generated numbers */
  maxValue: number;
  /** Whether to include division in operations */
  allowDivision: boolean;
  /** Whether to include harder conversions */
  allowHardConversions: boolean;
  /** Multiplier range for multiplication (higher = harder) */
  multRange: number;
}

function getDecimalParams(level: number): DecimalParams {
  const l = Math.max(1, Math.min(50, level));
  return {
    // Level 1-8: tenths, 8-20: hundredths, 20+: thousandths
    decimalPlaces: l < 8 ? 1 : l < 20 ? 2 : 3,
    // Higher levels use bigger numbers
    maxValue: Math.min(Math.floor(10 + l * 2), 100),
    // Division operations above level 12
    allowDivision: l >= 12,
    // Harder conversions (mixed decimals, repeating) above level 15
    allowHardConversions: l >= 15,
    // Wider multiplier range at higher levels
    multRange: Math.min(Math.floor(2 + l * 0.3), 12),
  };
}

// ── Problem generation ──

function roundDec(n: number, places: number): number {
  const f = Math.pow(10, places);
  return Math.round(n * f) / f;
}

function randomDecimal(places: number, max = 10): number {
  const f = Math.pow(10, places);
  return Math.round(Math.random() * max * f) / f;
}

function generateNumberLineProblem(places: number): Problem {
  const rangeSize = places === 1 ? 1 : places === 2 ? 0.1 : 0.01;
  const start = roundDec(Math.random() * (10 - rangeSize), places);
  const end = roundDec(start + rangeSize, places);
  const step = rangeSize / 10;
  // Pick a target between start and end
  const steps = Math.floor(Math.random() * 9) + 1;
  const target = roundDec(start + step * steps, places + 1);

  // Generate 3 wrong answers nearby
  const choices: number[] = [target];
  const offsets = [-2, -1, 1, 2, 3].map((o) => roundDec(start + step * (steps + o), places + 1));
  const valid = offsets.filter((o) => o !== target && o > start && o < end);
  while (choices.length < 4 && valid.length > 0) {
    const idx = Math.floor(Math.random() * valid.length);
    choices.push(valid.splice(idx, 1)[0]);
  }
  // Fill remaining with random if needed
  while (choices.length < 4) {
    const r = roundDec(start + step * (Math.floor(Math.random() * 9) + 1), places + 1);
    if (!choices.includes(r)) choices.push(r);
  }

  return {
    question: `Place the decimal on the number line: ${target}`,
    answer: target,
    choices: choices.sort(() => Math.random() - 0.5),
    mode: "numberline",
    numberLineRange: [start, end],
    numberLineTarget: target,
    explanation: `The number line goes from ${start} to ${end}. Each small tick mark represents ${roundDec(step, places + 1)}. Count ${steps} ticks from ${start} to get ${target}.`,
  };
}

function generateOperationsProblem(places: number, params?: DecimalParams): Problem {
  const ops = params?.allowDivision ? ["+", "−", "×", "÷"] as const : ["+", "−", "×"] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  const maxVal = params?.maxValue ?? 50;
  const multMax = params?.multRange ?? 9;
  let a: number, b: number, answer: number, question: string, explanation: string;

  switch (op) {
    case "+": {
      a = randomDecimal(places, maxVal);
      b = randomDecimal(places, maxVal);
      answer = roundDec(a + b, places);
      question = `${a} + ${b}`;
      explanation = `Line up the decimal points:\n  ${a}\n+ ${b}\n= ${answer}\n\nAdd each column from right to left, carrying when needed.`;
      break;
    }
    case "−": {
      a = randomDecimal(places, maxVal);
      b = randomDecimal(places, a);
      if (b > a) [a, b] = [b, a];
      answer = roundDec(a - b, places);
      question = `${a} − ${b}`;
      explanation = `Line up the decimal points:\n  ${a}\n− ${b}\n= ${answer}\n\nSubtract each column from right to left, borrowing when needed.`;
      break;
    }
    case "×": {
      a = randomDecimal(places, 10);
      b = Math.floor(Math.random() * (multMax - 1)) + 2;
      answer = roundDec(a * b, places);
      question = `${a} × ${b}`;
      explanation = `Multiply ${a} × ${b}:\nIgnore the decimal, compute ${Math.round(a * Math.pow(10, places))} × ${b} = ${Math.round(a * Math.pow(10, places)) * b}.\nThen place the decimal point ${places} place${places > 1 ? "s" : ""} from the right → ${answer}.`;
      break;
    }
    case "÷": {
      b = Math.floor(Math.random() * 4) + 2;
      answer = randomDecimal(places, 10);
      a = roundDec(answer * b, places);
      question = `${a} ÷ ${b}`;
      explanation = `Divide ${a} by ${b}:\n${a} ÷ ${b} = ${answer}\n\nYou can think: what times ${b} equals ${a}? The answer is ${answer}.`;
      break;
    }
  }

  const wrongSet = new Set<number>();
  while (wrongSet.size < 3) {
    const spread = Math.max(0.5, answer * 0.3);
    const offset = roundDec((Math.random() - 0.5) * spread * 2, places);
    const wrong = roundDec(answer + (offset === 0 ? 0.1 : offset), places);
    if (Math.abs(wrong - answer) > 0.0001 && wrong >= 0) wrongSet.add(wrong);
  }

  return {
    question,
    answer,
    choices: [...wrongSet, answer].sort(() => Math.random() - 0.5),
    mode: "operations",
    explanation,
  };
}

function generateCompareProblem(places: number): Problem {
  let a = randomDecimal(places, 10);
  let b = randomDecimal(places, 10);
  while (Math.abs(a - b) < 0.0001) b = randomDecimal(places, 10);

  const larger = a > b ? a : b;
  const smaller = a > b ? b : a;

  return {
    question: `Which is larger?`,
    answer: a > b ? "left" : "right",
    choices: ["left", "right"],
    mode: "compare",
    // Piggyback the actual values
    numberLineRange: [a, b],
    explanation: `Compare digit by digit from left to right:\n${a} vs ${b}\n\n${larger} > ${smaller}\n\nTip: If the whole number parts are equal, compare the tenths, then hundredths, etc.`,
  };
}

function generateConvertProblem(places: number, params?: DecimalParams): Problem {
  const types = params?.allowHardConversions
    ? ["frac2dec", "dec2pct", "pct2dec", "dec2frac"] as const
    : ["frac2dec", "dec2pct", "pct2dec"] as const;
  const type = types[Math.floor(Math.random() * types.length)];

  let question: string;
  let answer: string;
  let explanation: string;
  const choices: string[] = [];

  switch (type) {
    case "frac2dec": {
      const denominators = [2, 4, 5, 8, 10, 20, 25];
      const denom = denominators[Math.floor(Math.random() * denominators.length)];
      const numer = Math.floor(Math.random() * (denom - 1)) + 1;
      const decimal = roundDec(numer / denom, 3);
      question = `Convert ${numer}/${denom} to a decimal`;
      answer = String(decimal);
      explanation = `To convert ${numer}/${denom} to a decimal, divide ${numer} by ${denom}:\n${numer} ÷ ${denom} = ${decimal}`;
      // Generate wrong answers
      const wrongs = new Set<string>();
      while (wrongs.size < 3) {
        const offset = roundDec((Math.random() - 0.5) * 0.4, 3);
        const wrong = roundDec(decimal + (offset === 0 ? 0.1 : offset), 3);
        if (String(wrong) !== answer && wrong > 0 && wrong < 1.5) wrongs.add(String(wrong));
      }
      choices.push(...wrongs, answer);
      break;
    }
    case "dec2pct": {
      const decimal = roundDec(Math.random() * 0.99 + 0.01, 2);
      const pct = Math.round(decimal * 100);
      question = `Convert ${decimal} to a percentage`;
      answer = `${pct}%`;
      explanation = `To convert a decimal to a percentage, multiply by 100:\n${decimal} × 100 = ${pct}%\n\nPercent means "per hundred."`;
      const wrongs = new Set<string>();
      while (wrongs.size < 3) {
        const wrong = pct + Math.floor((Math.random() - 0.5) * 30);
        if (wrong !== pct && wrong > 0 && wrong <= 100) wrongs.add(`${wrong}%`);
      }
      choices.push(...wrongs, answer);
      break;
    }
    case "pct2dec": {
      const pct = Math.floor(Math.random() * 99) + 1;
      const decimal = roundDec(pct / 100, 2);
      question = `Convert ${pct}% to a decimal`;
      answer = String(decimal);
      explanation = `To convert a percentage to a decimal, divide by 100:\n${pct}% = ${pct} ÷ 100 = ${decimal}\n\nJust move the decimal point two places to the left.`;
      const wrongs = new Set<string>();
      while (wrongs.size < 3) {
        const wrong = roundDec(decimal + (Math.random() - 0.5) * 0.3, 2);
        if (String(wrong) !== answer && wrong > 0 && wrong < 1.5) wrongs.add(String(wrong));
      }
      choices.push(...wrongs, answer);
      break;
    }
    case "dec2frac": {
      const fracs: [number, number, string][] = [
        [0.5, 1, "1/2"], [0.25, 1, "1/4"], [0.75, 1, "3/4"], [0.2, 1, "1/5"],
        [0.4, 1, "2/5"], [0.6, 1, "3/5"], [0.8, 1, "4/5"], [0.125, 1, "1/8"],
        [0.375, 1, "3/8"], [0.625, 1, "5/8"], [0.875, 1, "7/8"],
      ];
      const pick = fracs[Math.floor(Math.random() * fracs.length)];
      question = `Convert ${pick[0]} to a fraction`;
      answer = pick[2];
      explanation = `${pick[0]} = ${pick[2]}\n\nCommon decimal-to-fraction conversions are worth memorizing!`;
      const wrongFracs = ["1/3", "2/3", "1/6", "5/6", "1/7", "3/7", "2/9", "5/12"];
      const wrongPool = wrongFracs.filter(f => f !== answer);
      const selected = wrongPool.sort(() => Math.random() - 0.5).slice(0, 3);
      choices.push(...selected, answer);
      break;
    }
  }

  return {
    question,
    answer,
    choices: choices.sort(() => Math.random() - 0.5),
    mode: "convert",
    explanation,
  };
}

function generateProblem(modes: DecimalMode[], places: number, params?: DecimalParams): Problem {
  const mode = modes[Math.floor(Math.random() * modes.length)];
  switch (mode) {
    case "numberline": return generateNumberLineProblem(places);
    case "operations": return generateOperationsProblem(places, params);
    case "compare": return generateCompareProblem(places);
    case "convert": return generateConvertProblem(places, params);
  }
}

// ── Constants ──

const DECIMAL_TIPS = [
  "Place value: each position to the right of the decimal is ÷10.",
  "To multiply by 10, move the decimal point one place right.",
  "To divide by 10, move the decimal point one place left.",
  "0.5 = 1/2, 0.25 = 1/4, 0.75 = 3/4, 0.1 = 1/10.",
  "When adding decimals, line up the decimal points.",
  "To convert a fraction to a decimal, divide numerator by denominator.",
  "Percent means 'per hundred': 25% = 25/100 = 0.25.",
  "Comparing decimals: compare digit by digit from left to right.",
];

const COUNTDOWN_SECS = 3;

export function DecimalDashGame() {
  useGameMusic();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [solved, setSolved] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("decimalDash_highScore"));
  const [achievementQueue, setAchievementQueue] = useState<Array<{ name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [problem, setProblem] = useState<Problem | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const problemStartRef = useRef(0);

  // Settings
  const [duration, setDuration] = useState(60);
  const [decimalPlaces, setDecimalPlaces] = useState(1);
  const [enabledModes, setEnabledModes] = useState<DecimalMode[]>(["numberline", "operations", "compare", "convert"]);

  // Adaptive difficulty
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));

  // Practice mode
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceWaiting, setPracticeWaiting] = useState(false);
  const [practiceCorrect, setPracticeCorrect] = useState(0);
  const [practiceTotal, setPracticeTotal] = useState(0);
  const [lastAnswer, setLastAnswer] = useState<{ correct: boolean; problem: Problem } | null>(null);

  const toggleMode = (mode: DecimalMode) => {
    setEnabledModes((prev) => {
      if (prev.includes(mode)) {
        const next = prev.filter((m) => m !== mode);
        return next.length > 0 ? next : prev;
      }
      return [...prev, mode];
    });
  };

  // ── Derive decimal places from adaptive level ──
  const adaptiveParams = getDecimalParams(adaptive.level);
  const effectivePlaces = phase === "playing" || phase === "gameOver" ? adaptiveParams.decimalPlaces : decimalPlaces;

  // ── Countdown ──
  useEffect(() => {
    if (phase !== "countdown") return;
    if (practiceMode) {
      // Skip countdown in practice mode
      sfxCountdownGo();
      const params = getDecimalParams(adaptive.level);
      setPhase("playing");
      setProblem(generateProblem(enabledModes, params.decimalPlaces, params));
      return;
    }
    const t = setTimeout(() => {
      setCountdown((c) => {
        if (c <= 1) {
          sfxCountdownGo();
          setTimeout(() => {
            const params = getDecimalParams(adaptive.level);
            setPhase("playing");
            setProblem(generateProblem(enabledModes, params.decimalPlaces, params));
          }, 0);
          return 0;
        }
        sfxCountdown();
        return c - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, countdown]);

  // Track problem start
  useEffect(() => {
    if (phase === "playing" && problem) problemStartRef.current = Date.now();
  }, [phase, problem]);

  // ── Game timer (not in practice mode) ──
  useEffect(() => {
    if (phase !== "playing" || practiceMode) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setTimeout(() => {
            setPhase("gameOver");
            setScore((s) => {
              setHighScore((h) => {
                if (s > h) { setLocalHighScore("decimalDash_highScore", s); return s; }
                return h;
              });
              return s;
            });
          }, 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, practiceMode]);

  // ── Game over effects ──
  useEffect(() => {
    if (phase !== "gameOver") return;
    sfxGameOver();
    trackGamePlayed("decimal-dash", score);
    const profile = getProfile();
    const total = solved + wrong;
    const newOnes = checkAchievements(
      { gameId: "decimal-dash", score, solved, bestStreak, accuracy: total > 0 ? Math.round((solved / total) * 100) : 0 },
      profile.totalGamesPlayed,
      profile.gamesPlayedByGameId,
    );
    if (newOnes.length > 0) { sfxAchievement(); setAchievementQueue(newOnes); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && phase === "menu") {
        e.preventDefault();
        startGame();
      }
      if (e.key === "Escape" && phase !== "menu") {
        e.preventDefault();
        setPhase("menu");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextPracticeProblem = useCallback(() => {
    const params = getDecimalParams(adaptive.level);
    setProblem(generateProblem(enabledModes, params.decimalPlaces, params));
    setPracticeWaiting(false);
    setLastAnswer(null);
    setFlash(null);
  }, [enabledModes, adaptive.level]);

  const handleAnswer = useCallback(
    (choice: number | string) => {
      if (phase !== "playing" || !problem || practiceWaiting) return;

      const isCorrect =
        typeof choice === "number" && typeof problem.answer === "number"
          ? Math.abs(choice - problem.answer) < 0.0001
          : String(choice) === String(problem.answer);

      if (practiceMode) {
        // Practice mode: no score, show explanation, wait for "Next"
        setPracticeTotal((t) => t + 1);
        if (isCorrect) {
          sfxCorrect();
          setPracticeCorrect((c) => c + 1);
          setFlash("correct");
        } else {
          sfxWrong();
          setFlash("wrong");
        }
        setAdaptive(prev => adaptiveUpdate(prev, isCorrect, false));
        setLastAnswer({ correct: isCorrect, problem });
        setPracticeWaiting(true);
        return;
      }

      if (isCorrect) {
        const newStreak = streak + 1;
        const { mult } = getMultiplierFromStreak(newStreak);
        const elapsed = (Date.now() - problemStartRef.current) / 1000;
        const timeBonus = Math.max(0, Math.round((10 - elapsed) * 2));
        const points = Math.round((15 + timeBonus) * mult);
        setScore((s) => s + points);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        setSolved((s) => s + 1);
        setFlash("correct");
        if (newStreak > 1 && newStreak % 5 === 0) sfxCombo(newStreak);
        else sfxCorrect();
        // Adaptive: fast = answered in < 50% of timer (< 5s for a 10s window)
        const wasFast = elapsed < (duration * 0.5 / (duration / 10));
        setAdaptive(prev => adaptiveUpdate(prev, true, wasFast));
      } else {
        sfxWrong();
        setStreak(0);
        setWrong((w) => w + 1);
        setFlash("wrong");
        setAdaptive(prev => adaptiveUpdate(prev, false, false));
      }

      setTimeout(() => setFlash(null), 200);
      const params = getDecimalParams(adaptive.level);
      setProblem(generateProblem(enabledModes, params.decimalPlaces, params));
      setTipIdx(Math.floor(Math.random() * DECIMAL_TIPS.length));
    },
    [phase, problem, streak, enabledModes, duration, adaptive.level, practiceMode, practiceWaiting],
  );

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSolved(0);
    setWrong(0);
    setTimeLeft(duration);
    setCountdown(COUNTDOWN_SECS);
    setAchievementQueue([]);
    setShowAchievementIndex(0);
    setPracticeWaiting(false);
    setPracticeCorrect(0);
    setPracticeTotal(0);
    setLastAnswer(null);
    setAdaptive(createAdaptiveState(1));
    setPhase("countdown");
  };

  const timerColor = timeLeft > 20 ? "text-green-400" : timeLeft > 10 ? "text-yellow-400" : "text-red-400";
  const timerBarWidth = (timeLeft / duration) * 100;
  const total = solved + wrong;
  const accuracy = total > 0 ? Math.round((solved / total) * 100) : 0;
  const placesLabel = effectivePlaces === 1 ? "Tenths" : effectivePlaces === 2 ? "Hundredths" : "Thousandths";

  // ── Number line SVG renderer ──
  const renderNumberLine = (problem: Problem) => {
    if (!problem.numberLineRange || problem.numberLineTarget === undefined) return null;
    const [min, max] = problem.numberLineRange;
    const target = problem.numberLineTarget;
    const width = 320;
    const padding = 20;
    const innerWidth = width - padding * 2;
    const ticks = 11;

    return (
      <svg viewBox={`0 0 ${width} 60`} className="w-full max-w-sm mx-auto">
        {/* Main line */}
        <line x1={padding} y1={30} x2={width - padding} y2={30} stroke="#475569" strokeWidth={2} />
        {/* Ticks */}
        {Array.from({ length: ticks }).map((_, i) => {
          const x = padding + (innerWidth * i) / (ticks - 1);
          const val = roundDec(min + ((max - min) * i) / (ticks - 1), 3);
          return (
            <g key={i}>
              <line x1={x} y1={24} x2={x} y2={36} stroke="#64748b" strokeWidth={1.5} />
              {(i === 0 || i === ticks - 1 || i === 5) && (
                <text x={x} y={50} textAnchor="middle" fill="#94a3b8" fontSize={10} fontFamily="monospace">
                  {val}
                </text>
              )}
            </g>
          );
        })}
        {/* Target marker */}
        <circle cx={padding + (innerWidth * (target - min)) / (max - min)} cy={30} r={6} fill="#f472b6" stroke="#ec4899" strokeWidth={2} />
        <text x={padding + (innerWidth * (target - min)) / (max - min)} y={16} textAnchor="middle" fill="#f472b6" fontSize={11} fontWeight="bold">
          ?
        </text>
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-pink-950 to-slate-950 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Decimal Dash</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* ── MENU ── */}
        {phase === "menu" && (
          <div className="text-center w-full">
            <div className="text-6xl mb-4">🔢</div>
            <h2 className="text-3xl font-bold text-white mb-2">Decimal Dash</h2>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Fast-paced decimal challenges with number lines, operations, and conversions!
            </p>

            {/* Mode toggles */}
            <div className="max-w-xs mx-auto mb-4 space-y-1.5">
              <div className="text-xs text-slate-500 text-left mb-1">Modes</div>
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  ["numberline", "Number Line"],
                  ["operations", "Operations"],
                  ["compare", "Compare"],
                  ["convert", "Convert"],
                ] as [DecimalMode, string][]).map(([mode, label]) => (
                  <button key={mode} onClick={() => toggleMode(mode)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${enabledModes.includes(mode) ? "bg-pink-500/25 border border-pink-400/50 text-pink-400" : "bg-white/5 border border-white/10 text-slate-600"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Practice mode toggle */}
            <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer max-w-xs mx-auto mb-4">
              <div className="text-left">
                <span className="text-xs text-slate-400">Practice mode</span>
                <div className="text-[10px] text-slate-600">No timer, detailed explanations, learn at your own pace</div>
              </div>
              <input type="checkbox" checked={practiceMode} onChange={(e) => setPracticeMode(e.target.checked)}
                className="rounded accent-pink-500 w-4 h-4" />
            </label>

            {/* Duration slider (hidden in practice mode) */}
            {!practiceMode && (
              <div className="max-w-xs mx-auto mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">Duration</span>
                  <span className="text-xs font-bold text-pink-400 tabular-nums">{duration >= 60 ? `${Math.floor(duration / 60)}m${duration % 60 ? ` ${duration % 60}s` : ""}` : `${duration}s`}</span>
                </div>
                <input type="range" min={30} max={300} step={30} value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-pink-500" />
                <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                  <span>30s sprint</span><span>5 min marathon</span>
                </div>
              </div>
            )}

            {/* Decimal places slider (info only — adaptive controls this) */}
            <div className="max-w-xs mx-auto mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Starting Difficulty</span>
                <span className="text-xs font-bold text-pink-400">{decimalPlaces} ({decimalPlaces === 1 ? "Tenths" : decimalPlaces === 2 ? "Hundredths" : "Thousandths"})</span>
              </div>
              <input type="range" min={1} max={3} step={1} value={decimalPlaces}
                onChange={(e) => setDecimalPlaces(Number(e.target.value))}
                className="w-full accent-pink-500" />
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>0.1 (Easy)</span><span>0.001 (Hard)</span>
              </div>
              <div className="text-[9px] text-slate-600 text-center mt-1">Difficulty adapts as you play!</div>
            </div>

            <button onClick={startGame}
              className="px-10 py-4 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-500/30">
              {practiceMode ? "Start Practice" : "Start"}
            </button>
            {highScore > 0 && !practiceMode && (
              <div className="mt-4 flex items-center justify-center gap-2 text-yellow-400 text-sm">
                <Trophy className="w-4 h-4" /> Best: {highScore}
              </div>
            )}
          </div>
        )}

        {/* ── COUNTDOWN ── */}
        {phase === "countdown" && (
          <div className="text-center">
            <div className="text-8xl font-bold text-pink-400 animate-pulse">
              {countdown || "GO!"}
            </div>
          </div>
        )}

        {/* ── PLAYING ── */}
        {phase === "playing" && problem && (
          <div className="w-full space-y-4">
            {/* Timer bar (not in practice mode) */}
            {!practiceMode && (
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${timerBarWidth}%`, background: timeLeft > 20 ? "#ec4899" : timeLeft > 10 ? "#f59e0b" : "#ef4444" }} />
              </div>
            )}

            {/* Tip */}
            {!practiceWaiting && (
              <div className="text-center text-[11px] text-slate-500 italic px-4">
                💡 {DECIMAL_TIPS[tipIdx % DECIMAL_TIPS.length]}
              </div>
            )}

            {/* HUD */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {practiceMode ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-400 font-medium">Practice</span>
                    <span className="text-slate-400 tabular-nums">
                      {practiceCorrect}/{practiceTotal}
                    </span>
                  </div>
                ) : (
                  <>
                    <Timer className={`w-5 h-5 ${timerColor}`} />
                    <span className={`text-2xl font-bold tabular-nums ${timerColor}`}>{timeLeft}s</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StreakBadge streak={streak} />
                {/* Adaptive difficulty badge */}
                {(() => {
                  const dl = getDifficultyLabel(adaptive.level);
                  return (
                    <div className="flex items-center gap-1.5">
                      <div className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ color: dl.color, borderColor: dl.color + "40", backgroundColor: dl.color + "15" }}>
                        {dl.emoji} {dl.label}
                      </div>
                      {adaptive.lastAdjust && Date.now() - adaptive.lastAdjustTime < 2000 && (
                        <span className={`text-[10px] font-bold animate-bounce ${adaptive.lastAdjust === "up" ? "text-red-400" : "text-green-400"}`}>
                          {adaptive.lastAdjust === "up" ? "↑ Harder!" : "↓ Easier"}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
              {!practiceMode && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-white tabular-nums">{score}</div>
                  <div className="text-xs text-slate-400">{solved} solved</div>
                </div>
              )}
            </div>

            {/* Flash */}
            {flash && !practiceWaiting && (
              <div className={`fixed inset-0 pointer-events-none z-50 ${flash === "correct" ? "bg-green-500/10" : "bg-red-500/15"}`} />
            )}

            {/* Mode badge */}
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-wider text-pink-400/70 font-bold">
                {problem.mode === "numberline" ? "Number Line" : problem.mode === "operations" ? "Operations" : problem.mode === "compare" ? "Compare" : "Convert"}
              </span>
              <span className="text-[10px] text-slate-600 ml-2">({placesLabel})</span>
            </div>

            {/* ── Number Line mode ── */}
            {problem.mode === "numberline" && (
              <div className="space-y-4">
                <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-lg">
                  {renderNumberLine(problem)}
                  <div className="text-center text-lg font-bold text-white mt-3">
                    What value is at the marker?
                  </div>
                </div>
                {!practiceWaiting && (
                  <div className="grid grid-cols-2 gap-3">
                    {problem.choices.map((choice, i) => (
                      <button key={i} onClick={() => handleAnswer(choice)}
                        className="py-4 bg-white/10 hover:bg-pink-500/25 border border-white/10 hover:border-pink-400/40 rounded-xl text-xl font-bold text-white transition-all active:scale-95">
                        {choice}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Operations mode ── */}
            {problem.mode === "operations" && (
              <div className="space-y-4">
                <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center shadow-lg">
                  <div className="text-4xl font-bold text-white mb-2 tracking-wide">{problem.question}</div>
                  <div className="text-lg text-slate-400">= ?</div>
                </div>
                {!practiceWaiting && (
                  <div className="grid grid-cols-2 gap-3">
                    {problem.choices.map((choice, i) => (
                      <button key={i} onClick={() => handleAnswer(choice)}
                        className="py-4 bg-white/10 hover:bg-pink-500/25 border border-white/10 hover:border-pink-400/40 rounded-xl text-xl font-bold text-white transition-all active:scale-95">
                        {choice}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Compare mode ── */}
            {problem.mode === "compare" && problem.numberLineRange && (
              <div className="space-y-4">
                <div className="text-center text-lg font-bold text-white">Which is larger?</div>
                {!practiceWaiting ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleAnswer("left")}
                      className="py-8 bg-white/[0.06] hover:bg-pink-500/20 border border-white/10 hover:border-pink-400/40 rounded-2xl text-3xl font-bold text-white transition-all active:scale-95">
                      {problem.numberLineRange[0]}
                    </button>
                    <button onClick={() => handleAnswer("right")}
                      className="py-8 bg-white/[0.06] hover:bg-pink-500/20 border border-white/10 hover:border-pink-400/40 rounded-2xl text-3xl font-bold text-white transition-all active:scale-95">
                      {problem.numberLineRange[1]}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`py-8 rounded-2xl text-3xl font-bold text-center border ${lastAnswer?.problem.answer === "left" ? "border-green-400/40 bg-green-500/10 text-green-400" : "border-white/10 bg-white/[0.03] text-slate-500"}`}>
                      {problem.numberLineRange[0]}
                    </div>
                    <div className={`py-8 rounded-2xl text-3xl font-bold text-center border ${lastAnswer?.problem.answer === "right" ? "border-green-400/40 bg-green-500/10 text-green-400" : "border-white/10 bg-white/[0.03] text-slate-500"}`}>
                      {problem.numberLineRange[1]}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Convert mode ── */}
            {problem.mode === "convert" && (
              <div className="space-y-4">
                <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center shadow-lg">
                  <div className="text-2xl font-bold text-white">{problem.question}</div>
                </div>
                {!practiceWaiting && (
                  <div className="grid grid-cols-2 gap-3">
                    {problem.choices.map((choice, i) => (
                      <button key={i} onClick={() => handleAnswer(choice)}
                        className="py-4 bg-white/10 hover:bg-pink-500/25 border border-white/10 hover:border-pink-400/40 rounded-xl text-xl font-bold text-white transition-all active:scale-95">
                        {choice}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Practice mode: feedback + explanation + next button */}
            {practiceMode && practiceWaiting && lastAnswer && (
              <div className="space-y-3">
                <div className={`rounded-xl border p-4 text-center ${lastAnswer.correct ? "border-green-400/30 bg-green-500/10" : "border-red-400/30 bg-red-500/10"}`}>
                  <div className={`text-lg font-bold ${lastAnswer.correct ? "text-green-400" : "text-red-400"}`}>
                    {lastAnswer.correct ? "Correct!" : `Wrong — answer: ${lastAnswer.problem.answer}`}
                  </div>
                </div>
                {lastAnswer.problem.explanation && (
                  <div className="text-xs text-slate-400 whitespace-pre-line text-left bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                    {lastAnswer.problem.explanation}
                  </div>
                )}
                <div className="flex justify-center">
                  <button onClick={nextPracticeProblem}
                    className="px-6 py-3 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── GAME OVER ── */}
        {phase === "gameOver" && (
          <div className="text-center">
            <Hash className="w-16 h-16 text-pink-400 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-white mb-2">{practiceMode ? "Practice Complete" : "Time\u2019s Up!"}</h3>
            {!practiceMode && <div className="text-5xl font-bold text-pink-400 mb-2">{score}</div>}
            <div className="text-slate-400 space-y-1 mb-2">
              {practiceMode ? (
                <p>{practiceCorrect}/{practiceTotal} correct</p>
              ) : (
                <>
                  <p>{solved} solved, {wrong} wrong ({accuracy}%)</p>
                  <p>Best streak: x{bestStreak}</p>
                </>
              )}
            </div>
            {/* Final adaptive level */}
            <div className="mb-4">
              {(() => {
                const dl = getDifficultyLabel(adaptive.level);
                return (
                  <p className="text-sm text-slate-400">
                    Final difficulty:{" "}
                    <span className="font-bold" style={{ color: dl.color }}>
                      {dl.emoji} {dl.label} ({adaptive.level.toFixed(1)})
                    </span>
                  </p>
                );
              })()}
            </div>
            {!practiceMode && score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-sm font-medium mb-2 flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" /> New High Score!
              </p>
            )}
            {!practiceMode && (
              <div className="mb-3">
                <ScoreSubmit game="decimal-dash" score={score} level={Math.round(adaptive.level)}
                  stats={{ solved, wrong, accuracy: `${accuracy}%`, bestStreak, finalLevel: adaptive.level.toFixed(1) }} />
              </div>
            )}
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
              <button onClick={startGame}
                className="px-6 py-3 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
              <Link href="/games" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all">
                Back
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
