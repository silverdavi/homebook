# Homebook - Deep Planning Document

> User-story driven educational worksheet generator
> Built with distributed Claude Code agents

---

## Part 1: User Stories

### Story 1: The 5th Grade Fractions Teacher

**Who:** Ms. Rodriguez, 5th grade math teacher at Lincoln Elementary
**Context:** Tomorrow she's introducing adding fractions with unlike denominators
**Need:** Differentiated practice worksheets for her three ability groups

```
Ms. Rodriguez opens Homebook after school. 

She selects:
  Subject: Mathematics
  Grade: 5th Grade  
  Topic: Fractions → Adding with Unlike Denominators
  
She creates THREE worksheets:

WORKSHEET A - Struggling Learners (8 students)
  ☑ Include visual models (fraction bars)
  ☑ Include step-by-step hints
  ☑ Start with simple denominators (2, 4, 8)
  ☑ Only 8 problems
  ☑ Large answer spaces
  ☐ Answer key (she'll grade by hand)
  
WORKSHEET B - On-Grade-Level (15 students)  
  ☑ Mixed denominators
  ☑ 15 problems
  ☑ Include 2 word problems
  ☑ Answer key on back
  ☐ Visual models
  
WORKSHEET C - Advanced (5 students)
  ☑ Complex denominators (5, 7, 9, 12)
  ☑ 20 problems including improper fractions
  ☑ 5 word problems (real-world contexts)
  ☑ Challenge problems at the end
  ☑ Self-check answer key

She downloads all three PDFs, prints 30 copies total.
Total time: 4 minutes.
```

**What she DIDN'T have to do:**
- Search through workbook for appropriate pages
- Photocopy from 3 different sources
- Manually write problems on the board
- Find answer keys scattered across teacher editions

---

### Story 2: The 3rd Grade Number Sense Teacher

**Who:** Mr. Chen, 3rd grade teacher
**Context:** Unit on place value and comparing numbers up to 1,000
**Need:** Practice sheets for comparing 3-digit numbers using <, >, =

```
Mr. Chen opens Homebook during his prep period.

He selects:
  Subject: Mathematics
  Grade: 3rd Grade
  Topic: Number Sense → Comparing Numbers (3-digit)

Configuration:
  ☑ Use comparison symbols: <, >, =
  ☑ Include place value chart reference at top
  ☑ 20 comparison problems
  ☑ Mix of:
      - Obvious comparisons (324 vs 891)
      - Tricky same-first-digit (456 vs 412)  
      - Equal numbers with different forms
  ☑ 5 "order from least to greatest" problems
  ☐ Word problems (not yet, next week)
  ☑ Answer key included

Personalization:
  Title: "Comparing Big Numbers"
  Student Name: [blank line]
  Class: "Mr. Chen's Marvelous Mathematicians"
  
Downloads PDF, makes 28 copies.
```

**Problem examples generated:**

```
Compare using <, >, or =

1.  456 ○ 891          2.  723 ○ 719
3.  505 ○ 550          4.  300 + 40 + 7 ○ 347
5.  "eight hundred twelve" ○ 821
...

Order from LEAST to GREATEST:
16. 492, 429, 924, 249 → ____, ____, ____, ____
```

---

### Story 3: The Homeschool Parent (Multi-Grade)

**Who:** Sarah, homeschooling mom of three kids
**Context:** Morning math block, each child at different level
**Need:** One worksheet per child, printed before breakfast

```
Sarah opens Homebook at 6:30am with coffee.

CHILD 1: Emma (Kindergarten, age 5)
  Subject: Math
  Grade: Kindergarten
  Topic: Counting → Numbers 1-20
  
  ☑ Large, friendly font
  ☑ Include counting pictures (dots, stars)
  ☑ Tracing numbers 11-20
  ☑ "How many?" counting exercises (up to 15)
  ☑ Fun theme: Animals
  ☑ 10 problems only
  ☑ No answer key (she'll check in person)
  
CHILD 2: Jack (2nd Grade, age 7)
  Subject: Math
  Grade: 2nd Grade
  Topic: Addition → Two-digit addition without regrouping
  
  ☑ Vertical format (stacked)
  ☑ 15 problems
  ☑ Include number line reference
  ☑ Answer key (he self-checks)
  
CHILD 3: Mia (6th Grade, age 11)  
  Subject: Math
  Grade: 6th Grade
  Topic: Ratios → Unit Rates
  
  ☑ 12 problems
  ☑ Word problems with real contexts
  ☑ Include worked example at top
  ☑ Answer key with work shown
  
Downloads 3 PDFs. Kids start math at 8am.
```

---

### Story 4: The Tutoring Center

**Who:** Mathnasium franchise owner
**Context:** Preparing for Saturday session with 15 students
**Need:** Individualized practice sheets per student skill gaps

