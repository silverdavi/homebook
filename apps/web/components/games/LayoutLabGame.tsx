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

interface LayoutOption {
  id: string;
  render: () => React.ReactNode;
}

interface Challenge {
  question: string;
  options: LayoutOption[];
  correctId: string;
  explanation: string;
  principle: string;
  minLevel: number;
  maxLevel: number;
}

// ── Constants ──

const GAME_ID = "layout-lab";
const QPS = 10;
const CD = 3;
const TL = 15;

function sh<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

const OL = ["A", "B", "C", "D"];

function Bx({ c = "bg-indigo-500", w = "w-8", h = "h-8", className = "" }: { c?: string; w?: string; h?: string; className?: string }) {
  return <div className={`${w} ${h} ${c} rounded ${className}`} />;
}

// ── Challenge Bank ──

const CH: Challenge[] = [
  // LEVEL 1-10: Basic alignment
  { question: "Which row has all items centered?", options: [
    { id: "a", render: () => <div className="flex items-start justify-start gap-2 w-full h-full p-2"><Bx /><Bx /><Bx /></div> },
    { id: "b", render: () => <div className="flex items-center justify-center gap-2 w-full h-full p-2"><Bx /><Bx /><Bx /></div> },
    { id: "c", render: () => <div className="flex items-end justify-end gap-2 w-full h-full p-2"><Bx /><Bx /><Bx /></div> },
    { id: "d", render: () => <div className="flex items-center justify-start gap-2 w-full h-full p-2"><Bx /><Bx /><Bx /></div> },
  ], correctId: "b", explanation: "Centered layout uses both horizontal and vertical centering.", principle: "Centering", minLevel: 1, maxLevel: 10 },

  { question: "Which layout has equal spacing between items?", options: [
    { id: "a", render: () => <div className="flex items-center justify-between w-full h-full p-2"><Bx /><Bx /><Bx /></div> },
    { id: "b", render: () => <div className="flex items-center justify-start gap-1 w-full h-full p-2"><Bx /><Bx /><Bx /></div> },
    { id: "c", render: () => <div className="flex items-center justify-end gap-1 w-full h-full p-2"><Bx /><Bx /><Bx /></div> },
  ], correctId: "a", explanation: "justify-between distributes items with equal space between them.", principle: "Even Distribution", minLevel: 1, maxLevel: 10 },

  { question: "Which items are aligned to the bottom?", options: [
    { id: "a", render: () => <div className="flex items-start gap-2 w-full h-full p-2"><Bx h="h-6" /><Bx h="h-10" /><Bx h="h-4" /></div> },
    { id: "b", render: () => <div className="flex items-center gap-2 w-full h-full p-2"><Bx h="h-6" /><Bx h="h-10" /><Bx h="h-4" /></div> },
    { id: "c", render: () => <div className="flex items-end gap-2 w-full h-full p-2"><Bx h="h-6" /><Bx h="h-10" /><Bx h="h-4" /></div> },
  ], correctId: "c", explanation: "align-items: flex-end aligns all items to the bottom.", principle: "Bottom Alignment", minLevel: 1, maxLevel: 10 },

  { question: "Which layout stacks items vertically?", options: [
    { id: "a", render: () => <div className="flex flex-row gap-2 items-center justify-center w-full h-full p-2"><Bx /><Bx /><Bx /></div> },
    { id: "b", render: () => <div className="flex flex-col gap-2 items-center justify-center w-full h-full p-2"><Bx /><Bx /><Bx /></div> },
    { id: "c", render: () => <div className="flex flex-row-reverse gap-2 items-center justify-center w-full h-full p-2"><Bx /><Bx /><Bx /></div> },
  ], correctId: "b", explanation: "flex-direction: column arranges items from top to bottom.", principle: "Vertical Stack", minLevel: 1, maxLevel: 10 },

  { question: "Which has items spread evenly with space around them?", options: [
    { id: "a", render: () => <div className="flex items-center justify-evenly w-full h-full p-2"><Bx /><Bx /><Bx /></div> },
    { id: "b", render: () => <div className="flex items-center justify-start gap-8 w-full h-full p-2"><Bx /><Bx /><Bx /></div> },
    { id: "c", render: () => <div className="flex items-center justify-center gap-1 w-full h-full p-2"><Bx /><Bx /><Bx /></div> },
  ], correctId: "a", explanation: "justify-evenly distributes equal space around every item.", principle: "Even Spacing", minLevel: 1, maxLevel: 10 },

  { question: "Which aligns all items to the left?", options: [
    { id: "a", render: () => <div className="flex flex-col items-center gap-1 w-full h-full p-2"><div className="w-20 h-2 bg-slate-400/60 rounded" /><div className="w-16 h-2 bg-slate-400/60 rounded" /><div className="w-24 h-2 bg-slate-400/60 rounded" /></div> },
    { id: "b", render: () => <div className="flex flex-col items-start gap-1 w-full h-full p-2"><div className="w-20 h-2 bg-slate-400/60 rounded" /><div className="w-16 h-2 bg-slate-400/60 rounded" /><div className="w-24 h-2 bg-slate-400/60 rounded" /></div> },
    { id: "c", render: () => <div className="flex flex-col items-end gap-1 w-full h-full p-2"><div className="w-20 h-2 bg-slate-400/60 rounded" /><div className="w-16 h-2 bg-slate-400/60 rounded" /><div className="w-24 h-2 bg-slate-400/60 rounded" /></div> },
  ], correctId: "b", explanation: "align-items: flex-start aligns items to the left edge.", principle: "Left Alignment", minLevel: 1, maxLevel: 10 },

  { question: "Which has items that fill the full width?", options: [
    { id: "a", render: () => <div className="flex flex-col items-start gap-1 w-full h-full p-2"><div className="w-16 h-3 bg-indigo-500 rounded" /><div className="w-20 h-3 bg-indigo-500 rounded" /></div> },
    { id: "b", render: () => <div className="flex flex-col items-stretch gap-1 w-full h-full p-2"><div className="h-3 bg-indigo-500 rounded" /><div className="h-3 bg-indigo-500 rounded" /></div> },
    { id: "c", render: () => <div className="flex flex-col items-center gap-1 w-full h-full p-2"><div className="w-16 h-3 bg-indigo-500 rounded" /><div className="w-16 h-3 bg-indigo-500 rounded" /></div> },
  ], correctId: "b", explanation: "align-items: stretch makes items fill the container width.", principle: "Stretch", minLevel: 1, maxLevel: 10 },

  { question: "Which wraps items onto multiple lines?", options: [
    { id: "a", render: () => <div className="flex flex-nowrap gap-1 w-full h-full p-2 overflow-hidden"><Bx w="w-7" h="h-7" /><Bx w="w-7" h="h-7" /><Bx w="w-7" h="h-7" /><Bx w="w-7" h="h-7" /><Bx w="w-7" h="h-7" /><Bx w="w-7" h="h-7" /></div> },
    { id: "b", render: () => <div className="flex flex-wrap gap-1 w-full h-full p-2"><Bx w="w-7" h="h-7" /><Bx w="w-7" h="h-7" /><Bx w="w-7" h="h-7" /><Bx w="w-7" h="h-7" /><Bx w="w-7" h="h-7" /><Bx w="w-7" h="h-7" /></div> },
    { id: "c", render: () => <div className="flex flex-col gap-1 w-full h-full p-2"><Bx w="w-7" h="h-7" /><Bx w="w-7" h="h-7" /><Bx w="w-7" h="h-7" /></div> },
  ], correctId: "b", explanation: "flex-wrap allows items to flow onto the next line.", principle: "Wrapping", minLevel: 1, maxLevel: 10 },

  { question: "Which pushes the last item to the right?", options: [
    { id: "a", render: () => <div className="flex items-center gap-2 w-full h-full p-2"><Bx /><Bx /><Bx className="ml-auto" c="bg-amber-500" /></div> },
    { id: "b", render: () => <div className="flex items-center gap-2 w-full h-full p-2"><Bx /><Bx /><Bx c="bg-amber-500" /></div> },
    { id: "c", render: () => <div className="flex items-center justify-end gap-2 w-full h-full p-2"><Bx /><Bx /><Bx c="bg-amber-500" /></div> },
  ], correctId: "a", explanation: "margin-left: auto pushes a single item to the far right.", principle: "Auto Margin", minLevel: 1, maxLevel: 10 },

  { question: "Which has a gap between each item?", options: [
    { id: "a", render: () => <div className="flex items-center w-full h-full p-2"><Bx /><Bx /><Bx /></div> },
    { id: "b", render: () => <div className="flex items-center gap-3 w-full h-full p-2"><Bx /><Bx /><Bx /></div> },
    { id: "c", render: () => <div className="flex items-center w-full h-full p-2"><Bx className="mr-8" /><Bx /><Bx /></div> },
  ], correctId: "b", explanation: "The gap property adds equal spacing between flex items.", principle: "Gap Property", minLevel: 1, maxLevel: 10 },

  // LEVEL 11-18: Distribution & patterns
  { question: "Which card has equal padding on all sides?", options: [
    { id: "a", render: () => <div className="w-full h-full flex items-center justify-center p-2"><div className="border-2 border-dashed border-slate-400 p-4 rounded"><div className="w-12 h-6 bg-indigo-500 rounded" /></div></div> },
    { id: "b", render: () => <div className="w-full h-full flex items-center justify-center p-2"><div className="border-2 border-dashed border-slate-400 pt-1 pb-6 px-4 rounded"><div className="w-12 h-6 bg-indigo-500 rounded" /></div></div> },
    { id: "c", render: () => <div className="w-full h-full flex items-center justify-center p-2"><div className="border-2 border-dashed border-slate-400 pl-8 pr-2 py-2 rounded"><div className="w-12 h-6 bg-indigo-500 rounded" /></div></div> },
  ], correctId: "a", explanation: "Equal padding creates balanced space around content.", principle: "Consistent Padding", minLevel: 11, maxLevel: 18 },

  { question: "These 4 icons should be evenly spaced. Which is correct?", options: [
    { id: "a", render: () => <div className="flex items-center justify-evenly w-full h-full p-2"><Bx w="w-6" h="h-6" c="bg-cyan-500" /><Bx w="w-6" h="h-6" c="bg-cyan-500" /><Bx w="w-6" h="h-6" c="bg-cyan-500" /><Bx w="w-6" h="h-6" c="bg-cyan-500" /></div> },
    { id: "b", render: () => <div className="flex items-center gap-1 w-full h-full p-2"><Bx w="w-6" h="h-6" c="bg-cyan-500" /><Bx w="w-6" h="h-6" c="bg-cyan-500" /><div className="flex-1" /><Bx w="w-6" h="h-6" c="bg-cyan-500" /><Bx w="w-6" h="h-6" c="bg-cyan-500" /></div> },
    { id: "c", render: () => <div className="flex items-center justify-start gap-2 w-full h-full p-2"><Bx w="w-6" h="h-6" c="bg-cyan-500" /><Bx w="w-6" h="h-6" c="bg-cyan-500" /><Bx w="w-6" h="h-6" c="bg-cyan-500" /><Bx w="w-6" h="h-6" c="bg-cyan-500" /></div> },
  ], correctId: "a", explanation: "justify-evenly distributes all items with equal spacing.", principle: "Even Distribution", minLevel: 11, maxLevel: 18 },

  { question: "Which has equal-width columns?", options: [
    { id: "a", render: () => <div className="flex gap-1 w-full h-full p-2"><div className="flex-1 h-12 bg-indigo-500/60 rounded" /><div className="flex-1 h-12 bg-indigo-500/60 rounded" /><div className="flex-1 h-12 bg-indigo-500/60 rounded" /></div> },
    { id: "b", render: () => <div className="flex gap-1 w-full h-full p-2"><div className="w-8 h-12 bg-indigo-500/60 rounded" /><div className="w-16 h-12 bg-indigo-500/60 rounded" /><div className="w-10 h-12 bg-indigo-500/60 rounded" /></div> },
    { id: "c", render: () => <div className="flex gap-1 w-full h-full p-2"><div className="w-20 h-12 bg-indigo-500/60 rounded" /><div className="w-6 h-12 bg-indigo-500/60 rounded" /><div className="w-12 h-12 bg-indigo-500/60 rounded" /></div> },
  ], correctId: "a", explanation: "flex: 1 makes each column grow equally.", principle: "Equal Flex", minLevel: 11, maxLevel: 18 },

  { question: "Which has a centered title and left-aligned body?", options: [
    { id: "a", render: () => <div className="w-full h-full flex items-center justify-center p-2"><div className="flex flex-col gap-1 w-32"><div className="h-3 bg-white/80 rounded w-20 mx-auto" /><div className="h-2 bg-slate-400/50 rounded w-28" /><div className="h-2 bg-slate-400/50 rounded w-24" /></div></div> },
    { id: "b", render: () => <div className="w-full h-full flex items-center justify-center p-2"><div className="flex flex-col gap-1 items-center w-32"><div className="h-3 bg-white/80 rounded w-20" /><div className="h-2 bg-slate-400/50 rounded w-28" /><div className="h-2 bg-slate-400/50 rounded w-24" /></div></div> },
    { id: "c", render: () => <div className="w-full h-full flex items-center justify-center p-2"><div className="flex flex-col gap-1 items-end w-32"><div className="h-3 bg-white/80 rounded w-20" /><div className="h-2 bg-slate-400/50 rounded w-28" /><div className="h-2 bg-slate-400/50 rounded w-24" /></div></div> },
  ], correctId: "a", explanation: "Centered title + left body is a common readable pattern.", principle: "Mixed Alignment", minLevel: 11, maxLevel: 18 },

  { question: "Which sidebar keeps the sidebar fixed-width?", options: [
    { id: "a", render: () => <div className="flex gap-1 w-full h-full p-2"><div className="w-10 bg-slate-600 rounded h-full shrink-0" /><div className="flex-1 bg-indigo-500/40 rounded h-full" /></div> },
    { id: "b", render: () => <div className="flex gap-1 w-full h-full p-2"><div className="flex-1 bg-slate-600 rounded h-full" /><div className="flex-1 bg-indigo-500/40 rounded h-full" /></div> },
    { id: "c", render: () => <div className="flex flex-col gap-1 w-full h-full p-2"><div className="w-full h-10 bg-slate-600 rounded" /><div className="flex-1 bg-indigo-500/40 rounded" /></div> },
  ], correctId: "a", explanation: "Fixed sidebar + flex-1 content is the classic sidebar pattern.", principle: "Sidebar Layout", minLevel: 11, maxLevel: 18 },

  { question: "Which navbar has logo left, buttons right?", options: [
    { id: "a", render: () => <div className="flex items-center justify-between w-full h-full px-3 py-2"><div className="w-8 h-5 bg-amber-500 rounded" /><div className="flex gap-1"><Bx w="w-6" h="h-4" c="bg-slate-400" /><Bx w="w-6" h="h-4" c="bg-indigo-500" /></div></div> },
    { id: "b", render: () => <div className="flex items-center justify-center w-full h-full px-3 py-2 gap-2"><div className="w-8 h-5 bg-amber-500 rounded" /><Bx w="w-6" h="h-4" c="bg-indigo-500" /></div> },
    { id: "c", render: () => <div className="flex items-center justify-end w-full h-full px-3 py-2 gap-2"><div className="w-8 h-5 bg-amber-500 rounded" /><Bx w="w-6" h="h-4" c="bg-indigo-500" /></div> },
  ], correctId: "a", explanation: "justify-between pushes logo left and nav items right.", principle: "Navbar Pattern", minLevel: 11, maxLevel: 18 },

  { question: "Which keeps a footer at the bottom?", options: [
    { id: "a", render: () => <div className="flex flex-col w-full h-full"><div className="flex-1 bg-slate-700/30 rounded-t p-2"><div className="h-2 w-16 bg-slate-400/40 rounded mb-1" /><div className="h-2 w-20 bg-slate-400/40 rounded" /></div><div className="h-6 bg-indigo-500/40 rounded-b flex items-center justify-center"><div className="h-1.5 w-12 bg-white/30 rounded" /></div></div> },
    { id: "b", render: () => <div className="flex flex-col w-full h-full"><div className="bg-slate-700/30 rounded-t p-2"><div className="h-2 w-16 bg-slate-400/40 rounded mb-1" /><div className="h-2 w-20 bg-slate-400/40 rounded" /></div><div className="h-6 bg-indigo-500/40 rounded-b" /></div> },
    { id: "c", render: () => <div className="flex flex-col items-center justify-center gap-1 w-full h-full p-2"><div className="h-2 w-16 bg-slate-400/40 rounded" /><div className="h-6 w-full bg-indigo-500/40 rounded" /></div> },
  ], correctId: "a", explanation: "flex-col with flex-1 content pushes footer to the bottom.", principle: "Sticky Footer", minLevel: 11, maxLevel: 18 },

  { question: "Which has consistent spacing between AND edges?", options: [
    { id: "a", render: () => <div className="flex items-center justify-around w-full h-full p-3"><Bx w="w-6" h="h-6" /><Bx w="w-6" h="h-6" /><Bx w="w-6" h="h-6" /></div> },
    { id: "b", render: () => <div className="flex items-center justify-between w-full h-full p-1"><Bx w="w-6" h="h-6" /><Bx w="w-6" h="h-6" /><Bx w="w-6" h="h-6" /></div> },
    { id: "c", render: () => <div className="flex items-center justify-start gap-6 w-full h-full p-1"><Bx w="w-6" h="h-6" /><Bx w="w-6" h="h-6" /><Bx w="w-6" h="h-6" /></div> },
  ], correctId: "a", explanation: "justify-around gives each item equal space on both sides.", principle: "Space Around", minLevel: 11, maxLevel: 18 },

  // LEVEL 19-25: Grid layouts
  { question: "Which is a proper 2x2 grid?", options: [
    { id: "a", render: () => <div className="grid grid-cols-2 gap-1 w-full h-full p-2"><div className="bg-indigo-500/50 rounded h-10" /><div className="bg-indigo-500/50 rounded h-10" /><div className="bg-indigo-500/50 rounded h-10" /><div className="bg-indigo-500/50 rounded h-10" /></div> },
    { id: "b", render: () => <div className="flex flex-wrap gap-1 w-full h-full p-2"><div className="w-12 h-10 bg-indigo-500/50 rounded" /><div className="w-12 h-10 bg-indigo-500/50 rounded" /><div className="w-12 h-10 bg-indigo-500/50 rounded" /><div className="w-12 h-10 bg-indigo-500/50 rounded" /></div> },
    { id: "c", render: () => <div className="grid grid-cols-3 gap-1 w-full h-full p-2"><div className="bg-indigo-500/50 rounded h-10" /><div className="bg-indigo-500/50 rounded h-10" /><div className="bg-indigo-500/50 rounded h-10" /><div className="bg-indigo-500/50 rounded h-10" /></div> },
  ], correctId: "a", explanation: "CSS Grid with grid-cols-2 creates a perfect 2x2 grid.", principle: "CSS Grid", minLevel: 19, maxLevel: 25 },

  { question: "Which grid has items spanning multiple columns?", options: [
    { id: "a", render: () => <div className="grid grid-cols-3 gap-1 w-full h-full p-2"><div className="col-span-2 bg-amber-500/50 rounded h-8" /><div className="bg-indigo-500/50 rounded h-8" /><div className="bg-indigo-500/50 rounded h-8" /><div className="col-span-2 bg-amber-500/50 rounded h-8" /></div> },
    { id: "b", render: () => <div className="grid grid-cols-3 gap-1 w-full h-full p-2">{[1,2,3,4,5,6].map(i=><div key={i} className="bg-indigo-500/50 rounded h-8" />)}</div> },
    { id: "c", render: () => <div className="flex flex-wrap gap-1 w-full h-full p-2"><div className="w-full h-8 bg-amber-500/50 rounded" /><div className="w-12 h-8 bg-indigo-500/50 rounded" /><div className="w-12 h-8 bg-indigo-500/50 rounded" /></div> },
  ], correctId: "a", explanation: "col-span-2 makes an item stretch across 2 columns.", principle: "Column Spanning", minLevel: 19, maxLevel: 25 },

  { question: "How many columns does this grid have?", options: [
    { id: "a", render: () => <div className="w-full h-full p-2 flex flex-col gap-1"><div className="text-[10px] text-slate-400">Count the columns:</div><div className="grid grid-cols-4 gap-1">{[1,2,3,4,5,6,7,8].map(i=><div key={i} className="bg-indigo-500/50 rounded h-6" />)}</div><div className="text-center text-xs text-white font-bold mt-1">3 columns</div></div> },
    { id: "b", render: () => <div className="w-full h-full p-2 flex flex-col gap-1"><div className="text-[10px] text-slate-400">Count the columns:</div><div className="grid grid-cols-4 gap-1">{[1,2,3,4,5,6,7,8].map(i=><div key={i} className="bg-indigo-500/50 rounded h-6" />)}</div><div className="text-center text-xs text-white font-bold mt-1">4 columns</div></div> },
    { id: "c", render: () => <div className="w-full h-full p-2 flex flex-col gap-1"><div className="text-[10px] text-slate-400">Count the columns:</div><div className="grid grid-cols-4 gap-1">{[1,2,3,4,5,6,7,8].map(i=><div key={i} className="bg-indigo-500/50 rounded h-6" />)}</div><div className="text-center text-xs text-white font-bold mt-1">2 columns</div></div> },
  ], correctId: "b", explanation: "This grid has 4 columns (4 boxes per row).", principle: "Grid Column Count", minLevel: 19, maxLevel: 25 },

  { question: "Which centers a card both horizontally and vertically?", options: [
    { id: "a", render: () => <div className="w-full h-full flex items-start justify-start p-2"><div className="w-16 h-10 bg-indigo-500 rounded shadow-lg" /></div> },
    { id: "b", render: () => <div className="grid place-items-center w-full h-full"><div className="w-16 h-10 bg-indigo-500 rounded shadow-lg" /></div> },
    { id: "c", render: () => <div className="w-full h-full flex items-end justify-center p-2"><div className="w-16 h-10 bg-indigo-500 rounded shadow-lg" /></div> },
  ], correctId: "b", explanation: "place-items: center is the simplest way to center both ways.", principle: "Grid Centering", minLevel: 19, maxLevel: 25 },

  { question: "Which grid has a full-width header?", options: [
    { id: "a", render: () => <div className="grid grid-cols-2 gap-1 w-full h-full p-2"><div className="col-span-2 h-6 bg-amber-500/60 rounded" /><div className="h-16 bg-slate-600/50 rounded" /><div className="h-16 bg-indigo-500/40 rounded" /></div> },
    { id: "b", render: () => <div className="grid grid-cols-2 gap-1 w-full h-full p-2"><div className="h-6 bg-amber-500/60 rounded" /><div className="h-6 bg-amber-500/60 rounded" /><div className="h-16 bg-slate-600/50 rounded" /><div className="h-16 bg-indigo-500/40 rounded" /></div> },
  ], correctId: "a", explanation: "col-span-2 stretches the header across both columns.", principle: "Full-Width Header", minLevel: 19, maxLevel: 25 },

  { question: "Which is a 3-column card gallery?", options: [
    { id: "a", render: () => <div className="grid grid-cols-3 gap-1 w-full h-full p-2">{[1,2,3,4,5,6].map(i=><div key={i} className="bg-indigo-500/40 rounded h-10 flex items-center justify-center text-[8px] text-white/50">Card</div>)}</div> },
    { id: "b", render: () => <div className="flex flex-wrap gap-1 w-full h-full p-2">{[1,2,3,4,5,6].map(i=><div key={i} className="w-10 h-10 bg-indigo-500/40 rounded" />)}</div> },
    { id: "c", render: () => <div className="grid grid-cols-2 gap-1 w-full h-full p-2">{[1,2,3,4,5,6].map(i=><div key={i} className="bg-indigo-500/40 rounded h-10" />)}</div> },
  ], correctId: "a", explanation: "grid-cols-3 creates a 3-column grid for cards.", principle: "Card Grid", minLevel: 19, maxLevel: 25 },

  { question: "Which has a masonry-like pattern?", options: [
    { id: "a", render: () => <div className="grid grid-cols-2 gap-1 w-full h-full p-2"><div className="bg-indigo-500/50 rounded h-12" /><div className="bg-indigo-500/50 rounded h-8" /><div className="bg-indigo-500/50 rounded h-6" /><div className="bg-indigo-500/50 rounded h-14" /></div> },
    { id: "b", render: () => <div className="grid grid-cols-2 gap-1 w-full h-full p-2"><div className="bg-indigo-500/50 rounded h-8" /><div className="bg-indigo-500/50 rounded h-8" /><div className="bg-indigo-500/50 rounded h-8" /><div className="bg-indigo-500/50 rounded h-8" /></div> },
  ], correctId: "a", explanation: "Masonry: items of varying heights in columns create a staggered look.", principle: "Masonry Layout", minLevel: 19, maxLevel: 25 },

  // LEVEL 26-32: Visual hierarchy
  { question: "Which correctly prioritizes the main action?", options: [
    { id: "a", render: () => <div className="flex flex-col items-center gap-2 w-full h-full justify-center p-3"><div className="px-6 py-2 bg-indigo-500 rounded-lg text-[10px] text-white font-bold">Sign Up</div><div className="px-4 py-1.5 bg-transparent border border-slate-500 rounded-lg text-[10px] text-slate-400">Learn More</div></div> },
    { id: "b", render: () => <div className="flex flex-col items-center gap-2 w-full h-full justify-center p-3"><div className="px-4 py-1.5 bg-slate-600 rounded-lg text-[10px] text-slate-300">Sign Up</div><div className="px-4 py-1.5 bg-slate-600 rounded-lg text-[10px] text-slate-300">Learn More</div></div> },
    { id: "c", render: () => <div className="flex flex-col items-center gap-2 w-full h-full justify-center p-3"><div className="px-4 py-1.5 border border-slate-500 rounded-lg text-[10px] text-slate-400">Sign Up</div><div className="px-6 py-2 bg-indigo-500 rounded-lg text-[10px] text-white font-bold">Learn More</div></div> },
  ], correctId: "a", explanation: "Primary action should be visually prominent; secondary is subtler.", principle: "Button Hierarchy", minLevel: 26, maxLevel: 32 },

  { question: "Where should the most important element be?", options: [
    { id: "a", render: () => <div className="w-full h-full p-2 relative"><div className="absolute top-2 left-2 w-12 h-6 bg-amber-500 rounded text-[8px] text-white flex items-center justify-center font-bold">CTA</div><div className="absolute bottom-2 right-2 w-8 h-4 bg-slate-600 rounded" /></div> },
    { id: "b", render: () => <div className="w-full h-full p-2 relative"><div className="absolute bottom-2 right-2 w-12 h-6 bg-amber-500 rounded text-[8px] text-white flex items-center justify-center font-bold">CTA</div><div className="absolute top-2 left-2 w-8 h-4 bg-slate-600 rounded" /></div> },
    { id: "c", render: () => <div className="w-full h-full p-2 relative"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-6 bg-amber-500 rounded text-[8px] text-white flex items-center justify-center font-bold">CTA</div></div> },
  ], correctId: "a", explanation: "In left-to-right reading, the eye starts at top-left.", principle: "F-Pattern Reading", minLevel: 26, maxLevel: 32 },

  { question: "Which follows the Z-pattern reading order?", options: [
    { id: "a", render: () => <div className="w-full h-full p-2 flex flex-col justify-between"><div className="flex justify-between items-center"><div className="w-8 h-4 bg-amber-500 rounded" /><div className="flex gap-1"><Bx w="w-4" h="h-3" c="bg-slate-500" /><Bx w="w-4" h="h-3" c="bg-slate-500" /></div></div><div className="flex justify-center"><div className="w-20 h-8 bg-indigo-500/30 rounded" /></div><div className="flex justify-between items-center"><div className="w-16 h-2 bg-slate-600 rounded" /><div className="w-10 h-5 bg-indigo-500 rounded text-[7px] text-white flex items-center justify-center">Action</div></div></div> },
    { id: "b", render: () => <div className="w-full h-full p-2 flex flex-col items-center justify-center gap-1"><div className="w-8 h-4 bg-amber-500 rounded" /><div className="w-20 h-8 bg-indigo-500/30 rounded" /><div className="w-10 h-5 bg-indigo-500 rounded text-[7px] text-white flex items-center justify-center">Action</div></div> },
  ], correctId: "a", explanation: "Z-pattern: top-left → top-right → center → bottom-left → bottom-right.", principle: "Z-Pattern Layout", minLevel: 26, maxLevel: 32 },

  { question: "Which heading hierarchy is correct?", options: [
    { id: "a", render: () => <div className="flex flex-col gap-1 w-full h-full justify-center p-3"><div className="h-4 w-28 bg-white rounded" /><div className="h-3 w-20 bg-white/60 rounded" /><div className="h-2 w-32 bg-slate-400/50 rounded" /><div className="h-2 w-28 bg-slate-400/50 rounded" /></div> },
    { id: "b", render: () => <div className="flex flex-col gap-1 w-full h-full justify-center p-3"><div className="h-2 w-28 bg-white/40 rounded" /><div className="h-3 w-20 bg-white/60 rounded" /><div className="h-4 w-32 bg-white rounded" /></div> },
    { id: "c", render: () => <div className="flex flex-col gap-1 w-full h-full justify-center p-3"><div className="h-3 w-28 bg-white/60 rounded" /><div className="h-3 w-20 bg-white/60 rounded" /><div className="h-3 w-32 bg-white/60 rounded" /></div> },
  ], correctId: "a", explanation: "Headings decrease in size: H1 → H2 → body text.", principle: "Typographic Hierarchy", minLevel: 26, maxLevel: 32 },

  { question: "Which groups related items together?", options: [
    { id: "a", render: () => <div className="flex flex-col gap-3 w-full h-full p-2"><div className="flex flex-col gap-0.5"><div className="h-2 w-14 bg-white/70 rounded" /><div className="h-1.5 w-24 bg-slate-400/40 rounded" /><div className="h-1.5 w-20 bg-slate-400/40 rounded" /></div><div className="flex flex-col gap-0.5"><div className="h-2 w-12 bg-white/70 rounded" /><div className="h-1.5 w-20 bg-slate-400/40 rounded" /><div className="h-1.5 w-16 bg-slate-400/40 rounded" /></div></div> },
    { id: "b", render: () => <div className="flex flex-col gap-1 w-full h-full p-2"><div className="h-2 w-14 bg-white/70 rounded" /><div className="h-1.5 w-24 bg-slate-400/40 rounded" /><div className="h-1.5 w-20 bg-slate-400/40 rounded" /><div className="h-2 w-12 bg-white/70 rounded" /><div className="h-1.5 w-20 bg-slate-400/40 rounded" /><div className="h-1.5 w-16 bg-slate-400/40 rounded" /></div> },
  ], correctId: "a", explanation: "Gestalt proximity: related items close together, larger space between groups.", principle: "Gestalt Proximity", minLevel: 26, maxLevel: 32 },

  { question: "Which card uses whitespace effectively?", options: [
    { id: "a", render: () => <div className="w-full h-full flex items-center justify-center p-2"><div className="bg-slate-700 rounded-lg p-4 flex flex-col gap-2 w-28"><div className="h-2.5 w-20 bg-white/80 rounded" /><div className="h-2 w-full bg-slate-400/40 rounded" /><div className="mt-1 h-5 w-14 bg-indigo-500 rounded text-[7px] text-white flex items-center justify-center">Go</div></div></div> },
    { id: "b", render: () => <div className="w-full h-full flex items-center justify-center p-2"><div className="bg-slate-700 rounded-lg p-1 flex flex-col gap-0.5 w-28"><div className="h-2.5 w-20 bg-white/80 rounded" /><div className="h-2 w-full bg-slate-400/40 rounded" /><div className="h-5 w-14 bg-indigo-500 rounded text-[7px] text-white flex items-center justify-center">Go</div></div></div> },
  ], correctId: "a", explanation: "Consistent padding + spacing between elements = good whitespace.", principle: "Whitespace", minLevel: 26, maxLevel: 32 },

  { question: "Which creates clear visual flow top to bottom?", options: [
    { id: "a", render: () => <div className="flex flex-col w-full h-full p-2 gap-1.5"><div className="h-3.5 w-24 bg-white rounded" /><div className="h-2 w-full bg-slate-400/40 rounded" /><div className="flex gap-1 mt-1"><div className="h-8 flex-1 bg-indigo-500/30 rounded" /><div className="h-8 flex-1 bg-indigo-500/30 rounded" /><div className="h-8 flex-1 bg-indigo-500/30 rounded" /></div><div className="h-5 w-16 bg-indigo-500 rounded mx-auto mt-1 text-[7px] text-white flex items-center justify-center">CTA</div></div> },
    { id: "b", render: () => <div className="flex flex-col w-full h-full p-2 gap-1"><div className="flex gap-1"><div className="h-8 flex-1 bg-indigo-500/30 rounded" /><div className="h-8 flex-1 bg-indigo-500/30 rounded" /></div><div className="h-3.5 w-24 bg-white rounded" /><div className="h-5 w-16 bg-indigo-500 rounded text-[7px] text-white flex items-center justify-center">CTA</div><div className="h-2 w-full bg-slate-400/40 rounded" /></div> },
  ], correctId: "a", explanation: "Natural flow: headline → body → cards → CTA.", principle: "Content Flow", minLevel: 26, maxLevel: 32 },

  // LEVEL 33-40: Composition
  { question: "Which uses the rule of thirds?", options: [
    { id: "a", render: () => <div className="w-full h-full relative bg-gradient-to-br from-slate-800 to-slate-700"><div className="absolute" style={{top:"33%",left:"33%",transform:"translate(-50%,-50%)"}}><div className="w-14 h-8 bg-indigo-500/70 rounded" /></div><div className="absolute" style={{bottom:"33%",right:"25%"}}><div className="w-8 h-4 bg-amber-500/50 rounded text-[7px] text-white flex items-center justify-center">CTA</div></div></div> },
    { id: "b", render: () => <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-700"><div className="w-14 h-8 bg-indigo-500/70 rounded" /></div> },
    { id: "c", render: () => <div className="w-full h-full relative bg-gradient-to-br from-slate-800 to-slate-700"><div className="absolute top-1 left-1"><div className="w-14 h-8 bg-indigo-500/70 rounded" /></div><div className="absolute top-1 right-1"><div className="w-8 h-4 bg-amber-500/50 rounded" /></div><div className="absolute bottom-1 left-1"><div className="w-10 h-6 bg-green-500/50 rounded" /></div><div className="absolute bottom-1 right-1"><div className="w-8 h-4 bg-red-500/50 rounded" /></div></div> },
  ], correctId: "a", explanation: "Rule of thirds places key elements at 3x3 grid intersections.", principle: "Rule of Thirds", minLevel: 33, maxLevel: 40 },

  { question: "Which has better whitespace?", options: [
    { id: "a", render: () => <div className="w-full h-full p-5 flex flex-col gap-3 justify-center"><div className="h-3 w-24 bg-white/80 rounded" /><div className="h-2 w-full bg-slate-400/40 rounded" /><div className="h-6 w-16 bg-indigo-500 rounded mt-2" /></div> },
    { id: "b", render: () => <div className="w-full h-full p-1 flex flex-col gap-0.5"><div className="h-3 w-24 bg-white/80 rounded" /><div className="h-2 w-full bg-slate-400/40 rounded" /><div className="h-6 w-16 bg-indigo-500 rounded" /><div className="h-2 w-full bg-red-400/40 rounded" /><div className="h-2 w-20 bg-green-400/40 rounded" /><div className="h-6 w-16 bg-amber-500 rounded" /></div> },
  ], correctId: "a", explanation: "Good whitespace gives content room to breathe.", principle: "Whitespace", minLevel: 33, maxLevel: 40 },

  { question: "Which is more readable?", options: [
    { id: "a", render: () => <div className="w-full h-full p-3 flex flex-col gap-2 justify-center bg-slate-800"><div className="h-3 w-20 bg-white rounded" /><div className="h-1.5 w-full bg-slate-400/50 rounded" /><div className="h-1.5 w-28 bg-slate-400/50 rounded" /><div className="h-5 w-14 bg-indigo-500 rounded mt-1" /></div> },
    { id: "b", render: () => <div className="w-full h-full p-1 flex flex-col gap-0.5 bg-gradient-to-br from-red-900 via-purple-900 to-blue-900"><div className="h-3 w-20 bg-yellow-300 rounded" /><div className="h-1.5 w-full bg-green-400/80 rounded" /><div className="h-1.5 w-28 bg-pink-400/80 rounded" /><div className="h-5 w-14 bg-red-500 rounded" /></div> },
  ], correctId: "a", explanation: "Clean backgrounds and consistent colors improve readability.", principle: "Clean Design", minLevel: 33, maxLevel: 40 },

  { question: "Which uses visual weight for balance?", options: [
    { id: "a", render: () => <div className="w-full h-full flex items-center justify-between p-3"><div className="w-16 h-16 bg-indigo-500 rounded-lg" /><div className="flex flex-col gap-1 items-end"><div className="h-2.5 w-20 bg-white/70 rounded" /><div className="h-2 w-24 bg-slate-400/40 rounded" /><div className="h-4 w-12 bg-indigo-500/50 rounded mt-1" /></div></div> },
    { id: "b", render: () => <div className="w-full h-full flex items-center justify-start p-3 gap-1"><div className="w-16 h-16 bg-indigo-500 rounded-lg" /><div className="w-16 h-16 bg-amber-500 rounded-lg" /><div className="w-16 h-16 bg-green-500 rounded-lg" /></div> },
  ], correctId: "a", explanation: "A large image balanced by text creates asymmetric balance.", principle: "Asymmetric Balance", minLevel: 33, maxLevel: 40 },

  { question: "Which creates a clear focal point?", options: [
    { id: "a", render: () => <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3"><div className="w-20 h-12 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/30" /><div className="h-2 w-24 bg-slate-400/30 rounded" /><div className="h-2 w-16 bg-slate-400/30 rounded" /></div> },
    { id: "b", render: () => <div className="w-full h-full grid grid-cols-3 gap-1 p-2">{[1,2,3,4,5,6,7,8,9].map(i=><div key={i} className="bg-indigo-500/40 rounded h-6" />)}</div> },
  ], correctId: "a", explanation: "Size, contrast, and isolation draw the eye to a focal point.", principle: "Focal Point", minLevel: 33, maxLevel: 40 },

  { question: "Which maintains consistent card alignment?", options: [
    { id: "a", render: () => <div className="grid grid-cols-2 gap-2 w-full h-full p-2">{[1,2,3,4].map(i=><div key={i} className="bg-slate-700 rounded p-2 flex flex-col gap-1"><div className="h-6 bg-indigo-500/30 rounded" /><div className="h-2 w-full bg-slate-400/40 rounded" /></div>)}</div> },
    { id: "b", render: () => <div className="flex flex-wrap gap-1 w-full h-full p-2"><div className="bg-slate-700 rounded p-2 w-20"><div className="h-6 bg-indigo-500/30 rounded" /></div><div className="bg-slate-700 rounded p-1 w-14"><div className="h-4 bg-indigo-500/30 rounded" /></div><div className="bg-slate-700 rounded p-3 w-24"><div className="h-8 bg-indigo-500/30 rounded" /></div></div> },
  ], correctId: "a", explanation: "Consistent card sizes and structure create a cohesive look.", principle: "Consistency", minLevel: 33, maxLevel: 40 },

  { question: "Which uses contrast to guide the eye?", options: [
    { id: "a", render: () => <div className="w-full h-full bg-slate-800 p-3 flex flex-col gap-2 justify-center"><div className="h-2.5 w-16 bg-slate-400/40 rounded" /><div className="h-2.5 w-full bg-slate-400/40 rounded" /><div className="h-7 w-20 bg-amber-500 rounded shadow-lg shadow-amber-500/20 text-[8px] text-white font-bold flex items-center justify-center">BUY NOW</div></div> },
    { id: "b", render: () => <div className="w-full h-full bg-slate-800 p-3 flex flex-col gap-2 justify-center"><div className="h-2.5 w-16 bg-slate-500/40 rounded" /><div className="h-2.5 w-full bg-slate-500/40 rounded" /><div className="h-7 w-20 bg-slate-600/40 rounded text-[8px] text-slate-400 flex items-center justify-center">BUY NOW</div></div> },
  ], correctId: "a", explanation: "High contrast on the CTA makes it stand out.", principle: "Contrast", minLevel: 33, maxLevel: 40 },

  // LEVEL 41-50: Advanced
  { question: "Which layout works best on mobile?", options: [
    { id: "a", render: () => <div className="w-full h-full p-2 flex flex-col gap-1.5"><div className="h-10 bg-indigo-500/30 rounded" /><div className="h-3 w-24 bg-white/60 rounded" /><div className="h-6 w-full bg-indigo-500 rounded mt-1 text-[8px] text-white flex items-center justify-center">Full-Width Button</div></div> },
    { id: "b", render: () => <div className="w-full h-full p-2 flex gap-1.5"><div className="w-1/3 bg-slate-600/50 rounded h-full" /><div className="flex-1 flex flex-col gap-1"><div className="h-3 w-16 bg-white/60 rounded" /><div className="h-6 w-12 bg-indigo-500 rounded text-[8px] text-white flex items-center justify-center">Btn</div></div></div> },
    { id: "c", render: () => <div className="w-full h-full p-2 grid grid-cols-3 gap-1">{[1,2,3,4,5,6].map(i=><div key={i} className="bg-indigo-500/30 rounded h-8" />)}</div> },
  ], correctId: "a", explanation: "Mobile-first: single column, full-width, large touch targets.", principle: "Mobile-First Design", minLevel: 41, maxLevel: 50 },

  { question: "Which shows the Gestalt principle of similarity?", options: [
    { id: "a", render: () => <div className="w-full h-full p-2 flex flex-wrap gap-2 items-center justify-center"><Bx w="w-6" h="h-6" c="bg-indigo-500" /><Bx w="w-6" h="h-6" c="bg-indigo-500" /><Bx w="w-6" h="h-6" c="bg-indigo-500" /><Bx w="w-6" h="h-6" c="bg-amber-500" /><Bx w="w-6" h="h-6" c="bg-amber-500" /><Bx w="w-6" h="h-6" c="bg-amber-500" /></div> },
    { id: "b", render: () => <div className="w-full h-full p-2 flex flex-wrap gap-2 items-center justify-center"><Bx w="w-6" h="h-6" c="bg-indigo-500" /><Bx w="w-8" h="h-4" c="bg-amber-500" /><Bx w="w-4" h="h-8" c="bg-green-500" /><Bx w="w-7" h="h-5" c="bg-red-500" /><Bx w="w-5" h="h-7" c="bg-purple-500" /></div> },
  ], correctId: "a", explanation: "Similar elements (color, shape, size) are perceived as one group.", principle: "Gestalt: Similarity", minLevel: 41, maxLevel: 50 },

  { question: "Which uses the golden ratio?", options: [
    { id: "a", render: () => <div className="w-full h-full flex gap-1 p-2"><div className="bg-indigo-500/40 rounded h-full" style={{flex:"1.618"}} /><div className="bg-amber-500/40 rounded h-full flex-1" /></div> },
    { id: "b", render: () => <div className="w-full h-full flex gap-1 p-2"><div className="bg-indigo-500/40 rounded h-full flex-1" /><div className="bg-amber-500/40 rounded h-full flex-1" /></div> },
    { id: "c", render: () => <div className="w-full h-full flex gap-1 p-2"><div className="bg-indigo-500/40 rounded h-full" style={{flex:"3"}} /><div className="bg-amber-500/40 rounded h-full flex-1" /></div> },
  ], correctId: "a", explanation: "The golden ratio (~1.618:1) creates naturally pleasing proportions.", principle: "Golden Ratio", minLevel: 41, maxLevel: 50 },

  { question: "Which shows the Gestalt principle of continuity?", options: [
    { id: "a", render: () => <div className="w-full h-full p-3 flex items-center justify-center relative"><div className="absolute w-full h-0.5 bg-slate-500/40 top-1/2" />{[0,1,2,3,4].map(i=><div key={i} className="w-5 h-5 bg-indigo-500 rounded-full relative z-10 mx-2" />)}</div> },
    { id: "b", render: () => <div className="w-full h-full p-3 grid grid-cols-3 place-items-center gap-2">{[0,1,2,3,4,5].map(i=><div key={i} className="w-5 h-5 bg-indigo-500 rounded-full" />)}</div> },
  ], correctId: "a", explanation: "Elements along a line are perceived as belonging together.", principle: "Gestalt: Continuity", minLevel: 41, maxLevel: 50 },

  { question: "Which responsive layout adapts gracefully to mobile?", options: [
    { id: "a", render: () => <div className="w-full h-full p-2 flex flex-col gap-1"><div className="text-[8px] text-slate-400">Desktop:</div><div className="flex gap-1 h-7"><div className="flex-1 bg-indigo-500/40 rounded" /><div className="flex-1 bg-indigo-500/40 rounded" /><div className="flex-1 bg-indigo-500/40 rounded" /></div><div className="text-[8px] text-slate-400 mt-0.5">Mobile:</div><div className="flex flex-col gap-0.5"><div className="h-5 bg-indigo-500/40 rounded" /><div className="h-5 bg-indigo-500/40 rounded" /><div className="h-5 bg-indigo-500/40 rounded" /></div></div> },
    { id: "b", render: () => <div className="w-full h-full p-2 flex flex-col gap-1"><div className="text-[8px] text-slate-400">Desktop:</div><div className="flex gap-1 h-7"><div className="flex-1 bg-indigo-500/40 rounded" /><div className="flex-1 bg-indigo-500/40 rounded" /><div className="flex-1 bg-indigo-500/40 rounded" /></div><div className="text-[8px] text-slate-400 mt-0.5">Mobile:</div><div className="flex gap-0.5 h-5"><div className="flex-1 bg-indigo-500/40 rounded text-[5px] text-white/30 flex items-center justify-center">Cramped</div><div className="flex-1 bg-indigo-500/40 rounded text-[5px] text-white/30 flex items-center justify-center">Cramped</div><div className="flex-1 bg-indigo-500/40 rounded text-[5px] text-white/30 flex items-center justify-center">Cramped</div></div></div> },
  ], correctId: "a", explanation: "Responsive design stacks columns vertically on small screens.", principle: "Responsive Design", minLevel: 41, maxLevel: 50 },

  { question: "Which applies the principle of repetition?", options: [
    { id: "a", render: () => <div className="w-full h-full p-2 flex flex-col gap-1.5">{[1,2,3].map(i=><div key={i} className="flex items-center gap-2"><div className="w-5 h-5 bg-indigo-500 rounded-full shrink-0" /><div className="flex flex-col gap-0.5 flex-1"><div className="h-2 w-20 bg-white/60 rounded" /><div className="h-1.5 w-full bg-slate-400/30 rounded" /></div></div>)}</div> },
    { id: "b", render: () => <div className="w-full h-full p-2 flex flex-col gap-1.5"><div className="flex items-center gap-2"><div className="w-5 h-5 bg-indigo-500 rounded-full" /><div className="h-2 w-20 bg-white/60 rounded" /></div><div className="flex items-end gap-1"><div className="w-8 h-3 bg-amber-500 rounded" /><div className="h-1.5 w-16 bg-slate-400/30 rounded" /></div><div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded-sm" /><div className="h-3 w-24 bg-white/60 rounded" /></div></div> },
  ], correctId: "a", explanation: "Repetition creates unity through consistent style and spacing.", principle: "Repetition", minLevel: 41, maxLevel: 50 },

  { question: "Which uses visual rhythm?", options: [
    { id: "a", render: () => <div className="w-full h-full flex items-end gap-1 px-3 pb-2">{[4,6,3,7,5,8,4,6].map((v,i)=><div key={i} className="flex-1 bg-indigo-500/60 rounded-t" style={{height:`${v*5}px`}} />)}</div> },
    { id: "b", render: () => <div className="w-full h-full flex items-end gap-1 px-3 pb-2">{[3,3,3,3,3,3,3,3].map((v,i)=><div key={i} className="flex-1 bg-indigo-500/60 rounded-t" style={{height:`${v*5}px`}} />)}</div> },
  ], correctId: "a", explanation: "Visual rhythm creates movement through patterns with variation.", principle: "Visual Rhythm", minLevel: 41, maxLevel: 50 },

  { question: "Which form layout is most user-friendly?", options: [
    { id: "a", render: () => <div className="w-full h-full p-3 flex flex-col gap-2 justify-center"><div className="flex flex-col gap-0.5"><div className="h-1.5 w-10 bg-white/50 rounded" /><div className="h-5 w-full bg-slate-600 rounded border border-slate-500" /></div><div className="flex flex-col gap-0.5"><div className="h-1.5 w-8 bg-white/50 rounded" /><div className="h-5 w-full bg-slate-600 rounded border border-slate-500" /></div><div className="h-5 w-full bg-indigo-500 rounded mt-1 text-[8px] text-white flex items-center justify-center">Submit</div></div> },
    { id: "b", render: () => <div className="w-full h-full p-2 flex flex-col gap-1 justify-center items-center"><div className="h-5 w-20 bg-slate-600 rounded border border-slate-500" /><div className="h-5 w-20 bg-slate-600 rounded border border-slate-500" /><div className="h-5 w-20 bg-indigo-500 rounded text-[8px] text-white flex items-center justify-center">Submit</div></div> },
  ], correctId: "a", explanation: "Labels above inputs with full-width fields is the modern form pattern.", principle: "Form UX", minLevel: 41, maxLevel: 50 },

  { question: "Which uses scale for information hierarchy?", options: [
    { id: "a", render: () => <div className="w-full h-full flex items-center justify-center gap-3 p-2"><div className="flex flex-col items-center gap-0.5"><div className="w-10 h-10 bg-amber-500 rounded-lg" /><div className="h-1.5 w-8 bg-white/50 rounded" /></div><div className="flex flex-col items-center gap-0.5"><div className="w-16 h-16 bg-indigo-500 rounded-lg shadow-lg" /><div className="h-2 w-12 bg-white/80 rounded" /></div><div className="flex flex-col items-center gap-0.5"><div className="w-10 h-10 bg-amber-500 rounded-lg" /><div className="h-1.5 w-8 bg-white/50 rounded" /></div></div> },
    { id: "b", render: () => <div className="w-full h-full flex items-center justify-center gap-2 p-2">{[1,2,3].map(i=><div key={i} className="flex flex-col items-center gap-0.5"><div className="w-10 h-10 bg-indigo-500/50 rounded-lg" /><div className="h-1.5 w-8 bg-white/50 rounded" /></div>)}</div> },
  ], correctId: "a", explanation: "Larger featured item creates instant visual hierarchy.", principle: "Scale Hierarchy", minLevel: 41, maxLevel: 50 },
];

function pickCh(pool: Challenge[], level: number, count: number): Challenge[] {
  const ok = pool.filter(c => level >= c.minLevel - 3 && level <= c.maxLevel + 8);
  return sh(ok.length >= count ? ok : pool).slice(0, count);
}

// ── Component ──

export function LayoutLabGame() {
  useGameMusic();
  const [phase, setPhase] = useState<Phase>("menu");
  const [countdown, setCountdown] = useState(CD);
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));
  const [challenges, setChallenges] = useState<Challenge[]>([]);
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
    setChallenges(pickCh(CH, 1, QPS)); setCi(0); setSel(null); setScore(0); setCc(0);
    setBs(0); setElapsed(0); setAdaptive(createAdaptiveState(1));
    setCountdown(CD); setAq([]); setAi(0); setPhase("countdown");
  }, []);

  const handleSelect = useCallback((id: string) => {
    if (phase !== "playing" || sel !== null) return;
    const ch = challenges[ci]; if (!ch) return;
    const ok = id === ch.correctId;
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
  }, [phase, sel, challenges, ci, qs, adaptive, bs]);

  const next = useCallback(() => {
    if (ci + 1 >= challenges.length) {
      if (tr.current) clearInterval(tr.current);
      const acc = challenges.length > 0 ? Math.round((cc / challenges.length) * 100) : 0;
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
      const used = new Set(challenges.slice(0, ci + 1).map(c => c.question));
      const nx = pickCh(CH.filter(c => !used.has(c.question)), Math.floor(adaptive.level), 1);
      if (nx.length > 0) setChallenges(prev => { const u = [...prev]; u[ci + 1] = nx[0]; return u; });
      setCi(i => i + 1); setSel(null); setQs(Date.now()); setPhase("playing");
    }
  }, [ci, challenges, cc, score, hi, bs, adaptive]);

  const ch = challenges[ci];
  const acc = challenges.length > 0 && phase === "complete" ? Math.round((cc / challenges.length) * 100) : 0;
  const ft = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060612] via-[#0a0e2a] to-[#060612] flex flex-col items-center">
      <div className="w-full max-w-2xl px-4 pt-3 pb-1 flex items-center justify-between">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /> Games</Link>
        <h1 className="text-base font-bold text-white tracking-wide">Layout Lab</h1>
        <AudioToggles />
      </div>

      {aq.length > 0 && ai < aq.length && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <AchievementToast name={aq[ai].name} tier={aq[ai].tier} onDismiss={() => { if (ai + 1 >= aq.length) setAq([]); setAi(i => i + 1); }} />
        </div>
      )}

      {phase === "menu" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-md">
          <div className="text-5xl mb-3">🔲</div>
          <h2 className="text-3xl font-bold text-white mb-2">Layout Lab</h2>
          <p className="text-slate-400 text-sm mb-4">Identify correct layouts, fix alignment, and learn design principles! {QPS} questions with adaptive difficulty.</p>
          {hi > 0 && <div className="text-xs text-slate-500 mb-4 flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-500" /> Best: {hi.toLocaleString()}</div>}
          <button onClick={startGame} className="px-10 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25">Play</button>
        </div>
      )}

      {phase === "countdown" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-8xl font-bold text-indigo-400 animate-pulse">{countdown > 0 ? countdown : "GO!"}</div>
        </div>
      )}

      {(phase === "playing" || phase === "feedback") && ch && (
        <div className="w-full max-w-2xl px-4 flex flex-col gap-3 mt-2">
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <span>Q{ci + 1}/{challenges.length}</span><span>|</span><span>{ft(elapsed)}</span>
              <span>|</span><span style={{ color: dl.color }}>{dl.label}</span>
              <span className="text-[10px] text-slate-600">({gi.label})</span>
            </div>
            <div className="flex items-center gap-2"><StreakBadge streak={adaptive.streak} /><span className="text-lg font-bold text-white">{score.toLocaleString()}</span></div>
          </div>
          <div className="text-center"><h3 className="text-white font-semibold text-base sm:text-lg">{ch.question}</h3></div>
          <div className={`grid gap-3 ${ch.options.length <= 2 ? "grid-cols-2" : ch.options.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {ch.options.map((o, i) => {
              const isSel = sel === o.id;
              const isOk = o.id === ch.correctId;
              const sr = phase === "feedback";
              let bd = "border-white/10 hover:border-white/30";
              if (sr && isOk) bd = "border-green-500 ring-2 ring-green-500/30";
              else if (sr && isSel && !isOk) bd = "border-red-500 ring-2 ring-red-500/30";
              return (
                <button key={o.id} onClick={() => handleSelect(o.id)} disabled={phase !== "playing"}
                  className={`relative rounded-xl border-2 ${bd} bg-slate-800/60 overflow-hidden transition-all ${phase === "playing" ? "cursor-pointer hover:bg-slate-700/60 active:scale-[0.98]" : ""}`} style={{ minHeight: "120px" }}>
                  <div className="absolute top-1 left-1 z-10 w-5 h-5 rounded bg-slate-700/80 text-[10px] text-white font-bold flex items-center justify-center">{OL[i]}</div>
                  <div className="w-full h-full min-h-[120px] flex items-center justify-center">{o.render()}</div>
                  {sr && isOk && <div className="absolute top-1 right-1 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded font-bold">Correct</div>}
                  {sr && isSel && !isOk && <div className="absolute top-1 right-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">Wrong</div>}
                </button>
              );
            })}
          </div>
          {phase === "feedback" && (
            <div className="bg-slate-800/80 rounded-xl p-4 border border-white/5">
              <div className="flex items-start gap-2 mb-2">
                <span className={`text-sm font-bold ${sel === ch.correctId ? "text-green-400" : "text-red-400"}`}>{sel === ch.correctId ? "Correct!" : "Not quite!"}</span>
                <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{ch.principle}</span>
              </div>
              <p className="text-sm text-slate-300">{ch.explanation}</p>
              <button onClick={next} className="mt-3 px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-lg transition-all text-sm">
                {ci + 1 >= challenges.length ? "See Results" : "Next Question"}
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
