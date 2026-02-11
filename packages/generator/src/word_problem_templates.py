"""
Pre-written word problem templates for fraction operations.

No LLM/AI calls. Each template is a dict with:
- story: string with {frac1} and {frac2} placeholders for fractions
- question: the question to answer
- context_type: one of "cooking", "sports", "shopping", "school", "crafts"

Exports:
- ADDITION_TEMPLATES (30+ templates)
- SUBTRACTION_TEMPLATES (30+ templates)
- MULTIPLICATION_TEMPLATES (25+ templates)
- DIVISION_TEMPLATES (25+ templates)
- get_word_problem(operation, frac1_str, frac2_str, answer_str, context_type=None) -> dict
"""

import random
from typing import Optional

# ---------------------------------------------------------------------------
# ADDITION TEMPLATES (30+)
# Stories about combining quantities: recipes, distances, time, etc.
# ---------------------------------------------------------------------------

ADDITION_TEMPLATES: list[dict] = [
    # -- cooking --
    {
        "story": "A recipe calls for {frac1} cup of flour for the crust and {frac2} cup of flour for the topping.",
        "question": "How much flour is needed in all?",
        "context_type": "cooking",
    },
    {
        "story": "Maria used {frac1} teaspoon of cinnamon in her oatmeal and {frac2} teaspoon of cinnamon in her smoothie.",
        "question": "How much cinnamon did she use altogether?",
        "context_type": "cooking",
    },
    {
        "story": "Dad poured {frac1} cup of milk into the pancake batter and then added another {frac2} cup.",
        "question": "How much milk did he use in total?",
        "context_type": "cooking",
    },
    {
        "story": "A fruit salad recipe needs {frac1} pound of strawberries and {frac2} pound of blueberries.",
        "question": "How many pounds of berries are needed?",
        "context_type": "cooking",
    },
    {
        "story": "Chef Amir added {frac1} cup of sugar to the cake batter and {frac2} cup of sugar to the frosting.",
        "question": "How much sugar did he use in total?",
        "context_type": "cooking",
    },
    {
        "story": "For a soup recipe, you need {frac1} cup of diced onions and {frac2} cup of diced celery.",
        "question": "How many cups of diced vegetables do you need altogether?",
        "context_type": "cooking",
    },
    # -- sports --
    {
        "story": "Jamal ran {frac1} mile in the morning and {frac2} mile in the afternoon.",
        "question": "How far did he run in total?",
        "context_type": "sports",
    },
    {
        "story": "A swimmer completed {frac1} lap before resting and then swam {frac2} lap more.",
        "question": "How many laps did the swimmer complete?",
        "context_type": "sports",
    },
    {
        "story": "During basketball practice, Keisha spent {frac1} hour on free throws and {frac2} hour on dribbling drills.",
        "question": "How much time did she spend practicing?",
        "context_type": "sports",
    },
    {
        "story": "A hiking trail goes {frac1} mile through the forest and {frac2} mile along the river.",
        "question": "How long is the whole trail?",
        "context_type": "sports",
    },
    {
        "story": "Tyler biked {frac1} mile to the park and then {frac2} mile around the park loop.",
        "question": "How far did Tyler bike in all?",
        "context_type": "sports",
    },
    {
        "story": "In a relay race, Mia ran {frac1} kilometer and her teammate Sasha ran {frac2} kilometer.",
        "question": "How far did they run combined?",
        "context_type": "sports",
    },
    # -- shopping --
    {
        "story": "Elena bought {frac1} pound of almonds and {frac2} pound of cashews at the store.",
        "question": "How many pounds of nuts did she buy?",
        "context_type": "shopping",
    },
    {
        "story": "At the fabric store, Priya bought {frac1} yard of red fabric and {frac2} yard of blue fabric.",
        "question": "How much fabric did she buy in total?",
        "context_type": "shopping",
    },
    {
        "story": "Marcus spent {frac1} of his allowance on a book and {frac2} of his allowance on a snack.",
        "question": "What fraction of his allowance did he spend?",
        "context_type": "shopping",
    },
    {
        "story": "A shopper bought {frac1} gallon of orange juice and {frac2} gallon of apple juice.",
        "question": "How much juice was purchased altogether?",
        "context_type": "shopping",
    },
    {
        "story": "Lily bought {frac1} pound of cheese at the deli and then added {frac2} pound more to her order.",
        "question": "How much cheese did she buy in all?",
        "context_type": "shopping",
    },
    {
        "story": "At the hardware store, Mr. Chen bought {frac1} pound of nails and {frac2} pound of screws.",
        "question": "How many pounds of fasteners did he buy?",
        "context_type": "shopping",
    },
    # -- school --
    {
        "story": "Aisha read {frac1} of her book on Monday and {frac2} of the book on Tuesday.",
        "question": "What fraction of the book has she read so far?",
        "context_type": "school",
    },
    {
        "story": "Tomás spent {frac1} hour on math homework and {frac2} hour on science homework.",
        "question": "How much time did he spend on homework?",
        "context_type": "school",
    },
    {
        "story": "In art class, Zoe used {frac1} bottle of blue paint and {frac2} bottle of yellow paint.",
        "question": "How much paint did she use in all?",
        "context_type": "school",
    },
    {
        "story": "For a science experiment, students mixed {frac1} liter of water with {frac2} liter of vinegar.",
        "question": "How much liquid was in the mixture?",
        "context_type": "school",
    },
    {
        "story": "Nora finished {frac1} of her puzzle before lunch and {frac2} of the puzzle after lunch.",
        "question": "What fraction of the puzzle has she completed?",
        "context_type": "school",
    },
    {
        "story": "During a study session, Liam reviewed {frac1} of his vocabulary words and his partner reviewed {frac2} of the list.",
        "question": "What fraction of the list did they review together?",
        "context_type": "school",
    },
    # -- crafts --
    {
        "story": "To make a friendship bracelet, you need {frac1} meter of red string and {frac2} meter of blue string.",
        "question": "How much string is needed in all?",
        "context_type": "crafts",
    },
    {
        "story": "For a scrapbook page, Ava used {frac1} sheet of sticker paper and {frac2} sheet of patterned paper.",
        "question": "How much paper did she use altogether?",
        "context_type": "crafts",
    },
    {
        "story": "Building a birdhouse requires {frac1} cup of wood glue for the walls and {frac2} cup for the roof.",
        "question": "How much wood glue is needed?",
        "context_type": "crafts",
    },
    {
        "story": "Emma cut {frac1} yard of ribbon for one bow and {frac2} yard for another bow.",
        "question": "How much ribbon did she use in total?",
        "context_type": "crafts",
    },
    {
        "story": "For a mosaic project, Ben used {frac1} bag of blue tiles and {frac2} bag of green tiles.",
        "question": "How many bags of tiles did he use?",
        "context_type": "crafts",
    },
    {
        "story": "A knitting pattern calls for {frac1} skein of yarn for the hat and {frac2} skein for the scarf.",
        "question": "How much yarn is needed altogether?",
        "context_type": "crafts",
    },
    {
        "story": "Sophie mixed {frac1} cup of white paint with {frac2} cup of red paint to make pink.",
        "question": "How much pink paint did she make?",
        "context_type": "crafts",
    },
]

