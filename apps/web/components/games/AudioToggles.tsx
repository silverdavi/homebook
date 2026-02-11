"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSfxEnabled, setSfxEnabled } from "@/lib/games/audio";

/**
 * Compact SFX toggle. Place in any game's menu or HUD.
 */
export function AudioToggles({ className = "" }: { className?: string }) {
  const [sfx, setSfx] = useState(true);

  useEffect(() => {
    setSfx(isSfxEnabled());
  }, []);

  const toggleSfx = () => {
    const next = !sfx;
    setSfx(next);
    setSfxEnabled(next);
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
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
 * Legacy hook — previously managed background music lifecycle.
 * Music has been removed. This is a no-op kept for compatibility.
 */
export function useGameMusic() {
  // no-op
}
