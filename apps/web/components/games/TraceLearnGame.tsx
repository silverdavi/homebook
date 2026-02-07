"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Heart, Trophy, RotateCcw, Star, Pencil, ChevronRight } from "lucide-react";
import Link from "next/link";

import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import type { MedalTier } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, BonusToast, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import {
  sfxCorrect, sfxWrong, sfxLevelUp, sfxGameOver,
  sfxCountdown, sfxCountdownGo, sfxClick, sfxAchievement, sfxCombo,
} from "@/lib/games/audio";
import { getPointerPos, type Point } from "@/lib/games/canvas-utils";

// ── Types ──

type GamePhase = "menu" | "countdown" | "playing" | "result" | "complete";
type Category = "letters" | "numbers" | "math" | "shapes";

interface TraceTarget {
  id: string;
  category: Category;
  label: string;
  description: string;
  getPath: (w: number, h: number, padding: number) => Point[];
}

// ── Constants ──

const GAME_WIDTH = 700;
const GAME_HEIGHT = 600;
const CANVAS_PADDING = 80;
const ITEMS_PER_ROUND = 8;
const COUNTDOWN_SECS = 3;

const CATEGORY_COLORS: Record<Category, string> = {
  letters: "#818cf8",
  numbers: "#34d399",
  math: "#f59e0b",
  shapes: "#f472b6",
};

// ── Shape path generators ──

function letterPath(char: string, w: number, h: number, pad: number): Point[] {
  const points: Point[] = [];
  const cx = w / 2;
  const cy = h / 2;
  const scaleX = (w - pad * 2) * 0.4;
  const scaleY = (h - pad * 2) * 0.4;

  // Simplified glyph paths — approximate letter shapes with line segments
  // Empty arrays = pen-up markers (stroke break)
  const glyphs: Record<string, ([] | [number, number])[]> = {
    A: [[-1,1],[0,-1],[1,1],[],[0.5,0],[-0.5,0]],
    B: [[-0.8,1],[-0.8,-1],[0.3,-1],[0.7,-0.6],[0.3,-0.1],[-0.8,-0.1],[],[-0.8,0],[0.4,0],[0.8,0.5],[0.4,1],[-0.8,1]],
    C: [[0.7,-0.7],[0,-1],[-0.7,-0.5],[-0.7,0.5],[0,1],[0.7,0.7]],
    D: [[-0.7,1],[-0.7,-1],[0.2,-1],[0.7,-0.4],[0.7,0.4],[0.2,1],[-0.7,1]],
    E: [[0.6,-1],[-0.7,-1],[-0.7,0],[-0.1,0],[],[-0.7,0],[-0.7,1],[0.6,1]],
    F: [[0.6,-1],[-0.7,-1],[-0.7,0],[-0.1,0],[],[-0.7,0],[-0.7,1]],
    G: [[0.6,-0.7],[0,-1],[-0.7,-0.5],[-0.7,0.5],[0,1],[0.7,0.7],[0.7,0.1],[0.1,0.1]],
    H: [[-0.7,-1],[-0.7,1],[],[-0.7,0],[0.7,0],[],[0.7,-1],[0.7,1]],
    I: [[-0.3,-1],[0.3,-1],[],[0,-1],[0,1],[],[-0.3,1],[0.3,1]],
    J: [[-0.3,-1],[0.5,-1],[],[0.5,-1],[0.5,0.6],[0,1],[-0.5,0.6]],
    K: [[-0.7,-1],[-0.7,1],[],[-0.7,0],[0.7,-1],[],[-0.7,0],[0.7,1]],
    L: [[-0.7,-1],[-0.7,1],[0.6,1]],
    M: [[-0.8,1],[-0.8,-1],[0,-0.1],[0.8,-1],[0.8,1]],
    N: [[-0.7,1],[-0.7,-1],[0.7,1],[0.7,-1]],
    O: [[0,-1],[-0.7,-0.5],[-0.7,0.5],[0,1],[0.7,0.5],[0.7,-0.5],[0,-1]],
    P: [[-0.7,1],[-0.7,-1],[0.3,-1],[0.7,-0.5],[0.3,0],[-0.7,0]],
    Q: [[0,-1],[-0.7,-0.5],[-0.7,0.5],[0,1],[0.7,0.5],[0.7,-0.5],[0,-1],[],[0.3,0.5],[0.8,1.1]],
    R: [[-0.7,1],[-0.7,-1],[0.3,-1],[0.7,-0.5],[0.3,0],[-0.7,0],[],[0,0],[0.7,1]],
    S: [[0.6,-0.7],[0,-1],[-0.6,-0.7],[-0.5,0],[0.5,0.3],[0.6,0.7],[0,1],[-0.6,0.7]],
    T: [[-0.8,-1],[0.8,-1],[],[0,-1],[0,1]],
    U: [[-0.7,-1],[-0.7,0.5],[0,1],[0.7,0.5],[0.7,-1]],
    V: [[-0.8,-1],[0,1],[0.8,-1]],
    W: [[-0.9,-1],[-0.4,1],[0,0],[0.4,1],[0.9,-1]],
    X: [[-0.7,-1],[0.7,1],[],[0.7,-1],[-0.7,1]],
    Y: [[-0.7,-1],[0,0],[0.7,-1],[],[0,0],[0,1]],
    Z: [[-0.7,-1],[0.7,-1],[-0.7,1],[0.7,1]],
  };

  const glyph = glyphs[char.toUpperCase()];
  if (!glyph) return [{ x: cx, y: cy, pressure: 0.5 }];

  for (const pt of glyph) {
    if (pt.length === 0) {
      // Pen-up marker — skip, we handle it below
      points.push({ x: -1, y: -1, pressure: 0 }); // sentinel
      continue;
    }
    points.push({
      x: cx + pt[0] * scaleX,
      y: cy + pt[1] * scaleY,
      pressure: 0.5,
    });
  }
  return points;
}

