"""Tests for the fractions generator.

All tests use Python's fractions.Fraction for exact arithmetic verification.
"""

import math
from fractions import Fraction

import pytest

from src.generators.fractions import FractionGenerator
from src.models import GeneratorConfig, Difficulty
from src.math_explanations import explain_gcf, explain_lcd, explain_simplify
from src.visualizations import create_fraction_bar, create_addition_visual


@pytest.fixture
def gen():
    return FractionGenerator()


def _config(subtopic: str, **kwargs) -> GeneratorConfig:
    """Helper to create a config for a given subtopic."""
    defaults = dict(
        topic="fractions",
        subtopic=subtopic,
        num_problems=5,
        difficulty=Difficulty.MEDIUM,
        include_hints=True,
        include_worked_examples=True,
        include_visuals=True,
    )
    defaults.update(kwargs)
    return GeneratorConfig(**defaults)


# --- Basic generation tests ---

class TestAddSameDenom:
    def test_generates_correct_count(self, gen):
        config = _config("add-same-denom", num_problems=8)
        problems = gen.generate(config)
        assert len(problems) == 8

    def test_answer_is_correct(self, gen):
        config = _config("add-same-denom", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            # Parse question: "n1/d + n2/d"
            parts = p.question_text.split(" + ")
            n1, d1 = map(int, parts[0].split("/"))
            n2, d2 = map(int, parts[1].split("/"))
            assert d1 == d2
            expected = Fraction(n1, d1) + Fraction(n2, d2)
            assert p.answer == expected

    def test_has_hints(self, gen):
        config = _config("add-same-denom", include_hints=True)
        problems = gen.generate(config)
        for p in problems:
            assert p.hint is not None


class TestSubtractSameDenom:
    def test_result_is_non_negative(self, gen):
        config = _config("subtract-same-denom", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            assert p.answer >= 0

    def test_answer_is_correct(self, gen):
        config = _config("subtract-same-denom", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            parts = p.question_text.split(" - ")
            n1, d1 = map(int, parts[0].split("/"))
            n2, d2 = map(int, parts[1].split("/"))
            expected = Fraction(n1, d1) - Fraction(n2, d2)
            assert p.answer == expected


class TestAddUnlikeDenom:
    def test_unlike_denominators(self, gen):
        config = _config("add-unlike-denom", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            parts = p.question_text.split(" + ")
            _, d1 = map(int, parts[0].split("/"))
            _, d2 = map(int, parts[1].split("/"))
            assert d1 != d2

    def test_answer_is_correct(self, gen):
        """Test that e.g. 1/3 + 1/4 = 7/12"""
        config = _config("add-unlike-denom", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            parts = p.question_text.split(" + ")
            n1, d1 = map(int, parts[0].split("/"))
            n2, d2 = map(int, parts[1].split("/"))
            expected = Fraction(n1, d1) + Fraction(n2, d2)
            assert p.answer == expected

    def test_lcd_is_set(self, gen):
        config = _config("add-unlike-denom", num_problems=10)
        problems = gen.generate(config)
        for p in problems:
            assert p.lcd is not None
            parts = p.question_text.split(" + ")
            _, d1 = map(int, parts[0].split("/"))
            _, d2 = map(int, parts[1].split("/"))
            assert p.lcd == math.lcm(d1, d2)

    def test_equivalent_fractions_set(self, gen):
        config = _config("add-unlike-denom", num_problems=5)
        problems = gen.generate(config)
        for p in problems:
            assert p.equivalent_fractions is not None
            assert len(p.equivalent_fractions) == 2


class TestSubtractUnlikeDenom:
    def test_result_is_non_negative(self, gen):
        config = _config("subtract-unlike-denom", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            assert p.answer >= 0

    def test_answer_is_correct(self, gen):
        config = _config("subtract-unlike-denom", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            parts = p.question_text.split(" - ")
            n1, d1 = map(int, parts[0].split("/"))
            n2, d2 = map(int, parts[1].split("/"))
            expected = Fraction(n1, d1) - Fraction(n2, d2)
            assert p.answer == expected


class TestEquivalentFractions:
    def test_answer_is_equivalent(self, gen):
        config = _config("equivalent-fractions", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            # Parse "n/d = ?/target_d"
            left, right = p.question_text.split(" = ")
            n, d = map(int, left.split("/"))
            target_d = int(right.split("/")[1])
            base = Fraction(n, d)
            assert p.answer == base
            # Check the answer text gives a valid equivalent
            an, ad = map(int, p.answer_text.split("/"))
            assert Fraction(an, ad) == base


class TestSimplify:
    def test_simplification_works(self, gen):
        """Test that e.g. 6/8 simplifies to 3/4"""
        config = _config("simplify-to-lowest", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            # The answer should be in lowest terms
            assert math.gcd(p.answer.numerator, p.answer.denominator) == 1

    def test_gcf_is_set(self, gen):
        config = _config("simplify-to-lowest", num_problems=10)
        problems = gen.generate(config)
        for p in problems:
            assert p.gcf is not None
            assert p.gcf > 1  # Should actually need simplification


class TestCompare:
    def test_answer_is_valid_symbol(self, gen):
        config = _config("compare-fractions", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            assert p.answer_text in ("<", ">", "=")

    def test_comparison_is_correct(self, gen):
        config = _config("compare-fractions", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            # Parse "Compare n1/d1 ○ n2/d2"
            text = p.question_text.replace("Compare ", "")
            parts = text.split(" ○ ")
            n1, d1 = map(int, parts[0].split("/"))
            n2, d2 = map(int, parts[1].split("/"))
            f1, f2 = Fraction(n1, d1), Fraction(n2, d2)
            if f1 > f2:
                assert p.answer_text == ">"
            elif f1 < f2:
                assert p.answer_text == "<"
            else:
                assert p.answer_text == "="


class TestMultiply:
    def test_answer_is_correct(self, gen):
        config = _config("multiply-fractions", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            parts = p.question_text.split(" × ")
            n1, d1 = map(int, parts[0].split("/"))
            n2, d2 = map(int, parts[1].split("/"))
            expected = Fraction(n1, d1) * Fraction(n2, d2)
            assert p.answer == expected

    def test_result_is_simplified(self, gen):
        config = _config("multiply-fractions", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            if isinstance(p.answer, Fraction):
                assert math.gcd(p.answer.numerator, p.answer.denominator) == 1


class TestDivide:
    def test_answer_is_correct(self, gen):
        config = _config("divide-fractions", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            parts = p.question_text.split(" ÷ ")
            n1, d1 = map(int, parts[0].split("/"))
            n2, d2 = map(int, parts[1].split("/"))
            expected = Fraction(n1, d1) / Fraction(n2, d2)
            assert p.answer == expected


class TestMixedToImproper:
    def test_generates(self, gen):
        config = _config("mixed-to-improper", num_problems=5)
        problems = gen.generate(config)
        assert len(problems) == 5

    def test_answer_is_improper(self, gen):
        config = _config("mixed-to-improper", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            # The answer numerator should be > denominator
            an, ad = map(int, p.answer_text.split("/"))
            assert an > ad


class TestImproperToMixed:
    def test_generates(self, gen):
        config = _config("improper-to-mixed", num_problems=5)
        problems = gen.generate(config)
        assert len(problems) == 5

    def test_answer_format(self, gen):
        config = _config("improper-to-mixed", num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            # Answer should be "whole remainder/denom"
            parts = p.answer_text.split(" ")
            assert len(parts) == 2
            whole = int(parts[0])
            assert whole >= 1
            r, d = map(int, parts[1].split("/"))
            assert 0 < r < d


# --- LCD / GCF math tests ---

class TestLCDCalculation:
    def test_lcd_of_4_and_6_is_12(self):
        assert math.lcm(4, 6) == 12

    def test_lcd_of_3_and_5_is_15(self):
        assert math.lcm(3, 5) == 15

    def test_lcd_of_2_and_4_is_4(self):
        assert math.lcm(2, 4) == 4


class TestGCFCalculation:
    def test_gcf_of_12_and_18_is_6(self):
        assert math.gcd(12, 18) == 6

    def test_gcf_of_8_and_12_is_4(self):
        assert math.gcd(8, 12) == 4

    def test_gcf_of_7_and_3_is_1(self):
        assert math.gcd(7, 3) == 1


# --- Fraction exact arithmetic tests ---

class TestFractionArithmetic:
    def test_one_third_plus_one_fourth(self):
        """1/3 + 1/4 = 7/12"""
        assert Fraction(1, 3) + Fraction(1, 4) == Fraction(7, 12)

    def test_six_eighths_simplifies_to_three_fourths(self):
        """6/8 simplifies to 3/4"""
        assert Fraction(6, 8) == Fraction(3, 4)

    def test_two_thirds_times_three_fifths(self):
        """2/3 × 3/5 = 2/5"""
        assert Fraction(2, 3) * Fraction(3, 5) == Fraction(2, 5)

    def test_one_half_divided_by_one_third(self):
        """1/2 ÷ 1/3 = 3/2"""
        assert Fraction(1, 2) / Fraction(1, 3) == Fraction(3, 2)


# --- Math explanations tests ---

class TestMathExplanations:
    def test_explain_gcf_output(self):
        result = explain_gcf(12, 18)
        assert "GCF" in result
        assert "6" in result

    def test_explain_lcd_output(self):
        result = explain_lcd(4, 6)
        assert "LCD" in result
        assert "12" in result

    def test_explain_simplify_output(self):
        result = explain_simplify(6, 8)
        assert "3/4" in result
        assert "GCF" in result


# --- Visualization tests ---

class TestVisualizations:
    def test_fraction_bar_is_svg(self):
        svg = create_fraction_bar(Fraction(3, 4))
        assert svg.startswith("<svg")
        assert "</svg>" in svg

    def test_fraction_bar_has_correct_segments(self):
        svg = create_fraction_bar(Fraction(2, 5))
        # Should have 5 rect elements (one per segment)
        assert svg.count("<rect") == 5

    def test_addition_visual_is_svg(self):
        svg = create_addition_visual(Fraction(1, 3), Fraction(1, 4))
        assert svg.startswith("<svg")
        assert "</svg>" in svg


# --- Difficulty tests ---

class TestDifficulty:
    def test_easy_uses_small_denoms(self, gen):
        config = _config("add-unlike-denom", difficulty=Difficulty.EASY, num_problems=20)
        problems = gen.generate(config)
        for p in problems:
            parts = p.question_text.split(" + ")
            _, d1 = map(int, parts[0].split("/"))
            _, d2 = map(int, parts[1].split("/"))
            assert d1 in [2, 3, 4, 5, 6]
            assert d2 in [2, 3, 4, 5, 6]

    def test_hard_allows_larger_denoms(self, gen):
        config = _config("add-unlike-denom", difficulty=Difficulty.HARD, num_problems=50)
        problems = gen.generate(config)
        all_denoms = set()
        for p in problems:
            parts = p.question_text.split(" + ")
            _, d1 = map(int, parts[0].split("/"))
            _, d2 = map(int, parts[1].split("/"))
            all_denoms.add(d1)
            all_denoms.add(d2)
        # At least one denom > 6 with 50 problems
        assert any(d > 6 for d in all_denoms)


# --- Deduplication test ---

class TestDeduplication:
    def test_no_duplicate_questions(self, gen):
        config = _config("add-unlike-denom", num_problems=15)
        problems = gen.generate(config)
        questions = [p.question_text for p in problems]
        assert len(questions) == len(set(questions))


# --- Edge cases ---

class TestEdgeCases:
    def test_unknown_subtopic_raises(self, gen):
        config = _config("nonexistent-subtopic")
        with pytest.raises(ValueError, match="Unknown subtopic"):
            gen.generate(config)

    def test_single_problem(self, gen):
        config = _config("add-same-denom", num_problems=1)
        problems = gen.generate(config)
        assert len(problems) == 1

    def test_large_number_of_problems(self, gen):
        """Test generating a large number of problems within reasonable limits."""
        # Use a subtopic with more variety (unlike denominators) and HARD difficulty
        # to have a larger problem space
        config = _config("add-unlike-denom", num_problems=50, difficulty=Difficulty.HARD)
        problems = gen.generate(config)
        assert len(problems) == 50

    def test_no_hints_when_disabled(self, gen):
        """Test that hints are not included when disabled."""
        config = _config("add-same-denom", include_hints=False)
        problems = gen.generate(config)
        for p in problems:
            assert p.hint is None

    def test_no_visuals_when_disabled(self, gen):
        """Test that visuals are not included when disabled."""
        config = _config("add-same-denom", include_visuals=False)
        problems = gen.generate(config)
        for p in problems:
            assert p.visual_svg is None

    def test_max_denominator_constraint(self, gen):
        """Test that max_denominator is respected."""
        config = _config(
            "add-unlike-denom",
            max_denominator=6,
            difficulty=Difficulty.HARD,
            num_problems=20
        )
        problems = gen.generate(config)
        for p in problems:
            parts = p.question_text.split(" + ")
            _, d1 = map(int, parts[0].split("/"))
            _, d2 = map(int, parts[1].split("/"))
            assert d1 <= 6
            assert d2 <= 6


# --- Problem ID tests ---

class TestProblemIds:
    """Tests for problem ID generation."""

    def test_problems_have_unique_ids(self, gen):
        """Test that each problem has a unique ID."""
        config = _config("add-same-denom", num_problems=20)
        problems = gen.generate(config)
        ids = [p.id for p in problems]
        assert len(ids) == len(set(ids))

    def test_problem_id_format(self, gen):
        """Test that problem IDs have expected format."""
        config = _config("add-same-denom", num_problems=5)
        problems = gen.generate(config)
        for p in problems:
            assert p.id is not None
            assert len(p.id) == 12  # UUID hex[:12]
            assert p.id.isalnum()


# --- Worked examples tests ---

class TestWorkedExamples:
    """Tests for worked examples/solutions."""

    def test_worked_examples_included(self, gen):
        """Test that worked examples are included when enabled."""
        config = _config("add-same-denom", include_worked_examples=True)
        problems = gen.generate(config)
        for p in problems:
            assert p.worked_solution is not None
            assert len(p.worked_solution) > 0

    def test_no_worked_examples_when_disabled(self, gen):
        """Test that worked examples are not included when disabled."""
        config = _config("add-same-denom", include_worked_examples=False)
        problems = gen.generate(config)
        for p in problems:
            assert p.worked_solution is None

    def test_worked_example_contains_steps(self, gen):
        """Test that worked examples contain step-by-step instructions."""
        config = _config("add-same-denom", include_worked_examples=True)
        problems = gen.generate(config)
        for p in problems:
            assert "Step" in p.worked_solution


# --- Problem metadata tests ---

class TestProblemMetadata:
    """Tests for problem metadata."""

    def test_problem_has_topic(self, gen):
        """Test that problems have topic set."""
        config = _config("add-same-denom")
        problems = gen.generate(config)
        for p in problems:
            assert p.topic == "fractions"

    def test_problem_has_subtopic(self, gen):
        """Test that problems have subtopic set."""
        config = _config("add-same-denom")
        problems = gen.generate(config)
        for p in problems:
            assert p.subtopic == "add-same-denom"

    def test_problem_has_difficulty(self, gen):
        """Test that problems have difficulty set."""
        config = _config("add-same-denom", difficulty=Difficulty.HARD)
        problems = gen.generate(config)
        for p in problems:
            assert p.difficulty == Difficulty.HARD


# --- HTML output tests ---

class TestHTMLOutput:
    """Tests for HTML question output."""

    def test_question_html_generated(self, gen):
        """Test that question_html is generated."""
        config = _config("add-same-denom")
        problems = gen.generate(config)
        for p in problems:
            assert p.question_html is not None
            assert len(p.question_html) > 0

    def test_question_html_contains_fraction_markup(self, gen):
        """Test that HTML contains fraction-specific markup."""
        config = _config("add-same-denom")
        problems = gen.generate(config)
        for p in problems:
            assert "frac" in p.question_html or "sup" in p.question_html


# --- Mixed difficulty tests ---

class TestMixedDifficulty:
    """Tests for MIXED difficulty level."""

    def test_mixed_difficulty_generates_variety(self, gen):
        """Test that MIXED difficulty generates problems with varying number ranges."""
        config = _config("add-unlike-denom", difficulty=Difficulty.MIXED, num_problems=50)
        problems = gen.generate(config)

        all_denoms = set()
        for p in problems:
            parts = p.question_text.split(" + ")
            _, d1 = map(int, parts[0].split("/"))
            _, d2 = map(int, parts[1].split("/"))
            all_denoms.add(d1)
            all_denoms.add(d2)

        # Should have variety in denominators
        assert len(all_denoms) >= 3


# --- All subtopics generation test ---

class TestAllSubtopics:
    """Tests that all subtopics can generate problems."""

    @pytest.mark.parametrize("subtopic", [
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
    ])
    def test_subtopic_generates_problems(self, gen, subtopic):
        """Test that each subtopic generates the correct number of problems."""
        config = _config(subtopic, num_problems=5)
        problems = gen.generate(config)
        assert len(problems) == 5

    @pytest.mark.parametrize("subtopic", [
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
    ])
    def test_subtopic_has_valid_answer(self, gen, subtopic):
        """Test that each subtopic generates problems with valid answers."""
        config = _config(subtopic, num_problems=5)
        problems = gen.generate(config)
        for p in problems:
            assert p.answer is not None
            assert p.answer_text is not None
            assert len(p.answer_text) > 0
