# Word Problems Generator Agent

> Session: wordproblems-generator
> Budget: $50
> Started: 2026-02-04

## YOUR OWNERSHIP
You exclusively own and can edit:
- `packages/generator/src/generators/` (all generator files)
- `packages/generator/src/llm_service.py`
- `packages/generator/src/models.py`

## DO NOT TOUCH
These directories are owned by other agents:
- `apps/web/` (Frontend Agent)
- `packages/generator/templates/` (Templates Agent)
- `packages/generator/src/api/` (API Agent)

## YOUR MISSION
Add word problem generation capability to the worksheet generators. Word problems use LLM for creative real-world contexts, but the underlying math remains deterministic.

## CONTEXT
Currently, all generators only produce computational problems (e.g., "1/2 + 1/4 = ?"). We need word problems like:
- "Emma ate 1/3 of a pizza. Her brother ate 1/4. How much did they eat together?"
- "A recipe calls for 2/3 cup of flour. If you want to make half the recipe, how much flour do you need?"

The LLM generates the story context; Python calculates the actual answer.

## IMMEDIATE TASKS (in order)

### 1. Update models.py
Add word problem configuration to the models:
```python
@dataclass
class WordProblemConfig:
    enabled: bool = False
    context_type: str = "mixed"  # cooking, sports, shopping, school, mixed
    word_problem_ratio: float = 0.3  # 30% word problems by default
```

Add this to ProblemConfig or as a separate field in WorksheetConfig.

### 2. Update llm_service.py
Add a new function to generate word problem contexts:
```python
async def generate_word_problem_context(
    operation: str,  # "add", "subtract", "multiply", "divide", "compare"
    operands: List[Fraction],  # The actual numbers
    answer: Fraction,
    difficulty: str,
    context_type: str = "mixed",
    grade_level: str = "5"
) -> WordProblemContext:
    """
    Generate a word problem context for given math operation.
    Returns the story text and the question, but NOT the answer calculation.
    """
```

The prompt should:
- Generate age-appropriate scenarios
- Use the exact fractions provided
- Ask a question that leads to the given operation
- NOT include the answer or solution steps

Example output structure:
```python
@dataclass
class WordProblemContext:
    story: str  # "Emma ate 1/3 of a pizza. Her brother ate 1/4 of the same pizza."
    question: str  # "How much of the pizza did they eat together?"
    context_type: str  # "food"
```

### 3. Update fractions.py generator
Modify the FractionsGenerator to optionally generate word problems:

1. Add a new method `_generate_word_problem()` that:
   - First generates the computational problem (numbers + answer)
   - Then calls LLM to wrap it in a word problem context
   - Combines them into a Problem with `is_word_problem=True`

2. Modify `generate()` to mix word problems based on `word_problem_ratio`:
   - If ratio is 0.3 and num_problems is 10, generate ~3 word problems
   - Distribute word problems throughout (not all at the end)

3. Word problems should still have:
   - The correct answer (calculated deterministically)
   - Hints (slightly modified for word problem context)
   - Worked solutions (include extracting numbers from the story)

### 4. Add word problem hints
Create hint templates for word problems:
- "First, identify the fractions in the problem: {frac1} and {frac2}"
- "This is an addition problem because..."
- "The question asks 'how much together' which means..."

### 5. Update Problem dataclass
Add fields to the Problem model:
```python
@dataclass
class Problem:
    # ... existing fields ...
    is_word_problem: bool = False
    word_problem_context: Optional[WordProblemContext] = None
```

## OUTPUT FORMAT / CONVENTIONS
- Use async/await for LLM calls
- Keep deterministic math separate from LLM-generated content
- Add type hints to all new functions
- Follow existing code style (black formatting, docstrings)

## ERROR HANDLING
- If LLM fails, fall back to computational problem (log warning)
- Validate LLM output contains required fractions
- Set timeout for LLM calls (10 seconds)

## GIT RULES
- Pull before editing: `git pull`
- Commit after each task: `git add packages/generator/src/generators/ packages/generator/src/llm_service.py packages/generator/src/models.py && git commit -m "agent/wordproblems-generator: desc"`
- Push immediately: `git push`

## STATUS UPDATES
After each major task, update `scripts/agents/wordproblems-generator-status.md`:
- What you completed
- What you're doing next
- Any blockers

## ON COMPLETION
1. Update your status file with COMPLETE
2. Verify no Python syntax errors: `cd packages/generator && python -c "from src.generators.fractions import FractionsGenerator"`
3. Commit all changes
4. Push to remote

## REMEMBER
- Stay in your directories
- Commit frequently
- Update status after each task
- The LLM generates context only; math is always deterministic
- Handle LLM failures gracefully with fallbacks
