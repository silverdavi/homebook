"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Trophy, RotateCcw, Check } from "lucide-react";
import Link from "next/link";
import {
  getLocalHighScore,
  setLocalHighScore,
  trackGamePlayed,
  getProfile,
} from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import type { NewAchievement } from "@/lib/games/achievements";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxClick, sfxGameOver } from "@/lib/games/audio";

// ── E-ink utilities ─────────────────────────────────────────────────

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
      try {
        localStorage.setItem("eink_mode", String(next));
      } catch {}
      return next;
    });
  };
  return [eink, toggle];
}

// ── Types ───────────────────────────────────────────────────────────

type GamePhase = "menu" | "playing" | "complete";
type GridSize = 5 | 10;

/** Cell state: 0 = empty, 1 = filled, 2 = marked-X */
type CellState = 0 | 1 | 2;

interface NonogramPuzzle {
  name: string;
  grid: boolean[][];
}

const GAME_ID = "nonogram";

// ── Style helpers ───────────────────────────────────────────────────

const cx = (eink: boolean, e: string, s: string) => (eink ? e : s);

function selBtn(eink: boolean, active: boolean) {
  if (eink)
    return `px-4 py-2 border-2 font-bold text-lg ${active ? "bg-black text-white border-black" : "bg-white text-black border-black"}`;
  return `px-4 py-2 rounded-lg font-medium transition-all ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`;
}

function actionBtn(eink: boolean, primary = false) {
  if (eink)
    return primary
      ? "px-6 py-3 border-4 border-black text-lg font-bold"
      : "px-6 py-3 border-2 border-black text-lg font-bold";
  if (primary)
    return "px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-lg font-bold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/30";
  return "px-6 py-3 bg-gray-800 rounded-xl text-lg font-bold text-gray-300 hover:bg-gray-700 transition-colors";
}

// ── Clue generation ─────────────────────────────────────────────────

function generateClues(grid: boolean[][]): {
  rows: number[][];
  cols: number[][];
} {
  const rows = grid.map((row) => {
    const groups: number[] = [];
    let count = 0;
    for (const cell of row) {
      if (cell) count++;
      else if (count > 0) {
        groups.push(count);
        count = 0;
      }
    }
    if (count > 0) groups.push(count);
    return groups.length ? groups : [0];
  });
  const cols = Array.from({ length: grid[0].length }, (_, c) => {
    const groups: number[] = [];
    let count = 0;
    for (let r = 0; r < grid.length; r++) {
      if (grid[r][c]) count++;
      else if (count > 0) {
        groups.push(count);
        count = 0;
      }
    }
    if (count > 0) groups.push(count);
    return groups.length ? groups : [0];
  });
  return { rows, cols };
}

// ── Puzzles ─────────────────────────────────────────────────────────

const b = (rows: number[][]): boolean[][] =>
  rows.map((r) => r.map((v) => v === 1));

const PUZZLES_5: NonogramPuzzle[] = [
  { name: "5×5 #1", grid: b([[0,1,0,1,0],[1,1,1,1,1],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]]) },
  { name: "5×5 #2", grid: b([[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0]]) },
  { name: "5×5 #3", grid: b([[0,0,1,0,0],[0,1,1,1,0],[1,0,1,0,1],[0,0,1,0,0],[0,0,1,0,0]]) },
  { name: "5×5 #4", grid: b([[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1]]) },
  { name: "5×5 #5", grid: b([[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1]]) },
  { name: "5×5 #6", grid: b([[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]]) },
  { name: "5×5 #7", grid: b([[1,0,0,0,0],[1,1,0,0,0],[1,1,1,0,0],[1,1,1,1,0],[1,1,1,1,1]]) },
  { name: "5×5 #8", grid: b([[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0]]) },
  { name: "5×5 #9", grid: b([[1,1,1,1,1],[0,0,0,0,1],[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,1]]) },
  { name: "5×5 #10", grid: b([[0,1,1,1,0],[1,1,0,1,1],[1,0,0,0,1],[1,1,0,1,1],[0,1,1,1,0]]) },
  { name: "5×5 #11", grid: b([[1,0,1,0,1],[0,1,0,1,0],[1,0,1,0,1],[0,1,0,1,0],[1,0,1,0,1]]) },
  { name: "5×5 #12", grid: b([[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]]) },
  { name: "5×5 #13", grid: b([[1,1,0,1,1],[1,0,0,0,1],[0,0,0,0,0],[1,0,0,0,1],[1,1,0,1,1]]) },
  { name: "5×5 #14", grid: b([[0,0,0,0,1],[0,0,0,1,1],[0,0,1,0,1],[0,1,0,0,1],[1,1,1,1,1]]) },
  { name: "5×5 #15", grid: b([[1,1,1,0,0],[1,0,0,0,0],[1,1,1,0,0],[0,0,1,0,0],[1,1,1,0,0]]) },
  { name: "5×5 #16", grid: b([[0,1,0,1,0],[1,0,1,0,1],[0,1,0,1,0],[1,0,1,0,1],[0,1,0,1,0]]) },
  { name: "5×5 #17", grid: b([[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0]]) },
  { name: "5×5 #18", grid: b([[0,1,1,0,0],[1,0,0,1,0],[0,1,1,0,0],[1,0,0,1,0],[0,1,1,0,0]]) },
  { name: "5×5 #19", grid: b([[1,1,1,1,0],[1,0,0,0,0],[1,0,1,1,0],[1,0,0,1,0],[1,1,1,1,0]]) },
  { name: "5×5 #20", grid: b([[0,0,1,0,0],[0,1,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,1,1,0]]) },
];

