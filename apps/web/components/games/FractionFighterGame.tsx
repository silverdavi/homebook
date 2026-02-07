"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Heart } from "lucide-react";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, HeartRecovery } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxGameOver, sfxHeart, sfxAchievement, sfxCombo } from "@/lib/games/audio";
import Link from "next/link";

type GamePhase = "menu" | "playing" | "result" | "gameOver";

interface FractionPair {
  a: [number, number]; // [numerator, denominator]
  b: [number, number];
  /** "left" | "right" | "equal" */
  answer: "left" | "right" | "equal";
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function FractionDisplay({
  n,
  d,
  color,
  showBar = true,
}: {
  n: number;
  d: number;
  color: string;
  showBar?: boolean;
}) {
  const g = gcd(n, d);
  const sn = n / g;
  const sd = d / g;
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl sm:text-4xl font-bold" style={{ color }}>
        {sn}
      </span>
      <div className="w-10 sm:w-12 h-0.5 my-1" style={{ backgroundColor: color }} />
      <span className="text-3xl sm:text-4xl font-bold" style={{ color }}>
        {sd}
      </span>
      {/* Visual bar */}
      {showBar && (
      <div className="mt-3 sm:mt-4 w-24 sm:w-32 h-5 sm:h-6 bg-white/10 rounded overflow-hidden border border-white/20">
        <div
          className="h-full rounded transition-all duration-300"
          style={{
            width: `${(n / d) * 100}%`,
            backgroundColor: color,
            opacity: 0.7,
          }}
        />
      </div>
      )}
    </div>
  );
}

const COMPARE_TIPS = [
  "If denominators match, the bigger numerator wins!",
  "Cross-multiply to compare: a/b vs c/d → check a×d vs b×c.",
  "1/2 is always a useful benchmark — is the fraction more or less than half?",
  "A fraction closer to 1 has a numerator close to its denominator.",
  "3/4 > 2/3 because 3×3 = 9 > 4×2 = 8.",
  "Fractions with smaller denominators represent bigger pieces.",
  "Convert to decimals in your head: 3/4 = 0.75, 2/3 ≈ 0.67.",
  "Unit fractions (1/n) get smaller as n gets bigger.",
];

const INITIAL_LIVES = 5;

/**
 * Timer per question scales with level:
 *   Level 1-3: 5000ms (easy, big differences)
 *   Level 4-7: 4000ms (medium denominators)
 *   Level 8-12: 3500ms (harder fractions)
 *   Level 13+: 3000ms (expert, tiny differences)
 */
function getTimePerQuestion(level: number): number {
  if (level <= 3) return 5000;
  if (level <= 7) return 4000;
  if (level <= 12) return 3500;
  return 3000;
}

/**
 * Min fraction difference scales with level to avoid trivially easy problems at higher levels
 * and impossibly close ones at low levels.
 */
function generatePairTuned(level: number): FractionPair {
  const maxDenom = Math.min(4 + level * 2, 20);
  const minDiff = level <= 3 ? 0.1 : level <= 7 ? 0.05 : 0.02;
  
  for (let attempt = 0; attempt < 50; attempt++) {
    const d1 = Math.floor(Math.random() * (maxDenom - 1)) + 2;
    const d2 = Math.floor(Math.random() * (maxDenom - 1)) + 2;
    const n1 = Math.floor(Math.random() * (d1 - 1)) + 1;
    const n2 = Math.floor(Math.random() * (d2 - 1)) + 1;
    const val1 = n1 / d1;
    const val2 = n2 / d2;
    const diff = Math.abs(val1 - val2);
    
    if (diff >= minDiff && diff > 0.001) {
      return {
        a: [n1, d1],
        b: [n2, d2],
        answer: val1 > val2 ? "left" : "right",
      };
    }
  }
  // Fallback
  return { a: [1, 2], b: [1, 3], answer: "left" };
}

