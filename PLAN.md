# Homebook - Educational Worksheet Generator

> Beautiful, customizable worksheets for teachers and parents. Generate → Download → Learn.

---

## 1. Product Overview

**Homebook** generates professional, printable educational worksheets on-demand. Parents and teachers select subject, difficulty, topic, and preferences — the platform generates mathematically-rigorous problems, renders them as beautiful HTML, converts to PDF via WeasyPrint, and delivers via S3.

### Core Value Proposition
- **For Parents**: Supplement homework with targeted practice, no curriculum expertise required
- **For Teachers**: Generate differentiated worksheets in seconds, not hours
- **For Tutors**: Professional materials that match any student's level

---

## 2. User Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HOMEBOOK FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CONFIGURE                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Subject: [Math ▼]                                                    │  │
│  │  Grade/Level: [3rd Grade ▼]                                          │  │
│  │  Topic: [Multiplication ▼]                                           │  │
│  │                                                                       │  │
│  │  ┌─ Options ────────────────────────────────────────────────────┐    │  │
│  │  │ ☑ Include answer key                                          │    │  │
│  │  │ ☐ Show hints                                                   │    │  │
│  │  │ ☐ Include worked examples                                      │    │  │
│  │  │ ☑ Number problems                                              │    │  │
│  │  │ ☐ Include scratch space                                        │    │  │
│  │  └───────────────────────────────────────────────────────────────┘    │  │
│  │                                                                       │  │
│  │  Number of problems: [────●────] 15                                  │  │
│  │                                                                       │  │
│  │  ┌─ Personalization ─────────────────────────────────────────────┐   │  │
│  │  │ Student name: [Emma                    ]                       │   │  │
│  │  │ Worksheet title: [Multiplication Practice  ]                   │   │  │
│  │  │ Teacher/Parent: [Mrs. Johnson              ]                   │   │  │
│  │  └────────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  2. PREVIEW (Live HTML render)                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  ╭─────────────────────────────────────────────────────────────────╮ │  │
│  │  │  📐 Multiplication Practice                                     │ │  │
│  │  │  Name: Emma ____________  Date: ____________                    │ │  │
│  │  │                                                                  │ │  │
│  │  │  1.  7 × 8 = _____                                              │ │  │
│  │  │  2.  6 × 9 = _____                                              │ │  │
│  │  │  3.  5 × 7 = _____                                              │ │  │
│  │  │  ...                                                             │ │  │
│  │  ╰─────────────────────────────────────────────────────────────────╯ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  3. GENERATE & DOWNLOAD                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  [🔄 Generating...]  →  [✓ Ready!]  →  [⬇ Download PDF]            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Subjects & Topics

### Mathematics (Initial Focus)
| Level | Topics |
|-------|--------|
| K-1 | Counting, Number recognition, Basic addition/subtraction |
| 2-3 | Addition, Subtraction, Multiplication tables, Division intro |
| 4-5 | Multi-digit operations, Fractions, Decimals, Word problems |
| 6-8 | Algebra basics, Ratios, Percentages, Geometry, Pre-algebra |
| 9-12 | Algebra I/II, Geometry, Trigonometry, Pre-calculus |

### Future Subjects (Phase 2+)
- **Reading/ELA**: Vocabulary, Reading comprehension, Grammar, Spelling
- **Science**: Matching, Labeling diagrams, Multiple choice
- **History/Social Studies**: Timelines, Map skills, Fact recall
- **Languages**: Vocabulary, Conjugation tables, Translation

---

