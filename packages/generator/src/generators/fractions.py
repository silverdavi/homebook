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

        except Exception:
            # Fallback to plain math if LLM fails
            q_html = problem_data["question_html"]
            q_text = problem_data["question_text"]
            is_word_problem = False

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

        except Exception:
            # Fallback to plain math if LLM fails
            q_html = problem_data["question_html"]
            q_text = problem_data["question_text"]

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
