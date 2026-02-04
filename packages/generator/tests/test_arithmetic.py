"""Tests for arithmetic generator."""

import pytest

from src.generators.arithmetic import ArithmeticGenerator
from src.models import GeneratorConfig, Difficulty


@pytest.fixture
def gen():
    return ArithmeticGenerator()


def _config(subtopic: str, **kwargs) -> GeneratorConfig:
    """Helper to create a config for a given subtopic."""
    defaults = dict(
        topic="arithmetic",
        subtopic=subtopic,
        num_problems=5,
        difficulty=Difficulty.MEDIUM,
        include_hints=True,
        include_worked_examples=True,
    )
    defaults.update(kwargs)
    return GeneratorConfig(**defaults)


class TestArithmeticGenerator:
    """Tests for ArithmeticGenerator."""

    def test_generates_correct_number_of_problems(self, gen):
        config = _config("addition", num_problems=10)
        problems = gen.generate(config)
        assert len(problems) == 10

    def test_addition_has_correct_answer(self, gen):
        config = _config("addition", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            # Parse "a + b" from question_text
            parts = p.question_text.replace(" ", "").split("+")
            if len(parts) == 2:
                a, b = int(parts[0]), int(parts[1])
                assert int(p.answer) == a + b

    def test_subtraction_no_negative_results(self, gen):
        config = _config("subtraction", num_problems=50)
        problems = gen.generate(config)
        for p in problems:
            assert int(p.answer) >= 0, f"Negative result: {p.question_text} = {p.answer}"

    def test_subtraction_correct(self, gen):
        config = _config("subtraction", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            # Parse "a - b"
            parts = p.question_text.replace(" ", "").split("-")
            if len(parts) == 2:
                a, b = int(parts[0]), int(parts[1])
                assert int(p.answer) == a - b

    def test_multiplication_correct(self, gen):
        config = _config("multiplication", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            # Parse "a x b"
            parts = p.question_text.replace(" ", "").split("x")
            if len(parts) == 2:
                a, b = int(parts[0]), int(parts[1])
                assert int(p.answer) == a * b

    def test_division_whole_numbers_only(self, gen):
        config = _config("division", num_problems=50)
        problems = gen.generate(config)
        for p in problems:
            # Answer should be a whole number
            assert float(p.answer) == int(float(p.answer))

    def test_division_correct(self, gen):
        config = _config("division", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            # Parse "a / b"
            parts = p.question_text.replace(" ", "").split("/")
            if len(parts) == 2:
                a, b = int(parts[0]), int(parts[1])
                assert int(p.answer) == a // b

    def test_mixed_operations(self, gen):
        config = _config("mixed", num_problems=40)
        problems = gen.generate(config)
        subtopics = {p.subtopic for p in problems}
        # Should have multiple different operations
        assert len(subtopics) > 1

    def test_problems_have_hints(self, gen):
        config = _config("addition", include_hints=True, num_problems=5)
        problems = gen.generate(config)
        for p in problems:
            assert p.hint is not None
            assert len(p.hint) > 0

    def test_no_hints_when_disabled(self, gen):
        config = _config("addition", include_hints=False, num_problems=5)
        problems = gen.generate(config)
        for p in problems:
            assert p.hint is None


class TestArithmeticDifficulty:
    """Tests for difficulty levels affecting number ranges."""

    def test_easy_uses_small_numbers(self, gen):
        config = _config("addition", difficulty=Difficulty.EASY, num_problems=30)
        problems = gen.generate(config)
        for p in problems:
            # Easy addition should result in answers <= 20
            assert int(p.answer) <= 20, f"Easy problem has large answer: {p.answer}"

    def test_hard_allows_larger_numbers(self, gen):
        config = _config("addition", difficulty=Difficulty.HARD, num_problems=50)
        problems = gen.generate(config)
        answers = [int(p.answer) for p in problems]
        max_answer = max(answers)
        # Hard problems should have at least some answers > 100
        assert max_answer > 100, f"Hard problems should have larger answers, max was {max_answer}"

    def test_difficulty_affects_number_range(self, gen):
        easy_config = _config("addition", difficulty=Difficulty.EASY, num_problems=100)
        hard_config = _config("addition", difficulty=Difficulty.HARD, num_problems=100)

        easy_problems = gen.generate(easy_config)
        hard_problems = gen.generate(hard_config)

        easy_max = max(int(p.answer) for p in easy_problems)
        hard_max = max(int(p.answer) for p in hard_problems)

        # Hard problems should generally have larger numbers
        assert hard_max > easy_max


class TestArithmeticProblemMetadata:
    """Tests for problem metadata."""

    def test_problem_has_topic(self, gen):
        config = _config("addition")
        problems = gen.generate(config)
        for p in problems:
            assert p.topic == "arithmetic"

    def test_problem_has_subtopic(self, gen):
        config = _config("addition")
        problems = gen.generate(config)
        for p in problems:
            assert p.subtopic == "add"  # Note: converted to operation name

    def test_problem_has_unique_id(self, gen):
        config = _config("addition", num_problems=20)
        problems = gen.generate(config)
        ids = [p.id for p in problems]
        assert len(ids) == len(set(ids))

    def test_problem_has_metadata(self, gen):
        config = _config("addition")
        problems = gen.generate(config)
        for p in problems:
            assert "operation" in p.metadata
            assert "operands" in p.metadata
            assert p.metadata["operation"] == "add"
            assert len(p.metadata["operands"]) == 2


class TestArithmeticWorkedExamples:
    """Tests for worked examples."""

    def test_worked_examples_included(self, gen):
        config = _config("addition", include_worked_examples=True)
        problems = gen.generate(config)
        for p in problems:
            assert p.worked_solution is not None
            assert len(p.worked_solution) > 0

    def test_worked_examples_not_included(self, gen):
        config = _config("addition", include_worked_examples=False)
        problems = gen.generate(config)
        for p in problems:
            assert p.worked_solution is None

    def test_worked_example_contains_html(self, gen):
        config = _config("addition", include_worked_examples=True)
        problems = gen.generate(config)
        for p in problems:
            assert "<div" in p.worked_solution
            assert "Step" in p.worked_solution


class TestArithmeticDeduplication:
    """Tests for problem deduplication."""

    def test_no_duplicate_questions(self, gen):
        config = _config("addition", num_problems=30, difficulty=Difficulty.HARD)
        problems = gen.generate(config)
        questions = [p.question_text for p in problems]
        assert len(questions) == len(set(questions))


class TestArithmeticEdgeCases:
    """Tests for edge cases."""

    def test_unknown_subtopic_raises(self, gen):
        config = _config("invalid-subtopic")
        with pytest.raises(ValueError, match="Unknown subtopic"):
            gen.generate(config)

    def test_single_problem(self, gen):
        config = _config("addition", num_problems=1)
        problems = gen.generate(config)
        assert len(problems) == 1


class TestAllArithmeticSubtopics:
    """Test all arithmetic subtopics."""

    @pytest.mark.parametrize("subtopic", [
        "addition",
        "subtraction",
        "multiplication",
        "division",
        "mixed",
    ])
    def test_subtopic_generates_problems(self, gen, subtopic):
        config = _config(subtopic, num_problems=5)
        problems = gen.generate(config)
        assert len(problems) == 5

    @pytest.mark.parametrize("subtopic", [
        "addition",
        "subtraction",
        "multiplication",
        "division",
        "mixed",
    ])
    def test_subtopic_has_valid_answer(self, gen, subtopic):
        config = _config(subtopic, num_problems=5)
        problems = gen.generate(config)
        for p in problems:
            assert p.answer is not None
            assert p.answer_text is not None
            assert len(p.answer_text) > 0
