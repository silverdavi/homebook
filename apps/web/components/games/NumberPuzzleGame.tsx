"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Trophy, RotateCcw } from "lucide-react";
import Link from "next/link";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import type { NewAchievement } from "@/lib/games/achievements";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxClick, sfxGameOver } from "@/lib/games/audio";

// ─── E-ink Mode ──────────────────────────────────────────────────────

function isEinkDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("kindle") || ua.includes("kobo") || ua.includes("boox");
}

function useEinkMode(): [boolean, () => void] {
  const [eink, setEink] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("eink_mode");
      if (stored === "true" || isEinkDevice()) setEink(true);
    } catch {}
  }, []);
  const toggle = () => {
    setEink((v) => {
      const next = !v;
      try { localStorage.setItem("eink_mode", String(next)); } catch {}
      return next;
    });
  };
  return [eink, toggle];
}

// ─── Types & Constants ───────────────────────────────────────────────

type Phase = "menu" | "playing" | "complete";
type PuzzleMode = "numbers" | "math";
type GridSize = 3 | 4 | 5;

const GAME_ID = "number-puzzle";
const SIZE_LABELS: Record<GridSize, string> = { 3: "3×3 (8-puzzle)", 4: "4×4 (15-puzzle)", 5: "5×5 (24-puzzle)" };

// ─── Style helpers ───────────────────────────────────────────────────

const cx = (eink: boolean, e: string, s: string) => (eink ? e : s);

function selBtn(eink: boolean, active: boolean) {
  if (eink) return `px-4 py-2 border-2 font-bold text-lg ${active ? "bg-black text-white border-black" : "bg-white text-black border-black"}`;
  return `px-4 py-2 rounded-lg font-medium transition-all ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`;
}

function actionBtn(eink: boolean, primary = false) {
  if (eink) return primary ? "px-6 py-3 border-4 border-black text-lg font-bold" : "px-6 py-3 border-2 border-black text-lg font-bold";
  if (primary) return "px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-lg font-bold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/30";
  return "px-6 py-3 bg-gray-800 rounded-xl text-lg font-bold text-gray-300 hover:bg-gray-700 transition-colors";
}

// ─── Math Expression Generation ──────────────────────────────────────

interface MathTile { expression: string; value: number; }

function generateMathExpression(target: number): string {
  const type = Math.floor(Math.random() * 4);
  switch (type) {
    case 0: { const a = Math.floor(Math.random() * target); return `${a}+${target - a}`; }
    case 1: { const b = Math.floor(Math.random() * 10) + 1; return `${target + b}-${b}`; }
    case 2: {
      const factors: [number, number][] = [];
      for (let i = 2; i <= Math.min(target, 12); i++) {
        if (target % i === 0 && target / i <= 12) factors.push([i, target / i]);
      }
      if (factors.length > 0) { const [a, b] = factors[Math.floor(Math.random() * factors.length)]; return `${a}×${b}`; }
      const a2 = Math.floor(Math.random() * target); return `${a2}+${target - a2}`;
    }
    case 3: {
      const b = Math.floor(Math.random() * 5) + 2;
      const a = target * b;
      if (a <= 99) return `${a}÷${b}`;
      const c = Math.floor(Math.random() * target); return `${c}+${target - c}`;
    }
    default: return `${target}`;
  }
}

function generateMathTiles(count: number): MathTile[] {
  return Array.from({ length: count }, (_, i) => ({ expression: generateMathExpression(i + 1), value: i + 1 }));
}

// ─── Solvability Check ──────────────────────────────────────────────

function isSolvable(tiles: number[], size: number): boolean {
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i] && tiles[j] && tiles[i] > tiles[j]) inversions++;
    }
  }
  if (size % 2 === 1) return inversions % 2 === 0;
  const emptyRow = Math.floor(tiles.indexOf(0) / size);
  return (inversions + emptyRow) % 2 === 1;
}

// ─── Board Helpers ──────────────────────────────────────────────────

function shuffleTiles(size: GridSize): number[] {
  const total = size * size;
  const tiles = Array.from({ length: total }, (_, i) => i);
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  if (!isSolvable(tiles, size)) {
    const nonEmpty = tiles.filter((t) => t !== 0);
    const i1 = tiles.indexOf(nonEmpty[0]), i2 = tiles.indexOf(nonEmpty[1]);
    [tiles[i1], tiles[i2]] = [tiles[i2], tiles[i1]];
  }
  const solved = Array.from({ length: total }, (_, i) => (i + 1) % total);
  if (tiles.every((t, i) => t === solved[i])) {
    const i1 = tiles.indexOf(1), i2 = tiles.indexOf(2);
    [tiles[i1], tiles[i2]] = [tiles[i2], tiles[i1]];
  }
  return tiles;
}

