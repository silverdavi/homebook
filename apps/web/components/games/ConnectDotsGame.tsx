"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Star, Timer } from "lucide-react";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxCombo, sfxGameOver, sfxAchievement, sfxCountdown, sfxCountdownGo, sfxLevelUp } from "@/lib/games/audio";
import Link from "next/link";

// ── Types ──

type GamePhase = "menu" | "countdown" | "playing" | "complete";
type Category = "counting" | "constellations" | "circuits";

interface Dot {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  label: string;
}

interface DotSet {
  name: string;
  dots: Dot[];
  category: Category;
  description: string;
}

// ── Dot Set Data ──

const COUNTING_SETS: DotSet[] = [
  {
    name: "Count by 2s: Triangle",
    category: "counting",
    description: "Connect even numbers to form a triangle",
    dots: [
      { x: 0.5, y: 0.15, label: "2" },
      { x: 0.82, y: 0.75, label: "4" },
      { x: 0.18, y: 0.75, label: "6" },
    ],
  },
  {
    name: "Count by 2s: Diamond",
    category: "counting",
    description: "Connect even numbers to form a diamond",
    dots: [
      { x: 0.5, y: 0.1, label: "2" },
      { x: 0.8, y: 0.45, label: "4" },
      { x: 0.5, y: 0.8, label: "6" },
      { x: 0.2, y: 0.45, label: "8" },
    ],
  },
  {
    name: "Count by 3s: Pentagon",
    category: "counting",
    description: "Connect multiples of 3 to form a pentagon",
    dots: [
      { x: 0.5, y: 0.1, label: "3" },
      { x: 0.85, y: 0.4, label: "6" },
      { x: 0.72, y: 0.82, label: "9" },
      { x: 0.28, y: 0.82, label: "12" },
      { x: 0.15, y: 0.4, label: "15" },
    ],
  },
  {
    name: "Count by 5s: Star",
    category: "counting",
    description: "Connect multiples of 5 to form a star",
    dots: [
      { x: 0.5, y: 0.05, label: "5" },
      { x: 0.62, y: 0.38, label: "10" },
      { x: 0.95, y: 0.38, label: "15" },
      { x: 0.7, y: 0.58, label: "20" },
      { x: 0.8, y: 0.92, label: "25" },
      { x: 0.5, y: 0.72, label: "30" },
      { x: 0.2, y: 0.92, label: "35" },
      { x: 0.3, y: 0.58, label: "40" },
      { x: 0.05, y: 0.38, label: "45" },
      { x: 0.38, y: 0.38, label: "50" },
    ],
  },
  {
    name: "Primes: Hexagon",
    category: "counting",
    description: "Connect prime numbers in order",
    dots: [
      { x: 0.5, y: 0.1, label: "2" },
      { x: 0.82, y: 0.3, label: "3" },
      { x: 0.82, y: 0.65, label: "5" },
      { x: 0.5, y: 0.85, label: "7" },
      { x: 0.18, y: 0.65, label: "11" },
      { x: 0.18, y: 0.3, label: "13" },
    ],
  },
  {
    name: "Count by 2s: Arrow",
    category: "counting",
    description: "Connect even numbers to form an arrow",
    dots: [
      { x: 0.5, y: 0.08, label: "2" },
      { x: 0.75, y: 0.35, label: "4" },
      { x: 0.6, y: 0.35, label: "6" },
      { x: 0.6, y: 0.85, label: "8" },
      { x: 0.4, y: 0.85, label: "10" },
      { x: 0.4, y: 0.35, label: "12" },
      { x: 0.25, y: 0.35, label: "14" },
    ],
  },
  {
    name: "Count by 4s: House",
    category: "counting",
    description: "Connect multiples of 4 to form a house",
    dots: [
      { x: 0.5, y: 0.1, label: "4" },
      { x: 0.8, y: 0.4, label: "8" },
      { x: 0.8, y: 0.85, label: "12" },
      { x: 0.2, y: 0.85, label: "16" },
      { x: 0.2, y: 0.4, label: "20" },
    ],
  },
];