function digitPath(digit: string, w: number, h: number, pad: number): Point[] {
  const cx = w / 2;
  const cy = h / 2;
  const sx = (w - pad * 2) * 0.35;
  const sy = (h - pad * 2) * 0.4;

  const glyphs: Record<string, ([] | [number, number])[]> = {
    "0": [[0,-1],[-0.7,-0.5],[-0.7,0.5],[0,1],[0.7,0.5],[0.7,-0.5],[0,-1]],
    "1": [[-0.3,-0.5],[0,-1],[0,1],[],[-0.4,1],[0.4,1]],
    "2": [[-0.6,-0.7],[0,-1],[0.6,-0.7],[0.5,0],[-0.7,1],[0.7,1]],
    "3": [[-0.5,-1],[0.5,-1],[0.5,-0.1],[-0.1,0],[],[0.5,0],[0.5,1],[-0.5,1]],
    "4": [[-0.6,-1],[-0.6,0.1],[0.6,0.1],[],[0.6,-1],[0.6,1]],
    "5": [[0.6,-1],[-0.6,-1],[-0.6,0],[0.5,0],[0.6,0.5],[0,1],[-0.6,0.7]],
    "6": [[0.5,-1],[0,-1],[-0.6,-0.3],[-0.6,0.5],[0,1],[0.6,0.5],[0.6,0],[0,0],[-0.6,0.2]],
    "7": [[-0.6,-1],[0.6,-1],[0,1]],
    "8": [[0,-0.05],[-0.5,-0.5],[0,-1],[0.5,-0.5],[0,-0.05],[-0.6,0.4],[0,1],[0.6,0.4],[0,-0.05]],
    "9": [[-0.5,1],[0.5,0.3],[0.5,-0.5],[0,-1],[-0.5,-0.5],[-0.5,0],[0,0],[0.5,-0.2]],
  };

  const glyph = glyphs[digit];
  if (!glyph) return [{ x: cx, y: cy, pressure: 0.5 }];

  const points: Point[] = [];
  for (const pt of glyph) {
    if (pt.length === 0) {
      points.push({ x: -1, y: -1, pressure: 0 });
      continue;
    }
    points.push({ x: cx + pt[0] * sx, y: cy + pt[1] * sy, pressure: 0.5 });
  }
  return points;
}