const PUZZLES_10: NonogramPuzzle[] = [
  { name: "10×10 #1", grid: b([
    [0,0,0,0,1,1,0,0,0,0],[0,0,0,1,1,1,1,0,0,0],[1,1,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,1,0,0],[0,1,1,1,0,0,1,1,1,0],[0,1,1,0,0,0,0,1,1,0],
    [1,1,0,0,0,0,0,0,1,1],[1,0,0,0,0,0,0,0,0,1],
  ]) },
  { name: "10×10 #2", grid: b([
    [0,0,0,0,1,1,0,0,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1],[1,1,0,0,0,0,0,0,1,1],[1,1,0,1,1,0,0,0,1,1],[1,1,0,1,1,0,0,0,1,1],
    [1,1,0,0,0,0,1,0,1,1],[1,1,1,1,1,1,1,1,1,1],
  ]) },
  { name: "10×10 #3", grid: b([
    [0,0,1,1,1,1,1,1,0,0],[0,1,1,1,1,1,1,1,1,0],[1,1,0,1,1,1,1,0,1,1],[1,1,0,1,1,1,1,0,1,1],
    [1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,0,1,1,1,1,0,1,1],[1,1,1,0,1,1,0,1,1,1],
    [0,1,1,1,0,0,1,1,1,0],[0,0,1,1,1,1,1,1,0,0],
  ]) },
  { name: "10×10 #4", grid: b([
    [0,0,0,1,1,1,1,0,0,0],[0,0,1,0,0,0,0,1,0,0],[0,1,0,0,0,0,0,0,1,0],[1,0,0,1,0,0,1,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,1],[0,1,0,0,0,0,0,0,1,0],[0,0,1,0,0,0,0,1,0,0],
    [0,0,0,1,0,0,1,0,0,0],[0,0,0,0,1,1,0,0,0,0],
  ]) },
  { name: "10×10 #5", grid: b([
    [1,1,1,1,1,1,1,1,1,1],[1,0,0,0,0,0,0,0,0,1],[1,0,1,1,1,1,1,1,0,1],[1,0,1,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,0,1,0,1],[1,0,1,0,1,1,0,1,0,1],[1,0,1,0,0,0,0,1,0,1],[1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1],[1,1,1,1,1,1,1,1,1,1],
  ]) },
  { name: "10×10 #6", grid: b([
    [0,0,0,0,1,0,0,0,0,0],[0,0,0,1,1,0,0,0,0,0],[0,0,1,0,1,0,0,0,0,0],[0,1,0,0,1,0,0,0,0,0],
    [1,1,1,1,1,1,1,1,1,1],[0,0,0,0,1,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,1,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0],
  ]) },
  { name: "10×10 #7", grid: b([
    [1,0,0,0,0,0,0,0,0,1],[0,1,0,0,0,0,0,0,1,0],[0,0,1,0,0,0,0,1,0,0],[0,0,0,1,0,0,1,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],[0,0,0,0,1,1,0,0,0,0],[0,0,0,1,0,0,1,0,0,0],[0,0,1,0,0,0,0,1,0,0],
    [0,1,0,0,0,0,0,0,1,0],[1,0,0,0,0,0,0,0,0,1],
  ]) },
  { name: "10×10 #8", grid: b([
    [0,1,1,1,1,1,1,1,1,0],[1,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],[1,1,1,1,1,1,1,1,1,1],[0,0,0,0,1,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0],
    [0,0,0,1,0,1,0,0,0,0],[0,0,1,0,0,0,1,0,0,0],
  ]) },
  { name: "10×10 #9", grid: b([
    [0,0,1,1,1,1,1,1,0,0],[0,1,0,0,0,0,0,0,1,0],[1,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,1],
    [0,1,0,0,0,0,0,0,1,0],[0,0,1,1,1,1,1,1,0,0],
  ]) },
  { name: "10×10 #10", grid: b([
    [1,1,0,0,0,0,0,0,1,1],[1,1,1,0,0,0,0,1,1,1],[0,1,1,1,0,0,1,1,1,0],[0,0,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,1,1,1,0,0,1,1,1,0],
    [1,1,1,0,0,0,0,1,1,1],[1,1,0,0,0,0,0,0,1,1],
  ]) },
  { name: "10×10 #11", grid: b([
    [0,0,0,0,0,0,0,0,0,0],[0,1,1,0,0,0,0,1,1,0],[0,1,1,0,0,0,0,1,1,0],[0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0,0,1],[0,1,0,0,0,0,0,0,1,0],[0,0,1,1,0,0,1,1,0,0],[0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],
  ]) },
  { name: "10×10 #12", grid: b([
    [0,0,0,1,0,0,1,0,0,0],[0,0,1,0,1,1,0,1,0,0],[0,1,0,0,0,0,0,0,1,0],[1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,1],[0,1,0,0,0,0,0,0,1,0],[0,0,1,0,0,0,0,1,0,0],
    [0,0,0,1,0,0,1,0,0,0],[0,0,0,0,1,1,0,0,0,0],
  ]) },
  { name: "10×10 #13", grid: b([
    [1,1,1,1,1,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0],[1,1,1,1,1,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],
    [1,1,1,1,1,0,0,0,0,0],[0,0,0,0,0,1,1,1,1,1],[0,0,0,0,0,1,0,0,0,0],[0,0,0,0,0,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,1],[0,0,0,0,0,1,1,1,1,1],
  ]) },
  { name: "10×10 #14", grid: b([
    [0,0,0,0,0,0,0,0,0,1],[0,0,0,0,0,0,0,0,1,1],[0,0,0,0,0,0,0,1,0,1],[0,0,0,0,0,0,1,0,0,1],
    [0,0,0,0,0,1,0,0,0,1],[0,0,0,0,1,0,0,0,0,1],[0,0,0,1,0,0,0,0,0,1],[0,0,1,0,0,0,0,0,0,1],
    [0,1,0,0,0,0,0,0,0,1],[1,1,1,1,1,1,1,1,1,1],
  ]) },
  { name: "10×10 #15", grid: b([
    [1,1,1,1,1,1,1,1,1,1],[1,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,1],[1,0,0,1,1,1,1,0,0,1],
    [1,0,0,1,0,0,1,0,0,1],[1,0,0,1,0,0,1,0,0,1],[1,0,0,1,1,1,1,0,0,1],[1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,1],[1,1,1,1,1,1,1,1,1,1],
  ]) },
  { name: "10×10 #16", grid: b([
    [0,1,0,0,0,0,0,0,1,0],[1,1,1,0,0,0,0,1,1,1],[0,1,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],[0,0,0,0,1,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,1,0],
    [1,1,1,0,0,0,0,1,1,1],[0,1,0,0,0,0,0,0,1,0],
  ]) },
  { name: "10×10 #17", grid: b([
    [1,0,0,0,1,1,0,0,0,1],[1,0,0,0,1,1,0,0,0,1],[1,1,1,1,1,1,1,1,1,1],[0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],[0,0,0,0,1,1,0,0,0,0],[0,0,0,0,1,1,0,0,0,0],[1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,1,0,0,0,1],[1,0,0,0,1,1,0,0,0,1],
  ]) },
  { name: "10×10 #18", grid: b([
    [0,0,0,0,1,0,0,0,0,0],[0,0,0,1,1,1,0,0,0,0],[0,0,1,1,1,1,1,0,0,0],[0,1,1,1,1,1,1,1,0,0],
    [1,1,1,1,1,1,1,1,1,0],[0,0,0,0,0,0,0,0,1,1],[0,0,0,0,0,0,0,0,1,1],[0,0,0,0,0,0,0,0,1,1],
    [0,0,0,0,0,0,0,0,1,1],[0,0,0,0,0,0,0,0,1,1],
  ]) },
  { name: "10×10 #19", grid: b([
    [0,0,0,0,0,0,0,0,0,0],[0,1,1,1,0,0,1,1,1,0],[0,1,0,1,0,0,1,0,1,0],[0,1,1,1,0,0,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,1,1,1,0,0,1,1,1,0],[0,1,0,1,0,0,1,0,1,0],
    [0,1,1,1,0,0,1,1,1,0],[0,0,0,0,0,0,0,0,0,0],
  ]) },
  { name: "10×10 #20", grid: b([
    [0,0,0,0,1,1,0,0,0,0],[0,0,0,1,0,0,1,0,0,0],[0,0,1,0,0,0,0,1,0,0],[0,0,1,0,0,0,0,1,0,0],
    [0,0,1,0,0,0,0,1,0,0],[0,0,1,0,0,0,0,1,0,0],[0,0,1,0,0,0,0,1,0,0],[0,0,1,0,0,0,0,1,0,0],
    [0,0,0,1,0,0,1,0,0,0],[0,0,0,0,1,1,0,0,0,0],
  ]) },
];

