"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

// ── Types ──

export interface Profile {
  id: string;
  name: string;
  avatarColor: string;
  accessCode: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface GameProgress {
  gameId: string;
  highScore: number;
  gamesPlayed: number;
  totalScore: number;
  bestStreak: number;
  adaptiveLevel: number;
}

export interface ProfileContextValue {
  // Profile state
  profile: Profile | null;
  isLoading: boolean;
  isLoggedIn: boolean;

  // Server data
  progress: GameProgress[];
  achievements: Record<string, string>;

  // Auth actions
  login: (
    accessCode: string
  ) => Promise<{ success: boolean; error?: string }>;
  createProfile: (
    name: string,
    avatarColor?: string
  ) => Promise<{ success: boolean; accessCode?: string; error?: string }>;
  logout: () => void;

  // Data actions (only work when logged in, silently no-op for guests)
  saveProgress: (
    gameId: string,
    score: number,
    stats?: { bestStreak?: number; adaptiveLevel?: number }
  ) => Promise<void>;
  saveAchievement: (
    medalId: string,
    tier: "bronze" | "silver" | "gold"
  ) => Promise<void>;
  syncLocalStorage: () => Promise<void>;
  refreshProfile: () => Promise<void>;

  // Convenience
  getHighScore: (gameId: string) => number;
  getGamesPlayed: (gameId: string) => number;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

// ── Helpers ──

const PROFILE_ID_KEY = "activeProfileId";

function getStoredProfileId(): string | null {
  try {
    return localStorage.getItem(PROFILE_ID_KEY);
  } catch {
    return null;
  }
}

function setStoredProfileId(id: string): void {
  try {
    localStorage.setItem(PROFILE_ID_KEY, id);
  } catch {
    // ignore
  }
}

function removeStoredProfileId(): void {
  try {
    localStorage.removeItem(PROFILE_ID_KEY);
  } catch {
    // ignore
  }
}

/** Gather all relevant localStorage data for syncing to server */
function gatherLocalStorageData(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  try {
    // Player profile (games played, scores)
    const playerProfile = localStorage.getItem("playerProfile");
    if (playerProfile) data.playerProfile = JSON.parse(playerProfile);

    // Achievements
    const achievements = localStorage.getItem("achievements");
    if (achievements) data.achievements = JSON.parse(achievements);

    // Daily challenges
    const dailyChallenges = localStorage.getItem("dailyChallengeData");
    if (dailyChallenges) data.dailyChallenges = JSON.parse(dailyChallenges);

    // High scores — collect all keys ending with _highScore or known score keys
    const highScores: Record<string, number> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.endsWith("_highScore") || key === "crossword" || key === "trivia-quiz") {
        const val = parseInt(localStorage.getItem(key) || "0", 10);
        if (val > 0) highScores[key] = val;
      }
    }
    if (Object.keys(highScores).length > 0) data.highScores = highScores;

    // Preferences (player name, etc.)
    const preferences: Record<string, string> = {};
    const playerName = localStorage.getItem("playerName");
    if (playerName) preferences.playerName = playerName;
    if (Object.keys(preferences).length > 0) data.preferences = preferences;
  } catch {
    // ignore
  }
  return data;
}