## 4. Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HOMEBOOK ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐         ┌──────────────────────────────────────┐  │
│  │     FRONTEND        │         │            BACKEND                    │  │
│  │   (Next.js 14)      │  API    │                                       │  │
│  │                     │◄───────►│  ┌────────────────────────────────┐  │  │
│  │  • React 18         │         │  │     API Routes (Next.js)       │  │  │
│  │  • Tailwind CSS     │         │  │  /api/generate                  │  │  │
│  │  • TypeScript       │         │  │  /api/preview                   │  │  │
│  │  • Framer Motion    │         │  │  /api/download/[id]             │  │  │
│  │                     │         │  └─────────────┬──────────────────┘  │  │
│  └─────────────────────┘         │                │                      │  │
│                                  │                ▼                      │  │
│                                  │  ┌────────────────────────────────┐  │  │
│                                  │  │    Python Generator Service    │  │  │
│                                  │  │  (Separate process / Lambda)   │  │  │
│                                  │  │                                 │  │  │
│                                  │  │  • Problem generators (by topic)│  │  │
│                                  │  │  • Jinja2 HTML templates        │  │  │
│                                  │  │  • WeasyPrint PDF conversion    │  │  │
│                                  │  └─────────────┬──────────────────┘  │  │
│                                  │                │                      │  │
│                                  │                ▼                      │  │
│                                  │  ┌────────────────────────────────┐  │  │
│                                  │  │         AWS S3                  │  │  │
│                                  │  │  • Generated PDFs               │  │  │
│                                  │  │  • Pre-signed download URLs     │  │  │
│                                  │  │  • 24hr expiry (cost control)   │  │  │
│                                  │  └────────────────────────────────┘  │  │
│                                  └──────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         AWS INFRASTRUCTURE                           │   │
│  │  • EC2 or ECS for Python service                                     │   │
│  │  • Lambda for on-demand generation (optional, scales to zero)        │   │
│  │  • S3 for PDF storage                                                │   │
│  │  • CloudFront for static assets                                      │   │
│  │  • Route53 for DNS                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Project Structure

```
homebook/
├── apps/
│   └── web/                          # Next.js 14 frontend
│       ├── app/
│       │   ├── (app)/                # Main app routes
│       │   │   ├── page.tsx          # Home/generator page
│       │   │   ├── about/
│       │   │   └── pricing/
│       │   ├── api/
│       │   │   ├── generate/route.ts # Trigger generation
│       │   │   ├── preview/route.ts  # HTML preview
│       │   │   └── download/[id]/route.ts
│       │   ├── layout.tsx
│       │   └── globals.css
│       ├── components/
│       │   ├── ui/                   # Base components
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── checkbox.tsx
│       │   │   ├── input.tsx
│       │   │   ├── select.tsx
│       │   │   ├── slider.tsx
│       │   │   └── tabs.tsx
│       │   ├── generator/            # Generator-specific
│       │   │   ├── SubjectSelector.tsx
│       │   │   ├── LevelSelector.tsx
│       │   │   ├── TopicSelector.tsx
│       │   │   ├── OptionsPanel.tsx
│       │   │   ├── PersonalizationPanel.tsx
│       │   │   ├── PreviewPane.tsx
│       │   │   └── DownloadButton.tsx
│       │   └── layout/
│       │       ├── Header.tsx
│       │       └── Footer.tsx
│       ├── lib/
│       │   ├── api.ts               # API client
│       │   ├── subjects.ts          # Subject/topic definitions
│       │   └── utils.ts
│       ├── public/
│       │   ├── icons/               # Subject icons (SVG)
│       │   └── fonts/
│       ├── tailwind.config.ts
│       └── package.json
│
├── packages/
│   └── generator/                   # Python problem generator
│       ├── src/
│       │   ├── generators/
│       │   │   ├── __init__.py
│       │   │   ├── base.py          # BaseGenerator class
│       │   │   ├── math/
│       │   │   │   ├── __init__.py
│       │   │   │   ├── arithmetic.py    # +, -, ×, ÷
│       │   │   │   ├── fractions.py
│       │   │   │   ├── decimals.py
│       │   │   │   ├── algebra.py
│       │   │   │   ├── geometry.py
│       │   │   │   └── word_problems.py
│       │   │   └── registry.py       # Generator registry
│       │   ├── templates/
│       │   │   ├── base.html         # Jinja2 base template
│       │   │   ├── worksheet.html    # Main worksheet template
│       │   │   ├── answer_key.html
│       │   │   └── styles/
│       │   │       └── print.css     # Print-optimized CSS
│       │   ├── renderer.py           # HTML rendering
│       │   ├── pdf_generator.py      # WeasyPrint wrapper
│       │   ├── s3_uploader.py        # S3 upload utilities
│       │   ├── main.py               # FastAPI server
│       │   └── config.py
│       ├── tests/
│       │   ├── test_generators.py
│       │   └── test_pdf.py
│       ├── requirements.txt
│       └── Dockerfile
│
├── infra/
│   ├── aws/
│   │   ├── cloudformation.yml       # Full stack
│   │   └── s3-bucket.yml
│   ├── docker/
│   │   └── docker-compose.yml
│   └── scripts/
│       └── deploy.sh
│
├── templates/                        # Shared worksheet templates
│   └── default/
│       ├── header.html
│       ├── footer.html
│       └── problem-layouts/
│           ├── single-column.html
│           ├── two-column.html
│           └── grid.html
│
├── package.json                      # Root workspace
├── pnpm-workspace.yaml
├── README.md
└── .env.example
```

