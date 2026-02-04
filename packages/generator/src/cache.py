"""
File-based caching layer for LLM-generated content.

Provides two-tier caching (memory + file) to reduce LLM costs and latency.
Memory cache for hot entries, file cache for persistence across restarts.

Usage:
    # Synchronous usage (existing API)
    cache_key = generate_cache_key("intro_page", subject="math", topic="fractions")
    cached = get_cached(cache_key)
    if cached is None:
        result = generate_content()
        set_cached(cache_key, result)

    # Async usage with decorator
    @cached_llm_call("intro_page", ttl_hours=168)
    async def generate_intro_page(subject: str, topic: str, grade: int) -> str:
        # LLM call here
        return intro_text

    # Async usage with get_or_generate
    cache = get_cache()
    result = await cache.get_or_generate(
        prefix="word_problem",
        generator=lambda: generate_word_problem_context(...),
        operation=operation,
        context_type=context_type
    )
"""

import hashlib
import json
import logging
import os
import time
from datetime import datetime, timedelta
from functools import wraps
from pathlib import Path
from typing import Any, Callable, Optional, TypeVar, Union

logger = logging.getLogger(__name__)

# Type variable for generic return types
T = TypeVar('T')

# Default configuration (can be overridden by environment variables)
DEFAULT_CACHE_DIR = os.environ.get("CACHE_DIR", "/tmp/homebook_cache")
DEFAULT_TTL_DAYS = int(os.environ.get("LLM_CACHE_TTL_DAYS", "7"))
DEFAULT_TTL_HOURS = DEFAULT_TTL_DAYS * 24
MAX_MEMORY_ENTRIES = int(os.environ.get("CACHE_MAX_MEMORY_ENTRIES", "1000"))


