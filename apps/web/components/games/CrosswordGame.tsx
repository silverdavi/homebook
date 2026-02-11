"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Check, Eraser } from "lucide-react";
import Link from "next/link";

import {
  getLocalHighScore,
  setLocalHighScore,
  trackGamePlayed,
  getProfile,
} from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import type { NewAchievement } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import {
  sfxCorrect,
  sfxWrong,
  sfxClick,
  sfxLevelUp,
  sfxGameOver,
  sfxPerfect,
  sfxCountdownGo,
} from "@/lib/games/audio";
import { createAdaptiveState, adaptiveUpdate, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import { getGradeForLevel } from "@/lib/games/learning-guide";

// ── E-ink utilities (inline fallback if Agent 5 hasn't created eink-utils) ──

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

function isEinkDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("kindle") || ua.includes("kobo") || ua.includes("boox");
}

// ── Types ──

type GamePhase = "menu" | "countdown" | "playing" | "complete";

interface Clue {
  direction: "across" | "down";
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
}

interface CrosswordPuzzle {
  name: string;
  size: number;
  cells: (string | null)[][];
  clues: Clue[];
}

interface CellState {
  letter: string;
  wrong: boolean;
  revealed: boolean;
}

// ── Puzzles ──

const PUZZLES: CrosswordPuzzle[] = [
  {
    name: "Science Vocabulary",
    size: 11,
    cells: (() => {
      const g: (string | null)[][] = Array.from({ length: 11 }, () =>
        Array(11).fill(null)
      );
      // ACROSS words placement
      // 1-across: ATOM (0,0)
      "ATOM".split("").forEach((c, i) => (g[0][0 + i] = c));
      // 2-across: CELL (1,3)
      "CELL".split("").forEach((c, i) => (g[1][3 + i] = c));
      // 3-across: ORBIT (2,0)
      "ORBIT".split("").forEach((c, i) => (g[2][0 + i] = c));
      // 4-across: ENERGY (4,0)
      "ENERGY".split("").forEach((c, i) => (g[4][0 + i] = c));
      // 5-across: MASS (6,2)
      "MASS".split("").forEach((c, i) => (g[6][2 + i] = c));
      // 6-across: PROTON (8,0)
      "PROTON".split("").forEach((c, i) => (g[8][0 + i] = c));
      // 7-across: GENE (10,1)
      "GENE".split("").forEach((c, i) => (g[10][1 + i] = c));
      return g;
    })(),
    clues: [
      { direction: "across", number: 1, clue: "Smallest unit of an element", answer: "ATOM", row: 0, col: 0 },
      { direction: "across", number: 2, clue: "Basic unit of life", answer: "CELL", row: 1, col: 3 },
      { direction: "across", number: 3, clue: "Path of a planet around a star", answer: "ORBIT", row: 2, col: 0 },
      { direction: "across", number: 4, clue: "Ability to do work (physics)", answer: "ENERGY", row: 4, col: 0 },
      { direction: "across", number: 5, clue: "Amount of matter in an object", answer: "MASS", row: 6, col: 2 },
      { direction: "across", number: 6, clue: "Positive particle in an atom's nucleus", answer: "PROTON", row: 8, col: 0 },
      { direction: "across", number: 7, clue: "Unit of heredity", answer: "GENE", row: 10, col: 1 },
    ],
  },
  {
    name: "Math Terms",
    size: 11,
    cells: (() => {
      const g: (string | null)[][] = Array.from({ length: 11 }, () =>
        Array(11).fill(null)
      );
      "RATIO".split("").forEach((c, i) => (g[0][0 + i] = c));
      "PRIME".split("").forEach((c, i) => (g[2][1 + i] = c));
      "ANGLE".split("").forEach((c, i) => (g[4][0 + i] = c));
      "SUM".split("").forEach((c, i) => (g[6][2 + i] = c));
      "GRAPH".split("").forEach((c, i) => (g[8][0 + i] = c));
      "AREA".split("").forEach((c, i) => (g[10][1 + i] = c));
      return g;
    })(),
    clues: [
      { direction: "across", number: 1, clue: "Comparison of two quantities (a:b)", answer: "RATIO", row: 0, col: 0 },
      { direction: "across", number: 2, clue: "Number divisible only by 1 and itself", answer: "PRIME", row: 2, col: 1 },
      { direction: "across", number: 3, clue: "Space between two intersecting lines (degrees)", answer: "ANGLE", row: 4, col: 0 },
      { direction: "across", number: 4, clue: "Result of adding numbers together", answer: "SUM", row: 6, col: 2 },
      { direction: "across", number: 5, clue: "Visual representation of data with axes", answer: "GRAPH", row: 8, col: 0 },
      { direction: "across", number: 6, clue: "Length × width for a rectangle", answer: "AREA", row: 10, col: 1 },
    ],
  },
  {
    name: "History Terms",
    size: 11,
    cells: (() => {
      const g: (string | null)[][] = Array.from({ length: 11 }, () =>
        Array(11).fill(null)
      );
      "EMPIRE".split("").forEach((c, i) => (g[0][0 + i] = c));
      "TREATY".split("").forEach((c, i) => (g[2][0 + i] = c));
      "COLONY".split("").forEach((c, i) => (g[4][1 + i] = c));
      "REVOLT".split("").forEach((c, i) => (g[6][0 + i] = c));
      "SENATE".split("").forEach((c, i) => (g[8][0 + i] = c));
      "RELIC".split("").forEach((c, i) => (g[10][1 + i] = c));
      return g;
    })(),
    clues: [
      { direction: "across", number: 1, clue: "Large territory ruled by a single authority (e.g. Roman ___)", answer: "EMPIRE", row: 0, col: 0 },
      { direction: "across", number: 2, clue: "Formal agreement between nations", answer: "TREATY", row: 2, col: 0 },
      { direction: "across", number: 3, clue: "Territory controlled by a foreign power", answer: "COLONY", row: 4, col: 1 },
      { direction: "across", number: 4, clue: "Uprising against established authority", answer: "REVOLT", row: 6, col: 0 },
      { direction: "across", number: 5, clue: "Legislative assembly in ancient Rome and modern democracies", answer: "SENATE", row: 8, col: 0 },
      { direction: "across", number: 6, clue: "Artifact from the past", answer: "RELIC", row: 10, col: 1 },
    ],
  },
  {
    name: "Geography",
    size: 11,
    cells: (() => {
      const g: (string | null)[][] = Array.from({ length: 11 }, () =>
        Array(11).fill(null)
      );
      "OCEAN".split("").forEach((c, i) => (g[0][0 + i] = c));
      "DELTA".split("").forEach((c, i) => (g[2][1 + i] = c));
      "BASIN".split("").forEach((c, i) => (g[4][0 + i] = c));
      "CLIFF".split("").forEach((c, i) => (g[6][2 + i] = c));
      "RIDGE".split("").forEach((c, i) => (g[8][0 + i] = c));
      "COAST".split("").forEach((c, i) => (g[10][0 + i] = c));
      return g;
    })(),
    clues: [
      { direction: "across", number: 1, clue: "Vast body of salt water covering most of Earth", answer: "OCEAN", row: 0, col: 0 },
      { direction: "across", number: 2, clue: "Fan-shaped land at a river mouth", answer: "DELTA", row: 2, col: 1 },
      { direction: "across", number: 3, clue: "Low-lying area surrounded by higher ground", answer: "BASIN", row: 4, col: 0 },
      { direction: "across", number: 4, clue: "Steep rock face at the coast or mountain", answer: "CLIFF", row: 6, col: 2 },
      { direction: "across", number: 5, clue: "Long narrow elevated crest of land or ocean floor", answer: "RIDGE", row: 8, col: 0 },
      { direction: "across", number: 6, clue: "Land along the edge of the sea", answer: "COAST", row: 10, col: 0 },
    ],
  },
  {
    name: "Biology",
    size: 11,
    cells: (() => {
      const g: (string | null)[][] = Array.from({ length: 11 }, () =>
        Array(11).fill(null)
      );
      "FLORA".split("").forEach((c, i) => (g[0][0 + i] = c));
      "GENUS".split("").forEach((c, i) => (g[2][1 + i] = c));
      "SPINE".split("").forEach((c, i) => (g[4][0 + i] = c));
      "FUNGI".split("").forEach((c, i) => (g[6][1 + i] = c));
      "ORGAN".split("").forEach((c, i) => (g[8][0 + i] = c));
      "TRAIT".split("").forEach((c, i) => (g[10][1 + i] = c));
      return g;
    })(),
    clues: [
      { direction: "across", number: 1, clue: "Plant life of a particular region", answer: "FLORA", row: 0, col: 0 },
      { direction: "across", number: 2, clue: "Taxonomic rank between family and species", answer: "GENUS", row: 2, col: 1 },
      { direction: "across", number: 3, clue: "Column of vertebrae protecting the spinal cord", answer: "SPINE", row: 4, col: 0 },
      { direction: "across", number: 4, clue: "Kingdom that includes mushrooms and yeasts", answer: "FUNGI", row: 6, col: 1 },
      { direction: "across", number: 5, clue: "Body part performing a specific function (e.g. heart)", answer: "ORGAN", row: 8, col: 0 },
      { direction: "across", number: 6, clue: "Characteristic passed from parent to offspring", answer: "TRAIT", row: 10, col: 1 },
    ],
  },
];

