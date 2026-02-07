# Agent 5: E-Reader Games Part A (Sudoku, Word Search, Trivia Quiz)

> Budget: $50 | Model: opus

## YOUR OWNERSHIP
You exclusively own and can edit these files:
- `apps/web/app/games/sudoku/page.tsx` (CREATE)
- `apps/web/app/games/word-search/page.tsx` (CREATE)
- `apps/web/app/games/trivia-quiz/page.tsx` (CREATE)
- `apps/web/components/games/SudokuGame.tsx` (CREATE)
- `apps/web/components/games/WordSearchGame.tsx` (CREATE)
- `apps/web/components/games/TriviaQuizGame.tsx` (CREATE)
- `apps/web/lib/games/eink-utils.ts` (CREATE — shared e-ink utilities)

## DO NOT TOUCH
- `apps/web/app/games/page.tsx` (games index)
- Any existing game components or files
- Shared libs (audio, achievements, use-scores) — use but don't edit

## CRITICAL: E-INK COMPATIBILITY REQUIREMENTS

These games MUST work on e-ink e-readers. This imposes STRICT constraints:

### What works on e-readers:
- `onClick` handlers on buttons and divs ✅
- Basic CSS (backgrounds, borders, fonts, flexbox, grid) ✅
- High contrast black text on white background ✅
- Simple JavaScript (state updates, DOM changes) ✅