function isSolved(tiles: number[]): boolean {
  for (let i = 0; i < tiles.length - 1; i++) if (tiles[i] !== i + 1) return false;
  return tiles[tiles.length - 1] === 0;
}

function getAdjacentToEmpty(tiles: number[], size: number): number[] {
  const ei = tiles.indexOf(0), row = Math.floor(ei / size), col = ei % size;
  const adj: number[] = [];
  if (row > 0) adj.push(ei - size);
  if (row < size - 1) adj.push(ei + size);
  if (col > 0) adj.push(ei - 1);
  if (col < size - 1) adj.push(ei + 1);
  return adj;
}

function formatTime(s: number) { return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`; }
function hsKey(size: GridSize, mode: PuzzleMode) { return `number-puzzle-best-${size}-${mode}`; }

// ─── Component ──────────────────────────────────────────────────────

export function NumberPuzzleGame() {
  const [eink, toggleEink] = useEinkMode();
  const [phase, setPhase] = useState<Phase>("menu");
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const [puzzleMode, setPuzzleMode] = useState<PuzzleMode>("numbers");
  const [tiles, setTiles] = useState<number[]>([]);
  const [mathTiles, setMathTiles] = useState<MathTile[]>([]);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [newAchievements, setNewAchievements] = useState<NewAchievement[]>([]);

  useGameMusic();

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Load best score
  useEffect(() => { setBestScore(getLocalHighScore(hsKey(gridSize, puzzleMode))); }, [gridSize, puzzleMode]);

  const startGame = useCallback(() => {
    setTiles(shuffleTiles(gridSize));
    if (puzzleMode === "math") setMathTiles(generateMathTiles(gridSize * gridSize - 1));
    setMoves(0);
    setElapsed(0);
    setNewAchievements([]);
    setPhase("playing");
    sfxClick();
  }, [gridSize, puzzleMode]);

  const handleTileClick = useCallback((clickedIdx: number) => {
    if (phase !== "playing") return;
    const emptyIdx = tiles.indexOf(0);
    if (!getAdjacentToEmpty(tiles, gridSize).includes(clickedIdx)) { sfxWrong(); return; }
    sfxClick();
    const next = [...tiles];
    [next[clickedIdx], next[emptyIdx]] = [next[emptyIdx], next[clickedIdx]];
    setTiles(next);
    const nm = moves + 1;
    setMoves(nm);
    if (isSolved(next)) {
      sfxGameOver();
      const key = hsKey(gridSize, puzzleMode);
      const prev = getLocalHighScore(key);
      if (prev === 0 || nm < prev) { setLocalHighScore(key, nm); setBestScore(nm); }
      trackGamePlayed(GAME_ID, nm);
      const p = getProfile();
      const ach = checkAchievements({ gameId: GAME_ID, score: nm, moves: nm, elapsed, level: gridSize }, p.totalGamesPlayed, p.gamesPlayedByGameId);
      if (ach.length > 0) setNewAchievements(ach);
      setPhase("complete");
    } else { sfxCorrect(); }
  }, [phase, tiles, gridSize, moves, elapsed, puzzleMode]);

  const getTileDisplay = useCallback((value: number): string => {
    if (value === 0) return "";
    if (puzzleMode === "math" && mathTiles.length > 0) {
      const mt = mathTiles.find((t) => t.value === value);
      return mt ? mt.expression : String(value);
    }
    return String(value);
  }, [puzzleMode, mathTiles]);

  const tileSize = eink ? Math.max(60, Math.floor(300 / gridSize)) : Math.floor(360 / gridSize);
  const fontSize = eink ? Math.max(24, Math.floor(48 / (gridSize - 1)))
    : puzzleMode === "math" ? Math.max(14, Math.floor(36 / (gridSize - 1)))
    : Math.max(18, Math.floor(48 / (gridSize - 1)));
  const smallTile = Math.min(tileSize, 50);

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className={cx(eink, "min-h-screen bg-white text-black", "min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 text-white")}>
      {/* E-ink Banner */}
      <div className={cx(eink, "w-full border-b-2 border-black px-4 py-2 flex items-center justify-between text-sm",
        "w-full border-b border-gray-700 bg-gray-800/50 px-4 py-2 flex items-center justify-between text-sm text-gray-300")}>
        <span>{eink ? "E-Ink Mode ON" : "E-Ink Mode OFF"}</span>
        <button onClick={toggleEink} className={cx(eink, "px-3 py-1 border-2 border-black font-bold",
          "px-3 py-1 border border-gray-500 rounded hover:bg-gray-700 transition-colors")}>
          {eink ? "Switch to Standard" : "Switch to E-Ink"}
        </button>
      </div>

      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/games" className={cx(eink, "flex items-center gap-1 text-black underline font-bold",
            "flex items-center gap-1 text-gray-400 hover:text-white transition-colors")}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className={cx(eink, "text-2xl font-bold text-black",
            "text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400")}>
            Number Puzzle
          </h1>
          <AudioToggles />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-8">
        {/* ── Menu Phase ── */}
        {phase === "menu" && (
          <div className="mt-8">
            <p className={cx(eink, "text-center text-lg mb-6 font-bold", "text-center text-gray-300 mb-6")}>
              Slide tiles to arrange them in order. Click a tile next to the empty space to swap it!
            </p>

            {/* Grid Size */}
            <div className="mb-6">
              <label className={cx(eink, "block text-lg font-bold mb-2 text-center", "block text-sm font-medium text-gray-400 mb-2 text-center")}>
                Grid Size
              </label>
              <div className="flex justify-center gap-3">
                {([3, 4, 5] as GridSize[]).map((s) => (
                  <button key={s} onClick={() => { setGridSize(s); sfxClick(); }} className={selBtn(eink, gridSize === s)}>
                    {SIZE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Tile Mode */}
            <div className="mb-6">
              <label className={cx(eink, "block text-lg font-bold mb-2 text-center", "block text-sm font-medium text-gray-400 mb-2 text-center")}>
                Tile Mode
              </label>
              <div className="flex justify-center gap-3">
                <button onClick={() => { setPuzzleMode("numbers"); sfxClick(); }} className={selBtn(eink, puzzleMode === "numbers")}>Numbers</button>
                <button onClick={() => { setPuzzleMode("math"); sfxClick(); }} className={selBtn(eink, puzzleMode === "math")}>Math Expressions</button>
              </div>
              {puzzleMode === "math" && (
                <p className={cx(eink, "text-center mt-2 text-sm", "text-center mt-2 text-sm text-gray-500")}>
                  Tiles show expressions like 2+3, 4×2 — order them by their computed value!
                </p>
              )}
            </div>

            {/* Best Score */}
            {bestScore > 0 && (
              <div className={cx(eink, "text-center mb-6 border-2 border-black p-3", "text-center mb-6 bg-gray-800/50 rounded-lg p-3")}>
                <Trophy className={cx(eink, "w-5 h-5 inline mr-1", "w-5 h-5 inline mr-1 text-yellow-400")} />
                <span className={cx(eink, "font-bold", "text-gray-300")}>Best: {bestScore} moves</span>
              </div>
            )}

            <div className="flex justify-center">
              <button onClick={startGame} className={actionBtn(eink, true)}>Start Puzzle</button>
            </div>
          </div>
        )}

        {/* ── Playing Phase ── */}
        {phase === "playing" && (
          <div>
            {/* Stats */}
            <div className={cx(eink, "flex justify-between items-center border-2 border-black p-3 mb-4",
              "flex justify-between items-center bg-gray-800/50 rounded-lg p-3 mb-4")}>
              <div className={cx(eink, "font-bold text-lg", "text-gray-300")}>
                Moves: <span className={cx(eink, "", "text-white font-bold")}>{moves}</span>
              </div>
              <div className={cx(eink, "font-bold text-lg", "text-gray-300")}>
                Time: <span className={cx(eink, "", "text-white font-bold")}>{formatTime(elapsed)}</span>
              </div>
              <div className={cx(eink, "font-bold text-lg", "text-gray-300")}>{SIZE_LABELS[gridSize]}</div>
            </div>

            {/* Puzzle Grid */}
            <div className="flex justify-center mb-4">
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridSize}, ${tileSize}px)`,
                gap: eink ? "0px" : "4px", ...(eink ? { border: "3px solid black" } : {}) }}>
                {tiles.map((value, idx) => {
                  const empty = value === 0;
                  const adj = getAdjacentToEmpty(tiles, gridSize).includes(idx);
                  return (
                    <button key={idx} onClick={() => handleTileClick(idx)} disabled={empty}
                      style={{ width: tileSize, height: tileSize, fontSize: empty ? fontSize * 0.8 : fontSize,
                        ...(eink ? {} : { transition: "all 0.15s ease-in-out" }) }}
                      className={eink
                        ? empty ? "border-2 border-black bg-gray-200 flex items-center justify-center text-gray-400 font-bold cursor-default"
                          : `border-2 border-black flex items-center justify-center font-bold cursor-pointer ${adj ? "bg-gray-100" : "bg-white"}`
                        : empty ? "rounded-lg bg-gray-800/30 flex items-center justify-center cursor-default"
                          : `rounded-lg flex items-center justify-center font-bold cursor-pointer select-none ${adj
                            ? "bg-indigo-600/80 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20"
                            : "bg-gray-700 text-gray-100 hover:bg-gray-600"}`}>
                      {empty ? (eink ? "×" : "") : getTileDisplay(value)}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className={cx(eink, "text-center text-sm mb-4", "text-center text-sm text-gray-500 mb-4")}>
              {puzzleMode === "math"
                ? "Order expressions by value: lowest (top-left) → highest (bottom-right). Empty space goes last."
                : "Order numbers 1 → N, left to right, top to bottom. Empty space goes last."}
            </p>

            <div className="flex justify-center gap-3">
              <button onClick={startGame} className={cx(eink,
                "flex items-center gap-2 px-4 py-2 border-2 border-black font-bold",
                "flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors")}>
                <RotateCcw className="w-4 h-4" /> New Puzzle
              </button>
              <button onClick={() => setPhase("menu")} className={cx(eink,
                "flex items-center gap-2 px-4 py-2 border-2 border-black font-bold",
                "flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors")}>
                <ArrowLeft className="w-4 h-4" /> Menu
              </button>
            </div>
          </div>
        )}

        {/* ── Complete Phase ── */}
        {phase === "complete" && (
          <div className="mt-8 text-center">
            <div className={cx(eink, "border-4 border-black p-8 mb-6", "bg-gray-800/50 rounded-2xl p-8 mb-6 shadow-xl")}>
              <Trophy className={cx(eink, "w-16 h-16 mx-auto mb-4 text-black", "w-16 h-16 mx-auto mb-4 text-yellow-400")} />
              <h2 className={cx(eink, "text-3xl font-bold mb-2",
                "text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400")}>
                Puzzle Complete!
              </h2>
              <div className={eink ? "mt-4 space-y-2 text-xl" : "mt-4 space-y-2"}>
                <p className={cx(eink, "font-bold", "text-gray-300")}>
                  Grid: <span className={cx(eink, "", "text-white font-bold")}>{SIZE_LABELS[gridSize]}</span>
                </p>
                <p className={cx(eink, "font-bold", "text-gray-300")}>
                  Mode: <span className={cx(eink, "", "text-white font-bold")}>{puzzleMode === "math" ? "Math Expressions" : "Numbers"}</span>
                </p>
                <p className={cx(eink, "font-bold", "text-gray-300")}>
                  Moves: <span className={cx(eink, "", "text-white font-bold text-xl")}>{moves}</span>
                </p>
                <p className={cx(eink, "font-bold", "text-gray-300")}>
                  Time: <span className={cx(eink, "", "text-white font-bold text-xl")}>{formatTime(elapsed)}</span>
                </p>
                {bestScore > 0 && (
                  <p className={cx(eink, "font-bold", "text-gray-300")}>
                    Best: <span className={cx(eink, "", "text-yellow-400 font-bold")}>{bestScore} moves</span>
                    {moves <= bestScore && <span className={cx(eink, " ml-2 font-bold", " ml-2 text-green-400 font-bold")}>★ New Record!</span>}
                  </p>
                )}
              </div>

              {/* Solved board mini-display */}
              <div className="flex justify-center mt-6">
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridSize}, ${smallTile}px)`,
                  gap: eink ? "0px" : "2px", ...(eink ? { border: "2px solid black" } : {}) }}>
                  {tiles.map((v, i) => (
                    <div key={i} style={{ width: smallTile, height: smallTile, fontSize: 14 }}
                      className={v === 0
                        ? cx(eink, "border border-black bg-gray-200 flex items-center justify-center", "rounded bg-gray-800/30 flex items-center justify-center")
                        : cx(eink, "border border-black bg-white flex items-center justify-center font-bold", "rounded bg-indigo-600/60 text-white flex items-center justify-center font-bold")}>
                      {v === 0 ? "" : v}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3 flex-wrap">
              <button onClick={startGame} className={actionBtn(eink, true)}>Play Again</button>
              <button onClick={() => setPhase("menu")} className={actionBtn(eink)}>Menu</button>
            </div>
          </div>
        )}
      </div>

      {/* Achievement Toasts */}
      {newAchievements.map((a, i) => (
        <AchievementToast key={`${a.medalId}-${a.tier}`} name={a.name} tier={a.tier}
          onDismiss={() => setNewAchievements((prev) => prev.filter((_, j) => j !== i))} />
      ))}
    </div>
  );
}
