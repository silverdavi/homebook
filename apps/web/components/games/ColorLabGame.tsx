"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Star, Palette, Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import type { MedalTier } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { BonusToast } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import {
  sfxCorrect, sfxWrong, sfxLevelUp, sfxGameOver,
  sfxCountdown, sfxCountdownGo, sfxClick, sfxAchievement,
} from "@/lib/games/audio";

// ── Types ──

type GamePhase = "menu" | "countdown" | "playing" | "complete";

interface DiagramRegion {
  id: string;
  label: string;
  correctColor: string;
  path: string; // SVG path data
  cx: number; // label center x
  cy: number; // label center y
  description: string;
}

interface DiagramDef {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  regions: DiagramRegion[];
  palette: { color: string; label: string }[];
  background?: string;
  tip: string;
}

interface RegionState {
  regionId: string;
  filledColor: string | null;
}

// ── Constants ──

const GAME_WIDTH = 700;
const GAME_HEIGHT = 600;
const COUNTDOWN_SECS = 3;

// ── Color palette definitions ──

const CELL_PALETTE = [
  { color: "#22c55e", label: "Green" },
  { color: "#3b82f6", label: "Blue" },
  { color: "#ef4444", label: "Red" },
  { color: "#a855f7", label: "Purple" },
  { color: "#f59e0b", label: "Yellow" },
  { color: "#ec4899", label: "Pink" },
  { color: "#06b6d4", label: "Cyan" },
  { color: "#f97316", label: "Orange" },
];

const MAP_PALETTE = [
  { color: "#22c55e", label: "Green" },
  { color: "#f59e0b", label: "Yellow" },
  { color: "#ef4444", label: "Red" },
  { color: "#3b82f6", label: "Blue" },
  { color: "#a855f7", label: "Purple" },
  { color: "#ec4899", label: "Pink" },
  { color: "#f97316", label: "Orange" },
];

const PERIODIC_PALETTE = [
  { color: "#3b82f6", label: "Blue (Metals)" },
  { color: "#22c55e", label: "Green (Nonmetals)" },
  { color: "#a855f7", label: "Purple (Noble Gases)" },
  { color: "#f59e0b", label: "Yellow (Metalloids)" },
];

// ── Diagram definitions ──