# ---------------------------------------------------------------------------
# SUBTRACTION TEMPLATES (30+)
# Stories about remaining quantities, differences, how much more/less.
# ---------------------------------------------------------------------------

SUBTRACTION_TEMPLATES: list[dict] = [
    # -- cooking --
    {
        "story": "A recipe calls for {frac1} cup of butter, but Rashid only has {frac2} cup.",
        "question": "How much more butter does he need?",
        "context_type": "cooking",
    },
    {
        "story": "There was {frac1} pizza left over. The family ate {frac2} of the pizza for lunch.",
        "question": "How much pizza is left now?",
        "context_type": "cooking",
    },
    {
        "story": "Grandma had {frac1} pound of chocolate. She used {frac2} pound to make brownies.",
        "question": "How much chocolate does she have left?",
        "context_type": "cooking",
    },
    {
        "story": "A jug held {frac1} gallon of lemonade. After the party, only {frac2} gallon remained.",
        "question": "How much lemonade was drunk at the party?",
        "context_type": "cooking",
    },
    {
        "story": "A bag of rice weighs {frac1} kilogram. After making dinner, {frac2} kilogram is left.",
        "question": "How much rice was used for dinner?",
        "context_type": "cooking",
    },
    {
        "story": "The cookie dough recipe makes {frac1} cup of dough. After scooping cookies, {frac2} cup remains in the bowl.",
        "question": "How much dough was scooped out?",
        "context_type": "cooking",
    },
    # -- sports --
    {
        "story": "The total race distance is {frac1} mile. Deshawn has already run {frac2} mile.",
        "question": "How much farther does he have to go?",
        "context_type": "sports",
    },
    {
        "story": "Isabella practiced piano for {frac1} hour. Her brother practiced for {frac2} hour.",
        "question": "How much longer did Isabella practice?",
        "context_type": "sports",
    },
    {
        "story": "A water bottle holds {frac1} liter. After a soccer game, only {frac2} liter is left.",
        "question": "How much water was drunk during the game?",
        "context_type": "sports",
    },
    {
        "story": "The long jump record at school is {frac1} meter. Carlos jumped {frac2} meter.",
        "question": "How much shorter was Carlos's jump than the record?",
        "context_type": "sports",
    },
    {
        "story": "Maya swam {frac1} kilometer on Saturday and {frac2} kilometer on Sunday.",
        "question": "How much farther did she swim on Saturday?",
        "context_type": "sports",
    },
    {
        "story": "A hike is {frac1} mile long. After walking {frac2} mile, the group stopped for a break.",
        "question": "How much of the hike is left?",
        "context_type": "sports",
    },
    # -- shopping --
    {
        "story": "Omar had {frac1} of his birthday money. He spent {frac2} of it on a new game.",
        "question": "What fraction of his money does he have left?",
        "context_type": "shopping",
    },
    {
        "story": "A roll of wrapping paper is {frac1} meter long. Tanya used {frac2} meter for a gift.",
        "question": "How much wrapping paper is left?",
        "context_type": "shopping",
    },
    {
        "story": "A candle was {frac1} foot tall. After burning for an evening, it was only {frac2} foot tall.",
        "question": "How much of the candle burned away?",
        "context_type": "shopping",
    },
    {
        "story": "Wei bought {frac1} pound of trail mix. She gave {frac2} pound to her friend.",
        "question": "How much trail mix does she have now?",
        "context_type": "shopping",
    },
    {
        "story": "A bolt of fabric is {frac1} yard long. A customer bought {frac2} yard.",
        "question": "How much fabric is left on the bolt?",
        "context_type": "shopping",
    },
    {
        "story": "A jar of honey contains {frac1} pound. After using some for tea, {frac2} pound remains.",
        "question": "How much honey was used?",
        "context_type": "shopping",
    },
    # -- school --
    {
        "story": "A homework assignment is {frac1} pages long. Chloe has finished {frac2} pages so far.",
        "question": "How many pages does she have left?",
        "context_type": "school",
    },
    {
        "story": "The class goal was to read {frac1} of the chapter today. They only read {frac2} of it.",
        "question": "What fraction of the chapter is still left to read?",
        "context_type": "school",
    },
    {
        "story": "A glue stick was {frac1} full at the start of art class. By the end, it was {frac2} full.",
        "question": "What fraction of the glue stick was used during class?",
        "context_type": "school",
    },
    {
        "story": "Daniel practiced his spelling words for {frac1} hour. His sister only practiced for {frac2} hour.",
        "question": "How much longer did Daniel practice?",
        "context_type": "school",
    },
    {
        "story": "A science project requires {frac1} meter of copper wire. Students already have {frac2} meter.",
        "question": "How much more wire do they need?",
        "context_type": "school",
    },
    {
        "story": "Ms. Ruiz filled a container with {frac1} liter of water for a class experiment. The students used {frac2} liter.",
        "question": "How much water is left?",
        "context_type": "school",
    },
    # -- crafts --
    {
        "story": "A piece of clay weighs {frac1} pound. After shaping a figurine, the leftover clay weighs {frac2} pound.",
        "question": "How much clay was used for the figurine?",
        "context_type": "crafts",
    },
    {
        "story": "A spool of wire had {frac1} meter on it. Aaliya used {frac2} meter for her jewelry project.",
        "question": "How much wire is left on the spool?",
        "context_type": "crafts",
    },
    {
        "story": "A tube of glitter glue was {frac1} full. After decorating cards, it was {frac2} full.",
        "question": "How much glitter glue was used?",
        "context_type": "crafts",
    },
    {
        "story": "Jackson had {frac1} yard of rope for a macramé project. He cut off {frac2} yard.",
        "question": "How much rope does he have left?",
        "context_type": "crafts",
    },
    {
        "story": "A container of beads was {frac1} full. After making a necklace, it was {frac2} full.",
        "question": "What fraction of the beads were used?",
        "context_type": "crafts",
    },
    {
        "story": "Rosa had {frac1} meter of lace trim. She sewed {frac2} meter onto a pillow.",
        "question": "How much lace trim is left?",
        "context_type": "crafts",
    },
    {
        "story": "A paint palette had {frac1} ounce of green paint. Oliver used {frac2} ounce for his landscape painting.",
        "question": "How much green paint is left?",
        "context_type": "crafts",
    },
]

