# Decimals & Percentages Generator Agent

> Session: decimals-generator
> Budget: $50
> Started: 2026-02-04

## YOUR OWNERSHIP
You exclusively own and can edit:
- `packages/generator/src/generators/decimals.py` (CREATE THIS)
- Can update `packages/generator/src/generators/registry.py` to add entry
- Can update `packages/generator/src/generators/__init__.py` to add export

## DO NOT TOUCH
These directories are owned by other agents:
- `apps/web/` (Frontend Agent)
- `packages/generator/templates/` (Templates Agent)
- Other generator files except for registry additions

## YOUR MISSION
Create a comprehensive decimals and percentages generator. This is a key math topic for grades 4-7.

## IMMEDIATE TASKS (in order)

### 1. Create `packages/generator/src/generators/decimals.py`

Build a decimals/percentages generator:

```python
"""
Decimals and Percentages problem generator.
Covers decimal operations and percentage calculations.
"""

from dataclasses import dataclass
from typing import List, Optional
from decimal import Decimal, ROUND_HALF_UP
import random
import uuid

from .base import BaseGenerator
from ..models import Problem, GeneratorConfig, Difficulty


class DecimalsGenerator(BaseGenerator):
    """Generator for decimal and percentage problems."""
    
    # Difficulty-based decimal places
    DECIMAL_PLACES = {
        Difficulty.EASY: 1,      # 0.5, 1.2
        Difficulty.MEDIUM: 2,    # 0.25, 1.75
        Difficulty.HARD: 3,      # 0.125, 2.375
    }
    
    def generate(self, config: GeneratorConfig) -> List[Problem]:
        """Generate decimal/percentage problems."""
        problems = []
        subtopic = config.subtopic_id
        
        generators = {
            "decimal-addition": self._gen_decimal_add,
            "decimal-subtraction": self._gen_decimal_subtract,
            "decimal-multiplication": self._gen_decimal_multiply,
            "decimal-division": self._gen_decimal_divide,
            "decimal-to-fraction": self._gen_decimal_to_fraction,
            "fraction-to-decimal": self._gen_fraction_to_decimal,
            "percent-of-number": self._gen_percent_of_number,
            "number-to-percent": self._gen_number_to_percent,
            "percent-to-decimal": self._gen_percent_to_decimal,
            "decimal-to-percent": self._gen_decimal_to_percent,
            "percent-increase": self._gen_percent_increase,
            "percent-decrease": self._gen_percent_decrease,
        }
        
        gen_func = generators.get(subtopic)
        if not gen_func:
            raise ValueError(f"Unknown decimals subtopic: {subtopic}")
        
        for _ in range(config.num_problems):
            problem = gen_func(config)
            problems.append(problem)
        
        return problems
    
    def _gen_decimal_add(self, config: GeneratorConfig) -> Problem:
        """Generate decimal addition problem."""
        places = self.DECIMAL_PLACES[config.difficulty]
        factor = 10 ** places
        
        a = Decimal(random.randint(1, 100 * factor)) / factor
        b = Decimal(random.randint(1, 100 * factor)) / factor
        answer = a + b
        
        return Problem(
            id=str(uuid.uuid4()),
            content=f"<span class='math-expression'>{a} + {b} = </span>",
            content_text=f"{a} + {b}",
            answer=str(answer),
            hint=f"Line up the decimal points, then add like whole numbers.",
            solution=f"{a} + {b} = {answer}",
            worked_solution=self._decimal_add_solution(a, b, answer) if config.include_worked_examples else None,
            difficulty=config.difficulty.value,
            topic="decimals",
            subtopic="decimal-addition",
        )
    
    def _gen_decimal_subtract(self, config: GeneratorConfig) -> Problem:
        """Generate decimal subtraction problem."""
        places = self.DECIMAL_PLACES[config.difficulty]
        factor = 10 ** places
        
        a = Decimal(random.randint(50 * factor, 100 * factor)) / factor
        b = Decimal(random.randint(1, int(a * factor))) / factor
        answer = a - b
        
        return Problem(
            id=str(uuid.uuid4()),
            content=f"<span class='math-expression'>{a} − {b} = </span>",
            content_text=f"{a} − {b}",
            answer=str(answer),
            hint=f"Line up the decimal points, then subtract like whole numbers.",
            solution=f"{a} − {b} = {answer}",
            worked_solution=self._decimal_subtract_solution(a, b, answer) if config.include_worked_examples else None,
            difficulty=config.difficulty.value,
            topic="decimals",
            subtopic="decimal-subtraction",
        )
    
    def _gen_decimal_multiply(self, config: GeneratorConfig) -> Problem:
        """Generate decimal multiplication problem."""
        if config.difficulty == Difficulty.EASY:
            a = Decimal(random.randint(1, 10)) / 10
            b = Decimal(random.randint(1, 9))
        elif config.difficulty == Difficulty.MEDIUM:
            a = Decimal(random.randint(1, 100)) / 100
            b = Decimal(random.randint(1, 99))
        else:
            a = Decimal(random.randint(1, 1000)) / 1000
            b = Decimal(random.randint(1, 99))
        
        answer = (a * b).quantize(Decimal('0.001'), rounding=ROUND_HALF_UP).normalize()
        
        return Problem(
            id=str(uuid.uuid4()),
            content=f"<span class='math-expression'>{a} × {b} = </span>",
            content_text=f"{a} × {b}",
            answer=str(answer),
            hint=f"Multiply as if there's no decimal, then count total decimal places.",
            solution=f"{a} × {b} = {answer}",
            difficulty=config.difficulty.value,
            topic="decimals",
            subtopic="decimal-multiplication",
        )
    
    def _gen_decimal_divide(self, config: GeneratorConfig) -> Problem:
        """Generate decimal division problem."""
        # Generate clean division
        divisor = random.randint(2, 10)
        quotient = Decimal(random.randint(1, 20)) / 10
        dividend = divisor * quotient
        
        return Problem(
            id=str(uuid.uuid4()),
            content=f"<span class='math-expression'>{dividend} ÷ {divisor} = </span>",
            content_text=f"{dividend} ÷ {divisor}",
            answer=str(quotient),
            hint=f"Divide {dividend} by {divisor}. Move the decimal point if needed.",
            solution=f"{dividend} ÷ {divisor} = {quotient}",
            difficulty=config.difficulty.value,
            topic="decimals",
            subtopic="decimal-division",
        )
    
    def _gen_percent_of_number(self, config: GeneratorConfig) -> Problem:
        """Generate 'what is X% of Y' problem."""
        if config.difficulty == Difficulty.EASY:
            percent = random.choice([10, 20, 25, 50, 100])
            number = random.choice([10, 20, 50, 100])
        elif config.difficulty == Difficulty.MEDIUM:
            percent = random.choice([5, 10, 15, 20, 25, 30, 40, 50, 75])
            number = random.choice([20, 40, 50, 60, 80, 100, 200])
        else:
            percent = random.randint(1, 100)
            number = random.randint(10, 500)
        
        answer = (number * percent) / 100
        
        return Problem(
            id=str(uuid.uuid4()),
            content=f"<span class='math-expression'>What is {percent}% of {number}?</span>",
            content_text=f"What is {percent}% of {number}?",
            answer=str(answer),
            hint=f"Convert {percent}% to a decimal ({percent/100}), then multiply by {number}.",
            solution=f"{percent}% of {number} = {percent/100} × {number} = {answer}",
            difficulty=config.difficulty.value,
            topic="decimals",
            subtopic="percent-of-number",
        )
    
    def _gen_decimal_to_fraction(self, config: GeneratorConfig) -> Problem:
        """Convert decimal to fraction."""
        # Use common decimals with nice fraction equivalents
        conversions = [
            ("0.5", "1/2"), ("0.25", "1/4"), ("0.75", "3/4"),
            ("0.2", "1/5"), ("0.4", "2/5"), ("0.6", "3/5"),
            ("0.1", "1/10"), ("0.3", "3/10"), ("0.125", "1/8"),
        ]
        decimal_str, fraction = random.choice(conversions)
        
        return Problem(
            id=str(uuid.uuid4()),
            content=f"<span class='math-expression'>Convert {decimal_str} to a fraction</span>",
            content_text=f"Convert {decimal_str} to a fraction",
            answer=fraction,
            hint=f"Read the decimal places: {decimal_str} is _ out of 10 (or 100).",
            solution=f"{decimal_str} = {fraction}",
            difficulty=config.difficulty.value,
            topic="decimals",
            subtopic="decimal-to-fraction",
        )
    
    def _gen_fraction_to_decimal(self, config: GeneratorConfig) -> Problem:
        """Convert fraction to decimal."""
        conversions = [
            ("1/2", "0.5"), ("1/4", "0.25"), ("3/4", "0.75"),
            ("1/5", "0.2"), ("2/5", "0.4"), ("3/5", "0.6"),
            ("1/10", "0.1"), ("1/8", "0.125"), ("3/8", "0.375"),
        ]
        fraction, decimal_str = random.choice(conversions)
        
        return Problem(
            id=str(uuid.uuid4()),
            content=f"<span class='math-expression'>Convert {fraction} to a decimal</span>",
            content_text=f"Convert {fraction} to a decimal",
            answer=decimal_str,
            hint=f"Divide the numerator by the denominator.",
            solution=f"{fraction} = {decimal_str}",
            difficulty=config.difficulty.value,
            topic="decimals",
            subtopic="fraction-to-decimal",
        )
    
    def _gen_percent_to_decimal(self, config: GeneratorConfig) -> Problem:
        """Convert percent to decimal."""
        percent = random.choice([10, 20, 25, 30, 40, 50, 75, 80, 90, 100, 5, 15])
        decimal = percent / 100
        
        return Problem(
            id=str(uuid.uuid4()),
            content=f"<span class='math-expression'>Convert {percent}% to a decimal</span>",
            content_text=f"Convert {percent}% to a decimal",
            answer=str(decimal),
            hint=f"Divide by 100: move the decimal point 2 places left.",
            solution=f"{percent}% = {percent} ÷ 100 = {decimal}",
            difficulty=config.difficulty.value,
            topic="decimals",
            subtopic="percent-to-decimal",
        )
    
    def _gen_decimal_to_percent(self, config: GeneratorConfig) -> Problem:
        """Convert decimal to percent."""
        decimal = random.choice([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.75, 0.8, 0.9, 1.0, 0.05, 0.15])
        percent = int(decimal * 100)
        
        return Problem(
            id=str(uuid.uuid4()),
            content=f"<span class='math-expression'>Convert {decimal} to a percent</span>",
            content_text=f"Convert {decimal} to a percent",
            answer=f"{percent}%",
            hint=f"Multiply by 100: move the decimal point 2 places right.",
            solution=f"{decimal} = {decimal} × 100 = {percent}%",
            difficulty=config.difficulty.value,
            topic="decimals",
            subtopic="decimal-to-percent",
        )
    
    def _gen_number_to_percent(self, config: GeneratorConfig) -> Problem:
        """What percent is X of Y?"""
        if config.difficulty == Difficulty.EASY:
            total = random.choice([10, 20, 50, 100])
            part = random.choice([i for i in range(1, total+1) if (i/total*100) % 5 == 0])
        else:
            total = random.choice([20, 25, 40, 50, 80, 100])
            part = random.randint(1, total)
        
        percent = (part / total) * 100
        
        return Problem(
            id=str(uuid.uuid4()),
            content=f"<span class='math-expression'>What percent is {part} of {total}?</span>",
            content_text=f"What percent is {part} of {total}?",
            answer=f"{percent}%",
            hint=f"Divide {part} by {total}, then multiply by 100.",
            solution=f"{part} ÷ {total} = {part/total} = {percent}%",
            difficulty=config.difficulty.value,
            topic="decimals",
            subtopic="number-to-percent",
        )
    
    def _gen_percent_increase(self, config: GeneratorConfig) -> Problem:
        """Calculate result after percent increase."""
        if config.difficulty == Difficulty.EASY:
            original = random.choice([10, 20, 50, 100])
            percent = random.choice([10, 20, 50, 100])
        else:
            original = random.choice([25, 40, 50, 80, 100, 200])
            percent = random.choice([5, 10, 15, 20, 25, 30, 50])
        
        increase = original * percent / 100
        result = original + increase
        
        return Problem(
            id=str(uuid.uuid4()),
            content=f"<span class='math-expression'>Increase {original} by {percent}%</span>",
            content_text=f"Increase {original} by {percent}%",
            answer=str(result),
            hint=f"Find {percent}% of {original}, then add it to {original}.",
            solution=f"{percent}% of {original} = {increase}. {original} + {increase} = {result}",
            difficulty=config.difficulty.value,
            topic="decimals",
            subtopic="percent-increase",
        )
    
    def _gen_percent_decrease(self, config: GeneratorConfig) -> Problem:
        """Calculate result after percent decrease."""
        if config.difficulty == Difficulty.EASY:
            original = random.choice([10, 20, 50, 100])
            percent = random.choice([10, 20, 50])
        else:
            original = random.choice([25, 40, 50, 80, 100, 200])
            percent = random.choice([5, 10, 15, 20, 25, 30, 50])
        
        decrease = original * percent / 100
        result = original - decrease
        
        return Problem(
            id=str(uuid.uuid4()),
            content=f"<span class='math-expression'>Decrease {original} by {percent}%</span>",
            content_text=f"Decrease {original} by {percent}%",
            answer=str(result),
            hint=f"Find {percent}% of {original}, then subtract from {original}.",
            solution=f"{percent}% of {original} = {decrease}. {original} − {decrease} = {result}",
            difficulty=config.difficulty.value,
            topic="decimals",
            subtopic="percent-decrease",
        )
    
    def _decimal_add_solution(self, a, b, answer) -> str:
        return (
            f"<div class='worked-solution'>"
            f"<p><strong>Problem:</strong> {a} + {b}</p>"
            f"<p><strong>Step 1:</strong> Line up decimal points</p>"
            f"<p><strong>Step 2:</strong> Add each column</p>"
            f"<p><strong>Answer:</strong> {answer}</p>"
            f"</div>"
        )
    
    def _decimal_subtract_solution(self, a, b, answer) -> str:
        return (
            f"<div class='worked-solution'>"
            f"<p><strong>Problem:</strong> {a} − {b}</p>"
            f"<p><strong>Step 1:</strong> Line up decimal points</p>"
            f"<p><strong>Step 2:</strong> Subtract each column</p>"
            f"<p><strong>Answer:</strong> {answer}</p>"
            f"</div>"
        )
```

