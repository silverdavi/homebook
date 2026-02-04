# LLM Caching Agent

> Session: caching
> Budget: $30
> Started: 2026-02-04

## YOUR OWNERSHIP
You exclusively own and can edit:
- `packages/generator/src/cache.py`
- `packages/generator/src/config.py`

## DO NOT TOUCH
These directories are owned by other agents:
- `apps/web/` (Frontend Agent)
- `packages/generator/src/generators/` (Word Problems Agent)
- `packages/generator/templates/` (Templates Agent)

## YOUR MISSION
Implement a caching layer for LLM-generated content. This allows us to:
1. Cache intro pages by configuration
2. Cache word problem contexts by operation type
3. Reduce LLM costs and latency for repeated requests
4. Still generate fresh deterministic content each time

## CONTEXT
Currently there's a basic `cache.py` file. LLM calls happen in `llm_service.py` for:
- Intro pages (optional, enabled via config)
- Word problems (being added by another agent)

We want to cache LLM responses but NOT cache deterministic content (problems, solutions, etc.)

## IMMEDIATE TASKS (in order)

### 1. Review existing cache.py
Read the current implementation and understand what's there.

### 2. Implement robust caching layer
Update `cache.py` with a proper caching system:

```python
import hashlib
import json
from typing import Optional, Any, TypeVar, Callable
from functools import wraps
from datetime import datetime, timedelta
import os

T = TypeVar('T')

class LLMCache:
    """
    Cache for LLM-generated content.
    Supports both in-memory and file-based caching.
    """
    
    def __init__(self, cache_dir: str = ".cache/llm"):
        self.cache_dir = cache_dir
        self.memory_cache: dict[str, tuple[Any, datetime]] = {}
        self.default_ttl = timedelta(hours=24)
        os.makedirs(cache_dir, exist_ok=True)
    
    def _make_key(self, prefix: str, **kwargs) -> str:
        """Generate cache key from prefix and kwargs."""
        # Sort kwargs for consistent keys
        sorted_items = sorted(kwargs.items())
        key_str = f"{prefix}:{json.dumps(sorted_items)}"
        return hashlib.sha256(key_str.encode()).hexdigest()[:32]
    
    async def get_or_generate(
        self,
        prefix: str,
        generator: Callable[[], T],
        ttl: Optional[timedelta] = None,
        **key_params
    ) -> T:
        """
        Get from cache or generate and cache.
        
        Args:
            prefix: Cache key prefix (e.g., "intro_page", "word_problem")
            generator: Async function to generate value if not cached
            ttl: Time to live (default 24 hours)
            **key_params: Parameters that make up the cache key
        """
        key = self._make_key(prefix, **key_params)
        ttl = ttl or self.default_ttl
        
        # Check memory cache first
        if key in self.memory_cache:
            value, timestamp = self.memory_cache[key]
            if datetime.now() - timestamp < ttl:
                return value
        
        # Check file cache
        file_path = os.path.join(self.cache_dir, f"{key}.json")
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                cached_time = datetime.fromisoformat(data['timestamp'])
                if datetime.now() - cached_time < ttl:
                    value = data['value']
                    self.memory_cache[key] = (value, cached_time)
                    return value
            except (json.JSONDecodeError, KeyError):
                pass  # Cache corrupted, regenerate
        
        # Generate new value
        value = await generator()
        
        # Store in both caches
        now = datetime.now()
        self.memory_cache[key] = (value, now)
        
        try:
            with open(file_path, 'w') as f:
                json.dump({
                    'timestamp': now.isoformat(),
                    'value': value,
                    'params': key_params
                }, f, indent=2, default=str)
        except Exception:
            pass  # File cache is best-effort
        
        return value
    
    def invalidate(self, prefix: str, **key_params):
        """Invalidate a specific cache entry."""
        key = self._make_key(prefix, **key_params)
        self.memory_cache.pop(key, None)
        file_path = os.path.join(self.cache_dir, f"{key}.json")
        if os.path.exists(file_path):
            os.remove(file_path)
    
    def clear_all(self):
        """Clear all cached entries."""
        self.memory_cache.clear()
        for f in os.listdir(self.cache_dir):
            if f.endswith('.json'):
                os.remove(os.path.join(self.cache_dir, f))
    
    def get_stats(self) -> dict:
        """Get cache statistics."""
        file_count = len([f for f in os.listdir(self.cache_dir) if f.endswith('.json')])
        return {
            'memory_entries': len(self.memory_cache),
            'file_entries': file_count,
            'cache_dir': self.cache_dir
        }


# Global cache instance
_cache: Optional[LLMCache] = None

def get_cache() -> LLMCache:
    """Get or create the global cache instance."""
    global _cache
    if _cache is None:
        cache_dir = os.environ.get('LLM_CACHE_DIR', '.cache/llm')
        _cache = LLMCache(cache_dir)
    return _cache
```