### What does NOT work:
- ❌ NO CSS animations, transitions, or transforms
- ❌ NO `onPointerDown`, `onTouchStart`, `onMouseMove`, drag events
- ❌ NO Canvas API
- ❌ NO requestAnimationFrame or setInterval for animations
- ❌ NO gradients (use solid colors only)
- ❌ NO opacity/transparency
- ❌ NO box-shadow (use borders instead)
- ❌ NO SVG animations
- ❌ NO audio (Web Audio API won't exist on these browsers)
- ❌ NO localStorage on some e-readers (wrap in try/catch, gracefully degrade)

### Design rules:
- Black (#000) on white (#fff) or white on black — ONLY
- Borders: 2px solid black minimum
- Font size: 16px minimum, prefer 18px+
- Tap targets: 44px minimum, prefer 60px+
- Grid cells: at minimum 40x40px
- Use CSS Grid or Flexbox for layout
- NO Tailwind dark theme classes (bg-slate-950 etc.) — use inline styles or e-ink specific classes
- Show all content statically — no hover states, no tooltips, no popovers

### Dual Mode Implementation:
Each game MUST support TWO rendering modes:
1. **Standard mode** (default) — full dark theme with Tailwind, animations, audio, same as other games
2. **E-Ink mode** — activated via a toggle at the top. Strips ALL styling to high-contrast black/white, removes animations, increases font/tap sizes, disables audio

Create `apps/web/lib/games/eink-utils.ts`:
```tsx
// E-ink mode detection and utilities
export function isEinkDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('kindle') || ua.includes('kobo') || ua.includes('boox') || ua.includes('nook');
}

export function useEinkMode() {
  // Returns [isEink, toggleEink] — persisted in localStorage
  // Auto-detects e-ink devices on first load
}

// E-ink wrapper component that conditionally applies high-contrast styles
export function EinkWrapper({ children, einkMode }: { children: React.ReactNode; einkMode: boolean }) {
  // If einkMode, wrap in a div with white bg, black text, no animations
}
```

## PROJECT CONTEXT
Next.js 14, TypeScript, React. Existing shared infrastructure:
- `@/components/games/AudioToggles` — music/SFX toggle (only render in standard mode, NOT in e-ink mode)
- `@/components/games/GameErrorBoundary` — use for all games
- `@/lib/games/audio` — SFX functions (only call in standard mode)
- `@/lib/games/achievements` — `checkAchievements()` (works everywhere)
- `@/lib/games/use-scores` — score tracking (wrap localStorage in try/catch)

### Game Page Pattern:
```tsx
import { GameComponent } from "@/components/games/GameComponent";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";
export const metadata = { title: "Game | Game Arena | teacher.ninja", description: "..." };
export default function Page() {
  return <GameErrorBoundary gameName="Game"><GameComponent /></GameErrorBoundary>;
}
```

## YOUR MISSION

### 1. Create `apps/web/lib/games/eink-utils.ts`
Shared e-ink mode utilities:
- `isEinkDevice()` — detect via user agent
- `useEinkMode()` — React hook returning `[einkMode, toggleEinkMode]`, auto-detect + localStorage persist
- `EinkToggle` component — a simple toggle button for e-ink mode with clear label "E-Ink / E-Reader Mode"
- CSS class helper: `einkClass(standard, eink)` — returns eink class if eink mode active

### 2. Create Sudoku Game
Classic 9×9 Sudoku:
- **Grid**: 9×9 CSS Grid with thick borders on 3×3 box boundaries
- **Interaction**: Click empty cell to select it (highlight with border, NOT color change in e-ink mode). Click digit button (1-9) to place. Click "X" to clear.
- **Puzzle generation**: Hardcoded set of at least 10 puzzles per difficulty. Each puzzle is a 81-character string (0=empty). Include solution.
- **Difficulty**: Easy (35+ given), Medium (28-34 given), Hard (22-27 given)
- **Validation**: Highlight conflicts (in standard mode: red. In e-ink mode: strikethrough text)
- **Settings**: Difficulty selector (3 buttons), toggle "show conflicts", toggle "show timer"
- **Timer**: Optional countdown or elapsed time (text only, no animation)
- **Completion**: Check if all cells filled correctly, show "Puzzle Complete!" message
- **E-ink specific**: Grid lines 2px solid black, digits 24px bold, selected cell gets thick 4px border, digit buttons 60px minimum

### 3. Create Word Search Game
Find words hidden in a letter grid:
- **Grid**: 10×10 to 15×15 grid of letters
- **Word bank**: Educational words by category (Science: photosynthesis, mitosis, etc. Math: equation, fraction, etc. History: revolution, democracy, etc.)
- **Interaction**: Click first letter, then click last letter of word. If correct, word is marked (in standard mode: colored highlight. In e-ink mode: bold + underline).
- **NO dragging/swiping** — only two clicks per word
- **Word placement**: Words placed horizontally, vertically, or diagonally (forward only — no reverse, keeps it e-reader friendly)
- **Settings**: Category selector, grid size (10×10, 12×12, 15×15), word count (5-12)
- **Completion**: Find all words to win. Show time taken.
- **E-ink specific**: Grid cells with clear borders, found words crossed off in word list with strikethrough

### 4. Create Trivia Quiz Game
Multiple-choice educational trivia:
- **Mechanic**: Show question + 4 answer buttons. Click correct answer.
- **Categories**: Math facts, Science facts, History dates, Geography capitals, Chemistry elements, Biology facts
- **Question bank**: At least 20 questions per category (120+ total), hardcoded
- **Interaction**: Click one of 4 large answer buttons. After answering: show correct/wrong feedback (in standard mode: green/red flash. In e-ink mode: ✓ or ✗ text next to answer + bold the correct answer)
- **Settings**: Category selector (toggles), question count slider (5-20), toggle "show explanations"
- **Scoring**: Correct answers / total. Optional timer per question.
- **After each question**: Show brief explanation of the correct answer
- **E-ink specific**: Large buttons (full width, 60px+ height), clear text, no color coding (use ✓/✗ symbols instead)

## COMPATIBILITY NOTICE
Each game must show a small info banner at the top:
```
📱 This game works on e-readers (Kindle, Kobo, Boox)
Interaction: Tap/click only | No dragging required
[Toggle: E-Ink Mode ON/OFF]
```

## GIT RULES
- Pull before editing: `git pull`
- Commit after each game: `git add <files> && git commit -m "agent/ereader-a: <desc>"`
- Push immediately: `git push`

## ON COMPLETION
1. Verify build: `cd apps/web && npx next build`
2. Commit & push
3. Update `scripts/agents/agent5-status.md` with COMPLETE

## REMEMBER
- E-ink mode must be TRULY compatible — no animations, no gradients, no opacity
- Standard mode should still look great (dark theme, animations, audio)
- onClick ONLY for interaction — no drag, no swipe, no touch events
- Large tap targets (60px+) in e-ink mode
- All games fully functional in BOTH modes
- Wrap ALL localStorage access in try/catch
- No external dependencies
