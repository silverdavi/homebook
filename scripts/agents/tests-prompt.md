# Testing Agent

> Session: tests
> Budget: $50
> Started: 2026-02-04

## YOUR OWNERSHIP
You exclusively own and can edit:
- `packages/generator/tests/` (all test files)
- `apps/web/__tests__/` (CREATE if needed)

## DO NOT TOUCH
- Source code (only tests)
- Do NOT modify any non-test files

## YOUR MISSION
Create comprehensive tests for the Homebook worksheet generator. Tests should cover:
1. All generators (fractions, chemistry, biology, arithmetic, decimals)
2. LLM service (with mocking)
3. Caching layer
4. API endpoints
5. Standards alignment

## IMMEDIATE TASKS (in order)

### 1. Create `packages/generator/tests/test_arithmetic.py`

```python
"""Tests for arithmetic generator."""

import pytest
from src.generators.arithmetic import ArithmeticGenerator
from src.models import GeneratorConfig, Difficulty


class TestArithmeticGenerator:
    """Tests for ArithmeticGenerator."""
    
    def setup_method(self):
        self.generator = ArithmeticGenerator()
    
    def test_generates_correct_number_of_problems(self):
        config = GeneratorConfig(
            subject="math",
            topic_id="arithmetic",
            subtopic_id="addition",
            difficulty=Difficulty.EASY,
            num_problems=10,
        )
        problems = self.generator.generate(config)
        assert len(problems) == 10
    
    def test_addition_has_correct_answer(self):
        config = GeneratorConfig(
            subject="math",
            topic_id="arithmetic",
            subtopic_id="addition",
            difficulty=Difficulty.EASY,
            num_problems=20,
        )
        problems = self.generator.generate(config)
        for p in problems:
            # Parse "a + b" from content_text
            parts = p.content_text.replace(" ", "").split("+")
            if len(parts) == 2:
                a, b = int(parts[0]), int(parts[1])
                assert int(p.answer) == a + b
    
    def test_subtraction_no_negative_results(self):
        config = GeneratorConfig(
            subject="math",
            topic_id="arithmetic",
            subtopic_id="subtraction",
            difficulty=Difficulty.MEDIUM,
            num_problems=50,
        )
        problems = self.generator.generate(config)
        for p in problems:
            assert int(p.answer) >= 0, f"Negative result: {p.content_text} = {p.answer}"
    
    def test_multiplication_correct(self):
        config = GeneratorConfig(
            subject="math",
            topic_id="arithmetic",
            subtopic_id="multiplication",
            difficulty=Difficulty.EASY,
            num_problems=20,
        )
        problems = self.generator.generate(config)
        for p in problems:
            # Parse "a × b"
            parts = p.content_text.replace(" ", "").split("×")
            if len(parts) == 2:
                a, b = int(parts[0]), int(parts[1])
                assert int(p.answer) == a * b
    
    def test_division_whole_numbers_only(self):
        config = GeneratorConfig(
            subject="math",
            topic_id="arithmetic",
            subtopic_id="division",
            difficulty=Difficulty.MEDIUM,
            num_problems=50,
        )
        problems = self.generator.generate(config)
        for p in problems:
            # Answer should be a whole number
            assert float(p.answer) == int(float(p.answer))
    
    def test_mixed_operations(self):
        config = GeneratorConfig(
            subject="math",
            topic_id="arithmetic",
            subtopic_id="mixed",
            difficulty=Difficulty.EASY,
            num_problems=40,
        )
        problems = self.generator.generate(config)
        subtopics = {p.subtopic for p in problems}
        # Should have multiple different operations
        assert len(subtopics) > 1
    
    def test_problems_have_hints(self):
        config = GeneratorConfig(
            subject="math",
            topic_id="arithmetic",
            subtopic_id="addition",
            difficulty=Difficulty.EASY,
            num_problems=5,
            include_hints=True,
        )
        problems = self.generator.generate(config)
        for p in problems:
            assert p.hint is not None
            assert len(p.hint) > 0
    
    def test_difficulty_affects_number_range(self):
        easy_config = GeneratorConfig(
            subject="math",
            topic_id="arithmetic",
            subtopic_id="addition",
            difficulty=Difficulty.EASY,
            num_problems=100,
        )
        hard_config = GeneratorConfig(
            subject="math",
            topic_id="arithmetic",
            subtopic_id="addition",
            difficulty=Difficulty.HARD,
            num_problems=100,
        )
        easy_problems = self.generator.generate(easy_config)
        hard_problems = self.generator.generate(hard_config)
        
        easy_max = max(int(p.answer) for p in easy_problems)
        hard_max = max(int(p.answer) for p in hard_problems)
        
        # Hard problems should generally have larger numbers
        assert hard_max > easy_max
```