// ── Helpers ──

function getCellNumber(
  puzzle: CrosswordPuzzle,
  row: number,
  col: number
): number | null {
  for (const clue of puzzle.clues) {
    if (clue.row === row && clue.col === col) return clue.number;
  }
  return null;
}

function getCluesForCell(
  puzzle: CrosswordPuzzle,
  row: number,
  col: number
): Clue[] {
  return puzzle.clues.filter((clue) => {
    const len = clue.answer.length;
    if (clue.direction === "across") {
      return row === clue.row && col >= clue.col && col < clue.col + len;
    }
    return col === clue.col && row >= clue.row && row < clue.row + len;
  });
}

// ── Component ──

export function CrosswordGame() {
  const [eink, toggleEink] = useEinkMode();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [grid, setGrid] = useState<CellState[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [direction, setDirection] = useState<"across" | "down">("across");
  const [activeClue, setActiveClue] = useState<Clue | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [achievements, setAchievements] = useState<NewAchievement[]>([]);
  const [highScore, setHighScore] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(3));
  const [adjustAnim, setAdjustAnim] = useState<"up" | "down" | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordStartTimeRef = useRef(Date.now());

  const puzzle = PUZZLES[puzzleIdx];

  useGameMusic();

  useEffect(() => {
    setHighScore(getLocalHighScore("crossword"));
  }, []);

  // Timer
  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, startTime]);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setPhase("playing");
          setStartTime(Date.now());
          if (!eink) sfxCountdownGo();
          return 3;
        }
        return c - 1;
      });
    }, 800);
    return () => clearTimeout(t);
  }, [phase, countdown, eink]);

  // Adjust animation when difficulty changes
  useEffect(() => {
    if (adaptive.lastAdjustTime === 0) return;
    setAdjustAnim(adaptive.lastAdjust);
    const t = setTimeout(() => setAdjustAnim(null), 1500);
    return () => clearTimeout(t);
  }, [adaptive.lastAdjustTime, adaptive.lastAdjust]);

  const initGrid = useCallback(
    (p: CrosswordPuzzle) => {
      const g: CellState[][] = Array.from({ length: p.size }, (_, r) =>
        Array.from({ length: p.size }, (_, c) => ({
          letter: "",
          wrong: false,
          revealed: false,
        }))
      );
      setGrid(g);
      setSelectedCell(null);
      setActiveClue(null);
      setChecked(false);
      setDirection("across");
    },
    []
  );

  const startGame = useCallback(
    (idx: number) => {
      setPuzzleIdx(idx);
      initGrid(PUZZLES[idx]);
      setCountdown(3);
      setPhase("countdown");
      setElapsed(0);
      setScore(0);
      wordStartTimeRef.current = Date.now();
      if (!eink) sfxClick();
    },
    [eink, initGrid]
  );

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (phase !== "playing") return;
      if (puzzle.cells[row][col] === null) return;

      // Track the effective direction for clue lookup
      let effectiveDirection = direction;

      // If clicking same cell, toggle direction
      if (selectedCell?.row === row && selectedCell?.col === col) {
        effectiveDirection = direction === "across" ? "down" : "across";
        setDirection(effectiveDirection);
      } else {
        setSelectedCell({ row, col });
      }

      // Find an active clue for this cell using the effective direction
      const clues = getCluesForCell(puzzle, row, col);
      const preferred = clues.find((c) => c.direction === effectiveDirection);
      setActiveClue(preferred || clues[0] || null);

      if (!eink) sfxClick();
    },
    [phase, puzzle, selectedCell, direction, eink]
  );

  const handleLetterInput = useCallback(
    (letter: string) => {
      if (!selectedCell || phase !== "playing") return;
      const { row, col } = selectedCell;
      if (puzzle.cells[row][col] === null) return;

      setGrid((prev) => {
        const next = prev.map((r) => r.map((c) => ({ ...c })));
        next[row][col] = { letter, wrong: false, revealed: false };
        return next;
      });

      // Auto-advance to next cell in direction
      if (direction === "across") {
        const nextCol = col + 1;
        if (nextCol < puzzle.size && puzzle.cells[row][nextCol] !== null) {
          setSelectedCell({ row, col: nextCol });
        }
      } else {
        const nextRow = row + 1;
        if (nextRow < puzzle.size && puzzle.cells[nextRow][col] !== null) {
          setSelectedCell({ row: nextRow, col });
        }
      }

      if (!eink) sfxClick();
    },
    [selectedCell, phase, puzzle, direction, eink]
  );

  const handleClear = useCallback(() => {
    if (!selectedCell || phase !== "playing") return;
    const { row, col } = selectedCell;
    setGrid((prev) => {
      const next = prev.map((r) => r.map((c) => ({ ...c })));
      next[row][col] = { letter: "", wrong: false, revealed: false };
      return next;
    });
    if (!eink) sfxClick();
  }, [selectedCell, phase, eink]);

  const handleCheck = useCallback(() => {
    if (phase !== "playing") return;
    let allCorrect = true;
    let totalFilled = 0;
    let correctCount = 0;

    const next = grid.map((r, ri) =>
      r.map((c, ci) => {
        const expected = puzzle.cells[ri][ci];
        if (expected === null) return c;
        if (c.letter === "") {
          allCorrect = false;
          return c;
        }
        totalFilled++;
        if (c.letter === expected) {
          correctCount++;
          return { ...c, wrong: false };
        }
        allCorrect = false;
        return { ...c, wrong: true };
      })
    );

    // Check if there are any unfilled cells
    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        if (puzzle.cells[r][c] !== null && next[r][c].letter === "") {
          allCorrect = false;
        }
      }
    }

    setGrid(next);
    setChecked(true);

    if (allCorrect) {
      // Adaptive update: fast if under 3 minutes
      const fast = elapsed < 180;
      setAdaptive(prev => adaptiveUpdate(prev, true, fast));

      // Calculate score: base 1000, bonus for speed, penalty for checks
      const timeBonus = Math.max(0, 500 - elapsed * 2);
      const finalScore = 1000 + timeBonus;
      setScore(finalScore);
      if (finalScore > highScore) {
        setLocalHighScore("crossword", finalScore);
        setHighScore(finalScore);
      }

      trackGamePlayed("crossword", finalScore);
      const profile = getProfile();
      const newAch = checkAchievements(
        {
          gameId: "crossword",
          score: finalScore,
          timeSeconds: elapsed,
          accuracy: totalFilled > 0 ? (correctCount / totalFilled) * 100 : 100,
        },
        profile.totalGamesPlayed,
        profile.gamesPlayedByGameId
      );
      setAchievements(newAch);
      setPhase("complete");

      if (!eink) sfxLevelUp();
    } else {
      // Wrong check counts as a hint/reveal scenario
      setAdaptive(prev => adaptiveUpdate(prev, false, false));
      if (!eink) sfxWrong();
    }
  }, [phase, grid, puzzle, elapsed, highScore, eink]);

  const handleClueClick = useCallback(
    (clue: Clue) => {
      setSelectedCell({ row: clue.row, col: clue.col });
      setDirection(clue.direction);
      setActiveClue(clue);
      if (!eink) sfxClick();
    },
    [eink]
  );

  // Physical keyboard support
  useEffect(() => {
    if (phase !== "playing") return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Letter input
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleLetterInput(e.key.toUpperCase());
        return;
      }

      // Backspace / Delete
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleClear();
        return;
      }

      // Arrow keys for navigation
      if (!selectedCell) return;
      const { row, col } = selectedCell;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        for (let c = col + 1; c < puzzle.size; c++) {
          if (puzzle.cells[row][c] !== null) {
            setSelectedCell({ row, col: c });
            const clues = getCluesForCell(puzzle, row, c);
            const pref = clues.find((cl) => cl.direction === "across");
            setActiveClue(pref || clues[0] || null);
            setDirection("across");
            break;
          }
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        for (let c = col - 1; c >= 0; c--) {
          if (puzzle.cells[row][c] !== null) {
            setSelectedCell({ row, col: c });
            const clues = getCluesForCell(puzzle, row, c);
            const pref = clues.find((cl) => cl.direction === "across");
            setActiveClue(pref || clues[0] || null);
            setDirection("across");
            break;
          }
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        for (let r = row + 1; r < puzzle.size; r++) {
          if (puzzle.cells[r][col] !== null) {
            setSelectedCell({ row: r, col });
            const clues = getCluesForCell(puzzle, r, col);
            const pref = clues.find((cl) => cl.direction === "down");
            setActiveClue(pref || clues[0] || null);
            setDirection("down");
            break;
          }
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        for (let r = row - 1; r >= 0; r--) {
          if (puzzle.cells[r][col] !== null) {
            setSelectedCell({ row: r, col });
            const clues = getCluesForCell(puzzle, r, col);
            const pref = clues.find((cl) => cl.direction === "down");
            setActiveClue(pref || clues[0] || null);
            setDirection("down");
            break;
          }
        }
      } else if (e.key === "Tab") {
        // Tab to toggle direction
        e.preventDefault();
        const newDir = direction === "across" ? "down" : "across";
        setDirection(newDir);
        const clues = getCluesForCell(puzzle, row, col);
        const pref = clues.find((cl) => cl.direction === newDir);
        setActiveClue(pref || clues[0] || null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, selectedCell, direction, puzzle, handleLetterInput, handleClear]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Get highlighted cells for active clue
  const getHighlightedCells = useCallback((): Set<string> => {
    const set = new Set<string>();
    if (!activeClue) return set;
    const len = activeClue.answer.length;
    for (let i = 0; i < len; i++) {
      const r =
        activeClue.direction === "across"
          ? activeClue.row
          : activeClue.row + i;
      const c =
        activeClue.direction === "across"
          ? activeClue.col + i
          : activeClue.col;
      set.add(`${r}-${c}`);
    }
    return set;
  }, [activeClue]);

  const highlighted = getHighlightedCells();
  const diffLabel = getDifficultyLabel(adaptive.level);
  const gradeInfo = getGradeForLevel(adaptive.level);

  // ── Standard mode dark theme styles ──
  const stdBg = "bg-gradient-to-b from-[#060612] via-[#0a0e2a] to-[#060612]";
  const stdText = "text-white";
  const stdMuted = "text-slate-400";
  const stdBtn =
    "bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg";
  const stdBtnSm =
    "bg-white/10 hover:bg-white/20 text-white rounded-lg";

  // ── E-ink styles ──
  const einkBg = "bg-white";
  const einkText = "text-black";
  const einkBtn =
    "bg-white text-black border-2 border-black font-semibold rounded-none";

  const bg = eink ? einkBg : stdBg;
  const text = eink ? einkText : stdText;
  const muted = eink ? "text-black" : stdMuted;

  const KEYBOARD_ROWS = [
    "QWERTYUIOP".split(""),
    "ASDFGHJKL".split(""),
    "ZXCVBNM".split(""),
  ];

  // ── Menu ──
  if (phase === "menu") {
    return (
      <div className={`min-h-screen ${bg} flex flex-col items-center px-4 py-8`}>
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/games"
              className={`flex items-center gap-2 ${muted} ${eink ? "" : "hover:text-white"}`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            {!eink && <AudioToggles />}
          </div>

          <h1 className={`text-3xl font-bold ${text} text-center mb-2`}>
            Crossword
          </h1>
          <p className={`${muted} text-center mb-6`}>
            Educational crossword puzzles
          </p>

          {/* E-ink banner */}
          <div
            className={`mb-6 p-3 rounded-lg text-center text-sm ${
              eink
                ? "border-2 border-black bg-white text-black"
                : "bg-white/5 text-slate-300"
            }`}
          >
            <p className="font-semibold">
              Works on e-readers (Kindle, Kobo, Boox)
            </p>
            <p>Tap/click only | No dragging required</p>
            <button
              onClick={toggleEink}
              className={`mt-2 px-4 py-1.5 font-semibold ${
                eink ? einkBtn : stdBtnSm
              }`}
            >
              E-Ink Mode: {eink ? "ON" : "OFF"}
            </button>
          </div>

          {highScore > 0 && (
            <p className={`text-center ${muted} mb-4`}>
              <Trophy className="inline w-4 h-4 mr-1" />
              Best: {highScore}
            </p>
          )}

          {/* Puzzle selection */}
          <div className="flex flex-col gap-3">
            {PUZZLES.map((p, i) => (
              <button
                key={i}
                onClick={() => startGame(i)}
                className={`w-full py-4 px-6 text-lg font-semibold text-left ${
                  eink
                    ? "bg-white border-2 border-black text-black"
                    : "bg-white/10 hover:bg-white/20 text-white rounded-lg"
                }`}
              >
                {i + 1}. {p.name}
                <span className={`block text-sm ${muted} mt-0.5`}>
                  {p.clues.length} clues
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Countdown ──
  if (phase === "countdown") {
    return (
      <div className={`min-h-screen ${bg} flex flex-col items-center justify-center px-4 py-8`}>
        <div className="text-center py-20">
          <div className="text-8xl font-bold text-emerald-400 animate-pulse">
            {countdown || "GO!"}
          </div>
          <p className={`mt-4 ${muted}`}>Get ready...</p>
        </div>
      </div>
    );
  }

  // ── Complete ──
  if (phase === "complete") {
    return (
      <div className={`min-h-screen ${bg} flex flex-col items-center px-4 py-8`}>
        <div className="w-full max-w-md text-center">
          <Trophy
            className={`w-16 h-16 mx-auto mb-4 ${
              eink ? "text-black" : "text-yellow-400"
            }`}
          />
          <h2 className={`text-2xl font-bold ${text} mb-2`}>
            Puzzle Complete!
          </h2>
          <p className={`${muted} mb-1`}>
            {puzzle.name}
          </p>
          <p className={`text-4xl font-bold ${eink ? "text-black" : "text-indigo-400"} mb-2`}>
            {score}
          </p>
          <p className={`${muted} mb-6`}>
            Time: {formatTime(elapsed)}
          </p>

          {achievements.map((a) => (
            <AchievementToast key={a.medalId} name={a.name} tier={a.tier} />
          ))}

          <ScoreSubmit game="crossword" score={score} level={Math.round(adaptive.level)} />

          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => setPhase("menu")}
              className={`px-6 py-3 ${eink ? einkBtn : stdBtn}`}
            >
              <RotateCcw className="inline w-4 h-4 mr-2" />
              Play Again
            </button>
            <Link
              href="/games"
              className={`px-6 py-3 inline-block ${
                eink ? einkBtn : stdBtnSm + " py-3"
              }`}
            >
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing ──
  return (
    <div className={`min-h-screen ${bg} flex flex-col items-center px-2 py-4`}>
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setPhase("menu")}
            className={`flex items-center gap-1 text-sm ${muted}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-lg ${text}`}>
              {formatTime(elapsed)}
            </span>
            <div
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{ color: diffLabel.color, borderColor: diffLabel.color + "40", backgroundColor: diffLabel.color + "15" }}
            >
              {diffLabel.emoji} Lv {Math.round(adaptive.level)}
            </div>
            <span className={`text-[10px] ${muted}`}>{gradeInfo.label}</span>
            {adjustAnim && (
              <span className={`text-[10px] font-bold animate-bounce ${adjustAnim === "up" ? "text-red-400" : "text-green-400"}`}>
                {adjustAnim === "up" ? "↑ Harder!" : "↓ Easier"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleEink}
              className={`text-xs px-2 py-1 ${
                eink ? "border border-black text-black" : "bg-white/10 text-white rounded"
              }`}
            >
              E-Ink: {eink ? "ON" : "OFF"}
            </button>
            {!eink && <AudioToggles />}
          </div>
        </div>

        <h2 className={`text-center font-bold ${text} mb-3`}>
          {puzzle.name}
        </h2>

        {/* Grid */}
        <div className="flex justify-center mb-3">
          <div
            className="inline-grid"
            style={{
              gridTemplateColumns: `repeat(${puzzle.size}, 1fr)`,
              gap: 0,
              border: eink ? "2px solid black" : "2px solid #4f46e5",
            }}
          >
            {Array.from({ length: puzzle.size }, (_, r) =>
              Array.from({ length: puzzle.size }, (_, c) => {
                const expected = puzzle.cells[r][c];
                const isBlack = expected === null;
                const cellState = grid[r]?.[c];
                const isSelected =
                  selectedCell?.row === r && selectedCell?.col === c;
                const isHighlighted = highlighted.has(`${r}-${c}`);
                const cellNum = getCellNumber(puzzle, r, c);

                const cellSize = eink ? "w-[36px] h-[36px]" : "w-[32px] h-[32px]";

                if (isBlack) {
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`${cellSize} ${eink ? "bg-black" : "bg-slate-900"}`}
                    />
                  );
                }

                let cellBg = eink ? "bg-white" : "bg-slate-800";
                if (isSelected) {
                  cellBg = eink ? "bg-gray-300" : "bg-indigo-600";
                } else if (isHighlighted) {
                  cellBg = eink ? "bg-gray-100" : "bg-indigo-900/50";
                }

                let letterColor = eink ? "text-black" : "text-white";
                if (checked && cellState?.wrong) {
                  letterColor = eink ? "line-through text-black" : "text-red-400";
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`${cellSize} ${cellBg} relative cursor-pointer flex items-center justify-center`}
                    style={{
                      border: eink
                        ? isSelected
                          ? "3px solid black"
                          : "1px solid black"
                        : isSelected
                          ? "2px solid #818cf8"
                          : "1px solid #334155",
                    }}
                  >
                    {cellNum && (
                      <span
                        className={`absolute top-0 left-0.5 text-[8px] leading-none font-bold ${
                          eink ? "text-black" : "text-slate-400"
                        }`}
                      >
                        {cellNum}
                      </span>
                    )}
                    <span
                      className={`text-base font-bold ${letterColor} ${
                        checked && cellState?.wrong && eink
                          ? "line-through"
                          : ""
                      }`}
                    >
                      {cellState?.letter || ""}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Direction toggle + actions */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <button
            onClick={() => setDirection("across")}
            className={`px-3 py-2 text-sm font-bold ${
              direction === "across"
                ? eink
                  ? "bg-black text-white border-2 border-black"
                  : "bg-indigo-600 text-white rounded-lg"
                : eink
                  ? "bg-white text-black border-2 border-black"
                  : "bg-white/10 text-white rounded-lg"
            }`}
          >
            → Across
          </button>
          <button
            onClick={() => setDirection("down")}
            className={`px-3 py-2 text-sm font-bold ${
              direction === "down"
                ? eink
                  ? "bg-black text-white border-2 border-black"
                  : "bg-indigo-600 text-white rounded-lg"
                : eink
                  ? "bg-white text-black border-2 border-black"
                  : "bg-white/10 text-white rounded-lg"
            }`}
          >
            ↓ Down
          </button>
          <button
            onClick={handleClear}
            className={`px-3 py-2 text-sm font-bold ${
              eink ? einkBtn : stdBtnSm
            }`}
          >
            <Eraser className="inline w-4 h-4 mr-1" />
            Clear
          </button>
          <button
            onClick={handleCheck}
            className={`px-3 py-2 text-sm font-bold ${
              eink ? einkBtn : stdBtn
            }`}
          >
            <Check className="inline w-4 h-4 mr-1" />
            Check
          </button>
        </div>

        {/* Active clue */}
        {activeClue && (
          <div
            className={`text-center mb-3 p-2 rounded ${
              eink
                ? "border-2 border-black bg-white text-black"
                : "bg-white/5 text-slate-200"
            }`}
          >
            <span className="font-bold">
              {activeClue.number}
              {activeClue.direction === "across" ? "A" : "D"}:
            </span>{" "}
            {activeClue.clue}
          </div>
        )}

        {/* On-screen keyboard */}
        <div className="flex flex-col items-center gap-1 mb-4">
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="flex gap-1">
              {row.map((letter) => (
                <button
                  key={letter}
                  onClick={() => handleLetterInput(letter)}
                  className={`font-bold ${
                    eink
                      ? "w-[34px] h-[44px] text-lg bg-white text-black border-2 border-black"
                      : "w-[30px] h-[40px] text-sm bg-white/10 hover:bg-white/20 text-white rounded"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Clue list */}
        <div
          className={`${
            eink ? "border-2 border-black" : "bg-white/5 rounded-lg"
          } p-3`}
        >
          <h3 className={`font-bold ${text} mb-2`}>Clues</h3>
          <div className="grid grid-cols-1 gap-1">
            {puzzle.clues
              .filter((c) => c.direction === "across")
              .length > 0 && (
              <div className="mb-2">
                <h4 className={`font-bold text-sm ${muted} mb-1`}>ACROSS</h4>
                {puzzle.clues
                  .filter((c) => c.direction === "across")
                  .map((clue) => (
                    <button
                      key={`a-${clue.number}`}
                      onClick={() => handleClueClick(clue)}
                      className={`block w-full text-left py-1.5 px-2 text-sm ${
                        activeClue === clue
                          ? eink
                            ? "bg-gray-200 font-bold text-black"
                            : "bg-indigo-900/50 text-indigo-200"
                          : eink
                            ? "text-black"
                            : "text-slate-300 hover:bg-white/5"
                      }`}
                    >
                      <span className="font-bold mr-1">{clue.number}.</span>
                      {clue.clue}
                    </button>
                  ))}
              </div>
            )}
            {puzzle.clues.filter((c) => c.direction === "down").length > 0 && (
              <div>
                <h4 className={`font-bold text-sm ${muted} mb-1`}>DOWN</h4>
                {puzzle.clues
                  .filter((c) => c.direction === "down")
                  .map((clue) => (
                    <button
                      key={`d-${clue.number}`}
                      onClick={() => handleClueClick(clue)}
                      className={`block w-full text-left py-1.5 px-2 text-sm ${
                        activeClue === clue
                          ? eink
                            ? "bg-gray-200 font-bold text-black"
                            : "bg-indigo-900/50 text-indigo-200"
                          : eink
                            ? "text-black"
                            : "text-slate-300 hover:bg-white/5"
                      }`}
                    >
                      <span className="font-bold mr-1">{clue.number}.</span>
                      {clue.clue}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