### 3. Add cache configuration to config.py
Update config to include caching settings:

```python
@dataclass
class CacheConfig:
    enabled: bool = True
    cache_dir: str = ".cache/llm"
    intro_page_ttl_hours: int = 168  # 1 week
    word_problem_ttl_hours: int = 24  # 1 day
    max_memory_entries: int = 1000
```

### 4. Create cache decorator for easy use
Add a decorator that other modules can use:

```python
def cached_llm_call(prefix: str, ttl_hours: int = 24):
    """
    Decorator for caching LLM calls.
    
    Usage:
        @cached_llm_call("intro_page", ttl_hours=168)
        async def generate_intro_page(subject, topic, grade):
            # LLM call here
            return intro_text
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache = get_cache()
            # Use all args and kwargs as cache key
            key_params = {
                'args': args,
                **kwargs
            }
            return await cache.get_or_generate(
                prefix=prefix,
                generator=lambda: func(*args, **kwargs),
                ttl=timedelta(hours=ttl_hours),
                **key_params
            )
        return wrapper
    return decorator
```

### 5. Add .cache to .gitignore
Ensure the cache directory is not committed:
- Add `.cache/` to the root `.gitignore` if not already there

### 6. Add cache warming utility (optional)
Create a function to pre-warm common cache entries:

```python
async def warm_cache_for_common_configs():
    """Pre-generate cache entries for common configurations."""
    common_configs = [
        ("math", "fractions", "adding-fractions", "5", "medium"),
        ("math", "fractions", "subtracting-fractions", "5", "medium"),
        ("chemistry", "balancing-equations", "synthesis", "9", "medium"),
        # Add more common configurations
    ]
    # ... implementation
```

## INTEGRATION NOTES
The Word Problems Agent will need to use this cache. Document the usage:

```python
# In llm_service.py, usage will look like:
from cache import cached_llm_call, get_cache

@cached_llm_call("intro_page", ttl_hours=168)
async def generate_intro_page(subject: str, topic: str, grade: str) -> str:
    # Existing LLM call logic
    pass

# Or manual usage:
cache = get_cache()
result = await cache.get_or_generate(
    prefix="word_problem",
    generator=lambda: generate_word_problem_context(...),
    subject=subject,
    operation=operation,
    context_type=context_type
)
```

## GIT RULES
- Pull before editing: `git pull`
- Commit after each task: `git add packages/generator/src/cache.py packages/generator/src/config.py .gitignore && git commit -m "agent/caching: desc"`
- Push immediately: `git push`

## STATUS UPDATES
After each major task, update `scripts/agents/caching-status.md`:
- What you completed
- What you're doing next
- Any blockers

## ON COMPLETION
1. Update your status file with COMPLETE
2. Verify no Python syntax errors: `cd packages/generator && python -c "from src.cache import get_cache, cached_llm_call"`
3. Commit all changes
4. Push to remote

## REMEMBER
- Stay in your directories
- Commit frequently
- Keep the cache implementation simple and robust
- File-based cache ensures persistence across restarts
- Memory cache provides fast access for hot entries