```
Tutor Maria logs into Homebook (business account).

She has 15 students scheduled:
  - 4 students working on multiplication facts (3rd grade)
  - 3 students on fraction basics (4th grade)  
  - 5 students on pre-algebra equations (7th grade)
  - 3 students on algebra word problems (8th grade)

She generates:
  
MULTIPLICATION FACTS DRILL (for 4 students)
  ☑ Mixed 1-12 tables
  ☑ 50 problems (speed drill format)
  ☑ 5-minute timed format
  ☑ Answer key separate
  ☑ Progress tracker checkbox grid
  
FRACTION FOUNDATIONS (for 3 students)
  ☑ Visual fraction identification
  ☑ Equivalent fractions
  ☑ Comparing fractions
  ☑ 20 problems, mixed
  
PRE-ALGEBRA EQUATIONS (for 5 students)
  ☑ One-step equations
  ☑ Two-step equations  
  ☑ Balance scale visuals for conceptual
  ☑ 15 problems
  ☑ Show work space
  
ALGEBRA WORD PROBLEMS (for 3 students)
  ☑ Age problems
  ☑ Distance/rate problems
  ☑ Mixture problems
  ☑ 8 problems with generous work space
  ☑ Full solution key with steps
  
Batch downloads all. Prints packet per student.
```

---

### Story 5: The Test Prep Teacher

**Who:** Ms. Jackson, 4th grade teacher
**Context:** State test in 3 weeks, students need practice with test-format questions
**Need:** Practice tests that mirror state assessment style

```
Ms. Jackson opens Homebook's "Test Prep" mode.

She selects:
  State: Texas (STAAR format)
  Grade: 4th Grade
  Subject: Math
  
Topics to cover:
  ☑ Place value
  ☑ Multi-digit multiplication
  ☑ Fractions
  ☑ Geometry (angles, shapes)
  ☑ Measurement conversion
  ☑ Data/graphs
  
Format options:
  ☑ Multiple choice (4 options)
  ☑ Gridded response (fill-in)
  ☑ Include "select all that apply"
  ☑ 30 questions
  ☑ Bubble sheet format
  ☑ Calculator/No-calculator sections marked
  ☑ Answer key with standards alignment
  
Downloads 20-page practice test PDF.
```

---

### Story 6: The Special Education Teacher

**Who:** Mr. Williams, special ed resource room
**Context:** Supporting students with IEPs in math
**Need:** Heavily scaffolded worksheets with accommodations built in

```
Mr. Williams opens Homebook with accommodation mode.

Student: Marcus, 5th grader with dyscalculia
  Grade Level: 5th
  Working Level: 3rd grade math
  Topic: Multiplication (single digit × double digit)
  
Accommodations:
  ☑ Large print (18pt minimum)
  ☑ Extra spacing between problems
  ☑ Graph paper grid for alignment
  ☑ Step-by-step scaffolding boxes
  ☑ Partial products method shown
  ☑ Only 6 problems per page
  ☑ Visual multiplication array hints
  ☑ Reduced cognitive load (no distractors)
  ☑ Answer key with error analysis
  
Student: Jamie, 4th grader with ADHD
  Topic: Division facts
  
Accommodations:  
  ☑ Chunked into sections (5 problems, break, 5 more)
  ☑ Visual timer cues ("About 2 minutes for this section")
  ☑ Variety in problem formats (keeps engagement)
  ☑ Built-in movement break prompts
  ☑ Self-monitoring checklist
```

---

### Story 7: The Emergency Sub

**Who:** Random substitute teacher, 1 hour notice
**Context:** Regular teacher sick, no lesson plans left
**Need:** Grade-appropriate busywork that's actually educational

```
Sub opens Homebook on phone in the parking lot.

She checks the door sign: "Mrs. Patterson - 2nd Grade"

Quick generate:
  Grade: 2nd
  Subject: Math
  Mode: "Review Mix" (samples from common 2nd grade topics)
  
Auto-generates:
  - 10 addition problems (2-digit)
  - 10 subtraction problems (2-digit)
  - 5 counting money problems
  - 5 telling time problems
  - 1 fun puzzle/game at the end
  
  ☑ Answer key included
  ☑ "Early finisher" extension on back
  
Downloads, emails to school office to print.
Sorted for math block.
```

---

### Story 8: The Math Competition Coach

**Who:** Ms. Lee, runs school Math Olympiad team
**Context:** Weekly practice for math competition
**Need:** Challenge problems beyond grade level

```
Ms. Lee opens Homebook's "Challenge Mode"

Team: 5th graders preparing for Math Olympiad
Topic: Number Theory & Logic

Configuration:
  ☑ Problems require multiple steps
  ☑ Include pattern recognition
  ☑ Include logic puzzles
  ☑ Difficulty: Competition level
  ☑ No hints (they need to struggle)
  ☐ Answer key (she'll discuss solutions)
  
Problem types:
  ☑ "Find the pattern" sequences
  ☑ Divisibility rule applications  
  ☑ Factor/multiple puzzles
  ☑ Magic squares
  ☑ Problem-solving with constraints
  
Downloads for 8 team members.
```

---

## Part 2: Complete Topic Taxonomy

Based on user stories, here's the full topic tree:

