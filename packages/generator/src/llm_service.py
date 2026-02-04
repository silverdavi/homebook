"""
LLM Service for generating educational content.
Uses OpenAI GPT-5-mini for fast, high-quality explanations.

Includes caching to reduce API costs and latency.
"""

import json
import logging
import os
import random
from typing import Dict, List, Optional

from openai import OpenAI

from .cache import generate_cache_key, get_cached, set_cached, get_cache_stats

logger = logging.getLogger(__name__)

# Word problem context types for fraction problems
WORD_PROBLEM_CONTEXTS = [
    "cooking",
    "sports",
    "shopping",
    "crafts",
    "nature",
    "school",
]

# TTL for LLM-generated content (7 days by default)
LLM_CACHE_TTL_DAYS = int(os.environ.get("LLM_CACHE_TTL_DAYS", "7"))


def get_openai_client() -> OpenAI:
    """Get OpenAI client with API key from environment."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")
    return OpenAI(api_key=api_key)


def generate_intro_page(
    subject: str,
    topic: str,
    subtopic: str,
    grade_level: int,
    difficulty: str,
) -> str:
    """
    Generate an educational intro page explaining the concept.
    
    Returns HTML content for the intro page.
    Uses caching to avoid redundant LLM calls.
    """
    # Generate cache key from all relevant parameters
    cache_key = generate_cache_key(
        "intro_page",
        subject=subject,
        topic=topic,
        subtopic=subtopic,
        grade_level=grade_level,
        difficulty=difficulty,
    )
    
    # Check cache first
    cached_result = get_cached(cache_key)
    if cached_result is not None:
        logger.info(
            "Using cached intro page for %s/%s (grade %d, %s)",
            topic, subtopic, grade_level, difficulty
        )
        return cached_result
    
    # Cache miss - generate from LLM
    logger.info(
        "Generating intro page via LLM for %s/%s (grade %d, %s)",
        topic, subtopic, grade_level, difficulty
    )
    
    client = get_openai_client()
    
    grade_text = f"grade {grade_level}" if grade_level > 0 else "kindergarten"
    
    prompt = f"""You are an expert educational content creator. Write a clear, engaging introduction 
for a {grade_text} student about to practice {subtopic.replace('-', ' ')} in {topic}.

Requirements:
1. Write at a {grade_text} reading level
2. Include 2-3 key concepts they should remember
3. Include 1 worked example with step-by-step solution
4. Use encouraging, supportive language
5. Keep it concise (200-300 words max)
6. Format for print (no interactive elements)

Subject: {subject}
Topic: {topic}
Subtopic: {subtopic.replace('-', ' ')}
Difficulty: {difficulty}

Write the content in HTML format with proper headings (<h2>, <h3>), paragraphs (<p>), 
and lists (<ul>, <li>) as appropriate. Use <div class="key-concept"> for key concepts
and <div class="worked-example"> for the worked example."""

    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {"role": "system", "content": "You are an expert K-12 educational content writer."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=1000,
        temperature=0.7,
    )
    
    result = response.choices[0].message.content
    
    # Cache the result
    try:
        set_cached(cache_key, result, ttl_days=LLM_CACHE_TTL_DAYS)
    except Exception as e:
        # Caching failure shouldn't break generation
        logger.warning("Failed to cache intro page result: %s", e)
    
    return result


def generate_chemistry_intro(subtopic: str, grade_level: int, difficulty: str) -> str:
    """Generate intro for chemistry topics."""
    # Generate cache key
    cache_key = generate_cache_key(
        "chemistry_intro",
        subtopic=subtopic,
        grade_level=grade_level,
        difficulty=difficulty,
    )
    
    # Check cache first
    cached_result = get_cached(cache_key)
    if cached_result is not None:
        logger.info("Using cached chemistry intro for %s (grade %d)", subtopic, grade_level)
        return cached_result
    
    logger.info("Generating chemistry intro via LLM for %s (grade %d)", subtopic, grade_level)
    
    client = get_openai_client()
    
    prompt = f"""Write an educational introduction for a grade {grade_level} student about {subtopic}.
    
