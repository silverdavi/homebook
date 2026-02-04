"""Tests for standards alignment."""

import pytest

from src.standards import (
    STANDARDS,
    SUBTOPIC_STANDARDS,
    Standard,
    get_standards_for_subtopic,
    get_standards_for_worksheet,
    format_standards_for_display,
)


class TestStandardsDatabase:
    """Tests for the STANDARDS database."""

    def test_standards_database_not_empty(self):
        assert len(STANDARDS) > 0

    def test_standard_has_required_fields(self):
        for code, std in STANDARDS.items():
            assert std.id, f"Standard {code} missing id"
            assert std.code, f"Standard {code} missing code"
            assert std.domain, f"Standard {code} missing domain"
            assert std.description, f"Standard {code} missing description"
            assert std.grade, f"Standard {code} missing grade"

    def test_standard_id_format(self):
        """Test that standard IDs follow CCSS format."""
        for code, std in STANDARDS.items():
            assert std.id.startswith("CCSS.MATH.CONTENT.")

    def test_standard_code_matches_key(self):
        """Test that the dictionary key matches the standard code."""
        for code, std in STANDARDS.items():
            assert code == std.code


class TestSubtopicStandards:
    """Tests for subtopic to standards mapping."""

    def test_subtopic_standards_not_empty(self):
        assert len(SUBTOPIC_STANDARDS) > 0

    def test_subtopic_standards_reference_valid_standards(self):
        """Ensure all referenced standards exist in STANDARDS."""
        for subtopic, codes in SUBTOPIC_STANDARDS.items():
            for code in codes:
                assert code in STANDARDS, f"Subtopic {subtopic} references unknown standard {code}"


class TestGetStandardsForSubtopic:
    """Tests for get_standards_for_subtopic function."""

    def test_get_standards_for_known_subtopic(self):
        standards = get_standards_for_subtopic("adding-fractions")
        assert len(standards) > 0
        assert all(hasattr(s, "code") for s in standards)

    def test_unknown_subtopic_returns_empty(self):
        standards = get_standards_for_subtopic("nonexistent-subtopic")
        assert standards == []

    def test_returns_standard_objects(self):
        standards = get_standards_for_subtopic("adding-fractions")
        for std in standards:
            assert isinstance(std, Standard)

    def test_fraction_subtopics_have_standards(self):
        """Test that fraction-related subtopics have associated standards."""
        fraction_subtopics = [
            "adding-fractions",
            "subtracting-fractions",
            "multiplying-fractions",
            "dividing-fractions",
            "comparing-fractions",
        ]
        for subtopic in fraction_subtopics:
            standards = get_standards_for_subtopic(subtopic)
            assert len(standards) > 0, f"Subtopic {subtopic} should have standards"

    def test_decimal_subtopics_have_standards(self):
        """Test that decimal-related subtopics have associated standards."""
        decimal_subtopics = [
            "decimal-addition",
            "decimal-subtraction",
            "decimal-to-fraction",
        ]
        for subtopic in decimal_subtopics:
            standards = get_standards_for_subtopic(subtopic)
            assert len(standards) > 0, f"Subtopic {subtopic} should have standards"

    def test_arithmetic_subtopics_have_standards(self):
        """Test that arithmetic subtopics have associated standards."""
        arithmetic_subtopics = [
            "addition",
            "subtraction",
            "multiplication",
            "division",
        ]
        for subtopic in arithmetic_subtopics:
            standards = get_standards_for_subtopic(subtopic)
            assert len(standards) > 0, f"Subtopic {subtopic} should have standards"


class TestGetStandardsForWorksheet:
    """Tests for get_standards_for_worksheet function."""

    def test_worksheet_standards_deduplication(self):
        """If two subtopics share a standard, it should only appear once."""
        standards = get_standards_for_worksheet(["adding-fractions", "subtracting-fractions"])
        codes = [s.code for s in standards]
        assert len(codes) == len(set(codes)), "Standards should be deduplicated"

    def test_empty_subtopics_returns_empty(self):
        standards = get_standards_for_worksheet([])
        assert standards == []

    def test_unknown_subtopics_return_empty(self):
        standards = get_standards_for_worksheet(["unknown-1", "unknown-2"])
        assert standards == []

    def test_mixed_known_unknown_subtopics(self):
        """Known subtopics should return standards, unknown ones should be ignored."""
        standards = get_standards_for_worksheet(["adding-fractions", "unknown-subtopic"])
        assert len(standards) > 0

    def test_standards_are_sorted(self):
        """Standards should be sorted by code."""
        standards = get_standards_for_worksheet([
            "adding-fractions",
            "decimal-addition",
            "multiplication",
        ])
        if len(standards) > 1:
            codes = [s.code for s in standards]
            assert codes == sorted(codes)

    def test_combines_standards_from_multiple_subtopics(self):
        """Should combine standards from multiple subtopics."""
        standards_1 = get_standards_for_subtopic("adding-fractions")
        standards_2 = get_standards_for_subtopic("multiplication")

        # If they have different standards, combined should have more
        combined = get_standards_for_worksheet(["adding-fractions", "multiplication"])

        codes_1 = {s.code for s in standards_1}
        codes_2 = {s.code for s in standards_2}
        expected_codes = codes_1 | codes_2

        combined_codes = {s.code for s in combined}
        assert combined_codes == expected_codes


class TestFormatStandardsForDisplay:
    """Tests for format_standards_for_display function."""

    def test_format_standards_for_display(self):
        standards = get_standards_for_subtopic("adding-fractions")
        display = format_standards_for_display(standards)
        assert isinstance(display, str)
        assert len(display) > 0

    def test_format_empty_returns_empty_string(self):
        display = format_standards_for_display([])
        assert display == ""

    def test_format_contains_standard_codes(self):
        standards = get_standards_for_subtopic("adding-fractions")
        display = format_standards_for_display(standards)
        for std in standards:
            assert std.code in display

    def test_format_uses_comma_separator(self):
        standards = get_standards_for_worksheet(["adding-fractions", "multiplication"])
        if len(standards) > 1:
            display = format_standards_for_display(standards)
            assert ", " in display


class TestStandardGrades:
    """Tests for grade levels in standards."""

    def test_grades_are_valid(self):
        """Grade should be a string representing a valid grade level."""
        valid_grades = {"K", "1", "2", "3", "4", "5", "6", "7", "8"}
        for code, std in STANDARDS.items():
            assert std.grade in valid_grades, f"Standard {code} has invalid grade {std.grade}"

    def test_fraction_standards_are_grade_appropriate(self):
        """Fraction standards should be grades 3-5."""
        fraction_standards = get_standards_for_subtopic("adding-fractions")
        for std in fraction_standards:
            grade_num = int(std.grade) if std.grade.isdigit() else 0
            assert grade_num >= 3, f"Fraction standard {std.code} has unexpectedly low grade"


class TestStandardDomains:
    """Tests for standard domains."""

    def test_domains_are_not_empty(self):
        for code, std in STANDARDS.items():
            assert len(std.domain) > 0, f"Standard {code} has empty domain"

    def test_known_domains_exist(self):
        """Check that expected domains are present."""
        all_domains = {std.domain for std in STANDARDS.values()}
        # These are core CCSS math domains
        expected_domains = [
            "Number & Operations-Fractions",
            "Operations & Algebraic Thinking",
        ]
        for domain in expected_domains:
            assert domain in all_domains, f"Expected domain '{domain}' not found"