```
MATHEMATICS
├── Counting & Cardinality (PreK-K)
│   ├── Counting 1-10
│   ├── Counting 1-20
│   ├── Counting 1-100
│   ├── Count objects (up to 10)
│   ├── Count objects (up to 20)
│   ├── Number recognition 0-10
│   ├── Number recognition 0-20
│   ├── Number tracing
│   ├── One-to-one correspondence
│   └── Counting sequence (what comes next/before)
│
├── Number Sense & Place Value
│   ├── Comparing numbers (1-digit)
│   ├── Comparing numbers (2-digit)
│   ├── Comparing numbers (3-digit)
│   ├── Comparing numbers (4+ digit)
│   ├── Ordering numbers (least to greatest)
│   ├── Place value (tens and ones)
│   ├── Place value (hundreds)
│   ├── Place value (thousands+)
│   ├── Expanded form
│   ├── Word form ↔ standard form
│   ├── Rounding (nearest 10)
│   ├── Rounding (nearest 100)
│   ├── Rounding (nearest 1000)
│   ├── Even and odd numbers
│   └── Skip counting (2s, 5s, 10s)
│
├── Addition
│   ├── Addition facts (sums to 5)
│   ├── Addition facts (sums to 10)
│   ├── Addition facts (sums to 18)
│   ├── Addition facts (sums to 20)
│   ├── Adding zero
│   ├── Adding doubles
│   ├── Adding near-doubles
│   ├── Two-digit + one-digit (no regrouping)
│   ├── Two-digit + two-digit (no regrouping)
│   ├── Two-digit + two-digit (with regrouping)
│   ├── Three-digit addition
│   ├── Multi-digit addition
│   ├── Addition with missing addends
│   ├── Column addition (3+ numbers)
│   └── Mental math addition strategies
│
├── Subtraction
│   ├── Subtraction facts (within 5)
│   ├── Subtraction facts (within 10)
│   ├── Subtraction facts (within 18)
│   ├── Subtraction facts (within 20)
│   ├── Two-digit − one-digit (no regrouping)
│   ├── Two-digit − two-digit (no regrouping)
│   ├── Two-digit − two-digit (with regrouping)
│   ├── Three-digit subtraction
│   ├── Multi-digit subtraction
│   ├── Subtraction with missing numbers
│   ├── Subtraction across zeros
│   └── Mental math subtraction strategies
│
├── Multiplication
│   ├── Multiplication concept (groups of)
│   ├── Multiplication facts (×2)
│   ├── Multiplication facts (×3)
│   ├── Multiplication facts (×4)
│   ├── Multiplication facts (×5)
│   ├── Multiplication facts (×6)
│   ├── Multiplication facts (×7)
│   ├── Multiplication facts (×8)
│   ├── Multiplication facts (×9)
│   ├── Multiplication facts (×10)
│   ├── Multiplication facts (×11)
│   ├── Multiplication facts (×12)
│   ├── Mixed multiplication facts (1-12)
│   ├── Multiplying by 10, 100, 1000
│   ├── Single-digit × double-digit
│   ├── Double-digit × double-digit
│   ├── Multi-digit multiplication
│   ├── Partial products method
│   ├── Lattice multiplication
│   ├── Properties of multiplication
│   └── Factors and multiples
│
├── Division
│   ├── Division concept (sharing equally)
│   ├── Division facts (÷2)
│   ├── Division facts (÷3)
│   ├── Division facts (÷4)
│   ├── Division facts (÷5)
│   ├── Division facts (÷6 through ÷12)
│   ├── Mixed division facts
│   ├── Division with remainders
│   ├── Long division (1-digit divisor)
│   ├── Long division (2-digit divisor)
│   ├── Dividing by 10, 100, 1000
│   └── Divisibility rules
│
├── Fractions
│   ├── Fraction concepts (parts of a whole)
│   ├── Identifying fractions (visual)
│   ├── Fractions on a number line
│   ├── Equivalent fractions
│   ├── Simplifying fractions
│   ├── Comparing fractions (same denominator)
│   ├── Comparing fractions (same numerator)
│   ├── Comparing fractions (unlike)
│   ├── Ordering fractions
│   ├── Adding fractions (same denominator)
│   ├── Subtracting fractions (same denominator)
│   ├── Adding fractions (unlike denominators)  ← Ms. Rodriguez
│   ├── Subtracting fractions (unlike denominators)
│   ├── Adding mixed numbers
│   ├── Subtracting mixed numbers
│   ├── Multiplying fractions
│   ├── Dividing fractions
│   ├── Mixed numbers ↔ improper fractions
│   └── Fractions of a set
│
├── Decimals
│   ├── Decimal concepts (tenths)
│   ├── Decimal concepts (hundredths)
│   ├── Reading/writing decimals
│   ├── Comparing decimals
│   ├── Ordering decimals
│   ├── Rounding decimals
│   ├── Adding decimals
│   ├── Subtracting decimals
│   ├── Multiplying decimals
│   ├── Dividing decimals
│   ├── Fractions ↔ decimals
│   └── Decimals ↔ percents
│
├── Percents
│   ├── Percent concepts
│   ├── Percent of a number
│   ├── Finding the percent
│   ├── Finding the whole
│   ├── Percent increase/decrease
│   ├── Discounts and sales tax
│   ├── Tips and commissions
│   └── Simple interest
│
├── Ratios & Proportions
│   ├── Ratio concepts
│   ├── Writing ratios
│   ├── Equivalent ratios
│   ├── Unit rates
│   ├── Proportions
│   ├── Solving proportions
│   ├── Scale drawings
│   └── Similar figures
│
├── Pre-Algebra
│   ├── Variables and expressions
│   ├── Evaluating expressions
│   ├── One-step equations (+ and −)
│   ├── One-step equations (× and ÷)
│   ├── Two-step equations
│   ├── Multi-step equations
│   ├── Inequalities
│   ├── Graphing on number line
│   ├── Order of operations
│   ├── Exponents intro
│   └── Integer operations
│
├── Algebra
│   ├── Linear equations
│   ├── Systems of equations
│   ├── Graphing linear equations
│   ├── Slope and y-intercept
│   ├── Polynomials
│   ├── Factoring
│   ├── Quadratic equations
│   └── Functions
│
├── Geometry
│   ├── Basic shapes (2D)
│   ├── Basic shapes (3D)
│   ├── Attributes of shapes
│   ├── Symmetry
│   ├── Perimeter
│   ├── Area (rectangles)
│   ├── Area (triangles)
│   ├── Area (complex shapes)
│   ├── Volume (rectangular prism)
│   ├── Volume (cylinders, etc.)
│   ├── Angles (identifying)
│   ├── Angles (measuring)
│   ├── Angles (complementary/supplementary)
│   ├── Triangles (classify by sides/angles)
│   ├── Pythagorean theorem
│   ├── Coordinate graphing
│   ├── Transformations
│   └── Circles (circumference, area)
│
├── Measurement
│   ├── Length (non-standard units)
│   ├── Length (inches, feet)
│   ├── Length (centimeters, meters)
│   ├── Length conversions
│   ├── Weight/Mass
│   ├── Capacity/Volume (cups, liters)
│   ├── Time (telling time - hour)
│   ├── Time (telling time - half hour)
│   ├── Time (telling time - 5 min)
│   ├── Time (telling time - minute)
│   ├── Elapsed time
│   ├── Calendar
│   ├── Temperature
│   └── Metric conversions
│
├── Money
│   ├── Coin identification
│   ├── Coin values
│   ├── Counting coins
│   ├── Counting bills
│   ├── Making change
│   └── Money word problems
│
├── Data & Graphs
│   ├── Picture graphs
│   ├── Bar graphs
│   ├── Line graphs
│   ├── Line plots
│   ├── Pie charts
│   ├── Reading tables
│   ├── Mean, median, mode
│   ├── Range
│   └── Probability basics
│
└── Word Problems
    ├── Addition word problems
    ├── Subtraction word problems
    ├── Multiplication word problems
    ├── Division word problems
    ├── Multi-step word problems
    ├── Fraction word problems
    ├── Percent word problems
    ├── Ratio word problems
    └── Algebra word problems
```

