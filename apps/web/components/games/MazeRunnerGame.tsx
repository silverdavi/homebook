"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Heart, Trophy, RotateCcw, Star, Compass } from "lucide-react";
import Link from "next/link";

import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import type { MedalTier } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import {
  sfxCorrect, sfxWrong, sfxCombo, sfxLevelUp, sfxGameOver,
  sfxCountdown, sfxCountdownGo, sfxClick, sfxAchievement,
} from "@/lib/games/audio";

// ── Types ──

type GamePhase = "menu" | "countdown" | "playing" | "question" | "complete";
type Subject = "math" | "science" | "mixed";

interface Cell {
  x: number;
  y: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
}

interface MazeQuestion {
  question: string;
  answers: string[];
  correctIndex: number;
  tip: string;
}

// ── Constants ──

const GAME_WIDTH = 700;
const GAME_HEIGHT = 600;
const INITIAL_LIVES = 5;
const COUNTDOWN_SECS = 3;

const NEON_WALL = "#6366f1";
const NEON_PLAYER = "#22d3ee";
const NEON_GOAL = "#facc15";
const NEON_TRAIL = "rgba(99,102,241,0.25)";
const NEON_CORRECT = "#4ade80";

// ── Question generation ──

function genMathQ(difficulty: number): MazeQuestion {
  const ops = ["+", "-", "×"];
  if (difficulty > 3) ops.push("÷");
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;
  const range = Math.min(5 + difficulty * 3, 50);

  switch (op) {
    case "+":
      a = Math.floor(Math.random() * range) + 1;
      b = Math.floor(Math.random() * range) + 1;
      answer = a + b;
      break;
    case "-":
      a = Math.floor(Math.random() * range) + 1;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    case "×":
      a = Math.floor(Math.random() * Math.min(range, 12)) + 1;
      b = Math.floor(Math.random() * Math.min(range, 12)) + 1;
      answer = a * b;
      break;
    default: // ÷
      b = Math.floor(Math.random() * 10) + 2;
      answer = Math.floor(Math.random() * 10) + 1;
      a = b * answer;
      break;
  }

  const wrongAnswers = new Set<number>();
  let _sc = 0;
  while (wrongAnswers.size < 3 && _sc++ < 100) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const wrong = answer + (offset === 0 ? 1 : offset);
    if (wrong !== answer && wrong >= 0) wrongAnswers.add(wrong);
  }
  for (let i = 1; wrongAnswers.size < 3; i++) {
    if (answer + i !== answer) wrongAnswers.add(answer + i);
    if (wrongAnswers.size < 3 && answer - i > 0) wrongAnswers.add(answer - i);
  }

  const answers = [answer, ...Array.from(wrongAnswers).slice(0, 3)];
  const shuffled = answers.sort(() => Math.random() - 0.5);
  const correctIndex = shuffled.indexOf(answer);

  const tips = [
    "Addition is the most basic math operation.",
    "Subtraction is the inverse of addition.",
    "Multiplication is repeated addition.",
    "Division splits a number into equal parts.",
    "Mental math gets faster with practice!",
    "Break big problems into smaller steps.",
  ];

  return {
    question: `${a} ${op} ${b} = ?`,
    answers: shuffled.map(String),
    correctIndex,
    tip: tips[Math.floor(Math.random() * tips.length)],
  };
}

