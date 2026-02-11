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

interface FontQuestion {
  render?: () => React.ReactNode;
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
  principle: string;
  minLevel: number;
  maxLevel: number;
}

// ── Constants ──

const GAME_ID = "font-explorer";
const QPS = 10;
const CD = 3;
const TL = 18;

function sh<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

// ── Specimen helper ──

function Specimen({ text, fontFamily, size = "text-2xl" }: { text: string; fontFamily: string; size?: string }) {
  return <div className={`${size} text-white leading-relaxed`} style={{ fontFamily }}>{text}</div>;
}

function FontPair({ heading, body, hFont, bFont }: { heading: string; body: string; hFont: string; bFont: string }) {
  return (
    <div className="space-y-1">
      <div className="text-lg text-white font-bold" style={{ fontFamily: hFont }}>{heading}</div>
      <div className="text-sm text-slate-300 leading-relaxed" style={{ fontFamily: bFont }}>{body}</div>
    </div>
  );
}

// ── Question Bank (50 questions) ──

const QS: FontQuestion[] = [
  // ═══ LEVEL 1-10: Serif vs sans-serif identification ═══
  {
    render: () => <Specimen text="The Quick Brown Fox" fontFamily="Georgia, serif" />,
    question: "What type of font is this?",
    options: ["Serif", "Sans-serif", "Monospace", "Script"],
    correctIdx: 0,
    explanation: "This is Georgia, a serif font. Serifs have small decorative strokes at the ends of letters.",
    principle: "Serif Identification",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => <Specimen text="The Quick Brown Fox" fontFamily="Arial, Helvetica, sans-serif" />,
    question: "What type of font is this?",
    options: ["Serif", "Sans-serif", "Monospace", "Handwritten"],
    correctIdx: 1,
    explanation: "This is Arial, a sans-serif font. 'Sans' means 'without' — these fonts lack the decorative strokes.",
    principle: "Sans-Serif Identification",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => <Specimen text="function hello()" fontFamily="'Courier New', Courier, monospace" />,
    question: "What type of font is this?",
    options: ["Serif", "Sans-serif", "Monospace", "Display"],
    correctIdx: 2,
    explanation: "This is Courier New, a monospace font. Each character takes the same width, common in code editors.",
    principle: "Monospace Identification",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => (
      <div className="flex flex-col gap-3">
        <Specimen text="Hello World" fontFamily="'Times New Roman', Times, serif" size="text-xl" />
        <Specimen text="Hello World" fontFamily="Verdana, Geneva, sans-serif" size="text-xl" />
      </div>
    ),
    question: "Which sample is the serif font?",
    options: ["The top one (Times New Roman)", "The bottom one (Verdana)", "Both are serif", "Neither is serif"],
    correctIdx: 0,
    explanation: "Times New Roman (top) has serifs — the small 'feet' at the end of strokes. Verdana (bottom) is sans-serif.",
    principle: "Serif vs Sans-Serif",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => <Specimen text="Design Matters" fontFamily="Georgia, serif" />,
    question: "What are serifs?",
    options: ["Small decorative strokes at the ends of letters", "The thickness of letter strokes", "The spacing between letters", "The height of lowercase letters"],
    correctIdx: 0,
    explanation: "Serifs are the small lines or strokes attached to the ends of letters. They guide the eye along lines of text.",
    principle: "What Are Serifs",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => (
      <div className="flex flex-col gap-3">
        <div className="text-xl text-white" style={{ fontFamily: "Georgia, serif" }}>Aa Bb Cc</div>
        <div className="text-xl text-white" style={{ fontFamily: "Arial, sans-serif" }}>Aa Bb Cc</div>
      </div>
    ),
    question: "Which font would be easier to read in a long printed book?",
    options: ["The top one (serif)", "The bottom one (sans-serif)", "Both are equally readable", "Neither works for books"],
    correctIdx: 0,
    explanation: "Serif fonts like Georgia are traditionally preferred for long-form print. The serifs help guide the eye along lines of text.",
    principle: "Readability in Print",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => <Specimen text="Clean Interface" fontFamily="Verdana, Geneva, sans-serif" />,
    question: "Why are sans-serif fonts popular for websites?",
    options: ["They render more clearly on screens", "They are always bolder", "They look more old-fashioned", "They're harder to read"],
    correctIdx: 0,
    explanation: "Sans-serif fonts render more clearly on screens, especially at small sizes, because they lack intricate serif details.",
    principle: "Fonts for Screen",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => <Specimen text="HEADLINE NEWS" fontFamily="Impact, 'Arial Black', sans-serif" />,
    question: "What kind of font is this Impact-style font best used for?",
    options: ["Body text in long articles", "Headlines and short impactful text", "Code editors", "Formal letters"],
    correctIdx: 1,
    explanation: "Impact is a display font designed for headlines. Its heavy weight and condensed form grab attention but are hard to read at length.",
    principle: "Display Fonts",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => (
      <div className="flex gap-6">
        <div className="text-center"><div className="text-2xl text-white" style={{ fontFamily: "Georgia, serif" }}>Ag</div><div className="text-[10px] text-slate-500 mt-1">Font A</div></div>
        <div className="text-center"><div className="text-2xl text-white" style={{ fontFamily: "'Courier New', monospace" }}>Ag</div><div className="text-[10px] text-slate-500 mt-1">Font B</div></div>
      </div>
    ),
    question: "Which font has every letter the same width?",
    options: ["Font A (Georgia)", "Font B (Courier New)", "Both", "Neither"],
    correctIdx: 1,
    explanation: "Courier New (Font B) is monospace — every character takes the same horizontal space. Georgia characters have different widths.",
    principle: "Monospace Character Width",
    minLevel: 1, maxLevel: 10,
  },
  {
    render: () => <Specimen text="Typography" fontFamily="'Times New Roman', Times, serif" />,
    question: "What font is most commonly the default in word processors?",
    options: ["Times New Roman", "Comic Sans", "Impact", "Courier New"],
    correctIdx: 0,
    explanation: "Times New Roman has been the default font in many word processors for decades. It's a classic serif typeface.",
    principle: "Common Fonts",
    minLevel: 1, maxLevel: 10,
  },

  // ═══ LEVEL 11-18: Font mood/personality ═══
  {
    render: () => (
      <div className="flex flex-col gap-3">
        <div className="text-xl text-white" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}>Sarah & James</div>
        <div className="text-xl text-white" style={{ fontFamily: "Arial, sans-serif" }}>Sarah & James</div>
      </div>
    ),
    question: "Which font is more appropriate for a wedding invitation?",
    options: ["The top one (script/cursive)", "The bottom one (sans-serif)", "Both work equally", "Neither is appropriate"],
    correctIdx: 0,
    explanation: "Script/cursive fonts convey elegance and formality, making them perfect for wedding invitations and formal events.",
    principle: "Font for Formality",
    minLevel: 11, maxLevel: 18,
  },
  {
    render: () => (
      <div className="flex flex-col gap-3">
        <div className="text-lg text-white font-bold" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>TechVenture AI</div>
        <div className="text-lg text-white" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>TechVenture AI</div>
      </div>
    ),
    question: "Which font feels more modern for a tech startup?",
    options: ["The top one (sans-serif)", "The bottom one (serif)", "Both feel equally modern", "Neither is appropriate"],
    correctIdx: 0,
    explanation: "Sans-serif fonts feel clean, modern, and tech-forward. Most tech companies (Google, Apple, Meta) use sans-serif branding.",
    principle: "Font for Tech",
    minLevel: 11, maxLevel: 18,
  },
  {
    render: () => (
      <div className="flex flex-col gap-3">
        <div className="text-lg text-white" style={{ fontFamily: "Georgia, serif" }}>The Daily Chronicle</div>
        <div className="text-lg text-white" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>The Daily Chronicle</div>
      </div>
    ),
    question: "Which font is more appropriate for a newspaper name?",
    options: ["The top one (Georgia)", "The bottom one (Comic Sans)", "Both work equally", "Neither is appropriate"],
    correctIdx: 0,
    explanation: "Serif fonts like Georgia convey authority and tradition — perfect for newspapers. Comic Sans is too casual and playful.",
    principle: "Font Authority",
    minLevel: 11, maxLevel: 18,
  },
  {
    render: () => <Specimen text="FUN ZONE" fontFamily="'Comic Sans MS', 'Comic Sans', cursive" />,
    question: "Where would Comic Sans be MOST appropriate?",
    options: ["A legal document", "A children's birthday party flyer", "A bank's annual report", "A job resume"],
    correctIdx: 1,
    explanation: "Comic Sans has a playful, informal feel perfect for children's content. It's inappropriate for professional documents.",
    principle: "Font Appropriateness",
    minLevel: 11, maxLevel: 18,
  },
  {
    render: () => (
      <div className="flex flex-col gap-3">
        <div className="text-lg text-white" style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}>Chapter One</div>
        <div className="text-lg text-white" style={{ fontFamily: "Impact, 'Arial Black', sans-serif" }}>Chapter One</div>
      </div>
    ),
    question: "Which font better suits a novel's chapter heading?",
    options: ["The top one (elegant serif)", "The bottom one (Impact)", "Both work equally", "Neither is appropriate"],
    correctIdx: 0,
    explanation: "Elegant serif fonts suit literature. Impact is designed for attention-grabbing headlines, not literary contexts.",
    principle: "Font for Literature",
    minLevel: 11, maxLevel: 18,
  },
  {
    render: () => <Specimen text="SALE! 50% OFF" fontFamily="Impact, 'Arial Black', sans-serif" />,
    question: "Why does Impact work well for this sale banner?",
    options: ["It's easy to read in long paragraphs", "It's bold and attention-grabbing at large sizes", "It looks elegant", "It's the most professional font"],
    correctIdx: 1,
    explanation: "Impact's heavy weight and condensed form create urgency and grab attention — ideal for promotional content.",
    principle: "Display Font Purpose",
    minLevel: 11, maxLevel: 18,
  },
  {
    render: () => (
      <div className="flex flex-col gap-2">
        <div className="text-base text-white" style={{ fontFamily: "'Courier New', Courier, monospace" }}>const data = fetch(url);</div>
        <div className="text-base text-white" style={{ fontFamily: "Georgia, serif" }}>const data = fetch(url);</div>
      </div>
    ),
    question: "Which font is standard for displaying code?",
    options: ["The top one (monospace)", "The bottom one (serif)", "Both work for code", "Neither is appropriate"],
    correctIdx: 0,
    explanation: "Monospace fonts are standard for code because equal character widths help with alignment and readability of syntax.",
    principle: "Code Typography",
    minLevel: 11, maxLevel: 18,
  },
  {
    render: () => (
      <div className="flex flex-col gap-2">
        <div className="text-base text-white" style={{ fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" }}>LUXURY RESORT & SPA</div>
        <div className="text-base text-white" style={{ fontFamily: "Verdana, Geneva, sans-serif" }}>LUXURY RESORT & SPA</div>
      </div>
    ),
    question: "Which font conveys more luxury and sophistication?",
    options: ["The top one (Palatino)", "The bottom one (Verdana)", "Both feel luxurious", "Neither feels luxurious"],
    correctIdx: 0,
    explanation: "Palatino is an elegant serif typeface that conveys luxury. Verdana is friendly and utilitarian — less suited for luxury branding.",
    principle: "Font for Luxury",
    minLevel: 11, maxLevel: 18,
  },

  // ═══ LEVEL 19-25: Font pairing ═══
  {
    render: () => <FontPair heading="Breaking News" body="The latest developments from around the world continue to shape the global landscape." hFont="Georgia, serif" bFont="Verdana, Geneva, sans-serif" />,
    question: "Is this font pairing (serif heading + sans-serif body) a good combination?",
    options: ["Yes — contrast between heading and body creates good hierarchy", "No — you should never mix serif and sans-serif", "Only if both are the same size", "Only for code"],
    correctIdx: 0,
    explanation: "Pairing a serif heading with a sans-serif body is a classic, effective combination. The contrast creates clear hierarchy.",
    principle: "Serif + Sans-Serif Pairing",
    minLevel: 19, maxLevel: 25,
  },
  {
    render: () => <FontPair heading="My Blog Post" body="Here is some body text that goes along with the heading above." hFont="Georgia, serif" bFont="'Times New Roman', Times, serif" />,
    question: "Why might this pairing (Georgia heading + Times New Roman body) feel weak?",
    options: ["Both fonts are too similar — not enough contrast", "The fonts clash dramatically", "Sans-serif should never be used", "The fonts are too different"],
    correctIdx: 0,
    explanation: "Two similar serif fonts create low contrast. Good pairings need enough visual distinction to establish hierarchy.",
    principle: "Avoid Similar Pairings",
    minLevel: 19, maxLevel: 25,
  },
  {
    render: () => (
      <div className="space-y-1">
        <div className="text-lg text-white font-bold" style={{ fontFamily: "Impact, 'Arial Black', sans-serif" }}>FLASH SALE</div>
        <div className="text-sm text-slate-300" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}>Hurry and grab these exclusive offers before they expire.</div>
      </div>
    ),
    question: "What's wrong with this font pairing?",
    options: ["Impact + Script creates a chaotic, conflicting feel", "Both fonts are too formal", "Both fonts are too similar", "Nothing — this pairing is perfect"],
    correctIdx: 0,
    explanation: "Impact (bold display) paired with Script (delicate cursive) creates visual chaos. Choose fonts that complement, not compete.",
    principle: "Font Harmony",
    minLevel: 19, maxLevel: 25,
  },
  {
    render: () => <FontPair heading="Annual Report 2025" body="This report summarizes the financial performance and strategic initiatives undertaken by the company." hFont="Arial, Helvetica, sans-serif" bFont="Georgia, serif" />,
    question: "Is this pairing suitable for a professional report?",
    options: ["Yes — clean sans-serif heading with readable serif body", "No — serif fonts are unprofessional", "No — fonts should always match", "Only for children's books"],
    correctIdx: 0,
    explanation: "A clean sans-serif heading with a serif body is great for reports. Both are professional and the contrast creates clear hierarchy.",
    principle: "Professional Pairing",
    minLevel: 19, maxLevel: 25,
  },
  {
    render: () => (
      <div className="space-y-1">
        <div className="text-lg text-white font-bold" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>Quarterly Earnings</div>
        <div className="text-sm text-slate-300" style={{ fontFamily: "'Courier New', Courier, monospace" }}>Revenue increased by 15% year-over-year driven by strong performance in Q3.</div>
      </div>
    ),
    question: "What's wrong with this font choice for a financial report?",
    options: ["Comic Sans heading is too casual; Courier body is hard to read for long text", "Both fonts are too formal", "The fonts pair well", "Only the body font is wrong"],
    correctIdx: 0,
    explanation: "Comic Sans is too playful for financial content. Courier is monospace, designed for code not body text. Both are poor choices here.",
    principle: "Context-Appropriate Fonts",
    minLevel: 19, maxLevel: 25,
  },
  {
    render: () => <FontPair heading="Welcome Home" body="Discover our curated collection of home furnishings." hFont="'Palatino Linotype', 'Book Antiqua', Palatino, serif" bFont="Arial, Helvetica, sans-serif" />,
    question: "How many font families should you typically use in one design?",
    options: ["1-2, maximum 3", "As many as you want", "Exactly 5", "Only 1 ever"],
    correctIdx: 0,
    explanation: "The general rule is 2-3 fonts maximum. More creates visual chaos. This pairing uses 2 fonts effectively.",
    principle: "Font Limit Rule",
    minLevel: 19, maxLevel: 25,
  },
  {
    render: () => (
      <div className="space-y-1">
        <div className="text-lg text-white" style={{ fontFamily: "Verdana, Geneva, sans-serif" }}>Modern Design Studio</div>
        <div className="text-sm text-slate-300" style={{ fontFamily: "Tahoma, Geneva, sans-serif" }}>We create beautiful digital experiences for forward-thinking brands.</div>
      </div>
    ),
    question: "What makes this pairing (Verdana + Tahoma) problematic?",
    options: ["They're too similar — both are geometric sans-serifs with minimal contrast", "They clash too much", "Verdana is a serif font", "The fonts are too different"],
    correctIdx: 0,
    explanation: "Verdana and Tahoma are extremely similar sans-serif fonts. The lack of contrast means no clear visual hierarchy between heading and body.",
    principle: "Sufficient Contrast in Pairing",
    minLevel: 19, maxLevel: 25,
  },

  // ═══ LEVEL 26-32: Font anatomy ═══
  {
    render: () => (
      <div className="flex gap-6 items-end">
        <div className="text-5xl text-white" style={{ fontFamily: "Georgia, serif" }}>x</div>
        <div className="text-5xl text-white" style={{ fontFamily: "Georgia, serif" }}>h</div>
      </div>
    ),
    question: "What is 'x-height' in typography?",
    options: ["The height of the lowercase letter 'x'", "The height of uppercase letters", "The total line height", "The width of the letter 'x'"],
    correctIdx: 0,
    explanation: "X-height is the height of the lowercase 'x'. It affects readability — fonts with larger x-heights appear more readable at small sizes.",
    principle: "X-Height",
    minLevel: 26, maxLevel: 32,
  },
  {
    render: () => <div className="text-5xl text-white" style={{ fontFamily: "Georgia, serif" }}>b d p q</div>,
    question: "What are the parts of 'b' and 'd' that extend above the x-height called?",
    options: ["Ascenders", "Descenders", "Serifs", "Counters"],
    correctIdx: 0,
    explanation: "Ascenders are the parts of letters (b, d, f, h, k, l) that rise above the x-height. They help with word recognition.",
    principle: "Ascenders",
    minLevel: 26, maxLevel: 32,
  },
  {
    render: () => <div className="text-5xl text-white" style={{ fontFamily: "Georgia, serif" }}>g p q y</div>,
    question: "What are the parts that drop below the baseline called?",
    options: ["Ascenders", "Descenders", "Ligatures", "Terminals"],
    correctIdx: 1,
    explanation: "Descenders are parts of letters (g, j, p, q, y) that drop below the baseline. Too-tight line spacing can clip descenders.",
    principle: "Descenders",
    minLevel: 26, maxLevel: 32,
  },
  {
    render: () => (
      <div className="flex gap-6 items-baseline">
        <div className="text-4xl text-white" style={{ fontFamily: "Georgia, serif" }}>Hy</div>
        <div className="text-4xl text-blue-400" style={{ fontFamily: "Georgia, serif" }}>—</div>
      </div>
    ),
    question: "What is the 'baseline' in typography?",
    options: ["The invisible line that letters sit on", "The top of capital letters", "The midpoint of text", "The space between lines"],
    correctIdx: 0,
    explanation: "The baseline is the invisible line where most letters rest. It's the foundation of typographic alignment.",
    principle: "Baseline",
    minLevel: 26, maxLevel: 32,
  },
  {
    render: () => (
      <div className="space-y-4">
        <div className="text-xl text-white" style={{ fontFamily: "Georgia, serif", letterSpacing: "0.2em" }}>W I D E&nbsp;&nbsp;S P A C I N G</div>
        <div className="text-xl text-white" style={{ fontFamily: "Georgia, serif", letterSpacing: "-0.05em" }}>Tight Spacing</div>
      </div>
    ),
    question: "What is the space between individual letters called?",
    options: ["Leading", "Tracking / Letter-spacing", "Kerning", "Line-height"],
    correctIdx: 1,
    explanation: "Tracking (letter-spacing) is the uniform spacing between all letters. It differs from kerning, which adjusts specific letter pairs.",
    principle: "Tracking",
    minLevel: 26, maxLevel: 32,
  },
  {
    render: () => (
      <div className="space-y-2">
        <div className="text-base text-white leading-none" style={{ fontFamily: "Georgia, serif" }}>This text has very tight leading — lines are close together and may overlap descenders with ascenders.</div>
        <div className="h-px bg-white/20" />
        <div className="text-base text-white leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>This text has comfortable leading — lines are spaced apart for easy reading and clear visual rhythm.</div>
      </div>
    ),
    question: "What is 'leading' (rhymes with 'heading') in typography?",
    options: ["The space between lines of text", "The space between letters", "The weight of the font", "The font size"],
    correctIdx: 0,
    explanation: "Leading (line-height) is the vertical space between lines. Proper leading improves readability — typically 1.4-1.6x the font size.",
    principle: "Leading / Line Height",
    minLevel: 26, maxLevel: 32,
  },
  {
    render: () => (
      <div className="text-4xl text-white" style={{ fontFamily: "Georgia, serif" }}>
        <span>T</span><span className="text-blue-400">o</span> <span>A</span><span className="text-blue-400">V</span>
      </div>
    ),
    question: "What is 'kerning'?",
    options: ["Adjusting space between specific pairs of letters", "The font size", "The line height", "The weight of the font"],
    correctIdx: 0,
    explanation: "Kerning adjusts spacing between specific letter pairs (like AV, To, WA) for optical balance. It differs from tracking which is uniform.",
    principle: "Kerning",
    minLevel: 26, maxLevel: 32,
  },

  // ═══ LEVEL 33-40: Professional typography ═══
  {
    render: () => (
      <div className="space-y-1 w-64">
        <div className="text-lg text-white" style={{ fontFamily: "Georgia, serif" }}>Main Heading</div>
        <div className="text-base text-white" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>Subheading text</div>
        <div className="text-sm text-white" style={{ fontFamily: "Impact, 'Arial Black', sans-serif" }}>Body paragraph with some content.</div>
        <div className="text-xs text-white" style={{ fontFamily: "'Courier New', Courier, monospace" }}>Footer caption text here.</div>
      </div>
    ),
    question: "What's wrong with this design?",
    options: ["Too many different fonts (4 fonts creates visual chaos)", "All fonts are too small", "Colors need more contrast", "Heading should be biggest"],
    correctIdx: 0,
    explanation: "Using 4 different font families creates visual chaos. Stick to 2-3 maximum for a cohesive design.",
    principle: "Font Limit",
    minLevel: 33, maxLevel: 40,
  },
  {
    render: () => (
      <div className="w-64 text-sm text-white text-justify leading-snug" style={{ fontFamily: "Arial, sans-serif" }}>
        This paragraph is fully justified. Notice how extra spaces appear between words to fill the line width. This can create unsightly &quot;rivers&quot; of white space flowing through the text.
      </div>
    ),
    question: "What typographic problem can full justification cause?",
    options: ["'Rivers' — uneven white space gaps flowing through text", "Text becomes too small", "Letters overlap", "Colors change"],
    correctIdx: 0,
    explanation: "Full justification can create 'rivers' — visible streams of white space through paragraphs. Left-aligned text avoids this.",
    principle: "Justification Rivers",
    minLevel: 33, maxLevel: 40,
  },
  {
    render: () => (
      <div className="w-80 text-sm text-white" style={{ fontFamily: "Arial, sans-serif" }}>
        <p className="mb-2">This paragraph is set at a comfortable reading width, making it easy to scan from line to line without losing your place.</p>
      </div>
    ),
    question: "What is the ideal line length for body text (in characters)?",
    options: ["10-20 characters", "45-75 characters", "100-150 characters", "200+ characters"],
    correctIdx: 1,
    explanation: "The ideal line length is 45-75 characters (about 2-3 alphabets). Too wide and the eye loses its place; too narrow and reading is choppy.",
    principle: "Optimal Line Length",
    minLevel: 33, maxLevel: 40,
  },
  {
    render: () => (
      <div className="space-y-3 w-64">
        <div><div className="text-2xl text-white font-bold" style={{ fontFamily: "Georgia, serif" }}>Heading</div></div>
        <div><div className="text-sm text-slate-300" style={{ fontFamily: "Arial, sans-serif" }}>Body text content</div></div>
      </div>
    ),
    question: "What is a 'type scale'?",
    options: ["A predefined set of harmonious font sizes (e.g. 12, 14, 16, 20, 24, 32)", "A tool for weighing fonts", "The number of fonts in a design", "The color of the text"],
    correctIdx: 0,
    explanation: "A type scale is a progression of font sizes based on a ratio (like 1.25x or 1.5x). It creates visual harmony and consistent hierarchy.",
    principle: "Type Scale",
    minLevel: 33, maxLevel: 40,
  },
  {
    render: () => (
      <div className="w-64">
        <div className="text-[10px] text-white leading-tight" style={{ fontFamily: "Georgia, serif" }}>This text is set in Georgia at a very small size. The serif details become muddy and hard to read at this scale, reducing legibility significantly.</div>
      </div>
    ),
    question: "Why do serif fonts become problematic at very small sizes on screens?",
    options: ["Serif details become muddy and reduce legibility", "Serifs make text too bold", "Screen resolution is always too low", "Serif fonts can't be small"],
    correctIdx: 0,
    explanation: "At small sizes, serif details can't be rendered crisply on screens, causing visual noise. Sans-serif fonts are cleaner at small sizes.",
    principle: "Serif Legibility at Small Sizes",
    minLevel: 33, maxLevel: 40,
  },
  {
    render: () => (
      <div className="w-64 space-y-2">
        <div className="text-lg text-white font-bold" style={{ fontFamily: "Arial, sans-serif" }}>ALL CAPS HEADING</div>
        <div className="text-sm text-white uppercase tracking-wider" style={{ fontFamily: "Arial, sans-serif" }}>all caps body text that goes on for quite a while and makes you realize how hard it is to read long passages in uppercase</div>
      </div>
    ),
    question: "Why is ALL CAPS bad for body text?",
    options: ["It reduces readability — we recognize words by shape, which ALL CAPS removes", "It looks too formal", "It's always rude", "There's no problem"],
    correctIdx: 0,
    explanation: "ALL CAPS text strips away word-shape cues (ascenders/descenders), reducing reading speed by 10-20%. Use sparingly for short headings only.",
    principle: "ALL CAPS Readability",
    minLevel: 33, maxLevel: 40,
  },
  {
    render: () => (
      <div className="w-64 space-y-2">
        <div className="text-sm text-white" style={{ fontFamily: "Verdana, sans-serif", lineHeight: "2.5" }}>This text has extremely generous line height, making the paragraph look disconnected and floaty with too much space between each line of text.</div>
      </div>
    ),
    question: "What's the issue with this text?",
    options: ["Line height is too large — text looks disconnected", "Font is too small", "Text should be centered", "Colors are wrong"],
    correctIdx: 0,
    explanation: "Excessive line height (2.5x) makes text look scattered. Optimal line height for body text is 1.4-1.6x the font size.",
    principle: "Optimal Line Height",
    minLevel: 33, maxLevel: 40,
  },
  {
    render: () => (
      <div className="w-64 space-y-1">
        <div className="text-sm text-white" style={{ fontFamily: "Arial, sans-serif" }}>Regular weight text.</div>
        <div className="text-sm text-white font-bold" style={{ fontFamily: "Arial, sans-serif" }}>Bold text for emphasis.</div>
        <div className="text-sm text-white italic" style={{ fontFamily: "Arial, sans-serif" }}>Italic text for emphasis.</div>
        <div className="text-sm text-white font-bold italic underline" style={{ fontFamily: "Arial, sans-serif" }}>Bold italic underline combo.</div>
      </div>
    ),
    question: "What's wrong with the last line of text?",
    options: ["Too many emphasis styles combined (bold + italic + underline)", "Font is too small", "Should be all caps instead", "Italic is wrong"],
    correctIdx: 0,
    explanation: "Stacking bold, italic, AND underline is visual noise. Use one emphasis method at a time for clarity.",
    principle: "Emphasis Restraint",
    minLevel: 33, maxLevel: 40,
  },

  // ═══ LEVEL 41-50: Font classification ═══
  {
    render: () => <Specimen text="Humane Design" fontFamily="Verdana, Geneva, sans-serif" />,
    question: "Verdana is an example of what sans-serif classification?",
    options: ["Humanist sans-serif", "Geometric sans-serif", "Neo-grotesque", "Slab serif"],
    correctIdx: 0,
    explanation: "Verdana is a humanist sans-serif — it has calligraphic influence, varied stroke widths, and open forms for readability.",
    principle: "Humanist Sans-Serif",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => <Specimen text="Perfect Circle" fontFamily="'Century Gothic', 'Apple Gothic', sans-serif" />,
    question: "What characterizes a Geometric sans-serif font?",
    options: ["Letters based on geometric shapes (circles, squares, triangles)", "Letters with serifs", "Random organic forms", "Only monospace letters"],
    correctIdx: 0,
    explanation: "Geometric sans-serifs (Futura, Century Gothic) are built from pure geometric forms. The 'O' is often a near-perfect circle.",
    principle: "Geometric Sans-Serif",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => <Specimen text="The Standard" fontFamily="Arial, Helvetica, sans-serif" />,
    question: "Arial/Helvetica belong to which sans-serif classification?",
    options: ["Humanist", "Geometric", "Neo-grotesque (Realist)", "Slab serif"],
    correctIdx: 2,
    explanation: "Arial/Helvetica are neo-grotesque (realist) — they have uniform stroke widths, closed forms, and a neutral appearance.",
    principle: "Neo-Grotesque",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => <Specimen text="Bold Statement" fontFamily="'Courier New', Courier, monospace" />,
    question: "Courier is a slab serif font. What defines slab serifs?",
    options: ["Thick, block-like serifs with minimal bracketing", "No serifs at all", "Very thin, delicate serifs", "Curved, flowing letter forms"],
    correctIdx: 0,
    explanation: "Slab serifs (Courier, Rockwell, Roboto Slab) have thick, block-shaped serifs. They feel bold, sturdy, and mechanical.",
    principle: "Slab Serif",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => (
      <div className="space-y-2">
        <div className="text-xl text-white" style={{ fontFamily: "'Times New Roman', Times, serif" }}>The Times</div>
        <div className="text-xl text-white" style={{ fontFamily: "Georgia, serif" }}>The Times</div>
      </div>
    ),
    question: "Times New Roman is classified as what serif type?",
    options: ["Transitional serif", "Old-style serif", "Slab serif", "Modern serif"],
    correctIdx: 0,
    explanation: "Times New Roman is a transitional serif — between old-style (Garamond) and modern (Didot). It has moderate contrast in stroke widths.",
    principle: "Transitional Serif",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => <Specimen text="Elegant Fashion" fontFamily="'Palatino Linotype', 'Book Antiqua', Palatino, serif" />,
    question: "What characterizes an Old-Style (Humanist) serif font like Palatino?",
    options: ["Low contrast between thick and thin strokes, diagonal stress", "Extreme thick-thin contrast, vertical stress", "No variation in stroke width", "Block-like serifs"],
    correctIdx: 0,
    explanation: "Old-style serifs (Garamond, Palatino) have gentle thick-thin contrast and diagonal stress, inspired by calligraphy.",
    principle: "Old-Style Serif",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => (
      <div className="flex gap-6">
        <div className="text-center"><div className="text-3xl text-white" style={{ fontFamily: "Georgia, serif" }}>a</div><div className="text-[10px] text-slate-500 mt-1">Font A</div></div>
        <div className="text-center"><div className="text-3xl text-white" style={{ fontFamily: "'Courier New', monospace" }}>a</div><div className="text-[10px] text-slate-500 mt-1">Font B</div></div>
        <div className="text-center"><div className="text-3xl text-white" style={{ fontFamily: "Arial, sans-serif" }}>a</div><div className="text-[10px] text-slate-500 mt-1">Font C</div></div>
      </div>
    ),
    question: "Which font has a double-story 'a' (with the bowl and arch)?",
    options: ["Font A (Georgia)", "Font B (Courier)", "Font C (Arial)", "All of them"],
    correctIdx: 0,
    explanation: "Georgia typically renders a double-story 'a' (with a bowl below and an arch above). This is a key identifier for many serif fonts.",
    principle: "Letter Form Details",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => <Specimen text="Swiss Style" fontFamily="Arial, Helvetica, sans-serif" />,
    question: "Helvetica is central to which design movement?",
    options: ["Swiss/International Typographic Style", "Art Nouveau", "Bauhaus", "Rococo"],
    correctIdx: 0,
    explanation: "Helvetica is the icon of Swiss/International Style — emphasizing clarity, objectivity, and clean grid-based design.",
    principle: "Typography History",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => (
      <div className="space-y-2">
        <div className="text-2xl text-white" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}>Invitation</div>
        <div className="text-2xl text-white" style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}>Invitation</div>
      </div>
    ),
    question: "Both are 'script' fonts. What's the key difference?",
    options: ["Top is formal/connected script; bottom is casual/disconnected", "They are identical", "Bottom is more formal", "Top is sans-serif"],
    correctIdx: 0,
    explanation: "Script fonts range from formal (connected, calligraphic like Brush Script) to casual (disconnected, playful like Comic Sans).",
    principle: "Script Font Categories",
    minLevel: 41, maxLevel: 50,
  },
  {
    render: () => (
      <div className="w-64 p-3 rounded-xl bg-slate-700/50 space-y-1">
        <div className="text-xs text-slate-400">Website accessibility tip:</div>
        <div className="text-sm text-white" style={{ fontFamily: "Arial, sans-serif" }}>Always ensure body text is at least 16px for comfortable reading on screens.</div>
      </div>
    ),
    question: "What is the recommended minimum font size for body text on the web?",
    options: ["8px", "12px", "16px", "24px"],
    correctIdx: 2,
    explanation: "16px is the standard minimum for web body text. Smaller sizes strain readers' eyes, especially on mobile devices.",
    principle: "Minimum Font Size",
    minLevel: 41, maxLevel: 50,
  },
];