For balancing chemical equations, explain:
1. What a chemical equation represents
2. The law of conservation of mass
3. How to balance equations step by step
4. One worked example

Keep it at grade {grade_level} level, encouraging, and 250-300 words.
Format in HTML with <h2>, <h3>, <p>, <ul> tags. Use <div class="key-concept"> and <div class="worked-example">."""

    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {"role": "system", "content": "You are an expert chemistry teacher."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=1000,
        temperature=0.7,
    )
    
    result = response.choices[0].message.content
    
    # Cache the result
    try:
        set_cached(cache_key, result, ttl_days=LLM_CACHE_TTL_DAYS)
    except Exception as e:
        logger.warning("Failed to cache chemistry intro result: %s", e)
    
    return result


def generate_biology_intro(subtopic: str, grade_level: int, difficulty: str) -> str:
    """Generate intro for biology/genetics topics."""
    # Generate cache key
    cache_key = generate_cache_key(
        "biology_intro",
        subtopic=subtopic,
        grade_level=grade_level,
        difficulty=difficulty,
    )
    
    # Check cache first
    cached_result = get_cached(cache_key)
    if cached_result is not None:
        logger.info("Using cached biology intro for %s (grade %d)", subtopic, grade_level)
        return cached_result
    
    logger.info("Generating biology intro via LLM for %s (grade %d)", subtopic, grade_level)
    
    client = get_openai_client()
    
    prompt = f"""Write an educational introduction for a grade {grade_level} student about {subtopic}.
    
For Mendelian genetics, explain:
1. What genes and alleles are (dominant/recessive)
2. How to read a Punnett square
3. Predicting offspring traits
4. One worked example with a Punnett square

Keep it at grade {grade_level} level, encouraging, and 250-300 words.
Format in HTML with <h2>, <h3>, <p>, <ul> tags. Use <div class="key-concept"> and <div class="worked-example">.
For Punnett squares, use a simple HTML table with class="punnett-square"."""

    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {"role": "system", "content": "You are an expert biology teacher specializing in genetics."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=1200,
        temperature=0.7,
    )
    
    result = response.choices[0].message.content
    
    # Cache the result
    try:
        set_cached(cache_key, result, ttl_days=LLM_CACHE_TTL_DAYS)
    except Exception as e:
        logger.warning("Failed to cache biology intro result: %s", e)
    
    return result


def generate_word_problem_context(
    operation: str,
    fractions: List[str],
    answer: str,
    grade_level: int,
    context_type: Optional[str] = None,
) -> Dict[str, str]:
    """
    Generate a word problem context for a fraction math problem.
    
    The underlying math is deterministic - this function wraps it in an 
    engaging story. Results are cached to avoid redundant LLM calls.
    
    Args:
        operation: The math operation ("add", "subtract", "multiply", "divide")
        fractions: List of fraction strings involved (e.g., ["1/3", "1/4"])
        answer: The answer as a string (e.g., "7/12")
        grade_level: Student grade level (1-8)
        context_type: Optional context theme. If None, picked randomly.
            Options: "cooking", "sports", "shopping", "crafts", "nature", "school"
    
    Returns:
        Dict with "problem_text" (the story setup), "question" (what to solve),
        and "context_type" (the theme used)
    """
    # Pick a random context if not specified
    if context_type is None or context_type not in WORD_PROBLEM_CONTEXTS:
        context_type = random.choice(WORD_PROBLEM_CONTEXTS)
    
    # Generate cache key from all relevant parameters
    cache_key = generate_cache_key(
        "word_problem",
        operation=operation,
        fractions=sorted(fractions),
        answer=answer,
        grade_level=grade_level,
        context_type=context_type,
    )
    
    # Check cache first
    cached_result = get_cached(cache_key)
    if cached_result is not None:
        logger.info(
            "Using cached word problem for %s with %s (grade %d, %s)",
            operation, fractions, grade_level, context_type
        )
        try:
            result = json.loads(cached_result)
            result["context_type"] = context_type
            return result
        except json.JSONDecodeError:
            pass  # Fall through to regenerate
    
    # Cache miss - generate from LLM
    logger.info(
        "Generating word problem via LLM for %s with %s (grade %d, %s)",
        operation, fractions, grade_level, context_type
    )
    
    # Format fractions for the prompt
    frac_list = ", ".join(fractions)
    
    # Grade-appropriate language guidelines
    if grade_level <= 3:
        complexity = "simple sentences, familiar objects, small numbers"
    elif grade_level <= 5:
        complexity = "clear language, relatable scenarios, moderate complexity"
    else:
        complexity = "engaging scenarios, can include slightly more complex setups"
    
    # Operation-specific guidance
    op_guidance = {
        "add": "combining or putting together quantities",
        "subtract": "taking away, using up, or finding the difference",
        "multiply": "repeated groups, scaling, or finding a fraction of something",
        "divide": "sharing equally, splitting into portions, or finding how many groups",
    }
    op_hint = op_guidance.get(operation, "working with the fractions")
    
    # Context-specific examples
    context_examples = {
        "cooking": "recipes, ingredients, measuring cups, baking",
        "sports": "running distances, game scores, practice time, team activities",
        "shopping": "prices, discounts, lengths of fabric or ribbon, quantities",
        "crafts": "paint colors, paper lengths, glue amounts, project materials",
        "nature": "garden plots, animal groups, plant growth, trail distances",
        "school": "homework time, art supplies, book pages, class activities",
    }
    ctx_hint = context_examples.get(context_type, "everyday activities")
    
    prompt = f"""Create a word problem for a grade {grade_level} student.

