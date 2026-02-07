"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, Medal } from "lucide-react";
import { getAchievements } from "@/lib/games/achievements";
import { PlayerProfile } from "@/components/games/PlayerProfile";

export function GamesArenaHeader() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [medalCount, setMedalCount] = useState(0);

  useEffect(() => {
    setMedalCount(Object.keys(getAchievements()).length);
  }, []);

  useEffect(() => {
    if (!profileOpen) setMedalCount(Object.keys(getAchievements()).length);
  }, [profileOpen]);

  return (
    <>
      <header className="border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            teacher.ninja
          </Link>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors text-sm"
              aria-label="Player profile"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
              {medalCount > 0 && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                  <Medal className="w-3 h-3" />
                  {medalCount}
                </span>
              )}
            </button>
            <Link
              href="/generate"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Worksheets
            </Link>
          </div>
        </div>
      </header>
      <PlayerProfile open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