function getPuzzlesForSize(size: GridSize): NonogramPuzzle[] {
  return size === 5 ? PUZZLES_5 : PUZZLES_10;
}

// ── Dynamic Puzzle Generation ────────────────────────────────────────

type SymmetryMode = "none" | "horizontal" | "vertical" | "both" | "rotational";

/**
 * Generate a random nonogram puzzle procedurally.
 * Uses density + optional symmetry to create interesting, varied puzzles.
 */
function generateRandomPuzzle(
  size: number,
  density = 0.45,
  symmetry: SymmetryMode = "none"
): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  // Helper to fill with symmetry
  const setCell = (r: number, c: number, val: boolean) => {
    grid[r][c] = val;
    switch (symmetry) {
      case "horizontal":
        grid[size - 1 - r][c] = val;
        break;
      case "vertical":
        grid[r][size - 1 - c] = val;
        break;
      case "both":
        grid[size - 1 - r][c] = val;
        grid[r][size - 1 - c] = val;
        grid[size - 1 - r][size - 1 - c] = val;
        break;
      case "rotational":
        grid[c][size - 1 - r] = val;
        grid[size - 1 - r][size - 1 - c] = val;
        grid[size - 1 - c][r] = val;
        break;
    }
  };

  // Fill cells according to density
  // For symmetric modes, only fill the "source" region and mirror
  if (symmetry === "none") {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        grid[r][c] = Math.random() < density;
      }
    }
  } else if (symmetry === "horizontal") {
    const halfR = Math.ceil(size / 2);
    for (let r = 0; r < halfR; r++) {
      for (let c = 0; c < size; c++) {
        setCell(r, c, Math.random() < density);
      }
    }
  } else if (symmetry === "vertical") {
    const halfC = Math.ceil(size / 2);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < halfC; c++) {
        setCell(r, c, Math.random() < density);
      }
    }
  } else if (symmetry === "both") {
    const halfR = Math.ceil(size / 2);
    const halfC = Math.ceil(size / 2);
    for (let r = 0; r < halfR; r++) {
      for (let c = 0; c < halfC; c++) {
        setCell(r, c, Math.random() < density);
      }
    }
  } else {
    // rotational — fill one quadrant
    const halfR = Math.ceil(size / 2);
    const halfC = Math.ceil(size / 2);
    for (let r = 0; r < halfR; r++) {
      for (let c = 0; c < halfC; c++) {
        setCell(r, c, Math.random() < density);
      }
    }
  }

  // Validate: ensure at least one filled cell per row and column to avoid
  // trivial all-zero rows/cols (boring). Also ensure at least one empty.
  for (let r = 0; r < size; r++) {
    if (grid[r].every((c) => !c)) {
      grid[r][Math.floor(Math.random() * size)] = true;
    }
    if (grid[r].every((c) => c)) {
      grid[r][Math.floor(Math.random() * size)] = false;
    }
  }
  for (let c = 0; c < size; c++) {
    const col = grid.map((row) => row[c]);
    if (col.every((v) => !v)) {
      grid[Math.floor(Math.random() * size)][c] = true;
    }
    if (col.every((v) => v)) {
      grid[Math.floor(Math.random() * size)][c] = false;
    }
  }

  return grid;
}

