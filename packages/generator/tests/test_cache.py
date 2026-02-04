"""Tests for LLM caching layer."""

import pytest
import os
import tempfile
import time
import shutil
from datetime import timedelta

from src.cache import (
    LLMCache,
    get_cache,
    reset_cache,
    generate_cache_key,
    get_cached,
    set_cached,
    get_cache_stats,
    reset_cache_stats,
)


class TestLLMCache:
    """Tests for LLMCache."""

    def setup_method(self):
        self.temp_dir = tempfile.mkdtemp()
        self.cache = LLMCache(cache_dir=self.temp_dir)

    def teardown_method(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_set_and_get(self):
        """Test basic set and get operations."""
        self.cache.set("test_key", "test_value")
        result = self.cache.get("test_key")
        assert result == "test_value"

    def test_get_nonexistent_returns_none(self):
        """Test that getting nonexistent key returns None."""
        result = self.cache.get("nonexistent_key")
        assert result is None

    def test_cache_persists_to_file(self):
        """Test that cache persists to file and survives new instance."""
        self.cache.set("persistent_key", "persistent_value")

        # Create new cache instance with same directory
        new_cache = LLMCache(cache_dir=self.temp_dir)
        result = new_cache.get("persistent_key")
        assert result == "persistent_value"

    def test_cache_different_value_types(self):
        """Test caching different value types."""
        # String
        self.cache.set("string_key", "string_value")
        assert self.cache.get("string_key") == "string_value"

        # Dict
        self.cache.set("dict_key", {"name": "test", "value": 42})
        assert self.cache.get("dict_key") == {"name": "test", "value": 42}

        # List
        self.cache.set("list_key", [1, 2, 3, "four"])
        assert self.cache.get("list_key") == [1, 2, 3, "four"]

        # Number
        self.cache.set("num_key", 12345)
        assert self.cache.get("num_key") == 12345

    def test_make_key_deterministic(self):
        """Test that cache keys are deterministic."""
        key1 = self.cache._make_key("test", a=1, b=2)
        key2 = self.cache._make_key("test", b=2, a=1)  # Different order
        key3 = self.cache._make_key("test", a=1, b=3)  # Different value

        assert key1 == key2  # Same params, different order should match
        assert key1 != key3  # Different params should not match
        assert key1.startswith("test_")

    def test_stats_tracking(self):
        """Test cache statistics tracking."""
        self.cache.set("key1", "value1")

        # Hit
        self.cache.get("key1")
        # Miss
        self.cache.get("key2")

        stats = self.cache.get_stats()
        assert stats["memory_hits"] >= 1
        assert stats["misses"] >= 1

    def test_stats_reset(self):
        """Test resetting cache statistics."""
        self.cache.set("key1", "value1")
        self.cache.get("key1")
        self.cache.get("key2")

        self.cache.reset_stats()
        stats = self.cache.get_stats()

        assert stats["memory_hits"] == 0
        assert stats["file_hits"] == 0
        assert stats["misses"] == 0

    def test_invalidate_specific_key(self):
        """Test invalidating a specific cache key."""
        self.cache.set("key1", "value1")
        self.cache.set("key2", "value2")

        self.cache.invalidate("key1")

        assert self.cache.get("key1") is None
        assert self.cache.get("key2") == "value2"

    def test_invalidate_prefix(self):
        """Test invalidating all keys with a given prefix."""
        self.cache.set("prefix1_a", "value_a")
        self.cache.set("prefix1_b", "value_b")
        self.cache.set("prefix2_a", "value_c")

        count = self.cache.invalidate_prefix("prefix1")

        assert count >= 2
        assert self.cache.get("prefix1_a") is None
        assert self.cache.get("prefix1_b") is None
        assert self.cache.get("prefix2_a") == "value_c"

    def test_clear_all(self):
        """Test clearing all cache entries."""
        self.cache.set("key1", "value1")
        self.cache.set("key2", "value2")
        self.cache.set("key3", "value3")

        count = self.cache.clear_all()

        assert count >= 3
        assert self.cache.get("key1") is None
        assert self.cache.get("key2") is None
        assert self.cache.get("key3") is None

    def test_ttl_expiration(self):
        """Test that cached values expire after TTL."""
        # Set with very short TTL (1 second)
        self.cache.set("expiring_key", "value", ttl=timedelta(seconds=1))

        # Should be available immediately
        assert self.cache.get("expiring_key") == "value"

        # Wait for expiration
        time.sleep(1.5)

        # Should be expired now
        assert self.cache.get("expiring_key") is None

    def test_memory_cache_eviction(self):
        """Test LRU eviction when memory cache is full."""
        small_cache = LLMCache(cache_dir=self.temp_dir, max_memory_entries=3)

        small_cache.set("key1", "value1")
        small_cache.set("key2", "value2")
        small_cache.set("key3", "value3")

        # Access key1 to make it recently used
        small_cache.get("key1")

        # Add a fourth entry, should evict key2 (least recently used)
        small_cache.set("key4", "value4")

        # key1 should still be in memory (was accessed)
        assert small_cache.get("key1") == "value1"
        # key4 should be in memory (just added)
        assert small_cache.get("key4") == "value4"
        # key2 might be evicted from memory but still available from file
        assert small_cache.get("key2") == "value2"  # Retrieved from file


class TestLegacyAPI:
    """Tests for legacy cache API functions."""

    def setup_method(self):
        reset_cache()

    def teardown_method(self):
        reset_cache()

    def test_generate_cache_key(self):
        """Test legacy cache key generation."""
        key1 = generate_cache_key("test", param1="value1", param2="value2")
        key2 = generate_cache_key("test", param2="value2", param1="value1")

        assert key1 == key2  # Order shouldn't matter
        assert key1.startswith("test_")

    def test_set_and_get_cached(self):
        """Test legacy set_cached and get_cached."""
        set_cached("legacy_key", "legacy_value")
        result = get_cached("legacy_key")
        assert result == "legacy_value"

    def test_get_cache_stats(self):
        """Test legacy get_cache_stats."""
        set_cached("stats_key", "stats_value")
        get_cached("stats_key")  # Hit
        get_cached("missing_key")  # Miss

        stats = get_cache_stats()

        assert "hits" in stats
        assert "misses" in stats
        assert "hit_rate" in stats
        assert stats["hits"] >= 1
        assert stats["misses"] >= 1

    def test_reset_cache_stats(self):
        """Test legacy reset_cache_stats."""
        set_cached("key", "value")
        get_cached("key")

        reset_cache_stats()
        stats = get_cache_stats()

        assert stats["hits"] == 0
        assert stats["misses"] == 0


class TestAsyncCache:
    """Tests for async cache operations."""

    def setup_method(self):
        self.temp_dir = tempfile.mkdtemp()
        self.cache = LLMCache(cache_dir=self.temp_dir)

    def teardown_method(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    @pytest.mark.asyncio
    async def test_get_or_generate_caches(self):
        """Test async get_or_generate caches results."""
        call_count = 0

        def generator():
            nonlocal call_count
            call_count += 1
            return "generated_value"

        # First call generates
        result1 = await self.cache.get_or_generate("key", generator)
        assert result1 == "generated_value"
        assert call_count == 1

        # Second call uses cache
        result2 = await self.cache.get_or_generate("key", generator)
        assert result2 == "generated_value"
        assert call_count == 1  # Not incremented

    @pytest.mark.asyncio
    async def test_get_or_generate_with_async_generator(self):
        """Test get_or_generate with async generator function."""
        call_count = 0

        async def async_generator():
            nonlocal call_count
            call_count += 1
            return "async_generated_value"

        result = await self.cache.get_or_generate("async_key", async_generator)
        assert result == "async_generated_value"
        assert call_count == 1

        # Second call uses cache
        result2 = await self.cache.get_or_generate("async_key", async_generator)
        assert result2 == "async_generated_value"
        assert call_count == 1

    @pytest.mark.asyncio
    async def test_get_or_generate_with_key_params(self):
        """Test that different key params create different cache entries."""
        call_count = 0

        def generator():
            nonlocal call_count
            call_count += 1
            return f"value_{call_count}"

        result1 = await self.cache.get_or_generate("prefix", generator, param="a")
        result2 = await self.cache.get_or_generate("prefix", generator, param="b")
        result3 = await self.cache.get_or_generate("prefix", generator, param="a")

        assert result1 == "value_1"
        assert result2 == "value_2"
        assert result3 == "value_1"  # Cached from first call
        assert call_count == 2


class TestCacheDirectory:
    """Tests for cache directory handling."""

    def test_creates_cache_directory(self):
        """Test that cache directory is created if it doesn't exist."""
        temp_dir = tempfile.mkdtemp()
        cache_dir = os.path.join(temp_dir, "nonexistent", "cache")

        try:
            cache = LLMCache(cache_dir=cache_dir)
            assert os.path.exists(cache_dir)
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def test_handles_invalid_cache_directory(self):
        """Test that cache handles invalid directory gracefully."""
        # Use a path that's likely to fail (file, not directory)
        temp_file = tempfile.NamedTemporaryFile(delete=False)
        temp_file.close()

        try:
            # This should not raise, just log a warning
            cache = LLMCache(cache_dir=temp_file.name)
            # Cache operations should still work (in-memory only)
            cache.set("key", "value")
            # Memory cache should work
            assert cache.get("key") == "value"
        finally:
            os.unlink(temp_file.name)