function genScienceQ(): MazeQuestion {
  const questions: MazeQuestion[] = [
    { question: "Water boils at 100°C", answers: ["True", "False"], correctIndex: 0, tip: "Water boils at 100°C (212°F) at standard atmospheric pressure." },
    { question: "The Sun is a planet", answers: ["True", "False"], correctIndex: 1, tip: "The Sun is a star, not a planet. It provides light and heat to our solar system." },
    { question: "Plants produce oxygen", answers: ["True", "False"], correctIndex: 0, tip: "During photosynthesis, plants convert CO₂ and water into glucose and oxygen." },
    { question: "Sound travels faster than light", answers: ["True", "False"], correctIndex: 1, tip: "Light travels at ~300,000 km/s while sound travels at ~343 m/s in air." },
    { question: "The Moon has its own light", answers: ["True", "False"], correctIndex: 1, tip: "The Moon reflects sunlight. It doesn't produce its own light." },
    { question: "Gravity pulls objects toward Earth", answers: ["True", "False"], correctIndex: 0, tip: "Gravity is the force that attracts objects with mass toward each other." },
    { question: "Diamonds are made of carbon", answers: ["True", "False"], correctIndex: 0, tip: "Diamonds form when carbon atoms are compressed under extreme pressure." },
    { question: "Humans have 206 bones", answers: ["True", "False"], correctIndex: 0, tip: "Adult humans have 206 bones, but babies are born with about 270." },
    { question: "Mars is called the Blue Planet", answers: ["True", "False"], correctIndex: 1, tip: "Mars is the Red Planet. Earth is called the Blue Planet." },
    { question: "Electrons have a negative charge", answers: ["True", "False"], correctIndex: 0, tip: "Electrons carry a negative charge, protons carry positive." },
    { question: "Fish are mammals", answers: ["True", "False"], correctIndex: 1, tip: "Fish are not mammals — they breathe through gills and are cold-blooded." },
    { question: "The Earth rotates once every 24 hours", answers: ["True", "False"], correctIndex: 0, tip: "Earth's rotation on its axis takes approximately 24 hours." },
  ];
  return questions[Math.floor(Math.random() * questions.length)];
}

function generateQuestion(subject: Subject, difficulty: number): MazeQuestion {
  if (subject === "math") return genMathQ(difficulty);
  if (subject === "science") return genScienceQ();
  return Math.random() > 0.5 ? genMathQ(difficulty) : genScienceQ();
}

// ── Maze generation (recursive backtracking) ──

function generateMaze(cols: number, rows: number): Cell[][] {
  const grid: Cell[][] = [];
  for (let y = 0; y < rows; y++) {
    grid[y] = [];
    for (let x = 0; x < cols; x++) {
      grid[y][x] = { x, y, walls: { top: true, right: true, bottom: true, left: true }, visited: false };
    }
  }

  const stack: Cell[] = [];
  const start = grid[0][0];
  start.visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: Cell[] = [];
    const { x, y } = current;

    if (y > 0 && !grid[y - 1][x].visited) neighbors.push(grid[y - 1][x]);
    if (x < cols - 1 && !grid[y][x + 1].visited) neighbors.push(grid[y][x + 1]);
    if (y < rows - 1 && !grid[y + 1][x].visited) neighbors.push(grid[y + 1][x]);
    if (x > 0 && !grid[y][x - 1].visited) neighbors.push(grid[y][x - 1]);

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      // Remove walls
      if (next.y < current.y) { current.walls.top = false; next.walls.bottom = false; }
      if (next.x > current.x) { current.walls.right = false; next.walls.left = false; }
      if (next.y > current.y) { current.walls.bottom = false; next.walls.top = false; }
      if (next.x < current.x) { current.walls.left = false; next.walls.right = false; }
      next.visited = true;
      stack.push(next);
    }
  }

  return grid;
}

// Find question fork cells — cells with 3+ openings (junctions)
function findForkCells(grid: Cell[][]): [number, number][] {
  const forks: [number, number][] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x];
      const openings = [!cell.walls.top, !cell.walls.right, !cell.walls.bottom, !cell.walls.left].filter(Boolean).length;
      if (openings >= 3) forks.push([x, y]);
    }
  }
  return forks;
}

// ── Educational tips ──

const TIPS = [
  "Mazes help develop spatial reasoning and problem-solving skills.",
  "The shortest path through a maze is called the solution path.",
  "Recursive backtracking is one of the simplest maze algorithms.",
  "Following the right-hand wall will solve any simply-connected maze.",
  "Planning ahead helps you avoid dead ends in mazes.",
  "Mental math improves your processing speed for everyday tasks.",
  "The word 'maze' comes from a Scandinavian word meaning confusion.",
  "Science facts become easier to remember with active recall practice.",
];

// ── Component ──