function mathSymbolPath(symbol: string, w: number, h: number, pad: number): Point[] {
  const cx = w / 2;
  const cy = h / 2;
  const s = (w - pad * 2) * 0.35;
  const points: Point[] = [];

  const glyphs: Record<string, ([] | [number, number])[]> = {
    "+": [[0,-0.7],[0,0.7],[],[-0.7,0],[0.7,0]],
    "-": [[-0.7,0],[0.7,0]],
    "×": [[-0.6,-0.6],[0.6,0.6],[],[0.6,-0.6],[-0.6,0.6]],
    "÷": [[-0.7,0],[0.7,0],[],[0,-0.6],[0,-0.55],[],[0,0.55],[0,0.6]],
    "=": [[-0.7,-0.25],[0.7,-0.25],[],[-0.7,0.25],[0.7,0.25]],
    "π": [[-0.7,-0.7],[0.7,-0.7],[],[-0.3,-0.7],[-0.3,0.7],[],[0.3,-0.7],[0.4,0.7]],
  };

  const glyph = glyphs[symbol];
  if (!glyph) return [{ x: cx, y: cy, pressure: 0.5 }];

  for (const pt of glyph) {
    if (pt.length === 0) { points.push({ x: -1, y: -1, pressure: 0 }); continue; }
    points.push({ x: cx + pt[0] * s, y: cy + pt[1] * s, pressure: 0.5 });
  }
  return points;
}

function shapePath(shape: string, w: number, h: number, pad: number): Point[] {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - pad - 20;
  const points: Point[] = [];

  switch (shape) {
    case "circle":
      for (let i = 0; i <= 40; i++) {
        const angle = (i / 40) * Math.PI * 2 - Math.PI / 2;
        points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, pressure: 0.5 });
      }
      break;
    case "triangle":
      points.push({ x: cx, y: cy - r, pressure: 0.5 });
      points.push({ x: cx + r * 0.87, y: cy + r * 0.5, pressure: 0.5 });
      points.push({ x: cx - r * 0.87, y: cy + r * 0.5, pressure: 0.5 });
      points.push({ x: cx, y: cy - r, pressure: 0.5 });
      break;
    case "square":
      points.push({ x: cx - r * 0.7, y: cy - r * 0.7, pressure: 0.5 });
      points.push({ x: cx + r * 0.7, y: cy - r * 0.7, pressure: 0.5 });
      points.push({ x: cx + r * 0.7, y: cy + r * 0.7, pressure: 0.5 });
      points.push({ x: cx - r * 0.7, y: cy + r * 0.7, pressure: 0.5 });
      points.push({ x: cx - r * 0.7, y: cy - r * 0.7, pressure: 0.5 });
      break;
    case "star": {
      const spikes = 5;
      const outerR = r;
      const innerR = r * 0.4;
      for (let i = 0; i <= spikes * 2; i++) {
        const rad = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        points.push({ x: cx + Math.cos(angle) * rad, y: cy + Math.sin(angle) * rad, pressure: 0.5 });
      }
      points.push(points[0]); // close
      break;
    }
  }
  return points;
}

// ── Target definitions ──

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DIGITS = "0123456789".split("");
const MATH_SYMBOLS = ["+", "-", "×", "÷", "=", "π"];
const SHAPES = ["circle", "triangle", "square", "star"];

const SHAPE_DESCRIPTIONS: Record<string, string> = {
  circle: "A circle has no corners and every point is equally distant from the center.",
  triangle: "A triangle has 3 sides and 3 angles that add up to 180°.",
  square: "A square has 4 equal sides and 4 right angles.",
  star: "A five-pointed star has 5 outer vertices and 5 inner vertices.",
};

const MATH_DESCRIPTIONS: Record<string, string> = {
  "+": "Plus — the addition symbol combines two numbers.",
  "-": "Minus — the subtraction symbol finds the difference.",
  "×": "Times — the multiplication symbol for repeated addition.",
  "÷": "Divided by — splits a number into equal parts.",
  "=": "Equals — shows two sides have the same value.",
  "π": "Pi — approximately 3.14159, the ratio of circumference to diameter.",
};

