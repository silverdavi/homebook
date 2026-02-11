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
  /** Optional: show bit visualization */
  bits?: number[];
}

/* === Question Bank (85+ questions across all tiers) === */

const QUESTIONS: Question[] = [
  // Level 1-10: Binary counting basics (16)
  { display: "Binary: 1", prompt: "What is 1 in decimal?", options: ["0", "1", "2", "3"], correct: 1, explanation: "Binary 1 = decimal 1.", minLevel: 1, maxLevel: 10, bits: [1] },
  { display: "Binary: 10", prompt: "What is 10 in decimal?", options: ["1", "2", "10", "4"], correct: 1, explanation: "Binary 10 = 1\u00d72 + 0\u00d71 = 2.", minLevel: 1, maxLevel: 10, bits: [1, 0] },
  { display: "Binary: 11", prompt: "What is 11 in decimal?", options: ["2", "3", "11", "4"], correct: 1, explanation: "Binary 11 = 1\u00d72 + 1\u00d71 = 3.", minLevel: 1, maxLevel: 10, bits: [1, 1] },
  { display: "Binary: 101", prompt: "What is 101 in decimal?", options: ["3", "5", "7", "101"], correct: 1, explanation: "Binary 101 = 1\u00d74 + 0\u00d72 + 1\u00d71 = 5.", minLevel: 1, maxLevel: 10, bits: [1, 0, 1] },
  { display: "Binary: 110", prompt: "What is 110 in decimal?", options: ["4", "5", "6", "12"], correct: 2, explanation: "Binary 110 = 1\u00d74 + 1\u00d72 + 0\u00d71 = 6.", minLevel: 1, maxLevel: 10, bits: [1, 1, 0] },
  { display: "Binary: 111", prompt: "What is 111 in decimal?", options: ["3", "5", "7", "8"], correct: 2, explanation: "Binary 111 = 4+2+1 = 7.", minLevel: 1, maxLevel: 10, bits: [1, 1, 1] },
  { display: "Binary: 1000", prompt: "What is 1000 in decimal?", options: ["4", "8", "16", "1000"], correct: 1, explanation: "Binary 1000 = 1\u00d78 = 8.", minLevel: 1, maxLevel: 10, bits: [1, 0, 0, 0] },
  { display: "Binary: 1010", prompt: "What is 1010 in decimal?", options: ["8", "10", "12", "5"], correct: 1, explanation: "Binary 1010 = 8+0+2+0 = 10.", minLevel: 1, maxLevel: 10, bits: [1, 0, 1, 0] },
  { display: "Binary: 1111", prompt: "What is 1111 in decimal?", options: ["8", "12", "15", "16"], correct: 2, explanation: "Binary 1111 = 8+4+2+1 = 15.", minLevel: 1, maxLevel: 10, bits: [1, 1, 1, 1] },
  { display: "Decimal: 3", prompt: "Convert 3 to binary:", options: ["10", "11", "100", "101"], correct: 1, explanation: "3 = 2+1 = binary 11.", minLevel: 1, maxLevel: 10 },
  { display: "Decimal: 7", prompt: "Convert 7 to binary:", options: ["101", "110", "111", "1000"], correct: 2, explanation: "7 = 4+2+1 = binary 111.", minLevel: 1, maxLevel: 10 },
  { display: "Decimal: 9", prompt: "Convert 9 to binary:", options: ["1001", "1010", "1100", "1011"], correct: 0, explanation: "9 = 8+1 = binary 1001.", minLevel: 1, maxLevel: 10 },
  { display: "Light switches: ON OFF ON", prompt: "What number does this represent?", options: ["3", "5", "6", "7"], correct: 1, explanation: "ON=1, OFF=0. Binary 101 = 5.", minLevel: 1, maxLevel: 10, bits: [1, 0, 1] },
  { display: "Light switches: ON ON OFF OFF", prompt: "What number does this represent?", options: ["8", "10", "12", "15"], correct: 2, explanation: "ON=1, OFF=0. Binary 1100 = 8+4 = 12.", minLevel: 1, maxLevel: 10, bits: [1, 1, 0, 0] },
  { display: "Decimal: 15", prompt: "Convert 15 to binary:", options: ["1110", "1111", "10000", "1101"], correct: 1, explanation: "15 = 8+4+2+1 = binary 1111.", minLevel: 1, maxLevel: 10 },
  { display: "Counting in binary: 0, 1, 10, 11, ?", prompt: "What comes next?", options: ["12", "100", "101", "110"], correct: 1, explanation: "After 11 (=3) comes 100 (=4).", minLevel: 1, maxLevel: 10 },

  // Level 11-18: Larger binary & arithmetic (12)
  { display: "Binary: 10110", prompt: "What is 10110 in decimal?", options: ["18", "20", "22", "26"], correct: 2, explanation: "10110 = 16+0+4+2+0 = 22.", minLevel: 11, maxLevel: 18, bits: [1, 0, 1, 1, 0] },
  { display: "Binary: 11001", prompt: "What is 11001 in decimal?", options: ["21", "25", "27", "29"], correct: 1, explanation: "11001 = 16+8+0+0+1 = 25.", minLevel: 11, maxLevel: 18, bits: [1, 1, 0, 0, 1] },
  { display: "Binary: 11111111", prompt: "What is this in decimal?", options: ["127", "255", "256", "128"], correct: 1, explanation: "8 ones = 128+64+32+16+8+4+2+1 = 255.", minLevel: 11, maxLevel: 18, bits: [1,1,1,1,1,1,1,1] },
  { display: "Binary: 10000000", prompt: "What is this in decimal?", options: ["64", "128", "256", "100"], correct: 1, explanation: "10000000 = 2\u2077 = 128.", minLevel: 11, maxLevel: 18, bits: [1,0,0,0,0,0,0,0] },
  { display: "Decimal: 100", prompt: "Convert 100 to binary:", options: ["1100100", "1100010", "1010100", "1110100"], correct: 0, explanation: "100 = 64+32+4 = 1100100.", minLevel: 11, maxLevel: 18 },
  { display: "Decimal: 200", prompt: "Convert 200 to binary:", options: ["11001000", "11000100", "11010000", "11001100"], correct: 0, explanation: "200 = 128+64+8 = 11001000.", minLevel: 11, maxLevel: 18 },
  { display: "How many different numbers\ncan 4 bits represent?", prompt: "Choose the answer:", options: ["8", "15", "16", "32"], correct: 2, explanation: "4 bits = 2\u2074 = 16 values (0 through 15).", minLevel: 11, maxLevel: 18 },
  { display: "How many different numbers\ncan 8 bits represent?", prompt: "Choose the answer:", options: ["128", "255", "256", "512"], correct: 2, explanation: "8 bits = 2\u2078 = 256 values (0 through 255).", minLevel: 11, maxLevel: 18 },
  { display: "Binary addition:\n1010 + 0011 = ?", prompt: "What is the result?", options: ["1100", "1101", "1110", "1111"], correct: 1, explanation: "1010 (10) + 0011 (3) = 1101 (13).", minLevel: 11, maxLevel: 18 },
  { display: "Binary addition:\n1100 + 0101 = ?", prompt: "What is the result?", options: ["10001", "10010", "10000", "10011"], correct: 0, explanation: "1100 (12) + 0101 (5) = 10001 (17).", minLevel: 11, maxLevel: 18 },
  { display: "Binary addition:\n111 + 001 = ?", prompt: "What is the result?", options: ["1000", "1001", "1010", "1100"], correct: 0, explanation: "111 (7) + 001 (1) = 1000 (8).", minLevel: 11, maxLevel: 18 },
  { display: "What is the largest number\nthat 4 bits can store?", prompt: "Choose the answer:", options: ["8", "15", "16", "31"], correct: 1, explanation: "4 bits: 1111 = 15.", minLevel: 11, maxLevel: 18 },

  // Level 19-25: Hex basics (10)
  { display: "Binary: 1111", prompt: "What is this in hexadecimal?", options: ["E", "F", "10", "D"], correct: 1, explanation: "Binary 1111 = decimal 15 = hex F.", minLevel: 19, maxLevel: 25 },
  { display: "Hex: A", prompt: "What is hex A in decimal?", options: ["8", "10", "12", "16"], correct: 1, explanation: "Hex A = decimal 10.", minLevel: 19, maxLevel: 25 },
  { display: "Hex: B", prompt: "What is hex B in decimal?", options: ["10", "11", "12", "13"], correct: 1, explanation: "Hex B = decimal 11.", minLevel: 19, maxLevel: 25 },
  { display: "Hex: 1F", prompt: "What is hex 1F in decimal?", options: ["25", "31", "16", "30"], correct: 1, explanation: "1F = 1\u00d716 + 15 = 31.", minLevel: 19, maxLevel: 25 },
  { display: "Decimal: 255", prompt: "What is 255 in hex?", options: ["EF", "FE", "FF", "F0"], correct: 2, explanation: "255 = 15\u00d716 + 15 = FF.", minLevel: 19, maxLevel: 25 },
  { display: "Color code: #FF0000", prompt: "What color is this?", options: ["Blue", "Green", "Red", "White"], correct: 2, explanation: "FF red, 00 green, 00 blue = pure red.", minLevel: 19, maxLevel: 25 },
  { display: "Color code: #00FF00", prompt: "What color is this?", options: ["Red", "Green", "Blue", "Yellow"], correct: 1, explanation: "00 red, FF green, 00 blue = pure green.", minLevel: 19, maxLevel: 25 },
  { display: "Color code: #0000FF", prompt: "What color is this?", options: ["Red", "Green", "Blue", "Cyan"], correct: 2, explanation: "00 red, 00 green, FF blue = pure blue.", minLevel: 19, maxLevel: 25 },
  { display: "Color code: #FFFFFF", prompt: "What color is this?", options: ["Black", "White", "Gray", "Red"], correct: 1, explanation: "FF for all channels = white.", minLevel: 19, maxLevel: 25 },
  { display: "Color code: #000000", prompt: "What color is this?", options: ["Black", "White", "Gray", "Red"], correct: 0, explanation: "00 for all channels = black.", minLevel: 19, maxLevel: 25 },
  // Level 26-32: Logic gates (12)
  { display: "AND gate:\n1 AND 0 = ?", prompt: "What is the output?", options: ["0", "1", "2", "Undefined"], correct: 0, explanation: "AND: both inputs must be 1. 1 AND 0 = 0.", minLevel: 26, maxLevel: 32 },
  { display: "AND gate:\n1 AND 1 = ?", prompt: "What is the output?", options: ["0", "1", "2", "Undefined"], correct: 1, explanation: "AND: both inputs are 1, so output is 1.", minLevel: 26, maxLevel: 32 },
  { display: "OR gate:\n0 OR 1 = ?", prompt: "What is the output?", options: ["0", "1", "2", "Undefined"], correct: 1, explanation: "OR: at least one input is 1. 0 OR 1 = 1.", minLevel: 26, maxLevel: 32 },
  { display: "OR gate:\n0 OR 0 = ?", prompt: "What is the output?", options: ["0", "1", "2", "Undefined"], correct: 0, explanation: "OR: neither input is 1. 0 OR 0 = 0.", minLevel: 26, maxLevel: 32 },
  { display: "NOT gate:\nNOT 1 = ?", prompt: "What is the output?", options: ["0", "1", "2", "-1"], correct: 0, explanation: "NOT flips the bit: NOT 1 = 0.", minLevel: 26, maxLevel: 32 },
  { display: "NOT gate:\nNOT 0 = ?", prompt: "What is the output?", options: ["0", "1", "2", "-1"], correct: 1, explanation: "NOT flips the bit: NOT 0 = 1.", minLevel: 26, maxLevel: 32 },
  { display: "Truth table for AND:\n0,0\u21920  0,1\u21920  1,0\u2192?", prompt: "What fills the blank?", options: ["0", "1", "2", "Depends"], correct: 0, explanation: "AND needs both 1. 1 AND 0 = 0.", minLevel: 26, maxLevel: 32 },
  { display: "Truth table for OR:\n0,0\u21920  1,0\u21921  0,1\u2192?", prompt: "What fills the blank?", options: ["0", "1", "2", "Depends"], correct: 1, explanation: "OR: at least one 1. 0 OR 1 = 1.", minLevel: 26, maxLevel: 32 },
  { display: "Logic puzzle:\n(1 AND 1) OR 0 = ?", prompt: "Evaluate:", options: ["0", "1", "2", "Undefined"], correct: 1, explanation: "1 AND 1 = 1. Then 1 OR 0 = 1.", minLevel: 26, maxLevel: 32 },
  { display: "Logic puzzle:\nNOT (0 OR 1) = ?", prompt: "Evaluate:", options: ["0", "1", "2", "Undefined"], correct: 0, explanation: "0 OR 1 = 1. NOT 1 = 0.", minLevel: 26, maxLevel: 32 },
  { display: "Logic puzzle:\n(1 OR 0) AND (0 OR 1) = ?", prompt: "Evaluate:", options: ["0", "1", "2", "Undefined"], correct: 1, explanation: "1 OR 0 = 1. 0 OR 1 = 1. 1 AND 1 = 1.", minLevel: 26, maxLevel: 32 },
  { display: "Logic puzzle:\nNOT (1 AND 1) = ?", prompt: "Evaluate (this is a NAND):", options: ["0", "1", "True", "False"], correct: 0, explanation: "1 AND 1 = 1. NOT 1 = 0.", minLevel: 26, maxLevel: 32 },

  // Level 33-40: Combined skills - XOR, NAND, ASCII (12)
  { display: "XOR gate:\n1 XOR 0 = ?", prompt: "What is the output?", options: ["0", "1", "2", "Undefined"], correct: 1, explanation: "XOR: different inputs \u2192 1. 1 XOR 0 = 1.", minLevel: 33, maxLevel: 40 },
  { display: "XOR gate:\n1 XOR 1 = ?", prompt: "What is the output?", options: ["0", "1", "2", "Undefined"], correct: 0, explanation: "XOR: same inputs \u2192 0. 1 XOR 1 = 0.", minLevel: 33, maxLevel: 40 },
  { display: "NAND gate:\n1 NAND 0 = ?", prompt: "What is the output?", options: ["0", "1", "True", "False"], correct: 1, explanation: "NAND = NOT AND. 1 AND 0 = 0. NOT 0 = 1. So 1 NAND 0 = 1.", minLevel: 33, maxLevel: 40 },
  { display: "Hex: 0xFF", prompt: "What is 0xFF in decimal?", options: ["15", "127", "255", "256"], correct: 2, explanation: "0xFF = 15\u00d716 + 15 = 255.", minLevel: 33, maxLevel: 40 },
  { display: "Hex: 0x10", prompt: "What is 0x10 in decimal?", options: ["10", "16", "32", "100"], correct: 1, explanation: "0x10 = 1\u00d716 + 0 = 16.", minLevel: 33, maxLevel: 40 },
  { display: "8-bit binary", prompt: "What is the largest unsigned number?", options: ["127", "128", "255", "256"], correct: 2, explanation: "8 bits unsigned: 11111111 = 255.", minLevel: 33, maxLevel: 40 },
  { display: "ASCII code: 65", prompt: "What letter is ASCII 65?", options: ["a", "A", "B", "Z"], correct: 1, explanation: "ASCII 65 = uppercase A.", minLevel: 33, maxLevel: 40 },
  { display: "ASCII code: 97", prompt: "What letter is ASCII 97?", options: ["a", "A", "b", "z"], correct: 0, explanation: "ASCII 97 = lowercase a.", minLevel: 33, maxLevel: 40 },
  { display: "ASCII code: 48", prompt: "What character is ASCII 48?", options: ["0", "1", "A", "a"], correct: 0, explanation: "ASCII 48 = the character '0'.", minLevel: 33, maxLevel: 40 },
  { display: "Hex: 0x2A", prompt: "What is 0x2A in decimal?", options: ["32", "40", "42", "44"], correct: 2, explanation: "0x2A = 2\u00d716 + 10 = 42.", minLevel: 33, maxLevel: 40 },
  { display: "NOR gate:\n0 NOR 0 = ?", prompt: "What is the output?", options: ["0", "1", "2", "Undefined"], correct: 1, explanation: "NOR = NOT OR. 0 OR 0 = 0. NOT 0 = 1.", minLevel: 33, maxLevel: 40 },
  { display: "(1 XOR 0) AND (1 OR 0) = ?", prompt: "Evaluate:", options: ["0", "1", "2", "Undefined"], correct: 1, explanation: "1 XOR 0 = 1. 1 OR 0 = 1. 1 AND 1 = 1.", minLevel: 33, maxLevel: 40 },
  // Level 41-50: Advanced - Two's complement, bitwise ops (12)
  { display: "Signed 8-bit: 11111110", prompt: "What does this represent?", options: ["-1", "-2", "254", "126"], correct: 1, explanation: "Two's complement: flip bits (00000001) + 1 = 00000010 = 2. So -2.", minLevel: 41, maxLevel: 50 },
  { display: "Signed 8-bit: 10000000", prompt: "What does this represent?", options: ["-128", "-127", "128", "-1"], correct: 0, explanation: "10000000 in two's complement = -128 (most negative 8-bit).", minLevel: 41, maxLevel: 50 },
  { display: "Signed 8-bit: 11111111", prompt: "What does this represent?", options: ["-1", "255", "-128", "127"], correct: 0, explanation: "All 1s in two's complement = -1.", minLevel: 41, maxLevel: 50 },
  { display: "Bitwise AND:\n5 AND 3 = ?\n(101 AND 011)", prompt: "What is the result?", options: ["1", "3", "5", "7"], correct: 0, explanation: "101 AND 011 = 001 = 1.", minLevel: 41, maxLevel: 50 },
  { display: "Bitwise OR:\n5 OR 3 = ?\n(101 OR 011)", prompt: "What is the result?", options: ["1", "3", "5", "7"], correct: 3, explanation: "101 OR 011 = 111 = 7.", minLevel: 41, maxLevel: 50 },
  { display: "Bitwise XOR:\n5 XOR 3 = ?\n(101 XOR 011)", prompt: "What is the result?", options: ["2", "4", "6", "8"], correct: 2, explanation: "101 XOR 011 = 110 = 6.", minLevel: 41, maxLevel: 50 },
  { display: "How many bits needed\nto represent 1000?", prompt: "Minimum bits required:", options: ["8", "9", "10", "11"], correct: 2, explanation: "2^9=512 < 1000 < 2^10=1024. Need 10 bits.", minLevel: 41, maxLevel: 50 },
  { display: "Left shift: 5 << 1\n(101 << 1)", prompt: "What is the result?", options: ["2", "6", "10", "20"], correct: 2, explanation: "Left shift by 1 = multiply by 2. 5 << 1 = 1010 = 10.", minLevel: 41, maxLevel: 50 },
  { display: "Right shift: 12 >> 2\n(1100 >> 2)", prompt: "What is the result?", options: ["3", "4", "6", "48"], correct: 0, explanation: "Right shift by 2 = divide by 4. 12 >> 2 = 11 = 3.", minLevel: 41, maxLevel: 50 },
  { display: "Two's complement of 5:\nFlip bits, add 1", prompt: "What is -5 in 8-bit binary?", options: ["11111010", "11111011", "10000101", "11110101"], correct: 1, explanation: "5=00000101. Flip: 11111010. Add 1: 11111011.", minLevel: 41, maxLevel: 50 },
  { display: "Bitwise NOT of 0 (8-bit)", prompt: "NOT 00000000 = ?", options: ["00000000", "11111111", "10000000", "01111111"], correct: 1, explanation: "NOT flips all bits: 00000000 becomes 11111111.", minLevel: 41, maxLevel: 50 },
  { display: "A byte is 8 bits.\nA kilobyte is roughly...", prompt: "How many bytes?", options: ["100", "512", "1000", "1024"], correct: 3, explanation: "1 KB = 2^10 = 1024 bytes (in binary units).", minLevel: 41, maxLevel: 50 },

  // Extra questions across levels for variety (11)
  { display: "Binary: 1100", prompt: "What is 1100 in decimal?", options: ["10", "11", "12", "14"], correct: 2, explanation: "1100 = 8+4 = 12.", minLevel: 1, maxLevel: 10, bits: [1,1,0,0] },
  { display: "Decimal: 6", prompt: "Convert 6 to binary:", options: ["101", "110", "111", "1010"], correct: 1, explanation: "6 = 4+2 = binary 110.", minLevel: 1, maxLevel: 10 },
  { display: "Binary: 0100", prompt: "What is 0100 in decimal?", options: ["2", "4", "8", "16"], correct: 1, explanation: "0100 = 4.", minLevel: 1, maxLevel: 10, bits: [0,1,0,0] },
  { display: "Each bit doubles in value:\n... 16, 8, 4, 2, 1", prompt: "What value does the 6th bit have?", options: ["16", "32", "64", "128"], correct: 1, explanation: "Bit values: 1,2,4,8,16,32. The 6th bit = 32.", minLevel: 11, maxLevel: 18 },
  { display: "Hex: C", prompt: "What is hex C in decimal?", options: ["10", "11", "12", "13"], correct: 2, explanation: "Hex C = decimal 12.", minLevel: 19, maxLevel: 25 },
  { display: "Color code: #808080", prompt: "What color is this?", options: ["Black", "White", "Gray", "Red"], correct: 2, explanation: "80 hex = 128 decimal. Equal RGB = gray.", minLevel: 19, maxLevel: 25 },
  { display: "AND gate truth table:\n0,0=0  0,1=0  1,0=0  1,1=?", prompt: "Complete the table:", options: ["0", "1", "2", "Undefined"], correct: 1, explanation: "AND: 1 AND 1 = 1.", minLevel: 26, maxLevel: 32 },
  { display: "Hex: 0x64", prompt: "What is 0x64 in decimal?", options: ["64", "100", "104", "96"], correct: 1, explanation: "0x64 = 6\u00d716 + 4 = 100.", minLevel: 33, maxLevel: 40 },
  { display: "Signed 8-bit: 01111111", prompt: "What is this value?", options: ["126", "127", "128", "255"], correct: 1, explanation: "01111111 = 64+32+16+8+4+2+1 = 127 (max positive in signed 8-bit).", minLevel: 41, maxLevel: 50 },
  { display: "Bitwise: 12 AND 10\n(1100 AND 1010)", prompt: "What is the result?", options: ["2", "8", "10", "14"], correct: 1, explanation: "1100 AND 1010 = 1000 = 8.", minLevel: 41, maxLevel: 50 },
  { display: "Bitwise: 12 XOR 10\n(1100 XOR 1010)", prompt: "What is the result?", options: ["2", "6", "8", "14"], correct: 1, explanation: "1100 XOR 1010 = 0110 = 6.", minLevel: 41, maxLevel: 50 },
];

