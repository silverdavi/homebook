"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw } from "lucide-react";
import Link from "next/link";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import type { NewAchievement } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxCombo, sfxLevelUp, sfxGameOver, sfxAchievement, sfxCountdown, sfxCountdownGo } from "@/lib/games/audio";
import { createAdaptiveState, adaptiveUpdate, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import { getGradeForLevel } from "@/lib/games/learning-guide";

// ── Types ──

type Phase = "menu" | "countdown" | "playing" | "feedback" | "complete";

interface ColorQuestion {
  question: string;
  /** Each option: text label + optional swatch colors to render */
  options: { id: string; label: string; swatches?: string[] }[];
  correctId: string;
  explanation: string;
  principle: string;
  minLevel: number;
  maxLevel: number;
  /** Optional: show these swatches as context above the question */
  contextSwatches?: string[];
  /** Optional: show text on bg for contrast questions */
  contrastDemo?: { text: string; bg: string; fg: string };
}

// ── Constants ──

const GAME_ID = "color-harmony";
const QPS = 10;
const CD = 3;
const TL = 15;

function sh<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

// ── Color helpers ──

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(...hexToRgb(hex1));
  const l2 = luminance(...hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Swatch component
function Sw({ color, size = "w-10 h-10", className = "" }: { color: string; size?: string; className?: string }) {
  return <div className={`${size} rounded-lg border border-white/10 ${className}`} style={{ backgroundColor: color }} />;
}

function SwRow({ colors, size = "w-8 h-8" }: { colors: string[]; size?: string }) {
  return <div className="flex gap-1 items-center">{colors.map((c, i) => <Sw key={i} color={c} size={size} />)}</div>;
}

// ── Question Bank (50+ questions) ──

const QS: ColorQuestion[] = [
  // ═══ LEVEL 1-10: Warm/cool, primary/secondary ═══
  { question: "Which is a warm color?", options: [
    { id: "a", label: "Orange", swatches: ["#F97316"] },
    { id: "b", label: "Blue", swatches: ["#3B82F6"] },
    { id: "c", label: "Purple", swatches: ["#8B5CF6"] },
    { id: "d", label: "Green", swatches: ["#22C55E"] },
  ], correctId: "a", explanation: "Orange is a warm color. Warm colors (red, orange, yellow) evoke heat and energy.", principle: "Warm vs Cool Colors", minLevel: 1, maxLevel: 10 },

  { question: "Which is a cool color?", options: [
    { id: "a", label: "Red", swatches: ["#EF4444"] },
    { id: "b", label: "Yellow", swatches: ["#EAB308"] },
    { id: "c", label: "Blue", swatches: ["#3B82F6"] },
    { id: "d", label: "Orange", swatches: ["#F97316"] },
  ], correctId: "c", explanation: "Blue is a cool color. Cool colors (blue, green, purple) evoke calm and water.", principle: "Warm vs Cool Colors", minLevel: 1, maxLevel: 10 },

  { question: "What do you get when you mix red and yellow?", options: [
    { id: "a", label: "Green" }, { id: "b", label: "Orange" }, { id: "c", label: "Purple" }, { id: "d", label: "Brown" },
  ], correctId: "b", explanation: "Red + Yellow = Orange. This is how secondary colors are formed.", principle: "Color Mixing", minLevel: 1, maxLevel: 10, contextSwatches: ["#EF4444", "#EAB308"] },

  { question: "Which colors are primary colors?", options: [
    { id: "a", label: "Red, Blue, Yellow", swatches: ["#EF4444", "#3B82F6", "#EAB308"] },
    { id: "b", label: "Red, Green, Blue", swatches: ["#EF4444", "#22C55E", "#3B82F6"] },
    { id: "c", label: "Orange, Green, Purple", swatches: ["#F97316", "#22C55E", "#8B5CF6"] },
  ], correctId: "a", explanation: "In traditional color theory, Red, Blue, and Yellow are the three primary colors.", principle: "Primary Colors", minLevel: 1, maxLevel: 10 },

  { question: "What do you get when you mix red and blue?", options: [
    { id: "a", label: "Green" }, { id: "b", label: "Orange" }, { id: "c", label: "Purple" }, { id: "d", label: "Brown" },
  ], correctId: "c", explanation: "Red + Blue = Purple. Purple is a secondary color.", principle: "Color Mixing", minLevel: 1, maxLevel: 10, contextSwatches: ["#EF4444", "#3B82F6"] },

  { question: "What do you get when you mix blue and yellow?", options: [
    { id: "a", label: "Green" }, { id: "b", label: "Orange" }, { id: "c", label: "Purple" }, { id: "d", label: "Pink" },
  ], correctId: "a", explanation: "Blue + Yellow = Green. Green is a secondary color.", principle: "Color Mixing", minLevel: 1, maxLevel: 10, contextSwatches: ["#3B82F6", "#EAB308"] },

  { question: "Which is a secondary color?", options: [
    { id: "a", label: "Red", swatches: ["#EF4444"] },
    { id: "b", label: "Blue", swatches: ["#3B82F6"] },
    { id: "c", label: "Green", swatches: ["#22C55E"] },
    { id: "d", label: "Yellow", swatches: ["#EAB308"] },
  ], correctId: "c", explanation: "Green is a secondary color (Blue + Yellow). Secondary colors are made from mixing two primaries.", principle: "Secondary Colors", minLevel: 1, maxLevel: 10 },

  { question: "Which group contains ONLY warm colors?", options: [
    { id: "a", label: "Red, Orange, Yellow", swatches: ["#EF4444", "#F97316", "#EAB308"] },
    { id: "b", label: "Red, Blue, Yellow", swatches: ["#EF4444", "#3B82F6", "#EAB308"] },
    { id: "c", label: "Green, Orange, Purple", swatches: ["#22C55E", "#F97316", "#8B5CF6"] },
  ], correctId: "a", explanation: "Red, Orange, and Yellow are all warm colors associated with fire and sunlight.", principle: "Warm Colors", minLevel: 1, maxLevel: 10 },

  { question: "Which group contains ONLY cool colors?", options: [
    { id: "a", label: "Blue, Green, Purple", swatches: ["#3B82F6", "#22C55E", "#8B5CF6"] },
    { id: "b", label: "Blue, Green, Red", swatches: ["#3B82F6", "#22C55E", "#EF4444"] },
    { id: "c", label: "Yellow, Green, Blue", swatches: ["#EAB308", "#22C55E", "#3B82F6"] },
  ], correctId: "a", explanation: "Blue, Green, and Purple are all cool colors associated with water and sky.", principle: "Cool Colors", minLevel: 1, maxLevel: 10 },

  { question: "What color is created by mixing all primary colors?", options: [
    { id: "a", label: "White" }, { id: "b", label: "Black" }, { id: "c", label: "Brown/Dark" }, { id: "d", label: "Gray" },
  ], correctId: "c", explanation: "Mixing all three primary pigments (red, blue, yellow) creates a dark brown/muddy color.", principle: "Color Mixing", minLevel: 1, maxLevel: 10 },

  // ═══ LEVEL 11-18: Complementary colors ═══
  { question: "What is the complementary color of blue?", options: [
    { id: "a", label: "Orange", swatches: ["#F97316"] },
    { id: "b", label: "Green", swatches: ["#22C55E"] },
    { id: "c", label: "Red", swatches: ["#EF4444"] },
    { id: "d", label: "Purple", swatches: ["#8B5CF6"] },
  ], correctId: "a", explanation: "Orange is opposite blue on the color wheel. Complementary colors create high contrast.", principle: "Complementary Colors", minLevel: 11, maxLevel: 18, contextSwatches: ["#3B82F6"] },

  { question: "What is the complementary color of red?", options: [
    { id: "a", label: "Blue", swatches: ["#3B82F6"] },
    { id: "b", label: "Green", swatches: ["#22C55E"] },
    { id: "c", label: "Yellow", swatches: ["#EAB308"] },
    { id: "d", label: "Orange", swatches: ["#F97316"] },
  ], correctId: "b", explanation: "Green is opposite red on the color wheel.", principle: "Complementary Colors", minLevel: 11, maxLevel: 18, contextSwatches: ["#EF4444"] },

  { question: "What is the complementary color of yellow?", options: [
    { id: "a", label: "Purple", swatches: ["#8B5CF6"] },
    { id: "b", label: "Orange", swatches: ["#F97316"] },
    { id: "c", label: "Blue", swatches: ["#3B82F6"] },
    { id: "d", label: "Green", swatches: ["#22C55E"] },
  ], correctId: "a", explanation: "Purple is opposite yellow on the color wheel.", principle: "Complementary Colors", minLevel: 11, maxLevel: 18, contextSwatches: ["#EAB308"] },

  { question: "Which pair are complementary colors?", options: [
    { id: "a", label: "Red & Green", swatches: ["#EF4444", "#22C55E"] },
    { id: "b", label: "Red & Orange", swatches: ["#EF4444", "#F97316"] },
    { id: "c", label: "Blue & Purple", swatches: ["#3B82F6", "#8B5CF6"] },
    { id: "d", label: "Yellow & Orange", swatches: ["#EAB308", "#F97316"] },
  ], correctId: "a", explanation: "Red and Green are opposite on the color wheel, making them complementary.", principle: "Complementary Pairs", minLevel: 11, maxLevel: 18 },

  { question: "Why do complementary colors create visual impact?", options: [
    { id: "a", label: "They are similar shades" },
    { id: "b", label: "They create maximum contrast" },
    { id: "c", label: "They blend together easily" },
    { id: "d", label: "They are both warm" },
  ], correctId: "b", explanation: "Complementary colors sit opposite each other on the color wheel, creating maximum contrast.", principle: "Complementary Contrast", minLevel: 11, maxLevel: 18 },

  { question: "Which pair would create the MOST visual contrast?", options: [
    { id: "a", label: "Blue & Orange", swatches: ["#3B82F6", "#F97316"] },
    { id: "b", label: "Blue & Purple", swatches: ["#3B82F6", "#8B5CF6"] },
    { id: "c", label: "Blue & Teal", swatches: ["#3B82F6", "#14B8A6"] },
  ], correctId: "a", explanation: "Blue and Orange are complementary — they create the strongest contrast.", principle: "Complementary Contrast", minLevel: 11, maxLevel: 18 },

  { question: "Where are complementary colors on the color wheel?", options: [
    { id: "a", label: "Next to each other" },
    { id: "b", label: "Directly opposite" },
    { id: "c", label: "Three apart" },
    { id: "d", label: "Randomly placed" },
  ], correctId: "b", explanation: "Complementary colors are directly opposite each other on the color wheel (180 degrees apart).", principle: "Color Wheel", minLevel: 11, maxLevel: 18 },

  { question: "Which holiday uses a complementary color scheme?", options: [
    { id: "a", label: "Christmas (Red & Green)", swatches: ["#EF4444", "#22C55E"] },
    { id: "b", label: "Easter (Pastel mix)" },
    { id: "c", label: "Halloween (Orange & Black)", swatches: ["#F97316", "#1E1E1E"] },
  ], correctId: "a", explanation: "Christmas uses red and green, which are complementary colors.", principle: "Complementary in Design", minLevel: 11, maxLevel: 18 },

  // ═══ LEVEL 19-25: Analogous and triadic ═══
  { question: "Which set of colors are analogous (neighbors on the wheel)?", options: [
    { id: "a", label: "Blue, Blue-Green, Green", swatches: ["#3B82F6", "#06B6D4", "#22C55E"] },
    { id: "b", label: "Red, Green, Blue", swatches: ["#EF4444", "#22C55E", "#3B82F6"] },
    { id: "c", label: "Red, Yellow, Blue", swatches: ["#EF4444", "#EAB308", "#3B82F6"] },
  ], correctId: "a", explanation: "Analogous colors sit next to each other on the wheel, creating a harmonious feel.", principle: "Analogous Colors", minLevel: 19, maxLevel: 25 },

  { question: "Which set forms a triadic harmony?", options: [
    { id: "a", label: "Red, Yellow, Blue", swatches: ["#EF4444", "#EAB308", "#3B82F6"] },
    { id: "b", label: "Red, Orange, Yellow", swatches: ["#EF4444", "#F97316", "#EAB308"] },
    { id: "c", label: "Blue, Purple, Red", swatches: ["#3B82F6", "#8B5CF6", "#EF4444"] },
  ], correctId: "a", explanation: "Triadic colors are equally spaced (120° apart) on the wheel: Red, Yellow, Blue.", principle: "Triadic Harmony", minLevel: 19, maxLevel: 25 },

  { question: "Which palette would create a calm feeling?", options: [
    { id: "a", label: "Analogous blues", swatches: ["#1E40AF", "#3B82F6", "#93C5FD"] },
    { id: "b", label: "Red & Green contrast", swatches: ["#EF4444", "#22C55E"] },
    { id: "c", label: "All primary colors", swatches: ["#EF4444", "#EAB308", "#3B82F6"] },
  ], correctId: "a", explanation: "Analogous cool colors (blues) create a calming, harmonious mood.", principle: "Color Mood", minLevel: 19, maxLevel: 25 },

  { question: "What makes analogous colors harmonious?", options: [
    { id: "a", label: "They are opposite on the wheel" },
    { id: "b", label: "They sit next to each other on the wheel" },
    { id: "c", label: "They are all primary colors" },
  ], correctId: "b", explanation: "Analogous colors are neighbors on the color wheel, sharing undertones.", principle: "Analogous Harmony", minLevel: 19, maxLevel: 25 },

  { question: "Which is an analogous warm palette?", options: [
    { id: "a", label: "Red, Orange, Yellow", swatches: ["#EF4444", "#F97316", "#EAB308"] },
    { id: "b", label: "Blue, Green, Purple", swatches: ["#3B82F6", "#22C55E", "#8B5CF6"] },
    { id: "c", label: "Red, Blue, Green", swatches: ["#EF4444", "#3B82F6", "#22C55E"] },
  ], correctId: "a", explanation: "Red, Orange, and Yellow are adjacent warm colors on the wheel.", principle: "Analogous Warm", minLevel: 19, maxLevel: 25 },

  { question: "How many degrees apart are triadic colors?", options: [
    { id: "a", label: "60 degrees" }, { id: "b", label: "90 degrees" }, { id: "c", label: "120 degrees" }, { id: "d", label: "180 degrees" },
  ], correctId: "c", explanation: "Triadic colors are 120 degrees apart, forming a triangle on the color wheel.", principle: "Triadic Spacing", minLevel: 19, maxLevel: 25 },

  { question: "Which palette creates the most visual energy?", options: [
    { id: "a", label: "Complementary (high contrast)", swatches: ["#EF4444", "#22C55E"] },
    { id: "b", label: "Analogous (low contrast)", swatches: ["#3B82F6", "#6366F1", "#8B5CF6"] },
    { id: "c", label: "Monochromatic", swatches: ["#3B82F6", "#60A5FA", "#93C5FD"] },
  ], correctId: "a", explanation: "Complementary colors create the most visual energy due to maximum contrast.", principle: "Color Energy", minLevel: 19, maxLevel: 25 },

  // ═══ LEVEL 26-32: Contrast and readability ═══
  { question: "Which text/background combo has better contrast?", options: [
    { id: "a", label: "Dark text on light bg", swatches: ["#1E293B", "#F8FAFC"] },
    { id: "b", label: "Gray on gray", swatches: ["#94A3B8", "#CBD5E1"] },
    { id: "c", label: "Light on light", swatches: ["#E2E8F0", "#F8FAFC"] },
  ], correctId: "a", explanation: "Dark text on a light background provides the highest contrast ratio for readability.", principle: "Text Contrast", minLevel: 26, maxLevel: 32, contrastDemo: { text: "Hello", bg: "#F8FAFC", fg: "#1E293B" } },

  { question: "What is the minimum contrast ratio for WCAG AA text?", options: [
    { id: "a", label: "2:1" }, { id: "b", label: "3:1" }, { id: "c", label: "4.5:1" }, { id: "d", label: "7:1" },
  ], correctId: "c", explanation: "WCAG AA requires at least 4.5:1 contrast ratio for normal text to ensure readability.", principle: "WCAG Contrast", minLevel: 26, maxLevel: 32 },

  { question: "Is this text readable?", options: [
    { id: "a", label: "Yes, good contrast" }, { id: "b", label: "No, poor contrast" },
  ], correctId: "b", explanation: "Light gray text (#999) on white (#fff) has only ~2.8:1 contrast — below WCAG AA (4.5:1).", principle: "Readability", minLevel: 26, maxLevel: 32, contrastDemo: { text: "Can you read this?", bg: "#FFFFFF", fg: "#999999" } },

  { question: "Which has a contrast ratio of at least 4.5:1?", options: [
    { id: "a", label: "#333 on #FFF (dark on white)", swatches: ["#333333", "#FFFFFF"] },
    { id: "b", label: "#AAA on #FFF (medium on white)", swatches: ["#AAAAAA", "#FFFFFF"] },
    { id: "c", label: "#CCC on #FFF (light on white)", swatches: ["#CCCCCC", "#FFFFFF"] },
  ], correctId: "a", explanation: "#333 on white has ~12.6:1 ratio. #AAA on white is only ~2.3:1.", principle: "WCAG Ratio", minLevel: 26, maxLevel: 32 },

  { question: "Why is color contrast important in design?", options: [
    { id: "a", label: "It makes designs look colorful" },
    { id: "b", label: "It ensures text is readable for everyone, including those with vision impairments" },
    { id: "c", label: "It makes printing cheaper" },
  ], correctId: "b", explanation: "Sufficient contrast ensures readability for people with low vision or color blindness.", principle: "Accessibility", minLevel: 26, maxLevel: 32 },

  { question: "Which color scheme is best for body text?", options: [
    { id: "a", label: "Red text on green background", swatches: ["#EF4444", "#22C55E"] },
    { id: "b", label: "Dark gray on white", swatches: ["#374151", "#FFFFFF"] },
    { id: "c", label: "Yellow text on white", swatches: ["#EAB308", "#FFFFFF"] },
  ], correctId: "b", explanation: "Dark gray on white has excellent contrast and is easy on the eyes for reading.", principle: "Body Text Contrast", minLevel: 26, maxLevel: 32 },

  { question: "What does WCAG stand for?", options: [
    { id: "a", label: "Web Content Accessibility Guidelines" },
    { id: "b", label: "World Color Association Guide" },
    { id: "c", label: "Web Color Analysis Group" },
  ], correctId: "a", explanation: "WCAG (Web Content Accessibility Guidelines) sets standards for web accessibility.", principle: "WCAG", minLevel: 26, maxLevel: 32 },

  // ═══ LEVEL 33-40: Advanced harmony ═══
  { question: "What is a split-complementary color scheme?", options: [
    { id: "a", label: "A color + the two colors adjacent to its complement" },
    { id: "b", label: "Two complementary pairs" },
    { id: "c", label: "Three colors next to each other" },
  ], correctId: "a", explanation: "Split-complementary uses a base color plus the two colors flanking its complement.", principle: "Split-Complementary", minLevel: 33, maxLevel: 40 },

  { question: "Which is the split-complementary of red?", options: [
    { id: "a", label: "Yellow-Green & Blue-Green", swatches: ["#84CC16", "#06B6D4"] },
    { id: "b", label: "Orange & Yellow", swatches: ["#F97316", "#EAB308"] },
    { id: "c", label: "Blue & Purple", swatches: ["#3B82F6", "#8B5CF6"] },
  ], correctId: "a", explanation: "Red's complement is green. Split-complement takes the colors next to green: yellow-green & blue-green.", principle: "Split-Complementary", minLevel: 33, maxLevel: 40, contextSwatches: ["#EF4444"] },

  { question: "Which palette follows a tetradic (rectangle) scheme?", options: [
    { id: "a", label: "Red, Green, Blue-Violet, Yellow", swatches: ["#EF4444", "#22C55E", "#7C3AED", "#EAB308"] },
    { id: "b", label: "Red, Orange, Yellow", swatches: ["#EF4444", "#F97316", "#EAB308"] },
    { id: "c", label: "Blue, Green", swatches: ["#3B82F6", "#22C55E"] },
  ], correctId: "a", explanation: "Tetradic uses 4 colors in two complementary pairs, forming a rectangle on the wheel.", principle: "Tetradic Harmony", minLevel: 33, maxLevel: 40 },

  { question: "What is wrong with this color palette?", options: [
    { id: "a", label: "Too many competing saturated colors" },
    { id: "b", label: "Not enough colors" },
    { id: "c", label: "Colors are too similar" },
  ], correctId: "a", explanation: "Using many highly saturated colors creates visual chaos. Limit saturated colors and use neutrals.", principle: "Color Balance", minLevel: 33, maxLevel: 40, contextSwatches: ["#EF4444", "#3B82F6", "#22C55E", "#EAB308", "#8B5CF6", "#F97316"] },

  { question: "How should you use a vibrant accent color?", options: [
    { id: "a", label: "Everywhere for maximum impact" },
    { id: "b", label: "Sparingly, for emphasis on key elements" },
    { id: "c", label: "Only for backgrounds" },
  ], correctId: "b", explanation: "The 60-30-10 rule: 60% dominant, 30% secondary, 10% accent. Vibrant colors work as accents.", principle: "60-30-10 Rule", minLevel: 33, maxLevel: 40 },

  { question: "What is a monochromatic color scheme?", options: [
    { id: "a", label: "Different shades/tints of one hue", swatches: ["#1E40AF", "#3B82F6", "#93C5FD"] },
    { id: "b", label: "Black and white only" },
    { id: "c", label: "Using all colors of the rainbow" },
  ], correctId: "a", explanation: "Monochromatic uses variations in lightness and saturation of a single hue.", principle: "Monochromatic", minLevel: 33, maxLevel: 40 },

  { question: "What is color saturation?", options: [
    { id: "a", label: "How light or dark a color is" },
    { id: "b", label: "How vivid or muted a color is" },
    { id: "c", label: "The hue of the color" },
  ], correctId: "b", explanation: "Saturation measures a color's intensity — from vivid/pure to gray/muted.", principle: "Saturation", minLevel: 33, maxLevel: 40 },

  { question: "Which palette is best for a professional website?", options: [
    { id: "a", label: "Neutral base + one accent", swatches: ["#F8FAFC", "#E2E8F0", "#1E293B", "#3B82F6"] },
    { id: "b", label: "All bright neon colors", swatches: ["#FF00FF", "#00FF00", "#FFFF00", "#00FFFF"] },
    { id: "c", label: "All dark colors", swatches: ["#1E1E1E", "#2D2D2D", "#3D3D3D", "#4D4D4D"] },
  ], correctId: "a", explanation: "Professional sites use a neutral palette with one accent color for calls to action.", principle: "Professional Palette", minLevel: 33, maxLevel: 40 },

  // ═══ LEVEL 41-50: Professional & psychology ═══
  { question: "Which color conveys trust and reliability?", options: [
    { id: "a", label: "Red", swatches: ["#EF4444"] },
    { id: "b", label: "Blue", swatches: ["#3B82F6"] },
    { id: "c", label: "Yellow", swatches: ["#EAB308"] },
    { id: "d", label: "Green", swatches: ["#22C55E"] },
  ], correctId: "b", explanation: "Blue conveys trust, stability, and professionalism — used by banks, tech companies, and social media.", principle: "Color Psychology", minLevel: 41, maxLevel: 50 },

  { question: "A children's toy brand should use...", options: [
    { id: "a", label: "Bright primary colors", swatches: ["#EF4444", "#EAB308", "#3B82F6"] },
    { id: "b", label: "Muted earth tones", swatches: ["#92400E", "#78716C", "#57534E"] },
    { id: "c", label: "Dark professional blues", swatches: ["#1E3A5F", "#1E293B", "#0F172A"] },
  ], correctId: "a", explanation: "Children's brands use bright, saturated primary colors to convey fun and energy.", principle: "Brand Color", minLevel: 41, maxLevel: 50 },

  { question: "Which color is most associated with nature and growth?", options: [
    { id: "a", label: "Red", swatches: ["#EF4444"] },
    { id: "b", label: "Purple", swatches: ["#8B5CF6"] },
    { id: "c", label: "Green", swatches: ["#22C55E"] },
    { id: "d", label: "Orange", swatches: ["#F97316"] },
  ], correctId: "c", explanation: "Green represents nature, growth, freshness, and sustainability.", principle: "Color Symbolism", minLevel: 41, maxLevel: 50 },

  { question: "Which color creates urgency and excitement?", options: [
    { id: "a", label: "Blue", swatches: ["#3B82F6"] },
    { id: "b", label: "Red", swatches: ["#EF4444"] },
    { id: "c", label: "Gray", swatches: ["#6B7280"] },
    { id: "d", label: "Green", swatches: ["#22C55E"] },
  ], correctId: "b", explanation: "Red creates urgency — used for sale signs, alerts, and call-to-action buttons.", principle: "Color Psychology", minLevel: 41, maxLevel: 50 },

  { question: "What is a tint of a color?", options: [
    { id: "a", label: "Adding white to lighten it" },
    { id: "b", label: "Adding black to darken it" },
    { id: "c", label: "Adding gray to mute it" },
  ], correctId: "a", explanation: "A tint is made by adding white to a color, making it lighter (e.g., pink is a tint of red).", principle: "Tint vs Shade", minLevel: 41, maxLevel: 50 },

  { question: "What is a shade of a color?", options: [
    { id: "a", label: "Adding white to lighten it" },
    { id: "b", label: "Adding black to darken it" },
    { id: "c", label: "Changing the hue" },
  ], correctId: "b", explanation: "A shade is made by adding black to a color, making it darker (e.g., navy is a shade of blue).", principle: "Tint vs Shade", minLevel: 41, maxLevel: 50 },

  { question: "Which fails WCAG AA for color contrast?", options: [
    { id: "a", label: "Yellow (#EAB308) on white (#FFF)" },
    { id: "b", label: "Dark blue (#1E3A8A) on white (#FFF)" },
    { id: "c", label: "Black (#000) on white (#FFF)" },
  ], correctId: "a", explanation: "Yellow on white has very low contrast (~1.9:1). WCAG AA requires at least 4.5:1.", principle: "Accessibility", minLevel: 41, maxLevel: 50 },

  { question: "What percentage of men have some form of color blindness?", options: [
    { id: "a", label: "About 1%" }, { id: "b", label: "About 8%" }, { id: "c", label: "About 25%" },
  ], correctId: "b", explanation: "About 8% of men and 0.5% of women have some form of color vision deficiency.", principle: "Color Blindness", minLevel: 41, maxLevel: 50 },

  { question: "What should you never rely on ONLY color to communicate?", options: [
    { id: "a", label: "Error states and important information" },
    { id: "b", label: "Background decoration" },
    { id: "c", label: "Brand identity" },
  ], correctId: "a", explanation: "Always use text, icons, or patterns alongside color so color-blind users aren't excluded.", principle: "Color Accessibility", minLevel: 41, maxLevel: 50 },

  { question: "A luxury brand typically uses...", options: [
    { id: "a", label: "Black, gold, and deep colors", swatches: ["#1E1E1E", "#D4AF37", "#4C1D95"] },
    { id: "b", label: "Bright primary colors", swatches: ["#EF4444", "#EAB308", "#3B82F6"] },
    { id: "c", label: "Neon and fluorescent", swatches: ["#FF00FF", "#00FF00", "#FFFF00"] },
  ], correctId: "a", explanation: "Luxury brands use black, gold, and deep jewel tones to convey elegance and exclusivity.", principle: "Brand Color", minLevel: 41, maxLevel: 50 },

  { question: "What is color temperature?", options: [
    { id: "a", label: "Actual heat of the color" },
    { id: "b", label: "The perceived warmth or coolness of a color" },
    { id: "c", label: "The brightness level" },
  ], correctId: "b", explanation: "Color temperature refers to how warm (red/yellow) or cool (blue/green) a color appears.", principle: "Color Temperature", minLevel: 41, maxLevel: 50 },

  { question: "Which color palette is best for a healthcare app?", options: [
    { id: "a", label: "Calming blues and whites", swatches: ["#3B82F6", "#93C5FD", "#F8FAFC"] },
    { id: "b", label: "Red and black", swatches: ["#EF4444", "#1E1E1E"] },
    { id: "c", label: "Neon greens and purples", swatches: ["#00FF00", "#8B5CF6"] },
  ], correctId: "a", explanation: "Healthcare apps use calming blues and whites to convey trust, cleanliness, and professionalism.", principle: "Industry Colors", minLevel: 41, maxLevel: 50 },
];

// ── Question picker ──

function pickQ(pool: ColorQuestion[], level: number, count: number): ColorQuestion[] {
  const ok = pool.filter(c => level >= c.minLevel - 3 && level <= c.maxLevel + 8);
  return sh(ok.length >= count ? ok : pool).slice(0, count);
}

// ── Component ──

export function ColorHarmonyGame() {
  useGameMusic();
  const [phase, setPhase] = useState<Phase>("menu");
  const [countdown, setCountdown] = useState(CD);
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));
  const [questions, setQuestions] = useState<ColorQuestion[]>([]);
  const [ci, setCi] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [cc, setCc] = useState(0);
  const [bs, setBs] = useState(0);
  const [hi, setHi] = useState(() => getLocalHighScore(GAME_ID) ?? 0);
  const [qs, setQs] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [aq, setAq] = useState<NewAchievement[]>([]);
  const [ai, setAi] = useState(0);
  const tr = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) { sfxCountdownGo(); setPhase("playing"); setQs(Date.now()); return; }
    sfxCountdown();
    const t = setTimeout(() => setCountdown(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase === "playing" || phase === "feedback") {
      tr.current = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => { if (tr.current) clearInterval(tr.current); };
    }
    if (tr.current) clearInterval(tr.current);
  }, [phase]);

  const dl = getDifficultyLabel(adaptive.level);
  const gi = getGradeForLevel(Math.floor(adaptive.level));

  const startGame = useCallback(() => {
    setQuestions(pickQ(QS, 1, QPS)); setCi(0); setSel(null); setScore(0); setCc(0);
    setBs(0); setElapsed(0); setAdaptive(createAdaptiveState(1));
    setCountdown(CD); setAq([]); setAi(0); setPhase("countdown");
  }, []);

  const handleSelect = useCallback((id: string) => {
    if (phase !== "playing" || sel !== null) return;
    const q = questions[ci]; if (!q) return;
    const ok = id === q.correctId;
    const at = (Date.now() - qs) / 1000;
    setSel(id);
    const na = adaptiveUpdate(adaptive, ok, ok && at < 5);
    setAdaptive(na);
    if (ok) {
      sfxCorrect(); setCc(c => c + 1);
      const { mult } = getMultiplierFromStreak(na.streak);
      const tb = Math.max(0, Math.round((TL - at) * 5));
      setScore(s => s + Math.round((100 + tb) * mult));
      if (na.streak > 2) sfxCombo(na.streak);
      if (na.streak > bs) setBs(na.streak);
    } else { sfxWrong(); }
    setPhase("feedback");
  }, [phase, sel, questions, ci, qs, adaptive, bs]);

  const next = useCallback(() => {
    if (ci + 1 >= questions.length) {
      if (tr.current) clearInterval(tr.current);
      const acc = questions.length > 0 ? Math.round((cc / questions.length) * 100) : 0;
      if (acc >= 80) sfxLevelUp(); else sfxGameOver();
      if (score > hi) { setHi(score); setLocalHighScore(GAME_ID, score); }
      trackGamePlayed(GAME_ID, score, { bestStreak: bs, adaptiveLevel: Math.floor(adaptive.level) });
      const p = getProfile();
      const na = checkAchievements(
        { gameId: GAME_ID, score, level: Math.floor(adaptive.level), accuracy: acc, bestStreak: bs },
        p.totalGamesPlayed, p.gamesPlayedByGameId,
      );
      if (na.length > 0) { sfxAchievement(); setAq(na); }
      setPhase("complete");
    } else {
      const used = new Set(questions.slice(0, ci + 1).map(q => q.question));
      const nx = pickQ(QS.filter(q => !used.has(q.question)), Math.floor(adaptive.level), 1);
      if (nx.length > 0) setQuestions(prev => { const u = [...prev]; u[ci + 1] = nx[0]; return u; });
      setCi(i => i + 1); setSel(null); setQs(Date.now()); setPhase("playing");
    }
  }, [ci, questions, cc, score, hi, bs, adaptive]);

  const q = questions[ci];
  const acc = questions.length > 0 && phase === "complete" ? Math.round((cc / questions.length) * 100) : 0;
  const ft = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060612] via-[#0a0e2a] to-[#060612] flex flex-col items-center">
      <div className="w-full max-w-2xl px-4 pt-3 pb-1 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /> Games</Link>
        <h1 className="text-base font-bold text-white tracking-wide">Color Harmony</h1>
        <AudioToggles />
      </div>

      {aq.length > 0 && ai < aq.length && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <AchievementToast name={aq[ai].name} tier={aq[ai].tier} onDismiss={() => { if (ai + 1 >= aq.length) setAq([]); setAi(i => i + 1); }} />
        </div>
      )}

      {phase === "menu" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-md">
          <div className="text-5xl mb-3">🎨</div>
          <h2 className="text-3xl font-bold text-white mb-2">Color Harmony</h2>
          <p className="text-slate-400 text-sm mb-4">Master color theory! Build palettes, check contrast, and learn color harmony. {QPS} questions with adaptive difficulty.</p>
          {hi > 0 && <div className="text-xs text-slate-500 mb-4 flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-500" /> Best: {hi.toLocaleString()}</div>}
          {/* Mini color wheel decoration */}
          <div className="flex gap-1 mb-5">{["#EF4444","#F97316","#EAB308","#22C55E","#3B82F6","#8B5CF6","#EC4899"].map(c=><div key={c} className="w-6 h-6 rounded-full" style={{backgroundColor:c}} />)}</div>
          <button onClick={startGame} className="px-10 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25">Play</button>
        </div>
      )}

      {phase === "countdown" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-8xl font-bold text-indigo-400 animate-pulse">{countdown > 0 ? countdown : "GO!"}</div>
        </div>
      )}

      {(phase === "playing" || phase === "feedback") && q && (
        <div className="w-full max-w-2xl px-4 flex flex-col gap-3 mt-2">
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <span>Q{ci + 1}/{questions.length}</span><span>|</span><span>{ft(elapsed)}</span>
              <span>|</span><span style={{ color: dl.color }}>{dl.label}</span>
              <span className="text-[10px] text-slate-600">({gi.label})</span>
            </div>
            <div className="flex items-center gap-2"><StreakBadge streak={adaptive.streak} /><span className="text-lg font-bold text-white">{score.toLocaleString()}</span></div>
          </div>

          {/* Context swatches */}
          {q.contextSwatches && (
            <div className="flex justify-center"><SwRow colors={q.contextSwatches} size="w-12 h-12" /></div>
          )}

          {/* Contrast demo */}
          {q.contrastDemo && (
            <div className="flex justify-center">
              <div className="px-6 py-3 rounded-lg text-sm font-bold" style={{ backgroundColor: q.contrastDemo.bg, color: q.contrastDemo.fg }}>{q.contrastDemo.text}</div>
            </div>
          )}

          <div className="text-center"><h3 className="text-white font-semibold text-base sm:text-lg">{q.question}</h3></div>

          {/* Options */}
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            {q.options.map((o) => {
              const isSel = sel === o.id;
              const isOk = o.id === q.correctId;
              const sr = phase === "feedback";
              let bd = "border-white/10 hover:border-white/30";
              if (sr && isOk) bd = "border-green-500 ring-2 ring-green-500/30";
              else if (sr && isSel && !isOk) bd = "border-red-500 ring-2 ring-red-500/30";
              return (
                <button key={o.id} onClick={() => handleSelect(o.id)} disabled={phase !== "playing"}
                  className={`relative rounded-xl border-2 ${bd} bg-slate-800/60 p-3 transition-all text-left ${phase === "playing" ? "cursor-pointer hover:bg-slate-700/60 active:scale-[0.98]" : ""}`}>
                  <div className="flex items-center gap-3">
                    {o.swatches && <SwRow colors={o.swatches} size="w-8 h-8" />}
                    <span className="text-sm text-white">{o.label}</span>
                  </div>
                  {sr && isOk && <div className="absolute top-1 right-1 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded font-bold">Correct</div>}
                  {sr && isSel && !isOk && <div className="absolute top-1 right-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">Wrong</div>}
                </button>
              );
            })}
          </div>

          {phase === "feedback" && (
            <div className="bg-slate-800/80 rounded-xl p-4 border border-white/5">
              <div className="flex items-start gap-2 mb-2">
                <span className={`text-sm font-bold ${sel === q.correctId ? "text-green-400" : "text-red-400"}`}>{sel === q.correctId ? "Correct!" : "Not quite!"}</span>
                <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{q.principle}</span>
              </div>
              <p className="text-sm text-slate-300">{q.explanation}</p>
              <button onClick={next} className="mt-3 px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-lg transition-all text-sm">
                {ci + 1 >= questions.length ? "See Results" : "Next Question"}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "complete" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-md">
          <Trophy className="w-12 h-12 text-yellow-400 mb-2" />
          <h3 className="text-2xl font-bold text-white mb-1">{acc === 100 ? "Perfect Score!" : acc >= 80 ? "Great Job!" : "Keep Practicing!"}</h3>
          <div className="text-4xl font-bold text-indigo-400 mb-4">{score.toLocaleString()}</div>
          <div className="grid grid-cols-3 gap-4 mb-4 text-center w-full max-w-xs">
            <div><div className="text-xl font-bold text-green-400">{acc}%</div><div className="text-[10px] text-slate-500 uppercase">Accuracy</div></div>
            <div><div className="text-xl font-bold text-cyan-400">{ft(elapsed)}</div><div className="text-[10px] text-slate-500 uppercase">Time</div></div>
            <div><div className="text-xl font-bold text-amber-400">{bs}</div><div className="text-[10px] text-slate-500 uppercase">Best Streak</div></div>
          </div>
          <div className="text-xs text-slate-500 mb-3">Final level: <span style={{ color: dl.color }}>{dl.label}</span> ({gi.label})</div>
          <div className="mb-3 w-full max-w-xs">
            <ScoreSubmit game={GAME_ID} score={score} level={Math.floor(adaptive.level)} stats={{ accuracy: `${acc}%`, bestStreak: bs, time: ft(elapsed) }} />
          </div>
          <div className="flex gap-3">
            <button onClick={startGame} className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl flex items-center gap-2 text-sm transition-all"><RotateCcw className="w-4 h-4" /> Play Again</button>
            <Link href="/games" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-sm transition-all">Back</Link>
          </div>
        </div>
      )}
    </div>
  );
}