const CONSTELLATION_SETS: DotSet[] = [
  {
    name: "Big Dipper",
    category: "constellations",
    description: "The famous asterism in Ursa Major",
    dots: [
      { x: 0.2, y: 0.3, label: "1" },
      { x: 0.3, y: 0.25, label: "2" },
      { x: 0.42, y: 0.28, label: "3" },
      { x: 0.48, y: 0.4, label: "4" },
      { x: 0.62, y: 0.52, label: "5" },
      { x: 0.75, y: 0.48, label: "6" },
      { x: 0.72, y: 0.62, label: "7" },
    ],
  },
  {
    name: "Orion",
    category: "constellations",
    description: "The great hunter constellation",
    dots: [
      { x: 0.35, y: 0.12, label: "1" },
      { x: 0.65, y: 0.12, label: "2" },
      { x: 0.72, y: 0.35, label: "3" },
      { x: 0.58, y: 0.48, label: "4" },
      { x: 0.5, y: 0.5, label: "5" },
      { x: 0.42, y: 0.48, label: "6" },
      { x: 0.28, y: 0.35, label: "7" },
    ],
  },
  {
    name: "Cassiopeia",
    category: "constellations",
    description: "The W-shaped constellation",
    dots: [
      { x: 0.15, y: 0.35, label: "1" },
      { x: 0.3, y: 0.55, label: "2" },
      { x: 0.45, y: 0.3, label: "3" },
      { x: 0.6, y: 0.55, label: "4" },
      { x: 0.75, y: 0.35, label: "5" },
    ],
  },
  {
    name: "Leo",
    category: "constellations",
    description: "The lion constellation",
    dots: [
      { x: 0.3, y: 0.2, label: "1" },
      { x: 0.45, y: 0.15, label: "2" },
      { x: 0.55, y: 0.25, label: "3" },
      { x: 0.5, y: 0.4, label: "4" },
      { x: 0.35, y: 0.5, label: "5" },
      { x: 0.3, y: 0.7, label: "6" },
      { x: 0.55, y: 0.7, label: "7" },
      { x: 0.7, y: 0.6, label: "8" },
    ],
  },
  {
    name: "Cygnus",
    category: "constellations",
    description: "The swan / Northern Cross",
    dots: [
      { x: 0.5, y: 0.1, label: "1" },
      { x: 0.5, y: 0.35, label: "2" },
      { x: 0.5, y: 0.6, label: "3" },
      { x: 0.5, y: 0.85, label: "4" },
      { x: 0.28, y: 0.45, label: "5" },
      { x: 0.72, y: 0.45, label: "6" },
    ],
  },
];

const CIRCUIT_SETS: DotSet[] = [
  {
    name: "Simple Circuit",
    category: "circuits",
    description: "Battery → Wire → Bulb → Wire → Battery",
    dots: [
      { x: 0.2, y: 0.3, label: "Battery +" },
      { x: 0.5, y: 0.15, label: "Wire" },
      { x: 0.8, y: 0.3, label: "Switch" },
      { x: 0.8, y: 0.65, label: "Bulb" },
      { x: 0.5, y: 0.8, label: "Wire" },
      { x: 0.2, y: 0.65, label: "Battery −" },
    ],
  },
  {
    name: "Series Circuit",
    category: "circuits",
    description: "Two bulbs in series",
    dots: [
      { x: 0.15, y: 0.3, label: "Battery +" },
      { x: 0.4, y: 0.15, label: "Wire" },
      { x: 0.65, y: 0.2, label: "Bulb 1" },
      { x: 0.85, y: 0.45, label: "Wire" },
      { x: 0.65, y: 0.7, label: "Bulb 2" },
      { x: 0.4, y: 0.8, label: "Wire" },
      { x: 0.15, y: 0.65, label: "Battery −" },
    ],
  },
  {
    name: "LED Circuit",
    category: "circuits",
    description: "Resistor protects the LED",
    dots: [
      { x: 0.2, y: 0.25, label: "Battery +" },
      { x: 0.5, y: 0.15, label: "Resistor" },
      { x: 0.8, y: 0.25, label: "LED +" },
      { x: 0.8, y: 0.7, label: "LED −" },
      { x: 0.5, y: 0.8, label: "Wire" },
      { x: 0.2, y: 0.7, label: "Battery −" },
    ],
  },
  {
    name: "Buzzer Circuit",
    category: "circuits",
    description: "Press button → buzzer sounds",
    dots: [
      { x: 0.2, y: 0.2, label: "Battery +" },
      { x: 0.55, y: 0.12, label: "Button" },
      { x: 0.82, y: 0.25, label: "Wire" },
      { x: 0.82, y: 0.6, label: "Buzzer" },
      { x: 0.55, y: 0.78, label: "Wire" },
      { x: 0.2, y: 0.7, label: "Battery −" },
    ],
  },
];

