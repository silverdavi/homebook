"""
Earth Science worksheet generators - Geology, weather, water cycle, space.

Multiple-choice and fill-in-the-blank problems with randomized option ordering.
"""

import random
import uuid
from typing import List, Tuple

from ..models import Problem, GeneratorConfig, Difficulty
from .base import BaseGenerator


def _mc_html(question: str, choices: List[str], correct_idx: int) -> Tuple[str, str, str]:
    """Build MC question. Returns (question_html, answer_text, question_text).
    
    Shuffles choices and tracks the correct answer position.
    """
    labels = ["A", "B", "C", "D"]
    indexed = list(enumerate(choices))
    random.shuffle(indexed)
    
    correct_label = ""
    opts_html = ""
    for i, (orig_idx, text) in enumerate(indexed):
        label = labels[i]
        opts_html += f"<p class='mc-option'>{label}) {text}</p>\n"
        if orig_idx == correct_idx:
            correct_label = label
            correct_text = text
    
    q_html = (
        f"<p>{question}</p>"
        f"<div class='mc-options'>\n{opts_html}</div>"
    )
    a_text = f"{correct_label}) {correct_text}"
    q_text = question
    return q_html, a_text, q_text


class EarthScienceGenerator(BaseGenerator):
    """
    Generator for Earth Science problems.
    
    Covers geology, weather, water cycle, solar system, and natural resources.
    All problems are multiple-choice format.
    """
    
    topic = "earth-science"
    subtopics = [
        "rock-cycle",
        "plate-tectonics",
        "weather-and-climate",
        "water-cycle",
        "solar-system",
        "earth-layers",
        "erosion-weathering",
        "natural-resources",
    ]
    
    def generate(self, config: GeneratorConfig) -> List[Problem]:
        dispatch = {
            "rock-cycle": self._gen_rock_cycle,
            "plate-tectonics": self._gen_plate_tectonics,
            "weather-and-climate": self._gen_weather,
            "water-cycle": self._gen_water_cycle,
            "solar-system": self._gen_solar_system,
            "earth-layers": self._gen_earth_layers,
            "erosion-weathering": self._gen_erosion,
            "natural-resources": self._gen_resources,
        }
        
        gen_fn = dispatch.get(config.subtopic)
        if gen_fn is None:
            raise ValueError(f"Unknown subtopic: {config.subtopic}")
        
        problems: List[Problem] = []
        seen = set()
        attempts = 0
        max_attempts = config.num_problems * 20
        
        while len(problems) < config.num_problems and attempts < max_attempts:
            attempts += 1
            problem = gen_fn(config, len(problems) + 1)
            if problem.question_text not in seen:
                seen.add(problem.question_text)
                problems.append(problem)
        
        return problems
    
    def _make_id(self) -> str:
        return uuid.uuid4().hex[:12]
    
    def _pick_difficulty(self, config: GeneratorConfig) -> Difficulty:
        if config.difficulty == Difficulty.MIXED:
            return random.choice([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD])
        return config.difficulty
    
    # ────────────────────────── ROCK CYCLE ──────────────────────────
    
    ROCK_EASY = [
        ("What type of rock forms from cooled magma or lava?",
         ["Sedimentary", "Igneous", "Metamorphic", "Mineral"], 1,
         "Igneous rocks form when molten rock (magma/lava) cools and solidifies."),
        ("What type of rock forms from layers of sediment pressed together over time?",
         ["Igneous", "Metamorphic", "Sedimentary", "Crystal"], 2,
         "Sedimentary rocks form from compressed and cemented sediment layers."),
        ("What type of rock has been changed by heat and pressure?",
         ["Sedimentary", "Igneous", "Fossil", "Metamorphic"], 3,
         "Metamorphic rocks form when existing rocks are transformed by heat and pressure."),
        ("Granite is an example of which type of rock?",
         ["Sedimentary", "Metamorphic", "Igneous", "Organic"], 2,
         "Granite is an igneous rock that forms from slowly cooling magma underground."),
        ("Sandstone is an example of which type of rock?",
         ["Igneous", "Sedimentary", "Metamorphic", "Volcanic"], 1,
         "Sandstone is a sedimentary rock formed from compressed sand grains."),
        ("Marble is an example of which type of rock?",
         ["Igneous", "Sedimentary", "Metamorphic", "Mineral"], 2,
         "Marble is a metamorphic rock formed when limestone is subjected to heat and pressure."),
        ("What is the name of melted rock beneath Earth's surface?",
         ["Lava", "Magma", "Sediment", "Crystal"], 1,
         "Magma is molten rock beneath the surface; it becomes lava when it reaches the surface."),
        ("What is melted rock called when it flows on Earth's surface?",
         ["Magma", "Sediment", "Lava", "Mineral"], 2,
         "Lava is magma that has reached the surface through a volcanic eruption."),
        ("Which process breaks rocks into smaller pieces?",
         ["Melting", "Weathering", "Erupting", "Subduction"], 1,
         "Weathering is the process that breaks rocks into smaller pieces over time."),
        ("Fossils are most often found in which type of rock?",
         ["Igneous", "Metamorphic", "Sedimentary", "Volcanic"], 2,
         "Fossils are preserved in sedimentary rock layers as sediments bury organisms."),
        ("What do we call the continuous process of rock formation and transformation?",
         ["Water cycle", "Rock cycle", "Carbon cycle", "Life cycle"], 1,
         "The rock cycle describes how rocks continuously change from one type to another."),
        ("Which rock type forms from volcanic eruptions?",
         ["Sedimentary", "Metamorphic", "Igneous", "Fossil rock"], 2,
         "Volcanic rock (like basalt or obsidian) is igneous — formed from cooled lava."),
    ]
    
    ROCK_MEDIUM = [
        ("A sedimentary rock is buried deep underground and subjected to intense heat. What type of rock does it become?",
         ["Igneous", "Metamorphic", "Sedimentary", "Mineral"], 1,
         "Heat and pressure deep underground transform sedimentary rock into metamorphic rock."),
        ("Which process turns sediment into sedimentary rock?",
         ["Melting and cooling", "Compaction and cementation", "Heat and pressure", "Erosion"], 1,
         "Compaction (pressing together) and cementation (mineral glue) lithify sediment into rock."),
        ("What must happen to an igneous rock for it to become sedimentary?",
         ["It must melt", "It must be heated", "It must be weathered, eroded, and deposited", "It must be compressed"], 2,
         "Igneous rock must be broken down by weathering, transported by erosion, deposited, then compacted."),
        ("Obsidian (volcanic glass) forms when lava cools very quickly. What type of rock is it?",
         ["Sedimentary", "Metamorphic", "Extrusive igneous", "Intrusive igneous"], 2,
         "Obsidian is extrusive igneous — it forms from lava cooling rapidly on the surface."),
        ("What is the difference between intrusive and extrusive igneous rocks?",
         ["Intrusive has large crystals; extrusive has small crystals", "Intrusive is on the surface; extrusive is underground",
          "Intrusive is soft; extrusive is hard", "There is no difference"], 0,
         "Intrusive igneous rocks cool slowly underground → large crystals. Extrusive cool quickly on surface → small crystals."),
        ("Which metamorphic rock forms from limestone?",
         ["Slate", "Quartzite", "Marble", "Schist"], 2,
         "Marble forms when limestone (calcium carbonate) is subjected to heat and pressure."),
        ("Which metamorphic rock forms from shale?",
         ["Marble", "Quartzite", "Gneiss", "Slate"], 3,
         "Slate forms when the fine-grained sedimentary rock shale undergoes low-grade metamorphism."),
        ("In the rock cycle, what process turns metamorphic rock into magma?",
         ["Weathering", "Erosion", "Melting", "Compaction"], 2,
         "When metamorphic rock is heated enough (by mantle heat), it melts into magma."),
        ("Which mineral is the hardest on the Mohs scale?",
         ["Quartz", "Topaz", "Diamond", "Corundum"], 2,
         "Diamond is 10 on the Mohs hardness scale — the hardest natural mineral."),
        ("What type of rock is chalk?",
         ["Igneous", "Sedimentary", "Metamorphic", "Mineral"], 1,
         "Chalk is a soft, white sedimentary rock made from tiny marine organism shells."),
        ("Pumice is a rock that can float on water. What type of rock is it?",
         ["Sedimentary", "Metamorphic", "Igneous", "Artificial"], 2,
         "Pumice is a volcanic (igneous) rock with so many gas bubbles it can float."),
        ("Which mineral test involves scratching one mineral against another?",
         ["Luster test", "Streak test", "Hardness test", "Cleavage test"], 2,
         "The hardness test (Mohs scale) ranks minerals by whether they can scratch each other."),
    ]
    
    ROCK_HARD = [
        ("Arrange these in the correct order of the rock cycle starting from magma: 1) Sedimentary rock 2) Igneous rock 3) Sediment 4) Metamorphic rock",
         ["2, 3, 1, 4", "3, 1, 4, 2", "2, 4, 1, 3", "1, 3, 2, 4"], 0,
         "Magma → cools to Igneous (2) → weathers to Sediment (3) → compacts to Sedimentary (1) → heat/pressure to Metamorphic (4)."),
        ("A geologist finds a rock with visible layers and embedded fossils. What can they conclude?",
         ["It is igneous", "It is metamorphic", "It is sedimentary", "It formed from magma"], 2,
         "Visible layers and fossils are hallmarks of sedimentary rock — formed from deposited sediment."),
        ("Gneiss (pronounced 'nice') has alternating light and dark mineral bands. This banding is caused by:",
         ["Rapid cooling", "Erosion patterns", "High-grade metamorphism separating minerals", "Chemical weathering"], 2,
         "Gneiss forms under high heat and pressure, which separates minerals into distinct bands."),
        ("Why are fossils rarely found in igneous or metamorphic rocks?",
         ["Fossils only form in water", "Heat destroys organic remains", "Pressure prevents fossil formation", "Both B and C"], 3,
         "The extreme heat of igneous formation and heat/pressure of metamorphism destroy organic material."),
        ("A rock composed entirely of the mineral halite (NaCl) formed by evaporation of seawater. What type of rock is it?",
         ["Chemical sedimentary", "Clastic sedimentary", "Igneous", "Metamorphic"], 0,
         "Rocks formed from mineral precipitation (evaporation) are chemical sedimentary rocks."),
        ("What distinguishes foliated from non-foliated metamorphic rocks?",
         ["Foliated rocks have layers/bands; non-foliated do not", "Foliated rocks are harder",
          "Non-foliated rocks contain fossils", "Foliated rocks are always darker"], 0,
         "Foliated metamorphic rocks have aligned mineral layers (like slate, schist, gneiss); non-foliated don't (like marble, quartzite)."),
        ("Which rock would you expect to find at a mid-ocean ridge?",
         ["Sandstone", "Basalt", "Limestone", "Marble"], 1,
         "Mid-ocean ridges produce basalt — an extrusive igneous rock from erupting seafloor magma."),
        ("Conglomerate rock contains rounded pebbles cemented together. What does the rounding tell us?",
         ["The pebbles were once magma", "The pebbles were transported by water over long distances",
          "The rock formed from a volcano", "The pebbles were compressed quickly"], 1,
         "Rounded pebbles indicate significant water transport — edges wore smooth over distance."),
    ]
    
    def _gen_rock_cycle(self, config: GeneratorConfig, num: int) -> Problem:
        diff = self._pick_difficulty(config)
        pool = {Difficulty.EASY: self.ROCK_EASY, Difficulty.MEDIUM: self.ROCK_MEDIUM, Difficulty.HARD: self.ROCK_HARD}
        q, choices, correct, explanation = random.choice(pool[diff])
        q_html, a_text, q_text = _mc_html(q, choices, correct)
        
        return Problem(
            id=self._make_id(), question_text=q_text, question_html=q_html,
            answer=a_text, answer_text=a_text,
            hint=explanation if config.include_hints else None,
            worked_solution=explanation if config.include_worked_examples else None,
            topic="earth-science", subtopic="rock-cycle", difficulty=diff,
        )
    
    # ────────────────────── PLATE TECTONICS ─────────────────────────
    
    TECTONIC_EASY = [
        ("What are the large pieces of Earth's crust that move slowly called?",
         ["Continents", "Tectonic plates", "Mountains", "Glaciers"], 1,
         "Tectonic plates are massive slabs of Earth's lithosphere that float on the asthenosphere."),
        ("What happens when two tectonic plates push together?",
         ["An earthquake", "Mountains can form", "A volcano erupts", "All of these can happen"], 3,
         "Convergent boundaries can cause earthquakes, mountain building, and volcanic activity."),
        ("What is it called when one tectonic plate slides under another?",
         ["Divergence", "Transform", "Subduction", "Erosion"], 2,
         "Subduction occurs when a denser plate slides beneath a lighter one at a convergent boundary."),
        ("The theory that continents were once joined is called:",
         ["Plate tectonics", "Continental drift", "Pangaea theory", "Seafloor spreading"], 1,
         "Continental drift, proposed by Alfred Wegener, states that continents move over time."),
        ("What was the name of the supercontinent that existed ~250 million years ago?",
         ["Gondwana", "Laurasia", "Pangaea", "Rodinia"], 2,
         "Pangaea was the supercontinent that contained all current landmasses before breaking apart."),
        ("What causes tectonic plates to move?",
         ["Wind", "Ocean currents", "Convection currents in the mantle", "Gravity from the Moon"], 2,
         "Heat-driven convection currents in the mantle create forces that move the plates."),
        ("What feature forms when two plates move apart?",
         ["Mountain range", "Rift valley or mid-ocean ridge", "Island", "Desert"], 1,
         "Divergent boundaries create rift valleys on land and mid-ocean ridges underwater."),
        ("Most earthquakes and volcanoes occur along:",
         ["The equator", "The prime meridian", "Plate boundaries", "River valleys"], 2,
         "The 'Ring of Fire' and other plate boundaries are where most seismic/volcanic activity occurs."),
        ("What type of plate boundary is the San Andreas Fault?",
         ["Convergent", "Divergent", "Transform", "Subduction"], 2,
         "The San Andreas Fault is a transform boundary where plates slide past each other."),
        ("Which ocean is getting wider due to seafloor spreading?",
         ["Pacific Ocean", "Indian Ocean", "Atlantic Ocean", "Arctic Ocean"], 2,
         "The Mid-Atlantic Ridge is a divergent boundary causing the Atlantic to widen ~2.5 cm/year."),
    ]
    
    TECTONIC_MEDIUM = [
        ("At a convergent boundary between an oceanic and continental plate, what typically forms?",
         ["A rift valley", "A volcanic mountain range", "A transform fault", "A mid-ocean ridge"], 1,
         "The oceanic plate subducts, melting and rising as magma to form a volcanic mountain chain (like the Andes)."),
        ("What evidence did Wegener use to support continental drift?",
         ["Matching fossils on different continents", "GPS measurements", "Sonar readings", "Satellite images"], 0,
         "Wegener found matching fossils (like Mesosaurus) on coastlines of South America and Africa."),
        ("What happens at a divergent boundary on the ocean floor?",
         ["A deep trench forms", "New oceanic crust is created", "Mountains fold upward", "Plates collide"], 1,
         "Magma rises to fill the gap, creating new oceanic crust — this is seafloor spreading."),
        ("The Himalayan mountains formed from the collision of which two plates?",
         ["Pacific and North American", "Indian and Eurasian", "African and South American", "Antarctic and Australian"], 1,
         "The Indian plate colliding with the Eurasian plate pushed up the Himalayas (and they're still rising)."),
        ("Which type of plate boundary produces the deepest ocean trenches?",
         ["Transform", "Divergent", "Convergent (subduction)", "Hotspot"], 2,
         "Subduction zones create deep trenches — the Mariana Trench (11 km deep) is at a subduction zone."),
        ("What is the Ring of Fire?",
         ["A circle of active volcanoes around the Pacific", "A chain of islands in the Atlantic",
          "A hot spring system in Yellowstone", "A series of earthquakes along the equator"], 0,
         "The Ring of Fire is a 40,000 km horseshoe zone of earthquakes/volcanoes around the Pacific."),
        ("How do scientists measure the movement of tectonic plates today?",
         ["Seismographs", "GPS satellites", "Barometers", "Telescopes"], 1,
         "GPS technology can measure plate movement with millimeter precision."),
        ("What type of boundary is the Mid-Atlantic Ridge?",
         ["Convergent", "Divergent", "Transform", "Subduction"], 1,
         "The Mid-Atlantic Ridge is a divergent boundary where the Eurasian and North American plates separate."),
    ]
    
    TECTONIC_HARD = [
        ("Explain why the Pacific Plate is shrinking while the Atlantic is growing.",
         ["The Pacific has more subduction zones consuming crust than mid-ocean ridges creating it",
          "The Atlantic is colder and denser", "The Pacific is being pulled by the Moon",
          "Continental plates are pushing the Pacific away"], 0,
         "Pacific edges are mostly convergent (subduction destroying crust), while the Atlantic has the Mid-Atlantic Ridge creating crust."),
        ("What evidence from the ocean floor supports the theory of plate tectonics?",
         ["Symmetrical magnetic stripe patterns on either side of mid-ocean ridges",
          "Fish migration patterns", "Ocean temperature gradients", "Underwater cave formations"], 0,
         "Magnetic reversals recorded in seafloor rocks create symmetrical stripe patterns — proof of seafloor spreading."),
        ("At what rate do most tectonic plates move?",
         ["1-10 cm per year", "1-10 meters per year", "1-10 km per year", "They don't move measurably"], 0,
         "Most plates move 1-10 cm/year — about as fast as your fingernails grow."),
        ("Why does subduction occur when an oceanic plate meets a continental plate?",
         ["Oceanic crust is thinner and denser", "Continental crust is older",
          "The ocean pushes the plate down", "Gravity pulls harder on larger plates"], 0,
         "Oceanic crust (basalt, ~3.0 g/cm³) is denser than continental crust (granite, ~2.7 g/cm³), so it sinks."),
        ("What is a hotspot, and how does it differ from plate boundary volcanism?",
         ["A hotspot is a fixed point of magma that plates move over, not at a boundary",
          "A hotspot is a very active plate boundary", "Hotspots only occur in oceans",
          "Hotspots are caused by meteorite impacts"], 0,
         "Hotspots (like Hawaii) are plumes of hot mantle material — plates drift over them creating island chains."),
        ("The Mariana Trench is 11,034 m deep. What tectonic process created it?",
         ["Seafloor spreading", "Transform faulting", "Subduction of the Pacific Plate under the Mariana Plate",
          "Erosion by deep ocean currents"], 2,
         "The Pacific Plate subducts under the smaller Mariana Plate, creating the deepest ocean trench."),
    ]
    
    def _gen_plate_tectonics(self, config: GeneratorConfig, num: int) -> Problem:
        diff = self._pick_difficulty(config)
        pool = {Difficulty.EASY: self.TECTONIC_EASY, Difficulty.MEDIUM: self.TECTONIC_MEDIUM, Difficulty.HARD: self.TECTONIC_HARD}
        q, choices, correct, explanation = random.choice(pool[diff])
        q_html, a_text, q_text = _mc_html(q, choices, correct)
        
        return Problem(
            id=self._make_id(), question_text=q_text, question_html=q_html,
            answer=a_text, answer_text=a_text,
            hint=explanation if config.include_hints else None,
            worked_solution=explanation if config.include_worked_examples else None,
            topic="earth-science", subtopic="plate-tectonics", difficulty=diff,
        )
    
    # ────────────────────── WEATHER & CLIMATE ───────────────────────
    
    WEATHER_EASY = [
        ("What instrument measures temperature?",
         ["Barometer", "Thermometer", "Anemometer", "Rain gauge"], 1,
         "A thermometer measures temperature in degrees Celsius or Fahrenheit."),
        ("What instrument measures wind speed?",
         ["Thermometer", "Barometer", "Anemometer", "Hygrometer"], 2,
         "An anemometer measures wind speed, often using spinning cups."),
        ("What instrument measures air pressure?",
         ["Thermometer", "Barometer", "Anemometer", "Rain gauge"], 1,
         "A barometer measures atmospheric pressure — useful for predicting weather changes."),
        ("What are the three main types of clouds?",
         ["Fog, mist, haze", "Cumulus, stratus, cirrus", "Rain, snow, sleet", "High, medium, low"], 1,
         "Cumulus (puffy), stratus (flat layers), and cirrus (wispy/high) are the three main types."),
        ("Which type of cloud is tall and often brings thunderstorms?",
         ["Cirrus", "Stratus", "Cumulonimbus", "Fog"], 2,
         "Cumulonimbus clouds are tall, towering clouds associated with thunderstorms and heavy rain."),
        ("Rain, snow, sleet, and hail are all forms of:",
         ["Evaporation", "Condensation", "Precipitation", "Collection"], 2,
         "Precipitation is any form of water falling from clouds to Earth's surface."),
        ("What is the difference between weather and climate?",
         ["Weather is daily conditions; climate is long-term patterns",
          "Weather is about temperature; climate is about rain",
          "They mean the same thing", "Climate only refers to tropical areas"], 0,
         "Weather is short-term (today's conditions); climate is the average weather over 30+ years."),
        ("What causes wind?",
         ["The Moon's gravity", "Differences in air pressure", "Ocean currents", "Earth's magnetic field"], 1,
         "Wind blows from areas of high pressure to low pressure — the bigger the difference, the stronger the wind."),
        ("Which season has the longest days in the Northern Hemisphere?",
         ["Winter", "Spring", "Summer", "Fall"], 2,
         "Summer has the longest days because the Northern Hemisphere is tilted toward the Sun."),
        ("What type of weather does a low-pressure system usually bring?",
         ["Sunny and dry", "Cloudy and rainy", "Cold and clear", "Hot and windy"], 1,
         "Low pressure systems cause air to rise, cool, and form clouds → precipitation."),
    ]
    
    WEATHER_MEDIUM = [
        ("What happens to air temperature as altitude increases in the troposphere?",
         ["It increases", "It decreases", "It stays the same", "It fluctuates randomly"], 1,
         "Temperature decreases ~6.5°C per 1,000 m in the troposphere (the lowest atmospheric layer)."),
        ("What is the dew point?",
         ["The temperature at which water boils", "The temperature at which air becomes saturated and condensation begins",
          "The highest temperature of the day", "The temperature of ocean water"], 1,
         "The dew point is when air is 100% saturated — water vapor condenses into liquid (dew, fog, clouds)."),
        ("A weather map shows an 'H' symbol. What does this indicate?",
         ["Hurricane", "High pressure (fair weather)", "High temperature", "Humid conditions"], 1,
         "H = high pressure system → sinking air → clear skies and fair weather."),
        ("What type of front forms when a cold air mass overtakes a warm air mass?",
         ["Warm front", "Cold front", "Stationary front", "Occluded front"], 1,
         "A cold front occurs when cold air pushes under warm air — often brings brief, intense storms."),
        ("Relative humidity of 100% means:",
         ["It is raining", "The air is holding maximum water vapor", "The temperature is 100°F", "The air is completely dry"], 1,
         "100% relative humidity = air is saturated (holding max water vapor at that temperature)."),
        ("What causes the Coriolis effect?",
         ["Ocean currents", "Mountain ranges", "Earth's rotation", "The Moon's gravity"], 2,
         "Earth's rotation deflects moving air — right in Northern Hemisphere, left in Southern."),
        ("What type of cloud is flat, gray, and covers the whole sky?",
         ["Cumulus", "Cirrus", "Stratus", "Cumulonimbus"], 2,
         "Stratus clouds form flat, gray layers that often bring drizzle or overcast skies."),
        ("In which layer of the atmosphere does most weather occur?",
         ["Stratosphere", "Troposphere", "Mesosphere", "Thermosphere"], 1,
         "The troposphere (0-12 km up) contains most water vapor and is where all weather happens."),
    ]
    
    WEATHER_HARD = [
        ("Why are coastal cities generally warmer in winter and cooler in summer compared to inland cities?",
         ["Ocean currents bring warm water", "Water has high specific heat capacity, moderating temperatures",
          "Coastal cities are at lower elevation", "Sea breezes blow constantly"], 1,
         "Water's high specific heat means oceans warm/cool slowly, moderating nearby land temperatures."),
        ("What is an occluded front?",
         ["When a cold front catches up to and lifts a warm front off the ground",
          "When two warm fronts collide", "When a front stops moving",
          "When a front crosses the equator"], 0,
         "Occluded fronts form when a fast-moving cold front overtakes a warm front, lifting warm air aloft."),
        ("How does the jet stream influence weather in the mid-latitudes?",
         ["It brings tropical storms", "It steers weather systems and separates cold/warm air masses",
          "It creates ocean currents", "It causes earthquakes"], 1,
         "The jet stream is a fast-flowing air current at ~10 km altitude that steers storms and fronts."),
        ("If barometric pressure is falling rapidly, what weather should you expect?",
         ["Clear, sunny skies", "Stormy weather approaching",
          "No change in weather", "Extreme cold"], 1,
         "Rapidly falling pressure indicates a strong low-pressure system (storm) is approaching."),
        ("What is the difference between a tornado watch and a tornado warning?",
         ["Watch = conditions are favorable; Warning = tornado has been spotted or detected",
          "Watch is more severe than warning", "They mean the same thing",
          "Watch is for hurricanes; warning is for tornadoes"], 0,
         "Watch = conditions could produce a tornado. Warning = one has been sighted or detected on radar."),
        ("Why does it rain more on the windward side of mountains?",
         ["Mountains attract clouds", "Air rises on windward side, cools, and precipitates (orographic effect)",
          "The leeward side is too dry", "Mountains block rain from passing"], 1,
         "Orographic lift: moist air is forced up the windward slope, cools, condenses, and rains. The leeward side gets a 'rain shadow'."),
    ]
    
    def _gen_weather(self, config: GeneratorConfig, num: int) -> Problem:
        diff = self._pick_difficulty(config)
        pool = {Difficulty.EASY: self.WEATHER_EASY, Difficulty.MEDIUM: self.WEATHER_MEDIUM, Difficulty.HARD: self.WEATHER_HARD}
        q, choices, correct, explanation = random.choice(pool[diff])
        q_html, a_text, q_text = _mc_html(q, choices, correct)
        
        return Problem(
            id=self._make_id(), question_text=q_text, question_html=q_html,
            answer=a_text, answer_text=a_text,
            hint=explanation if config.include_hints else None,
            worked_solution=explanation if config.include_worked_examples else None,
            topic="earth-science", subtopic="weather-and-climate", difficulty=diff,
        )
    
    # ──────────────────────── WATER CYCLE ───────────────────────────
    
    WATER_EASY = [
        ("What is the process of water changing from liquid to gas called?",
         ["Condensation", "Precipitation", "Evaporation", "Collection"], 2,
         "Evaporation is when liquid water is heated and turns into water vapor (gas)."),
        ("What is the process of water vapor turning back into liquid called?",
         ["Evaporation", "Condensation", "Precipitation", "Transpiration"], 1,
         "Condensation is when water vapor cools and turns back into liquid droplets (forming clouds)."),
        ("What do we call water falling from clouds as rain, snow, or hail?",
         ["Evaporation", "Condensation", "Precipitation", "Runoff"], 2,
         "Precipitation is any form of water that falls from the atmosphere to Earth's surface."),
        ("What powers the water cycle?",
         ["The Moon", "The Sun", "Wind", "Gravity alone"], 1,
         "The Sun provides the energy that heats water and drives evaporation — the engine of the water cycle."),
        ("Where does most evaporation happen?",
         ["Rivers", "Lakes", "Oceans", "Puddles"], 2,
         "About 86% of evaporation happens from the oceans — the largest water surface on Earth."),
        ("What is the water cycle?",
         ["Water moving only in rivers", "The continuous movement of water through Earth's systems",
          "Rain falling from clouds", "Water being cleaned at a plant"], 1,
         "The water cycle is the continuous movement of water between the atmosphere, land, and oceans."),
        ("What forms when water vapor condenses around tiny particles in the atmosphere?",
         ["Rain", "Snow", "Clouds", "Ice caps"], 2,
         "Clouds form when water vapor condenses on dust, pollen, or other particles (condensation nuclei)."),
        ("After precipitation falls on land, what is water flowing over the surface called?",
         ["Groundwater", "Runoff", "Evaporation", "Condensation"], 1,
         "Runoff is water that flows over the land surface into streams, rivers, and eventually the ocean."),
        ("What is the process of water being released from plant leaves called?",
         ["Photosynthesis", "Transpiration", "Evaporation", "Absorption"], 1,
         "Transpiration is when plants release water vapor through tiny pores (stomata) in their leaves."),
        ("Where is most of Earth's freshwater stored?",
         ["Oceans", "Rivers", "Ice caps and glaciers", "Clouds"], 2,
         "About 69% of freshwater is frozen in ice caps and glaciers."),
    ]
    
    WATER_MEDIUM = [
        ("What percentage of Earth's water is freshwater?",
         ["About 97%", "About 50%", "About 3%", "About 25%"], 2,
         "Only about 3% of Earth's water is freshwater; 97% is salt water in the oceans."),
        ("What is an aquifer?",
         ["An underground layer of rock that holds water", "A type of cloud",
          "A measurement of water quality", "A water treatment facility"], 0,
         "An aquifer is a body of permeable rock that stores and transmits groundwater."),
        ("How does deforestation affect the water cycle?",
         ["It increases transpiration", "It reduces transpiration and increases runoff",
          "It has no effect", "It increases condensation"], 1,
         "Fewer trees = less transpiration and less water absorbed by roots → more runoff and flooding."),
        ("What is infiltration in the water cycle?",
         ["Water flowing over land", "Water soaking into the ground",
          "Water evaporating from oceans", "Water freezing into ice"], 1,
         "Infiltration is when water seeps into soil and rock, eventually reaching the water table."),
        ("What happens to the water cycle when temperatures rise globally?",
         ["It slows down", "Evaporation increases, making the cycle more intense",
          "Less precipitation occurs", "The cycle stops"], 1,
         "Warmer temperatures increase evaporation, leading to more water vapor, clouds, and intense storms."),
        ("What is the role of gravity in the water cycle?",
         ["It causes evaporation", "It pulls precipitation down and drives runoff and infiltration",
          "It forms clouds", "It heats water"], 1,
         "Gravity pulls rain/snow to Earth and drives the downhill flow of runoff and groundwater."),
    ]
    
    WATER_HARD = [
        ("Explain why the water cycle is considered a 'closed system' for Earth.",
         ["Water is continuously recycled — the total amount on Earth stays roughly constant",
          "Water cannot leave the atmosphere", "New water is constantly created",
          "The oceans are a closed container"], 0,
         "Earth neither gains nor loses significant water — the same water molecules cycle endlessly."),
        ("How do oceans regulate global temperature through the water cycle?",
         ["Evaporation absorbs heat, cooling the surface; condensation releases heat, warming the atmosphere",
          "Oceans reflect sunlight", "Ocean currents stop storms",
          "Salt in the ocean absorbs heat"], 0,
         "Evaporation is endothermic (cools surface); condensation is exothermic (warms atmosphere) — transferring heat."),
        ("What is the difference between evaporation and transpiration in terms of water sources?",
         ["Evaporation is from water surfaces; transpiration is from plants",
          "They are the same process", "Transpiration is from the ocean",
          "Evaporation only happens at high temperatures"], 0,
         "Evaporation occurs from open water surfaces; transpiration releases water from plant stomata."),
        ("Why is groundwater considered part of the water cycle even though it moves very slowly?",
         ["It eventually reaches the surface through springs or wells and returns to the cycle",
          "It doesn't move at all", "It creates new water underground",
          "Groundwater is not part of the water cycle"], 0,
         "Groundwater slowly moves through aquifers and can emerge as springs, feeding rivers and eventually oceans."),
    ]
    
    def _gen_water_cycle(self, config: GeneratorConfig, num: int) -> Problem:
        diff = self._pick_difficulty(config)
        pool = {Difficulty.EASY: self.WATER_EASY, Difficulty.MEDIUM: self.WATER_MEDIUM, Difficulty.HARD: self.WATER_HARD}
        q, choices, correct, explanation = random.choice(pool[diff])
        q_html, a_text, q_text = _mc_html(q, choices, correct)
        
        return Problem(
            id=self._make_id(), question_text=q_text, question_html=q_html,
            answer=a_text, answer_text=a_text,
            hint=explanation if config.include_hints else None,
            worked_solution=explanation if config.include_worked_examples else None,
            topic="earth-science", subtopic="water-cycle", difficulty=diff,
        )
    
    # ──────────────────────── SOLAR SYSTEM ──────────────────────────
    
    PLANETS = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"]
    
    SOLAR_EASY = [
        ("Which planet is closest to the Sun?",
         ["Venus", "Mercury", "Mars", "Earth"], 1,
         "Mercury is the closest planet to the Sun, orbiting at ~58 million km."),
        ("Which planet is known as the 'Red Planet'?",
         ["Jupiter", "Saturn", "Venus", "Mars"], 3,
         "Mars appears red due to iron oxide (rust) on its surface."),
        ("Which is the largest planet in our solar system?",
         ["Saturn", "Jupiter", "Neptune", "Uranus"], 1,
         "Jupiter is the largest planet — its diameter is about 11 times Earth's."),
        ("How many planets are in our solar system?",
         ["7", "8", "9", "10"], 1,
         "There are 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune."),
        ("What is the name of Earth's natural satellite?",
         ["The Sun", "The Moon", "Mars", "A star"], 1,
         "The Moon is Earth's only natural satellite, orbiting at ~384,000 km."),
        ("Which planet has the most visible rings?",
         ["Jupiter", "Uranus", "Neptune", "Saturn"], 3,
         "Saturn's rings are the most visible — made of ice and rock particles."),
        ("What is at the center of our solar system?",
         ["Earth", "The Moon", "The Sun", "Jupiter"], 2,
         "The Sun is a star at the center — all planets orbit around it."),
        ("Which planet do we live on?",
         ["Mars", "Venus", "Earth", "Mercury"], 2,
         "We live on Earth — the third planet from the Sun and the only known planet with life."),
        ("What are the four inner planets called?",
         ["Gas giants", "Terrestrial (rocky) planets", "Ice giants", "Dwarf planets"], 1,
         "Mercury, Venus, Earth, and Mars are the terrestrial (rocky) planets."),
        ("What are the four outer planets called?",
         ["Rocky planets", "Dwarf planets", "Gas and ice giants", "Asteroids"], 2,
         "Jupiter and Saturn are gas giants; Uranus and Neptune are ice giants."),
        ("What separates the inner and outer planets?",
         ["The Sun", "The asteroid belt", "The Moon", "A black hole"], 1,
         "The asteroid belt between Mars and Jupiter separates the inner and outer planets."),
        ("What is a star?",
         ["A cold ball of rock", "A ball of hot gas that produces light and heat",
          "A planet that glows", "A piece of the Moon"], 1,
         "Stars are massive balls of hot gas (mainly hydrogen/helium) that produce energy through nuclear fusion."),
    ]
    
    SOLAR_MEDIUM = [
        ("Put the planets in order from the Sun: Mars, Earth, Mercury, Venus",
         ["Mercury, Venus, Earth, Mars", "Venus, Mercury, Earth, Mars",
          "Mercury, Earth, Venus, Mars", "Earth, Venus, Mercury, Mars"], 0,
         "The correct order is: Mercury (1st), Venus (2nd), Earth (3rd), Mars (4th)."),
        ("Why is Venus hotter than Mercury even though Mercury is closer to the Sun?",
         ["Venus has a thick atmosphere that traps heat (greenhouse effect)",
          "Venus is closer to the Sun", "Mercury has no atmosphere",
          "Venus has active volcanoes"], 0,
         "Venus's thick CO₂ atmosphere creates a runaway greenhouse effect — surface temp ~465°C."),
        ("What is the Great Red Spot on Jupiter?",
         ["A volcano", "A giant storm that has lasted hundreds of years",
          "A crater", "An ocean"], 1,
         "The Great Red Spot is a massive anticyclonic storm — bigger than Earth and centuries old."),
        ("Which planet rotates on its side?",
         ["Neptune", "Saturn", "Uranus", "Jupiter"], 2,
         "Uranus has an axial tilt of ~98° — it essentially rotates on its side (likely from an ancient impact)."),
        ("What is a dwarf planet? Name one.",
         ["Pluto — a body that orbits the Sun but hasn't cleared its orbital neighborhood",
          "The Moon — small planets orbiting other planets",
          "Asteroids are dwarf planets", "Any planet smaller than Earth"], 0,
         "Dwarf planets orbit the Sun and are massive enough for gravity to make them round, but haven't cleared their orbit. Pluto is the most famous."),
        ("How long does it take Earth to orbit the Sun?",
         ["24 hours", "365.25 days", "28 days", "12 months exactly"], 1,
         "One Earth year = ~365.25 days. The extra 0.25 days is why we have leap years."),
        ("What causes the seasons on Earth?",
         ["Distance from the Sun", "Earth's tilted axis (23.5°)", "The Moon's orbit", "Solar flares"], 1,
         "Earth's 23.5° axial tilt means different hemispheres get more direct sunlight at different times."),
        ("What is a comet made of?",
         ["Rock and metal", "Gas only", "Ice, rock, and dust", "Pure water"], 2,
         "Comets are 'dirty snowballs' — frozen gases, rock, and dust that develop tails near the Sun."),
    ]
    
    SOLAR_HARD = [
        ("The Sun is classified as what type of star?",
         ["Red giant", "White dwarf", "G-type main sequence (yellow dwarf)", "Blue supergiant"], 2,
         "The Sun is a G-type main-sequence star — medium size, medium temperature (~5,500°C surface)."),
        ("Light from the Sun takes about how long to reach Earth?",
         ["1 second", "8 minutes", "1 hour", "1 day"], 1,
         "Light travels ~300,000 km/s; the Sun is ~150 million km away → ~8 minutes 20 seconds."),
        ("What is the Kuiper Belt?",
         ["A region of icy bodies beyond Neptune's orbit", "Saturn's ring system",
          "The asteroid belt", "A type of galaxy"], 0,
         "The Kuiper Belt is a ring of icy objects (including Pluto) beyond Neptune at 30-50 AU."),
        ("How does Jupiter protect Earth from asteroid impacts?",
         ["It blocks asteroids with its rings", "Its massive gravity deflects or captures incoming objects",
          "It destroys asteroids with radiation", "It doesn't protect Earth"], 1,
         "Jupiter's enormous gravitational field acts as a 'cosmic vacuum cleaner,' deflecting many potential impactors."),
        ("What would happen to your weight on Jupiter compared to Earth?",
         ["It would be about the same", "It would be about 2.5 times more",
          "It would be less", "You would be weightless"], 1,
         "Jupiter's surface gravity is ~2.5x Earth's. A 60 kg person would 'weigh' ~150 kg on Jupiter."),
        ("Why does Mars appear red from Earth?",
         ["It is very hot", "Iron oxide (rust) in the soil", "Red gases in its atmosphere", "Reflection from the Sun"], 1,
         "Mars's surface is rich in iron oxide (Fe₂O₃) — essentially rust — giving it a reddish appearance."),
    ]
    
    def _gen_solar_system(self, config: GeneratorConfig, num: int) -> Problem:
        diff = self._pick_difficulty(config)
        pool = {Difficulty.EASY: self.SOLAR_EASY, Difficulty.MEDIUM: self.SOLAR_MEDIUM, Difficulty.HARD: self.SOLAR_HARD}
        q, choices, correct, explanation = random.choice(pool[diff])
        q_html, a_text, q_text = _mc_html(q, choices, correct)
        
        return Problem(
            id=self._make_id(), question_text=q_text, question_html=q_html,
            answer=a_text, answer_text=a_text,
            hint=explanation if config.include_hints else None,
            worked_solution=explanation if config.include_worked_examples else None,
            topic="earth-science", subtopic="solar-system", difficulty=diff,
        )
    
    # ──────────────────────── EARTH LAYERS ──────────────────────────
    
    LAYERS_EASY = [
        ("What is the outermost layer of the Earth called?",
         ["Mantle", "Core", "Crust", "Atmosphere"], 2,
         "The crust is Earth's thin outermost layer (5-70 km thick) — where we live."),
        ("What is the thickest layer of the Earth?",
         ["Crust", "Mantle", "Outer core", "Inner core"], 1,
         "The mantle is ~2,900 km thick — about 84% of Earth's volume."),
        ("What is at the very center of the Earth?",
         ["Mantle", "Crust", "Outer core", "Inner core"], 3,
         "The inner core is a solid ball of iron and nickel at Earth's center (~5,100-6,371 km deep)."),
        ("How many main layers does the Earth have?",
         ["2", "3", "4", "5"], 2,
         "Earth has 4 main layers: crust, mantle, outer core, and inner core."),
        ("Which layer of the Earth is liquid?",
         ["Crust", "Mantle", "Outer core", "Inner core"], 2,
         "The outer core is liquid iron and nickel — its movement generates Earth's magnetic field."),
        ("What are the two main types of crust?",
         ["Thick and thin", "Oceanic and continental", "Rocky and sandy", "Hot and cold"], 1,
         "Oceanic crust (thin, dense basalt) and continental crust (thick, less dense granite)."),
        ("What metal is the Earth's core mostly made of?",
         ["Gold", "Copper", "Iron", "Aluminum"], 2,
         "The core is primarily iron (~85%) with some nickel — extremely dense and hot."),
        ("Which is hotter: the inner core or the outer core?",
         ["They are the same temperature", "Inner core", "Outer core", "Neither is hot"], 1,
         "The inner core is hotter (~5,400°C) but solid due to immense pressure."),
    ]
    
    LAYERS_MEDIUM = [
        ("Put Earth's layers in order from the surface to the center:",
         ["Crust, mantle, outer core, inner core", "Mantle, crust, inner core, outer core",
          "Crust, outer core, mantle, inner core", "Inner core, outer core, mantle, crust"], 0,
         "From surface to center: Crust → Mantle → Outer Core → Inner Core."),
        ("Why is the inner core solid even though it's hotter than the outer core?",
         ["It's made of different material", "The extreme pressure keeps it solid",
          "It has already cooled down", "It's not actually hotter"], 1,
         "The inner core's extreme pressure (~360 GPa) raises the melting point, keeping iron solid at ~5,400°C."),
        ("What part of the mantle do tectonic plates float on?",
         ["Lithosphere", "Asthenosphere", "Mesosphere", "Core"], 1,
         "The asthenosphere is a partially molten, ductile layer in the upper mantle that allows plates to move."),
        ("What is the lithosphere?",
         ["The crust and upper mantle together", "Just the crust",
          "The lower mantle", "The atmosphere"], 0,
         "The lithosphere includes the crust plus the rigid upper mantle — broken into tectonic plates."),
        ("What generates Earth's magnetic field?",
         ["The mantle", "Convection of liquid iron in the outer core",
          "The inner core spinning", "The Sun"], 1,
         "Liquid iron convection in the outer core creates electric currents → Earth's magnetic field (dynamo effect)."),
        ("Continental crust is thicker than oceanic crust. Approximately how thick is each?",
         ["Continental: 30-70 km, Oceanic: 5-10 km", "Continental: 5-10 km, Oceanic: 30-70 km",
          "Both are about 50 km", "Continental: 100 km, Oceanic: 50 km"], 0,
         "Continental crust averages 35 km (up to 70 km under mountains); oceanic crust is only 5-10 km."),
    ]
    
    LAYERS_HARD = [
        ("How do scientists know about Earth's internal structure if we've never drilled past the crust?",
         ["By studying seismic waves from earthquakes", "By looking at volcanoes",
          "By measuring temperature at the surface", "By studying the Moon"], 0,
         "Seismic waves change speed and direction at layer boundaries — P-waves and S-waves reveal density changes."),
        ("Why don't S-waves (shear waves) travel through the outer core?",
         ["They are too slow", "S-waves cannot travel through liquids",
          "The outer core absorbs them", "They are reflected by the mantle"], 1,
         "S-waves require a rigid medium — they can't propagate through the liquid outer core, creating a 'shadow zone'."),
        ("The Mohorovičić discontinuity (Moho) marks the boundary between:",
         ["Mantle and outer core", "Crust and mantle", "Outer and inner core", "Lithosphere and asthenosphere"], 1,
         "The Moho is the boundary between the crust and mantle, identified by a sudden change in seismic wave speed."),
        ("What is the approximate temperature at Earth's center?",
         ["1,000°C", "3,000°C", "5,400°C", "10,000°C"], 2,
         "The inner core temperature is estimated at ~5,400°C — similar to the Sun's surface temperature."),
    ]
    
    def _gen_earth_layers(self, config: GeneratorConfig, num: int) -> Problem:
        diff = self._pick_difficulty(config)
        pool = {Difficulty.EASY: self.LAYERS_EASY, Difficulty.MEDIUM: self.LAYERS_MEDIUM, Difficulty.HARD: self.LAYERS_HARD}
        q, choices, correct, explanation = random.choice(pool[diff])
        q_html, a_text, q_text = _mc_html(q, choices, correct)
        
        return Problem(
            id=self._make_id(), question_text=q_text, question_html=q_html,
            answer=a_text, answer_text=a_text,
            hint=explanation if config.include_hints else None,
            worked_solution=explanation if config.include_worked_examples else None,
            topic="earth-science", subtopic="earth-layers", difficulty=diff,
        )
    
    # ──────────────────── EROSION & WEATHERING ──────────────────────
    
    EROSION_EASY = [
        ("What is weathering?",
         ["Moving rocks from one place to another", "Breaking rocks into smaller pieces",
          "Building mountains", "Melting rocks underground"], 1,
         "Weathering is the process of breaking rocks into smaller pieces without moving them."),
        ("What is erosion?",
         ["Breaking rocks apart", "Moving weathered material from one place to another",
          "Heating rocks underground", "Rocks forming from magma"], 1,
         "Erosion is the transport of weathered material by water, wind, ice, or gravity."),
        ("Which of these is an agent of erosion?",
         ["Sunlight", "Sound", "Water (rivers)", "Earthquakes"], 2,
         "Water (rivers, waves, rain) is the most powerful agent of erosion."),
        ("When water freezes in cracks of rocks and expands, what type of weathering is this?",
         ["Chemical weathering", "Biological weathering", "Physical (mechanical) weathering", "Erosion"], 2,
         "Freeze-thaw (ice wedging) is physical weathering — ice expands 9% and cracks the rock."),
        ("Tree roots growing into rock cracks is an example of:",
         ["Chemical weathering", "Biological weathering", "Erosion", "Deposition"], 1,
         "Biological weathering: living organisms (roots, burrowing animals) physically break apart rock."),
        ("What is the main difference between weathering and erosion?",
         ["Weathering breaks rocks; erosion moves the pieces",
          "They are the same thing", "Erosion breaks rocks; weathering moves them",
          "Weathering happens underground; erosion happens above"], 0,
         "Weathering = breaking down. Erosion = transporting. They often work together."),
        ("What landform does a river create by eroding rock over millions of years?",
         ["A mountain", "A canyon or valley", "A volcano", "An island"], 1,
         "Rivers carve canyons and valleys — the Grand Canyon was carved by the Colorado River."),
        ("Which weathers rock faster: a hot, wet climate or a cold, dry climate?",
         ["Hot and wet", "Cold and dry", "They are the same", "Neither weathers rock"], 0,
         "Hot, wet climates speed up both chemical reactions and freeze-thaw cycles."),
    ]
    
    EROSION_MEDIUM = [
        ("Acid rain dissolving limestone is an example of:",
         ["Physical weathering", "Chemical weathering", "Biological weathering", "Erosion"], 1,
         "Chemical weathering changes the chemical composition — acid (H₂CO₃) dissolves CaCO₃ in limestone."),
        ("What is deposition?",
         ["The picking up of sediment", "The dropping of sediment when a river slows down",
          "The breaking of rock", "The melting of glaciers"], 1,
         "Deposition occurs when wind/water loses energy and drops its sediment load."),
        ("How do glaciers cause erosion?",
         ["They melt rock", "They scrape and carve the land as they slowly move",
          "They cause earthquakes", "They blow sediment away"], 1,
         "Glaciers act like giant bulldozers — they pluck rocks and grind surfaces, carving U-shaped valleys."),
        ("What forms when wind erodes soft rock but not hard rock?",
         ["A canyon", "A hoodoo or arch", "A volcano", "A lake"], 1,
         "Differential erosion creates arches, hoodoos, and mesas — wind/water removes softer rock first."),
        ("What is the process called when wind picks up and carries sand and soil?",
         ["Deflation", "Abrasion", "Deposition", "Weathering"], 0,
         "Deflation is wind removing loose particles. Abrasion is wind-blown particles wearing down surfaces."),
        ("How does vegetation prevent erosion?",
         ["Roots hold soil in place and leaves slow raindrops",
          "Plants make soil heavier", "Trees block the wind completely",
          "Vegetation has no effect on erosion"], 0,
         "Plant roots anchor soil; leaf canopy reduces raindrop impact; vegetation slows water runoff."),
    ]
    
    EROSION_HARD = [
        ("What is the difference between abrasion and attrition in river erosion?",
         ["Abrasion: rocks scrape the riverbed; Attrition: rocks break by hitting each other",
          "They are the same process", "Abrasion is faster than attrition",
          "Attrition only happens in the ocean"], 0,
         "Abrasion = river sediment grinds against bed/banks. Attrition = rocks collide with each other, becoming smaller and rounder."),
        ("Why are pebbles on a beach smooth and rounded?",
         ["They were always smooth", "Attrition and abrasion from waves tumbling them over time",
          "Chemical weathering dissolves edges", "The salt water melts them"], 1,
         "Constant wave action causes attrition (collisions) and abrasion (grinding), smoothing and rounding stones."),
        ("What is a meander, and how does it form?",
         ["A bend in a river, formed by erosion on the outer bank and deposition on the inner bank",
          "A type of waterfall", "A straight section of river",
          "A dam built by beavers"], 0,
         "Faster water on the outer bend erodes it (undercutting); slower inner water deposits sediment, creating curves."),
        ("How does human activity accelerate erosion?",
         ["Deforestation, construction, and farming remove vegetation and expose soil",
          "Building roads makes soil stronger", "Cities prevent erosion",
          "Human activity has no effect"], 0,
         "Removing vegetation, disturbing soil, and increasing runoff from impervious surfaces all accelerate erosion."),
    ]
    
    def _gen_erosion(self, config: GeneratorConfig, num: int) -> Problem:
        diff = self._pick_difficulty(config)
        pool = {Difficulty.EASY: self.EROSION_EASY, Difficulty.MEDIUM: self.EROSION_MEDIUM, Difficulty.HARD: self.EROSION_HARD}
        q, choices, correct, explanation = random.choice(pool[diff])
        q_html, a_text, q_text = _mc_html(q, choices, correct)
        
        return Problem(
            id=self._make_id(), question_text=q_text, question_html=q_html,
            answer=a_text, answer_text=a_text,
            hint=explanation if config.include_hints else None,
            worked_solution=explanation if config.include_worked_examples else None,
            topic="earth-science", subtopic="erosion-weathering", difficulty=diff,
        )
    
    # ────────────────────── NATURAL RESOURCES ───────────────────────
    
    RESOURCE_EASY = [
        ("Which of these is a renewable resource?",
         ["Coal", "Oil", "Solar energy", "Natural gas"], 2,
         "Solar energy is renewable — the Sun will keep producing energy for billions of years."),
        ("Which of these is a non-renewable resource?",
         ["Wind", "Water", "Coal", "Sunlight"], 2,
         "Coal is non-renewable — it takes millions of years to form and we use it faster than it forms."),
        ("What is a natural resource?",
         ["Something made in a factory", "Something from nature that humans use",
          "A type of technology", "Electricity"], 1,
         "Natural resources are materials from the environment that humans use: water, air, minerals, forests."),
        ("Which renewable energy source uses moving air?",
         ["Solar", "Wind", "Geothermal", "Hydroelectric"], 1,
         "Wind energy captures the kinetic energy of moving air using turbines."),
        ("What is the main fossil fuel used to generate electricity worldwide?",
         ["Oil", "Natural gas", "Coal", "Wood"], 2,
         "Coal is still the largest single source of electricity globally (though declining)."),
        ("Is water a renewable or non-renewable resource?",
         ["Renewable", "Non-renewable", "Neither", "Both"], 0,
         "Water is renewable through the water cycle, but clean freshwater can be scarce."),
        ("What does 'reduce, reuse, recycle' mean?",
         ["Buy more, use more, throw away more", "Use less, use again, make into new products",
          "Only recycle plastic", "A government law"], 1,
         "Reduce = use less; Reuse = use items again; Recycle = process materials into new products."),
        ("Trees are a renewable resource because:",
         ["They grow back", "We never run out", "They are cheap", "They are everywhere"], 0,
         "Trees are renewable because new ones can be planted and grown — but only if managed sustainably."),
    ]
    
    RESOURCE_MEDIUM = [
        ("What are fossil fuels and why are they called that?",
         ["Fuels formed from ancient organisms buried for millions of years",
          "Fuels made from dinosaur bones", "Fuels found near fossils",
          "Fuels that are very old but still usable"], 0,
         "Fossil fuels (coal, oil, gas) formed from decomposed organisms buried under heat/pressure for millions of years."),
        ("What is the main environmental problem with burning fossil fuels?",
         ["It uses too much water", "It releases CO₂, contributing to climate change",
          "It creates too much noise", "It uses up all the oxygen"], 1,
         "Burning fossil fuels releases CO₂ (a greenhouse gas) → traps heat → global warming."),
        ("How does hydroelectric power work?",
         ["Burning water to create steam", "Using flowing water to spin turbines and generate electricity",
          "Splitting water molecules", "Using ocean waves"], 1,
         "Dams channel flowing water through turbines — the water's kinetic energy generates electricity."),
        ("What is geothermal energy?",
         ["Energy from the Sun", "Energy from Earth's internal heat",
          "Energy from wind", "Energy from burning wood"], 1,
         "Geothermal energy harnesses heat from Earth's interior — used in volcanic areas like Iceland."),
        ("Why are metals like copper and aluminum considered non-renewable even though they can be recycled?",
         ["Once mined, the ore deposit is gone — new ore takes geological time to form",
          "They cannot actually be recycled", "They are renewable",
          "Mining is always sustainable"], 0,
         "While the metals themselves can be recycled, the ore deposits took millions of years to form and are finite."),
        ("What is the difference between conservation and preservation?",
         ["Conservation: wise use of resources; Preservation: protecting areas from use",
          "They mean the same thing", "Conservation is for animals; preservation is for plants",
          "Preservation is for renewable; conservation is for non-renewable"], 0,
         "Conservation = managing resources sustainably. Preservation = keeping areas untouched."),
    ]
    
    RESOURCE_HARD = [
        ("Explain the concept of 'carbon footprint'.",
         ["The total greenhouse gas emissions caused by a person, event, or product",
          "The amount of coal a person uses", "The size of a carbon atom",
          "The amount of carbon in the atmosphere"], 0,
         "Carbon footprint measures total CO₂-equivalent emissions from activities (transport, food, energy, etc.)."),
        ("What are the main advantages AND disadvantages of nuclear energy?",
         ["Pro: No CO₂ during operation; Con: Radioactive waste and accident risk",
          "Pro: It's renewable; Con: It's expensive",
          "Pro: No waste; Con: Low energy output",
          "It has no advantages"], 0,
         "Nuclear is low-carbon and high-output, but produces radioactive waste and carries meltdown risk."),
        ("How does deforestation contribute to climate change beyond just losing trees?",
         ["Trees store carbon; cutting them releases it AND removes future CO₂ absorption capacity",
          "It doesn't affect climate", "It only affects local temperature",
          "Deforestation increases oxygen"], 0,
         "Trees are carbon sinks. Deforestation releases stored CO₂ AND reduces ongoing absorption."),
        ("What is sustainable development?",
         ["Meeting present needs without compromising future generations' ability to meet theirs",
          "Developing as fast as possible", "Stopping all development",
          "Only using renewable resources"], 0,
         "Sustainable development balances economic growth with environmental protection for the long term."),
    ]
    
    def _gen_resources(self, config: GeneratorConfig, num: int) -> Problem:
        diff = self._pick_difficulty(config)
        pool = {Difficulty.EASY: self.RESOURCE_EASY, Difficulty.MEDIUM: self.RESOURCE_MEDIUM, Difficulty.HARD: self.RESOURCE_HARD}
        q, choices, correct, explanation = random.choice(pool[diff])
        q_html, a_text, q_text = _mc_html(q, choices, correct)
        
        return Problem(
            id=self._make_id(), question_text=q_text, question_html=q_html,
            answer=a_text, answer_text=a_text,
            hint=explanation if config.include_hints else None,
            worked_solution=explanation if config.include_worked_examples else None,
            topic="earth-science", subtopic="natural-resources", difficulty=diff,
        )
