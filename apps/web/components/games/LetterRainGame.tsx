"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Star, Trophy, RotateCcw, ArrowLeft, Target, Gauge } from "lucide-react";
import { pickSentence, CATEGORIES } from "@/lib/games/sentences";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, HeartRecovery, BonusToast, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxCombo, sfxLevelUp, sfxGameOver, sfxHeart, sfxAchievement, sfxCountdown, sfxCountdownGo } from "@/lib/games/audio";
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
  catchTime: number; // performance.now() when caught, 0 if not caught
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

type GamePhase = "menu" | "intro" | "countdown" | "playing" | "levelComplete" | "gameOver";

// ── Constants ──

const GAME_WIDTH = 800;
const GAME_HEIGHT = 550;
const LETTER_SIZE = 50;
const GROUND_Y = GAME_HEIGHT - 40;
const INITIAL_LIVES = 5;
const CATCH_ANIM_MS = 280; // ms to show burst animation before letter disappears
const COUNTDOWN_SECS = 3;

/** Speed slider (1-10) maps to game parameters.
 *  speed 1 = ~0.5 lps (chill), speed 10 = ~5.0 lps (insane)
 */
function getSpeedConfig(speed: number, level: number) {
  const t = (speed - 1) / 9; // 0..1
  const baseSpeed = 0.3 + t * 1.5 + (level - 1) * 0.06;
  const spawnInterval = 2000 - t * 1800 - (level - 1) * 20;
  const clamped = Math.max(200, spawnInterval);
  return {
    baseSpeed,
    spawnInterval: clamped,
    lps: +(1000 / clamped).toFixed(1),
  };
}

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

// ── Tips ──

const TIPS = [
  "Reading speed improves with practice",
  "Context clues help predict the next word",
  "Active reading means engaging with the text",
  "Focus on the highlighted next letter in the sentence tracker",
  "Build combos by catching letters without mistakes",
  "Memorize the sentence during the intro — it helps with order",
  "Watch for the glowing letter — that's the one you need next",
  "Higher combos give score multipliers",
  "Adjust the speed slider to match your comfort level",
  "Regular practice improves both reading speed and accuracy",
];

// ── Component ──