const DIAGRAMS: DiagramDef[] = [
  {
    id: "plant-cell",
    name: "Plant Cell",
    description: "Color the parts of a plant cell",
    width: 600,
    height: 450,
    tip: "Plant cells have a rigid cell wall and chloroplasts for photosynthesis.",
    palette: CELL_PALETTE,
    regions: [
      {
        id: "cell-wall",
        label: "Cell Wall",
        correctColor: "#22c55e",
        cx: 300, cy: 30,
        description: "Rigid outer layer that gives the cell structure and protection.",
        path: "M100,25 Q300,5 500,25 Q580,100 580,225 Q580,350 500,425 Q300,455 100,425 Q20,350 20,225 Q20,100 100,25 Z M120,50 Q300,30 480,50 Q555,115 555,225 Q555,335 480,400 Q300,430 120,400 Q45,335 45,225 Q45,115 120,50 Z",
      },
      {
        id: "cell-membrane",
        label: "Cell Membrane",
        correctColor: "#f59e0b",
        cx: 300, cy: 60,
        description: "Thin flexible layer inside the cell wall that controls what enters and exits.",
        path: "M120,50 Q300,30 480,50 Q555,115 555,225 Q555,335 480,400 Q300,430 120,400 Q45,335 45,225 Q45,115 120,50 Z M140,70 Q300,52 460,70 Q530,130 530,225 Q530,320 460,380 Q300,410 140,380 Q70,320 70,225 Q70,130 140,70 Z",
      },
      {
        id: "nucleus",
        label: "Nucleus",
        correctColor: "#a855f7",
        cx: 300, cy: 200,
        description: "The control center of the cell, containing DNA.",
        path: "M230,155 Q300,135 370,155 Q410,185 410,225 Q410,265 370,295 Q300,315 230,295 Q190,265 190,225 Q190,185 230,155 Z",
      },
      {
        id: "chloroplast-1",
        label: "Chloroplast",
        correctColor: "#22c55e",
        cx: 145, cy: 155,
        description: "Converts sunlight into energy through photosynthesis.",
        path: "M100,140 Q145,120 190,140 Q210,155 210,170 Q210,185 190,200 Q145,220 100,200 Q80,185 80,170 Q80,155 100,140 Z",
      },
      {
        id: "chloroplast-2",
        label: "Chloroplast",
        correctColor: "#22c55e",
        cx: 445, cy: 310,
        description: "Converts sunlight into energy through photosynthesis.",
        path: "M400,295 Q445,275 490,295 Q510,310 510,325 Q510,340 490,355 Q445,375 400,355 Q380,340 380,325 Q380,310 400,295 Z",
      },
      {
        id: "vacuole",
        label: "Vacuole",
        correctColor: "#3b82f6",
        cx: 380, cy: 140,
        description: "Large storage compartment filled with cell sap.",
        path: "M340,100 Q380,85 430,100 Q475,120 480,155 Q475,190 430,205 Q380,215 340,200 Q310,180 310,150 Q310,120 340,100 Z",
      },
      {
        id: "mitochondria",
        label: "Mitochondria",
        correctColor: "#ef4444",
        cx: 170, cy: 320,
        description: "The powerhouse of the cell — produces energy (ATP).",
        path: "M120,300 Q170,280 220,300 Q250,320 240,340 Q220,360 170,365 Q120,360 100,340 Q95,320 120,300 Z",
      },
      {
        id: "cytoplasm",
        label: "Cytoplasm",
        correctColor: "#06b6d4",
        cx: 450, cy: 230,
        description: "Jelly-like substance that fills the cell and holds organelles.",
        path: "M140,70 Q300,52 460,70 Q530,130 530,225 Q530,320 460,380 Q300,410 140,380 Q70,320 70,225 Q70,130 140,70 Z M230,155 Q300,135 370,155 Q410,185 410,225 Q410,265 370,295 Q300,315 230,295 Q190,265 190,225 Q190,185 230,155 Z",
      },
    ],
  },
  {
    id: "animal-cell",
    name: "Animal Cell",
    description: "Color the parts of an animal cell",
    width: 600,
    height: 450,
    tip: "Animal cells lack cell walls and chloroplasts, unlike plant cells.",
    palette: CELL_PALETTE,
    regions: [
      {
        id: "cell-membrane",
        label: "Cell Membrane",
        correctColor: "#f59e0b",
        cx: 300, cy: 35,
        description: "Flexible outer boundary that controls what enters and exits.",
        path: "M150,40 Q300,15 450,40 Q550,100 555,225 Q550,350 450,415 Q300,445 150,415 Q50,350 45,225 Q50,100 150,40 Z M170,65 Q300,42 430,65 Q520,120 525,225 Q520,330 430,390 Q300,418 170,390 Q80,330 75,225 Q80,120 170,65 Z",
      },
      {
        id: "nucleus",
        label: "Nucleus",
        correctColor: "#a855f7",
        cx: 300, cy: 210,
        description: "Contains DNA and controls cell activities.",
        path: "M230,165 Q300,140 370,165 Q415,195 415,225 Q415,255 370,285 Q300,310 230,285 Q185,255 185,225 Q185,195 230,165 Z",
      },
      {
        id: "mitochondria-1",
        label: "Mitochondria",
        correctColor: "#ef4444",
        cx: 150, cy: 170,
        description: "Produces energy (ATP) for the cell.",
        path: "M105,155 Q150,135 195,155 Q220,170 215,185 Q205,205 150,210 Q100,205 90,185 Q85,170 105,155 Z",
      },
      {
        id: "mitochondria-2",
        label: "Mitochondria",
        correctColor: "#ef4444",
        cx: 430, cy: 300,
        description: "Produces energy (ATP) for the cell.",
        path: "M385,285 Q430,265 475,285 Q500,300 495,315 Q485,335 430,340 Q380,335 370,315 Q365,300 385,285 Z",
      },
      {
        id: "er",
        label: "Endoplasmic Reticulum",
        correctColor: "#ec4899",
        cx: 180, cy: 290,
        description: "Network of membranes that helps make proteins and lipids.",
        path: "M120,260 Q140,250 160,260 Q180,275 170,295 Q155,320 130,330 Q110,325 100,310 Q95,290 120,260 Z",
      },
      {
        id: "golgi",
        label: "Golgi Body",
        correctColor: "#f97316",
        cx: 420, cy: 160,
        description: "Packages and ships proteins to where they need to go.",
        path: "M380,135 Q420,120 460,140 Q480,155 475,175 Q465,195 420,200 Q380,195 365,175 Q360,155 380,135 Z",
      },
      {
        id: "lysosome",
        label: "Lysosome",
        correctColor: "#22c55e",
        cx: 250, cy: 350,
        description: "Breaks down waste and old cell parts.",
        path: "M225,330 Q250,318 275,330 Q292,345 285,362 Q272,378 250,382 Q228,378 215,362 Q210,345 225,330 Z",
      },
      {
        id: "cytoplasm",
        label: "Cytoplasm",
        correctColor: "#06b6d4",
        cx: 420, cy: 380,
        description: "Gel-like substance filling the cell interior.",
        path: "M170,65 Q300,42 430,65 Q520,120 525,225 Q520,330 430,390 Q300,418 170,390 Q80,330 75,225 Q80,120 170,65 Z M230,165 Q300,140 370,165 Q415,195 415,225 Q415,255 370,285 Q300,310 230,285 Q185,255 185,225 Q185,195 230,165 Z",
      },
    ],
  },
  {
    id: "continents",
    name: "World Continents",
    description: "Color each continent",
    width: 600,
    height: 400,
    tip: "There are 7 continents. Asia is the largest, Australia is the smallest.",
    palette: MAP_PALETTE,
    regions: [
      {
        id: "north-america",
        label: "N. America",
        correctColor: "#22c55e",
        cx: 130, cy: 120,
        description: "Contains 23 countries including USA, Canada, and Mexico.",
        path: "M80,50 L130,40 L170,55 L180,80 L190,110 L175,140 L160,180 L140,200 L110,210 L90,200 Q70,180 65,160 L55,130 L60,90 Z",
      },
      {
        id: "south-america",
        label: "S. America",
        correctColor: "#f59e0b",
        cx: 160, cy: 290,
        description: "Home to the Amazon rainforest, the world's largest tropical forest.",
        path: "M130,220 L155,215 L180,230 L195,260 L190,300 L175,340 L155,370 L140,360 L125,330 L120,290 L125,250 Z",
      },
      {
        id: "europe",
        label: "Europe",
        correctColor: "#3b82f6",
        cx: 300, cy: 90,
        description: "Made up of about 50 countries. Known for diverse cultures and history.",
        path: "M260,55 L280,50 L310,55 L330,65 L340,85 L335,110 L320,120 L290,125 L270,115 L255,95 L255,70 Z",
      },
      {
        id: "africa",
        label: "Africa",
        correctColor: "#ef4444",
        cx: 310, cy: 230,
        description: "The second largest continent, home to 54 countries.",
        path: "M270,140 L295,135 L330,140 L345,165 L350,200 L345,250 L330,290 L310,320 L290,330 L275,310 L260,270 L255,230 L258,190 L265,160 Z",
      },
      {
        id: "asia",
        label: "Asia",
        correctColor: "#a855f7",
        cx: 430, cy: 130,
        description: "The largest continent, home to over 4.5 billion people.",
        path: "M350,45 L390,35 L440,40 L490,50 L530,70 L545,100 L540,140 L520,180 L490,200 L450,210 L410,200 L380,180 L355,150 L345,120 L340,85 Z",
      },
      {
        id: "australia",
        label: "Australia",
        correctColor: "#f97316",
        cx: 490, cy: 310,
        description: "The smallest continent, known for unique wildlife.",
        path: "M460,280 L490,270 L530,280 L545,300 L540,330 L520,345 L490,350 L465,340 L455,315 Z",
      },
      {
        id: "antarctica",
        label: "Antarctica",
        correctColor: "#ec4899",
        cx: 300, cy: 380,
        description: "The coldest continent, covered almost entirely by ice.",
        path: "M180,370 L250,365 L350,365 L420,370 L430,385 L370,395 L230,395 L175,385 Z",
      },
    ],
  },
  {
    id: "periodic-groups",
    name: "Periodic Table Groups",
    description: "Color elements by their group",
    width: 600,
    height: 400,
    tip: "Elements are grouped by their properties: metals, nonmetals, metalloids, and noble gases.",
    palette: PERIODIC_PALETTE,
    regions: [
      {
        id: "metals",
        label: "Metals",
        correctColor: "#3b82f6",
        cx: 200, cy: 200,
        description: "Most elements are metals — good conductors of heat and electricity.",
        path: "M30,60 L30,370 L350,370 L350,300 L280,300 L280,230 L210,230 L210,160 L140,160 L140,60 Z",
      },
      {
        id: "nonmetals",
        label: "Nonmetals",
        correctColor: "#22c55e",
        cx: 430, cy: 160,
        description: "Nonmetals are poor conductors and often form gases.",
        path: "M350,60 L350,300 L420,300 L420,230 L490,230 L490,60 Z M140,60 L210,60 L210,160 L140,160 Z",
      },
      {
        id: "noble-gases",
        label: "Noble Gases",
        correctColor: "#a855f7",
        cx: 540, cy: 200,
        description: "Noble gases are very stable and rarely react with other elements.",
        path: "M520,60 L570,60 L570,370 L520,370 Z",
      },
      {
        id: "metalloids",
        label: "Metalloids",
        correctColor: "#f59e0b",
        cx: 360, cy: 265,
        description: "Metalloids have properties of both metals and nonmetals.",
        path: "M280,230 L350,230 L350,300 L420,300 L420,370 L350,370 L280,370 L280,300 Z M210,160 L280,160 L280,230 L210,230 Z M490,230 L520,230 L520,300 L490,300 Z",
      },
    ],
  },
];

