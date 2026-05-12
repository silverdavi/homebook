"use client";

import { ProfileProvider } from "@/lib/games/profile-context";

export function GamesProviders({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <div className="game-arena min-h-screen">{children}</div>
    </ProfileProvider>
  );
}
