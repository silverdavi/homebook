"""
Physics worksheet generators - Forces, motion, energy, circuits.
"""

import math
import random
import uuid
from typing import List, Dict, Any, Optional, Tuple

from ..models import Problem, GeneratorConfig, Difficulty
from .base import BaseGenerator


class PhysicsGenerator(BaseGenerator):
    """
    Generator for physics problems across mechanics, electricity, and waves.

    Topics:
    - mechanics: force-and-motion, speed-velocity, newtons-laws, work-and-energy
    - electricity: simple-circuits, ohms-law
    - waves: waves-and-sound, light-and-optics
    """

    topic = "physics"
    subtopics = [
        # Mechanics
        "force-and-motion",
        "speed-velocity",
        "newtons-laws",
        "work-and-energy",
        # Electricity
        "simple-circuits",
        "ohms-law",
        # Waves
        "waves-and-sound",
        "light-and-optics",
    ]

    # ------------------------------------------------------------------ #
    # Dispatch
    # ------------------------------------------------------------------ #

    def generate(self, config: GeneratorConfig) -> List[Problem]:
        """Generate physics problems based on config."""
        problems: List[Problem] = []
        seen: set = set()

        dispatch = {
            "force-and-motion": self._generate_force_and_motion,
            "speed-velocity": self._generate_speed_velocity,
            "newtons-laws": self._generate_newtons_laws,
            "work-and-energy": self._generate_work_and_energy,
            "simple-circuits": self._generate_simple_circuits,
            "ohms-law": self._generate_ohms_law,
            "waves-and-sound": self._generate_waves_and_sound,
            "light-and-optics": self._generate_light_and_optics,
        }

        generator_fn = dispatch.get(config.subtopic)
        if generator_fn is None:
            return problems

        attempts = 0
        max_attempts = config.num_problems * 20

        while len(problems) < config.num_problems and attempts < max_attempts:
            attempts += 1
            difficulty = self._pick_difficulty(config.difficulty)
            problem = generator_fn(config, difficulty)

            key = problem.question_text
            if key in seen:
                continue
            seen.add(key)
            problems.append(problem)

        return problems

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #

    @staticmethod
    def _pick_difficulty(difficulty: Difficulty) -> Difficulty:
        if difficulty == Difficulty.MIXED:
            return random.choice([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD])
        return difficulty

    @staticmethod
    def _r(value: float, decimals: int = 2) -> float:
        """Round to *decimals* places; drop trailing zeros for display."""
        return round(value, decimals)

    @staticmethod
    def _fmt(value: float) -> str:
        """Format a number for display – integers show as ints."""
        if value == int(value):
            return str(int(value))
        return f"{value:.2f}".rstrip("0").rstrip(".")

    def _make_problem(
        self,
        config: GeneratorConfig,
        difficulty: Difficulty,
        question_text: str,
        question_html: str,
        answer: Any,
        answer_text: str,
        hint: Optional[str] = None,
        worked_solution: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Problem:
        return Problem(
            id=uuid.uuid4().hex[:12],
            question_text=question_text,
            question_html=question_html,
            answer=answer,
            answer_text=answer_text,
            hint=hint if config.include_hints else None,
            worked_solution=worked_solution if config.include_worked_examples else None,
            topic="physics",
            subtopic=config.subtopic,
            difficulty=difficulty,
            metadata=metadata or {},
        )

    # ================================================================== #
    #  MECHANICS – force-and-motion
    # ================================================================== #

    def _generate_force_and_motion(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        if difficulty == Difficulty.EASY:
            return self._fm_easy(config, difficulty)
        elif difficulty == Difficulty.MEDIUM:
            return self._fm_medium(config, difficulty)
        return self._fm_hard(config, difficulty)

    def _fm_easy(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """F = ma, solve for acceleration."""
        templates = [
            ("box", "pushed"),
            ("cart", "pulled"),
            ("sled", "pushed"),
            ("toy car", "pushed"),
            ("wagon", "pulled"),
            ("crate", "pushed"),
            ("ball", "kicked with"),
            ("block", "pushed"),
            ("skateboard", "pushed with"),
            ("chair", "pushed"),
            ("bicycle", "pedaled with"),
            ("puck", "hit with"),
        ]
        obj, verb = random.choice(templates)
        mass = random.choice([2, 3, 4, 5, 6, 8, 10, 12, 15, 20])
        force = random.choice([10, 15, 20, 24, 30, 36, 40, 50, 60])
        accel = self._r(force / mass)
        a_str = self._fmt(accel)

        q_text = f"A {mass} kg {obj} is {verb} with {force} N of force. What is its acceleration?"
        q_html = (
            f'<div class="physics-problem">'
            f"<p>A {mass} kg {obj} is {verb} with {force} N of force. "
            f"What is its acceleration?</p></div>"
        )
        answer_text = f"{a_str} m/s²"
        hint = "Use Newton's second law: F = m × a, so a = F ÷ m."
        worked = (
            f"Step 1: Identify knowns: F = {force} N, m = {mass} kg\n"
            f"Step 2: Use F = m × a → a = F ÷ m\n"
            f"Step 3: a = {force} ÷ {mass} = {a_str} m/s²"
        )
        return self._make_problem(config, difficulty, q_text, q_html, accel, answer_text, hint, worked)

    def _fm_medium(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Net force with friction."""
        templates = [
            ("box", "pushed across a floor"),
            ("crate", "dragged along the ground"),
            ("sled", "pulled across ice"),
            ("desk", "pushed across a room"),
            ("block", "slid across a surface"),
            ("cart", "pushed along a track"),
            ("chair", "pushed across tile"),
            ("pallet", "pushed across concrete"),
            ("trunk", "dragged across a carpet"),
            ("table", "pushed across a floor"),
            ("barrel", "rolled across a surface"),
            ("bin", "pushed along the ground"),
        ]
        obj, scenario = random.choice(templates)
        mass = random.choice([5, 8, 10, 12, 15, 20, 25])
        applied = random.choice([30, 40, 50, 60, 80, 100])
        friction = random.choice([f for f in [5, 8, 10, 12, 15, 20, 25, 30] if f < applied])
        net = applied - friction
        accel = self._r(net / mass)
        a_str = self._fmt(accel)

        q_text = (
            f"A {mass} kg {obj} is {scenario} with an applied force of {applied} N. "
            f"Friction exerts {friction} N in the opposite direction. "
            f"What is the net force and acceleration?"
        )
        q_html = (
            f'<div class="physics-problem">'
            f"<p>A {mass} kg {obj} is {scenario} with an applied force of {applied} N. "
            f"Friction exerts {friction} N in the opposite direction. "
            f"What is the net force and acceleration?</p></div>"
        )
        answer_text = f"Net force = {net} N, acceleration = {a_str} m/s²"
        hint = "Net force = applied force − friction. Then use F = m × a."
        worked = (
            f"Step 1: F_net = F_applied − F_friction = {applied} − {friction} = {net} N\n"
            f"Step 2: a = F_net ÷ m = {net} ÷ {mass} = {a_str} m/s²"
        )
        return self._make_problem(config, difficulty, q_text, q_html, {"net_force": net, "acceleration": accel}, answer_text, hint, worked)

    def _fm_hard(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Force on an inclined plane (simplified)."""
        angles = [15, 20, 25, 30, 35, 40, 45]
        angle = random.choice(angles)
        mass = random.choice([3, 5, 8, 10, 12, 15, 20])
        g = 9.8
        angle_rad = math.radians(angle)
        force_down = self._r(mass * g * math.sin(angle_rad), 1)
        f_str = self._fmt(force_down)

        q_text = (
            f"A {mass} kg object is on a frictionless inclined plane at {angle}° to the horizontal. "
            f"What is the component of gravitational force pulling it down the slope? (g = 9.8 m/s²)"
        )
        q_html = (
            f'<div class="physics-problem">'
            f"<p>A {mass} kg object is on a frictionless inclined plane at {angle}° to the horizontal. "
            f"What is the component of gravitational force pulling it down the slope? "
            f"(g = 9.8 m/s²)</p></div>"
        )
        answer_text = f"{f_str} N"
        hint = "The force down the slope = m × g × sin(θ)."
        worked = (
            f"Step 1: Identify knowns: m = {mass} kg, g = 9.8 m/s², θ = {angle}°\n"
            f"Step 2: F_parallel = m × g × sin(θ)\n"
            f"Step 3: F_parallel = {mass} × 9.8 × sin({angle}°)\n"
            f"Step 4: F_parallel = {mass} × 9.8 × {self._fmt(self._r(math.sin(angle_rad), 4))}\n"
            f"Step 5: F_parallel = {f_str} N"
        )
        return self._make_problem(config, difficulty, q_text, q_html, force_down, answer_text, hint, worked)

    # ================================================================== #
    #  MECHANICS – speed-velocity
    # ================================================================== #

    def _generate_speed_velocity(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        if difficulty == Difficulty.EASY:
            return self._sv_easy(config, difficulty)
        elif difficulty == Difficulty.MEDIUM:
            return self._sv_medium(config, difficulty)
        return self._sv_hard(config, difficulty)

    def _sv_easy(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """speed = distance / time."""
        scenarios: List[Tuple[str, str, int, int]] = [
            ("car", "drives", random.choice([80, 100, 120, 150, 180, 200, 250]), random.choice([2, 3, 4, 5])),
            ("cyclist", "rides", random.choice([10, 15, 20, 24, 30, 36]), random.choice([1, 2, 3])),
            ("train", "travels", random.choice([200, 240, 300, 360, 400, 480]), random.choice([2, 3, 4, 6])),
            ("runner", "runs", random.choice([4, 6, 8, 10, 12]), random.choice([1, 2])),
            ("airplane", "flies", random.choice([900, 1200, 1500, 1800]), random.choice([2, 3, 4])),
            ("boat", "sails", random.choice([30, 40, 50, 60, 80, 100]), random.choice([2, 4, 5])),
            ("bus", "drives", random.choice([60, 80, 90, 100, 120]), random.choice([2, 3, 4])),
            ("walker", "walks", random.choice([3, 4, 5, 6, 8]), random.choice([1, 2])),
            ("horse", "gallops", random.choice([20, 30, 40, 50, 60]), random.choice([1, 2])),
            ("scooter", "travels", random.choice([10, 15, 20, 25, 30]), random.choice([1, 2])),
            ("truck", "drives", random.choice([100, 150, 200, 250, 300]), random.choice([2, 3, 5])),
            ("ship", "sails", random.choice([100, 150, 200, 250, 300]), random.choice([5, 6, 8, 10])),
        ]
        obj, verb, dist, time = random.choice(scenarios)
        speed = self._r(dist / time)
        s_str = self._fmt(speed)

        q_text = f"A {obj} {verb} {dist} km in {time} hours. What is its average speed?"
        q_html = (
            f'<div class="physics-problem">'
            f"<p>A {obj} {verb} {dist} km in {time} hours. "
            f"What is its average speed?</p></div>"
        )
        answer_text = f"{s_str} km/h"
        hint = "Speed = distance ÷ time."
        worked = (
            f"Step 1: speed = distance ÷ time\n"
            f"Step 2: speed = {dist} km ÷ {time} h = {s_str} km/h"
        )
        return self._make_problem(config, difficulty, q_text, q_html, speed, answer_text, hint, worked)

    def _sv_medium(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Unit conversion m/s ↔ km/h or two-part journey."""
        variant = random.choice(["conversion", "two_part"])

        if variant == "conversion":
            speed_ms = random.choice([5, 8, 10, 12, 15, 20, 25, 30, 40, 50])
            speed_kmh = self._r(speed_ms * 3.6)
            s_str = self._fmt(speed_kmh)

            q_text = f"Convert {speed_ms} m/s to km/h."
            q_html = (
                f'<div class="physics-problem">'
                f"<p>Convert {speed_ms} m/s to km/h.</p></div>"
            )
            answer_text = f"{s_str} km/h"
            hint = "Multiply m/s by 3.6 to get km/h."
            worked = (
                f"Step 1: 1 m/s = 3.6 km/h\n"
                f"Step 2: {speed_ms} m/s × 3.6 = {s_str} km/h"
            )
            return self._make_problem(config, difficulty, q_text, q_html, speed_kmh, answer_text, hint, worked)
        else:
            d1 = random.choice([40, 50, 60, 80, 100, 120])
            t1 = random.choice([1, 2])
            d2 = random.choice([60, 80, 100, 120, 150, 180])
            t2 = random.choice([2, 3])
            total_d = d1 + d2
            total_t = t1 + t2
            avg_speed = self._r(total_d / total_t)
            a_str = self._fmt(avg_speed)

            q_text = (
                f"A car drives {d1} km in {t1} hours, then {d2} km in {t2} hours. "
                f"What is the average speed for the whole journey?"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>A car drives {d1} km in {t1} hour{'s' if t1 > 1 else ''}, "
                f"then {d2} km in {t2} hours. "
                f"What is the average speed for the whole journey?</p></div>"
            )
            answer_text = f"{a_str} km/h"
            hint = "Average speed = total distance ÷ total time."
            worked = (
                f"Step 1: Total distance = {d1} + {d2} = {total_d} km\n"
                f"Step 2: Total time = {t1} + {t2} = {total_t} h\n"
                f"Step 3: Average speed = {total_d} ÷ {total_t} = {a_str} km/h"
            )
            return self._make_problem(config, difficulty, q_text, q_html, avg_speed, answer_text, hint, worked)

    def _sv_hard(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Relative motion."""
        v_a = random.choice([40, 50, 60, 70, 80, 90, 100, 110])
        v_b = random.choice([v for v in [30, 40, 50, 60, 70, 80, 90] if v != v_a])
        direction = random.choice(["same", "opposite"])

        if direction == "same":
            rel = abs(v_a - v_b)
            dir_text = "in the same direction"
            explanation = f"|{v_a} − {v_b}| = {rel} km/h"
        else:
            rel = v_a + v_b
            dir_text = "toward each other"
            explanation = f"{v_a} + {v_b} = {rel} km/h"

        q_text = (
            f"Car A travels at {v_a} km/h and Car B travels at {v_b} km/h "
            f"{dir_text}. What is the relative speed of Car A with respect to Car B?"
        )
        q_html = (
            f'<div class="physics-problem">'
            f"<p>Car A travels at {v_a} km/h and Car B travels at {v_b} km/h "
            f"{dir_text}. What is the relative speed of Car A with respect to Car B?</p></div>"
        )
        answer_text = f"{rel} km/h"
        hint = "Same direction: subtract speeds. Opposite direction: add speeds."
        worked = (
            f"Step 1: Cars are moving {dir_text}\n"
            f"Step 2: Relative speed = {explanation}"
        )
        return self._make_problem(config, difficulty, q_text, q_html, rel, answer_text, hint, worked)

    # ================================================================== #
    #  MECHANICS – newtons-laws
    # ================================================================== #

    def _generate_newtons_laws(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        if difficulty == Difficulty.EASY:
            return self._nl_easy(config, difficulty)
        elif difficulty == Difficulty.MEDIUM:
            return self._nl_medium(config, difficulty)
        return self._nl_hard(config, difficulty)

    def _nl_easy(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Identify which Newton's law applies."""
        scenarios = [
            ("A book stays at rest on a table until someone pushes it.", "1st", "An object at rest stays at rest unless acted on by an unbalanced force."),
            ("A soccer ball accelerates when kicked.", "2nd", "The acceleration depends on the force applied and the mass (F = ma)."),
            ("When you push a wall, the wall pushes back on you.", "3rd", "Every action has an equal and opposite reaction."),
            ("A hockey puck slides across ice with almost no friction and keeps moving.", "1st", "An object in motion stays in motion unless acted on by an unbalanced force."),
            ("A heavier bowling ball needs more force to accelerate than a lighter one.", "2nd", "More mass requires more force for the same acceleration (F = ma)."),
            ("A swimmer pushes water backward and moves forward.", "3rd", "The reaction force propels the swimmer forward."),
            ("Passengers lurch forward when a bus stops suddenly.", "1st", "The passengers' bodies tend to remain in motion (inertia)."),
            ("A rocket pushes exhaust gases downward and rises upward.", "3rd", "The exhaust gases push back on the rocket (action-reaction)."),
            ("A shopping cart with more groceries is harder to push.", "2nd", "Greater mass means greater force is needed for the same acceleration."),
            ("A coin on a card stays in place when the card is flicked away.", "1st", "The coin's inertia keeps it at rest."),
            ("A tennis racket pushes the ball, and the ball pushes back on the racket.", "3rd", "Action-reaction pair between racket and ball."),
            ("Pedaling harder on a bicycle makes you accelerate faster.", "2nd", "Greater force causes greater acceleration (F = ma)."),
        ]
        scenario, law, explanation = random.choice(scenarios)

        q_text = f"Which of Newton's laws best describes: \"{scenario}\""
        q_html = (
            f'<div class="physics-problem">'
            f"<p>Which of Newton's laws best describes the following scenario?</p>"
            f'<blockquote>"{scenario}"</blockquote></div>'
        )
        answer_text = f"Newton's {law} Law"
        hint = "1st Law = inertia, 2nd Law = F = ma, 3rd Law = action-reaction."
        worked = (
            f"Step 1: Read the scenario: \"{scenario}\"\n"
            f"Step 2: {explanation}\n"
            f"Step 3: This is Newton's {law} Law."
        )
        return self._make_problem(config, difficulty, q_text, q_html, law, answer_text, hint, worked)

    def _nl_medium(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """F = ma calculations."""
        variant = random.choice(["find_force", "find_mass", "find_accel"])
        mass = random.choice([2, 3, 4, 5, 8, 10, 12, 15, 20, 25])
        accel = random.choice([1.5, 2, 2.5, 3, 4, 5, 6, 8, 10])
        force = self._r(mass * accel)

        if variant == "find_force":
            q_text = f"What force is needed to accelerate a {mass} kg object at {self._fmt(accel)} m/s²?"
            q_html = (
                f'<div class="physics-problem">'
                f"<p>What force is needed to accelerate a {mass} kg object at "
                f"{self._fmt(accel)} m/s²?</p></div>"
            )
            answer = force
            answer_text = f"{self._fmt(force)} N"
            worked = (
                f"Step 1: F = m × a\n"
                f"Step 2: F = {mass} × {self._fmt(accel)} = {self._fmt(force)} N"
            )
        elif variant == "find_mass":
            q_text = (
                f"A force of {self._fmt(force)} N causes an object to accelerate at "
                f"{self._fmt(accel)} m/s². What is the mass of the object?"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>A force of {self._fmt(force)} N causes an object to accelerate at "
                f"{self._fmt(accel)} m/s². What is the mass of the object?</p></div>"
            )
            answer = mass
            answer_text = f"{mass} kg"
            worked = (
                f"Step 1: F = m × a → m = F ÷ a\n"
                f"Step 2: m = {self._fmt(force)} ÷ {self._fmt(accel)} = {mass} kg"
            )
        else:
            q_text = (
                f"A {mass} kg object has a net force of {self._fmt(force)} N acting on it. "
                f"What is its acceleration?"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>A {mass} kg object has a net force of {self._fmt(force)} N acting on it. "
                f"What is its acceleration?</p></div>"
            )
            answer = accel
            answer_text = f"{self._fmt(accel)} m/s²"
            worked = (
                f"Step 1: F = m × a → a = F ÷ m\n"
                f"Step 2: a = {self._fmt(force)} ÷ {mass} = {self._fmt(accel)} m/s²"
            )

        hint = "Newton's 2nd Law: F = m × a. Rearrange to find the unknown."
        return self._make_problem(config, difficulty, q_text, q_html, answer, answer_text, hint, worked)

    def _nl_hard(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Equilibrium / action-reaction problems."""
        variant = random.choice(["equilibrium", "action_reaction"])

        if variant == "equilibrium":
            mass = random.choice([5, 8, 10, 12, 15, 20, 25])
            g = 9.8
            weight = self._r(mass * g, 1)
            w_str = self._fmt(weight)

            f1 = random.choice([20, 25, 30, 35, 40, 50])
            f2 = self._r(weight - f1, 1)
            # Ensure f2 is positive and reasonable
            if f2 <= 0:
                f1 = random.choice([f for f in [10, 15, 20, 25] if f < weight])
                f2 = self._r(weight - f1, 1)
            f2_str = self._fmt(f2)

            q_text = (
                f"A {mass} kg object hangs in equilibrium from two ropes. "
                f"The vertical component of tension in the first rope is {f1} N. "
                f"What is the vertical component of tension in the second rope? (g = 9.8 m/s²)"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>A {mass} kg object hangs in equilibrium from two ropes. "
                f"The vertical component of tension in the first rope is {f1} N. "
                f"What is the vertical component of tension in the second rope? "
                f"(g = 9.8 m/s²)</p></div>"
            )
            answer_text = f"{f2_str} N"
            hint = "In equilibrium, the sum of all forces equals zero. Weight = T₁ + T₂."
            worked = (
                f"Step 1: Weight = m × g = {mass} × 9.8 = {w_str} N\n"
                f"Step 2: In equilibrium: T₁ + T₂ = Weight\n"
                f"Step 3: T₂ = {w_str} − {f1} = {f2_str} N"
            )
            return self._make_problem(config, difficulty, q_text, q_html, f2, answer_text, hint, worked)

        else:
            pairs = [
                ("A person pushes a shopping cart with 40 N.", 40, "The cart pushes back on the person with 40 N."),
                ("A hammer strikes a nail with 500 N.", 500, "The nail pushes back on the hammer with 500 N."),
                ("Earth pulls a 70 kg person with 686 N.", 686, "The person pulls Earth with 686 N."),
                ("A swimmer pushes water backward with 150 N.", 150, "The water pushes the swimmer forward with 150 N."),
                ("A book pushes a table down with 15 N.", 15, "The table pushes up on the book with 15 N."),
                ("A car engine pushes exhaust backward with 3000 N.", 3000, "The exhaust pushes the car forward with 3000 N."),
                ("A diver pushes a diving board down with 600 N.", 600, "The diving board pushes the diver up with 600 N."),
                ("A cannon fires a cannonball with 5000 N.", 5000, "The cannonball pushes the cannon backward with 5000 N."),
                ("A bird pushes air downward with 5 N.", 5, "The air pushes the bird upward with 5 N."),
                ("A runner pushes the ground backward with 800 N.", 800, "The ground pushes the runner forward with 800 N."),
                ("A dog pushes the ground backward with 200 N.", 200, "The ground pushes the dog forward with 200 N."),
                ("A boat propeller pushes water backward with 2000 N.", 2000, "The water pushes the boat forward with 2000 N."),
            ]
            scenario, force_val, reaction = random.choice(pairs)

            q_text = (
                f"{scenario} According to Newton's 3rd Law, what is the reaction force?"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>{scenario} According to Newton's 3rd Law, "
                f"what is the reaction force?</p></div>"
            )
            answer_text = reaction
            hint = "Newton's 3rd Law: every action has an equal and opposite reaction."
            worked = (
                f"Step 1: The action force is {force_val} N\n"
                f"Step 2: By Newton's 3rd Law, the reaction is equal in magnitude and opposite in direction\n"
                f"Step 3: {reaction}"
            )
            return self._make_problem(config, difficulty, q_text, q_html, reaction, answer_text, hint, worked)

    # ================================================================== #
    #  MECHANICS – work-and-energy
    # ================================================================== #

    def _generate_work_and_energy(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        if difficulty == Difficulty.EASY:
            return self._we_easy(config, difficulty)
        elif difficulty == Difficulty.MEDIUM:
            return self._we_medium(config, difficulty)
        return self._we_hard(config, difficulty)

    def _we_easy(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """W = F × d."""
        objects = ["box", "crate", "sled", "cart", "table", "desk", "block", "bin", "barrel", "pallet", "trunk", "bag"]
        obj = random.choice(objects)
        force = random.choice([10, 15, 20, 25, 30, 40, 50, 60, 80, 100])
        dist = random.choice([2, 3, 4, 5, 6, 8, 10, 12, 15, 20])
        work = force * dist
        w_str = self._fmt(work)

        q_text = f"A {obj} is pushed with a force of {force} N over a distance of {dist} m. How much work is done?"
        q_html = (
            f'<div class="physics-problem">'
            f"<p>A {obj} is pushed with a force of {force} N over a distance of "
            f"{dist} m. How much work is done?</p></div>"
        )
        answer_text = f"{w_str} J"
        hint = "Work = Force × Distance (W = F × d)."
        worked = (
            f"Step 1: W = F × d\n"
            f"Step 2: W = {force} × {dist} = {w_str} J"
        )
        return self._make_problem(config, difficulty, q_text, q_html, work, answer_text, hint, worked)

    def _we_medium(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """KE or PE calculation."""
        variant = random.choice(["kinetic", "potential"])

        if variant == "kinetic":
            mass = random.choice([2, 3, 4, 5, 8, 10, 12, 15, 20])
            velocity = random.choice([3, 4, 5, 6, 8, 10, 12, 15, 20])
            ke = self._r(0.5 * mass * velocity ** 2)
            ke_str = self._fmt(ke)

            q_text = (
                f"What is the kinetic energy of a {mass} kg object moving at {velocity} m/s?"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>What is the kinetic energy of a {mass} kg object moving at "
                f"{velocity} m/s?</p></div>"
            )
            answer_text = f"{ke_str} J"
            hint = "KE = ½ × m × v²"
            worked = (
                f"Step 1: KE = ½ × m × v²\n"
                f"Step 2: KE = ½ × {mass} × {velocity}²\n"
                f"Step 3: KE = ½ × {mass} × {velocity * velocity} = {ke_str} J"
            )
            return self._make_problem(config, difficulty, q_text, q_html, ke, answer_text, hint, worked)

        else:
            mass = random.choice([2, 3, 4, 5, 8, 10, 12, 15, 20])
            height = random.choice([2, 3, 4, 5, 6, 8, 10, 12, 15, 20])
            g = 9.8
            pe = self._r(mass * g * height)
            pe_str = self._fmt(pe)

            q_text = (
                f"What is the gravitational potential energy of a {mass} kg object "
                f"at a height of {height} m? (g = 9.8 m/s²)"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>What is the gravitational potential energy of a {mass} kg object "
                f"at a height of {height} m? (g = 9.8 m/s²)</p></div>"
            )
            answer_text = f"{pe_str} J"
            hint = "PE = m × g × h"
            worked = (
                f"Step 1: PE = m × g × h\n"
                f"Step 2: PE = {mass} × 9.8 × {height} = {pe_str} J"
            )
            return self._make_problem(config, difficulty, q_text, q_html, pe, answer_text, hint, worked)

    def _we_hard(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Conservation of energy or work-energy theorem."""
        variant = random.choice(["conservation", "work_energy"])

        if variant == "conservation":
            mass = random.choice([2, 3, 4, 5, 8, 10])
            height = random.choice([3, 4, 5, 6, 8, 10, 12, 15, 20])
            g = 9.8
            pe_top = self._r(mass * g * height)
            velocity = self._r(math.sqrt(2 * g * height), 1)
            v_str = self._fmt(velocity)
            pe_str = self._fmt(pe_top)

            q_text = (
                f"A {mass} kg ball is dropped from a height of {height} m. "
                f"Using conservation of energy, what is its speed just before hitting the ground? "
                f"(g = 9.8 m/s², ignore air resistance)"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>A {mass} kg ball is dropped from a height of {height} m. "
                f"Using conservation of energy, what is its speed just before hitting the ground? "
                f"(g = 9.8 m/s², ignore air resistance)</p></div>"
            )
            answer_text = f"{v_str} m/s"
            hint = "At the top: all PE. At the bottom: all KE. PE = KE → mgh = ½mv² → v = √(2gh)."
            worked = (
                f"Step 1: PE at top = mgh = {mass} × 9.8 × {height} = {pe_str} J\n"
                f"Step 2: At the bottom, PE converts to KE: mgh = ½mv²\n"
                f"Step 3: Cancel mass: v = √(2gh) = √(2 × 9.8 × {height})\n"
                f"Step 4: v = √({self._fmt(self._r(2 * g * height, 1))}) = {v_str} m/s"
            )
            return self._make_problem(config, difficulty, q_text, q_html, velocity, answer_text, hint, worked)

        else:
            mass = random.choice([3, 4, 5, 8, 10, 12])
            v_i = 0
            force = random.choice([20, 30, 40, 50, 60, 80, 100])
            dist = random.choice([3, 4, 5, 6, 8, 10])
            work = force * dist
            v_f = self._r(math.sqrt(2 * work / mass), 1)
            v_str = self._fmt(v_f)
            w_str = self._fmt(work)

            q_text = (
                f"A {mass} kg object starts from rest. A net force of {force} N acts on it "
                f"over a distance of {dist} m. What is its final speed?"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>A {mass} kg object starts from rest. A net force of {force} N acts on it "
                f"over a distance of {dist} m. What is its final speed?</p></div>"
            )
            answer_text = f"{v_str} m/s"
            hint = "Work-energy theorem: W = ΔKE = ½mv² − 0. So v = √(2W/m)."
            worked = (
                f"Step 1: W = F × d = {force} × {dist} = {w_str} J\n"
                f"Step 2: W = ½mv² (starting from rest, so KE_i = 0)\n"
                f"Step 3: v = √(2W / m) = √(2 × {w_str} / {mass})\n"
                f"Step 4: v = √({self._fmt(self._r(2 * work / mass, 1))}) = {v_str} m/s"
            )
            return self._make_problem(config, difficulty, q_text, q_html, v_f, answer_text, hint, worked)

    # ================================================================== #
    #  ELECTRICITY – simple-circuits
    # ================================================================== #

    def _generate_simple_circuits(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        if difficulty == Difficulty.EASY:
            return self._sc_easy(config, difficulty)
        elif difficulty == Difficulty.MEDIUM:
            return self._sc_medium(config, difficulty)
        return self._sc_hard(config, difficulty)

    def _sc_easy(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Series circuit total resistance."""
        num_resistors = random.choice([2, 3])
        resistors = [random.choice([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100]) for _ in range(num_resistors)]
        total = sum(resistors)
        r_list = ", ".join(f"{r} Ω" for r in resistors)
        t_str = self._fmt(total)

        q_text = (
            f"A series circuit has resistors of {r_list}. "
            f"What is the total resistance?"
        )
        q_html = (
            f'<div class="physics-problem">'
            f"<p>A series circuit has resistors of {r_list}. "
            f"What is the total resistance?</p></div>"
        )
        answer_text = f"{t_str} Ω"
        hint = "In series: R_total = R₁ + R₂ + R₃ + …"
        r_sum = " + ".join(str(r) for r in resistors)
        worked = (
            f"Step 1: In series, resistances add up\n"
            f"Step 2: R_total = {r_sum} = {t_str} Ω"
        )
        return self._make_problem(config, difficulty, q_text, q_html, total, answer_text, hint, worked)

    def _sc_medium(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Parallel circuit total resistance."""
        num_resistors = random.choice([2, 3])
        resistors = [random.choice([10, 12, 15, 20, 24, 30, 40, 50, 60, 100]) for _ in range(num_resistors)]
        inv_sum = sum(1 / r for r in resistors)
        total = self._r(1 / inv_sum, 2)
        r_list = ", ".join(f"{r} Ω" for r in resistors)
        t_str = self._fmt(total)

        q_text = (
            f"A parallel circuit has resistors of {r_list}. "
            f"What is the total resistance?"
        )
        q_html = (
            f'<div class="physics-problem">'
            f"<p>A parallel circuit has resistors of {r_list}. "
            f"What is the total resistance?</p></div>"
        )
        answer_text = f"{t_str} Ω"
        hint = "In parallel: 1/R_total = 1/R₁ + 1/R₂ + …"
        inv_parts = " + ".join(f"1/{r}" for r in resistors)
        worked = (
            f"Step 1: In parallel: 1/R_total = {inv_parts}\n"
            f"Step 2: 1/R_total = {self._fmt(self._r(inv_sum, 4))}\n"
            f"Step 3: R_total = 1 / {self._fmt(self._r(inv_sum, 4))} = {t_str} Ω"
        )
        return self._make_problem(config, difficulty, q_text, q_html, total, answer_text, hint, worked)

    def _sc_hard(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Combined series-parallel circuit."""
        r_series = random.choice([5, 10, 15, 20, 25, 30])
        r_p1 = random.choice([10, 15, 20, 30, 40, 50, 60])
        r_p2 = random.choice([10, 15, 20, 30, 40, 50, 60])
        r_parallel = self._r(1 / (1 / r_p1 + 1 / r_p2), 2)
        total = self._r(r_series + r_parallel, 2)
        rp_str = self._fmt(r_parallel)
        t_str = self._fmt(total)

        q_text = (
            f"A circuit has a {r_series} Ω resistor in series with two parallel resistors "
            f"of {r_p1} Ω and {r_p2} Ω. What is the total resistance?"
        )
        q_html = (
            f'<div class="physics-problem">'
            f"<p>A circuit has a {r_series} Ω resistor in series with two parallel resistors "
            f"of {r_p1} Ω and {r_p2} Ω. What is the total resistance?</p></div>"
        )
        answer_text = f"{t_str} Ω"
        hint = "First find the combined parallel resistance, then add the series resistor."
        worked = (
            f"Step 1: Parallel: 1/R_p = 1/{r_p1} + 1/{r_p2}\n"
            f"Step 2: R_p = {rp_str} Ω\n"
            f"Step 3: Total = R_series + R_p = {r_series} + {rp_str} = {t_str} Ω"
        )
        return self._make_problem(config, difficulty, q_text, q_html, total, answer_text, hint, worked)

    # ================================================================== #
    #  ELECTRICITY – ohms-law
    # ================================================================== #

    def _generate_ohms_law(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        if difficulty == Difficulty.EASY:
            return self._ol_easy(config, difficulty)
        elif difficulty == Difficulty.MEDIUM:
            return self._ol_medium(config, difficulty)
        return self._ol_hard(config, difficulty)

    def _ol_easy(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """V = IR – solve for one unknown."""
        variant = random.choice(["find_v", "find_i", "find_r"])
        current = random.choice([0.5, 1, 1.5, 2, 2.5, 3, 4, 5])
        resistance = random.choice([2, 4, 5, 6, 8, 10, 12, 15, 20, 25, 50])
        voltage = self._r(current * resistance)

        if variant == "find_v":
            q_text = (
                f"A circuit has a current of {self._fmt(current)} A and a resistance of "
                f"{resistance} Ω. What is the voltage?"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>A circuit has a current of {self._fmt(current)} A and a resistance of "
                f"{resistance} Ω. What is the voltage?</p></div>"
            )
            answer = voltage
            answer_text = f"{self._fmt(voltage)} V"
            worked = (
                f"Step 1: V = I × R\n"
                f"Step 2: V = {self._fmt(current)} × {resistance} = {self._fmt(voltage)} V"
            )
        elif variant == "find_i":
            q_text = (
                f"A {self._fmt(voltage)} V battery is connected to a {resistance} Ω resistor. "
                f"What current flows through the circuit?"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>A {self._fmt(voltage)} V battery is connected to a {resistance} Ω resistor. "
                f"What current flows through the circuit?</p></div>"
            )
            answer = current
            answer_text = f"{self._fmt(current)} A"
            worked = (
                f"Step 1: V = IR → I = V / R\n"
                f"Step 2: I = {self._fmt(voltage)} / {resistance} = {self._fmt(current)} A"
            )
        else:
            q_text = (
                f"A {self._fmt(voltage)} V battery drives a current of {self._fmt(current)} A. "
                f"What is the resistance?"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>A {self._fmt(voltage)} V battery drives a current of {self._fmt(current)} A. "
                f"What is the resistance?</p></div>"
            )
            answer = resistance
            answer_text = f"{resistance} Ω"
            worked = (
                f"Step 1: V = IR → R = V / I\n"
                f"Step 2: R = {self._fmt(voltage)} / {self._fmt(current)} = {resistance} Ω"
            )

        hint = "Ohm's Law: V = I × R. Rearrange to solve for the unknown."
        return self._make_problem(config, difficulty, q_text, q_html, answer, answer_text, hint, worked)

    def _ol_medium(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Multi-step: find current, then use it to find voltage across a specific resistor."""
        v_total = random.choice([6, 9, 12, 15, 18, 24, 30])
        r1 = random.choice([2, 3, 4, 5, 6, 8, 10])
        r2 = random.choice([r for r in [2, 3, 4, 5, 6, 8, 10, 12, 15] if r != r1])
        r_total = r1 + r2
        current = self._r(v_total / r_total, 2)
        v1 = self._r(current * r1, 2)
        c_str = self._fmt(current)
        v1_str = self._fmt(v1)

        q_text = (
            f"A {v_total} V battery is connected to two resistors in series: "
            f"R₁ = {r1} Ω and R₂ = {r2} Ω. "
            f"What is the current in the circuit and the voltage across R₁?"
        )
        q_html = (
            f'<div class="physics-problem">'
            f"<p>A {v_total} V battery is connected to two resistors in series: "
            f"R<sub>1</sub> = {r1} Ω and R<sub>2</sub> = {r2} Ω. "
            f"What is the current in the circuit and the voltage across R<sub>1</sub>?</p></div>"
        )
        answer_text = f"I = {c_str} A, V₁ = {v1_str} V"
        hint = "First find total resistance (series), then I = V / R_total. Then V₁ = I × R₁."
        worked = (
            f"Step 1: R_total = R₁ + R₂ = {r1} + {r2} = {r_total} Ω\n"
            f"Step 2: I = V / R_total = {v_total} / {r_total} = {c_str} A\n"
            f"Step 3: V₁ = I × R₁ = {c_str} × {r1} = {v1_str} V"
        )
        return self._make_problem(config, difficulty, q_text, q_html, {"current": current, "v1": v1}, answer_text, hint, worked)

    def _ol_hard(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Power calculations: P = IV = I²R = V²/R."""
        variant = random.choice(["p_iv", "p_i2r", "p_v2r"])

        if variant == "p_iv":
            voltage = random.choice([6, 9, 12, 24, 120, 230])
            current = random.choice([0.5, 1, 1.5, 2, 2.5, 3, 4, 5])
            power = self._r(voltage * current)
            p_str = self._fmt(power)

            q_text = (
                f"A device draws {self._fmt(current)} A from a {voltage} V supply. "
                f"What power does it consume?"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>A device draws {self._fmt(current)} A from a {voltage} V supply. "
                f"What power does it consume?</p></div>"
            )
            answer_text = f"{p_str} W"
            worked = (
                f"Step 1: P = I × V\n"
                f"Step 2: P = {self._fmt(current)} × {voltage} = {p_str} W"
            )
        elif variant == "p_i2r":
            current = random.choice([1, 1.5, 2, 2.5, 3, 4, 5])
            resistance = random.choice([4, 5, 6, 8, 10, 12, 15, 20])
            power = self._r(current ** 2 * resistance)
            p_str = self._fmt(power)

            q_text = (
                f"A {resistance} Ω resistor carries a current of {self._fmt(current)} A. "
                f"How much power is dissipated?"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>A {resistance} Ω resistor carries a current of {self._fmt(current)} A. "
                f"How much power is dissipated?</p></div>"
            )
            answer_text = f"{p_str} W"
            worked = (
                f"Step 1: P = I² × R\n"
                f"Step 2: P = {self._fmt(current)}² × {resistance}\n"
                f"Step 3: P = {self._fmt(self._r(current ** 2))} × {resistance} = {p_str} W"
            )
        else:
            voltage = random.choice([6, 9, 12, 24, 120])
            resistance = random.choice([4, 6, 8, 10, 12, 15, 20, 24, 30])
            power = self._r(voltage ** 2 / resistance)
            p_str = self._fmt(power)

            q_text = (
                f"A {voltage} V source is connected to a {resistance} Ω resistor. "
                f"What is the power dissipated?"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>A {voltage} V source is connected to a {resistance} Ω resistor. "
                f"What is the power dissipated?</p></div>"
            )
            answer_text = f"{p_str} W"
            worked = (
                f"Step 1: P = V² / R\n"
                f"Step 2: P = {voltage}² / {resistance}\n"
                f"Step 3: P = {voltage ** 2} / {resistance} = {p_str} W"
            )

        hint = "Power formulas: P = IV, P = I²R, P = V²/R. Choose the one matching your knowns."
        return self._make_problem(config, difficulty, q_text, q_html, power, answer_text, hint, worked)

    # ================================================================== #
    #  WAVES – waves-and-sound
    # ================================================================== #

    def _generate_waves_and_sound(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        if difficulty == Difficulty.EASY:
            return self._ws_easy(config, difficulty)
        elif difficulty == Difficulty.MEDIUM:
            return self._ws_medium(config, difficulty)
        return self._ws_hard(config, difficulty)

    def _ws_easy(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """v = f × λ."""
        freq = random.choice([100, 200, 250, 300, 400, 500, 600, 800, 1000, 1500, 2000])
        wavelength = random.choice([0.2, 0.25, 0.4, 0.5, 0.8, 1, 1.5, 2, 3, 4, 5])
        speed = self._r(freq * wavelength)
        s_str = self._fmt(speed)
        w_str = self._fmt(wavelength)

        q_text = (
            f"A wave has a frequency of {freq} Hz and a wavelength of {w_str} m. "
            f"What is the wave speed?"
        )
        q_html = (
            f'<div class="physics-problem">'
            f"<p>A wave has a frequency of {freq} Hz and a wavelength of {w_str} m. "
            f"What is the wave speed?</p></div>"
        )
        answer_text = f"{s_str} m/s"
        hint = "Wave speed = frequency × wavelength (v = f × λ)."
        worked = (
            f"Step 1: v = f × λ\n"
            f"Step 2: v = {freq} × {w_str} = {s_str} m/s"
        )
        return self._make_problem(config, difficulty, q_text, q_html, speed, answer_text, hint, worked)

    def _ws_medium(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Period / frequency or speed of sound in media."""
        variant = random.choice(["period", "sound_media"])

        if variant == "period":
            freq = random.choice([50, 100, 200, 250, 400, 500, 800, 1000, 2000, 5000])
            period = self._r(1 / freq, 6)
            p_display = f"{period:.6f}".rstrip("0").rstrip(".")

            q_text = f"A sound wave has a frequency of {freq} Hz. What is its period?"
            q_html = (
                f'<div class="physics-problem">'
                f"<p>A sound wave has a frequency of {freq} Hz. "
                f"What is its period?</p></div>"
            )
            answer_text = f"{p_display} s"
            hint = "Period = 1 / frequency (T = 1/f)."
            worked = (
                f"Step 1: T = 1 / f\n"
                f"Step 2: T = 1 / {freq} = {p_display} s"
            )
            return self._make_problem(config, difficulty, q_text, q_html, period, answer_text, hint, worked)

        else:
            media = [
                ("air at 20°C", 343),
                ("water", 1480),
                ("steel", 5960),
                ("glass", 5640),
                ("wood (oak)", 3850),
                ("aluminum", 6420),
                ("helium", 1007),
                ("concrete", 3400),
                ("copper", 4600),
                ("seawater", 1530),
                ("rubber", 1600),
                ("ice", 3230),
            ]
            medium, speed = random.choice(media)
            freq = random.choice([200, 300, 400, 500, 600, 800, 1000, 1500, 2000])
            wavelength = self._r(speed / freq, 2)
            w_str = self._fmt(wavelength)

            q_text = (
                f"Sound travels at {speed} m/s in {medium}. "
                f"What is the wavelength of a {freq} Hz sound in this medium?"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>Sound travels at {speed} m/s in {medium}. "
                f"What is the wavelength of a {freq} Hz sound in this medium?</p></div>"
            )
            answer_text = f"{w_str} m"
            hint = "v = f × λ → λ = v / f."
            worked = (
                f"Step 1: λ = v / f\n"
                f"Step 2: λ = {speed} / {freq} = {w_str} m"
            )
            return self._make_problem(config, difficulty, q_text, q_html, wavelength, answer_text, hint, worked)

    def _ws_hard(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Doppler effect basics or resonance."""
        variant = random.choice(["doppler", "resonance"])

        if variant == "doppler":
            v_sound = 343
            v_source = random.choice([10, 15, 20, 25, 30, 40, 50])
            f_source = random.choice([400, 500, 600, 800, 1000])
            f_approach = self._r(f_source * v_sound / (v_sound - v_source), 1)
            f_recede = self._r(f_source * v_sound / (v_sound + v_source), 1)
            fa_str = self._fmt(f_approach)
            fr_str = self._fmt(f_recede)

            q_text = (
                f"A siren emitting {f_source} Hz moves toward you at {v_source} m/s. "
                f"What frequency do you hear? (speed of sound = {v_sound} m/s)"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>A siren emitting {f_source} Hz moves toward you at {v_source} m/s. "
                f"What frequency do you hear? (speed of sound = {v_sound} m/s)</p></div>"
            )
            answer_text = f"{fa_str} Hz"
            hint = "Doppler effect (source approaching): f' = f × v_sound / (v_sound − v_source)."
            worked = (
                f"Step 1: Source is approaching, so use f' = f × v / (v − v_s)\n"
                f"Step 2: f' = {f_source} × {v_sound} / ({v_sound} − {v_source})\n"
                f"Step 3: f' = {f_source} × {v_sound} / {v_sound - v_source}\n"
                f"Step 4: f' = {fa_str} Hz"
            )
            return self._make_problem(config, difficulty, q_text, q_html, f_approach, answer_text, hint, worked)

        else:
            harmonics = random.choice([1, 2, 3])
            tube_length = random.choice([0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0])
            v_sound = 343
            # Open tube: f_n = n × v / (2L)
            freq = self._r(harmonics * v_sound / (2 * tube_length), 1)
            f_str = self._fmt(freq)
            l_str = self._fmt(tube_length)
            harm_name = {1: "fundamental (1st harmonic)", 2: "2nd harmonic", 3: "3rd harmonic"}[harmonics]

            q_text = (
                f"An open pipe is {l_str} m long. What is the frequency of its {harm_name}? "
                f"(speed of sound = {v_sound} m/s)"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>An open pipe is {l_str} m long. What is the frequency of its "
                f"{harm_name}? (speed of sound = {v_sound} m/s)</p></div>"
            )
            answer_text = f"{f_str} Hz"
            hint = "For an open pipe: f_n = n × v / (2L), where n is the harmonic number."
            worked = (
                f"Step 1: For an open pipe, f_n = n × v / (2L)\n"
                f"Step 2: f_{harmonics} = {harmonics} × {v_sound} / (2 × {l_str})\n"
                f"Step 3: f_{harmonics} = {harmonics * v_sound} / {self._fmt(2 * tube_length)}\n"
                f"Step 4: f_{harmonics} = {f_str} Hz"
            )
            return self._make_problem(config, difficulty, q_text, q_html, freq, answer_text, hint, worked)

    # ================================================================== #
    #  WAVES – light-and-optics
    # ================================================================== #

    def _generate_light_and_optics(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        if difficulty == Difficulty.EASY:
            return self._lo_easy(config, difficulty)
        elif difficulty == Difficulty.MEDIUM:
            return self._lo_medium(config, difficulty)
        return self._lo_hard(config, difficulty)

    def _lo_easy(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Reflection – angle of incidence = angle of reflection, or speed of light."""
        variant = random.choice(["reflection", "speed_of_light"])

        if variant == "reflection":
            angle = random.choice([10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70])
            q_text = (
                f"A light ray hits a mirror at an angle of incidence of {angle}°. "
                f"What is the angle of reflection?"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>A light ray hits a mirror at an angle of incidence of {angle}°. "
                f"What is the angle of reflection?</p></div>"
            )
            answer_text = f"{angle}°"
            hint = "Law of reflection: angle of incidence = angle of reflection."
            worked = (
                f"Step 1: By the law of reflection, angle of incidence = angle of reflection\n"
                f"Step 2: Angle of reflection = {angle}°"
            )
            return self._make_problem(config, difficulty, q_text, q_html, angle, answer_text, hint, worked)

        else:
            c = 3e8
            distances = [
                ("the Sun to Earth", 1.496e11, "about 8 minutes 20 seconds"),
                ("the Moon to Earth", 3.844e8, "about 1.28 seconds"),
                ("across a 300 m football field", 300, "about 0.000001 seconds"),
            ]
            desc, dist, approx = random.choice(distances)
            time = self._r(dist / c, 2)
            # For very small or very large values use scientific notation
            if time < 0.01:
                t_display = f"{dist / c:.2e} s"
            else:
                t_display = f"{self._fmt(time)} s"

            q_text = (
                f"Light travels at 3 × 10⁸ m/s. "
                f"How long does it take light to travel from {desc} ({dist:.2e} m)?"
            )
            q_html = (
                f'<div class="physics-problem">'
                f"<p>Light travels at 3 × 10<sup>8</sup> m/s. "
                f"How long does it take light to travel from {desc} "
                f"({dist:.2e} m)?</p></div>"
            )
            answer_text = f"{t_display} ({approx})"
            hint = "time = distance / speed."
            worked = (
                f"Step 1: t = d / v\n"
                f"Step 2: t = {dist:.2e} / (3 × 10⁸)\n"
                f"Step 3: t ≈ {t_display}"
            )
            return self._make_problem(config, difficulty, q_text, q_html, time, answer_text, hint, worked)

    def _lo_medium(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Snell's law: n₁ sin θ₁ = n₂ sin θ₂."""
        media_pairs = [
            ("air", 1.00, "water", 1.33),
            ("air", 1.00, "glass", 1.50),
            ("air", 1.00, "diamond", 2.42),
            ("water", 1.33, "glass", 1.50),
            ("air", 1.00, "ice", 1.31),
            ("air", 1.00, "acrylic", 1.49),
            ("water", 1.33, "diamond", 2.42),
            ("air", 1.00, "quartz", 1.46),
            ("water", 1.33, "acrylic", 1.49),
            ("air", 1.00, "sapphire", 1.77),
            ("glass", 1.50, "water", 1.33),
            ("air", 1.00, "flint glass", 1.62),
        ]
        m1_name, n1, m2_name, n2 = random.choice(media_pairs)
        theta1 = random.choice([15, 20, 25, 30, 35, 40, 45])
        sin_theta2 = n1 * math.sin(math.radians(theta1)) / n2
        # Ensure valid (total internal reflection check)
        if abs(sin_theta2) > 1:
            theta1 = 20
            sin_theta2 = n1 * math.sin(math.radians(theta1)) / n2
        theta2 = self._r(math.degrees(math.asin(sin_theta2)), 1)
        t2_str = self._fmt(theta2)

        q_text = (
            f"Light passes from {m1_name} (n = {n1}) into {m2_name} (n = {n2}) "
            f"at an angle of incidence of {theta1}°. What is the angle of refraction?"
        )
        q_html = (
            f'<div class="physics-problem">'
            f"<p>Light passes from {m1_name} (n = {n1}) into {m2_name} (n = {n2}) "
            f"at an angle of incidence of {theta1}°. "
            f"What is the angle of refraction?</p></div>"
        )
        answer_text = f"{t2_str}°"
        hint = "Snell's Law: n₁ sin θ₁ = n₂ sin θ₂ → θ₂ = arcsin(n₁ sin θ₁ / n₂)."
        sin1 = self._fmt(self._r(math.sin(math.radians(theta1)), 4))
        worked = (
            f"Step 1: n₁ sin θ₁ = n₂ sin θ₂\n"
            f"Step 2: sin θ₂ = (n₁ / n₂) × sin θ₁\n"
            f"Step 3: sin θ₂ = ({n1} / {n2}) × sin({theta1}°)\n"
            f"Step 4: sin θ₂ = {self._fmt(self._r(n1 / n2, 4))} × {sin1} = {self._fmt(self._r(sin_theta2, 4))}\n"
            f"Step 5: θ₂ = arcsin({self._fmt(self._r(sin_theta2, 4))}) = {t2_str}°"
        )
        return self._make_problem(config, difficulty, q_text, q_html, theta2, answer_text, hint, worked)

    def _lo_hard(self, config: GeneratorConfig, difficulty: Difficulty) -> Problem:
        """Lens equation: 1/f = 1/do + 1/di."""
        focal_length = random.choice([5, 8, 10, 12, 15, 20, 25, 30])
        # Object distance must be > focal length for real image with converging lens
        do = random.choice([d for d in [10, 12, 15, 18, 20, 25, 30, 40, 50, 60] if d > focal_length])
        di = self._r(1 / (1 / focal_length - 1 / do), 1)
        di_str = self._fmt(di)

        q_text = (
            f"A converging lens has a focal length of {focal_length} cm. "
            f"An object is placed {do} cm from the lens. "
            f"Where does the image form?"
        )
        q_html = (
            f'<div class="physics-problem">'
            f"<p>A converging lens has a focal length of {focal_length} cm. "
            f"An object is placed {do} cm from the lens. "
            f"Where does the image form?</p></div>"
        )
        answer_text = f"{di_str} cm from the lens"
        hint = "Thin lens equation: 1/f = 1/d_o + 1/d_i → 1/d_i = 1/f − 1/d_o."
        worked = (
            f"Step 1: 1/f = 1/d_o + 1/d_i\n"
            f"Step 2: 1/d_i = 1/f − 1/d_o = 1/{focal_length} − 1/{do}\n"
            f"Step 3: 1/d_i = {self._fmt(self._r(1 / focal_length, 4))} − {self._fmt(self._r(1 / do, 4))}\n"
            f"Step 4: 1/d_i = {self._fmt(self._r(1 / focal_length - 1 / do, 4))}\n"
            f"Step 5: d_i = {di_str} cm"
        )
        return self._make_problem(config, difficulty, q_text, q_html, di, answer_text, hint, worked)
