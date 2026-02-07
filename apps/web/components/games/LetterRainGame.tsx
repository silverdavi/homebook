"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Star, Trophy, RotateCcw, ArrowLeft, Zap, BarChart3 } from "lucide-react";
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
  rotation: number;
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
  char?: string;
}

type GamePhase = "menu" | "intro" | "playing" | "levelComplete" | "gameOver";
type ChosenDifficulty = "easy" | "medium" | "hard" | "auto";

// ── Constants ──

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const LETTER_SIZE = 48;
const GROUND_Y = GAME_HEIGHT - 50;
const INITIAL_LIVES = 5;

const DIFFICULTY_CONFIG = {
  easy: { baseSpeed: 0.5, speedIncrement: 0.06, spawnInterval: 1400, spawnIntervalDecrement: 30, minSpawnInterval: 600 },
  medium: { baseSpeed: 0.8, speedIncrement: 0.08, spawnInterval: 1000, spawnIntervalDecrement: 30, minSpawnInterval: 400 },
  hard: { baseSpeed: 1.1, speedIncrement: 0.1, spawnInterval: 700, spawnIntervalDecrement: 25, minSpawnInterval: 300 },
};

const DIFFICULTY_META = {
  easy: { label: "Easy", description: "Slow rain, short sentences", emoji: "🌤️", color: "#22c55e" },
  medium: { label: "Medium", description: "Moderate speed, longer sentences", emoji: "🌦️", color: "#f59e0b" },
  hard: { label: "Hard", description: "Fast rain, challenging sentences", emoji: "⛈️", color: "#ef4444" },
  auto: { label: "Auto", description: "Starts easy, gets harder each level", emoji: "🎯", color: "#6366f1" },
};

function getCategoryColor(cat: string): string {
  return CATEGORIES.find((c) => c.id === cat)?.color || "#6366f1";
}

// Pre-generate star positions
const STARS = Array.from({ length: 50 }).map((_, i) => ({
  id: i,
  size: 1 + (((i * 7 + 3) % 5) / 5) * 2.5,
  left: ((i * 31 + 17) % 100),
  top: ((i * 43 + 7) % 70),
  opacity: 0.15 + (((i * 13 + 5) % 10) / 10) * 0.4,
  delay: ((i * 11 + 3) % 30) / 10,
  duration: 2 + (((i * 17 + 1) % 10) / 10) * 4,
}));

// ── Component ──

