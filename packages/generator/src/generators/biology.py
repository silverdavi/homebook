"""
Biology worksheet generators - Mendelian genetics and Punnett squares.
"""

import random
import uuid
from typing import List, Tuple

from ..models import Problem, GeneratorConfig, Difficulty
from .base import BaseGenerator


class MendelianGeneticsGenerator(BaseGenerator):
    """
    Generator for Mendelian genetics problems.
    
    Topics:
    - Monohybrid crosses (single trait)
    - Dihybrid crosses (two traits) - harder
    - Dominant/recessive alleles
    - Phenotype/genotype ratios
    """
    
    topic = "mendelian-genetics"
    subtopics = [
        "monohybrid-cross",
        "dihybrid-cross",
        "test-cross",
        "incomplete-dominance",
        "pedigree-analysis",
    ]
    
    # Traits: (dominant_pheno, recessive_pheno, dom_allele, rec_allele, trait_name)
    TRAITS = [
        ("Tall", "Short", "T", "t", "plant height"),
        ("Purple", "White", "P", "p", "flower color"),
        ("Round", "Wrinkled", "R", "r", "seed shape"),
        ("Yellow", "Green", "Y", "y", "seed color"),
        ("Brown", "Blue", "B", "b", "eye color"),
        ("Dark", "Light", "D", "d", "hair color"),
        ("Attached", "Free", "A", "a", "earlobes"),
        ("Rolling", "Non-rolling", "R", "r", "tongue rolling"),
    ]
    
    def generate(self, config: GeneratorConfig) -> List[Problem]:
        """Generate genetics problems."""
        problems: List[Problem] = []
        
        difficulty = config.difficulty
        if difficulty == Difficulty.MIXED:
            difficulty = random.choice([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD])
        
        for i in range(config.num_problems):
            if difficulty == Difficulty.EASY:
                problem = self._generate_easy_problem(config, i)
            elif difficulty == Difficulty.MEDIUM:
                problem = self._generate_medium_problem(config, i)
            else:
                problem = self._generate_hard_problem(config, i)
            
            problems.append(problem)
        
        return problems
    
    def _generate_easy_problem(self, config: GeneratorConfig, index: int) -> Problem:
        """Generate easy monohybrid problem (homozygous × heterozygous)."""
        trait = random.choice(self.TRAITS)
        dom_pheno, rec_pheno, dom_allele, rec_allele, trait_name = trait
        
        # Homozygous dominant × homozygous recessive
        parent1 = f"{dom_allele}{dom_allele}"
        parent2 = f"{rec_allele}{rec_allele}"
        
        offspring_geno = f"{dom_allele}{rec_allele}"
        
        question = (
            f"Cross a homozygous {dom_pheno.lower()} ({parent1}) with a "
            f"homozygous {rec_pheno.lower()} ({parent2}) for {trait_name}. "
            f"What are the genotype and phenotype of all offspring?"
        )
        
        answer = f"100% {offspring_geno} (heterozygous), 100% {dom_pheno}"
        
        punnett_html = self._create_punnett_html(parent1, parent2, dom_allele, rec_allele)
        
        return Problem(
            id=uuid.uuid4().hex[:12],
            question_text=question,
            question_html=f'<div class="genetics-problem"><p>{question}</p>{punnett_html}</div>',
            answer=answer,
            answer_text=answer,
            hint=f"{dom_pheno} ({dom_allele}) is dominant over {rec_pheno} ({rec_allele})",
            worked_solution=self._create_solution(parent1, parent2, answer),
            visual_svg=punnett_html,
            topic="biology",
            subtopic=config.subtopic,
            difficulty=config.difficulty,
        )
    
    def _generate_medium_problem(self, config: GeneratorConfig, index: int) -> Problem:
        """Generate medium problem (heterozygous × heterozygous = 3:1 ratio)."""
        trait = random.choice(self.TRAITS)
        dom_pheno, rec_pheno, dom_allele, rec_allele, trait_name = trait
        
        parent1 = f"{dom_allele}{rec_allele}"
        parent2 = f"{dom_allele}{rec_allele}"
        
        question = (
            f"Two heterozygous ({parent1}) organisms are crossed for {trait_name}. "
            f"{dom_pheno} ({dom_allele}) is dominant. "
            f"What are the genotype and phenotype ratios of the offspring?"
        )
        
        answer = (
            f"Genotype: 1 {dom_allele}{dom_allele} : 2 {dom_allele}{rec_allele} : 1 {rec_allele}{rec_allele}, "
            f"Phenotype: 3 {dom_pheno} : 1 {rec_pheno}"
        )
        
        punnett_html = self._create_punnett_html(parent1, parent2, dom_allele, rec_allele)
        
        return Problem(
            id=uuid.uuid4().hex[:12],
            question_text=question,
            question_html=f'<div class="genetics-problem"><p>{question}</p>{punnett_html}</div>',
            answer=answer,
            answer_text=answer,
            hint="Each parent contributes one allele. Draw the Punnett square.",
            worked_solution=self._create_solution(parent1, parent2, answer),
            visual_svg=punnett_html,
            topic="biology",
            subtopic=config.subtopic,
            difficulty=config.difficulty,
        )
    
    def _generate_hard_problem(self, config: GeneratorConfig, index: int) -> Problem:
        """Generate hard problem (dihybrid cross = 9:3:3:1)."""
        traits = random.sample(self.TRAITS, 2)
        t1, t2 = traits
        
        dom1, rec1, a1_dom, a1_rec, name1 = t1
        dom2, rec2, a2_dom, a2_rec, name2 = t2
        
        parent_geno = f"{a1_dom}{a1_rec}{a2_dom}{a2_rec}"
        
        question = (
            f"Cross two organisms heterozygous for both {name1} and {name2} "
            f"(genotype: {parent_geno}). "
            f"{dom1} ({a1_dom}) and {dom2} ({a2_dom}) are dominant. "
            f"What is the phenotype ratio?"
        )
        
        answer = f"9 {dom1}/{dom2} : 3 {dom1}/{rec2} : 3 {rec1}/{dom2} : 1 {rec1}/{rec2}"
        
        return Problem(
            id=uuid.uuid4().hex[:12],
            question_text=question,
            question_html=f'<div class="genetics-problem dihybrid"><p>{question}</p></div>',
            answer=answer,
            answer_text=answer,
            hint="For dihybrid crosses, create a 4×4 Punnett square with 16 boxes.",
            worked_solution=f"1. Each parent produces 4 gamete types\n2. Create 4×4 Punnett square\n3. Count phenotype ratios: {answer}",
            topic="biology",
            subtopic=config.subtopic,
            difficulty=config.difficulty,
        )
    
    def _create_punnett_html(self, p1: str, p2: str, dom: str, rec: str) -> str:
        """Create HTML for a 2x2 Punnett square."""
        a1 = list(p1)
        a2 = list(p2)
        
        # Generate offspring genotypes
        offspring = []
        for allele1 in a1:
            for allele2 in a2:
                if allele1.isupper() or allele2.isupper():
                    combo = dom + rec if (dom in [allele1, allele2]) else allele1 + allele2
                else:
                    combo = rec + rec
                # Normalize
                if dom in [allele1, allele2]:
                    combo = dom + (rec if rec in [allele1, allele2] else dom)
                else:
                    combo = rec + rec
                offspring.append(combo)
        
        html = f'''<table class="punnett-square">
  <tr><th></th><th>{a2[0]}</th><th>{a2[1]}</th></tr>
  <tr><th>{a1[0]}</th><td>{offspring[0]}</td><td>{offspring[1]}</td></tr>
  <tr><th>{a1[1]}</th><td>{offspring[2]}</td><td>{offspring[3]}</td></tr>
</table>'''
        return html
    
    def _create_solution(self, p1: str, p2: str, answer: str) -> str:
        """Create step-by-step solution."""
        return f"""Step 1: Identify parent genotypes: {p1} × {p2}
Step 2: Determine alleles each parent can contribute
Step 3: Draw Punnett square
Step 4: Fill in offspring genotypes
Step 5: Determine phenotypes from genotypes
Answer: {answer}"""
