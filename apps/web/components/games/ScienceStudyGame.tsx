"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Zap, RotateCcw, ChevronRight, CheckCircle2, XCircle, Lightbulb, Trophy, Star } from "lucide-react";
import { createAdaptiveState, adaptiveUpdate, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import { trackGamePlayed, setLocalHighScore, getLocalHighScore, getSavedName } from "@/lib/games/use-scores";
import { checkAchievements, type GameStats } from "@/lib/games/achievements";
import { sfxCorrect, sfxWrong, sfxCombo, sfxLevelUp } from "@/lib/games/audio";

// ── Types ──

interface ScienceQuestion {
  id: string;
  subject: "chemistry" | "biology" | "physics" | "earth-science";
  topic: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  funFact?: string;
}

type Subject = "chemistry" | "biology" | "physics" | "earth-science";
type GameMode = "study" | "quiz" | "practice";
type Phase = "menu" | "topic-select" | "playing" | "result" | "review";

// ── Subject & Topic Config ──

const SUBJECTS: { id: Subject; label: string; color: string; bg: string; border: string; topics: { id: string; label: string }[] }[] = [
  {
    id: "chemistry", label: "Chemistry", color: "#3b82f6", bg: "bg-blue-500/10", border: "border-blue-500/30",
    topics: [
      { id: "periodic-table", label: "Periodic Table" },
      { id: "states-of-matter", label: "States of Matter" },
      { id: "chemical-reactions", label: "Chemical Reactions" },
      { id: "acids-bases", label: "Acids & Bases" },
      { id: "atoms-molecules", label: "Atoms & Molecules" },
    ],
  },
  {
    id: "biology", label: "Biology", color: "#22c55e", bg: "bg-green-500/10", border: "border-green-500/30",
    topics: [
      { id: "cell-biology", label: "Cell Biology" },
      { id: "dna-genetics", label: "DNA & Genetics" },
      { id: "human-body", label: "Human Body" },
      { id: "ecosystems", label: "Ecosystems" },
      { id: "evolution", label: "Evolution" },
    ],
  },
  {
    id: "physics", label: "Physics", color: "#a855f7", bg: "bg-purple-500/10", border: "border-purple-500/30",
    topics: [
      { id: "forces-motion", label: "Forces & Motion" },
      { id: "energy-waves", label: "Energy & Waves" },
      { id: "electricity", label: "Electricity" },
      { id: "heat", label: "Heat & Temperature" },
    ],
  },
  {
    id: "earth-science", label: "Earth Science", color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/30",
    topics: [
      { id: "plate-tectonics", label: "Plate Tectonics" },
      { id: "weather-climate", label: "Weather & Climate" },
      { id: "space", label: "Space & Astronomy" },
      { id: "rocks-minerals", label: "Rocks & Minerals" },
    ],
  },
];

// ── Topic Intros ──

const TOPIC_INTROS: Record<string, string> = {
  "periodic-table": "The Periodic Table organizes all 118 known elements by their atomic number and properties. Elements in the same column (group) behave similarly. Metals are on the left, nonmetals on the right, and noble gases in the far right column.",
  "states-of-matter": "Matter exists in four main states: solid, liquid, gas, and plasma. Temperature and pressure determine which state matter is in. When matter changes state (like ice melting to water), the molecules gain or lose energy.",
  "chemical-reactions": "A chemical reaction happens when substances combine or break apart to form new substances. The atoms rearrange but are never created or destroyed. Reactions can release energy (exothermic) or absorb energy (endothermic).",
  "acids-bases": "Acids taste sour and have a pH below 7. Bases taste bitter and have a pH above 7. Pure water has a pH of exactly 7 (neutral). When an acid and base combine, they neutralize each other and often produce water and a salt.",
  "atoms-molecules": "Atoms are the smallest units of matter that keep their chemical identity. They contain protons (+), neutrons (neutral), and electrons (-). When atoms bond together, they form molecules — water (H\u2082O) is two hydrogen atoms bonded to one oxygen atom.",
  "cell-biology": "Cells are the basic building blocks of all living things. Your body has about 37 trillion cells! There are two main types: prokaryotic cells (bacteria, no nucleus) and eukaryotic cells (plants and animals, with a nucleus containing DNA).",
  "dna-genetics": "DNA is the molecule that carries the instructions for building and running every living organism. It's shaped like a twisted ladder (double helix) made of four bases: A, T, C, and G. Genes are sections of DNA that code for specific traits.",
  "human-body": "The human body is a remarkable machine made up of organ systems working together. The circulatory system pumps blood, the respiratory system handles breathing, the nervous system sends signals, and the digestive system breaks down food for energy.",
  "ecosystems": "An ecosystem includes all the living organisms and nonliving things in an area, and how they interact. Energy flows through food chains from producers (plants) to consumers (animals). Ecosystems can be as small as a puddle or as large as the ocean.",
  "evolution": "Evolution is the process by which living things change over generations. Charles Darwin proposed natural selection: organisms with traits that help them survive are more likely to reproduce. Over millions of years, this leads to new species.",
  "forces-motion": "A force is a push or pull on an object. Isaac Newton described three laws of motion: (1) objects stay still or keep moving unless a force acts on them, (2) force equals mass times acceleration, and (3) every action has an equal and opposite reaction.",
  "energy-waves": "Energy is the ability to do work, and it comes in many forms: kinetic (motion), potential (stored), thermal (heat), and more. Energy cannot be created or destroyed — only transformed. Light and sound travel as waves with different wavelengths and frequencies.",
  "electricity": "Electricity is the flow of tiny charged particles called electrons. In a circuit, electrons flow from a power source through wires and components and back. Voltage pushes the current, and resistance slows it down — described by Ohm's Law: V = I × R.",
  "heat": "Heat is the transfer of thermal energy from a warmer object to a cooler one. It moves by conduction (direct contact), convection (fluid currents), and radiation (electromagnetic waves). Temperature measures the average kinetic energy of particles in a substance.",
  "plate-tectonics": "Earth's outer shell is divided into massive plates that float on the semi-liquid mantle below. These tectonic plates move very slowly (a few centimeters per year) and their interactions cause earthquakes, volcanoes, and mountain formation.",
  "weather-climate": "Weather is the day-to-day condition of the atmosphere (temperature, rain, wind). Climate is the average weather over a long period. The water cycle — evaporation, condensation, precipitation — drives much of Earth's weather patterns.",
  "space": "Our solar system has eight planets orbiting the Sun. Earth is the third planet and the only one known to support life. Beyond our solar system, the Milky Way galaxy contains hundreds of billions of stars, and the observable universe has trillions of galaxies.",
  "rocks-minerals": "Rocks are classified into three types based on how they form: igneous (from cooled magma), sedimentary (from compressed layers), and metamorphic (changed by heat and pressure). The rock cycle describes how rocks transform from one type to another over millions of years.",
};

// ── Questions Database ──

const QUESTIONS: ScienceQuestion[] = [
  // ─── CHEMISTRY: Periodic Table ───
  { id:"c01", subject:"chemistry", topic:"periodic-table", difficulty:1, question:"What is the chemical symbol for oxygen?", choices:["Ox","O","Og","Om"], correctIndex:1, explanation:"Oxygen's symbol is O. It makes up about 21% of Earth's atmosphere and is essential for breathing.", funFact:"Oxygen is the third most abundant element in the universe!" },
  { id:"c02", subject:"chemistry", topic:"periodic-table", difficulty:1, question:"What is the chemical symbol for gold?", choices:["Go","Gd","Au","Ag"], correctIndex:2, explanation:"Gold's symbol 'Au' comes from the Latin word 'aurum' meaning 'shining dawn'.", funFact:"All the gold ever mined would fit in about 3.5 Olympic swimming pools." },
  { id:"c03", subject:"chemistry", topic:"periodic-table", difficulty:1, question:"What is the chemical symbol for water?", choices:["Wa","HO","H₂O","WO"], correctIndex:2, explanation:"Water is H₂O — two hydrogen atoms bonded to one oxygen atom. It's essential for all known life." },
  { id:"c04", subject:"chemistry", topic:"periodic-table", difficulty:2, question:"What element has the atomic number 1?", choices:["Helium","Hydrogen","Lithium","Carbon"], correctIndex:1, explanation:"Hydrogen is element #1 — the lightest and most abundant element in the universe. Stars are mostly hydrogen.", funFact:"About 73% of all visible matter in the universe is hydrogen!" },
  { id:"c05", subject:"chemistry", topic:"periodic-table", difficulty:2, question:"Which element's symbol is 'Fe'?", choices:["Fluorine","Fermium","Iron","Francium"], correctIndex:2, explanation:"Iron's symbol 'Fe' comes from the Latin 'ferrum'. Iron is the most common element on Earth by mass and is essential for making steel." },
  { id:"c06", subject:"chemistry", topic:"periodic-table", difficulty:2, question:"Which group of elements is known for being very unreactive?", choices:["Alkali metals","Halogens","Noble gases","Transition metals"], correctIndex:2, explanation:"Noble gases (helium, neon, argon, etc.) have full outer electron shells, making them very stable and unreactive." },
  { id:"c07", subject:"chemistry", topic:"periodic-table", difficulty:3, question:"What is the most abundant element in Earth's crust?", choices:["Iron","Silicon","Oxygen","Aluminum"], correctIndex:2, explanation:"Oxygen makes up about 46% of Earth's crust by mass, mostly bound in silicate minerals and oxides." },
  { id:"c08", subject:"chemistry", topic:"periodic-table", difficulty:3, question:"Which element has the symbol 'Na'?", choices:["Nitrogen","Neon","Sodium","Nickel"], correctIndex:2, explanation:"Sodium's symbol 'Na' comes from the Latin 'natrium'. Sodium is a soft, reactive alkali metal found in table salt (NaCl)." },
  { id:"c09", subject:"chemistry", topic:"periodic-table", difficulty:4, question:"Which element is liquid at room temperature (besides mercury)?", choices:["Gallium","Bromine","Cesium","Francium"], correctIndex:1, explanation:"Bromine (Br) is the only nonmetal that is liquid at room temperature. Mercury (Hg) is the only metal." },
  { id:"c10", subject:"chemistry", topic:"periodic-table", difficulty:4, question:"What are elements in the same column of the periodic table called?", choices:["Periods","Isotopes","Groups","Compounds"], correctIndex:2, explanation:"Elements in the same column are called groups (or families). They share similar chemical properties because they have the same number of outer electrons." },
  { id:"c11", subject:"chemistry", topic:"periodic-table", difficulty:5, question:"What is the heaviest naturally occurring element?", choices:["Plutonium","Uranium","Radium","Thorium"], correctIndex:1, explanation:"Uranium (U, atomic number 92) is the heaviest element found naturally in significant quantities. It's used in nuclear power and was key in the development of nuclear energy." },

  // ─── CHEMISTRY: States of Matter ───
  { id:"c12", subject:"chemistry", topic:"states-of-matter", difficulty:1, question:"What state of matter has a definite shape and volume?", choices:["Gas","Liquid","Solid","Plasma"], correctIndex:2, explanation:"Solids have particles packed tightly in a fixed arrangement, giving them both a definite shape and definite volume." },
  { id:"c13", subject:"chemistry", topic:"states-of-matter", difficulty:1, question:"What happens when you heat ice?", choices:["It evaporates","It melts","It freezes","It sublimates"], correctIndex:1, explanation:"Heating ice adds energy to the water molecules, breaking the solid crystal structure. The ice melts into liquid water at 0°C (32°F)." },
  { id:"c14", subject:"chemistry", topic:"states-of-matter", difficulty:2, question:"What is it called when a liquid turns into a gas?", choices:["Condensation","Melting","Evaporation","Freezing"], correctIndex:2, explanation:"Evaporation occurs when liquid molecules gain enough energy to escape into the gas phase. Boiling is rapid evaporation throughout the liquid." },
  { id:"c15", subject:"chemistry", topic:"states-of-matter", difficulty:3, question:"What is the fourth state of matter found in stars and lightning?", choices:["Bose-Einstein condensate","Superfluid","Plasma","Dark matter"], correctIndex:2, explanation:"Plasma is superheated matter where electrons are stripped from atoms, creating a soup of charged particles. Over 99% of visible matter in the universe is plasma!" },
  { id:"c16", subject:"chemistry", topic:"states-of-matter", difficulty:3, question:"What is sublimation?", choices:["Solid to gas directly","Liquid to solid","Gas to liquid","Liquid to gas"], correctIndex:0, explanation:"Sublimation is when a solid changes directly to a gas without becoming a liquid first. Dry ice (solid CO₂) is a common example." },
  { id:"c17", subject:"chemistry", topic:"states-of-matter", difficulty:4, question:"At what temperature (°C) does pure water boil at sea level?", choices:["90°C","100°C","110°C","212°C"], correctIndex:1, explanation:"Pure water boils at exactly 100°C (212°F) at standard atmospheric pressure (sea level). At higher altitudes, water boils at lower temperatures." },

  // ─── CHEMISTRY: Chemical Reactions ───
  { id:"c18", subject:"chemistry", topic:"chemical-reactions", difficulty:1, question:"What does rust form from?", choices:["Iron and water only","Iron and oxygen","Iron and carbon","Iron and nitrogen"], correctIndex:1, explanation:"Rust (iron oxide) forms when iron reacts with oxygen, especially in the presence of water. The chemical formula is Fe₂O₃." },
  { id:"c19", subject:"chemistry", topic:"chemical-reactions", difficulty:2, question:"What type of reaction releases heat energy?", choices:["Endothermic","Exothermic","Synthesis","Photolysis"], correctIndex:1, explanation:"Exothermic reactions release energy as heat. Burning wood, combustion engines, and hand warmers are all exothermic. 'Exo' means outward." },
  { id:"c20", subject:"chemistry", topic:"chemical-reactions", difficulty:2, question:"In a chemical equation, what does the arrow (→) mean?", choices:["Equals","Yields/produces","Plus","Minus"], correctIndex:1, explanation:"The arrow in a chemical equation means 'yields' or 'produces'. Reactants are on the left, products on the right: A + B → C + D." },
  { id:"c21", subject:"chemistry", topic:"chemical-reactions", difficulty:3, question:"What is the law that says atoms are neither created nor destroyed in a reaction?", choices:["Law of Gravity","Law of Thermodynamics","Law of Conservation of Mass","Newton's Third Law"], correctIndex:2, explanation:"The Law of Conservation of Mass states that in a chemical reaction, the total mass of reactants equals the total mass of products. Atoms just rearrange." },
  { id:"c22", subject:"chemistry", topic:"chemical-reactions", difficulty:4, question:"What type of reaction involves a substance combining with oxygen, often producing heat and light?", choices:["Decomposition","Combustion","Synthesis","Neutralization"], correctIndex:1, explanation:"Combustion is a reaction with oxygen that releases heat and light. Burning fuel, candles, and fireworks are all combustion reactions." },

  // ─── CHEMISTRY: Acids & Bases ───
  { id:"c23", subject:"chemistry", topic:"acids-bases", difficulty:1, question:"What color does litmus paper turn in an acid?", choices:["Blue","Green","Red","Yellow"], correctIndex:2, explanation:"Blue litmus paper turns red in acidic solutions. Red litmus paper turns blue in basic (alkaline) solutions. This is a simple way to test pH." },
  { id:"c24", subject:"chemistry", topic:"acids-bases", difficulty:2, question:"What is the pH of pure water?", choices:["0","5","7","14"], correctIndex:2, explanation:"Pure water has a pH of exactly 7, which is neutral — neither acidic nor basic. The pH scale runs from 0 (very acidic) to 14 (very basic)." },
  { id:"c25", subject:"chemistry", topic:"acids-bases", difficulty:2, question:"Which of these is an acid?", choices:["Baking soda","Bleach","Lemon juice","Soap"], correctIndex:2, explanation:"Lemon juice contains citric acid with a pH around 2. Baking soda, bleach, and soap are all bases (alkaline)." },
  { id:"c26", subject:"chemistry", topic:"acids-bases", difficulty:3, question:"What happens when you mix an acid and a base?", choices:["Explosion","Neutralization","Combustion","Sublimation"], correctIndex:1, explanation:"Mixing an acid and base causes neutralization, typically producing water and a salt. For example: HCl + NaOH → NaCl + H₂O." },
  { id:"c27", subject:"chemistry", topic:"acids-bases", difficulty:4, question:"What does pH stand for?", choices:["Pure hydrogen","Potential of hydrogen","Parts per hydrogen","Power of hydrogen"], correctIndex:1, explanation:"pH stands for 'potential of hydrogen' (or 'power of hydrogen'). It measures the concentration of hydrogen ions (H⁺) in a solution." },

  // ─── CHEMISTRY: Atoms & Molecules ───
  { id:"c28", subject:"chemistry", topic:"atoms-molecules", difficulty:1, question:"What are the three main particles in an atom?", choices:["Protons, neutrons, electrons","Protons, photons, electrons","Neutrons, neurons, electrons","Protons, neutrons, positrons"], correctIndex:0, explanation:"Atoms contain protons (positive charge) and neutrons (no charge) in the nucleus, with electrons (negative charge) orbiting around it." },
  { id:"c29", subject:"chemistry", topic:"atoms-molecules", difficulty:2, question:"What type of bond involves sharing electrons between atoms?", choices:["Ionic bond","Covalent bond","Metallic bond","Hydrogen bond"], correctIndex:1, explanation:"Covalent bonds form when atoms share electrons. For example, in water (H₂O), oxygen shares electrons with two hydrogen atoms." },
  { id:"c30", subject:"chemistry", topic:"atoms-molecules", difficulty:3, question:"What determines the element an atom is?", choices:["Number of electrons","Number of neutrons","Number of protons","Its mass"], correctIndex:2, explanation:"The number of protons (atomic number) defines which element an atom is. Carbon always has 6 protons, oxygen always has 8, etc." },
  { id:"c31", subject:"chemistry", topic:"atoms-molecules", difficulty:4, question:"What are atoms of the same element with different numbers of neutrons called?", choices:["Ions","Isomers","Isotopes","Allotropes"], correctIndex:2, explanation:"Isotopes are atoms of the same element with different neutron counts. For example, Carbon-12 has 6 neutrons, while Carbon-14 has 8 neutrons." },

  // ─── BIOLOGY: Cell Biology ───
  { id:"b01", subject:"biology", topic:"cell-biology", difficulty:1, question:"What is the 'powerhouse of the cell'?", choices:["Nucleus","Ribosome","Mitochondria","Cell membrane"], correctIndex:2, explanation:"Mitochondria produce energy (ATP) for the cell through cellular respiration. They convert glucose and oxygen into usable energy.", funFact:"Mitochondria have their own DNA, separate from the cell's nucleus!" },
  { id:"b02", subject:"biology", topic:"cell-biology", difficulty:1, question:"What part of a cell contains its DNA?", choices:["Cytoplasm","Nucleus","Cell wall","Ribosome"], correctIndex:1, explanation:"The nucleus is the cell's control center, containing DNA organized into chromosomes. It directs all cell activities." },
  { id:"b03", subject:"biology", topic:"cell-biology", difficulty:2, question:"What do plant cells have that animal cells do NOT?", choices:["Nucleus","Mitochondria","Cell wall","Ribosomes"], correctIndex:2, explanation:"Plant cells have a rigid cell wall made of cellulose outside their cell membrane. Animal cells only have a flexible cell membrane." },
  { id:"b04", subject:"biology", topic:"cell-biology", difficulty:2, question:"What is the function of ribosomes?", choices:["Energy production","Protein synthesis","Cell division","Waste removal"], correctIndex:1, explanation:"Ribosomes are the cell's protein factories. They read instructions from mRNA and assemble amino acids into proteins." },
  { id:"b05", subject:"biology", topic:"cell-biology", difficulty:3, question:"What organelle packages and ships proteins out of the cell?", choices:["Endoplasmic reticulum","Golgi apparatus","Lysosome","Vacuole"], correctIndex:1, explanation:"The Golgi apparatus (or Golgi body) modifies, packages, and ships proteins and lipids to their destinations inside or outside the cell." },
  { id:"b06", subject:"biology", topic:"cell-biology", difficulty:4, question:"What process do cells use to divide into two identical copies?", choices:["Meiosis","Mitosis","Binary fission","Budding"], correctIndex:1, explanation:"Mitosis is cell division that produces two identical daughter cells. It's used for growth and repair. Meiosis produces sex cells with half the DNA." },

  // ─── BIOLOGY: DNA & Genetics ───
  { id:"b07", subject:"biology", topic:"dna-genetics", difficulty:1, question:"What does DNA stand for?", choices:["Deoxyribonucleic acid","Dinitrogen acid","Dynamic nuclear acid","Double nucleic acid"], correctIndex:0, explanation:"DNA stands for deoxyribonucleic acid. It carries the genetic instructions for building and maintaining all living organisms." },
  { id:"b08", subject:"biology", topic:"dna-genetics", difficulty:2, question:"What shape is a DNA molecule?", choices:["Straight ladder","Single helix","Double helix","Triple helix"], correctIndex:2, explanation:"DNA has a famous double helix shape — like a twisted ladder. The 'rungs' are base pairs (A-T and C-G) and the 'sides' are sugar-phosphate backbones." },
  { id:"b09", subject:"biology", topic:"dna-genetics", difficulty:2, question:"How many chromosomes do human cells normally have?", choices:["23","46","48","64"], correctIndex:1, explanation:"Human cells have 46 chromosomes (23 pairs). You get 23 from your mother and 23 from your father." },
  { id:"b10", subject:"biology", topic:"dna-genetics", difficulty:3, question:"In DNA, which base pairs with adenine (A)?", choices:["Cytosine","Guanine","Thymine","Uracil"], correctIndex:2, explanation:"In DNA, adenine (A) always pairs with thymine (T), and cytosine (C) always pairs with guanine (G). These are called complementary base pairs." },
  { id:"b11", subject:"biology", topic:"dna-genetics", difficulty:4, question:"What is a mutation?", choices:["A new species forming","A change in DNA sequence","Cell division error","Protein folding"], correctIndex:1, explanation:"A mutation is any change in the DNA sequence. Mutations can be harmful, helpful, or neutral. They are the raw material for evolution." },
  { id:"b12", subject:"biology", topic:"dna-genetics", difficulty:3, question:"What are genes?", choices:["Entire chromosomes","Sections of DNA coding for traits","Types of proteins","Parts of cell membranes"], correctIndex:1, explanation:"Genes are specific sections of DNA that contain instructions for making proteins, which determine traits like eye color, height, and blood type." },

  // ─── BIOLOGY: Human Body ───
  { id:"b13", subject:"biology", topic:"human-body", difficulty:1, question:"What organ pumps blood throughout your body?", choices:["Brain","Lungs","Heart","Liver"], correctIndex:2, explanation:"Your heart pumps about 2,000 gallons of blood every day through 60,000 miles of blood vessels!", funFact:"Your heart beats about 100,000 times per day." },
  { id:"b14", subject:"biology", topic:"human-body", difficulty:1, question:"What system includes bones and provides structure?", choices:["Muscular","Circulatory","Nervous","Skeletal"], correctIndex:3, explanation:"The skeletal system includes 206 bones in an adult. It provides structure, protects organs, stores minerals, and produces blood cells." },
  { id:"b15", subject:"biology", topic:"human-body", difficulty:2, question:"What gas do we breathe in that our cells need?", choices:["Carbon dioxide","Nitrogen","Oxygen","Hydrogen"], correctIndex:2, explanation:"We breathe in oxygen, which our red blood cells carry to every cell. Cells use oxygen to convert glucose into energy (cellular respiration)." },
  { id:"b16", subject:"biology", topic:"human-body", difficulty:2, question:"What is the largest organ in the human body?", choices:["Heart","Liver","Brain","Skin"], correctIndex:3, explanation:"Skin is the largest organ, covering about 20 square feet in adults. It protects against germs, regulates temperature, and enables touch sensation." },
  { id:"b17", subject:"biology", topic:"human-body", difficulty:3, question:"What carries electrical signals from your brain to your muscles?", choices:["Veins","Nerves","Tendons","Ligaments"], correctIndex:1, explanation:"Nerves carry electrical signals (nerve impulses) at speeds up to 268 mph. The nervous system includes the brain, spinal cord, and a vast network of nerves." },
  { id:"b18", subject:"biology", topic:"human-body", difficulty:4, question:"Where does most digestion and nutrient absorption occur?", choices:["Stomach","Large intestine","Small intestine","Esophagus"], correctIndex:2, explanation:"The small intestine is where most digestion and nutrient absorption happens. It's about 20 feet long with tiny finger-like projections (villi) that increase surface area." },

  // ─── BIOLOGY: Ecosystems ───
  { id:"b19", subject:"biology", topic:"ecosystems", difficulty:1, question:"What do plants use sunlight, water, and CO₂ to make food? This process is called:", choices:["Respiration","Digestion","Photosynthesis","Fermentation"], correctIndex:2, explanation:"Photosynthesis converts sunlight, water, and carbon dioxide into glucose (food) and oxygen. It's how plants make their own energy.", funFact:"Plants produce about 50% of Earth's oxygen through photosynthesis!" },
  { id:"b20", subject:"biology", topic:"ecosystems", difficulty:1, question:"In a food chain, what are animals that eat plants called?", choices:["Carnivores","Herbivores","Decomposers","Producers"], correctIndex:1, explanation:"Herbivores eat plants (producers). Examples include rabbits, deer, and cows. Carnivores eat other animals, and omnivores eat both." },
  { id:"b21", subject:"biology", topic:"ecosystems", difficulty:2, question:"What is biodiversity?", choices:["A type of biome","The variety of life in an area","A food chain","A type of ecosystem"], correctIndex:1, explanation:"Biodiversity is the variety of different species in an ecosystem. Higher biodiversity generally means a healthier, more resilient ecosystem." },
  { id:"b22", subject:"biology", topic:"ecosystems", difficulty:3, question:"What organism breaks down dead material and returns nutrients to the soil?", choices:["Producer","Herbivore","Decomposer","Predator"], correctIndex:2, explanation:"Decomposers (like fungi and bacteria) break down dead organisms and waste, recycling nutrients back into the soil for plants to use." },
  { id:"b23", subject:"biology", topic:"ecosystems", difficulty:3, question:"Which biome has the most biodiversity?", choices:["Desert","Tundra","Tropical rainforest","Grassland"], correctIndex:2, explanation:"Tropical rainforests contain over 50% of all species despite covering only 6% of Earth's surface. Warm temperatures and abundant rainfall support incredible diversity." },

  // ─── BIOLOGY: Evolution ───
  { id:"b24", subject:"biology", topic:"evolution", difficulty:2, question:"Who proposed the theory of natural selection?", choices:["Albert Einstein","Isaac Newton","Charles Darwin","Louis Pasteur"], correctIndex:2, explanation:"Charles Darwin published 'On the Origin of Species' in 1859, proposing that organisms best adapted to their environment survive and reproduce more." },
  { id:"b25", subject:"biology", topic:"evolution", difficulty:2, question:"What are fossils?", choices:["Living organisms","Preserved remains of ancient life","Types of rocks","Mineral deposits"], correctIndex:1, explanation:"Fossils are preserved remains or traces of organisms from the past. They help scientists understand how life has changed over millions of years." },
  { id:"b26", subject:"biology", topic:"evolution", difficulty:3, question:"What is natural selection?", choices:["Animals choosing mates","Organisms with favorable traits surviving and reproducing more","Scientists selecting species to study","Random changes in DNA"], correctIndex:1, explanation:"Natural selection is the process where organisms with traits better suited to their environment survive longer and reproduce more, passing those traits on." },
  { id:"b27", subject:"biology", topic:"evolution", difficulty:4, question:"What is the term for two species evolving together in response to each other?", choices:["Convergent evolution","Divergent evolution","Coevolution","Adaptive radiation"], correctIndex:2, explanation:"Coevolution occurs when two species influence each other's evolution. For example, flowers evolved bright colors to attract pollinators, and pollinators evolved to reach nectar." },

  // ─── PHYSICS: Forces & Motion ───
  { id:"p01", subject:"physics", topic:"forces-motion", difficulty:1, question:"What force pulls objects toward Earth?", choices:["Friction","Magnetism","Gravity","Tension"], correctIndex:2, explanation:"Gravity is the force that attracts objects with mass toward each other. On Earth, gravity accelerates objects downward at about 9.8 m/s².", funFact:"You would weigh about 1/6 as much on the Moon because its gravity is weaker!" },
  { id:"p02", subject:"physics", topic:"forces-motion", difficulty:1, question:"What force slows down moving objects when surfaces rub together?", choices:["Gravity","Friction","Inertia","Momentum"], correctIndex:1, explanation:"Friction is the force that resists motion when two surfaces touch. Without friction, you couldn't walk, drive, or even hold a pencil!" },
  { id:"p03", subject:"physics", topic:"forces-motion", difficulty:2, question:"Newton's first law says an object at rest stays at rest unless acted on by what?", choices:["Gravity only","An unbalanced force","Friction","Energy"], correctIndex:1, explanation:"Newton's First Law (Law of Inertia): An object stays at rest or in constant motion unless an unbalanced force acts on it. A ball won't roll until you push it." },
  { id:"p04", subject:"physics", topic:"forces-motion", difficulty:2, question:"What is the unit of force?", choices:["Watt","Joule","Newton","Meter"], correctIndex:2, explanation:"The Newton (N) is the unit of force, named after Sir Isaac Newton. One Newton is the force needed to accelerate 1 kg by 1 m/s²." },
  { id:"p05", subject:"physics", topic:"forces-motion", difficulty:3, question:"Newton's second law states that Force equals:", choices:["Mass × Velocity","Mass × Acceleration","Weight × Speed","Energy × Time"], correctIndex:1, explanation:"F = ma (Force = mass × acceleration). A heavier object needs more force to accelerate. Doubling the force doubles the acceleration." },
  { id:"p06", subject:"physics", topic:"forces-motion", difficulty:3, question:"What is momentum?", choices:["Force × distance","Mass × velocity","Energy × time","Speed × acceleration"], correctIndex:1, explanation:"Momentum = mass × velocity. A heavy truck moving slowly can have the same momentum as a light car moving fast. Momentum is conserved in collisions." },
  { id:"p07", subject:"physics", topic:"forces-motion", difficulty:4, question:"Newton's third law says every action has:", choices:["A greater reaction","An equal and opposite reaction","No reaction","A delayed reaction"], correctIndex:1, explanation:"For every action, there is an equal and opposite reaction. When you push a wall, it pushes back on you with equal force. Rockets work by pushing gas backward." },

  // ─── PHYSICS: Energy & Waves ───
  { id:"p08", subject:"physics", topic:"energy-waves", difficulty:1, question:"What type of energy does a moving object have?", choices:["Potential","Thermal","Kinetic","Chemical"], correctIndex:2, explanation:"Kinetic energy is the energy of motion. The faster an object moves and the more mass it has, the more kinetic energy it has: KE = ½mv²." },
  { id:"p09", subject:"physics", topic:"energy-waves", difficulty:1, question:"What type of energy is stored in food?", choices:["Kinetic","Nuclear","Chemical","Electrical"], correctIndex:2, explanation:"Food contains chemical energy stored in molecular bonds. When your body digests food, it breaks these bonds to release energy for your cells to use." },
  { id:"p10", subject:"physics", topic:"energy-waves", difficulty:2, question:"What law says energy cannot be created or destroyed, only transformed?", choices:["Newton's First Law","Law of Conservation of Energy","Law of Gravity","Ohm's Law"], correctIndex:1, explanation:"The Law of Conservation of Energy (First Law of Thermodynamics) states energy is never lost — it just changes form. A falling ball converts potential to kinetic energy." },
  { id:"p11", subject:"physics", topic:"energy-waves", difficulty:2, question:"What is the speed of light (approximately)?", choices:["300 km/s","3,000 km/s","300,000 km/s","3,000,000 km/s"], correctIndex:2, explanation:"Light travels at about 300,000 km/s (186,000 miles/s). Nothing can travel faster. Light from the Sun takes about 8 minutes to reach Earth.", funFact:"In one second, light could circle Earth 7.5 times!" },
  { id:"p12", subject:"physics", topic:"energy-waves", difficulty:3, question:"What determines the color of visible light?", choices:["Amplitude","Wavelength","Speed","Volume"], correctIndex:1, explanation:"The wavelength of light determines its color. Red light has the longest wavelength (~700 nm) and violet has the shortest (~400 nm). A prism separates white light into all colors." },
  { id:"p13", subject:"physics", topic:"energy-waves", difficulty:3, question:"Sound cannot travel through:", choices:["Water","Metal","Air","A vacuum"], correctIndex:3, explanation:"Sound needs a medium (solid, liquid, or gas) to travel through. In space (a vacuum), there are no particles to vibrate, so sound cannot travel. That's why space is silent!" },

  // ─── PHYSICS: Electricity ───
  { id:"p14", subject:"physics", topic:"electricity", difficulty:1, question:"What particle carries electricity through a wire?", choices:["Proton","Neutron","Electron","Photon"], correctIndex:2, explanation:"Electrons carry electrical current through wires. They are negatively charged particles that flow from the negative to positive terminal of a battery." },
  { id:"p15", subject:"physics", topic:"electricity", difficulty:2, question:"What is the unit for measuring electrical current?", choices:["Volt","Watt","Ohm","Ampere"], correctIndex:3, explanation:"Current is measured in amperes (amps, A). It measures how many electrons pass a point per second. Named after French physicist André-Marie Ampère." },
  { id:"p16", subject:"physics", topic:"electricity", difficulty:2, question:"What does a battery provide to a circuit?", choices:["Resistance","Voltage","Friction","Mass"], correctIndex:1, explanation:"A battery provides voltage (electrical pressure) that pushes electrons through a circuit. Higher voltage = more push = more current (if resistance stays the same)." },
  { id:"p17", subject:"physics", topic:"electricity", difficulty:3, question:"What is Ohm's Law?", choices:["E = mc²","V = IR","F = ma","P = IV"], correctIndex:1, explanation:"Ohm's Law: V = IR (Voltage = Current × Resistance). If you know any two values, you can calculate the third. It's fundamental to understanding circuits." },
  { id:"p18", subject:"physics", topic:"electricity", difficulty:4, question:"In a parallel circuit, what stays the same across all branches?", choices:["Current","Resistance","Voltage","Power"], correctIndex:2, explanation:"In a parallel circuit, voltage is the same across all branches, but current splits between them. This is why home outlets all provide the same voltage." },

  // ─── PHYSICS: Heat ───
  { id:"p19", subject:"physics", topic:"heat", difficulty:1, question:"Heat always flows from:", choices:["Cold to hot","Hot to cold","Left to right","Bottom to top"], correctIndex:1, explanation:"Heat naturally flows from warmer objects to cooler ones until they reach the same temperature (thermal equilibrium). This is the Second Law of Thermodynamics." },
  { id:"p20", subject:"physics", topic:"heat", difficulty:2, question:"What type of heat transfer occurs through direct contact?", choices:["Convection","Radiation","Conduction","Insulation"], correctIndex:2, explanation:"Conduction transfers heat through direct contact between particles. When you touch a hot pan, heat conducts from the pan to your hand. Metals are excellent conductors." },
  { id:"p21", subject:"physics", topic:"heat", difficulty:3, question:"What type of heat transfer involves fluid currents rising and sinking?", choices:["Conduction","Convection","Radiation","Sublimation"], correctIndex:1, explanation:"Convection moves heat through fluids (liquids and gases) via circular currents. Hot air rises, cool air sinks — this creates convection currents that drive weather patterns." },
  { id:"p22", subject:"physics", topic:"heat", difficulty:3, question:"How does the Sun's heat reach Earth?", choices:["Conduction","Convection","Radiation","All three equally"], correctIndex:2, explanation:"The Sun's heat reaches Earth through radiation — electromagnetic waves that can travel through the vacuum of space. No physical medium is needed." },

  // ─── EARTH SCIENCE: Plate Tectonics ───
  { id:"e01", subject:"earth-science", topic:"plate-tectonics", difficulty:1, question:"What causes earthquakes?", choices:["Wind","Volcanic eruptions only","Movement of tectonic plates","Ocean currents"], correctIndex:2, explanation:"Earthquakes are caused by the sudden movement of tectonic plates along fault lines. The energy released travels as seismic waves through the ground.", funFact:"There are about 500,000 detectable earthquakes each year, but only about 100 cause damage!" },
  { id:"e02", subject:"earth-science", topic:"plate-tectonics", difficulty:1, question:"What are tectonic plates?", choices:["Layers of atmosphere","Massive pieces of Earth's outer shell","Underground rivers","Types of rocks"], correctIndex:1, explanation:"Tectonic plates are massive slabs of Earth's lithosphere (crust + upper mantle) that fit together like puzzle pieces and slowly move on the hot mantle below." },
  { id:"e03", subject:"earth-science", topic:"plate-tectonics", difficulty:2, question:"What forms when two oceanic plates collide?", choices:["A mountain range","A deep ocean trench","A river","A desert"], correctIndex:1, explanation:"When oceanic plates collide, one slides under the other (subduction), creating a deep ocean trench. The Mariana Trench (deepest point on Earth) formed this way." },
  { id:"e04", subject:"earth-science", topic:"plate-tectonics", difficulty:3, question:"What theory explains that continents were once joined together?", choices:["Plate theory","Continental drift","Continental shift","Land bridge theory"], correctIndex:1, explanation:"Continental drift, proposed by Alfred Wegener in 1912, states that all continents were once a single supercontinent called Pangaea that broke apart ~200 million years ago." },
  { id:"e05", subject:"earth-science", topic:"plate-tectonics", difficulty:4, question:"What is the Ring of Fire?", choices:["A volcanic region around the Atlantic","A zone of tectonic activity around the Pacific","A ring of hot springs","A circle of deserts"], correctIndex:1, explanation:"The Ring of Fire is a horseshoe-shaped zone around the Pacific Ocean with 75% of Earth's volcanoes and 90% of earthquakes, where many tectonic plates meet." },

  // ─── EARTH SCIENCE: Weather & Climate ───
  { id:"e06", subject:"earth-science", topic:"weather-climate", difficulty:1, question:"What is the water cycle?", choices:["Water flowing downhill","The continuous movement of water between earth, atmosphere, and back","Ocean currents","Underground rivers"], correctIndex:1, explanation:"The water cycle is the continuous journey of water: evaporation from surfaces → condensation into clouds → precipitation as rain/snow → collection in rivers/oceans → repeat." },
  { id:"e07", subject:"earth-science", topic:"weather-climate", difficulty:1, question:"What type of cloud is tall, puffy, and can bring thunderstorms?", choices:["Stratus","Cirrus","Cumulonimbus","Fog"], correctIndex:2, explanation:"Cumulonimbus clouds are massive, towering clouds that can reach 40,000+ feet. They bring thunderstorms, heavy rain, hail, and sometimes tornadoes." },
  { id:"e08", subject:"earth-science", topic:"weather-climate", difficulty:2, question:"What layer of the atmosphere do we live in?", choices:["Stratosphere","Mesosphere","Troposphere","Thermosphere"], correctIndex:2, explanation:"The troposphere is the lowest layer (0-12 km up). All weather occurs here. Temperature drops as you go higher. The stratosphere above it contains the ozone layer." },
  { id:"e09", subject:"earth-science", topic:"weather-climate", difficulty:3, question:"What is the difference between weather and climate?", choices:["They are the same thing","Weather is long-term, climate is short-term","Weather is short-term, climate is long-term","Weather is in the sky, climate is on land"], correctIndex:2, explanation:"Weather is day-to-day conditions (rain today, sunny tomorrow). Climate is the average weather pattern over 30+ years. 'Climate is what you expect, weather is what you get.'" },
  { id:"e10", subject:"earth-science", topic:"weather-climate", difficulty:4, question:"What causes seasons on Earth?", choices:["Distance from the Sun","Earth's tilted axis","Speed of Earth's rotation","Solar flares"], correctIndex:1, explanation:"Earth's axis is tilted 23.5° relative to its orbit. This tilt causes different parts of Earth to receive more direct sunlight at different times of year, creating seasons." },

  // ─── EARTH SCIENCE: Space & Astronomy ───
  { id:"e11", subject:"earth-science", topic:"space", difficulty:1, question:"How many planets are in our solar system?", choices:["7","8","9","10"], correctIndex:1, explanation:"There are 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune. Pluto was reclassified as a 'dwarf planet' in 2006.", funFact:"Jupiter is so large that all the other planets could fit inside it!" },
  { id:"e12", subject:"earth-science", topic:"space", difficulty:1, question:"What is the closest star to Earth?", choices:["Polaris","Sirius","The Sun","Alpha Centauri"], correctIndex:2, explanation:"The Sun is a star! It's about 93 million miles away. The next closest star system is Alpha Centauri, about 4.37 light-years away." },
  { id:"e13", subject:"earth-science", topic:"space", difficulty:2, question:"What planet is known as the 'Red Planet'?", choices:["Venus","Mars","Jupiter","Mercury"], correctIndex:1, explanation:"Mars appears red because its surface is covered in iron oxide (rust). It has the largest volcano (Olympus Mons) and longest canyon (Valles Marineris) in the solar system." },
  { id:"e14", subject:"earth-science", topic:"space", difficulty:2, question:"What causes the phases of the Moon?", choices:["Earth's shadow","The Moon rotating","The Moon's orbit showing different lit portions","Clouds blocking the Moon"], correctIndex:2, explanation:"Moon phases occur because we see different amounts of the Sun-lit side as the Moon orbits Earth. A full orbit (new moon to new moon) takes about 29.5 days." },
  { id:"e15", subject:"earth-science", topic:"space", difficulty:3, question:"What is a light-year?", choices:["A unit of time","A unit of distance","A unit of brightness","A unit of speed"], correctIndex:1, explanation:"A light-year is the distance light travels in one year — about 9.46 trillion kilometers. It's used because space is so vast that regular units are impractical." },
  { id:"e16", subject:"earth-science", topic:"space", difficulty:3, question:"What galaxy do we live in?", choices:["Andromeda","Milky Way","Triangulum","Sombrero"], correctIndex:1, explanation:"We live in the Milky Way galaxy, a spiral galaxy containing 100-400 billion stars. Our solar system is about 26,000 light-years from the center." },
  { id:"e17", subject:"earth-science", topic:"space", difficulty:4, question:"What is a black hole?", choices:["An empty spot in space","A region where gravity is so strong nothing can escape","A dying star","A gap between galaxies"], correctIndex:1, explanation:"A black hole is a region of spacetime with such extreme gravity that nothing — not even light — can escape. They form when massive stars collapse at the end of their lives." },

  // ─── EARTH SCIENCE: Rocks & Minerals ───
  { id:"e18", subject:"earth-science", topic:"rocks-minerals", difficulty:1, question:"What type of rock forms from cooled lava or magma?", choices:["Sedimentary","Metamorphic","Igneous","Mineral"], correctIndex:2, explanation:"Igneous rocks form when magma (underground) or lava (above ground) cools and solidifies. Examples: granite, basalt, obsidian, pumice." },
  { id:"e19", subject:"earth-science", topic:"rocks-minerals", difficulty:2, question:"What type of rock is formed from layers of sediment compressed over time?", choices:["Igneous","Metamorphic","Mineral","Sedimentary"], correctIndex:3, explanation:"Sedimentary rocks form when layers of sediment (sand, mud, shells) are compressed over millions of years. Examples: sandstone, limestone, shale. Fossils are found in these rocks." },
  { id:"e20", subject:"earth-science", topic:"rocks-minerals", difficulty:2, question:"What is the hardest natural mineral?", choices:["Quartz","Topaz","Ruby","Diamond"], correctIndex:3, explanation:"Diamond is a 10 on the Mohs hardness scale — the maximum! It's made of pure carbon atoms arranged in an incredibly strong crystal structure.", funFact:"Diamonds form 100+ miles underground under extreme heat and pressure, then are brought up by volcanic eruptions!" },
  { id:"e21", subject:"earth-science", topic:"rocks-minerals", difficulty:3, question:"What is the rock cycle?", choices:["Rocks rolling downhill","The continuous transformation of rocks between types","Rocks forming in cycles of 100 years","Volcanic eruptions happening regularly"], correctIndex:1, explanation:"The rock cycle describes how rocks transform: igneous → (weathering) → sedimentary → (heat & pressure) → metamorphic → (melting) → magma → igneous, and various shortcuts." },
  { id:"e22", subject:"earth-science", topic:"rocks-minerals", difficulty:4, question:"What type of rock forms when existing rocks are changed by extreme heat and pressure?", choices:["Igneous","Sedimentary","Metamorphic","Composite"], correctIndex:2, explanation:"Metamorphic rocks form when existing rocks are transformed by heat, pressure, or chemical fluids deep underground. Limestone becomes marble; shale becomes slate." },

  // ─── More Chemistry ───
  { id:"c32", subject:"chemistry", topic:"chemical-reactions", difficulty:1, question:"What gas is produced when you mix vinegar and baking soda?", choices:["Oxygen","Hydrogen","Carbon dioxide","Nitrogen"], correctIndex:2, explanation:"Vinegar (acetic acid) + baking soda (sodium bicarbonate) produces carbon dioxide gas (the bubbles), water, and sodium acetate. A classic science experiment!" },
  { id:"c33", subject:"chemistry", topic:"atoms-molecules", difficulty:2, question:"How many atoms are in one molecule of water (H₂O)?", choices:["2","3","4","5"], correctIndex:1, explanation:"Water (H₂O) has 3 atoms: 2 hydrogen atoms and 1 oxygen atom. The subscript 2 after H means there are 2 hydrogen atoms." },
  { id:"c34", subject:"chemistry", topic:"periodic-table", difficulty:3, question:"What element makes up most of the air we breathe?", choices:["Oxygen","Carbon","Nitrogen","Hydrogen"], correctIndex:2, explanation:"Nitrogen makes up about 78% of Earth's atmosphere! Oxygen is about 21%. Despite being less abundant, oxygen is the one our bodies need to breathe." },
  { id:"c35", subject:"chemistry", topic:"chemical-reactions", difficulty:2, question:"What is the formula for carbon dioxide?", choices:["CO","CO₂","C₂O","CO₃"], correctIndex:1, explanation:"Carbon dioxide (CO₂) has one carbon atom and two oxygen atoms. Plants absorb CO₂ for photosynthesis, and animals exhale it as a waste product of respiration." },
  { id:"c36", subject:"chemistry", topic:"states-of-matter", difficulty:2, question:"What is condensation?", choices:["Liquid to solid","Gas to liquid","Solid to gas","Liquid to gas"], correctIndex:1, explanation:"Condensation is when gas cools and turns into liquid. You see it when water droplets form on a cold glass — water vapor in the air condenses on the cool surface." },
  { id:"c37", subject:"chemistry", topic:"acids-bases", difficulty:3, question:"Which common household item is a base?", choices:["Vinegar","Orange juice","Baking soda","Cola"], correctIndex:2, explanation:"Baking soda (sodium bicarbonate, NaHCO₃) is a base with a pH around 8-9. Vinegar, orange juice, and cola are all acidic." },

  // ─── More Biology ───
  { id:"b28", subject:"biology", topic:"human-body", difficulty:1, question:"What do red blood cells carry throughout your body?", choices:["Carbon dioxide","Oxygen","Nutrients","White blood cells"], correctIndex:1, explanation:"Red blood cells contain hemoglobin, a protein that binds to oxygen in the lungs and releases it to cells throughout the body. They also carry some CO₂ back." },
  { id:"b29", subject:"biology", topic:"ecosystems", difficulty:2, question:"What is the process where nitrogen is converted into forms plants can use?", choices:["Photosynthesis","Nitrogen fixation","Carbon sequestration","Transpiration"], correctIndex:1, explanation:"Nitrogen fixation converts atmospheric nitrogen (N₂) into ammonia and nitrates that plants can absorb. Certain bacteria in soil and root nodules do this naturally." },
  { id:"b30", subject:"biology", topic:"cell-biology", difficulty:2, question:"What green pigment in plants captures light energy?", choices:["Melanin","Hemoglobin","Chlorophyll","Carotene"], correctIndex:2, explanation:"Chlorophyll is found in chloroplasts and absorbs sunlight (especially red and blue light) for photosynthesis. It reflects green light, which is why plants appear green!" },
  { id:"b31", subject:"biology", topic:"evolution", difficulty:3, question:"What is an adaptation?", choices:["A learned behavior","A trait that helps an organism survive in its environment","A type of mutation","A change in climate"], correctIndex:1, explanation:"An adaptation is a feature that evolved over generations to help an organism survive. Examples: camel humps for water storage, polar bear fur for warmth, cactus spines for protection." },
  { id:"b32", subject:"biology", topic:"dna-genetics", difficulty:2, question:"What is heredity?", choices:["Learning from parents","The passing of traits from parents to offspring","Growing taller over time","Adapting to environment"], correctIndex:1, explanation:"Heredity is the transmission of genetic traits from parents to their children through DNA. Eye color, hair type, blood type, and height are all inherited traits." },
  { id:"b33", subject:"biology", topic:"human-body", difficulty:3, question:"What part of the brain controls balance and coordination?", choices:["Cerebrum","Cerebellum","Brain stem","Hypothalamus"], correctIndex:1, explanation:"The cerebellum (Latin for 'little brain') coordinates voluntary movements, balance, and posture. It's located at the back of the brain below the cerebrum." },

  // ─── More Physics ───
  { id:"p23", subject:"physics", topic:"energy-waves", difficulty:2, question:"What is the energy stored in a stretched rubber band called?", choices:["Kinetic energy","Chemical energy","Elastic potential energy","Thermal energy"], correctIndex:2, explanation:"A stretched rubber band stores elastic potential energy. When released, this converts to kinetic energy. Springs, bows, and trampolines also store elastic potential energy." },
  { id:"p24", subject:"physics", topic:"forces-motion", difficulty:1, question:"What happens to your speed if no forces act on you while you're moving?", choices:["You slow down","You speed up","You stay at the same speed","You stop immediately"], correctIndex:2, explanation:"Newton's First Law: without any unbalanced forces, a moving object continues at the same speed and direction forever. In real life, friction and air resistance are always present." },
  { id:"p25", subject:"physics", topic:"electricity", difficulty:1, question:"What material is a good conductor of electricity?", choices:["Rubber","Wood","Copper","Glass"], correctIndex:2, explanation:"Copper is an excellent electrical conductor because its electrons flow freely. That's why most electrical wires are made of copper. Silver is even better but more expensive." },
  { id:"p26", subject:"physics", topic:"heat", difficulty:2, question:"What is temperature a measure of?", choices:["Total heat energy","Average kinetic energy of particles","Amount of matter","Pressure of a gas"], correctIndex:1, explanation:"Temperature measures the average kinetic energy (speed) of particles in a substance. Higher temperature = particles moving faster. It's measured in °C, °F, or Kelvin." },

  // ─── More Earth Science ───
  { id:"e23", subject:"earth-science", topic:"space", difficulty:2, question:"Which planet has the most moons?", choices:["Jupiter","Mars","Saturn","Uranus"], correctIndex:2, explanation:"Saturn has the most known moons with over 140 discovered. Jupiter has over 90. These gas giants' strong gravity captures many orbiting objects." },
  { id:"e24", subject:"earth-science", topic:"weather-climate", difficulty:2, question:"What instrument measures atmospheric pressure?", choices:["Thermometer","Barometer","Anemometer","Hygrometer"], correctIndex:1, explanation:"A barometer measures atmospheric (air) pressure. Falling pressure usually indicates incoming storms, while rising pressure suggests fair weather." },
  { id:"e25", subject:"earth-science", topic:"plate-tectonics", difficulty:2, question:"What natural disaster can occur when an underwater earthquake displaces water?", choices:["Hurricane","Tornado","Tsunami","Blizzard"], correctIndex:2, explanation:"A tsunami is a series of massive ocean waves caused by underwater earthquakes, volcanic eruptions, or landslides. In the open ocean, tsunami waves may be just a foot high but can grow to over 100 feet near shore." },
  { id:"e26", subject:"earth-science", topic:"rocks-minerals", difficulty:1, question:"Where are fossils most commonly found?", choices:["Igneous rocks","Metamorphic rocks","Sedimentary rocks","Inside volcanoes"], correctIndex:2, explanation:"Fossils form in sedimentary rocks because organisms get buried in layers of sediment that slowly compact into rock, preserving their remains." },
  { id:"e27", subject:"earth-science", topic:"space", difficulty:1, question:"What causes day and night on Earth?", choices:["The Moon blocking sunlight","Earth's orbit around the Sun","Earth rotating on its axis","The Sun moving across the sky"], correctIndex:2, explanation:"Earth rotates on its axis once every 24 hours. The side facing the Sun experiences daytime, while the opposite side experiences nighttime." },
  { id:"e28", subject:"earth-science", topic:"weather-climate", difficulty:3, question:"What is the greenhouse effect?", choices:["Plants growing in greenhouses","Gases in the atmosphere trapping heat","Green light from the Sun","Forests creating oxygen"], correctIndex:1, explanation:"Certain gases (CO₂, methane, water vapor) in Earth's atmosphere trap heat from the Sun, warming the planet. Without it, Earth would be about -18°C. Too much increases global temperatures." },
];

// ── Helpers ──

function pickQuestions(
  allQs: ScienceQuestion[],
  subject: Subject | null,
  topic: string | null,
  adaptiveLevel: number,
  count: number,
  used: Set<string>
): ScienceQuestion[] {
  let pool = allQs.filter((q) => {
    if (subject && q.subject !== subject) return false;
    if (topic && q.topic !== topic) return false;
    if (used.has(q.id)) return false;
    return true;
  });

  if (pool.length === 0) {
    // Reset used set if we've exhausted questions
    used.clear();
    pool = allQs.filter((q) => {
      if (subject && q.subject !== subject) return false;
      if (topic && q.topic !== topic) return false;
      return true;
    });
  }

  // Weight by difficulty matching adaptive level
  const targetDiff = Math.max(1, Math.min(5, Math.round(adaptiveLevel / 8)));
  const weighted = pool.map((q) => {
    const dist = Math.abs(q.difficulty - targetDiff);
    return { q, weight: dist === 0 ? 4 : dist === 1 ? 2 : 1 };
  });

  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
  const picked: ScienceQuestion[] = [];

  for (let i = 0; i < count && weighted.length > 0; i++) {
    let r = Math.random() * totalWeight;
    let idx = 0;
    for (let j = 0; j < weighted.length; j++) {
      r -= weighted[j].weight;
      if (r <= 0) { idx = j; break; }
    }
    const item = weighted.splice(idx, 1)[0];
    picked.push(item.q);
    used.add(item.q.id);
  }

  return picked;
}

// ── Main Component ──

export function ScienceStudyGame() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [mode, setMode] = useState<GameMode>("study");
  const [questions, setQuestions] = useState<ScienceQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [adaptive, setAdaptive] = useState<AdaptiveState>(createAdaptiveState(5));
  const [timer, setTimer] = useState(90);
  const [wrongAnswers, setWrongAnswers] = useState<{ q: ScienceQuestion; selected: number }[]>([]);
  const usedRef = useRef(new Set<string>());
  const startRef = useRef(Date.now());
  const qStartRef = useRef(Date.now());

  // Timer for quiz mode
  useEffect(() => {
    if (phase !== "playing" || mode !== "quiz") return;
    if (timer <= 0) {
      finishGame();
      return;
    }
    const t = setTimeout(() => setTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode, timer]);

  const startGame = useCallback(
    (m: GameMode, subj: Subject | null, top: string | null) => {
      setMode(m);
      setSubject(subj);
      setTopic(top);
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setCorrect(0);
      setWrong(0);
      setCurrentIdx(0);
      setSelectedAnswer(null);
      setFeedback(null);
      setShowExplanation(false);
      setTimer(90);
      setWrongAnswers([]);
      setAdaptive(createAdaptiveState(5));
      usedRef.current.clear();
      startRef.current = Date.now();
      qStartRef.current = Date.now();

      const count = m === "quiz" ? 20 : 10;
      const qs = pickQuestions(QUESTIONS, subj, top, 5, count, usedRef.current);
      setQuestions(qs);
      setPhase("playing");
    },
    []
  );

  const finishGame = useCallback(() => {
    const elapsed = Math.round((Date.now() - startRef.current) / 1000);
    const highKey = "scienceStudy_highScore";
    const prev = getLocalHighScore(highKey);
    if (score > prev) setLocalHighScore(highKey, score);
    trackGamePlayed("science-study", score);

    const stats: GameStats = {
      gameId: "science-study",
      score,
      accuracy: correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0,
      bestStreak,
      solved: correct,
      timeSeconds: elapsed,
    };
    checkAchievements(stats, 0, {});
    setPhase("result");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, correct, wrong, bestStreak]);

  const handleAnswer = useCallback(
    (choiceIdx: number) => {
      if (feedback !== null) return;
      const q = questions[currentIdx];
      if (!q) return;

      const isCorrect = choiceIdx === q.correctIndex;
      setSelectedAnswer(choiceIdx);
      const elapsed = (Date.now() - qStartRef.current) / 1000;
      const wasFast = elapsed < 5;

      if (isCorrect) {
        sfxCorrect();
        const points = Math.round((100 + (wasFast ? 50 : 0)) * (1 + streak * 0.1));
        setScore((s) => s + points);
        setStreak((s) => s + 1);
        setBestStreak((b) => Math.max(b, streak + 1));
        setCorrect((c) => c + 1);
        setFeedback("correct");
        if ((streak + 1) % 5 === 0 && streak > 0) sfxCombo(streak + 1);
      } else {
        sfxWrong();
        setStreak(0);
        setWrong((w) => w + 1);
        setFeedback("wrong");
        setWrongAnswers((prev) => [...prev, { q, selected: choiceIdx }]);
      }

      setAdaptive((prev) => adaptiveUpdate(prev, isCorrect, wasFast));
      setShowExplanation(true);
    },
    [feedback, questions, currentIdx, streak]
  );

  const nextQuestion = useCallback(() => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) {
      if (mode === "quiz") {
        finishGame();
      } else {
        // Load more questions for study/practice
        const more = pickQuestions(QUESTIONS, subject, topic, adaptive.level, 10, usedRef.current);
        if (more.length > 0) {
          setQuestions(more);
          setCurrentIdx(0);
        } else {
          finishGame();
        }
      }
    } else {
      setCurrentIdx(nextIdx);
    }
    setSelectedAnswer(null);
    setFeedback(null);
    setShowExplanation(false);
    qStartRef.current = Date.now();
  }, [currentIdx, questions.length, mode, subject, topic, adaptive.level, finishGame]);

  const currentQ = questions[currentIdx];
  const diffLabel = getDifficultyLabel(adaptive.level);
  const subjectConf = subject ? SUBJECTS.find((s) => s.id === subject) : null;

  // ── Render: Menu ──
  if (phase === "menu") {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-white/5">
          <div className="mx-auto max-w-4xl px-6 py-4 flex items-center gap-3">
            <Link href="/games" className="text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-xl font-bold">Science Study</h1>
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-6 py-8">
          <p className="text-slate-400 mb-8 text-center">Choose a subject to start learning. Pick a specific topic or study everything!</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSubject(s.id); setPhase("topic-select"); }}
                className={`${s.bg} ${s.border} border rounded-2xl p-6 text-left hover:scale-[1.02] transition-all`}
              >
                <div className="text-lg font-bold mb-1" style={{ color: s.color }}>{s.label}</div>
                <div className="text-sm text-slate-400">{s.topics.length} topics &middot; {QUESTIONS.filter((q) => q.subject === s.id).length} questions</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => { setSubject(null); setTopic(null); startGame("quiz", null, null); }}
            className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" /> Mixed Science Quiz (All Subjects)
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Topic Select ──
  if (phase === "topic-select" && subjectConf) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-white/5">
          <div className="mx-auto max-w-4xl px-6 py-4 flex items-center gap-3">
            <button onClick={() => setPhase("menu")} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-xl font-bold" style={{ color: subjectConf.color }}>{subjectConf.label}</h1>
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-6 py-8 space-y-4">
          {subjectConf.topics.map((t) => {
            const count = QUESTIONS.filter((q) => q.subject === subject && q.topic === t.id).length;
            const intro = TOPIC_INTROS[t.id] || "";
            return (
              <div key={t.id} className="bg-slate-900 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white">{t.label}</h3>
                  <span className="text-xs text-slate-500">{count} questions</span>
                </div>
                {intro && <p className="text-sm text-slate-400 mb-4 leading-relaxed">{intro}</p>}
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => startGame("study", subject, t.id)} className="px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-600/30 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Study
                  </button>
                  <button onClick={() => startGame("quiz", subject, t.id)} className="px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-600/30 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Quiz
                  </button>
                  <button onClick={() => startGame("practice", subject, t.id)} className="px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 text-sm font-medium hover:bg-purple-600/30 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" /> Practice
                  </button>
                </div>
              </div>
            );
          })}
          <button
            onClick={() => startGame("quiz", subject, null)}
            className="w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: subjectConf.color + "22", borderColor: subjectConf.color + "44", color: subjectConf.color, borderWidth: 1 }}
          >
            <Zap className="w-5 h-5" /> Quiz All {subjectConf.label}
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Playing ──
  if (phase === "playing" && currentQ) {
    const topicLabel = (() => {
      for (const s of SUBJECTS) for (const t of s.topics) if (t.id === currentQ.topic) return t.label;
      return currentQ.topic;
    })();

    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-white/5">
          <div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-between">
            <button onClick={() => { if (mode === "study" || mode === "practice") finishGame(); else if (confirm("Quit quiz?")) finishGame(); }} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-500">{currentIdx + 1}/{questions.length}</span>
              {mode === "quiz" && <span className="font-mono text-amber-400">{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}</span>}
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: diffLabel.color + "22", color: diffLabel.color }}>{diffLabel.label}</span>
            </div>
            <div className="text-right">
              <span className="text-amber-400 font-bold">{score}</span>
              {streak > 1 && <span className="text-xs text-orange-400 ml-2">x{streak}</span>}
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-2xl px-6 py-6">
          {/* Topic & Subject badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: (SUBJECTS.find((s) => s.id === currentQ.subject)?.color || "#666") + "22", color: SUBJECTS.find((s) => s.id === currentQ.subject)?.color }}>{SUBJECTS.find((s) => s.id === currentQ.subject)?.label}</span>
            <span className="text-xs text-slate-500">{topicLabel}</span>
            <span className="text-xs text-slate-600">Difficulty {currentQ.difficulty}/5</span>
          </div>

          {/* Question */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 mb-6">
            <p className="text-lg font-medium leading-relaxed">{currentQ.question}</p>
          </div>

          {/* Choices */}
          <div className="grid gap-3 sm:grid-cols-2 mb-6">
            {currentQ.choices.map((choice, idx) => {
              let style = "bg-white/5 border-white/10 hover:bg-white/10 text-white";
              if (feedback !== null) {
                if (idx === currentQ.correctIndex) style = "bg-emerald-600/20 border-emerald-500/50 text-emerald-300";
                else if (idx === selectedAnswer && feedback === "wrong") style = "bg-red-600/20 border-red-500/50 text-red-300";
                else style = "bg-white/[0.03] border-white/5 text-slate-500";
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={feedback !== null}
                  className={`${style} border rounded-xl p-4 text-left transition-all font-medium disabled:cursor-default`}
                >
                  <span className="text-xs text-slate-500 mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {choice}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className={`rounded-2xl border p-5 mb-6 ${feedback === "correct" ? "bg-emerald-950/30 border-emerald-500/20" : "bg-red-950/30 border-red-500/20"}`}>
              <div className="flex items-center gap-2 mb-2">
                {feedback === "correct" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                <span className={`font-bold ${feedback === "correct" ? "text-emerald-400" : "text-red-400"}`}>{feedback === "correct" ? "Correct!" : "Not quite!"}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{currentQ.explanation}</p>
              {currentQ.funFact && feedback === "correct" && (
                <div className="mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-300">{currentQ.funFact}</p>
                </div>
              )}
              <button onClick={nextQuestion} className="mt-4 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors flex items-center justify-center gap-2">
                {currentIdx + 1 >= questions.length && mode === "quiz" ? "See Results" : "Next Question"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render: Results ──
  if (phase === "result") {
    const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{mode === "quiz" ? "Quiz Complete!" : "Study Session Complete!"}</h2>
          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl font-bold text-amber-400">{score}</div>
              <div className="text-xs text-slate-500">Score</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl font-bold text-emerald-400">{accuracy}%</div>
              <div className="text-xs text-slate-500">Accuracy</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-400">{correct}</div>
              <div className="text-xs text-slate-500">Correct</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-400">{bestStreak}</div>
              <div className="text-xs text-slate-500">Best Streak</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-6">
            <Star className="w-4 h-4" style={{ color: diffLabel.color }} />
            <span className="text-sm" style={{ color: diffLabel.color }}>Difficulty reached: {diffLabel.label}</span>
          </div>
          {wrongAnswers.length > 0 && (
            <button onClick={() => setPhase("review")} className="w-full mb-3 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">
              Review Wrong Answers ({wrongAnswers.length})
            </button>
          )}
          <div className="flex gap-3">
            <button onClick={() => setPhase("menu")} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">Menu</button>
            <button onClick={() => startGame(mode, subject, topic)} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors">Play Again</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Review ──
  if (phase === "review") {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-white/5">
          <div className="mx-auto max-w-4xl px-6 py-4 flex items-center gap-3">
            <button onClick={() => setPhase("result")} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-xl font-bold">Review Wrong Answers</h1>
          </div>
        </header>
        <div className="mx-auto max-w-2xl px-6 py-6 space-y-4">
          {wrongAnswers.map(({ q, selected }, i) => (
            <div key={i} className="bg-slate-900 border border-red-500/20 rounded-2xl p-5">
              <p className="font-medium mb-3">{q.question}</p>
              <div className="flex flex-col gap-1.5 mb-3">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">Your answer: {q.choices[selected]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400">Correct: {q.choices[q.correctIndex]}</span>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{q.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
