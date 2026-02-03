"""Generator registry for discovering and dispatching generators."""

from typing import Dict, Optional

from .base import BaseGenerator


_registry: Dict[str, BaseGenerator] = {}


def register(generator: BaseGenerator) -> None:
    """Register a generator instance."""
    _registry[generator.topic] = generator


def get_generator(topic: str) -> Optional[BaseGenerator]:
    """Get a generator by topic name."""
    return _registry.get(topic)


def get_all_generators() -> Dict[str, BaseGenerator]:
    """Get all registered generators."""
    return dict(_registry)


# Auto-register generators on import
def _auto_register() -> None:
    from .fractions import FractionGenerator
    register(FractionGenerator())


_auto_register()
