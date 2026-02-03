"""Abstract base class for all problem generators."""

from abc import ABC, abstractmethod
from typing import List

from ..models import Problem, GeneratorConfig


class BaseGenerator(ABC):
    """Abstract base class for all generators."""

    topic: str
    subtopics: List[str]

    @abstractmethod
    def generate(self, config: GeneratorConfig) -> List[Problem]:
        """Generate a list of problems based on the config."""
        pass

    def supports(self, subtopic: str) -> bool:
        """Check if this generator supports a given subtopic."""
        return subtopic in self.subtopics
