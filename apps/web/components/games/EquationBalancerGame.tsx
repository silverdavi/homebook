"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Timer, Star, Plus, Minus, CheckCircle2, FlaskConical, BookOpen, ChevronRight } from "lucide-react";
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
import { getGradeForLevel } from "@/lib/games/learning-guide";
import Link from "next/link";

// ── Types ──

interface Compound {
  /** e.g. "H2O", "CO2", "Fe2O3" */
  formula: string;
  /** Parsed atoms: { H: 2, O: 1 } */
  atoms: Record<string, number>;
}

interface Equation {
  reactants: Compound[];
  products: Compound[];
  /** The correct balanced coefficients [r1, r2, ..., p1, p2, ...] */
  solution: number[];
  difficulty: "easy" | "medium" | "hard";
}

type GamePhase = "menu" | "countdown" | "playing" | "gameOver";

// ── Equation bank ──

function parseFormula(formula: string): Record<string, number> {
  const atoms: Record<string, number> = {};
  const regex = /([A-Z][a-z]?)(\d*)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(formula)) !== null) {
    if (!match[1]) continue;
    const element = match[1];
    const count = match[2] ? parseInt(match[2], 10) : 1;
    atoms[element] = (atoms[element] || 0) + count;
  }
  return atoms;
}

function makeCompound(formula: string): Compound {
  return { formula, atoms: parseFormula(formula) };
}

const EQUATIONS: Equation[] = [
  // Easy
  { reactants: [makeCompound("H2"), makeCompound("O2")], products: [makeCompound("H2O")], solution: [2, 1, 2], difficulty: "easy" },
  { reactants: [makeCompound("N2"), makeCompound("H2")], products: [makeCompound("NH3")], solution: [1, 3, 2], difficulty: "easy" },
  { reactants: [makeCompound("Na"), makeCompound("Cl2")], products: [makeCompound("NaCl")], solution: [2, 1, 2], difficulty: "easy" },
  { reactants: [makeCompound("Mg"), makeCompound("O2")], products: [makeCompound("MgO")], solution: [2, 1, 2], difficulty: "easy" },
  { reactants: [makeCompound("C"), makeCompound("O2")], products: [makeCompound("CO2")], solution: [1, 1, 1], difficulty: "easy" },
  { reactants: [makeCompound("H2"), makeCompound("Cl2")], products: [makeCompound("HCl")], solution: [1, 1, 2], difficulty: "easy" },
  { reactants: [makeCompound("Ca"), makeCompound("O2")], products: [makeCompound("CaO")], solution: [2, 1, 2], difficulty: "easy" },
  // Medium
  { reactants: [makeCompound("Fe"), makeCompound("O2")], products: [makeCompound("Fe2O3")], solution: [4, 3, 2], difficulty: "medium" },
  { reactants: [makeCompound("CH4"), makeCompound("O2")], products: [makeCompound("CO2"), makeCompound("H2O")], solution: [1, 2, 1, 2], difficulty: "medium" },
  { reactants: [makeCompound("Al"), makeCompound("O2")], products: [makeCompound("Al2O3")], solution: [4, 3, 2], difficulty: "medium" },
  { reactants: [makeCompound("P4"), makeCompound("O2")], products: [makeCompound("P2O5")], solution: [1, 5, 2], difficulty: "medium" },
  { reactants: [makeCompound("Na"), makeCompound("H2O")], products: [makeCompound("NaOH"), makeCompound("H2")], solution: [2, 2, 2, 1], difficulty: "medium" },
  { reactants: [makeCompound("Fe"), makeCompound("Cl2")], products: [makeCompound("FeCl3")], solution: [2, 3, 2], difficulty: "medium" },
  { reactants: [makeCompound("CaO"), makeCompound("H2O")], products: [makeCompound("CaO2H2")], solution: [1, 1, 1], difficulty: "medium" },
  // Hard
  { reactants: [makeCompound("C3H8"), makeCompound("O2")], products: [makeCompound("CO2"), makeCompound("H2O")], solution: [1, 5, 3, 4], difficulty: "hard" },
  { reactants: [makeCompound("Fe2O3"), makeCompound("C")], products: [makeCompound("Fe"), makeCompound("CO2")], solution: [2, 3, 4, 3], difficulty: "hard" },
  { reactants: [makeCompound("C2H6"), makeCompound("O2")], products: [makeCompound("CO2"), makeCompound("H2O")], solution: [2, 7, 4, 6], difficulty: "hard" },
  { reactants: [makeCompound("Al"), makeCompound("HCl")], products: [makeCompound("AlCl3"), makeCompound("H2")], solution: [2, 6, 2, 3], difficulty: "hard" },
  { reactants: [makeCompound("C2H5OH"), makeCompound("O2")], products: [makeCompound("CO2"), makeCompound("H2O")], solution: [1, 3, 2, 3], difficulty: "hard" },
  { reactants: [makeCompound("Fe2O3"), makeCompound("CO")], products: [makeCompound("Fe"), makeCompound("CO2")], solution: [1, 3, 2, 3], difficulty: "hard" },
  { reactants: [makeCompound("KClO3")], products: [makeCompound("KCl"), makeCompound("O2")], solution: [2, 2, 3], difficulty: "hard" },
  { reactants: [makeCompound("Ca"), makeCompound("H2O")], products: [makeCompound("CaO2H2"), makeCompound("H2")], solution: [1, 2, 1, 1], difficulty: "hard" },
  { reactants: [makeCompound("SiO2"), makeCompound("C")], products: [makeCompound("Si"), makeCompound("CO")], solution: [1, 2, 1, 2], difficulty: "hard" },
];

