"use client";

import { ProfileProvider } from "@/lib/games/profile-context";

export function GamesProviders({ children }: { children: React.ReactNode }) {
  return <ProfileProvider>{children}</ProfileProvider>;
}