const SYMMETRY_OPTIONS: { key: SymmetryMode; label: string }[] = [
  { key: "none", label: "Random" },
  { key: "horizontal", label: "↕ Horizontal" },
  { key: "vertical", label: "↔ Vertical" },
  { key: "both", label: "✦ Both Axes" },
  { key: "rotational", label: "↻ Rotational" },
];

// ── Helpers ─────────────────────────────────────────────────────────

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function hsKey(size: GridSize) {
  return `nonogram-best-${size}`;
}

function createEmptyBoard(size: number): CellState[][] {
  return Array.from({ length: size }, () => Array(size).fill(0) as CellState[]);
}

/**
 * Check if the player's board satisfies ALL row and column clues.
 * Accepts ANY valid solution, not just the intended template.
 */
function checkSolutionByClues(
  board: CellState[][],
  expectedClues: { rows: number[][]; cols: number[][] }
): boolean {
  for (let r = 0; r < board.length; r++) {
    if (!isRowComplete(board, r, expectedClues.rows[r])) return false;
  }
  for (let c = 0; c < board[0].length; c++) {
    if (!isColComplete(board, c, expectedClues.cols[c])) return false;
  }
  return true;
}

/** Calculate score: base points for size, bonus for speed, penalty for extra moves. */
function calculateScore(
  size: GridSize,
  elapsed: number,
  moves: number
): number {
  const filledCount = size === 5 ? 25 : 100;
  const basePoints = size === 5 ? 500 : 1500;
  const timeBonus = Math.max(0, (size === 5 ? 120 : 300) - elapsed) * 2;
  const movePenalty = Math.max(0, (moves - filledCount) * 3);
  return Math.max(100, basePoints + timeBonus - movePenalty);
}

/** Check if a row clue is satisfied by the current board row. */
function isRowComplete(
  board: CellState[][],
  rowIdx: number,
  expectedClue: number[]
): boolean {
  const row = board[rowIdx];
  const groups: number[] = [];
  let count = 0;
  for (const cell of row) {
    if (cell === 1) count++;
    else if (count > 0) {
      groups.push(count);
      count = 0;
    }
  }
  if (count > 0) groups.push(count);
  if (groups.length === 0) groups.push(0);
  if (groups.length !== expectedClue.length) return false;
  return groups.every((g, i) => g === expectedClue[i]);
}

/** Check if a column clue is satisfied by the current board column. */
function isColComplete(
  board: CellState[][],
  colIdx: number,
  expectedClue: number[]
): boolean {
  const groups: number[] = [];
  let count = 0;
  for (let r = 0; r < board.length; r++) {
    if (board[r][colIdx] === 1) count++;
    else if (count > 0) {
      groups.push(count);
      count = 0;
    }
  }
  if (count > 0) groups.push(count);
  if (groups.length === 0) groups.push(0);
  if (groups.length !== expectedClue.length) return false;
  return groups.every((g, i) => g === expectedClue[i]);
}

// ── Component ───────────────────────────────────────────────────────

