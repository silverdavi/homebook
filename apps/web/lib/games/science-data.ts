/** Shared science data for all games — chemistry, physics, biology */

// ── Elements (for Element Match) ──

export interface ElementData {
  symbol: string;
  name: string;
  atomicNumber: number;
  difficulty: "easy" | "medium" | "hard";
  category: "common" | "metal" | "nonmetal" | "noble" | "tricky";
}

export const ELEMENTS: ElementData[] = [
  // Easy — intuitive symbol matches
  { symbol: "H", name: "Hydrogen", atomicNumber: 1, difficulty: "easy", category: "common" },
  { symbol: "He", name: "Helium", atomicNumber: 2, difficulty: "easy", category: "noble" },
  { symbol: "C", name: "Carbon", atomicNumber: 6, difficulty: "easy", category: "common" },
  { symbol: "N", name: "Nitrogen", atomicNumber: 7, difficulty: "easy", category: "common" },
  { symbol: "O", name: "Oxygen", atomicNumber: 8, difficulty: "easy", category: "common" },
  { symbol: "Al", name: "Aluminum", atomicNumber: 13, difficulty: "easy", category: "metal" },
  { symbol: "Si", name: "Silicon", atomicNumber: 14, difficulty: "easy", category: "nonmetal" },
  { symbol: "S", name: "Sulfur", atomicNumber: 16, difficulty: "easy", category: "nonmetal" },
  { symbol: "Ca", name: "Calcium", atomicNumber: 20, difficulty: "easy", category: "metal" },
  { symbol: "Cl", name: "Chlorine", atomicNumber: 17, difficulty: "easy", category: "nonmetal" },

  // Medium — less obvious matches
  { symbol: "Li", name: "Lithium", atomicNumber: 3, difficulty: "medium", category: "metal" },
  { symbol: "B", name: "Boron", atomicNumber: 5, difficulty: "medium", category: "nonmetal" },
  { symbol: "F", name: "Fluorine", atomicNumber: 9, difficulty: "medium", category: "nonmetal" },
  { symbol: "Ne", name: "Neon", atomicNumber: 10, difficulty: "medium", category: "noble" },
  { symbol: "Mg", name: "Magnesium", atomicNumber: 12, difficulty: "medium", category: "metal" },
  { symbol: "P", name: "Phosphorus", atomicNumber: 15, difficulty: "medium", category: "nonmetal" },
  { symbol: "Ar", name: "Argon", atomicNumber: 18, difficulty: "medium", category: "noble" },
  { symbol: "Mn", name: "Manganese", atomicNumber: 25, difficulty: "medium", category: "metal" },
  { symbol: "Ni", name: "Nickel", atomicNumber: 28, difficulty: "medium", category: "metal" },
  { symbol: "Zn", name: "Zinc", atomicNumber: 30, difficulty: "medium", category: "metal" },
  { symbol: "Br", name: "Bromine", atomicNumber: 35, difficulty: "medium", category: "nonmetal" },
  { symbol: "I", name: "Iodine", atomicNumber: 53, difficulty: "medium", category: "nonmetal" },

  // Hard — symbol doesn't match name (Latin/historical names)
  { symbol: "Na", name: "Sodium", atomicNumber: 11, difficulty: "hard", category: "tricky" },
  { symbol: "K", name: "Potassium", atomicNumber: 19, difficulty: "hard", category: "tricky" },
  { symbol: "Fe", name: "Iron", atomicNumber: 26, difficulty: "hard", category: "tricky" },
  { symbol: "Cu", name: "Copper", atomicNumber: 29, difficulty: "hard", category: "tricky" },
  { symbol: "Ag", name: "Silver", atomicNumber: 47, difficulty: "hard", category: "tricky" },
  { symbol: "Sn", name: "Tin", atomicNumber: 50, difficulty: "hard", category: "tricky" },
  { symbol: "Au", name: "Gold", atomicNumber: 79, difficulty: "hard", category: "tricky" },
  { symbol: "Hg", name: "Mercury", atomicNumber: 80, difficulty: "hard", category: "tricky" },
  { symbol: "Pb", name: "Lead", atomicNumber: 82, difficulty: "hard", category: "tricky" },
  { symbol: "W", name: "Tungsten", atomicNumber: 74, difficulty: "hard", category: "tricky" },
  { symbol: "Pt", name: "Platinum", atomicNumber: 78, difficulty: "hard", category: "metal" },
  { symbol: "U", name: "Uranium", atomicNumber: 92, difficulty: "hard", category: "metal" },
];

export function getElementsByDifficulty(diff: "easy" | "medium" | "hard"): ElementData[] {
  if (diff === "easy") return ELEMENTS.filter((e) => e.difficulty === "easy");
  if (diff === "medium") return ELEMENTS.filter((e) => e.difficulty !== "hard");
  return ELEMENTS; // hard includes all
}

