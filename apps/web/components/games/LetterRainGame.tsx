"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Star, Trophy, RotateCcw, ArrowLeft, Zap } from "lucide-react";
import { pickSentence, CATEGORIES } from "@/lib/games/sentences";
import Link from "next/link";

// ── Types ──────────────────────────────────────────

interface FallingLetter {
  id: string;
  char: string;
  /** index in the sentence string (for ordering) */
  sentenceIndex: number;
  x: number;
  y: number;
  speed: number;
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
}

type GamePhase = "menu" | "intro" | "playing" | "levelComplete" | "gameOver";

// ── Constants ──────────────────────────────────────

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const LETTER_SIZE = 44;
const GROUND_Y = GAME_HEIGHT - 40;
const INITIAL_LIVES = 5;

const DIFFICULTY_CONFIG = {
  easy: {
    baseSpeed: 0.6,
    speedIncrement: 0.08,
    spawnInterval: 1200,
    spawnIntervalDecrement: 40,
    minSpawnInterval: 500,
  },
  medium: {
    baseSpeed: 0.9,
    speedIncrement: 0.1,
    spawnInterval: 900,
    spawnIntervalDecrement: 35,
    minSpawnInterval: 350,
  },
  hard: {
    baseSpeed: 1.2,
    speedIncrement: 0.12,
    spawnInterval: 700,
    spawnIntervalDecrement: 30,
    minSpawnInterval: 250,
  },
};

// ── Helper ─────────────────────────────────────────

function getCategoryColor(cat: string): string {
  return CATEGORIES.find((c) => c.id === cat)?.color || "#6366f1";
}

// Pre-generate star positions (must be outside component to avoid impure render)
const STARS = Array.from({ length: 40 }).map((_, i) => ({
  id: i,
  width: 1 + (((i * 7 + 3) % 5) / 5) * 2,
  left: ((i * 31 + 17) % 100),
  top: ((i * 43 + 7) % 70),
  opacity: 0.2 + (((i * 13 + 5) % 10) / 10) * 0.5,
  delay: ((i * 11 + 3) % 30) / 10,
  duration: 2 + (((i * 17 + 1) % 10) / 10) * 3,
}));

// ── Component ──────────────────────────────────────

