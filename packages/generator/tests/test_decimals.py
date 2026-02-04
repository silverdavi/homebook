"""Tests for decimals generator."""

import pytest
from decimal import Decimal
from fractions import Fraction

from src.generators.decimals import DecimalsGenerator
from src.models import GeneratorConfig, Difficulty


@pytest.fixture
def gen():
    return DecimalsGenerator()


def _config(subtopic: str, **kwargs) -> GeneratorConfig:
    """Helper to create a config for a given subtopic."""
    defaults = dict(
        topic="decimals",
        subtopic=subtopic,
        num_problems=5,
        difficulty=Difficulty.MEDIUM,
        include_hints=True,
        include_worked_examples=True,
    )
    defaults.update(kwargs)
    return GeneratorConfig(**defaults)


class TestDecimalsGenerator:
    """Tests for DecimalsGenerator."""

    def test_generates_correct_number_of_problems(self, gen):
        config = _config("decimal-addition", num_problems=10)
        problems = gen.generate(config)
        assert len(problems) == 10

    def test_decimal_addition_correct(self, gen):
        config = _config("decimal-addition", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            # Verify answer is a valid decimal
            answer = Decimal(str(p.answer))
            assert answer > 0

    def test_decimal_subtraction_non_negative(self, gen):
        config = _config("decimal-subtraction", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            answer = Decimal(str(p.answer))
            assert answer >= 0

    def test_percent_of_number_correct(self, gen):
        config = _config("percent-of-number", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            # Answer should be a number
            answer = float(p.answer)
            assert answer >= 0

    def test_decimal_to_fraction_valid(self, gen):
        config = _config("decimal-to-fraction", num_problems=10)
        problems = gen.generate(config)
        for p in problems:
            # Answer should be a fraction like "1/2"
            assert "/" in p.answer_text

    def test_fraction_to_decimal_valid(self, gen):
        config = _config("fraction-to-decimal", num_problems=10)
        problems = gen.generate(config)
        for p in problems:
            # Answer should be a valid decimal
            answer = Decimal(p.answer_text)
            assert answer > 0

    def test_unknown_subtopic_raises_error(self, gen):
        config = _config("invalid-subtopic")
        with pytest.raises(ValueError, match="Unknown decimals subtopic"):
            gen.generate(config)


class TestDecimalOperations:
    """Tests for decimal arithmetic operations."""

    def test_decimal_multiplication(self, gen):
        config = _config("decimal-multiplication", num_problems=10)
        problems = gen.generate(config)
        for p in problems:
            assert p.answer is not None
            assert "x" in p.question_text

    def test_decimal_division(self, gen):
        config = _config("decimal-division", num_problems=10)
        problems = gen.generate(config)
        for p in problems:
            assert p.answer is not None
            assert "/" in p.question_text


class TestPercentageConversions:
    """Tests for percentage conversion problems."""

    def test_percent_to_decimal(self, gen):
        config = _config("percent-to-decimal", num_problems=10)
        problems = gen.generate(config)
        for p in problems:
            # Should convert percentage to decimal
            assert "%" in p.question_text
            answer = Decimal(p.answer_text)
            assert 0 <= answer <= 2  # Reasonable range

    def test_decimal_to_percent(self, gen):
        config = _config("decimal-to-percent", num_problems=10)
        problems = gen.generate(config)
        for p in problems:
            # Answer should be a percentage
            assert "%" in p.answer_text

    def test_percent_increase(self, gen):
        config = _config("percent-increase", num_problems=10)
        problems = gen.generate(config)
        for p in problems:
            assert "Increase" in p.question_text
            assert p.answer is not None

    def test_percent_decrease(self, gen):
        config = _config("percent-decrease", num_problems=10)
        problems = gen.generate(config)
        for p in problems:
            assert "Decrease" in p.question_text
            assert p.answer is not None


class TestDecimalDifficulty:
    """Tests for difficulty levels."""

    def test_easy_uses_fewer_decimal_places(self, gen):
        config = _config("decimal-addition", difficulty=Difficulty.EASY, num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            # Easy problems should have 1 decimal place
            parts = p.question_text.split(" + ")
            for part in parts:
                if "." in part:
                    decimal_places = len(part.split(".")[-1])
                    assert decimal_places <= 1

    def test_hard_allows_more_decimal_places(self, gen):
        config = _config("decimal-addition", difficulty=Difficulty.HARD, num_problems=20)
        problems = gen.generate(config)
        has_more_places = False
        for p in problems:
            parts = p.question_text.split(" + ")
            for part in parts:
                if "." in part:
                    decimal_places = len(part.split(".")[-1])
                    if decimal_places >= 3:
                        has_more_places = True
        assert has_more_places, "Hard problems should have some with 3+ decimal places"


class TestDecimalMetadata:
    """Tests for problem metadata."""

    def test_problem_has_topic(self, gen):
        config = _config("decimal-addition")
        problems = gen.generate(config)
        for p in problems:
            assert p.topic == "decimals"

    def test_problem_has_subtopic(self, gen):
        config = _config("decimal-addition")
        problems = gen.generate(config)
        for p in problems:
            assert p.subtopic == "decimal-addition"

    def test_problem_has_unique_id(self, gen):
        config = _config("decimal-addition", num_problems=20)
        problems = gen.generate(config)
        ids = [p.id for p in problems]
        assert len(ids) == len(set(ids))


class TestDecimalHintsAndWorkedExamples:
    """Tests for hints and worked examples."""

    def test_hints_included(self, gen):
        config = _config("decimal-addition", include_hints=True)
        problems = gen.generate(config)
        for p in problems:
            assert p.hint is not None
            assert len(p.hint) > 0

    def test_hints_not_included(self, gen):
        config = _config("decimal-addition", include_hints=False)
        problems = gen.generate(config)
        for p in problems:
            assert p.hint is None

    def test_worked_examples_included(self, gen):
        config = _config("decimal-addition", include_worked_examples=True)
        problems = gen.generate(config)
        for p in problems:
            assert p.worked_solution is not None
            assert "<div" in p.worked_solution

    def test_worked_examples_not_included(self, gen):
        config = _config("decimal-addition", include_worked_examples=False)
        problems = gen.generate(config)
        for p in problems:
            assert p.worked_solution is None


class TestDecimalDeduplication:
    """Tests for problem deduplication."""

    def test_no_duplicate_questions(self, gen):
        config = _config("decimal-addition", num_problems=20, difficulty=Difficulty.HARD)
        problems = gen.generate(config)
        questions = [p.question_text for p in problems]
        assert len(questions) == len(set(questions))


class TestAllDecimalSubtopics:
    """Test all decimal subtopics."""

    @pytest.mark.parametrize("subtopic", [
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
    ])
    def test_subtopic_generates_problems(self, gen, subtopic):
        config = _config(subtopic, num_problems=5)
        problems = gen.generate(config)
        assert len(problems) == 5

    @pytest.mark.parametrize("subtopic", [
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
    ])
    def test_subtopic_has_valid_answer(self, gen, subtopic):
        config = _config(subtopic, num_problems=5)
        problems = gen.generate(config)
        for p in problems:
            assert p.answer is not None
            assert p.answer_text is not None
            assert len(p.answer_text) > 0