export function NonogramGame() {
  const [eink, toggleEink] = useEinkMode();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [gridSize, setGridSize] = useState<GridSize>(5);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [puzzleMode, setPuzzleMode] = useState<"preset" | "random">("preset");
  const [density, setDensity] = useState(45); // percent
  const [symmetry, setSymmetry] = useState<SymmetryMode>("none");
  const [board, setBoard] = useState<CellState[][]>([]);
  const [playerBoard, setPlayerBoard] = useState<CellState[][]>([]); // snapshot of player's solution for completion screen
  const [clues, setClues] = useState<{ rows: number[][]; cols: number[][] }>({
    rows: [],
    cols: [],
  });
  const [puzzleLabel, setPuzzleLabel] = useState("");
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongCheck, setWrongCheck] = useState(false);
  const [newAchievements, setNewAchievements] = useState<NewAchievement[]>([]);

  useGameMusic();

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Load best score when size changes
  useEffect(() => {
    setBestScore(getLocalHighScore(hsKey(gridSize)));
  }, [gridSize]);

  const startPresetGame = useCallback(
    (idx?: number) => {
      const puzzles = getPuzzlesForSize(gridSize);
      const pi = idx ?? puzzleIndex;
      const puzzle = puzzles[pi % puzzles.length];
      const sol = puzzle.grid;
      const size = sol.length;
      setClues(generateClues(sol));
      setBoard(createEmptyBoard(size));
      setPlayerBoard([]);
      setMoves(0);
      setElapsed(0);
      setScore(0);
      setWrongCheck(false);
      setNewAchievements([]);
      setPuzzleIndex(pi % puzzles.length);
      setPuzzleLabel(`Puzzle #${(pi % puzzles.length) + 1}`);
      setPuzzleMode("preset");
      setPhase("playing");
      sfxClick();
    },
    [gridSize, puzzleIndex]
  );

  const startRandomGame = useCallback(() => {
    const sol = generateRandomPuzzle(gridSize, density / 100, symmetry);
    setClues(generateClues(sol));
    setBoard(createEmptyBoard(gridSize));
    setPlayerBoard([]);
    setMoves(0);
    setElapsed(0);
    setScore(0);
    setWrongCheck(false);
    setNewAchievements([]);
    const symLabel = symmetry === "none" ? "" : ` (${SYMMETRY_OPTIONS.find(s => s.key === symmetry)?.label ?? ""})`;
    setPuzzleLabel(`Random ${density}%${symLabel}`);
    setPuzzleMode("random");
    setPhase("playing");
    sfxClick();
  }, [gridSize, density, symmetry]);

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (phase !== "playing") return;
      sfxClick();
      setBoard((prev) => {
        const next = prev.map((row) => [...row]);
        // Cycle: 0 → 1 → 2 → 0
        next[r][c] = ((prev[r][c] + 1) % 3) as CellState;
        return next;
      });
      setMoves((m) => m + 1);
    },
    [phase]
  );

  const handleValidate = useCallback(() => {
    if (phase !== "playing") return;

    if (checkSolutionByClues(board, clues)) {
      sfxCorrect();
      sfxGameOver();
      // Save player's actual board for completion display
      setPlayerBoard(board.map((row) => [...row]));
      const finalScore = calculateScore(gridSize, elapsed, moves);
      setScore(finalScore);
      const key = hsKey(gridSize);
      const prev = getLocalHighScore(key);
      if (finalScore > prev) {
        setLocalHighScore(key, finalScore);
        setBestScore(finalScore);
      }
      trackGamePlayed(GAME_ID, finalScore);
      const p = getProfile();
      const ach = checkAchievements(
        {
          gameId: GAME_ID,
          score: finalScore,
          moves,
          elapsed,
          level: gridSize,
          accuracy: 100,
        },
        p.totalGamesPlayed,
        p.gamesPlayedByGameId
      );
      if (ach.length > 0) setNewAchievements(ach);
      setPhase("complete");
    } else {
      sfxWrong();
      setWrongCheck(true);
      setTimeout(() => setWrongCheck(false), 1500);
    }
  }, [phase, board, clues, gridSize, elapsed, moves]);

  const handleReset = useCallback(() => {
    if (phase !== "playing") return;
    sfxClick();
    setBoard(createEmptyBoard(gridSize));
    setMoves(0);
    setElapsed(0);
    setWrongCheck(false);
  }, [phase, gridSize]);

  // ── Compute clue completion status ──
  const rowComplete = clues.rows.map((clue, r) =>
    board.length > 0 ? isRowComplete(board, r, clue) : false
  );
  const colComplete = clues.cols.map((clue, c) =>
    board.length > 0 ? isColComplete(board, c, clue) : false
  );

  // Max clue lengths for header sizing
  const maxRowClueLen = clues.rows.reduce(
    (max, r) => Math.max(max, r.length),
    0
  );
  const maxColClueLen = clues.cols.reduce(
    (max, c) => Math.max(max, c.length),
    0
  );

  const cellSize = gridSize === 5 ? (eink ? 52 : 48) : eink ? 34 : 32;
  const clueFs = gridSize === 5 ? 16 : 12;
  const puzzles = getPuzzlesForSize(gridSize);

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div
      className={cx(
        eink,
        "min-h-screen bg-white text-black",
        "min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 text-white"
      )}
    >
      {/* E-ink Banner */}
      <div
        className={cx(
          eink,
          "w-full border-b-2 border-black px-4 py-2 flex items-center justify-between text-sm",
          "w-full border-b border-gray-700 bg-gray-800/50 px-4 py-2 flex items-center justify-between text-sm text-gray-300"
        )}
      >
        <span>{eink ? "E-Ink Mode ON" : "E-Ink Mode OFF"}</span>
        <button
          onClick={toggleEink}
          className={cx(
            eink,
            "px-3 py-1 border-2 border-black font-bold",
            "px-3 py-1 border border-gray-500 rounded hover:bg-gray-700 transition-colors"
          )}
        >
          {eink ? "Switch to Standard" : "Switch to E-Ink"}
        </button>
      </div>

      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/games"
            className={cx(
              eink,
              "flex items-center gap-1 text-black underline font-bold",
              "flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
            )}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1
            className={cx(
              eink,
              "text-2xl font-bold text-black",
              "text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400"
            )}
          >
            Nonogram
          </h1>
          <AudioToggles />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-8">
        {/* ── Menu Phase ── */}
        {phase === "menu" && (
          <div className="mt-8">
            <p
              className={cx(
                eink,
                "text-center text-lg mb-6 font-bold",
                "text-center text-gray-300 mb-6"
              )}
            >
              Fill in the grid using the number clues! Each number tells you how
              many consecutive cells are filled in that row or column.
            </p>

            {/* Grid Size */}
            <div className="mb-6">
              <label
                className={cx(
                  eink,
                  "block text-lg font-bold mb-2 text-center",
                  "block text-sm font-medium text-gray-400 mb-2 text-center"
                )}
              >
                Grid Size
              </label>
              <div className="flex justify-center gap-3">
                {([5, 10] as GridSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setGridSize(s);
                      setPuzzleIndex(0);
                      sfxClick();
                    }}
                    className={selBtn(eink, gridSize === s)}
                  >
                    {s}×{s}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode tabs: Preset vs Random */}
            <div className="mb-6">
              <div className="flex justify-center gap-2 mb-4">
                <button
                  onClick={() => { setPuzzleMode("preset"); sfxClick(); }}
                  className={selBtn(eink, puzzleMode === "preset")}
                >
                  Preset Puzzles
                </button>
                <button
                  onClick={() => { setPuzzleMode("random"); sfxClick(); }}
                  className={selBtn(eink, puzzleMode === "random")}
                >
                  Generate Random
                </button>
              </div>

              {puzzleMode === "preset" && (
                <div>
                  <label
                    className={cx(
                      eink,
                      "block text-lg font-bold mb-2 text-center",
                      "block text-sm font-medium text-gray-400 mb-2 text-center"
                    )}
                  >
                    Puzzle {puzzleIndex + 1} of {puzzles.length}
                  </label>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => {
                        setPuzzleIndex((i) => (i - 1 + puzzles.length) % puzzles.length);
                        sfxClick();
                      }}
                      className={selBtn(eink, false)}
                    >
                      ← Prev
                    </button>
                    <span className={cx(eink, "text-2xl font-bold", "text-2xl font-bold text-white tabular-nums")}>
                      #{puzzleIndex + 1}
                    </span>
                    <button
                      onClick={() => {
                        setPuzzleIndex((i) => (i + 1) % puzzles.length);
                        sfxClick();
                      }}
                      className={selBtn(eink, false)}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {puzzleMode === "random" && (
                <div className="space-y-4 max-w-xs mx-auto">
                  {/* Density slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={cx(eink, "font-bold", "text-sm text-gray-400")}>Density</span>
                      <span className={cx(eink, "font-bold", "text-sm font-bold text-indigo-400 tabular-nums")}>{density}%</span>
                    </div>
                    <input
                      type="range" min={25} max={70} step={5} value={density}
                      onChange={(e) => setDensity(Number(e.target.value))}
                      className={cx(eink, "w-full", "w-full accent-indigo-500")}
                    />
                    <div className={cx(eink,
                      "flex justify-between text-xs font-bold mt-0.5",
                      "flex justify-between text-[9px] text-slate-600 mt-0.5"
                    )}>
                      <span>Sparse</span><span>Dense</span>
                    </div>
                  </div>

                  {/* Symmetry selector */}
                  <div>
                    <span className={cx(eink, "font-bold block mb-2", "text-sm text-gray-400 block mb-2")}>Symmetry</span>
                    <div className="flex flex-wrap justify-center gap-2">
                      {SYMMETRY_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => { setSymmetry(opt.key); sfxClick(); }}
                          className={selBtn(eink, symmetry === opt.key)}
                          style={{ fontSize: eink ? 14 : 12, padding: "6px 10px" }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Best Score */}
            {bestScore > 0 && (
              <div
                className={cx(
                  eink,
                  "text-center mb-6 border-2 border-black p-3",
                  "text-center mb-6 bg-gray-800/50 rounded-lg p-3"
                )}
              >
                <Trophy
                  className={cx(
                    eink,
                    "w-5 h-5 inline mr-1",
                    "w-5 h-5 inline mr-1 text-yellow-400"
                  )}
                />
                <span className={cx(eink, "font-bold", "text-gray-300")}>
                  Best: {bestScore} pts
                </span>
              </div>
            )}

            {/* How to Play */}
            <div
              className={cx(
                eink,
                "border-2 border-black p-4 mb-6",
                "bg-gray-800/30 rounded-xl p-4 mb-6 border border-gray-700"
              )}
            >
              <h3
                className={cx(
                  eink,
                  "font-bold text-lg mb-2",
                  "font-bold text-sm text-gray-300 mb-2"
                )}
              >
                How to Play
              </h3>
              <ul
                className={cx(
                  eink,
                  "list-disc list-inside text-sm space-y-1",
                  "list-disc list-inside text-sm text-gray-400 space-y-1"
                )}
              >
                <li>
                  Click a cell to cycle: empty → filled → marked-X → empty
                </li>
                <li>
                  Row/column numbers show groups of consecutive filled cells
                </li>
                <li>
                  Use X marks to note cells you know are empty
                </li>
                <li>
                  Any arrangement that satisfies all clues is a valid solution!
                </li>
                <li>
                  Press &quot;Check&quot; when you think you&apos;ve solved it!
                </li>
              </ul>
            </div>

            <div className="flex justify-center gap-3">
              {puzzleMode === "preset" ? (
                <button onClick={() => startPresetGame()} className={actionBtn(eink, true)}>
                  Start Puzzle
                </button>
              ) : (
                <button onClick={startRandomGame} className={actionBtn(eink, true)}>
                  Generate &amp; Play
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Playing Phase ── */}
        {phase === "playing" && (
          <div>
            {/* Stats Bar */}
            <div
              className={cx(
                eink,
                "flex justify-between items-center border-2 border-black p-3 mb-4",
                "flex justify-between items-center bg-gray-800/50 rounded-lg p-3 mb-4"
              )}
            >
              <div className={cx(eink, "font-bold text-lg", "text-gray-300")}>
                Moves:{" "}
                <span className={cx(eink, "", "text-white font-bold")}>
                  {moves}
                </span>
              </div>
              <div className={cx(eink, "font-bold text-lg", "text-gray-300")}>
                Time:{" "}
                <span className={cx(eink, "", "text-white font-bold")}>
                  {formatTime(elapsed)}
                </span>
              </div>
              <div className={cx(eink, "font-bold text-lg", "text-gray-300")}>
                {puzzleLabel} ({gridSize}×{gridSize})
              </div>
            </div>

            {/* Wrong Check Feedback */}
            {wrongCheck && (
              <div
                className={cx(
                  eink,
                  "text-center border-2 border-black p-2 mb-3 font-bold",
                  "text-center bg-red-900/50 border border-red-500/50 rounded-lg p-2 mb-3 text-red-300"
                )}
              >
                Not quite right — keep trying!
              </div>
            )}

            {/* Nonogram Grid */}
            <div className="flex justify-center mb-4 overflow-x-auto">
              <div className="inline-block">
                <table
                  className="border-collapse"
                  style={{ borderSpacing: 0 }}
                >
                  <thead>
                    {/* Column clues */}
                    {Array.from({ length: maxColClueLen }, (_, clueRow) => (
                      <tr key={`col-clue-${clueRow}`}>
                        {/* Empty corner cell */}
                        {clueRow === 0 && (
                          <td
                            rowSpan={maxColClueLen}
                            style={{
                              width: maxRowClueLen * (clueFs + 8),
                              minWidth: maxRowClueLen * (clueFs + 8),
                            }}
                          />
                        )}
                        {clues.cols.map((col, ci) => {
                          const padded = Array.from(
                            { length: maxColClueLen },
                            (_, i) =>
                              i < maxColClueLen - col.length
                                ? null
                                : col[i - (maxColClueLen - col.length)]
                          );
                          return (
                            <td
                              key={`ch-${ci}-${clueRow}`}
                              style={{
                                width: cellSize,
                                height: clueFs + 8,
                                fontSize: clueFs,
                                textAlign: "center",
                                verticalAlign: "bottom",
                                padding: 0,
                              }}
                              className={
                                colComplete[ci]
                                  ? cx(
                                      eink,
                                      "font-bold text-gray-400 line-through",
                                      "font-bold text-green-400/60 line-through"
                                    )
                                  : cx(
                                      eink,
                                      "font-bold text-black",
                                      "font-medium text-gray-300"
                                    )
                              }
                            >
                              {padded[clueRow] !== null
                                ? padded[clueRow]
                                : ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {board.map((row, r) => (
                      <tr key={`row-${r}`}>
                        {/* Row clues */}
                        <td
                          style={{
                            height: cellSize,
                            paddingRight: 6,
                            fontSize: clueFs,
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}
                          className={
                            rowComplete[r]
                              ? cx(
                                  eink,
                                  "font-bold text-gray-400 line-through",
                                  "font-bold text-green-400/60 line-through"
                                )
                              : cx(
                                  eink,
                                  "font-bold text-black",
                                  "font-medium text-gray-300"
                                )
                          }
                        >
                          {clues.rows[r]?.join(" ") ?? ""}
                        </td>
                        {/* Grid cells */}
                        {row.map((cell, c) => {
                          const thick5 =
                            gridSize === 10
                              ? {
                                  borderTop:
                                    r % 5 === 0 && r > 0
                                      ? eink
                                        ? "3px solid black"
                                        : "2px solid rgba(255,255,255,0.3)"
                                      : undefined,
                                  borderLeft:
                                    c % 5 === 0 && c > 0
                                      ? eink
                                        ? "3px solid black"
                                        : "2px solid rgba(255,255,255,0.3)"
                                      : undefined,
                                }
                              : {};

                          return (
                            <td
                              key={`cell-${r}-${c}`}
                              onClick={() => handleCellClick(r, c)}
                              style={{
                                width: cellSize,
                                height: cellSize,
                                minWidth: cellSize,
                                minHeight: cellSize,
                                cursor: "pointer",
                                textAlign: "center",
                                verticalAlign: "middle",
                                fontSize: cellSize * 0.5,
                                padding: 0,
                                ...thick5,
                              }}
                              className={
                                eink
                                  ? `border border-black select-none ${
                                      cell === 1
                                        ? "bg-black text-white"
                                        : cell === 2
                                          ? "bg-white text-black font-bold"
                                          : "bg-white"
                                    }`
                                  : `border border-gray-600 select-none ${
                                      cell === 1
                                        ? "bg-indigo-500 transition-colors"
                                        : cell === 2
                                          ? "bg-gray-800 text-gray-400 font-bold transition-colors"
                                          : "bg-gray-900/80 hover:bg-gray-700/50 transition-colors"
                                    }`
                              }
                            >
                              {cell === 2 ? "×" : ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={handleValidate}
                className={cx(
                  eink,
                  "flex items-center gap-2 px-5 py-2.5 border-4 border-black font-bold text-lg",
                  "flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-bold hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg shadow-green-500/20"
                )}
              >
                <Check className="w-5 h-5" /> Check
              </button>
              <button
                onClick={handleReset}
                className={cx(
                  eink,
                  "flex items-center gap-2 px-4 py-2 border-2 border-black font-bold",
                  "flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                )}
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              <button
                onClick={() => setPhase("menu")}
                className={cx(
                  eink,
                  "flex items-center gap-2 px-4 py-2 border-2 border-black font-bold",
                  "flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                )}
              >
                <ArrowLeft className="w-4 h-4" /> Menu
              </button>
            </div>
          </div>
        )}

        {/* ── Complete Phase ── */}
        {phase === "complete" && (
          <div className="mt-8 text-center">
            <div
              className={cx(
                eink,
                "border-4 border-black p-8 mb-6",
                "bg-gray-800/50 rounded-2xl p-8 mb-6 shadow-xl"
              )}
            >
              <Trophy
                className={cx(
                  eink,
                  "w-16 h-16 mx-auto mb-4 text-black",
                  "w-16 h-16 mx-auto mb-4 text-yellow-400"
                )}
              />
              <h2
                className={cx(
                  eink,
                  "text-3xl font-bold mb-2",
                  "text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400"
                )}
              >
                Puzzle Complete!
              </h2>
              <p
                className={cx(
                  eink,
                  "text-xl font-bold mb-4",
                  "text-lg text-gray-400 mb-4"
                )}
              >
                You solved {puzzleLabel} ({gridSize}×{gridSize})!
              </p>

              <div className={eink ? "mt-4 space-y-2 text-xl" : "mt-4 space-y-2"}>
                <p className={cx(eink, "font-bold", "text-gray-300")}>
                  Score:{" "}
                  <span
                    className={cx(
                      eink,
                      "",
                      "text-white font-bold text-xl"
                    )}
                  >
                    {score}
                  </span>
                </p>
                <p className={cx(eink, "font-bold", "text-gray-300")}>
                  Moves:{" "}
                  <span
                    className={cx(
                      eink,
                      "",
                      "text-white font-bold text-xl"
                    )}
                  >
                    {moves}
                  </span>
                </p>
                <p className={cx(eink, "font-bold", "text-gray-300")}>
                  Time:{" "}
                  <span
                    className={cx(
                      eink,
                      "",
                      "text-white font-bold text-xl"
                    )}
                  >
                    {formatTime(elapsed)}
                  </span>
                </p>
                <p className={cx(eink, "font-bold", "text-gray-300")}>
                  Size:{" "}
                  <span className={cx(eink, "", "text-white font-bold")}>
                    {gridSize}×{gridSize}
                  </span>
                </p>
                {bestScore > 0 && (
                  <p className={cx(eink, "font-bold", "text-gray-300")}>
                    Best:{" "}
                    <span
                      className={cx(
                        eink,
                        "",
                        "text-yellow-400 font-bold"
                      )}
                    >
                      {bestScore} pts
                    </span>
                    {score >= bestScore && (
                      <span
                        className={cx(
                          eink,
                          " ml-2 font-bold",
                          " ml-2 text-green-400 font-bold"
                        )}
                      >
                        ★ New Record!
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Solved board mini-display — shows player's actual solution */}
              {playerBoard.length > 0 && (
                <div className="flex justify-center mt-6">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${gridSize}, ${gridSize === 5 ? 28 : 16}px)`,
                      gap: "1px",
                      ...(eink ? { border: "2px solid black" } : {}),
                    }}
                  >
                    {playerBoard.map((row, r) =>
                      row.map((cell, c) => (
                        <div
                          key={`sol-${r}-${c}`}
                          style={{
                            width: gridSize === 5 ? 28 : 16,
                            height: gridSize === 5 ? 28 : 16,
                          }}
                          className={
                            cell === 1
                              ? cx(eink, "bg-black", "bg-indigo-500")
                              : cx(eink, "bg-white border border-gray-300", "bg-gray-800")
                          }
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3 flex-wrap">
              {puzzleMode === "preset" ? (
                <>
                  <button
                    onClick={() => {
                      const nextIdx = (puzzleIndex + 1) % puzzles.length;
                      setPuzzleIndex(nextIdx);
                      startPresetGame(nextIdx);
                    }}
                    className={actionBtn(eink, true)}
                  >
                    Next Puzzle
                  </button>
                  <button
                    onClick={() => startPresetGame()}
                    className={actionBtn(eink)}
                  >
                    Replay
                  </button>
                </>
              ) : (
                <button
                  onClick={startRandomGame}
                  className={actionBtn(eink, true)}
                >
                  Generate Another
                </button>
              )}
              <button
                onClick={() => setPhase("menu")}
                className={actionBtn(eink)}
              >
                Menu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Achievement Toasts */}
      {newAchievements.map((a, i) => (
        <AchievementToast
          key={`${a.medalId}-${a.tier}`}
          name={a.name}
          tier={a.tier}
          onDismiss={() =>
            setNewAchievements((prev) => prev.filter((_, j) => j !== i))
          }
        />
      ))}
    </div>
  );
}
