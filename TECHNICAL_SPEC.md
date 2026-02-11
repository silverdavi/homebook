# teacher.ninja Technical Specification

> Worksheet Generator + Game Arena
> Domain: teacher.ninja
>
> **Note:** This spec was originally written for the fractions worksheet module.
> Parts 1-5 remain accurate for the worksheet generator backend.
> Part 6 has been updated to reflect the current project structure.
> Part 8 (Game Arena) covers the interactive games platform.

---

## Part 1: Why Python for Math

### The Problem Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WORKSHEET GENERATION PIPELINE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. USER CONFIG (Frontend)                                                   │
│     └─► { subject: "math", topic: "fractions-add-unlike",                   │
│           numProblems: 15, difficulty: "medium", hints: true }              │
│                                                                              │
│  2. PROBLEM GENERATION (Python)                                              │
│     └─► Python's `fractions.Fraction` class handles:                        │
│         • Automatic GCF/LCD calculation                                      │
│         • Simplification to lowest terms                                     │
│         • Mixed number ↔ improper conversion                                │
│         • Exact arithmetic (no floating point errors!)                       │
│                                                                              │
│  3. VISUALIZATION (Python → SVG)                                             │
│     └─► Generate SVG fraction bars, pie charts, number lines                │
│         • Inline in HTML (no external files)                                 │
│         • Print-friendly (vector graphics)                                   │
│                                                                              │
│  4. HTML RENDERING (Jinja2)                                                  │
│     └─► Combine problems + visuals into worksheet HTML                       │
│                                                                              │
│  5. PDF CONVERSION (WeasyPrint)                                              │
│     └─► HTML → PDF with print CSS                                            │
│                                                                              │
│  6. STORAGE (S3)                                                             │
│     └─► Upload PDF, return pre-signed download URL                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Python (not JavaScript)?

| Concern | Python Solution |
|---------|-----------------|
| **Exact fractions** | `fractions.Fraction(3, 4)` - no floating point errors |
| **GCF/LCD** | `math.gcd()`, `math.lcm()` - built-in, fast |
| **Symbolic math** | `sympy` for algebra, equations, simplification |
| **PDF generation** | `weasyprint` - CSS-based, high quality |
| **Visualization** | SVG generation with string templates |
| **LLM for word problems** | OpenAI/Gemini Python SDKs |

---

## Part 2: Fractions Module - Complete Specification

### 2.1 Topic Hierarchy

```
fractions/
├── concepts/
│   ├── parts-of-whole          # "What fraction is shaded?"
│   ├── parts-of-set            # "What fraction of the stars are blue?"
│   └── fraction-notation       # Numerator, denominator identification
│
├── equivalence/
│   ├── equivalent-fractions    # 1/2 = 2/4 = 3/6
│   ├── simplify-to-lowest      # 6/8 → 3/4 (using GCF)
│   └── compare-fractions       # Which is larger: 3/4 or 5/8?
│
├── operations/
│   ├── add-same-denom          # 1/4 + 2/4 = 3/4
│   ├── subtract-same-denom     # 5/6 - 2/6 = 3/6 = 1/2
│   ├── add-unlike-denom        # 1/3 + 1/4 = 7/12 ← FIRST FOCUS
│   ├── subtract-unlike-denom   # 3/4 - 1/3 = 5/12
│   ├── multiply-fractions      # 2/3 × 3/4 = 6/12 = 1/2
│   └── divide-fractions        # 2/3 ÷ 1/4 = 2/3 × 4/1 = 8/3
│
├── mixed-numbers/
│   ├── mixed-to-improper       # 2 3/4 → 11/4
│   ├── improper-to-mixed       # 11/4 → 2 3/4
│   ├── add-mixed-numbers       # 1 1/2 + 2 1/3 = 3 5/6
│   └── subtract-mixed-numbers  # 3 1/4 - 1 2/3 = 1 7/12
│
└── word-problems/
    ├── fraction-of-quantity    # "What is 3/4 of 24?"
    └── fraction-word-problems  # Story problems with fractions
```

### 2.2 Core Python Classes

