"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Check, X, Heart } from "lucide-react";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, HeartRecovery, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxGameOver, sfxAchievement, sfxHeart, sfxCountdownGo } from "@/lib/games/audio";
import Link from "next/link";

type GamePhase = "menu" | "countdown" | "playing" | "feedback" | "complete";
type ChallengeType = "identify" | "compare" | "add" | "equivalent";

interface Challenge {
  type: ChallengeType;
  question: string;
  visual: { n: number; d: number }[];
  choices: string[];
  answer: string;
  explanation: string;
}

// ── Visual fraction bar ──

function FractionBar({
  n,
  d,
  color,
  width = "100%",
  height = 32,
  showLabel = true,
  animate = false,
}: {
  n: number;
  d: number;
  color: string;
  width?: string | number;
  height?: number;
  showLabel?: boolean;
  animate?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1" style={{ width }}>
      <div
        className="w-full rounded-lg overflow-hidden border border-white/20 relative"
        style={{ height }}
      >
        {/* Divisions */}
        {Array.from({ length: d }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{
              left: `${(i / d) * 100}%`,
              width: `${(1 / d) * 100}%`,
              borderRight: i < d - 1 ? "1px solid rgba(255,255,255,0.15)" : "none",
            }}
          >
            <div
              className={`h-full ${animate ? "transition-all duration-500" : ""}`}
              style={{
                backgroundColor: i < n ? color : "rgba(255,255,255,0.05)",
                opacity: i < n ? 0.8 : 1,
              }}
            />
          </div>
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-slate-400 tabular-nums">
          {n}/{d}
        </span>
      )}
    </div>
  );
}

// ── Pie fraction visual ──