/** Map adaptive level (1-50) → which equation difficulties to include */
function getEquationsByAdaptiveLevel(level: number): Equation[] {
  if (level < 4) return EQUATIONS.filter((e) => e.difficulty === "easy");
  if (level < 8) return EQUATIONS.filter((e) => e.difficulty === "easy" || e.difficulty === "medium");
  if (level < 14) return EQUATIONS.filter((e) => e.difficulty === "medium" || e.difficulty === "hard");
  return EQUATIONS.filter((e) => e.difficulty === "hard");
}

function pickEquation(adaptiveLevel: number, usedIndices: Set<number>): { eq: Equation; idx: number } {
  const pool = getEquationsByAdaptiveLevel(adaptiveLevel);
  const globalIndices = pool.map((eq) => EQUATIONS.indexOf(eq)).filter((i) => !usedIndices.has(i));
  const candidates = globalIndices.length > 0 ? globalIndices : pool.map((eq) => EQUATIONS.indexOf(eq));
  const idx = candidates[Math.floor(Math.random() * candidates.length)];
  return { eq: EQUATIONS[idx], idx };
}

function multiplyAtoms(atoms: Record<string, number>, coeff: number): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [el, count] of Object.entries(atoms)) {
    result[el] = count * coeff;
  }
  return result;
}

function sumAtoms(compounds: Compound[], coefficients: number[]): Record<string, number> {
  const total: Record<string, number> = {};
  compounds.forEach((c, i) => {
    const mult = multiplyAtoms(c.atoms, coefficients[i]);
    for (const [el, count] of Object.entries(mult)) {
      total[el] = (total[el] || 0) + count;
    }
  });
  return total;
}

function isBalanced(eq: Equation, coefficients: number[]): boolean {
  const reactantCoeffs = coefficients.slice(0, eq.reactants.length);
  const productCoeffs = coefficients.slice(eq.reactants.length);
  if (reactantCoeffs.some((c) => c === 0) || productCoeffs.some((c) => c === 0)) return false;
  const left = sumAtoms(eq.reactants, reactantCoeffs);
  const right = sumAtoms(eq.products, productCoeffs);
  const allElements = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const el of allElements) {
    if ((left[el] || 0) !== (right[el] || 0)) return false;
  }
  return true;
}

