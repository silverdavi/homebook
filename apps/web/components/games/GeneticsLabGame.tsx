"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Star, Dna, HelpCircle } from "lucide-react";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import {
  sfxCorrect, sfxWrong, sfxCombo, sfxGameOver, sfxAchievement,
  sfxCountdown, sfxCountdownGo, sfxClick, sfxStreakLost, sfxPerfect,
} from "@/lib/games/audio";
import Link from "next/link";
import { createAdaptiveState, adaptiveUpdate, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import { getGradeForLevel } from "@/lib/games/learning-guide";

// ── Types ──

type Allele = string; // single letter e.g. "B" or "b"
type Genotype = [Allele, Allele]; // e.g. ["B", "b"]
type GamePhase = "menu" | "countdown" | "playing" | "gameOver";
type GameMode = "fill" | "ratio" | "parents";

interface Trait {
  name: string;
  dominant: string; // letter
  recessive: string;
  dominantPhenotype: string;
  recessivePhenotype: string;
  dominantColor: string;
  recessiveColor: string;
  dominantEmoji: string;
  recessiveEmoji: string;
}

interface PunnettProblem {
  trait: Trait;
  parent1: Genotype;
  parent2: Genotype;
  mode: GameMode;
}

// ── Traits ──

const TRAITS: Trait[] = [
  { name: "Eye Color", dominant: "B", recessive: "b", dominantPhenotype: "Brown eyes", recessivePhenotype: "Blue eyes", dominantColor: "#92400e", recessiveColor: "#3b82f6", dominantEmoji: "👁️", recessiveEmoji: "👁️" },
  { name: "Height", dominant: "T", recessive: "t", dominantPhenotype: "Tall", recessivePhenotype: "Short", dominantColor: "#16a34a", recessiveColor: "#f59e0b", dominantEmoji: "🌳", recessiveEmoji: "🌿" },
  { name: "Pea Color", dominant: "G", recessive: "g", dominantPhenotype: "Green peas", recessivePhenotype: "Yellow peas", dominantColor: "#22c55e", recessiveColor: "#eab308", dominantEmoji: "🟢", recessiveEmoji: "🟡" },
  { name: "Flower Color", dominant: "R", recessive: "r", dominantPhenotype: "Red flowers", recessivePhenotype: "White flowers", dominantColor: "#ef4444", recessiveColor: "#e2e8f0", dominantEmoji: "🌹", recessiveEmoji: "🌼" },
  { name: "Seed Shape", dominant: "S", recessive: "s", dominantPhenotype: "Round seeds", recessivePhenotype: "Wrinkled seeds", dominantColor: "#a855f7", recessiveColor: "#6b7280", dominantEmoji: "⚪", recessiveEmoji: "🫘" },
];

// ── Genetics helpers ──

const GENOTYPE_COMBOS: Genotype[] = [
  ["D", "D"], ["D", "d"], ["d", "D"], ["d", "d"],
];

function genotypeLabel(g: Genotype, trait: Trait): string {
  return g.map((a) => (a === "D" || a === a.toUpperCase() ? trait.dominant : trait.recessive)).join("");
}

function isDominantPhenotype(g: Genotype): boolean {
  return g[0] === "D" || g[1] === "D";
}

function makePunnettGrid(p1: Genotype, p2: Genotype): Genotype[][] {
  return p1.map((a1) => p2.map((a2) => [a1, a2] as Genotype));
}

function computeRatio(p1: Genotype, p2: Genotype): { dominant: number; recessive: number } {
  const grid = makePunnettGrid(p1, p2).flat();
  let dom = 0;
  let rec = 0;
  for (const g of grid) {
    if (isDominantPhenotype(g)) dom++;
    else rec++;
  }
  return { dominant: dom, recessive: rec };
}

function ratioString(dom: number, rec: number): string {
  if (rec === 0) return "4:0";
  if (dom === 0) return "0:4";
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(dom, rec);
  return `${dom / g}:${rec / g}`;
}

function normalizeGenotype(g: Genotype): Genotype {
  // Dominant allele first
  if (g[0] === "d" && g[1] === "D") return ["D", "d"];
  return g;
}

function generateProblem(mode: GameMode): PunnettProblem {
  const trait = TRAITS[Math.floor(Math.random() * TRAITS.length)];
  const possibleGenotypes: Genotype[] = [["D", "D"], ["D", "d"], ["d", "d"]];

  if (mode === "parents") {
    // Pick a target ratio and find parents that produce it
    const p1 = possibleGenotypes[Math.floor(Math.random() * possibleGenotypes.length)];
    const p2 = possibleGenotypes[Math.floor(Math.random() * possibleGenotypes.length)];
    return { trait, parent1: p1, parent2: p2, mode };
  }

  const p1 = possibleGenotypes[Math.floor(Math.random() * possibleGenotypes.length)];
  const p2 = possibleGenotypes[Math.floor(Math.random() * possibleGenotypes.length)];
  return { trait, parent1: p1, parent2: p2, mode };
}

// ── Constants ──

const GENETICS_TIPS = [
  "Dominant alleles (capital letters) mask recessive alleles (lowercase).",
  "Homozygous = both alleles same (BB or bb). Heterozygous = different (Bb).",
  "A Punnett square shows all possible offspring combinations.",
  "Aa × Aa → 1 AA : 2 Aa : 1 aa (3:1 phenotype ratio).",
  "Two heterozygous parents (Bb × Bb) give a 3:1 ratio of dominant to recessive.",
  "If both parents are homozygous dominant (BB × BB), all offspring show dominant trait.",
  "Only homozygous recessive (bb) individuals show the recessive phenotype.",
  "Gregor Mendel discovered these laws using pea plants in the 1860s.",
];

const COUNTDOWN_SECS = 3;

const RATIO_OPTIONS = ["4:0", "3:1", "1:1", "1:3", "0:4"];

// ── Adaptive → genetics modes ──

function getAdaptiveGeneticsModes(level: number): GameMode[] {
  if (level <= 10) return ["fill"];
  if (level <= 20) return ["fill", "ratio"];
  return ["fill", "ratio", "parents"];
}

export function GeneticsLabGame() {
  useGameMusic();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [solved, setSolved] = useState(0);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("geneticsLab_highScore"));
  const [achievementQueue, setAchievementQueue] = useState<Array<{ name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [showHints, setShowHints] = useState(true);

  // Adaptive difficulty (starting at 5 — assumes some biology knowledge)
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(5));

  // Problem state
  const [problem, setProblem] = useState<PunnettProblem | null>(null);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);
  const roundStartRef = useRef(0);

  // Fill mode: user fills 4 cells
  const [gridAnswers, setGridAnswers] = useState<(Genotype | null)[]>([null, null, null, null]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  // Ratio mode: user picks ratio
  const [selectedRatio, setSelectedRatio] = useState<string | null>(null);

  // Parents mode: user picks parent genotypes
  const [selectedParent1, setSelectedParent1] = useState<Genotype | null>(null);
  const [selectedParent2, setSelectedParent2] = useState<Genotype | null>(null);

  // Settings
  const [gameMode, setGameMode] = useState<GameMode>("fill");
  const [totalRounds, setTotalRounds] = useState(10);

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

  // ── Game over ──
  useEffect(() => {
    if (phase !== "gameOver") return;
    const acc = totalRounds > 0 ? solved / totalRounds : 0;
    if (acc >= 1.0) sfxPerfect();
    else sfxGameOver();
    if (score > highScore) {
      setLocalHighScore("geneticsLab_highScore", score);
      setHighScore(score);
    }
    trackGamePlayed("genetics-lab", score);
    const profile = getProfile();
    const newOnes = checkAchievements(
      { gameId: "genetics-lab", score, solved, bestStreak, accuracy: totalRounds > 0 ? Math.round((solved / totalRounds) * 100) : 0 },
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

  const pickAdaptiveMode = useCallback((): GameMode => {
    const modes = getAdaptiveGeneticsModes(adaptive.level);
    return modes[Math.floor(Math.random() * modes.length)];
  }, [adaptive.level]);

  const loadNextProblem = useCallback(() => {
    const mode = pickAdaptiveMode();
    setGameMode(mode);
    const prob = generateProblem(mode);
    setProblem(prob);
    setGridAnswers([null, null, null, null]);
    setSelectedCell(null);
    setSelectedRatio(null);
    setSelectedParent1(null);
    setSelectedParent2(null);
    setShowResult(null);
    roundStartRef.current = Date.now();
    setTipIdx(Math.floor(Math.random() * GENETICS_TIPS.length));
  }, [pickAdaptiveMode]);

  const endGame = useCallback(() => {
    setPhase("gameOver");
  }, []);

  const handleCorrectAnswer = () => {
    const newStreak = streak + 1;
    const { mult } = getMultiplierFromStreak(newStreak);
    const elapsed = (Date.now() - roundStartRef.current) / 1000;
    const timeBonus = Math.max(0, Math.round(30 - elapsed));
    const points = Math.round((25 + timeBonus) * mult);

    setScore((s) => s + points);
    setStreak(newStreak);
    setBestStreak((b) => Math.max(b, newStreak));
    setSolved((s) => s + 1);
    setFlash("correct");
    setShowResult("correct");
    if (newStreak > 1 && newStreak % 5 === 0) sfxCombo(newStreak);
    else sfxCorrect();
    // Adaptive: fast = answered in < 50% of 30s (15s)
    setAdaptive(prev => adaptiveUpdate(prev, true, elapsed < 15));
  };

  const handleWrongAnswer = () => {
    if (streak > 0) sfxStreakLost();
    sfxWrong();
    setStreak(0);
    setFlash("wrong");
    setShowResult("wrong");
    setAdaptive(prev => adaptiveUpdate(prev, false, false));
  };

  const advanceRound = () => {
    setTimeout(() => {
      setFlash(null);
      setShowResult(null);
      if (round + 1 >= totalRounds) {
        endGame();
      } else {
        setRound((r) => r + 1);
        loadNextProblem();
      }
    }, 1800);
  };

  // ── Fill mode: place allele in cell ──
  const handleCellClick = (cellIdx: number) => {
    if (showResult || !problem) return;
    sfxClick();
    setSelectedCell(cellIdx);
  };

  const handleAllelePlace = (allele1: Allele, allele2: Allele) => {
    if (selectedCell === null || showResult) return;
    sfxClick();
    const newAnswers = [...gridAnswers];
    newAnswers[selectedCell] = [allele1, allele2];
    setGridAnswers(newAnswers);
    setSelectedCell(null);
  };

  const checkFillAnswer = () => {
    if (!problem || gridAnswers.some((g) => g === null)) return;
    const correctGrid = makePunnettGrid(problem.parent1, problem.parent2);
    const correctFlat = correctGrid.flat();
    let allCorrect = true;
    for (let i = 0; i < 4; i++) {
      const answer = normalizeGenotype(gridAnswers[i]!);
      const correct = normalizeGenotype(correctFlat[i]);
      if (answer[0] !== correct[0] || answer[1] !== correct[1]) {
        allCorrect = false;
        break;
      }
    }
    if (allCorrect) handleCorrectAnswer();
    else handleWrongAnswer();
    advanceRound();
  };

  // ── Ratio mode ──
  const checkRatioAnswer = () => {
    if (!problem || !selectedRatio) return;
    const { dominant, recessive } = computeRatio(problem.parent1, problem.parent2);
    const correctRatio = ratioString(dominant, recessive);
    if (selectedRatio === correctRatio) handleCorrectAnswer();
    else handleWrongAnswer();
    advanceRound();
  };

  // ── Parents mode ──
  const checkParentsAnswer = () => {
    if (!problem || !selectedParent1 || !selectedParent2) return;
    // Check if selected parents produce the same ratio as the actual parents
    const targetRatio = computeRatio(problem.parent1, problem.parent2);
    const answerRatio = computeRatio(selectedParent1, selectedParent2);
    // Also check reverse order
    const answerRatioReverse = computeRatio(selectedParent2, selectedParent1);
    if (
      (answerRatio.dominant === targetRatio.dominant && answerRatio.recessive === targetRatio.recessive) ||
      (answerRatioReverse.dominant === targetRatio.dominant && answerRatioReverse.recessive === targetRatio.recessive)
    ) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer();
    }
    advanceRound();
  };

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setRound(0);
    setSolved(0);
    setAdaptive(createAdaptiveState(5));
    setCountdown(COUNTDOWN_SECS);
    setAchievementQueue([]);
    setShowAchievementIndex(0);
    setPhase("countdown");
  };

  // ── Render helpers ──

  const formatGenotype = (g: Genotype, trait: Trait) => {
    return g.map((a) => (a === "D" ? trait.dominant : trait.recessive)).join("");
  };

  const phenotypePreview = (g: Genotype, trait: Trait) => {
    const dom = isDominantPhenotype(g);
    return (
      <span title={dom ? trait.dominantPhenotype : trait.recessivePhenotype}>
        {dom ? trait.dominantEmoji : trait.recessiveEmoji}
      </span>
    );
  };

  const accuracy = totalRounds > 0 && phase === "gameOver" ? Math.round((solved / totalRounds) * 100) : 0;

  // Available alleles for fill mode
  const getAllelePairs = (): [Allele, Allele][] => {
    if (!problem) return [];
    const pairs: [Allele, Allele][] = [
      ["D", "D"],
      ["D", "d"],
      ["d", "d"],
    ];
    return pairs;
  };

  const genotypeOptions: Genotype[] = [["D", "D"], ["D", "d"], ["d", "d"]];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Genetics Lab</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* ── MENU ── */}
        {phase === "menu" && (
          <div className="text-center w-full">
            <div className="text-6xl mb-4">🧬</div>
            <h2 className="text-3xl font-bold text-white mb-2">Genetics Lab</h2>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Master Mendelian genetics with interactive Punnett squares!
            </p>

            {/* Mode selector */}
            <div className="max-w-xs mx-auto mb-4 space-y-1.5">
              <div className="text-xs text-slate-500 text-left mb-1">Mode</div>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  ["fill", "Fill Square"],
                  ["ratio", "Predict Ratio"],
                  ["parents", "Find Parents"],
                ] as [GameMode, string][]).map(([mode, label]) => (
                  <button key={mode} onClick={() => setGameMode(mode)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${gameMode === mode ? "bg-purple-500/25 border border-purple-400/50 text-purple-400" : "bg-white/5 border border-white/10 text-slate-600"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rounds slider */}
            <div className="max-w-xs mx-auto mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Rounds</span>
                <span className="text-xs font-bold text-purple-400 tabular-nums">{totalRounds}</span>
              </div>
              <input type="range" min={5} max={15} step={1} value={totalRounds}
                onChange={(e) => setTotalRounds(Number(e.target.value))}
                className="w-full accent-purple-500" />
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>5 quick</span><span>15 challenge</span>
              </div>
            </div>

            {/* Show hints toggle */}
            <div className="max-w-xs mx-auto mb-4">
              <button onClick={() => setShowHints(!showHints)}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${showHints ? "bg-purple-500/25 border border-purple-400/50 text-purple-400" : "bg-white/5 border border-white/10 text-slate-500"}`}>
                <HelpCircle className="w-4 h-4 inline mr-1" />
                Dominance Hints {showHints ? "ON" : "OFF"}
              </button>
            </div>

            <button onClick={startGame}
              className="px-10 py-4 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/30">
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
            <div className="text-8xl font-bold text-purple-400 animate-pulse">
              {countdown || "GO!"}
            </div>
          </div>
        )}

        {/* ── PLAYING ── */}
        {phase === "playing" && problem && (
          <div className="w-full space-y-4">
            {/* Tip */}
            <div className="text-center text-[11px] text-slate-500 italic px-4">
              💡 {GENETICS_TIPS[tipIdx % GENETICS_TIPS.length]}
            </div>

            {/* HUD */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{round + 1}/{totalRounds}</span>
              <div className="flex items-center gap-2">
                <StreakBadge streak={streak} />
                {/* Adaptive difficulty badge */}
                {(() => {
                  const dl = getDifficultyLabel(adaptive.level);
                  const gradeInfo = getGradeForLevel(adaptive.level);
                  return (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border" style={{ color: dl.color, borderColor: dl.color + "40", backgroundColor: dl.color + "15" }}>
                        {dl.label} (Lvl {Math.round(adaptive.level)})
                      </span>
                      <span className="text-[10px] text-slate-500">{gradeInfo.label}</span>
                    </div>
                  );
                })()}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white tabular-nums">{score}</div>
                <div className="text-xs text-slate-400">{solved} correct</div>
              </div>
            </div>

            {/* Flash overlay */}
            {flash && (
              <div className={`fixed inset-0 pointer-events-none z-50 ${flash === "correct" ? "bg-green-500/10" : "bg-red-500/15"}`} />
            )}

            {/* Trait info */}
            <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl border border-white/10 p-3 text-center">
              <div className="text-lg font-bold text-white mb-1">{problem.trait.name}</div>
              {showHints && (
                <div className="flex justify-center gap-4 text-sm">
                  <span>
                    <span className="font-bold" style={{ color: problem.trait.dominantColor }}>{problem.trait.dominant}</span>
                    {" "}= {problem.trait.dominantPhenotype} {problem.trait.dominantEmoji}
                  </span>
                  <span>
                    <span className="font-bold" style={{ color: problem.trait.recessiveColor }}>{problem.trait.recessive}</span>
                    {" "}= {problem.trait.recessivePhenotype} {problem.trait.recessiveEmoji}
                  </span>
                </div>
              )}
            </div>

            {/* Result overlay */}
            {showResult && (
              <div className={`text-center text-lg font-bold ${showResult === "correct" ? "text-green-400" : "text-red-400"}`}>
                {showResult === "correct" ? "✓ Correct!" : "✗ Not quite"}
                {showResult === "wrong" && gameMode === "fill" && (
                  <div className="text-xs text-slate-400 mt-1">
                    Correct grid: {makePunnettGrid(problem.parent1, problem.parent2).flat().map((g) => formatGenotype(normalizeGenotype(g), problem.trait)).join(", ")}
                  </div>
                )}
                {showResult === "wrong" && gameMode === "ratio" && (
                  <div className="text-xs text-slate-400 mt-1">
                    Correct ratio: {ratioString(computeRatio(problem.parent1, problem.parent2).dominant, computeRatio(problem.parent1, problem.parent2).recessive)} (dominant:recessive)
                  </div>
                )}
              </div>
            )}

            {/* ── Fill Square Mode ── */}
            {gameMode === "fill" && (
              <div className="space-y-3">
                {/* Parents display */}
                <div className="text-center text-white">
                  <span className="font-bold text-purple-400">{formatGenotype(problem.parent1, problem.trait)}</span>
                  <span className="mx-2 text-slate-400">×</span>
                  <span className="font-bold text-purple-400">{formatGenotype(problem.parent2, problem.trait)}</span>
                </div>

                {/* Punnett Square Grid */}
                <div className="mx-auto w-fit">
                  <div className="grid grid-cols-3 gap-1">
                    {/* Header row */}
                    <div className="w-20 h-12" />
                    {problem.parent2.map((a, i) => (
                      <div key={`ph${i}`} className="w-20 h-12 flex items-center justify-center bg-purple-500/20 rounded-lg text-purple-300 font-bold text-lg">
                        {a === "D" ? problem.trait.dominant : problem.trait.recessive}
                      </div>
                    ))}

                    {/* Grid rows */}
                    {problem.parent1.map((a1, row) => (
                      <div key={`row${row}`} className="contents">
                        <div className="w-20 h-20 flex items-center justify-center bg-purple-500/20 rounded-lg text-purple-300 font-bold text-lg">
                          {a1 === "D" ? problem.trait.dominant : problem.trait.recessive}
                        </div>
                        {problem.parent2.map((_, col) => {
                          const cellIdx = row * 2 + col;
                          const answer = gridAnswers[cellIdx];
                          const isSelected = selectedCell === cellIdx;
                          return (
                            <button key={`cell${cellIdx}`}
                              onClick={() => handleCellClick(cellIdx)}
                              className={`w-20 h-20 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                                isSelected ? "border-purple-400 bg-purple-500/20 scale-105" :
                                answer ? "border-white/20 bg-white/10" :
                                "border-white/10 bg-white/5 hover:border-purple-400/50"
                              }`}>
                              {answer ? (
                                <>
                                  <span className="font-bold text-white text-lg">{formatGenotype(normalizeGenotype(answer), problem.trait)}</span>
                                  <span className="text-sm">{phenotypePreview(answer, problem.trait)}</span>
                                </>
                              ) : (
                                <span className="text-slate-600 text-2xl">?</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Allele selector (when a cell is selected) */}
                {selectedCell !== null && !showResult && (
                  <div className="flex justify-center gap-2">
                    {getAllelePairs().map(([a1, a2], i) => (
                      <button key={i} onClick={() => handleAllelePlace(a1, a2)}
                        className="px-4 py-2 bg-white/10 hover:bg-purple-500/25 border border-white/10 hover:border-purple-400/40 rounded-lg text-white font-bold transition-all active:scale-95">
                        {a1 === "D" ? problem.trait.dominant : problem.trait.recessive}
                        {a2 === "D" ? problem.trait.dominant : problem.trait.recessive}
                      </button>
                    ))}
                  </div>
                )}

                {/* Check button */}
                {!showResult && gridAnswers.every((g) => g !== null) && (
                  <button onClick={checkFillAnswer}
                    className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95">
                    Check Answer
                  </button>
                )}
              </div>
            )}

            {/* ── Ratio Mode ── */}
            {gameMode === "ratio" && (
              <div className="space-y-3">
                {/* Parents */}
                <div className="text-center text-white">
                  <span className="font-bold text-purple-400">{formatGenotype(problem.parent1, problem.trait)}</span>
                  <span className="mx-2 text-slate-400">×</span>
                  <span className="font-bold text-purple-400">{formatGenotype(problem.parent2, problem.trait)}</span>
                </div>

                <div className="text-center text-sm text-slate-400">
                  What is the phenotype ratio? (dominant : recessive)
                </div>

                {/* Ratio options */}
                <div className="grid grid-cols-5 gap-2">
                  {RATIO_OPTIONS.map((ratio) => (
                    <button key={ratio} onClick={() => { sfxClick(); setSelectedRatio(ratio); }}
                      className={`py-3 rounded-lg text-sm font-bold transition-all ${selectedRatio === ratio ? "bg-purple-500/30 border-2 border-purple-400 text-purple-300" : "bg-white/10 border border-white/10 text-white hover:bg-white/15"}`}>
                      {ratio}
                    </button>
                  ))}
                </div>

                {/* Check */}
                {!showResult && selectedRatio && (
                  <button onClick={checkRatioAnswer}
                    className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95">
                    Check Answer
                  </button>
                )}
              </div>
            )}

            {/* ── Parents Mode ── */}
            {gameMode === "parents" && (
              <div className="space-y-3">
                {/* Show target ratio */}
                <div className="text-center">
                  <div className="text-sm text-slate-400 mb-1">Find parents that produce this ratio:</div>
                  <div className="text-2xl font-bold text-white">
                    {ratioString(computeRatio(problem.parent1, problem.parent2).dominant, computeRatio(problem.parent1, problem.parent2).recessive)}
                  </div>
                  <div className="text-xs text-slate-500">(dominant : recessive)</div>
                </div>

                {/* Parent 1 selection */}
                <div>
                  <div className="text-xs text-slate-400 mb-1.5">Parent 1</div>
                  <div className="flex gap-2 justify-center">
                    {genotypeOptions.map((g, i) => {
                      const label = formatGenotype(g, problem.trait);
                      const selected = selectedParent1 && formatGenotype(selectedParent1, problem.trait) === label;
                      return (
                        <button key={i} onClick={() => { sfxClick(); setSelectedParent1(g); }}
                          className={`px-4 py-2 rounded-lg font-bold transition-all ${selected ? "bg-purple-500/30 border-2 border-purple-400 text-purple-300" : "bg-white/10 border border-white/10 text-white hover:bg-white/15"}`}>
                          {label} {phenotypePreview(g, problem.trait)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Parent 2 selection */}
                <div>
                  <div className="text-xs text-slate-400 mb-1.5">Parent 2</div>
                  <div className="flex gap-2 justify-center">
                    {genotypeOptions.map((g, i) => {
                      const label = formatGenotype(g, problem.trait);
                      const selected = selectedParent2 && formatGenotype(selectedParent2, problem.trait) === label;
                      return (
                        <button key={i} onClick={() => { sfxClick(); setSelectedParent2(g); }}
                          className={`px-4 py-2 rounded-lg font-bold transition-all ${selected ? "bg-purple-500/30 border-2 border-purple-400 text-purple-300" : "bg-white/10 border border-white/10 text-white hover:bg-white/15"}`}>
                          {label} {phenotypePreview(g, problem.trait)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Check */}
                {!showResult && selectedParent1 && selectedParent2 && (
                  <button onClick={checkParentsAnswer}
                    className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95">
                    Check Answer
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── GAME OVER ── */}
        {phase === "gameOver" && (
          <div className="text-center">
            <Dna className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-white mb-2">Lab Complete!</h3>
            <div className="text-5xl font-bold text-purple-400 mb-2">{score}</div>
            {/* Final adaptive level */}
            {(() => {
              const dl = getDifficultyLabel(adaptive.level);
              const gradeInfo = getGradeForLevel(adaptive.level);
              return (
                <div className="text-sm text-slate-400 mb-2">
                  Final difficulty:{" "}
                  <span className="font-bold" style={{ color: dl.color }}>{dl.label} (Lvl {Math.round(adaptive.level)})</span>
                  {" — "}<span>{gradeInfo.label}</span>
                </div>
              );
            })()}
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
              <ScoreSubmit game="genetics-lab" score={score} level={Math.round(adaptive.level)}
                stats={{ solved, totalRounds, accuracy: `${accuracy}%`, bestStreak, finalLevel: adaptive.level.toFixed(1) }} />
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
                className="px-6 py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
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
