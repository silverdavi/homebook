# Standards Alignment Agent

> Session: standards
> Budget: $40
> Started: 2026-02-04

## YOUR OWNERSHIP
You exclusively own and can edit:
- `packages/generator/src/standards.py` (CREATE THIS)
- `apps/web/lib/standards.ts` (CREATE THIS)
- Can update `packages/generator/src/models.py` to add standards fields

## DO NOT TOUCH
- Generator files (owned by other agents)
- Template files
- API files

## YOUR MISSION
Add Common Core State Standards (CCSS) alignment to the worksheet system. Teachers need to see which standards each worksheet covers.

## IMMEDIATE TASKS (in order)

### 1. Create `packages/generator/src/standards.py`

Build a standards database and mapping:

```python
"""
Common Core State Standards alignment for educational content.
Maps topics and subtopics to CCSS standards.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional


@dataclass
class Standard:
    """A single educational standard."""
    id: str                     # e.g., "CCSS.MATH.CONTENT.5.NF.A.1"
    code: str                   # e.g., "5.NF.A.1"
    domain: str                 # e.g., "Number & Operations—Fractions"
    cluster: str                # e.g., "Use equivalent fractions..."
    description: str            # Full standard text
    grade: str                  # e.g., "5"


# Common Core Math Standards Database
# Reference: http://www.corestandards.org/Math/

STANDARDS: Dict[str, Standard] = {
    # Grade 3 - Fractions
    "3.NF.A.1": Standard(
        id="CCSS.MATH.CONTENT.3.NF.A.1",
        code="3.NF.A.1",
        domain="Number & Operations—Fractions",
        cluster="Develop understanding of fractions as numbers",
        description="Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts.",
        grade="3",
    ),
    "3.NF.A.2": Standard(
        id="CCSS.MATH.CONTENT.3.NF.A.2",
        code="3.NF.A.2",
        domain="Number & Operations—Fractions",
        cluster="Develop understanding of fractions as numbers",
        description="Understand a fraction as a number on the number line.",
        grade="3",
    ),
    
    # Grade 4 - Fractions
    "4.NF.A.1": Standard(
        id="CCSS.MATH.CONTENT.4.NF.A.1",
        code="4.NF.A.1",
        domain="Number & Operations—Fractions",
        cluster="Extend understanding of fraction equivalence and ordering",
        description="Explain why a fraction a/b is equivalent to a fraction (n×a)/(n×b).",
        grade="4",
    ),
    "4.NF.B.3": Standard(
        id="CCSS.MATH.CONTENT.4.NF.B.3",
        code="4.NF.B.3",
        domain="Number & Operations—Fractions",
        cluster="Build fractions from unit fractions",
        description="Understand a fraction a/b with a > 1 as a sum of fractions 1/b.",
        grade="4",
    ),
    
    # Grade 5 - Fractions
    "5.NF.A.1": Standard(
        id="CCSS.MATH.CONTENT.5.NF.A.1",
        code="5.NF.A.1",
        domain="Number & Operations—Fractions",
        cluster="Use equivalent fractions to add and subtract fractions",
        description="Add and subtract fractions with unlike denominators by replacing given fractions with equivalent fractions.",
        grade="5",
    ),
    "5.NF.A.2": Standard(
        id="CCSS.MATH.CONTENT.5.NF.A.2",
        code="5.NF.A.2",
        domain="Number & Operations—Fractions",
        cluster="Use equivalent fractions to add and subtract fractions",
        description="Solve word problems involving addition and subtraction of fractions.",
        grade="5",
    ),
    "5.NF.B.4": Standard(
        id="CCSS.MATH.CONTENT.5.NF.B.4",
        code="5.NF.B.4",
        domain="Number & Operations—Fractions",
        cluster="Apply and extend previous understandings of multiplication and division",
        description="Apply and extend previous understandings of multiplication to multiply a fraction or whole number by a fraction.",
        grade="5",
    ),
    "5.NF.B.7": Standard(
        id="CCSS.MATH.CONTENT.5.NF.B.7",
        code="5.NF.B.7",
        domain="Number & Operations—Fractions",
        cluster="Apply and extend previous understandings of multiplication and division",
        description="Apply and extend previous understandings of division to divide unit fractions by whole numbers and whole numbers by unit fractions.",
        grade="5",
    ),
    
    # Grade 4-6 - Decimals
    "4.NF.C.6": Standard(
        id="CCSS.MATH.CONTENT.4.NF.C.6",
        code="4.NF.C.6",
        domain="Number & Operations—Fractions",
        cluster="Understand decimal notation for fractions",
        description="Use decimal notation for fractions with denominators 10 or 100.",
        grade="4",
    ),
    "5.NBT.A.3": Standard(
        id="CCSS.MATH.CONTENT.5.NBT.A.3",
        code="5.NBT.A.3",
        domain="Number & Operations in Base Ten",
        cluster="Understand the place value system",
        description="Read, write, and compare decimals to thousandths.",
        grade="5",
    ),
    "5.NBT.B.7": Standard(
        id="CCSS.MATH.CONTENT.5.NBT.B.7",
        code="5.NBT.B.7",
        domain="Number & Operations in Base Ten",
        cluster="Perform operations with multi-digit whole numbers and with decimals to hundredths",
        description="Add, subtract, multiply, and divide decimals to hundredths.",
        grade="5",
    ),
    
    # Percentages (Grade 6-7)
    "6.RP.A.3": Standard(
        id="CCSS.MATH.CONTENT.6.RP.A.3",
        code="6.RP.A.3",
        domain="Ratios & Proportional Relationships",
        cluster="Understand ratio concepts and use ratio reasoning",
        description="Use ratio and rate reasoning to solve real-world problems, including percent problems.",
        grade="6",
    ),
    "7.RP.A.3": Standard(
        id="CCSS.MATH.CONTENT.7.RP.A.3",
        code="7.RP.A.3",
        domain="Ratios & Proportional Relationships",
        cluster="Analyze proportional relationships and use them to solve problems",
        description="Use proportional relationships to solve multi-step ratio and percent problems.",
        grade="7",
    ),
    
    # Basic Arithmetic (K-3)
    "1.OA.A.1": Standard(
        id="CCSS.MATH.CONTENT.1.OA.A.1",
        code="1.OA.A.1",
        domain="Operations & Algebraic Thinking",
        cluster="Represent and solve problems involving addition and subtraction",
        description="Use addition and subtraction within 20 to solve word problems.",
        grade="1",
    ),
    "2.OA.A.1": Standard(
        id="CCSS.MATH.CONTENT.2.OA.A.1",
        code="2.OA.A.1",
        domain="Operations & Algebraic Thinking",
        cluster="Represent and solve problems involving addition and subtraction",
        description="Use addition and subtraction within 100 to solve one- and two-step word problems.",
        grade="2",
    ),
    "3.OA.A.1": Standard(
        id="CCSS.MATH.CONTENT.3.OA.A.1",
        code="3.OA.A.1",
        domain="Operations & Algebraic Thinking",
        cluster="Represent and solve problems involving multiplication and division",
        description="Interpret products of whole numbers.",
        grade="3",
    ),
    "3.OA.A.2": Standard(
        id="CCSS.MATH.CONTENT.3.OA.A.2",
        code="3.OA.A.2",
        domain="Operations & Algebraic Thinking",
        cluster="Represent and solve problems involving multiplication and division",
        description="Interpret whole-number quotients of whole numbers.",
        grade="3",
    ),
}


# Mapping of subtopics to standards
SUBTOPIC_STANDARDS: Dict[str, List[str]] = {
    # Fractions
    "adding-fractions": ["5.NF.A.1", "5.NF.A.2"],
    "subtracting-fractions": ["5.NF.A.1", "5.NF.A.2"],
    "multiplying-fractions": ["5.NF.B.4"],
    "dividing-fractions": ["5.NF.B.7"],
    "comparing-fractions": ["4.NF.A.1", "4.NF.A.2"],
    "simplifying-fractions": ["4.NF.A.1"],
    "equivalent-fractions": ["4.NF.A.1"],
    "mixed-numbers": ["4.NF.B.3"],
    "improper-fractions": ["4.NF.B.3"],
    
    # Decimals
    "decimal-addition": ["5.NBT.B.7"],
    "decimal-subtraction": ["5.NBT.B.7"],
    "decimal-multiplication": ["5.NBT.B.7"],
    "decimal-division": ["5.NBT.B.7"],
    "decimal-to-fraction": ["4.NF.C.6"],
    "fraction-to-decimal": ["4.NF.C.6"],
    
    # Percentages
    "percent-of-number": ["6.RP.A.3"],
    "number-to-percent": ["6.RP.A.3"],
    "percent-to-decimal": ["6.RP.A.3"],
    "decimal-to-percent": ["6.RP.A.3"],
    "percent-increase": ["7.RP.A.3"],
    "percent-decrease": ["7.RP.A.3"],
    
    # Arithmetic
    "addition": ["1.OA.A.1", "2.OA.A.1"],
    "subtraction": ["1.OA.A.1", "2.OA.A.1"],
    "multiplication": ["3.OA.A.1"],
    "division": ["3.OA.A.2"],
}


def get_standards_for_subtopic(subtopic_id: str) -> List[Standard]:
    """Get all standards that apply to a given subtopic."""
    codes = SUBTOPIC_STANDARDS.get(subtopic_id, [])
    return [STANDARDS[code] for code in codes if code in STANDARDS]


def get_standards_for_worksheet(subtopic_ids: List[str]) -> List[Standard]:
    """Get all unique standards for a list of subtopics."""
    seen = set()
    standards = []
    for subtopic in subtopic_ids:
        for std in get_standards_for_subtopic(subtopic):
            if std.code not in seen:
                seen.add(std.code)
                standards.append(std)
    return sorted(standards, key=lambda s: s.code)


def format_standards_for_display(standards: List[Standard]) -> str:
    """Format standards for display on worksheet footer."""
    return ", ".join(s.code for s in standards)
```

