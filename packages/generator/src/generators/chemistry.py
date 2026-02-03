"""
Chemistry worksheet generators - Chemical equation balancing.
"""

import random
import uuid
from typing import List

from ..models import Problem, GeneratorConfig, Difficulty
from .base import BaseGenerator


class BalancingEquationsGenerator(BaseGenerator):
    """
    Generator for balancing chemical equations.
    
    Difficulty levels:
    - easy: Simple equations with 2 elements, small coefficients (1-3)
    - medium: 2-3 elements, coefficients up to 4
    - hard: 3-4 elements, coefficients up to 6
    """
    
    topic = "balancing-equations"
    subtopics = [
        "balance-synthesis",
        "balance-decomposition",
        "balance-combustion",
        "balance-single-replacement",
        "balance-double-replacement",
    ]
    
    # Pre-defined equations with solutions {unbalanced: (balanced, coefficients)}
    EASY_EQUATIONS = [
        ("H₂ + O₂ → H₂O", "2H₂ + O₂ → 2H₂O"),
        ("N₂ + H₂ → NH₃", "N₂ + 3H₂ → 2NH₃"),
        ("C + O₂ → CO₂", "C + O₂ → CO₂"),
        ("Na + Cl₂ → NaCl", "2Na + Cl₂ → 2NaCl"),
        ("Mg + O₂ → MgO", "2Mg + O₂ → 2MgO"),
        ("K + Cl₂ → KCl", "2K + Cl₂ → 2KCl"),
        ("Ca + O₂ → CaO", "2Ca + O₂ → 2CaO"),
        ("Fe + O₂ → FeO", "2Fe + O₂ → 2FeO"),
        ("Li + O₂ → Li₂O", "4Li + O₂ → 2Li₂O"),
        ("Al + O₂ → Al₂O₃", "4Al + 3O₂ → 2Al₂O₃"),
    ]
    
    MEDIUM_EQUATIONS = [
        ("CH₄ + O₂ → CO₂ + H₂O", "CH₄ + 2O₂ → CO₂ + 2H₂O"),
        ("C₂H₆ + O₂ → CO₂ + H₂O", "2C₂H₆ + 7O₂ → 4CO₂ + 6H₂O"),
        ("Fe + HCl → FeCl₂ + H₂", "Fe + 2HCl → FeCl₂ + H₂"),
        ("Zn + HCl → ZnCl₂ + H₂", "Zn + 2HCl → ZnCl₂ + H₂"),
        ("NaOH + HCl → NaCl + H₂O", "NaOH + HCl → NaCl + H₂O"),
        ("CaCO₃ → CaO + CO₂", "CaCO₃ → CaO + CO₂"),
        ("H₂O₂ → H₂O + O₂", "2H₂O₂ → 2H₂O + O₂"),
        ("KClO₃ → KCl + O₂", "2KClO₃ → 2KCl + 3O₂"),
        ("Mg + HCl → MgCl₂ + H₂", "Mg + 2HCl → MgCl₂ + H₂"),
        ("Al + HCl → AlCl₃ + H₂", "2Al + 6HCl → 2AlCl₃ + 3H₂"),
    ]
    
    HARD_EQUATIONS = [
        ("C₃H₈ + O₂ → CO₂ + H₂O", "C₃H₈ + 5O₂ → 3CO₂ + 4H₂O"),
        ("C₆H₁₂O₆ + O₂ → CO₂ + H₂O", "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O"),
        ("Fe₂O₃ + CO → Fe + CO₂", "Fe₂O₃ + 3CO → 2Fe + 3CO₂"),
        ("Al₂O₃ + HCl → AlCl₃ + H₂O", "Al₂O₃ + 6HCl → 2AlCl₃ + 3H₂O"),
        ("Ca(OH)₂ + HCl → CaCl₂ + H₂O", "Ca(OH)₂ + 2HCl → CaCl₂ + 2H₂O"),
        ("NH₄NO₃ → N₂O + H₂O", "NH₄NO₃ → N₂O + 2H₂O"),
        ("Cu + HNO₃ → Cu(NO₃)₂ + NO + H₂O", "3Cu + 8HNO₃ → 3Cu(NO₃)₂ + 2NO + 4H₂O"),
        ("FeS₂ + O₂ → Fe₂O₃ + SO₂", "4FeS₂ + 11O₂ → 2Fe₂O₃ + 8SO₂"),
    ]
    
    def generate(self, config: GeneratorConfig) -> List[Problem]:
        """Generate balancing equation problems."""
        problems: List[Problem] = []
        
        # Select equation pool based on difficulty
        difficulty = config.difficulty
        if difficulty == Difficulty.MIXED:
            difficulty = random.choice([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD])
        
        if difficulty == Difficulty.EASY:
            pool = self.EASY_EQUATIONS
        elif difficulty == Difficulty.MEDIUM:
            pool = self.MEDIUM_EQUATIONS
        else:
            pool = self.HARD_EQUATIONS
        
        seen = set()
        attempts = 0
        max_attempts = config.num_problems * 10
        
        while len(problems) < config.num_problems and attempts < max_attempts:
            attempts += 1
            unbalanced, balanced = random.choice(pool)
            
            if unbalanced in seen:
                continue
            seen.add(unbalanced)
            
            problem = Problem(
                id=uuid.uuid4().hex[:12],
                question_text=f"Balance: {unbalanced}",
                question_html=f'<div class="equation-problem">Balance the equation:<br><span class="chemical-equation">{unbalanced}</span></div>',
                answer=balanced,
                answer_text=balanced,
                hint=self._generate_hint(),
                worked_solution=self._generate_solution(unbalanced, balanced),
                topic="chemistry",
                subtopic=config.subtopic,
                difficulty=config.difficulty,
            )
            problems.append(problem)
        
        return problems
    
    def _generate_hint(self) -> str:
        """Generate a hint for the problem."""
        hints = [
            "Count atoms on each side first",
            "Start with the most complex molecule",
            "Balance metals first, then non-metals",
            "Coefficients multiply ALL atoms in a compound",
            "Try balancing hydrogen and oxygen last",
        ]
        return random.choice(hints)
    
    def _generate_solution(self, unbalanced: str, balanced: str) -> str:
        """Generate step-by-step solution."""
        return f"""Step 1: Write the unbalanced equation: {unbalanced}
Step 2: Count atoms on each side
Step 3: Add coefficients to balance each element
Step 4: Verify all atoms are balanced
Final answer: {balanced}"""