class LLMCache:
    """
    Two-tier cache for LLM-generated content.

    Memory cache provides fast access for hot entries.
    File cache provides persistence across restarts.
    """

    def __init__(
        self,
        cache_dir: str = DEFAULT_CACHE_DIR,
        default_ttl_hours: int = DEFAULT_TTL_HOURS,
        max_memory_entries: int = MAX_MEMORY_ENTRIES,
    ):
        """
        Initialize the cache.

        Args:
            cache_dir: Directory for file-based cache storage
            default_ttl_hours: Default time-to-live in hours
            max_memory_entries: Maximum entries in memory cache (LRU eviction)
        """
        self.cache_dir = cache_dir
        self.default_ttl = timedelta(hours=default_ttl_hours)
        self.max_memory_entries = max_memory_entries

        # In-memory cache: key -> (value, expiry_timestamp)
        self._memory_cache: dict[str, tuple[Any, float]] = {}
        # Track access order for LRU eviction
        self._access_order: list[str] = []

        # Statistics
        self._stats = {
            "memory_hits": 0,
            "file_hits": 0,
            "misses": 0,
        }

        # Create cache directory
        self._ensure_cache_dir()

    def _ensure_cache_dir(self) -> None:
        """Ensure cache directory exists."""
        try:
            Path(self.cache_dir).mkdir(parents=True, exist_ok=True)
        except OSError as e:
            logger.warning("Failed to create cache directory %s: %s", self.cache_dir, e)

    def _make_key(self, prefix: str, **kwargs) -> str:
        """
        Generate a deterministic cache key from prefix and kwargs.

        Args:
            prefix: Cache key prefix (e.g., "intro_page", "word_problem")
            **kwargs: Parameters to include in the hash

        Returns:
            A cache key string like "intro_page_a1b2c3d4e5f6"
        """
        # Sort kwargs for deterministic ordering
        sorted_items = sorted(kwargs.items())
        content = json.dumps(sorted_items, sort_keys=True, default=str)
        hash_value = hashlib.sha256(content.encode()).hexdigest()[:16]
        return f"{prefix}_{hash_value}"

    def _get_file_path(self, key: str) -> Path:
        """Get the file path for a cache key."""
        safe_key = key.replace("/", "_").replace("\\", "_")
        return Path(self.cache_dir) / f"{safe_key}.json"

    def _update_access_order(self, key: str) -> None:
        """Update LRU access order for a key."""
        if key in self._access_order:
            self._access_order.remove(key)
        self._access_order.append(key)

    def _evict_if_needed(self) -> None:
        """Evict oldest entries if memory cache is full."""
        while len(self._memory_cache) >= self.max_memory_entries:
            if not self._access_order:
                break
            oldest_key = self._access_order.pop(0)
            self._memory_cache.pop(oldest_key, None)
            logger.debug("Evicted cache entry: %s", oldest_key)

    def _is_expired(self, expiry_timestamp: float) -> bool:
        """Check if a timestamp has expired."""
        return time.time() > expiry_timestamp

    def get(self, key: str) -> Optional[Any]:
        """
        Get a value from cache.

        Checks memory cache first, then file cache.

        Args:
            key: The cache key

        Returns:
            The cached value, or None if not found or expired
        """
        # Check memory cache first
        if key in self._memory_cache:
            value, expiry = self._memory_cache[key]
            if not self._is_expired(expiry):
                self._stats["memory_hits"] += 1
                self._update_access_order(key)
                logger.debug("Memory cache hit: %s", key)
                return value
            else:
                # Expired, remove from memory
                del self._memory_cache[key]
                if key in self._access_order:
                    self._access_order.remove(key)

        # Check file cache
        file_path = self._get_file_path(key)
        try:
            if file_path.exists():
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                expiry = data.get("expires_at", 0)
                if not self._is_expired(expiry):
                    value = data.get("value")
                    self._stats["file_hits"] += 1
                    logger.debug("File cache hit: %s", key)

                    # Promote to memory cache
                    self._evict_if_needed()
                    self._memory_cache[key] = (value, expiry)
                    self._update_access_order(key)

                    return value
                else:
                    # Expired, clean up file
                    try:
                        file_path.unlink()
                    except OSError:
                        pass
        except (json.JSONDecodeError, KeyError, OSError) as e:
            logger.warning("Cache read error for %s: %s", key, e)

        self._stats["misses"] += 1
        logger.debug("Cache miss: %s", key)
        return None

    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[timedelta] = None,
        **metadata
    ) -> None:
        """
        Store a value in cache (both memory and file).

        Args:
            key: The cache key
            value: The value to cache
            ttl: Time-to-live (default from constructor)
            **metadata: Additional metadata to store with the cache entry
        """
        ttl = ttl or self.default_ttl
        expiry = time.time() + ttl.total_seconds()

        # Store in memory cache
        self._evict_if_needed()
        self._memory_cache[key] = (value, expiry)
        self._update_access_order(key)

        # Store in file cache
        file_path = self._get_file_path(key)
        data = {
            "value": value,
            "expires_at": expiry,
            "created_at": time.time(),
            "cache_key": key,
            **metadata,
        }

        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
            logger.debug("Cached value for: %s (TTL: %s)", key, ttl)
        except OSError as e:
            logger.warning("Failed to write cache file for %s: %s", key, e)

    async def get_or_generate(
        self,
        prefix: str,
        generator: Callable[[], T],
        ttl: Optional[timedelta] = None,
        **key_params
    ) -> T:
        """
        Get from cache or generate and cache.

        This is the primary async interface for caching LLM calls.

        Args:
            prefix: Cache key prefix (e.g., "intro_page", "word_problem")
            generator: Function (sync or async) to generate value if not cached
            ttl: Time to live (default from constructor)
            **key_params: Parameters that make up the cache key

        Returns:
            The cached or generated value
        """
        import asyncio

        key = self._make_key(prefix, **key_params)

        # Check cache first
        cached = self.get(key)
        if cached is not None:
            return cached

        # Generate new value
        if asyncio.iscoroutinefunction(generator):
            value = await generator()
        else:
            value = generator()

        # Cache the result
        self.set(key, value, ttl=ttl, params=key_params)

        return value

    def invalidate(self, key: str) -> None:
        """
        Invalidate a specific cache entry.

        Args:
            key: The cache key to invalidate
        """
        # Remove from memory
        self._memory_cache.pop(key, None)
        if key in self._access_order:
            self._access_order.remove(key)

        # Remove file
        file_path = self._get_file_path(key)
        try:
            if file_path.exists():
                file_path.unlink()
            logger.debug("Invalidated cache entry: %s", key)
        except OSError as e:
            logger.warning("Failed to delete cache file %s: %s", key, e)

    def invalidate_prefix(self, prefix: str) -> int:
        """
        Invalidate all cache entries with a given prefix.

        Args:
            prefix: The prefix to match (e.g., "intro_page")

        Returns:
            Number of entries invalidated
        """
        count = 0

        # Remove from memory
        keys_to_remove = [k for k in self._memory_cache if k.startswith(f"{prefix}_")]
        for key in keys_to_remove:
            self._memory_cache.pop(key, None)
            if key in self._access_order:
                self._access_order.remove(key)
            count += 1

        # Remove files
        try:
            cache_path = Path(self.cache_dir)
            for file_path in cache_path.glob(f"{prefix}_*.json"):
                try:
                    file_path.unlink()
                    count += 1
                except OSError:
                    pass
        except OSError:
            pass

        logger.info("Invalidated %d cache entries with prefix: %s", count, prefix)
        return count

    def clear_all(self) -> int:
        """
        Clear all cached entries.

        Returns:
            Number of entries cleared
        """
        count = len(self._memory_cache)

        # Clear memory
        self._memory_cache.clear()
        self._access_order.clear()

        # Clear files
        try:
            cache_path = Path(self.cache_dir)
            for file_path in cache_path.glob("*.json"):
                try:
                    file_path.unlink()
                    count += 1
                except OSError:
                    pass
        except OSError:
            pass

        logger.info("Cleared %d cache entries", count)
        return count

    def clear_expired(self) -> int:
        """
        Remove all expired cache entries.

        Returns:
            Number of expired entries removed
        """
        count = 0
        current_time = time.time()

        # Clear expired from memory
        expired_keys = [
            k for k, (_, expiry) in self._memory_cache.items()
            if current_time > expiry
        ]
        for key in expired_keys:
            self._memory_cache.pop(key, None)
            if key in self._access_order:
                self._access_order.remove(key)
            count += 1

        # Clear expired files
        try:
            cache_path = Path(self.cache_dir)
            for file_path in cache_path.glob("*.json"):
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)

                    if current_time > data.get("expires_at", 0):
                        file_path.unlink()
                        count += 1
                except (json.JSONDecodeError, OSError):
                    # Remove corrupted files
                    try:
                        file_path.unlink()
                        count += 1
                    except OSError:
                        pass
        except OSError as e:
            logger.warning("Error during cache cleanup: %s", e)

        if count > 0:
            logger.info("Cleared %d expired cache entries", count)

        return count

    def get_stats(self) -> dict:
        """
        Get cache statistics.

        Returns:
            Dictionary with cache statistics
        """
        total_hits = self._stats["memory_hits"] + self._stats["file_hits"]
        total = total_hits + self._stats["misses"]
        hit_rate = (total_hits / total * 100) if total > 0 else 0.0

        # Count file entries
        file_count = 0
        try:
            file_count = len(list(Path(self.cache_dir).glob("*.json")))
        except OSError:
            pass

        return {
            "memory_hits": self._stats["memory_hits"],
            "file_hits": self._stats["file_hits"],
            "total_hits": total_hits,
            "misses": self._stats["misses"],
            "total_requests": total,
            "hit_rate": round(hit_rate, 2),
            "memory_entries": len(self._memory_cache),
            "file_entries": file_count,
            "cache_dir": self.cache_dir,
        }

    def reset_stats(self) -> None:
        """Reset cache statistics."""
        self._stats = {
            "memory_hits": 0,
            "file_hits": 0,
            "misses": 0,
        }


