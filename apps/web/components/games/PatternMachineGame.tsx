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

/* === Types === */

type Phase = "menu" | "countdown" | "playing" | "feedback" | "complete";

interface Question {
  display: string;
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
  minLevel: number;
  maxLevel: number;
}

/* === Question Bank (80+ questions across all tiers) === */

const QUESTIONS: Question[] = [
  // Level 1-5: Color/shape patterns (12)
  { display: "🔴 🔵 🔴 🔵 🔴 ❓", prompt: "What comes next?", options: ["🔵", "🔴", "🟢", "🟡"], correct: 0, explanation: "AB pattern: red-blue repeats. Next is blue.", minLevel: 1, maxLevel: 5 },
  { display: "⭐ ⭐ 🌙 ⭐ ⭐ 🌙 ⭐ ⭐ ❓", prompt: "What comes next?", options: ["⭐", "🌙", "☀️", "🌟"], correct: 1, explanation: "AAB pattern: star-star-moon repeats. Next is moon.", minLevel: 1, maxLevel: 5 },
  { display: "🟢 🟡 🔴 🟢 🟡 🔴 🟢 🟡 ❓", prompt: "What comes next?", options: ["🟢", "🔴", "🟡", "🔵"], correct: 1, explanation: "ABC pattern: green-yellow-red repeats. Next is red.", minLevel: 1, maxLevel: 5 },
  { display: "🔵 🔵 🔴 🔵 🔵 🔴 ❓", prompt: "What comes next?", options: ["🔴", "🔵", "🟢", "🟡"], correct: 1, explanation: "AAB pattern: blue-blue-red. Next cycle starts with blue.", minLevel: 1, maxLevel: 5 },
  { display: "🌟 🌙 🌟 🌙 🌟 ❓", prompt: "What comes next?", options: ["🌟", "🌙", "⭐", "☀️"], correct: 1, explanation: "AB pattern: star-moon repeats. Next is moon.", minLevel: 1, maxLevel: 5 },
  { display: "🔴 🔴 🔵 🔵 🔴 🔴 🔵 🔵 ❓", prompt: "What starts the next group?", options: ["🔴", "🔵", "🟢", "🟡"], correct: 0, explanation: "AABB pattern: two reds, two blues. Next group starts with red.", minLevel: 1, maxLevel: 5 },
  { display: "⬛ ⬜ ⬛ ⬜ ⬛ ❓", prompt: "What comes next?", options: ["⬛", "⬜", "🟥", "🟦"], correct: 1, explanation: "AB pattern: black-white alternates. Next is white.", minLevel: 1, maxLevel: 5 },
  { display: "🍎 🍊 🍋 🍎 🍊 🍋 🍎 ❓", prompt: "What comes next?", options: ["🍎", "🍊", "🍋", "🍇"], correct: 1, explanation: "ABC pattern: apple-orange-lemon. After apple comes orange.", minLevel: 1, maxLevel: 5 },
  { display: "🔺 🔺 🔹 🔺 🔺 🔹 🔺 🔺 ❓", prompt: "What comes next?", options: ["🔺", "🔹", "🔷", "🔶"], correct: 1, explanation: "AAB pattern: triangle-triangle-diamond repeats.", minLevel: 1, maxLevel: 5 },
  { display: "🟣 🟤 🟣 🟤 🟣 ❓", prompt: "What comes next?", options: ["🟣", "🟤", "⚫", "🔵"], correct: 1, explanation: "AB pattern: purple-brown alternates. Next is brown.", minLevel: 1, maxLevel: 5 },
  { display: "🌻 🌹 🌻 🌹 🌻 ❓", prompt: "What comes next?", options: ["🌻", "🌹", "🌸", "🌼"], correct: 1, explanation: "AB pattern: sunflower-rose alternates. Next is rose.", minLevel: 1, maxLevel: 5 },
  { display: "🐶 🐱 🐶 🐱 🐶 🐱 ❓", prompt: "What comes next?", options: ["🐶", "🐱", "🐭", "🐹"], correct: 0, explanation: "AB pattern with 6 shown; next starts a new cycle: dog.", minLevel: 1, maxLevel: 5 },

  // Level 6-10: Number sequences (12)
  { display: "2, 4, 6, 8, ?", prompt: "What comes next?", options: ["9", "10", "12", "11"], correct: 1, explanation: "Add 2 each time: 8 + 2 = 10.", minLevel: 6, maxLevel: 10 },
  { display: "5, 10, 15, 20, ?", prompt: "What comes next?", options: ["22", "24", "25", "30"], correct: 2, explanation: "Add 5 each time: 20 + 5 = 25.", minLevel: 6, maxLevel: 10 },
  { display: "1, 4, 7, 10, ?", prompt: "What comes next?", options: ["12", "13", "14", "11"], correct: 1, explanation: "Add 3 each time: 10 + 3 = 13.", minLevel: 6, maxLevel: 10 },
  { display: "3, 6, 12, 24, ?", prompt: "What comes next?", options: ["30", "36", "48", "42"], correct: 2, explanation: "Double each time: 24 x 2 = 48.", minLevel: 6, maxLevel: 10 },
  { display: "1, 2, 4, 8, ?", prompt: "What comes next?", options: ["10", "12", "16", "14"], correct: 2, explanation: "Double each time: 8 x 2 = 16.", minLevel: 6, maxLevel: 10 },
  { display: "10, 20, 30, 40, ?", prompt: "What comes next?", options: ["45", "50", "60", "55"], correct: 1, explanation: "Add 10 each time: 40 + 10 = 50.", minLevel: 6, maxLevel: 10 },
  { display: "100, 90, 80, 70, ?", prompt: "What comes next?", options: ["65", "60", "50", "55"], correct: 1, explanation: "Subtract 10 each time: 70 - 10 = 60.", minLevel: 6, maxLevel: 10 },
  { display: "1, 3, 5, 7, ?", prompt: "What comes next?", options: ["8", "9", "10", "11"], correct: 1, explanation: "Add 2 each time (odd numbers): 7 + 2 = 9.", minLevel: 6, maxLevel: 10 },
  { display: "2, 6, 18, 54, ?", prompt: "What comes next?", options: ["108", "162", "72", "216"], correct: 1, explanation: "Multiply by 3 each time: 54 x 3 = 162.", minLevel: 6, maxLevel: 10 },
  { display: "50, 45, 40, 35, ?", prompt: "What comes next?", options: ["25", "28", "30", "32"], correct: 2, explanation: "Subtract 5 each time: 35 - 5 = 30.", minLevel: 6, maxLevel: 10 },
  { display: "1, 4, 9, 16, ?", prompt: "What comes next?", options: ["20", "24", "25", "36"], correct: 2, explanation: "Perfect squares: 1, 4, 9, 16, 25.", minLevel: 6, maxLevel: 10 },
  { display: "3, 9, 27, ?", prompt: "What comes next?", options: ["36", "54", "81", "90"], correct: 2, explanation: "Multiply by 3: 27 x 3 = 81.", minLevel: 6, maxLevel: 10 },
  // Level 11-14: Function machines (10)
  { display: "Input \u2192 [?] \u2192 Output\n5 \u2192 [?] \u2192 15", prompt: "What's the rule?", options: ["\u00d7 3", "+ 10", "\u00d7 2 + 5", "\u00f7 3"], correct: 0, explanation: "5 \u00d7 3 = 15. The rule is multiply by 3.", minLevel: 11, maxLevel: 14 },
  { display: "Input \u2192 [?] \u2192 Output\n4 \u2192 [?] \u2192 9", prompt: "What's the rule?", options: ["\u00d7 2", "+ 5", "\u00d7 3 \u2212 3", "\u00b2 \u2212 7"], correct: 1, explanation: "4 + 5 = 9. The rule is add 5.", minLevel: 11, maxLevel: 14 },
  { display: "Input \u2192 [?] \u2192 Output\n3 \u2192 9\n5 \u2192 25\n7 \u2192 ?", prompt: "Output for 7?", options: ["42", "49", "35", "14"], correct: 1, explanation: "The rule is input\u00b2. 7\u00b2 = 49.", minLevel: 11, maxLevel: 14 },
  { display: "Input \u2192 [?] \u2192 Output\n2 \u2192 5\n4 \u2192 9\n6 \u2192 ?", prompt: "Output for 6?", options: ["11", "12", "13", "15"], correct: 2, explanation: "The rule is x2 + 1. 6 x 2 + 1 = 13.", minLevel: 11, maxLevel: 14 },
  { display: "Input \u2192 [?] \u2192 Output\n10 \u2192 5\n8 \u2192 4\n6 \u2192 ?", prompt: "Output for 6?", options: ["2", "3", "4", "1"], correct: 1, explanation: "The rule is \u00f7 2. 6 \u00f7 2 = 3.", minLevel: 11, maxLevel: 14 },
  { display: "Input \u2192 [?] \u2192 Output\n1 \u2192 4\n2 \u2192 7\n3 \u2192 10\n5 \u2192 ?", prompt: "Output for 5?", options: ["13", "14", "15", "16"], correct: 3, explanation: "The rule is x3 + 1. 5 x 3 + 1 = 16.", minLevel: 11, maxLevel: 14 },
  { display: "Input \u2192 [?] \u2192 Output\n0 \u2192 1\n1 \u2192 3\n2 \u2192 5\n4 \u2192 ?", prompt: "Output for 4?", options: ["7", "8", "9", "10"], correct: 2, explanation: "The rule is x2 + 1. 4 x 2 + 1 = 9.", minLevel: 11, maxLevel: 14 },
  { display: "Input \u2192 [?] \u2192 Output\n3 \u2192 12\n5 \u2192 20\n7 \u2192 ?", prompt: "Output for 7?", options: ["24", "28", "32", "35"], correct: 1, explanation: "The rule is \u00d7 4. 7 \u00d7 4 = 28.", minLevel: 11, maxLevel: 14 },
  { display: "Input \u2192 [?] \u2192 Output\n1 \u2192 1\n2 \u2192 4\n3 \u2192 9\n4 \u2192 ?", prompt: "Output for 4?", options: ["12", "16", "20", "8"], correct: 1, explanation: "The rule is n\u00b2. 4\u00b2 = 16.", minLevel: 11, maxLevel: 14 },
  { display: "Input \u2192 [?] \u2192 Output\n0 \u2192 3\n1 \u2192 5\n2 \u2192 7\n10 \u2192 ?", prompt: "Output for 10?", options: ["20", "23", "13", "30"], correct: 1, explanation: "The rule is 2n + 3. 2(10) + 3 = 23.", minLevel: 11, maxLevel: 14 },

  // Level 15-18: Loop detection (8)
  { display: "3, 7, 3, 7, 3, 7, ...", prompt: "What is the 20th number?", options: ["3", "7", "10", "0"], correct: 1, explanation: "Loop is {3, 7} length 2. Position 20 is even, so 7.", minLevel: 15, maxLevel: 18 },
  { display: "A, B, C, A, B, C, A, B, C, ...", prompt: "What is the 25th letter?", options: ["A", "B", "C", "D"], correct: 0, explanation: "Loop length 3. 25 mod 3 = 1, position 1 = A.", minLevel: 15, maxLevel: 18 },
  { display: "1, 2, 3, 4, 1, 2, 3, 4, ...", prompt: "What is the 30th number?", options: ["1", "2", "3", "4"], correct: 1, explanation: "Loop length 4. 30 mod 4 = 2, so the 30th is 2.", minLevel: 15, maxLevel: 18 },
  { display: "red, green, blue, red, green, blue, ...", prompt: "What is the 100th color?", options: ["red", "green", "blue", "yellow"], correct: 0, explanation: "Loop length 3. 100 mod 3 = 1, position 1 = red.", minLevel: 15, maxLevel: 18 },
  { display: "5, 10, 15, 5, 10, 15, ...", prompt: "What is the loop length?", options: ["2", "3", "4", "5"], correct: 1, explanation: "The sequence {5, 10, 15} repeats, loop length = 3.", minLevel: 15, maxLevel: 18 },
  { display: "A, A, B, A, A, B, A, A, B, ...", prompt: "What is the 17th item?", options: ["A", "B", "C", "D"], correct: 1, explanation: "Loop {A, A, B} length 3. 17 mod 3 = 2, so B.", minLevel: 15, maxLevel: 18 },
  { display: "1, 0, 1, 0, 1, 0, ...", prompt: "What is the 99th number?", options: ["0", "1", "2", "99"], correct: 1, explanation: "Loop length 2. 99 mod 2 = 1, position 1 = 1.", minLevel: 15, maxLevel: 18 },
  { display: "2, 4, 6, 8, 2, 4, 6, 8, ...", prompt: "Sum of one full loop?", options: ["10", "16", "20", "24"], correct: 2, explanation: "One loop is {2, 4, 6, 8}. Sum = 2+4+6+8 = 20.", minLevel: 15, maxLevel: 18 },

  // Level 19-25: Conditional patterns (9)
  { display: "Rule: If even \u2192 +1. If odd \u2192 x2.\nStart: 3", prompt: "3, 6, 7, 14, ?", options: ["15", "28", "16", "13"], correct: 0, explanation: "14 is even, 14 + 1 = 15.", minLevel: 19, maxLevel: 25 },
  { display: "Rule: If even \u2192 /2. If odd \u2192 +1.\nStart: 7", prompt: "7, 8, 4, 2, ?", options: ["3", "1", "0", "2"], correct: 1, explanation: "2 is even, 2 / 2 = 1.", minLevel: 19, maxLevel: 25 },
  { display: "Rule: If < 10 \u2192 x2. If \u2265 10 \u2192 -3.\nStart: 4", prompt: "4, 8, 16, 13, 10, ?", options: ["7", "20", "5", "8"], correct: 0, explanation: "10 \u2265 10, so 10 - 3 = 7.", minLevel: 19, maxLevel: 25 },
  { display: "Rule: If even \u2192 +3. If odd \u2192 -1.\nStart: 5", prompt: "5, 4, 7, 6, ?", options: ["9", "5", "8", "3"], correct: 0, explanation: "6 is even, 6 + 3 = 9.", minLevel: 19, maxLevel: 25 },
  { display: "Rule: Add position number.\n1, 3, 6, 10, ?", prompt: "What is the 5th term?", options: ["14", "15", "16", "20"], correct: 1, explanation: "10 + 5 = 15. Each step adds the step number.", minLevel: 19, maxLevel: 25 },
  { display: "Rule: If div by 3 \u2192 /3. Else \u2192 +1.\nStart: 6", prompt: "6, 2, 3, 1, ?", options: ["2", "0", "4", "3"], correct: 0, explanation: "1 not divisible by 3, so 1 + 1 = 2.", minLevel: 19, maxLevel: 25 },
  { display: "Rule: x2, then -1. Start: 1", prompt: "1, 1, 1, 1 ... Does it change?", options: ["No, stays at 1", "Yes, grows", "Yes, shrinks", "Alternates"], correct: 0, explanation: "1 x 2 - 1 = 1. Fixed point, never changes.", minLevel: 19, maxLevel: 25 },
  { display: "Rule: If even \u2192 /2. If odd \u2192 x3+1.\nStart: 5", prompt: "5, 16, 8, 4, 2, ?", options: ["0", "1", "3", "6"], correct: 1, explanation: "2 is even, 2/2 = 1. (Collatz conjecture!)", minLevel: 19, maxLevel: 25 },
  { display: "Rule: Multiply digits.\n86\u219248\u219232\u21926", prompt: "Apply to 77:", options: ["49\u219236\u219218\u21928", "49\u219236\u219218\u21929", "14\u21924", "49\u219236\u21928"], correct: 0, explanation: "7x7=49, 4x9=36, 3x6=18, 1x8=8.", minLevel: 19, maxLevel: 25 },
  // Level 26-32: Famous sequences (10)
  { display: "1, 1, 2, 3, 5, 8, ?", prompt: "What comes next? (Fibonacci)", options: ["10", "11", "13", "15"], correct: 2, explanation: "Fibonacci: each = sum of previous two. 5+8=13.", minLevel: 26, maxLevel: 32 },
  { display: "1, 3, 6, 10, 15, ?", prompt: "What comes next? (Triangular)", options: ["18", "20", "21", "25"], correct: 2, explanation: "Triangular: add 1,2,3,4,5,6... 15+6=21.", minLevel: 26, maxLevel: 32 },
  { display: "1, 8, 27, 64, ?", prompt: "What comes next?", options: ["100", "125", "128", "216"], correct: 1, explanation: "Perfect cubes: 5\u00b3 = 125.", minLevel: 26, maxLevel: 32 },
  { display: "1, 4, 9, 16, 25, ?", prompt: "Next perfect square?", options: ["30", "35", "36", "49"], correct: 2, explanation: "Perfect squares: 6\u00b2 = 36.", minLevel: 26, maxLevel: 32 },
  { display: "2, 3, 5, 7, 11, 13, ?", prompt: "Next prime number?", options: ["15", "17", "19", "14"], correct: 1, explanation: "Primes: next after 13 is 17.", minLevel: 26, maxLevel: 32 },
  { display: "0, 1, 1, 2, 3, 5, 8, 13, ?", prompt: "What comes next?", options: ["18", "20", "21", "26"], correct: 2, explanation: "Fibonacci: 8 + 13 = 21.", minLevel: 26, maxLevel: 32 },
  { display: "1, 1, 2, 6, 24, ?", prompt: "Next factorial?", options: ["48", "60", "100", "120"], correct: 3, explanation: "Factorials: 5! = 120.", minLevel: 26, maxLevel: 32 },
  { display: "1, 2, 4, 8, 16, 32, ?", prompt: "Next power of 2?", options: ["48", "64", "36", "128"], correct: 1, explanation: "Powers of 2: 2\u2076 = 64.", minLevel: 26, maxLevel: 32 },
  { display: "Pascal row 5: 1, 5, 10, 10, 5, 1", prompt: "Sum of this row?", options: ["16", "32", "64", "31"], correct: 1, explanation: "Each Pascal row sums to 2\u207f. Row 5: 2\u2075=32.", minLevel: 26, maxLevel: 32 },
  { display: "Catalan: 1, 1, 2, 5, 14, ?", prompt: "What comes next?", options: ["28", "42", "30", "48"], correct: 1, explanation: "Catalan number C(5) = 42.", minLevel: 26, maxLevel: 32 },

  // Level 33-40: Growth patterns (10)
  { display: "Doubles every step. Start: 1", prompt: "Steps to exceed 1000?", options: ["8", "9", "10", "11"], correct: 2, explanation: "2\u00b9\u2070 = 1024 > 1000. Takes 10 steps.", minLevel: 33, maxLevel: 40 },
  { display: "+10 each step vs x2 each step\nBoth start at 1", prompt: "Which exceeds 1000 first?", options: ["Adding 10", "Doubling", "They tie", "Neither"], correct: 1, explanation: "Doubling: 10 steps to 1024. Adding: 100 steps!", minLevel: 33, maxLevel: 40 },
  { display: "Sequence: 1, 3, 9, 27, ...", prompt: "8th term?", options: ["729", "2187", "6561", "243"], correct: 1, explanation: "Powers of 3: 3\u2077 = 2187.", minLevel: 33, maxLevel: 40 },
  { display: "Population doubles yearly.\nStart: 100", prompt: "After 5 years?", options: ["500", "1000", "1600", "3200"], correct: 3, explanation: "100 x 2\u2075 = 100 x 32 = 3200.", minLevel: 33, maxLevel: 40 },
  { display: "A: 2,4,6,8,...  B: 2,4,8,16,...", prompt: "At step 10, which is larger?", options: ["A", "B (much larger)", "Equal", "B (by 10)"], correct: 1, explanation: "A(10)=20. B(10)=2\u00b9\u2070=1024. Exponential wins.", minLevel: 33, maxLevel: 40 },
  { display: "a(n) = a(n-1) + n, a(1) = 1", prompt: "What is a(6)?", options: ["15", "18", "21", "24"], correct: 2, explanation: "1, 3, 6, 10, 15, 21. Each adds n.", minLevel: 33, maxLevel: 40 },
  { display: "Bacteria triples hourly.\nStart: 5", prompt: "After 4 hours?", options: ["60", "120", "405", "20"], correct: 2, explanation: "5 x 3\u2074 = 5 x 81 = 405.", minLevel: 33, maxLevel: 40 },
  { display: "1, 2, 4, 7, 11, 16, ...", prompt: "Next term?", options: ["22", "20", "24", "21"], correct: 0, explanation: "Differences: +1,+2,+3,+4,+5,+6. Next: 16+6=22.", minLevel: 33, maxLevel: 40 },
  { display: "Halving: 1000, 500, 250, ...", prompt: "Steps to go below 1?", options: ["8", "10", "12", "7"], correct: 1, explanation: "1000/2\u00b9\u2070 \u2248 0.977 < 1. Takes 10 steps.", minLevel: 33, maxLevel: 40 },
  { display: "2\u207f vs n\u00b2", prompt: "At what n does 2\u207f always beat n\u00b2?", options: ["3", "5", "10", "100"], correct: 2, explanation: "2\u207f > n\u00b2 permanently for all n \u2265 10.", minLevel: 33, maxLevel: 40 },

  // Level 41-50: Complex recurrences (10)
  { display: "Sum of previous 3:\n1, 1, 1, 3, 5, 9, ?", prompt: "What comes next?", options: ["15", "17", "14", "18"], correct: 1, explanation: "3 + 5 + 9 = 17 (Tribonacci).", minLevel: 41, maxLevel: 50 },
  { display: "a(n)=2\u00b7a(n-1)\u2212a(n-2)\na(1)=1, a(2)=3", prompt: "What is a(5)?", options: ["7", "9", "11", "5"], correct: 1, explanation: "a(3)=5, a(4)=7, a(5)=9. Odd numbers!", minLevel: 41, maxLevel: 50 },
  { display: "n mod 4 \u2192 0,1,2,3,0,1,2,3,...", prompt: "What is 47 mod 4?", options: ["0", "1", "2", "3"], correct: 3, explanation: "47 \u00f7 4 = 11 remainder 3.", minLevel: 41, maxLevel: 50 },
  { display: "1, \u22121, 1, \u22121, 1, \u22121, ...", prompt: "Formula?", options: ["(\u22121)\u207f\u207a\u00b9", "n mod 2", "1/n", "n \u2212 2"], correct: 0, explanation: "(\u22121)\u207f\u207a\u00b9 alternates: +1, \u22121, +1, \u22121...", minLevel: 41, maxLevel: 50 },
  { display: "a(n)=a(n-1)+a(n-2)+a(n-3)\n2, 1, 1, 4, 6, ?", prompt: "What comes next?", options: ["10", "11", "12", "14"], correct: 1, explanation: "1 + 4 + 6 = 11.", minLevel: 41, maxLevel: 50 },
  { display: "1, 2, 2, 3, 3, 3, 4, 4, 4, 4, ...", prompt: "15th term?", options: ["4", "5", "6", "3"], correct: 1, explanation: "1(x1), 2(x2), 3(x3), 4(x4)=pos 10, 5(x5). Pos 15 = 5.", minLevel: 41, maxLevel: 50 },
  { display: "Collatz sequence from 27", prompt: "Does 27 reach 1?", options: ["Yes", "No", "Loops 4-2-1", "Both A and C"], correct: 3, explanation: "27 reaches 1 after 111 steps, via 4\u21922\u21921 loop.", minLevel: 41, maxLevel: 50 },
  { display: "1+2+3+...+n > 100", prompt: "Smallest n?", options: ["12", "13", "14", "15"], correct: 2, explanation: "n(n+1)/2 > 100. n=14: 14*15/2=105>100.", minLevel: 41, maxLevel: 50 },
  { display: "a(n)=a(n-1)\u00b2 mod 10\na(1)=2", prompt: "What is a(5)?", options: ["2", "4", "6", "8"], correct: 2, explanation: "2, 4, 6, 6, 6. Stabilizes at 6.", minLevel: 41, maxLevel: 50 },
  { display: "1 + 1/2 + 1/4 + 1/8 + ...", prompt: "Infinite sum approaches?", options: ["1", "2", "\u221e", "1.5"], correct: 1, explanation: "Geometric series ratio 1/2: sum = 2.", minLevel: 41, maxLevel: 50 },
];

