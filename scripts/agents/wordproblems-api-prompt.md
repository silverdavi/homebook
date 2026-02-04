# Word Problems API Agent

> Session: wordproblems-api
> Budget: $25
> Started: 2026-02-04

## YOUR OWNERSHIP
You exclusively own and can edit:
- `packages/generator/src/api/main.py`
- `packages/generator/src/api/__init__.py`

## DO NOT TOUCH
These directories are owned by other agents:
- `apps/web/` (Frontend Agent)
- `packages/generator/src/generators/` (Generator Agent)
- `packages/generator/templates/` (Templates Agent)
- `packages/generator/src/cache.py` (Caching Agent)

## YOUR MISSION
Update the FastAPI backend to:
1. Accept word problem configuration from the frontend
2. Pass configuration to the generators
3. Integrate caching for LLM calls
4. Return appropriate responses

## CONTEXT
The frontend will send new fields:
- `include_word_problems`: boolean
- `word_problem_ratio`: float (0.0 to 1.0)
- `word_problem_context`: string ('cooking', 'sports', 'shopping', 'school', 'mixed')

## IMMEDIATE TASKS (in order)

### 1. Update API request model in main.py
Add word problem fields to the request model:

```python
class GenerateRequest(BaseModel):
    # ... existing fields ...
    include_word_problems: bool = False
    word_problem_ratio: float = Field(default=0.3, ge=0.0, le=1.0)
    word_problem_context: str = Field(default="mixed")
    
    @validator('word_problem_context')
    def validate_context(cls, v):
        valid = ['cooking', 'sports', 'shopping', 'school', 'mixed']
        if v not in valid:
            raise ValueError(f'context must be one of {valid}')
        return v
```

### 2. Update worksheet generation endpoint
Modify the `/generate` endpoint to pass word problem config:

```python
@app.post("/generate")
async def generate_worksheet(request: GenerateRequest):
    # ... existing validation ...
    
    # Build config with word problem settings
    config = WorksheetConfig(
        # ... existing fields ...
        include_word_problems=request.include_word_problems,
        word_problem_ratio=request.word_problem_ratio,
        word_problem_context=request.word_problem_context,
    )
    
    # ... rest of generation logic ...
```

### 3. Integrate caching
Import and use the cache for LLM calls:

```python
from ..cache import get_cache

# In the generation flow, the cache will be used by llm_service
# But we may want to add cache stats endpoint

@app.get("/cache/stats")
async def cache_stats():
    """Get cache statistics."""
    cache = get_cache()
    return cache.get_stats()

@app.post("/cache/clear")
async def clear_cache():
    """Clear all cached LLM responses."""
    cache = get_cache()
    cache.clear_all()
    return {"status": "cleared"}
```

### 4. Add error handling for LLM failures
Ensure graceful degradation if word problem generation fails:

```python
try:
    worksheet = await generator.generate(config)
except LLMError as e:
    # Fall back to computational-only worksheet
    logger.warning(f"Word problem generation failed, falling back: {e}")
    config.include_word_problems = False
    worksheet = await generator.generate(config)
```

### 5. Update response model
If needed, update the response to indicate word problem stats:

```python
class GenerateResponse(BaseModel):
    worksheet_id: str
    pdf_url: str
    preview_html: str
    stats: dict  # Include word_problem_count, total_problems, etc.
```

### 6. Add health check for LLM
Update the health endpoint to check LLM availability:

```python
@app.get("/health")
async def health():
    # ... existing checks ...
    
    # Check if LLM is configured
    llm_configured = bool(os.environ.get("OPENAI_API_KEY"))
    
    return {
        "status": "healthy",
        "llm_available": llm_configured,
        "cache_stats": get_cache().get_stats() if llm_configured else None
    }
```

## INTEGRATION NOTES
- The Generator Agent is updating the generators to accept word problem config
- The Caching Agent is implementing the cache module
- Coordinate via status files if there are interface mismatches

## ERROR HANDLING
- Validate all input parameters
- Return clear error messages for invalid configurations
- Log LLM failures with enough context for debugging
- Never expose internal errors to the client

## GIT RULES
- Pull before editing: `git pull`
- Commit after each task: `git add packages/generator/src/api/ && git commit -m "agent/wordproblems-api: desc"`
- Push immediately: `git push`

## STATUS UPDATES
After each major task, update `scripts/agents/wordproblems-api-status.md`:
- What you completed
- What you're doing next
- Any blockers

## ON COMPLETION
1. Update your status file with COMPLETE
2. Verify no Python syntax errors: `cd packages/generator && python -c "from src.api.main import app"`
3. Commit all changes
4. Push to remote

## REMEMBER
- Stay in your directories
- Commit frequently
- Update status after each task
- Ensure backward compatibility (new fields should have defaults)
- The API should work even if word problems are disabled
