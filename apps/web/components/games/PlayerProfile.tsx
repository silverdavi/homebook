"use client";

import { useState, useEffect } from "react";
import {
  Medal,
  X,
  User,
  Gamepad2,
  Star,
  Copy,
  Check,
  RefreshCw,
  CloudUpload,
  LogIn,
} from "lucide-react";
import {
  getProfile,
  getSavedName,
  saveName,
  getLocalHighScore,
} from "@/lib/games/use-scores";
import {
  getAchievements,
  MEDALS,
  getMedalDef,
  type MedalTier,
} from "@/lib/games/achievements";
import { useProfile } from "@/lib/games/profile-context";

const GAME_LABELS: Record<string, string> = {
  "letter-rain": "Letter Rain",
  "word-builder": "Word Builder",
  "math-blitz": "Math Blitz",
  "fraction-fighter": "Fraction Fighter",
  "times-table": "Times Table",
  "fraction-lab": "Fraction Lab",
  "decimal-dash": "Decimal Dash",
  "graph-plotter": "Graph Plotter",
  "element-match": "Element Match",
  "equation-balancer": "Equation Balancer",
  "genetics-lab": "Genetics Lab",
  "unit-converter": "Unit Converter",
  "science-study": "Science Study",
  "geography": "Geography Challenge",
  "timeline-dash": "Timeline Dash",
  "maze-runner": "Maze Runner",
  "trace-learn": "Trace & Learn",
  "color-lab": "Color Lab",
  "connect-dots": "Connect Dots",
  "scratch-reveal": "Scratch & Reveal",
  sudoku: "Sudoku",
  crossword: "Crossword",
  "word-search": "Word Search",
  "trivia-quiz": "Trivia Quiz",
  nonogram: "Nonogram",
  "number-puzzle": "Number Puzzle",
};

const HIGH_SCORE_KEYS: Record<string, string> = {
  "letter-rain": "letterRain_highScore",
  "word-builder": "wordBuilder_highScore",
  "math-blitz": "mathBlitz_highScore",
  "fraction-fighter": "fractionFighter_highScore",
  "times-table": "timesTable_highScore",
  "fraction-lab": "fractionLab_highScore",
  "decimal-dash": "decimalDash_highScore",
  "graph-plotter": "graphPlotter_highScore",
  "element-match": "elementMatch_highScore",
  "equation-balancer": "equationBalancer_highScore",
  "genetics-lab": "geneticsLab_highScore",
  "unit-converter": "unitConverter_highScore",
  "science-study": "scienceStudy_highScore",
  "geography": "geography_highScore",
  "timeline-dash": "timelineDash_highScore",
  "maze-runner": "mazeRunner_highScore",
  "trace-learn": "traceLearn_highScore",
  "color-lab": "colorLab_highScore",
  "connect-dots": "connectDots_highScore",
  "scratch-reveal": "scratchReveal_highScore",
  sudoku: "sudoku_highScore",
  crossword: "crossword",
  "word-search": "wordSearch_highScore",
  "trivia-quiz": "trivia-quiz",
  nonogram: "nonogram_highScore",
  "number-puzzle": "numberPuzzle_highScore",
};

const TIER_COLORS: Record<MedalTier, string> = {
  bronze: "from-amber-600 to-amber-800 border-amber-500/50",
  silver: "from-slate-400 to-slate-600 border-slate-300/50",
  gold: "from-yellow-500 to-yellow-700 border-yellow-400/50",
};

interface PlayerProfileProps {
  open: boolean;
  onClose: () => void;
}