### 2. Update models.py

Add standards to the Problem and Worksheet models:

```python
# In Problem dataclass, add:
standards: List[str] = field(default_factory=list)  # List of standard codes

# In Worksheet dataclass, add:
standards: List[str] = field(default_factory=list)
standards_display: str = ""  # Formatted for printing
```

### 3. Create `apps/web/lib/standards.ts`

Frontend standards display:

```typescript
export interface Standard {
  id: string;
  code: string;
  domain: string;
  description: string;
  grade: string;
}

export const STANDARDS: Record<string, Standard> = {
  "5.NF.A.1": {
    id: "CCSS.MATH.CONTENT.5.NF.A.1",
    code: "5.NF.A.1",
    domain: "Number & Operations—Fractions",
    description: "Add and subtract fractions with unlike denominators.",
    grade: "5",
  },
  // ... more standards
};

export function getStandardsForSubtopic(subtopicId: string): Standard[] {
  const mapping: Record<string, string[]> = {
    "adding-fractions": ["5.NF.A.1", "5.NF.A.2"],
    "subtracting-fractions": ["5.NF.A.1", "5.NF.A.2"],
    // ... etc
  };
  const codes = mapping[subtopicId] || [];
  return codes.map(code => STANDARDS[code]).filter(Boolean);
}
```

### 4. Verify it works

```bash
cd packages/generator && python3 -c "
from src.standards import get_standards_for_subtopic, format_standards_for_display
stds = get_standards_for_subtopic('adding-fractions')
print(format_standards_for_display(stds))
for s in stds:
    print(f'  {s.code}: {s.description[:50]}...')
"
```

## GIT RULES
- Pull before editing: `git pull`
- Commit after each task
- Push immediately: `git push`

## ON COMPLETION
1. Update status file with COMPLETE
2. Verify: `python3 -c "from src.standards import STANDARDS; print(len(STANDARDS), 'standards')"`
3. Commit and push