// ── Provider ──

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<GameProgress[]>([]);
  const [achievements, setAchievements] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  // Hydrate on mount
  useEffect(() => {
    mountedRef.current = true;
    const storedId = getStoredProfileId();
    if (storedId) {
      fetchProfile(storedId).finally(() => {
        if (mountedRef.current) setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/profiles/${id}`);
      if (!res.ok) {
        // Profile not found — clear stored ID
        removeStoredProfileId();
        return false;
      }
      const data = await res.json();
      if (mountedRef.current) {
        setProfile(data.profile);
        setProgress(data.progress || []);
        setAchievements(
          Array.isArray(data.achievements)
            ? data.achievements.reduce(
                (acc: Record<string, string>, a: { medalId: string; tier: string }) => {
                  acc[a.medalId] = a.tier;
                  return acc;
                },
                {} as Record<string, string>
              )
            : data.achievements || {}
        );
      }
      return true;
    } catch {
      return false;
    }
  };

  const login = useCallback(
    async (
      accessCode: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/profiles/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessCode: accessCode.trim().toUpperCase() }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return {
            success: false,
            error: err.error || "Invalid code. Please try again.",
          };
        }
        const data = await res.json();
        if (mountedRef.current) {
          setProfile(data.profile);
          setProgress(data.progress || []);
          setAchievements(
            Array.isArray(data.achievements)
              ? data.achievements.reduce(
                  (acc: Record<string, string>, a: { medalId: string; tier: string }) => {
                    acc[a.medalId] = a.tier;
                    return acc;
                  },
                  {} as Record<string, string>
                )
              : data.achievements || {}
          );
          setStoredProfileId(data.profile.id);
        }
        return { success: true };
      } catch {
        return { success: false, error: "Network error. Please try again." };
      }
    },
    []
  );

  const createProfile = useCallback(
    async (
      name: string,
      avatarColor?: string
    ): Promise<{ success: boolean; accessCode?: string; error?: string }> => {
      try {
        const res = await fetch("/api/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), avatarColor }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: err.error || "Could not create profile." };
        }
        const data = await res.json();
        if (mountedRef.current) {
          setProfile(data.profile);
          setProgress(data.progress || []);
          setAchievements({});
          setStoredProfileId(data.profile.id);
        }
        return { success: true, accessCode: data.profile.accessCode };
      } catch {
        return { success: false, error: "Network error. Please try again." };
      }
    },
    []
  );

  const logout = useCallback(() => {
    setProfile(null);
    setProgress([]);
    setAchievements({});
    removeStoredProfileId();
  }, []);

  const saveProgress = useCallback(
    async (
      gameId: string,
      score: number,
      stats?: { bestStreak?: number; adaptiveLevel?: number }
    ): Promise<void> => {
      if (!profile) return;
      try {
        const res = await fetch(`/api/profiles/${profile.id}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId, score, ...stats }),
        });
        if (res.ok) {
          const updated = await res.json();
          setProgress((prev) => {
            const idx = prev.findIndex((p) => p.gameId === gameId);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = updated;
              return next;
            }
            return [...prev, updated];
          });
        }
      } catch {
        // fire-and-forget
      }
    },
    [profile]
  );

  const saveAchievement = useCallback(
    async (
      medalId: string,
      tier: "bronze" | "silver" | "gold"
    ): Promise<void> => {
      if (!profile) return;
      try {
        await fetch(`/api/profiles/${profile.id}/achievements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ medalId, tier }),
        });
        setAchievements((prev) => ({ ...prev, [medalId]: tier }));
      } catch {
        // fire-and-forget
      }
    },
    [profile]
  );

  const syncLocalStorage = useCallback(async (): Promise<void> => {
    if (!profile) return;
    try {
      const data = gatherLocalStorageData();
      await fetch(`/api/profiles/${profile.id}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // fire-and-forget
    }
  }, [profile]);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!profile) return;
    await fetchProfile(profile.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const getHighScore = useCallback(
    (gameId: string): number => {
      const entry = progress.find((p) => p.gameId === gameId);
      return entry?.highScore ?? 0;
    },
    [progress]
  );

  const getGamesPlayed = useCallback(
    (gameId: string): number => {
      const entry = progress.find((p) => p.gameId === gameId);
      return entry?.gamesPlayed ?? 0;
    },
    [progress]
  );

  const value: ProfileContextValue = {
    profile,
    isLoading,
    isLoggedIn: profile !== null,
    progress,
    achievements,
    login,
    createProfile,
    logout,
    saveProgress,
    saveAchievement,
    syncLocalStorage,
    refreshProfile,
    getHighScore,
    getGamesPlayed,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within a <ProfileProvider>");
  }
  return ctx;
}
