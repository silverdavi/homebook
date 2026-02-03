# Generator Agent - Homebook (teacher.ninja)

> Session: homebook-generator-001
> Budget: $60
> Priority: HIGHEST - This is the core of the product

## YOUR OWNERSHIP
You exclusively own:
- `packages/generator/` (entire directory)

## DO NOT TOUCH
- `apps/` (Frontend/Backend)
- `templates/` (Templates Agent)
- `infra/` (Infra/DNS Agents)

## YOUR MISSION
Build the Python problem generator service. **FRACTIONS IS THE FIRST MODULE.**
Use Python's `fractions.Fraction` class for exact arithmetic - no floating point errors.

---

## PHASE 1: Project Setup

### Task 1.1: Create Package Structure
```
packages/generator/
├── src/
│   ├── __init__.py
│   ├── config.py
│   ├── models.py
│   ├── generators/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── fractions.py       ← FIRST
│   │   └── registry.py
│   ├── math_explanations.py   # GCF/LCD step-by-step
│   ├── visualizations.py      # SVG generators
│   ├── renderer.py            # Jinja2 HTML
│   ├── pdf_generator.py       # WeasyPrint
│   ├── s3_client.py
│   ├── secrets.py             ← Already created
│   └── api/
│       ├── __init__.py
│       └── main.py            # FastAPI
├── templates/
│   └── .gitkeep               # Templates Agent fills this
├── tests/
│   ├── __init__.py
│   └── test_fractions.py
├── requirements.txt
├── Dockerfile
└── README.md
```

### Task 1.2: Create requirements.txt
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
jinja2==3.1.3
weasyprint==60.2
boto3==1.34.25
python-dotenv==1.0.0
pytest==7.4.4
httpx==0.26.0
openai==1.10.0
google-generativeai==0.3.2
```

---

## PHASE 2: Core Data Models

### Task 2.1: Create models.py

```python
# packages/generator/src/models.py

from dataclasses import dataclass, field
from fractions import Fraction
from typing import Optional, List, Dict, Any
from enum import Enum


