"""Pytest configuration and fixtures."""

import pytest
import os
import tempfile

# Configure pytest-asyncio
pytest_plugins = ('pytest_asyncio',)


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