MATH PROBLEM: {frac_list} (operation: {operation}) = {answer}

CONTEXT THEME: {context_type} ({ctx_hint})

The word problem should involve {op_hint}.

REQUIREMENTS:
1. Use {complexity}
2. The story must naturally lead to {operation}ing the fractions {frac_list}
3. The answer must be {answer}
4. Keep it under 3 sentences
5. Make it fun and relatable for a grade {grade_level} student
6. Use real-world measurements or quantities that make sense

OUTPUT FORMAT (JSON only, no other text):
{{"problem_text": "The story setup...", "question": "The question to answer..."}}

Example for addition of 1/2 + 1/4:
{{"problem_text": "Maria is making a smoothie. She adds 1/2 cup of strawberries and 1/4 cup of blueberries.", "question": "How many cups of berries did Maria use in total?"}}"""

    client = get_openai_client()
    
    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {
                "role": "system",
                "content": "You are an expert K-12 math educator who creates engaging, relatable word problems. Always respond with valid JSON only.",
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=400,
        temperature=0.7,
    )
    
    response_text = response.choices[0].message.content
    
    # Parse JSON response
    try:
        # Try to extract JSON from the response
        response_text = response_text.strip()
        if response_text.startswith("```"):
            # Remove markdown code block if present
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])
        
        result = json.loads(response_text)
        
        # Cache the result
        try:
            set_cached(cache_key, json.dumps(result), ttl_days=LLM_CACHE_TTL_DAYS)
        except Exception as e:
            logger.warning("Failed to cache word problem result: %s", e)
        
        return {
            "problem_text": result.get("problem_text", ""),
            "question": result.get("question", ""),
            "context_type": context_type,
        }
    except json.JSONDecodeError:
        logger.warning("Failed to parse LLM response as JSON: %s", response_text[:100])
        # Fallback if JSON parsing fails
        return {
            "problem_text": f"Work with {frac_list}.",
            "question": f"What is {' '.join(fractions)} when you {operation} them?",
            "context_type": context_type,
        }


def get_llm_cache_stats() -> dict:
    """
    Get cache statistics for LLM calls.
    
    Returns:
        Dictionary with hits, misses, total, and hit_rate
    """
    return get_cache_stats()
