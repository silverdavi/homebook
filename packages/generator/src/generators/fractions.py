"""Fraction problem generator - the core module.

Uses Python's fractions.Fraction for exact arithmetic.
No floating point errors ever.
"""

import math
import random
import uuid
from fractions import Fraction
from typing import List, Tuple

from ..models import (
    Difficulty,
    DIFFICULTY_DENOMINATORS,
    FractionProblem,
    GeneratorConfig,
    Problem,
    WordProblemContext,
)
from ..math_explanations import explain_simplify, explain_lcd
from ..visualizations import create_addition_visual, create_fraction_bar
from ..llm_service import generate_word_problem_context
from .base import BaseGenerator


class FractionGenerator(BaseGenerator):
    """Generates fraction problems across all subtopics."""

    topic = "fractions"
    subtopics = [
        "add-same-denom",
        "subtract-same-denom",
        "add-unlike-denom",
        "subtract-unlike-denom",
        "equivalent-fractions",
        "simplify-to-lowest",
        "compare-fractions",
        "multiply-fractions",
        "divide-fractions",
        "mixed-to-improper",
        "improper-to-mixed",
        "multiply-by-whole",
        "divide-by-whole",
        "fraction-of-set",
        "ordering-fractions",
        "mixed-number-operations",
        "word-problems",
    ]

    def generate(self, config: GeneratorConfig) -> List[Problem]:
        """Generate fraction problems based on config.

        If word_problem_config is enabled and subtopic is NOT 'word-problems',
        a portion of problems will be converted to word problems based on
        word_problem_ratio.
        """
        dispatch = {
            "add-same-denom": self._gen_add_same_denom,
            "subtract-same-denom": self._gen_subtract_same_denom,
            "add-unlike-denom": self._gen_add_unlike_denom,
            "subtract-unlike-denom": self._gen_subtract_unlike_denom,
            "equivalent-fractions": self._gen_equivalent_fractions,
            "simplify-to-lowest": self._gen_simplify,
            "compare-fractions": self._gen_compare,
            "multiply-fractions": self._gen_multiply,
            "divide-fractions": self._gen_divide,
            "mixed-to-improper": self._gen_mixed_to_improper,
            "improper-to-mixed": self._gen_improper_to_mixed,
            "multiply-by-whole": self._gen_multiply_by_whole,
            "divide-by-whole": self._gen_divide_by_whole,
            "fraction-of-set": self._gen_fraction_of_set,
            "ordering-fractions": self._gen_ordering_fractions,
            "mixed-number-operations": self._gen_mixed_number_operations,
            "word-problems": self._gen_word_problem,
        }

        generator_fn = dispatch.get(config.subtopic)
        if generator_fn is None:
            raise ValueError(f"Unknown subtopic: {config.subtopic}")

        # Determine how many word problems to include
        word_problem_indices = set()
        if (
            config.word_problem_config
            and config.word_problem_config.enabled
            and config.subtopic != "word-problems"
            and config.subtopic in self._word_problem_compatible_subtopics()
        ):
            ratio = config.word_problem_config.word_problem_ratio
            num_word_problems = int(config.num_problems * ratio)
            # Distribute word problems throughout (not all at the end)
            if num_word_problems > 0:
                # Pick random positions for word problems
                all_positions = list(range(config.num_problems))
                word_problem_indices = set(random.sample(
                    all_positions,
                    min(num_word_problems, len(all_positions))
                ))

        problems: List[Problem] = []
        seen = set()

        attempts = 0
        max_attempts = config.num_problems * 20

        while len(problems) < config.num_problems and attempts < max_attempts:
            attempts += 1
            current_idx = len(problems)

            # Check if this position should be a word problem
            if current_idx in word_problem_indices:
                problem = self._generate_mixed_word_problem(config, current_idx + 1)
            else:
                problem = generator_fn(config, current_idx + 1)

            # Deduplicate by question text
            if problem.question_text not in seen:
                seen.add(problem.question_text)
                problems.append(problem)

        return problems

    def _word_problem_compatible_subtopics(self) -> List[str]:
        """Return subtopics that can be converted to word problems."""
        return [
            "add-same-denom",
            "subtract-same-denom",
            "add-unlike-denom",
            "subtract-unlike-denom",
            "multiply-fractions",
            "divide-fractions",
            "multiply-by-whole",
            "divide-by-whole",
        ]

    def _generate_mixed_word_problem(
        self, config: GeneratorConfig, num: int
    ) -> FractionProblem:
        """Generate a word problem version of the current subtopic.

        This creates a word problem that matches the mathematical operation
        of the configured subtopic.
        """
        # Map subtopic to operation
        subtopic_to_operation = {
            "add-same-denom": "add",
            "add-unlike-denom": "add",
            "subtract-same-denom": "subtract",
            "subtract-unlike-denom": "subtract",
            "multiply-fractions": "multiply",
            "divide-fractions": "divide",
        }

        operation = subtopic_to_operation.get(config.subtopic, "add")

        # Generate the underlying math problem
        if operation == "add":
            problem_data = self._create_addition_problem(config)
        elif operation == "subtract":
            problem_data = self._create_subtraction_problem(config)
        elif operation == "multiply":
            problem_data = self._create_multiplication_problem(config)
        else:
            problem_data = self._create_division_problem(config)

        # Get context type from config or use random
        context_type = None
        if config.word_problem_config and config.word_problem_config.context_type != "mixed":
            context_type = config.word_problem_config.context_type

        # Get LLM to wrap in word problem context
        word_context = None
        try:
            llm_result = generate_word_problem_context(
                operation=operation,
                fractions=problem_data["fractions"],
                answer=problem_data["answer_text"],
                grade_level=config.grade_level,
                context_type=context_type,
            )

            word_context = WordProblemContext(
                story=llm_result.get("problem_text", ""),
                question=llm_result.get("question", ""),
                context_type=llm_result.get("context_type", ""),
            )

            q_html = (
                f"<div class='word-problem'>"
                f"<p class='word-problem-story'>{word_context.story}</p>"
                f"<p class='word-problem-question'><strong>{word_context.question}</strong></p>"
                f"</div>"
            )
            q_text = f"{word_context.story} {word_context.question}"
            is_word_problem = True

        except Exception as e:
            # Never silently fall back - raise the error so we can fix it
            raise RuntimeError(
                f"Word problem generation failed for {operation} problem: {e}. "
                f"Check LLM service configuration and API key."
            ) from e

        # Create word problem-specific hint
        math_hint = problem_data.get("hint", "")
        if is_word_problem:
            hint = (
                f"First, identify the fractions: {', '.join(problem_data['fractions'])}. "
                f"This is {'an addition' if operation == 'add' else 'a ' + operation} problem. "
                f"{math_hint}"
            )
        else:
            hint = math_hint

        # Create worked solution
        worked = None
        if config.include_worked_examples:
            if is_word_problem:
                worked = (
                    f"Step 1: Read the problem and identify the fractions: {', '.join(problem_data['fractions'])}\n"
                    f"Step 2: Determine the operation - this is {'an addition' if operation == 'add' else 'a ' + operation} problem\n"
                    f"Step 3: Set up the equation: {problem_data['question_text']}\n"
                    f"{problem_data.get('worked_solution', '')}"
                )
            else:
                worked = problem_data.get("worked_solution")

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=problem_data["answer"],
            answer_text=problem_data["answer_text"],
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            visual_svg=problem_data.get("visual_svg"),
            topic="fractions",
            subtopic=config.subtopic,
            difficulty=config.difficulty,
            lcd=problem_data.get("lcd"),
            is_word_problem=is_word_problem,
            word_problem_context=word_context,
            metadata={"operation": operation, "context_type": word_context.context_type if word_context else ""},
        )

    # --- Denominator helpers ---

    def _get_denoms(self, config: GeneratorConfig) -> List[int]:
        """Get the denominator pool for the difficulty level."""
        difficulty = config.difficulty
        if difficulty == Difficulty.MIXED:
            difficulty = random.choice([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD])
        pool = DIFFICULTY_DENOMINATORS[difficulty]
        return [d for d in pool if d <= config.max_denominator]

    def _rand_denom(self, config: GeneratorConfig) -> int:
        """Pick a random denominator from the pool."""
        return random.choice(self._get_denoms(config))

    def _rand_numerator(self, denom: int, allow_improper: bool = False) -> int:
        """Pick a random numerator. Always >= 1."""
        if allow_improper:
            return random.randint(1, denom * 2)
        return random.randint(1, denom - 1)

    def _make_id(self) -> str:
        return uuid.uuid4().hex[:12]

    def _format_fraction(self, f: Fraction) -> str:
        """Format a Fraction as a string like '3/4'."""
        if f.denominator == 1:
            return str(f.numerator)
        return f"{f.numerator}/{f.denominator}"

    def _format_fraction_html(self, f: Fraction) -> str:
        """Format a Fraction as an HTML fraction."""
        if f.denominator == 1:
            return f"<span class='whole'>{f.numerator}</span>"
        return (
            f"<span class='frac'>"
            f"<sup>{f.numerator}</sup>"
            f"<span class='bar'>/</span>"
            f"<sub>{f.denominator}</sub>"
            f"</span>"
        )

    def _format_mixed_html(self, f: Fraction) -> str:
        """Format an improper fraction as a mixed number in HTML."""
        if abs(f) < 1 or f.denominator == 1:
            return self._format_fraction_html(f)
        whole = int(f.numerator // f.denominator)
        remainder = abs(f.numerator) % f.denominator
        if remainder == 0:
            return f"<span class='whole'>{whole}</span>"
        rem_frac = Fraction(remainder, f.denominator)
        return (
            f"<span class='mixed'>"
            f"<span class='whole'>{whole}</span>"
            f"{self._format_fraction_html(rem_frac)}"
            f"</span>"
        )

    # --- Generators ---

    def _gen_add_same_denom(self, config: GeneratorConfig, num: int) -> FractionProblem:
        denom = self._rand_denom(config)
        n1 = self._rand_numerator(denom)
        n2 = self._rand_numerator(denom)
        # Ensure sum doesn't exceed denom (proper fraction result) unless improper allowed
        if not config.allow_improper and n1 + n2 >= denom:
            n2 = random.randint(1, max(1, denom - n1 - 1))

        frac1 = Fraction(n1, denom)
        frac2 = Fraction(n2, denom)
        answer = frac1 + frac2

        q_text = f"{n1}/{denom} + {n2}/{denom}"
        q_html = f"{self._format_fraction_html(frac1)} + {self._format_fraction_html(frac2)}"
        a_text = self._format_fraction(answer)

        hint = f"The denominators are the same ({denom}), so just add the numerators: {n1} + {n2} = {n1 + n2}"

        svg = None
        if config.include_visuals:
            svg = create_addition_visual(frac1, frac2)

        worked = None
        if config.include_worked_examples:
            worked = (
                f"Step 1: Both fractions have denominator {denom}.\n"
                f"Step 2: Add numerators: {n1} + {n2} = {n1 + n2}\n"
                f"Step 3: Keep denominator: {n1 + n2}/{denom}"
            )
            if answer != Fraction(n1 + n2, denom):
                worked += f"\nStep 4: Simplify: {self._format_fraction(answer)}"

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            visual_svg=svg,
            topic="fractions",
            subtopic="add-same-denom",
            difficulty=config.difficulty,
            lcd=denom,
        )

    def _gen_subtract_same_denom(self, config: GeneratorConfig, num: int) -> FractionProblem:
        denom = self._rand_denom(config)
        n1 = self._rand_numerator(denom)
        n2 = random.randint(1, max(1, n1 - 1))  # ensure positive result

        frac1 = Fraction(n1, denom)
        frac2 = Fraction(n2, denom)
        answer = frac1 - frac2

        q_text = f"{n1}/{denom} - {n2}/{denom}"
        q_html = f"{self._format_fraction_html(frac1)} − {self._format_fraction_html(frac2)}"
        a_text = self._format_fraction(answer)

        hint = f"The denominators are the same ({denom}), so subtract the numerators: {n1} − {n2} = {n1 - n2}"

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            topic="fractions",
            subtopic="subtract-same-denom",
            difficulty=config.difficulty,
            lcd=denom,
        )

    def _gen_add_unlike_denom(self, config: GeneratorConfig, num: int) -> FractionProblem:
        denoms = self._get_denoms(config)
        d1, d2 = random.sample(denoms, 2)  # guaranteed different denoms
        n1 = self._rand_numerator(d1)
        n2 = self._rand_numerator(d2)

        frac1 = Fraction(n1, d1)
        frac2 = Fraction(n2, d2)
        answer = frac1 + frac2

        lcd = math.lcm(d1, d2)

        # Equivalent fractions with LCD
        eq1_num = n1 * (lcd // d1)
        eq2_num = n2 * (lcd // d2)

        q_text = f"{n1}/{d1} + {n2}/{d2}"
        q_html = f"{self._format_fraction_html(frac1)} + {self._format_fraction_html(frac2)}"
        a_text = self._format_fraction(answer)

        hint = f"Find the LCD of {d1} and {d2}, which is {lcd}."

        svg = None
        if config.include_visuals:
            svg = create_addition_visual(frac1, frac2)

        worked = None
        if config.include_worked_examples:
            worked = (
                f"Step 1: Find LCD of {d1} and {d2}: LCD = {lcd}\n"
                f"Step 2: Convert {n1}/{d1} = {eq1_num}/{lcd}\n"
                f"Step 3: Convert {n2}/{d2} = {eq2_num}/{lcd}\n"
                f"Step 4: Add: {eq1_num}/{lcd} + {eq2_num}/{lcd} = {eq1_num + eq2_num}/{lcd}"
            )
            unsimplified = Fraction(eq1_num + eq2_num, lcd)
            if answer != unsimplified:
                worked += f"\nStep 5: Simplify: {self._format_fraction(answer)}"

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            visual_svg=svg,
            topic="fractions",
            subtopic="add-unlike-denom",
            difficulty=config.difficulty,
            lcd=lcd,
            equivalent_fractions={
                f"{n1}/{d1}": f"{eq1_num}/{lcd}",
                f"{n2}/{d2}": f"{eq2_num}/{lcd}",
            },
        )

    def _gen_subtract_unlike_denom(self, config: GeneratorConfig, num: int) -> FractionProblem:
        denoms = self._get_denoms(config)
        d1, d2 = random.sample(denoms, 2)

        frac1_candidate = Fraction(self._rand_numerator(d1), d1)
        frac2_candidate = Fraction(self._rand_numerator(d2), d2)

        # Ensure frac1 > frac2 for positive result
        if frac1_candidate < frac2_candidate:
            frac1_candidate, frac2_candidate = frac2_candidate, frac1_candidate

        frac1 = frac1_candidate
        frac2 = frac2_candidate
        answer = frac1 - frac2

        n1, d1 = frac1.numerator, frac1.denominator
        n2, d2 = frac2.numerator, frac2.denominator
        lcd = math.lcm(d1, d2)
        eq1_num = n1 * (lcd // d1)
        eq2_num = n2 * (lcd // d2)

        q_text = f"{n1}/{d1} - {n2}/{d2}"
        q_html = f"{self._format_fraction_html(frac1)} − {self._format_fraction_html(frac2)}"
        a_text = self._format_fraction(answer)

        hint = f"Find the LCD of {d1} and {d2}, which is {lcd}."

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            topic="fractions",
            subtopic="subtract-unlike-denom",
            difficulty=config.difficulty,
            lcd=lcd,
            equivalent_fractions={
                f"{n1}/{d1}": f"{eq1_num}/{lcd}",
                f"{n2}/{d2}": f"{eq2_num}/{lcd}",
            },
        )

    def _gen_equivalent_fractions(self, config: GeneratorConfig, num: int) -> FractionProblem:
        denom = self._rand_denom(config)
        numer = self._rand_numerator(denom)
        base = Fraction(numer, denom)

        # Use simplified denominator so the multiplier applies cleanly
        multiplier = random.randint(2, 4)
        target_denom = base.denominator * multiplier
        answer_num = base.numerator * multiplier

        q_text = f"{base.numerator}/{base.denominator} = ?/{target_denom}"
        q_html = (
            f"{self._format_fraction_html(base)} = "
            f"<span class='frac'><sup>?</sup><span class='bar'>/</span>"
            f"<sub>{target_denom}</sub></span>"
        )

        answer = Fraction(answer_num, target_denom)
        a_text = f"{answer_num}/{target_denom}"

        hint = f"Multiply both numerator and denominator by {multiplier}."

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            topic="fractions",
            subtopic="equivalent-fractions",
            difficulty=config.difficulty,
        )

    def _gen_simplify(self, config: GeneratorConfig, num: int) -> FractionProblem:
        # Generate a simplified fraction, then scale it up
        denom = self._rand_denom(config)
        numer = self._rand_numerator(denom)
        simplified = Fraction(numer, denom)  # auto-simplifies

        # Scale up by a random factor to create the unsimplified version
        factor = random.randint(2, 5)
        unsimplified_num = simplified.numerator * factor
        unsimplified_den = simplified.denominator * factor

        gcf = math.gcd(unsimplified_num, unsimplified_den)

        q_text = f"Simplify {unsimplified_num}/{unsimplified_den}"
        q_html = f"Simplify {self._format_fraction_html(Fraction(unsimplified_num, unsimplified_den))}"
        a_text = self._format_fraction(simplified)

        hint = f"Find the GCF of {unsimplified_num} and {unsimplified_den}, which is {gcf}."

        worked = None
        if config.include_worked_examples:
            worked = explain_simplify(unsimplified_num, unsimplified_den)

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=simplified,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="fractions",
            subtopic="simplify-to-lowest",
            difficulty=config.difficulty,
            gcf=gcf,
        )

    def _gen_compare(self, config: GeneratorConfig, num: int) -> FractionProblem:
        denoms = self._get_denoms(config)
        d1, d2 = random.sample(denoms, 2)
        n1 = self._rand_numerator(d1)
        n2 = self._rand_numerator(d2)

        frac1 = Fraction(n1, d1)
        frac2 = Fraction(n2, d2)

        # Avoid equal fractions
        if frac1 == frac2:
            n2 = max(1, n2 - 1) if n2 > 1 else n2 + 1
            frac2 = Fraction(n2, d2)

        if frac1 > frac2:
            symbol = ">"
        elif frac1 < frac2:
            symbol = "<"
        else:
            symbol = "="

        q_text = f"Compare {n1}/{d1} ○ {n2}/{d2}"
        q_html = (
            f"{self._format_fraction_html(frac1)} "
            f"<span class='compare-circle'>○</span> "
            f"{self._format_fraction_html(frac2)}"
        )
        a_text = symbol

        lcd = math.lcm(d1, d2)
        hint = f"Convert to LCD ({lcd}): {n1 * (lcd // d1)}/{lcd} and {n2 * (lcd // d2)}/{lcd}"

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=symbol,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            topic="fractions",
            subtopic="compare-fractions",
            difficulty=config.difficulty,
            lcd=lcd,
        )

    def _gen_multiply(self, config: GeneratorConfig, num: int) -> FractionProblem:
        d1 = self._rand_denom(config)
        d2 = self._rand_denom(config)
        n1 = self._rand_numerator(d1)
        n2 = self._rand_numerator(d2)

        frac1 = Fraction(n1, d1)
        frac2 = Fraction(n2, d2)
        answer = frac1 * frac2

        q_text = f"{n1}/{d1} × {n2}/{d2}"
        q_html = f"{self._format_fraction_html(frac1)} × {self._format_fraction_html(frac2)}"
        a_text = self._format_fraction(answer)

        hint = f"Multiply numerators: {n1} × {n2} = {n1 * n2}. Multiply denominators: {d1} × {d2} = {d1 * d2}."

        worked = None
        if config.include_worked_examples:
            raw = Fraction(n1 * n2, d1 * d2)
            worked = (
                f"Step 1: Multiply numerators: {n1} × {n2} = {n1 * n2}\n"
                f"Step 2: Multiply denominators: {d1} × {d2} = {d1 * d2}\n"
                f"Step 3: Result: {n1 * n2}/{d1 * d2}"
            )
            if answer != raw:
                worked += f"\nStep 4: Simplify: {self._format_fraction(answer)}"

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="fractions",
            subtopic="multiply-fractions",
            difficulty=config.difficulty,
        )

    def _gen_divide(self, config: GeneratorConfig, num: int) -> FractionProblem:
        d1 = self._rand_denom(config)
        d2 = self._rand_denom(config)
        n1 = self._rand_numerator(d1)
        n2 = self._rand_numerator(d2)

        frac1 = Fraction(n1, d1)
        frac2 = Fraction(n2, d2)
        answer = frac1 / frac2

        q_text = f"{n1}/{d1} ÷ {n2}/{d2}"
        q_html = f"{self._format_fraction_html(frac1)} ÷ {self._format_fraction_html(frac2)}"
        a_text = self._format_fraction(answer)

        hint = f"Keep {n1}/{d1}, change ÷ to ×, flip {n2}/{d2} to {d2}/{n2}."

        worked = None
        if config.include_worked_examples:
            worked = (
                f"Step 1: Keep the first fraction: {n1}/{d1}\n"
                f"Step 2: Change ÷ to ×\n"
                f"Step 3: Flip the second fraction: {d2}/{n2}\n"
                f"Step 4: Multiply: {n1}/{d1} × {d2}/{n2} = {n1 * d2}/{d1 * n2}\n"
                f"Step 5: Simplify: {self._format_fraction(answer)}"
            )

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="fractions",
            subtopic="divide-fractions",
            difficulty=config.difficulty,
        )

    def _gen_mixed_to_improper(self, config: GeneratorConfig, num: int) -> FractionProblem:
        denom = self._rand_denom(config)
        whole = random.randint(1, 5)
        numer = self._rand_numerator(denom)

        improper_num = whole * denom + numer
        answer = Fraction(improper_num, denom)

        q_text = f"Convert {whole} {numer}/{denom} to an improper fraction"
        mixed_html = self._format_mixed_html(answer)
        q_html = f"Convert {mixed_html} to an improper fraction"
        a_text = f"{improper_num}/{denom}"

        hint = f"Multiply whole ({whole}) × denominator ({denom}) = {whole * denom}, then add numerator ({numer}) = {improper_num}."

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            topic="fractions",
            subtopic="mixed-to-improper",
            difficulty=config.difficulty,
        )

    def _gen_improper_to_mixed(self, config: GeneratorConfig, num: int) -> FractionProblem:
        denom = self._rand_denom(config)
        whole = random.randint(1, 5)
        remainder = random.randint(1, denom - 1)
        improper_num = whole * denom + remainder

        answer = Fraction(improper_num, denom)

        q_text = f"Convert {improper_num}/{denom} to a mixed number"
        q_html = f"Convert {self._format_fraction_html(Fraction(improper_num, denom))} to a mixed number"
        a_text = f"{whole} {remainder}/{denom}"

        hint = f"Divide {improper_num} ÷ {denom} = {whole} remainder {remainder}."

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            topic="fractions",
            subtopic="improper-to-mixed",
            difficulty=config.difficulty,
            metadata={"whole": whole, "remainder": remainder},
        )

    def _gen_multiply_by_whole(self, config: GeneratorConfig, num: int) -> FractionProblem:
        """Multiply a fraction by a whole number: 3 × 2/5 = 6/5 (Grade 4)."""
        difficulty = config.difficulty
        if difficulty == Difficulty.MIXED:
            difficulty = random.choice([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD])

        if difficulty == Difficulty.EASY:
            whole = random.randint(2, 4)
            denoms = [2, 3, 4, 5]
        elif difficulty == Difficulty.MEDIUM:
            whole = random.randint(2, 8)
            denoms = [2, 3, 4, 5, 6, 8]
        else:
            whole = random.randint(2, 12)
            denoms = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]

        denom = random.choice([d for d in denoms if d <= config.max_denominator])
        numer = self._rand_numerator(denom)

        frac = Fraction(numer, denom)
        whole_frac = Fraction(whole)
        answer = whole_frac * frac

        q_text = f"{whole} × {numer}/{denom}"
        q_html = (
            f"<span class='whole'>{whole}</span> × "
            f"{self._format_fraction_html(frac)}"
        )
        a_text = self._format_fraction(answer)

        hint = (
            f"Multiply the numerator by the whole number, keep the denominator: "
            f"{whole} × {numer} = {whole * numer}, denominator stays {denom}"
        )

        svg = None
        if config.include_visuals:
            svg = create_fraction_bar(frac)

        worked = None
        if config.include_worked_examples:
            raw_num = whole * numer
            worked = (
                f"Step 1: Multiply the whole number by the numerator: {whole} × {numer} = {raw_num}\n"
                f"Step 2: Keep the denominator: {raw_num}/{denom}"
            )
            unsimplified = Fraction(raw_num, denom)
            if answer != unsimplified:
                worked += f"\nStep 3: Simplify: {self._format_fraction(answer)}"

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            visual_svg=svg,
            topic="fractions",
            subtopic="multiply-by-whole",
            difficulty=config.difficulty,
            metadata={"whole_number": whole},
        )

    def _gen_divide_by_whole(self, config: GeneratorConfig, num: int) -> FractionProblem:
        """Divide a fraction by a whole number: 3/4 ÷ 2 = 3/8 (Grade 5)."""
        difficulty = config.difficulty
        if difficulty == Difficulty.MIXED:
            difficulty = random.choice([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD])

        if difficulty == Difficulty.EASY:
            whole_choices = [2, 3, 4]
            denoms = [2, 3, 4, 5]
        elif difficulty == Difficulty.MEDIUM:
            whole_choices = [2, 3, 4, 5, 6]
            denoms = [2, 3, 4, 5, 6, 8]
        else:
            whole_choices = list(range(2, 11))
            denoms = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]

        denom = random.choice([d for d in denoms if d <= config.max_denominator])
        numer = self._rand_numerator(denom)

        # For easy difficulty, try to pick a whole number that divides the numerator evenly
        if difficulty == Difficulty.EASY:
            divisors = [w for w in whole_choices if numer % w == 0]
            if divisors:
                whole = random.choice(divisors)
            else:
                whole = random.choice(whole_choices)
        else:
            whole = random.choice(whole_choices)

        frac = Fraction(numer, denom)
        whole_frac = Fraction(whole)
        answer = frac / whole_frac  # n/d ÷ w = n/(d*w)

        q_text = f"{numer}/{denom} ÷ {whole}"
        q_html = (
            f"{self._format_fraction_html(frac)} ÷ "
            f"<span class='whole'>{whole}</span>"
        )
        a_text = self._format_fraction(answer)

        hint = (
            f"Multiply the denominator by the whole number: "
            f"{denom} × {whole} = {denom * whole}. "
            f"Alternative: Keep, Change, Flip: {numer}/{denom} ÷ {whole} = {numer}/{denom} × 1/{whole}"
        )

        worked = None
        if config.include_worked_examples:
            new_denom = denom * whole
            worked = (
                f"Step 1: Rewrite as multiplication by the reciprocal: "
                f"{numer}/{denom} × 1/{whole}\n"
                f"Step 2: Multiply: {numer}/{denom} × 1/{whole} = {numer}/{new_denom}"
            )
            unsimplified = Fraction(numer, new_denom)
            if answer != unsimplified:
                worked += f"\nStep 3: Simplify: {self._format_fraction(answer)}"

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="fractions",
            subtopic="divide-by-whole",
            difficulty=config.difficulty,
            metadata={"whole_number": whole},
        )

    def _gen_fraction_of_set(self, config: GeneratorConfig, num: int) -> FractionProblem:
        """Find a fraction of a group: What is 1/4 of 12? → 3 (Grade 3-4)."""
        difficulty = config.difficulty
        if difficulty == Difficulty.MIXED:
            difficulty = random.choice([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD])

        if difficulty == Difficulty.EASY:
            # Unit fractions of small sets
            denom = random.choice([2, 3, 4])
            numer = 1
            # Pick a set size that divides evenly
            multiplier = random.choice([2, 3, 4, 5])
            set_size = denom * multiplier
        elif difficulty == Difficulty.MEDIUM:
            # Non-unit fractions of sets that divide evenly
            denom = random.choice([2, 3, 4, 5, 6])
            numer = random.randint(1, denom - 1)
            multiplier = random.choice([2, 3, 4, 5, 6])
            set_size = denom * multiplier
        else:
            # Larger fractions and sets
            denom = random.choice([3, 4, 5, 6, 8, 10])
            numer = random.randint(1, denom - 1)
            multiplier = random.choice([3, 4, 5, 6, 7, 8])
            set_size = denom * multiplier

        frac = Fraction(numer, denom)
        answer_value = frac * set_size
        answer = Fraction(int(answer_value), 1)

        q_text = f"What is {numer}/{denom} of {set_size}?"
        q_html = (
            f"What is {self._format_fraction_html(Fraction(numer, denom))} "
            f"of <span class='whole'>{set_size}</span>?"
        )
        a_text = str(int(answer_value))

        hint = (
            f"Divide the set by the denominator, then multiply by the numerator: "
            f"{set_size} ÷ {denom} = {set_size // denom}, "
            f"then {set_size // denom} × {numer} = {int(answer_value)}"
        )

        worked = None
        if config.include_worked_examples:
            per_part = set_size // denom
            worked = (
                f"Step 1: Divide the set into {denom} equal parts: {set_size} ÷ {denom} = {per_part}\n"
                f"Step 2: Take {numer} of those parts: {per_part} × {numer} = {int(answer_value)}\n"
                f"Step 3: {numer}/{denom} of {set_size} = {int(answer_value)}"
            )

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="fractions",
            subtopic="fraction-of-set",
            difficulty=config.difficulty,
            metadata={"set_size": set_size, "fraction": f"{numer}/{denom}"},
        )

    def _gen_ordering_fractions(self, config: GeneratorConfig, num: int) -> FractionProblem:
        """Order 3-4 fractions from least to greatest (Grade 3-4)."""
        difficulty = config.difficulty
        if difficulty == Difficulty.MIXED:
            difficulty = random.choice([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD])

        direction = random.choice(["least to greatest", "greatest to least"])

        if difficulty == Difficulty.EASY:
            # Same denominator, 3 fractions
            denom = self._rand_denom(config)
            count = 3
            numerators = random.sample(range(1, denom), min(count, denom - 1))
            fractions = [Fraction(n, denom) for n in numerators]
        elif difficulty == Difficulty.MEDIUM:
            # Different denominators, 3 fractions
            denoms = self._get_denoms(config)
            count = 3
            fractions = []
            seen_values = set()
            attempts = 0
            while len(fractions) < count and attempts < 50:
                attempts += 1
                d = random.choice(denoms)
                n = self._rand_numerator(d)
                f = Fraction(n, d)
                if f not in seen_values:
                    seen_values.add(f)
                    fractions.append(f)
        else:
            # Different denominators, 4 fractions, including mixed numbers
            denoms = self._get_denoms(config)
            count = 4
            fractions = []
            seen_values = set()
            attempts = 0
            while len(fractions) < count and attempts < 50:
                attempts += 1
                d = random.choice(denoms)
                # Occasionally include a mixed number (improper fraction)
                if len(fractions) < 2:
                    n = self._rand_numerator(d, allow_improper=True)
                else:
                    n = self._rand_numerator(d)
                f = Fraction(n, d)
                if f not in seen_values:
                    seen_values.add(f)
                    fractions.append(f)

        # Ensure we have enough fractions
        while len(fractions) < 3:
            fractions.append(Fraction(1, 2))

        # Shuffled order for the question
        shuffled = fractions[:]
        random.shuffle(shuffled)

        # Build the sorted answer
        sorted_fracs = sorted(shuffled)
        if direction == "greatest to least":
            sorted_fracs = list(reversed(sorted_fracs))

        separator = " < " if direction == "least to greatest" else " > "

        # Format question
        frac_strs = [self._format_fraction(f) for f in shuffled]
        q_text = f"Order {', '.join(frac_strs)} from {direction}"
        q_html = (
            f"Order {', '.join(self._format_fraction_html(f) for f in shuffled)} "
            f"from {direction}"
        )

        # Format answer
        answer_strs = [self._format_fraction(f) for f in sorted_fracs]
        a_text = separator.join(answer_strs)

        # Find LCD for hint
        all_denoms = [f.denominator for f in shuffled]
        lcd = all_denoms[0]
        for d in all_denoms[1:]:
            lcd = math.lcm(lcd, d)

        hint = f"Convert all fractions to the same denominator to compare. The LCD is {lcd}."

        worked = None
        if config.include_worked_examples:
            steps = [f"Step 1: Find the LCD of all denominators: LCD = {lcd}"]
            for i, f in enumerate(shuffled, 1):
                eq_num = f.numerator * (lcd // f.denominator)
                steps.append(
                    f"Step 2.{i}: Convert {self._format_fraction(f)} = {eq_num}/{lcd}"
                )
            eq_nums_sorted = sorted(
                [(f.numerator * (lcd // f.denominator), f) for f in shuffled],
                key=lambda x: x[0],
                reverse=(direction == "greatest to least"),
            )
            ordered_strs = [self._format_fraction(f) for _, f in eq_nums_sorted]
            steps.append(f"Step 3: Order: {separator.join(ordered_strs)}")
            worked = "\n".join(steps)

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=a_text,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="fractions",
            subtopic="ordering-fractions",
            difficulty=config.difficulty,
            lcd=lcd,
            metadata={"direction": direction, "count": len(shuffled)},
        )

    def _gen_mixed_number_operations(self, config: GeneratorConfig, num: int) -> FractionProblem:
        """Add or subtract mixed numbers: 2 1/3 + 1 2/3 = 4 (Grade 5-6)."""
        difficulty = config.difficulty
        if difficulty == Difficulty.MIXED:
            difficulty = random.choice([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD])

        operation = random.choice(["add", "subtract"])

        if difficulty == Difficulty.EASY:
            # Same denominators, no borrowing
            denom = random.choice([d for d in [2, 3, 4, 5, 6] if d <= config.max_denominator])
            w1 = random.randint(1, 5)
            w2 = random.randint(1, 3)
            n1 = random.randint(1, denom - 1)
            n2 = random.randint(1, denom - 1)
            d1 = d2 = denom
            # For subtraction, ensure no borrowing needed
            if operation == "subtract":
                if w1 < w2 or (w1 == w2 and n1 < n2):
                    w1, w2 = w2, w1
                    n1, n2 = n2, n1
                if w1 == w2 and n1 <= n2:
                    n1 = max(n1, n2 + 1) if n2 + 1 < denom else n2
                    w1 = max(w1, w2 + 1)
                # Ensure fraction part doesn't require borrowing
                if n1 < n2:
                    n1, n2 = n2, n1
        elif difficulty == Difficulty.MEDIUM:
            # Different denominators
            denoms = [d for d in self._get_denoms(config) if d <= config.max_denominator]
            d1, d2 = random.sample(denoms, 2) if len(denoms) >= 2 else (denoms[0], denoms[0])
            w1 = random.randint(1, 6)
            w2 = random.randint(1, 4)
            n1 = random.randint(1, d1 - 1)
            n2 = random.randint(1, d2 - 1)
            if operation == "subtract":
                # Ensure first mixed number > second
                mixed1 = Fraction(w1 * d1 + n1, d1)
                mixed2 = Fraction(w2 * d2 + n2, d2)
                if mixed1 < mixed2:
                    w1, w2 = w2, w1
                    n1, n2 = n2, n1
                    d1, d2 = d2, d1
        else:
            # Requires borrowing in subtraction
            denoms = [d for d in self._get_denoms(config) if d <= config.max_denominator]
            d1, d2 = random.sample(denoms, 2) if len(denoms) >= 2 else (denoms[0], denoms[0])
            w1 = random.randint(2, 8)
            w2 = random.randint(1, max(1, w1 - 1))
            n1 = random.randint(1, d1 - 1)
            n2 = random.randint(1, d2 - 1)
            if operation == "subtract":
                # For hard: try to force borrowing by making frac1 < frac2
                frac_part1 = Fraction(n1, d1)
                frac_part2 = Fraction(n2, d2)
                if frac_part1 >= frac_part2:
                    n1, n2 = n2, n1
                    d1, d2 = d2, d1
                # Ensure overall result is positive
                mixed1 = Fraction(w1 * d1 + n1, d1)
                mixed2 = Fraction(w2 * d2 + n2, d2)
                if mixed1 < mixed2:
                    w1, w2 = w2, w1
                    n1, n2 = n2, n1
                    d1, d2 = d2, d1

        # Build the mixed numbers as improper fractions for exact arithmetic
        improper1 = Fraction(w1 * d1 + n1, d1)
        improper2 = Fraction(w2 * d2 + n2, d2)

        if operation == "add":
            answer = improper1 + improper2
            op_symbol = "+"
            op_html = "+"
        else:
            answer = improper1 - improper2
            op_symbol = "-"
            op_html = "−"

        # Format mixed numbers for display
        def _fmt_mixed_text(w: int, n: int, d: int) -> str:
            return f"{w} {n}/{d}"

        q_text = f"{_fmt_mixed_text(w1, n1, d1)} {op_symbol} {_fmt_mixed_text(w2, n2, d2)}"

        mixed1_html = self._format_mixed_html(improper1)
        mixed2_html = self._format_mixed_html(improper2)
        q_html = f"{mixed1_html} {op_html} {mixed2_html}"

        # Format the answer - could be whole, proper, or mixed
        if answer.denominator == 1:
            a_text = str(answer.numerator)
        elif abs(answer.numerator) > answer.denominator:
            whole_part = int(answer.numerator // answer.denominator)
            rem = abs(answer.numerator) % answer.denominator
            if rem == 0:
                a_text = str(whole_part)
            else:
                a_text = f"{whole_part} {rem}/{answer.denominator}"
        else:
            a_text = self._format_fraction(answer)

        lcd = math.lcm(d1, d2)

        hint_parts = []
        if operation == "add":
            hint_parts.append(f"Add the whole numbers: {w1} + {w2} = {w1 + w2}")
            if d1 == d2:
                hint_parts.append(f"Add the fractions: {n1}/{d1} + {n2}/{d2} = {n1 + n2}/{d1}")
            else:
                hint_parts.append(f"Find LCD ({lcd}) and add the fractions")
        else:
            hint_parts.append(f"Subtract the whole numbers: {w1} - {w2} = {w1 - w2}")
            if d1 == d2:
                if n1 >= n2:
                    hint_parts.append(f"Subtract the fractions: {n1}/{d1} - {n2}/{d2}")
                else:
                    hint_parts.append(f"Borrow 1 from the whole number to subtract the fractions")
            else:
                hint_parts.append(f"Find LCD ({lcd}), then subtract the fractions")

        hint = ". ".join(hint_parts)

        worked = None
        if config.include_worked_examples:
            steps = []
            steps.append(f"Step 1: Convert to improper fractions: {self._format_fraction(improper1)} and {self._format_fraction(improper2)}")
            if d1 != d2:
                eq1_num = improper1.numerator * (lcd // d1)
                eq2_num = improper2.numerator * (lcd // d2)
                steps.append(f"Step 2: Find LCD = {lcd}")
                steps.append(f"Step 3: Convert: {eq1_num}/{lcd} and {eq2_num}/{lcd}")
                if operation == "add":
                    steps.append(f"Step 4: Add: {eq1_num}/{lcd} + {eq2_num}/{lcd} = {eq1_num + eq2_num}/{lcd}")
                else:
                    steps.append(f"Step 4: Subtract: {eq1_num}/{lcd} - {eq2_num}/{lcd} = {eq1_num - eq2_num}/{lcd}")
            else:
                imp_n1 = w1 * d1 + n1
                imp_n2 = w2 * d2 + n2
                if operation == "add":
                    steps.append(f"Step 2: Add: {imp_n1}/{d1} + {imp_n2}/{d2} = {imp_n1 + imp_n2}/{d1}")
                else:
                    steps.append(f"Step 2: Subtract: {imp_n1}/{d1} - {imp_n2}/{d2} = {imp_n1 - imp_n2}/{d1}")
            steps.append(f"Step {'5' if d1 != d2 else '3'}: Simplify to get: {a_text}")
            worked = "\n".join(steps)

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=answer,
            answer_text=a_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            topic="fractions",
            subtopic="mixed-number-operations",
            difficulty=config.difficulty,
            lcd=lcd,
            metadata={"operation": operation, "borrowing_required": operation == "subtract" and Fraction(n1, d1) < Fraction(n2, d2)},
        )

    def _gen_word_problem(self, config: GeneratorConfig, num: int) -> FractionProblem:
        """
        Generate a word problem by:
        1. Creating a deterministic math problem (add, subtract, multiply, divide)
        2. Using LLM to wrap it in an engaging story context
        """
        # Choose an operation randomly (weighted towards add/subtract for lower grades)
        grade = config.grade_level
        if grade <= 4:
            # Grades 3-4: focus on addition and subtraction
            operations = ["add", "add", "subtract", "subtract"]
        elif grade <= 6:
            # Grades 5-6: include multiply and divide
            operations = ["add", "subtract", "multiply", "divide"]
        else:
            # Higher grades: equal distribution
            operations = ["add", "subtract", "multiply", "divide"]

        operation = random.choice(operations)

        # Generate the underlying math problem deterministically
        if operation == "add":
            problem_data = self._create_addition_problem(config)
        elif operation == "subtract":
            problem_data = self._create_subtraction_problem(config)
        elif operation == "multiply":
            problem_data = self._create_multiplication_problem(config)
        else:  # divide
            problem_data = self._create_division_problem(config)

        # Get context type from config if available
        context_type_param = None
        if config.word_problem_config and config.word_problem_config.context_type != "mixed":
            context_type_param = config.word_problem_config.context_type

        # Get LLM to wrap in word problem context
        word_problem_ctx = None
        is_word_problem = False
        try:
            llm_result = generate_word_problem_context(
                operation=operation,
                fractions=problem_data["fractions"],
                answer=problem_data["answer_text"],
                grade_level=grade,
                context_type=context_type_param,
            )

            word_problem_ctx = WordProblemContext(
                story=llm_result.get("problem_text", ""),
                question=llm_result.get("question", ""),
                context_type=llm_result.get("context_type", ""),
            )

            q_html = (
                f"<div class='word-problem'>"
                f"<p class='word-problem-story'>{word_problem_ctx.story}</p>"
                f"<p class='word-problem-question'><strong>{word_problem_ctx.question}</strong></p>"
                f"</div>"
            )
            q_text = f"{word_problem_ctx.story} {word_problem_ctx.question}"
            is_word_problem = True

        except Exception as e:
            # Never silently fall back - raise the error so we can fix it
            raise RuntimeError(
                f"Word problem generation failed for {operation} problem: {e}. "
                f"Check LLM service configuration and API key."
            ) from e

        # Create hint for word problems
        math_hint = problem_data.get("hint", "")
        if is_word_problem:
            hint = (
                f"First, identify the fractions: {', '.join(problem_data['fractions'])}. "
                f"This is {'an addition' if operation == 'add' else 'a ' + operation} problem. "
                f"{math_hint}"
            )
        else:
            hint = f"Math: {problem_data['question_text']} | {math_hint}" if math_hint else f"Math: {problem_data['question_text']}"

        # Create worked solution showing both word problem and math
        worked = None
        if config.include_worked_examples:
            if is_word_problem:
                worked = (
                    f"Step 1: Read the problem and identify the fractions: {', '.join(problem_data['fractions'])}\n"
                    f"Step 2: Determine the operation - this is {'an addition' if operation == 'add' else 'a ' + operation} problem\n"
                    f"Step 3: Set up the equation: {problem_data['question_text']}\n"
                    f"{problem_data.get('worked_solution', '')}"
                )
            else:
                worked = (
                    f"Step 1: Identify the math - This is a {operation} problem\n"
                    f"Step 2: Set up the equation: {problem_data['question_text']}\n"
                    f"{problem_data.get('worked_solution', '')}"
                )

        return FractionProblem(
            id=self._make_id(),
            question_text=q_text,
            question_html=q_html,
            answer=problem_data["answer"],
            answer_text=problem_data["answer_text"],
            hint=hint if config.include_hints else None,
            worked_solution=worked,
            visual_svg=problem_data.get("visual_svg"),
            topic="fractions",
            subtopic="word-problems",
            difficulty=config.difficulty,
            lcd=problem_data.get("lcd"),
            is_word_problem=is_word_problem,
            word_problem_context=word_problem_ctx,
            metadata={
                "operation": operation,
                "context_type": word_problem_ctx.context_type if word_problem_ctx else "",
            },
        )

    def _create_addition_problem(self, config: GeneratorConfig) -> dict:
        """Create an addition problem (like/unlike denominators based on difficulty)."""
        denoms = self._get_denoms(config)
        
        # For easier problems, use same denom; for harder, use different
        if config.difficulty == Difficulty.EASY:
            d1 = d2 = random.choice(denoms)
        else:
            d1, d2 = random.sample(denoms, 2) if len(denoms) >= 2 else (denoms[0], denoms[0])
        
        n1 = self._rand_numerator(d1)
        n2 = self._rand_numerator(d2)
        
        frac1 = Fraction(n1, d1)
        frac2 = Fraction(n2, d2)
        answer = frac1 + frac2
        
        lcd = math.lcm(d1, d2)
        
        return {
            "fractions": [f"{n1}/{d1}", f"{n2}/{d2}"],
            "question_text": f"{n1}/{d1} + {n2}/{d2}",
            "question_html": f"{self._format_fraction_html(frac1)} + {self._format_fraction_html(frac2)}",
            "answer": answer,
            "answer_text": self._format_fraction(answer),
            "hint": f"Add the fractions: {n1}/{d1} + {n2}/{d2}",
            "lcd": lcd,
            "visual_svg": create_addition_visual(frac1, frac2) if config.include_visuals else None,
            "worked_solution": f"Step 3: {n1}/{d1} + {n2}/{d2} = {self._format_fraction(answer)}",
        }

    def _create_subtraction_problem(self, config: GeneratorConfig) -> dict:
        """Create a subtraction problem ensuring positive result."""
        denoms = self._get_denoms(config)
        
        if config.difficulty == Difficulty.EASY:
            d1 = d2 = random.choice(denoms)
        else:
            d1, d2 = random.sample(denoms, 2) if len(denoms) >= 2 else (denoms[0], denoms[0])
        
        n1 = self._rand_numerator(d1)
        n2 = self._rand_numerator(d2)
        
        frac1 = Fraction(n1, d1)
        frac2 = Fraction(n2, d2)
        
        # Ensure positive result
        if frac1 < frac2:
            frac1, frac2 = frac2, frac1
            n1, d1 = frac1.numerator, frac1.denominator
            n2, d2 = frac2.numerator, frac2.denominator
        
        answer = frac1 - frac2
        lcd = math.lcm(d1, d2)
        
        return {
            "fractions": [f"{n1}/{d1}", f"{n2}/{d2}"],
            "question_text": f"{n1}/{d1} - {n2}/{d2}",
            "question_html": f"{self._format_fraction_html(frac1)} − {self._format_fraction_html(frac2)}",
            "answer": answer,
            "answer_text": self._format_fraction(answer),
            "hint": f"Subtract: {n1}/{d1} - {n2}/{d2}",
            "lcd": lcd,
            "worked_solution": f"Step 3: {n1}/{d1} - {n2}/{d2} = {self._format_fraction(answer)}",
        }

    def _create_multiplication_problem(self, config: GeneratorConfig) -> dict:
        """Create a multiplication problem."""
        d1 = self._rand_denom(config)
        d2 = self._rand_denom(config)
        n1 = self._rand_numerator(d1)
        n2 = self._rand_numerator(d2)
        
        frac1 = Fraction(n1, d1)
        frac2 = Fraction(n2, d2)
        answer = frac1 * frac2
        
        return {
            "fractions": [f"{n1}/{d1}", f"{n2}/{d2}"],
            "question_text": f"{n1}/{d1} × {n2}/{d2}",
            "question_html": f"{self._format_fraction_html(frac1)} × {self._format_fraction_html(frac2)}",
            "answer": answer,
            "answer_text": self._format_fraction(answer),
            "hint": f"Multiply: {n1} × {n2} = {n1 * n2}, {d1} × {d2} = {d1 * d2}",
            "worked_solution": f"Step 3: {n1}/{d1} × {n2}/{d2} = {n1 * n2}/{d1 * d2} = {self._format_fraction(answer)}",
        }

    def _create_division_problem(self, config: GeneratorConfig) -> dict:
        """Create a division problem."""
        d1 = self._rand_denom(config)
        d2 = self._rand_denom(config)
        n1 = self._rand_numerator(d1)
        n2 = self._rand_numerator(d2)
        
        frac1 = Fraction(n1, d1)
        frac2 = Fraction(n2, d2)
        answer = frac1 / frac2
        
        return {
            "fractions": [f"{n1}/{d1}", f"{n2}/{d2}"],
            "question_text": f"{n1}/{d1} ÷ {n2}/{d2}",
            "question_html": f"{self._format_fraction_html(frac1)} ÷ {self._format_fraction_html(frac2)}",
            "answer": answer,
            "answer_text": self._format_fraction(answer),
            "hint": f"Keep, Change, Flip: {n1}/{d1} × {d2}/{n2}",
            "worked_solution": f"Step 3: {n1}/{d1} ÷ {n2}/{d2} = {n1}/{d1} × {d2}/{n2} = {self._format_fraction(answer)}",
        }