export function MazeRunnerGame() {
  useGameMusic();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const trailRef = useRef<Set<string>>(new Set());
  const forkQuestionsRef = useRef<Map<string, boolean>>(new Map());

  const [scale, setScale] = useState(1);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [countdownVal, setCountdownVal] = useState(COUNTDOWN_SECS);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [level, setLevel] = useState(1);
  const [mazeSize, setMazeSize] = useState(7);
  const [subject, setSubject] = useState<Subject>("math");
  const [maze, setMaze] = useState<Cell[][] | null>(null);
  const [playerPos, setPlayerPos] = useState<[number, number]>([0, 0]);
  const [goalPos, setGoalPos] = useState<[number, number]>([0, 0]);
  const [questionsCorrect, setQuestionsCorrect] = useState(0);
  const [questionsTotal, setQuestionsTotal] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<MazeQuestion | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("mazeRunner_highScore"));
  const [tipIndex, setTipIndex] = useState(0);
  const [achievementQueue, setAchievementQueue] = useState<Array<{ medalId: string; name: string; tier: MedalTier }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [dragStartCell, setDragStartCell] = useState<[number, number] | null>(null);

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
      setStartTime(Date.now());
      return;
    }
    sfxCountdown();
    const t = setTimeout(() => setCountdownVal((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdownVal]);

  // Timer
  useEffect(() => {
    if (phase !== "playing" && phase !== "question") return;
    const t = setInterval(() => {
      setElapsedSecs(Math.floor((Date.now() - startTime) / 1000));
    }, 500);
    return () => clearInterval(t);
  }, [phase, startTime]);

  // Tip rotation
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 8000);
    return () => clearInterval(t);
  }, [phase]);

  // Game over check
  useEffect(() => {
    if (lives > 0) return;
    endGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lives]);

  const endGame = useCallback(() => {
    setPhase("complete");
    sfxGameOver();
    const finalScore = score;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      setLocalHighScore("mazeRunner_highScore", finalScore);
    }
    trackGamePlayed("maze-runner", finalScore);
    const profile = getProfile();
    const acc = questionsTotal > 0 ? Math.round((questionsCorrect / questionsTotal) * 100) : 100;
    const newOnes = checkAchievements(
      { gameId: "maze-runner", score: finalScore, level, accuracy: acc, bestCombo, bestStreak: bestCombo },
      profile.totalGamesPlayed, profile.gamesPlayedByGameId
    );
    if (newOnes.length > 0) { sfxAchievement(); setAchievementQueue(newOnes); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, highScore, level, questionsCorrect, questionsTotal, bestCombo]);

  // Start game
  const startGame = useCallback(() => {
    sfxClick();
    const cols = mazeSize;
    const rows = mazeSize;
    const newMaze = generateMaze(cols, rows);
    setMaze(newMaze);
    setPlayerPos([0, 0]);
    setGoalPos([cols - 1, rows - 1]);
    setScore(0);
    setLives(INITIAL_LIVES);
    setCombo(0);
    setBestCombo(0);
    setLevel(1);
    setQuestionsCorrect(0);
    setQuestionsTotal(0);
    setElapsedSecs(0);
    setCurrentQuestion(null);
    trailRef.current = new Set(["0,0"]);
    // Pre-mark fork cells
    const forks = findForkCells(newMaze);
    forkQuestionsRef.current = new Map();
    forks.forEach(([fx, fy]) => forkQuestionsRef.current.set(`${fx},${fy}`, false));
    setCountdownVal(COUNTDOWN_SECS);
    setPhase("countdown");
    setAchievementQueue([]);
    setShowAchievementIndex(0);
  }, [mazeSize]);

  // Move player
  const movePlayer = useCallback((nx: number, ny: number) => {
    if (phase !== "playing" || !maze) return;
    const [px, py] = playerPos;
    const cols = maze[0].length;
    const rows = maze.length;

    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;
    // Only move one cell at a time
    if (Math.abs(nx - px) + Math.abs(ny - py) !== 1) return;

    // Check wall
    const cell = maze[py][px];
    if (nx > px && cell.walls.right) return;
    if (nx < px && cell.walls.left) return;
    if (ny > py && cell.walls.bottom) return;
    if (ny < py && cell.walls.top) return;

    const key = `${nx},${ny}`;

    // Check if fork needs a question
    if (forkQuestionsRef.current.has(key) && !forkQuestionsRef.current.get(key)) {
      forkQuestionsRef.current.set(key, true);
      setCurrentQuestion(generateQuestion(subject, level));
      setPhase("question");
      // Store where they want to go
      setDragStartCell([nx, ny]);
      return;
    }

    sfxClick();
    setPlayerPos([nx, ny]);
    trailRef.current.add(key);

    // Check goal
    if (nx === goalPos[0] && ny === goalPos[1]) {
      // Level complete!
      sfxLevelUp();
      const timeBonus = Math.max(0, 300 - elapsedSecs * 2);
      const levelPoints = 100 + timeBonus + questionsCorrect * 50;
      const { mult } = getMultiplierFromStreak(combo);
      const earned = Math.round(levelPoints * mult);
      setScore((s) => s + earned);
      setLevel((l) => l + 1);

      // Generate next maze (progressively bigger every 2 levels)
      const nextSize = Math.min(mazeSize + Math.floor(level / 2) * 2, 15);
      const newMaze = generateMaze(nextSize, nextSize);
      setMaze(newMaze);
      setPlayerPos([0, 0]);
      setGoalPos([nextSize - 1, nextSize - 1]);
      trailRef.current = new Set(["0,0"]);
      const forks = findForkCells(newMaze);
      forkQuestionsRef.current = new Map();
      forks.forEach(([fx, fy]) => forkQuestionsRef.current.set(`${fx},${fy}`, false));
      setStartTime(Date.now());
    }
  }, [phase, maze, playerPos, goalPos, subject, level, elapsedSecs, questionsCorrect, combo, mazeSize]);

  // Answer question
  const answerQuestion = useCallback((ansIndex: number) => {
    if (!currentQuestion) return;
    setQuestionsTotal((t) => t + 1);

    if (ansIndex === currentQuestion.correctIndex) {
      sfxCorrect();
      setQuestionsCorrect((c) => c + 1);
      setCombo((c) => {
        const nc = c + 1;
        if (nc > bestCombo) setBestCombo(nc);
        if (nc >= 5 && nc % 5 === 0) sfxCombo(nc);
        return nc;
      });
      setScore((s) => s + 25);

      // Complete the move
      if (dragStartCell) {
        setPlayerPos(dragStartCell);
        trailRef.current.add(`${dragStartCell[0]},${dragStartCell[1]}`);

        // Check if this cell is the goal
        if (dragStartCell[0] === goalPos[0] && dragStartCell[1] === goalPos[1] && maze) {
          sfxLevelUp();
          const timeBonus = Math.max(0, 300 - elapsedSecs * 2);
          const levelPoints = 100 + timeBonus + (questionsCorrect + 1) * 50;
          const { mult } = getMultiplierFromStreak(combo + 1);
          const earned = Math.round(levelPoints * mult);
          setScore((s) => s + earned);
          setLevel((l) => l + 1);
          const nextSize = Math.min(mazeSize + Math.floor(level / 2) * 2, 15);
          const newMaze = generateMaze(nextSize, nextSize);
          setMaze(newMaze);
          setPlayerPos([0, 0]);
          setGoalPos([nextSize - 1, nextSize - 1]);
          trailRef.current = new Set(["0,0"]);
          const forks = findForkCells(newMaze);
          forkQuestionsRef.current = new Map();
          forks.forEach(([fx, fy]) => forkQuestionsRef.current.set(`${fx},${fy}`, false));
          setStartTime(Date.now());
        }
      }
    } else {
      sfxWrong();
      setCombo(0);
      setLives((l) => l - 1);
    }

    setCurrentQuestion(null);
    setDragStartCell(null);
    setPhase("playing");
  }, [currentQuestion, dragStartCell, goalPos, maze, elapsedSecs, questionsCorrect, combo, bestCombo, mazeSize, level]);

  // Canvas rendering
  useEffect(() => {
    if (phase !== "playing" && phase !== "question") return;
    if (!maze) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = GAME_WIDTH * dpr;
    canvas.height = GAME_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    function draw() {
      if (!ctx || !maze) return;
      const cols = maze[0].length;
      const rows = maze.length;
      const padding = 30;
      const cellW = (GAME_WIDTH - padding * 2) / cols;
      const cellH = (GAME_HEIGHT - padding * 2 - 30) / rows;
      const cellSize = Math.min(cellW, cellH);
      const offsetX = (GAME_WIDTH - cellSize * cols) / 2;
      const offsetY = (GAME_HEIGHT - cellSize * rows) / 2;

      // Clear
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Draw trail
      trailRef.current.forEach((key) => {
        const [tx, ty] = key.split(",").map(Number);
        ctx.fillStyle = NEON_TRAIL;
        ctx.fillRect(offsetX + tx * cellSize + 2, offsetY + ty * cellSize + 2, cellSize - 4, cellSize - 4);
      });

      // Draw walls
      ctx.strokeStyle = NEON_WALL;
      ctx.lineWidth = 2;
      ctx.shadowColor = NEON_WALL;
      ctx.shadowBlur = 6;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const cell = maze[y][x];
          const cx = offsetX + x * cellSize;
          const cy = offsetY + y * cellSize;

          if (cell.walls.top) {
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + cellSize, cy); ctx.stroke();
          }
          if (cell.walls.right) {
            ctx.beginPath(); ctx.moveTo(cx + cellSize, cy); ctx.lineTo(cx + cellSize, cy + cellSize); ctx.stroke();
          }
          if (cell.walls.bottom) {
            ctx.beginPath(); ctx.moveTo(cx, cy + cellSize); ctx.lineTo(cx + cellSize, cy + cellSize); ctx.stroke();
          }
          if (cell.walls.left) {
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + cellSize); ctx.stroke();
          }
        }
      }

      ctx.shadowBlur = 0;

      // Draw fork indicators (question marks at unvisited forks)
      forkQuestionsRef.current.forEach((answered, key) => {
        if (answered) return;
        const [fx, fy] = key.split(",").map(Number);
        const cx = offsetX + fx * cellSize + cellSize / 2;
        const cy = offsetY + fy * cellSize + cellSize / 2;
        ctx.fillStyle = "rgba(250,204,21,0.4)";
        ctx.font = `bold ${Math.max(12, cellSize * 0.4)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", cx, cy);
      });

      // Draw goal
      const gx = offsetX + goalPos[0] * cellSize + cellSize / 2;
      const gy = offsetY + goalPos[1] * cellSize + cellSize / 2;
      ctx.fillStyle = NEON_GOAL;
      ctx.shadowColor = NEON_GOAL;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      // Star shape
      const spikes = 5;
      const outerR = cellSize * 0.3;
      const innerR = cellSize * 0.15;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        const sx = gx + Math.cos(angle) * r;
        const sy = gy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw player
      const px = offsetX + playerPos[0] * cellSize + cellSize / 2;
      const py = offsetY + playerPos[1] * cellSize + cellSize / 2;
      ctx.fillStyle = NEON_PLAYER;
      ctx.shadowColor = NEON_PLAYER;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(px, py, cellSize * 0.28, 0, Math.PI * 2);
      ctx.fill();
      // Inner glow
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(px, py, cellSize * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, maze, playerPos, goalPos]);

  // Keyboard controls
  useEffect(() => {
    if (phase !== "playing") return;
    const handleKey = (e: KeyboardEvent) => {
      const [px, py] = playerPos;
      switch (e.key) {
        case "ArrowUp": case "w": case "W": movePlayer(px, py - 1); break;
        case "ArrowDown": case "s": case "S": movePlayer(px, py + 1); break;
        case "ArrowLeft": case "a": case "A": movePlayer(px - 1, py); break;
        case "ArrowRight": case "d": case "D": movePlayer(px + 1, py); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, playerPos, movePlayer]);

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
  }, [phase, startGame]);

  // Pointer/touch controls on canvas
  const handleCanvasPointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phase !== "playing" || !maze) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cx = (e.clientX - rect.left) * (canvas.width / dpr / rect.width);
    const cy = (e.clientY - rect.top) * (canvas.height / dpr / rect.height);

    const cols = maze[0].length;
    const rows = maze.length;
    const padding = 30;
    const cellW = (GAME_WIDTH - padding * 2) / cols;
    const cellH = (GAME_HEIGHT - padding * 2 - 30) / rows;
    const cellSize = Math.min(cellW, cellH);
    const offsetX = (GAME_WIDTH - cellSize * cols) / 2;
    const offsetY = (GAME_HEIGHT - cellSize * rows) / 2;

    const gridX = Math.floor((cx - offsetX) / cellSize);
    const gridY = Math.floor((cy - offsetY) / cellSize);

    if (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
      movePlayer(gridX, gridY);
    }
  }, [phase, maze, movePlayer]);

  // Stats
  const accuracy = questionsTotal > 0 ? Math.round((questionsCorrect / questionsTotal) * 100) : 100;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060612] via-[#0a0e2a] to-[#060612] flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-[750px] px-4 pt-3 pb-1 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-400" /> Maze Runner
        </h1>
        <AudioToggles />
      </div>

      {/* Live HUD */}
      {(phase === "playing" || phase === "question") && (
        <div className="w-full max-w-[750px] px-4 mb-1">
          <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                <Heart key={i} className={`w-4 h-4 transition-all duration-300 ${i < lives ? "text-red-400 fill-red-400" : "text-slate-800 scale-75"}`} />
              ))}
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span>Lv {level}</span>
              <span>{formatTime(elapsedSecs)}</span>
              <span className="text-green-400">{accuracy}%</span>
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

            {/* MENU */}
            {phase === "menu" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-8">
                <Compass className="w-12 h-12 text-indigo-400 mb-3" />
                <h2 className="text-3xl font-bold text-white mb-1">Maze Runner</h2>
                <p className="text-slate-500 text-center text-sm mb-5">Navigate the maze and answer questions at forks!</p>

                {highScore > 0 && (
                  <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-yellow-500" /> Best: {highScore.toLocaleString()}
                  </div>
                )}

                {/* Maze size slider */}
                <div className="w-full max-w-xs mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-400">Maze Size</span>
                    <span className="text-xs font-bold text-indigo-400">{mazeSize}×{mazeSize}</span>
                  </div>
                  <input type="range" min={7} max={15} step={2} value={mazeSize} onChange={(e) => setMazeSize(Number(e.target.value))} className="w-full accent-indigo-500" />
                </div>

                {/* Subject selector */}
                <div className="w-full max-w-xs mb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-400">Subject</span>
                  </div>
                  <div className="flex gap-2">
                    {(["math", "science", "mixed"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setSubject(s); sfxClick(); }}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize ${subject === s ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
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
            {(phase === "playing" || phase === "question") && (
              <>
                <canvas
                  ref={canvasRef}
                  style={{ width: GAME_WIDTH, height: GAME_HEIGHT, cursor: "pointer" }}
                  onPointerDown={handleCanvasPointer}
                  onPointerMove={(e) => {
                    if (e.buttons > 0) handleCanvasPointer(e);
                  }}
                />
                {/* Tip bar */}
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="text-[10px] text-slate-600 italic">{TIPS[tipIndex]}</span>
                </div>
              </>
            )}

            {/* QUESTION overlay */}
            {phase === "question" && currentQuestion && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60 backdrop-blur-sm">
                <div className="bg-slate-900/95 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                  <div className="text-center mb-4">
                    <span className="text-xs text-indigo-400 uppercase font-bold tracking-wider">Question</span>
                    <h3 className="text-xl font-bold text-white mt-1">{currentQuestion.question}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {currentQuestion.answers.map((ans, i) => (
                      <button
                        key={i}
                        onClick={() => answerQuestion(i)}
                        className="px-4 py-3 bg-white/5 hover:bg-indigo-500/30 border border-white/10 hover:border-indigo-400/50 rounded-xl text-white font-medium transition-all hover:scale-[1.02] active:scale-95"
                      >
                        {ans}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 text-center italic">{currentQuestion.tip}</p>
                </div>
              </div>
            )}

            {/* COMPLETE */}
            {phase === "complete" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/50 backdrop-blur-sm px-6">
                <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 mb-2 animate-bounce" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  {lives > 0 ? "Maze Conquered!" : "Game Over"}
                </h3>
                <div className="text-4xl font-bold text-indigo-400 mb-3">{score.toLocaleString()}</div>
                {score >= highScore && score > 0 && (
                  <div className="text-xs text-yellow-400 mb-2 flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> New High Score!
                  </div>
                )}
                <div className="grid grid-cols-4 gap-3 mb-3 text-center w-full max-w-sm">
                  <div><div className="text-xl font-bold text-white">{level}</div><div className="text-[9px] text-slate-500 uppercase">Level</div></div>
                  <div><div className="text-xl font-bold text-green-400">{accuracy}%</div><div className="text-[9px] text-slate-500 uppercase">Accuracy</div></div>
                  <div><div className="text-xl font-bold text-cyan-400">{formatTime(elapsedSecs)}</div><div className="text-[9px] text-slate-500 uppercase">Time</div></div>
                  <div><div className="text-xl font-bold text-yellow-400">x{bestCombo}</div><div className="text-[9px] text-slate-500 uppercase">Combo</div></div>
                </div>
                <div className="mb-2 w-full max-w-xs">
                  <ScoreSubmit game="maze-runner" score={score} level={level} stats={{ accuracy: `${accuracy}%`, time: formatTime(elapsedSecs), bestCombo }} />
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