### 2. Create `packages/generator/tests/test_decimals.py`

```python
"""Tests for decimals generator."""

import pytest
from decimal import Decimal
from src.generators.decimals import DecimalsGenerator
from src.models import GeneratorConfig, Difficulty


class TestDecimalsGenerator:
    """Tests for DecimalsGenerator."""
    
    def setup_method(self):
        self.generator = DecimalsGenerator()
    
    def test_decimal_addition_correct(self):
        config = GeneratorConfig(
            subject="math",
            topic_id="decimals",
            subtopic_id="decimal-addition",
            difficulty=Difficulty.EASY,
            num_problems=20,
        )
        problems = self.generator.generate(config)
        for p in problems:
            # Verify answer is a valid decimal
            answer = Decimal(p.answer)
            assert answer > 0
    
    def test_percent_of_number_correct(self):
        config = GeneratorConfig(
            subject="math",
            topic_id="decimals",
            subtopic_id="percent-of-number",
            difficulty=Difficulty.EASY,
            num_problems=20,
        )
        problems = self.generator.generate(config)
        for p in problems:
            # Answer should be a number
            answer = float(p.answer)
            assert answer >= 0
    
    def test_decimal_to_fraction_valid(self):
        config = GeneratorConfig(
            subject="math",
            topic_id="decimals",
            subtopic_id="decimal-to-fraction",
            difficulty=Difficulty.EASY,
            num_problems=10,
        )
        problems = self.generator.generate(config)
        for p in problems:
            # Answer should be a fraction like "1/2"
            assert "/" in p.answer
    
    def test_unknown_subtopic_raises_error(self):
        config = GeneratorConfig(
            subject="math",
            topic_id="decimals",
            subtopic_id="invalid-subtopic",
            difficulty=Difficulty.EASY,
            num_problems=1,
        )
        with pytest.raises(ValueError, match="Unknown decimals subtopic"):
            self.generator.generate(config)
```

### 3. Create `packages/generator/tests/test_cache.py`

```python
"""Tests for LLM caching layer."""

import pytest
import os
import tempfile
from src.cache import LLMCache, get_cache, cached_llm_call


class TestLLMCache:
    """Tests for LLMCache."""
    
    def setup_method(self):
        self.temp_dir = tempfile.mkdtemp()
        self.cache = LLMCache(cache_dir=self.temp_dir)
    
    def teardown_method(self):
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_set_and_get(self):
        self.cache.set("test_key", "test_value")
        result = self.cache.get("test_key")
        assert result == "test_value"
    
    def test_get_nonexistent_returns_none(self):
        result = self.cache.get("nonexistent_key")
        assert result is None
    
    def test_cache_persists_to_file(self):
        self.cache.set("persistent_key", "persistent_value")
        
        # Create new cache instance with same directory
        new_cache = LLMCache(cache_dir=self.temp_dir)
        result = new_cache.get("persistent_key")
        assert result == "persistent_value"
    
    def test_get_or_generate_caches(self):
        call_count = 0
        
        def generator():
            nonlocal call_count
            call_count += 1
            return "generated_value"
        
        # First call generates
        result1 = self.cache.get_or_generate("key", generator)
        assert result1 == "generated_value"
        assert call_count == 1
        
        # Second call uses cache
        result2 = self.cache.get_or_generate("key", generator)
        assert result2 == "generated_value"
        assert call_count == 1  # Not incremented
    
    def test_stats_tracking(self):
        self.cache.set("key1", "value1")
        
        # Hit
        self.cache.get("key1")
        # Miss
        self.cache.get("key2")
        
        stats = self.cache.get_stats()
        assert stats["hits"] >= 1
        assert stats["misses"] >= 1
```

### 4. Create `packages/generator/tests/test_standards.py`