---

## Part 3: Distributed Agent Architecture

Using Claude Code CLI, we parallelize development across 5 agents:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HOMEBOOK AGENT ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         AGENT SPAWNER                                │   │
│  │  spawn-agents.sh → launches 5 parallel agents                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│    ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌────────┐ │
│    │  FRONTEND │  │  BACKEND  │  │ GENERATOR │  │ TEMPLATES │  │ INFRA  │ │
│    │   AGENT   │  │   AGENT   │  │   AGENT   │  │   AGENT   │  │ AGENT  │ │
│    │           │  │           │  │           │  │           │  │        │ │
│    │ apps/web/ │  │ apps/web/ │  │ packages/ │  │ templates/│  │ infra/ │ │
│    │  - app/   │  │  - api/   │  │ generator/│  │           │  │ docker/│ │
│    │  - comps/ │  │           │  │  - src/   │  │ HTML/CSS  │  │ aws/   │ │
│    │  - lib/   │  │           │  │  - gens/  │  │ for PDFs  │  │        │ │
│    │           │  │           │  │           │  │           │  │        │ │
│    │ Budget:   │  │ Budget:   │  │ Budget:   │  │ Budget:   │  │Budget: │ │
│    │   $40     │  │   $30     │  │   $60     │  │   $25     │  │  $20   │ │
│    └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └───┬────┘ │
│          │              │              │              │             │      │
│          ▼              ▼              ▼              ▼             ▼      │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │                      STATUS FILES (Coordination)                    │ │
│    │  scripts/agents/frontend-status.md | backend-status.md | ...       │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Agent 1: Frontend Agent

**Owns:** `apps/web/app/`, `apps/web/components/`, `apps/web/lib/`

**Mission:** Build the complete worksheet generator UI

**Tasks:**
1. Initialize Next.js 14 app with Tailwind
2. Create UI component library (button, card, checkbox, select, slider, input, tabs)
3. Build SubjectSelector component (icons, categories)
4. Build LevelSelector component (grade picker)
5. Build TopicSelector component (hierarchical topic tree)
6. Build OptionsPanel component (checkboxes, toggles)
7. Build PersonalizationPanel component (name, title, etc.)
8. Build PreviewPane component (live HTML preview)
9. Build DownloadButton component (loading states, success)
10. Build main generator page layout
11. Build landing page / marketing home
12. Build about, pricing pages
13. Implement responsive mobile layout
14. Add animations (Framer Motion)
15. Connect to backend API

**Does NOT touch:** `apps/web/app/api/`, `packages/`, `infra/`

---

### Agent 2: Backend Agent

**Owns:** `apps/web/app/api/`

**Mission:** Build API routes that connect frontend to Python generator

**Tasks:**
1. Create `/api/preview` route (calls Python, returns HTML)
2. Create `/api/generate` route (triggers full PDF generation)
3. Create `/api/download/[id]` route (S3 pre-signed URL)
4. Create `/api/health` route
5. Implement request validation (zod schemas)
6. Implement error handling
7. Add rate limiting
8. Create API client library for frontend
9. Add logging and monitoring hooks
10. Write API tests

