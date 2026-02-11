"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX, Music, Music2 } from "lucide-react";
import {
  isMusicEnabled,
  isSfxEnabled,
  setMusicEnabled,
  setSfxEnabled,
  startMusic,
  stopMusic,
} from "@/lib/games/audio";

/**
 * Compact toggles for Music and Sound Effects.
 * Can be placed in any game's menu or HUD.
 */
export function AudioToggles({ className = "" }: { className?: string }) {
  const [music, setMusic] = useState(false);
  const [sfx, setSfx] = useState(true);

  useEffect(() => {
    setMusic(isMusicEnabled());
    setSfx(isSfxEnabled());
  }, []);

  const toggleMusic = () => {
    const next = !music;
    setMusic(next);
    setMusicEnabled(next);
    if (next) startMusic();
    else stopMusic();
  };

  const toggleSfx = () => {
    const next = !sfx;
    setSfx(next);
    setSfxEnabled(next);
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        onClick={toggleMusic}
        title={music ? "Music on" : "Music off"}
        className={`p-1.5 rounded-lg transition-all ${music ? "bg-white/10 text-white" : "bg-white/[0.03] text-slate-600"} hover:bg-white/15`}
      >
        {music ? <Music className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
      </button>
      <button
        onClick={toggleSfx}
        title={sfx ? "Sound effects on" : "Sound effects off"}
        className={`p-1.5 rounded-lg transition-all ${sfx ? "bg-white/10 text-white" : "bg-white/[0.03] text-slate-600"} hover:bg-white/15`}
      >
        {sfx ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>
    </div>
  );
}

/**
 * Hook that manages music lifecycle for a game.
 * Starts music on mount (if enabled), stops on unmount.
 */
export function useGameMusic() {
  useEffect(() => {
    // Start music if user has it enabled
    if (isMusicEnabled()) {
      // Small delay to avoid blocking initial render
      const t = setTimeout(() => startMusic(), 300);
      return () => { clearTimeout(t); stopMusic(); };
    }
    return () => stopMusic();
  }, []);
}