# ---------------------------------------------------------------------------
# MULTIPLICATION TEMPLATES (25+)
# Stories about repeated groups, scaling recipes, area calculations.
# ---------------------------------------------------------------------------

MULTIPLICATION_TEMPLATES: list[dict] = [
    # -- cooking --
    {
        "story": "A cookie recipe calls for {frac1} cup of sugar. If you make {frac2} batches, you need to figure out the total sugar.",
        "question": "How much sugar is needed for all the batches?",
        "context_type": "cooking",
    },
    {
        "story": "Each serving of oatmeal uses {frac1} cup of oats. Breakfast is being prepared for {frac2} servings.",
        "question": "How many cups of oats are needed?",
        "context_type": "cooking",
    },
    {
        "story": "A smoothie recipe uses {frac1} cup of yogurt. Layla wants to make {frac2} times the recipe.",
        "question": "How much yogurt does she need?",
        "context_type": "cooking",
    },
    {
        "story": "Each mini-pizza uses {frac1} cup of tomato sauce. The class is making {frac2} mini-pizzas worth of sauce.",
        "question": "How much tomato sauce is needed in all?",
        "context_type": "cooking",
    },
    {
        "story": "A muffin recipe calls for {frac1} teaspoon of vanilla per batch. If you make {frac2} batches, you multiply the vanilla.",
        "question": "How much vanilla is needed?",
        "context_type": "cooking",
    },
    # -- sports --
    {
        "story": "Each lap around the track is {frac1} mile. Diego ran {frac2} laps.",
        "question": "How many miles did Diego run?",
        "context_type": "sports",
    },
    {
        "story": "A jump rope routine lasts {frac1} minute. The team practices the routine {frac2} times.",
        "question": "How many minutes do they spend on the routine?",
        "context_type": "sports",
    },
    {
        "story": "Each length of the pool is {frac1} kilometer. Fatima swam {frac2} lengths.",
        "question": "How far did Fatima swim?",
        "context_type": "sports",
    },
    {
        "story": "A warm-up drill takes {frac1} hour. The coach runs the drill {frac2} times during practice.",
        "question": "How much time is spent on the drill?",
        "context_type": "sports",
    },
    {
        "story": "Each sprint covers {frac1} mile. During practice, the team did {frac2} sprints.",
        "question": "How far did they sprint in total?",
        "context_type": "sports",
    },
    # -- shopping --
    {
        "story": "Each bag of apples weighs {frac1} pound. Hana bought {frac2} bags.",
        "question": "How many pounds of apples did she buy?",
        "context_type": "shopping",
    },
    {
        "story": "Ribbon costs a certain amount per yard. Grace needs {frac1} yard for each gift and has {frac2} gifts to wrap.",
        "question": "How many yards of ribbon does she need?",
        "context_type": "shopping",
    },
    {
        "story": "A store is offering {frac2} off the original price. A toy costs {frac1} of a dollar.",
        "question": "What is the discount amount?",
        "context_type": "shopping",
    },
    {
        "story": "Each candle weighs {frac1} pound. A gift set contains {frac2} candles worth of wax.",
        "question": "How much does the wax in the gift set weigh?",
        "context_type": "shopping",
    },
    {
        "story": "Each small bag of trail mix holds {frac1} pound. The store has {frac2} bags.",
        "question": "How many pounds of trail mix does the store have?",
        "context_type": "shopping",
    },
    # -- school --
    {
        "story": "A rectangular bulletin board is {frac1} meter wide and {frac2} meter tall.",
        "question": "What is the area of the bulletin board?",
        "context_type": "school",
    },
    {
        "story": "Each student uses {frac1} sheet of poster board. There are {frac2} groups of students working.",
        "question": "How many sheets of poster board are used?",
        "context_type": "school",
    },
    {
        "story": "A garden plot is {frac1} meter long and {frac2} meter wide.",
        "question": "What is the area of the garden plot?",
        "context_type": "school",
    },
    {
        "story": "Each experiment uses {frac1} liter of solution. The class is running {frac2} experiments.",
        "question": "How much solution is needed?",
        "context_type": "school",
    },
    {
        "story": "A reading assignment is {frac1} chapter per day. Students read for {frac2} days.",
        "question": "How many chapters do they read in total?",
        "context_type": "school",
    },
    # -- crafts --
    {
        "story": "Each friendship bracelet uses {frac1} meter of thread. Mira is making {frac2} bracelets.",
        "question": "How much thread does she need?",
        "context_type": "crafts",
    },
    {
        "story": "A tile mosaic uses tiles that are {frac1} inch wide and {frac2} inch tall.",
        "question": "What is the area of each tile?",
        "context_type": "crafts",
    },
    {
        "story": "Each paper flower needs {frac1} sheet of tissue paper. Noah is making {frac2} flowers.",
        "question": "How many sheets of tissue paper does he need?",
        "context_type": "crafts",
    },
    {
        "story": "A rectangular piece of felt is {frac1} foot long and {frac2} foot wide.",
        "question": "What is the area of the felt?",
        "context_type": "crafts",
    },
    {
        "story": "Each ornament requires {frac1} cup of plaster. Jada is making {frac2} ornaments.",
        "question": "How much plaster does she need?",
        "context_type": "crafts",
    },
    {
        "story": "A piece of origami paper is {frac1} foot by {frac2} foot.",
        "question": "What is the area of the paper?",
        "context_type": "crafts",
    },
]