**Does NOT touch:** `apps/web/app/(pages)/`, `apps/web/components/`, `packages/generator/`

---

### Agent 3: Generator Agent

**Owns:** `packages/generator/`

**Mission:** Build Python problem generators for all math topics

**Tasks:**
1. Set up Python package structure
2. Create BaseGenerator abstract class
3. Create GeneratorConfig dataclass
4. Create Problem dataclass
5. Implement CountingGenerator (PreK-K)
6. Implement AdditionGenerator (all variants)
7. Implement SubtractionGenerator (all variants)
8. Implement MultiplicationGenerator (all variants)
9. Implement DivisionGenerator (all variants)
10. Implement FractionGenerator (all variants)
11. Implement DecimalGenerator
12. Implement PercentGenerator
13. Implement AlgebraGenerator (equations)
14. Implement GeometryGenerator (area, perimeter, angles)
15. Implement WordProblemGenerator
16. Implement NumberSenseGenerator (comparing, ordering)
17. Create generator registry (topic → generator mapping)
18. Create FastAPI server
19. Implement PDF generation with WeasyPrint
20. Implement S3 upload
21. Write comprehensive tests

**Does NOT touch:** `apps/`, `infra/`, `templates/`

---

### Agent 4: Templates Agent

**Owns:** `templates/`, `packages/generator/src/templates/`

**Mission:** Create beautiful, print-optimized HTML/CSS templates

**Tasks:**
1. Create base HTML template (Jinja2)
2. Create print CSS (page margins, fonts, page breaks)
3. Create worksheet header template (title, name line, date)
4. Create problem layouts:
   - Single column
   - Two column
   - Grid (for drills)
   - Vertical math (stacked operations)
5. Create answer line styles
6. Create hint/scaffold boxes
7. Create worked example boxes
8. Create scratch space/graph paper patterns
9. Create answer key template
10. Create visual elements:
    - Fraction bars
    - Number lines
    - Place value charts
    - Coordinate grids
    - Geometry shapes
11. Create theme variations (fun for K-2, professional for upper grades)
12. Test print output on multiple paper sizes
13. Ensure accessibility (color contrast, font sizes)

**Does NOT touch:** `apps/`, `packages/generator/src/generators/`, `infra/`

---

### Agent 5: Infrastructure Agent

**Owns:** `infra/`, `docker/`, root config files

**Mission:** Set up deployment and AWS infrastructure

**Tasks:**
1. Create Dockerfile for Python generator service
2. Create docker-compose.yml for local development
3. Create AWS CloudFormation stack:
   - S3 bucket for PDFs
   - Lambda or ECS for generator
   - IAM roles
   - CloudFront distribution
4. Create deployment scripts
5. Set up environment variables management
6. Create CI/CD pipeline (GitHub Actions)
7. Set up logging and monitoring
8. Create backup procedures
9. Document deployment process

**Does NOT touch:** `apps/`, `packages/generator/src/generators/`

---

## Part 4: Agent Prompts

### Frontend Agent Prompt

```markdown
# Frontend Agent - Homebook

> Session: homebook-frontend-001
> Budget: $40
> Started: [timestamp]

## YOUR OWNERSHIP
You exclusively own and can edit:
- `apps/web/app/` (except `api/` subdirectory)
- `apps/web/components/`
- `apps/web/lib/`
- `apps/web/public/`
- `apps/web/tailwind.config.ts`
- `apps/web/globals.css`

## DO NOT TOUCH
These directories are owned by other agents:
- `apps/web/app/api/` (Backend Agent)
- `packages/` (Generator Agent)
- `templates/` (Templates Agent)
- `infra/`, `docker/` (Infra Agent)

## YOUR MISSION
Build a beautiful, modern worksheet generator UI using Next.js 14 and Tailwind CSS.
Follow the aesthetic established in the user's forformat project (academic slate palette,
Outfit/Inter fonts, paper shadows, subtle animations).

## IMMEDIATE TASKS (in order)

### 1. Initialize Next.js App
Create apps/web/ with:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS configured with custom theme
- Folder structure ready

### 2. Create UI Components (`apps/web/components/ui/`)
Build these base components with your styling:
- button.tsx (primary, secondary, ghost variants)
- card.tsx (paper-style with shadow)
- checkbox.tsx (styled checkbox with label)
- input.tsx (text input with label)
- select.tsx (dropdown with options)
- slider.tsx (range slider for number of problems)
- tabs.tsx (for subject switching)
- badge.tsx (for tags/labels)

### 3. Create Generator Components (`apps/web/components/generator/`)
- SubjectSelector.tsx - Grid of subjects with icons (Math, Reading, etc.)
- LevelSelector.tsx - Grade/level dropdown (PreK through 12)
- TopicSelector.tsx - Hierarchical topic picker based on subject+level
- OptionsPanel.tsx - All the checkboxes (hints, answer key, etc.)
- PersonalizationPanel.tsx - Student name, title, teacher name inputs
- PreviewPane.tsx - Live preview of worksheet (HTML iframe or rendered)
- DownloadButton.tsx - Generate and download button with loading states

### 4. Create Main Generator Page
- `apps/web/app/page.tsx` or `apps/web/app/generate/page.tsx`
- Combine all generator components
- Two-column layout: config on left, preview on right
- Mobile: stacked layout

### 5. Create Layout Components
- Header.tsx with logo and nav
- Footer.tsx with links

### 6. Data Definitions (`apps/web/lib/`)
- subjects.ts - Subject definitions with icons, colors
- topics.ts - Full topic tree structure
- types.ts - TypeScript interfaces

### 7. Landing Page
- Hero section with tagline
- Feature highlights
- How it works (3 steps)
- Subject showcase
- CTA to generator

## VISUAL DESIGN
Use this color palette (adapted from forformat):
```typescript
colors: {
  // Warm slate for academic feel
  slate: { /* standard */ },
  
  // Primary - friendly teal
  teal: {
    500: '#14b8a6',
    600: '#0d9488',
  },
  
  // CTA - warm amber
  amber: {
    400: '#fbbf24',
    500: '#f59e0b',
  },
  
  // Subject colors
  subject: {
    math: '#6366f1',     // Indigo
    reading: '#ec4899',  // Pink
    science: '#22c55e',  // Green
  },
}
```

Fonts: Outfit (display), Inter (body)
Shadows: Soft paper-like (from forformat)
Animations: Subtle fade-up on load, hover lifts

## GIT RULES
- Pull before editing: `git pull`
- Commit after each component: `git add apps/web && git commit -m "agent/frontend: add [component]"`
- Push immediately: `git push`

## STATUS UPDATES
After each major task, update `scripts/agents/frontend-status.md`

## API INTEGRATION
The backend will expose these endpoints (don't implement, just consume):
- POST /api/preview → { html: string }
- POST /api/generate → { worksheetId: string, status: string }
- GET /api/download/[id] → { downloadUrl: string }

Create mock data for now until backend is ready.
```