export function LetterRainGame() {
  useGameMusic();
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const levelStartRef = useRef<number>(0);
  const levelStartMissedRef = useRef<number>(0);
  const totalMissedRef = useRef<number>(0);
  const nextCharRef = useRef(0); // always-current nextCharIndex for use in updaters
  const [scale, setScale] = useState(1);

  const [phase, setPhase] = useState<GamePhase>("menu");
  const [countdownVal, setCountdownVal] = useState(COUNTDOWN_SECS);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [sentence, setSentence] = useState("");
  const [sentenceCategory, setSentenceCategory] = useState("");
  const [nextCharIndex, setNextCharIndex] = useState(0);
  const [letters, setLetters] = useState<FallingLetter[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [usedSentences] = useState<Set<number>>(new Set());
  const [totalCaught, setTotalCaught] = useState(0);
  const [totalMissed, setTotalMissed] = useState(0);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("letterRain_highScore"));
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [perfectLevels, setPerfectLevels] = useState(0);
  const [showHeartRecovery, setShowHeartRecovery] = useState(false);
  const [showPerfectToast, setShowPerfectToast] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<Array<{ medalId: string; name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // ── Settings (toggles) ──
  const [speed, setSpeed] = useState(4); // 1-10
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [includeSpaces, setIncludeSpaces] = useState(false);

  // Keep nextCharRef in sync
  useEffect(() => { nextCharRef.current = nextCharIndex; }, [nextCharIndex]);

  // Tip rotation
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 8000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return;
      setScale(Math.min(1, containerRef.current.clientWidth / GAME_WIDTH));
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => { totalMissedRef.current = totalMissed; }, [totalMissed]);
  useEffect(() => {
    if (phase === "playing") levelStartMissedRef.current = totalMissed;
  }, [phase, totalMissed]);

  // On game over: track play and check achievements
  useEffect(() => {
    if (phase !== "gameOver") return;
    sfxGameOver();
    trackGamePlayed("letter-rain", score);
    const profile = getProfile();
    const acc = totalCaught + totalMissed > 0 ? Math.round((totalCaught / (totalCaught + totalMissed)) * 100) : 100;
    const l = elapsedSecs > 0 ? Math.round((totalCaught / elapsedSecs) * 60) : 0;
    const newOnes = checkAchievements(
      { gameId: "letter-rain", score, level, accuracy: acc, lpm: l, bestCombo, perfectLevels },
      profile.totalGamesPlayed, profile.gamesPlayedByGameId
    );
    if (newOnes.length > 0) { sfxAchievement(); setAchievementQueue(newOnes); }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdownVal <= 0) {
      sfxCountdownGo();
      setPhase("playing");
      lastTimeRef.current = performance.now();
      levelStartRef.current = performance.now();
      return;
    }
    sfxCountdown();
    const t = setTimeout(() => setCountdownVal((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdownVal]);

  // Elapsed time tracker
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => {
      setElapsedSecs(Math.floor((performance.now() - levelStartRef.current) / 1000));
    }, 500);
    return () => clearInterval(t);
  }, [phase]);

  const prepareLetters = useCallback((text: string, spaces: boolean, caseSens: boolean): FallingLetter[] => {
    const result: FallingLetter[] = [];
    for (let i = 0; i < text.length; i++) {
      if (!spaces && text[i] === " ") continue;
      result.push({
        id: `${i}-${Math.random().toString(36).slice(2, 6)}`,
        char: caseSens ? text[i] : text[i].toUpperCase(),
        sentenceIndex: i,
        x: 50 + Math.random() * (GAME_WIDTH - 100),
        y: -LETTER_SIZE - Math.random() * 60,
        speed: 0,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        spawned: false,
        caught: false,
        catchTime: 0,
        missed: false,
      });
    }
    return result;
  }, []);

  const startLevel = useCallback(
    (lvl: number) => {
      // Pick difficulty bucket based on speed for sentence selection
      const diffBucket = speed <= 2 ? "easy" : speed <= 4 ? "medium" : "hard";
      const { sentence: picked, index } = pickSentence(diffBucket as "easy" | "medium" | "hard", usedSentences, selectedCategory);
      usedSentences.add(index);
      setSentence(picked.text);
      setSentenceCategory(picked.category);
      setNextCharIndex(0);
      nextCharRef.current = 0;
      setLetters(prepareLetters(picked.text, includeSpaces, caseSensitive));
      spawnTimerRef.current = 0;
      setElapsedSecs(0);
      setPhase("intro");
      // Show sentence for memorization, then countdown
      setTimeout(() => {
        setCountdownVal(COUNTDOWN_SECS);
        setPhase("countdown");
      }, 2000 + picked.text.length * 20);
    },
    [speed, prepareLetters, usedSentences, selectedCategory, includeSpaces, caseSensitive]
  );

  // Water splash particles
  const spawnSplash = useCallback(
    (x: number, y: number, color: string, count: number, char?: string) => {
      const newP: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
        const spd = 2 + Math.random() * 4;
        newP.push({ id: `s-${Date.now()}-${i}`, x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: 1, color, size: 2 + Math.random() * 5, type: "splash" });
      }
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        newP.push({ id: `k-${Date.now()}-${i}`, x: x + Math.cos(angle) * 15, y: y + Math.sin(angle) * 15, vx: Math.cos(angle) * 1.5, vy: Math.sin(angle) * 1.5, life: 0.8, color: "#ffffff", size: 2.5, type: "sparkle" });
      }
      if (char) {
        newP.push({ id: `t-${Date.now()}`, x, y: y - 10, vx: 0, vy: -1.5, life: 1, color, size: 16, type: "text", char });
      }
      setParticles((prev) => [...prev, ...newP]);
    },
    []
  );

  const spawnRipple = useCallback((x: number) => {
    const newP: Particle[] = [];
    for (let i = 0; i < 3; i++) {
      newP.push({ id: `r-${Date.now()}-${i}`, x, y: GROUND_Y, vx: 0, vy: 0, life: 0.8, color: "#ef4444", size: 10 + i * 15, type: "ripple" });
    }
    setParticles((prev) => [...prev, ...newP]);
  }, []);

  // ── Click handler — side-effects OUTSIDE of setLetters updater ──
  const handleLetterClick = useCallback(
    (letterId: string) => {
      if (phase !== "playing") return;

      // Read current letters synchronously
      setLetters((prev) => {
        const letter = prev.find((l) => l.id === letterId);
        if (!letter || letter.caught || letter.missed) return prev;

        // Use ref for always-current nextCharIndex
        let expectedIndex = nextCharRef.current;
        const sent = sentence;
        if (!includeSpaces) {
          while (expectedIndex < sent.length && sent[expectedIndex] === " ") expectedIndex++;
        }

        if (letter.sentenceIndex === expectedIndex) {
          // ── Correct letter ──
          const now = performance.now();

          // Advance nextCharIndex
          const newNextChar = letter.sentenceIndex + 1;
          nextCharRef.current = newNextChar;
          // Schedule React state update
          setTimeout(() => setNextCharIndex(newNextChar), 0);

          // Score, combo, etc. — scheduled outside the updater
          setTimeout(() => {
            const newCombo = combo + 1;
            const { mult } = getMultiplierFromStreak(newCombo);
            const points = Math.round(10 * mult);
            setScore((s) => s + points);
            setCombo(newCombo);
            setBestCombo((bc) => Math.max(bc, newCombo));
            setTotalCaught((c) => c + 1);

            // SFX
            if (newCombo > 1 && newCombo % 5 === 0) sfxCombo(newCombo);
            else sfxCorrect();

            // Heart recovery every 10-streak
            if (newCombo >= 10 && newCombo % 10 === 0) {
              sfxHeart();
              setLives((lv) => {
                if (lv < INITIAL_LIVES) {
                  setShowHeartRecovery(true);
                  setTimeout(() => setShowHeartRecovery(false), 1500);
                  return Math.min(INITIAL_LIVES, lv + 1);
                }
                return lv;
              });
            }

            // Splash particles
            spawnSplash(letter.x + LETTER_SIZE / 2, letter.y + LETTER_SIZE / 2, getCategoryColor(sentenceCategory), 14, letter.char);
            setFlash("good");
            setTimeout(() => setFlash(null), 150);

            // Check if sentence complete
            const remaining = sent.slice(newNextChar);
            const done = includeSpaces
              ? remaining.length === 0
              : !remaining.split("").some((c) => c !== " ");
            if (done) {
              sfxLevelUp();
              setScore((s) => s + 50 * level);
              setTimeout(() => {
                const missesThisLevel = totalMissedRef.current - levelStartMissedRef.current;
                if (missesThisLevel === 0) {
                  setScore((s) => s + 100);
                  setPerfectLevels((p) => p + 1);
                  setShowPerfectToast(true);
                  setTimeout(() => setShowPerfectToast(false), 2000);
                }
                setPhase("levelComplete");
              }, 300);
            }
          }, 0);

          // Mark letter as caught with timestamp (for burst animation)
          return prev.map((l) => (l.id === letterId ? { ...l, caught: true, catchTime: now } : l));
        } else {
          // ── Wrong letter — penalty: lose points + break combo ──
          setTimeout(() => {
            sfxWrong();
            setCombo(0);
            setScore((s) => Math.max(0, s - 5));
            setTotalMissed((m) => m + 1);
            setFlash("bad");
            setTimeout(() => setFlash(null), 200);
          }, 0);
          return prev;
        }
      });
    },
    [phase, sentence, combo, level, spawnSplash, sentenceCategory, includeSpaces]
  );

  // ── Keyboard typing handler ──
  useEffect(() => {
    if (phase !== "playing") return;

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore modifier keys, function keys, etc.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return; // only single characters
      e.preventDefault();

      const typed = e.key;
      let expectedIdx = nextCharRef.current;
      const sent = sentence;

      // Skip spaces if not included
      if (!includeSpaces) {
        while (expectedIdx < sent.length && sent[expectedIdx] === " ") expectedIdx++;
      }
      if (expectedIdx >= sent.length) return;

      const expectedChar = sent[expectedIdx];
      const matches = caseSensitive
        ? typed === expectedChar
        : typed.toLowerCase() === expectedChar.toLowerCase();

      if (matches) {
        // Find the letter with this sentenceIndex and catch it
        setLetters((prev) => {
          const letter = prev.find(
            (l) => l.sentenceIndex === expectedIdx && !l.caught && !l.missed
          );
          if (!letter) return prev;
          // Trigger the full catch logic via handleLetterClick
          // But we need to do it outside this updater to avoid conflicts
          setTimeout(() => handleLetterClick(letter.id), 0);
          return prev;
        });
      } else {
        // Wrong key — penalty: lose points + break combo
        sfxWrong();
        setCombo(0);
        setScore((s) => Math.max(0, s - 5));
        setTotalMissed((m) => m + 1);
        setFlash("bad");
        setTimeout(() => setFlash(null), 200);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, sentence, caseSensitive, includeSpaces, handleLetterClick]);

  // ── Game loop ──
  useEffect(() => {
    if (phase !== "playing") return;
    const config = getSpeedConfig(speed, level);

    function gameLoop(time: number) {
      const dt = Math.min(time - lastTimeRef.current, 50);
      lastTimeRef.current = time;

      spawnTimerRef.current += dt;
      if (spawnTimerRef.current >= config.spawnInterval) {
        spawnTimerRef.current = 0;
        setLetters((prev) => {
          const unspawned = prev.filter((l) => !l.spawned && !l.caught);
          if (unspawned.length === 0) return prev;
          const toSpawn = unspawned[0];
          return prev.map((l) =>
            l.id === toSpawn.id
              ? { ...l, spawned: true, speed: config.baseSpeed * (0.85 + Math.random() * 0.3), x: 40 + Math.random() * (GAME_WIDTH - 80) }
              : l
          );
        });
      }

      const now = performance.now();

      setLetters((prev) => {
        let lostLife = false;
        let missX = 0;
        const updated = prev.map((l) => {
          // Remove fully-animated caught letters
          if (l.caught && l.catchTime > 0 && now - l.catchTime > CATCH_ANIM_MS) {
            return l; // will be filtered below
          }
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
  }, [phase, level, speed, spawnRipple]);

  const startGame = () => {
    setScore(0); setLives(INITIAL_LIVES); setLevel(1); setCombo(0); setBestCombo(0);
    setTotalCaught(0); setTotalMissed(0); setElapsedSecs(0); setPerfectLevels(0);
    setShowHeartRecovery(false); setShowPerfectToast(false); setAchievementQueue([]); setShowAchievementIndex(0);
    usedSentences.clear();
    startLevel(1);
  };
  const nextLevel = () => { const n = level + 1; setLevel(n); startLevel(n); };

  const catColor = getCategoryColor(sentenceCategory);
  const accuracy = totalCaught + totalMissed > 0 ? Math.round((totalCaught / (totalCaught + totalMissed)) * 100) : 100;
  const lpm = elapsedSecs > 0 ? Math.round((totalCaught / elapsedSecs) * 60) : 0;
  const { lps } = getSpeedConfig(speed, level);

  // Compute which char index is the next expected letter
  const nextExpectedIdx = (() => {
    let idx = nextCharIndex;
    if (!includeSpaces) {
      while (idx < sentence.length && sentence[idx] === " ") idx++;
    }
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
        <AudioToggles />
      </div>

      {/* Live stats bar */}
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
            <div className="flex items-center gap-1.5 text-indigo-400">
              <span className="font-medium hidden sm:inline">{lps} lps</span>
              <span className="text-slate-500">Lv{level}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sentence tracker */}
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
                    isCaught ? "text-green-400"
                      : isNext ? "text-white font-bold"
                      : "text-slate-700"
                  }`}
                  style={isNext && !isSpace ? { textShadow: `0 0 8px ${catColor}`, borderBottom: `2px solid ${catColor}` } : undefined}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Tip */}
      {phase === "playing" && (
        <div className="w-full max-w-[850px] px-4 mb-1">
          <div className="text-center">
            <span className="text-[10px] text-slate-500 italic">{TIPS[tipIndex]}</span>
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
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(56,189,248,0.04) 30%, rgba(56,189,248,0.12) 100%)" }} />
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 5%, rgba(56,189,248,0.3) 30%, rgba(56,189,248,0.5) 50%, rgba(56,189,248,0.3) 70%, transparent 95%)" }} />
          </div>

          {/* Reward toasts */}
          <HeartRecovery show={showHeartRecovery} />
          <BonusToast show={showPerfectToast} text="Perfect level!" points={100} />
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
            {phase !== "menu" && phase !== "countdown" && (
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-2.5 z-20">
                <div className="flex items-center gap-1">
                  {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                    <Heart key={i} className={`w-4.5 h-4.5 transition-all duration-300 ${i < lives ? "text-red-400 fill-red-400" : "text-slate-800 scale-75"}`} />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <StreakBadge streak={combo} />
                  <div className="text-xl font-bold text-white tabular-nums">{score.toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* MENU */}
            {phase === "menu" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-8">
                <div className="text-5xl mb-2">🌧️</div>
                <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">Letter Rain</h2>
                <p className="text-slate-500 text-center text-sm mb-5 max-w-xs">
                  Read the sentence, then type the letters on your keyboard to catch them!
                </p>

                {/* Speed slider */}
                <div className="w-full max-w-xs mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-400">Speed</span>
                    <span className="text-xs font-bold text-indigo-400 tabular-nums">{getSpeedConfig(speed, 1).lps} letters/sec</span>
                  </div>
                  <input
                    type="range" min={1} max={10} step={1} value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                    <span>Chill</span><span>Normal</span><span>Insane</span>
                  </div>
                </div>

                {/* Toggles */}
                <div className="w-full max-w-xs space-y-2 mb-4">
                  <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
                    <span className="text-xs text-slate-400">Case sensitive</span>
                    <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)}
                      className="rounded accent-indigo-500 w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
                    <span className="text-xs text-slate-400">Include spaces</span>
                    <input type="checkbox" checked={includeSpaces} onChange={(e) => setIncludeSpaces(e.target.checked)}
                      className="rounded accent-indigo-500 w-4 h-4" />
                  </label>
                </div>

                {/* Category picker */}
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
                  Level {level}
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

            {/* COUNTDOWN */}
            {phase === "countdown" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <div className="text-8xl font-bold text-indigo-400 animate-pulse tabular-nums">
                  {countdownVal > 0 ? countdownVal : "GO!"}
                </div>
              </div>
            )}

            {/* FALLING LETTERS */}
            {(phase === "playing" || phase === "levelComplete") &&
              letters.map((letter) => {
                if (!letter.spawned) return null;
                // Hide fully-animated caught letters
                if (letter.caught && letter.catchTime > 0 && performance.now() - letter.catchTime > CATCH_ANIM_MS) return null;

                const isCaught = letter.caught;
                const isNext = !isCaught && letter.sentenceIndex === nextExpectedIdx;
                const wobbleX = isCaught ? 0 : Math.sin(letter.wobble) * 3;

                // Burst animation: scale up + fade out
                const catchProgress = isCaught ? Math.min(1, (performance.now() - letter.catchTime) / CATCH_ANIM_MS) : 0;
                const burstScale = isCaught ? 1 + catchProgress * 1.2 : 1;
                const burstOpacity = isCaught ? 1 - catchProgress : 1;

                return (
                  <button
                    key={letter.id}
                    onClick={() => !isCaught && handleLetterClick(letter.id)}
                    disabled={letter.missed || isCaught}
                    className={`absolute flex items-center justify-center select-none rounded-xl
                      ${letter.missed ? "opacity-20 pointer-events-none" : isCaught ? "pointer-events-none" : "cursor-pointer hover:scale-105 active:scale-95"}`}
                    style={{
                      width: LETTER_SIZE,
                      height: LETTER_SIZE,
                      left: letter.x + wobbleX,
                      top: letter.y,
                      transform: `scale(${burstScale})`,
                      opacity: letter.missed ? 0.2 : burstOpacity,
                      background: letter.missed
                        ? "rgba(30,30,45,0.6)"
                        : isCaught
                        ? `linear-gradient(145deg, rgba(255,255,255,0.3) 0%, ${catColor}ff 50%, ${catColor}ff 100%)`
                        : isNext
                        ? `linear-gradient(145deg, rgba(255,255,255,0.12) 0%, ${catColor}88 50%, ${catColor}cc 100%)`
                        : `linear-gradient(145deg, rgba(255,255,255,0.06) 0%, ${catColor}44 50%, ${catColor}66 100%)`,
                      boxShadow: letter.missed
                        ? "0 2px 8px rgba(0,0,0,0.2)"
                        : isCaught
                        ? `0 0 30px ${catColor}, 0 0 60px ${catColor}88`
                        : isNext
                        ? `0 6px 16px rgba(0,0,0,0.35), 0 0 0 2px ${catColor}99, inset 0 1px 0 rgba(255,255,255,0.2)`
                        : `0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)`,
                      border: letter.missed ? "1px solid rgba(255,255,255,0.06)" : `1px solid ${isNext ? `${catColor}dd` : `${catColor}44`}`,
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: letter.missed ? "#475569" : "white",
                      textShadow: letter.missed ? "none" : isCaught ? `0 0 12px white` : "0 1px 2px rgba(0,0,0,0.4)",
                      transition: isCaught ? "none" : "transform 0.1s ease, box-shadow 0.15s ease",
                    }}
                  >
                    {letter.char}
                  </button>
                );
              })}

            {/* Particles */}
            {particles.map((p) => (
              <div key={p.id} className="absolute pointer-events-none" style={{ left: p.x, top: p.y, opacity: p.life }}>
                {p.type === "text" && p.char ? (
                  <span className="text-base font-black" style={{ color: p.color, textShadow: `0 0 12px ${p.color}`, fontSize: p.size }}>{p.char}</span>
                ) : p.type === "ripple" ? (
                  <div style={{ width: p.size, height: p.size * 0.3, borderRadius: "50%", border: `1px solid ${p.color}`, transform: "translate(-50%, -50%)" }} />
                ) : p.type === "sparkle" ? (
                  <div style={{ width: p.size, height: p.size, borderRadius: "50%", backgroundColor: p.color, boxShadow: `0 0 4px ${p.color}` }} />
                ) : (
                  <div style={{ width: p.size, height: p.size, borderRadius: 6, backgroundColor: p.color, opacity: 0.8, boxShadow: `0 1px 3px rgba(0,0,0,0.2)` }} />
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
                <div className="mb-2 w-full max-w-xs"><ScoreSubmit game="letter-rain" score={score} level={level} stats={{ accuracy: `${accuracy}%`, lpm, bestCombo, perfectLevels }} /></div>
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
              <div className="text-lg mb-0.5">⌨️</div>
              <div className="text-[10px] text-slate-500">Type letters in order</div>
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