function getTargets(category: Category, count: number): TraceTarget[] {
  const targets: TraceTarget[] = [];
  let pool: string[];

  switch (category) {
    case "letters": pool = [...LETTERS]; break;
    case "numbers": pool = [...DIGITS]; break;
    case "math": pool = [...MATH_SYMBOLS]; break;
    case "shapes": pool = [...SHAPES]; break;
  }

  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const item = pool[i];
    let getPath: TraceTarget["getPath"];
    let desc: string;

    switch (category) {
      case "letters":
        getPath = (w, h, p) => letterPath(item, w, h, p);
        desc = `The letter "${item}" — used in words like "${getWordForLetter(item)}"`;
        break;
      case "numbers":
        getPath = (w, h, p) => digitPath(item, w, h, p);
        desc = `The number ${item}${item === "0" ? " — represents nothing or the starting point" : ""}`;
        break;
      case "math":
        getPath = (w, h, p) => mathSymbolPath(item, w, h, p);
        desc = MATH_DESCRIPTIONS[item] || `Math symbol: ${item}`;
        break;
      case "shapes":
        getPath = (w, h, p) => shapePath(item, w, h, p);
        desc = SHAPE_DESCRIPTIONS[item] || `Shape: ${item}`;
        break;
    }

    targets.push({ id: `${category}-${item}-${i}`, category, label: item, description: desc!, getPath: getPath! });
  }

  return targets;
}

function getWordForLetter(letter: string): string {
  const words: Record<string, string> = {
    A: "Apple", B: "Ball", C: "Cat", D: "Dog", E: "Elephant", F: "Fish", G: "Grape",
    H: "House", I: "Ice", J: "Juice", K: "Kite", L: "Lemon", M: "Moon", N: "Nest",
    O: "Orange", P: "Pen", Q: "Queen", R: "Rain", S: "Sun", T: "Tree", U: "Umbrella",
    V: "Violin", W: "Water", X: "Xylophone", Y: "Yarn", Z: "Zebra",
  };
  return words[letter.toUpperCase()] || letter;
}

// ── Accuracy calculation ──

function calculateAccuracy(userPoints: Point[], guidePath: Point[], tolerance: number): number {
  if (userPoints.length < 3) return 0;

  // Filter out sentinel points from guide
  const guideSegments: Point[][] = [];
  let currentSegment: Point[] = [];
  for (const p of guidePath) {
    if (p.x < 0) {
      if (currentSegment.length > 0) { guideSegments.push(currentSegment); currentSegment = []; }
      continue;
    }
    currentSegment.push(p);
  }
  if (currentSegment.length > 0) guideSegments.push(currentSegment);

  const allGuide = guideSegments.flat();
  if (allGuide.length === 0) return 0;

  let closeCount = 0;
  for (const up of userPoints) {
    let minDist = Infinity;
    for (const gp of allGuide) {
      const d = Math.sqrt((up.x - gp.x) ** 2 + (up.y - gp.y) ** 2);
      if (d < minDist) minDist = d;
    }
    if (minDist <= tolerance) closeCount++;
  }

  const pointAccuracy = closeCount / userPoints.length;

  // Coverage: how much of the guide was traced near
  let coverCount = 0;
  for (const gp of allGuide) {
    let minDist = Infinity;
    for (const up of userPoints) {
      const d = Math.sqrt((up.x - gp.x) ** 2 + (up.y - gp.y) ** 2);
      if (d < minDist) minDist = d;
    }
    if (minDist <= tolerance * 1.5) coverCount++;
  }
  const coverage = coverCount / allGuide.length;

  return Math.round(Math.min(100, (pointAccuracy * 0.5 + coverage * 0.5) * 100));
}

// ── Educational tips ──

const TIPS = [
  "Tracing helps build muscle memory for writing.",
  "Letters and numbers are the building blocks of communication.",
  "Practice writing slowly and neatly before going fast.",
  "Math symbols represent operations we use every day.",
  "Shapes are found everywhere in nature and architecture.",
  "Good handwriting improves reading comprehension.",
  "The pencil was invented in 1564 in England.",
  "There are over 100,000 characters in Unicode!",
];

// ── Component ──