export function FractionFighterGame() {
  useGameMusic();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [pair, setPair] = useState<FractionPair | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | "timeout" | null>(null);
  const [timeLeft, setTimeLeft] = useState(100);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("fractionFighter_highScore"));
  const [showHeartRecovery, setShowHeartRecovery] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<Array<{ name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (pair) setTipIdx(Math.floor(Math.random() * 100));
  }, [pair]);

  // ── Settings ──
  const [showBars, setShowBars] = useState(true);
  const [timerSpeed, setTimerSpeed] = useState(5); // 1 (relaxed) to 10 (blitz)

  const nextProblem = useCallback(
    (lvl: number) => {
      const p = generatePairTuned(lvl);
      setPair(p);
      setResult(null);
      setTimeLeft(100);
      startTimeRef.current = Date.now();
      setPhase("playing");

      const baseTime = getTimePerQuestion(lvl);
      const timerMult = 2.0 - (timerSpeed - 1) * 0.18; // speed 1 => 2.0x, speed 10 => 0.38x
      const questionTime = Math.round(baseTime * Math.max(0.3, timerMult));

      // Start countdown
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.max(0, 100 - (elapsed / questionTime) * 100);
        setTimeLeft(pct);
        if (pct <= 0) {
          clearInterval(timerRef.current!);
          // Timeout
          setResult("timeout");
          setPhase("result");
          setStreak(0);
          setLives((l) => {
            const nl = l - 1;
            if (nl <= 0) {
              setTimeout(() => {
                setPhase("gameOver");
                setScore((s) => {
                  setHighScore((h) => {
                    if (s > h) {
                      setLocalHighScore("fractionFighter_highScore", s);
                      return s;
                    }
                    return h;
                  });
                  return s;
                });
              }, 1500);
            }
            return nl;
          });
        }
      }, 50);
    },
    []
  );

  const handleChoice = useCallback(
    (choice: "left" | "right") => {
      if (phase !== "playing" || !pair) return;
      if (timerRef.current) clearInterval(timerRef.current);

      if (choice === pair.answer) {
        const speed = timeLeft / 100;
        const points = Math.round(10 + speed * 20);
        const newStreak = streak + 1;
        setScore((s) => s + points + (newStreak > 0 && newStreak % 5 === 0 ? 50 : 0));
        setStreak((s) => {
          const ns = s + 1;
          setBestStreak((b) => Math.max(b, ns));
          return ns;
        });
        if (newStreak > 1 && newStreak % 5 === 0) sfxCombo(newStreak);
        else sfxCorrect();
        if (newStreak >= 10 && newStreak % 10 === 0) {
          sfxHeart();
          setLives((l) => {
            if (l < INITIAL_LIVES) {
              setShowHeartRecovery(true);
              setTimeout(() => setShowHeartRecovery(false), 1500);
              return Math.min(INITIAL_LIVES, l + 1);
            }
            return l;
          });
        }
        setResult("correct");
        setLevel((l) => l + (streak > 0 && streak % 5 === 4 ? 1 : 0));
      } else {
        sfxWrong();
        setStreak(0);
        setResult("wrong");
        setLives((l) => {
          const nl = l - 1;
          if (nl <= 0) {
            setTimeout(() => {
              setPhase("gameOver");
              setScore((s) => {
                setHighScore((h) => {
                  if (s > h) {
                    setLocalHighScore("fractionFighter_highScore", s);
                    return s;
                  }
                  return h;
                });
                return s;
              });
            }, 1500);
          }
          return nl;
        });
      }
      setPhase("result");
    },
    [phase, pair, timeLeft, streak]
  );

  // Auto advance after result
  useEffect(() => {
    if (phase !== "result") return;
    if (lives <= 0) return;
    const t = setTimeout(() => nextProblem(level), 1200);
    return () => clearTimeout(t);
  }, [phase, level, lives, nextProblem]);

  const startGame = () => {
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setStreak(0);
    setBestStreak(0);
    setShowHeartRecovery(false);
    setAchievementQueue([]);
    setShowAchievementIndex(0);
    nextProblem(1);
  };

  useEffect(() => {
    if (phase !== "gameOver") return;
    sfxGameOver();
    trackGamePlayed("fraction-fighter", score);
    const profile = getProfile();
    const newOnes = checkAchievements(
      { gameId: "fraction-fighter", score, level, bestStreak },
      profile.totalGamesPlayed,
      profile.gamesPlayedByGameId
    );
    if (newOnes.length > 0) { sfxAchievement(); setAchievementQueue(newOnes); }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps -- run once on game over

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-red-950 to-slate-950 flex flex-col items-center">
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Fraction Fighter</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* MENU */}
        {phase === "menu" && (
          <div className="text-center w-full">
            <div className="text-6xl mb-4">⚔️</div>
            <h2 className="text-3xl font-bold text-white mb-2">Fraction Fighter</h2>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Two fractions enter. Tap the bigger one before time runs out!
            </p>

            {/* Timer speed slider */}
            <div className="max-w-xs mx-auto mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Timer speed</span>
                <span className="text-xs font-bold text-red-400 tabular-nums">
                  {(5 * Math.max(0.3, 2.0 - (timerSpeed - 1) * 0.18)).toFixed(1)}s / question
                </span>
              </div>
              <input type="range" min={1} max={10} step={1} value={timerSpeed}
                onChange={(e) => setTimerSpeed(Number(e.target.value))}
                className="w-full accent-red-500" />
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>Relaxed</span><span>Blitz</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="max-w-xs mx-auto mb-5 space-y-2">
              <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
                <span className="text-xs text-slate-400">Show visual bars</span>
                <input type="checkbox" checked={showBars} onChange={(e) => setShowBars(e.target.checked)}
                  className="rounded accent-red-500 w-4 h-4" />
              </label>
            </div>

            <button onClick={startGame} className="px-10 py-4 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30">
              Fight!
            </button>
            {highScore > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 text-yellow-400 text-sm">
                <Trophy className="w-4 h-4" /> Best: {highScore}
              </div>
            )}
          </div>
        )}

        {/* PLAYING / RESULT */}
        {(phase === "playing" || phase === "result") && pair && (
          <div className="w-full space-y-6">
            {/* HUD */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                  <Heart key={i} className={`w-5 h-5 transition-all ${i < lives ? "text-red-400 fill-red-400" : "text-slate-700 scale-75"}`} />
                ))}
              </div>
              <StreakBadge streak={streak} />
              <div className="text-2xl font-bold text-white tabular-nums">{score}</div>
            </div>
            <HeartRecovery show={showHeartRecovery} />

            {/* Timer bar */}
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-100 ease-linear"
                style={{
                  width: `${timeLeft}%`,
                  background: timeLeft > 50 ? "#10b981" : timeLeft > 25 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>

            {/* Comparison tip */}
            {phase === "playing" && (
              <div className="text-center text-[11px] text-slate-500 italic px-4">
                💡 {COMPARE_TIPS[tipIdx % COMPARE_TIPS.length]}
              </div>
            )}

            {/* Question */}
            <div className="text-center text-slate-400 text-sm mb-2">
              Which fraction is <span className="text-white font-bold">bigger</span>?
            </div>

            {/* Fractions */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => handleChoice("left")}
                disabled={phase === "result"}
                className={`flex-1 py-8 rounded-2xl border-2 transition-all duration-200 active:scale-95 shadow-lg ${
                  phase === "result"
                    ? pair.answer === "left"
                      ? "border-green-400 bg-green-500/20 shadow-green-500/10"
                      : "border-red-400/30 bg-red-500/10 opacity-50 shadow-black/10"
                    : "border-white/10 bg-white/5 hover:border-red-400/50 hover:bg-white/10 hover:shadow-xl hover:shadow-red-500/10"
                }`}
              >
                <FractionDisplay n={pair.a[0]} d={pair.a[1]} color={phase === "result" && pair.answer === "left" ? "#4ade80" : "#f87171"} showBar={showBars} />
              </button>

              <div className="text-2xl font-bold text-slate-500 drop-shadow-sm">VS</div>

              <button
                onClick={() => handleChoice("right")}
                disabled={phase === "result"}
                className={`flex-1 py-8 rounded-2xl border-2 transition-all duration-200 active:scale-95 shadow-lg ${
                  phase === "result"
                    ? pair.answer === "right"
                      ? "border-green-400 bg-green-500/20 shadow-green-500/10"
                      : "border-blue-400/30 bg-blue-500/10 opacity-50 shadow-black/10"
                    : "border-white/10 bg-white/5 hover:border-blue-400/50 hover:bg-white/10 hover:shadow-xl hover:shadow-blue-500/10"
                }`}
              >
                <FractionDisplay n={pair.b[0]} d={pair.b[1]} color={phase === "result" && pair.answer === "right" ? "#4ade80" : "#60a5fa"} showBar={showBars} />
              </button>
            </div>

            {/* Result feedback */}
            {phase === "result" && (
              <div className={`text-center text-lg font-bold ${result === "correct" ? "text-green-400" : "text-red-400"}`}>
                {result === "correct" ? "Correct!" : result === "timeout" ? "Too slow!" : "Wrong!"}
              </div>
            )}
          </div>
        )}

        {/* GAME OVER */}
        {phase === "gameOver" && (
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-2">Game Over</h3>
            <div className="text-5xl font-bold text-red-400 mb-2">{score}</div>
            <p className="text-slate-400 mb-6">Best streak: x{bestStreak}</p>
            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-sm font-medium mb-2 flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" /> New High Score!
              </p>
            )}
            <div className="mb-3">
              <ScoreSubmit game="fraction-fighter" score={score} level={level} stats={{ bestStreak }} />
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
              <button onClick={startGame} className="px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
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
