"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Star, Trophy, RotateCcw, ArrowLeft, Zap, Target, Gauge } from "lucide-react";
import { pickSentence, CATEGORIES } from "@/lib/games/sentences";
import { getLocalHighScore, setLocalHighScore } from "@/lib/games/use-scores";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import Link from "next/link";

// ── Types ──

interface FallingLetter {
  id: string;
  char: string;
  sentenceIndex: number;
  x: number;
  y: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
  spawned: boolean;
  caught: boolean;
  missed: boolean;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  type: "splash" | "sparkle" | "ripple" | "text";
  char?: string;
}

type GamePhase = "menu" | "intro" | "playing" | "levelComplete" | "gameOver";
type ChosenDifficulty = "easy" | "medium" | "hard" | "auto";

// ── Constants ──

const GAME_WIDTH = 800;
const GAME_HEIGHT = 550;
const LETTER_SIZE = 50;
const GROUND_Y = GAME_HEIGHT - 40;
const INITIAL_LIVES = 5;

const DIFFICULTY_CONFIG = {
  easy: { baseSpeed: 0.5, speedIncrement: 0.06, spawnInterval: 1400, spawnIntervalDecrement: 30, minSpawnInterval: 600 },
  medium: { baseSpeed: 0.8, speedIncrement: 0.08, spawnInterval: 1000, spawnIntervalDecrement: 30, minSpawnInterval: 400 },
  hard: { baseSpeed: 1.1, speedIncrement: 0.1, spawnInterval: 700, spawnIntervalDecrement: 25, minSpawnInterval: 300 },
};

const DIFFICULTY_META: Record<string, { label: string; emoji: string; color: string }> = {
  easy: { label: "Easy", emoji: "🌤️", color: "#22c55e" },
  medium: { label: "Medium", emoji: "🌦️", color: "#f59e0b" },
  hard: { label: "Hard", emoji: "⛈️", color: "#ef4444" },
  auto: { label: "Auto", emoji: "🎯", color: "#6366f1" },
};

function getCategoryColor(cat: string): string {
  return CATEGORIES.find((c) => c.id === cat)?.color || "#6366f1";
}

const STARS = Array.from({ length: 50 }).map((_, i) => ({
  id: i,
  size: 1 + (((i * 7 + 3) % 5) / 5) * 2.5,
  left: ((i * 31 + 17) % 100),
  top: ((i * 43 + 7) % 60),
  opacity: 0.1 + (((i * 13 + 5) % 10) / 10) * 0.3,
  delay: ((i * 11 + 3) % 30) / 10,
  duration: 2 + (((i * 17 + 1) % 10) / 10) * 4,
}));

// ── Component ──

