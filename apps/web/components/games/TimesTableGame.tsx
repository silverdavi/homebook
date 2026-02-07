"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Zap, Star, Check, X } from "lucide-react";
import { getLocalHighScore, setLocalHighScore } from "@/lib/games/use-scores";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import Link from "next/link";

type GamePhase = "menu" | "playing" | "feedback" | "complete";
type GameMode = "sprint" | "survival" | "target";

interface Problem {
  a: number;
  b: number;
  answer: number;
  choices: number[];
}

// ── Grid visualization for multiplication ──

function MultGrid({ a, b, highlight, color }: { a: number; b: number; highlight: boolean; color: string }) {
  const maxDots = 12;
  const rows = Math.min(a, maxDots);
  const cols = Math.min(b, maxDots);
  return (
    <div className="flex flex-col items-center gap-[2px]">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-[2px]">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="rounded-full transition-all duration-300"
              style={{
                width: Math.max(4, 28 / Math.max(rows, cols)),
                height: Math.max(4, 28 / Math.max(rows, cols)),
                backgroundColor: highlight ? color : `${color}44`,
                boxShadow: highlight ? `0 0 4px ${color}40` : "none",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Problem generation ──

function generateProblem(tables: number[], usedPairs: Set<string>): Problem {
  let a: number, b: number;
  let attempts = 0;
  do {
    a = tables[Math.floor(Math.random() * tables.length)];
    b = Math.floor(Math.random() * 12) + 1;
    attempts++;
  } while (usedPairs.has(`${a}x${b}`) && attempts < 50);
  usedPairs.add(`${a}x${b}`);

  const answer = a * b;

  // Smart distractors — common mistakes
  const wrongSet = new Set<number>();
  // Off by one table
  if (a > 1) wrongSet.add((a - 1) * b);
  wrongSet.add((a + 1) * b);
  // Off by one multiplier
  if (b > 1) wrongSet.add(a * (b - 1));
  wrongSet.add(a * (b + 1));
  // Random near answers
  while (wrongSet.size < 5) {
    const offset = Math.floor(Math.random() * a * 2) - a;
    const wrong = answer + (offset === 0 ? a : offset);
    if (wrong > 0 && wrong !== answer) wrongSet.add(wrong);
  }

  // Pick 3 wrong answers
  const wrongs = [...wrongSet].filter((w) => w !== answer).slice(0, 3);
  const choices = [...wrongs, answer].sort(() => Math.random() - 0.5);

  return { a, b, answer, choices };
}

// ── Mode configs ──

const MODES = {
  sprint: {
    label: "Speed Sprint",
    emoji: "⚡",
    description: "20 problems, fastest time wins",
    color: "#10b981",
    totalProblems: 20,
  },
  survival: {
    label: "Survival",
    emoji: "❤️",
    description: "3 lives, how far can you go?",
    color: "#ef4444",
    totalProblems: 999,
  },
  target: {
    label: "Target Score",
    emoji: "🎯",
    description: "Reach 500 points, combos help!",
    color: "#6366f1",
    totalProblems: 999,
  },
} as const;

const TABLE_GROUPS = [
  { label: "Easy (2-5)", tables: [2, 3, 4, 5], color: "#22c55e" },
  { label: "Medium (2-9)", tables: [2, 3, 4, 5, 6, 7, 8, 9], color: "#f59e0b" },
  { label: "Hard (2-12)", tables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], color: "#ef4444" },
  { label: "Tricky (6-12)", tables: [6, 7, 8, 9, 11, 12], color: "#a855f7" },
];

const TARGET_SCORE = 500;

export function TimesTableGame() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [mode, setMode] = useState<GameMode>("sprint");
  const [tables, setTables] = useState(TABLE_GROUPS[0].tables);
  const [tableIdx, setTableIdx] = useState(0);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [solved, setSolved] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [usedPairs] = useState(new Set<string>());
  const [highScore, setHighScore] = useState(() => getLocalHighScore("timesTable_highScore"));
  const startRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 250);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const nextProblem = useCallback(() => {
    setProblem(generateProblem(tables, usedPairs));
    setFeedback(null);
    setSelectedAnswer(null);
    setPhase("playing");
  }, [tables, usedPairs]);

  const finishGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("complete");
    const finalScore = mode === "sprint" ? Math.max(1, 1000 - elapsed * 5 - wrong * 50) : score;
    setScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      setLocalHighScore("timesTable_highScore", finalScore);
    }
  }, [mode, elapsed, wrong, score, highScore]);

  const handleAnswer = useCallback(
    (choice: number) => {
      if (phase !== "playing" || !problem) return;
      setSelectedAnswer(choice);

      if (choice === problem.answer) {
        const newStreak = streak + 1;
        const multiplier = 1 + Math.floor(newStreak / 5) * 0.5;
        const points = Math.round(10 * multiplier);
        setScore((s) => s + points);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        setSolved((s) => s + 1);
        setFeedback("correct");

        setTimeout(() => {
          const nextSolved = solved + 1;
          if (mode === "sprint" && nextSolved >= MODES.sprint.totalProblems) {
            finishGame();
          } else if (mode === "target" && score + points >= TARGET_SCORE) {
            finishGame();
          } else {
            nextProblem();
          }
        }, 600);
      } else {
        setStreak(0);
        setWrong((w) => w + 1);
        setFeedback("wrong");

        if (mode === "survival") {
          const newLives = lives - 1;
          setLives(newLives);
          if (newLives <= 0) {
            setTimeout(() => finishGame(), 800);
            return;
          }
        }

        setTimeout(() => {
          setFeedback(null);
          setSelectedAnswer(null);
        }, 800);
      }
    },
    [phase, problem, streak, solved, score, mode, lives, nextProblem, finishGame]
  );

  const startGame = useCallback((m: GameMode) => {
    setMode(m);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSolved(0);
    setWrong(0);
    setLives(3);
    setElapsed(0);
    usedPairs.clear();
    setTimeout(() => { startRef.current = Date.now(); }, 0);
    setProblem(generateProblem(tables, usedPairs));
    setFeedback(null);
    setSelectedAnswer(null);
    setPhase("playing");
  }, [tables, usedPairs]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const accuracy = solved + wrong > 0 ? Math.round((solved / (solved + wrong)) * 100) : 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-violet-950 to-slate-950 flex flex-col items-center">
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Times Tables</h1>
        <div className="w-16" />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* MENU */}
        {phase === "menu" && (
          <div className="w-full space-y-5 text-center">
            <div>
              <div className="text-5xl mb-2">✖️</div>
              <h2 className="text-3xl font-bold text-white mb-1">Times Tables</h2>
              <p className="text-slate-400 text-sm">Master multiplication with visual grids and smart drills</p>
            </div>

            {/* Table range picker */}
            <div className="space-y-2">
              <div className="text-xs text-slate-500 uppercase tracking-wider">Which tables?</div>
              <div className="grid grid-cols-2 gap-2">
                {TABLE_GROUPS.map((g, i) => (
                  <button
                    key={g.label}
                    onClick={() => { setTables(g.tables); setTableIdx(i); }}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${
                      tableIdx === i ? "border-white/20 bg-white/10 text-white" : "border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual toggle */}
            <label className="flex items-center justify-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input type="checkbox" checked={showGrid} onChange={() => setShowGrid(!showGrid)} className="rounded" />
              Show visual grid
            </label>

            {/* Mode picker */}
            <div className="space-y-2">
              <div className="text-xs text-slate-500 uppercase tracking-wider">Game mode</div>
              {(["sprint", "survival", "target"] as GameMode[]).map((m) => {
                const mc = MODES[m];
                return (
                  <button
                    key={m}
                    onClick={() => startGame(m)}
                    className="w-full py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-3 active:scale-[0.98]"
                  >
                    <span className="text-2xl">{mc.emoji}</span>
                    <div className="text-left flex-1">
                      <div className="text-white font-bold text-sm">{mc.label}</div>
                      <div className="text-slate-500 text-xs">{mc.description}</div>
                    </div>
                    <span className="text-slate-600">→</span>
                  </button>
                );
              })}
            </div>

            {highScore > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-yellow-400/70 text-xs">
                <Trophy className="w-3 h-3" /> Best: {highScore}
              </div>
            )}
          </div>
        )}

        {/* PLAYING */}
        {(phase === "playing" || phase === "feedback") && problem && (
          <div className="w-full space-y-4">
            {/* HUD */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                {mode === "survival" && (
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className={`text-lg transition-all ${i < lives ? "" : "opacity-20"}`}>❤️</span>
                    ))}
                  </div>
                )}
                {mode === "sprint" && (
                  <span className="text-slate-400 tabular-nums">{solved}/{MODES.sprint.totalProblems}</span>
                )}
                {mode === "target" && (
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(100, (score / TARGET_SCORE) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-slate-400">{score}/{TARGET_SCORE}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {streak >= 3 && (
                  <div className="flex items-center gap-1 text-yellow-400 animate-bounce">
                    <Zap className="w-3.5 h-3.5 fill-yellow-400" />
                    <span className="text-xs font-bold">x{streak}</span>
                  </div>
                )}
                <span className="text-white font-bold tabular-nums">{formatTime(elapsed)}</span>
              </div>
            </div>

            {/* Problem display */}
            <div className={`rounded-2xl border p-6 text-center transition-all duration-300 ${
              feedback === "correct" ? "border-green-400/30 bg-green-500/10" :
              feedback === "wrong" ? "border-red-400/30 bg-red-500/10" :
              "border-white/10 bg-white/5"
            }`}>
              {/* Visual grid */}
              {showGrid && (
                <div className="mb-4 flex justify-center">
                  <MultGrid a={problem.a} b={problem.b} highlight={feedback === "correct"} color={TABLE_GROUPS[tableIdx].color} />
                </div>
              )}

              <div className="text-4xl sm:text-5xl font-bold text-white mb-1">
                {problem.a} × {problem.b}
              </div>

              {feedback === "correct" && (
                <div className="flex items-center justify-center gap-1.5 text-green-400 text-lg font-bold mt-1">
                  <Check className="w-5 h-5" /> {problem.answer}
                </div>
              )}
              {feedback === "wrong" && (
                <div className="flex items-center justify-center gap-1.5 text-red-400 text-sm font-medium mt-1">
                  <X className="w-4 h-4" /> Answer: {problem.answer}
                </div>
              )}
            </div>

            {/* Choices */}
            <div className="grid grid-cols-2 gap-2.5">
              {problem.choices.map((choice, i) => {
                const isSelected = selectedAnswer === choice;
                const isCorrect = choice === problem.answer;
                const showResult = feedback !== null;
                return (
                  <button
                    key={`${choice}-${i}`}
                    onClick={() => handleAnswer(choice)}
                    disabled={feedback !== null}
                    className={`py-4 rounded-xl text-xl sm:text-2xl font-bold transition-all min-h-[56px] ${
                      showResult && isCorrect
                        ? "bg-green-500/20 border-2 border-green-400 text-green-400"
                        : showResult && isSelected && !isCorrect
                        ? "bg-red-500/20 border-2 border-red-400 text-red-400"
                        : showResult
                        ? "bg-white/5 border border-white/5 text-slate-600"
                        : "bg-white/10 border border-white/10 text-white hover:bg-violet-500/20 hover:border-violet-400/40 active:scale-95"
                    }`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>

            {/* Stats footer */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <span>{accuracy}% accuracy</span>
              <span>·</span>
              <span>{solved} correct</span>
              {wrong > 0 && <><span>·</span><span className="text-red-400/70">{wrong} wrong</span></>}
            </div>
          </div>
        )}

        {/* COMPLETE */}
        {phase === "complete" && (
          <div className="text-center space-y-4">
            <Star className="w-14 h-14 text-yellow-400 fill-yellow-400 mx-auto animate-bounce" />
            <h3 className="text-2xl font-bold text-white">
              {mode === "survival" && lives <= 0 ? "Game Over" : "Complete!"}
            </h3>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div><div className="text-2xl font-bold text-white">{solved}</div><div className="text-[10px] text-slate-500 uppercase">Solved</div></div>
              <div><div className="text-2xl font-bold text-green-400">{accuracy}%</div><div className="text-[10px] text-slate-500 uppercase">Accuracy</div></div>
              <div><div className="text-2xl font-bold text-cyan-400">{formatTime(elapsed)}</div><div className="text-[10px] text-slate-500 uppercase">Time</div></div>
            </div>

            {bestStreak >= 3 && (
              <p className="text-yellow-400/70 text-sm">Best streak: x{bestStreak}</p>
            )}

            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-sm font-medium flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" /> New High Score!
              </p>
            )}

            <ScoreSubmit game="times-table" score={score} level={tableIdx + 1} stats={{ mode, solved, accuracy: `${accuracy}%`, time: formatTime(elapsed) }} />

            <div className="flex gap-3 justify-center">
              <button onClick={() => startGame(mode)} className="px-6 py-3 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Again
              </button>
              <button onClick={() => setPhase("menu")} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all">
                Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