/* === Helpers === */

const QUESTIONS_PER_SESSION = 12;

function pickQuestion(level: number, usedIndices: Set<number>): number {
  const l = Math.max(1, Math.min(50, Math.round(level)));
  const candidates: number[] = [];
  const fallbacks: number[] = [];

  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    if (l >= q.minLevel && l <= q.maxLevel) {
      if (!usedIndices.has(i)) candidates.push(i);
      else fallbacks.push(i);
    }
  }
  if (candidates.length < 2) {
    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      if (!usedIndices.has(i) && l >= q.minLevel - 5 && l <= q.maxLevel + 5) {
        if (!candidates.includes(i)) candidates.push(i);
      }
    }
  }
  if (candidates.length > 0) return candidates[Math.floor(Math.random() * candidates.length)];
  if (fallbacks.length > 0) return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  return Math.floor(Math.random() * QUESTIONS.length);
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const TIPS = [
  "Look for what changes between each item",
  "Try calculating the difference between numbers",
  "Check if values are being multiplied or added",
  "With loops, find the cycle length first",
  "Function machines: test the rule with all given inputs",
  "Famous sequences have patterns \u2014 learn to recognize them!",
  "Exponential growth is faster than linear growth",
  "Mod (remainder) helps with repeating patterns",
];

/* === Component === */