// ── Science Words (for Word Builder) ──

export interface ScienceWord {
  word: string;
  hint: string;
  category: "Chemistry" | "Physics" | "Biology";
  difficulty: "easy" | "medium" | "hard";
}

export const SCIENCE_WORDS: ScienceWord[] = [
  // ── Chemistry ──
  { word: "ATOM", hint: "Smallest unit of a chemical element", category: "Chemistry", difficulty: "easy" },
  { word: "ION", hint: "Charged atom or molecule", category: "Chemistry", difficulty: "easy" },
  { word: "ACID", hint: "Substance with pH below 7", category: "Chemistry", difficulty: "easy" },
  { word: "BASE", hint: "Substance with pH above 7", category: "Chemistry", difficulty: "easy" },
  { word: "BOND", hint: "Link between atoms in a molecule", category: "Chemistry", difficulty: "easy" },
  { word: "MOLE", hint: "Unit measuring amount of substance", category: "Chemistry", difficulty: "medium" },
  { word: "OXIDE", hint: "Compound containing oxygen", category: "Chemistry", difficulty: "medium" },
  { word: "ALLOY", hint: "Mixture of two or more metals", category: "Chemistry", difficulty: "medium" },
  { word: "REDOX", hint: "Reaction involving electron transfer", category: "Chemistry", difficulty: "medium" },
  { word: "ENZYME", hint: "Biological catalyst", category: "Chemistry", difficulty: "medium" },
  { word: "ISOTOPE", hint: "Atoms with same protons, different neutrons", category: "Chemistry", difficulty: "hard" },
  { word: "POLYMER", hint: "Large molecule made of repeating units", category: "Chemistry", difficulty: "hard" },
  { word: "CATALYST", hint: "Speeds up reactions without being consumed", category: "Chemistry", difficulty: "hard" },
  { word: "SOLVENT", hint: "Liquid that dissolves other substances", category: "Chemistry", difficulty: "medium" },
  { word: "PROTON", hint: "Positive particle in the nucleus", category: "Chemistry", difficulty: "easy" },
  { word: "NEUTRON", hint: "Neutral particle in the nucleus", category: "Chemistry", difficulty: "easy" },

  // ── Physics ──
  { word: "MASS", hint: "Amount of matter in an object", category: "Physics", difficulty: "easy" },
  { word: "FORCE", hint: "Push or pull on an object", category: "Physics", difficulty: "easy" },
  { word: "WAVE", hint: "Disturbance that transfers energy", category: "Physics", difficulty: "easy" },
  { word: "VOLT", hint: "Unit of electrical potential", category: "Physics", difficulty: "easy" },
  { word: "WATT", hint: "Unit of power", category: "Physics", difficulty: "easy" },
  { word: "PRISM", hint: "Splits white light into colors", category: "Physics", difficulty: "easy" },
  { word: "JOULE", hint: "Unit of energy", category: "Physics", difficulty: "medium" },
  { word: "TORQUE", hint: "Rotational force", category: "Physics", difficulty: "medium" },
  { word: "PHOTON", hint: "Particle of light", category: "Physics", difficulty: "medium" },
  { word: "INERTIA", hint: "Tendency to resist change in motion", category: "Physics", difficulty: "medium" },
  { word: "VECTOR", hint: "Quantity with magnitude and direction", category: "Physics", difficulty: "medium" },
  { word: "QUARK", hint: "Fundamental particle inside protons", category: "Physics", difficulty: "hard" },
  { word: "ENTROPY", hint: "Measure of disorder in a system", category: "Physics", difficulty: "hard" },
  { word: "MOMENTUM", hint: "Mass times velocity", category: "Physics", difficulty: "hard" },
  { word: "FRICTION", hint: "Force that opposes sliding motion", category: "Physics", difficulty: "medium" },
  { word: "GRAVITY", hint: "Force that attracts objects with mass", category: "Physics", difficulty: "easy" },
  { word: "PLASMA", hint: "Fourth state of matter", category: "Physics", difficulty: "medium" },
  { word: "OPTICS", hint: "Study of light behavior", category: "Physics", difficulty: "medium" },

  // ── Biology ──
  { word: "CELL", hint: "Basic unit of all living things", category: "Biology", difficulty: "easy" },
  { word: "GENE", hint: "Unit of heredity on a chromosome", category: "Biology", difficulty: "easy" },
  { word: "DNA", hint: "Molecule carrying genetic instructions", category: "Biology", difficulty: "easy" },
  { word: "RNA", hint: "Molecule that helps make proteins", category: "Biology", difficulty: "easy" },
  { word: "FLORA", hint: "Plant life of a region", category: "Biology", difficulty: "easy" },
  { word: "FAUNA", hint: "Animal life of a region", category: "Biology", difficulty: "easy" },
  { word: "ORGAN", hint: "Body part with a specific function", category: "Biology", difficulty: "easy" },
  { word: "VIRUS", hint: "Tiny infectious agent, not truly alive", category: "Biology", difficulty: "medium" },
  { word: "MITOSIS", hint: "Cell division producing identical cells", category: "Biology", difficulty: "medium" },
  { word: "BIOME", hint: "Large ecological community (e.g. desert)", category: "Biology", difficulty: "medium" },
  { word: "GENUS", hint: "Taxonomic rank above species", category: "Biology", difficulty: "medium" },
  { word: "SPORE", hint: "Reproductive cell of fungi or ferns", category: "Biology", difficulty: "medium" },
  { word: "ALLELE", hint: "Variant form of a gene", category: "Biology", difficulty: "hard" },
  { word: "GENOME", hint: "Complete set of genes in an organism", category: "Biology", difficulty: "hard" },
  { word: "PHYLUM", hint: "Major taxonomic division of organisms", category: "Biology", difficulty: "hard" },
  { word: "ENZYME", hint: "Protein that speeds up reactions", category: "Biology", difficulty: "medium" },
  { word: "SYNAPSE", hint: "Junction between two nerve cells", category: "Biology", difficulty: "hard" },
  { word: "OSMOSIS", hint: "Water moving through a membrane", category: "Biology", difficulty: "hard" },
];