class Difficulty(Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    MIXED = "mixed"


@dataclass
class Problem:
    """Base problem class."""
    id: str
    question_text: str
    question_html: str
    answer: Any
    answer_text: str
    hint: Optional[str] = None
    worked_solution: Optional[str] = None
    visual_svg: Optional[str] = None
    topic: str = ""
    subtopic: str = ""
    difficulty: Difficulty = Difficulty.MEDIUM
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class FractionProblem(Problem):
    """Fraction-specific problem with LCD/GCF info."""
    lcd: Optional[int] = None
    gcf: Optional[int] = None
    equivalent_fractions: Optional[Dict[str, str]] = None


@dataclass
class GeneratorConfig:
    """Configuration for worksheet generation."""
    topic: str
    subtopic: str
    num_problems: int = 10
    difficulty: Difficulty = Difficulty.MEDIUM
    
    # Options
    include_hints: bool = False
    include_worked_examples: bool = False
    include_visuals: bool = True
    include_answer_key: bool = True
    show_lcd_reference: bool = False
    
    # Constraints
    max_denominator: int = 12
    allow_improper: bool = False
    require_simplification: bool = True
    
    # Personalization
    student_name: Optional[str] = None
    worksheet_title: Optional[str] = None
    teacher_name: Optional[str] = None
    date: Optional[str] = None


@dataclass
class Worksheet:
    """Generated worksheet."""
    id: str
    config: GeneratorConfig
    problems: List[Problem]
    html_content: str
    pdf_url: Optional[str] = None
    created_at: Optional[str] = None
```

---

## PHASE 3: Fractions Generator (MOST IMPORTANT)

### Task 3.1: Create base.py

```python
# packages/generator/src/generators/base.py

from abc import ABC, abstractmethod
from typing import List
from ..models import Problem, GeneratorConfig


class BaseGenerator(ABC):
    """Abstract base class for all generators."""
    
    topic: str
    subtopics: List[str]
    
    @abstractmethod
    def generate(self, config: GeneratorConfig) -> List[Problem]:
        pass
    
    def supports(self, subtopic: str) -> bool:
        return subtopic in self.subtopics
```

### Task 3.2: Create fractions.py (THE CORE)

Implement complete FractionGenerator with these subtopics:
- `add-same-denom`
- `subtract-same-denom`
- `add-unlike-denom` ← Primary focus
- `subtract-unlike-denom`
- `equivalent-fractions`
- `simplify-to-lowest`
- `compare-fractions`
- `multiply-fractions`
- `divide-fractions`
- `mixed-to-improper`
- `improper-to-mixed`

**CRITICAL**: Use Python's `fractions.Fraction` class:
```python
from fractions import Fraction
import math

# Example: Add 1/3 + 1/4
frac1 = Fraction(1, 3)
frac2 = Fraction(1, 4)
answer = frac1 + frac2  # Automatically = Fraction(7, 12)

# LCD calculation
lcd = math.lcm(3, 4)  # = 12

# GCF for simplification
gcf = math.gcd(6, 8)  # = 2, so 6/8 → 3/4
```

### Task 3.3: Create math_explanations.py

```python
def explain_gcf(a: int, b: int) -> str:
    """Step-by-step GCF explanation for students."""
    
def explain_lcd(a: int, b: int) -> str:
    """Step-by-step LCD explanation for students."""
    
def explain_simplify(num: int, den: int) -> str:
    """Step-by-step simplification explanation."""
```

### Task 3.4: Create visualizations.py

Generate SVG fraction bars:
```python
def create_fraction_bar(fraction: Fraction, width: int = 200) -> str:
    """Create SVG of a fraction bar."""
    
def create_addition_visual(frac1: Fraction, frac2: Fraction) -> str:
    """Create SVG showing fraction addition with bars."""
```

---

## PHASE 4: Rendering & PDF

### Task 4.1: Create renderer.py

```python
from jinja2 import Environment, FileSystemLoader
from .models import Worksheet, GeneratorConfig

def render_worksheet(worksheet: Worksheet) -> str:
    """Render worksheet to HTML using Jinja2 template."""
```

### Task 4.2: Create pdf_generator.py

```python
from weasyprint import HTML

def generate_pdf(html_content: str) -> bytes:
    """Convert HTML to PDF using WeasyPrint."""
    html = HTML(string=html_content)
    return html.write_pdf()
```

### Task 4.3: Create s3_client.py

```python
import boto3
from .secrets import get_secrets

def upload_pdf(pdf_bytes: bytes, worksheet_id: str) -> str:
    """Upload PDF to S3, return pre-signed download URL."""
```

---

## PHASE 5: FastAPI Server

### Task 5.1: Create api/main.py

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Homebook Generator API")

# CORS for teacher.ninja
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://teacher.ninja",
        "https://www.teacher.ninja",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "homebook-generator"}

@app.post("/preview")
def preview(config: GeneratorConfigRequest):
    """Generate problems and return HTML preview."""
    
@app.post("/generate")
def generate(config: GeneratorConfigRequest):
    """Generate full PDF and upload to S3."""
```

---

## PHASE 6: Tests

### Task 6.1: Create test_fractions.py

```python
import pytest
from fractions import Fraction
from src.generators.fractions import FractionGenerator
from src.models import GeneratorConfig, Difficulty

def test_add_unlike_denom_produces_correct_answer():
    """Test that 1/3 + 1/4 = 7/12"""
    
def test_simplification_works():
    """Test that 6/8 simplifies to 3/4"""
    
def test_lcd_calculation():
    """Test LCD of 4 and 6 is 12"""
    
def test_gcf_calculation():
    """Test GCF of 12 and 18 is 6"""
```

---

## DIFFICULTY SETTINGS

| Difficulty | Denominators | Notes |
|------------|--------------|-------|
| EASY | 2, 3, 4, 5, 6 | Simple, friendly numbers |
| MEDIUM | 2, 3, 4, 5, 6, 8, 10 | Grade-level appropriate |
| HARD | 2-12 | Includes 7, 9, 11, 12 |

---

## GIT RULES
- Commit after each file: `git add packages/generator && git commit -m "agent/generator: add [file]"`
- Push after each phase: `git push`

## STATUS UPDATES
Update `scripts/agents/generator-status.md` after each phase:
```markdown
# Generator Agent Status
## Current: Phase X - [description]
## Completed:
- [x] Task 1
## In Progress:
- [ ] Task 2
## Blockers: none
```

## REMEMBER
- Use `fractions.Fraction` for ALL fraction math
- Use `math.gcd()` and `math.lcm()` for GCF/LCD
- Generate SVG inline (no external files)
- Test every generator function
- NEVER use mock data or fallbacks
