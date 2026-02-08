"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Share2, Calendar, Flame, Check, X } from "lucide-react";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { AchievementToast } from "@/components/games/AchievementToast";
import { sfxCorrect, sfxWrong, sfxGameOver, sfxAchievement, sfxCountdown, sfxCountdownGo } from "@/lib/games/audio";
import { trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import {
  getDailyChallenge,
  getDailyChallengeStreak,
  setDailyChallengeCompleted,
  isDailyChallengeCompleted,
  getDailyChallengeScore,
  getCompletedDates,
  getChallengeTypeLabel,
  getChallengeTypeEmoji,
  type DailyChallengeConfig,
  type MathChallenge,
  type FractionChallenge,
  type ElementChallenge,
  type VocabularyChallenge,
  type TimelineChallenge,
} from "@/lib/games/daily-challenge";
import Link from "next/link";

type GamePhase = "menu" | "countdown" | "playing" | "results";

const COUNTDOWN_SECS = 3;

const TIPS = [
  "Consistency beats intensity — play every day!",
  "Review wrong answers to learn from mistakes",
  "Each subject strengthens different thinking skills",
  "Daily practice builds long-term retention",
  "Challenge yourself with harder difficulty over time",
  "Share your results to motivate friends and family",
  "Streaks reward dedication — keep yours going!",
  "Focus on accuracy before speed",
  "Learning from explanations is just as valuable as getting it right",
  "Every challenge completed makes you a little smarter",
];

export function DailyChallengeGame() {
  useGameMusic();

  const [phase, setPhase] = useState<GamePhase>("menu");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [previousScore, setPreviousScore] = useState(0);
  const [achievementQueue, setAchievementQueue] = useState<Array<{ name: string; tier: "bronze" | "silver" | "gold" }>>([]);
  const [showAchievementIndex, setShowAchievementIndex] = useState(0);
  const [shareText, setShareText] = useState("");
  const [copied, setCopied] = useState(false);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [answerFeedback, setAnswerFeedback] = useState<"correct" | "wrong" | null>(null);
  const [tipIndex, setTipIndex] = useState(0);

  // Timeline-specific state
  const [timelineOrder, setTimelineOrder] = useState<number[]>([]);
  const [timelineSubmitted, setTimelineSubmitted] = useState(false);

  // Vocabulary-specific state
  const [vocabInput, setVocabInput] = useState("");
  const [vocabResults, setVocabResults] = useState<boolean[]>([]);

  const today = useMemo(() => new Date(), []);
  const config: DailyChallengeConfig = useMemo(() => getDailyChallenge(today), [today]);

  useEffect(() => {
    setAlreadyCompleted(isDailyChallengeCompleted(today));
    setPreviousScore(getDailyChallengeScore(today));
    setCompletedDates(getCompletedDates());
    setStreak(getDailyChallengeStreak());
  }, [today]);

  // Set total questions based on challenge type
  useEffect(() => {
    switch (config.challenge.type) {
      case "math":
        setTotalQuestions(config.challenge.problems.length);
        break;
      case "fraction":
        setTotalQuestions(config.challenge.pairs.length);
        break;
      case "element":
        setTotalQuestions(config.challenge.questions.length);
        break;
      case "vocabulary":
        setTotalQuestions(config.challenge.words.length);
        break;
      case "timeline":
        setTotalQuestions(1); // Timeline is one task
        break;
    }
  }, [config]);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      sfxCountdownGo();
      setPhase("playing");
      return;
    }
    sfxCountdown();
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Tip rotation
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 8000);
    return () => clearInterval(t);
  }, [phase]);

  // On results
  useEffect(() => {
    if (phase !== "results") return;
    sfxGameOver();
    setDailyChallengeCompleted(today, score);
    setAlreadyCompleted(true);
    setPreviousScore(score);
    setCompletedDates(getCompletedDates());
    setStreak(getDailyChallengeStreak());
    trackGamePlayed("daily-challenge", score);
    const profile = getProfile();
    const newOnes = checkAchievements(
      { gameId: "daily-challenge", score, accuracy: totalQuestions > 0 ? (score / totalQuestions) * 100 : 0 },
      profile.totalGamesPlayed,
      profile.gamesPlayedByGameId,
    );
    if (newOnes.length > 0) {
      sfxAchievement();
      setAchievementQueue(newOnes);
    }

    // Build share text
    const emoji = getChallengeTypeEmoji(config.challenge.type);
    const label = getChallengeTypeLabel(config.challenge.type);
    const dateStr = config.date;
    const currentStreak = getDailyChallengeStreak();
    setShareText(
      `${emoji} Daily Challenge ${dateStr}\n${label}: ${score}/${totalQuestions}\nStreak: ${currentStreak} day${currentStreak !== 1 ? "s" : ""}\nteacher.ninja/games/daily-challenge`,
    );
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const startGame = useCallback(() => {
    setScore(0);
    setCurrentIndex(0);
    setCountdown(COUNTDOWN_SECS);
    setAchievementQueue([]);
    setShowAchievementIndex(0);
    setAnswerFeedback(null);
    setTimelineOrder([]);
    setTimelineSubmitted(false);
    setVocabInput("");
    setVocabResults([]);
    setCopied(false);
    setPhase("countdown");
  }, []);

  const handleCorrect = useCallback(() => {
    sfxCorrect();
    setScore((s) => s + 1);
    setAnswerFeedback("correct");
    setTimeout(() => {
      setAnswerFeedback(null);
      setCurrentIndex((i) => {
        if (i + 1 >= totalQuestions) {
          setTimeout(() => setPhase("results"), 200);
        }
        return i + 1;
      });
    }, 500);
  }, [totalQuestions]);

  const handleWrong = useCallback(() => {
    sfxWrong();
    setAnswerFeedback("wrong");
    setTimeout(() => {
      setAnswerFeedback(null);
      setCurrentIndex((i) => {
        if (i + 1 >= totalQuestions) {
          setTimeout(() => setPhase("results"), 200);
        }
        return i + 1;
      });
    }, 500);
  }, [totalQuestions]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  }, [shareText]);

  // ── Calendar last 30 days ──
  const calendarDays = useMemo(() => {
    const days: Array<{ date: string; completed: boolean; isToday: boolean }> = [];
    const completedSet = new Set(completedDates);
    const todayStr = config.date;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({ date: ds, completed: completedSet.has(ds), isToday: ds === todayStr });
    }
    return days;
  }, [completedDates, config.date, today]);

  // ── Render helpers ──

  const renderMathQuestion = (challenge: MathChallenge) => {
    const problem = challenge.problems[currentIndex];
    if (!problem) return null;
    return (
      <div className="space-y-6">
        <div className="text-center text-sm text-slate-400">
          Question {currentIndex + 1} of {challenge.problems.length}
        </div>
        <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
          <div className="text-5xl font-bold text-white mb-2 tracking-wide">{problem.question}</div>
          <div className="text-lg text-slate-400">= ?</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {problem.choices.map((choice, i) => (
            <button
              key={`${choice}-${i}`}
              onClick={() => (choice === problem.answer ? handleCorrect() : handleWrong())}
              disabled={answerFeedback !== null}
              className="py-4 bg-white/10 hover:bg-amber-500/25 border border-white/10 hover:border-amber-400/40 rounded-xl text-xl font-bold text-white transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderFractionQuestion = (challenge: FractionChallenge) => {
    const pair = challenge.pairs[currentIndex];
    if (!pair) return null;
    return (
      <div className="space-y-6">
        <div className="text-center text-sm text-slate-400">
          Pair {currentIndex + 1} of {challenge.pairs.length} — Which is bigger?
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => (pair.answer === "left" ? handleCorrect() : handleWrong())}
            disabled={answerFeedback !== null}
            className="flex-1 max-w-[160px] py-8 bg-white/[0.06] hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/40 rounded-2xl text-3xl font-bold text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {pair.left}
          </button>
          <span className="text-2xl text-slate-500 font-bold">vs</span>
          <button
            onClick={() => (pair.answer === "right" ? handleCorrect() : handleWrong())}
            disabled={answerFeedback !== null}
            className="flex-1 max-w-[160px] py-8 bg-white/[0.06] hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/40 rounded-2xl text-3xl font-bold text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {pair.right}
          </button>
        </div>
        <button
          onClick={() => (pair.answer === "equal" ? handleCorrect() : handleWrong())}
          disabled={answerFeedback !== null}
          className="w-full py-3 bg-white/[0.04] hover:bg-amber-500/15 border border-white/10 hover:border-amber-400/30 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-all disabled:opacity-50"
        >
          They&apos;re equal
        </button>
      </div>
    );
  };

  const renderElementQuestion = (challenge: ElementChallenge) => {
    const q = challenge.questions[currentIndex];
    if (!q) return null;
    return (
      <div className="space-y-6">
        <div className="text-center text-sm text-slate-400">
          Element {currentIndex + 1} of {challenge.questions.length}
        </div>
        <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
          <div className="text-7xl font-bold text-amber-400 mb-2">{q.symbol}</div>
          <div className="text-lg text-slate-400">Name this element</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {q.choices.map((choice, i) => (
            <button
              key={`${choice}-${i}`}
              onClick={() => (choice === q.correctName ? handleCorrect() : handleWrong())}
              disabled={answerFeedback !== null}
              className="py-4 bg-white/10 hover:bg-amber-500/25 border border-white/10 hover:border-amber-400/40 rounded-xl text-base font-bold text-white transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderVocabularyQuestion = (challenge: VocabularyChallenge) => {
    const word = challenge.words[currentIndex];
    if (!word) return null;
    return (
      <div className="space-y-6">
        <div className="text-center text-sm text-slate-400">
          Word {currentIndex + 1} of {challenge.words.length}
        </div>
        <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
          <div className="text-4xl font-bold text-white mb-3 tracking-[0.3em]">{word.scrambled}</div>
          <div className="text-sm text-slate-400">Hint: {word.hint}</div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (answerFeedback !== null) return; // Prevent double-submission during feedback
            const guess = vocabInput.trim().toUpperCase();
            if (guess === word.answer) {
              handleCorrect();
            } else {
              handleWrong();
            }
            setVocabInput("");
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={vocabInput}
            onChange={(e) => setVocabInput(e.target.value)}
            placeholder="Type your answer..."
            autoFocus
            className="flex-1 px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white text-lg font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/25"
          />
          <button
            type="submit"
            disabled={!vocabInput.trim()}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-white font-bold rounded-xl transition-all"
          >
            Go
          </button>
        </form>
      </div>
    );
  };

  const renderTimelineChallenge = (challenge: TimelineChallenge) => {
    // Initialize order on first render
    if (timelineOrder.length === 0 && phase === "playing") {
      const initial = challenge.events.map((_, i) => i);
      // Fisher-Yates shuffle so the user must actually reorder
      for (let i = initial.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [initial[i], initial[j]] = [initial[j], initial[i]];
      }
      setTimelineOrder(initial);
      return null;
    }

    const moveUp = (idx: number) => {
      if (idx === 0 || timelineSubmitted) return;
      setTimelineOrder((prev) => {
        const next = [...prev];
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        return next;
      });
    };

    const moveDown = (idx: number) => {
      if (idx >= timelineOrder.length - 1 || timelineSubmitted) return;
      setTimelineOrder((prev) => {
        const next = [...prev];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        return next;
      });
    };

    const submitOrder = () => {
      setTimelineSubmitted(true);
      // Check if order matches correct chronological order
      const sorted = [...challenge.events]
        .map((e, i) => ({ ...e, origIdx: i }))
        .sort((a, b) => a.year - b.year);
      const correctOrder = sorted.map((e) => e.origIdx);
      const isCorrect = timelineOrder.every((v, i) => v === correctOrder[i]);
      if (isCorrect) {
        sfxCorrect();
        setScore(1);
      } else {
        sfxWrong();
      }
      setTimeout(() => setPhase("results"), 1500);
    };

    return (
      <div className="space-y-4">
        <div className="text-center text-sm text-slate-400">
          Drag events into chronological order (earliest first)
        </div>
        <div className="space-y-2">
          {timelineOrder.map((eventIdx, pos) => {
            const event = challenge.events[eventIdx];
            const isCorrectPosition = timelineSubmitted
              ? (() => {
                  const sorted = [...challenge.events]
                    .map((e, i) => ({ ...e, origIdx: i }))
                    .sort((a, b) => a.year - b.year);
                  return sorted[pos]?.origIdx === eventIdx;
                })()
              : null;
            return (
              <div
                key={eventIdx}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  timelineSubmitted
                    ? isCorrectPosition
                      ? "bg-green-500/15 border-green-400/30"
                      : "bg-red-500/15 border-red-400/30"
                    : "bg-white/[0.06] border-white/10"
                }`}
              >
                <span className="text-xs text-slate-500 w-5 text-center">{pos + 1}</span>
                <span className="flex-1 text-white text-sm font-medium">{event.name}</span>
                {timelineSubmitted && (
                  <span className="text-xs text-slate-400 tabular-nums">
                    {event.year < 0 ? `${Math.abs(event.year)} BC` : event.year}
                  </span>
                )}
                {!timelineSubmitted && (
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveUp(pos)}
                      disabled={pos === 0}
                      className="px-2 py-0.5 text-xs text-slate-400 hover:text-white hover:bg-white/10 rounded disabled:opacity-25 transition-all"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveDown(pos)}
                      disabled={pos >= timelineOrder.length - 1}
                      className="px-2 py-0.5 text-xs text-slate-400 hover:text-white hover:bg-white/10 rounded disabled:opacity-25 transition-all"
                    >
                      ▼
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {!timelineSubmitted && (
          <button
            onClick={submitOrder}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95"
          >
            Submit Order
          </button>
        )}
      </div>
    );
  };

  const renderChallenge = () => {
    switch (config.challenge.type) {
      case "math":
        return renderMathQuestion(config.challenge);
      case "fraction":
        return renderFractionQuestion(config.challenge);
      case "element":
        return renderElementQuestion(config.challenge);
      case "vocabulary":
        return renderVocabularyQuestion(config.challenge);
      case "timeline":
        return renderTimelineChallenge(config.challenge);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-amber-950/30 to-slate-950 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-lg px-4 pt-4 pb-2 flex items-center justify-between">
        <Link
          href="/games"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Games
        </Link>
        <h1 className="text-lg font-bold text-white">Daily Challenge</h1>
        <AudioToggles />
      </div>

      <div className="w-full max-w-lg px-4 flex-1 flex flex-col items-center justify-center">
        {/* MENU */}
        {phase === "menu" && (
          <div className="text-center w-full space-y-6">
            <div className="text-6xl mb-2">{getChallengeTypeEmoji(config.challenge.type)}</div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">Daily Challenge</h2>
              <p className="text-amber-400 font-medium">{getChallengeTypeLabel(config.challenge.type)}</p>
              <p className="text-slate-400 text-sm mt-2">{config.date}</p>
            </div>

            {/* Streak */}
            {streak > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/15 border border-orange-400/30 rounded-full">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-orange-300 font-bold">{streak} day streak!</span>
              </div>
            )}

            {alreadyCompleted ? (
              <div className="space-y-3">
                <div className="bg-green-500/15 border border-green-400/30 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-2 text-green-400 font-medium mb-1">
                    <Check className="w-5 h-5" />
                    Completed today!
                  </div>
                  <div className="text-2xl font-bold text-white">{previousScore}/{totalQuestions}</div>
                </div>
                <button
                  onClick={startGame}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all"
                >
                  Play Again
                </button>
              </div>
            ) : (
              <button
                onClick={startGame}
                className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/30"
              >
                Start Challenge
              </button>
            )}

            {/* Calendar */}
            <div className="mt-6">
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-3">
                <Calendar className="w-4 h-4" />
                Last 30 days
              </div>
              <div className="grid grid-cols-10 gap-1.5 max-w-[280px] mx-auto">
                {calendarDays.map((day) => (
                  <div
                    key={day.date}
                    title={day.date}
                    className={`w-5 h-5 rounded-sm transition-all ${
                      day.completed
                        ? "bg-amber-400"
                        : day.isToday
                        ? "bg-white/20 ring-1 ring-amber-400/50"
                        : "bg-white/[0.06]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COUNTDOWN */}
        {phase === "countdown" && (
          <div className="text-center">
            <div className="text-8xl font-bold text-amber-400 animate-pulse">
              {countdown || "GO!"}
            </div>
          </div>
        )}

        {/* PLAYING */}
        {phase === "playing" && (
          <div className="w-full">
            {/* Answer feedback flash */}
            {answerFeedback && (
              <div
                className={`fixed inset-0 pointer-events-none z-50 ${
                  answerFeedback === "correct" ? "bg-green-500/10" : "bg-red-500/15"
                }`}
              />
            )}
            {/* Progress */}
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-slate-400">
                Score: <span className="text-white font-bold">{score}</span>
              </span>
              {config.challenge.type !== "timeline" && (
                <span className="text-slate-400">
                  {currentIndex + 1} / {totalQuestions}
                </span>
              )}
            </div>
            {/* Progress bar */}
            {config.challenge.type !== "timeline" && (
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex) / totalQuestions) * 100}%` }}
                />
              </div>
            )}
            {renderChallenge()}

            <div className="text-center mt-3">
              <span className="text-[10px] text-slate-500 italic">{TIPS[tipIndex]}</span>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {phase === "results" && (
          <div className="text-center w-full space-y-5">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto" />
            <div>
              <h3 className="text-3xl font-bold text-white mb-2">Challenge Complete!</h3>
              <div className="text-5xl font-bold text-amber-400 mb-1">{score}/{totalQuestions}</div>
              {previousScore > 0 && score > previousScore && (
                <p className="text-green-400 text-sm font-medium">Beat your previous score of {previousScore}!</p>
              )}
            </div>

            {/* Streak */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/15 border border-orange-400/30 rounded-full">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-orange-300 font-bold">{streak} day streak</span>
            </div>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all"
            >
              <Share2 className="w-4 h-4" />
              {copied ? "Copied!" : "Share Result"}
            </button>

            {/* Achievements */}
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

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={startGame}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Play Again
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
  );
}
