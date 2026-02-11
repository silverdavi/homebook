"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Clock, Search } from "lucide-react";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { AchievementToast } from "@/components/games/AchievementToast";
import {
  sfxCorrect,
  sfxWrong,
  sfxClick,
  sfxLevelUp,
  isSfxEnabled,
} from "@/lib/games/audio";
import {
  checkAchievements,
  type MedalTier,
} from "@/lib/games/achievements";
import {
  trackGamePlayed,
  getProfile,
  getLocalHighScore,
  setLocalHighScore,
} from "@/lib/games/use-scores";
import { useEinkMode, EinkBanner, EinkWrapper } from "@/lib/games/eink-utils";
import { createAdaptiveState, adaptiveUpdate, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import { getGradeForLevel } from "@/lib/games/learning-guide";
import { WORD_SEARCH_WORDS } from "@/lib/games/data/word-data";
import { WORD_SEARCH_WORDS_2 } from "@/lib/games/data/word-data-2";

// ─── Types ───────────────────────────────────────────────────────────

type Phase = "menu" | "countdown" | "playing" | "complete";
type Category = "science" | "math" | "history" | "geography" | "mixed";
type GridSize = 10 | 12 | 15;

interface PlacedWord {
  word: string;
  startRow: number;
  startCol: number;
  dRow: number;
  dCol: number;
  found: boolean;
}

// ─── Word Bank (from expanded data file) ─────────────────────────────

// Map extra categories to the four game categories
const WS_CATEGORY_MAP: Record<string, string> = {
  science: "science",
  math: "math",
  history: "history",
  geography: "geography",
  biology: "science",
  chemistry: "science",
  technology: "science",
  literature: "history",
  music: "history",
  art: "history",
};

const WORD_BANK: Record<string, string[]> = [...WORD_SEARCH_WORDS, ...WORD_SEARCH_WORDS_2].reduce(
  (acc, w) => {
    const mapped = WS_CATEGORY_MAP[w.category] || "science";
    if (!acc[mapped]) acc[mapped] = [];
    acc[mapped].push(w.word);
    return acc;
  },
  {} as Record<string, string[]>,
);

// ─── Directions (forward only) ───────────────────────────────────────

const DIRECTIONS = [
  { dRow: 0, dCol: 1 },   // right
  { dRow: 1, dCol: 0 },   // down
  { dRow: 1, dCol: 1 },   // diagonal down-right
  { dRow: -1, dCol: 1 },  // diagonal up-right
];

// ─── Grid Generation ─────────────────────────────────────────────────

function generateGrid(
  size: GridSize,
  category: Category,
  wordCount: number,
): { grid: string[][]; placed: PlacedWord[] } {
  const grid: string[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ""),
  );

  // Pick words
  let pool: string[];
  if (category === "mixed") {
    pool = Object.values(WORD_BANK).flat();
  } else {
    pool = [...WORD_BANK[category]];
  }
  // Filter words that fit
  const candidates = pool.filter((w) => w.length <= size);
  // Shuffle
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const placed: PlacedWord[] = [];
  const targetCount = Math.min(wordCount, candidates.length);

  for (const word of candidates) {
    if (placed.length >= targetCount) break;
    if (tryPlaceWord(grid, word, size, placed)) {
      // word placed
    }
  }

  // Fill empty cells with random letters
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) {
        grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
  }

  return { grid, placed };
}

function tryPlaceWord(
  grid: string[][],
  word: string,
  size: number,
  placed: PlacedWord[],
): boolean {
  // Shuffle directions
  const dirs = [...DIRECTIONS];
  for (let i = dirs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
  }

  for (const { dRow, dCol } of dirs) {
    // Determine valid starting positions
    const positions: [number, number][] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const endR = r + dRow * (word.length - 1);
        const endC = c + dCol * (word.length - 1);
        if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue;
        // Check if fits
        let fits = true;
        for (let k = 0; k < word.length; k++) {
          const cr = r + dRow * k;
          const cc = c + dCol * k;
          if (grid[cr][cc] !== "" && grid[cr][cc] !== word[k]) {
            fits = false;
            break;
          }
        }
        if (fits) positions.push([r, c]);
      }
    }

    if (positions.length === 0) continue;

    // Random position
    const [startRow, startCol] =
      positions[Math.floor(Math.random() * positions.length)];

    // Place
    for (let k = 0; k < word.length; k++) {
      grid[startRow + dRow * k][startCol + dCol * k] = word[k];
    }

    placed.push({
      word,
      startRow,
      startCol,
      dRow,
      dCol,
      found: false,
    });
    return true;
  }

  return false;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Tips ─────────────────────────────────────────────────────────────