/** Render a formula with subscript numbers */
function FormulaDisplay({ formula, className = "" }: { formula: string; className?: string }) {
  const parts: React.ReactNode[] = [];
  const regex = /([A-Z][a-z]?)(\d*)/g;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(formula)) !== null) {
    if (!match[1]) continue;
    parts.push(<span key={key++}>{match[1]}</span>);
    if (match[2]) {
      parts.push(
        <sub key={key++} className="text-[0.7em]">
          {match[2]}
        </sub>
      );
    }
  }
  return <span className={className}>{parts}</span>;
}

/** Generate a human-readable explanation of the solution */
function getSolutionExplanation(eq: Equation): string {
  const allCompounds = [...eq.reactants, ...eq.products];
  const coeffLabels = eq.solution.map((c, i) => `${c}${allCompounds[i].formula}`);
  const leftSide = coeffLabels.slice(0, eq.reactants.length).join(" + ");
  const rightSide = coeffLabels.slice(eq.reactants.length).join(" + ");

  const left = sumAtoms(eq.reactants, eq.solution.slice(0, eq.reactants.length));
  const right = sumAtoms(eq.products, eq.solution.slice(eq.reactants.length));
  const elements = Object.keys(left).sort();
  const counts = elements.map((el) => `${el}: ${left[el]} = ${right[el]}`).join(", ");

  return `${leftSide} → ${rightSide}\nAtom check: ${counts}`;
}

// ── Constants ──

const CHEMISTRY_TIPS = [
  "Conservation of mass: atoms can't be created or destroyed in a reaction.",
  "Start by balancing the element that appears in the fewest compounds.",
  "Save hydrogen and oxygen for last — they often appear in multiple compounds.",
  "If a polyatomic ion appears on both sides unchanged, balance it as a unit.",
  "Coefficients multiply ALL atoms in a compound, not just the first element.",
  "An equation is balanced when each element has equal counts on both sides.",
  "Fractional coefficients can help — multiply everything by the denominator after.",
  "Combustion reactions: fuel + O₂ → CO₂ + H₂O. Balance C first, then H, then O.",
];

const COUNTDOWN_SECS = 3;