---

## 6. Data Models

### WorksheetConfig (Frontend → Backend)

```typescript
interface WorksheetConfig {
  // Subject & Topic
  subject: 'math' | 'reading' | 'science';
  level: string;           // "grade-3", "grade-7", "algebra-1"
  topic: string;           // "multiplication", "fractions-add"
  
  // Problem settings
  numProblems: number;     // 5-50
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  
  // Options
  options: {
    includeAnswerKey: boolean;
    showHints: boolean;
    includeWorkedExamples: boolean;
    numberProblems: boolean;
    includeScratchSpace: boolean;
    twoColumnLayout: boolean;
  };
  
  // Personalization
  personalization: {
    studentName?: string;
    worksheetTitle?: string;
    teacherName?: string;
    schoolName?: string;
    date?: string;         // Auto-filled if empty
  };
  
  // Output
  format: 'pdf' | 'html';
}
```

### Problem (Generator Output)

```python
@dataclass
class Problem:
    id: str
    question: str           # LaTeX or plain text
    answer: str | list[str] # Single or multiple acceptable answers
    hint: str | None
    worked_example: str | None
    difficulty: str
    topic: str
    metadata: dict          # Extra info for rendering
```

### GeneratedWorksheet (Storage)

```python
@dataclass
class GeneratedWorksheet:
    id: str                 # UUID
    config: dict            # Original config
    problems: list[Problem]
    html_content: str
    pdf_url: str            # S3 pre-signed URL
    created_at: datetime
    expires_at: datetime
```

---

## 7. API Endpoints

### `POST /api/preview`
Generate HTML preview (no PDF, fast).

```typescript
// Request
{ config: WorksheetConfig }

// Response
{ 
  html: string,           // Rendered HTML
  problemCount: number 
}
```

### `POST /api/generate`
Generate full PDF and upload to S3.

```typescript
// Request
{ config: WorksheetConfig }

// Response
{
  worksheetId: string,
  status: 'processing' | 'ready' | 'error',
  downloadUrl?: string,   // S3 pre-signed URL
  expiresAt?: string
}
```

### `GET /api/download/[id]`
Get download URL (or redirect to S3).

```typescript
// Response
{ 
  downloadUrl: string,
  filename: string,
  expiresAt: string
}
```

---

## 8. Visual Design (Homebook Aesthetic)

### Color Palette
Adapting your academic slate style with warmer, education-friendly accents:

```typescript
// tailwind.config.ts
colors: {
  // Core brand - warm slate with educational feel
  slate: {
    50: '#f8fafc',
    // ... standard slate
    900: '#0f172a',
  },
  
  // Primary accent - friendly teal (knowledge/learning)
  teal: {
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
  },
  
  // Secondary - warm amber for CTAs
  amber: {
    400: '#fbbf24',
    500: '#f59e0b',
  },
  
  // Subject colors (icons, badges)
  subject: {
    math: '#6366f1',      // Indigo
    reading: '#ec4899',   // Pink  
    science: '#22c55e',   // Green
    history: '#f59e0b',   // Amber
  },
}
```

### Typography
```typescript
fontFamily: {
  display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],  // Friendly, modern
  sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],      // Clean body
  mono: ['var(--font-jetbrains)', 'monospace'],                // Math expressions
}
```