export function LetterRainGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
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
  const [builtText, setBuiltText] = useState("");
  const [letters, setLetters] = useState<FallingLetter[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [usedSentences] = useState<Set<number>>(new Set());
  const [totalCaught, setTotalCaught] = useState(0);
  const [totalMissed, setTotalMissed] = useState(0);
  const [chosenDifficulty, setChosenDifficulty] = useState<ChosenDifficulty>("auto");
  const [showStats, setShowStats] = useState(false);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("letterRain_highScore"));
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return;
      setScale(Math.min(1, containerRef.current.clientWidth / GAME_WIDTH));
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        rotation: (Math.random() - 0.5) * 20,
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
      setPhase("intro");
      setTimeout(() => {
        setPhase("playing");
        lastTimeRef.current = performance.now();
      }, 2500 + picked.text.length * 25);
    },
    [getActiveDifficulty, prepareLetters, usedSentences, selectedCategory]
  );

  const spawnParticles = useCallback(
    (x: number, y: number, color: string, count: number, char?: string) => {
      const newP: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 1.5 + Math.random() * 3;
        newP.push({
          id: `p-${Date.now()}-${i}`,
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          life: 1,
          color,
          size: 3 + Math.random() * 5,
          char: i === 0 ? char : undefined,
        });
      }
      setParticles((prev) => [...prev, ...newP]);
    },
    []
  );

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

          spawnParticles(letter.x + LETTER_SIZE / 2, letter.y + LETTER_SIZE / 2, getCategoryColor(sentenceCategory), 10, letter.char);
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
    [phase, nextCharIndex, sentence, combo, level, spawnParticles, sentenceCategory]
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
              ? { ...l, spawned: true, speed: currentSpeed * (0.8 + Math.random() * 0.4), x: 40 + Math.random() * (GAME_WIDTH - 80) }
              : l
          );
        });
      }

      setLetters((prev) => {
        let lostLife = false;
        const updated = prev.map((l) => {
          if (!l.spawned || l.caught || l.missed) return l;
          const newY = l.y + l.speed * dt * 0.06;
          if (newY >= GROUND_Y) { lostLife = true; return { ...l, y: GROUND_Y, missed: true }; }
          return { ...l, y: newY, rotation: l.rotation + (l.speed * dt * 0.003) };
        });
        if (lostLife) {
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
        prev.map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.1, life: p.life - 0.025 })).filter((p) => p.life > 0)
      );
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [phase, level, getActiveDifficulty]);

  const startGame = () => {
    setScore(0); setLives(INITIAL_LIVES); setLevel(1); setCombo(0); setBestCombo(0);
    setTotalCaught(0); setTotalMissed(0); setShowStats(false);
    usedSentences.clear();
    startLevel(1);
  };
  const nextLevel = () => { const n = level + 1; setLevel(n); startLevel(n); };

  const catColor = getCategoryColor(sentenceCategory);
  const activeDiff = getActiveDifficulty(level);
  const accuracy = totalCaught + totalMissed > 0 ? Math.round((totalCaught / (totalCaught + totalMissed)) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0d1033] to-[#0a0a1a] flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-[850px] px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white tracking-wide">Letter Rain</h1>
        {phase !== "menu" && (
          <button onClick={() => setShowStats(!showStats)} className="text-slate-400 hover:text-white transition-colors">
            <BarChart3 className="w-4 h-4" />
          </button>
        )}
        {phase === "menu" && <div className="w-8" />}
      </div>

      {/* Stats overlay */}
      {showStats && phase !== "menu" && (
        <div className="w-full max-w-[850px] px-4 mb-2">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-3 grid grid-cols-4 gap-3 text-center text-xs">
            <div><div className="text-slate-400">Accuracy</div><div className="text-white font-bold text-lg">{accuracy}%</div></div>
            <div><div className="text-slate-400">Caught</div><div className="text-green-400 font-bold text-lg">{totalCaught}</div></div>
            <div><div className="text-slate-400">Missed</div><div className="text-red-400 font-bold text-lg">{totalMissed}</div></div>
            <div><div className="text-slate-400">Difficulty</div><div className="font-bold text-lg" style={{ color: DIFFICULTY_META[activeDiff].color }}>{DIFFICULTY_META[activeDiff].emoji}</div></div>
          </div>
        </div>
      )}

      {/* Game container */}
      <div ref={containerRef} className="relative w-full max-w-[850px] mx-auto px-4">
        <div
          className="relative mx-auto overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
          style={{
            width: GAME_WIDTH * scale,
            height: GAME_HEIGHT * scale,
            background: "linear-gradient(180deg, #080820 0%, #0d1040 40%, #151560 70%, #1a1a50 100%)",
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

          {/* Ground with glow */}
          <div className="absolute left-0 right-0 bottom-0" style={{ height: 50 * scale }}>
            <div className="absolute inset-0" style={{
              background: "linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.08) 30%, rgba(99,102,241,0.2) 100%)",
            }} />
            <div className="absolute top-0 left-0 right-0 h-px" style={{
              background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)",
            }} />
          </div>

          {/* Flash */}
          {flash && (
            <div className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-150" style={{
              background: flash === "good"
                ? "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)",
            }} />
          )}

          {/* Scaled content */}
          <div className="absolute inset-0" style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>

            {/* HUD */}
            {phase !== "menu" && (
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 z-20">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                    <Heart key={i} className={`w-5 h-5 transition-all duration-300 ${i < lives ? "text-red-400 fill-red-400" : "text-slate-800 scale-75"}`} />
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  {combo >= 3 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 animate-bounce">
                      <Zap className="w-3.5 h-3.5 fill-yellow-400" />
                      <span className="text-xs font-bold">x{combo}</span>
                    </div>
                  )}
                  <div className="text-right">
                    <div className="text-xl font-bold text-white tabular-nums leading-tight">{score.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Lvl {level} · {DIFFICULTY_META[activeDiff].emoji} {DIFFICULTY_META[activeDiff].label}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MENU */}
            {phase === "menu" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-8">
                <div className="text-5xl mb-3">🌧️</div>
                <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">Letter Rain</h2>
                <p className="text-slate-500 text-center text-sm mb-5 max-w-xs">
                  Read the sentence, then catch falling letters in order to rebuild it!
                </p>

                {/* Difficulty picker */}
                <div className="grid grid-cols-4 gap-2 mb-5 w-full max-w-md">
                  {(["auto", "easy", "medium", "hard"] as ChosenDifficulty[]).map((d) => {
                    const meta = DIFFICULTY_META[d];
                    const isSelected = chosenDifficulty === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setChosenDifficulty(d)}
                        className={`rounded-xl py-2.5 px-2 text-center transition-all border ${
                          isSelected
                            ? "border-white/20 bg-white/10 scale-105"
                            : "border-white/5 bg-white/[0.02] hover:bg-white/5"
                        }`}
                      >
                        <div className="text-lg">{meta.emoji}</div>
                        <div className={`text-xs font-bold mt-0.5 ${isSelected ? "text-white" : "text-slate-400"}`}>
                          {meta.label}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Category */}
                <div className="flex flex-wrap gap-1.5 justify-center mb-5">
                  <button onClick={() => setSelectedCategory(undefined)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${!selectedCategory ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                    All
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${selectedCategory === cat.id ? "text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
                      style={selectedCategory === cat.id ? { backgroundColor: cat.color } : {}}>
                      {cat.label}
                    </button>
                  ))}
                </div>

                <button onClick={startGame} className="px-10 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25">
                  Play
                </button>

                {highScore > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 text-yellow-400/80 text-xs">
                    <Trophy className="w-3.5 h-3.5" /> High Score: {highScore.toLocaleString()}
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
                <div className="text-2xl md:text-3xl font-bold text-center leading-relaxed max-w-lg" style={{ color: catColor }}>
                  &ldquo;{sentence}&rdquo;
                </div>
                <div className="mt-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: catColor }} />
                  <span className="text-xs text-slate-500">Memorize this sentence...</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-2 px-3 py-1 rounded-full" style={{ color: catColor, backgroundColor: `${catColor}15` }}>
                  {sentenceCategory}
                </div>
              </div>
            )}

            {/* FALLING LETTERS — Bubble style */}
            {(phase === "playing" || phase === "levelComplete") &&
              letters.map((letter) => {
                if (!letter.spawned || letter.caught) return null;
                const isNext = (() => {
                  let idx = nextCharIndex;
                  while (idx < sentence.length && sentence[idx] === " ") idx++;
                  return letter.sentenceIndex === idx;
                })();
                return (
                  <button
                    key={letter.id}
                    onClick={() => handleLetterClick(letter.id)}
                    disabled={letter.missed}
                    className={`absolute flex items-center justify-center select-none transition-transform duration-75
                      ${letter.missed ? "opacity-20" : "cursor-pointer hover:scale-125 active:scale-90"}`}
                    style={{
                      width: LETTER_SIZE,
                      height: LETTER_SIZE,
                      left: letter.x,
                      top: letter.y,
                      transform: `rotate(${letter.rotation}deg)`,
                      borderRadius: "50%",
                      background: letter.missed
                        ? "rgba(60,60,80,0.4)"
                        : isNext
                        ? `radial-gradient(circle at 35% 35%, ${catColor}ff, ${catColor}aa)`
                        : `radial-gradient(circle at 35% 35%, ${catColor}cc, ${catColor}66)`,
                      boxShadow: letter.missed
                        ? "none"
                        : isNext
                        ? `0 0 20px ${catColor}60, 0 0 40px ${catColor}30, inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.15)`
                        : `0 0 12px ${catColor}30, inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)`,
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      color: letter.missed ? "#444" : "white",
                      textShadow: letter.missed ? "none" : "0 1px 3px rgba(0,0,0,0.4)",
                      border: isNext && !letter.missed ? "2px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
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
                {p.char ? (
                  <span className="text-sm font-bold" style={{ color: p.color, textShadow: `0 0 8px ${p.color}` }}>{p.char}</span>
                ) : (
                  <div className="rounded-full" style={{ width: p.size, height: p.size, backgroundColor: p.color }} />
                )}
              </div>
            ))}

            {/* Built text */}
            {phase === "playing" && (
              <div className="absolute bottom-14 left-4 right-4 z-20">
                <div className="bg-black/50 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/5">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Building sentence</div>
                  <div className="text-white font-medium text-base min-h-[1.5em] tracking-wide leading-relaxed">
                    {builtText}<span className="animate-pulse text-indigo-400 font-light">|</span>
                  </div>
                </div>
              </div>
            )}

            {/* Level complete */}
            {phase === "levelComplete" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/40 backdrop-blur-sm">
                <Star className="w-14 h-14 text-yellow-400 fill-yellow-400 mb-3 animate-bounce" />
                <h3 className="text-2xl font-bold text-white mb-1">Level {level} Complete!</h3>
                <p className="text-slate-400 text-sm mb-1">+{50 * level} level bonus</p>
                <p className="text-slate-500 text-xs mb-4">Accuracy: {accuracy}%</p>
                <button onClick={nextLevel} className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25">
                  Next Level
                </button>
              </div>
            )}

            {/* Game over */}
            {phase === "gameOver" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/50 backdrop-blur-sm">
                <h3 className="text-3xl font-bold text-white mb-3">Game Over</h3>
                <div className="text-5xl font-bold text-indigo-400 mb-4">{score.toLocaleString()}</div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{level}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Level</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">{accuracy}%</div>
                    <div className="text-[10px] text-slate-500 uppercase">Accuracy</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">x{bestCombo}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Best Combo</div>
                  </div>
                </div>

                {score >= highScore && score > 0 && (
                  <p className="text-yellow-400 text-sm font-medium mb-2 flex items-center gap-1">
                    <Trophy className="w-4 h-4" /> New High Score!
                  </p>
                )}

                <div className="mb-3">
                  <ScoreSubmit game="letter-rain" score={score} level={level} stats={{ accuracy: `${accuracy}%`, bestCombo: bestCombo }} />
                </div>

                <div className="flex gap-3">
                  <button onClick={startGame} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
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
      </div>

      {/* Instructions below game */}
      {phase === "menu" && (
        <div className="max-w-md mx-auto px-4 mt-5 mb-8">
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
              <div className="text-xl mb-1">👀</div>
              <div className="text-[11px] text-slate-500">Read the sentence</div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
              <div className="text-xl mb-1">🎯</div>
              <div className="text-[11px] text-slate-500">Tap letters in order</div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
              <div className="text-xl mb-1">⚡</div>
              <div className="text-[11px] text-slate-500">Build combos for points</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