---

### Generator Agent Prompt

```markdown
# Generator Agent - Homebook

> Session: homebook-generator-001
> Budget: $60
> Started: [timestamp]

## YOUR OWNERSHIP
You exclusively own and can edit:
- `packages/generator/` (entire directory)

## DO NOT TOUCH
These directories are owned by other agents:
- `apps/` (Frontend and Backend Agents)
- `templates/` (Templates Agent will provide these)
- `infra/` (Infra Agent)

## YOUR MISSION
Build Python problem generators for K-12 mathematics worksheets.
Each generator produces Problem objects that can be rendered to HTML/PDF.

## PROJECT STRUCTURE TO CREATE
```
packages/generator/
├── src/
│   ├── __init__.py
│   ├── config.py           # Settings, S3 config
│   ├── models.py           # Problem, GeneratorConfig dataclasses
│   ├── generators/
│   │   ├── __init__.py
│   │   ├── base.py         # BaseGenerator ABC
│   │   ├── registry.py     # topic → generator mapping
│   │   ├── counting.py     # PreK-K counting
│   │   ├── number_sense.py # Comparing, ordering, place value
│   │   ├── addition.py     # All addition variants
│   │   ├── subtraction.py  # All subtraction variants
│   │   ├── multiplication.py
│   │   ├── division.py
│   │   ├── fractions.py    # All fraction operations
│   │   ├── decimals.py
│   │   ├── percents.py
│   │   ├── ratios.py
│   │   ├── algebra.py      # Equations, expressions
│   │   ├── geometry.py     # Shapes, area, perimeter
│   │   ├── measurement.py  # Time, length, weight
│   │   └── word_problems.py
│   ├── renderer.py         # Jinja2 HTML rendering
│   ├── pdf_generator.py    # WeasyPrint PDF generation
│   ├── s3_client.py        # S3 upload with pre-signed URLs
│   └── api/
│       ├── __init__.py
│       └── main.py         # FastAPI server
├── templates/              # Will be populated by Templates Agent
│   └── .gitkeep
├── tests/
│   ├── __init__.py
│   ├── test_generators.py
│   └── test_pdf.py
├── requirements.txt
├── Dockerfile
└── README.md
```

## DATA MODELS

```python
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from enum import Enum