# ---------------------------------------------------------------------------
# DIVISION TEMPLATES (25+)
# Stories about sharing equally, splitting into groups, rate calculations.
# ---------------------------------------------------------------------------

DIVISION_TEMPLATES: list[dict] = [
    # -- cooking --
    {
        "story": "A pitcher holds {frac1} gallon of lemonade. It is shared equally among glasses, each holding {frac2} gallon.",
        "question": "How many glasses can be filled?",
        "context_type": "cooking",
    },
    {
        "story": "A baker has {frac1} pound of dough and divides it into portions of {frac2} pound each.",
        "question": "How many portions can be made?",
        "context_type": "cooking",
    },
    {
        "story": "There are {frac1} cups of batter to be poured equally into muffin cups, each holding {frac2} cup.",
        "question": "How many muffin cups can be filled?",
        "context_type": "cooking",
    },
    {
        "story": "A block of cheese weighs {frac1} pound. Each slice is {frac2} pound.",
        "question": "How many slices can be cut?",
        "context_type": "cooking",
    },
    {
        "story": "A jar contains {frac1} cup of honey. Each recipe uses {frac2} cup.",
        "question": "How many recipes can be made with this honey?",
        "context_type": "cooking",
    },
    # -- sports --
    {
        "story": "A relay race covers {frac1} mile. Each runner runs {frac2} mile.",
        "question": "How many runners are needed for the relay?",
        "context_type": "sports",
    },
    {
        "story": "Practice lasts {frac1} hour. Each drill takes {frac2} hour.",
        "question": "How many drills can fit into practice?",
        "context_type": "sports",
    },
    {
        "story": "A hiking trail is {frac1} mile long. The group rests every {frac2} mile.",
        "question": "How many rest stops will there be along the trail?",
        "context_type": "sports",
    },
    {
        "story": "A coach has {frac1} hour of gym time and splits it into sessions of {frac2} hour each.",
        "question": "How many sessions can the coach schedule?",
        "context_type": "sports",
    },
    {
        "story": "A cross-country course is {frac1} kilometer. Markers are placed every {frac2} kilometer.",
        "question": "How many markers are placed along the course?",
        "context_type": "sports",
    },
    # -- shopping --
    {
        "story": "A rope is {frac1} meter long. It is cut into pieces that are each {frac2} meter.",
        "question": "How many pieces can be cut?",
        "context_type": "shopping",
    },
    {
        "story": "A board is {frac1} foot long. Each shelf needs {frac2} foot of board.",
        "question": "How many shelves can be cut?",
        "context_type": "shopping",
    },
    {
        "story": "A bag holds {frac1} pound of candy. Each small bag holds {frac2} pound.",
        "question": "How many small bags can be filled?",
        "context_type": "shopping",
    },
    {
        "story": "A spool has {frac1} yard of wire. Each necklace uses {frac2} yard.",
        "question": "How many necklaces can be made?",
        "context_type": "shopping",
    },
    {
        "story": "A large jug of juice holds {frac1} liter. Small cups each hold {frac2} liter.",
        "question": "How many cups can be filled?",
        "context_type": "shopping",
    },
    # -- school --
    {
        "story": "The teacher has {frac1} pack of stickers to divide equally among groups, giving each group {frac2} pack.",
        "question": "How many groups will receive stickers?",
        "context_type": "school",
    },
    {
        "story": "An assignment is {frac1} page long. Students complete {frac2} page per day.",
        "question": "How many days will it take to finish the assignment?",
        "context_type": "school",
    },
    {
        "story": "A lab has {frac1} liter of a chemical. Each experiment uses {frac2} liter.",
        "question": "How many experiments can be performed?",
        "context_type": "school",
    },
    {
        "story": "The class has {frac1} hour for presentations. Each student gets {frac2} hour.",
        "question": "How many students can present?",
        "context_type": "school",
    },
    {
        "story": "A whiteboard is {frac1} meter wide. Each section is {frac2} meter wide.",
        "question": "How many sections fit on the whiteboard?",
        "context_type": "school",
    },
    # -- crafts --
    {
        "story": "A ribbon is {frac1} yard long. Each bow requires {frac2} yard.",
        "question": "How many bows can be made?",
        "context_type": "crafts",
    },
    {
        "story": "A tube of paint holds {frac1} ounce. Each painting uses {frac2} ounce.",
        "question": "How many paintings can be made with one tube?",
        "context_type": "crafts",
    },
    {
        "story": "A roll of tape is {frac1} meter long. Each gift box needs {frac2} meter of tape.",
        "question": "How many gift boxes can be taped?",
        "context_type": "crafts",
    },
    {
        "story": "There is {frac1} cup of glitter. Each card gets {frac2} cup of glitter.",
        "question": "How many cards can be decorated?",
        "context_type": "crafts",
    },
    {
        "story": "A dowel rod is {frac1} foot long. Each puppet handle is {frac2} foot.",
        "question": "How many puppet handles can be cut?",
        "context_type": "crafts",
    },
    {
        "story": "A ball of yarn has {frac1} meter of yarn. Each pom-pom needs {frac2} meter.",
        "question": "How many pom-poms can be made?",
        "context_type": "crafts",
    },
]

