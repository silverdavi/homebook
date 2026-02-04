"""
Arithmetic problem generator for basic math operations.
Covers addition, subtraction, multiplication, and division for grades K-6.
"""

import random
import uuid
from typing import List, Dict, Tuple

from ..models import Difficulty, GeneratorConfig, Problem
from .base import BaseGenerator


# Difficulty-based number ranges: (min_num, max_num, max_result)
DIFFICULTY_RANGES: Dict[Difficulty, Dict[str, Tuple[int, int, int]]] = {
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
    """Generator for basic arithmetic problems: +, -, x, /."""

    topic = "arithmetic"
    subtopics = [
        "addition",
        "subtraction",
        "multiplication",
        "division",
        "mixed",
    ]

    def generate(self, config: GeneratorConfig) -> List[Problem]:
        """Generate arithmetic problems based on config."""
        dispatch = {
            "addition": "add",
            "subtraction": "subtract",
            "multiplication": "multiply",
            "division": "divide",
            "mixed": "mixed",
        }

        operation = dispatch.get(config.subtopic)
        if operation is None:
            raise ValueError(f"Unknown subtopic: {config.subtopic}")

        problems: List[Problem] = []
        seen = set()
        attempts = 0
        max_attempts = config.num_problems * 20

        while len(problems) < config.num_problems and attempts < max_attempts:
            attempts += 1

            # For mixed, randomly pick an operation
            if operation == "mixed":
                op = random.choice(["add", "subtract", "multiply", "divide"])
            else:
                op = operation

            problem = self._generate_problem(op, config)

            # Deduplicate by question text
            if problem.question_text not in seen:
                seen.add(problem.question_text)
                problems.append(problem)

        return problems

    def _get_difficulty(self, config: GeneratorConfig) -> Difficulty:
        """Get effective difficulty, handling MIXED."""
        difficulty = config.difficulty
        if difficulty == Difficulty.MIXED:
            difficulty = random.choice([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD])
        return difficulty

    def _generate_problem(self, operation: str, config: GeneratorConfig) -> Problem:
        """Generate a single arithmetic problem."""
        difficulty = self._get_difficulty(config)
        ranges = DIFFICULTY_RANGES.get(difficulty, DIFFICULTY_RANGES[Difficulty.MEDIUM])
        op_range = ranges[operation]
        min_num, max_num, max_result = op_range

        if operation == "add":
            a, b, answer, symbol, question, hint, solution = self._make_addition(
                min_num, max_num, max_result
            )
        elif operation == "subtract":
            a, b, answer, symbol, question, hint, solution = self._make_subtraction(
                min_num, max_num
            )
        elif operation == "multiply":
            a, b, answer, symbol, question, hint, solution = self._make_multiplication(
                min_num, max_num
            )
        else:  # divide
            a, b, answer, symbol, question, hint, solution = self._make_division(
                min_num, max_num
            )

        # Build HTML representation
        question_html = f"<span class='math-expression'>{question} = </span>"

        # Build worked solution if requested
        worked_solution = None
        if config.include_worked_examples:
            worked_solution = self._build_worked_solution(operation, a, b, answer, symbol)

        return Problem(
            id=uuid.uuid4().hex[:12],
            question_text=question,
            question_html=question_html,
            answer=answer,
            answer_text=str(answer),
            hint=hint if config.include_hints else None,
            worked_solution=worked_solution,
            topic="arithmetic",
            subtopic=operation,
            difficulty=difficulty,
            metadata={"operation": operation, "operands": [a, b]},
        )

    def _make_addition(
        self, min_num: int, max_num: int, max_result: int
    ) -> Tuple[int, int, int, str, str, str, str]:
        """Create an addition problem."""
        a = random.randint(min_num, max_num)
        # Ensure result doesn't exceed max_result
        b_max = min(max_num, max_result - a)
        b = random.randint(min_num, max(min_num, b_max))
        answer = a + b
        symbol = "+"
        question = f"{a} + {b}"
        hint = f"Add {a} and {b}. You can count up from {a}."
        solution = f"{a} + {b} = {answer}"
        return a, b, answer, symbol, question, hint, solution

    def _make_subtraction(
        self, min_num: int, max_num: int
    ) -> Tuple[int, int, int, str, str, str, str]:
        """Create a subtraction problem with positive result."""
        a = random.randint(min_num, max_num)
        b = random.randint(min_num, a)  # Ensure b <= a for positive result
        answer = a - b
        symbol = "-"
        question = f"{a} - {b}"
        hint = f"Subtract {b} from {a}. You can count down from {a}."
        solution = f"{a} - {b} = {answer}"
        return a, b, answer, symbol, question, hint, solution

    def _make_multiplication(
        self, min_num: int, max_num: int
    ) -> Tuple[int, int, int, str, str, str, str]:
        """Create a multiplication problem."""
        a = random.randint(min_num, max_num)
        b = random.randint(min_num, max_num)
        answer = a * b
        symbol = "x"
        question = f"{a} x {b}"
        hint = f"Multiply {a} by {b}. Think: {a} groups of {b}."
        solution = f"{a} x {b} = {answer}"
        return a, b, answer, symbol, question, hint, solution

    def _make_division(
        self, min_num: int, max_num: int
    ) -> Tuple[int, int, int, str, str, str, str]:
        """Create a division problem with whole number result."""
        # Generate divisor and quotient first to ensure clean division
        b = random.randint(max(2, min_num), max_num)  # divisor (avoid div by 1)
        quotient = random.randint(min_num, max_num)
        a = b * quotient  # dividend ensures whole number result
        answer = quotient
        symbol = "/"
        question = f"{a} / {b}"
        hint = f"Divide {a} by {b}. How many groups of {b} fit into {a}?"
        solution = f"{a} / {b} = {answer}"
        return a, b, answer, symbol, question, hint, solution

    def _build_worked_solution(
        self, operation: str, a: int, b: int, answer: int, symbol: str
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
                f"<p><strong>Problem:</strong> {a} - {b}</p>"
                f"<p><strong>Step 1:</strong> Start with {a}</p>"
                f"<p><strong>Step 2:</strong> Take away {b}</p>"
                f"<p><strong>Answer:</strong> {answer}</p>"
                f"</div>"
            )
        elif operation == "multiply":
            return (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> {a} x {b}</p>"
                f"<p><strong>Step 1:</strong> Think of {a} groups with {b} in each</p>"
                f"<p><strong>Step 2:</strong> Count total: {a} x {b} = {answer}</p>"
                f"<p><strong>Answer:</strong> {answer}</p>"
                f"</div>"
            )
        else:  # divide
            return (
                f"<div class='worked-solution'>"
                f"<p><strong>Problem:</strong> {a} / {b}</p>"
                f"<p><strong>Step 1:</strong> How many groups of {b} fit in {a}?</p>"
                f"<p><strong>Step 2:</strong> {a} / {b} = {answer} groups</p>"
                f"<p><strong>Answer:</strong> {answer}</p>"
                f"</div>"
            )
