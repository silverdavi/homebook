# Arithmetic Generator Agent

> Session: arithmetic-generator
> Budget: $50
> Started: 2026-02-04

## YOUR OWNERSHIP
You exclusively own and can edit:
- `packages/generator/src/generators/arithmetic.py` (CREATE THIS)
- `packages/generator/src/generators/__init__.py`
- `packages/generator/src/generators/registry.py`

## DO NOT TOUCH
These directories are owned by other agents:
- `apps/web/` (Frontend Agent)
- `packages/generator/templates/` (Templates Agent)
- `packages/generator/src/api/` (API Agent)
- Other generator files (fractions.py, chemistry.py, biology.py)

## YOUR MISSION
Create a comprehensive arithmetic generator for basic math operations: addition, subtraction, multiplication, and division. This covers grades K-6 and is fundamental for any educational worksheet platform.

## IMMEDIATE TASKS (in order)

### 1. Create `packages/generator/src/generators/arithmetic.py`

Build a full arithmetic generator following the pattern in `fractions.py`:

```python
"""
Arithmetic problem generator for basic math operations.
Covers addition, subtraction, multiplication, and division.
"""

from dataclasses import dataclass
from typing import List, Optional, Tuple
import random
import uuid

from .base import BaseGenerator
from ..models import Problem, GeneratorConfig, Difficulty

# Difficulty-based number ranges
DIFFICULTY_RANGES = {
    # (min_num, max_num, max_result)
    Difficulty.EASY: {
        "add": (1, 10, 20),
        "subtract": (1, 10, 20),
        "multiply": (1, 5, 25),
        "divide": (1, 5, 25),
    },
    Difficulty.MEDIUM: {
        "add": (10, 100, 200),
        "subtract": (10, 100, 200),
        "multiply": (2, 12, 144),
        "divide": (2, 12, 144),
    },
    Difficulty.HARD: {
        "add": (100, 1000, 2000),
        "subtract": (100, 1000, 2000),
        "multiply": (10, 25, 625),
        "divide": (10, 25, 625),
    },
}

class ArithmeticGenerator(BaseGenerator):
    """Generator for arithmetic problems."""
    
    def generate(self, config: GeneratorConfig) -> List[Problem]:
        """Generate arithmetic problems based on config."""
        problems = []
        subtopic = config.subtopic_id
        difficulty = config.difficulty
        num_problems = config.num_problems
        
        # Map subtopics to operations
        operation_map = {
            "addition": "add",
            "subtraction": "subtract",
            "multiplication": "multiply",
            "division": "divide",
            "mixed": "mixed",
        }
        operation = operation_map.get(subtopic, "mixed")
        
        for i in range(num_problems):
            if operation == "mixed":
                op = random.choice(["add", "subtract", "multiply", "divide"])
            else:
                op = operation
            
            problem = self._generate_problem(op, difficulty, config)
            problems.append(problem)
        
        return problems
    
    def _generate_problem(
        self, 
        operation: str, 
        difficulty: Difficulty,
        config: GeneratorConfig
    ) -> Problem:
        """Generate a single arithmetic problem."""
        ranges = DIFFICULTY_RANGES.get(difficulty, DIFFICULTY_RANGES[Difficulty.MEDIUM])
        op_range = ranges[operation]
        min_num, max_num, max_result = op_range
        
        # Generate numbers based on operation
        if operation == "add":
            a = random.randint(min_num, max_num)
            b = random.randint(min_num, min(max_num, max_result - a))
            answer = a + b
            symbol = "+"
            question = f"{a} + {b}"
            hint = f"Add {a} and {b}. You can count up from {a}."
            solution = f"{a} + {b} = {answer}"
            
        elif operation == "subtract":
            a = random.randint(min_num, max_num)
            b = random.randint(min_num, a)  # Ensure positive result
            answer = a - b
            symbol = "−"
            question = f"{a} − {b}"
            hint = f"Subtract {b} from {a}. You can count down from {a}."
            solution = f"{a} − {b} = {answer}"
            
        elif operation == "multiply":
            a = random.randint(min_num, max_num)
            b = random.randint(min_num, max_num)
            answer = a * b
            symbol = "×"
            question = f"{a} × {b}"
            hint = f"Multiply {a} by {b}. Think: {a} groups of {b}."
            solution = f"{a} × {b} = {answer}"
            
        else:  # divide
            # Generate dividend and divisor to ensure clean division
            b = random.randint(max(2, min_num), max_num)
            quotient = random.randint(min_num, max_num)
            a = b * quotient  # dividend
            answer = quotient
            symbol = "÷"
            question = f"{a} ÷ {b}"
            hint = f"Divide {a} by {b}. How many groups of {b} fit into {a}?"
            solution = f"{a} ÷ {b} = {answer}"
        
        # Build HTML representation
        question_html = f"<span class='math-expression'>{question} = </span>"
        
        # Build worked solution
        worked_solution = None
        if config.include_worked_examples:
            worked_solution = self._build_worked_solution(
                operation, a, b, answer, symbol
            )
        
        return Problem(
            id=str(uuid.uuid4()),
            content=question_html,
            content_text=question,
            answer=str(answer),
            hint=hint if config.include_hints else None,
            solution=solution,
            worked_solution=worked_solution,
            difficulty=difficulty.value,
            topic="arithmetic",
            subtopic=operation,
        )
    
    def _build_worked_solution(
        self, 
        operation: str, 
        a: int, 
        b: int, 
        answer: int,
        symbol: str
    ) -> str:
        """Build a step-by-step worked solution."""
        if operation == "add":
            return (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> {a} + {b}</p>"
                f"<p><strong>Step 1:</strong> Start with {a}</p>"
                f"<p><strong>Step 2:</strong> Add {b} more</p>"
                f"<p><strong>Answer:</strong> {answer}</p>"
                f"</div>"
            )
        elif operation == "subtract":
            return (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> {a} − {b}</p>"
                f"<p><strong>Step 1:</strong> Start with {a}</p>"
                f"<p><strong>Step 2:</strong> Take away {b}</p>"
                f"<p><strong>Answer:</strong> {answer}</p>"
                f"</div>"
            )
        elif operation == "multiply":
            return (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> {a} × {b}</p>"
                f"<p><strong>Step 1:</strong> Think of {a} groups with {b} in each</p>"
                f"<p><strong>Step 2:</strong> Count total: {a} × {b} = {answer}</p>"
                f"<p><strong>Answer:</strong> {answer}</p>"
                f"</div>"
            )
        else:  # divide
            return (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> {a} ÷ {b}</p>"
                f"<p><strong>Step 1:</strong> How many groups of {b} fit in {a}?</p>"
                f"<p><strong>Step 2:</strong> {a} ÷ {b} = {answer} groups</p>"
                f"<p><strong>Answer:</strong> {answer}</p>"
                f"</div>"
            )
```

