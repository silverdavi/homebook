"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Star, Check, X } from "lucide-react";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxCombo, sfxGameOver, sfxAchievement, sfxCountdown, sfxCountdownGo } from "@/lib/games/audio";
import Link from "next/link";

// ── Types ──

type GamePhase = "menu" | "countdown" | "playing" | "selfCheck" | "complete";
type Subject = "math" | "science" | "history" | "vocabulary";

interface Card {
  question: string;
  answer: string;
}

// ── Question Banks ──

function generateMathCards(count: number): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    const type = Math.floor(Math.random() * 4);
    let q: string, a: string;
    switch (type) {
      case 0: { // addition
        const x = Math.floor(Math.random() * 50) + 10;
        const y = Math.floor(Math.random() * 50) + 10;
        q = `${x} + ${y} = ?`;
        a = `${x + y}`;
        break;
      }
      case 1: { // subtraction
        const x = Math.floor(Math.random() * 50) + 30;
        const y = Math.floor(Math.random() * (x - 5)) + 5;
        q = `${x} − ${y} = ?`;
        a = `${x - y}`;
        break;
      }
      case 2: { // multiplication
        const x = Math.floor(Math.random() * 10) + 2;
        const y = Math.floor(Math.random() * 10) + 2;
        q = `${x} × ${y} = ?`;
        a = `${x * y}`;
        break;
      }
      default: { // fractions
        const num = Math.floor(Math.random() * 5) + 1;
        const den = Math.floor(Math.random() * 4) + 2;
        const num2 = Math.floor(Math.random() * 5) + 1;
        q = `${num}/${den} + ${num2}/${den} = ?`;
        a = `${num + num2}/${den}`;
        break;
      }
    }
    cards.push({ question: q, answer: a });
  }
  return cards;
}

const ELEMENTS: [string, string][] = [
  ["H", "Hydrogen"], ["He", "Helium"], ["Li", "Lithium"], ["Be", "Beryllium"],
  ["B", "Boron"], ["C", "Carbon"], ["N", "Nitrogen"], ["O", "Oxygen"],
  ["F", "Fluorine"], ["Ne", "Neon"], ["Na", "Sodium"], ["Mg", "Magnesium"],
  ["Al", "Aluminum"], ["Si", "Silicon"], ["P", "Phosphorus"], ["S", "Sulfur"],
  ["Cl", "Chlorine"], ["Ar", "Argon"], ["K", "Potassium"], ["Ca", "Calcium"],
  ["Fe", "Iron"], ["Cu", "Copper"], ["Zn", "Zinc"], ["Ag", "Silver"],
  ["Au", "Gold"], ["Pb", "Lead"], ["Sn", "Tin"], ["Pt", "Platinum"],
];

