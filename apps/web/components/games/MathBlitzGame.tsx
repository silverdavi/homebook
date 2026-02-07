"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Timer, Star } from "lucide-react";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxCombo, sfxGameOver, sfxAchievement, sfxCountdown, sfxCountdownGo } from "@/lib/games/audio";
import Link from "next/link";

// ── Types ──

interface Problem {
  question: string;
  answer: number;
  choices: number[];
}

type Operation = "add" | "subtract" | "multiply" | "divide";
type GamePhase = "menu" | "countdown" | "playing" | "gameOver";

// ── Problem Generation (deterministic, no randomness in render) ──

/**
 * Difficulty tuning table:
 *   1-3:  +, −  range 1-25
 *   4-7:  +, −, ×  range 1-40, mult 2-7
 *   8-12: +, −, ×, ÷  range 1-60, mult 2-10
 *   13+:  all ops, range 1-100, mult 2-12
 * Wrong answer spread scales with difficulty for harder guessing.
 */
function generateProblem(difficulty: number, enabledOps?: Operation[]): Problem {
  const autoOps: Operation[] =
    difficulty <= 3 ? ["add", "subtract"] :
    difficulty <= 7 ? ["add", "subtract", "multiply"] :
    ["add", "subtract", "multiply", "divide"];
  const ops = enabledOps && enabledOps.length > 0 ? enabledOps : autoOps;
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a: number, b: number, answer: number, question: string;

  const addSubMax = Math.min(10 + difficulty * 7, 100);
  const multMax = Math.min(2 + Math.floor(difficulty * 0.8), 12);

  switch (op) {
    case "add": {
      a = Math.floor(Math.random() * addSubMax) + 1;
      b = Math.floor(Math.random() * addSubMax) + 1;
      answer = a + b;
      question = `${a} + ${b}`;
      break;
    }
    case "subtract": {
      a = Math.floor(Math.random() * addSubMax) + 2;
      b = Math.floor(Math.random() * (a - 1)) + 1;
      answer = a - b;
      question = `${a} − ${b}`;
      break;
    }
    case "multiply": {
      a = Math.floor(Math.random() * multMax) + 2;
      b = Math.floor(Math.random() * multMax) + 2;
      answer = a * b;
      question = `${a} × ${b}`;
      break;
    }
    case "divide": {
      b = Math.floor(Math.random() * multMax) + 2;
      answer = Math.floor(Math.random() * multMax) + 1;
      a = b * answer;
      question = `${a} ÷ ${b}`;
      break;
    }
  }

  // Wrong choices — spread increases with difficulty
  const spread = Math.max(3, Math.min(difficulty * 2, 20));
  const wrongSet = new Set<number>();
  while (wrongSet.size < 3) {
    const offset = Math.floor(Math.random() * spread) - Math.floor(spread / 2);
    const wrong = answer + (offset === 0 ? (Math.random() > 0.5 ? 1 : -1) : offset);
    if (wrong !== answer && wrong >= 0) wrongSet.add(wrong);
  }

  const choices = [...wrongSet, answer].sort(() => Math.random() - 0.5);
  return { question, answer, choices };
}

// ── Constants ──

const MATH_TIPS = [
  "Addition: start from the bigger number and count up.",
  "Subtraction: think of it as 'how far apart are these numbers?'",
  "Multiplying by 2 is the same as doubling.",
  "Division: 'how many groups of this size fit in that number?'",
  "Order of operations: Parentheses, Exponents, Multiply/Divide, Add/Subtract.",
  "To add 9, add 10 then subtract 1.",
  "Even + Even = Even, Odd + Odd = Even, Even + Odd = Odd.",
  "To subtract quickly, round up and adjust: 83 - 27 → 83 - 30 + 3.",
];

const GAME_DURATION = 60; // seconds
const COUNTDOWN_SECS = 3;

