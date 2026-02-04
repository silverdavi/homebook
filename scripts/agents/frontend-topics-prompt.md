# Frontend Topics Agent

> Session: frontend-topics
> Budget: $30
> Started: 2026-02-04

## YOUR OWNERSHIP
You exclusively own and can edit:
- `apps/web/lib/subjects.ts`

## DO NOT TOUCH
- Backend generator files
- Other frontend files (owned by other agents)

## YOUR MISSION
Add the new math topics (arithmetic, decimals/percentages) to the frontend subject configuration so users can select them in the UI.

## IMMEDIATE TASKS (in order)

### 1. Read current subjects.ts

Understand the current structure.

### 2. Add arithmetic topic to math subject

```typescript
export const ARITHMETIC_SUBTOPICS = [
  { id: "addition", name: "Addition", grades: ["K", "1", "2", "3"] },
  { id: "subtraction", name: "Subtraction", grades: ["K", "1", "2", "3"] },
  { id: "multiplication", name: "Multiplication", grades: ["2", "3", "4", "5"] },
  { id: "division", name: "Division", grades: ["3", "4", "5", "6"] },
  { id: "mixed", name: "Mixed Operations", grades: ["2", "3", "4", "5", "6"] },
];
```

Add to math subject topics:
```typescript
arithmetic: {
  id: "arithmetic",
  name: "Arithmetic",
  grades: ["K", "1", "2", "3", "4", "5", "6"],
  subtopics: [...ARITHMETIC_SUBTOPICS],
},
```

### 3. Add decimals topic to math subject

```typescript
export const DECIMALS_SUBTOPICS = [
  { id: "decimal-addition", name: "Decimal Addition", grades: ["4", "5", "6"] },
  { id: "decimal-subtraction", name: "Decimal Subtraction", grades: ["4", "5", "6"] },
  { id: "decimal-multiplication", name: "Decimal Multiplication", grades: ["5", "6", "7"] },
  { id: "decimal-division", name: "Decimal Division", grades: ["5", "6", "7"] },
  { id: "decimal-to-fraction", name: "Decimals to Fractions", grades: ["4", "5"] },
  { id: "fraction-to-decimal", name: "Fractions to Decimals", grades: ["4", "5"] },
  { id: "percent-of-number", name: "Percent of a Number", grades: ["5", "6", "7"] },
  { id: "number-to-percent", name: "Number to Percent", grades: ["5", "6", "7"] },
  { id: "percent-to-decimal", name: "Percent to Decimal", grades: ["5", "6", "7"] },
  { id: "decimal-to-percent", name: "Decimal to Percent", grades: ["5", "6", "7"] },
  { id: "percent-increase", name: "Percent Increase", grades: ["6", "7", "8"] },
  { id: "percent-decrease", name: "Percent Decrease", grades: ["6", "7", "8"] },
];
```

Add to math subject topics:
```typescript
decimals: {
  id: "decimals",
  name: "Decimals & Percentages",
  grades: ["4", "5", "6", "7", "8"],
  subtopics: [...DECIMALS_SUBTOPICS],
},
```

### 4. Update SUBJECT_OPTIONS for new topics

Ensure the new topics have appropriate options:
- Arithmetic: includeAnswerKey, showHints, showWorkedExamples, numberProblems
- Decimals: includeAnswerKey, showHints, showWorkedExamples, numberProblems

### 5. Verify no TypeScript errors

```bash
cd apps/web && npx tsc --noEmit
```

## GIT RULES
- Pull before editing: `git pull`
- Commit: `git add apps/web/lib/subjects.ts && git commit -m "agent/frontend-topics: add arithmetic and decimals topics"`
- Push immediately: `git push`

## ON COMPLETION
1. Update status file with COMPLETE
2. Verify TypeScript: `npx tsc --noEmit`
3. Commit and push