### Subject Icons (Lucide + Custom)

| Subject | Icon | Color |
|---------|------|-------|
| Math | `Calculator`, `π`, `∑` | Indigo |
| Reading | `BookOpen`, `Pencil` | Pink |
| Science | `FlaskConical`, `Atom` | Green |
| History | `Landmark`, `Clock` | Amber |

### Worksheet PDF Styling
Clean, print-optimized design:
- Generous margins (1 inch)
- Clear problem numbering
- Dotted answer lines
- Optional grid/scratch space
- Subtle header with branding
- Page numbers in footer
- Answer key on separate page(s)

---

## 9. Problem Generator Examples

### Arithmetic (Grade 2-4)

```python
class MultiplicationGenerator(BaseGenerator):
    """Generate multiplication problems."""
    
    def generate(self, config: GeneratorConfig) -> list[Problem]:
        problems = []
        
        for i in range(config.num_problems):
            if config.difficulty == 'easy':
                a = random.randint(1, 5)
                b = random.randint(1, 5)
            elif config.difficulty == 'medium':
                a = random.randint(2, 9)
                b = random.randint(2, 9)
            else:  # hard
                a = random.randint(6, 12)
                b = random.randint(6, 12)
            
            problems.append(Problem(
                id=f"mult-{i+1}",
                question=f"{a} × {b} = _____",
                answer=str(a * b),
                hint=f"Think: {a} groups of {b}",
                difficulty=config.difficulty,
                topic="multiplication",
            ))
        
        return problems
```

### Fractions (Grade 4-6)

```python
class FractionAdditionGenerator(BaseGenerator):
    """Generate fraction addition problems."""
    
    def generate(self, config: GeneratorConfig) -> list[Problem]:
        problems = []
        
        for i in range(config.num_problems):
            # Common denominator problems for easier difficulty
            denom = random.choice([2, 3, 4, 5, 6, 8, 10])
            num1 = random.randint(1, denom - 1)
            num2 = random.randint(1, denom - num1)
            
            problems.append(Problem(
                id=f"frac-add-{i+1}",
                question=f"\\frac{{{num1}}}{{{denom}}} + \\frac{{{num2}}}{{{denom}}} = _____",
                answer=f"\\frac{{{num1 + num2}}}{{{denom}}}",
                hint="Add the numerators, keep the denominator the same",
                topic="fractions-addition",
            ))
        
        return problems
```

---

## 10. Worksheet HTML Template

```html
<!-- templates/worksheet.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>{{ title }}</title>
  <style>
    @page {
      size: letter;
      margin: 1in;
    }
    
    body {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 14pt;
      line-height: 1.6;
      color: #1e293b;
    }
    
    .worksheet-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .worksheet-title {
      font-size: 24pt;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }
    
    .student-info {
      display: flex;
      gap: 2rem;
    }
    
    .info-field {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }
    
    .info-label {
      font-weight: 500;
      color: #64748b;
    }
    
    .info-line {
      border-bottom: 1px solid #94a3b8;
      min-width: 150px;
    }
    
    .problems {
      margin-top: 2rem;
    }
    
    .problem {
      display: flex;
      align-items: baseline;
      margin-bottom: 2rem;
      page-break-inside: avoid;
    }
    
    .problem-number {
      font-weight: 600;
      color: #6366f1;
      min-width: 2.5rem;
    }
    
    .problem-content {
      flex: 1;
    }
    
    .problem-question {
      font-size: 16pt;
    }
    
    .problem-hint {
      font-size: 11pt;
      color: #64748b;
      font-style: italic;
      margin-top: 0.5rem;
    }
    
    .scratch-space {
      height: 80px;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      margin-top: 0.5rem;
    }
    
    .answer-key {
      page-break-before: always;
    }
    
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10pt;
      color: #94a3b8;
      padding: 1rem;
    }
  </style>
</head>
<body>
  <div class="worksheet-header">
    <div>
      <h1 class="worksheet-title">{{ title }}</h1>
      {% if subject_icon %}
      <span class="subject-badge">{{ subject_name }}</span>
      {% endif %}
    </div>
    <div class="student-info">
      <div class="info-field">
        <span class="info-label">Name:</span>
        <span class="info-line">{{ student_name or '' }}</span>
      </div>
      <div class="info-field">
        <span class="info-label">Date:</span>
        <span class="info-line">{{ date }}</span>
      </div>
    </div>
  </div>
  
  <div class="problems {% if two_column %}two-column{% endif %}">
    {% for problem in problems %}
    <div class="problem">
      {% if number_problems %}
      <span class="problem-number">{{ loop.index }}.</span>
      {% endif %}
      <div class="problem-content">
        <div class="problem-question">{{ problem.question }}</div>
        {% if show_hints and problem.hint %}
        <div class="problem-hint">💡 {{ problem.hint }}</div>
        {% endif %}
        {% if include_scratch_space %}
        <div class="scratch-space"></div>
        {% endif %}
      </div>
    </div>
    {% endfor %}
  </div>
  
  {% if include_answer_key %}
  <div class="answer-key">
    <h2>Answer Key</h2>
    <ol>
      {% for problem in problems %}
      <li>{{ problem.answer }}</li>
      {% endfor %}
    </ol>
  </div>
  {% endif %}
  
  <div class="footer">
    Generated by Homebook • {{ date }}
  </div>
</body>
</html>
```