const TIPS = [
  "Scan systematically — row by row, then column by column",
  "Diagonal words are often the hardest to spot",
  "Look for uncommon letter combinations to find word starts",
  "Start with the longest words — they're easier to find",
  "Check all four directions: right, down, and both diagonals",
  "Focus on the first and last letters of each word",
  "Uncommon letters like Q, X, Z narrow down possibilities fast",
  "Cross-referencing found letters can reveal nearby words",
  "Take breaks if you're stuck — fresh eyes find words faster",
  "Building vocabulary improves word recognition speed",
];

// ─── Component ───────────────────────────────────────────────────────

export function WordSearchGame() {
  const [einkMode, toggleEink] = useEinkMode();
  const [phase, setPhase] = useState<Phase>("menu");
  const [category, setCategory] = useState<Category>("science");
  const [gridSize, setGridSize] = useState<GridSize>(10);
  const [wordCount, setWordCount] = useState(8);

  // Game state
  const [grid, setGrid] = useState<string[][]>([]);
  const [placedWords, setPlacedWords] = useState<PlacedWord[]>([]);
  const [firstClick, setFirstClick] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [tipIndex, setTipIndex] = useState(0);

  const [achievementQueue, setAchievementQueue] = useState<
    { name: string; tier: MedalTier }[]
  >([]);
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));
  const [adjustAnim, setAdjustAnim] = useState<"up" | "down" | null>(null);
  const wordFoundTimeRef = useRef(Date.now());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useGameMusic();

  useEffect(() => {
    try {
      setHighScore(getLocalHighScore("word-search") ?? 0);
    } catch {}
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, [phase]);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => {
      setCountdown((c) => {
        if (c <= 1) { setPhase("playing"); return 3; }
        return c - 1;
      });
    }, 800);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Tip rotation
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 8000);
    return () => clearInterval(t);
  }, [phase]);

  // Adjust animation when difficulty changes
  useEffect(() => {
    if (adaptive.lastAdjustTime === 0) return;
    setAdjustAnim(adaptive.lastAdjust);
    const t = setTimeout(() => setAdjustAnim(null), 1500);
    return () => clearTimeout(t);
  }, [adaptive.lastAdjustTime, adaptive.lastAdjust]);

  const startGame = useCallback(() => {
    const result = generateGrid(gridSize, category, wordCount);
    setGrid(result.grid);
    setPlacedWords(result.placed);
    setFirstClick(null);
    setFoundCells(new Set());
    setElapsed(0);
    setScore(0);
    setCountdown(3);
    setPhase("countdown");
    wordFoundTimeRef.current = Date.now();
    if (!einkMode && isSfxEnabled()) sfxClick();
  }, [gridSize, category, wordCount, einkMode]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (phase !== "playing") return;

      if (!firstClick) {
        // First click — select start
        setFirstClick({ row, col });
        if (!einkMode && isSfxEnabled()) sfxClick();
        return;
      }

      // Second click — check if matches a word
      const startR = firstClick.row;
      const startC = firstClick.col;

      let matched = false;
      for (let i = 0; i < placedWords.length; i++) {
        const pw = placedWords[i];
        if (pw.found) continue;

        const endR = pw.startRow + pw.dRow * (pw.word.length - 1);
        const endC = pw.startCol + pw.dCol * (pw.word.length - 1);

        if (
          (startR === pw.startRow && startC === pw.startCol && row === endR && col === endC) ||
          (startR === endR && startC === endC && row === pw.startRow && col === pw.startCol)
        ) {
          // Found!
          const newPlaced = [...placedWords];
          newPlaced[i] = { ...pw, found: true };
          setPlacedWords(newPlaced);

          // Mark cells
          const newFound = new Set(foundCells);
          for (let k = 0; k < pw.word.length; k++) {
            newFound.add(`${pw.startRow + pw.dRow * k},${pw.startCol + pw.dCol * k}`);
          }
          setFoundCells(newFound);

          if (!einkMode && isSfxEnabled()) sfxCorrect();
          matched = true;

          // Adaptive: fast if found within 30 seconds
          const timeSinceLast = (Date.now() - wordFoundTimeRef.current) / 1000;
          const fast = timeSinceLast < 30;
          setAdaptive(prev => adaptiveUpdate(prev, true, fast));
          wordFoundTimeRef.current = Date.now();

          const wordsFound = newPlaced.filter((w) => w.found).length;
          const basePoints = pw.word.length * 10;
          setScore((s) => s + basePoints);

          // Check completion
          if (wordsFound === newPlaced.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            const timeBonus = Math.max(0, 300 - elapsed) * 3;
            const finalScore =
              newPlaced.reduce((sum, w) => sum + w.word.length * 10, 0) +
              timeBonus;
            setScore(finalScore);
            setPhase("complete");

            if (!einkMode && isSfxEnabled()) sfxLevelUp();

            try {
              const prev = getLocalHighScore("word-search") ?? 0;
              if (finalScore > prev) {
                setLocalHighScore("word-search", finalScore);
                setHighScore(finalScore);
              }
            } catch {}

            try {
              trackGamePlayed("word-search", finalScore);
              const profile = getProfile();
              const medals = checkAchievements(
                {
                  gameId: "word-search",
                  score: finalScore,
                  wordsBuilt: newPlaced.length,
                  timeSeconds: elapsed,
                },
                profile.totalGamesPlayed,
                profile.gamesPlayedByGameId,
              );
              if (medals.length > 0) {
                setAchievementQueue(
                  medals.map((m) => ({ name: m.name, tier: m.tier })),
                );
              }
            } catch {}
          }
          break;
        }
      }

      if (!matched && !einkMode && isSfxEnabled()) {
        sfxWrong();
      }

      setFirstClick(null);
    },
    [phase, firstClick, placedWords, foundCells, einkMode, elapsed],
  );

  const foundCount = placedWords.filter((w) => w.found).length;
  const diffLabel = getDifficultyLabel(adaptive.level);
  const gradeInfo = getGradeForLevel(adaptive.level);

  const categories: { key: Category; label: string }[] = [
    { key: "science", label: "Science" },
    { key: "math", label: "Math" },
    { key: "history", label: "History" },
    { key: "geography", label: "Geography" },
    { key: "mixed", label: "Mixed" },
  ];

  // ─── E-ink Render ───────────────────────────────────────────────────
  if (einkMode) {
    return (
      <EinkWrapper einkMode={true}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "8px 12px" }}>
          <EinkBanner einkMode={true} onToggle={toggleEink} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "2px solid #000",
            }}
          >
            <Link href="/games" style={{ color: "#000", textDecoration: "none", fontSize: 18, fontWeight: "bold" }}>
              ← Back
            </Link>
            <span style={{ fontSize: 22, fontWeight: "bold" }}>Word Search</span>
            <span style={{ width: 60 }} />
          </div>

          {phase === "menu" && (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <h2 style={{ fontSize: 28, marginBottom: 8 }}>Word Search</h2>
              <p style={{ fontSize: 18, marginBottom: 24 }}>
                Find hidden words by tapping the first and last letters.
              </p>

              {/* Category */}
              <p style={{ fontWeight: "bold", marginBottom: 8 }}>Category:</p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginBottom: 16 }}>
                {categories.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    style={{
                      border: "2px solid #000",
                      padding: "8px 16px",
                      fontSize: 16,
                      background: category === c.key ? "#000" : "#fff",
                      color: category === c.key ? "#fff" : "#000",
                      cursor: "pointer",
                      minHeight: 44,
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Grid size */}
              <p style={{ fontWeight: "bold", marginBottom: 8 }}>Grid Size:</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
                {([10, 12, 15] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setGridSize(s)}
                    style={{
                      border: "2px solid #000",
                      padding: "8px 16px",
                      fontSize: 16,
                      background: gridSize === s ? "#000" : "#fff",
                      color: gridSize === s ? "#fff" : "#000",
                      cursor: "pointer",
                      minHeight: 44,
                    }}
                  >
                    {s}×{s}
                  </button>
                ))}
              </div>

              {/* Word count */}
              <p style={{ fontWeight: "bold", marginBottom: 8 }}>
                Words: {wordCount}
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24 }}>
                {[5, 8, 10, 12].map((n) => (
                  <button
                    key={n}
                    onClick={() => setWordCount(n)}
                    style={{
                      border: "2px solid #000",
                      padding: "8px 16px",
                      fontSize: 16,
                      background: wordCount === n ? "#000" : "#fff",
                      color: wordCount === n ? "#fff" : "#000",
                      cursor: "pointer",
                      minHeight: 44,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                onClick={startGame}
                style={{
                  display: "block",
                  width: "100%",
                  border: "2px solid #000",
                  padding: "14px",
                  fontSize: 22,
                  fontWeight: "bold",
                  background: "#fff",
                  color: "#000",
                  cursor: "pointer",
                  minHeight: 60,
                }}
              >
                Start Game
              </button>
            </div>
          )}

          {phase === "countdown" && (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <div style={{ fontSize: 72, fontWeight: "bold", color: "#000" }}>
                {countdown}
              </div>
            </div>
          )}

          {phase === "playing" && (
            <div style={{ padding: "8px 0" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 16,
                  padding: "4px 0",
                  borderBottom: "1px solid #000",
                  marginBottom: 8,
                }}
              >
                <span>
                  Found: {foundCount}/{placedWords.length}
                </span>
                <span>Time: {formatTime(elapsed)}</span>
              </div>

              {firstClick && (
                <div
                  style={{
                    border: "2px solid #000",
                    padding: "6px 10px",
                    marginBottom: 8,
                    fontSize: 16,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Selected: Row {firstClick.row + 1}, Col {firstClick.col + 1} — Now tap the last letter
                </div>
              )}

              {/* Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  border: "3px solid #000",
                  maxWidth: gridSize <= 10 ? 500 : gridSize <= 12 ? 600 : 700,
                  margin: "0 auto",
                }}
              >
                {grid.flatMap((row, r) =>
                  row.map((letter, c) => {
                    const isFound = foundCells.has(`${r},${c}`);
                    const isFirstClickCell =
                      firstClick?.row === r && firstClick?.col === c;
                    return (
                      <div
                        key={`${r},${c}`}
                        onClick={() => handleCellClick(r, c)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          aspectRatio: "1",
                          fontSize: gridSize <= 10 ? 22 : gridSize <= 12 ? 18 : 15,
                          fontWeight: isFound ? "bold" : "normal",
                          textDecoration: isFound ? "underline" : "none",
                          border: isFirstClickCell
                            ? "4px solid #000"
                            : "1px solid #999",
                          background: isFirstClickCell ? "#ddd" : "#fff",
                          color: "#000",
                          cursor: "pointer",
                          minHeight: 40,
                        }}
                      >
                        {letter}
                      </div>
                    );
                  }),
                )}
              </div>

              {/* Word list */}
              <div style={{ marginTop: 12, columns: 2, columnGap: 16 }}>
                <p style={{ fontWeight: "bold", marginBottom: 4, fontSize: 16, columnSpan: "all" }}>
                  Words to find:
                </p>
                {placedWords.map((pw) => (
                  <div
                    key={pw.word}
                    style={{
                      fontSize: 16,
                      textDecoration: pw.found ? "line-through" : "none",
                      fontWeight: pw.found ? "bold" : "normal",
                      padding: "2px 0",
                    }}
                  >
                    {pw.found ? "✓ " : "○ "}
                    {pw.word}
                  </div>
                ))}
              </div>

              <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, fontStyle: "italic", color: "#666" }}>
                {TIPS[tipIndex]}
              </div>

              <button
                onClick={() => setPhase("menu")}
                style={{
                  display: "block",
                  width: "100%",
                  border: "2px solid #000",
                  padding: "12px",
                  fontSize: 18,
                  background: "#fff",
                  color: "#000",
                  cursor: "pointer",
                  marginTop: 12,
                  minHeight: 48,
                }}
              >
                ← Back to Menu
              </button>
            </div>
          )}

          {phase === "complete" && (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <h2 style={{ fontSize: 28, marginBottom: 8 }}>All Words Found!</h2>
              <p style={{ fontSize: 18 }}>Time: {formatTime(elapsed)}</p>
              <p style={{ fontSize: 18 }}>
                Words: {placedWords.length}
              </p>
              <p style={{ fontSize: 22, fontWeight: "bold", margin: "16px 0" }}>
                Score: {score}
              </p>
              <button
                onClick={() => setPhase("menu")}
                style={{
                  display: "block",
                  width: "100%",
                  border: "2px solid #000",
                  padding: "14px",
                  fontSize: 20,
                  fontWeight: "bold",
                  background: "#fff",
                  color: "#000",
                  cursor: "pointer",
                  minHeight: 60,
                  marginTop: 16,
                }}
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </EinkWrapper>
    );
  }

  // ─── Standard Render ────────────────────────────────────────────────
  return (
    <EinkWrapper einkMode={false}>
      <div className="max-w-3xl mx-auto px-4 py-4">
        <EinkBanner einkMode={false} onToggle={toggleEink} />

        <div className="flex items-center justify-between py-3">
          <Link
            href="/games"
            className="flex items-center gap-1 text-slate-400 hover:text-white text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Search size={20} /> Word Search
          </h1>
          <AudioToggles />
        </div>

        {phase === "menu" && (
          <div className="text-center py-8">
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Word Search
            </h2>
            <p className="text-slate-400 mb-8">
              Find hidden words by clicking the first and last letters.
            </p>

            {highScore > 0 && (
              <div className="mb-4 text-sm text-yellow-400 flex items-center justify-center gap-1">
                <Trophy size={14} /> Best: {highScore}
              </div>
            )}

            {/* Category */}
            <p className="text-slate-300 font-semibold mb-2">Category:</p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {categories.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`px-4 py-2 rounded-lg border font-semibold transition-colors ${
                    category === c.key
                      ? "bg-emerald-600 border-emerald-500 text-white"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Grid size */}
            <p className="text-slate-300 font-semibold mb-2">Grid Size:</p>
            <div className="flex justify-center gap-2 mb-6">
              {([10, 12, 15] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setGridSize(s)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    gridSize === s
                      ? "bg-cyan-600 border-cyan-500 text-white"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {s}×{s}
                </button>
              ))}
            </div>

            {/* Word count */}
            <p className="text-slate-300 font-semibold mb-2">
              Words: {wordCount}
            </p>
            <div className="flex justify-center gap-2 mb-8">
              {[5, 8, 10, 12].map((n) => (
                <button
                  key={n}
                  onClick={() => setWordCount(n)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    wordCount === n
                      ? "bg-purple-600 border-purple-500 text-white"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              onClick={startGame}
              className="px-10 py-3 rounded-lg font-bold text-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              Start Game
            </button>
          </div>
        )}

        {phase === "countdown" && (
          <div className="text-center py-16">
            <div className="text-7xl font-bold text-emerald-400 animate-pulse">
              {countdown}
            </div>
          </div>
        )}

        {phase === "playing" && (
          <div>
            <div className="flex items-center justify-between text-sm text-slate-300 py-2 mb-2 flex-wrap gap-2">
              <span>
                Found: {foundCount}/{placedWords.length}
              </span>
              <div className="flex items-center gap-2">
                <div
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  style={{ color: diffLabel.color, borderColor: diffLabel.color + "40", backgroundColor: diffLabel.color + "15" }}
                >
                  {diffLabel.emoji} Lv {Math.round(adaptive.level)} {diffLabel.label}
                </div>
                <span className="text-[10px] text-slate-500">{gradeInfo.label}</span>
                {adjustAnim && (
                  <span className={`text-[10px] font-bold animate-bounce ${adjustAnim === "up" ? "text-red-400" : "text-green-400"}`}>
                    {adjustAnim === "up" ? "↑ Harder!" : "↓ Easier"}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {formatTime(elapsed)}
              </span>
            </div>

            {firstClick && (
              <div className="text-center text-sm text-cyan-400 border border-cyan-500/30 rounded px-2 py-1 mb-2">
                Selected ({firstClick.row + 1}, {firstClick.col + 1}) — Now click the last letter
              </div>
            )}

            {/* Grid */}
            <div
              className="border-2 border-emerald-500/50 rounded-lg overflow-hidden mx-auto"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${gridSize}, minmax(36px, 1fr))`,
                maxWidth: gridSize <= 10 ? 500 : gridSize <= 12 ? 600 : 700,
              }}
            >
              {grid.flatMap((row, r) =>
                row.map((letter, c) => {
                  const isFound = foundCells.has(`${r},${c}`);
                  const isFirstClickCell =
                    firstClick?.row === r && firstClick?.col === c;

                  return (
                    <div
                      key={`${r},${c}`}
                      onClick={() => handleCellClick(r, c)}
                      className={`
                        flex items-center justify-center aspect-square font-mono cursor-pointer
                        border border-white/[0.06]
                        ${gridSize <= 10 ? "text-lg" : gridSize <= 12 ? "text-base" : "text-sm"}
                        ${
                          isFound
                            ? "bg-emerald-500/30 text-emerald-300 font-bold"
                            : isFirstClickCell
                              ? "bg-cyan-500/30 ring-2 ring-cyan-400 text-white font-bold"
                              : "bg-white/[0.02] hover:bg-white/[0.06] text-slate-300"
                        }
                      `}
                    >
                      {letter}
                    </div>
                  );
                }),
              )}
            </div>

            {/* Word list */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-1">
              {placedWords.map((pw) => (
                <div
                  key={pw.word}
                  className={`text-sm px-2 py-1 rounded ${
                    pw.found
                      ? "text-emerald-400 line-through font-bold"
                      : "text-slate-400"
                  }`}
                >
                  {pw.found ? "✓" : "○"} {pw.word}
                </div>
              ))}
            </div>

            <div className="text-center mt-3">
              <span className="text-[10px] text-slate-500 italic">{TIPS[tipIndex]}</span>
            </div>

            <button
              onClick={() => setPhase("menu")}
              className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              ← Back to Menu
            </button>
          </div>
        )}

        {phase === "complete" && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-3xl font-bold mb-2 text-emerald-400">
              All Words Found!
            </h2>
            <div className="text-slate-300 space-y-1 mb-4">
              <p>
                Time:{" "}
                <span className="font-semibold">{formatTime(elapsed)}</span>
              </p>
              <p>
                Words:{" "}
                <span className="font-semibold">{placedWords.length}</span>
              </p>
            </div>
            <div className="text-4xl font-bold text-yellow-400 mb-6">
              {score} pts
            </div>

            <div className="max-w-xs mx-auto mb-6">
              <ScoreSubmit
                game="word-search"
                score={score}
                level={Math.round(adaptive.level)}
                stats={{
                  wordsBuilt: placedWords.length,
                  timeSeconds: elapsed,
                }}
              />
            </div>

            <button
              onClick={() => setPhase("menu")}
              className="px-8 py-3 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              Play Again
            </button>
          </div>
        )}

        {achievementQueue.map((a, i) => (
          <div key={i} className="fixed top-4 right-4 z-50">
            <AchievementToast
              name={a.name}
              tier={a.tier}
              onDismiss={() =>
                setAchievementQueue((q) => q.filter((_, j) => j !== i))
              }
            />
          </div>
        ))}
      </div>
    </EinkWrapper>
  );
}