export function EquationBalancerGame() {
  useGameMusic();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [solved, setSolved] = useState(0);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("equationBalancer_highScore"));
  const [achievementQueue, setAchievementQueue] = useState<Array<{ name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);

  // Current equation state
  const [currentEq, setCurrentEq] = useState<Equation | null>(null);
  const [coefficients, setCoefficients] = useState<number[]>([]);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);
  const usedEquationsRef = useRef<Set<number>>(new Set());
  const roundStartRef = useRef(0);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Settings
  const [difficulty, setDifficulty] = useState(5);
  const [totalRounds, setTotalRounds] = useState(10);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [secsPerEquation, setSecsPerEquation] = useState(30);

  // ── Adaptive difficulty ──
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));

  // ── Practice mode ──
  const [isPractice, setIsPractice] = useState(false);
  const [practiceCorrect, setPracticeCorrect] = useState(0);
  const [practiceTotal, setPracticeTotal] = useState(0);
  const [waitingForNext, setWaitingForNext] = useState(false);

  // ── Countdown ──
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => {
      setCountdown((c) => {
        if (c <= 1) {
          sfxCountdownGo();
          setTimeout(() => {
            setPhase("playing");
            loadNextEquation();
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

  // ── Timer ──
  useEffect(() => {
    if (phase !== "playing" || !timerEnabled || isPractice) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time up for this equation — treat as wrong
          clearInterval(timerRef.current!);
          handleTimerExpired();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timerEnabled, round, isPractice]);

  const handleTimerExpired = useCallback(() => {
    sfxWrong();
    setStreak(0);
    setFlash("wrong");
    setShowResult("wrong");
    setAdaptive(prev => adaptiveUpdate(prev, false, false));
    setTimeout(() => {
      setFlash(null);
      setShowResult(null);
      if (round + 1 >= totalRounds) {
        endGame();
      } else {
        setRound((r) => r + 1);
        loadNextEquation();
      }
    }, 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, totalRounds]);

  // ── Game over effects ──
  useEffect(() => {
    if (phase !== "gameOver") return;
    sfxGameOver();
    if (score > highScore) {
      setLocalHighScore("equationBalancer_highScore", score);
      setHighScore(score);
    }
    trackGamePlayed("equation-balancer", score);
    const profile = getProfile();
    const newOnes = checkAchievements(
      { gameId: "equation-balancer", score, solved, bestStreak, accuracy: totalRounds > 0 ? Math.round((solved / totalRounds) * 100) : 0 },
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
        startGame(false);
      }
      if (e.key === "Escape" && phase !== "menu") {
        e.preventDefault();
        setPhase("menu");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadNextEquation = useCallback(() => {
    const { eq, idx } = pickEquation(adaptive.level, usedEquationsRef.current);
    usedEquationsRef.current.add(idx);
    setCurrentEq(eq);
    setCoefficients(new Array(eq.reactants.length + eq.products.length).fill(1));
    setTimeLeft(secsPerEquation);
    setShowResult(null);
    setWaitingForNext(false);
    roundStartRef.current = Date.now();
    setTipIdx(Math.floor(Math.random() * CHEMISTRY_TIPS.length));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adaptive.level, secsPerEquation]);

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("gameOver");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adjustCoefficient = (index: number, delta: number) => {
    if (showResult) return;
    sfxClick();
    setCoefficients((prev) => {
      const next = [...prev];
      next[index] = Math.max(1, Math.min(10, next[index] + delta));
      return next;
    });
  };

  const checkAnswer = () => {
    if (!currentEq || showResult) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsed = (Date.now() - roundStartRef.current) / 1000;
    const wasFast = timerEnabled ? elapsed < secsPerEquation * 0.5 : elapsed < 15;

    if (isBalanced(currentEq, coefficients)) {
      if (isPractice) {
        sfxCorrect();
        setPracticeCorrect((c) => c + 1);
        setPracticeTotal((t) => t + 1);
        setShowResult("correct");
        setAdaptive(prev => adaptiveUpdate(prev, true, wasFast));
        setWaitingForNext(true);
        return;
      }

      const newStreak = streak + 1;
      const { mult } = getMultiplierFromStreak(newStreak);
      const timeBonus = timerEnabled ? Math.max(0, Math.round((secsPerEquation - elapsed) * 2)) : 0;
      const diffBonus = difficulty * 5;
      const points = Math.round((20 + timeBonus + diffBonus) * mult);

      setScore((s) => s + points);
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      setSolved((s) => s + 1);
      setFlash("correct");
      setShowResult("correct");
      setAdaptive(prev => adaptiveUpdate(prev, true, wasFast));
      if (newStreak > 1 && newStreak % 5 === 0) sfxCombo(newStreak);
      else sfxCorrect();
    } else {
      if (isPractice) {
        sfxWrong();
        setPracticeTotal((t) => t + 1);
        setShowResult("wrong");
        setAdaptive(prev => adaptiveUpdate(prev, false, false));
        setWaitingForNext(true);
        return;
      }

      sfxWrong();
      setStreak(0);
      setFlash("wrong");
      setShowResult("wrong");
      setAdaptive(prev => adaptiveUpdate(prev, false, false));
    }

    if (!isPractice) {
      setTimeout(() => {
        setFlash(null);
        setShowResult(null);
        if (round + 1 >= totalRounds) {
          endGame();
        } else {
          setRound((r) => r + 1);
          loadNextEquation();
        }
      }, 1500);
    }
  };

  const practiceNext = () => {
    setShowResult(null);
    setWaitingForNext(false);
    loadNextEquation();
  };

  const startGame = (practice: boolean) => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setRound(0);
    setSolved(0);
    setCountdown(COUNTDOWN_SECS);
    setAchievementQueue([]);
    setShowAchievementIndex(0);
    setIsPractice(practice);
    setPracticeCorrect(0);
    setPracticeTotal(0);
    setWaitingForNext(false);
    usedEquationsRef.current.clear();
    setAdaptive(createAdaptiveState(practice ? 1 : difficulty));

    if (practice) {
      // Skip countdown in practice mode
      setPhase("playing");
      // Need to load after state settles
      setTimeout(() => loadNextEquation(), 0);
    } else {
      setPhase("countdown");
    }
  };

  const endPractice = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("menu");
  };

  // ── Render helpers ──

  const renderAtomCounts = () => {
    if (!currentEq) return null;
    const reactantCoeffs = coefficients.slice(0, currentEq.reactants.length);
    const productCoeffs = coefficients.slice(currentEq.reactants.length);
    const left = sumAtoms(currentEq.reactants, reactantCoeffs);
    const right = sumAtoms(currentEq.products, productCoeffs);
    const allElements = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort();

    return (
      <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm mx-auto w-fit">
        <div className="text-slate-500 font-medium text-right">Left</div>
        <div className="text-slate-500 font-medium text-center">Atom</div>
        <div className="text-slate-500 font-medium text-left">Right</div>
        {allElements.map((el) => {
          const l = left[el] || 0;
          const r = right[el] || 0;
          const balanced = l === r;
          return (
            <div key={el} className="contents">
              <div className={`text-right font-bold tabular-nums ${balanced ? "text-green-400" : "text-red-400"}`}>{l}</div>
              <div className="text-center text-white font-medium">{el}</div>
              <div className={`text-left font-bold tabular-nums ${balanced ? "text-green-400" : "text-red-400"}`}>{r}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCompoundWithCoeff = (compound: Compound, coeffIndex: number) => {
    const coeff = coefficients[coeffIndex];
    return (
      <div key={coeffIndex} className="flex flex-col items-center gap-1">
        <button
          onClick={() => adjustCoefficient(coeffIndex, 1)}
          className="p-1 rounded-lg bg-white/10 hover:bg-cyan-500/30 text-white transition-all active:scale-90"
          aria-label="Increase coefficient"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="flex items-baseline gap-0.5">
          <span className={`text-2xl font-bold tabular-nums min-w-[1.5rem] text-center ${coeff > 1 ? "text-cyan-400" : "text-white/50"}`}>
            {coeff}
          </span>
          <span className="text-2xl font-bold text-white">
            <FormulaDisplay formula={compound.formula} />
          </span>
        </div>
        <button
          onClick={() => adjustCoefficient(coeffIndex, -1)}
          className="p-1 rounded-lg bg-white/10 hover:bg-cyan-500/30 text-white transition-all active:scale-90"
          aria-label="Decrease coefficient"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const timerBarWidth = timerEnabled && secsPerEquation > 0 && !isPractice ? (timeLeft / secsPerEquation) * 100 : 100;
  const timerColor = timeLeft > 15 ? "text-green-400" : timeLeft > 7 ? "text-yellow-400" : "text-red-400";
  const accuracy = totalRounds > 0 && phase === "gameOver" ? Math.round((solved / totalRounds) * 100) : 0;
  const dl = getDifficultyLabel(adaptive.level);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-cyan-950 to-slate-950 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Equation Balancer</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* ── MENU ── */}
        {phase === "menu" && (
          <div className="text-center w-full">
            <div className="text-6xl mb-4">⚖️</div>
            <h2 className="text-3xl font-bold text-white mb-2">Equation Balancer</h2>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Balance chemical equations by adjusting coefficients. Conservation of mass rules!
            </p>

            {/* Difficulty slider */}
            <div className="max-w-xs mx-auto mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Starting Difficulty</span>
                <span className="text-xs font-bold text-cyan-400">{getDifficultyLabel(difficulty).label}</span>
              </div>
              <input type="range" min={1} max={10} step={1} value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full accent-cyan-500" />
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>Simple reactions</span><span>Complex chains</span>
              </div>
            </div>

            {/* Rounds slider */}
            <div className="max-w-xs mx-auto mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Rounds</span>
                <span className="text-xs font-bold text-cyan-400 tabular-nums">{totalRounds}</span>
              </div>
              <input type="range" min={5} max={20} step={1} value={totalRounds}
                onChange={(e) => setTotalRounds(Number(e.target.value))}
                className="w-full accent-cyan-500" />
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>5 quick</span><span>20 marathon</span>
              </div>
            </div>

            {/* Timer toggle */}
            <div className="max-w-xs mx-auto mb-2">
              <button
                onClick={() => setTimerEnabled(!timerEnabled)}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${timerEnabled ? "bg-cyan-500/25 border border-cyan-400/50 text-cyan-400" : "bg-white/5 border border-white/10 text-slate-500"}`}
              >
                Timer {timerEnabled ? "ON" : "OFF"}
              </button>
            </div>

            {/* Secs per equation slider (visible when timer on) */}
            {timerEnabled && (
              <div className="max-w-xs mx-auto mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">Sec / equation</span>
                  <span className="text-xs font-bold text-cyan-400 tabular-nums">{secsPerEquation}s</span>
                </div>
                <input type="range" min={10} max={120} step={5} value={secsPerEquation}
                  onChange={(e) => setSecsPerEquation(Number(e.target.value))}
                  className="w-full accent-cyan-500" />
                <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                  <span>10s speed</span><span>120s relaxed</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center mt-2">
              <button onClick={() => startGame(false)}
                className="px-10 py-4 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/30">
                Start
              </button>
              <button onClick={() => startGame(true)}
                className="px-6 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 hover:border-emerald-400/50 text-emerald-400 font-bold rounded-xl text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Practice
              </button>
            </div>
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
            <div className="text-8xl font-bold text-cyan-400 animate-pulse">
              {countdown || "GO!"}
            </div>
          </div>
        )}

        {/* ── PLAYING ── */}
        {phase === "playing" && currentEq && (
          <div className="w-full space-y-4">
            {/* Timer bar */}
            {timerEnabled && !isPractice && (
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${timerBarWidth}%`, background: timeLeft > 15 ? "#06b6d4" : timeLeft > 7 ? "#f59e0b" : "#ef4444" }} />
              </div>
            )}

            {/* Tip */}
            <div className="text-center text-[11px] text-slate-500 italic px-4">
              💡 {CHEMISTRY_TIPS[tipIdx % CHEMISTRY_TIPS.length]}
            </div>

            {/* HUD */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {timerEnabled && !isPractice && (
                  <>
                    <Timer className={`w-5 h-5 ${timerColor}`} />
                    <span className={`text-xl font-bold tabular-nums ${timerColor}`}>{timeLeft}s</span>
                  </>
                )}
                {isPractice ? (
                  <span className="text-sm text-emerald-400 font-medium">
                    Practice {practiceTotal > 0 ? `${practiceCorrect}/${practiceTotal}` : ""}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">
                    {round + 1}/{totalRounds}
                  </span>
                )}
              </div>

              {/* Adaptive difficulty badge */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold" style={{ color: dl.color }}>{dl.emoji} {dl.label}</span>
                <span className="text-xs text-white/60">Lvl {Math.round(adaptive.level)} &middot; {getGradeForLevel(adaptive.level).label}</span>
                {adaptive.lastAdjust && Date.now() - adaptive.lastAdjustTime < 2000 && (
                  <span className={`text-[10px] font-bold animate-bounce ${adaptive.lastAdjust === "up" ? "text-red-400" : "text-green-400"}`}>
                    {adaptive.lastAdjust === "up" ? "↑ Harder!" : "↓ Easier"}
                  </span>
                )}
              </div>

              {!isPractice && <StreakBadge streak={streak} />}
              {!isPractice && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-white tabular-nums">{score}</div>
                  <div className="text-xs text-slate-400">{solved} balanced</div>
                </div>
              )}
            </div>

            {/* Practice mode: End button */}
            {isPractice && (
              <div className="flex justify-end">
                <button onClick={endPractice} className="text-xs text-slate-500 hover:text-white transition-colors underline">
                  End Practice
                </button>
              </div>
            )}

            {/* Flash overlay */}
            {flash && (
              <div className={`fixed inset-0 pointer-events-none z-50 ${flash === "correct" ? "bg-green-500/10" : "bg-red-500/15"}`} />
            )}

            {/* Equation display */}
            <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-lg shadow-black/20">
              {/* Result overlay */}
              {showResult && (
                <div className={`text-center mb-3 text-lg font-bold ${showResult === "correct" ? "text-green-400" : "text-red-400"}`}>
                  {showResult === "correct" ? "✓ Balanced!" : "✗ Not balanced"}
                  {showResult === "wrong" && currentEq && (
                    <div className="text-xs text-slate-400 mt-1">
                      Solution: {currentEq.solution.slice(0, currentEq.reactants.length).join(", ")} → {currentEq.solution.slice(currentEq.reactants.length).join(", ")}
                    </div>
                  )}
                </div>
              )}

              {/* Equation with coefficients */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {currentEq.reactants.map((compound, i) => (
                  <div key={`r${i}`} className="flex items-center gap-2">
                    {i > 0 && <span className="text-xl text-slate-400 font-bold">+</span>}
                    {renderCompoundWithCoeff(compound, i)}
                  </div>
                ))}
                <span className="text-2xl text-white font-bold mx-2">→</span>
                {currentEq.products.map((compound, i) => (
                  <div key={`p${i}`} className="flex items-center gap-2">
                    {i > 0 && <span className="text-xl text-slate-400 font-bold">+</span>}
                    {renderCompoundWithCoeff(compound, currentEq.reactants.length + i)}
                  </div>
                ))}
              </div>
            </div>

            {/* Atom count table */}
            <div className="bg-white/[0.04] rounded-xl border border-white/10 p-4">
              <div className="text-xs text-slate-500 text-center mb-2 font-medium">Atom Count</div>
              {renderAtomCounts()}
            </div>

            {/* Practice mode explanation */}
            {isPractice && showResult && currentEq && (
              <div className="bg-white/[0.04] rounded-xl border border-white/10 p-4">
                <div className="text-xs text-slate-500 font-medium mb-2">Solution Explanation</div>
                <div className="text-sm text-white font-mono whitespace-pre-wrap">
                  {getSolutionExplanation(currentEq)}
                </div>
              </div>
            )}

            {/* Check button / Next button */}
            {!showResult && (
              <button onClick={checkAnswer}
                className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Check Balance
              </button>
            )}

            {/* Practice mode: Next button */}
            {isPractice && waitingForNext && (
              <button onClick={practiceNext}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-base transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ── GAME OVER ── */}
        {phase === "gameOver" && (
          <div className="text-center">
            <FlaskConical className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-white mb-2">Lab Complete!</h3>
            <div className="text-5xl font-bold text-cyan-400 mb-2">{score}</div>
            <div className="text-slate-400 space-y-1 mb-2">
              <p>{solved}/{totalRounds} equations balanced ({accuracy}%)</p>
              <p>Best streak: x{bestStreak}</p>
            </div>
            <p className="text-slate-400 mb-6 text-sm">Final difficulty: <span className="text-white font-bold">{adaptive.level.toFixed(1)}</span> {dl.emoji} {dl.label} &middot; {getGradeForLevel(adaptive.level).label}</p>
            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-sm font-medium mb-2 flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" /> New High Score!
              </p>
            )}
            <div className="mb-3">
              <ScoreSubmit game="equation-balancer" score={score} level={difficulty}
                stats={{ solved, totalRounds, accuracy: `${accuracy}%`, bestStreak, finalDifficulty: adaptive.level.toFixed(1) }} />
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
              <button onClick={() => startGame(false)}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
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
