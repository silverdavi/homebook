"use client";

import { ProfileProvider } from "@/lib/games/profile-context";

export function DailyProviders({ children }: { children: React.ReactNode }) {
  return <ProfileProvider>{children}</ProfileProvider>;
}