/* === Bit visualization helper === */

function BitBoxes({ bits }: { bits: number[] }) {
  return (
    <div className="flex items-center justify-center gap-1.5 my-3">
      {bits.map((b, i) => (
        <div
          key={i}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-colors ${
            b === 1
              ? "bg-cyan-500/30 border-cyan-400 text-cyan-300"
              : "bg-white/5 border-white/20 text-slate-500"
          }`}
        >
          {b}
        </div>
      ))}
      {bits.length <= 4 && (
        <div className="ml-2 flex flex-col items-center justify-center gap-0.5">
          {bits.map((_, i) => (
            <span key={i} className="text-[8px] text-slate-500 leading-none">
              {Math.pow(2, bits.length - 1 - i)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

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
  "Each binary digit doubles in value from right to left",
  "Binary uses only 0 and 1, like light switches",
  "Hex digits go: 0-9, then A=10, B=11, C=12, D=13, E=14, F=15",
  "AND needs both inputs to be 1 to output 1",
  "OR outputs 1 if at least one input is 1",
  "XOR outputs 1 only when inputs are different",
  "8 bits = 1 byte, can store values 0-255",
  "Two\u2019s complement lets us represent negative numbers",
];

/* === Component === */

export function BinaryBitsGame() {
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
    try { setHighScore(getLocalHighScore("binary-bits") ?? 0); } catch {}
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
      if (accuracy >= 0.8) sfxLevelUp(); else sfxGameOver();

      try {
        const prev = getLocalHighScore("binary-bits") ?? 0;
        if (score > prev) { setLocalHighScore("binary-bits", score); setHighScore(score); }
      } catch {}

      try {
        trackGamePlayed("binary-bits", score, { bestStreak, adaptiveLevel: adaptive.level });
        const profile = getProfile();
        const medals = checkAchievements(
          { gameId: "binary-bits", score, accuracy: Math.round(accuracy * 100), bestStreak, timeSeconds: elapsed },
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
          \U0001f4bb Binary & Bits
        </h1>
        <AudioToggles />
      </div>

      {/* Menu */}
      {phase === "menu" && (
        <div className="text-center py-8">
          <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Binary & Bits
          </h2>
          <p className="text-slate-400 mb-4">
            Learn the language of computers: binary, hex, and logic gates!
          </p>

          {highScore > 0 && (
            <div className="mb-6 text-sm text-yellow-400 flex items-center justify-center gap-1">
              <Trophy size={14} /> Best: {highScore}
            </div>
          )}

          <div className="mb-6 text-sm text-slate-500 max-w-md mx-auto">
            <p className="mb-2 font-semibold text-slate-300">What you&apos;ll learn:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-left">
              <span>\U0001f4a1 Binary counting</span>
              <span>\ud83d\udd22 Decimal conversion</span>
              <span>\U0001f3a8 Hex & color codes</span>
              <span>\u26a1 Logic gates</span>
              <span>\U0001f500 XOR & NAND</span>
              <span>\U0001f4bb ASCII encoding</span>
              <span>\u2796 Two\u2019s complement</span>
              <span>\u2699\ufe0f Bitwise operations</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-6">
            {QUESTIONS_PER_SESSION} questions per session &middot; Difficulty adapts to you
          </p>

          <button
            onClick={startGame}
            className="px-10 py-3 rounded-lg font-bold text-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
          >
            Start Game
          </button>
        </div>
      )}

      {/* Countdown */}
      {phase === "countdown" && (
        <div className="text-center py-16">
          <div className="text-7xl font-bold text-cyan-400 animate-pulse">
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
                {adaptive.lastAdjust === "up" ? "\u2191 Harder!" : "\u2193 Easier"}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full mb-4">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-300"
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
            {/* Bit visualization */}
            {currentQ.bits && <BitBoxes bits={currentQ.bits} />}
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
                classes += "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:border-cyan-500/50 cursor-pointer active:scale-95";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={phase === "feedback"}
                  className={classes}
                >
                  {phase === "feedback" && isCorrectAnswer && "\u2713 "}
                  {phase === "feedback" && isSelected && !isCorrectAnswer && "\u2717 "}
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
                className="w-full py-3 rounded-lg font-bold text-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                {currentIdx + 1 >= QUESTIONS_PER_SESSION ? "See Results" : "Next Question \u2192"}
              </button>
            </div>
          )}

          {phase === "playing" && (
            <button
              onClick={() => setPhase("menu")}
              className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              \u2190 Quit
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
          <div className="text-5xl mb-4">{accuracy >= 80 ? "\ud83c\udfc6" : accuracy >= 50 ? "\U0001f4bb" : "\ud83d\udcaa"}</div>
          <h2 className="text-3xl font-bold mb-2 text-cyan-400">Session Complete!</h2>

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
              game="binary-bits"
              score={score}
              level={Math.round(adaptive.level)}
              stats={{ accuracy, bestStreak, timeSeconds: elapsed }}
            />
          </div>

          <button
            onClick={() => setPhase("menu")}
            className="px-8 py-3 rounded-lg font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
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