# Global cache instance
_cache: Optional[LLMCache] = None


def get_cache() -> LLMCache:
    """
    Get or create the global cache instance.

    Returns:
        The global LLMCache instance
    """
    global _cache
    if _cache is None:
        _cache = LLMCache()
    return _cache


def reset_cache() -> None:
    """Reset the global cache instance (useful for testing)."""
    global _cache
    _cache = None


# =============================================================================
# Decorator for easy caching
# =============================================================================

def cached_llm_call(
    prefix: str,
    ttl_hours: int = DEFAULT_TTL_HOURS,
    key_params: Optional[list[str]] = None,
):
    """
    Decorator for caching LLM calls.

    The cache key is generated from the prefix and function arguments.
    Works with both sync and async functions.

    Args:
        prefix: Cache key prefix (e.g., "intro_page", "word_problem")
        ttl_hours: Time-to-live in hours (default 168 = 1 week)
        key_params: Optional list of parameter names to include in cache key.
                   If None, all arguments are included.

    Usage:
        @cached_llm_call("intro_page", ttl_hours=168)
        async def generate_intro_page(subject: str, topic: str, grade: int) -> str:
            # LLM call here
            return intro_text

        @cached_llm_call("word_problem", ttl_hours=24, key_params=["operation", "context_type"])
        def generate_word_problem(operation: str, fractions: list, context_type: str) -> dict:
            # LLM call here
            return result
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        import asyncio
        import inspect

        @wraps(func)
        async def async_wrapper(*args, **kwargs) -> T:
            cache = get_cache()

            # Build key params from function signature
            sig = inspect.signature(func)
            bound = sig.bind(*args, **kwargs)
            bound.apply_defaults()

            if key_params:
                cache_kwargs = {k: v for k, v in bound.arguments.items() if k in key_params}
            else:
                cache_kwargs = dict(bound.arguments)

            return await cache.get_or_generate(
                prefix=prefix,
                generator=lambda: func(*args, **kwargs),
                ttl=timedelta(hours=ttl_hours),
                **cache_kwargs
            )

        @wraps(func)
        def sync_wrapper(*args, **kwargs) -> T:
            cache = get_cache()

            # Build key params from function signature
            sig = inspect.signature(func)
            bound = sig.bind(*args, **kwargs)
            bound.apply_defaults()

            if key_params:
                cache_kwargs = {k: v for k, v in bound.arguments.items() if k in key_params}
            else:
                cache_kwargs = dict(bound.arguments)

            key = cache._make_key(prefix, **cache_kwargs)

            # Check cache
            cached = cache.get(key)
            if cached is not None:
                return cached

            # Generate and cache
            result = func(*args, **kwargs)
            cache.set(key, result, ttl=timedelta(hours=ttl_hours), params=cache_kwargs)
            return result

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


# =============================================================================
# Legacy API (backwards compatible with existing llm_service.py)
# =============================================================================

def generate_cache_key(prefix: str, **kwargs) -> str:
    """
    Generate a deterministic cache key from parameters.

    This is the legacy API for backwards compatibility.
    Prefer using get_cache() and the LLMCache methods for new code.

    Args:
        prefix: A prefix to namespace the cache key
        **kwargs: Parameters to include in the hash

    Returns:
        A deterministic cache key string
    """
    return get_cache()._make_key(prefix, **kwargs)


def get_cached(cache_key: str) -> Optional[str]:
    """
    Retrieve a cached value if it exists and hasn't expired.

    This is the legacy API for backwards compatibility.

    Args:
        cache_key: The cache key to look up

    Returns:
        The cached value, or None if not found or expired
    """
    return get_cache().get(cache_key)


def set_cached(cache_key: str, value: str, ttl_days: int = DEFAULT_TTL_DAYS) -> None:
    """
    Store a value in the cache.

    This is the legacy API for backwards compatibility.

    Args:
        cache_key: The cache key to store under
        value: The value to cache
        ttl_days: Time-to-live in days
    """
    get_cache().set(cache_key, value, ttl=timedelta(days=ttl_days))


def get_cache_stats() -> dict:
    """
    Get cache statistics.

    This is the legacy API for backwards compatibility.

    Returns:
        Dictionary with cache statistics
    """
    stats = get_cache().get_stats()
    # Return legacy format for backwards compatibility
    return {
        "hits": stats["total_hits"],
        "misses": stats["misses"],
        "total": stats["total_requests"],
        "hit_rate": stats["hit_rate"],
    }


def reset_cache_stats() -> None:
    """Reset cache statistics."""
    get_cache().reset_stats()


def clear_expired_cache() -> int:
    """
    Remove all expired cache entries.

    Returns:
        Number of expired entries removed
    """
    return get_cache().clear_expired()