```python
# packages/generator/src/models.py

from dataclasses import dataclass, field
from fractions import Fraction
from typing import Optional, List, Dict, Any
from enum import Enum

class Difficulty(Enum):
    EASY = "easy"       # Simple denominators: 2, 3, 4, 5, 6
    MEDIUM = "medium"   # Mixed denominators: 2-10
    HARD = "hard"       # Complex: 2-12, includes simplification
    MIXED = "mixed"     # Random distribution

@dataclass
class FractionProblem:
    """A single fraction problem with all metadata."""
    
    id: str
    question_text: str           # "1/3 + 1/4 = _____"
    question_latex: str          # "\frac{1}{3} + \frac{1}{4} = \_\_\_\_\_"
    answer: Fraction             # Fraction(7, 12)
    answer_text: str             # "7/12"
    answer_latex: str            # "\frac{7}{12}"
    
    # Educational content
    hint: Optional[str] = None
    worked_solution: Optional[str] = None
    visual_svg: Optional[str] = None  # SVG string for fraction bar
    
    # Metadata
    topic: str = ""
    subtopic: str = ""
    difficulty: Difficulty = Difficulty.MEDIUM
    
    # For unlike denominators
    lcd: Optional[int] = None
    gcf: Optional[int] = None
    equivalent_fractions: Optional[Dict[str, str]] = None  # {"1/3": "4/12", "1/4": "3/12"}


@dataclass
class GeneratorConfig:
    """Configuration for problem generation."""
    
    topic: str                    # "fractions"
    subtopic: str                 # "add-unlike-denom"
    num_problems: int = 10
    difficulty: Difficulty = Difficulty.MEDIUM
    
    # Display options
    include_hints: bool = False
    include_worked_examples: bool = False
    include_visuals: bool = True
    show_lcd_steps: bool = False
    
    # Constraints
    max_denominator: int = 12
    allow_improper: bool = False
    require_simplification: bool = True
    
    # Personalization
    student_name: Optional[str] = None
    worksheet_title: Optional[str] = None
```

### 2.3 Fraction Generator Implementation