export function TraceLearnGame() {
  useGameMusic();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const userPointsRef = useRef<Point[]>([]);

  const [scale, setScale] = useState(1);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [countdownVal, setCountdownVal] = useState(COUNTDOWN_SECS);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [level, setLevel] = useState(1);
  const [category, setCategory] = useState<Category>("letters");
  const [difficulty, setDifficulty] = useState(5);
  const [targets, setTargets] = useState<TraceTarget[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [roundAccuracies, setRoundAccuracies] = useState<number[]>([]);
  const [lastAccuracy, setLastAccuracy] = useState<number | null>(null);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("traceLearn_highScore"));
  const [tipIndex, setTipIndex] = useState(0);
  const [showBonus, setShowBonus] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<Array<{ medalId: string; name: string; tier: MedalTier }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [guidePath, setGuidePath] = useState<Point[]>([]);

  // Responsive scaling
  useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return;
      setScale(Math.min(1, containerRef.current.clientWidth / GAME_WIDTH));
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdownVal <= 0) {
      sfxCountdownGo();
      setPhase("playing");
      return;
    }
    sfxCountdown();
    const t = setTimeout(() => setCountdownVal((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdownVal]);

  // Tip rotation
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 8000);
    return () => clearInterval(t);
  }, [phase]);

  // Setup canvas and draw guide when target changes
  useEffect(() => {
    if (phase !== "playing" || targets.length === 0) return;
    const target = targets[currentIndex];
    if (!target) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = GAME_WIDTH * dpr;
    canvas.height = GAME_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const path = target.getPath(GAME_WIDTH, GAME_HEIGHT, CANVAS_PADDING);
    setGuidePath(path);
    userPointsRef.current = [];
    drawCanvas(ctx, path, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIndex, targets]);

  const drawCanvas = useCallback((ctx: CanvasRenderingContext2D, guide: Point[], userPts: Point[]) => {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw guide path (faint)
    const segments: Point[][] = [];
    let currentSeg: Point[] = [];
    for (const p of guide) {
      if (p.x < 0) {
        if (currentSeg.length > 0) { segments.push(currentSeg); currentSeg = []; }
        continue;
      }
      currentSeg.push(p);
    }
    if (currentSeg.length > 0) segments.push(currentSeg);

    for (const seg of segments) {
      if (seg.length < 2) {
        // Dot
        if (seg.length === 1) {
          ctx.fillStyle = "rgba(148,163,184,0.35)";
          ctx.beginPath();
          ctx.arc(seg[0].x, seg[0].y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        continue;
      }
      ctx.strokeStyle = "rgba(148,163,184,0.25)";
      ctx.lineWidth = 20;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.moveTo(seg[0].x, seg[0].y);
      for (let i = 1; i < seg.length; i++) {
        ctx.lineTo(seg[i].x, seg[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Direction arrows
      if (seg.length > 3) {
        const startP = seg[0];
        ctx.fillStyle = "rgba(99,102,241,0.5)";
        ctx.beginPath();
        ctx.arc(startP.x, startP.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(99,102,241,0.9)";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("START", startP.x, startP.y - 16);
      }
    }

    // Draw user trace
    if (userPts.length > 1) {
      const color = CATEGORY_COLORS[targets[currentIndex]?.category || "letters"];

      // Draw with varying width based on pressure
      for (let i = 1; i < userPts.length; i++) {
        const prev = userPts[i - 1];
        const curr = userPts[i];
        if (prev.x < 0 || curr.x < 0) continue;
        const width = 4 + curr.pressure * 8;
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }, [targets, currentIndex]);

  // Start game
  const startGame = useCallback(() => {
    sfxClick();
    const newTargets = getTargets(category, ITEMS_PER_ROUND);
    setTargets(newTargets);
    setCurrentIndex(0);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setLevel(1);
    setRoundAccuracies([]);
    setLastAccuracy(null);
    userPointsRef.current = [];
    setCountdownVal(COUNTDOWN_SECS);
    setPhase("countdown");
    setAchievementQueue([]);
    setShowAchievementIndex(0);
  }, [category]);

  // Submit current trace
  const submitTrace = useCallback(() => {
    if (targets.length === 0) return;
    const userPts = userPointsRef.current;
    const tolerance = 15 + (10 - difficulty) * 5; // easier = more tolerance
    const acc = calculateAccuracy(userPts, guidePath, tolerance);
    setLastAccuracy(acc);

    const { mult } = getMultiplierFromStreak(combo);
    const points = Math.round(acc * mult);
    setScore((s) => s + points);

    if (acc >= 70) {
      sfxCorrect();
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > bestCombo) setBestCombo(newCombo);
      if (newCombo >= 5 && newCombo % 5 === 0) sfxCombo(newCombo);
    } else {
      sfxWrong();
      setCombo(0);
    }

    if (acc >= 90) {
      setShowBonus(true);
      setTimeout(() => setShowBonus(false), 1500);
    }

    setRoundAccuracies((prev) => [...prev, acc]);

    // Next target or finish
    if (currentIndex + 1 >= targets.length) {
      // Round complete
      sfxLevelUp();
      setPhase("result");
    } else {
      setCurrentIndex((i) => i + 1);
      userPointsRef.current = [];
    }
  }, [targets, guidePath, difficulty, combo, bestCombo, currentIndex]);

  // Continue to next round
  const nextRound = useCallback(() => {
    sfxClick();
    setLevel((l) => l + 1);
    const newTargets = getTargets(category, ITEMS_PER_ROUND);
    setTargets(newTargets);
    setCurrentIndex(0);
    setRoundAccuracies([]);
    setLastAccuracy(null);
    userPointsRef.current = [];
    setPhase("playing");
  }, [category]);

  // End game from result screen
  const finishGame = useCallback(() => {
    setPhase("complete");
    sfxGameOver();
    const finalScore = score;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      setLocalHighScore("traceLearn_highScore", finalScore);
    }
    trackGamePlayed("trace-learn", finalScore);
    const profile = getProfile();
    const avgAcc = roundAccuracies.length > 0 ? Math.round(roundAccuracies.reduce((a, b) => a + b, 0) / roundAccuracies.length) : 0;
    const newOnes = checkAchievements(
      { gameId: "trace-learn", score: finalScore, level, accuracy: avgAcc, bestCombo, bestStreak: bestCombo },
      profile.totalGamesPlayed, profile.gamesPlayedByGameId
    );
    if (newOnes.length > 0) { sfxAchievement(); setAchievementQueue(newOnes); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, highScore, level, roundAccuracies, bestCombo]);

  // Pointer handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pos = getPointerPos(canvas, e);
    userPointsRef.current = [pos];
  }, [phase]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const pos = getPointerPos(canvas, e);
    userPointsRef.current.push(pos);

    const ctx = canvas.getContext("2d");
    if (ctx) drawCanvas(ctx, guidePath, userPointsRef.current);
  }, [phase, guidePath, drawCanvas]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
  }, []);

  // Stats
  const avgAccuracy = roundAccuracies.length > 0 ? Math.round(roundAccuracies.reduce((a, b) => a + b, 0) / roundAccuracies.length) : 0;
  const currentTarget = targets[currentIndex];
  const diffLabel = difficulty <= 3 ? "Easy" : difficulty <= 6 ? "Medium" : "Strict";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060612] via-[#0a0e2a] to-[#060612] flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-[750px] px-4 pt-3 pb-1 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
          <Pencil className="w-4 h-4 text-indigo-400" /> Trace & Learn
        </h1>
        <AudioToggles />
      </div>

      {/* HUD */}
      {phase === "playing" && currentTarget && (
        <div className="w-full max-w-[750px] px-4 mb-1">
          <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{currentIndex + 1}/{targets.length}</span>
              <span className="font-bold text-lg" style={{ color: CATEGORY_COLORS[currentTarget.category] }}>
                {currentTarget.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span>Lv {level}</span>
              {lastAccuracy !== null && <span className="text-green-400">{lastAccuracy}%</span>}
              <StreakBadge streak={combo} />
              <span className="text-lg font-bold text-white">{score.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Game container */}
      <div ref={containerRef} className="relative w-full max-w-[750px] mx-auto px-4">
        <div
          className="relative mx-auto overflow-hidden rounded-2xl border border-white/[0.06] shadow-2xl"
          style={{
            width: GAME_WIDTH * scale,
            height: GAME_HEIGHT * scale,
            background: "linear-gradient(180deg, #060818 0%, #0a0f35 40%, #0e154a 70%, #121850 100%)",
          }}
        >
          <div className="absolute inset-0" style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: GAME_WIDTH, height: GAME_HEIGHT }}>

            {/* Achievement toast */}
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

            <BonusToast show={showBonus} text="Excellent trace!" points={50} />

            {/* MENU */}
            {phase === "menu" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-8">
                <Pencil className="w-12 h-12 text-indigo-400 mb-3" />
                <h2 className="text-3xl font-bold text-white mb-1">Trace & Learn</h2>
                <p className="text-slate-500 text-center text-sm mb-5">Trace letters, numbers, symbols, and shapes!</p>

                {highScore > 0 && (
                  <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-yellow-500" /> Best: {highScore.toLocaleString()}
                  </div>
                )}

                {/* Category selector */}
                <div className="w-full max-w-xs mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-400">Category</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(["letters", "numbers", "math", "shapes"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => { setCategory(c); sfxClick(); }}
                        className={`py-2 rounded-lg text-xs font-medium transition-all capitalize ${category === c ? "text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
                        style={category === c ? { backgroundColor: CATEGORY_COLORS[c] + "40", color: CATEGORY_COLORS[c] } : {}}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty slider */}
                <div className="w-full max-w-xs mb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-400">Strictness</span>
                    <span className="text-xs font-bold text-indigo-400">{diffLabel} ({difficulty}/10)</span>
                  </div>
                  <input type="range" min={1} max={10} step={1} value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} className="w-full accent-indigo-500" />
                </div>

                <button onClick={startGame} className="px-10 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25">
                  Play
                </button>
              </div>
            )}

            {/* COUNTDOWN */}
            {phase === "countdown" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <div className="text-8xl font-bold text-indigo-400 animate-pulse">{countdownVal > 0 ? countdownVal : "GO!"}</div>
              </div>
            )}

            {/* PLAYING — Canvas */}
            {phase === "playing" && currentTarget && (
              <>
                <canvas
                  ref={canvasRef}
                  style={{ width: GAME_WIDTH, height: GAME_HEIGHT, cursor: "crosshair", touchAction: "none" }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                />
                {/* Description */}
                <div className="absolute top-3 left-4 right-4 text-center">
                  <span className="text-xs text-slate-400">{currentTarget.description}</span>
                </div>
                {/* Submit button */}
                <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1">
                  <button
                    onClick={submitTrace}
                    className="px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 text-sm flex items-center gap-1.5"
                  >
                    Submit <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] text-slate-600 italic">{TIPS[tipIndex]}</span>
                </div>
              </>
            )}

            {/* RESULT — Round summary */}
            {phase === "result" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/40 backdrop-blur-sm px-6">
                <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 mb-2 animate-bounce" />
                <h3 className="text-2xl font-bold text-white mb-1">Round {level} Complete!</h3>
                <div className="text-3xl font-bold text-indigo-400 mb-2">{score.toLocaleString()}</div>
                <div className="text-sm text-green-400 mb-4">Avg Accuracy: {avgAccuracy}%</div>
                <div className="flex flex-wrap justify-center gap-2 mb-4 max-w-sm">
                  {roundAccuracies.map((acc, i) => (
                    <div key={i} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${acc >= 70 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {targets[i]?.label}: {acc}%
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={nextRound} className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl flex items-center gap-2 text-sm transition-all">
                    Next Round <ChevronRight className="w-4 h-4" />
                  </button>
                  <button onClick={finishGame} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-sm transition-all">
                    Finish
                  </button>
                </div>
              </div>
            )}

            {/* COMPLETE */}
            {phase === "complete" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/50 backdrop-blur-sm px-6">
                <Trophy className="w-12 h-12 text-yellow-400 mb-2" />
                <h3 className="text-2xl font-bold text-white mb-2">Great Work!</h3>
                <div className="text-4xl font-bold text-indigo-400 mb-3">{score.toLocaleString()}</div>
                <div className="grid grid-cols-3 gap-3 mb-3 text-center w-full max-w-sm">
                  <div><div className="text-xl font-bold text-white">{level}</div><div className="text-[9px] text-slate-500 uppercase">Rounds</div></div>
                  <div><div className="text-xl font-bold text-green-400">{avgAccuracy}%</div><div className="text-[9px] text-slate-500 uppercase">Accuracy</div></div>
                  <div><div className="text-xl font-bold text-yellow-400">x{bestCombo}</div><div className="text-[9px] text-slate-500 uppercase">Combo</div></div>
                </div>
                <div className="mb-2 w-full max-w-xs">
                  <ScoreSubmit game="trace-learn" score={score} level={level} stats={{ accuracy: `${avgAccuracy}%`, category, bestCombo }} />
                </div>
                <div className="flex gap-3 mt-2">
                  <button onClick={startGame} className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl flex items-center gap-2 text-sm transition-all">
                    <RotateCcw className="w-4 h-4" /> Again
                  </button>
                  <Link href="/games" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-sm transition-all">
                    Back
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
