# Frontend Agent - Homebook (teacher.ninja)

> Session: homebook-frontend-001
> Budget: $40
> Domain: teacher.ninja

## YOUR OWNERSHIP
You exclusively own:
- `apps/web/app/` (except `api/` subdirectory)
- `apps/web/components/`
- `apps/web/lib/`
- `apps/web/public/`
- `apps/web/tailwind.config.ts`
- `apps/web/globals.css`
- `apps/web/package.json`

## DO NOT TOUCH
- `apps/web/app/api/` (Backend Agent)
- `packages/` (Generator Agent)
- `infra/` (Infra/DNS Agents)

## YOUR MISSION
Build a beautiful worksheet generator UI for teacher.ninja.
**FRACTIONS is the first module** - build the UI to support it.

---

## PHASE 1: Project Initialization

### Task 1.1: Initialize Next.js 14 App

```bash
cd apps/web
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

### Task 1.2: Install Dependencies

```bash
npm install clsx framer-motion lucide-react zustand
npm install -D @types/node
```

### Task 1.3: Configure Tailwind (tailwind.config.ts)

Use this color palette:
```typescript
colors: {
  // Warm educational palette
  brand: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  // Subject colors
  subject: {
    math: '#6366f1',      // Indigo
    reading: '#ec4899',   // Pink
    science: '#22c55e',   // Green
  },
  // Neutral
  slate: { /* standard tailwind slate */ },
}

fontFamily: {
  display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
  sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
}
```

---

## PHASE 2: UI Components

### Task 2.1: Create Base Components (`components/ui/`)

**button.tsx** - Primary, secondary, ghost variants
**card.tsx** - Paper-style with subtle shadow
**checkbox.tsx** - Styled checkbox with label
**input.tsx** - Text input with label
**select.tsx** - Dropdown selector
**slider.tsx** - Range slider for problem count
**badge.tsx** - Topic tags

### Task 2.2: Component Specifications

```typescript
// button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