### 2. Register the generator

Update `registry.py`:
```python
from .decimals import DecimalsGenerator
GENERATORS["decimals"] = DecimalsGenerator
```

### 3. Test it works

```bash
cd packages/generator && python3 -c "
from src.generators.decimals import DecimalsGenerator
from src.models import GeneratorConfig, Difficulty
config = GeneratorConfig(
    subject='math',
    topic_id='decimals',
    subtopic_id='percent-of-number',
    difficulty=Difficulty.MEDIUM,
    num_problems=3,
)
gen = DecimalsGenerator()
for p in gen.generate(config):
    print(f'{p.content_text} = {p.answer}')
"
```

## SUBTOPICS TO SUPPORT
1. decimal-addition
2. decimal-subtraction
3. decimal-multiplication
4. decimal-division
5. decimal-to-fraction
6. fraction-to-decimal
7. percent-of-number
8. number-to-percent
9. percent-to-decimal
10. decimal-to-percent
11. percent-increase
12. percent-decrease

## GIT RULES
- Pull before editing: `git pull`
- Commit after each task
- Push immediately: `git push`

## ON COMPLETION
1. Update status file with COMPLETE
2. Verify: `python3 -c "from src.generators.decimals import DecimalsGenerator; print('OK')"`
3. Commit and push

## REMEMBER
- NEVER use fallbacks - raise errors
- Use Decimal for precision, not float
- Ensure clean answers (avoid infinite decimals)
