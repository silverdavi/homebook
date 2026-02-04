# Word Problems Frontend Agent

> Session: wordproblems-frontend
> Budget: $30
> Started: 2026-02-04

## YOUR OWNERSHIP
You exclusively own and can edit:
- `apps/web/components/generator/OptionsPanel.tsx`
- `apps/web/lib/types.ts`
- `apps/web/lib/subjects.ts`
- `apps/web/lib/store.ts`
- `apps/web/lib/api.ts`
- `apps/web/types/api.ts`

## DO NOT TOUCH
These directories are owned by other agents:
- `packages/generator/` (Generator Agent)
- `apps/web/app/` (except through lib imports)
- `apps/web/components/ui/` (UI primitives)

## YOUR MISSION
Add word problem options to the frontend UI. Users should be able to:
1. Enable/disable word problems
2. Choose word problem context type (cooking, sports, shopping, etc.)
3. Set the ratio of word problems to computational problems

## IMMEDIATE TASKS (in order)

### 1. Update types.ts - Add word problem options
Add word problem configuration to `WorksheetOptions`:

```typescript
export interface WorksheetOptions {
  // ... existing options ...
  includeWordProblems: boolean;
  wordProblemRatio: number;  // 0.0 to 1.0
  wordProblemContext: 'cooking' | 'sports' | 'shopping' | 'school' | 'mixed';
}
```

### 2. Update store.ts - Add default values
Update the store to include default values for word problem options:

```typescript
options: {
  // ... existing defaults ...
  includeWordProblems: false,
  wordProblemRatio: 0.3,
  wordProblemContext: 'mixed' as const,
}
```

### 3. Update subjects.ts - Add word problem options per subject
Update `SUBJECT_OPTIONS` to include word problem options only for math:

```typescript
export const SUBJECT_OPTIONS: Record<string, (keyof WorksheetOptions)[]> = {
  math: [
    // ... existing options ...
    "includeWordProblems",
    "wordProblemRatio",
    "wordProblemContext",
  ],
  chemistry: [
    // ... existing options (no word problems for chemistry yet) ...
  ],
  // ... etc
};
```

### 4. Update OptionsPanel.tsx - Add word problem UI
Add the word problem options to the options panel:

1. Add new option labels:
```typescript
const OPTION_LABELS: { key: keyof WorksheetOptions; label: string; type?: 'toggle' | 'slider' | 'select' }[] = [
  // ... existing options ...
  { key: "includeWordProblems", label: "Include word problems", type: 'toggle' },
];
```

2. Create a separate section for word problem settings that appears when word problems are enabled:

```tsx
{/* Word Problem Settings - only show when includeWordProblems is true */}
{options.includeWordProblems && (
  <div className="pl-4 border-l-2 border-blue-200 space-y-4 mt-2">
    {/* Context Type Selector */}
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">
        Word Problem Context
      </label>
      <select
        value={options.wordProblemContext}
        onChange={(e) => onOptionChange('wordProblemContext', e.target.value)}
        className="w-full rounded-md border border-slate-200 p-2"
      >
        <option value="mixed">Mixed (Varied scenarios)</option>
        <option value="cooking">Cooking & Recipes</option>
        <option value="sports">Sports & Games</option>
        <option value="shopping">Shopping & Money</option>
        <option value="school">School & Classroom</option>
      </select>
    </div>
    
    {/* Ratio Slider */}
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">
        Word Problem Ratio: {Math.round(options.wordProblemRatio * 100)}%
      </label>
      <input
        type="range"
        min="0.1"
        max="1.0"
        step="0.1"
        value={options.wordProblemRatio}
        onChange={(e) => onOptionChange('wordProblemRatio', parseFloat(e.target.value))}
        className="w-full"
      />
      <p className="text-xs text-slate-500">
        {Math.round(options.wordProblemRatio * 100)}% word problems, {Math.round((1 - options.wordProblemRatio) * 100)}% computational
      </p>
    </div>
  </div>
)}
```

### 5. Update api.ts - Include word problem options in API call
Ensure the word problem options are sent to the backend:

The `WorksheetConfig` type should include:
```typescript
include_word_problems?: boolean;
word_problem_ratio?: number;
word_problem_context?: string;
```

Map frontend options to backend config in the `generateWorksheet` function.

### 6. Update types/api.ts - Backend API types
Add the word problem fields to the API request/response types if needed.

### 7. Validate the UI works
After all changes:
- The "Include word problems" toggle should only appear for math
- When enabled, the context selector and ratio slider should appear
- The values should be included in the API request

## UI/UX REQUIREMENTS
- Word problem options should be visually grouped
- Use indentation to show hierarchy (toggle → sub-options)
- Provide helpful descriptions for each context type
- Show the ratio as a percentage (more intuitive than decimal)

## GIT RULES
- Pull before editing: `git pull`
- Commit after each task: `git add apps/web/components/generator/ apps/web/lib/ apps/web/types/ && git commit -m "agent/wordproblems-frontend: desc"`
- Push immediately: `git push`

## STATUS UPDATES
After each major task, update `scripts/agents/wordproblems-frontend-status.md`:
- What you completed
- What you're doing next
- Any blockers

## ON COMPLETION
1. Update your status file with COMPLETE
2. Check for TypeScript errors: `cd apps/web && npx tsc --noEmit`
3. Commit all changes
4. Push to remote

## REMEMBER
- Stay in your directories
- Commit frequently
- Update status after each task
- Follow existing code patterns and styling
- Ensure TypeScript types are consistent between frontend and backend
