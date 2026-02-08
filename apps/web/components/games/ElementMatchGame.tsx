"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Clock } from "lucide-react";
import { trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxLevelUp, sfxAchievement, sfxClick, sfxCountdownGo } from "@/lib/games/audio";
import Link from "next/link";
import { getElementsByDifficulty } from "@/lib/games/science-data";

type GamePhase = "menu" | "countdown" | "playing" | "won";
type Difficulty = "easy" | "medium" | "hard";

interface Card {
  id: number;
  content: string;
  pairId: number;
  type: "symbol" | "name";
  flipped: boolean;
  matched: boolean;
}

function createCards(pairCount: number, difficulty: Difficulty): Card[] {
  const pool = getElementsByDifficulty(difficulty);
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, pairCount);
  const cards: Card[] = [];

  shuffled.forEach((el, i) => {
    cards.push({ id: i * 2, content: el.symbol, pairId: i, type: "symbol", flipped: false, matched: false });
    cards.push({ id: i * 2 + 1, content: el.name, pairId: i, type: "name", flipped: false, matched: false });
  });

  return cards.sort(() => Math.random() - 0.5);
}

const CHEMISTRY_TIPS = [
  "Elements in the same column of the periodic table have similar properties.",
  "Noble gases (He, Ne, Ar) are extremely stable and rarely react.",
  "Metals are on the left side of the periodic table, nonmetals on the right.",
  "The atomic number tells you how many protons an element has.",
  "Elements are organized by increasing atomic number in the periodic table.",
  "H₂O is made of 2 hydrogen atoms and 1 oxygen atom.",
  "Iron (Fe) gets its symbol from the Latin word 'ferrum'.",
  "Gold (Au) comes from the Latin 'aurum' meaning 'shining dawn'.",
  "Carbon is the basis of all organic chemistry.",
  "Chlorine (Cl) is used to purify drinking water.",
];

const GRID_OPTIONS: { label: string; pairs: number; cols: number; difficulty: Difficulty }[] = [
  { label: "4 pairs (8 cards)", pairs: 4, cols: 4, difficulty: "easy" },
  { label: "6 pairs (12 cards)", pairs: 6, cols: 4, difficulty: "medium" },
  { label: "8 pairs (16 cards)", pairs: 8, cols: 4, difficulty: "hard" },
  { label: "10 pairs (20 cards)", pairs: 10, cols: 5, difficulty: "hard" },
];