```python
# packages/generator/src/generators/fractions.py

import random
import math
from fractions import Fraction
from typing import List, Tuple
from ..models import FractionProblem, GeneratorConfig, Difficulty


class FractionGenerator:
    """Generate fraction problems with full educational support."""
    
    # Denominator pools by difficulty
    DENOMINATORS = {
        Difficulty.EASY: [2, 3, 4, 5, 6],
        Difficulty.MEDIUM: [2, 3, 4, 5, 6, 8, 10],
        Difficulty.HARD: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    }
    
    def generate(self, config: GeneratorConfig) -> List[FractionProblem]:
        """Generate problems based on subtopic."""
        
        subtopic_handlers = {
            "add-same-denom": self._gen_add_same_denom,
            "subtract-same-denom": self._gen_sub_same_denom,
            "add-unlike-denom": self._gen_add_unlike_denom,
            "subtract-unlike-denom": self._gen_sub_unlike_denom,
            "equivalent-fractions": self._gen_equivalent,
            "simplify-to-lowest": self._gen_simplify,
            "compare-fractions": self._gen_compare,
            "multiply-fractions": self._gen_multiply,
            "divide-fractions": self._gen_divide,
        }
        
        handler = subtopic_handlers.get(config.subtopic)
        if not handler:
            raise ValueError(f"Unknown subtopic: {config.subtopic}")
        
        problems = []
        for i in range(config.num_problems):
            problem = handler(config, i)
            problems.append(problem)
        
        return problems
    
    def _gen_add_unlike_denom(
        self, config: GeneratorConfig, index: int
    ) -> FractionProblem:
        """
        Generate: a/b + c/d where b ≠ d
        
        Example: 1/3 + 1/4 = ?
        
        Steps shown in hint:
        1. Find LCD of 3 and 4 → 12
        2. Convert: 1/3 = 4/12, 1/4 = 3/12
        3. Add: 4/12 + 3/12 = 7/12
        """
        denoms = self._get_denominators(config.difficulty)
        
        # Pick two different denominators
        d1 = random.choice(denoms)
        d2 = random.choice([d for d in denoms if d != d1])
        
        # Pick numerators (ensure proper fractions for easier difficulty)
        n1 = random.randint(1, d1 - 1) if not config.allow_improper else random.randint(1, d1 + 2)
        n2 = random.randint(1, d2 - 1) if not config.allow_improper else random.randint(1, d2 + 2)
        
        # Create fractions using Python's Fraction class
        frac1 = Fraction(n1, d1)
        frac2 = Fraction(n2, d2)
        answer = frac1 + frac2  # Automatically finds LCD and simplifies!
        
        # Calculate LCD for explanation
        lcd = math.lcm(d1, d2)
        
        # Equivalent fractions for explanation
        equiv1 = Fraction(n1 * (lcd // d1), lcd)
        equiv2 = Fraction(n2 * (lcd // d2), lcd)
        
        # Build problem
        question_text = f"{n1}/{d1} + {n2}/{d2} = _____"
        question_latex = f"\\frac{{{n1}}}{{{d1}}} + \\frac{{{n2}}}{{{d2}}} = \\_\\_\\_\\_\\_"
        
        # Build hint
        hint = None
        if config.include_hints:
            hint = f"Find the LCD of {d1} and {d2}. Convert both fractions to have this denominator, then add."
        
        # Build worked solution
        worked_solution = None
        if config.include_worked_examples:
            worked_solution = f"""Step 1: Find LCD of {d1} and {d2}
  LCD = {lcd}

Step 2: Convert to equivalent fractions
  {n1}/{d1} = {equiv1.numerator}/{equiv1.denominator}
  {n2}/{d2} = {equiv2.numerator}/{equiv2.denominator}

Step 3: Add the fractions
  {equiv1.numerator}/{lcd} + {equiv2.numerator}/{lcd} = {equiv1.numerator + equiv2.numerator}/{lcd}

Step 4: Simplify if needed
  Answer: {answer}"""
        
        # Build visual SVG
        visual_svg = None
        if config.include_visuals:
            visual_svg = self._create_fraction_bar_svg(frac1, frac2, answer, lcd)
        
        return FractionProblem(
            id=f"frac-add-unlike-{index + 1}",
            question_text=question_text,
            question_latex=question_latex,
            answer=answer,
            answer_text=str(answer),
            answer_latex=f"\\frac{{{answer.numerator}}}{{{answer.denominator}}}",
            hint=hint,
            worked_solution=worked_solution,
            visual_svg=visual_svg,
            topic="fractions",
            subtopic="add-unlike-denom",
            difficulty=config.difficulty,
            lcd=lcd,
            gcf=math.gcd(answer.numerator, answer.denominator),
            equivalent_fractions={
                f"{n1}/{d1}": f"{equiv1.numerator}/{equiv1.denominator}",
                f"{n2}/{d2}": f"{equiv2.numerator}/{equiv2.denominator}",
            }
        )
    
    def _get_denominators(self, difficulty: Difficulty) -> List[int]:
        if difficulty == Difficulty.MIXED:
            return self.DENOMINATORS[random.choice([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD])]
        return self.DENOMINATORS[difficulty]
    
    def _create_fraction_bar_svg(
        self, frac1: Fraction, frac2: Fraction, answer: Fraction, lcd: int
    ) -> str:
        """Create SVG visualization of fraction addition."""
        
        # SVG dimensions
        width = 400
        bar_height = 30
        padding = 10
        
        svg_parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="180" viewBox="0 0 {width} 180">'
        ]
        
        # Colors
        color1 = "#6366f1"  # Indigo for first fraction
        color2 = "#22c55e"  # Green for second fraction
        
        # First fraction bar
        svg_parts.append(self._draw_fraction_bar(10, 20, width - 20, bar_height, frac1, lcd, color1))
        svg_parts.append(f'<text x="{width//2}" y="15" text-anchor="middle" font-size="14">{frac1}</text>')
        
        # Plus sign
        svg_parts.append(f'<text x="{width//2}" y="75" text-anchor="middle" font-size="20">+</text>')
        
        # Second fraction bar
        svg_parts.append(self._draw_fraction_bar(10, 90, width - 20, bar_height, frac2, lcd, color2))
        svg_parts.append(f'<text x="{width//2}" y="85" text-anchor="middle" font-size="14">{frac2}</text>')
        
        # Equals
        svg_parts.append(f'<text x="{width//2}" y="145" text-anchor="middle" font-size="20">=</text>')
        
        # Answer bar (combined)
        svg_parts.append(self._draw_fraction_bar(10, 155, width - 20, bar_height, answer, answer.denominator, "#0ea5e9"))
        
        svg_parts.append('</svg>')
        
        return '\n'.join(svg_parts)
    
    def _draw_fraction_bar(
        self, x: int, y: int, width: int, height: int, 
        frac: Fraction, divisions: int, color: str
    ) -> str:
        """Draw a single fraction bar with segments."""
        
        segment_width = width / divisions
        parts = []
        
        # Background (empty bar)
        parts.append(
            f'<rect x="{x}" y="{y}" width="{width}" height="{height}" '
            f'fill="none" stroke="#cbd5e1" stroke-width="1"/>'
        )
        
        # Filled segments (for proper fractions)
        filled = int(frac * divisions)  # How many segments to fill
        
        for i in range(divisions):
            segment_x = x + i * segment_width
            fill_color = color if i < filled else "#f1f5f9"
            parts.append(
                f'<rect x="{segment_x}" y="{y}" width="{segment_width}" height="{height}" '
                f'fill="{fill_color}" stroke="#94a3b8" stroke-width="0.5"/>'
            )
        
        return '\n'.join(parts)
```

