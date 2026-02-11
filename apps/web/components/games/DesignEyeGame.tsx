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
import { sfxCorrect, sfxWrong, sfxCombo, sfxLevelUp, sfxGameOver, sfxAchievement, sfxCountdown, sfxCountdownGo, sfxStreakLost, sfxPerfect } from "@/lib/games/audio";
import { createAdaptiveState, adaptiveUpdate, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import { getGradeForLevel } from "@/lib/games/learning-guide";

// ── Types ──

type Phase = "menu" | "countdown" | "playing" | "feedback" | "complete";

interface DesignChallenge {
  render: () => React.ReactNode;
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
  principle: string;
  minLevel: number;
  maxLevel: number;
}

// ── Constants ──

const GAME_ID = "design-eye";
const QPS = 10;
const CD = 3;
const TL = 20;

function sh<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

// ── Challenge Bank (50 challenges) ──

const CHALLENGES: DesignChallenge[] = [
  // ═══ LEVEL 1-10: Obvious misalignment, inconsistent sizes ═══
  {
    render: () => (
      <div className="flex gap-4 items-start">
        <div className="w-16 h-16 rounded-lg bg-blue-500" />
        <div className="w-16 h-16 rounded-lg bg-blue-500 mt-5" />
        <div className="w-16 h-16 rounded-lg bg-blue-500" />
      </div>
    ),
    question: "What's wrong with this layout?",
    options: ["Middle box is misaligned vertically", "Colors are wrong", "Boxes are too small", "Spacing is uneven"],
    correctIdx: 0,
    explanation: "The middle box is offset ~20px from the others. All boxes in a row should share the same vertical alignment.",
    principle: "Vertical Alignment",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => (
      <div className="flex gap-4 items-center">
        <div className="w-16 h-16 rounded-lg bg-emerald-500" />
        <div className="w-24 h-24 rounded-lg bg-emerald-500" />
        <div className="w-16 h-16 rounded-lg bg-emerald-500" />
      </div>
    ),
    question: "What design flaw do you see?",
    options: ["Colors are inconsistent", "Middle box is a different size", "Spacing is off", "Rounding is wrong"],
    correctIdx: 1,
    explanation: "The middle box is 96px while the others are 64px. Inconsistent sizing creates visual imbalance in a uniform group.",
    principle: "Consistent Sizing",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => (
      <div className="flex flex-col gap-3 w-64">
        <div className="h-8 rounded bg-violet-500 w-full" />
        <div className="h-8 rounded bg-violet-500 ml-6 w-full" />
        <div className="h-8 rounded bg-violet-500 w-full" />
      </div>
    ),
    question: "What's the issue here?",
    options: ["Colors clash", "Middle bar is indented/misaligned", "Bars are too thin", "The gap is too large"],
    correctIdx: 1,
    explanation: "The second bar is shifted to the right. In a stack of equal bars, the left edge should be consistent.",
    principle: "Left-Edge Alignment",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => (
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-full bg-rose-500" />
        <div className="w-12 h-12 rounded-full bg-rose-500" />
        <div className="w-12 h-12 bg-rose-500" />
      </div>
    ),
    question: "Spot the inconsistency:",
    options: ["Third shape is not rounded (square corners)", "Colors don't match", "They're different sizes", "Spacing is off"],
    correctIdx: 0,
    explanation: "The third shape uses square corners while the others are circles. Shape consistency matters within a group.",
    principle: "Shape Consistency",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => (
      <div className="flex flex-col items-center gap-2 w-48">
        <div className="text-lg font-bold text-white">Subscribe</div>
        <div className="w-full h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">Sign Up</div>
        <div className="w-24 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">Login</div>
      </div>
    ),
    question: "What's wrong with these buttons?",
    options: ["They have different widths", "Colors are bad", "Font is wrong", "They need icons"],
    correctIdx: 0,
    explanation: "The Sign Up button is full-width while Login is narrower. Related buttons should have consistent widths.",
    principle: "Button Consistency",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => (
      <div className="flex gap-3 items-center">
        <div className="w-20 h-20 rounded-xl bg-amber-500" />
        <div className="w-20 h-20 rounded-xl bg-amber-500" />
        <div className="w-20 h-20 rounded-xl bg-amber-500 opacity-30" />
      </div>
    ),
    question: "What design issue is present?",
    options: ["Spacing is uneven", "Third box has inconsistent opacity", "Boxes are too big", "Colors are ugly"],
    correctIdx: 1,
    explanation: "The third box is 30% opacity while others are at 100%. Visual weight should be consistent for equal-importance items.",
    principle: "Visual Weight Consistency",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => (
      <div className="flex flex-col gap-2 w-56">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500" /><span className="text-white text-sm">Feature A</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500" /><span className="text-white text-sm">Feature B</span></div>
        <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-green-500" /><span className="text-white text-sm">Feature C</span></div>
      </div>
    ),
    question: "Spot the flaw in this list:",
    options: ["Text is misaligned", "Third bullet icon is larger than the others", "Colors clash", "Needs more spacing"],
    correctIdx: 1,
    explanation: "The third dot is 24px while the first two are 16px. Icon sizes should be consistent within a list.",
    principle: "Icon Size Consistency",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => (
      <div className="flex gap-4">
        <div className="w-28 rounded-xl bg-slate-700 p-4 text-center"><div className="w-8 h-8 rounded bg-sky-500 mx-auto mb-2" /><span className="text-xs text-white">Card A</span></div>
        <div className="w-28 rounded-xl bg-slate-700 p-4 text-center"><div className="w-8 h-8 rounded bg-sky-500 mx-auto mb-2" /><span className="text-xs text-white">Card B</span></div>
        <div className="w-28 rounded-xl bg-slate-700 p-4 text-right"><div className="w-8 h-8 rounded bg-sky-500 ml-auto mb-2" /><span className="text-xs text-white">Card C</span></div>
      </div>
    ),
    question: "What's inconsistent here?",
    options: ["Third card has different text alignment", "Cards are different heights", "Gap is too wide", "Colors clash"],
    correctIdx: 0,
    explanation: "Cards A and B center their content, but Card C is right-aligned. Alignment should be consistent across cards.",
    principle: "Text Alignment Consistency",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => (
      <div className="flex flex-col gap-3 w-64">
        <div className="h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">Primary</div>
        <div className="h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold text-[11px]">Secondary</div>
      </div>
    ),
    question: "What's wrong with these buttons?",
    options: ["Rounded corners don't match", "Text sizes are different", "Too much spacing", "Colors are inconsistent"],
    correctIdx: 1,
    explanation: "One button uses 14px text and the other uses 11px. Button labels in the same group should share the same font size.",
    principle: "Typography Consistency",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => (
      <div className="flex gap-4 items-end">
        <div className="w-16 h-24 rounded-lg bg-teal-500" />
        <div className="w-16 h-16 rounded-lg bg-teal-500" />
        <div className="w-16 h-24 rounded-lg bg-teal-500" />
      </div>
    ),
    question: "What's the problem?",
    options: ["Middle box is shorter than the others", "Colors are wrong", "Boxes are too wide", "Spacing is inconsistent"],
    correctIdx: 0,
    explanation: "The middle box is 64px tall while the flanking boxes are 96px. Inconsistent heights in a row cause visual imbalance.",
    principle: "Consistent Height",
    minLevel: 1, maxLevel: 10,
  },

  // ═══ LEVEL 11-18: Uneven spacing, padding errors ═══
  {
    render: () => (
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-lg bg-pink-500 mr-4" />
        <div className="w-12 h-12 rounded-lg bg-pink-500 mr-8" />
        <div className="w-12 h-12 rounded-lg bg-pink-500 mr-4" />
        <div className="w-12 h-12 rounded-lg bg-pink-500" />
      </div>
    ),
    question: "What's wrong with the spacing?",
    options: ["The gap between box 2 and 3 is larger than the others", "Boxes are too close", "Boxes need padding", "Nothing is wrong"],
    correctIdx: 0,
    explanation: "Gaps should be uniform: 16px between all boxes, but box 2 has 32px right-margin. Consistent spacing is essential.",
    principle: "Even Spacing",
    minLevel: 11, maxLevel: 18,
  },
  {
    render: () => (
      <div className="w-64 rounded-xl bg-slate-700 overflow-hidden">
        <div className="px-6 py-4 text-white text-sm font-semibold">Card Title</div>
        <div className="px-3 py-2 text-slate-300 text-xs">This card has inconsistent padding compared to the header area.</div>
        <div className="px-6 py-4 border-t border-slate-600"><span className="text-blue-400 text-xs">Read more →</span></div>
      </div>
    ),
    question: "What's the padding issue?",
    options: ["Top and bottom padding is wrong", "Body section has less horizontal padding than header and footer", "The card needs more border radius", "Font sizes are too small"],
    correctIdx: 1,
    explanation: "Header uses px-6 but body uses px-3 — horizontal padding should be consistent across sections of a card.",
    principle: "Consistent Padding",
    minLevel: 11, maxLevel: 18,
  },
  {
    render: () => (
      <div className="flex flex-col w-56">
        <div className="py-3 px-4 text-white text-sm border-b border-white/10">Menu Item 1</div>
        <div className="py-3 px-4 text-white text-sm border-b border-white/10">Menu Item 2</div>
        <div className="py-5 px-4 text-white text-sm border-b border-white/10">Menu Item 3</div>
        <div className="py-3 px-4 text-white text-sm">Menu Item 4</div>
      </div>
    ),
    question: "Find the spacing issue:",
    options: ["Menu Item 3 has more vertical padding", "Text is misaligned", "Border color is wrong", "Items are too wide"],
    correctIdx: 0,
    explanation: "Item 3 has py-5 (20px) instead of py-3 (12px). Menu items should have uniform vertical padding.",
    principle: "Uniform Padding",
    minLevel: 11, maxLevel: 18,
  },
  {
    render: () => (
      <div className="flex gap-3">
        <div className="w-28 rounded-xl bg-slate-700 p-4 text-center"><div className="w-10 h-10 rounded-full bg-cyan-500 mx-auto mb-3" /><span className="text-xs text-white">Alice</span></div>
        <div className="w-28 rounded-xl bg-slate-700 p-4 text-center"><div className="w-10 h-10 rounded-full bg-cyan-500 mx-auto mb-1" /><span className="text-xs text-white">Bob</span></div>
        <div className="w-28 rounded-xl bg-slate-700 p-4 text-center"><div className="w-10 h-10 rounded-full bg-cyan-500 mx-auto mb-3" /><span className="text-xs text-white">Carol</span></div>
      </div>
    ),
    question: "What spacing is off?",
    options: ["Card widths differ", "Bob's card has less space between the avatar and name", "Avatars are wrong sizes", "Colors need changing"],
    correctIdx: 1,
    explanation: "Bob's avatar uses mb-1 (4px) while the others use mb-3 (12px). Internal spacing should be consistent.",
    principle: "Internal Spacing",
    minLevel: 11, maxLevel: 18,
  },
  {
    render: () => (
      <div className="w-72 rounded-xl bg-slate-700 p-5">
        <div className="text-base font-bold text-white mb-4">Settings</div>
        <div className="flex justify-between items-center mb-4"><span className="text-sm text-slate-300">Dark Mode</span><div className="w-10 h-5 rounded-full bg-blue-500" /></div>
        <div className="flex justify-between items-center mb-1"><span className="text-sm text-slate-300">Notifications</span><div className="w-10 h-5 rounded-full bg-slate-500" /></div>
        <div className="flex justify-between items-center"><span className="text-sm text-slate-300">Sound</span><div className="w-10 h-5 rounded-full bg-slate-500" /></div>
      </div>
    ),
    question: "What's inconsistent?",
    options: ["Toggle colors differ", "Row spacing is uneven between items", "Text alignment is wrong", "Card is too narrow"],
    correctIdx: 1,
    explanation: "Dark Mode row has mb-4 gap below it, but Notifications has mb-1. Row spacing should be uniform in a settings list.",
    principle: "Row Spacing",
    minLevel: 11, maxLevel: 18,
  },
  {
    render: () => (
      <div className="flex gap-3">
        <div className="px-5 py-2 rounded-full bg-blue-500 text-white text-sm font-medium">Tab 1</div>
        <div className="px-5 py-2 rounded-full bg-slate-600 text-white text-sm font-medium">Tab 2</div>
        <div className="px-3 py-1 rounded-full bg-slate-600 text-white text-sm font-medium">Tab 3</div>
      </div>
    ),
    question: "What's the design issue?",
    options: ["Tab 3 has less padding than the other tabs", "Colors are too similar", "Tabs should be square", "Font weight is wrong"],
    correctIdx: 0,
    explanation: "Tab 3 uses px-3 py-1 while the others use px-5 py-2. Tab elements in a group should share the same padding.",
    principle: "Consistent Tab Sizing",
    minLevel: 11, maxLevel: 18,
  },
  {
    render: () => (
      <div className="w-72 space-y-2">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700"><div className="w-8 h-8 rounded bg-orange-500 shrink-0" /><div><div className="text-sm text-white font-medium">Notification</div><div className="text-xs text-slate-400">2 minutes ago</div></div></div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700"><div className="w-8 h-8 rounded bg-orange-500 shrink-0" /><div><div className="text-sm text-white font-medium">Update</div><div className="text-xs text-slate-400">5 minutes ago</div></div></div>
        <div className="flex items-center gap-6 p-3 rounded-lg bg-slate-700"><div className="w-8 h-8 rounded bg-orange-500 shrink-0" /><div><div className="text-sm text-white font-medium">Alert</div><div className="text-xs text-slate-400">10 minutes ago</div></div></div>
      </div>
    ),
    question: "What's off in this notification list?",
    options: ["Third item has larger gap between icon and text", "Icons are wrong colors", "Text sizes vary", "Backgrounds should be different"],
    correctIdx: 0,
    explanation: "The third item uses gap-6 (24px) while the others use gap-3 (12px). Consistent internal gaps keep lists clean.",
    principle: "Consistent Gap",
    minLevel: 11, maxLevel: 18,
  },
  {
    render: () => (
      <div className="w-64 rounded-xl bg-slate-700">
        <div className="p-4 border-b border-white/10 text-sm font-bold text-white">Header</div>
        <div className="p-4 text-xs text-slate-300">Body content here with some text to fill the card area.</div>
        <div className="px-4 pb-2 pt-4 border-t border-white/10 text-xs text-blue-400">Footer</div>
      </div>
    ),
    question: "What's wrong with this card?",
    options: ["Footer has less bottom padding than other sections", "Header font is too big", "Body is too short", "Border color is bad"],
    correctIdx: 0,
    explanation: "Footer uses pb-2 (8px) while header and body use p-4 (16px). Consistent padding in card sections is important.",
    principle: "Section Padding",
    minLevel: 11, maxLevel: 18,
  },

  // ═══ LEVEL 19-25: Inconsistent border-radius, mismatched alignment ═══
  {
    render: () => (
      <div className="flex gap-3">
        <div className="w-24 h-16 rounded-xl bg-purple-500" />
        <div className="w-24 h-16 rounded-md bg-purple-500" />
        <div className="w-24 h-16 rounded-xl bg-purple-500" />
      </div>
    ),
    question: "What's inconsistent?",
    options: ["Middle box has a different border-radius", "Colors don't match", "Heights vary", "Gap is too large"],
    correctIdx: 0,
    explanation: "The middle box uses rounded-md (~6px) while the others use rounded-xl (~12px). Border-radius should match across siblings.",
    principle: "Consistent Border Radius",
    minLevel: 19, maxLevel: 25,
  },
  {
    render: () => (
      <div className="flex gap-3">
        <div className="px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium">Save</div>
        <div className="px-5 py-2.5 rounded-full bg-slate-600 text-white text-sm font-medium">Cancel</div>
      </div>
    ),
    question: "What design flaw is present?",
    options: ["Buttons have mismatched border-radius styles", "Colors are too similar", "Text is too small", "Buttons are too wide"],
    correctIdx: 0,
    explanation: "Save uses rounded-lg while Cancel uses rounded-full. Related buttons should share the same border-radius.",
    principle: "Button Radius Consistency",
    minLevel: 19, maxLevel: 25,
  },
  {
    render: () => (
      <div className="flex flex-col gap-3 w-64">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-rose-500 shrink-0" /><span className="text-sm text-white">Left aligned label</span></div>
        <div className="flex items-center gap-3 justify-center"><div className="w-10 h-10 rounded-lg bg-rose-500 shrink-0" /><span className="text-sm text-white">Center aligned</span></div>
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-rose-500 shrink-0" /><span className="text-sm text-white">Left aligned label</span></div>
      </div>
    ),
    question: "What's wrong here?",
    options: ["Second row is center-aligned while others are left-aligned", "Icon colors clash", "Text sizes vary", "Gap is too small"],
    correctIdx: 0,
    explanation: "Row 2 is centered, breaking the left-aligned pattern. Consistent alignment creates a clean visual flow.",
    principle: "Alignment Consistency",
    minLevel: 19, maxLevel: 25,
  },
  {
    render: () => (
      <div className="flex gap-3">
        <div className="w-28 rounded-xl overflow-hidden bg-slate-700"><div className="h-16 bg-gradient-to-br from-cyan-500 to-blue-500" /><div className="p-3"><span className="text-xs text-white">Card 1</span></div></div>
        <div className="w-28 rounded-xl overflow-hidden bg-slate-700"><div className="h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-b-xl" /><div className="p-3"><span className="text-xs text-white">Card 2</span></div></div>
        <div className="w-28 rounded-xl overflow-hidden bg-slate-700"><div className="h-16 bg-gradient-to-br from-cyan-500 to-blue-500" /><div className="p-3"><span className="text-xs text-white">Card 3</span></div></div>
      </div>
    ),
    question: "Spot the inconsistency:",
    options: ["Card 2's image has extra rounded corners at the bottom", "Cards have different widths", "Gradient direction varies", "Text sizes differ"],
    correctIdx: 0,
    explanation: "Card 2's image section has extra rounded-b-xl, creating visible inset corners. Image radius should match the container.",
    principle: "Nested Radius",
    minLevel: 19, maxLevel: 25,
  },
  {
    render: () => (
      <div className="w-64 space-y-2">
        <input type="text" readOnly value="Username" className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white text-sm border border-slate-600 outline-none" />
        <input type="text" readOnly value="Email" className="w-full px-3 py-2 rounded bg-slate-700 text-white text-sm border border-slate-600 outline-none" />
        <input type="text" readOnly value="Password" className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white text-sm border border-slate-600 outline-none" />
      </div>
    ),
    question: "What's wrong with these form fields?",
    options: ["Middle input has a different border-radius", "Border colors differ", "Text alignment is off", "Fields are too narrow"],
    correctIdx: 0,
    explanation: "The Email field uses rounded (~4px) while the others use rounded-lg (~8px). Form inputs should have consistent rounding.",
    principle: "Form Input Consistency",
    minLevel: 19, maxLevel: 25,
  },
  {
    render: () => (
      <div className="flex items-center gap-4 w-64">
        <div className="w-12 h-12 rounded-full bg-yellow-500 shrink-0" />
        <div className="flex-1">
          <div className="text-sm text-white font-semibold text-right">John Doe</div>
          <div className="text-xs text-slate-400">Software Engineer</div>
        </div>
      </div>
    ),
    question: "What alignment issue is present?",
    options: ["Name is right-aligned but subtitle is left-aligned", "Avatar is too big", "Text is too small", "Gap is too wide"],
    correctIdx: 0,
    explanation: "The name is right-aligned while the subtitle defaults to left. Text blocks should share the same alignment direction.",
    principle: "Text Direction Consistency",
    minLevel: 19, maxLevel: 25,
  },
  {
    render: () => (
      <div className="flex gap-3">
        <div className="w-24 h-20 rounded-xl border-2 border-blue-500 bg-slate-800 flex items-center justify-center text-xs text-blue-400">Option A</div>
        <div className="w-24 h-20 rounded-xl border border-blue-500 bg-slate-800 flex items-center justify-center text-xs text-blue-400">Option B</div>
        <div className="w-24 h-20 rounded-xl border-2 border-blue-500 bg-slate-800 flex items-center justify-center text-xs text-blue-400">Option C</div>
      </div>
    ),
    question: "Find the subtle inconsistency:",
    options: ["Option B has a thinner border than the others", "Options are different sizes", "Text colors vary", "Border colors differ"],
    correctIdx: 0,
    explanation: "Option B uses border (1px) while A and C use border-2 (2px). Border widths should match for equal-level items.",
    principle: "Border Width Consistency",
    minLevel: 19, maxLevel: 25,
  },

  // ═══ LEVEL 26-32: Poor contrast, hierarchy issues ═══
  {
    render: () => (
      <div className="w-64 p-4 rounded-xl bg-slate-800">
        <div className="text-sm font-bold text-slate-600 mb-2">Important Heading</div>
        <div className="text-xs text-slate-300">This is the body text that describes the content in detail.</div>
      </div>
    ),
    question: "What's the hierarchy problem?",
    options: ["Heading is dimmer than body text (poor contrast hierarchy)", "Body text is too small", "Card padding is wrong", "Background is too dark"],
    correctIdx: 0,
    explanation: "The heading (#475569) is dimmer than body text (#CBD5E1). Headings should have more visual prominence than body text.",
    principle: "Visual Hierarchy",
    minLevel: 26, maxLevel: 32,
  },
  {
    render: () => (
      <div className="w-64 p-4 rounded-xl bg-yellow-400">
        <div className="text-sm text-yellow-100 font-medium">Warning: This is an important alert message.</div>
      </div>
    ),
    question: "What's the contrast issue?",
    options: ["Light text on light yellow background fails contrast requirements", "Card is too narrow", "Font weight is wrong", "Border radius should be smaller"],
    correctIdx: 0,
    explanation: "Light yellow text on a yellow background has very poor contrast (~1.5:1). WCAG requires at least 4.5:1 for text.",
    principle: "Color Contrast",
    minLevel: 26, maxLevel: 32,
  },
  {
    render: () => (
      <div className="w-64 space-y-3">
        <div className="text-sm font-bold text-white">Section Title</div>
        <div className="text-sm font-bold text-white">Subtitle</div>
        <div className="text-sm font-bold text-white">Body text goes here</div>
      </div>
    ),
    question: "What's wrong with this text layout?",
    options: ["All text has the same size and weight (no hierarchy)", "Text is too small", "Line spacing is off", "Text color is wrong"],
    correctIdx: 0,
    explanation: "Title, subtitle, and body all use the same size and bold weight. Without hierarchy, users can't scan content quickly.",
    principle: "Typography Hierarchy",
    minLevel: 26, maxLevel: 32,
  },
  {
    render: () => (
      <div className="flex gap-3">
        <div className="px-8 py-4 rounded-lg bg-blue-600 text-white text-lg font-bold">Submit</div>
        <div className="px-2 py-1 rounded-lg bg-slate-600 text-white text-[10px]">Cancel</div>
      </div>
    ),
    question: "What's the button issue?",
    options: ["Buttons have drastically different sizes (mismatched importance)", "Colors are wrong", "They should be stacked", "Rounded corners are inconsistent"],
    correctIdx: 0,
    explanation: "The Submit button is much larger than Cancel. While primary buttons can be slightly emphasized, this difference is extreme.",
    principle: "Button Size Balance",
    minLevel: 26, maxLevel: 32,
  },
  {
    render: () => (
      <div className="w-64 p-4 rounded-xl bg-slate-800">
        <div className="text-lg font-bold text-white mb-1">Product Name</div>
        <div className="text-lg text-white mb-1">$29.99</div>
        <div className="text-lg text-white mb-1">High quality item for your needs</div>
        <div className="text-lg text-white">★★★★☆</div>
      </div>
    ),
    question: "What hierarchy issue is present?",
    options: ["Everything is the same size — no visual priority", "Card is too wide", "Price should be first", "Rating should be bigger"],
    correctIdx: 0,
    explanation: "All elements are 18px with the same weight. The product name, price, description, and rating should have different visual prominence.",
    principle: "Information Hierarchy",
    minLevel: 26, maxLevel: 32,
  },
  {
    render: () => (
      <div className="w-64 p-4 rounded-xl bg-white">
        <div className="text-sm font-bold text-gray-300 mb-2">Section Heading</div>
        <div className="text-xs text-gray-400">Description text that should be readable.</div>
        <div className="mt-3 px-4 py-2 rounded bg-gray-200 text-gray-300 text-xs text-center">Action Button</div>
      </div>
    ),
    question: "What's the main design flaw?",
    options: ["Everything is too low contrast — washed out and hard to read", "Card is too narrow", "Font choices are wrong", "Rounded corners too large"],
    correctIdx: 0,
    explanation: "Light gray text on white background creates extremely poor contrast. Text and interactive elements need sufficient contrast.",
    principle: "Sufficient Contrast",
    minLevel: 26, maxLevel: 32,
  },
  {
    render: () => (
      <div className="w-64 p-4 rounded-xl bg-slate-800">
        <div className="text-xs text-white font-bold mb-3">MAIN HEADING</div>
        <div className="text-xl text-slate-400 mb-3">This is a subheading</div>
        <div className="text-base text-white">And some body text here.</div>
      </div>
    ),
    question: "What's the hierarchy problem?",
    options: ["Heading is smaller than subheading (inverted hierarchy)", "Body is too large", "Colors are wrong", "Card padding is uneven"],
    correctIdx: 0,
    explanation: "The heading is 12px while the subheading is 20px. Size hierarchy should flow from largest (heading) to smallest (body).",
    principle: "Size Hierarchy",
    minLevel: 26, maxLevel: 32,
  },

  // ═══ LEVEL 33-40: Subtle kerning, 2px differences, border mismatches ═══
  {
    render: () => (
      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-lg bg-slate-700 border border-slate-500" />
        <div className="w-[82px] h-20 rounded-lg bg-slate-700 border border-slate-500" />
        <div className="w-20 h-20 rounded-lg bg-slate-700 border border-slate-500" />
      </div>
    ),
    question: "Spot the subtle difference:",
    options: ["Middle box is slightly wider (82px vs 80px)", "Border colors differ", "Heights are different", "Rounded corners vary"],
    correctIdx: 0,
    explanation: "The middle box is 82px wide instead of 80px — a 2px difference. This subtle misalignment disrupts visual rhythm.",
    principle: "Pixel-Perfect Sizing",
    minLevel: 33, maxLevel: 40,
  },
  {
    render: () => (
      <div className="flex flex-col gap-2 w-56">
        <div className="flex justify-between border-b border-slate-600 pb-2"><span className="text-xs text-slate-300">Item A</span><span className="text-xs text-white">$10</span></div>
        <div className="flex justify-between border-b border-slate-500 pb-2"><span className="text-xs text-slate-300">Item B</span><span className="text-xs text-white">$20</span></div>
        <div className="flex justify-between border-b border-slate-600 pb-2"><span className="text-xs text-slate-300">Item C</span><span className="text-xs text-white">$30</span></div>
      </div>
    ),
    question: "Spot the subtle inconsistency:",
    options: ["Border colors are inconsistent (second row lighter)", "Prices should be left-aligned", "Text is too small", "Padding is wrong"],
    correctIdx: 0,
    explanation: "Row 2 uses border-slate-500 while others use border-slate-600. Even subtle color differences create visual noise.",
    principle: "Consistent Border Color",
    minLevel: 33, maxLevel: 40,
  },
  {
    render: () => (
      <div className="w-64 space-y-3">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-violet-500 shrink-0" /><div><div className="text-sm text-white">Alice</div><div className="text-xs text-slate-400" style={{ letterSpacing: "0.05em" }}>Designer</div></div></div>
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-violet-500 shrink-0" /><div><div className="text-sm text-white">Bob</div><div className="text-xs text-slate-400">Engineer</div></div></div>
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-violet-500 shrink-0" /><div><div className="text-sm text-white">Carol</div><div className="text-xs text-slate-400">Manager</div></div></div>
      </div>
    ),
    question: "Find the subtle design flaw:",
    options: ["First person's subtitle has different letter-spacing", "Avatar sizes differ", "Names should be bold", "Gaps are uneven"],
    correctIdx: 0,
    explanation: "Alice's subtitle uses extra letter-spacing (0.05em) while others use default. Subtle type differences affect visual consistency.",
    principle: "Letter Spacing Consistency",
    minLevel: 33, maxLevel: 40,
  },
  {
    render: () => (
      <div className="flex gap-3">
        <div className="px-4 py-2 rounded-lg border-2 border-emerald-500 text-emerald-400 text-sm">Active</div>
        <div className="px-4 py-2 rounded-lg border border-slate-500 text-slate-400 text-sm">Inactive</div>
        <div className="px-4 py-2 rounded-lg border-2 border-slate-500 text-slate-400 text-sm">Disabled</div>
      </div>
    ),
    question: "Spot the inconsistency between Inactive and Disabled:",
    options: ["Inactive uses 1px border but Disabled uses 2px border", "Text colors are the same", "Padding differs", "Rounded corners differ"],
    correctIdx: 0,
    explanation: "Both inactive states should match: Inactive uses border (1px) but Disabled uses border-2 (2px). Non-active states should be consistent.",
    principle: "State Border Consistency",
    minLevel: 33, maxLevel: 40,
  },
  {
    render: () => (
      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-lg bg-slate-700 shadow-lg" />
        <div className="w-20 h-20 rounded-lg bg-slate-700 shadow-sm" />
        <div className="w-20 h-20 rounded-lg bg-slate-700 shadow-lg" />
      </div>
    ),
    question: "What's subtly wrong?",
    options: ["Middle card has a different shadow depth", "Cards are different sizes", "Border radius varies", "Background colors differ"],
    correctIdx: 0,
    explanation: "The middle card uses shadow-sm while the others use shadow-lg. Inconsistent elevation creates visual unevenness.",
    principle: "Shadow Consistency",
    minLevel: 33, maxLevel: 40,
  },
  {
    render: () => (
      <div className="flex items-center gap-4 w-72 p-3 rounded-xl bg-slate-700">
        <div className="w-12 h-12 rounded-full bg-sky-500 shrink-0" />
        <div className="flex-1">
          <div className="text-sm text-white font-semibold leading-tight">Username</div>
          <div className="text-xs text-slate-400 leading-tight">Online now</div>
        </div>
        <div className="flex gap-1">
          <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center text-xs text-white">💬</div>
          <div className="w-9 h-8 rounded-lg bg-slate-600 flex items-center justify-center text-xs text-white">📞</div>
        </div>
      </div>
    ),
    question: "Spot the subtle icon button issue:",
    options: ["One icon button is 1px wider than the other", "Icon sizes differ", "Gap between icons is wrong", "Rounded corners vary"],
    correctIdx: 0,
    explanation: "The call button is 36px (w-9) wide while chat is 32px (w-8). Icon buttons should be the same dimensions.",
    principle: "Icon Button Consistency",
    minLevel: 33, maxLevel: 40,
  },
  {
    render: () => (
      <div className="w-64 rounded-xl bg-slate-700 overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-pink-500 to-rose-500" />
        <div className="p-4"><div className="text-sm text-white font-bold mb-1">Title</div><div className="text-xs text-slate-300">Description text here</div></div>
        <div className="px-4 pb-4 flex gap-2">
          <div className="flex-1 h-8 rounded-md bg-blue-600 flex items-center justify-center text-xs text-white font-medium">Accept</div>
          <div className="flex-1 h-8 rounded-lg bg-slate-600 flex items-center justify-center text-xs text-white font-medium">Decline</div>
        </div>
      </div>
    ),
    question: "Find the subtle flaw in the buttons:",
    options: ["Accept uses rounded-md and Decline uses rounded-lg", "Button widths differ", "Colors are too similar", "Font sizes vary"],
    correctIdx: 0,
    explanation: "Accept uses rounded-md (~6px) and Decline uses rounded-lg (~8px). Sibling buttons should share the same border-radius.",
    principle: "Paired Button Radius",
    minLevel: 33, maxLevel: 40,
  },
  {
    render: () => (
      <div className="flex gap-3 items-center">
        <div className="text-sm text-white" style={{ fontWeight: 600 }}>Label A</div>
        <div className="text-sm text-white" style={{ fontWeight: 500 }}>Label B</div>
        <div className="text-sm text-white" style={{ fontWeight: 600 }}>Label C</div>
      </div>
    ),
    question: "What's subtly different?",
    options: ["Label B has a slightly lighter font-weight (500 vs 600)", "Text sizes differ", "Colors are different", "Letter spacing varies"],
    correctIdx: 0,
    explanation: "Label B is font-weight 500 (medium) while A and C are 600 (semibold). Subtle weight differences affect visual consistency.",
    principle: "Font Weight Consistency",
    minLevel: 33, maxLevel: 40,
  },

  // ═══ LEVEL 41-50: Orphans, broken grids, accessibility ═══
  {
    render: () => (
      <div className="grid grid-cols-3 gap-3 w-72">
        <div className="h-16 rounded-lg bg-fuchsia-500" />
        <div className="h-16 rounded-lg bg-fuchsia-500" />
        <div className="h-16 rounded-lg bg-fuchsia-500" />
        <div className="h-16 rounded-lg bg-fuchsia-500" />
        <div className="h-16 rounded-lg bg-fuchsia-500" />
        <div className="h-16 rounded-lg bg-fuchsia-500" />
        <div className="h-16 rounded-lg bg-fuchsia-500" />
      </div>
    ),
    question: "What grid issue is present?",
    options: ["Orphan element in the last row (1 of 3 columns filled)", "Grid has too many items", "Colors are wrong", "Gap is inconsistent"],
    correctIdx: 0,
    explanation: "7 items in a 3-column grid creates an orphan in the last row. Incomplete grid rows look unfinished.",
    principle: "Grid Orphans",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => (
      <div className="grid grid-cols-3 gap-3 w-72">
        <div className="h-16 rounded-lg bg-teal-500" />
        <div className="h-16 rounded-lg bg-teal-500 col-span-2" />
        <div className="h-16 rounded-lg bg-teal-500" />
        <div className="h-16 rounded-lg bg-teal-500" />
        <div className="h-16 rounded-lg bg-teal-500" />
      </div>
    ),
    question: "What's wrong with this grid?",
    options: ["Second item spans 2 columns, breaking the uniform grid pattern", "Colors vary", "Gaps are uneven", "Grid has too few items"],
    correctIdx: 0,
    explanation: "One item spans 2 columns in an otherwise uniform grid. Unexpected column spans break visual rhythm.",
    principle: "Grid Consistency",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => (
      <div className="w-72 p-4 rounded-xl bg-slate-800">
        <div className="text-sm text-red-500 font-medium mb-2">Error: Your session has expired</div>
        <div className="flex gap-2">
          <div className="flex-1 h-9 rounded-lg bg-red-500 flex items-center justify-center text-xs text-white font-medium">Retry</div>
          <div className="flex-1 h-9 rounded-lg bg-red-500 flex items-center justify-center text-xs text-white font-medium">Dismiss</div>
        </div>
      </div>
    ),
    question: "What's the accessibility problem?",
    options: ["Both buttons look identical — user can't distinguish primary from secondary action", "Error message is too small", "Card needs a border", "Colors are too bright"],
    correctIdx: 0,
    explanation: "Both actions are styled identically in red. The primary action (Retry) and secondary (Dismiss) should have distinct visual weight.",
    principle: "Action Distinction",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => (
      <div className="w-72 p-4 rounded-xl bg-slate-800">
        <div className="text-sm text-white font-bold mb-3">Select your plan</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500" /><span className="text-sm text-white">Basic — $9/mo</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-slate-500" /><span className="text-sm text-white">Pro — $19/mo</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2 border-slate-500" /><span className="text-sm text-white">Enterprise — $49/mo</span></div>
        </div>
      </div>
    ),
    question: "What's inconsistent about the radio buttons?",
    options: ["Third radio button is square instead of circular", "Colors are inconsistent", "Text sizes differ", "Spacing is uneven"],
    correctIdx: 0,
    explanation: "The Enterprise option uses rounded (square) instead of rounded-full (circle). Radio buttons should all be the same shape.",
    principle: "Form Element Consistency",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => (
      <div className="w-72 space-y-1 text-sm">
        <div className="text-white font-bold">The quick brown fox jumps over the lazy dog. This sentence contains enough words to demonstrate a common typographic issue where a single word ends up alone on the last line of a paragraph which is called an orphan word and is considered bad practice in professional design work.</div>
      </div>
    ),
    question: "What typographic issue could occur in this text?",
    options: ["Orphan words — a single word alone on the last line", "Font is too bold", "Line height is too tight", "Text should be centered"],
    correctIdx: 0,
    explanation: "When a paragraph's last line has only one or two words, it creates an 'orphan' — a typographic flaw that looks incomplete.",
    principle: "Typographic Orphans",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => (
      <div className="w-72 p-4 rounded-xl bg-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-white">Active</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-white">Error</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-sm text-white">Pending</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-3">Status relies only on color to convey meaning.</div>
      </div>
    ),
    question: "What's the accessibility flaw?",
    options: ["Status uses only color to convey meaning — inaccessible for color-blind users", "Dots are too small", "Text needs to be bigger", "Spacing is off"],
    correctIdx: 0,
    explanation: "Color-blind users can't distinguish red/green/yellow dots. Status should use icons, text labels, or patterns alongside color.",
    principle: "Color-Independent Meaning",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => (
      <div className="w-72 p-4 rounded-xl bg-slate-800">
        <div className="text-xs text-slate-500 mb-1">Click the link below</div>
        <div className="text-xs text-blue-400">Click here for more information</div>
        <div className="text-xs text-blue-400 mt-1">Click here to contact us</div>
        <div className="text-xs text-blue-400 mt-1">Click here for pricing</div>
      </div>
    ),
    question: "What usability issue is present?",
    options: ["All links say 'Click here' — non-descriptive link text", "Links are too close together", "Colors are wrong", "Font is too small"],
    correctIdx: 0,
    explanation: "'Click here' is non-descriptive. Links should clearly describe their destination, especially for screen readers.",
    principle: "Descriptive Link Text",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => (
      <div className="w-72 rounded-xl bg-slate-800 overflow-hidden">
        <div className="p-4">
          <div className="text-sm text-white font-bold mb-2">Dashboard</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-12 rounded bg-blue-500/20 flex items-center justify-center text-xs text-blue-300 font-mono">128</div>
            <div className="h-12 rounded bg-green-500/20 flex items-center justify-center text-xs text-green-300 font-mono">342</div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="h-12 rounded bg-purple-500/20 flex items-center justify-center text-xs text-purple-300 font-mono">56</div>
            <div className="h-12 rounded bg-orange-500/20 flex items-center justify-center text-xs text-orange-300 font-mono">89</div>
            <div className="h-12 rounded bg-pink-500/20 flex items-center justify-center text-xs text-pink-300 font-mono">12</div>
          </div>
        </div>
      </div>
    ),
    question: "What layout issue is present?",
    options: ["Mixed 2-column and 3-column grids create broken visual rhythm", "Numbers are too small", "Colors are too muted", "Card padding is wrong"],
    correctIdx: 0,
    explanation: "Switching from a 2-column to 3-column grid within the same card section breaks visual consistency. Use a uniform grid.",
    principle: "Consistent Grid Structure",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => (
      <div className="w-72 p-4 rounded-xl bg-slate-800 space-y-2">
        <div className="h-8 rounded-lg bg-slate-600 flex items-center px-3"><span className="text-xs text-white">☰ Menu</span></div>
        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300">Tag A</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300">Tag B</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300">Tag C</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300">Tag D</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300">Tag E</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300">Tag F</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300">Tag G</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300">Tag H</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300">Tag I</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300">Tag J</span>
        </div>
      </div>
    ),
    question: "What UX issue is present?",
    options: ["Too many tags without truncation or 'show more' — creates visual clutter", "Tag colors are too subtle", "Tags should be larger", "Menu bar is misplaced"],
    correctIdx: 0,
    explanation: "Displaying many tags without truncation or a 'show more' button creates visual overload. Limit visible items and offer expansion.",
    principle: "Content Overflow Management",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => (
      <div className="w-72 p-4 rounded-xl bg-slate-800">
        <div className="text-sm text-white mb-3 font-bold">Form</div>
        <div className="space-y-3">
          <div><div className="text-xs text-slate-400 mb-1">Name</div><div className="h-8 rounded bg-slate-700 px-2 flex items-center text-xs text-white">John</div></div>
          <div><div className="h-8 rounded bg-slate-700 px-2 flex items-center text-xs text-white">john@email.com</div></div>
          <div><div className="text-xs text-slate-400 mb-1">Phone</div><div className="h-8 rounded bg-slate-700 px-2 flex items-center text-xs text-white">555-1234</div></div>
        </div>
      </div>
    ),
    question: "What's wrong with this form?",
    options: ["Second field is missing its label", "Fields are too narrow", "Spacing is inconsistent", "Text is too small"],
    correctIdx: 0,
    explanation: "The Email field has no label. All form fields must have visible labels for usability and accessibility (WCAG).",
    principle: "Form Labels",
    minLevel: 41, maxLevel: 50,
  },
];

// ── Question picker ──

function pickQ(pool: DesignChallenge[], level: number, count: number): DesignChallenge[] {
  const ok = pool.filter(c => level >= c.minLevel - 3 && level <= c.maxLevel + 8);
  return sh(ok.length >= count ? ok : pool).slice(0, count);
}

// ── Component ──

export function DesignEyeGame() {
  useGameMusic();
  const [phase, setPhase] = useState<Phase>("menu");
  const [countdown, setCountdown] = useState(CD);
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));
  const [questions, setQuestions] = useState<DesignChallenge[]>([]);
  const [ci, setCi] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
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
    setQuestions(pickQ(CHALLENGES, 1, QPS)); setCi(0); setSel(null); setScore(0); setCc(0);
    setBs(0); setElapsed(0); setAdaptive(createAdaptiveState(1));
    setCountdown(CD); setAq([]); setAi(0); setPhase("countdown");
  }, []);

  const handleSelect = useCallback((idx: number) => {
    if (phase !== "playing" || sel !== null) return;
    const q = questions[ci]; if (!q) return;
    const ok = idx === q.correctIdx;
    const at = (Date.now() - qs) / 1000;
    setSel(idx);
    const na = adaptiveUpdate(adaptive, ok, ok && at < 5);
    setAdaptive(na);
    if (ok) {
      sfxCorrect(); setCc(c => c + 1);
      const { mult } = getMultiplierFromStreak(na.streak);
      const tb = Math.max(0, Math.round((TL - at) * 5));
      setScore(s => s + Math.round((100 + tb) * mult));
      if (na.streak > 2) sfxCombo(na.streak);
      if (na.streak > bs) setBs(na.streak);
    } else { if (adaptive.streak > 0) sfxStreakLost(); sfxWrong(); }
    setPhase("feedback");
  }, [phase, sel, questions, ci, qs, adaptive, bs]);

  const next = useCallback(() => {
    if (ci + 1 >= questions.length) {
      if (tr.current) clearInterval(tr.current);
      const acc = questions.length > 0 ? Math.round((cc / questions.length) * 100) : 0;
      if (acc >= 100) sfxPerfect();
      else if (acc >= 80) sfxLevelUp();
      else sfxGameOver();
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
      const nx = pickQ(CHALLENGES.filter(q => !used.has(q.question)), Math.floor(adaptive.level), 1);
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
        <h1 className="text-base font-bold text-white tracking-wide">Design Eye</h1>
        <AudioToggles />
      </div>

      {aq.length > 0 && ai < aq.length && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <AchievementToast name={aq[ai].name} tier={aq[ai].tier} onDismiss={() => { if (ai + 1 >= aq.length) setAq([]); setAi(i => i + 1); }} />
        </div>
      )}

      {phase === "menu" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-md">
          <div className="text-5xl mb-3">👁️</div>
          <h2 className="text-3xl font-bold text-white mb-2">Design Eye</h2>
          <p className="text-slate-400 text-sm mb-4">Train your designer's eye! Spot alignment issues, bad spacing, contrast problems, and design flaws. {QPS} questions per session.</p>
          {hi > 0 && <div className="text-xs text-slate-500 mb-4 flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-500" /> Best: {hi.toLocaleString()}</div>}
          <div className="flex gap-2 mb-5">
            <div className="w-8 h-8 rounded bg-slate-700 border border-slate-600" />
            <div className="w-8 h-8 rounded-lg bg-slate-700 border border-blue-500/50" />
            <div className="w-8 h-8 rounded-xl bg-slate-700 border border-violet-500/50" />
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-pink-500/50" />
          </div>
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

          {/* Design specimen */}
          <div className="bg-slate-800/80 rounded-2xl border border-white/5 p-6 flex items-center justify-center min-h-[140px]">
            {q.render()}
          </div>

          <div className="text-center"><h3 className="text-white font-semibold text-base sm:text-lg">{q.question}</h3></div>

          {/* Options */}
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            {q.options.map((o, idx) => {
              const isSel = sel === idx;
              const isOk = idx === q.correctIdx;
              const sr = phase === "feedback";
              let bd = "border-white/10 hover:border-white/30";
              if (sr && isOk) bd = "border-green-500 ring-2 ring-green-500/30";
              else if (sr && isSel && !isOk) bd = "border-red-500 ring-2 ring-red-500/30";
              return (
                <button key={idx} onClick={() => handleSelect(idx)} disabled={phase !== "playing"}
                  className={`relative rounded-xl border-2 ${bd} bg-slate-800/60 p-3 transition-all text-left ${phase === "playing" ? "cursor-pointer hover:bg-slate-700/60 active:scale-[0.98]" : ""}`}>
                  <span className="text-sm text-white">{o}</span>
                  {sr && isOk && <div className="absolute top-1 right-1 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded font-bold">Correct</div>}
                  {sr && isSel && !isOk && <div className="absolute top-1 right-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">Wrong</div>}
                </button>
              );
            })}
          </div>

          {phase === "feedback" && (
            <div className="bg-slate-800/80 rounded-xl p-4 border border-white/5">
              <div className="flex items-start gap-2 mb-2">
                <span className={`text-sm font-bold ${sel === q.correctIdx ? "text-green-400" : "text-red-400"}`}>{sel === q.correctIdx ? "Correct!" : "Not quite!"}</span>
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
          <h3 className="text-2xl font-bold text-white mb-1">{acc === 100 ? "Perfect Eye!" : acc >= 80 ? "Great Designer!" : "Keep Training!"}</h3>
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
