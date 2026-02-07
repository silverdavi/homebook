"use client";

import { useState, useEffect } from "react";
import { Medal, X, User, Gamepad2, Star } from "lucide-react";
import { getProfile, getSavedName, saveName, getLocalHighScore } from "@/lib/games/use-scores";
import { getAchievements, MEDALS, getMedalDef, type MedalTier } from "@/lib/games/achievements";

const GAME_LABELS: Record<string, string> = {
  "letter-rain": "Letter Rain",
  "math-blitz": "Math Blitz",
  "fraction-fighter": "Fraction Fighter",
  "word-builder": "Word Builder",
  "times-table": "Times Table",
  "fraction-lab": "Fraction Lab",
  "element-match": "Element Match",
};

const HIGH_SCORE_KEYS: Record<string, string> = {
  "letter-rain": "letterRain_highScore",
  "math-blitz": "mathBlitz_highScore",
  "fraction-fighter": "fractionFighter_highScore",
  "word-builder": "wordBuilder_highScore",
  "times-table": "timesTable_highScore",
  "fraction-lab": "fractionLab_highScore",
  "element-match": "elementMatch_highScore", // not used directly; element match uses best times per pair count
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
  const [profile, setProfile] = useState(getProfile());
  const [achievements, setAchievements] = useState(getAchievements());
  const [name, setName] = useState(getSavedName());

  useEffect(() => {
    if (open) {
      setProfile(getProfile());
      setAchievements(getAchievements());
      setName(getSavedName());
    }
  }, [open]);

  const handleNameBlur = () => {
    const trimmed = name.trim().slice(0, 32);
    setName(trimmed);
    saveName(trimmed);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900/95 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            Player Profile
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
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Name</label>
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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
              <Gamepad2 className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-white tabular-nums">{profile.totalGamesPlayed}</div>
              <div className="text-[10px] text-slate-500 uppercase">Games played</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
              <Star className="w-6 h-6 text-yellow-400/80 mx-auto mb-1" />
              <div className="text-2xl font-bold text-white tabular-nums">{profile.totalScore.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500 uppercase">Total score</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
              <Medal className="w-6 h-6 text-amber-400/80 mx-auto mb-1" />
              <div className="text-2xl font-bold text-white tabular-nums">{Object.keys(achievements).length}</div>
              <div className="text-[10px] text-slate-500 uppercase">Medals</div>
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
                const tier = achievements[medal.id];
                const def = getMedalDef(medal.id);
                return (
                  <div
                    key={medal.id}
                    className={`rounded-xl border p-3 text-center transition-all ${
                      tier
                        ? `bg-gradient-to-b ${TIER_COLORS[tier]} border-opacity-50 text-white`
                        : "bg-white/[0.03] border-white/5 text-slate-600"
                    }`}
                    title={def ? `${def.name}: ${tier ? def[tier].requirement : "Locked"}` : medal.name}
                  >
                    <Medal className={`w-6 h-6 mx-auto mb-0.5 ${tier ? "opacity-100" : "opacity-30"}`} />
                    <div className="text-[10px] font-medium truncate">{medal.name}</div>
                    {tier && <div className="text-[9px] uppercase opacity-90">{tier}</div>}
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
                const key = HIGH_SCORE_KEYS[gameId];
                const high = key ? getLocalHighScore(key) : 0;
                return (
                  <div key={gameId} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.03]">
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-sm font-bold text-white tabular-nums">{high > 0 ? high.toLocaleString() : "—"}</span>
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
