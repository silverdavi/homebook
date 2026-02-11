"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, Lightbulb, SkipForward, Star } from "lucide-react";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxAchievement, sfxCountdownGo } from "@/lib/games/audio";
import { createAdaptiveState, adaptiveUpdate, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import { getGradeForLevel } from "@/lib/games/learning-guide";
import Link from "next/link";
import { SCIENCE_WORDS } from "@/lib/games/science-data";
import { WORD_BUILDER_WORDS } from "@/lib/games/data/word-data";
import { WORD_BUILDER_WORDS_2 } from "@/lib/games/data/word-data-2";

type GamePhase = "menu" | "countdown" | "playing" | "correct" | "gameOver";

type WordDifficulty = "easy" | "medium" | "hard";

interface WordData {
  word: string;
  hint: string;
  category: string;
  difficulty: WordDifficulty;
}

const WORDS: WordData[] = [
  // ── Chemistry, Physics, Biology (from science-data) ──
  ...SCIENCE_WORDS.map((w) => ({ word: w.word, hint: w.hint, category: w.category, difficulty: w.difficulty })),
  // Math
  { word: "RATIO", hint: "Comparison of two quantities", category: "Math", difficulty: "easy" as WordDifficulty },
  { word: "PRIME", hint: "Divisible only by 1 and itself", category: "Math", difficulty: "easy" as WordDifficulty },
  { word: "ANGLE", hint: "Space between two intersecting lines", category: "Math", difficulty: "easy" as WordDifficulty },
  { word: "GRAPH", hint: "Visual display of data", category: "Math", difficulty: "easy" as WordDifficulty },
  { word: "SLOPE", hint: "Steepness of a line", category: "Math", difficulty: "medium" as WordDifficulty },
  { word: "DIGIT", hint: "Single number character", category: "Math", difficulty: "easy" as WordDifficulty },
  { word: "MEDIAN", hint: "Middle value in a sorted list", category: "Math", difficulty: "medium" as WordDifficulty },
  { word: "RADIUS", hint: "Distance from center to edge of circle", category: "Math", difficulty: "medium" as WordDifficulty },
  { word: "FACTOR", hint: "Number that divides evenly", category: "Math", difficulty: "medium" as WordDifficulty },
  // Geography
  { word: "DELTA", hint: "Land formed at a river mouth", category: "Geography", difficulty: "medium" as WordDifficulty },
  { word: "BASIN", hint: "Low area drained by a river", category: "Geography", difficulty: "medium" as WordDifficulty },
  { word: "RIDGE", hint: "Long narrow hilltop", category: "Geography", difficulty: "medium" as WordDifficulty },
  { word: "FJORD", hint: "Narrow inlet between cliffs", category: "Geography", difficulty: "hard" as WordDifficulty },
  { word: "TUNDRA", hint: "Cold treeless plain", category: "Geography", difficulty: "medium" as WordDifficulty },
  { word: "CANYON", hint: "Deep narrow valley", category: "Geography", difficulty: "easy" as WordDifficulty },
  { word: "GLACIER", hint: "Slow-moving river of ice", category: "Geography", difficulty: "hard" as WordDifficulty },
  // History
  { word: "EPOCH", hint: "A period of time in history", category: "History", difficulty: "hard" as WordDifficulty },
  { word: "REIGN", hint: "Period a monarch rules", category: "History", difficulty: "medium" as WordDifficulty },
  { word: "SIEGE", hint: "Military blockade of a city", category: "History", difficulty: "medium" as WordDifficulty },
  { word: "TREATY", hint: "Formal agreement between nations", category: "History", difficulty: "medium" as WordDifficulty },
  { word: "EMPIRE", hint: "Group of territories under one ruler", category: "History", difficulty: "easy" as WordDifficulty },
  { word: "COLONY", hint: "Settlement ruled by distant country", category: "History", difficulty: "medium" as WordDifficulty },
  // Grammar
  { word: "NOUN", hint: "Person, place, or thing", category: "Grammar", difficulty: "easy" as WordDifficulty },
  { word: "VERB", hint: "Action word", category: "Grammar", difficulty: "easy" as WordDifficulty },
  { word: "CLAUSE", hint: "Group of words with subject and verb", category: "Grammar", difficulty: "medium" as WordDifficulty },
  { word: "PREFIX", hint: "Letters added to start of a word", category: "Grammar", difficulty: "medium" as WordDifficulty },
  { word: "SUFFIX", hint: "Letters added to end of a word", category: "Grammar", difficulty: "medium" as WordDifficulty },
  { word: "SYNTAX", hint: "Rules for sentence structure", category: "Grammar", difficulty: "hard" as WordDifficulty },
  // ── Expanded word bank ──
  ...[...WORD_BUILDER_WORDS, ...WORD_BUILDER_WORDS_2].map(w => ({
    word: w.word,
    hint: w.hint,
    category: w.category,
    difficulty: w.difficulty as WordDifficulty,
  })),
];

function scramble(word: string): string {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Make sure it's actually scrambled
  if (arr.join("") === word) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr.join("");
}

/**
 * Pick a word weighted by difficulty based on adaptive level.
 * Low levels: prefer shorter/easier words. High levels: prefer longer/harder words.
 */
function pickWordAdaptive(used: Set<number>, adaptiveLevel: number): { data: WordData; index: number } {
  // Determine weights based on adaptive level
  let wEasy: number, wMedium: number, wHard: number;
  if (adaptiveLevel < 5) {
    wEasy = 0.70; wMedium = 0.25; wHard = 0.05;
  } else if (adaptiveLevel < 12) {
    wEasy = 0.25; wMedium = 0.50; wHard = 0.25;
  } else {
    wEasy = 0.10; wMedium = 0.30; wHard = 0.60;
  }

  const weights: Record<WordDifficulty, number> = { easy: wEasy, medium: wMedium, hard: wHard };

  // Also prefer shorter words at low levels: extra weight penalty for long words at low levels
  const available = WORDS.map((w, i) => ({ w, i })).filter(({ i }) => !used.has(i));
  const pool = available.length > 0 ? available : WORDS.map((w, i) => ({ w, i }));

  const scored = pool.map(({ w, i }) => {
    let score = Math.random() * (weights[w.difficulty] || 0.33);
    // Length bonus/penalty based on adaptive level
    if (adaptiveLevel < 5) {
      // Penalize long words at low levels
      if (w.word.length > 5) score *= 0.3;
      if (w.word.length > 6) score *= 0.2;
    } else if (adaptiveLevel >= 15) {
      // Bonus for long words at high levels
      if (w.word.length >= 6) score *= 1.5;
      if (w.word.length >= 7) score *= 1.3;
    }
    return { w, i, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const pick = scored[0];
  return { data: pick.w, index: pick.i };
}

const CATEGORY_COLORS: Record<string, string> = {
  Chemistry: "#a855f7",
  Physics: "#06b6d4",
  Biology: "#22c55e",
  Math: "#6366f1",
  Geography: "#3b82f6",
  History: "#ef4444",
  Grammar: "#f59e0b",
};

export function WordBuilderGame() {
  useGameMusic();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [skips, setSkips] = useState(3);
  const [usedWords] = useState<Set<number>>(new Set());
  const [highScore, setHighScore] = useState(() => getLocalHighScore("wordBuilder_highScore"));
  const [achievementQueue, setAchievementQueue] = useState<Array<{ name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const hasTrackedSessionRef = useRef(false);
  const [countdown, setCountdown] = useState(3);
  const [wordStartTime, setWordStartTime] = useState(0);

  // ── Settings ──
  const [autoHint, setAutoHint] = useState(false);

  // ── Adaptive difficulty ──
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));

  // ── Practice mode ──
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceCorrect, setPracticeCorrect] = useState(0);
  const [practiceTotal, setPracticeTotal] = useState(0);
  const [practiceWaiting, setPracticeWaiting] = useState(false);
  // Extra hint letters revealed in practice mode at low adaptive levels
  const [revealedHintLetters, setRevealedHintLetters] = useState<number[]>([]);

  useEffect(() => {
    if (phase !== "correct") return;
    const wordsBuilt = level;
    if (!hasTrackedSessionRef.current && !practiceMode) {
      trackGamePlayed("word-builder", score);
      hasTrackedSessionRef.current = true;
    }
    if (!practiceMode) {
      const profile = getProfile();
      const newOnes = checkAchievements(
        { gameId: "word-builder", score, wordsBuilt },
        profile.totalGamesPlayed,
        profile.gamesPlayedByGameId
      );
      if (newOnes.length > 0) { sfxAchievement(); setAchievementQueue(newOnes); }
    }
  }, [phase, level, score, practiceMode]); // eslint-disable-line react-hooks/exhaustive-deps -- wordsBuilt = level when correct

  const saveHighScore = useCallback((newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      setLocalHighScore("wordBuilder_highScore", newScore);
    }
  }, [highScore]);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (practiceMode) {
      // Skip countdown in practice mode
      setPhase("playing");
      sfxCountdownGo();
      return;
    }
    const t = setTimeout(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setPhase("playing");
          sfxCountdownGo();
          return 3;
        }
        return c - 1;
      });
    }, 800);
    return () => clearTimeout(t);
  }, [phase, countdown, practiceMode]);

  /**
   * Compute hint letter reveals for practice mode at low adaptive levels.
   * At level 1-3: reveal 2 letters. Level 3-6: reveal 1 letter. 6+: no extra hints.
   */
  const computeHintLetters = useCallback((word: string, adaptLevel: number): number[] => {
    if (!practiceMode) return [];
    let revealCount = 0;
    if (adaptLevel < 3) revealCount = 2;
    else if (adaptLevel < 6) revealCount = 1;
    else return [];

    // Reveal the first `revealCount` letters positions
    const positions: number[] = [];
    for (let i = 0; i < Math.min(revealCount, word.length); i++) {
      positions.push(i);
    }
    return positions;
  }, [practiceMode]);

  const loadWord = useCallback(() => {
    const { data, index } = pickWordAdaptive(usedWords, adaptive.level);
    usedWords.add(index);
    setWordData(data);
    setScrambled(scramble(data.word).split(""));
    setSelected([]);
    setShowHint(autoHint || practiceMode); // always show hint in practice mode
    setWordStartTime(Date.now());
    setRevealedHintLetters(computeHintLetters(data.word, adaptive.level));
    setPracticeWaiting(false);
    setPhase("playing");
  }, [usedWords, autoHint, practiceMode, adaptive.level, computeHintLetters]);

  const handleLetterClick = useCallback(
    (scrambledIdx: number) => {
      if (phase !== "playing" || !wordData || practiceWaiting) return;
      if (selected.includes(scrambledIdx)) return;

      const newSelected = [...selected, scrambledIdx];
      setSelected(newSelected);

      const built = newSelected.map((i) => scrambled[i]).join("");

      const target = wordData.word;
      if (built === target) {
        sfxCorrect();
        const solveTime = (Date.now() - wordStartTime) / 1000;
        const wasFast = solveTime < 8;

        // Update adaptive difficulty
        setAdaptive(prev => adaptiveUpdate(prev, true, wasFast));

        if (practiceMode) {
          setPracticeTotal(t => t + 1);
          setPracticeCorrect(c => c + 1);
          setPracticeWaiting(true);
          setPhase("correct");
        } else {
          const points = showHint ? 5 : 10;
          setScore((s) => {
            const ns = s + points;
            saveHighScore(ns);
            return ns;
          });
          setLevel((l) => l + 1);
          setPhase("correct");
          setTimeout(() => loadWord(), 1500);
        }
      } else if (built.length === target.length && built !== target) {
        sfxWrong();
        // Update adaptive difficulty — wrong
        setAdaptive(prev => adaptiveUpdate(prev, false, false));
        if (practiceMode) {
          setPracticeTotal(t => t + 1);
        }
        setTimeout(() => setSelected([]), 300);
      }
    },
    [phase, wordData, selected, scrambled, showHint, loadWord, saveHighScore, wordStartTime, practiceMode, practiceWaiting]
  );

  const handleUndo = useCallback(() => {
    setSelected((prev) => prev.slice(0, -1));
  }, []);

  const handleSkip = useCallback(() => {
    if (practiceMode) {
      // In practice mode, skips are free
      loadWord();
      return;
    }
    if (skips <= 0) return;
    setSkips((s) => s - 1);
    loadWord();
  }, [skips, loadWord, practiceMode]);

  const handlePracticeNext = useCallback(() => {
    setLevel((l) => l + 1);
    loadWord();
  }, [loadWord]);

  const endPractice = useCallback(() => {
    setPhase("gameOver");
  }, []);

  const startGame = () => {
    setScore(0);
    setLevel(0);
    setSkips(3);
    setAchievementQueue([]);
    setShowAchievementIndex(0);
    hasTrackedSessionRef.current = false;
    usedWords.clear();
    setAdaptive(createAdaptiveState(1));
    setPracticeCorrect(0);
    setPracticeTotal(0);
    setPracticeWaiting(false);
    // Load the first word data but show countdown first
    const { data, index } = pickWordAdaptive(usedWords, 1);
    usedWords.add(index);
    setWordData(data);
    setScrambled(scramble(data.word).split(""));
    setSelected([]);
    setShowHint(autoHint || practiceMode);
    setWordStartTime(Date.now());
    setRevealedHintLetters(computeHintLetters(data.word, 1));
    setCountdown(3);
    setPhase("countdown");
  };

  const builtWord = selected.map((i) => scrambled[i]).join("");
  const catColor = wordData ? CATEGORY_COLORS[wordData.category] || "#6366f1" : "#6366f1";
  const diffLabel = getDifficultyLabel(adaptive.level);
  const showDiffChange = adaptive.lastAdjust && Date.now() - adaptive.lastAdjustTime < 2000;
  const practiceAccuracy = practiceTotal > 0 ? Math.round((practiceCorrect / practiceTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-amber-950 to-slate-950 flex flex-col items-center">
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Word Builder</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* MENU */}
        {phase === "menu" && (
          <div className="text-center w-full">
            <div className="text-6xl mb-4">🔤</div>
            <h2 className="text-3xl font-bold text-white mb-2">Word Builder</h2>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Unscramble letters to build vocabulary words from science, math, geography, and more!
            </p>

            {/* Toggles */}
            <div className="max-w-xs mx-auto mb-3">
              <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
                <span className="text-xs text-slate-400">Always show hint</span>
                <input type="checkbox" checked={autoHint} onChange={(e) => setAutoHint(e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4" />
              </label>
            </div>

            {/* Practice mode toggle */}
            <div className="max-w-xs mx-auto mb-5">
              <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
                <div className="text-left">
                  <span className="text-xs text-slate-400">Practice mode</span>
                  <div className="text-[10px] text-slate-600">Extra hints at low levels, no timer, learn at your pace</div>
                </div>
                <input type="checkbox" checked={practiceMode} onChange={(e) => setPracticeMode(e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4" />
              </label>
            </div>

            <button onClick={startGame} className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/30">
              {practiceMode ? "Start Practice" : "Start"}
            </button>
            {highScore > 0 && !practiceMode && (
              <div className="mt-4 flex items-center justify-center gap-2 text-yellow-400 text-sm">
                <Trophy className="w-4 h-4" /> Best: {highScore}
              </div>
            )}
          </div>
        )}

        {/* COUNTDOWN */}
        {phase === "countdown" && (
          <div className="text-center py-20">
            <div className="text-8xl font-bold text-amber-400 animate-pulse">
              {countdown || "GO!"}
            </div>
            <p className="mt-4 text-slate-400">Get ready...</p>
          </div>
        )}

        {/* PLAYING / CORRECT */}
        {(phase === "playing" || phase === "correct") && wordData && (
          <div className="w-full space-y-6">
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
            {/* HUD */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Star className="w-4 h-4 text-amber-400" />
                {practiceMode ? (
                  <>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-medium text-xs">Practice</span>
                    <span className="text-xs tabular-nums">
                      {practiceCorrect}/{practiceTotal}
                      {practiceTotal > 0 && ` (${practiceAccuracy}%)`}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-white font-bold">{score}</span>
                    <span>· Word {level + 1}</span>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {!practiceMode && (
                  <button
                    onClick={() => setShowHint(true)}
                    disabled={showHint || phase === "correct"}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white disabled:opacity-30 transition-all"
                    title="Show hint (-5 pts)"
                  >
                    <Lightbulb className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleSkip}
                  disabled={(practiceMode ? false : skips <= 0) || phase === "correct"}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white disabled:opacity-30 transition-all text-xs flex items-center gap-1"
                >
                  <SkipForward className="w-3 h-3" /> {practiceMode ? "Skip" : skips}
                </button>
                {practiceMode && (
                  <button
                    onClick={endPractice}
                    className="px-2 py-1 rounded-lg bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 text-[10px] transition-colors"
                  >
                    End
                  </button>
                )}
              </div>
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

            {/* Category + Hint */}
            <div className="text-center">
              <span
                className="inline-block text-xs uppercase tracking-wider px-3 py-1 rounded-full font-medium mb-3"
                style={{ color: catColor, backgroundColor: `${catColor}20` }}
              >
                {wordData.category}
              </span>
              {showHint && (
                <p className="text-slate-400 text-sm italic">{wordData.hint}</p>
              )}
            </div>

            {/* Built word display */}
            <div className="flex justify-center gap-1.5">
              {wordData.word.split("").map((letter, i) => {
                const isRevealed = revealedHintLetters.includes(i) && i >= builtWord.length;
                return (
                  <div
                    key={i}
                    className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all duration-200 shadow-md ${
                      i < builtWord.length
                        ? phase === "correct"
                          ? "border-green-400 bg-green-500/25 text-green-400 shadow-green-500/20"
                          : "border-amber-400 bg-amber-500/25 text-white shadow-amber-500/20"
                        : isRevealed
                          ? "border-amber-300/40 bg-amber-500/10 text-amber-300/60 shadow-black/10"
                          : "border-white/20 bg-white/5 text-transparent shadow-black/10"
                    }`}
                  >
                    {i < builtWord.length ? builtWord[i] : isRevealed ? letter : "·"}
                  </div>
                );
              })}
            </div>

            {phase === "correct" && (
              <div className="text-center">
                <div className="text-green-400 font-bold text-lg">
                  {practiceMode ? "Correct!" : `Correct! +${showHint ? 5 : 10} pts`}
                </div>
                {/* Practice mode: Next button */}
                {practiceMode && practiceWaiting && (
                  <button
                    onClick={handlePracticeNext}
                    className="mt-3 px-8 py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
                  >
                    Next Word →
                  </button>
                )}
              </div>
            )}

            {/* Scrambled letters */}
            {phase === "playing" && (
              <>
                <div className="flex justify-center gap-2 flex-wrap">
                  {scrambled.map((letter, i) => (
                    <button
                      key={i}
                      onClick={() => handleLetterClick(i)}
                      disabled={selected.includes(i)}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl text-lg sm:text-xl font-bold transition-all duration-200 shadow-md ${
                        selected.includes(i)
                          ? "bg-white/5 border border-white/10 text-slate-600 scale-95 shadow-inner"
                          : "bg-white/10 border border-white/20 text-white hover:bg-amber-500/30 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95"
                      }`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>

                {/* Undo */}
                {selected.length > 0 && (
                  <div className="text-center">
                    <button
                      onClick={handleUndo}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      Undo last letter
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* GAME OVER (practice complete or future extension) */}
        {phase === "gameOver" && (
          <div className="w-full text-center space-y-4">
            <h3 className="text-2xl font-bold text-white">{practiceMode ? "Practice Complete" : "Game Over"}</h3>

            {practiceMode ? (
              <>
                <div className="grid grid-cols-2 gap-3 text-center max-w-xs mx-auto">
                  <div>
                    <div className="text-xl font-bold text-white">{level}</div>
                    <div className="text-[9px] text-slate-500 uppercase">Words Solved</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-400">{practiceAccuracy}%</div>
                    <div className="text-[9px] text-slate-500 uppercase">Accuracy</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-4xl font-bold text-amber-400">{score}</div>
            )}

            {/* Final difficulty level */}
            <div>
              <div className="text-sm text-slate-400 mb-1">Final Difficulty Level</div>
              <div className="text-lg font-bold" style={{ color: diffLabel.color }}>
                {diffLabel.emoji} {diffLabel.label}
              </div>
              <div className="text-xs text-slate-500">Lvl {Math.round(adaptive.level)} &middot; {getGradeForLevel(adaptive.level).label}</div>
            </div>

            <button onClick={startGame} className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/30">
              Play Again
            </button>
            <Link href="/games" className="block text-sm text-slate-400 hover:text-white transition-colors">
              Back to Games
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
