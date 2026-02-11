"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Star, Check, X, ChevronRight } from "lucide-react";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, HeartRecovery, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxCombo, sfxLevelUp, sfxGameOver, sfxHeart, sfxAchievement, sfxCountdown, sfxCountdownGo, sfxStreakLost, sfxPerfect } from "@/lib/games/audio";
import { createAdaptiveState, adaptiveUpdate, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import { getGradeForLevel } from "@/lib/games/learning-guide";
import Link from "next/link";

type GamePhase = "menu" | "countdown" | "playing" | "feedback" | "complete";
const COUNTDOWN_SECS = 3;
type GameMode = "sprint" | "survival" | "target";

interface Problem {
  a: number;
  b: number;
  answer: number;
  choices: number[];
}

// ── Adaptive → multiplication params mapping ──

interface MultParams {
  /** Which tables to include */
  tables: number[];
  /** Max multiplier (b value) */
  maxMultiplier: number;
  /** Whether to include "reverse" problems (e.g., _ × 7 = 49) */
  allowReverse: boolean;
}

function getMultParams(level: number): MultParams {
  const l = Math.max(1, Math.min(50, level));

  // Level 1-5: tables 2-5, ×1-10
  // Level 5-10: tables 2-9, ×1-12
  // Level 10-20: tables 2-12, ×1-12
  // Level 20-30: tables 2-15 (extended), ×1-15
  // Level 30+: tables 2-20, ×1-20
  let tables: number[];
  if (l < 5) {
    tables = [2, 3, 4, 5];
  } else if (l < 10) {
    tables = [2, 3, 4, 5, 6, 7, 8, 9];
  } else if (l < 20) {
    tables = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  } else if (l < 30) {
    const max = Math.min(Math.floor(12 + (l - 20) * 0.3), 15);
    tables = Array.from({ length: max - 1 }, (_, i) => i + 2);
  } else {
    const max = Math.min(Math.floor(15 + (l - 30) * 0.25), 20);
    tables = Array.from({ length: max - 1 }, (_, i) => i + 2);
  }

  return {
    tables,
    maxMultiplier: l < 5 ? 10 : l < 15 ? 12 : Math.min(Math.floor(12 + (l - 15) * 0.2), 20),
    allowReverse: l >= 15,
  };
}

// ── Grid visualization for multiplication ──

function MultGrid({ a, b, highlight, color }: { a: number; b: number; highlight: boolean; color: string }) {
  const maxDots = 12;
  const rows = Math.min(a, maxDots);
  const cols = Math.min(b, maxDots);
  return (
    <div className="flex flex-col items-center gap-[2px]">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-[2px]">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="rounded-full transition-all duration-300"
              style={{
                width: Math.max(4, 28 / Math.max(rows, cols)),
                height: Math.max(4, 28 / Math.max(rows, cols)),
                backgroundColor: highlight ? color : `${color}44`,
                boxShadow: highlight ? `0 0 4px ${color}40` : "none",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Problem generation ──

function generateProblem(tables: number[], usedPairs: Set<string>, maxMultiplier = 12): Problem {
  let a: number, b: number;
  let attempts = 0;
  do {
    a = tables[Math.floor(Math.random() * tables.length)];
    b = Math.floor(Math.random() * maxMultiplier) + 1;
    attempts++;
  } while (usedPairs.has(`${a}x${b}`) && attempts < 50);
  usedPairs.add(`${a}x${b}`);

  const answer = a * b;

  // Smart distractors — common mistakes
  const wrongSet = new Set<number>();
  // Off by one table
  if (a > 1) wrongSet.add((a - 1) * b);
  wrongSet.add((a + 1) * b);
  // Off by one multiplier
  if (b > 1) wrongSet.add(a * (b - 1));
  wrongSet.add(a * (b + 1));
  // Random near answers — safety limit to prevent infinite loop
  let safetyCounter = 0;
  while (wrongSet.size < 5 && safetyCounter < 100) {
    safetyCounter++;
    const spread = Math.max(a, 3) * 2;
    const offset = Math.floor(Math.random() * spread) - Math.floor(spread / 2);
    const wrong = answer + (offset === 0 ? 1 : offset);
    if (wrong > 0 && wrong !== answer) wrongSet.add(wrong);
  }
  // Fallback: fill with simple offsets if needed
  for (let i = 1; wrongSet.size < 5; i++) {
    if (answer + i !== answer) wrongSet.add(answer + i);
    if (wrongSet.size < 5 && answer - i > 0) wrongSet.add(answer - i);
  }

  // Pick 3 wrong answers
  const wrongs = [...wrongSet].filter((w) => w !== answer).slice(0, 3);
  const choices = [...wrongs, answer].sort(() => Math.random() - 0.5);

  return { a, b, answer, choices };
}

// ── Mode configs ──

const MODES = {
  sprint: {
    label: "Speed Sprint",
    emoji: "⚡",
    description: "20 problems, fastest time wins",
    color: "#10b981",
    totalProblems: 20,
  },
  survival: {
    label: "Survival",
    emoji: "❤️",
    description: "3 lives, how far can you go?",
    color: "#ef4444",
    totalProblems: 999,
  },
  target: {
    label: "Target Score",
    emoji: "🎯",
    description: "Reach 500 points, combos help!",
    color: "#6366f1",
    totalProblems: 999,
  },
} as const;

const TABLE_GROUPS = [
  { label: "Tables 2-5", tables: [2, 3, 4, 5], color: "#22c55e" },
  { label: "Tables 2-9", tables: [2, 3, 4, 5, 6, 7, 8, 9], color: "#f59e0b" },
  { label: "Tables 2-12", tables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], color: "#ef4444" },
  { label: "Tables 6-12", tables: [6, 7, 8, 9, 10, 11, 12], color: "#a855f7" },
];

const MULT_TIPS = [
  "Multiplying by 9? The digits of the answer always add up to 9!",
  "Any number × 0 = 0, any number × 1 = the number itself.",
  "To multiply by 5, multiply by 10 then divide by 2.",
  "Multiplication is commutative: 3 × 7 = 7 × 3.",
  "Square numbers: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144.",
  "To multiply by 11, add the digits and put the sum in the middle.",
  "Double and halve: 4 × 15 = 8 × 7.5 — works for mental math!",
  "The product of two even numbers is always even.",
];

const TARGET_SCORE = 500;

export function TimesTableGame() {
  useGameMusic();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [mode, setMode] = useState<GameMode>("sprint");
  const [tables, setTables] = useState(TABLE_GROUPS[0].tables);
  const [tableIdx, setTableIdx] = useState(0);
  const [sprintCount, setSprintCount] = useState(20);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [solved, setSolved] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [usedPairs] = useState(new Set<string>());
  const [highScore, setHighScore] = useState(() => getLocalHighScore("timesTable_highScore"));
  const [achievementQueue, setAchievementQueue] = useState<Array<{ name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [showHeartRecovery, setShowHeartRecovery] = useState(false);
  const [multTipIdx, setMultTipIdx] = useState(0);
  const startRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streakRef = useRef(0);
  const solvedRef = useRef(0);
  const scoreRef = useRef(0);
  const elapsedRef = useRef(0);
  const wrongRef = useRef(0);
  const highScoreRef = useRef(0);
  const [countdownVal, setCountdownVal] = useState(COUNTDOWN_SECS);
  const SURVIVAL_LIVES = 3;

  // Adaptive difficulty
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));

  // Practice mode
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceWaiting, setPracticeWaiting] = useState(false);
  const [practiceCorrect, setPracticeCorrect] = useState(0);
  const [practiceTotal, setPracticeTotal] = useState(0);
  const problemStartRef = useRef(0);

  // Keep refs in sync with state
  useEffect(() => { streakRef.current = streak; }, [streak]);
  useEffect(() => { solvedRef.current = solved; }, [solved]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);
  useEffect(() => { wrongRef.current = wrong; }, [wrong]);
  useEffect(() => { highScoreRef.current = highScore; }, [highScore]);

  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setMultTipIdx((i) => (i + 1) % MULT_TIPS.length), 8000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "complete") return;
    const finalScore = !practiceMode && mode === "sprint" ? Math.max(1, 1000 - elapsed * 5 - wrong * 50) : score;
    trackGamePlayed("times-table", finalScore);
    const profile = getProfile();
    const newOnes = checkAchievements(
      { gameId: "times-table", score: finalScore, mode, timeSeconds: elapsed, elapsed },
      profile.totalGamesPlayed,
      profile.gamesPlayedByGameId
    );
    if (newOnes.length > 0) { sfxAchievement(); setAchievementQueue(newOnes); }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps -- run once on complete

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (practiceMode) {
      // Skip countdown in practice mode
      sfxCountdownGo();
      setPhase("playing");
      startRef.current = Date.now();
      return;
    }
    if (countdownVal <= 0) {
      sfxCountdownGo();
      setPhase("playing");
      startRef.current = Date.now();
      return;
    }
    sfxCountdown();
    const t = setTimeout(() => setCountdownVal((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdownVal, practiceMode]);

  // Timer (not in practice mode)
  useEffect(() => {
    if (phase !== "playing" || practiceMode) return;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 250);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, practiceMode]);

  // Track problem start for "fast" detection
  useEffect(() => {
    if (phase === "playing" && problem) problemStartRef.current = Date.now();
  }, [phase, problem]);

  // Derive adaptive tables for problem generation
  const adaptiveParams = getMultParams(adaptive.level);

  const nextProblem = useCallback(() => {
    const params = getMultParams(adaptive.level);
    // Merge user-selected tables with adaptive tables
    // Use adaptive tables as the primary source, but respect user's base selection direction
    setProblem(generateProblem(params.tables, usedPairs, params.maxMultiplier));
    setFeedback(null);
    setSelectedAnswer(null);
    setPracticeWaiting(false);
    setPhase("playing");
  }, [usedPairs, adaptive.level]);

  const finishGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const acc = solvedRef.current + wrongRef.current > 0
      ? solvedRef.current / (solvedRef.current + wrongRef.current)
      : 1;
    if (acc >= 1.0 && solvedRef.current > 0) sfxPerfect();
    else sfxLevelUp();
    setPhase("complete");
    const finalScore = !practiceMode && mode === "sprint" ? Math.max(1, 1000 - elapsedRef.current * 5 - wrongRef.current * 50) : scoreRef.current;
    scoreRef.current = finalScore;
    setScore(finalScore);
    if (!practiceMode && finalScore > highScoreRef.current) {
      highScoreRef.current = finalScore;
      setHighScore(finalScore);
      setLocalHighScore("timesTable_highScore", finalScore);
    }
  }, [mode, practiceMode]);

  const handleAnswer = useCallback(
    (choice: number) => {
      if (phase !== "playing" || !problem || practiceWaiting) return;
      setSelectedAnswer(choice);
      const answerTime = (Date.now() - problemStartRef.current) / 1000;

      if (practiceMode) {
        // Practice mode: no lives/score, show grid explanation, wait for "Next"
        setPracticeTotal((t) => t + 1);
        if (choice === problem.answer) {
          sfxCorrect();
          setPracticeCorrect((c) => c + 1);
          setFeedback("correct");
          setAdaptive(prev => adaptiveUpdate(prev, true, false));
        } else {
          sfxWrong();
          setFeedback("wrong");
          setAdaptive(prev => adaptiveUpdate(prev, false, false));
        }
        setPracticeWaiting(true);
        return;
      }

      if (choice === problem.answer) {
        const newStreak = streakRef.current + 1;
        streakRef.current = newStreak;
        const { mult } = getMultiplierFromStreak(newStreak);
        const points = Math.round(10 * mult);
        scoreRef.current += points;
        setScore((s) => s + points);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        solvedRef.current += 1;
        setSolved((s) => s + 1);
        setFeedback("correct");
        if (newStreak > 1 && newStreak % 5 === 0) sfxCombo(newStreak);
        else sfxCorrect();
        if (mode === "survival" && newStreak >= 10 && newStreak % 10 === 0 && lives < SURVIVAL_LIVES) {
          sfxHeart();
          setShowHeartRecovery(true);
          setTimeout(() => setShowHeartRecovery(false), 1500);
          setLives((l) => Math.min(SURVIVAL_LIVES, l + 1));
        }
        // Adaptive: fast = answered in < 3s
        const wasFast = answerTime < 3;
        setAdaptive(prev => adaptiveUpdate(prev, true, wasFast));

        setTimeout(() => {
          if (mode === "sprint" && solvedRef.current >= sprintCount) {
            finishGame();
          } else if (mode === "target" && scoreRef.current >= TARGET_SCORE) {
            finishGame();
          } else {
            nextProblem();
          }
        }, 600);
      } else {
        if (streakRef.current > 0) sfxStreakLost();
        sfxWrong();
        streakRef.current = 0;
        setStreak(0);
        wrongRef.current += 1;
        setWrong((w) => w + 1);
        setFeedback("wrong");
        setAdaptive(prev => adaptiveUpdate(prev, false, false));

        if (mode === "survival") {
          const newLives = lives - 1;
          setLives(newLives);
          if (newLives <= 0) {
            setTimeout(() => finishGame(), 800);
            return;
          }
        }

        setTimeout(() => {
          setFeedback(null);
          setSelectedAnswer(null);
        }, 800);
      }
    },
    [phase, problem, mode, lives, sprintCount, nextProblem, finishGame, practiceMode, practiceWaiting]
  );

  const startGame = useCallback((m: GameMode) => {
    setMode(m);
    scoreRef.current = 0;
    setScore(0);
    streakRef.current = 0;
    setStreak(0);
    setBestStreak(0);
    solvedRef.current = 0;
    setSolved(0);
    wrongRef.current = 0;
    setWrong(0);
    setLives(SURVIVAL_LIVES);
    setShowHeartRecovery(false);
    elapsedRef.current = 0;
    setElapsed(0);
    setAchievementQueue([]);
    setShowAchievementIndex(0);
    setPracticeWaiting(false);
    setPracticeCorrect(0);
    setPracticeTotal(0);
    setAdaptive(createAdaptiveState(1));
    usedPairs.clear();
    const params = getMultParams(1); // start at level 1
    setProblem(generateProblem(params.tables, usedPairs, params.maxMultiplier));
    setFeedback(null);
    setSelectedAnswer(null);
    setCountdownVal(COUNTDOWN_SECS);
    setPhase("countdown");
  }, [usedPairs]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && phase === "menu") {
        e.preventDefault();
        startGame(mode);
      }
      if (e.key === "Escape" && phase !== "menu") {
        e.preventDefault();
        setPhase("menu");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, mode, startGame]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const accuracy = solved + wrong > 0 ? Math.round((solved / (solved + wrong)) * 100) : 100;

  // Get current adaptive table description for display
  const adaptiveTableDesc = (() => {
    const p = adaptiveParams;
    const min = Math.min(...p.tables);
    const max = Math.max(...p.tables);
    return `${min}-${max}`;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-violet-950 to-slate-950 flex flex-col items-center">
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Times Tables</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* MENU */}
        {phase === "menu" && (
          <div className="w-full space-y-5 text-center">
            <div>
              <div className="text-5xl mb-2">✖️</div>
              <h2 className="text-3xl font-bold text-white mb-1">Times Tables</h2>
              <p className="text-slate-400 text-sm">Master multiplication with visual grids and smart drills</p>
            </div>

            {/* Table range picker */}
            <div className="space-y-2">
              <div className="text-xs text-slate-500 uppercase tracking-wider">Starting tables (adapts as you play!)</div>
              <div className="grid grid-cols-2 gap-2">
                {TABLE_GROUPS.map((g, i) => (
                  <button
                    key={g.label}
                    onClick={() => { setTables(g.tables); setTableIdx(i); }}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${
                      tableIdx === i ? "border-white/20 bg-white/10 text-white" : "border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sprint problems slider */}
            {!practiceMode && (
              <div className="max-w-xs mx-auto">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">Sprint problems</span>
                  <span className="text-xs font-bold text-amber-400 tabular-nums">{sprintCount}</span>
                </div>
                <input type="range" min={5} max={50} step={5} value={sprintCount}
                  onChange={(e) => setSprintCount(Number(e.target.value))}
                  className="w-full accent-amber-500" />
                <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                  <span>Quick 5</span><span>Endurance 50</span>
                </div>
              </div>
            )}

            {/* Toggles */}
            <div className="space-y-2 max-w-xs mx-auto">
              <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
                <span className="text-xs text-slate-400">Show visual grid</span>
                <input type="checkbox" checked={showGrid} onChange={() => setShowGrid(!showGrid)} className="rounded accent-amber-500 w-4 h-4" />
              </label>

              {/* Practice mode toggle */}
              <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
                <div className="text-left">
                  <span className="text-xs text-slate-400">Practice mode</span>
                  <div className="text-[10px] text-slate-600">No timer, grid explanations, learn at your own pace</div>
                </div>
                <input type="checkbox" checked={practiceMode} onChange={(e) => setPracticeMode(e.target.checked)}
                  className="rounded accent-violet-500 w-4 h-4" />
              </label>
            </div>

            {/* Mode picker (hidden in practice mode — practice is its own mode) */}
            {practiceMode ? (
              <div className="space-y-2">
                <button
                  onClick={() => startGame("survival")}
                  className="w-full py-3 px-4 rounded-xl border border-violet-400/30 bg-violet-500/10 hover:bg-violet-500/20 transition-all flex items-center gap-3 active:scale-[0.98]"
                >
                  <span className="text-2xl">📖</span>
                  <div className="text-left flex-1">
                    <div className="text-white font-bold text-sm">Start Practice</div>
                    <div className="text-slate-500 text-xs">No timer, no lives — just learn</div>
                  </div>
                  <span className="text-slate-600">→</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Game mode</div>
                {(["sprint", "survival", "target"] as GameMode[]).map((m) => {
                  const mc = MODES[m];
                  return (
                    <button
                      key={m}
                      onClick={() => startGame(m)}
                      className="w-full py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-3 active:scale-[0.98]"
                    >
                      <span className="text-2xl">{mc.emoji}</span>
                      <div className="text-left flex-1">
                        <div className="text-white font-bold text-sm">{mc.label}</div>
                        <div className="text-slate-500 text-xs">{mc.description}</div>
                      </div>
                      <span className="text-slate-600">→</span>
                    </button>
                  );
                })}
              </div>
            )}

            {highScore > 0 && !practiceMode && (
              <div className="flex items-center justify-center gap-1.5 text-yellow-400/70 text-xs">
                <Trophy className="w-3 h-3" /> Best: {highScore}
              </div>
            )}
          </div>
        )}

        {/* COUNTDOWN */}
        {phase === "countdown" && (
          <div className="text-center">
            <div className="text-8xl font-bold text-amber-400 animate-pulse tabular-nums">
              {countdownVal > 0 ? countdownVal : "GO!"}
            </div>
          </div>
        )}

        {/* PLAYING */}
        {(phase === "playing" || phase === "feedback") && problem && (
          <div className="w-full space-y-4">
            {/* HUD */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                {practiceMode ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-400 font-medium">Practice</span>
                    <span className="text-slate-400 tabular-nums">
                      {practiceCorrect}/{practiceTotal}
                    </span>
                  </div>
                ) : (
                  <>
                    {mode === "survival" && (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: SURVIVAL_LIVES }).map((_, i) => (
                            <span key={i} className={`text-lg transition-all ${i < lives ? "" : "opacity-20"}`}>❤️</span>
                          ))}
                        </div>
                        <HeartRecovery show={showHeartRecovery} />
                      </div>
                    )}
                    {mode === "sprint" && (
                      <span className="text-slate-400 tabular-nums">{solved}/{sprintCount}</span>
                    )}
                    {mode === "target" && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(100, (score / TARGET_SCORE) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{score}/{TARGET_SCORE}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <StreakBadge streak={streak} />
                {/* Adaptive difficulty badge */}
                {(() => {
                  const dl = getDifficultyLabel(adaptive.level);
                  return (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold" style={{ color: dl.color }}>{dl.emoji} {dl.label}</span>
                      <span className="text-xs text-white/60">Lvl {Math.round(adaptive.level)} &middot; {getGradeForLevel(adaptive.level).label}</span>
                      {adaptive.lastAdjust && Date.now() - adaptive.lastAdjustTime < 2000 && (
                        <span className={`text-[10px] font-bold animate-bounce ${adaptive.lastAdjust === "up" ? "text-red-400" : "text-green-400"}`}>
                          {adaptive.lastAdjust === "up" ? "↑ Harder!" : "↓ Easier"}
                        </span>
                      )}
                    </div>
                  );
                })()}
                {!practiceMode && <span className="text-white font-bold tabular-nums">{formatTime(elapsed)}</span>}
              </div>
            </div>

            {/* Adaptive table range indicator */}
            <div className="text-center text-[10px] text-slate-600">
              Tables {adaptiveTableDesc} · ×1-{adaptiveParams.maxMultiplier}
            </div>

            {/* Multiplication tip */}
            {!feedback && !practiceWaiting && (
              <div className="text-center text-[11px] text-slate-500 italic px-4">
                💡 {MULT_TIPS[multTipIdx]}
              </div>
            )}

            {/* Problem display */}
            <div className={`rounded-2xl border p-6 text-center transition-all duration-300 shadow-lg ${
              feedback === "correct" ? "border-green-400/30 bg-green-500/10 shadow-green-500/10" :
              feedback === "wrong" ? "border-red-400/30 bg-red-500/10 shadow-red-500/10" :
              "border-white/10 bg-white/5 shadow-black/20"
            }`}>
              {/* Visual grid */}
              {showGrid && (
                <div className="mb-4 flex justify-center">
                  <MultGrid a={problem.a} b={problem.b} highlight={feedback === "correct"} color={TABLE_GROUPS[Math.min(tableIdx, TABLE_GROUPS.length - 1)].color} />
                </div>
              )}

              <div className="text-4xl sm:text-5xl font-bold text-white mb-1">
                {problem.a} × {problem.b}
              </div>

              {feedback === "correct" && (
                <div className="flex items-center justify-center gap-1.5 text-green-400 text-lg font-bold mt-1">
                  <Check className="w-5 h-5" /> {problem.answer}
                </div>
              )}
              {feedback === "wrong" && (
                <div className="flex items-center justify-center gap-1.5 text-red-400 text-sm font-medium mt-1">
                  <X className="w-4 h-4" /> Answer: {problem.answer}
                </div>
              )}
            </div>

            {/* Choices (hidden when practice is waiting) */}
            {!practiceWaiting && (
              <div className="grid grid-cols-2 gap-2.5">
                {problem.choices.map((choice, i) => {
                  const isSelected = selectedAnswer === choice;
                  const isCorrect = choice === problem.answer;
                  const showResult = feedback !== null;
                  return (
                    <button
                      key={`${choice}-${i}`}
                      onClick={() => handleAnswer(choice)}
                      disabled={feedback !== null}
                      className={`py-4 rounded-xl text-xl sm:text-2xl font-bold transition-all duration-200 min-h-[56px] shadow-md ${
                        showResult && isCorrect
                          ? "bg-green-500/20 border-2 border-green-400 text-green-400 shadow-green-500/20"
                          : showResult && isSelected && !isCorrect
                          ? "bg-red-500/20 border-2 border-red-400 text-red-400 shadow-red-500/20"
                          : showResult
                          ? "bg-white/5 border border-white/5 text-slate-600"
                          : "bg-white/10 border border-white/10 text-white hover:bg-violet-500/20 hover:border-violet-400/40 hover:shadow-lg hover:shadow-violet-500/20 active:scale-95"
                      }`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Practice mode: explanation + grid + next button */}
            {practiceMode && practiceWaiting && (
              <div className="space-y-3">
                <div className={`rounded-xl border p-4 text-center ${feedback === "correct" ? "border-green-400/30 bg-green-500/10" : "border-red-400/30 bg-red-500/10"}`}>
                  <div className={`text-lg font-bold ${feedback === "correct" ? "text-green-400" : "text-red-400"}`}>
                    {feedback === "correct" ? "Correct!" : `Wrong — answer: ${problem.answer}`}
                  </div>
                </div>
                {/* Grid explanation */}
                <div className="bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                  <div className="text-xs text-slate-400 mb-2 text-center">
                    {problem.a} × {problem.b} = {problem.a} groups of {problem.b}
                  </div>
                  <div className="flex justify-center mb-2">
                    <MultGrid a={problem.a} b={problem.b} highlight={true} color={TABLE_GROUPS[Math.min(tableIdx, TABLE_GROUPS.length - 1)].color} />
                  </div>
                  <div className="text-xs text-slate-500 text-center">
                    Count all the dots: {problem.a} rows × {problem.b} columns = <span className="text-white font-bold">{problem.answer}</span>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button onClick={nextProblem}
                    className="px-6 py-3 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Stats footer (not in practice mode) */}
            {!practiceMode && (
              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <span>{accuracy}% accuracy</span>
                <span>·</span>
                <span>{solved} correct</span>
                {wrong > 0 && <><span>·</span><span className="text-red-400/70">{wrong} wrong</span></>}
              </div>
            )}
          </div>
        )}

        {/* COMPLETE */}
        {phase === "complete" && (
          <div className="text-center space-y-4">
            <Star className="w-14 h-14 text-yellow-400 fill-yellow-400 mx-auto animate-bounce" />
            <h3 className="text-2xl font-bold text-white">
              {!practiceMode && mode === "survival" && lives <= 0 ? "Game Over" : practiceMode ? "Practice Complete" : "Complete!"}
            </h3>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div><div className="text-2xl font-bold text-white">{practiceMode ? practiceCorrect : solved}</div><div className="text-[10px] text-slate-500 uppercase">Solved</div></div>
              <div><div className="text-2xl font-bold text-green-400">{practiceMode ? (practiceTotal > 0 ? Math.round((practiceCorrect / practiceTotal) * 100) : 100) : accuracy}%</div><div className="text-[10px] text-slate-500 uppercase">Accuracy</div></div>
              {!practiceMode ? (
                <div><div className="text-2xl font-bold text-cyan-400">{formatTime(elapsed)}</div><div className="text-[10px] text-slate-500 uppercase">Time</div></div>
              ) : (
                <div><div className="text-2xl font-bold text-cyan-400">{practiceTotal}</div><div className="text-[10px] text-slate-500 uppercase">Attempted</div></div>
              )}
            </div>

            {bestStreak >= 3 && (
              <p className="text-yellow-400/70 text-sm">Best streak: x{bestStreak}</p>
            )}

            {/* Final adaptive level */}
            <div>
              {(() => {
                const dl = getDifficultyLabel(adaptive.level);
                return (
                  <p className="text-sm text-slate-400">
                    Final difficulty:{" "}
                    <span className="font-bold" style={{ color: dl.color }}>
                      {dl.emoji} {dl.label} ({adaptive.level.toFixed(1)})
                    </span>
                    <span className="text-xs text-slate-500 ml-1">&middot; {getGradeForLevel(adaptive.level).label}</span>
                  </p>
                );
              })()}
            </div>

            {!practiceMode && score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-sm font-medium flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" /> New High Score!
              </p>
            )}

            {!practiceMode && (
              <ScoreSubmit game="times-table" score={score} level={Math.round(adaptive.level)}
                stats={{ mode, solved, accuracy: `${accuracy}%`, time: formatTime(elapsed), finalLevel: adaptive.level.toFixed(1) }} />
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
              <button onClick={() => startGame(mode)} className="px-6 py-3 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Again
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