export function LetterRainGame() {
  // Refs for game loop
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const nextSpawnIndexRef = useRef<number>(0);
  const [scale, setScale] = useState(1);

  // Game state
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
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("letterRain_highScore");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  // Responsive scaling
  useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      setScale(Math.min(1, w / GAME_WIDTH));
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Determine difficulty from level ──

  const getDifficulty = useCallback((lvl: number) => {
    if (lvl <= 3) return "easy";
    if (lvl <= 7) return "medium";
    return "hard";
  }, []);

  // ── Prepare letters for a sentence ──

  const prepareLetters = useCallback((text: string): FallingLetter[] => {
    const result: FallingLetter[] = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      // Skip spaces — auto-filled
      if (ch === " ") continue;
      result.push({
        id: `${i}-${Math.random().toString(36).slice(2, 6)}`,
        char: ch.toUpperCase(),
        sentenceIndex: i,
        x: 50 + Math.random() * (GAME_WIDTH - 100),
        y: -LETTER_SIZE - Math.random() * 60,
        speed: 0,
        spawned: false,
        caught: false,
        missed: false,
      });
    }
    return result;
  }, []);

  // ── Start a level ──

  const startLevel = useCallback(
    (lvl: number) => {
      const diff = getDifficulty(lvl);
      const { sentence: picked, index } = pickSentence(diff, usedSentences, selectedCategory);
      usedSentences.add(index);

      setSentence(picked.text);
      setSentenceCategory(picked.category);
      setNextCharIndex(0);
      setBuiltText("");
      setLetters(prepareLetters(picked.text));
      nextSpawnIndexRef.current = 0;
      spawnTimerRef.current = 0;
      setPhase("intro");

      // Show sentence for reading, then start
      setTimeout(() => {
        setPhase("playing");
        lastTimeRef.current = performance.now();
      }, 3000 + picked.text.length * 30); // longer sentences get more reading time
    },
    [getDifficulty, prepareLetters, usedSentences, selectedCategory]
  );

  // ── Spawn particles ──

  const spawnParticles = useCallback(
    (x: number, y: number, color: string, count: number) => {
      const newP: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 2 + Math.random() * 3;
        newP.push({
          id: `p-${Date.now()}-${i}`,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          life: 1,
          color,
          size: 3 + Math.random() * 4,
        });
      }
      setParticles((prev) => [...prev, ...newP]);
    },
    []
  );

  // ── Handle letter click ──

  const handleLetterClick = useCallback(
    (letterId: string) => {
      if (phase !== "playing") return;

      setLetters((prev) => {
        const letter = prev.find((l) => l.id === letterId);
        if (!letter || letter.caught || letter.missed) return prev;

        // Find next expected non-space character
        let expectedIndex = nextCharIndex;
        while (expectedIndex < sentence.length && sentence[expectedIndex] === " ") {
          expectedIndex++;
        }

        if (letter.sentenceIndex === expectedIndex) {
          // Correct!
          const newCombo = combo + 1;
          const comboMultiplier = 1 + Math.floor(newCombo / 5) * 0.5;
          const points = Math.round(10 * comboMultiplier);

          setScore((s) => s + points);
          setCombo(newCombo);
          setBestCombo((bc) => Math.max(bc, newCombo));

          // Build up the text including any skipped spaces
          let addedText = "";
          for (let i = nextCharIndex; i <= letter.sentenceIndex; i++) {
            addedText += sentence[i];
          }
          setBuiltText((bt) => bt + addedText);
          setNextCharIndex(letter.sentenceIndex + 1);

          // Particles
          spawnParticles(letter.x + LETTER_SIZE / 2, letter.y + LETTER_SIZE / 2, getCategoryColor(sentenceCategory), 8);

          // Flash
          setFlash("good");
          setTimeout(() => setFlash(null), 150);

          // Check if sentence complete
          const remaining = sentence.slice(letter.sentenceIndex + 1);
          const hasMoreLetters = remaining.split("").some((c) => c !== " ");
          if (!hasMoreLetters) {
            // Level complete!
            const levelBonus = 50 * level;
            setScore((s) => s + levelBonus);
            setTimeout(() => setPhase("levelComplete"), 300);
          }

          return prev.map((l) =>
            l.id === letterId ? { ...l, caught: true } : l
          );
        } else {
          // Wrong letter!
          setCombo(0);
          setFlash("bad");
          setTimeout(() => setFlash(null), 200);
          return prev;
        }
      });
    },
    [phase, nextCharIndex, sentence, combo, level, spawnParticles, sentenceCategory]
  );

  // ── Game loop ──

  useEffect(() => {
    if (phase !== "playing") return;

    const diff = getDifficulty(level);
    const config = DIFFICULTY_CONFIG[diff];
    const currentSpeed = config.baseSpeed + (level - 1) * config.speedIncrement;
    const currentSpawnInterval = Math.max(
      config.minSpawnInterval,
      config.spawnInterval - (level - 1) * config.spawnIntervalDecrement
    );

    function gameLoop(time: number) {
      const dt = Math.min(time - lastTimeRef.current, 50); // cap delta
      lastTimeRef.current = time;

      // Spawn letters
      spawnTimerRef.current += dt;
      if (spawnTimerRef.current >= currentSpawnInterval) {
        spawnTimerRef.current = 0;

        setLetters((prev) => {
          const unspawned = prev.filter((l) => !l.spawned && !l.caught);
          if (unspawned.length === 0) return prev;

          // Spawn the next one in order
          const toSpawn = unspawned[0];
          return prev.map((l) =>
            l.id === toSpawn.id
              ? {
                  ...l,
                  spawned: true,
                  speed: currentSpeed * (0.8 + Math.random() * 0.4),
                  x: 40 + Math.random() * (GAME_WIDTH - 80),
                }
              : l
          );
        });
      }

      // Move letters
      setLetters((prev) => {
        let lostLife = false;
        const updated = prev.map((l) => {
          if (!l.spawned || l.caught || l.missed) return l;
          const newY = l.y + l.speed * dt * 0.06;
          if (newY >= GROUND_Y) {
            lostLife = true;
            return { ...l, y: GROUND_Y, missed: true };
          }
          return { ...l, y: newY };
        });

        if (lostLife) {
          setLives((lv) => {
            const newLives = lv - 1;
            if (newLives <= 0) {
              setTimeout(() => {
                setPhase("gameOver");
                // Save high score
                setScore((currentScore) => {
                  setHighScore((currentHigh) => {
                    if (currentScore > currentHigh) {
                      localStorage.setItem("letterRain_highScore", currentScore.toString());
                      return currentScore;
                    }
                    return currentHigh;
                  });
                  return currentScore;
                });
              }, 300);
            }
            return newLives;
          });
          setCombo(0);
          setFlash("bad");
          setTimeout(() => setFlash(null), 200);
        }

        return updated;
      });

      // Update particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1,
            life: p.life - 0.02,
          }))
          .filter((p) => p.life > 0)
      );

      animFrameRef.current = requestAnimationFrame(gameLoop);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [phase, level, getDifficulty]);

  // ── Handlers ──

  const startGame = () => {
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setCombo(0);
    setBestCombo(0);
    usedSentences.clear();
    startLevel(1);
  };

  const nextLevel = () => {
    const next = level + 1;
    setLevel(next);
    startLevel(next);
  };

  // ── Render ──

  const catColor = getCategoryColor(sentenceCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-[850px] px-4 pt-4 pb-2 flex items-center justify-between">
        <Link
          href="/games"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Games
        </Link>
        <h1 className="text-lg font-bold text-white tracking-wide">
          Letter Rain
        </h1>
        <div className="w-16" /> {/* spacer */}
      </div>

      {/* Game container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[850px] mx-auto px-4"
      >
        <div
          className="relative mx-auto overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
          style={{
            width: GAME_WIDTH * scale,
            height: GAME_HEIGHT * scale,
            background: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
          }}
        >
          {/* Stars background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {STARS.map((star) => (
              <div
                key={star.id}
                className="absolute rounded-full bg-white animate-pulse"
                style={{
                  width: star.width,
                  height: star.width,
                  left: `${star.left}%`,
                  top: `${star.top}%`,
                  opacity: star.opacity,
                  animationDelay: `${star.delay}s`,
                  animationDuration: `${star.duration}s`,
                }}
              />
            ))}
          </div>

          {/* Ground */}
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{
              height: 40 * scale,
              background: "linear-gradient(180deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.3) 100%)",
              borderTop: "2px solid rgba(99,102,241,0.4)",
            }}
          />

          {/* Flash overlay */}
          {flash && (
            <div
              className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-150"
              style={{
                background:
                  flash === "good"
                    ? "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)"
                    : "radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)",
              }}
            />
          )}

          {/* Scaled content */}
          <div
            className="absolute inset-0"
            style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
          >
            {/* ── HUD ── */}
            {phase !== "menu" && (
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-20">
                <div className="flex items-center gap-3">
                  {/* Lives */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                      <Heart
                        key={i}
                        className={`w-5 h-5 transition-all duration-300 ${
                          i < lives
                            ? "text-red-400 fill-red-400 scale-100"
                            : "text-slate-700 scale-75"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Score + Level */}
                <div className="flex items-center gap-4">
                  {combo >= 3 && (
                    <div className="flex items-center gap-1 text-yellow-400 animate-bounce">
                      <Zap className="w-4 h-4 fill-yellow-400" />
                      <span className="text-sm font-bold">x{combo}</span>
                    </div>
                  )}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white tabular-nums">
                      {score.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400">Level {level}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── MENU ── */}
            {phase === "menu" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-8">
                <div className="text-6xl mb-2">🌧️</div>
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                  Letter Rain
                </h2>
                <p className="text-slate-400 text-center text-sm mb-6 max-w-sm">
                  Read the sentence, then catch falling letters in the right order
                  to rebuild it!
                </p>

                {/* Category picker */}
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  <button
                    onClick={() => setSelectedCategory(undefined)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      !selectedCategory
                        ? "bg-indigo-500 text-white"
                        : "bg-white/10 text-slate-300 hover:bg-white/20"
                    }`}
                  >
                    All Topics
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedCategory === cat.id
                          ? "text-white"
                          : "bg-white/10 text-slate-300 hover:bg-white/20"
                      }`}
                      style={
                        selectedCategory === cat.id
                          ? { backgroundColor: cat.color }
                          : {}
                      }
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={startGame}
                  className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30"
                >
                  Play
                </button>

                {highScore > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-yellow-400 text-sm">
                    <Trophy className="w-4 h-4" />
                    Best: {highScore.toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* ── INTRO (Read the sentence) ── */}
            {phase === "intro" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-8">
                <div className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">
                  Level {level} &middot; Read carefully
                </div>
                <div
                  className="text-2xl md:text-3xl font-bold text-center leading-relaxed max-w-lg"
                  style={{ color: catColor }}
                >
                  {sentence}
                </div>
                <div className="mt-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-sm text-slate-400">
                    Memorize this sentence...
                  </span>
                </div>
                <div
                  className="text-xs uppercase tracking-wider mt-2 px-3 py-1 rounded-full"
                  style={{ color: catColor, backgroundColor: `${catColor}20` }}
                >
                  {sentenceCategory}
                </div>
              </div>
            )}

            {/* ── FALLING LETTERS ── */}
            {(phase === "playing" || phase === "levelComplete") &&
              letters.map((letter) => {
                if (!letter.spawned || letter.caught) return null;
                return (
                  <button
                    key={letter.id}
                    onClick={() => handleLetterClick(letter.id)}
                    disabled={letter.missed}
                    className={`absolute flex items-center justify-center font-bold text-xl rounded-lg transition-transform select-none
                      ${letter.missed
                        ? "opacity-30 scale-90"
                        : "hover:scale-110 active:scale-90 cursor-pointer"
                      }`}
                    style={{
                      width: LETTER_SIZE,
                      height: LETTER_SIZE,
                      left: letter.x,
                      top: letter.y,
                      background: letter.missed
                        ? "rgba(100,100,100,0.3)"
                        : `linear-gradient(135deg, ${catColor}dd, ${catColor}88)`,
                      color: "white",
                      boxShadow: letter.missed
                        ? "none"
                        : `0 0 15px ${catColor}40, 0 4px 12px rgba(0,0,0,0.3)`,
                      border: `1.5px solid ${letter.missed ? "transparent" : `${catColor}60`}`,
                    }}
                  >
                    {letter.char}
                  </button>
                );
              })}

            {/* ── PARTICLES ── */}
            {particles.map((p) => (
              <div
                key={p.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: p.size,
                  height: p.size,
                  left: p.x,
                  top: p.y,
                  backgroundColor: p.color,
                  opacity: p.life,
                }}
              />
            ))}

            {/* ── BUILT TEXT (bottom bar) ── */}
            {phase === "playing" && (
              <div className="absolute bottom-12 left-4 right-4 z-20">
                <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <div className="text-xs text-slate-400 mb-1">Building sentence:</div>
                  <div className="text-white font-mono text-base min-h-[1.5em] tracking-wide">
                    {builtText}
                    <span className="animate-pulse text-indigo-400">|</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── LEVEL COMPLETE ── */}
            {phase === "levelComplete" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/40 backdrop-blur-sm">
                <div className="text-5xl mb-3">
                  <Star className="w-16 h-16 text-yellow-400 fill-yellow-400 animate-bounce" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  Level {level} Complete!
                </h3>
                <p className="text-slate-300 text-sm mb-1">
                  +{50 * level} level bonus
                </p>
                {bestCombo >= 5 && (
                  <p className="text-yellow-400 text-sm mb-4">
                    Best combo: x{bestCombo}
                  </p>
                )}
                <button
                  onClick={nextLevel}
                  className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30"
                >
                  Next Level
                </button>
              </div>
            )}

            {/* ── GAME OVER ── */}
            {phase === "gameOver" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/50 backdrop-blur-sm">
                <h3 className="text-3xl font-bold text-white mb-2">
                  Game Over
                </h3>
                <div className="text-5xl font-bold text-indigo-400 mb-1">
                  {score.toLocaleString()}
                </div>
                <p className="text-slate-400 text-sm mb-1">
                  Level {level} &middot; Best combo x{bestCombo}
                </p>
                {score >= highScore && score > 0 && (
                  <p className="text-yellow-400 text-sm font-medium mb-4 flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    New High Score!
                  </p>
                )}
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={startGame}
                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Play Again
                  </button>
                  <Link
                    href="/games"
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all"
                  >
                    Back
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      {phase === "menu" && (
        <div className="max-w-md mx-auto px-4 mt-6 mb-8">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="text-2xl mb-1">👀</div>
              <div className="text-xs text-slate-400">Read the sentence</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-xs text-slate-400">Click letters in order</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-xs text-slate-400">Build combos for bonus</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
