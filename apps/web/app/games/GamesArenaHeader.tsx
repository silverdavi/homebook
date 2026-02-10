"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, Medal, LogIn, LogOut } from "lucide-react";
import { getAchievements } from "@/lib/games/achievements";
import { PlayerProfile } from "@/components/games/PlayerProfile";
import { ProfileSelector } from "@/components/games/ProfileSelector";
import { useProfile } from "@/lib/games/profile-context";

export function GamesArenaHeader() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [medalCount, setMedalCount] = useState(0);
  const { profile, isLoggedIn, logout } = useProfile();

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
          <div className="flex items-center gap-3">
            {!isLoggedIn && (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 transition-colors text-sm font-medium"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Up / Log In</span>
                <span className="sm:hidden">Log In</span>
              </button>
            )}
            {isLoggedIn && profile && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm">
                <div
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: profile.avatarColor }}
                />
                <span className="text-white font-medium truncate max-w-[120px]">
                  {profile.name}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="ml-1 p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors text-sm"
              aria-label="Player profile"
            >
              {isLoggedIn && profile ? (
                <div
                  className="w-4 h-4 rounded-full sm:hidden"
                  style={{ backgroundColor: profile.avatarColor }}
                />
              ) : (
                <User className="w-4 h-4" />
              )}
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
      <ProfileSelector open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
