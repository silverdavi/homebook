"""
Decimals and Percentages problem generator.
Covers decimal operations and percentage calculations.
Uses Python's Decimal for exact arithmetic - no floating point errors.
"""

import random
import uuid
from decimal import Decimal, ROUND_HALF_UP
from fractions import Fraction
from typing import List

from ..models import Difficulty, GeneratorConfig, Problem
from .base import BaseGenerator


class DecimalsGenerator(BaseGenerator):
    """Generator for decimal and percentage problems."""

    topic = "decimals"
    subtopics = [
        "decimal-addition",
        "decimal-subtraction",
        "decimal-multiplication",
        "decimal-division",
        "decimal-to-fraction",
        "fraction-to-decimal",
        "percent-of-number",
        "number-to-percent",
        "percent-to-decimal",
        "decimal-to-percent",
        "percent-increase",
        "percent-decrease",
    ]

    # Difficulty-based decimal places
    DECIMAL_PLACES = {
        Difficulty.EASY: 1,      # 0.5, 1.2
        Difficulty.MEDIUM: 2,    # 0.25, 1.75
        Difficulty.HARD: 3,      # 0.125, 2.375
    }

    def generate(self, config: GeneratorConfig) -> List[Problem]:
        """Generate decimal/percentage problems based on config."""
        dispatch = {
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

        generator_fn = dispatch.get(config.subtopic)
        if generator_fn is None:
            raise ValueError(f"Unknown decimals subtopic: {config.subtopic}")

        problems: List[Problem] = []
        seen = set()
        attempts = 0
        max_attempts = config.num_problems * 20

        while len(problems) < config.num_problems and attempts < max_attempts:
            attempts += 1
            problem = generator_fn(config, len(problems) + 1)

            # Deduplicate by question text
            if problem.question_text not in seen:
                seen.add(problem.question_text)
                problems.append(problem)

        return problems

    def _make_id(self) -> str:
        return uuid.uuid4().hex[:12]

    def _get_decimal_places(self, config: GeneratorConfig) -> int:
        """Get decimal places based on difficulty."""
        difficulty = config.difficulty
        if difficulty == Difficulty.MIXED:
            difficulty = random.choice([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD])
        return self.DECIMAL_PLACES[difficulty]

    def _format_decimal(self, d: Decimal) -> str:
        """Format a Decimal, removing trailing zeros but avoiding scientific notation."""
        # Normalize to remove trailing zeros
        normalized = d.normalize()
        # Convert to string, avoiding scientific notation
        s = str(normalized)
        # Handle scientific notation (e.g., 3E+1 -> 30)
        if 'E' in s or 'e' in s:
            # Convert to float and back to get standard notation
            # This is safe because we're only doing it for display
            s = f"{float(normalized):g}"
        return s

    def _format_decimal_html(self, d: Decimal) -> str:
        """Format a Decimal for HTML display."""
        return f"<span class='decimal'>{self._format_decimal(d)}</span>"

    # --- Decimal Operations ---

    def _gen_decimal_add(self, config: GeneratorConfig, num: int) -> Problem:
        """Generate decimal addition problem."""
        places = self._get_decimal_places(config)
        factor = 10 ** places

        a = Decimal(random.randint(1, 100 * factor)) / factor
        b = Decimal(random.randint(1, 100 * factor)) / factor
        answer = a + b

        q_text = f"{a} + {b}"
        q_html = f"<span class='math-expression'>{a} + {b} = </span>"
        a_text = self._format_decimal(answer)

        hint = "Line up the decimal points, then add like whole numbers."

        worked = None
        if config.include_worked_examples:
            worked = (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> {a} + {b}</p>"
                f"<p><strong>Step 1:</strong> Line up decimal points</p>"
                f"<p><strong>Step 2:</strong> Add each column from right to left</p>"
                f"<p><strong>Answer:</strong> {a_text}</p>"
                f"</div>"
            )

        return Problem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="decimals",
            subtopic="decimal-addition",
            difficulty=config.difficulty,
        )

    def _gen_decimal_subtract(self, config: GeneratorConfig, num: int) -> Problem:
        """Generate decimal subtraction problem."""
        places = self._get_decimal_places(config)
        factor = 10 ** places

        a = Decimal(random.randint(50 * factor, 100 * factor)) / factor
        b_max = int(a * factor) - 1
        if b_max < 1:
            b_max = 1
        b = Decimal(random.randint(1, b_max)) / factor
        answer = a - b

        q_text = f"{a} - {b}"
        q_html = f"<span class='math-expression'>{a} - {b} = </span>"
        a_text = self._format_decimal(answer)

        hint = "Line up the decimal points, then subtract like whole numbers."

        worked = None
        if config.include_worked_examples:
            worked = (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> {a} - {b}</p>"
                f"<p><strong>Step 1:</strong> Line up decimal points</p>"
                f"<p><strong>Step 2:</strong> Subtract each column from right to left</p>"
                f"<p><strong>Answer:</strong> {a_text}</p>"
                f"</div>"
            )

        return Problem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="decimals",
            subtopic="decimal-subtraction",
            difficulty=config.difficulty,
        )

    def _gen_decimal_multiply(self, config: GeneratorConfig, num: int) -> Problem:
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

        raw_answer = a * b
        # Round to reasonable precision and normalize
        answer = raw_answer.quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP).normalize()

        q_text = f"{a} x {b}"
        q_html = f"<span class='math-expression'>{a} x {b} = </span>"
        a_text = self._format_decimal(answer)

        # Count decimal places in a
        a_str = str(a)
        decimal_places = len(a_str.split('.')[-1]) if '.' in a_str else 0

        hint = f"Multiply as if there's no decimal ({int(a * (10 ** decimal_places))} x {int(b)}), then place the decimal point {decimal_places} place(s) from the right."

        worked = None
        if config.include_worked_examples:
            whole_product = int(a * (10 ** decimal_places)) * int(b)
            worked = (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> {a} x {b}</p>"
                f"<p><strong>Step 1:</strong> Ignore the decimal: {int(a * (10 ** decimal_places))} x {int(b)} = {whole_product}</p>"
                f"<p><strong>Step 2:</strong> Count decimal places in {a}: {decimal_places}</p>"
                f"<p><strong>Step 3:</strong> Place decimal {decimal_places} place(s) from right</p>"
                f"<p><strong>Answer:</strong> {a_text}</p>"
                f"</div>"
            )

        return Problem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="decimals",
            subtopic="decimal-multiplication",
            difficulty=config.difficulty,
        )

    def _gen_decimal_divide(self, config: GeneratorConfig, num: int) -> Problem:
        """Generate decimal division problem with clean answers."""
        # Generate clean division by working backwards
        divisor = random.randint(2, 10)
        # Generate a quotient with 1-2 decimal places
        quotient_int = random.randint(1, 20)
        decimal_part = random.choice([0, 2, 4, 5, 6, 8])  # tenths that divide nicely
        quotient = Decimal(quotient_int * 10 + decimal_part) / 10

        dividend = Decimal(divisor) * quotient

        q_text = f"{dividend} / {divisor}"
        q_html = f"<span class='math-expression'>{dividend} / {divisor} = </span>"
        a_text = self._format_decimal(quotient)

        hint = f"Divide {dividend} by {divisor}. Move the decimal point in the quotient directly above where it is in the dividend."

        worked = None
        if config.include_worked_examples:
            worked = (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> {dividend} / {divisor}</p>"
                f"<p><strong>Step 1:</strong> Set up long division</p>"
                f"<p><strong>Step 2:</strong> Divide {dividend} by {divisor}</p>"
                f"<p><strong>Answer:</strong> {a_text}</p>"
                f"</div>"
            )

        return Problem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=quotient,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="decimals",
            subtopic="decimal-division",
            difficulty=config.difficulty,
        )

    # --- Conversion Problems ---

    def _gen_decimal_to_fraction(self, config: GeneratorConfig, num: int) -> Problem:
        """Convert decimal to fraction."""
        # Use common decimals with nice fraction equivalents
        conversions = [
            (Decimal("0.5"), "1/2"),
            (Decimal("0.25"), "1/4"),
            (Decimal("0.75"), "3/4"),
            (Decimal("0.2"), "1/5"),
            (Decimal("0.4"), "2/5"),
            (Decimal("0.6"), "3/5"),
            (Decimal("0.8"), "4/5"),
            (Decimal("0.1"), "1/10"),
            (Decimal("0.3"), "3/10"),
            (Decimal("0.7"), "7/10"),
            (Decimal("0.9"), "9/10"),
            (Decimal("0.125"), "1/8"),
            (Decimal("0.375"), "3/8"),
            (Decimal("0.625"), "5/8"),
            (Decimal("0.875"), "7/8"),
        ]

        # Filter by difficulty
        if config.difficulty == Difficulty.EASY:
            pool = conversions[:4]  # Simple halves and quarters
        elif config.difficulty == Difficulty.MEDIUM:
            pool = conversions[:11]  # Add fifths and tenths
        else:
            pool = conversions  # Include eighths

        decimal_val, fraction = random.choice(pool)

        q_text = f"Convert {decimal_val} to a fraction"
        q_html = f"<span class='math-expression'>Convert {decimal_val} to a fraction</span>"
        a_text = fraction

        # Parse fraction for hint
        num, denom = map(int, fraction.split('/'))
        hint = f"Read the decimal places: {decimal_val} means {int(decimal_val * 1000) if decimal_val < 1 else int(decimal_val * 100)} out of {1000 if '.' in str(decimal_val) and len(str(decimal_val).split('.')[-1]) == 3 else 10 if len(str(decimal_val).split('.')[-1]) == 1 else 100}. Then simplify."

        worked = None
        if config.include_worked_examples:
            decimal_str = str(decimal_val)
            places = len(decimal_str.split('.')[-1]) if '.' in decimal_str else 0
            denom_unsimplified = 10 ** places
            num_unsimplified = int(decimal_val * denom_unsimplified)
            worked = (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> Convert {decimal_val} to a fraction</p>"
                f"<p><strong>Step 1:</strong> {decimal_val} has {places} decimal place(s), so denominator is {denom_unsimplified}</p>"
                f"<p><strong>Step 2:</strong> Write as {num_unsimplified}/{denom_unsimplified}</p>"
                f"<p><strong>Step 3:</strong> Simplify to {fraction}</p>"
                f"</div>"
            )

        return Problem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=Fraction(num, denom),
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="decimals",
            subtopic="decimal-to-fraction",
            difficulty=config.difficulty,
        )

    def _gen_fraction_to_decimal(self, config: GeneratorConfig, num: int) -> Problem:
        """Convert fraction to decimal."""
        conversions = [
            ("1/2", Decimal("0.5")),
            ("1/4", Decimal("0.25")),
            ("3/4", Decimal("0.75")),
            ("1/5", Decimal("0.2")),
            ("2/5", Decimal("0.4")),
            ("3/5", Decimal("0.6")),
            ("4/5", Decimal("0.8")),
            ("1/10", Decimal("0.1")),
            ("3/10", Decimal("0.3")),
            ("7/10", Decimal("0.7")),
            ("9/10", Decimal("0.9")),
            ("1/8", Decimal("0.125")),
            ("3/8", Decimal("0.375")),
            ("5/8", Decimal("0.625")),
            ("7/8", Decimal("0.875")),
        ]

        # Filter by difficulty
        if config.difficulty == Difficulty.EASY:
            pool = conversions[:4]
        elif config.difficulty == Difficulty.MEDIUM:
            pool = conversions[:11]
        else:
            pool = conversions

        fraction, decimal_val = random.choice(pool)
        num, denom = map(int, fraction.split('/'))

        q_text = f"Convert {fraction} to a decimal"
        q_html = f"<span class='math-expression'>Convert {fraction} to a decimal</span>"
        a_text = self._format_decimal(decimal_val)

        hint = f"Divide the numerator by the denominator: {num} / {denom}"

        worked = None
        if config.include_worked_examples:
            worked = (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> Convert {fraction} to a decimal</p>"
                f"<p><strong>Step 1:</strong> Divide {num} by {denom}</p>"
                f"<p><strong>Step 2:</strong> {num} / {denom} = {a_text}</p>"
                f"</div>"
            )

        return Problem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=decimal_val,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="decimals",
            subtopic="fraction-to-decimal",
            difficulty=config.difficulty,
        )

    def _gen_percent_to_decimal(self, config: GeneratorConfig, num: int) -> Problem:
        """Convert percent to decimal."""
        if config.difficulty == Difficulty.EASY:
            percent = random.choice([10, 20, 25, 50, 75, 100])
        elif config.difficulty == Difficulty.MEDIUM:
            percent = random.choice([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90, 100])
        else:
            percent = random.randint(1, 150)

        decimal_val = Decimal(percent) / 100

        q_text = f"Convert {percent}% to a decimal"
        q_html = f"<span class='math-expression'>Convert {percent}% to a decimal</span>"
        a_text = self._format_decimal(decimal_val)

        hint = "Divide by 100: move the decimal point 2 places to the left."

        worked = None
        if config.include_worked_examples:
            worked = (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> Convert {percent}% to a decimal</p>"
                f"<p><strong>Step 1:</strong> Percent means 'per hundred'</p>"
                f"<p><strong>Step 2:</strong> {percent}% = {percent} / 100 = {a_text}</p>"
                f"</div>"
            )

        return Problem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=decimal_val,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="decimals",
            subtopic="percent-to-decimal",
            difficulty=config.difficulty,
        )

    def _gen_decimal_to_percent(self, config: GeneratorConfig, num: int) -> Problem:
        """Convert decimal to percent."""
        if config.difficulty == Difficulty.EASY:
            decimal_val = Decimal(random.choice([10, 20, 25, 50, 75, 100])) / 100
        elif config.difficulty == Difficulty.MEDIUM:
            decimal_val = Decimal(random.choice([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90, 100])) / 100
        else:
            decimal_val = Decimal(random.randint(1, 150)) / 100

        percent = int(decimal_val * 100)

        q_text = f"Convert {decimal_val} to a percent"
        q_html = f"<span class='math-expression'>Convert {decimal_val} to a percent</span>"
        a_text = f"{percent}%"

        hint = "Multiply by 100: move the decimal point 2 places to the right."

        worked = None
        if config.include_worked_examples:
            worked = (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> Convert {decimal_val} to a percent</p>"
                f"<p><strong>Step 1:</strong> Multiply by 100</p>"
                f"<p><strong>Step 2:</strong> {decimal_val} x 100 = {percent}%</p>"
                f"</div>"
            )

        return Problem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=percent,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="decimals",
            subtopic="decimal-to-percent",
            difficulty=config.difficulty,
        )

    # --- Percentage Calculations ---

    def _gen_percent_of_number(self, config: GeneratorConfig, num: int) -> Problem:
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

        answer = Decimal(number * percent) / 100
        # Normalize to remove trailing zeros
        answer = answer.normalize()

        q_text = f"What is {percent}% of {number}?"
        q_html = f"<span class='math-expression'>What is {percent}% of {number}?</span>"
        a_text = self._format_decimal(answer)

        decimal_equiv = Decimal(percent) / 100
        hint = f"Convert {percent}% to a decimal ({decimal_equiv}), then multiply by {number}."

        worked = None
        if config.include_worked_examples:
            worked = (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> What is {percent}% of {number}?</p>"
                f"<p><strong>Step 1:</strong> Convert {percent}% to decimal: {decimal_equiv}</p>"
                f"<p><strong>Step 2:</strong> Multiply: {decimal_equiv} x {number} = {a_text}</p>"
                f"</div>"
            )

        return Problem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="decimals",
            subtopic="percent-of-number",
            difficulty=config.difficulty,
        )

    def _gen_number_to_percent(self, config: GeneratorConfig, num: int) -> Problem:
        """What percent is X of Y?"""
        if config.difficulty == Difficulty.EASY:
            total = random.choice([10, 20, 50, 100])
            # Pick parts that give nice percentages
            nice_parts = [i for i in range(1, total + 1) if (i * 100 / total) % 5 == 0]
            part = random.choice(nice_parts) if nice_parts else random.randint(1, total)
        elif config.difficulty == Difficulty.MEDIUM:
            total = random.choice([20, 25, 40, 50, 80, 100])
            nice_parts = [i for i in range(1, total + 1) if (i * 100 / total) % 5 == 0]
            part = random.choice(nice_parts) if nice_parts else random.randint(1, total)
        else:
            total = random.choice([20, 25, 40, 50, 80, 100, 200])
            part = random.randint(1, total)

        percent = Decimal(part * 100) / total
        percent = percent.normalize()

        q_text = f"What percent is {part} of {total}?"
        q_html = f"<span class='math-expression'>What percent is {part} of {total}?</span>"
        a_text = f"{self._format_decimal(percent)}%"

        hint = f"Divide {part} by {total}, then multiply by 100."

        worked = None
        if config.include_worked_examples:
            fraction_decimal = Decimal(part) / Decimal(total)
            worked = (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> What percent is {part} of {total}?</p>"
                f"<p><strong>Step 1:</strong> Divide: {part} / {total} = {fraction_decimal}</p>"
                f"<p><strong>Step 2:</strong> Multiply by 100: {fraction_decimal} x 100 = {a_text}</p>"
                f"</div>"
            )

        return Problem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=percent,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="decimals",
            subtopic="number-to-percent",
            difficulty=config.difficulty,
        )

    def _gen_percent_increase(self, config: GeneratorConfig, num: int) -> Problem:
        """Calculate result after percent increase."""
        if config.difficulty == Difficulty.EASY:
            original = random.choice([10, 20, 50, 100])
            percent = random.choice([10, 20, 50, 100])
        elif config.difficulty == Difficulty.MEDIUM:
            original = random.choice([25, 40, 50, 80, 100, 200])
            percent = random.choice([5, 10, 15, 20, 25, 30, 50])
        else:
            original = random.choice([25, 40, 50, 80, 100, 150, 200, 250])
            percent = random.randint(5, 75)

        increase = Decimal(original * percent) / 100
        result = Decimal(original) + increase

        q_text = f"Increase {original} by {percent}%"
        q_html = f"<span class='math-expression'>Increase {original} by {percent}%</span>"
        a_text = self._format_decimal(result)

        hint = f"Find {percent}% of {original}, then add it to {original}."

        worked = None
        if config.include_worked_examples:
            worked = (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> Increase {original} by {percent}%</p>"
                f"<p><strong>Step 1:</strong> Find {percent}% of {original}: {self._format_decimal(increase)}</p>"
                f"<p><strong>Step 2:</strong> Add to original: {original} + {self._format_decimal(increase)} = {a_text}</p>"
                f"</div>"
            )

        return Problem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=result,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="decimals",
            subtopic="percent-increase",
            difficulty=config.difficulty,
        )

    def _gen_percent_decrease(self, config: GeneratorConfig, num: int) -> Problem:
        """Calculate result after percent decrease."""
        if config.difficulty == Difficulty.EASY:
            original = random.choice([10, 20, 50, 100])
            percent = random.choice([10, 20, 50])
        elif config.difficulty == Difficulty.MEDIUM:
            original = random.choice([25, 40, 50, 80, 100, 200])
            percent = random.choice([5, 10, 15, 20, 25, 30, 50])
        else:
            original = random.choice([25, 40, 50, 80, 100, 150, 200, 250])
            percent = random.randint(5, 75)

        decrease = Decimal(original * percent) / 100
        result = Decimal(original) - decrease

        q_text = f"Decrease {original} by {percent}%"
        q_html = f"<span class='math-expression'>Decrease {original} by {percent}%</span>"
        a_text = self._format_decimal(result)

        hint = f"Find {percent}% of {original}, then subtract it from {original}."

        worked = None
        if config.include_worked_examples:
            worked = (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> Decrease {original} by {percent}%</p>"
                f"<p><strong>Step 1:</strong> Find {percent}% of {original}: {self._format_decimal(decrease)}</p>"
                f"<p><strong>Step 2:</strong> Subtract from original: {original} - {self._format_decimal(decrease)} = {a_text}</p>"
                f"</div>"
            )

        return Problem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=result,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="decimals",
            subtopic="percent-decrease",
            difficulty=config.difficulty,
        )