function generateScienceCards(count: number): Card[] {
  const shuffled = [...ELEMENTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(([sym, name]) => ({
    question: `Element symbol: ${sym}`,
    answer: name,
  }));
}

const HISTORY_FACTS: [string, string][] = [
  ["1776", "American Declaration of Independence"],
  ["1969", "First Moon Landing (Apollo 11)"],
  ["1865", "End of the American Civil War"],
  ["1492", "Columbus reaches the Americas"],
  ["1945", "End of World War II"],
  ["1789", "French Revolution begins"],
  ["1066", "Battle of Hastings"],
  ["1215", "Magna Carta signed"],
  ["1620", "Mayflower reaches Plymouth"],
  ["1903", "Wright Brothers' first flight"],
  ["1929", "Wall Street Crash"],
  ["1963", "MLK's 'I Have a Dream' speech"],
  ["1989", "Fall of the Berlin Wall"],
  ["1804", "Lewis and Clark expedition begins"],
  ["1517", "Martin Luther's 95 Theses"],
  ["1869", "Transcontinental Railroad completed"],
  ["1848", "California Gold Rush begins"],
  ["1914", "World War I begins"],
  ["1607", "Jamestown settlement founded"],
  ["1773", "Boston Tea Party"],
];

function generateHistoryCards(count: number): Card[] {
  const shuffled = [...HISTORY_FACTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(([date, event]) => ({
    question: `What happened in ${date}?`,
    answer: event,
  }));
}

const VOCAB: [string, string][] = [
  ["Benevolent", "Well-meaning and kindly"],
  ["Ephemeral", "Lasting for a very short time"],
  ["Ubiquitous", "Present everywhere"],
  ["Pragmatic", "Dealing with things practically"],
  ["Resilient", "Able to recover quickly"],
  ["Meticulous", "Showing great attention to detail"],
  ["Ambiguous", "Open to more than one meaning"],
  ["Eloquent", "Fluent or persuasive in speaking"],
  ["Diligent", "Having careful and persistent effort"],
  ["Innovative", "Featuring new methods or ideas"],
  ["Tenacious", "Holding firmly to something"],
  ["Candid", "Truthful and straightforward"],
  ["Profound", "Very great or intense"],
  ["Versatile", "Able to adapt to many functions"],
  ["Zealous", "Having great energy or enthusiasm"],
  ["Astute", "Having sharp judgment"],
  ["Concise", "Giving information clearly and briefly"],
  ["Futile", "Incapable of producing any result"],
  ["Lucid", "Expressed clearly; easy to understand"],
  ["Obscure", "Not discovered or known about"],
];

function generateVocabCards(count: number): Card[] {
  const shuffled = [...VOCAB].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(([word, def]) => ({
    question: `Define: ${word}`,
    answer: def,
  }));
}

function generateCards(subject: Subject, count: number): Card[] {
  switch (subject) {
    case "math": return generateMathCards(count);
    case "science": return generateScienceCards(count);
    case "history": return generateHistoryCards(count);
    case "vocabulary": return generateVocabCards(count);
  }
}

// ── Tips ──

const TIPS: Record<Subject, string[]> = {
  math: [
    "Think of the problem in your head before scratching!",
    "Fractions: add numerators when denominators match.",
    "Multiplication: break big numbers into smaller parts.",
    "Use estimation to check if your answer makes sense.",
  ],
  science: [
    "Element symbols always start with a capital letter.",
    "The first 20 elements are the most common on tests.",
    "Na = Sodium (from Latin 'natrium').",
    "Fe = Iron (from Latin 'ferrum').",
  ],
  history: [
    "Try to picture the era when guessing the event.",
    "Many key U.S. events happened in the 1700s-1800s.",
    "World wars were in the 20th century (1914, 1939).",
    "The Renaissance was roughly 1400-1600.",
  ],
  vocabulary: [
    "Break words into roots, prefixes, and suffixes.",
    "Latin roots: 'bene' = good, 'mal' = bad.",
    "Greek roots: 'poly' = many, 'mono' = one.",
    "Context clues help guess unfamiliar words.",
  ],
};

const COUNTDOWN_SECS = 3;

export function ScratchRevealGame() {
  useGameMusic();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("scratchReveal_highScore"));
  const [achievementQueue, setAchievementQueue] = useState<Array<{ name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scratchDataRef = useRef<boolean[]>([]);
  const isDrawingRef = useRef(false);

  // ── Settings ──
  const [subject, setSubject] = useState<Subject>("math");
  const [cardCount, setCardCount] = useState(10);
  const [timed, setTimed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => {
      setCountdown((c) => {
        if (c <= 1) {
          sfxCountdownGo();
          setTimeout(() => setPhase("playing"), 0);
          return 0;
        }
        sfxCountdown();
        return c - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Timed mode
  useEffect(() => {
    if (phase !== "playing" || !timed) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // Auto-reveal on timeout
          setRevealed(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, timed, cardIndex]);

  // On complete
  useEffect(() => {
    if (phase !== "complete") return;
    sfxGameOver();
    if (score > highScore) {
      setLocalHighScore("scratchReveal_highScore", score);
      setHighScore(score);
    }
    trackGamePlayed("scratch-reveal", score);
    const profile = getProfile();
    const accuracy = cards.length > 0 ? Math.round((correct / cards.length) * 100) : 0;
    const newOnes = checkAchievements(
      { gameId: "scratch-reveal", score, bestStreak, accuracy, solved: correct },
      profile.totalGamesPlayed,
      profile.gamesPlayedByGameId
    );
    if (newOnes.length > 0) { sfxAchievement(); setAchievementQueue(newOnes); }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize scratch layer
  const initScratchLayer = useCallback(() => {
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

    // Metallic scratch overlay
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#6b7280");
    grad.addColorStop(0.3, "#9ca3af");
    grad.addColorStop(0.5, "#6b7280");
    grad.addColorStop(0.7, "#9ca3af");
    grad.addColorStop(1, "#6b7280");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Sparkle dots for metallic effect
    for (let i = 0; i < 80; i++) {
      const sx = Math.random() * w;
      const sy = Math.random() * h;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.random() * 2 + 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3 + 0.05})`;
      ctx.fill();
    }

    // "Scratch here" text
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ Scratch to reveal! ✨", w / 2, h / 2);

    // Track scratch coverage in a grid
    const gridSize = 20;
    scratchDataRef.current = new Array(gridSize * gridSize).fill(false);
    setScratchPercent(0);
    setRevealed(false);
  }, []);

  // Draw scratch when card changes or phase changes
  useEffect(() => {
    if (phase === "playing" && !revealed) {
      // Small delay for canvas to be in DOM
      const t = setTimeout(initScratchLayer, 50);
      return () => clearTimeout(t);
    }
  }, [phase, cardIndex, initScratchLayer, revealed]);

  const handleScratch = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left);
    const y = (clientY - rect.top);

    // Erase with destination-out compositing
    // ctx already has scale(dpr, dpr) from initScratchLayer, so use logical coords
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Track coverage
    const gridSize = 20;
    const gx = Math.floor((x / rect.width) * gridSize);
    const gy = Math.floor((y / rect.height) * gridSize);
    if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
      const idx = gy * gridSize + gx;
      // Mark surrounding cells too for larger scratch area
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = gx + dx;
          const ny = gy + dy;
          if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
            scratchDataRef.current[ny * gridSize + nx] = true;
          }
        }
      }
      const scratched = scratchDataRef.current.filter(Boolean).length;
      const pct = Math.round((scratched / (gridSize * gridSize)) * 100);
      setScratchPercent(pct);

      // Auto-reveal at 60%
      if (pct >= 60 && !revealed) {
        setRevealed(true);
      }
    }
  }, [revealed]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    handleScratch(e.clientX, e.clientY);
  }, [handleScratch]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    handleScratch(e.clientX, e.clientY);
  }, [handleScratch]);

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const handleSelfCheck = useCallback((gotRight: boolean) => {
    if (gotRight) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      const { mult } = getMultiplierFromStreak(newStreak);
      const points = Math.round(20 * mult);
      setScore((s) => s + points);
      setCorrect((c) => c + 1);
      setFlash("correct");
      if (newStreak > 1 && newStreak % 5 === 0) sfxCombo(newStreak);
      else sfxCorrect();
    } else {
      sfxWrong();
      setStreak(0);
      setWrong((w) => w + 1);
      setFlash("wrong");
    }
    setTimeout(() => setFlash(null), 200);

    // Next card or complete
    const nextIdx = cardIndex + 1;
    if (nextIdx >= cards.length) {
      setTimeout(() => setPhase("complete"), 300);
    } else {
      setCardIndex(nextIdx);
      setRevealed(false);
      setScratchPercent(0);
      if (timed) setTimeLeft(15);
      setTipIdx(Math.floor(Math.random() * TIPS[subject].length));
    }
  }, [streak, cardIndex, cards.length, timed, subject]);

  // When revealed, switch to selfCheck phase
  useEffect(() => {
    if (revealed && phase === "playing") {
      setPhase("selfCheck");
    }
  }, [revealed, phase]);

  // When self-check is done, go back to playing for next card
  useEffect(() => {
    if (phase === "selfCheck") return;
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

  const startGame = () => {
    const newCards = generateCards(subject, cardCount);
    setCards(newCards);
    setCardIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrect(0);
    setWrong(0);
    setRevealed(false);
    setScratchPercent(0);
    setAchievementQueue([]);
    setShowAchievementIndex(0);
    setCountdown(COUNTDOWN_SECS);
    if (timed) setTimeLeft(15);
    setTipIdx(Math.floor(Math.random() * TIPS[subject].length));
    setPhase("countdown");
  };

  const subjectLabels: Record<Subject, string> = {
    math: "Math",
    science: "Science",
    history: "History",
    vocabulary: "Vocabulary",
  };

  const subjectEmoji: Record<Subject, string> = {
    math: "🔢",
    science: "🧪",
    history: "📜",
    vocabulary: "📚",
  };

  const currentCard = cards[cardIndex] || null;
  const timerColor = timeLeft > 10 ? "text-green-400" : timeLeft > 5 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-violet-950 to-slate-950 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Scratch & Reveal</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* MENU */}
        {phase === "menu" && (
          <div className="text-center w-full">
            <div className="text-6xl mb-4">🎴</div>
            <h2 className="text-3xl font-bold text-white mb-2">Scratch & Reveal</h2>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Answer the question, then scratch to reveal the answer. Check yourself honestly!
            </p>

            {/* Subject selector */}
            <div className="max-w-xs mx-auto mb-4 space-y-1.5">
              <div className="text-xs text-slate-500 text-left">Subject</div>
              <div className="grid grid-cols-4 gap-1.5">
                {(["math", "science", "history", "vocabulary"] as Subject[]).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSubject(sub)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${subject === sub ? "bg-violet-500/25 border border-violet-400/50 text-violet-400" : "bg-white/5 border border-white/10 text-slate-500"}`}
                  >
                    {subjectEmoji[sub]} {subjectLabels[sub]}
                  </button>
                ))}
              </div>
            </div>

            {/* Card count slider */}
            <div className="max-w-xs mx-auto mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Cards</span>
                <span className="text-xs font-bold text-violet-400 tabular-nums">{cardCount}</span>
              </div>
              <input type="range" min={5} max={20} step={1} value={cardCount}
                onChange={(e) => setCardCount(Number(e.target.value))}
                className="w-full accent-violet-500" />
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>Quick review</span><span>Full session</span>
              </div>
            </div>

            {/* Timed toggle */}
            <div className="max-w-xs mx-auto mb-5">
              <label className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Timed mode (15s per card)</span>
                <button
                  onClick={() => setTimed(!timed)}
                  className={`w-10 h-6 rounded-full transition-all ${timed ? "bg-violet-500" : "bg-white/10"} relative`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${timed ? "left-5" : "left-1"}`} />
                </button>
              </label>
            </div>

            <button
              onClick={startGame}
              className="px-10 py-4 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/30"
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
            <div className="text-8xl font-bold text-violet-400 animate-pulse">
              {countdown || "GO!"}
            </div>
          </div>
        )}

        {/* PLAYING / SELF-CHECK */}
        {(phase === "playing" || phase === "selfCheck") && currentCard && (
          <div className="w-full space-y-4">
            {/* HUD */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {timed && phase === "playing" && (
                  <span className={`text-lg font-bold tabular-nums ${timerColor}`}>{timeLeft}s</span>
                )}
                {!timed && (
                  <span className="text-sm text-slate-400">Card {cardIndex + 1}/{cards.length}</span>
                )}
              </div>
              <StreakBadge streak={streak} />
              <div className="text-right">
                <div className="text-lg font-bold text-white tabular-nums">{score}</div>
                <div className="text-xs text-slate-400">{correct}✓ {wrong}✗</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-300"
                style={{ width: `${((cardIndex) / cards.length) * 100}%` }}
              />
            </div>

            {/* Tip */}
            <div className="text-center text-[11px] text-slate-500 italic">
              💡 {TIPS[subject][tipIdx % TIPS[subject].length]}
            </div>

            {/* Flash overlay */}
            {flash && (
              <div className={`fixed inset-0 pointer-events-none z-50 ${flash === "correct" ? "bg-green-500/10" : "bg-red-500/15"}`} />
            )}

            {/* Question */}
            <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center shadow-lg shadow-black/20">
              <div className="text-sm text-slate-400 mb-2">Question</div>
              <div className="text-2xl font-bold text-white">{currentCard.question}</div>
            </div>

            {/* Scratch area */}
            <div className="relative bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden shadow-lg shadow-black/20" style={{ minHeight: 120 }}>
              {/* Answer underneath */}
              <div className="p-6 text-center">
                <div className="text-sm text-slate-400 mb-2">Answer</div>
                <div className="text-2xl font-bold text-violet-400">{currentCard.answer}</div>
              </div>

              {/* Scratch canvas overlay */}
              {!revealed && (
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full cursor-pointer touch-none rounded-2xl"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                />
              )}
            </div>

            {/* Scratch progress */}
            {!revealed && (
              <div className="text-center text-xs text-slate-500">
                Scratched: {scratchPercent}% — reveal at 60%
              </div>
            )}

            {/* Self-check buttons */}
            {phase === "selfCheck" && (
              <div className="space-y-3">
                <div className="text-center text-sm text-slate-300">Did you get it right?</div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      handleSelfCheck(true);
                      if (cardIndex + 1 < cards.length) setPhase("playing");
                    }}
                    className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-400/40 text-green-400 font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" /> Yes, I knew it!
                  </button>
                  <button
                    onClick={() => {
                      handleSelfCheck(false);
                      if (cardIndex + 1 < cards.length) setPhase("playing");
                    }}
                    className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-red-400 font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <X className="w-5 h-5" /> No, I missed it
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPLETE */}
        {phase === "complete" && (
          <div className="text-center">
            <Star className="w-16 h-16 text-yellow-400 fill-yellow-400 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-white mb-2">Session Complete!</h3>
            <div className="text-5xl font-bold text-violet-400 mb-2">{score}</div>
            <div className="text-slate-400 space-y-1 mb-6">
              <p>{correct}/{cards.length} correct</p>
              <p>Accuracy: {cards.length > 0 ? Math.round((correct / cards.length) * 100) : 0}%</p>
              <p>Best streak: x{bestStreak}</p>
            </div>
            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-sm font-medium mb-2 flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" /> New High Score!
              </p>
            )}
            <div className="mb-3">
              <ScoreSubmit game="scratch-reveal" score={score} level={1} stats={{ correct, wrong, bestStreak, accuracy: cards.length > 0 ? Math.round((correct / cards.length) * 100) : 0 }} />
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
                className="px-6 py-3 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
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