class Difficulty(Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    MIXED = "mixed"

@dataclass
class Problem:
    id: str
    question: str           # Plain text or LaTeX
    answer: str | List[str] # Acceptable answer(s)
    hint: Optional[str] = None
    worked_example: Optional[str] = None
    difficulty: Difficulty = Difficulty.MEDIUM
    topic: str = ""
    subtopic: str = ""
    visual: Optional[str] = None  # SVG or HTML for visuals
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class GeneratorConfig:
    topic: str
    subtopic: str
    num_problems: int = 10
    difficulty: Difficulty = Difficulty.MEDIUM
    
    # Options
    include_hints: bool = False
    include_worked_examples: bool = False
    include_visuals: bool = False
    
    # For specific generators
    min_value: int = 1
    max_value: int = 100
    allow_negatives: bool = False
    
    # Personalization
    student_name: Optional[str] = None
    worksheet_title: Optional[str] = None
    teacher_name: Optional[str] = None
```

## BASE GENERATOR

```python
from abc import ABC, abstractmethod
from typing import List

class BaseGenerator(ABC):
    """Abstract base class for all problem generators."""
    
    topic: str  # e.g., "addition"
    subtopics: List[str]  # e.g., ["sums-to-10", "sums-to-20", ...]
    grade_range: tuple[int, int]  # e.g., (1, 3) for grades 1-3
    
    @abstractmethod
    def generate(self, config: GeneratorConfig) -> List[Problem]:
        """Generate problems based on config."""
        pass
    
    def supports(self, subtopic: str) -> bool:
        """Check if this generator supports the given subtopic."""
        return subtopic in self.subtopics
```

## IMMEDIATE TASKS (in order)

### 1. Set up package structure
Create all directories and __init__.py files.
Create requirements.txt with:
- fastapi
- uvicorn
- jinja2
- weasyprint
- boto3
- pydantic
- pytest

### 2. Create data models (models.py)
Implement Problem, GeneratorConfig, Difficulty as shown above.

### 3. Create BaseGenerator (generators/base.py)
Implement abstract base class.

### 4. Create AdditionGenerator (generators/addition.py)
This is the reference implementation. Support these subtopics:
- facts-to-5
- facts-to-10
- facts-to-18
- facts-to-20
- two-digit-no-regroup
- two-digit-with-regroup
- three-digit
- multi-digit
- missing-addend

Each problem should be pedagogically sound.

### 5. Create SubtractionGenerator
Mirror addition but for subtraction.

### 6. Create MultiplicationGenerator
Support:
- concept (groups of)
- times-2 through times-12
- mixed-facts
- by-10-100-1000
- single-by-double
- double-by-double

### 7. Create DivisionGenerator
Support facts and long division.

### 8. Create FractionGenerator
This is critical - support:
- identifying-fractions
- equivalent
- comparing-same-denom
- comparing-unlike
- adding-same-denom
- adding-unlike-denom  ← Ms. Rodriguez story
- subtracting
- multiplying
- dividing
- mixed-numbers

### 9. Create NumberSenseGenerator
For comparing numbers (Mr. Chen story):
- comparing-1-digit
- comparing-2-digit
- comparing-3-digit  ← Mr. Chen story
- ordering
- place-value
- rounding

### 10. Create remaining generators
- CountingGenerator (PreK-K)
- DecimalGenerator
- PercentGenerator
- AlgebraGenerator
- GeometryGenerator (area, perimeter, angles)
- MeasurementGenerator (time, length)

### 11. Create generator registry
Map topic+subtopic to generator class.

### 12. Create FastAPI server (api/main.py)
Endpoints:
- POST /preview - generate problems, return HTML
- POST /generate - generate problems, create PDF, upload to S3
- GET /health

### 13. Implement PDF generation
Use WeasyPrint with templates (Templates Agent will provide).

### 14. Implement S3 upload
Upload PDFs, return pre-signed URLs.

### 15. Write tests
Test each generator produces valid problems.

## PEDAGOGICAL GUIDELINES

### Problem Difficulty
- EASY: Single-step, small numbers, obvious patterns
- MEDIUM: Grade-level appropriate, some complexity
- HARD: Multi-step, larger numbers, edge cases
- MIXED: Random distribution

### Problem Variety
Within each worksheet, vary:
- Number positions (3 + __ = 7 vs __ + 3 = 7)
- Formats (horizontal vs vertical)
- Contexts (when applicable)

### Distractors to Avoid
- Don't always have largest number first in subtraction
- Don't make all answers the same digit count
- Include "tricky" problems that test understanding

### Hints
Should scaffold without giving away answer:
- "Think about place value..."
- "Try drawing a picture..."
- "Remember: when denominators are the same..."

## EXAMPLE GENERATOR IMPLEMENTATION

```python
# generators/addition.py
import random
from typing import List
from .base import BaseGenerator
from ..models import Problem, GeneratorConfig, Difficulty

class AdditionGenerator(BaseGenerator):
    topic = "addition"
    subtopics = [
        "facts-to-5", "facts-to-10", "facts-to-18", "facts-to-20",
        "two-digit-no-regroup", "two-digit-with-regroup",
        "three-digit", "multi-digit", "missing-addend"
    ]
    grade_range = (1, 4)
    
    def generate(self, config: GeneratorConfig) -> List[Problem]:
        problems = []
        
        for i in range(config.num_problems):
            problem = self._generate_one(config, i)
            problems.append(problem)
        
        return problems
    
    def _generate_one(self, config: GeneratorConfig, index: int) -> Problem:
        subtopic = config.subtopic
        difficulty = self._get_difficulty(config.difficulty)
        
        if subtopic == "facts-to-10":
            return self._generate_facts_to_10(index, difficulty, config)
        elif subtopic == "two-digit-with-regroup":
            return self._generate_two_digit_regroup(index, difficulty, config)
        # ... etc
    
    def _generate_facts_to_10(
        self, index: int, difficulty: Difficulty, config: GeneratorConfig
    ) -> Problem:
        # Generate two numbers that sum to 10 or less
        total = random.randint(2, 10)
        a = random.randint(0, total)
        b = total - a
        
        # Vary format
        formats = [
            (f"{a} + {b} = _____", str(a + b)),
            (f"_____ = {a} + {b}", str(a + b)),
            (f"{a} + _____ = {a + b}", str(b)),
        ]
        
        question, answer = random.choice(formats)
        
        hint = None
        if config.include_hints:
            hint = f"Count on from {a}: {a}, {a+1}, {a+2}..."
        
        return Problem(
            id=f"add-{index+1}",
            question=question,
            answer=answer,
            hint=hint,
            difficulty=difficulty,
            topic="addition",
            subtopic="facts-to-10",
        )
```

## GIT RULES
- Pull before editing: `git pull`
- Commit after each generator: `git add packages/generator && git commit -m "agent/generator: add [generator name]"`
- Push immediately: `git push`

## STATUS UPDATES
After each generator, update `scripts/agents/generator-status.md`:
- Which generators are complete
- Which are in progress
- Test results
```

---

## Part 5: Spawning Commands

### spawn-homebook-agents.sh

```bash
#!/bin/bash
# spawn-homebook-agents.sh
# Spawns all Homebook development agents in parallel

PROJECT_DIR="$(pwd)"
LOG_DIR="$PROJECT_DIR/logs/agents"
PROMPT_DIR="$PROJECT_DIR/scripts/agents"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$LOG_DIR"
mkdir -p "$PROMPT_DIR"

echo "🏠 HOMEBOOK - Spawning Agents at $TIMESTAMP"
echo "================================================"

# Define agents: name|budget
declare -a AGENTS=(
    "frontend|40"
    "backend|30"
    "generator|60"
    "templates|25"
    "infra|20"
)

PIDS=()

for AGENT_DEF in "${AGENTS[@]}"; do
    IFS='|' read -r AGENT BUDGET <<< "$AGENT_DEF"
    
    PROMPT_FILE="$PROMPT_DIR/${AGENT}-prompt.md"
    
    if [ ! -f "$PROMPT_FILE" ]; then
        echo "⚠️  Missing prompt: $PROMPT_FILE"
        continue
    fi
    
    echo "🚀 Starting $AGENT agent (budget: \$$BUDGET)..."
    
    claude --print \
        --allowedTools "Edit,Write,Bash,Read,Grep" \
        --dangerously-skip-permissions \
        --max-budget-usd "$BUDGET" \
        -p "$(cat $PROMPT_FILE)" \
        > "$LOG_DIR/${AGENT}-$TIMESTAMP.log" 2>&1 &
    
    PID=$!
    PIDS+=("$AGENT:$PID")
    echo "   PID: $PID"
    echo $PID > "$LOG_DIR/${AGENT}.pid"
    
    sleep 3  # Stagger starts
done

echo ""
echo "✅ All agents spawned!"
echo ""
echo "Monitor with:"
echo "  tail -f $LOG_DIR/*-$TIMESTAMP.log"
echo ""
echo "Kill all with:"
echo "  pkill -f 'claude.*dangerously-skip-permissions'"
echo ""
echo "Agent PIDs:"
for entry in "${PIDS[@]}"; do
    echo "  $entry"
done
```

---

## Part 6: Project Initialization Checklist

Before spawning agents:

```bash
# 1. Create project structure
mkdir -p apps/web
mkdir -p packages/generator
mkdir -p templates
mkdir -p infra/aws
mkdir -p infra/docker
mkdir -p scripts/agents
mkdir -p logs/agents

# 2. Create placeholder files
touch apps/web/.gitkeep
touch packages/generator/.gitkeep
touch templates/.gitkeep
touch infra/.gitkeep

# 3. Initialize git
git init
echo "node_modules/\n.env\nlogs/\n*.log\n__pycache__/" > .gitignore
git add .
git commit -m "chore: initial project structure"

# 4. Create agent prompts (copy from this document)
# scripts/agents/frontend-prompt.md
# scripts/agents/backend-prompt.md
# scripts/agents/generator-prompt.md
# scripts/agents/templates-prompt.md
# scripts/agents/infra-prompt.md

# 5. Create status file stubs
for agent in frontend backend generator templates infra; do
    echo "# ${agent^} Agent Status\n\n## Status: Not started\n" > "scripts/agents/${agent}-status.md"
done

# 6. Spawn agents
./scripts/spawn-homebook-agents.sh
```

---

## Part 7: Success Metrics

When complete, Homebook should satisfy all user stories:

| Story | Key Feature | Validation |
|-------|-------------|------------|
| Ms. Rodriguez (5th fractions) | Unlike denominator addition, 3 difficulty levels | Generate worksheet with visual models option |
| Mr. Chen (3rd comparing) | Compare 3-digit numbers with <, >, = | Place value chart reference, ordering problems |
| Sarah (homeschool multi-grade) | K, 2nd, 6th grade in one session | Quick subject/grade switching |
| Tutoring center | Batch generation, progress trackers | Multiple worksheet types, speed drill format |
| Ms. Jackson (test prep) | State test format, multiple choice | Bubble sheet format, standards alignment |
| Mr. Williams (special ed) | Accommodations, large print, scaffolding | Accessibility options, reduced load |
| Sub teacher | Quick "review mix" generation | Emergency mode with grade-appropriate mix |
| Math coach | Challenge problems, competition level | Difficulty setting, logic puzzles |

---

## Next Steps

1. **Review this plan** - Approve the user stories and topic taxonomy
2. **Create agent prompts** - I can generate all 5 prompt files
3. **Initialize project** - Set up structure and git
4. **Spawn agents** - Run parallel development
5. **Monitor progress** - Check status files and logs
6. **Integration** - Connect frontend → backend → generator
7. **Test with user stories** - Validate each persona works

---

*Ready to generate the agent prompt files and spawn development?*