### 2.4 GCF/LCD Explanation Module

```python
# packages/generator/src/math_explanations.py

import math
from fractions import Fraction
from typing import List, Tuple


def explain_gcf(a: int, b: int) -> str:
    """
    Generate step-by-step GCF explanation.
    
    Example for GCF(12, 18):
    "Factors of 12: 1, 2, 3, 4, 6, 12
     Factors of 18: 1, 2, 3, 6, 9, 18
     Common factors: 1, 2, 3, 6
     Greatest Common Factor: 6"
    """
    def get_factors(n: int) -> List[int]:
        return [i for i in range(1, n + 1) if n % i == 0]
    
    factors_a = get_factors(a)
    factors_b = get_factors(b)
    common = sorted(set(factors_a) & set(factors_b))
    gcf = math.gcd(a, b)
    
    return f"""Factors of {a}: {', '.join(map(str, factors_a))}
Factors of {b}: {', '.join(map(str, factors_b))}
Common factors: {', '.join(map(str, common))}
Greatest Common Factor (GCF): {gcf}"""


def explain_lcd(a: int, b: int) -> str:
    """
    Generate step-by-step LCD explanation.
    
    Example for LCD(4, 6):
    "Multiples of 4: 4, 8, 12, 16, 20, 24...
     Multiples of 6: 6, 12, 18, 24, 30...
     Common multiples: 12, 24...
     Least Common Denominator: 12"
    """
    lcd = math.lcm(a, b)
    max_show = max(lcd * 2, 30)
    
    multiples_a = [a * i for i in range(1, max_show // a + 1)]
    multiples_b = [b * i for i in range(1, max_show // b + 1)]
    common = sorted(set(multiples_a) & set(multiples_b))[:5]
    
    return f"""Multiples of {a}: {', '.join(map(str, multiples_a[:6]))}...
Multiples of {b}: {', '.join(map(str, multiples_b[:6]))}...
Common multiples: {', '.join(map(str, common))}...
Least Common Denominator (LCD): {lcd}"""


def explain_simplify(numerator: int, denominator: int) -> str:
    """
    Generate step-by-step simplification explanation.
    
    Example for simplifying 6/8:
    "GCF of 6 and 8 is 2
     Divide both by GCF:
     6 ÷ 2 = 3
     8 ÷ 2 = 4
     Simplified: 3/4"
    """
    gcf = math.gcd(numerator, denominator)
    
    if gcf == 1:
        return f"{numerator}/{denominator} is already in lowest terms (GCF = 1)"
    
    simplified = Fraction(numerator, denominator)
    
    return f"""GCF of {numerator} and {denominator} is {gcf}

Divide both numerator and denominator by GCF:
  {numerator} ÷ {gcf} = {simplified.numerator}
  {denominator} ÷ {gcf} = {simplified.denominator}

Simplified: {simplified.numerator}/{simplified.denominator}"""
```

---

## Part 3: Visualization Specifications

### 3.1 Fraction Bar (Tape Diagram)

```
┌────────────────────────────────────────┐
│  1/3 + 1/4 = ?                        │
├────────────────────────────────────────┤
│                                        │
│  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│  │▓▓▓│▓▓▓│▓▓▓│▓▓▓│   │   │   │   │   │   │   │   │  ← 4/12 (from 1/3)
│  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
│                          +
│  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│  │███│███│███│   │   │   │   │   │   │   │   │   │  ← 3/12 (from 1/4)
│  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
│                          =
│  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│  │▓▓▓│▓▓▓│▓▓▓│▓▓▓│███│███│███│   │   │   │   │   │  ← 7/12 (answer)
│  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
│                                        │
└────────────────────────────────────────┘
```