# ---------------------------------------------------------------------------
# Lookup map for convenience
# ---------------------------------------------------------------------------

_TEMPLATES_BY_OPERATION: dict[str, list[dict]] = {
    "addition": ADDITION_TEMPLATES,
    "subtraction": SUBTRACTION_TEMPLATES,
    "multiplication": MULTIPLICATION_TEMPLATES,
    "division": DIVISION_TEMPLATES,
    # Short aliases used by fractions.py
    "add": ADDITION_TEMPLATES,
    "subtract": SUBTRACTION_TEMPLATES,
    "multiply": MULTIPLICATION_TEMPLATES,
    "divide": DIVISION_TEMPLATES,
}


def get_word_problem(
    operation: str,
    frac1_str: str,
    frac2_str: str,
    answer_str: str,
    context_type: Optional[str] = None,
) -> dict:
    """Pick a random template for *operation*, fill in fractions, and return
    a dict with ``story``, ``question``, and ``context_type``.

    Parameters
    ----------
    operation:
        One of ``"addition"``, ``"subtraction"``, ``"multiplication"``,
        ``"division"``.
    frac1_str:
        Display string for the first fraction (e.g. ``"3/4"``).
    frac2_str:
        Display string for the second fraction (e.g. ``"1/2"``).
    answer_str:
        Display string for the answer (e.g. ``"1 1/4"``).
    context_type:
        Optional context filter.  One of ``"cooking"``, ``"sports"``,
        ``"shopping"``, ``"school"``, ``"crafts"``, ``"mixed"``, or
        ``None``.  When ``None`` or ``"mixed"``, a template is chosen from
        all available templates for the operation.

    Returns
    -------
    dict
        ``{"story": str, "question": str, "context_type": str}``
    """
    templates = _TEMPLATES_BY_OPERATION.get(operation)
    if not templates:
        raise ValueError(
            f"Unknown operation {operation!r}. "
            f"Expected one of {list(_TEMPLATES_BY_OPERATION.keys())}."
        )

    # Optionally filter by context_type
    if context_type and context_type != "mixed":
        filtered = [t for t in templates if t["context_type"] == context_type]
        if filtered:
            templates = filtered
        # If no templates match the requested context_type, fall back to all.

    template = random.choice(templates)

    story = template["story"].replace("{frac1}", frac1_str).replace(
        "{frac2}", frac2_str
    ).replace("{answer}", answer_str)

    question = template["question"].replace("{frac1}", frac1_str).replace(
        "{frac2}", frac2_str
    ).replace("{answer}", answer_str)

    return {
        "story": story,
        "question": question,
        "context_type": template["context_type"],
    }