// Primary button: bg-subject-math text-white (for math worksheets)
// Use indigo (#6366f1) as primary color
```

---

## PHASE 3: Generator Components

### Task 3.1: Create Generator Components (`components/generator/`)

**SubjectSelector.tsx**
- Grid of subject cards with icons
- Math (calculator icon, indigo), Reading (book icon, pink), Science (flask, green)
- Only Math is enabled for MVP

**GradeLevelSelector.tsx**
- Dropdown or button group: K, 1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th

**TopicSelector.tsx**
- Hierarchical topic picker
- For fractions: show all subtopics
```typescript
const FRACTION_TOPICS = [
  { id: 'add-same-denom', label: 'Add (same denominator)', grade: '3-4' },
  { id: 'add-unlike-denom', label: 'Add (unlike denominators)', grade: '4-5' },
  { id: 'subtract-same-denom', label: 'Subtract (same denominator)', grade: '3-4' },
  { id: 'subtract-unlike-denom', label: 'Subtract (unlike denominators)', grade: '4-5' },
  { id: 'equivalent-fractions', label: 'Equivalent fractions', grade: '3-4' },
  { id: 'simplify-to-lowest', label: 'Simplify to lowest terms', grade: '4-5' },
  { id: 'compare-fractions', label: 'Compare fractions', grade: '3-4' },
  { id: 'multiply-fractions', label: 'Multiply fractions', grade: '5-6' },
  { id: 'divide-fractions', label: 'Divide fractions', grade: '5-6' },
];
```

**OptionsPanel.tsx**
- Checkboxes for:
  - ☑ Include answer key
  - ☐ Show hints
  - ☐ Include visual models (fraction bars)
  - ☐ Show worked examples
  - ☑ Number problems
  - ☐ Show LCD/GCF reference

**DifficultySelector.tsx**
- Radio buttons: Easy, Medium, Hard, Mixed
- Show denominator ranges for each

**ProblemCountSlider.tsx**
- Slider: 5 to 30 problems
- Show current value

**PersonalizationPanel.tsx**
- Student name (optional)
- Worksheet title (auto-generated default)
- Teacher name (optional)
- Date (auto-filled)

**PreviewPane.tsx**
- Shows live HTML preview of worksheet
- Uses iframe or dangerouslySetInnerHTML
- Updates when config changes (debounced)

**DownloadButton.tsx**
- Primary CTA button
- Loading state with spinner
- Success state with download link

---

## PHASE 4: Main Pages

### Task 4.1: Landing Page (`app/page.tsx`)

Hero section:
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    🎓 teacher.ninja                                        │
│                                                             │
│    Generate beautiful, personalized                         │
│    worksheets in seconds                                    │
│                                                             │
│    [Start Creating →]                                       │
│                                                             │
│    ✓ Fractions  ✓ Multiplication  ✓ Division  ✓ More...    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Features section:
- "Differentiated learning" - 3 difficulty levels
- "Visual models" - Fraction bars, number lines
- "Instant PDF" - Download in seconds
- "Standards aligned" - Common Core

### Task 4.2: Generator Page (`app/generate/page.tsx`)

Two-column layout:
```
┌─────────────────────────────────────────────────────────────┐
│  teacher.ninja                           [← Back] [Help]    │
├─────────────────────────┬───────────────────────────────────┤
│                         │                                   │
│  CONFIGURE              │  PREVIEW                          │
│                         │                                   │
│  Subject: [Math ▼]      │  ┌─────────────────────────────┐  │
│  Grade: [5th ▼]         │  │                             │  │
│  Topic: [Fractions ▼]   │  │   Fraction Addition         │  │
│  Subtopic: [Add unlike] │  │   Name: _____ Date: _____   │  │
│                         │  │                             │  │
│  Problems: [───●──] 15  │  │   1. 1/3 + 1/4 = _____     │  │
│  Difficulty: ○E ●M ○H   │  │   2. 2/5 + 1/3 = _____     │  │
│                         │  │   ...                       │  │
│  ☑ Answer key           │  │                             │  │
│  ☐ Hints                │  └─────────────────────────────┘  │
│  ☑ Visual models        │                                   │
│                         │                                   │
│  [Generate PDF]         │                                   │
│                         │                                   │
└─────────────────────────┴───────────────────────────────────┘
```

---

## PHASE 5: Data Definitions

### Task 5.1: Create lib/subjects.ts

```typescript
export const SUBJECTS = {
  math: {
    id: 'math',
    name: 'Mathematics',
    icon: 'Calculator',
    color: 'subject-math',
    enabled: true,
    topics: {
      fractions: {
        id: 'fractions',
        name: 'Fractions',
        grades: ['3', '4', '5', '6'],
        subtopics: [/* as above */]
      }
    }
  },
  reading: { enabled: false },
  science: { enabled: false },
};
```

### Task 5.2: Create lib/api.ts

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function generatePreview(config: WorksheetConfig): Promise<string> {
  const res = await fetch(`${API_URL}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  const data = await res.json();
  return data.html;
}

export async function generateWorksheet(config: WorksheetConfig): Promise<WorksheetResult> {
  // Returns { worksheetId, downloadUrl, filename }
}
```

---

## PHASE 6: Responsive Design

### Mobile Layout
- Stack config and preview vertically
- Collapsible options panel
- Full-width buttons

### Tablet Layout
- Side-by-side with narrower preview

### Desktop Layout
- Full two-column as designed

---

## VISUAL STYLE

Use these design principles (from user's forformat project):
- Paper-like shadows: `shadow-paper`, `shadow-paper-md`
- Subtle animations: fade-up on load, hover lifts
- Clean typography: Outfit for headings, Inter for body
- Generous whitespace
- Indigo accent for math (#6366f1)

---

## GIT RULES
- Commit after each component: `git add apps/web && git commit -m "agent/frontend: add [component]"`
- Push after each phase

## STATUS UPDATES
Update `scripts/agents/frontend-status.md` after each phase

## REMEMBER
- Mobile-first responsive design
- Use semantic HTML
- Accessible (proper labels, ARIA)
- Loading states for all async operations
- Error states with helpful messages