```python
"""Tests for standards alignment."""

import pytest
from src.standards import (
    STANDARDS,
    SUBTOPIC_STANDARDS,
    get_standards_for_subtopic,
    get_standards_for_worksheet,
    format_standards_for_display,
)


class TestStandards:
    """Tests for standards module."""
    
    def test_standards_database_not_empty(self):
        assert len(STANDARDS) > 0
    
    def test_standard_has_required_fields(self):
        for code, std in STANDARDS.items():
            assert std.id, f"Standard {code} missing id"
            assert std.code, f"Standard {code} missing code"
            assert std.domain, f"Standard {code} missing domain"
            assert std.description, f"Standard {code} missing description"
            assert std.grade, f"Standard {code} missing grade"
    
    def test_get_standards_for_subtopic(self):
        standards = get_standards_for_subtopic("adding-fractions")
        assert len(standards) > 0
        assert all(hasattr(s, "code") for s in standards)
    
    def test_unknown_subtopic_returns_empty(self):
        standards = get_standards_for_subtopic("nonexistent-subtopic")
        assert standards == []
    
    def test_format_standards_for_display(self):
        standards = get_standards_for_subtopic("adding-fractions")
        display = format_standards_for_display(standards)
        assert isinstance(display, str)
        assert len(display) > 0
    
    def test_worksheet_standards_deduplication(self):
        # If two subtopics share a standard, it should only appear once
        standards = get_standards_for_worksheet(["adding-fractions", "subtracting-fractions"])
        codes = [s.code for s in standards]
        assert len(codes) == len(set(codes))  # No duplicates
```

### 5. Create `packages/generator/tests/test_fractions.py` (expand existing)

Expand the existing fractions tests:

```python
"""Tests for fractions generator."""

import pytest
from fractions import Fraction
from src.generators.fractions import FractionGenerator
from src.models import GeneratorConfig, Difficulty, WordProblemConfig


class TestFractionGenerator:
    """Tests for FractionGenerator."""
    
    def setup_method(self):
        self.generator = FractionGenerator()
    
    def test_generates_correct_number(self):
        config = GeneratorConfig(
            subject="math",
            topic_id="fractions",
            subtopic_id="adding-fractions",
            difficulty=Difficulty.EASY,
            num_problems=10,
        )
        problems = self.generator.generate(config)
        assert len(problems) == 10
    
    def test_answer_is_simplified(self):
        config = GeneratorConfig(
            subject="math",
            topic_id="fractions",
            subtopic_id="adding-fractions",
            difficulty=Difficulty.EASY,
            num_problems=50,
        )
        problems = self.generator.generate(config)
        for p in problems:
            if "/" in p.answer:
                num, denom = map(int, p.answer.split("/"))
                frac = Fraction(num, denom)
                # Check it's simplified
                assert frac.numerator == num and frac.denominator == denom
    
    def test_no_duplicate_problems(self):
        config = GeneratorConfig(
            subject="math",
            topic_id="fractions",
            subtopic_id="adding-fractions",
            difficulty=Difficulty.EASY,
            num_problems=20,
        )
        problems = self.generator.generate(config)
        content_texts = [p.content_text for p in problems]
        assert len(content_texts) == len(set(content_texts))
```

### 6. Create `packages/generator/tests/conftest.py`

```python
"""Pytest configuration and fixtures."""

import pytest
import os


@pytest.fixture(autouse=True)
def mock_openai_for_tests(monkeypatch):
    """Mock OpenAI calls in all tests unless explicitly testing LLM."""
    # Set a fake API key to prevent real calls
    monkeypatch.setenv("OPENAI_API_KEY", "test-key-not-real")


@pytest.fixture
def temp_cache_dir(tmp_path):
    """Provide a temporary directory for cache tests."""
    cache_dir = tmp_path / "cache"
    cache_dir.mkdir()
    return str(cache_dir)
```

### 7. Update `packages/generator/tests/__init__.py`

```python
"""Test suite for Homebook worksheet generator."""
```

### 8. Run all tests

```bash
cd packages/generator && python3 -m pytest tests/ -v
```

## GIT RULES
- Pull before editing: `git pull`
- Commit after each task
- Push immediately: `git push`

## ON COMPLETION
1. Update status file with COMPLETE
2. Run: `python3 -m pytest tests/ -v --tb=short`
3. Report test results (pass/fail counts)
4. Commit and push

## REMEMBER
- Tests should NEVER make real API calls
- Use mocking for external services
- Each test should be independent
- Test both success and error cases
- Use descriptive test names
