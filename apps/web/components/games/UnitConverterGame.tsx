"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Timer, Star, ArrowRightLeft } from "lucide-react";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import {
  sfxCorrect, sfxWrong, sfxCombo, sfxGameOver, sfxAchievement,
  sfxCountdown, sfxCountdownGo,
} from "@/lib/games/audio";
import Link from "next/link";

// ── Types ──

type GamePhase = "menu" | "countdown" | "playing" | "gameOver";
type UnitCategory = "length" | "mass" | "volume" | "temperature" | "time";

interface UnitConversion {
  from: string;
  to: string;
  factor?: number; // multiply from by factor to get to (for linear conversions)
  convert?: (val: number) => number; // for non-linear (temp)
}

interface Problem {
  question: string;
  value: number;
  fromUnit: string;
  toUnit: string;
  answer: number;
  choices: number[];
  category: UnitCategory;
}

// ── Conversion data ──

const LENGTH_CONVERSIONS: UnitConversion[] = [
  { from: "mm", to: "cm", factor: 0.1 },
  { from: "cm", to: "mm", factor: 10 },
  { from: "cm", to: "m", factor: 0.01 },
  { from: "m", to: "cm", factor: 100 },
  { from: "m", to: "km", factor: 0.001 },
  { from: "km", to: "m", factor: 1000 },
  { from: "in", to: "cm", factor: 2.54 },
  { from: "ft", to: "in", factor: 12 },
  { from: "ft", to: "m", factor: 0.3048 },
  { from: "mi", to: "km", factor: 1.609 },
  { from: "km", to: "mi", factor: 0.6214 },
];

const MASS_CONVERSIONS: UnitConversion[] = [
  { from: "g", to: "kg", factor: 0.001 },
  { from: "kg", to: "g", factor: 1000 },
  { from: "kg", to: "lb", factor: 2.205 },
  { from: "lb", to: "kg", factor: 0.4536 },
  { from: "oz", to: "g", factor: 28.35 },
  { from: "g", to: "oz", factor: 0.03527 },
  { from: "lb", to: "oz", factor: 16 },
  { from: "oz", to: "lb", factor: 0.0625 },
];

const VOLUME_CONVERSIONS: UnitConversion[] = [
  { from: "mL", to: "L", factor: 0.001 },
  { from: "L", to: "mL", factor: 1000 },
  { from: "gal", to: "L", factor: 3.785 },
  { from: "L", to: "gal", factor: 0.2642 },
  { from: "cup", to: "mL", factor: 236.6 },
  { from: "mL", to: "cup", factor: 0.004227 },
  { from: "gal", to: "cup", factor: 16 },
];

const TEMP_CONVERSIONS: UnitConversion[] = [
  { from: "°C", to: "°F", convert: (c) => c * 9 / 5 + 32 },
  { from: "°F", to: "°C", convert: (f) => (f - 32) * 5 / 9 },
  { from: "°C", to: "K", convert: (c) => c + 273.15 },
  { from: "K", to: "°C", convert: (k) => k - 273.15 },
];

const TIME_CONVERSIONS: UnitConversion[] = [
  { from: "sec", to: "min", factor: 1 / 60 },
  { from: "min", to: "sec", factor: 60 },
  { from: "min", to: "hr", factor: 1 / 60 },
  { from: "hr", to: "min", factor: 60 },
  { from: "hr", to: "day", factor: 1 / 24 },
  { from: "day", to: "hr", factor: 24 },
  { from: "day", to: "min", factor: 1440 },
];

const CATEGORY_DATA: Record<UnitCategory, { conversions: UnitConversion[]; label: string; color: string }> = {
  length: { conversions: LENGTH_CONVERSIONS, label: "Length", color: "#3b82f6" },
  mass: { conversions: MASS_CONVERSIONS, label: "Mass", color: "#ef4444" },
  volume: { conversions: VOLUME_CONVERSIONS, label: "Volume", color: "#8b5cf6" },
  temperature: { conversions: TEMP_CONVERSIONS, label: "Temperature", color: "#f59e0b" },
  time: { conversions: TIME_CONVERSIONS, label: "Time", color: "#10b981" },
};

function roundSmart(n: number): number {
  if (Math.abs(n) >= 100) return Math.round(n);
  if (Math.abs(n) >= 10) return Math.round(n * 10) / 10;
  if (Math.abs(n) >= 1) return Math.round(n * 100) / 100;
  return Math.round(n * 1000) / 1000;
}