export function MathBlitzGame() {
  useGameMusic();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [solved, setSolved] = useState(0);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("mathBlitz_highScore"));
  const [achievementQueue, setAchievementQueue] = useState<Array<{ name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [mathTipIdx, setMathTipIdx] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const difficultyRef = useRef(1);
  const problemStartTimeRef = useRef(0);

  // ── Settings ──
  const [gameDuration, setGameDuration] = useState(60);
  const [enabledOps, setEnabledOps] = useState<Operation[]>(["add", "subtract", "multiply", "divide"]);

  const toggleOp = (op: Operation) => {
    setEnabledOps((prev) => {
      if (prev.includes(op)) {
        const next = prev.filter((o) => o !== op);
        return next.length > 0 ? next : prev; // at least one must stay
      }
      return [...prev, op];
    });
  };

  useEffect(() => {
    if (problem) setMathTipIdx(Math.floor(Math.random() * 100));
  }, [problem]);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => {
      setCountdown((c) => {
        if (c <= 1) {
          sfxCountdownGo();
          setTimeout(() => {
            setPhase("playing");
            setProblem(generateProblem(1, enabledOps));
          }, 0);
          return 0;
        }
        sfxCountdown();
        return c - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, enabledOps]);

  useEffect(() => {
    if (phase === "playing" && problem) problemStartTimeRef.current = Date.now();
  }, [phase, problem]);

  // On game over: track and achievements
  useEffect(() => {
    if (phase !== "gameOver") return;
    sfxGameOver();
    trackGamePlayed("math-blitz", score);
    const profile = getProfile();
    const newOnes = checkAchievements(
      { gameId: "math-blitz", score, solved, bestStreak },
      profile.totalGamesPlayed,
      profile.gamesPlayedByGameId
    );
    if (newOnes.length > 0) { sfxAchievement(); setAchievementQueue(newOnes); }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps -- run once on game over

  // Game timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setTimeout(() => {
            setPhase("gameOver");
            setScore((s) => {
              setHighScore((h) => {
                if (s > h) {
                  setLocalHighScore("mathBlitz_highScore", s);
                  return s;
                }
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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

  const handleAnswer = useCallback(
    (choice: number) => {
      if (phase !== "playing" || !problem) return;
      const answeredAt = Date.now();
      const problemStartedAt = problemStartTimeRef.current;

      if (choice === problem.answer) {
        const newStreak = streak + 1;
        const { mult } = getMultiplierFromStreak(newStreak);
        let points = Math.round(10 * mult);
        if (answeredAt - problemStartedAt < 1000) points += 5;
        setScore((s) => s + points);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        setSolved((s) => s + 1);
        setFlash("correct");
        difficultyRef.current = Math.floor(newStreak / 3) + 1;
        if (newStreak > 1 && newStreak % 5 === 0) sfxCombo(newStreak);
        else sfxCorrect();
      } else {
        sfxWrong();
        setStreak(0);
        setFlash("wrong");
      }

      setTimeout(() => setFlash(null), 200);
      setProblem(generateProblem(difficultyRef.current, enabledOps));
    },
    [phase, problem, streak, enabledOps]
  );

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSolved(0);
    setTimeLeft(gameDuration);
    setCountdown(COUNTDOWN_SECS);
    setAchievementQueue([]);
    setShowAchievementIndex(0);
    difficultyRef.current = 1;
    setPhase("countdown");
  };

  const timerColor =
    timeLeft > 20 ? "text-green-400" : timeLeft > 10 ? "text-yellow-400" : "text-red-400";
  const timerBarWidth = (timeLeft / gameDuration) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link
          href="/games"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Games
        </Link>
        <h1 className="text-lg font-bold text-white">Math Blitz</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* MENU */}
        {phase === "menu" && (
          <div className="text-center w-full">
            <div className="text-6xl mb-4">⚡</div>
            <h2 className="text-3xl font-bold text-white mb-2">Math Blitz</h2>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Solve as many problems as you can! Difficulty increases with your streak.
            </p>

            {/* Duration slider */}
            <div className="max-w-xs mx-auto mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Duration</span>
                <span className="text-xs font-bold text-emerald-400 tabular-nums">{gameDuration >= 60 ? `${gameDuration / 60}m` : `${gameDuration}s`}</span>
              </div>
              <input type="range" min={15} max={300} step={15} value={gameDuration}
                onChange={(e) => setGameDuration(Number(e.target.value))}
                className="w-full accent-emerald-500" />
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>15s sprint</span><span>5 min marathon</span>
              </div>
            </div>

            {/* Operation toggles */}
            <div className="max-w-xs mx-auto mb-5 space-y-1.5">
              <div className="text-xs text-slate-500 text-left mb-1">Operations</div>
              <div className="grid grid-cols-4 gap-1.5">
                {([["add", "+"], ["subtract", "−"], ["multiply", "×"], ["divide", "÷"]] as [Operation, string][]).map(([op, label]) => (
                  <button key={op} onClick={() => toggleOp(op)}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${enabledOps.includes(op) ? "bg-emerald-500/25 border border-emerald-400/50 text-emerald-400" : "bg-white/5 border border-white/10 text-slate-600"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/30"
            >
              Start
            </button>
            {highScore > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 text-yellow-400 text-sm">
                <Trophy className="w-4 h-4" />
                Best: {highScore}
              </div>
            )}
          </div>
        )}

        {/* COUNTDOWN */}
        {phase === "countdown" && (
          <div className="text-center">
            <div className="text-8xl font-bold text-emerald-400 animate-pulse">
              {countdown || "GO!"}
            </div>
          </div>
        )}

        {/* PLAYING */}
        {phase === "playing" && problem && (
          <div className="w-full space-y-6">
            {/* Timer bar */}
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${timerBarWidth}%`,
                  background:
                    timeLeft > 20
                      ? "#10b981"
                      : timeLeft > 10
                      ? "#f59e0b"
                      : "#ef4444",
                }}
              />
            </div>

            {/* Math tip */}
            <div className="text-center text-[11px] text-slate-500 italic px-4">
              💡 {MATH_TIPS[mathTipIdx % MATH_TIPS.length]}
            </div>

            {/* HUD */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className={`w-5 h-5 ${timerColor}`} />
                <span className={`text-2xl font-bold tabular-nums ${timerColor}`}>
                  {timeLeft}s
                </span>
              </div>
              <StreakBadge streak={streak} />
              <div className="text-right">
                <div className="text-2xl font-bold text-white tabular-nums">{score}</div>
                <div className="text-xs text-slate-400">{solved} solved</div>
              </div>
            </div>

            {/* Flash overlay */}
            {flash && (
              <div
                className={`fixed inset-0 pointer-events-none z-50 ${
                  flash === "correct"
                    ? "bg-green-500/10"
                    : "bg-red-500/15"
                }`}
              />
            )}

            {/* Problem */}
            <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center shadow-lg shadow-black/20">
              <div className="text-5xl font-bold text-white mb-2 tracking-wide drop-shadow-sm">
                {problem.question}
              </div>
              <div className="text-lg text-slate-400">= ?</div>
            </div>

            {/* Choices */}
            <div className="grid grid-cols-2 gap-3">
              {problem.choices.map((choice, i) => (
                <button
                  key={`${choice}-${i}`}
                  onClick={() => handleAnswer(choice)}
                  className="py-4 sm:py-5 bg-white/10 hover:bg-emerald-500/25 border border-white/10 hover:border-emerald-400/40 rounded-xl text-xl sm:text-2xl font-bold text-white transition-all duration-200 active:scale-95 min-h-[56px] shadow-md hover:shadow-emerald-500/20 hover:shadow-lg"
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GAME OVER */}
        {phase === "gameOver" && (
          <div className="text-center">
            <Star className="w-16 h-16 text-yellow-400 fill-yellow-400 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-white mb-2">Time&apos;s Up!</h3>
            <div className="text-5xl font-bold text-emerald-400 mb-2">{score}</div>
            <div className="text-slate-400 space-y-1 mb-6">
              <p>{solved} problems solved</p>
              <p>Best streak: x{bestStreak}</p>
            </div>
            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-sm font-medium mb-2 flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" /> New High Score!
              </p>
            )}
            <div className="mb-3">
              <ScoreSubmit game="math-blitz" score={score} level={Math.floor(bestStreak / 3) + 1} stats={{ solved, bestStreak }} />
            </div>
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
              <button
                onClick={startGame}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
              <Link
                href="/games"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all"
              >
                Back
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