// ── Educational tips ──

const TIPS = [
  "Cells are the basic building blocks of all living things.",
  "Plant cells have chloroplasts; animal cells don't.",
  "The nucleus is like the brain of the cell.",
  "Mitochondria produce ATP, the energy currency of cells.",
  "There are 118 known elements on the periodic table.",
  "About 75% of elements are metals.",
  "Noble gases are the least reactive elements.",
  "The Earth has 7 continents and 5 oceans.",
];

// ── Component ──

export function ColorLabGame() {
  useGameMusic();

  const containerRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [countdownVal, setCountdownVal] = useState(COUNTDOWN_SECS);
  const [score, setScore] = useState(0);
  const [selectedDiagramId, setSelectedDiagramId] = useState(DIAGRAMS[0].id);
  const [showLabels, setShowLabels] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [regionStates, setRegionStates] = useState<RegionState[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalFilled, setTotalFilled] = useState(0);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("colorLab_highScore"));
  const [tipIndex, setTipIndex] = useState(0);
  const [showBonus, setShowBonus] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [achievementQueue, setAchievementQueue] = useState<Array<{ medalId: string; name: string; tier: MedalTier }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const diagram = DIAGRAMS.find((d) => d.id === selectedDiagramId) || DIAGRAMS[0];

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
    if (phase !== "playing") return;
    const t = setInterval(() => setElapsedSecs(Math.floor((Date.now() - startTime) / 1000)), 500);
    return () => clearInterval(t);
  }, [phase, startTime]);

  // Tip rotation
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 8000);
    return () => clearInterval(t);
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

  // Check completion
  useEffect(() => {
    if (phase !== "playing") return;
    if (regionStates.length > 0 && regionStates.every((r) => r.filledColor !== null)) {
      // All regions filled, auto-complete
      const timer = setTimeout(() => finishGame(), 800);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionStates, phase]);

  // Start game
  const startGame = useCallback(() => {
    sfxClick();
    const d = DIAGRAMS.find((dd) => dd.id === selectedDiagramId) || DIAGRAMS[0];
    setRegionStates(d.regions.map((r) => ({ regionId: r.id, filledColor: null })));
    setScore(0);
    setCorrectCount(0);
    setTotalFilled(0);
    setElapsedSecs(0);
    setSelectedColor(d.palette[0]?.color || null);
    setCountdownVal(COUNTDOWN_SECS);
    setPhase("countdown");
    setAchievementQueue([]);
    setShowAchievementIndex(0);
  }, [selectedDiagramId]);

  // Fill region
  const fillRegion = useCallback((regionId: string) => {
    if (phase !== "playing" || !selectedColor) return;

    const region = diagram.regions.find((r) => r.id === regionId);
    if (!region) return;

    setRegionStates((prev) => {
      const existing = prev.find((r) => r.regionId === regionId);
      if (existing && existing.filledColor === selectedColor) return prev; // already same color
      return prev.map((r) => r.regionId === regionId ? { ...r, filledColor: selectedColor } : r);
    });

    const isCorrect = region.correctColor === selectedColor;
    if (isCorrect) {
      sfxCorrect();
      setCorrectCount((c) => c + 1);
      const points = 50;
      setScore((s) => s + points);
    } else {
      sfxWrong();
    }
    setTotalFilled((t) => t + 1);
  }, [phase, selectedColor, diagram]);

  // Finish game
  const finishGame = useCallback(() => {
    setPhase("complete");
    sfxLevelUp();

    // Calculate correctness
    let correct = 0;
    const d = DIAGRAMS.find((dd) => dd.id === selectedDiagramId) || DIAGRAMS[0];
    for (const rs of regionStates) {
      const region = d.regions.find((r) => r.id === rs.regionId);
      if (region && rs.filledColor === region.correctColor) correct++;
    }

    const accuracy = d.regions.length > 0 ? Math.round((correct / d.regions.length) * 100) : 0;
    const timeBonus = Math.max(0, 200 - elapsedSecs);
    const accBonus = accuracy >= 100 ? 500 : accuracy >= 80 ? 200 : 0;
    const finalScore = score + timeBonus + accBonus;
    setScore(finalScore);

    if (accuracy >= 90) {
      setShowBonus(true);
      setTimeout(() => setShowBonus(false), 2000);
    }

    if (finalScore > highScore) {
      setHighScore(finalScore);
      setLocalHighScore("colorLab_highScore", finalScore);
    }
    trackGamePlayed("color-lab", finalScore);
    const profile = getProfile();
    const newOnes = checkAchievements(
      { gameId: "color-lab", score: finalScore, level: 1, accuracy },
      profile.totalGamesPlayed, profile.gamesPlayedByGameId
    );
    if (newOnes.length > 0) { sfxAchievement(); setAchievementQueue(newOnes); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDiagramId, regionStates, score, highScore, elapsedSecs]);

  // Compute final accuracy for display
  const computeAccuracy = useCallback(() => {
    const d = DIAGRAMS.find((dd) => dd.id === selectedDiagramId) || DIAGRAMS[0];
    let correct = 0;
    for (const rs of regionStates) {
      const region = d.regions.find((r) => r.id === rs.regionId);
      if (region && rs.filledColor === region.correctColor) correct++;
    }
    return d.regions.length > 0 ? Math.round((correct / d.regions.length) * 100) : 0;
  }, [selectedDiagramId, regionStates]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const filledCount = regionStates.filter((r) => r.filledColor !== null).length;
  const completion = diagram.regions.length > 0 ? Math.round((filledCount / diagram.regions.length) * 100) : 0;

  // SVG scale to fit
  const svgScale = Math.min(
    (GAME_WIDTH - 40) / diagram.width,
    (GAME_HEIGHT - 140) / diagram.height
  );
  const svgOffsetX = (GAME_WIDTH - diagram.width * svgScale) / 2;
  const svgOffsetY = 30;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060612] via-[#0a0e2a] to-[#060612] flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-[750px] px-4 pt-3 pb-1 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-400" /> Color Lab
        </h1>
        <AudioToggles />
      </div>

      {/* HUD */}
      {phase === "playing" && (
        <div className="w-full max-w-[750px] px-4 mb-1">
          <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <span>{completion}% filled</span>
              <span>|</span>
              <span>{formatTime(elapsedSecs)}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <button onClick={() => setShowLabels((v) => !v)} className="flex items-center gap-1 hover:text-white transition-colors" title="Toggle labels">
                {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span className="text-xs">Labels</span>
              </button>
              <button onClick={() => setShowGuide((v) => !v)} className={`flex items-center gap-1 transition-colors ${showGuide ? "text-yellow-400" : "hover:text-white"}`} title="Toggle color guide">
                <Palette className="w-3.5 h-3.5" />
                <span className="text-xs">Guide</span>
              </button>
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
            <BonusToast show={showBonus} text="Perfect coloring!" points={500} />

            {/* MENU */}
            {phase === "menu" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-8">
                <Palette className="w-12 h-12 text-indigo-400 mb-3" />
                <h2 className="text-3xl font-bold text-white mb-1">Color Lab</h2>
                <p className="text-slate-500 text-center text-sm mb-5">Color educational diagrams and learn!</p>

                {highScore > 0 && (
                  <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-yellow-500" /> Best: {highScore.toLocaleString()}
                  </div>
                )}

                {/* Diagram selector */}
                <div className="w-full max-w-sm mb-5">
                  <div className="text-xs text-slate-400 mb-2">Choose a diagram</div>
                  <div className="grid grid-cols-2 gap-2">
                    {DIAGRAMS.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => { setSelectedDiagramId(d.id); sfxClick(); }}
                        className={`py-3 px-3 rounded-xl text-xs font-medium transition-all text-left ${selectedDiagramId === d.id ? "bg-indigo-500/20 border-indigo-400/50 text-indigo-300 border" : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5"}`}
                      >
                        <div className="font-bold text-sm">{d.name}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{d.regions.length} regions</div>
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

            {/* PLAYING — SVG diagram */}
            {phase === "playing" && (
              <div className="absolute inset-0">
                {/* SVG Diagram */}
                <svg
                  width={GAME_WIDTH}
                  height={GAME_HEIGHT - 80}
                  viewBox={`0 0 ${GAME_WIDTH} ${GAME_HEIGHT - 80}`}
                  className="pointer-events-none"
                  style={{ position: "absolute", top: 0, left: 0 }}
                >
                  <g transform={`translate(${svgOffsetX}, ${svgOffsetY}) scale(${svgScale})`}>
                    {/* Render regions back to front */}
                    {[...diagram.regions].reverse().map((region) => {
                      const rs = regionStates.find((r) => r.regionId === region.id);
                      const fillColor = rs?.filledColor || "rgba(30,41,59,0.5)";
                      const isHovered = hoveredRegion === region.id;
                      const isGuideCorrect = showGuide && rs?.filledColor === region.correctColor;

                      return (
                        <g key={region.id}>
                          <path
                            d={region.path}
                            fill={fillColor}
                            stroke={isHovered ? "rgba(255,255,255,0.6)" : "rgba(148,163,184,0.3)"}
                            strokeWidth={isHovered ? 2.5 : 1.5}
                            className="pointer-events-auto cursor-pointer transition-all"
                            style={{ fillRule: "evenodd" }}
                            onPointerDown={() => fillRegion(region.id)}
                            onPointerEnter={() => setHoveredRegion(region.id)}
                            onPointerLeave={() => setHoveredRegion(null)}
                          />
                          {/* Correct checkmark */}
                          {isGuideCorrect && (
                            <circle cx={region.cx} cy={region.cy - 15} r={8} fill="rgba(34,197,94,0.8)" />
                          )}
                          {/* Label */}
                          {showLabels && (
                            <text
                              x={region.cx}
                              y={region.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="rgba(255,255,255,0.9)"
                              fontSize={10}
                              fontWeight="bold"
                              className="pointer-events-none select-none"
                              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                            >
                              {region.label}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Color guide legend */}
                {showGuide && (
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg p-2 text-[9px] space-y-1 z-10">
                    {diagram.regions.map((r) => (
                      <div key={r.id} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: r.correctColor }} />
                        <span className="text-white/80">{r.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Description on hover */}
                {hoveredRegion && (
                  <div className="absolute top-2 left-2 right-[120px] bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 z-10">
                    <span className="text-xs text-white/90">
                      {diagram.regions.find((r) => r.id === hoveredRegion)?.description}
                    </span>
                  </div>
                )}

                {/* Color palette bar */}
                <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-black/40 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {diagram.palette.map((p) => (
                      <button
                        key={p.color}
                        onClick={() => { setSelectedColor(p.color); sfxClick(); }}
                        className={`w-9 h-9 rounded-lg transition-all flex items-center justify-center ${selectedColor === p.color ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : "hover:scale-105"}`}
                        style={{ backgroundColor: p.color }}
                        title={p.label}
                      >
                        {selectedColor === p.color && <Check className="w-4 h-4 text-white drop-shadow-lg" />}
                      </button>
                    ))}
                  </div>
                  <div className="text-center mt-1.5">
                    <span className="text-[10px] text-slate-500 italic">{TIPS[tipIndex]}</span>
                  </div>
                </div>
              </div>
            )}

            {/* COMPLETE */}
            {phase === "complete" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/50 backdrop-blur-sm px-6">
                <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 mb-2 animate-bounce" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  {computeAccuracy() === 100 ? "Perfect!" : "Diagram Complete!"}
                </h3>
                <div className="text-4xl font-bold text-indigo-400 mb-3">{score.toLocaleString()}</div>
                <div className="grid grid-cols-3 gap-3 mb-3 text-center w-full max-w-sm">
                  <div><div className="text-xl font-bold text-green-400">{computeAccuracy()}%</div><div className="text-[9px] text-slate-500 uppercase">Accuracy</div></div>
                  <div><div className="text-xl font-bold text-cyan-400">{formatTime(elapsedSecs)}</div><div className="text-[9px] text-slate-500 uppercase">Time</div></div>
                  <div><div className="text-xl font-bold text-yellow-400">{diagram.regions.length}</div><div className="text-[9px] text-slate-500 uppercase">Regions</div></div>
                </div>
                <div className="mb-2 w-full max-w-xs">
                  <ScoreSubmit game="color-lab" score={score} level={1} stats={{ accuracy: `${computeAccuracy()}%`, time: formatTime(elapsedSecs), diagram: diagram.name }} />
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