---

## 11. Implementation Phases

### Phase 1: MVP (Week 1-2)
- [ ] Next.js frontend scaffolding with generator UI
- [ ] 3 math topics: Addition, Subtraction, Multiplication
- [ ] 3 grade levels: 2nd, 3rd, 4th
- [ ] Basic options: problem count, answer key, hints
- [ ] Python generator service (FastAPI)
- [ ] WeasyPrint PDF generation
- [ ] S3 upload with pre-signed URLs
- [ ] Simple download flow

### Phase 2: Polish (Week 3)
- [ ] Live HTML preview
- [ ] More math topics: Division, Fractions, Decimals
- [ ] Personalization fields (name, title, teacher)
- [ ] Print-optimized CSS refinement
- [ ] Loading states and animations
- [ ] Error handling and validation

### Phase 3: Scale (Week 4+)
- [ ] Additional grade levels (K-1, 5-8, High School)
- [ ] Word problems generator
- [ ] Algebra topics
- [ ] User accounts (optional)
- [ ] Worksheet history
- [ ] Reading/ELA subject
- [ ] Mobile-responsive generator

---

## 12. Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| State | React hooks, Zustand (if needed) |
| Animations | Framer Motion |
| Fonts | Outfit (display), Inter (body), JetBrains Mono (math) |
| Icons | Lucide React |
| Backend API | Next.js API Routes |
| Generator | Python 3.11+, FastAPI |
| PDF | WeasyPrint, Jinja2 |
| Storage | AWS S3 |
| Hosting | Vercel (frontend), AWS EC2/Lambda (Python) |
| IaC | CloudFormation or CDK |

---

## 13. Environment Variables

```bash
# .env.example

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET_NAME=homebook-worksheets

# Generator Service
GENERATOR_API_URL=http://localhost:8000
GENERATOR_API_KEY=

# Feature Flags
ENABLE_PREVIEW=true
ENABLE_READING=false  # Phase 2
```

---

## 14. Naming & Branding

### App Name: **Homebook**
- Clean, memorable, educational connotation
- Domain candidates: homebook.app, gethomebook.com, homebook.io

### Tagline Options
- "Worksheets made easy"
- "Practice problems, perfectly generated"  
- "Custom worksheets in seconds"

### Logo Concept
- Simple book/house icon hybrid
- Clean geometric style
- Works in monochrome

---

## 15. Next Steps

1. **Approve plan** - Confirm architecture and scope
2. **Initialize project** - pnpm monorepo with Next.js + Python
3. **Build generator scaffolding** - BaseGenerator, one math topic
4. **Build frontend** - Generator UI with preview
5. **Connect end-to-end** - Generate → PDF → S3 → Download
6. **Deploy MVP** - Vercel + AWS

---

*Ready to build when you are.*