export function LetterRainGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const levelStartRef = useRef<number>(0);
  const [scale, setScale] = useState(1);

  const [phase, setPhase] = useState<GamePhase>("menu");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [sentence, setSentence] = useState("");
  const [sentenceCategory, setSentenceCategory] = useState("");
  const [nextCharIndex, setNextCharIndex] = useState(0);
  const [, setBuiltText] = useState("");
  const [letters, setLetters] = useState<FallingLetter[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [usedSentences] = useState<Set<number>>(new Set());
  const [totalCaught, setTotalCaught] = useState(0);
  const [totalMissed, setTotalMissed] = useState(0);
  const [chosenDifficulty, setChosenDifficulty] = useState<ChosenDifficulty>("auto");
  const [highScore, setHighScore] = useState(() => getLocalHighScore("letterRain_highScore"));
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [elapsedSecs, setElapsedSecs] = useState(0);

  useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return;
      setScale(Math.min(1, containerRef.current.clientWidth / GAME_WIDTH));
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Elapsed time tracker
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => {
      setElapsedSecs(Math.floor((performance.now() - levelStartRef.current) / 1000));
    }, 500);
    return () => clearInterval(t);
  }, [phase]);

  const getActiveDifficulty = useCallback(
    (lvl: number) => {
      if (chosenDifficulty !== "auto") return chosenDifficulty;
      if (lvl <= 3) return "easy";
      if (lvl <= 7) return "medium";
      return "hard";
    },
    [chosenDifficulty]
  );

  const prepareLetters = useCallback((text: string): FallingLetter[] => {
    const result: FallingLetter[] = [];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === " ") continue;
      result.push({
        id: `${i}-${Math.random().toString(36).slice(2, 6)}`,
        char: text[i].toUpperCase(),
        sentenceIndex: i,
        x: 50 + Math.random() * (GAME_WIDTH - 100),
        y: -LETTER_SIZE - Math.random() * 60,
        speed: 0,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        spawned: false,
        caught: false,
        missed: false,
      });
    }
    return result;
  }, []);

  const startLevel = useCallback(
    (lvl: number) => {
      const diff = getActiveDifficulty(lvl);
      const { sentence: picked, index } = pickSentence(diff, usedSentences, selectedCategory);
      usedSentences.add(index);
      setSentence(picked.text);
      setSentenceCategory(picked.category);
      setNextCharIndex(0);
      setBuiltText("");
      setLetters(prepareLetters(picked.text));
      spawnTimerRef.current = 0;
      setElapsedSecs(0);
      setPhase("intro");
      setTimeout(() => {
        setPhase("playing");
        lastTimeRef.current = performance.now();
        levelStartRef.current = performance.now();
      }, 2500 + picked.text.length * 25);
    },
    [getActiveDifficulty, prepareLetters, usedSentences, selectedCategory]
  );

  // Water splash particles
  const spawnSplash = useCallback(
    (x: number, y: number, color: string, count: number, char?: string) => {
      const newP: Particle[] = [];
      // Water droplets
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
        const speed = 2 + Math.random() * 4;
        newP.push({
          id: `s-${Date.now()}-${i}`,
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color,
          size: 2 + Math.random() * 5,
          type: "splash",
        });
      }
      // Sparkle ring
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        newP.push({
          id: `k-${Date.now()}-${i}`,
          x: x + Math.cos(angle) * 15,
          y: y + Math.sin(angle) * 15,
          vx: Math.cos(angle) * 1,
          vy: Math.sin(angle) * 1,
          life: 0.8,
          color: "#ffffff",
          size: 2,
          type: "sparkle",
        });
      }
      // Floating letter
      if (char) {
        newP.push({
          id: `t-${Date.now()}`,
          x, y: y - 10,
          vx: 0,
          vy: -1.5,
          life: 1,
          color,
          size: 16,
          type: "text",
          char,
        });
      }
      setParticles((prev) => [...prev, ...newP]);
    },
    []
  );

  // Ground ripple when letter misses
  const spawnRipple = useCallback((x: number) => {
    const newP: Particle[] = [];
    for (let i = 0; i < 3; i++) {
      newP.push({
        id: `r-${Date.now()}-${i}`,
        x,
        y: GROUND_Y,
        vx: 0,
        vy: 0,
        life: 0.8,
        color: "#ef4444",
        size: 10 + i * 15,
        type: "ripple",
      });
    }
    setParticles((prev) => [...prev, ...newP]);
  }, []);

  const handleLetterClick = useCallback(
    (letterId: string) => {
      if (phase !== "playing") return;
      setLetters((prev) => {
        const letter = prev.find((l) => l.id === letterId);
        if (!letter || letter.caught || letter.missed) return prev;

        let expectedIndex = nextCharIndex;
        while (expectedIndex < sentence.length && sentence[expectedIndex] === " ") expectedIndex++;

        if (letter.sentenceIndex === expectedIndex) {
          const newCombo = combo + 1;
          const multiplier = 1 + Math.floor(newCombo / 5) * 0.5;
          const points = Math.round(10 * multiplier);
          setScore((s) => s + points);
          setCombo(newCombo);
          setBestCombo((bc) => Math.max(bc, newCombo));
          setTotalCaught((c) => c + 1);

          let addedText = "";
          for (let i = nextCharIndex; i <= letter.sentenceIndex; i++) addedText += sentence[i];
          setBuiltText((bt) => bt + addedText);
          setNextCharIndex(letter.sentenceIndex + 1);

          spawnSplash(letter.x + LETTER_SIZE / 2, letter.y + LETTER_SIZE / 2, getCategoryColor(sentenceCategory), 12, letter.char);
          setFlash("good");
          setTimeout(() => setFlash(null), 150);

          const remaining = sentence.slice(letter.sentenceIndex + 1);
          if (!remaining.split("").some((c) => c !== " ")) {
            setScore((s) => s + 50 * level);
            setTimeout(() => setPhase("levelComplete"), 300);
          }
          return prev.map((l) => (l.id === letterId ? { ...l, caught: true } : l));
        } else {
          setCombo(0);
          setFlash("bad");
          setTimeout(() => setFlash(null), 200);
          return prev;
        }
      });
    },
    [phase, nextCharIndex, sentence, combo, level, spawnSplash, sentenceCategory]
  );

  // Game loop
  useEffect(() => {
    if (phase !== "playing") return;
    const diff = getActiveDifficulty(level);
    const config = DIFFICULTY_CONFIG[diff];
    const currentSpeed = config.baseSpeed + (level - 1) * config.speedIncrement;
    const currentSpawnInterval = Math.max(config.minSpawnInterval, config.spawnInterval - (level - 1) * config.spawnIntervalDecrement);

    function gameLoop(time: number) {
      const dt = Math.min(time - lastTimeRef.current, 50);
      lastTimeRef.current = time;

      spawnTimerRef.current += dt;
      if (spawnTimerRef.current >= currentSpawnInterval) {
        spawnTimerRef.current = 0;
        setLetters((prev) => {
          const unspawned = prev.filter((l) => !l.spawned && !l.caught);
          if (unspawned.length === 0) return prev;
          const toSpawn = unspawned[0];
          return prev.map((l) =>
            l.id === toSpawn.id
              ? { ...l, spawned: true, speed: currentSpeed * (0.85 + Math.random() * 0.3), x: 40 + Math.random() * (GAME_WIDTH - 80) }
              : l
          );
        });
      }

      setLetters((prev) => {
        let lostLife = false;
        let missX = 0;
        const updated = prev.map((l) => {
          if (!l.spawned || l.caught || l.missed) return l;
          const newY = l.y + l.speed * dt * 0.06;
          const newWobble = l.wobble + l.wobbleSpeed * dt;
          if (newY >= GROUND_Y) { lostLife = true; missX = l.x + LETTER_SIZE / 2; return { ...l, y: GROUND_Y, missed: true }; }
          return { ...l, y: newY, wobble: newWobble };
        });
        if (lostLife) {
          spawnRipple(missX);
          setTotalMissed((m) => m + 1);
          setLives((lv) => {
            const nl = lv - 1;
            if (nl <= 0) setTimeout(() => {
              setPhase("gameOver");
              setScore((cs) => { setHighScore((ch) => { if (cs > ch) { setLocalHighScore("letterRain_highScore", cs); return cs; } return ch; }); return cs; });
            }, 300);
            return nl;
          });
          setCombo(0);
          setFlash("bad");
          setTimeout(() => setFlash(null), 200);
        }
        return updated;
      });

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.type === "splash" ? p.vy + 0.15 : p.vy,
          life: p.life - (p.type === "ripple" ? 0.04 : p.type === "text" ? 0.02 : 0.03),
          size: p.type === "ripple" ? p.size + 2 : p.size,
        })).filter((p) => p.life > 0)
      );
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [phase, level, getActiveDifficulty, spawnRipple]);

  const startGame = () => {
    setScore(0); setLives(INITIAL_LIVES); setLevel(1); setCombo(0); setBestCombo(0);
    setTotalCaught(0); setTotalMissed(0); setElapsedSecs(0);
    usedSentences.clear();
    startLevel(1);
  };
  const nextLevel = () => { const n = level + 1; setLevel(n); startLevel(n); };

  const catColor = getCategoryColor(sentenceCategory);
  const activeDiff = getActiveDifficulty(level);
  const accuracy = totalCaught + totalMissed > 0 ? Math.round((totalCaught / (totalCaught + totalMissed)) * 100) : 100;
  const lpm = elapsedSecs > 0 ? Math.round((totalCaught / elapsedSecs) * 60) : 0;

  // Compute which char index is the next expected letter
  const nextExpectedIdx = (() => {
    let idx = nextCharIndex;
    while (idx < sentence.length && sentence[idx] === " ") idx++;
    return idx;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060612] via-[#0a0e2a] to-[#060612] flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-[850px] px-4 pt-3 pb-1 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-base font-bold text-white tracking-wide">Letter Rain</h1>
        <div className="w-16" />
      </div>

      {/* Live stats bar — always visible during play */}
      {(phase === "playing" || phase === "levelComplete") && (
        <div className="w-full max-w-[850px] px-4 mb-1">
          <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 text-slate-400">
                <Target className="w-3.5 h-3.5" />
                <span className="text-white font-bold">{accuracy}%</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Gauge className="w-3.5 h-3.5" />
                <span className="text-white font-bold">{lpm}</span>
                <span className="text-slate-600 hidden sm:inline">lpm</span>
              </div>
              <div className="text-slate-600 hidden sm:block">{totalCaught}/{totalCaught + totalMissed}</div>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: DIFFICULTY_META[activeDiff].color }}>
              <span>{DIFFICULTY_META[activeDiff].emoji}</span>
              <span className="font-medium hidden sm:inline">{DIFFICULTY_META[activeDiff].label}</span>
              <span className="text-slate-500">Lv{level}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sentence tracker — shows full sentence with progress */}
      {phase === "playing" && sentence && (
        <div className="w-full max-w-[850px] px-4 mb-1">
          <div className="bg-white/[0.03] rounded-lg px-3 py-1.5 border border-white/5 font-mono text-xs sm:text-sm tracking-wide leading-relaxed overflow-x-auto whitespace-nowrap">
            {sentence.split("").map((ch, i) => {
              const isCaught = i < nextCharIndex;
              const isNext = i === nextExpectedIdx;
              const isSpace = ch === " ";
              return (
                <span
                  key={i}
                  className={`transition-colors duration-200 ${
                    isCaught
                      ? "text-green-400"
                      : isNext
                      ? "text-white font-bold"
                      : "text-slate-700"
                  }`}
                  style={isNext && !isSpace ? {
                    textShadow: `0 0 8px ${catColor}`,
                    borderBottom: `2px solid ${catColor}`,
                  } : undefined}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Game container */}
      <div ref={containerRef} className="relative w-full max-w-[850px] mx-auto px-4">
        <div
          className="relative mx-auto overflow-hidden rounded-2xl border border-white/[0.06] shadow-2xl"
          style={{
            width: GAME_WIDTH * scale,
            height: GAME_HEIGHT * scale,
            background: "linear-gradient(180deg, #060818 0%, #0a0f35 40%, #0e154a 70%, #121850 100%)",
          }}
        >
          {/* Stars */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {STARS.map((s) => (
              <div key={s.id} className="absolute rounded-full bg-white animate-pulse" style={{
                width: s.size, height: s.size, left: `${s.left}%`, top: `${s.top}%`,
                opacity: s.opacity, animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s`,
              }} />
            ))}
          </div>

          {/* Water surface / ground */}
          <div className="absolute left-0 right-0 bottom-0" style={{ height: 40 * scale }}>
            <div className="absolute inset-0" style={{
              background: "linear-gradient(180deg, transparent 0%, rgba(56,189,248,0.04) 30%, rgba(56,189,248,0.12) 100%)",
            }} />
            <div className="absolute top-0 left-0 right-0 h-px" style={{
              background: "linear-gradient(90deg, transparent 5%, rgba(56,189,248,0.3) 30%, rgba(56,189,248,0.5) 50%, rgba(56,189,248,0.3) 70%, transparent 95%)",
            }} />
          </div>

          {/* Flash */}
          {flash && (
            <div className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-150" style={{
              background: flash === "good"
                ? "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 60%)"
                : "radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 60%)",
            }} />
          )}

          {/* Scaled content */}
          <div className="absolute inset-0" style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>

            {/* HUD */}
            {phase !== "menu" && (
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-2.5 z-20">
                <div className="flex items-center gap-1">
                  {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                    <Heart key={i} className={`w-4.5 h-4.5 transition-all duration-300 ${i < lives ? "text-red-400 fill-red-400" : "text-slate-800 scale-75"}`} />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  {combo >= 3 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 animate-bounce">
                      <Zap className="w-3.5 h-3.5 fill-yellow-400" />
                      <span className="text-xs font-bold">x{combo}</span>
                    </div>
                  )}
                  <div className="text-xl font-bold text-white tabular-nums">{score.toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* MENU */}
            {phase === "menu" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-8">
                <div className="text-5xl mb-2">🌧️</div>
                <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">Letter Rain</h2>
                <p className="text-slate-500 text-center text-sm mb-4 max-w-xs">
                  Read the sentence, then catch falling letters in order to rebuild it!
                </p>

                <div className="grid grid-cols-4 gap-2 mb-4 w-full max-w-md">
                  {(["auto", "easy", "medium", "hard"] as ChosenDifficulty[]).map((d) => {
                    const meta = DIFFICULTY_META[d];
                    const sel = chosenDifficulty === d;
                    return (
                      <button key={d} onClick={() => setChosenDifficulty(d)}
                        className={`rounded-xl py-2 px-2 text-center transition-all border ${sel ? "border-white/20 bg-white/10 scale-105" : "border-white/5 bg-white/[0.02] hover:bg-white/5"}`}>
                        <div className="text-lg">{meta.emoji}</div>
                        <div className={`text-xs font-bold mt-0.5 ${sel ? "text-white" : "text-slate-500"}`}>{meta.label}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                  <button onClick={() => setSelectedCategory(undefined)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${!selectedCategory ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                    All
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${selectedCategory === cat.id ? "text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
                      style={selectedCategory === cat.id ? { backgroundColor: cat.color } : {}}>
                      {cat.label}
                    </button>
                  ))}
                </div>

                <button onClick={startGame} className="px-10 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25">
                  Play
                </button>
                {highScore > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-yellow-400/70 text-xs">
                    <Trophy className="w-3 h-3" /> Best: {highScore.toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* INTRO */}
            {phase === "intro" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-8">
                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 mb-4">
                  Level {level} · {DIFFICULTY_META[activeDiff].emoji} {DIFFICULTY_META[activeDiff].label}
                </div>
                <div className="text-2xl font-bold text-center leading-relaxed max-w-lg" style={{ color: catColor }}>
                  &ldquo;{sentence}&rdquo;
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: catColor }} />
                  <span className="text-xs text-slate-500">Memorize this sentence...</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-1.5 px-3 py-0.5 rounded-full" style={{ color: catColor, backgroundColor: `${catColor}15` }}>
                  {sentenceCategory}
                </div>
              </div>
            )}

            {/* FALLING LETTERS — Water drop style */}
            {(phase === "playing" || phase === "levelComplete") &&
              letters.map((letter) => {
                if (!letter.spawned || letter.caught) return null;
                const isNext = letter.sentenceIndex === nextExpectedIdx;
                const wobbleX = Math.sin(letter.wobble) * 3;
                return (
                  <button
                    key={letter.id}
                    onClick={() => handleLetterClick(letter.id)}
                    disabled={letter.missed}
                    className={`absolute flex items-center justify-center select-none
                      ${letter.missed ? "opacity-15 pointer-events-none" : "cursor-pointer hover:scale-110 active:scale-90"}`}
                    style={{
                      width: LETTER_SIZE,
                      height: LETTER_SIZE,
                      left: letter.x + wobbleX,
                      top: letter.y,
                      borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%",
                      background: letter.missed
                        ? "rgba(40,40,60,0.3)"
                        : isNext
                        ? `radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.25), ${catColor}ee 40%, ${catColor}99 100%)`
                        : `radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.15), ${catColor}aa 40%, ${catColor}55 100%)`,
                      boxShadow: letter.missed
                        ? "none"
                        : isNext
                        ? `0 0 25px ${catColor}50, 0 4px 20px ${catColor}30, inset 0 -3px 6px rgba(0,0,0,0.15)`
                        : `0 0 10px ${catColor}20, 0 2px 8px rgba(0,0,0,0.2), inset 0 -2px 4px rgba(0,0,0,0.1)`,
                      fontSize: "1.2rem",
                      fontWeight: 800,
                      color: letter.missed ? "#333" : "white",
                      textShadow: letter.missed ? "none" : "0 1px 4px rgba(0,0,0,0.5)",
                      transition: "transform 0.08s",
                      border: isNext ? `2px solid rgba(255,255,255,0.25)` : "none",
                    }}
                  >
                    {letter.char}
                  </button>
                );
              })}

            {/* Particles */}
            {particles.map((p) => (
              <div key={p.id} className="absolute pointer-events-none" style={{
                left: p.x, top: p.y, opacity: p.life,
              }}>
                {p.type === "text" && p.char ? (
                  <span className="text-base font-black" style={{ color: p.color, textShadow: `0 0 12px ${p.color}`, fontSize: p.size }}>{p.char}</span>
                ) : p.type === "ripple" ? (
                  <div style={{
                    width: p.size, height: p.size * 0.3,
                    borderRadius: "50%",
                    border: `1px solid ${p.color}`,
                    transform: "translate(-50%, -50%)",
                  }} />
                ) : p.type === "sparkle" ? (
                  <div style={{
                    width: p.size, height: p.size,
                    borderRadius: "50%",
                    backgroundColor: p.color,
                    boxShadow: `0 0 4px ${p.color}`,
                  }} />
                ) : (
                  <div style={{
                    width: p.size, height: p.size,
                    borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%",
                    backgroundColor: p.color,
                    opacity: 0.7,
                  }} />
                )}
              </div>
            ))}

            {/* Level complete */}
            {phase === "levelComplete" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/40 backdrop-blur-sm">
                <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 mb-2 animate-bounce" />
                <h3 className="text-2xl font-bold text-white mb-1">Level {level} Complete!</h3>
                <div className="flex gap-4 text-center text-xs mb-3">
                  <div><div className="text-lg font-bold text-green-400">{accuracy}%</div><div className="text-slate-500">Accuracy</div></div>
                  <div><div className="text-lg font-bold text-cyan-400">{lpm}</div><div className="text-slate-500">LPM</div></div>
                  <div><div className="text-lg font-bold text-yellow-400">+{50 * level}</div><div className="text-slate-500">Bonus</div></div>
                </div>
                <button onClick={nextLevel} className="px-8 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25">
                  Next Level
                </button>
              </div>
            )}

            {/* Game over */}
            {phase === "gameOver" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/50 backdrop-blur-sm px-6">
                <h3 className="text-2xl font-bold text-white mb-2">Game Over</h3>
                <div className="text-4xl font-bold text-indigo-400 mb-3">{score.toLocaleString()}</div>

                <div className="grid grid-cols-4 gap-3 mb-3 text-center w-full max-w-sm">
                  <div><div className="text-xl font-bold text-white">{level}</div><div className="text-[9px] text-slate-500 uppercase">Level</div></div>
                  <div><div className="text-xl font-bold text-green-400">{accuracy}%</div><div className="text-[9px] text-slate-500 uppercase">Accuracy</div></div>
                  <div><div className="text-xl font-bold text-cyan-400">{lpm}</div><div className="text-[9px] text-slate-500 uppercase">LPM</div></div>
                  <div><div className="text-xl font-bold text-yellow-400">x{bestCombo}</div><div className="text-[9px] text-slate-500 uppercase">Combo</div></div>
                </div>

                {score >= highScore && score > 0 && (
                  <p className="text-yellow-400 text-sm font-medium mb-1.5 flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> New High Score!</p>
                )}
                <div className="mb-2 w-full max-w-xs"><ScoreSubmit game="letter-rain" score={score} level={level} stats={{ accuracy: `${accuracy}%`, lpm, bestCombo }} /></div>
                <div className="flex gap-3">
                  <button onClick={startGame} className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm">
                    <RotateCcw className="w-3.5 h-3.5" /> Again
                  </button>
                  <Link href="/games" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all text-sm">Back</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      {phase === "menu" && (
        <div className="max-w-md mx-auto px-4 mt-4 mb-6">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/5">
              <div className="text-lg mb-0.5">👀</div>
              <div className="text-[10px] text-slate-500">Read the sentence</div>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/5">
              <div className="text-lg mb-0.5">💧</div>
              <div className="text-[10px] text-slate-500">Tap drops in order</div>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/5">
              <div className="text-lg mb-0.5">⚡</div>
              <div className="text-[10px] text-slate-500">Build combos for pts</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
