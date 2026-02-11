"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Clock, CheckCircle, XCircle, Star } from "lucide-react";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxLevelUp, sfxGameOver, sfxAchievement, sfxCountdown, sfxCountdownGo, sfxPerfect } from "@/lib/games/audio";
import { createAdaptiveState, adaptiveUpdate, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import { getGradeForLevel } from "@/lib/games/learning-guide";
import { TIMELINE_EVENTS as EXPANDED_EVENTS } from "@/lib/games/data/timeline-events";
import { TIMELINE_EVENTS_2 as EXPANDED_EVENTS_2 } from "@/lib/games/data/timeline-events-2";
import Link from "next/link";

// ── Types ──

interface HistoricalEvent {
  year: number;
  event: string;
  category: EventCategory;
  /** How well-known: 1 = very famous, 2 = well-known, 3 = obscure */
  fame: 1 | 2 | 3;
  /** Brief educational note shown in practice mode */
  explanation: string;
}

type EventCategory = "science" | "history" | "geography" | "invention" | "culture";
type GamePhase = "menu" | "countdown" | "playing" | "result" | "complete";

// ── Event Data ──

const EVENTS: HistoricalEvent[] = [
  // Science
  { year: 1543, event: "Copernicus publishes heliocentric model", category: "science", fame: 2, explanation: "Nicolaus Copernicus proposed that the Earth revolves around the Sun, challenging the geocentric view." },
  { year: 1687, event: "Newton publishes Principia Mathematica", category: "science", fame: 2, explanation: "Isaac Newton's Principia laid the foundation for classical mechanics and the law of universal gravitation." },
  { year: 1859, event: "Darwin publishes On the Origin of Species", category: "science", fame: 1, explanation: "Charles Darwin introduced the theory of evolution by natural selection." },
  { year: 1905, event: "Einstein's theory of special relativity", category: "science", fame: 1, explanation: "Albert Einstein's paper introduced E=mc² and revolutionized physics." },
  { year: 1953, event: "Watson & Crick discover DNA structure", category: "science", fame: 1, explanation: "James Watson and Francis Crick described the double helix structure of DNA." },
  { year: 1969, event: "First Moon landing (Apollo 11)", category: "science", fame: 1, explanation: "Neil Armstrong and Buzz Aldrin became the first humans to walk on the Moon." },
  { year: 1990, event: "Hubble Space Telescope launched", category: "science", fame: 2, explanation: "The Hubble telescope has provided stunning images and groundbreaking astronomical discoveries." },
  { year: 2012, event: "Higgs boson discovered at CERN", category: "science", fame: 2, explanation: "The discovery confirmed the existence of the Higgs field, which gives particles mass." },

  // History
  { year: 1896, event: "First modern Olympic Games in Athens", category: "history", fame: 2, explanation: "Pierre de Coubertin revived the ancient Greek tradition with the first modern Olympics." },
  { year: 1215, event: "Magna Carta signed in England", category: "history", fame: 1, explanation: "The Magna Carta limited the power of the English king and is a cornerstone of constitutional law." },
  { year: 1492, event: "Columbus reaches the Americas", category: "history", fame: 1, explanation: "Christopher Columbus's voyage opened sustained European contact with the Americas." },
  { year: 1776, event: "American Declaration of Independence", category: "history", fame: 1, explanation: "The thirteen American colonies declared independence from Britain on July 4, 1776." },
  { year: 1789, event: "French Revolution begins", category: "history", fame: 1, explanation: "The storming of the Bastille in 1789 marked the start of the French Revolution." },
  { year: 1865, event: "End of the American Civil War", category: "history", fame: 1, explanation: "General Lee surrendered at Appomattox Court House, ending four years of civil war." },
  { year: 1914, event: "World War I begins", category: "history", fame: 1, explanation: "The assassination of Archduke Franz Ferdinand triggered the First World War." },
  { year: 1945, event: "World War II ends", category: "history", fame: 1, explanation: "Japan surrendered on August 15, 1945, ending the deadliest conflict in history." },
  { year: 1989, event: "Fall of the Berlin Wall", category: "history", fame: 1, explanation: "The Berlin Wall fell on November 9, 1989, symbolizing the end of the Cold War." },
  { year: 2001, event: "September 11 attacks", category: "history", fame: 1, explanation: "Terrorist attacks on the World Trade Center and Pentagon changed global security forever." },

  // Inventions
  { year: 1440, event: "Gutenberg invents the printing press", category: "invention", fame: 1, explanation: "Johannes Gutenberg's movable type printing press revolutionized the spread of knowledge." },
  { year: 1752, event: "Benjamin Franklin's kite experiment", category: "invention", fame: 2, explanation: "Franklin demonstrated the electrical nature of lightning, leading to the lightning rod." },
  { year: 1876, event: "Alexander Graham Bell patents the telephone", category: "invention", fame: 1, explanation: "Bell's telephone patent launched the era of instant voice communication." },
  { year: 1903, event: "Wright brothers' first powered flight", category: "invention", fame: 1, explanation: "Orville and Wilbur Wright achieved the first sustained, controlled powered flight at Kitty Hawk." },
  { year: 1928, event: "Alexander Fleming discovers penicillin", category: "invention", fame: 1, explanation: "Fleming's accidental discovery of penicillin launched the antibiotic revolution." },
  { year: 1946, event: "ENIAC — first general-purpose computer", category: "invention", fame: 2, explanation: "ENIAC was the first electronic general-purpose digital computer, weighing 30 tons." },
  { year: 1983, event: "Internet (TCP/IP) officially launched", category: "invention", fame: 2, explanation: "ARPANET switched to TCP/IP on January 1, 1983, creating the modern internet." },
  { year: 2007, event: "First iPhone released", category: "invention", fame: 1, explanation: "Apple's iPhone transformed mobile computing and launched the smartphone revolution." },

  // Geography / Exploration
  { year: 1519, event: "Magellan begins circumnavigation of Earth", category: "geography", fame: 2, explanation: "Ferdinand Magellan's expedition was the first to sail around the world." },
  { year: 1804, event: "Lewis and Clark expedition begins", category: "geography", fame: 2, explanation: "Lewis and Clark explored the western portion of the United States after the Louisiana Purchase." },
  { year: 1911, event: "Roald Amundsen reaches the South Pole", category: "geography", fame: 2, explanation: "Norwegian Amundsen beat Robert Scott to become the first to reach the South Pole." },
  { year: 1960, event: "First descent to Mariana Trench", category: "geography", fame: 3, explanation: "Jacques Piccard and Don Walsh descended to the deepest point in the ocean at ~10,916 meters." },

  // Culture
  { year: 1599, event: "Shakespeare writes Hamlet", category: "culture", fame: 2, explanation: "William Shakespeare's Hamlet is one of the most performed and studied plays in history." },
  { year: 1770, event: "Beethoven is born", category: "culture", fame: 2, explanation: "Ludwig van Beethoven became one of the most influential composers in Western music." },
  { year: 1886, event: "Statue of Liberty dedicated", category: "culture", fame: 1, explanation: "France gifted the Statue of Liberty to the US, dedicated on October 28, 1886." },
  { year: 1928, event: "Mickey Mouse debuts (Steamboat Willie)", category: "culture", fame: 2, explanation: "Steamboat Willie introduced Mickey Mouse and was one of the first synchronized sound cartoons." },
  { year: 1969, event: "Woodstock music festival", category: "culture", fame: 2, explanation: "Woodstock drew over 400,000 people and became a symbol of the counterculture movement." },
];

// ── Merge expanded timeline data ──

const EXPANDED_CATEGORY_MAP: Record<string, EventCategory> = {
  science: "science", history: "history", geography: "geography",
  invention: "invention", culture: "culture",
  war: "history", politics: "history", exploration: "geography",
  medicine: "science", art: "culture",
};

const FAME_FROM_DIFFICULTY: Record<string, 1 | 2 | 3> = {
  easy: 1, medium: 2, hard: 3,
};

const ALL_EVENTS: HistoricalEvent[] = [
  ...EVENTS,
  ...[...EXPANDED_EVENTS, ...EXPANDED_EVENTS_2]
    .filter(e => !EVENTS.some(existing => existing.year === e.year && existing.event === e.event))
    .map(e => ({
      year: e.year,
      event: e.event,
      category: (EXPANDED_CATEGORY_MAP[e.category] || "history") as EventCategory,
      fame: FAME_FROM_DIFFICULTY[e.difficulty] || (2 as 1 | 2 | 3),
      explanation: `${e.event} (${Math.abs(e.year)} ${e.year < 0 ? "BC" : "AD"}).`,
    })),
];

const CATEGORY_COLORS: Record<EventCategory, string> = {
  science: "#10b981",
  history: "#ef4444",
  geography: "#3b82f6",
  invention: "#f59e0b",
  culture: "#a855f7",
};

const CATEGORY_LABELS: Record<EventCategory, string> = {
  science: "Science",
  history: "History",
  geography: "Geography",
  invention: "Inventions",
  culture: "Culture",
};

const HISTORY_TIPS = [
  "Events closer together in time are harder to order — look for context clues!",
  "Think about cause and effect — what had to happen first?",
  "Major wars often drive invention and social change.",
  "The Renaissance came before the Age of Exploration.",
  "The 20th century saw more technological change than any before it.",
  "Many inventions build on earlier discoveries.",
  "World events are often interconnected across continents.",
  "The printing press (1440) changed knowledge-sharing forever.",
];

const COUNTDOWN_SECS = 3;

// ── Helpers ──

/**
 * Pick events for a round, using adaptive difficulty to control how spread-apart
 * the years are and how obscure the events are.
 *
 * Low levels: events far apart (easy), only famous events
 * High levels: events close together (hard), include obscure events
 */
function pickRoundAdaptive(
  eventCount: number,
  categories: EventCategory[],
  usedEvents: Set<string>,
  adaptiveLevel: number,
): HistoricalEvent[] {
  // Determine min year spread based on level: low = 100+ years apart, high = 10 years
  const minYearSpread = adaptiveLevel < 5 ? 80 : adaptiveLevel < 10 ? 40 : adaptiveLevel < 15 ? 20 : 5;

  // At low levels, only use famous events (fame 1); at higher levels, include less-known ones
  const maxFame = adaptiveLevel < 5 ? 1 : adaptiveLevel < 12 ? 2 : 3;

  const pool = ALL_EVENTS
    .filter((e) => categories.includes(e.category) && !usedEvents.has(e.event) && e.fame <= maxFame)
    .sort(() => Math.random() - 0.5);

  // Try to find a set with the desired year spread
  for (let attempt = 0; attempt < 30; attempt++) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picked: HistoricalEvent[] = [];

    for (const evt of shuffled) {
      if (picked.length >= eventCount) break;
      // Check spread against all already-picked events
      const tooClose = picked.some((p) => Math.abs(p.year - evt.year) < minYearSpread);
      if (!tooClose || picked.length === 0) {
        picked.push(evt);
      }
    }

    if (picked.length >= eventCount) return picked.slice(0, eventCount);
  }

  // Fallback: just pick random events
  const fallback = ALL_EVENTS
    .filter((e) => categories.includes(e.category))
    .sort(() => Math.random() - 0.5);
  return fallback.slice(0, eventCount);
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── Component ──

export function TimelineDashGame() {
  useGameMusic();

  const [phase, setPhase] = useState<GamePhase>("menu");
  const [countdownVal, setCountdownVal] = useState(COUNTDOWN_SECS);
  const [round, setRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(5);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [shuffled, setShuffled] = useState<HistoricalEvent[]>([]);
  const [placed, setPlaced] = useState<HistoricalEvent[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctOrder: HistoricalEvent[] } | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>(["science", "history", "invention", "geography", "culture"]);
  const [eventsPerRound, setEventsPerRound] = useState(4);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("timelineDash_highScore"));
  const [usedEvents] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [achievementQueue, setAchievementQueue] = useState<Array<{ name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Adaptive difficulty
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));

  // Practice mode
  const [practiceMode, setPracticeMode] = useState(false);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (practiceMode) {
      // Skip countdown in practice mode
      sfxCountdownGo();
      setPhase("playing");
      startNewRound();
      return;
    }
    if (countdownVal <= 0) {
      sfxCountdownGo();
      setPhase("playing");
      startNewRound();
      return;
    }
    sfxCountdown();
    const t = setTimeout(() => setCountdownVal((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdownVal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer — skip in practice mode
  useEffect(() => {
    if (practiceMode) return;
    if (phase !== "playing" && phase !== "result") return;
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, practiceMode]);

  // Game complete
  useEffect(() => {
    if (phase !== "complete") return;
    if (!practiceMode) {
      if (lives === 3) sfxPerfect();
      else sfxGameOver();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (!practiceMode) {
      trackGamePlayed("timeline-dash", score);
      if (score > highScore) {
        setHighScore(score);
        setLocalHighScore("timelineDash_highScore", score);
      }
      const profile = getProfile();
      const newOnes = checkAchievements(
        { gameId: "timeline-dash", score, level: round, bestStreak, timeSeconds: elapsed, elapsed },
        profile.totalGamesPlayed, profile.gamesPlayedByGameId
      );
      if (newOnes.length > 0) { sfxAchievement(); setAchievementQueue(newOnes); }
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const startNewRound = useCallback(() => {
    const picked = pickRoundAdaptive(eventsPerRound, selectedCategories, usedEvents, adaptive.level);
    picked.forEach((e) => usedEvents.add(e.event));
    setEvents(picked.sort((a, b) => a.year - b.year));
    setShuffled(shuffleArray(picked));
    setPlaced([]);
    setFeedback(null);
    setRoundStartTime(Date.now());
    setTipIdx(Math.floor(Math.random() * HISTORY_TIPS.length));
  }, [eventsPerRound, selectedCategories, usedEvents, adaptive.level]);

  const startGame = () => {
    setScore(0);
    setLives(3);
    setRound(0);
    setStreak(0);
    setBestStreak(0);
    setElapsed(0);
    setAchievementQueue([]);
    setShowAchievementIndex(0);
    setAdaptive(createAdaptiveState(1));
    usedEvents.clear();
    setCountdownVal(COUNTDOWN_SECS);
    setPhase("countdown");
  };

  // Place an event on the timeline
  const placeEvent = (event: HistoricalEvent) => {
    if (placed.includes(event)) return;
    setPlaced((prev) => [...prev, event]);
  };

  // Remove from placed (undo)
  const unplaceEvent = (idx: number) => {
    setPlaced((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit the order
  const submitOrder = () => {
    if (placed.length !== events.length) return;

    // Check if order is correct
    const correctOrder = [...events].sort((a, b) => a.year - b.year);
    const isCorrect = placed.every((e, i) => e.year === correctOrder[i].year);

    if (isCorrect) {
      sfxCorrect();
      const timeBonus = Math.max(0, 30 - Math.floor((Date.now() - roundStartTime) / 1000));
      const roundScore = practiceMode ? 0 : eventsPerRound * 25 + timeBonus * 5;
      setScore((s) => s + roundScore);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      // Update adaptive — correct
      setAdaptive(prev => adaptiveUpdate(prev, true, timeBonus > 15));
    } else {
      sfxWrong();
      setStreak(0);
      if (!practiceMode) setLives((l) => l - 1);
      // Update adaptive — wrong
      setAdaptive(prev => adaptiveUpdate(prev, false, false));
    }

    setFeedback({ correct: isCorrect, correctOrder });
    setPhase("result");
  };

  // Continue to next round or end
  const continueGame = () => {
    const nextRound = round + 1;
    setRound(nextRound);

    if (practiceMode) {
      // Practice mode: keep going indefinitely
      setFeedback(null);
      setPhase("playing");
      startNewRound();
      return;
    }

    if (lives <= 0 || nextRound >= totalRounds) {
      setPhase("complete");
    } else {
      setFeedback(null);
      setPhase("playing");
      startNewRound();
    }
  };

  const endPractice = () => {
    setPhase("complete");
  };

  // Toggle category
  const toggleCategory = (cat: EventCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        const next = prev.filter((c) => c !== cat);
        return next.length > 0 ? next : prev;
      }
      return [...prev, cat];
    });
  };

  const availableToPlace = shuffled.filter((e) => !placed.includes(e));
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const diffLabel = getDifficultyLabel(adaptive.level);
  const showDiffChange = adaptive.lastAdjust && Date.now() - adaptive.lastAdjustTime < 2000;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-violet-950/30 to-slate-950 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Timeline Dash</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* MENU */}
        {phase === "menu" && (
          <div className="w-full text-center space-y-5">
            <div className="text-5xl mb-1">🕰️</div>
            <h2 className="text-3xl font-bold text-white mb-1">Timeline Dash</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Place historical events in chronological order. How well do you know the order of history?
            </p>

            {/* Events per round slider */}
            <div className="max-w-xs mx-auto">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Events per round</span>
                <span className="text-xs font-bold text-violet-400 tabular-nums">{eventsPerRound}</span>
              </div>
              <input type="range" min={3} max={8} step={1} value={eventsPerRound}
                onChange={(e) => setEventsPerRound(Number(e.target.value))}
                className="w-full accent-violet-500" />
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>Quick</span><span>Challenge</span>
              </div>
            </div>

            {/* Rounds slider — hide in practice mode */}
            {!practiceMode && (
              <div className="max-w-xs mx-auto">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400">Rounds</span>
                  <span className="text-xs font-bold text-violet-400 tabular-nums">{totalRounds}</span>
                </div>
                <input type="range" min={3} max={20} step={1} value={totalRounds}
                  onChange={(e) => setTotalRounds(Number(e.target.value))}
                  className="w-full accent-violet-500" />
                <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                  <span>Short</span><span>Marathon</span>
                </div>
              </div>
            )}

            {/* Category toggles */}
            <div className="max-w-xs mx-auto space-y-1.5">
              <div className="text-xs text-slate-500 text-left mb-1">Categories</div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      selectedCategories.includes(cat)
                        ? "text-white border-opacity-50"
                        : "bg-white/5 border-white/10 text-slate-600"
                    }`}
                    style={selectedCategories.includes(cat) ? { backgroundColor: `${CATEGORY_COLORS[cat]}30`, borderColor: `${CATEGORY_COLORS[cat]}60`, color: CATEGORY_COLORS[cat] } : {}}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Practice mode toggle */}
            <div className="max-w-xs mx-auto">
              <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
                <div className="text-left">
                  <span className="text-xs text-slate-400">Practice mode</span>
                  <div className="text-[10px] text-slate-600">No timer, no lives, learn at your own pace</div>
                </div>
                <input type="checkbox" checked={practiceMode} onChange={(e) => setPracticeMode(e.target.checked)}
                  className="rounded accent-violet-500 w-4 h-4" />
              </label>
            </div>

            <button onClick={startGame} className="px-10 py-3.5 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/25">
              {practiceMode ? "Start Practice" : "Start"}
            </button>
            {highScore > 0 && !practiceMode && (
              <div className="flex items-center justify-center gap-1.5 text-yellow-400/70 text-xs">
                <Trophy className="w-3 h-3" /> Best: {highScore}
              </div>
            )}
          </div>
        )}

        {/* COUNTDOWN */}
        {phase === "countdown" && (
          <div className="text-center">
            <div className="text-8xl font-bold text-violet-400 animate-pulse tabular-nums">
              {countdownVal > 0 ? countdownVal : "GO!"}
            </div>
          </div>
        )}

        {/* PLAYING */}
        {phase === "playing" && events.length > 0 && (
          <div className="w-full space-y-4">
            {/* HUD */}
            <div className="flex items-center justify-between text-sm">
              {practiceMode ? (
                <>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-400 font-medium">Practice</span>
                    <span className="text-slate-400 tabular-nums">Round {round + 1}</span>
                  </div>
                  <button onClick={endPractice} className="px-2 py-0.5 rounded-md bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 text-[10px] transition-colors">
                    End
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="tabular-nums text-white font-bold">{formatTime(elapsed)}</span>
                  </div>
                  <div className="text-xs text-slate-500">Round {round + 1}/{totalRounds}</div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-500">
                      {"❤️".repeat(lives)}{"🖤".repeat(Math.max(0, 3 - lives))}
                    </div>
                    <div className="text-white font-bold tabular-nums">{score}</div>
                  </div>
                </>
              )}
            </div>

            {/* Adaptive badge */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-bold" style={{ color: diffLabel.color }}>{diffLabel.emoji} {diffLabel.label}</span>
              <span className="text-xs text-white/60">Lvl {Math.round(adaptive.level)} &middot; {getGradeForLevel(adaptive.level).label}</span>
              {showDiffChange && (
                <span className={`text-[10px] font-bold animate-bounce ${adaptive.lastAdjust === "up" ? "text-red-400" : "text-green-400"}`}>
                  {adaptive.lastAdjust === "up" ? "↑ Harder!" : "↓ Easier"}
                </span>
              )}
            </div>

            {/* Tip */}
            <div className="text-center text-[11px] text-slate-500 italic px-2">
              💡 {HISTORY_TIPS[tipIdx % HISTORY_TIPS.length]}
            </div>

            {/* Timeline area — placed events */}
            <div className="space-y-1">
              <div className="text-xs text-slate-500 uppercase tracking-wider text-center">
                Your Timeline (earliest → latest)
              </div>
              <div className="relative min-h-[80px] bg-white/[0.02] border border-white/10 rounded-xl p-3">
                {placed.length === 0 ? (
                  <div className="text-center text-slate-600 text-sm py-4">
                    Tap events below to place them in order
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {placed.map((evt, idx) => (
                      <button
                        key={evt.event}
                        onClick={() => unplaceEvent(idx)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 group"
                      >
                        <span className="text-xs font-bold text-violet-400 tabular-nums w-5">{idx + 1}</span>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[evt.category] }} />
                        <span className="text-sm text-white flex-1">{evt.event}</span>
                        <span className="text-[10px] text-slate-600 group-hover:text-red-400 transition-colors">✕</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Available events */}
            {availableToPlace.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 uppercase tracking-wider text-center">
                  Available Events
                </div>
                <div className="space-y-1.5">
                  {availableToPlace.map((evt) => (
                    <button
                      key={evt.event}
                      onClick={() => placeEvent(evt)}
                      className="w-full text-left px-3 py-2.5 rounded-lg border transition-all hover:scale-[1.01] active:scale-[0.99]"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[evt.category]}10`,
                        borderColor: `${CATEGORY_COLORS[evt.category]}30`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[evt.category] }} />
                        <span className="text-sm text-white">{evt.event}</span>
                      </div>
                      <div className="text-[10px] mt-0.5 ml-4" style={{ color: CATEGORY_COLORS[evt.category] }}>
                        {CATEGORY_LABELS[evt.category]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            {placed.length === events.length && (
              <button
                onClick={submitOrder}
                className="w-full py-3 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Check Order
              </button>
            )}
          </div>
        )}

        {/* RESULT */}
        {phase === "result" && feedback && (
          <div className="w-full space-y-4 text-center">
            {feedback.correct ? (
              <>
                <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 mx-auto animate-bounce" />
                <h3 className="text-2xl font-bold text-green-400">Correct!</h3>
                <p className="text-slate-400 text-sm">You placed all events in the right order!</p>
              </>
            ) : (
              <>
                <XCircle className="w-12 h-12 text-red-400 mx-auto" />
                <h3 className="text-2xl font-bold text-red-400">Not quite!</h3>
                <p className="text-slate-400 text-sm">Here&apos;s the correct order:</p>
              </>
            )}

            {/* Show correct timeline with years and explanations */}
            <div className="space-y-1 text-left">
              {feedback.correctOrder.map((evt, idx) => {
                const wasPlacedCorrectly = placed[idx]?.event === evt.event;
                return (
                  <div key={evt.event}>
                    <div
                      className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${
                        wasPlacedCorrectly
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-red-500/10 border-red-500/30"
                      }`}
                    >
                      <span className="text-sm font-bold text-violet-400 tabular-nums w-12">{evt.year}</span>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[evt.category] }} />
                      <span className="text-sm text-white flex-1">{evt.event}</span>
                      {wasPlacedCorrectly ? (
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                    {/* Practice mode: show explanation for every event */}
                    {practiceMode && (
                      <div className="ml-14 mr-2 mt-1 mb-2 text-[11px] text-slate-400 italic">
                        {evt.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Adaptive badge in result */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-bold" style={{ color: diffLabel.color }}>{diffLabel.emoji} {diffLabel.label}</span>
              <span className="text-xs text-white/60">Lvl {Math.round(adaptive.level)} &middot; {getGradeForLevel(adaptive.level).label}</span>
              {showDiffChange && (
                <span className={`text-[10px] font-bold animate-bounce ${adaptive.lastAdjust === "up" ? "text-red-400" : "text-green-400"}`}>
                  {adaptive.lastAdjust === "up" ? "↑ Harder!" : "↓ Easier"}
                </span>
              )}
            </div>

            <button
              onClick={continueGame}
              className="px-8 py-3 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/25"
            >
              {practiceMode ? "Next Round" : lives <= 0 || round + 1 >= totalRounds ? "See Results" : "Next Round"}
            </button>
            {practiceMode && (
              <button
                onClick={endPractice}
                className="block mx-auto text-sm text-slate-400 hover:text-white transition-colors"
              >
                End Practice
              </button>
            )}
          </div>
        )}

        {/* COMPLETE */}
        {phase === "complete" && (
          <div className="w-full text-center space-y-4">
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

            <h3 className="text-2xl font-bold text-white">{practiceMode ? "Practice Complete" : "Game Over"}</h3>
            {!practiceMode && <div className="text-4xl font-bold text-violet-400">{score}</div>}

            <div className={`grid ${practiceMode ? "grid-cols-2" : "grid-cols-3"} gap-3 text-center max-w-xs mx-auto`}>
              <div>
                <div className="text-xl font-bold text-white">{round}</div>
                <div className="text-[9px] text-slate-500 uppercase">Rounds</div>
              </div>
              {!practiceMode && (
                <div>
                  <div className="text-xl font-bold text-green-400">x{bestStreak}</div>
                  <div className="text-[9px] text-slate-500 uppercase">Best Streak</div>
                </div>
              )}
              <div>
                <div className="text-xl font-bold text-cyan-400">{practiceMode ? adaptive.level.toFixed(1) : formatTime(elapsed)}</div>
                <div className="text-[9px] text-slate-500 uppercase">{practiceMode ? "Final Level" : "Time"}</div>
              </div>
            </div>

            {/* Final difficulty level */}
            <div>
              <div className="text-sm text-slate-400 mb-1">Final Difficulty Level</div>
              <div className="text-lg font-bold" style={{ color: diffLabel.color }}>
                {diffLabel.emoji} {diffLabel.label}
              </div>
              <div className="text-xs text-slate-500">Lvl {Math.round(adaptive.level)} &middot; {getGradeForLevel(adaptive.level).label}</div>
            </div>

            {!practiceMode && score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-sm font-medium flex items-center justify-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> New High Score!
              </p>
            )}
            {!practiceMode && (
              <div className="w-full max-w-xs mx-auto">
                <ScoreSubmit game="timeline-dash" score={score} level={round} stats={{ bestStreak, time: formatTime(elapsed) }} />
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button onClick={startGame} className="px-5 py-2.5 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm">
                <RotateCcw className="w-3.5 h-3.5" /> Again
              </button>
              <Link href="/games" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all text-sm">
                Back
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {phase === "menu" && (
        <div className="max-w-md mx-auto px-4 mt-4 mb-6">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/5">
              <div className="text-lg mb-0.5">📜</div>
              <div className="text-[10px] text-slate-500">Read the events</div>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/5">
              <div className="text-lg mb-0.5">🔢</div>
              <div className="text-[10px] text-slate-500">Place in order</div>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/5">
              <div className="text-lg mb-0.5">✅</div>
              <div className="text-[10px] text-slate-500">Check your answer</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