### 2. Register the generator

Update `packages/generator/src/generators/registry.py` to include the new arithmetic generator:

```python
from .arithmetic import ArithmeticGenerator

GENERATORS = {
    # ... existing ...
    "arithmetic": ArithmeticGenerator,
}
```

### 3. Update `__init__.py`

Export the new generator in `packages/generator/src/generators/__init__.py`.

### 4. Add topic definition

The topic needs to be defined. Check if there's a topics config file or if it's handled differently. Add arithmetic subtopics:
- addition
- subtraction
- multiplication
- division
- mixed (random mix of all operations)

### 5. Verify it works

Test that the generator can be imported and creates valid problems:
```bash
cd packages/generator && python3 -c "
from src.generators.arithmetic import ArithmeticGenerator
from src.models import GeneratorConfig, Difficulty
config = GeneratorConfig(
    subject='math',
    topic_id='arithmetic',
    subtopic_id='addition',
    difficulty=Difficulty.EASY,
    num_problems=5,
)
gen = ArithmeticGenerator()
problems = gen.generate(config)
for p in problems:
    print(f'{p.content_text} = {p.answer}')
"
```

## SUBTOPICS TO SUPPORT
1. **addition** - Basic addition (a + b)
2. **subtraction** - Basic subtraction (a - b)
3. **multiplication** - Basic multiplication (a × b)
4. **division** - Basic division with whole number results (a ÷ b)
5. **mixed** - Random mix of all operations

## GIT RULES
- Pull before editing: `git pull`
- Commit after each task: `git add packages/generator/src/generators/ && git commit -m "agent/arithmetic-generator: desc"`
- Push immediately: `git push`

## STATUS UPDATES
After each major task, update `scripts/agents/arithmetic-generator-status.md`

## ON COMPLETION
1. Update your status file with COMPLETE
2. Verify: `python3 -c "from src.generators.arithmetic import ArithmeticGenerator; print('OK')"`
3. Commit all changes
4. Push to remote

## REMEMBER
- Follow the pattern from fractions.py
- NEVER use fallbacks - if something fails, raise an error
- Ensure division always produces whole number results
- Include comprehensive hints and worked solutions