// ── Science Sentences (for Letter Rain) ──

export interface ScienceSentence {
  text: string;
  category: "chemistry" | "physics" | "biology";
  difficulty: "easy" | "medium" | "hard";
}

export const SCIENCE_SENTENCES: ScienceSentence[] = [
  // ── Chemistry ──
  { text: "Water is made of hydrogen and oxygen", category: "chemistry", difficulty: "easy" },
  { text: "Salt dissolves in water", category: "chemistry", difficulty: "easy" },
  { text: "Acids taste sour", category: "chemistry", difficulty: "easy" },
  { text: "Iron rusts when exposed to water and air", category: "chemistry", difficulty: "easy" },
  { text: "Carbon dioxide is a greenhouse gas", category: "chemistry", difficulty: "medium" },
  { text: "The periodic table organizes elements by atomic number", category: "chemistry", difficulty: "medium" },
  { text: "Metals are good conductors of heat and electricity", category: "chemistry", difficulty: "medium" },
  { text: "A chemical reaction changes one substance into another", category: "chemistry", difficulty: "medium" },
  { text: "Covalent bonds share electrons between atoms", category: "chemistry", difficulty: "hard" },
  { text: "Endothermic reactions absorb heat from their surroundings", category: "chemistry", difficulty: "hard" },
  { text: "The mole is a unit that measures the amount of substance", category: "chemistry", difficulty: "hard" },

  // ── Physics ──
  { text: "Light travels faster than sound", category: "physics", difficulty: "easy" },
  { text: "Gravity pulls objects toward earth", category: "physics", difficulty: "easy" },
  { text: "Energy cannot be created or destroyed", category: "physics", difficulty: "easy" },
  { text: "A magnet has a north and south pole", category: "physics", difficulty: "easy" },
  { text: "Sound needs a medium to travel through", category: "physics", difficulty: "medium" },
  { text: "An object at rest stays at rest unless acted on by a force", category: "physics", difficulty: "medium" },
  { text: "Electric current flows from positive to negative", category: "physics", difficulty: "medium" },
  { text: "The speed of light is about three hundred million meters per second", category: "physics", difficulty: "medium" },
  { text: "Kinetic energy depends on mass and the square of velocity", category: "physics", difficulty: "hard" },
  { text: "Every action has an equal and opposite reaction", category: "physics", difficulty: "hard" },
  { text: "Electromagnetic waves do not need a medium to propagate", category: "physics", difficulty: "hard" },

  // ── Biology ──
  { text: "Plants make food using sunlight", category: "biology", difficulty: "easy" },
  { text: "Humans have two hundred and six bones", category: "biology", difficulty: "easy" },
  { text: "The heart pumps blood through the body", category: "biology", difficulty: "easy" },
  { text: "Cells are the building blocks of life", category: "biology", difficulty: "easy" },
  { text: "Photosynthesis converts light energy into chemical energy", category: "biology", difficulty: "medium" },
  { text: "DNA carries the genetic instructions for all living things", category: "biology", difficulty: "medium" },
  { text: "Mitochondria produce energy for the cell", category: "biology", difficulty: "medium" },
  { text: "Ecosystems include living organisms and their physical environment", category: "biology", difficulty: "medium" },
  { text: "Natural selection drives the evolution of species over time", category: "biology", difficulty: "hard" },
  { text: "Chromosomes are made of tightly coiled strands of DNA", category: "biology", difficulty: "hard" },
  { text: "The nervous system transmits signals using electrical impulses", category: "biology", difficulty: "hard" },
];
