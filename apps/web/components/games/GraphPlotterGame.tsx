"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Star, Timer } from "lucide-react";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxCombo, sfxGameOver, sfxAchievement, sfxCountdown, sfxCountdownGo, sfxLevelUp, sfxStreakLost, sfxPerfect, sfxTick } from "@/lib/games/audio";
import Link from "next/link";
import { createAdaptiveState, adaptiveUpdate, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import { getGradeForLevel } from "@/lib/games/learning-guide";

// ── Types ──

type GamePhase = "menu" | "countdown" | "playing" | "complete";
type GameMode = "plot" | "slope" | "line";

interface PlotProblem {
  mode: "plot";
  targetX: number;
  targetY: number;
}

interface SlopeProblem {
  mode: "slope";
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  slope: string; // as fraction string or "undefined"
}

interface LineProblem {
  mode: "line";
  m: number;
  b: number;
  equation: string;
}

type Problem = PlotProblem | SlopeProblem | LineProblem;

// ── Problem generation ──

function generatePlotProblem(range: number): PlotProblem {
  return {
    mode: "plot",
    targetX: Math.floor(Math.random() * (range * 2 + 1)) - range,
    targetY: Math.floor(Math.random() * (range * 2 + 1)) - range,
  };
}

function generateSlopeProblem(range: number): SlopeProblem {
  const safeRange = Math.max(range, 2); // Ensure range >= 2 to avoid infinite loop
  const x1 = Math.floor(Math.random() * (safeRange * 2 - 2)) - safeRange + 1;
  let x2 = x1;
  let _sc = 0;
  while (x2 === x1 && _sc++ < 100) {
    x2 = Math.floor(Math.random() * (safeRange * 2 - 2)) - safeRange + 1;
  }
  if (x2 === x1) x2 = x1 + 1; // Fallback
  const y1 = Math.floor(Math.random() * (range * 2 - 2)) - range + 1;
  const y2 = Math.floor(Math.random() * (range * 2 - 2)) - range + 1;

  const dy = y2 - y1;
  const dx = x2 - x1;

  let slope: string;
  if (dx === 0) {
    slope = "undefined";
  } else {
    const g = gcd(Math.abs(dy), Math.abs(dx));
    const num = dy / g;
    const den = dx / g;
    if (den < 0) {
      // Normalize sign
      slope = den === -1 ? `${-num}` : `${-num}/${-den}`;
    } else {
      slope = den === 1 ? `${num}` : `${num}/${den}`;
    }
  }

  return {
    mode: "slope",
    p1: { x: x1, y: y1 },
    p2: { x: x2, y: y2 },
    slope,
  };
}

function generateLineProblem(range: number): LineProblem {
  // Simple slopes: -2, -1, -1/2, 0, 1/2, 1, 2
  const slopes = [-2, -1, -0.5, 0, 0.5, 1, 2];
  const m = slopes[Math.floor(Math.random() * slopes.length)];
  const maxB = Math.min(range, 5);
  const b = Math.floor(Math.random() * (maxB * 2 + 1)) - maxB;

  let eq: string;
  if (m === 0) {
    eq = `y = ${b}`;
  } else if (m === 1) {
    eq = b === 0 ? "y = x" : b > 0 ? `y = x + ${b}` : `y = x − ${Math.abs(b)}`;
  } else if (m === -1) {
    eq = b === 0 ? "y = −x" : b > 0 ? `y = −x + ${b}` : `y = −x − ${Math.abs(b)}`;
  } else if (m === 0.5) {
    eq = b === 0 ? "y = ½x" : b > 0 ? `y = ½x + ${b}` : `y = ½x − ${Math.abs(b)}`;
  } else if (m === -0.5) {
    eq = b === 0 ? "y = −½x" : b > 0 ? `y = −½x + ${b}` : `y = −½x − ${Math.abs(b)}`;
  } else {
    const mStr = m > 0 ? `${m}` : `−${Math.abs(m)}`;
    eq = b === 0 ? `y = ${mStr}x` : b > 0 ? `y = ${mStr}x + ${b}` : `y = ${mStr}x − ${Math.abs(b)}`;
  }

  return { mode: "line", m, b, equation: eq };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function generateProblem(mode: GameMode, range: number): Problem {
  switch (mode) {
    case "plot": return generatePlotProblem(range);
    case "slope": return generateSlopeProblem(range);
    case "line": return generateLineProblem(range);
  }
}

// ── Tips ──

const TIPS: Record<GameMode, string[]> = {
  plot: [
    "The x-axis is horizontal, y-axis is vertical.",
    "Positive x goes right, negative x goes left.",
    "Positive y goes up, negative y goes down.",
    "The origin (0, 0) is where axes cross.",
  ],
  slope: [
    "Slope = rise / run = (y₂ − y₁) / (x₂ − x₁)",
    "Positive slope: line goes up from left to right.",
    "Negative slope: line goes down from left to right.",
    "Zero slope means a horizontal line.",
  ],
  line: [
    "y = mx + b: m is slope, b is y-intercept.",
    "Start at the y-intercept (0, b) on the y-axis.",
    "Use the slope to find a second point.",
    "Slope ½ means: go right 2, up 1.",
  ],
};

const COUNTDOWN_SECS = 3;

// ── Adaptive → graph plotter params ──

function getAdaptiveGridRange(level: number): number {
  if (level <= 10) return 5;
  if (level <= 20) return 10;
  if (level <= 30) return 15;
  return 20;
}

function getAdaptiveModes(level: number): GameMode[] {
  if (level <= 10) return ["plot"];
  if (level <= 20) return ["plot", "slope"];
  return ["plot", "slope", "line"];
}

function getAdaptiveGraphTimer(level: number): number {
  if (level <= 10) return 90;
  if (level <= 20) return 75;
  if (level <= 30) return 60;
  return 45;
}

export function GraphPlotterGame() {
  useGameMusic();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [solved, setSolved] = useState(0);
  const [totalProblems, setTotalProblems] = useState(0);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("graphPlotter_highScore"));
  const [achievementQueue, setAchievementQueue] = useState<Array<{ name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [slopeAnswer, setSlopeAnswer] = useState("");
  const [placedPoints, setPlacedPoints] = useState<{ x: number; y: number }[]>([]);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);
  const [problemNumber, setProblemNumber] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const problemStartRef = useRef(0);

  // Adaptive difficulty
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));

  // ── Settings ──
  const [mode, setMode] = useState<GameMode>("plot");
  const [gridRange, setGridRange] = useState(5);
  const [showGridLines, setShowGridLines] = useState(true);
  const [gameDuration, setGameDuration] = useState(60);

  // Get adaptive-derived current mode
  const pickAdaptiveMode = useCallback((): GameMode => {
    const modes = getAdaptiveModes(adaptive.level);
    return modes[Math.floor(Math.random() * modes.length)];
  }, [adaptive.level]);

  // Keep gridRange in sync with adaptive level during gameplay
  useEffect(() => {
    if (phase === "playing" || phase === "countdown") {
      setGridRange(getAdaptiveGridRange(adaptive.level));
    }
  }, [adaptive.level, phase]);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => {
      setCountdown((c) => {
        if (c <= 1) {
          sfxCountdownGo();
          setTimeout(() => {
            setPhase("playing");
            const startMode = pickAdaptiveMode();
            const startRange = getAdaptiveGridRange(adaptive.level);
            const p = generateProblem(startMode, startRange);
            setProblem(p);
            problemStartRef.current = Date.now();
          }, 0);
          return 0;
        }
        sfxCountdown();
        return c - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, adaptive.level, pickAdaptiveMode]);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // Transition to complete phase on next tick
          setTimeout(() => setPhase("complete"), 0);
          return 0;
        }
        if (t <= 5 && t > 1) sfxTick();
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // On complete
  useEffect(() => {
    if (phase !== "complete") return;
    const acc = totalProblems > 0 ? solved / totalProblems : 0;
    if (acc >= 1.0) sfxPerfect();
    else sfxGameOver();
    if (score > highScore) {
      setLocalHighScore("graphPlotter_highScore", score);
      setHighScore(score);
    }
    trackGamePlayed("graph-plotter", score);
    const profile = getProfile();
    const accuracy = totalProblems > 0 ? Math.round((solved / totalProblems) * 100) : 0;
    const newOnes = checkAchievements(
      { gameId: "graph-plotter", score, bestStreak, accuracy, solved },
      profile.totalGamesPlayed,
      profile.gamesPlayedByGameId
    );
    if (newOnes.length > 0) { sfxAchievement(); setAchievementQueue(newOnes); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Canvas drawing
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;
    const pad = 35;
    const gw = w - pad * 2;
    const gh = h - pad * 2;
    const step = gw / (gridRange * 2);

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    if (showGridLines) {
      ctx.strokeStyle = "rgba(148, 163, 184, 0.1)";
      ctx.lineWidth = 1;
      for (let i = -gridRange; i <= gridRange; i++) {
        const x = pad + (i + gridRange) * step;
        const y = pad + (gridRange - i) * step;
        ctx.beginPath();
        ctx.moveTo(x, pad);
        ctx.lineTo(x, h - pad);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(w - pad, y);
        ctx.stroke();
      }
    }

    // Axes
    const cx = pad + gridRange * step;
    const cy = pad + gridRange * step;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
    ctx.lineWidth = 2;
    // x-axis
    ctx.beginPath();
    ctx.moveTo(pad, cy);
    ctx.lineTo(w - pad, cy);
    ctx.stroke();
    // y-axis
    ctx.beginPath();
    ctx.moveTo(cx, pad);
    ctx.lineTo(cx, h - pad);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = -gridRange; i <= gridRange; i++) {
      if (i === 0) continue;
      const x = pad + (i + gridRange) * step;
      ctx.fillText(`${i}`, x, cy + 4);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = -gridRange; i <= gridRange; i++) {
      if (i === 0) continue;
      const y = pad + (gridRange - i) * step;
      ctx.fillText(`${i}`, cx - 4, y);
    }
    // Origin
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("0", cx - 4, cy + 4);

    // Axis arrows
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("y", cx, pad - 4);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("x", w - pad + 6, cy);

    // Draw problem-specific elements
    if (problem) {
      if (problem.mode === "plot") {
        // Target crosshair hint — show ghosted target after delay
        // (No hint during gameplay to keep it challenging)
      }

      if (problem.mode === "slope") {
        // Draw the two fixed points
        const { p1, p2 } = problem;
        const drawPoint = (px: number, py: number, color: string, label: string) => {
          const sx = pad + (px + gridRange) * step;
          const sy = pad + (gridRange - py) * step;
          ctx.beginPath();
          ctx.arc(sx, sy, 7, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = "#fff";
          ctx.font = "bold 10px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(label, sx, sy - 10);
        };
        drawPoint(p1.x, p1.y, "#f472b6", `(${p1.x}, ${p1.y})`);
        drawPoint(p2.x, p2.y, "#60a5fa", `(${p2.x}, ${p2.y})`);
        // Draw line between them
        const sx1 = pad + (p1.x + gridRange) * step;
        const sy1 = pad + (gridRange - p1.y) * step;
        const sx2 = pad + (p2.x + gridRange) * step;
        const sy2 = pad + (gridRange - p2.y) * step;
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.strokeStyle = "rgba(167, 139, 250, 0.5)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (problem.mode === "line") {
        // Draw placed points
        for (const pt of placedPoints) {
          const sx = pad + (pt.x + gridRange) * step;
          const sy = pad + (gridRange - pt.y) * step;
          ctx.beginPath();
          ctx.arc(sx, sy, 7, 0, Math.PI * 2);
          ctx.fillStyle = "#a78bfa";
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = "#e0e7ff";
          ctx.font = "bold 9px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(`(${pt.x}, ${pt.y})`, sx, sy - 10);
        }
        // Draw line through placed points if 2 placed
        if (placedPoints.length === 2) {
          const [a, b] = placedPoints;
          // Extend line across grid
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          if (dx !== 0 || dy !== 0) {
            const t1 = -100;
            const t2 = 100;
            const x1 = a.x + dx * t1;
            const y1 = a.y + dy * t1;
            const x2 = a.x + dx * t2;
            const y2 = a.y + dy * t2;
            ctx.save();
            ctx.beginPath();
            ctx.rect(pad, pad, gw, gh);
            ctx.clip();
            ctx.beginPath();
            ctx.moveTo(pad + (x1 + gridRange) * step, pad + (gridRange - y1) * step);
            ctx.lineTo(pad + (x2 + gridRange) * step, pad + (gridRange - y2) * step);
            ctx.strokeStyle = "#a78bfa";
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    }

    // Draw placed points for "plot" mode
    if (problem?.mode === "plot") {
      for (const pt of placedPoints) {
        const sx = pad + (pt.x + gridRange) * step;
        const sy = pad + (gridRange - pt.y) * step;
        ctx.beginPath();
        ctx.arc(sx, sy, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#34d399";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#e0e7ff";
        ctx.font = "bold 9px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(`(${pt.x}, ${pt.y})`, sx, sy - 10);
      }
    }

    // Show result overlay
    if (showResult) {
      ctx.fillStyle = showResult === "correct" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = showResult === "correct" ? "#34d399" : "#f87171";
      ctx.font = "bold 28px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(showResult === "correct" ? "✓ Correct!" : "✗ Try again", w / 2, h / 2);
    }
  }, [problem, gridRange, showGridLines, placedPoints, showResult]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    const handler = () => drawCanvas();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [drawCanvas]);

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

  // Get adaptive-derived current mode and grid range
  const adaptiveGridRange = getAdaptiveGridRange(adaptive.level);
  const adaptiveModes = getAdaptiveModes(adaptive.level);

  const handleProblemResult = useCallback((correct: boolean) => {
    setTotalProblems((t) => t + 1);
    const elapsed = (Date.now() - problemStartRef.current) / 1000;
    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      setSolved((s) => s + 1);
      const { mult } = getMultiplierFromStreak(newStreak);
      const timeBonus = Math.max(0, 5 - Math.floor(elapsed));
      const points = Math.round((15 + timeBonus) * mult);
      setScore((s) => s + points);
      setShowResult("correct");
      setFlash("correct");
      if (newStreak > 1 && newStreak % 5 === 0) sfxCombo(newStreak);
      else sfxCorrect();
      // Adaptive: fast = answered in < 50% of 10 seconds (5s)
      setAdaptive(prev => adaptiveUpdate(prev, true, elapsed < 5));
    } else {
      if (streak > 0) sfxStreakLost();
      sfxWrong();
      setStreak(0);
      setShowResult("wrong");
      setFlash("wrong");
      setAdaptive(prev => adaptiveUpdate(prev, false, false));
    }
    setTimeout(() => setFlash(null), 200);
    setTimeout(() => {
      setShowResult(null);
      setPlacedPoints([]);
      setSlopeAnswer("");
      const nextMode = pickAdaptiveMode();
      const nextRange = getAdaptiveGridRange(adaptive.level);
      const p = generateProblem(nextMode, nextRange);
      setProblem(p);
      setProblemNumber((n) => n + 1);
      setTipIdx(Math.floor(Math.random() * TIPS[nextMode].length));
      problemStartRef.current = Date.now();
    }, 800);
  }, [streak, adaptive.level, pickAdaptiveMode]);

  // Handle canvas click (for plot and line modes)
  const handleCanvasPointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (phase !== "playing" || !problem || showResult) return;
      if (problem.mode === "slope") return; // slope uses text input

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const pad = 35;
      const step = (rect.width - pad * 2) / (gridRange * 2);

      // Snap to nearest grid point
      const gx = Math.round((px - pad) / step - gridRange);
      const gy = Math.round(gridRange - (py - pad) / step);

      if (gx < -gridRange || gx > gridRange || gy < -gridRange || gy > gridRange) return;

      if (problem.mode === "plot") {
        setPlacedPoints([{ x: gx, y: gy }]);
        // Check answer
        const correct = gx === problem.targetX && gy === problem.targetY;
        handleProblemResult(correct);
      }

      if (problem.mode === "line") {
        const newPoints = [...placedPoints, { x: gx, y: gy }];
        if (newPoints.length > 2) {
          // Replace: keep latest two
          setPlacedPoints([newPoints[newPoints.length - 2], newPoints[newPoints.length - 1]]);
        } else {
          setPlacedPoints(newPoints);
        }

        if (newPoints.length >= 2) {
          const [a, b] = newPoints.length > 2
            ? [newPoints[newPoints.length - 2], newPoints[newPoints.length - 1]]
            : newPoints;
          // Check: do both points lie on y = mx + b?
          const yA = problem.m * a.x + problem.b;
          const yB = problem.m * b.x + problem.b;
          const isCorrect = Math.abs(yA - a.y) < 0.01 && Math.abs(yB - b.y) < 0.01 && (a.x !== b.x || a.y !== b.y);
          handleProblemResult(isCorrect);
        }
      }
    },
    [phase, problem, gridRange, placedPoints, handleProblemResult, showResult]
  );

  const handleSlopeSubmit = useCallback(() => {
    if (!problem || problem.mode !== "slope") return;
    const answer = slopeAnswer.trim().toLowerCase();
    const target = problem.slope;

    // Check various acceptable formats
    let correct = false;
    if (answer === target) {
      correct = true;
    } else if (target === "undefined" && (answer === "undefined" || answer === "undef" || answer === "∞" || answer === "inf")) {
      correct = true;
    } else {
      // Try parsing as number
      const numAnswer = parseFloat(answer);
      const numTarget = parseFloat(target);
      if (!isNaN(numAnswer) && !isNaN(numTarget) && Math.abs(numAnswer - numTarget) < 0.01) {
        correct = true;
      }
      // Try fraction parsing
      if (answer.includes("/")) {
        const [n, d] = answer.split("/").map(Number);
        if (!isNaN(n) && !isNaN(d) && d !== 0) {
          const numTarget2 = parseFloat(target);
          if (!isNaN(numTarget2) && Math.abs(n / d - numTarget2) < 0.01) {
            correct = true;
          }
          // Compare fraction forms
          if (target.includes("/")) {
            const [tn, td] = target.split("/").map(Number);
            if (n * td === tn * d) correct = true;
          }
        }
      }
    }
    handleProblemResult(correct);
  }, [problem, slopeAnswer, handleProblemResult]);

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSolved(0);
    setTotalProblems(0);
    setAdaptive(createAdaptiveState(1));
    const dur = getAdaptiveGraphTimer(1);
    setTimeLeft(dur);
    setCountdown(COUNTDOWN_SECS);
    setPlacedPoints([]);
    setSlopeAnswer("");
    setShowResult(null);
    setAchievementQueue([]);
    setShowAchievementIndex(0);
    setProblemNumber(0);
    setTipIdx(Math.floor(Math.random() * TIPS[mode].length));
    setPhase("countdown");
  };

  const modeLabels: Record<GameMode, string> = {
    plot: "Plot the Point",
    slope: "Find the Slope",
    line: "Draw the Line",
  };

  const timerColor = timeLeft > 20 ? "text-green-400" : timeLeft > 10 ? "text-yellow-400" : "text-red-400";
  const timerBarWidth = (timeLeft / gameDuration) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-teal-950 to-slate-950 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Graph Plotter</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* MENU */}
        {phase === "menu" && (
          <div className="text-center w-full">
            <div className="text-6xl mb-4">📈</div>
            <h2 className="text-3xl font-bold text-white mb-2">Graph Plotter</h2>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Plot points, find slopes, and draw lines on the coordinate grid!
            </p>

            {/* Mode selector */}
            <div className="max-w-xs mx-auto mb-4 space-y-1.5">
              <div className="text-xs text-slate-500 text-left">Mode</div>
              <div className="grid grid-cols-3 gap-1.5">
                {(["plot", "slope", "line"] as GameMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${mode === m ? "bg-teal-500/25 border border-teal-400/50 text-teal-400" : "bg-white/5 border border-white/10 text-slate-500"}`}
                  >
                    {modeLabels[m]}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid range slider */}
            <div className="max-w-xs mx-auto mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Grid Range</span>
                <span className="text-xs font-bold text-teal-400 tabular-nums">−{gridRange} to {gridRange}</span>
              </div>
              <input type="range" min={3} max={10} step={1} value={gridRange}
                onChange={(e) => setGridRange(Number(e.target.value))}
                className="w-full accent-teal-500" />
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>Small grid</span><span>Large grid</span>
              </div>
            </div>

            {/* Duration slider */}
            <div className="max-w-xs mx-auto mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Duration</span>
                <span className="text-xs font-bold text-teal-400 tabular-nums">{gameDuration >= 60 ? `${gameDuration / 60}m` : `${gameDuration}s`}</span>
              </div>
              <input type="range" min={30} max={180} step={15} value={gameDuration}
                onChange={(e) => setGameDuration(Number(e.target.value))}
                className="w-full accent-teal-500" />
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>30s sprint</span><span>3 min</span>
              </div>
            </div>

            {/* Grid lines toggle */}
            <div className="max-w-xs mx-auto mb-5">
              <label className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Show grid lines</span>
                <button
                  onClick={() => setShowGridLines(!showGridLines)}
                  className={`w-10 h-6 rounded-full transition-all ${showGridLines ? "bg-teal-500" : "bg-white/10"} relative`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${showGridLines ? "left-5" : "left-1"}`} />
                </button>
              </label>
            </div>

            <button
              onClick={startGame}
              className="px-10 py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/30"
            >
              Start
            </button>
            {highScore > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 text-yellow-400 text-sm">
                <Trophy className="w-4 h-4" /> Best: {highScore}
              </div>
            )}
          </div>
        )}

        {/* COUNTDOWN */}
        {phase === "countdown" && (
          <div className="text-center">
            <div className="text-8xl font-bold text-teal-400 animate-pulse">
              {countdown || "GO!"}
            </div>
          </div>
        )}

        {/* PLAYING */}
        {phase === "playing" && problem && (
          <div className="w-full space-y-3">
            {/* Timer bar */}
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${timerBarWidth}%`,
                  background: timeLeft > 20 ? "#14b8a6" : timeLeft > 10 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>

            {/* HUD */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className={`w-4 h-4 ${timerColor}`} />
                <span className={`text-lg font-bold tabular-nums ${timerColor}`}>{timeLeft}s</span>
              </div>
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
                <div className="text-lg font-bold text-white tabular-nums">{score}</div>
                <div className="text-xs text-slate-400">{solved} correct</div>
              </div>
            </div>

            {/* Problem prompt */}
            <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl border border-white/10 p-4 text-center">
              {problem.mode === "plot" && (
                <div>
                  <div className="text-sm text-slate-400 mb-1">Plot the point</div>
                  <div className="text-2xl font-bold text-white">({problem.targetX}, {problem.targetY})</div>
                </div>
              )}
              {problem.mode === "slope" && (
                <div>
                  <div className="text-sm text-slate-400 mb-1">Find the slope between these points</div>
                  <div className="text-xl font-bold text-white">
                    ({problem.p1.x}, {problem.p1.y}) and ({problem.p2.x}, {problem.p2.y})
                  </div>
                </div>
              )}
              {problem.mode === "line" && (
                <div>
                  <div className="text-sm text-slate-400 mb-1">Draw the line by placing 2 points</div>
                  <div className="text-2xl font-bold text-white">{problem.equation}</div>
                </div>
              )}
            </div>

            {/* Tip */}
            <div className="text-center text-[11px] text-slate-500 italic">
              💡 {TIPS[mode][tipIdx % TIPS[mode].length]}
            </div>

            {/* Flash overlay */}
            {flash && (
              <div className={`fixed inset-0 pointer-events-none z-50 ${flash === "correct" ? "bg-green-500/10" : "bg-red-500/15"}`} />
            )}

            {/* Canvas */}
            <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/10 p-1 shadow-lg shadow-black/20">
              <canvas
                ref={canvasRef}
                className="w-full aspect-square rounded-xl cursor-crosshair touch-none"
                onPointerDown={handleCanvasPointer}
              />
            </div>

            {/* Slope input for slope mode */}
            {problem.mode === "slope" && (
              <div className="flex items-center gap-2 justify-center">
                <span className="text-sm text-slate-400">Slope =</span>
                <input
                  type="text"
                  value={slopeAnswer}
                  onChange={(e) => setSlopeAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSlopeSubmit()}
                  placeholder="e.g. 2/3 or -1"
                  className="w-32 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm text-center placeholder:text-slate-600 focus:outline-none focus:border-teal-400/50"
                />
                <button
                  onClick={handleSlopeSubmit}
                  disabled={!slopeAnswer.trim()}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-all"
                >
                  Check
                </button>
              </div>
            )}

            {/* Instructions for line mode */}
            {problem.mode === "line" && placedPoints.length < 2 && (
              <div className="text-center text-xs text-slate-500">
                Tap {2 - placedPoints.length} more point{2 - placedPoints.length > 1 ? "s" : ""} on the grid
              </div>
            )}
          </div>
        )}

        {/* COMPLETE */}
        {phase === "complete" && (
          <div className="text-center">
            <Star className="w-16 h-16 text-yellow-400 fill-yellow-400 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-white mb-2">Time&apos;s Up!</h3>
            <div className="text-5xl font-bold text-teal-400 mb-2">{score}</div>
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
              <p>{solved}/{totalProblems} correct</p>
              <p>Accuracy: {totalProblems > 0 ? Math.round((solved / totalProblems) * 100) : 0}%</p>
              <p>Best streak: x{bestStreak}</p>
            </div>
            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-sm font-medium mb-2 flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" /> New High Score!
              </p>
            )}
            <div className="mb-3">
              <ScoreSubmit game="graph-plotter" score={score} level={Math.round(adaptive.level)} stats={{ solved, totalProblems, bestStreak, accuracy: totalProblems > 0 ? Math.round((solved / totalProblems) * 100) : 0, finalLevel: adaptive.level.toFixed(1) }} />
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
              <button
                onClick={startGame}
                className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
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
