"use client";

import { useCallback, useState } from "react";
import { ArrowLeft, Trophy, Lightbulb, SkipForward, Star } from "lucide-react";
import Link from "next/link";
import { SCIENCE_WORDS } from "@/lib/games/science-data";

type GamePhase = "menu" | "playing" | "correct" | "gameOver";

interface WordData {
  word: string;
  hint: string;
  category: string;
}

const WORDS: WordData[] = [
  // ── Chemistry, Physics, Biology (from science-data) ──
  ...SCIENCE_WORDS.map((w) => ({ word: w.word, hint: w.hint, category: w.category })),
  // Math
  { word: "RATIO", hint: "Comparison of two quantities", category: "Math" },
  { word: "PRIME", hint: "Divisible only by 1 and itself", category: "Math" },
  { word: "ANGLE", hint: "Space between two intersecting lines", category: "Math" },
  { word: "GRAPH", hint: "Visual display of data", category: "Math" },
  { word: "SLOPE", hint: "Steepness of a line", category: "Math" },
  { word: "DIGIT", hint: "Single number character", category: "Math" },
  { word: "MEDIAN", hint: "Middle value in a sorted list", category: "Math" },
  { word: "RADIUS", hint: "Distance from center to edge of circle", category: "Math" },
  { word: "FACTOR", hint: "Number that divides evenly", category: "Math" },
  // Geography
  { word: "DELTA", hint: "Land formed at a river mouth", category: "Geography" },
  { word: "BASIN", hint: "Low area drained by a river", category: "Geography" },
  { word: "RIDGE", hint: "Long narrow hilltop", category: "Geography" },
  { word: "FJORD", hint: "Narrow inlet between cliffs", category: "Geography" },
  { word: "TUNDRA", hint: "Cold treeless plain", category: "Geography" },
  { word: "CANYON", hint: "Deep narrow valley", category: "Geography" },
  { word: "GLACIER", hint: "Slow-moving river of ice", category: "Geography" },
  // History
  { word: "EPOCH", hint: "A period of time in history", category: "History" },
  { word: "REIGN", hint: "Period a monarch rules", category: "History" },
  { word: "SIEGE", hint: "Military blockade of a city", category: "History" },
  { word: "TREATY", hint: "Formal agreement between nations", category: "History" },
  { word: "EMPIRE", hint: "Group of territories under one ruler", category: "History" },
  { word: "COLONY", hint: "Settlement ruled by distant country", category: "History" },
  // Grammar
  { word: "NOUN", hint: "Person, place, or thing", category: "Grammar" },
  { word: "VERB", hint: "Action word", category: "Grammar" },
  { word: "CLAUSE", hint: "Group of words with subject and verb", category: "Grammar" },
  { word: "PREFIX", hint: "Letters added to start of a word", category: "Grammar" },
  { word: "SUFFIX", hint: "Letters added to end of a word", category: "Grammar" },
  { word: "SYNTAX", hint: "Rules for sentence structure", category: "Grammar" },
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

function pickWord(used: Set<number>): { data: WordData; index: number } {
  const available = WORDS.map((w, i) => ({ w, i })).filter(({ i }) => !used.has(i));
  const pool = available.length > 0 ? available : WORDS.map((w, i) => ({ w, i }));
  const pick = pool[Math.floor(Math.random() * pool.length)];
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
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [skips, setSkips] = useState(3);
  const [usedWords] = useState<Set<number>>(new Set());
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("wordBuilder_highScore");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const saveHighScore = useCallback((newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem("wordBuilder_highScore", newScore.toString());
    }
  }, [highScore]);

  const loadWord = useCallback(() => {
    const { data, index } = pickWord(usedWords);
    usedWords.add(index);
    setWordData(data);
    setScrambled(scramble(data.word).split(""));
    setSelected([]);
    setShowHint(false);
    setPhase("playing");
  }, [usedWords]);

  const handleLetterClick = useCallback(
    (scrambledIdx: number) => {
      if (phase !== "playing" || !wordData) return;
      if (selected.includes(scrambledIdx)) return;

      const newSelected = [...selected, scrambledIdx];
      setSelected(newSelected);

      const built = newSelected.map((i) => scrambled[i]).join("");

      const target = wordData.word;
      if (built === target) {
        const points = showHint ? 5 : 10;
        setScore((s) => {
          const ns = s + points;
          saveHighScore(ns);
          return ns;
        });
        setLevel((l) => l + 1);
        setPhase("correct");
        setTimeout(() => loadWord(), 1500);
      } else if (built.length === target.length && built !== target) {
        setTimeout(() => setSelected([]), 300);
      }
    },
    [phase, wordData, selected, scrambled, showHint, loadWord, saveHighScore]
  );

  const handleUndo = useCallback(() => {
    setSelected((prev) => prev.slice(0, -1));
  }, []);

  const handleSkip = useCallback(() => {
    if (skips <= 0) return;
    setSkips((s) => s - 1);
    loadWord();
  }, [skips, loadWord]);

  const startGame = () => {
    setScore(0);
    setLevel(0);
    setSkips(3);
    usedWords.clear();
    loadWord();
  };

  const builtWord = selected.map((i) => scrambled[i]).join("");
  const catColor = wordData ? CATEGORY_COLORS[wordData.category] || "#6366f1" : "#6366f1";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-amber-950 to-slate-950 flex flex-col items-center">
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Word Builder</h1>
        <div className="w-16" />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* MENU */}
        {phase === "menu" && (
          <div className="text-center">
            <div className="text-6xl mb-4">🔤</div>
            <h2 className="text-3xl font-bold text-white mb-2">Word Builder</h2>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">
              Unscramble letters to build vocabulary words from science, math, geography, and more!
            </p>
            <button onClick={startGame} className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/30">
              Start
            </button>
            {highScore > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 text-yellow-400 text-sm">
                <Trophy className="w-4 h-4" /> Best: {highScore}
              </div>
            )}
          </div>
        )}

        {/* PLAYING / CORRECT */}
        {(phase === "playing" || phase === "correct") && wordData && (
          <div className="w-full space-y-6">
            {/* HUD */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-white font-bold">{score}</span>
                <span>· Word {level + 1}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowHint(true)}
                  disabled={showHint || phase === "correct"}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white disabled:opacity-30 transition-all"
                  title="Show hint (-5 pts)"
                >
                  <Lightbulb className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSkip}
                  disabled={skips <= 0 || phase === "correct"}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white disabled:opacity-30 transition-all text-xs flex items-center gap-1"
                >
                  <SkipForward className="w-3 h-3" /> {skips}
                </button>
              </div>
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
              {wordData.word.split("").map((_, i) => (
                <div
                  key={i}
                  className={`w-11 h-12 rounded-lg border-2 flex items-center justify-center text-xl font-bold transition-all ${
                    i < builtWord.length
                      ? phase === "correct"
                        ? "border-green-400 bg-green-500/20 text-green-400"
                        : "border-amber-400 bg-amber-500/20 text-white"
                      : "border-white/20 bg-white/5 text-transparent"
                  }`}
                >
                  {i < builtWord.length ? builtWord[i] : "·"}
                </div>
              ))}
            </div>

            {phase === "correct" && (
              <div className="text-center text-green-400 font-bold text-lg">
                Correct! +{showHint ? 5 : 10} pts
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
                      className={`w-12 h-12 rounded-xl text-xl font-bold transition-all ${
                        selected.includes(i)
                          ? "bg-white/5 border border-white/5 text-slate-700 scale-90"
                          : "bg-white/10 border border-white/20 text-white hover:bg-amber-500/30 hover:border-amber-400/50 active:scale-90"
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
      </div>
    </div>
  );
}