export function PatternMachineGame() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [countdown, setCountdown] = useState(3);

  const [questionIndices, setQuestionIndices] = useState<number[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const usedIndicesRef = useRef<Set<number>>(new Set());

  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));

  const [achievementQueue, setAchievementQueue] = useState<
    { name: string; tier: "bronze" | "silver" | "gold" }[]
  >([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useGameMusic();

  useEffect(() => {
    try { setHighScore(getLocalHighScore("pattern-machine") ?? 0); } catch {}
  }, []);

  useEffect(() => {
    if (phase === "playing" || phase === "feedback") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown === 3) sfxCountdown();
    const t = setTimeout(() => {
      setCountdown((c) => {
        if (c <= 1) {
          sfxCountdownGo();
          setPhase("playing");
          setQuestionStartTime(Date.now());
          return 3;
        }
        sfxCountdown();
        return c - 1;
      });
    }, 800);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== "playing" && phase !== "feedback") return;
    const t = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 8000);
    return () => clearInterval(t);
  }, [phase]);

  const startGame = useCallback(() => {
    usedIndicesRef.current = new Set();
    const firstIdx = pickQuestion(1, usedIndicesRef.current);
    usedIndicesRef.current.add(firstIdx);
    setQuestionIndices([firstIdx]);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    setElapsed(0);
    setCountdown(3);
    setAdaptive(createAdaptiveState(1));
    setPhase("countdown");
  }, []);

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (phase !== "playing" || selectedAnswer !== null) return;
      const qIdx = questionIndices[currentIdx];
      const q = QUESTIONS[qIdx];
      const isCorrect = answerIndex === q.correct;
      const answerTime = (Date.now() - questionStartTime) / 1000;
      const wasFast = answerTime < 5;

      setSelectedAnswer(answerIndex);

      const newAdaptive = adaptiveUpdate(adaptive, isCorrect, isCorrect && wasFast);
      setAdaptive(newAdaptive);

      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        const { mult } = getMultiplierFromStreak(newStreak);
        const base = 100 + (wasFast ? 50 : 0);
        const pts = Math.round(base * mult);
        setScore((s) => s + pts);
        setCorrectCount((c) => c + 1);
        sfxCorrect();
        if (newStreak > 1 && newStreak % 5 === 0) sfxCombo(newStreak);
      } else {
        if (streak > 0) sfxStreakLost();
        setStreak(0);
        sfxWrong();
      }

      if (newAdaptive.lastAdjust === "up") sfxLevelUp();

      setPhase("feedback");
    },
    [phase, selectedAnswer, questionIndices, currentIdx, adaptive, streak, questionStartTime],
  );

  const nextQuestion = useCallback(() => {
    if (currentIdx + 1 >= QUESTIONS_PER_SESSION) {
      if (timerRef.current) clearInterval(timerRef.current);
      const accuracy = QUESTIONS_PER_SESSION > 0 ? correctCount / QUESTIONS_PER_SESSION : 0;
      if (accuracy >= 1.0) sfxPerfect();
      else if (accuracy >= 0.8) sfxLevelUp();
      else sfxGameOver();

      try {
        const prev = getLocalHighScore("pattern-machine") ?? 0;
        if (score > prev) { setLocalHighScore("pattern-machine", score); setHighScore(score); }
      } catch {}

      try {
        trackGamePlayed("pattern-machine", score, { bestStreak, adaptiveLevel: adaptive.level });
        const profile = getProfile();
        const medals = checkAchievements(
          { gameId: "pattern-machine", score, accuracy: Math.round(accuracy * 100), bestStreak, timeSeconds: elapsed },
          profile.totalGamesPlayed,
          profile.gamesPlayedByGameId,
        );
        if (medals.length > 0) {
          sfxAchievement();
          setAchievementQueue(medals.map((m) => ({ name: m.name, tier: m.tier })));
        }
      } catch {}

      setPhase("complete");
    } else {
      const nextIdx = pickQuestion(adaptive.level, usedIndicesRef.current);
      usedIndicesRef.current.add(nextIdx);
      setQuestionIndices((prev) => [...prev, nextIdx]);
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer(null);
      setQuestionStartTime(Date.now());
      setPhase("playing");
    }
  }, [currentIdx, correctCount, score, bestStreak, adaptive, elapsed]);

  const currentQ = questionIndices.length > currentIdx ? QUESTIONS[questionIndices[currentIdx]] : null;
  const accuracy = QUESTIONS_PER_SESSION > 0 ? Math.round((correctCount / QUESTIONS_PER_SESSION) * 100) : 0;
  const dl = getDifficultyLabel(adaptive.level);
  const gradeInfo = getGradeForLevel(adaptive.level);
  const showDiffChange = adaptive.lastAdjust && Date.now() - adaptive.lastAdjustTime < 2000;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <Link href="/games" className="flex items-center gap-1 text-slate-400 hover:text-white text-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          ⚙️ Pattern Machine
        </h1>
        <AudioToggles />
      </div>

      {/* Menu */}
      {phase === "menu" && (
        <div className="text-center py-8">
          <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Pattern Machine
          </h2>
          <p className="text-slate-400 mb-4">
            Find the pattern. Predict what comes next. Build computational thinking!
          </p>

          {highScore > 0 && (
            <div className="mb-6 text-sm text-yellow-400 flex items-center justify-center gap-1">
              <Trophy size={14} /> Best: {highScore}
            </div>
          )}

          <div className="mb-6 text-sm text-slate-500 max-w-md mx-auto">
            <p className="mb-2 font-semibold text-slate-300">What you&apos;ll learn:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-left">
              <span>🔴 Color/shape patterns</span>
              <span>🔢 Number sequences</span>
              <span>⚙️ Function machines</span>
              <span>🔁 Loop detection</span>
              <span>🔀 Conditional rules</span>
              <span>🌟 Famous sequences</span>
              <span>📈 Growth patterns</span>
              <span>🧩 Complex recurrences</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-6">
            {QUESTIONS_PER_SESSION} questions per session &middot; Difficulty adapts to you
          </p>

          <button
            onClick={startGame}
            className="px-10 py-3 rounded-lg font-bold text-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
          >
            Start Game
          </button>
        </div>
      )}

      {/* Countdown */}
      {phase === "countdown" && (
        <div className="text-center py-16">
          <div className="text-7xl font-bold text-violet-400 animate-pulse">
            {countdown}
          </div>
        </div>
      )}

      {/* Playing / Feedback */}
      {(phase === "playing" || phase === "feedback") && currentQ && (
        <div>
          {/* HUD */}
          <div className="flex items-center justify-between text-sm text-slate-300 py-2 mb-1">
            <span>Q{currentIdx + 1}/{QUESTIONS_PER_SESSION}</span>
            <span className="flex items-center gap-2">
              Score: {score}
              <StreakBadge streak={streak} />
            </span>
            <span>{formatTime(elapsed)}</span>
          </div>

          {/* Adaptive difficulty badge */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs font-bold" style={{ color: dl.color }}>
              {dl.emoji} {dl.label}
            </span>
            <span className="text-xs text-white/60">
              Lvl {Math.round(adaptive.level)} &middot; {gradeInfo.label}
            </span>
            {showDiffChange && (
              <span className={`text-[10px] font-bold animate-bounce ${adaptive.lastAdjust === "up" ? "text-red-400" : "text-green-400"}`}>
                {adaptive.lastAdjust === "up" ? "↑ Harder!" : "↓ Easier"}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full mb-4">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIdx + (phase === "feedback" ? 1 : 0)) / QUESTIONS_PER_SESSION) * 100}%` }}
            />
          </div>

          {/* Pattern display */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
            {currentQ.display.split("\n").map((line, i) => (
              <div key={i} className="text-xl sm:text-2xl font-mono text-center leading-relaxed tracking-wider">
                {line}
              </div>
            ))}
          </div>

          {/* Question prompt */}
          <h3 className="text-lg font-bold mb-4 text-center">{currentQ.prompt}</h3>

          {/* Answer options */}
          <div className="grid grid-cols-2 gap-3">
            {currentQ.options.map((opt, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrectAnswer = i === currentQ.correct;
              let classes = "w-full text-center px-4 py-4 rounded-lg border text-lg font-semibold transition-all duration-200 ";

              if (phase === "feedback") {
                if (isCorrectAnswer) {
                  classes += "bg-green-600/20 border-green-500 text-green-300 scale-105";
                } else if (isSelected) {
                  classes += "bg-red-600/20 border-red-500 text-red-300";
                } else {
                  classes += "bg-white/5 border-white/10 text-slate-500";
                }
              } else {
                classes += "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:border-violet-500/50 cursor-pointer active:scale-95";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={phase === "feedback"}
                  className={classes}
                >
                  {phase === "feedback" && isCorrectAnswer && "✓ "}
                  {phase === "feedback" && isSelected && !isCorrectAnswer && "✗ "}
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {phase === "feedback" && (
            <div className="mt-4">
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-300 mb-4">
                {currentQ.explanation}
              </div>
              <button
                onClick={nextQuestion}
                className="w-full py-3 rounded-lg font-bold text-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
              >
                {currentIdx + 1 >= QUESTIONS_PER_SESSION ? "See Results" : "Next Question →"}
              </button>
            </div>
          )}

          {phase === "playing" && (
            <button
              onClick={() => setPhase("menu")}
              className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              ← Quit
            </button>
          )}

          <div className="text-center mt-3">
            <span className="text-[10px] text-slate-500 italic">{TIPS[tipIndex]}</span>
          </div>
        </div>
      )}

      {/* Complete */}
      {phase === "complete" && (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">{accuracy >= 80 ? "🏆" : accuracy >= 50 ? "⚙️" : "💪"}</div>
          <h2 className="text-3xl font-bold mb-2 text-violet-400">Session Complete!</h2>

          <div className="text-slate-300 space-y-1 mb-4">
            <p>Accuracy: <span className="font-semibold">{correctCount}/{QUESTIONS_PER_SESSION}</span> ({accuracy}%)</p>
            <p>Best Streak: <span className="font-semibold">{bestStreak}</span></p>
            <p>Time: <span className="font-semibold">{formatTime(elapsed)}</span></p>
          </div>

          <div className="text-4xl font-bold text-yellow-400 mb-2">{score} pts</div>

          <div className="mb-6">
            <div className="text-sm text-slate-400 mb-1">Final Difficulty Level</div>
            <div className="text-lg font-bold" style={{ color: dl.color }}>
              {dl.emoji} {dl.label}
            </div>
            <div className="text-xs text-slate-500">Lvl {Math.round(adaptive.level)} &middot; {gradeInfo.label}</div>
          </div>

          <div className="max-w-xs mx-auto mb-6">
            <ScoreSubmit
              game="pattern-machine"
              score={score}
              level={Math.round(adaptive.level)}
              stats={{ accuracy, bestStreak, timeSeconds: elapsed }}
            />
          </div>

          <button
            onClick={() => setPhase("menu")}
            className="px-8 py-3 rounded-lg font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
          >
            <RotateCcw size={16} className="inline mr-2" />
            Play Again
          </button>
        </div>
      )}

      {/* Achievement toasts */}
      {achievementQueue.map((a, i) => (
        <div key={i} className="fixed top-4 right-4 z-50">
          <AchievementToast
            name={a.name}
            tier={a.tier}
            onDismiss={() => setAchievementQueue((q) => q.filter((_, j) => j !== i))}
          />
        </div>
      ))}
    </div>
  );
}