export function PlayerProfile({ open, onClose }: PlayerProfileProps) {
  const [localProfile, setLocalProfile] = useState(getProfile());
  const [localAchievements, setLocalAchievements] = useState(getAchievements());
  const [name, setName] = useState(getSavedName());
  const [codeCopied, setCodeCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const {
    profile: serverProfile,
    isLoggedIn,
    syncLocalStorage,
    refreshProfile,
    getHighScore: getServerHighScore,
  } = useProfile();

  useEffect(() => {
    if (open) {
      setLocalProfile(getProfile());
      setLocalAchievements(getAchievements());
      setName(getSavedName());
      setCodeCopied(false);
      setSyncing(false);
      setSyncDone(false);
    }
  }, [open]);

  const handleNameBlur = () => {
    const trimmed = name.trim().slice(0, 32);
    setName(trimmed);
    saveName(trimmed);
  };

  const handleCopyCode = async () => {
    if (!serverProfile?.accessCode) return;
    try {
      await navigator.clipboard.writeText(serverProfile.accessCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncDone(false);
    await syncLocalStorage();
    await refreshProfile();
    setSyncing(false);
    setSyncDone(true);
    setTimeout(() => setSyncDone(false), 2000);
  };

  /** Get best score for a game: max of local and server */
  const getBestScore = (gameId: string): number => {
    const key = HIGH_SCORE_KEYS[gameId];
    const local = key ? getLocalHighScore(key) : 0;
    if (!isLoggedIn) return local;
    const server = getServerHighScore(gameId);
    return Math.max(local, server);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900/95 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {isLoggedIn && serverProfile ? (
              <div
                className="w-6 h-6 rounded-full shrink-0"
                style={{ backgroundColor: serverProfile.avatarColor }}
              />
            ) : (
              <User className="w-5 h-5 text-indigo-400" />
            )}
            {isLoggedIn && serverProfile
              ? serverProfile.name
              : "Player Profile"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Banner for non-logged-in users */}
          {!isLoggedIn && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-3">
              <LogIn className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <p className="text-sm text-indigo-300 font-medium">
                  Save your progress!
                </p>
                <p className="text-xs text-indigo-400/70">
                  Create a profile to keep your scores and achievements across
                  devices.
                </p>
              </div>
            </div>
          )}

          {/* Logged-in: Access code + sync */}
          {isLoggedIn && serverProfile && (
            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-0.5">
                    Access Code
                  </div>
                  <div className="text-lg font-mono font-bold text-white tracking-[0.2em]">
                    {serverProfile.accessCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Copy access code"
                >
                  {codeCopied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white disabled:opacity-50 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {syncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : syncDone ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <CloudUpload className="w-4 h-4" />
                )}
                {syncing
                  ? "Syncing..."
                  : syncDone
                    ? "Synced!"
                    : "Sync Progress to Cloud"}
              </button>
            </div>
          )}

          {/* Name (only for non-logged-in users — logged-in users see their name in the header) */}
          {!isLoggedIn && (
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                maxLength={32}
              />
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
              <Gamepad2 className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-white tabular-nums">
                {localProfile.totalGamesPlayed}
              </div>
              <div className="text-[10px] text-slate-500 uppercase">
                Games played
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
              <Star className="w-6 h-6 text-yellow-400/80 mx-auto mb-1" />
              <div className="text-2xl font-bold text-white tabular-nums">
                {localProfile.totalScore.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 uppercase">
                Total score
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
              <Medal className="w-6 h-6 text-amber-400/80 mx-auto mb-1" />
              <div className="text-2xl font-bold text-white tabular-nums">
                {Object.keys(localAchievements).length}
              </div>
              <div className="text-[10px] text-slate-500 uppercase">
                Medals
              </div>
            </div>
          </div>

          {/* Medal grid */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Medal className="w-4 h-4 text-amber-400" />
              Medals
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {MEDALS.map((medal) => {
                const tier = localAchievements[medal.id];
                const def = getMedalDef(medal.id);
                return (
                  <div
                    key={medal.id}
                    className={`rounded-xl border p-3 text-center transition-all ${
                      tier
                        ? `bg-gradient-to-b ${TIER_COLORS[tier]} border-opacity-50 text-white`
                        : "bg-white/[0.03] border-white/5 text-slate-600"
                    }`}
                    title={
                      def
                        ? `${def.name}: ${tier ? def[tier].requirement : "Locked"}`
                        : medal.name
                    }
                  >
                    <Medal
                      className={`w-6 h-6 mx-auto mb-0.5 ${tier ? "opacity-100" : "opacity-30"}`}
                    />
                    <div className="text-[10px] font-medium truncate">
                      {medal.name}
                    </div>
                    {tier && (
                      <div className="text-[9px] uppercase opacity-90">
                        {tier}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-game best scores */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3">Best scores</h3>
            <div className="space-y-1.5">
              {Object.entries(GAME_LABELS).map(([gameId, label]) => {
                const high = getBestScore(gameId);
                return (
                  <div
                    key={gameId}
                    className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.03]"
                  >
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-sm font-bold text-white tabular-nums">
                      {high > 0 ? high.toLocaleString() : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
