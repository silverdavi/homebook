import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isMusicEnabled,
  isSfxEnabled,
  setMusicEnabled,
  setSfxEnabled,
  isMusicPlaying,
} from "@/lib/games/audio";

// Mock localStorage
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  });

  // Mock AudioContext — must be a constructable function (not arrow)
  vi.stubGlobal("AudioContext", function MockAudioContext(this: Record<string, unknown>) {
    this.state = "running";
    this.resume = vi.fn();
    this.currentTime = 0;
    this.destination = {};
    this.createOscillator = vi.fn().mockReturnValue({
      type: "sine",
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    });
    this.createGain = vi.fn().mockReturnValue({
      gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    });
  });
});

describe("isMusicEnabled", () => {
  it("returns true by default", () => {
    expect(isMusicEnabled()).toBe(true);
  });

  it("returns false when explicitly disabled", () => {
    store["games_music_enabled"] = "false";
    expect(isMusicEnabled()).toBe(false);
  });

  it("returns true when explicitly enabled", () => {
    store["games_music_enabled"] = "true";
    expect(isMusicEnabled()).toBe(true);
  });
});

describe("isSfxEnabled", () => {
  it("returns true by default", () => {
    expect(isSfxEnabled()).toBe(true);
  });

  it("returns false when explicitly disabled", () => {
    store["games_sfx_enabled"] = "false";
    expect(isSfxEnabled()).toBe(false);
  });
});

describe("setMusicEnabled", () => {
  it("persists enabled state", () => {
    setMusicEnabled(true);
    expect(store["games_music_enabled"]).toBe("true");
  });

  it("persists disabled state", () => {
    setMusicEnabled(false);
    expect(store["games_music_enabled"]).toBe("false");
  });
});

describe("setSfxEnabled", () => {
  it("persists enabled state", () => {
    setSfxEnabled(true);
    expect(store["games_sfx_enabled"]).toBe("true");
  });

  it("persists disabled state", () => {
    setSfxEnabled(false);
    expect(store["games_sfx_enabled"]).toBe("false");
  });
});

describe("SFX functions (fresh module per test)", () => {
  it("sfxCorrect does not throw when SFX enabled", async () => {
    vi.resetModules();
    const mod = await import("@/lib/games/audio");
    expect(() => mod.sfxCorrect()).not.toThrow();
  });

  it("sfxWrong does not throw when SFX enabled", async () => {
    vi.resetModules();
    const mod = await import("@/lib/games/audio");
    expect(() => mod.sfxWrong()).not.toThrow();
  });

  it("sfxClick does not throw", async () => {
    vi.resetModules();
    const mod = await import("@/lib/games/audio");
    expect(() => mod.sfxClick()).not.toThrow();
  });

  it("sfxCombo does not throw", async () => {
    vi.resetModules();
    const mod = await import("@/lib/games/audio");
    expect(() => mod.sfxCombo(5)).not.toThrow();
  });

  it("sfxGameOver does not throw", async () => {
    vi.resetModules();
    const mod = await import("@/lib/games/audio");
    expect(() => mod.sfxGameOver()).not.toThrow();
  });

  it("sfxCountdown does not throw", async () => {
    vi.resetModules();
    const mod = await import("@/lib/games/audio");
    expect(() => mod.sfxCountdown()).not.toThrow();
  });
});

describe("isMusicPlaying", () => {
  it("returns false initially", () => {
    expect(isMusicPlaying()).toBe(false);
  });
});