### 3.2 Circle/Pie Diagrams

For comparing fractions and showing parts of a whole.

### 3.3 Number Lines

For ordering fractions and showing their relative positions.

---

## Part 4: Template Structure

### 4.1 Worksheet HTML Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>{{ title }}</title>
  <style>
    @page {
      size: letter;
      margin: 0.75in;
    }
    
    body {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #1e293b;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .title {
      font-size: 20pt;
      font-weight: 600;
      color: #0f172a;
    }
    
    .subtitle {
      font-size: 11pt;
      color: #64748b;
    }
    
    .meta-line {
      display: flex;
      gap: 2rem;
    }
    
    .meta-field {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }
    
    .meta-label {
      font-weight: 500;
    }
    
    .meta-line-input {
      border-bottom: 1px solid #94a3b8;
      min-width: 120px;
    }
    
    .problems {
      margin-top: 1.5rem;
    }
    
    .problem {
      margin-bottom: 2rem;
      page-break-inside: avoid;
    }
    
    .problem-row {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .problem-number {
      font-weight: 600;
      color: #6366f1;
      min-width: 2rem;
    }
    
    .problem-content {
      flex: 1;
    }
    
    .problem-question {
      font-size: 14pt;
      margin-bottom: 0.5rem;
    }
    
    .fraction {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      vertical-align: middle;
      margin: 0 0.25rem;
    }
    
    .fraction-num {
      border-bottom: 1px solid currentColor;
      padding: 0 0.25rem;
    }
    
    .fraction-den {
      padding: 0 0.25rem;
    }
    
    .problem-hint {
      font-size: 10pt;
      color: #64748b;
      font-style: italic;
      margin-top: 0.5rem;
      padding-left: 1rem;
      border-left: 2px solid #e2e8f0;
    }
    
    .problem-visual {
      margin-top: 1rem;
    }
    
    .answer-line {
      display: inline-block;
      border-bottom: 1px solid #94a3b8;
      min-width: 60px;
      margin-left: 0.5rem;
    }
    
    .worked-example {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
      font-size: 10pt;
      white-space: pre-line;
    }
    
    /* Answer Key Styles */
    .answer-key {
      page-break-before: always;
    }
    
    .answer-key h2 {
      color: #0f172a;
      border-bottom: 2px solid #6366f1;
      padding-bottom: 0.5rem;
    }
    
    .answer-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
      margin-top: 1rem;
    }
    
    .answer-item {
      display: flex;
      gap: 0.5rem;
      font-size: 11pt;
    }
    
    .answer-num {
      font-weight: 600;
      color: #6366f1;
    }
    
    /* LCD/GCF Explanation Box */
    .explanation-box {
      background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
      font-size: 10pt;
    }
    
    .explanation-title {
      font-weight: 600;
      color: #0369a1;
      margin-bottom: 0.5rem;
    }
    
    /* Print optimizations */
    @media print {
      .no-print { display: none; }
      body { font-size: 11pt; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">{{ title }}</h1>
      <p class="subtitle">{{ subtitle }}</p>
    </div>
    <div class="meta-line">
      <div class="meta-field">
        <span class="meta-label">Name:</span>
        <span class="meta-line-input">{{ student_name }}</span>
      </div>
      <div class="meta-field">
        <span class="meta-label">Date:</span>
        <span class="meta-line-input">{{ date }}</span>
      </div>
    </div>
  </div>
  
  {% if show_lcd_reference %}
  <div class="explanation-box">
    <div class="explanation-title">📐 Finding the LCD (Least Common Denominator)</div>
    <p>To add or subtract fractions with different denominators:</p>
    <ol>
      <li>Find the LCD of the denominators</li>
      <li>Convert each fraction to an equivalent fraction with the LCD</li>
      <li>Add or subtract the numerators</li>
      <li>Simplify if possible</li>
    </ol>
  </div>
  {% endif %}
  
  <div class="problems">
    {% for problem in problems %}
    <div class="problem">
      <div class="problem-row">
        <span class="problem-number">{{ loop.index }}.</span>
        <div class="problem-content">
          <div class="problem-question">
            {{ problem.question_html | safe }}
          </div>
          
          {% if problem.hint %}
          <div class="problem-hint">
            💡 {{ problem.hint }}
          </div>
          {% endif %}
          
          {% if problem.visual_svg %}
          <div class="problem-visual">
            {{ problem.visual_svg | safe }}
          </div>
          {% endif %}
          
          {% if problem.worked_solution %}
          <div class="worked-example">
            <strong>Worked Example:</strong>
            {{ problem.worked_solution }}
          </div>
          {% endif %}
        </div>
      </div>
    </div>
    {% endfor %}
  </div>
  
  {% if include_answer_key %}
  <div class="answer-key">
    <h2>Answer Key</h2>
    <div class="answer-grid">
      {% for problem in problems %}
      <div class="answer-item">
        <span class="answer-num">{{ loop.index }}.</span>
        <span>{{ problem.answer_text }}</span>
      </div>
      {% endfor %}
    </div>
  </div>
  {% endif %}
  
  <div class="footer" style="text-align: center; margin-top: 2rem; color: #94a3b8; font-size: 9pt;">
    Generated by teacher.ninja • {{ date }}
  </div>
</body>
</html>
```

---

## Part 5: API Endpoints

### 5.1 Preview Endpoint

```
POST /api/preview
Content-Type: application/json

Request:
{
  "subject": "math",
  "topic": "fractions",
  "subtopic": "add-unlike-denom",
  "numProblems": 10,
  "difficulty": "medium",
  "options": {
    "includeHints": true,
    "includeVisuals": true,
    "includeWorkedExamples": false,
    "showLcdReference": true
  }
}

Response:
{
  "html": "<html>...</html>",
  "problemCount": 10,
  "topics": ["add-unlike-denom"],
  "estimatedPages": 2
}
```

### 5.2 Generate Endpoint

```
POST /api/generate
Content-Type: application/json

Request:
{
  "subject": "math",
  "topic": "fractions",
  "subtopic": "add-unlike-denom",
  "numProblems": 15,
  "difficulty": "medium",
  "options": {
    "includeAnswerKey": true,
    "includeHints": true,
    "includeVisuals": true
  },
  "personalization": {
    "studentName": "Emma",
    "worksheetTitle": "Fraction Addition Practice",
    "teacherName": "Mrs. Rodriguez"
  }
}

Response:
{
  "worksheetId": "ws_abc123",
  "status": "ready",
  "downloadUrl": "https://homebook-worksheets.s3.amazonaws.com/...",
  "expiresAt": "2026-02-04T15:00:00Z",
  "filename": "fraction-addition-emma.pdf",
  "pages": 3
}
```

---

## Part 6: File Structure

```
homebook/
├── apps/
│   └── web/                              # Next.js 16 frontend
│       ├── app/
│       │   ├── page.tsx                  # Landing page
│       │   ├── generate/page.tsx         # Worksheet generator UI
│       │   ├── games/                    # Game Arena (37 games)
│       │   │   ├── fraction-lab/         # Fraction curriculum
│       │   │   ├── math-blitz/           # Arithmetic speed
│       │   │   ├── times-table/          # Multiplication
│       │   │   ├── science-study/        # Science quiz
│       │   │   ├── geography/            # Geography challenge
│       │   │   ├── progress/             # Profile & achievements
│       │   │   └── .../                  # 21 more game routes
│       │   ├── api/
│       │   │   ├── profiles/             # User profile CRUD
│       │   │   ├── scores/               # Global high scores
│       │   │   ├── preview/route.ts      # Proxy to Python API
│       │   │   └── generate/route.ts     # Proxy to Python API
│       │   └── layout.tsx
│       ├── components/
│       │   ├── games/                    # Game components
│       │   │   ├── FractionLabGame.tsx   # 14 challenge types, grade 1-11
│       │   │   ├── MathBlitzGame.tsx
│       │   │   └── .../                  # 25 more game components
│       │   ├── generator/                # Worksheet generator UI
│       │   └── ui/                       # Shared UI components
│       ├── lib/
│       │   ├── games/
│       │   │   ├── adaptive-difficulty.ts  # Adaptive engine
│       │   │   ├── achievements.ts         # Achievement system
│       │   │   ├── profile-context.tsx     # Profile React context
│       │   │   ├── use-scores.ts          # Score hooks
│       │   │   └── audio.ts              # Sound effects
│       │   ├── subjects.ts               # Worksheet subjects
│       │   ├── api.ts                    # API client
│       │   └── store.ts                  # Zustand store
│       └── public/
│           └── game-icons/               # 99 AI-generated game assets
│
├── packages/
│   └── generator/                        # Python worksheet generator
│       ├── src/
│       │   ├── generators/
│       │   │   ├── fractions.py
│       │   │   ├── arithmetic.py
│       │   │   ├── decimals.py
│       │   │   ├── chemistry.py
│       │   │   └── biology.py
│       │   ├── api/main.py               # FastAPI
│       │   ├── models.py
│       │   ├── renderer.py               # Jinja2 HTML
│       │   ├── pdf_generator.py          # WeasyPrint
│       │   ├── s3_client.py
│       │   ├── llm_service.py            # OpenAI integration
│       │   └── cache.py                  # Two-tier LLM cache
│       ├── templates/
│       ├── tests/
│       ├── requirements.txt
│       └── Dockerfile
│
├── infra/
│   ├── aws/                              # S3, IAM, Secrets Manager
│   ├── nginx/                            # Reverse proxy config
│   └── scripts/                          # Deploy scripts
│
├── .github/
│   └── workflows/
│       ├── ci.yml                        # CI: tests + build
│       └── deploy-frontend.yml           # Auto-deploy on push
│
├── .env
├── .gitignore
├── STATUS.md                             # Project status
├── TECHNICAL_SPEC.md                     # This file
└── package.json
```

---

## Part 7: Success Criteria (Worksheet Generator)

1. **Generator works:** All subtopics produce valid problems with correct GCF/LCD
2. **Visuals work:** SVG fraction bars render in print quality
3. **Worksheets generate:** HTML renders, WeasyPrint PDF works, S3 upload succeeds
4. **User story:** Teachers can create differentiated worksheets with hints and answer keys

---

## Part 8: Game Arena Architecture

### Overview

The Game Arena is a collection of 37 interactive educational games (plus Daily Challenge) built as React components within the Next.js frontend. Games span 7 sections: Math, Science, Language & Logic, Puzzle & Creative, Data & Media Literacy, Computer Science, and Design. Games share common infrastructure for adaptive difficulty, achievements, scoring, and optional user profiles.

### Adaptive Difficulty Engine

All games use a centralized adaptive engine (`lib/games/adaptive-difficulty.ts`):

```typescript
interface AdaptiveState {
  level: number;        // 1-50 floating point
  streak: number;       // Current correct streak
  maxStreak: number;    // Session best streak
  totalCorrect: number;
  totalWrong: number;
  history: Array<{ correct: boolean; timeMs: number }>;
}
```

The engine increases difficulty on correct streaks (especially fast ones) and decreases on wrong answers. The penalty for wrong answers is intentionally less than the reward for correct answers.

Level maps to grade through `getLevelConfig(level)` which returns grade-appropriate parameters (denominator pools, number ranges, operation types, etc.).

### User Profiles

Optional profiles use kid-friendly access codes (e.g., `BLUE-FOX-73`) instead of passwords:

- **Storage:** SQLite via `better-sqlite3` with WAL mode
- **API:** Next.js API routes at `/api/profiles/`
- **Context:** React context (`profile-context.tsx`) provides profile state to all games
- **Sync:** Game results sync to server on completion

### Achievement System

Bronze/Silver/Gold tiers with categories: Score Master, Streak Master, Speed Demon, Polymath (play all 38 games), Daily Player, Perfectionist. Additional tiers (Unstoppable, Immortal, Legendary) for extreme performance.

### Audio

Sound effects for correct/wrong answers, achievements, countdowns, and game completion. User-togglable mute.

### Key Design Decisions

1. **Client-side game logic** — All game state lives in React hooks, not server-side. This means zero latency for game interactions.
2. **localStorage for scores** — Games work offline. Scores sync to server when profiles are active.
3. **No external game engine** — Pure React + CSS animations + Canvas API (for Maze Runner, Trace & Learn, Color Lab). This keeps the bundle small and avoids heavy dependencies.
4. **Deterministic question generation** — All math/science questions are generated client-side with seeded randomness, no API calls needed during gameplay.

---

*This specification covers both the worksheet generator backend and the game arena frontend.*