// ── Question picker ──

function pickQ(pool: FontQuestion[], level: number, count: number): FontQuestion[] {
  const ok = pool.filter(c => level >= c.minLevel - 3 && level <= c.maxLevel + 8);
  return sh(ok.length >= count ? ok : pool).slice(0, count);
}

// ── Component ──

export function FontExplorerGame() {
  useGameMusic();
  const [phase, setPhase] = useState<Phase>("menu");
  const [countdown, setCountdown] = useState(CD);
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));
  const [questions, setQuestions] = useState<FontQuestion[]>([]);
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
    setQuestions(pickQ(QS, 1, QPS)); setCi(0); setSel(null); setScore(0); setCc(0);
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
        <h1 className="text-base font-bold text-white tracking-wide">Font Explorer</h1>
        <AudioToggles />
      </div>

      {aq.length > 0 && ai < aq.length && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <AchievementToast name={aq[ai].name} tier={aq[ai].tier} onDismiss={() => { if (ai + 1 >= aq.length) setAq([]); setAi(i => i + 1); }} />
        </div>
      )}

      {phase === "menu" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-md">
          <div className="text-5xl mb-3">🔤</div>
          <h2 className="text-3xl font-bold text-white mb-2">Font Explorer</h2>
          <p className="text-slate-400 text-sm mb-4">Master typography! Learn serif vs sans-serif, font pairing, readability, and professional type choices. {QPS} questions per session.</p>
          {hi > 0 && <div className="text-xs text-slate-500 mb-4 flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-500" /> Best: {hi.toLocaleString()}</div>}
          <div className="flex gap-3 mb-5 items-baseline">
            <span className="text-xl text-white" style={{ fontFamily: "Georgia, serif" }}>Aa</span>
            <span className="text-xl text-white" style={{ fontFamily: "Arial, sans-serif" }}>Bb</span>
            <span className="text-xl text-white" style={{ fontFamily: "'Courier New', monospace" }}>Cc</span>
            <span className="text-xl text-white" style={{ fontFamily: "'Palatino Linotype', serif" }}>Dd</span>
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

          {/* Font specimen */}
          {q.render && (
            <div className="bg-slate-800/80 rounded-2xl border border-white/5 p-6 flex items-center justify-center min-h-[100px]">
              {q.render()}
            </div>
          )}

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
          <h3 className="text-2xl font-bold text-white mb-1">{acc === 100 ? "Font Master!" : acc >= 80 ? "Type Expert!" : "Keep Exploring!"}</h3>
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