function generateProblem(categories: UnitCategory[]): Problem {
  const cat = categories[Math.floor(Math.random() * categories.length)];
  const data = CATEGORY_DATA[cat];
  const conv = data.conversions[Math.floor(Math.random() * data.conversions.length)];

  // Generate a nice input value
  let value: number;
  if (cat === "temperature") {
    if (conv.from === "°C") value = Math.floor(Math.random() * 80) - 10;
    else if (conv.from === "°F") value = Math.floor(Math.random() * 150) + 10;
    else value = Math.floor(Math.random() * 200) + 200; // Kelvin
  } else if (conv.factor && conv.factor >= 100) {
    value = Math.floor(Math.random() * 10) + 1;
  } else if (conv.factor && conv.factor >= 10) {
    value = Math.floor(Math.random() * 20) + 1;
  } else if (conv.factor && conv.factor >= 1) {
    value = Math.floor(Math.random() * 50) + 1;
  } else {
    value = Math.floor(Math.random() * 500) + 10;
  }

  const answer = roundSmart(conv.convert ? conv.convert(value) : value * conv.factor!);

  // Generate wrong answers
  const wrongSet = new Set<number>();
  const spread = Math.max(Math.abs(answer) * 0.3, 1);
  while (wrongSet.size < 3) {
    const offset = roundSmart((Math.random() - 0.5) * spread * 2);
    const wrong = roundSmart(answer + (offset === 0 ? (answer > 0 ? 1 : -1) : offset));
    if (wrong !== answer) wrongSet.add(wrong);
  }

  return {
    question: `Convert ${value} ${conv.from} to ${conv.to}`,
    value,
    fromUnit: conv.from,
    toUnit: conv.to,
    answer,
    choices: [...wrongSet, answer].sort(() => Math.random() - 0.5),
    category: cat,
  };
}

// ── Constants ──

const UNIT_TIPS = [
  "Kilo = 1000, Centi = 1/100, Milli = 1/1000.",
  "°F = °C × 9/5 + 32. Water freezes at 0°C = 32°F.",
  "1 inch = 2.54 cm. 1 foot = 12 inches.",
  "1 kg ≈ 2.2 pounds. 1 lb = 16 oz.",
  "1 gallon ≈ 3.785 liters. 1 cup ≈ 237 mL.",
  "1 mile ≈ 1.609 km. 1 km ≈ 0.621 miles.",
  "Kelvin = Celsius + 273.15. 0 K is absolute zero.",
  "Metric prefixes follow powers of 10: km → m → cm → mm.",
];

const COUNTDOWN_SECS = 3;

