"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Heart, Equal, BookOpen, Zap, Shuffle, HelpCircle, ChevronRight } from "lucide-react";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, HeartRecovery, BonusToast, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxGameOver, sfxHeart, sfxAchievement, sfxCombo, sfxCountdownGo } from "@/lib/games/audio";
import { createAdaptiveState, adaptiveUpdate, getFractionParams, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import Link from "next/link";

/* ─── Types ─── */

type GamePhase = "menu" | "countdown" | "playing" | "result" | "gameOver";
type GameMode = "bigger" | "smaller" | "equal-or-not" | "mixed" | "practice";
type QuestionType = "bigger" | "smaller" | "equal-or-not";

interface FractionPair {
  a: [number, number]; // [numerator, denominator]
  b: [number, number];
  answer: "left" | "right" | "equal";
}

/* ─── Math helpers ─── */

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

/* ─── Fraction generation ─── */

function generateEqualPair(level: number): FractionPair {
  const maxD = Math.min(4 + level * 2, 16);
  const d = Math.floor(Math.random() * (maxD - 1)) + 2;
  const n = Math.floor(Math.random() * (d - 1)) + 1;
  const g = gcd(n, d);
  const sn = n / g;
  const sd = d / g;
  const mult = Math.floor(Math.random() * 3) + 2;
  // Randomly decide which side gets the simplified vs expanded form
  if (Math.random() < 0.5) {
    return { a: [sn, sd], b: [sn * mult, sd * mult], answer: "equal" };
  }
  return { a: [sn * mult, sd * mult], b: [sn, sd], answer: "equal" };
}

function generatePairTuned(level: number, allowEqual: boolean, maxDenom?: number, minDiffOverride?: number, equalProb?: number): FractionPair {
  // ~equalProb chance of equal fractions when allowed
  if (allowEqual && Math.random() < (equalProb ?? 0.2)) {
    return generateEqualPair(level);
  }

  const maxDenominator = maxDenom ?? Math.min(4 + level * 2, 20);
  const minDiff = minDiffOverride ?? (level <= 3 ? 0.1 : level <= 7 ? 0.05 : 0.02);

  for (let attempt = 0; attempt < 50; attempt++) {
    const d1 = Math.floor(Math.random() * (maxDenominator - 1)) + 2;
    const d2 = Math.floor(Math.random() * (maxDenominator - 1)) + 2;
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
  return { a: [1, 2], b: [1, 3], answer: "left" };
}

/* ─── Display components ─── */

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
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl sm:text-5xl font-bold" style={{ color }}>
        {n}
      </span>
      <div className="w-12 sm:w-16 h-0.5 my-1.5" style={{ backgroundColor: color }} />
      <span className="text-4xl sm:text-5xl font-bold" style={{ color }}>
        {d}
      </span>
      {showBar && (
        <div className="mt-3 sm:mt-4 w-28 sm:w-36 h-6 sm:h-7 bg-white/10 rounded overflow-hidden border border-white/20">
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

function ExplanationPanel({
  pair,
  wasCorrect,
  questionType,
}: {
  pair: FractionPair;
  wasCorrect: boolean;
  questionType: QuestionType;
}) {
  const [a_n, a_d] = pair.a;
  const [b_n, b_d] = pair.b;
  const decA = a_n / a_d;
  const decB = b_n / b_d;
  const crossA = a_n * b_d;
  const crossB = b_n * a_d;
  const commonD = lcm(a_d, b_d);
  const commonA = a_n * (commonD / a_d);
  const commonB = b_n * (commonD / b_d);

  const cmpSymbol = (a: number, b: number) => (a > b ? ">" : a < b ? "<" : "=");

  const resultText =
    pair.answer === "equal"
      ? "They are equal!"
      : pair.answer === "left"
        ? `${a_n}/${a_d} is bigger`
        : `${b_n}/${b_d} is bigger`;

  const highlightClass = wasCorrect ? "text-green-400" : "text-amber-400";

  return (
    <div
      className={`rounded-xl p-4 border space-y-2 text-sm ${
        wasCorrect
          ? "bg-green-500/5 border-green-500/20"
          : "bg-amber-500/5 border-amber-500/20"
      }`}
    >
      <div className={`font-bold text-base ${highlightClass}`}>
        {wasCorrect ? "Correct!" : "Not quite!"} {resultText}
      </div>

      {!wasCorrect && (
        <div className="text-xs text-amber-300/80 mb-1">
          {questionType === "bigger"
            ? "You needed to find the bigger fraction."
            : questionType === "smaller"
              ? "You needed to find the smaller fraction."
              : "You needed to decide if they are equal or pick the bigger one."}
        </div>
      )}

      <div className="text-slate-400">
        <span className="text-white font-bold">Decimal: </span>
        {a_n}/{a_d} = {decA.toFixed(3)} {cmpSymbol(decA, decB)} {b_n}/{b_d} ={" "}
        {decB.toFixed(3)}
      </div>
      <div className="text-slate-400">
        <span className="text-white font-bold">Cross-multiply: </span>
        {a_n}&times;{b_d} = {crossA} {cmpSymbol(crossA, crossB)} {b_n}&times;
        {a_d} = {crossB}
      </div>
      <div className="text-slate-400">
        <span className="text-white font-bold">Common denom: </span>
        {commonA}/{commonD} {cmpSymbol(commonA, commonB)} {commonB}/{commonD}
      </div>
    </div>
  );
}

/* ─── Constants ─── */

const COMPARE_TIPS = [
  "If denominators match, the bigger numerator wins!",
  "Cross-multiply to compare: a/b vs c/d \u2192 check a\u00d7d vs b\u00d7c.",
  "1/2 is always a useful benchmark \u2014 is the fraction more or less than half?",
  "A fraction closer to 1 has a numerator close to its denominator.",
  "3/4 > 2/3 because 3\u00d73 = 9 > 4\u00d72 = 8.",
  "Fractions with smaller denominators represent bigger pieces.",
  "Convert to decimals in your head: 3/4 = 0.75, 2/3 \u2248 0.67.",
  "Unit fractions (1/n) get smaller as n gets bigger.",
];

const INITIAL_LIVES = 5;

const MODE_INFO: Record<
  GameMode,
  { icon: React.ReactNode; name: string; desc: string }
> = {
  bigger: {
    icon: <Zap className="w-5 h-5" />,
    name: "Which is Bigger?",
    desc: "Classic mode \u2014 tap the bigger fraction before time runs out.",
  },
  smaller: {
    icon: <ChevronRight className="w-5 h-5 rotate-180" />,
    name: "Which is Smaller?",
    desc: "Flip it! Find the smaller fraction.",
  },
  "equal-or-not": {
    icon: <Equal className="w-5 h-5" />,
    name: "Equal or Not?",
    desc: "Are they equal? If not, pick the bigger one.",
  },
  mixed: {
    icon: <Shuffle className="w-5 h-5" />,
    name: "Mixed Challenge",
    desc: "Random bigger/smaller/equal questions every round.",
  },
  practice: {
    icon: <BookOpen className="w-5 h-5" />,
    name: "Practice",
    desc: "No timer, no lives. Learn with detailed explanations.",
  },
};

/* ─── Timer scaling ─── */

function getTimePerQuestion(level: number): number {
  if (level <= 3) return 5000;
  if (level <= 7) return 4000;
  if (level <= 12) return 3500;
  return 3000;
}

/* ─── Question type helpers ─── */

function pickQuestionType(mode: GameMode): QuestionType {
  if (mode === "bigger") return "bigger";
  if (mode === "smaller") return "smaller";
  if (mode === "equal-or-not") return "equal-or-not";
  // mixed or practice: random
  const options: QuestionType[] = ["bigger", "smaller", "equal-or-not"];
  return options[Math.floor(Math.random() * options.length)];
}

function getQuestionText(qt: QuestionType): { prefix: string; keyword: string } {
  switch (qt) {
    case "bigger":
      return { prefix: "Which fraction is", keyword: "bigger" };
    case "smaller":
      return { prefix: "Which fraction is", keyword: "smaller" };
    case "equal-or-not":
      return { prefix: "Are these fractions", keyword: "equal" };
  }
}

function isChoiceCorrect(
  choice: "left" | "right" | "equal",
  pair: FractionPair,
  questionType: QuestionType
): boolean {
  const { answer } = pair; // "left" (left is bigger), "right" (right is bigger), "equal"

  if (questionType === "bigger" || questionType === "equal-or-not") {
    // Correct: pick the bigger side, or "equal" if they are equal
    if (answer === "equal") return choice === "equal";
    if (answer === "left") return choice === "left";
    return choice === "right";
  }

  // "smaller"
  if (answer === "equal") return choice === "equal";
  // If left is bigger, correct small answer is right, and vice versa
  if (answer === "left") return choice === "right";
  return choice === "left";
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function FractionFighterGame() {
  useGameMusic();

  /* ── Core state ── */
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [gameMode, setGameMode] = useState<GameMode>("bigger");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [pair, setPair] = useState<FractionPair | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | "timeout" | null>(null);
  const [timeLeft, setTimeLeft] = useState(100);
  const [highScore, setHighScore] = useState(() =>
    getLocalHighScore("fractionFighter_highScore")
  );
  const [showHeartRecovery, setShowHeartRecovery] = useState(false);
  const [showFlawlessToast, setShowFlawlessToast] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<
    Array<{ name: string; tier: "bronze" | "silver" | "gold" }>
  >([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [currentQuestionType, setCurrentQuestionType] = useState<QuestionType>("bigger");
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));

  /* ── Practice-specific state ── */
  const [practiceCorrect, setPracticeCorrect] = useState(0);
  const [practiceTotal, setPracticeTotal] = useState(0);
  const [waitingForNext, setWaitingForNext] = useState(false);

  /* ── Settings ── */
  const [showBars, setShowBars] = useState(true);
  const [timerSpeed, setTimerSpeed] = useState(3);
  const [inGracePeriod, setInGracePeriod] = useState(false);

  /* ── Refs ── */
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);
  const livesRef = useRef(INITIAL_LIVES);
  const scoreRef = useRef(0);
  const highScoreRef = useRef(0);
  const startingLevelRef = useRef(1);
  const gameModeRef = useRef<GameMode>("bigger");

  const isPractice = gameMode === "practice";

  // Keep refs in sync
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);
  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    if (pair) setTipIdx(Math.floor(Math.random() * 100));
  }, [pair]);

  /* ── Next problem ── */
  const nextProblem = useCallback(
    (lvl: number) => {
      const mode = gameModeRef.current;
      const qt = pickQuestionType(mode);
      setCurrentQuestionType(qt);

      const allowEqual = true; // all modes allow equal fractions
      const params = getFractionParams(adaptive.level);
      const p = generatePairTuned(lvl, allowEqual, params.maxDenominator, params.minFractionDiff, params.equalProbability);
      setPair(p);
      setResult(null);
      setTimeLeft(100);
      setPhase("playing");
      setWaitingForNext(false);

      // Practice mode: no timer
      if (mode === "practice") {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      const baseTime = getTimePerQuestion(lvl);
      const timerMult = (2.0 - (timerSpeed - 1) * 0.18) * params.timerMultiplier;
      const questionTime = Math.round(baseTime * Math.max(0.3, timerMult));
      const gracePeriod = 1500;

      setInGracePeriod(true);
      startTimeRef.current = Date.now() + gracePeriod;
      setTimeout(() => setInGracePeriod(false), gracePeriod);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const now = Date.now();
        if (now < startTimeRef.current) {
          setTimeLeft(100);
          return;
        }
        const elapsed = now - startTimeRef.current;
        const pct = Math.max(0, 100 - (elapsed / questionTime) * 100);
        setTimeLeft(pct);
        if (pct <= 0) {
          clearInterval(timerRef.current!);
          setResult("timeout");
          setPhase("result");
          setStreak(0);
          setLives((l) => l - 1);
          const newLives = livesRef.current - 1;
          livesRef.current = newLives;
          if (newLives <= 0) {
            setTimeout(() => {
              setPhase("gameOver");
              const currentScore = scoreRef.current;
              if (currentScore > highScoreRef.current) {
                setLocalHighScore("fractionFighter_highScore", currentScore);
                setHighScore(currentScore);
              }
            }, 1500);
          }
        }
      }, 50);
    },
    [timerSpeed, adaptive.level]
  );

  /* ── Countdown ── */
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => {
      if (countdown <= 1) {
        sfxCountdownGo();
        setCountdown(3);
        nextProblem(startingLevelRef.current);
      } else {
        setCountdown(countdown - 1);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [phase, countdown, nextProblem]);

  /* ── Handle choice ── */
  const handleChoice = useCallback(
    (choice: "left" | "right" | "equal") => {
      if (phase !== "playing" || !pair) return;
      if (timerRef.current) clearInterval(timerRef.current);

      const correct = isChoiceCorrect(choice, pair, currentQuestionType);

      if (gameModeRef.current === "practice") {
        // Practice mode: no lives, no score, just feedback
        setPracticeTotal((t) => t + 1);
        if (correct) {
          sfxCorrect();
          setPracticeCorrect((c) => c + 1);
          setResult("correct");
          setAdaptive(prev => adaptiveUpdate(prev, true, false)); // practice has no timer, so "fast" is always false
        } else {
          sfxWrong();
          setResult("wrong");
          setAdaptive(prev => adaptiveUpdate(prev, false, false));
        }
        setPhase("result");
        setWaitingForNext(true);
        return;
      }

      // Competitive modes
      if (correct) {
        const speed = timeLeft / 100;
        const newStreak = streak + 1;
        const { mult } = getMultiplierFromStreak(newStreak);
        const basePoints = Math.round(10 + speed * 20);
        const points = Math.round(basePoints * mult);
        const comboBonus = newStreak > 0 && newStreak % 5 === 0 ? 50 : 0;
        const flawlessBonus = newStreak === 5 ? 50 : 0;
        if (flawlessBonus > 0) {
          setShowFlawlessToast(true);
          setTimeout(() => setShowFlawlessToast(false), 2000);
        }
        setScore((s) => s + points + comboBonus + flawlessBonus);
        setStreak((s) => {
          const ns = s + 1;
          setBestStreak((b) => Math.max(b, ns));
          return ns;
        });
        if (newStreak > 1 && newStreak % 5 === 0) sfxCombo(newStreak);
        else sfxCorrect();
        if (newStreak >= 10 && newStreak % 10 === 0) {
          sfxHeart();
          if (livesRef.current < INITIAL_LIVES) {
            setLives((l) => Math.min(INITIAL_LIVES, l + 1));
            livesRef.current = Math.min(INITIAL_LIVES, livesRef.current + 1);
            setShowHeartRecovery(true);
            setTimeout(() => setShowHeartRecovery(false), 1500);
          }
        }
        setResult("correct");
        setLevel((l) => l + (streak > 0 && streak % 5 === 4 ? 1 : 0));
        const wasFast = timeLeft > 50; // answered in less than half the time
        setAdaptive(prev => adaptiveUpdate(prev, true, wasFast));
      } else {
        sfxWrong();
        setStreak(0);
        setResult("wrong");
        setLives((l) => l - 1);
        setAdaptive(prev => adaptiveUpdate(prev, false, false));
        const newLives = livesRef.current - 1;
        livesRef.current = newLives;
        if (newLives <= 0) {
          setTimeout(() => {
            setPhase("gameOver");
            const currentScore = scoreRef.current;
            if (currentScore > highScoreRef.current) {
              setLocalHighScore("fractionFighter_highScore", currentScore);
              setHighScore(currentScore);
            }
          }, 1500);
        }
      }
      setPhase("result");
    },
    [phase, pair, timeLeft, streak, currentQuestionType]
  );

  /* ── Auto-advance (non-practice) ── */
  useEffect(() => {
    if (phase !== "result") return;
    if (gameModeRef.current === "practice") return; // practice waits for Next click
    if (lives <= 0) return;
    const t = setTimeout(() => nextProblem(level), 3500);
    return () => clearTimeout(t);
  }, [phase, level, lives, nextProblem]);

  /* ── Start game ── */
  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    gameModeRef.current = mode;
    setScore(0);
    setLives(INITIAL_LIVES);
    startingLevelRef.current = level;
    setStreak(0);
    setBestStreak(0);
    setShowHeartRecovery(false);
    setShowFlawlessToast(false);
    setAchievementQueue([]);
    setShowAchievementIndex(0);
    setCountdown(3);
    livesRef.current = INITIAL_LIVES;
    scoreRef.current = 0;
    setPracticeCorrect(0);
    setPracticeTotal(0);
    setWaitingForNext(false);
    setAdaptive(createAdaptiveState(level));

    if (mode === "practice") {
      // Skip countdown in practice mode
      nextProblem(level);
    } else {
      setPhase("countdown");
    }
  };

  /* ── End practice ── */
  const endPractice = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("menu");
  };

  /* ── Game over effects ── */
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
    if (newOnes.length > 0) {
      sfxAchievement();
      setAchievementQueue(newOnes);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Cleanup ── */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /* ── Determine answer highlight colors ── */
  const getLeftHighlight = () => {
    if (phase !== "result" || !pair) return false;
    if (currentQuestionType === "smaller") {
      // left is correct if it's the smaller one (pair.answer === "right" means right is bigger so left is smaller) or equal
      return pair.answer === "right" || pair.answer === "equal";
    }
    // bigger / equal-or-not: left is correct when left is bigger
    return pair.answer === "left";
  };

  const getRightHighlight = () => {
    if (phase !== "result" || !pair) return false;
    if (currentQuestionType === "smaller") {
      return pair.answer === "left" || pair.answer === "equal";
    }
    return pair.answer === "right";
  };

  const getEqualHighlight = () => {
    if (phase !== "result" || !pair) return false;
    return pair.answer === "equal";
  };

  const leftCorrect = getLeftHighlight();
  const rightCorrect = getRightHighlight();
  const equalCorrect = getEqualHighlight();

  /* ─────────────────── RENDER ─────────────────── */

  const questionInfo = getQuestionText(currentQuestionType);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-red-950 to-slate-950 flex flex-col items-center">
      {/* ── Header ── */}
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link
          href="/games"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Fraction Fighter</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* ═══ MENU ═══ */}
        {phase === "menu" && (
          <div className="text-center w-full">
            <div className="text-6xl mb-4">\u2694\uFE0F</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Fraction Fighter
            </h2>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Compare fractions, learn techniques, and level up your skills!
            </p>

            {/* Mode selection */}
            <div className="grid grid-cols-1 gap-2 mb-6 text-left">
              {(Object.keys(MODE_INFO) as GameMode[]).map((mode) => {
                const info = MODE_INFO[mode];
                return (
                  <button
                    key={mode}
                    onClick={() => startGame(mode)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      mode === "practice"
                        ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-400/50"
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-red-400/30"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        mode === "practice"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm">
                        {info.name}
                      </div>
                      <div className="text-slate-500 text-xs truncate">
                        {info.desc}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Settings */}
            <div className="space-y-4 mb-5">
              {/* Timer speed slider */}
              <div className="max-w-xs mx-auto">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">Timer speed</span>
                  <span className="text-xs font-bold text-red-400 tabular-nums">
                    {(
                      5 * Math.max(0.3, 2.0 - (timerSpeed - 1) * 0.18)
                    ).toFixed(1)}
                    s / question
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={timerSpeed}
                  onChange={(e) => setTimerSpeed(Number(e.target.value))}
                  className="w-full accent-red-500"
                />
                <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                  <span>Relaxed</span>
                  <span>Blitz</span>
                </div>
              </div>

              {/* Starting difficulty */}
              <div className="max-w-xs mx-auto">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">
                    Starting difficulty
                  </span>
                  <span className="text-xs font-bold text-red-400">
                    Level {level}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  className="w-full accent-red-500"
                />
                <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                  <span>Easy (1/2 vs 1/3)</span>
                  <span>Hard (7/13 vs 9/17)</span>
                </div>
              </div>

              {/* Visual bars toggle */}
              <div className="max-w-xs mx-auto">
                <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
                  <span className="text-xs text-slate-400">
                    Show visual bars
                  </span>
                  <input
                    type="checkbox"
                    checked={showBars}
                    onChange={(e) => setShowBars(e.target.checked)}
                    className="rounded accent-red-500 w-4 h-4"
                  />
                </label>
              </div>
            </div>

            {highScore > 0 && (
              <div className="mt-2 flex items-center justify-center gap-2 text-yellow-400 text-sm">
                <Trophy className="w-4 h-4" /> Best: {highScore}
              </div>
            )}
          </div>
        )}

        {/* ═══ COUNTDOWN ═══ */}
        {phase === "countdown" && (
          <div className="text-center py-20">
            <div className="text-8xl font-bold text-red-400 animate-pulse">
              {countdown || "GO!"}
            </div>
            <p className="mt-4 text-slate-400">Get ready...</p>
          </div>
        )}

        {/* ═══ PLAYING / RESULT ═══ */}
        {(phase === "playing" || phase === "result") && pair && (
          <div className="w-full space-y-4">
            {/* HUD */}
            {isPractice ? (
              /* Practice HUD */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    Practice Mode
                  </span>
                </div>
                <div className="text-sm text-slate-400 tabular-nums">
                  {practiceTotal > 0 ? (
                    <>
                      <span className="text-white font-bold">
                        {practiceCorrect}
                      </span>{" "}
                      / {practiceTotal}{" "}
                      <span className="text-emerald-400">
                        (
                        {Math.round(
                          (practiceCorrect / practiceTotal) * 100
                        )}
                        %)
                      </span>
                    </>
                  ) : (
                    "Ready to learn!"
                  )}
                </div>
                <button
                  onClick={endPractice}
                  className="text-xs text-slate-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                >
                  End Practice
                </button>
              </div>
            ) : (
              /* Competitive HUD */
              <>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                      <Heart
                        key={i}
                        className={`w-5 h-5 transition-all ${
                          i < lives
                            ? "text-red-400 fill-red-400"
                            : "text-slate-700 scale-75"
                        }`}
                      />
                    ))}
                  </div>
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
                  <div className="text-2xl font-bold text-white tabular-nums">
                    {score}
                  </div>
                </div>
                <HeartRecovery show={showHeartRecovery} />
                <BonusToast
                  show={showFlawlessToast}
                  text="Flawless Round!"
                  points={50}
                />
              </>
            )}

            {/* Timer bar (not in practice mode) */}
            {!isPractice && (
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                {inGracePeriod && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Read the fractions...
                    </span>
                  </div>
                )}
                <div
                  className="h-full rounded-full transition-all duration-100 ease-linear"
                  style={{
                    width: `${timeLeft}%`,
                    background: inGracePeriod
                      ? "#6366f1"
                      : timeLeft > 50
                        ? "#10b981"
                        : timeLeft > 25
                          ? "#f59e0b"
                          : "#ef4444",
                  }}
                />
              </div>
            )}

            {/* Tip (playing phase only, non-practice) */}
            {phase === "playing" && !isPractice && (
              <div className="text-center text-[11px] text-slate-500 italic px-4">
                <HelpCircle className="w-3 h-3 inline mr-1 -mt-0.5" />
                {COMPARE_TIPS[tipIdx % COMPARE_TIPS.length]}
              </div>
            )}

            {/* Question text */}
            <div className="text-center text-slate-400 text-sm">
              {questionInfo.prefix}{" "}
              <span className="text-white font-bold">
                {questionInfo.keyword}
              </span>
              ?
            </div>

            {/* Fractions + Equal button */}
            <div className="flex items-center justify-center gap-3">
              {/* Left fraction */}
              <button
                onClick={() => handleChoice("left")}
                disabled={phase === "result"}
                className={`flex-1 py-8 rounded-2xl border-2 transition-all duration-200 active:scale-95 shadow-lg ${
                  phase === "result"
                    ? leftCorrect
                      ? "border-green-400 bg-green-500/20 shadow-green-500/10"
                      : "border-red-400/30 bg-red-500/10 opacity-50 shadow-black/10"
                    : "border-white/10 bg-white/5 hover:border-red-400/50 hover:bg-white/10 hover:shadow-xl hover:shadow-red-500/10"
                }`}
              >
                <FractionDisplay
                  n={pair.a[0]}
                  d={pair.a[1]}
                  color={
                    phase === "result" && leftCorrect
                      ? "#4ade80"
                      : "#f87171"
                  }
                  showBar={showBars}
                />
              </button>

              {/* Equal button */}
              <button
                onClick={() => handleChoice("equal")}
                disabled={phase === "result"}
                className={`w-16 sm:w-20 py-8 rounded-2xl border-2 transition-all duration-200 active:scale-95 shadow-lg flex items-center justify-center ${
                  phase === "result"
                    ? equalCorrect
                      ? "border-green-400 bg-green-500/20 shadow-green-500/10"
                      : "border-white/5 bg-white/[0.02] opacity-40"
                    : "border-white/10 bg-white/5 hover:border-yellow-400/50 hover:bg-white/10 hover:shadow-xl hover:shadow-yellow-500/10"
                }`}
              >
                <span
                  className={`text-3xl sm:text-4xl font-bold ${
                    phase === "result" && equalCorrect
                      ? "text-green-400"
                      : "text-yellow-400"
                  }`}
                >
                  =
                </span>
              </button>

              {/* Right fraction */}
              <button
                onClick={() => handleChoice("right")}
                disabled={phase === "result"}
                className={`flex-1 py-8 rounded-2xl border-2 transition-all duration-200 active:scale-95 shadow-lg ${
                  phase === "result"
                    ? rightCorrect
                      ? "border-green-400 bg-green-500/20 shadow-green-500/10"
                      : "border-blue-400/30 bg-blue-500/10 opacity-50 shadow-black/10"
                    : "border-white/10 bg-white/5 hover:border-blue-400/50 hover:bg-white/10 hover:shadow-xl hover:shadow-blue-500/10"
                }`}
              >
                <FractionDisplay
                  n={pair.b[0]}
                  d={pair.b[1]}
                  color={
                    phase === "result" && rightCorrect
                      ? "#4ade80"
                      : "#60a5fa"
                  }
                  showBar={showBars}
                />
              </button>
            </div>

            {/* Result feedback */}
            {phase === "result" && (
              <div className="space-y-3">
                {/* Quick result text (non-practice) */}
                {!isPractice && (
                  <div
                    className={`text-center text-lg font-bold ${
                      result === "correct" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {result === "correct"
                      ? "Correct!"
                      : result === "timeout"
                        ? "Too slow!"
                        : "Wrong!"}
                  </div>
                )}

                {/* Explanation panel */}
                <ExplanationPanel
                  pair={pair}
                  wasCorrect={result === "correct"}
                  questionType={currentQuestionType}
                />

                {/* Practice mode: Next button */}
                {isPractice && waitingForNext && (
                  <button
                    onClick={() => nextProblem(level)}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-base transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ GAME OVER ═══ */}
        {phase === "gameOver" && (
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-2">Game Over</h3>
            <div className="text-5xl font-bold text-red-400 mb-2">{score}</div>
            <p className="text-slate-400 mb-1 text-sm">Best streak: x{bestStreak}</p>
            <p className="text-slate-400 mb-6 text-sm">Final difficulty: <span className="text-white font-bold">{adaptive.level.toFixed(1)}</span></p>
            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-sm font-medium mb-2 flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" /> New High Score!
              </p>
            )}
            <div className="mb-3">
              <ScoreSubmit
                game="fraction-fighter"
                score={score}
                level={level}
                stats={{ bestStreak }}
              />
            </div>
            {achievementQueue.length > 0 &&
              showAchievementIndex < achievementQueue.length && (
                <AchievementToast
                  name={achievementQueue[showAchievementIndex].name}
                  tier={achievementQueue[showAchievementIndex].tier}
                  onDismiss={() => {
                    if (showAchievementIndex + 1 >= achievementQueue.length)
                      setAchievementQueue([]);
                    setShowAchievementIndex((i) => i + 1);
                  }}
                />
              )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => startGame(gameMode)}
                className="px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Again
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all"
              >
                Menu
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