export function ElementMatchGame() {
  useGameMusic();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [gridCols, setGridCols] = useState(4);
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>("easy");
  const [bestTime, setBestTime] = useState<Record<string, number>>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("elementMatch_best");
        return saved ? JSON.parse(saved) : {};
      }
    } catch { /* ignore */ }
    return {};
  });
  const [achievementQueue, setAchievementQueue] = useState<Array<{ name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [chemTipIdx, setChemTipIdx] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [pendingStart, setPendingStart] = useState<{ pairs: number; cols: number; difficulty: Difficulty } | null>(null);

  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setChemTipIdx((i) => (i + 1) % CHEMISTRY_TIPS.length), 6000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "won") return;
    const scoreVal = Math.max(1, 1000 - elapsed * 10 - moves * 5);
    trackGamePlayed("element-match", scoreVal);
    const profile = getProfile();
    const newOnes = checkAchievements(
      { gameId: "element-match", timeSeconds: elapsed, elapsed, moves, totalPairs },
      profile.totalGamesPlayed,
      profile.gamesPlayedByGameId
    );
    if (newOnes.length > 0) { sfxAchievement(); setAchievementQueue(newOnes); }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps -- run once on won

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (pendingStart) {
            setCards(createCards(pendingStart.pairs, pendingStart.difficulty));
            setFlippedIds([]);
            setMoves(0);
            setMatchedPairs(0);
            setTotalPairs(pendingStart.pairs);
            setElapsed(0);
            setGridCols(pendingStart.cols);
            setAchievementQueue([]);
            setShowAchievementIndex(0);
            setPendingStart(null);
          }
          setPhase("playing");
          sfxCountdownGo();
          return 3;
        }
        return c - 1;
      });
    }, 800);
    return () => clearTimeout(t);
  }, [phase, countdown, pendingStart]);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const startGame = useCallback((pairCount: number, cols: number, difficulty: Difficulty = "easy") => {
    setPendingStart({ pairs: pairCount, cols, difficulty });
    setCurrentDifficulty(difficulty);
    setCountdown(3);
    setPhase("countdown");
  }, []);

  const handleCardClick = useCallback(
    (cardId: number) => {
      if (phase !== "playing") return;
      if (flippedIds.length >= 2) return;

      const card = cards.find((c) => c.id === cardId);
      if (!card || card.flipped || card.matched) return;

      const newFlipped = [...flippedIds, cardId];
      sfxClick();
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, flipped: true } : c)));
      setFlippedIds(newFlipped);

      if (newFlipped.length === 2) {
        setMoves((m) => m + 1);
        const [first, second] = newFlipped.map((id) => cards.find((c) => c.id === id)!);

        if (first.pairId === second.pairId) {
          // Match!
          sfxCorrect();
          setTimeout(() => {
            // Guard: only proceed if still playing
            setPhase(currentPhase => {
              if (currentPhase !== "playing") return currentPhase;
              setCards((prev) =>
                prev.map((c) =>
                  c.pairId === first.pairId ? { ...c, matched: true, flipped: true } : c
                )
              );
              setFlippedIds([]);
              setMatchedPairs((m) => {
                const nm = m + 1;
                if (nm === totalPairs) {
                  sfxLevelUp();
                  setPhase("won");
                  // Save best time
                  const key = `${totalPairs}`;
                  setBestTime((prev) => {
                    const newBest = { ...prev };
                    if (!newBest[key] || elapsed < newBest[key]) {
                      newBest[key] = elapsed;
                      localStorage.setItem("elementMatch_best", JSON.stringify(newBest));
                    }
                    return newBest;
                  });
                }
                return nm;
              });
              return currentPhase;
            });
          }, 400);
        } else {
          // No match
          sfxWrong();
          setTimeout(() => {
            // Guard: only proceed if still playing
            setPhase(currentPhase => {
              if (currentPhase !== "playing") return currentPhase;
              setCards((prev) =>
                prev.map((c) =>
                  newFlipped.includes(c.id) ? { ...c, flipped: false } : c
                )
              );
              setFlippedIds([]);
              return currentPhase;
            });
          }, 800);
        }
      }
    },
    [phase, cards, flippedIds, totalPairs, elapsed]
  );

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 flex flex-col items-center">
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Element Match</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* MENU */}
        {phase === "menu" && (
          <div className="text-center w-full">
            <div className="text-6xl mb-4">🧪</div>
            <h2 className="text-3xl font-bold text-white mb-2">Element Match</h2>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">
              Match chemical element symbols to their names. Flip two cards at a time!
            </p>
            <div className="space-y-3 max-w-xs mx-auto">
              {GRID_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => startGame(opt.pairs, opt.cols, opt.difficulty)}
                  className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 hover:border-blue-400/50 text-white font-medium rounded-xl transition-all flex items-center justify-between px-4"
                >
                  <span>{opt.label}</span>
                  {bestTime[String(opt.pairs)] && (
                    <span className="text-xs text-blue-300">Best: {formatTime(bestTime[String(opt.pairs)])}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* COUNTDOWN */}
        {phase === "countdown" && (
          <div className="text-center py-20">
            <div className="text-8xl font-bold text-blue-400 animate-pulse">
              {countdown || "GO!"}
            </div>
            <p className="mt-4 text-slate-400">Get ready...</p>
          </div>
        )}

        {/* PLAYING */}
        {phase === "playing" && (
          <div className="w-full space-y-4">
            {/* HUD */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-4 h-4" />
                <span className="tabular-nums text-white font-bold">{formatTime(elapsed)}</span>
              </div>
              <div className="text-slate-400">
                {matchedPairs}/{totalPairs} matched
              </div>
              <div className="text-slate-400">{moves} moves</div>
            </div>

            {/* Chemistry tip */}
            <div className="text-center text-[11px] text-slate-500 italic px-2">
              💡 {CHEMISTRY_TIPS[chemTipIdx]}
            </div>

            {/* Grid */}
            <div
              className="grid gap-1.5 sm:gap-2"
              style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
            >
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  disabled={card.matched || card.flipped}
                  className={`aspect-[3/4] rounded-xl font-bold transition-all duration-300 flex items-center justify-center text-center p-1 min-h-[56px] shadow-md ${
                    card.matched
                      ? "bg-green-500/25 border-2 border-green-400/60 text-green-400 shadow-green-500/20"
                      : card.flipped
                      ? "bg-blue-500/25 border-2 border-blue-400/60 text-white shadow-lg shadow-blue-500/20"
                      : "bg-white/[0.08] border-2 border-white/10 hover:border-blue-400/40 hover:bg-white/15 hover:shadow-lg text-transparent active:scale-95"
                  }`}
                >
                  {card.flipped || card.matched ? (
                    <span className={card.type === "symbol" ? "text-xl sm:text-2xl drop-shadow-sm" : "text-[10px] sm:text-xs"}>
                      {card.content}
                    </span>
                  ) : (
                    <span className="text-xl sm:text-2xl text-slate-500">?</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* WON */}
        {phase === "won" && (
          <div className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-3xl font-bold text-white mb-2">Complete!</h3>
            <div className="space-y-1 text-slate-300 mb-6">
              <p className="text-2xl font-bold text-blue-400">{formatTime(elapsed)}</p>
              <p>{moves} moves</p>
              {bestTime[String(totalPairs)] === elapsed && (
                <p className="text-yellow-400 flex items-center justify-center gap-1 mt-2">
                  <Trophy className="w-4 h-4" /> New Best Time!
                </p>
              )}
            </div>
            <div className="mb-3">
              <ScoreSubmit game="element-match" score={Math.max(1, 1000 - elapsed * 10 - moves * 5)} level={totalPairs} stats={{ time: formatTime(elapsed), moves }} />
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
                onClick={() => startGame(totalPairs, gridCols, currentDifficulty)}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Again
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