export function UnitConverterGame() {
  useGameMusic();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [solved, setSolved] = useState(0);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("unitConverter_highScore"));
  const [achievementQueue, setAchievementQueue] = useState<Array<{ name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [problem, setProblem] = useState<Problem | null>(null);
  const problemStartRef = useRef(0);

  // Timer for each question
  const [questionTimeLeft, setQuestionTimeLeft] = useState(10);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Settings
  const [enabledCategories, setEnabledCategories] = useState<UnitCategory[]>(["length", "mass", "volume", "temperature", "time"]);
  const [secsPerQuestion, setSecsPerQuestion] = useState(10);
  const [totalRounds, setTotalRounds] = useState(15);

  const toggleCategory = (cat: UnitCategory) => {
    setEnabledCategories((prev) => {
      if (prev.includes(cat)) {
        const next = prev.filter((c) => c !== cat);
        return next.length > 0 ? next : prev;
      }
      return [...prev, cat];
    });
  };

  // ── Countdown ──
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => {
      setCountdown((c) => {
        if (c <= 1) {
          sfxCountdownGo();
          setTimeout(() => {
            setPhase("playing");
            loadNextProblem();
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

  // ── Question timer ──
  useEffect(() => {
    if (phase !== "playing" || !problem) return;
    setQuestionTimeLeft(secsPerQuestion);
    questionTimerRef.current = setInterval(() => {
      setQuestionTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(questionTimerRef.current!);
          // Time up — wrong
          sfxWrong();
          setStreak(0);
          setFlash("wrong");
          setTimeout(() => {
            setFlash(null);
            if (round + 1 >= totalRounds) {
              setPhase("gameOver");
            } else {
              setRound((r) => r + 1);
              loadNextProblem();
            }
          }, 800);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (questionTimerRef.current) clearInterval(questionTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round, problem]);

  // ── Game over ──
  useEffect(() => {
    if (phase !== "gameOver") return;
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    sfxGameOver();
    if (score > highScore) {
      setLocalHighScore("unitConverter_highScore", score);
      setHighScore(score);
    }
    trackGamePlayed("unit-converter", score);
    const profile = getProfile();
    const newOnes = checkAchievements(
      { gameId: "unit-converter", score, solved, bestStreak, accuracy: totalRounds > 0 ? Math.round((solved / totalRounds) * 100) : 0 },
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

  const loadNextProblem = useCallback(() => {
    const prob = generateProblem(enabledCategories);
    setProblem(prob);
    problemStartRef.current = Date.now();
    setTipIdx(Math.floor(Math.random() * UNIT_TIPS.length));
  }, [enabledCategories]);

  const handleAnswer = useCallback(
    (choice: number) => {
      if (phase !== "playing" || !problem) return;
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);

      if (choice === problem.answer) {
        const newStreak = streak + 1;
        const { mult } = getMultiplierFromStreak(newStreak);
        const elapsed = (Date.now() - problemStartRef.current) / 1000;
        const timeBonus = Math.max(0, Math.round((secsPerQuestion - elapsed) * 3));
        const points = Math.round((15 + timeBonus) * mult);
        setScore((s) => s + points);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        setSolved((s) => s + 1);
        setFlash("correct");
        if (newStreak > 1 && newStreak % 5 === 0) sfxCombo(newStreak);
        else sfxCorrect();
      } else {
        sfxWrong();
        setStreak(0);
        setFlash("wrong");
      }

      setTimeout(() => {
        setFlash(null);
        if (round + 1 >= totalRounds) {
          setPhase("gameOver");
        } else {
          setRound((r) => r + 1);
          loadNextProblem();
        }
      }, 600);
    },
    [phase, problem, streak, round, totalRounds, secsPerQuestion, loadNextProblem],
  );

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setRound(0);
    setSolved(0);
    setCountdown(COUNTDOWN_SECS);
    setAchievementQueue([]);
    setShowAchievementIndex(0);
    setPhase("countdown");
  };

  const questionTimerBarWidth = (questionTimeLeft / secsPerQuestion) * 100;
  const accuracy = totalRounds > 0 && phase === "gameOver" ? Math.round((solved / totalRounds) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-orange-950 to-slate-950 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Unit Converter</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* ── MENU ── */}
        {phase === "menu" && (
          <div className="text-center w-full">
            <div className="text-6xl mb-4">📐</div>
            <h2 className="text-3xl font-bold text-white mb-2">Unit Converter</h2>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Race to convert between units! Length, mass, volume, temperature, and time.
            </p>

            {/* Category toggles */}
            <div className="max-w-xs mx-auto mb-4 space-y-1.5">
              <div className="text-xs text-slate-500 text-left mb-1">Categories</div>
              <div className="grid grid-cols-3 gap-1.5">
                {(["length", "mass", "volume", "temperature", "time"] as UnitCategory[]).map((cat) => (
                  <button key={cat} onClick={() => toggleCategory(cat)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${enabledCategories.includes(cat) ? "bg-orange-500/25 border border-orange-400/50 text-orange-400" : "bg-white/5 border border-white/10 text-slate-600"}`}>
                    {CATEGORY_DATA[cat].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed slider */}
            <div className="max-w-xs mx-auto mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Sec / question</span>
                <span className="text-xs font-bold text-orange-400 tabular-nums">{secsPerQuestion}s</span>
              </div>
              <input type="range" min={3} max={15} step={1} value={secsPerQuestion}
                onChange={(e) => setSecsPerQuestion(Number(e.target.value))}
                className="w-full accent-orange-500" />
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>3s blitz</span><span>15s relaxed</span>
              </div>
            </div>

            {/* Rounds slider */}
            <div className="max-w-xs mx-auto mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Rounds</span>
                <span className="text-xs font-bold text-orange-400 tabular-nums">{totalRounds}</span>
              </div>
              <input type="range" min={10} max={30} step={5} value={totalRounds}
                onChange={(e) => setTotalRounds(Number(e.target.value))}
                className="w-full accent-orange-500" />
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>10 quick</span><span>30 marathon</span>
              </div>
            </div>

            <button onClick={startGame}
              className="px-10 py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/30">
              Start
            </button>
            {highScore > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 text-yellow-400 text-sm">
                <Trophy className="w-4 h-4" /> Best: {highScore}
              </div>
            )}
          </div>
        )}

        {/* ── COUNTDOWN ── */}
        {phase === "countdown" && (
          <div className="text-center">
            <div className="text-8xl font-bold text-orange-400 animate-pulse">
              {countdown || "GO!"}
            </div>
          </div>
        )}

        {/* ── PLAYING ── */}
        {phase === "playing" && problem && (
          <div className="w-full space-y-4">
            {/* Question timer bar */}
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${questionTimerBarWidth}%`,
                  background: questionTimeLeft > secsPerQuestion * 0.5 ? "#f97316" : questionTimeLeft > secsPerQuestion * 0.25 ? "#f59e0b" : "#ef4444",
                }} />
            </div>

            {/* Tip */}
            <div className="text-center text-[11px] text-slate-500 italic px-4">
              💡 {UNIT_TIPS[tipIdx % UNIT_TIPS.length]}
            </div>

            {/* HUD */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className={`w-5 h-5 ${questionTimeLeft > secsPerQuestion * 0.5 ? "text-orange-400" : questionTimeLeft > secsPerQuestion * 0.25 ? "text-yellow-400" : "text-red-400"}`} />
                <span className={`text-xl font-bold tabular-nums ${questionTimeLeft > secsPerQuestion * 0.5 ? "text-orange-400" : questionTimeLeft > secsPerQuestion * 0.25 ? "text-yellow-400" : "text-red-400"}`}>
                  {questionTimeLeft}s
                </span>
                <span className="text-sm text-slate-400">{round + 1}/{totalRounds}</span>
              </div>
              <StreakBadge streak={streak} />
              <div className="text-right">
                <div className="text-2xl font-bold text-white tabular-nums">{score}</div>
                <div className="text-xs text-slate-400">{solved} correct</div>
              </div>
            </div>

            {/* Flash */}
            {flash && (
              <div className={`fixed inset-0 pointer-events-none z-50 ${flash === "correct" ? "bg-green-500/10" : "bg-red-500/15"}`} />
            )}

            {/* Category badge */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold"
                style={{ backgroundColor: `${CATEGORY_DATA[problem.category].color}20`, color: CATEGORY_DATA[problem.category].color }}>
                {CATEGORY_DATA[problem.category].label}
              </span>
            </div>

            {/* Question */}
            <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center shadow-lg">
              <div className="text-5xl font-bold text-white mb-2">
                {problem.value} <span className="text-orange-400">{problem.fromUnit}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-lg text-slate-400">
                <ArrowRightLeft className="w-5 h-5" />
                <span>Convert to <span className="text-orange-300 font-bold">{problem.toUnit}</span></span>
              </div>
            </div>

            {/* Answer choices */}
            <div className="grid grid-cols-2 gap-3">
              {problem.choices.map((choice, i) => (
                <button key={i} onClick={() => handleAnswer(choice)}
                  className="py-4 sm:py-5 bg-white/10 hover:bg-orange-500/25 border border-white/10 hover:border-orange-400/40 rounded-xl text-xl font-bold text-white transition-all active:scale-95 shadow-md hover:shadow-orange-500/20">
                  {choice} {problem.toUnit}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── GAME OVER ── */}
        {phase === "gameOver" && (
          <div className="text-center">
            <ArrowRightLeft className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-white mb-2">Race Complete!</h3>
            <div className="text-5xl font-bold text-orange-400 mb-2">{score}</div>
            <div className="text-slate-400 space-y-1 mb-6">
              <p>{solved}/{totalRounds} correct ({accuracy}%)</p>
              <p>Best streak: x{bestStreak}</p>
            </div>
            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-sm font-medium mb-2 flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" /> New High Score!
              </p>
            )}
            <div className="mb-3">
              <ScoreSubmit game="unit-converter" score={score} level={1}
                stats={{ solved, totalRounds, accuracy: `${accuracy}%`, bestStreak }} />
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
              <button onClick={startGame}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
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