function FractionPie({ n, d, color, size = 80 }: { n: number; d: number; color: string; size?: number }) {
  const sliceAngle = 360 / d;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        {Array.from({ length: d }).map((_, i) => {
          const startAngle = (i * sliceAngle - 90) * (Math.PI / 180);
          const endAngle = ((i + 1) * sliceAngle - 90) * (Math.PI / 180);
          const x1 = 50 + 48 * Math.cos(startAngle);
          const y1 = 50 + 48 * Math.sin(startAngle);
          const x2 = 50 + 48 * Math.cos(endAngle);
          const y2 = 50 + 48 * Math.sin(endAngle);
          const largeArc = sliceAngle > 180 ? 1 : 0;
          return (
            <g key={i}>
              <path
                d={`M 50 50 L ${x1} ${y1} A 48 48 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={i < n ? color : "rgba(255,255,255,0.05)"}
                opacity={i < n ? 0.8 : 1}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="0.5"
              />
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white/80">{n}/{d}</span>
      </div>
    </div>
  );
}

// ── Challenge generators ──

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

function genIdentify(level: number): Challenge {
  const maxD = Math.min(3 + level, 12);
  const d = Math.floor(Math.random() * (maxD - 1)) + 2;
  const n = Math.floor(Math.random() * d) + 1;

  const wrongs: string[] = [];
  while (wrongs.length < 3) {
    const wn = Math.floor(Math.random() * d) + 1;
    const wd = d + (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.5 ? 1 : 0);
    const s = `${wn}/${Math.max(2, wd)}`;
    if (s !== `${n}/${d}` && !wrongs.includes(s)) wrongs.push(s);
  }

  return {
    type: "identify",
    question: "What fraction is shown?",
    visual: [{ n, d }],
    choices: [...wrongs, `${n}/${d}`].sort(() => Math.random() - 0.5),
    answer: `${n}/${d}`,
    explanation: `${n} out of ${d} parts are filled = ${n}/${d}`,
  };
}

function genCompare(level: number): Challenge {
  const maxD = Math.min(4 + level, 12);
  const d1 = Math.floor(Math.random() * (maxD - 2)) + 2;
  const d2 = Math.floor(Math.random() * (maxD - 2)) + 2;
  const n1 = Math.floor(Math.random() * (d1 - 1)) + 1;
  const n2 = Math.floor(Math.random() * (d2 - 1)) + 1;
  const v1 = n1 / d1;
  const v2 = n2 / d2;

  if (Math.abs(v1 - v2) < 0.01) return genCompare(level);

  const answer = v1 > v2 ? `${n1}/${d1}` : `${n2}/${d2}`;

  return {
    type: "compare",
    question: "Which fraction is larger?",
    visual: [{ n: n1, d: d1 }, { n: n2, d: d2 }],
    choices: [`${n1}/${d1}`, `${n2}/${d2}`, "Equal"],
    answer,
    explanation: `${n1}/${d1} = ${(v1).toFixed(3)}, ${n2}/${d2} = ${(v2).toFixed(3)}`,
  };
}

function genAdd(level: number): Challenge {
  const d = Math.min(2 + Math.floor(level / 2), 10);
  const n1 = Math.floor(Math.random() * (d - 1)) + 1;
  const n2 = Math.floor(Math.random() * (d - n1)) + 1;
  const sum = n1 + n2;
  const g = gcd(sum, d);
  const simplified = `${sum / g}/${d / g}`;
  const unsimplified = `${sum}/${d}`;
  const answer = sum === d ? "1" : sum / g === sum && d / g === d ? unsimplified : simplified;

  const wrongs: string[] = [];
  while (wrongs.length < 3) {
    const wn = Math.floor(Math.random() * d) + 1;
    const wd = d + (Math.random() > 0.5 ? 1 : 0);
    const s = wn === wd ? "1" : `${wn}/${wd}`;
    if (s !== answer && !wrongs.includes(s)) wrongs.push(s);
  }

  return {
    type: "add",
    question: `${n1}/${d} + ${n2}/${d} = ?`,
    visual: [{ n: n1, d }, { n: n2, d }],
    choices: [...wrongs, answer].sort(() => Math.random() - 0.5),
    answer,
    explanation: `${n1}/${d} + ${n2}/${d} = ${sum}/${d}${sum !== d && g > 1 ? ` = ${simplified}` : ""}`,
  };
}

function genEquivalent(level: number): Challenge {
  const d = Math.min(2 + level, 8);
  const n = Math.floor(Math.random() * (d - 1)) + 1;
  const mult = Math.floor(Math.random() * 3) + 2;
  const eqN = n * mult;
  const eqD = d * mult;

  const wrongs: string[] = [];
  while (wrongs.length < 3) {
    const wm = Math.floor(Math.random() * 4) + 2;
    const wn = n * wm + (Math.random() > 0.5 ? 1 : -1);
    const wd = d * wm;
    const s = `${Math.max(1, wn)}/${wd}`;
    if (s !== `${eqN}/${eqD}` && !wrongs.includes(s)) wrongs.push(s);
  }

  return {
    type: "equivalent",
    question: `Which fraction equals ${n}/${d}?`,
    visual: [{ n, d }],
    choices: [...wrongs, `${eqN}/${eqD}`].sort(() => Math.random() - 0.5),
    answer: `${eqN}/${eqD}`,
    explanation: `${n}/${d} × ${mult}/${mult} = ${eqN}/${eqD}`,
  };
}

function generateChallenge(level: number, types: ChallengeType[]): Challenge {
  const type = types[Math.floor(Math.random() * types.length)];
  switch (type) {
    case "identify": return genIdentify(level);
    case "compare": return genCompare(level);
    case "add": return genAdd(level);
    case "equivalent": return genEquivalent(level);
  }
}

const CHALLENGE_SETS = [
  { label: "Identify", emoji: "👀", types: ["identify"] as ChallengeType[], color: "#22c55e" },
  { label: "Compare", emoji: "⚖️", types: ["compare"] as ChallengeType[], color: "#3b82f6" },
  { label: "Add", emoji: "➕", types: ["add"] as ChallengeType[], color: "#f59e0b" },
  { label: "Equivalent", emoji: "🔄", types: ["equivalent"] as ChallengeType[], color: "#a855f7" },
  { label: "Mixed", emoji: "🎲", types: ["identify", "compare", "add", "equivalent"] as ChallengeType[], color: "#ef4444" },
];

const FRACTION_TIPS: Record<ChallengeType, string[]> = {
  identify: [
    "The numerator is the top number — it tells you how many parts you have.",
    "The denominator is the bottom number — it tells how many equal parts make a whole.",
    "A fraction bar shows parts of a whole visually.",
    "3/4 means 3 out of 4 equal parts.",
  ],
  compare: [
    "To compare fractions with the same denominator, just compare the numerators.",
    "Cross-multiply to compare: a/b vs c/d → compare a×d with b×c.",
    "A bigger denominator means smaller pieces (if numerators are the same).",
    "Convert to the same denominator to compare fractions easily.",
  ],
  add: [
    "You can only add fractions that have the same denominator.",
    "Find the Least Common Denominator (LCD) before adding fractions.",
    "When adding fractions: add the numerators, keep the denominator.",
    "Always simplify your answer by dividing by the GCD.",
  ],
  equivalent: [
    "Multiply both numerator and denominator by the same number to get an equivalent fraction.",
    "1/2 = 2/4 = 3/6 = 4/8 — all equivalent!",
    "Dividing both parts by their GCD gives the simplest form.",
    "Equivalent fractions represent the same point on a number line.",
  ],
};

const LIVES = 5;

export function FractionLabGame() {
  useGameMusic();
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [solved, setSolved] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showHeartRecovery, setShowHeartRecovery] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [challengeTypes, setChallengeTypes] = useState<ChallengeType[]>(["identify"]);
  const [setIdx, setSetIdx] = useState(0);
  const [usePie, setUsePie] = useState(false);
  const [highScore, setHighScore] = useState(() => getLocalHighScore("fractionLab_highScore"));
  const [achievementQueue, setAchievementQueue] = useState<Array<{ name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [pendingStart, setPendingStart] = useState<{ types: ChallengeType[]; idx: number } | null>(null);

  useEffect(() => {
    if (challenge) setTipIdx(Math.floor(Math.random() * 100));
  }, [challenge]);

  useEffect(() => {
    if (phase !== "complete") return;
    trackGamePlayed("fraction-lab", score);
    const profile = getProfile();
    const newOnes = checkAchievements(
      { gameId: "fraction-lab", score, level, solved, bestStreak, accuracy: solved + wrong > 0 ? Math.round((solved / (solved + wrong)) * 100) : 100 },
      profile.totalGamesPlayed,
      profile.gamesPlayedByGameId
    );
    if (newOnes.length > 0) { sfxAchievement(); setAchievementQueue(newOnes); }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps -- run once on complete

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (pendingStart) {
            setChallengeTypes(pendingStart.types);
            setSetIdx(pendingStart.idx);
            setScore(0);
            setLives(LIVES);
            setSolved(0);
            setWrong(0);
            setStreak(0);
            setBestStreak(0);
            setShowHeartRecovery(false);
            setLevel(1);
            setAchievementQueue([]);
            setShowAchievementIndex(0);
            setChallenge(generateChallenge(1, pendingStart.types));
            setFeedback(null);
            setSelectedAnswer(null);
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

  const nextChallenge = useCallback((currentSolved: number) => {
    const lvl = Math.floor(currentSolved / 3) + 1;
    setLevel(lvl);
    setChallenge(generateChallenge(lvl, challengeTypes));
    setFeedback(null);
    setSelectedAnswer(null);
    setPhase("playing");
  }, [challengeTypes]);

  const handleAnswer = useCallback(
    (choice: string) => {
      if (phase !== "playing" || !challenge) return;
      setSelectedAnswer(choice);

      if (choice === challenge.answer) {
        sfxCorrect();
        const newStreak = streak + 1;
        const { mult } = getMultiplierFromStreak(newStreak);
        const points = Math.round(10 * mult);
        setScore((s) => s + points);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        const newSolved = solved + 1;
        setSolved(newSolved);
        if (newStreak >= 10 && newStreak % 10 === 0 && lives < LIVES) {
          sfxHeart();
          setShowHeartRecovery(true);
          setTimeout(() => setShowHeartRecovery(false), 1500);
          setLives((l) => Math.min(LIVES, l + 1));
        }
        setFeedback("correct");
        setTimeout(() => nextChallenge(newSolved), 1200);
      } else {
        sfxWrong();
        setStreak(0);
        setWrong((w) => w + 1);
        setFeedback("wrong");
        const nl = lives - 1;
        setLives(nl);
        if (nl <= 0) {
          sfxGameOver();
          setTimeout(() => {
            setPhase("complete");
            setScore((s) => {
              if (s > highScore) { setHighScore(s); setLocalHighScore("fractionLab_highScore", s); }
              return s;
            });
          }, 1500);
        } else {
          setTimeout(() => { setFeedback(null); setSelectedAnswer(null); }, 1000);
        }
      }
    },
    [phase, challenge, lives, highScore, streak, solved, nextChallenge]
  );

  const startGame = (types: ChallengeType[], idx: number) => {
    setPendingStart({ types, idx });
    setCountdown(3);
    setPhase("countdown");
  };

  const accuracy = solved + wrong > 0 ? Math.round((solved / (solved + wrong)) * 100) : 100;
  const currentColor = CHALLENGE_SETS[setIdx].color;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-orange-950/30 to-slate-950 flex flex-col items-center">
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Games
        </Link>
        <h1 className="text-lg font-bold text-white">Fraction Lab</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* MENU */}
        {phase === "menu" && (
          <div className="w-full space-y-5 text-center">
            <div>
              <div className="text-5xl mb-2">🧪</div>
              <h2 className="text-3xl font-bold text-white mb-1">Fraction Lab</h2>
              <p className="text-slate-400 text-sm">See, compare, and calculate fractions visually</p>
            </div>

            {/* Visual style toggle */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setUsePie(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!usePie ? "bg-white/10 text-white border border-white/20" : "text-slate-400 hover:text-white"}`}
              >
                📊 Bars
              </button>
              <button
                onClick={() => setUsePie(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${usePie ? "bg-white/10 text-white border border-white/20" : "text-slate-400 hover:text-white"}`}
              >
                🥧 Pies
              </button>
            </div>

            <div className="space-y-2">
              {CHALLENGE_SETS.map((cs, i) => (
                <button
                  key={cs.label}
                  onClick={() => startGame(cs.types, i)}
                  className="w-full py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-3 active:scale-[0.98]"
                >
                  <span className="text-2xl">{cs.emoji}</span>
                  <div className="text-left flex-1">
                    <div className="text-white font-bold text-sm">{cs.label}</div>
                  </div>
                  <span className="text-slate-600">→</span>
                </button>
              ))}
            </div>

            {highScore > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-yellow-400/70 text-xs">
                <Trophy className="w-3 h-3" /> Best: {highScore}
              </div>
            )}
          </div>
        )}

        {/* COUNTDOWN */}
        {phase === "countdown" && (
          <div className="text-center py-20">
            <div className="text-8xl font-bold text-orange-400 animate-pulse">
              {countdown || "GO!"}
            </div>
            <p className="mt-4 text-slate-400">Get ready...</p>
          </div>
        )}

        {/* PLAYING */}
        {(phase === "playing" || phase === "feedback") && challenge && (
          <div className="w-full space-y-5">
            {/* HUD */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: LIVES }).map((_, i) => (
                    <Heart key={i} className={`w-4 h-4 transition-all ${i < lives ? "text-red-400 fill-red-400" : "text-slate-800 scale-75"}`} />
                  ))}
                </div>
                <StreakBadge streak={streak} />
              </div>
              <div className="text-white font-bold tabular-nums">{score}</div>
            </div>
            <HeartRecovery show={showHeartRecovery} />
            <div className="text-xs text-slate-500 text-center -mt-2">Lvl {level} · {solved} solved</div>

            {/* Educational tip */}
            {!feedback && (
              <div className="text-center text-[11px] text-slate-500 italic px-4">
                💡 {FRACTION_TIPS[challenge.type][tipIdx % FRACTION_TIPS[challenge.type].length]}
              </div>
            )}

            {/* Question */}
            <div className="text-center text-white text-lg font-semibold drop-shadow-sm">
              {challenge.question}
            </div>

            {/* Visual */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {challenge.visual.map((v, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  {usePie ? (
                    <FractionPie n={v.n} d={v.d} color={currentColor} size={90} />
                  ) : (
                    <FractionBar n={v.n} d={v.d} color={currentColor} width={180} height={36} animate />
                  )}
                  {challenge.type === "add" && i < challenge.visual.length - 1 && (
                    <span className="text-2xl text-white font-bold mt-2">+</span>
                  )}
                </div>
              ))}
            </div>

            {/* Explanation on feedback */}
            {feedback && (
              <div className={`text-center text-sm font-medium ${feedback === "correct" ? "text-green-400" : "text-red-400"}`}>
                {feedback === "correct" ? (
                  <span className="flex items-center justify-center gap-1"><Check className="w-4 h-4" /> Correct!</span>
                ) : (
                  <span className="flex flex-col items-center gap-0.5">
                    <span className="flex items-center gap-1"><X className="w-4 h-4" /> {challenge.explanation}</span>
                  </span>
                )}
              </div>
            )}

            {/* Choices */}
            <div className="grid grid-cols-2 gap-2.5">
              {challenge.choices.map((choice, i) => {
                const isSelected = selectedAnswer === choice;
                const isCorrect = choice === challenge.answer;
                const showResult = feedback !== null;
                return (
                  <button
                    key={`${choice}-${i}`}
                    onClick={() => handleAnswer(choice)}
                    disabled={feedback !== null}
                    className={`py-4 rounded-xl text-lg sm:text-xl font-bold transition-all duration-200 min-h-[52px] shadow-md ${
                      showResult && isCorrect
                        ? "bg-green-500/20 border-2 border-green-400 text-green-400 shadow-green-500/20"
                        : showResult && isSelected && !isCorrect
                        ? "bg-red-500/20 border-2 border-red-400 text-red-400 shadow-red-500/20"
                        : showResult
                        ? "bg-white/5 border border-white/5 text-slate-600"
                        : "bg-white/10 border border-white/10 text-white hover:bg-orange-500/20 hover:border-orange-400/40 hover:shadow-lg hover:shadow-orange-500/20 active:scale-95"
                    }`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* COMPLETE */}
        {phase === "complete" && (
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-white">Game Over</h3>
            <div className="text-4xl font-bold text-orange-400">{score}</div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div><div className="text-xl font-bold text-white">{solved}</div><div className="text-[10px] text-slate-500 uppercase">Solved</div></div>
              <div><div className="text-xl font-bold text-green-400">{accuracy}%</div><div className="text-[10px] text-slate-500 uppercase">Accuracy</div></div>
              <div><div className="text-xl font-bold text-cyan-400">{level}</div><div className="text-[10px] text-slate-500 uppercase">Level</div></div>
            </div>

            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 text-sm font-medium flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" /> New High Score!
              </p>
            )}

            <ScoreSubmit game="fraction-lab" score={score} level={level} stats={{ solved, accuracy: `${accuracy}%` }} />

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
              <button onClick={() => startGame(challengeTypes, setIdx)} className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
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
