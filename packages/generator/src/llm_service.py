"""
LLM Service for generating educational content.
Uses OpenAI GPT-5-mini for fast, high-quality explanations.
"""

import os
from openai import OpenAI


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
    """
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
    
    return response.choices[0].message.content


def generate_chemistry_intro(subtopic: str, grade_level: int, difficulty: str) -> str:
    """Generate intro for chemistry topics."""
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
    
    return response.choices[0].message.content


def generate_biology_intro(subtopic: str, grade_level: int, difficulty: str) -> str:
    """Generate intro for biology/genetics topics."""
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
    
    return response.choices[0].message.content