function getSetsForCategory(cat: Category): DotSet[] {
  switch (cat) {
    case "counting": return COUNTING_SETS;
    case "constellations": return CONSTELLATION_SETS;
    case "circuits": return CIRCUIT_SETS;
  }
}

// ── Tips ──

const TIPS = [
  "Tap the dots in the right order — smallest number first!",
  "Count by 2s: 2, 4, 6, 8, 10 — always add 2.",
  "Count by 5s: end in 0 or 5 every time.",
  "Prime numbers: divisible only by 1 and themselves.",
  "Constellations are patterns of stars seen from Earth.",
  "In a series circuit, current flows through every component.",
  "A resistor limits current to protect components like LEDs.",
  "The Big Dipper helps you find Polaris, the North Star.",
];

const COUNTDOWN_SECS = 3;

export function ConnectDotsGame() {
  useGameMusic();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [currentSet, setCurrentSet] = useState<DotSet | null>(null);
  const [connectedCount, setConnectedCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("connectDots_highScore"));
  const [achievementQueue, setAchievementQueue] = useState<Array<{ name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [shapeRevealed, setShapeRevealed] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartRef = useRef(0);
  const setsQueueRef = useRef<DotSet[]>([]);

  // ── Settings ──
  const [category, setCategory] = useState<Category>("counting");
  const [roundCount, setRoundCount] = useState(5);
  const [showNumbers, setShowNumbers] = useState(true);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => {
      setCountdown((c) => {
        if (c <= 1) {
          sfxCountdownGo();
          setTimeout(() => {
            setPhase("playing");
            roundStartRef.current = Date.now();
          }, 0);
          return 0;
        }
        sfxCountdown();
        return c - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - roundStartRef.current) / 1000));
    }, 250);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // On game complete
  useEffect(() => {
    if (phase !== "complete") return;
    sfxGameOver();
    if (score > highScore) {
      setLocalHighScore("connectDots_highScore", score);
      setHighScore(score);
    }
    trackGamePlayed("connect-dots", score);
    const profile = getProfile();
    const newOnes = checkAchievements(
      { gameId: "connect-dots", score, bestStreak, solved: roundIndex },
      profile.totalGamesPlayed,
      profile.gamesPlayedByGameId
    );
    if (newOnes.length > 0) { sfxAchievement(); setAchievementQueue(newOnes); }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Canvas rendering
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentSet) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    const dots = currentSet.dots;

    // Draw connected lines
    for (let i = 0; i < connectedCount - 1; i++) {
      const from = dots[i];
      const to = dots[i + 1];
      ctx.beginPath();
      ctx.moveTo(from.x * w, from.y * h);
      ctx.lineTo(to.x * w, to.y * h);
      ctx.strokeStyle = "#818cf8";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // If shape is revealed, close the shape
    if (shapeRevealed && dots.length > 2) {
      // Draw all lines including closing line
      ctx.beginPath();
      ctx.moveTo(dots[0].x * w, dots[0].y * h);
      for (let i = 1; i < dots.length; i++) {
        ctx.lineTo(dots[i].x * w, dots[i].y * h);
      }
      ctx.closePath();
      ctx.strokeStyle = "#818cf8";
      ctx.lineWidth = 3;
      ctx.stroke();
      // Fill with translucent
      ctx.fillStyle = "rgba(99, 102, 241, 0.12)";
      ctx.fill();
    }

    // Draw dots
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      const dx = dot.x * w;
      const dy = dot.y * h;
      const isConnected = i < connectedCount;
      const isNext = i === connectedCount;
      const radius = isNext ? 20 : 16;

      // Outer glow for next dot
      if (isNext) {
        ctx.beginPath();
        ctx.arc(dx, dy, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
        ctx.fill();
      }

      // Dot circle
      ctx.beginPath();
      ctx.arc(dx, dy, radius, 0, Math.PI * 2);
      ctx.fillStyle = isConnected ? "#818cf8" : isNext ? "#6366f1" : "#334155";
      ctx.fill();
      ctx.strokeStyle = isConnected ? "#a5b4fc" : isNext ? "#818cf8" : "#475569";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      const label = showNumbers ? dot.label : `${i + 1}`;
      ctx.fillStyle = isConnected ? "#e0e7ff" : isNext ? "#fff" : "#94a3b8";
      ctx.font = `bold ${radius > 16 ? 13 : 11}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, dx, dy);
    }
  }, [currentSet, connectedCount, showNumbers, shapeRevealed]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Resize handler
  useEffect(() => {
    const handler = () => drawCanvas();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [drawCanvas]);

  const loadNextSet = useCallback(() => {
    if (setsQueueRef.current.length === 0) return;
    const next = setsQueueRef.current.shift()!;
    setCurrentSet(next);
    setConnectedCount(0);
    setShapeRevealed(false);
    setTipIdx(Math.floor(Math.random() * TIPS.length));
    // Reset per-round timer so time bonus is calculated per round
    roundStartRef.current = Date.now();
    setTimeElapsed(0);
  }, []);

  const handleCanvasPointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (phase !== "playing" || !currentSet || shapeRevealed) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      const nextIdx = connectedCount;
      if (nextIdx >= currentSet.dots.length) return;

      // Check the next expected dot first (prioritize it when dots overlap)
      const nextDot = currentSet.dots[nextIdx];
      const nextDist = Math.sqrt((px - nextDot.x) ** 2 + (py - nextDot.y) ** 2);

      if (nextDist < 0.06) {
        // Correct dot tapped
        const newCount = connectedCount + 1;
        setConnectedCount(newCount);
        const newStreak = streak + 1;
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));

        if (newCount >= currentSet.dots.length) {
          // Set complete — reveal shape
          setShapeRevealed(true);
          sfxLevelUp();
          const { mult } = getMultiplierFromStreak(newStreak);
          const roundScore = Math.round((currentSet.dots.length * 15 + Math.max(0, 30 - timeElapsed)) * mult);
          setScore((s) => s + roundScore);
          setFlash("correct");
          setTimeout(() => setFlash(null), 300);

          // Move to next round after delay
          setTimeout(() => {
            // Guard: only proceed if still playing
            setPhase(currentPhase => {
              if (currentPhase !== "playing") return currentPhase;
              const nextRound = roundIndex + 1;
              setRoundIndex(nextRound);
              if (nextRound >= totalRounds) {
                return "complete";
              } else {
                loadNextSet();
                return currentPhase;
              }
            });
          }, 1500);
        } else {
          if (newStreak > 1 && newStreak % 5 === 0) sfxCombo(newStreak);
          else sfxCorrect();
          setFlash("correct");
          setTimeout(() => setFlash(null), 200);
        }
        return;
      }

      // Check if any other dot was tapped (wrong order)
      for (let i = 0; i < currentSet.dots.length; i++) {
        if (i === nextIdx) continue;
        const dot = currentSet.dots[i];
        const dist = Math.sqrt((px - dot.x) ** 2 + (py - dot.y) ** 2);
        if (dist < 0.06) {
          // Wrong dot
          sfxWrong();
          setStreak(0);
          setMistakes((m) => m + 1);
          setFlash("wrong");
          setTimeout(() => setFlash(null), 200);
          return;
        }
      }
    },
    [phase, currentSet, connectedCount, streak, shapeRevealed, timeElapsed, roundIndex, totalRounds, loadNextSet]
  );

  const startGame = useCallback(() => {
    const sets = getSetsForCategory(category);
    // Shuffle and pick roundCount sets (with repeats if needed)
    const shuffled = [...sets].sort(() => Math.random() - 0.5);
    const queue: DotSet[] = [];
    for (let i = 0; i < roundCount; i++) {
      queue.push(shuffled[i % shuffled.length]);
    }
    setsQueueRef.current = queue;
    setTotalRounds(roundCount);
    setRoundIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setMistakes(0);
    setTimeElapsed(0);
    setAchievementQueue([]);
    setShowAchievementIndex(0);
    setCountdown(COUNTDOWN_SECS);
    loadNextSet();
    setPhase("countdown");
  }, [category, roundCount, loadNextSet]);

  // Keyboard shortcuts (must be after startGame definition)
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

  const categoryLabels: Record<Category, string> = {
    counting: "Math Sequences",
    constellations: "Constellations",
    circuits: "Simple Circuits",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Connect the Dots</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* MENU */}
        {phase === "menu" && (
          <div className="text-center w-full">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-3xl font-bold text-white mb-2">Connect the Dots</h2>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Tap dots in order to reveal shapes. Learn counting sequences, constellations, and circuits!
            </p>

            {/* Category selector */}
            <div className="max-w-xs mx-auto mb-4 space-y-1.5">
              <div className="text-xs text-slate-500 text-left">Category</div>
              <div className="grid grid-cols-3 gap-1.5">
                {(["counting", "constellations", "circuits"] as Category[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${category === cat ? "bg-indigo-500/25 border border-indigo-400/50 text-indigo-400" : "bg-white/5 border border-white/10 text-slate-500"}`}
                  >
                    {categoryLabels[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Round count slider */}
            <div className="max-w-xs mx-auto mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Rounds</span>
                <span className="text-xs font-bold text-indigo-400 tabular-nums">{roundCount}</span>
              </div>
              <input type="range" min={3} max={10} step={1} value={roundCount}
                onChange={(e) => setRoundCount(Number(e.target.value))}
                className="w-full accent-indigo-500" />
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>Quick</span><span>Marathon</span>
              </div>
            </div>

            {/* Toggle show numbers */}
            <div className="max-w-xs mx-auto mb-5">
              <label className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Show sequence labels</span>
                <button
                  onClick={() => setShowNumbers(!showNumbers)}
                  className={`w-10 h-6 rounded-full transition-all ${showNumbers ? "bg-indigo-500" : "bg-white/10"} relative`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${showNumbers ? "left-5" : "left-1"}`} />
                </button>
              </label>
            </div>

            <button
              onClick={startGame}
              className="px-10 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30"
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
            <div className="text-8xl font-bold text-indigo-400 animate-pulse">
              {countdown || "GO!"}
            </div>
          </div>
        )}

        {/* PLAYING */}
        {phase === "playing" && currentSet && (
          <div className="w-full space-y-4">
            {/* HUD */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-slate-400" />
                <span className="text-lg font-bold tabular-nums text-slate-300">{timeElapsed}s</span>
              </div>
              <StreakBadge streak={streak} />
              <div className="text-right">
                <div className="text-lg font-bold text-white tabular-nums">{score}</div>
                <div className="text-xs text-slate-400">{roundIndex + 1}/{totalRounds}</div>
              </div>
            </div>

            {/* Shape name */}
            <div className="text-center">
              <div className="text-sm font-bold text-indigo-400">{currentSet.name}</div>
              <div className="text-xs text-slate-500">{currentSet.description}</div>
            </div>

            {/* Tip */}
            <div className="text-center text-[11px] text-slate-500 italic">
              💡 {TIPS[tipIdx % TIPS.length]}
            </div>

            {/* Flash overlay */}
            {flash && (
              <div className={`fixed inset-0 pointer-events-none z-50 ${flash === "correct" ? "bg-green-500/10" : "bg-red-500/15"}`} />
            )}

            {/* Canvas */}
            <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/10 p-2 shadow-lg shadow-black/20">
              <canvas
                ref={canvasRef}
                className="w-full aspect-square rounded-xl cursor-pointer touch-none"
                onPointerDown={handleCanvasPointer}
              />
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5">
              {currentSet.dots.map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i < connectedCount ? "bg-indigo-400" : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            {shapeRevealed && (
              <div className="text-center text-lg font-bold text-indigo-400 animate-pulse">
                Shape revealed! ✓
              </div>
            )}
          </div>
        )}

        {/* COMPLETE */}
        {phase === "complete" && (
          <div className="text-center">
            <Star className="w-16 h-16 text-yellow-400 fill-yellow-400 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-white mb-2">Complete!</h3>
            <div className="text-5xl font-bold text-indigo-400 mb-2">{score}</div>
            <div className="text-slate-400 space-y-1 mb-6">
              <p>{totalRounds} shapes connected</p>
              <p>Best streak: x{bestStreak}</p>
              {mistakes > 0 && <p>{mistakes} wrong taps</p>}
            </div>
            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-sm font-medium mb-2 flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" /> New High Score!
              </p>
            )}
            <div className="mb-3">
              <ScoreSubmit game="connect-dots" score={score} level={roundCount} stats={{ solved: totalRounds, bestStreak, mistakes }} />
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
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
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
