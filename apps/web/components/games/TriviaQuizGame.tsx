"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Clock, Brain } from "lucide-react";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { AchievementToast } from "@/components/games/AchievementToast";
import {
  sfxCorrect,
  sfxWrong,
  sfxClick,
  sfxLevelUp,
  sfxGameOver,
  isSfxEnabled,
} from "@/lib/games/audio";
import {
  checkAchievements,
  type MedalTier,
} from "@/lib/games/achievements";
import {
  trackGamePlayed,
  getProfile,
  getLocalHighScore,
  setLocalHighScore,
} from "@/lib/games/use-scores";
import { useEinkMode, EinkBanner, EinkWrapper } from "@/lib/games/eink-utils";

// ─── Types ───────────────────────────────────────────────────────────

type Phase = "menu" | "playing" | "feedback" | "complete";
type QuizCategory =
  | "math"
  | "science"
  | "history"
  | "geography"
  | "chemistry"
  | "biology";

interface Question {
  question: string;
  answers: string[];
  correct: number; // index into answers
  explanation: string;
  category: QuizCategory;
}

// ─── Question Bank (120+ questions) ──────────────────────────────────

const QUESTIONS: Question[] = [
  // ── Math (20) ──────────────────────────────────────────────────────
  { question: "What is the square root of 144?", answers: ["10", "12", "14", "16"], correct: 1, explanation: "12 × 12 = 144.", category: "math" },
  { question: "What is 7 × 8?", answers: ["54", "56", "58", "64"], correct: 1, explanation: "7 × 8 = 56.", category: "math" },
  { question: "What is the value of pi (π) to two decimal places?", answers: ["3.12", "3.14", "3.16", "3.18"], correct: 1, explanation: "Pi is approximately 3.14159...", category: "math" },
  { question: "How many sides does a hexagon have?", answers: ["5", "6", "7", "8"], correct: 1, explanation: "A hexagon has 6 sides (hex = 6).", category: "math" },
  { question: "What is 15% of 200?", answers: ["25", "30", "35", "40"], correct: 1, explanation: "15% × 200 = 0.15 × 200 = 30.", category: "math" },
  { question: "What is the next prime number after 7?", answers: ["9", "10", "11", "13"], correct: 2, explanation: "11 is prime; 8, 9, 10 are not.", category: "math" },
  { question: "What is 2 to the power of 10?", answers: ["512", "1000", "1024", "2048"], correct: 2, explanation: "2^10 = 1024.", category: "math" },
  { question: "What is the sum of angles in a triangle?", answers: ["90°", "180°", "270°", "360°"], correct: 1, explanation: "All triangles have interior angles summing to 180°.", category: "math" },
  { question: "What fraction is equivalent to 0.25?", answers: ["1/3", "1/4", "1/5", "2/5"], correct: 1, explanation: "0.25 = 25/100 = 1/4.", category: "math" },
  { question: "What is the formula for the area of a circle?", answers: ["2πr", "πr²", "πd", "2πr²"], correct: 1, explanation: "Area of a circle = π × radius².", category: "math" },
  { question: "What is the least common multiple (LCM) of 4 and 6?", answers: ["8", "10", "12", "24"], correct: 2, explanation: "Multiples of 4: 4,8,12... Multiples of 6: 6,12... LCM = 12.", category: "math" },
  { question: "What type of angle is exactly 90 degrees?", answers: ["Acute", "Right", "Obtuse", "Straight"], correct: 1, explanation: "A right angle is exactly 90°.", category: "math" },
  { question: "What is the perimeter of a square with side length 5?", answers: ["15", "20", "25", "10"], correct: 1, explanation: "Perimeter = 4 × 5 = 20.", category: "math" },
  { question: "What is the absolute value of -17?", answers: ["-17", "0", "17", "34"], correct: 2, explanation: "The absolute value removes the sign: |-17| = 17.", category: "math" },
  { question: "How many degrees in a full circle?", answers: ["180", "270", "360", "720"], correct: 2, explanation: "A full rotation is 360 degrees.", category: "math" },
  { question: "What is 3! (3 factorial)?", answers: ["3", "6", "9", "27"], correct: 1, explanation: "3! = 3 × 2 × 1 = 6.", category: "math" },
  { question: "What is the hypotenuse of a right triangle with legs 3 and 4?", answers: ["5", "6", "7", "8"], correct: 0, explanation: "By Pythagorean theorem: √(9+16) = √25 = 5.", category: "math" },
  { question: "What is the median of {2, 5, 7, 9, 11}?", answers: ["5", "7", "9", "6.8"], correct: 1, explanation: "The middle value in an ordered set of 5 is the 3rd: 7.", category: "math" },
  { question: "What is -3 × -4?", answers: ["-12", "-7", "7", "12"], correct: 3, explanation: "A negative times a negative equals a positive: 12.", category: "math" },
  { question: "What is the slope of a horizontal line?", answers: ["-1", "0", "1", "Undefined"], correct: 1, explanation: "Horizontal lines have zero rise, so slope = 0.", category: "math" },

  // ── Science (20) ───────────────────────────────────────────────────
  { question: "What planet is known as the Red Planet?", answers: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1, explanation: "Mars appears red due to iron oxide (rust) on its surface.", category: "science" },
  { question: "What is the speed of light in vacuum (approx)?", answers: ["300 km/s", "3,000 km/s", "300,000 km/s", "3,000,000 km/s"], correct: 2, explanation: "Light travels at approximately 300,000 km/s.", category: "science" },
  { question: "What force keeps planets in orbit around the Sun?", answers: ["Friction", "Magnetism", "Gravity", "Nuclear force"], correct: 2, explanation: "Gravity is the force of attraction between masses.", category: "science" },
  { question: "What gas do plants absorb from the atmosphere?", answers: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correct: 2, explanation: "Plants use CO₂ in photosynthesis to make glucose.", category: "science" },
  { question: "How many planets are in our solar system?", answers: ["7", "8", "9", "10"], correct: 1, explanation: "There are 8 planets (Pluto was reclassified in 2006).", category: "science" },
  { question: "What is the hardest natural substance on Earth?", answers: ["Gold", "Iron", "Diamond", "Quartz"], correct: 2, explanation: "Diamond is the hardest natural material (10 on Mohs scale).", category: "science" },
  { question: "What type of energy does a moving object have?", answers: ["Potential", "Kinetic", "Thermal", "Chemical"], correct: 1, explanation: "Kinetic energy is the energy of motion.", category: "science" },
  { question: "What is the closest star to Earth?", answers: ["Proxima Centauri", "Sirius", "The Sun", "Alpha Centauri A"], correct: 2, explanation: "The Sun is a star and is closest to Earth at ~150 million km.", category: "science" },
  { question: "What does DNA stand for?", answers: ["Deoxyribonucleic acid", "Dinitrogen acid", "Dynamic nuclear assembly", "Dual nucleotide arrangement"], correct: 0, explanation: "DNA = Deoxyribonucleic acid, the molecule of heredity.", category: "science" },
  { question: "What is the boiling point of water at sea level?", answers: ["90°C", "100°C", "110°C", "212°F only"], correct: 1, explanation: "Water boils at 100°C (212°F) at standard atmospheric pressure.", category: "science" },
  { question: "What layer of the atmosphere do we live in?", answers: ["Stratosphere", "Troposphere", "Mesosphere", "Thermosphere"], correct: 1, explanation: "The troposphere is the lowest layer where weather occurs.", category: "science" },
  { question: "What is the unit of electrical resistance?", answers: ["Watt", "Volt", "Ohm", "Ampere"], correct: 2, explanation: "Resistance is measured in Ohms (Ω).", category: "science" },
  { question: "Which type of rock is formed from cooled lava?", answers: ["Sedimentary", "Metamorphic", "Igneous", "Limestone"], correct: 2, explanation: "Igneous rocks form from solidified magma or lava.", category: "science" },
  { question: "What is Newton's first law also called?", answers: ["Law of gravity", "Law of inertia", "Law of acceleration", "Law of reaction"], correct: 1, explanation: "An object at rest stays at rest unless acted on by a force.", category: "science" },
  { question: "What organ pumps blood through the body?", answers: ["Brain", "Lungs", "Heart", "Liver"], correct: 2, explanation: "The heart pumps blood through the circulatory system.", category: "science" },
  { question: "What is the chemical formula for water?", answers: ["HO", "H₂O", "H₂O₂", "OH₂"], correct: 1, explanation: "Water is two hydrogen atoms bonded to one oxygen: H₂O.", category: "science" },
  { question: "Which planet is the largest in our solar system?", answers: ["Saturn", "Neptune", "Jupiter", "Uranus"], correct: 2, explanation: "Jupiter is the largest planet with a diameter of ~140,000 km.", category: "science" },
  { question: "What type of wave is sound?", answers: ["Transverse", "Electromagnetic", "Longitudinal", "Surface"], correct: 2, explanation: "Sound is a longitudinal (compression) wave.", category: "science" },
  { question: "What is the SI unit of force?", answers: ["Joule", "Watt", "Newton", "Pascal"], correct: 2, explanation: "Force is measured in Newtons (N).", category: "science" },
  { question: "What part of the cell contains genetic material?", answers: ["Cytoplasm", "Cell wall", "Nucleus", "Mitochondria"], correct: 2, explanation: "The nucleus houses DNA and controls cell activity.", category: "science" },

  // ── History (20) ───────────────────────────────────────────────────
  { question: "In what year did World War II end?", answers: ["1943", "1944", "1945", "1946"], correct: 2, explanation: "WWII ended in 1945 with the surrender of Japan.", category: "history" },
  { question: "Who was the first President of the United States?", answers: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"], correct: 2, explanation: "George Washington served as the first president (1789–1797).", category: "history" },
  { question: "What ancient civilization built the pyramids at Giza?", answers: ["Romans", "Greeks", "Egyptians", "Persians"], correct: 2, explanation: "The Great Pyramids were built by ancient Egyptians ~2500 BCE.", category: "history" },
  { question: "In what year did the Titanic sink?", answers: ["1905", "1912", "1918", "1923"], correct: 1, explanation: "The Titanic sank on April 15, 1912 after hitting an iceberg.", category: "history" },
  { question: "Who wrote the Declaration of Independence?", answers: ["George Washington", "Benjamin Franklin", "Thomas Jefferson", "John Adams"], correct: 2, explanation: "Thomas Jefferson was the principal author in 1776.", category: "history" },
  { question: "What empire was ruled by Genghis Khan?", answers: ["Roman", "Ottoman", "Mongol", "Persian"], correct: 2, explanation: "Genghis Khan founded and ruled the Mongol Empire.", category: "history" },
  { question: "The Renaissance began in which country?", answers: ["France", "England", "Germany", "Italy"], correct: 3, explanation: "The Renaissance began in Italy in the 14th century.", category: "history" },
  { question: "What year did the Berlin Wall fall?", answers: ["1987", "1989", "1991", "1993"], correct: 1, explanation: "The Berlin Wall fell on November 9, 1989.", category: "history" },
  { question: "Who was the first person to walk on the Moon?", answers: ["Buzz Aldrin", "Neil Armstrong", "John Glenn", "Yuri Gagarin"], correct: 1, explanation: "Neil Armstrong walked on the Moon on July 20, 1969.", category: "history" },
  { question: "What war was fought between the North and South in the US?", answers: ["Revolutionary War", "Civil War", "War of 1812", "Spanish-American War"], correct: 1, explanation: "The American Civil War (1861–1865) was North vs South.", category: "history" },
  { question: "Who was known as the 'Maid of Orléans'?", answers: ["Marie Antoinette", "Joan of Arc", "Queen Victoria", "Cleopatra"], correct: 1, explanation: "Joan of Arc led French troops and was called the Maid of Orléans.", category: "history" },
  { question: "What ancient wonder was located in Alexandria, Egypt?", answers: ["Colossus", "Hanging Gardens", "Great Lighthouse", "Temple of Artemis"], correct: 2, explanation: "The Lighthouse (Pharos) of Alexandria was one of the Seven Wonders.", category: "history" },
  { question: "In what year did Columbus first reach the Americas?", answers: ["1482", "1492", "1502", "1512"], correct: 1, explanation: "Columbus arrived in the Americas on October 12, 1492.", category: "history" },
  { question: "What event started World War I?", answers: ["Invasion of Poland", "Assassination of Archduke Franz Ferdinand", "Bombing of Pearl Harbor", "Sinking of the Lusitania"], correct: 1, explanation: "The assassination of Archduke Franz Ferdinand in 1914 triggered WWI.", category: "history" },
  { question: "Who was the longest-reigning British monarch before Elizabeth II?", answers: ["George III", "Victoria", "Henry VIII", "Elizabeth I"], correct: 1, explanation: "Queen Victoria reigned for 63 years (1837–1901).", category: "history" },
  { question: "The Magna Carta was signed in which year?", answers: ["1066", "1215", "1415", "1776"], correct: 1, explanation: "The Magna Carta was sealed in 1215, limiting royal power.", category: "history" },
  { question: "What was the name of the ship the Pilgrims sailed to America?", answers: ["Santa Maria", "Mayflower", "Endeavour", "Beagle"], correct: 1, explanation: "The Pilgrims sailed on the Mayflower in 1620.", category: "history" },
  { question: "Which country was the first to grant women the right to vote?", answers: ["USA", "UK", "New Zealand", "France"], correct: 2, explanation: "New Zealand granted women's suffrage in 1893.", category: "history" },
  { question: "Who painted the ceiling of the Sistine Chapel?", answers: ["Leonardo da Vinci", "Raphael", "Michelangelo", "Donatello"], correct: 2, explanation: "Michelangelo painted the Sistine Chapel ceiling (1508–1512).", category: "history" },
  { question: "What ancient city was destroyed by a volcano in 79 AD?", answers: ["Athens", "Rome", "Pompeii", "Carthage"], correct: 2, explanation: "Pompeii was buried by the eruption of Mount Vesuvius.", category: "history" },

  // ── Geography (20) ─────────────────────────────────────────────────
  { question: "What is the capital of France?", answers: ["London", "Berlin", "Madrid", "Paris"], correct: 3, explanation: "Paris is the capital and largest city of France.", category: "geography" },
  { question: "What is the largest continent by area?", answers: ["Africa", "North America", "Asia", "Europe"], correct: 2, explanation: "Asia is the largest continent at ~44.6 million km².", category: "geography" },
  { question: "What is the longest river in the world?", answers: ["Amazon", "Nile", "Mississippi", "Yangtze"], correct: 1, explanation: "The Nile is approximately 6,650 km long.", category: "geography" },
  { question: "What is the smallest country in the world?", answers: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], correct: 1, explanation: "Vatican City is ~0.44 km², the smallest country.", category: "geography" },
  { question: "On which continent is Brazil?", answers: ["Africa", "Europe", "North America", "South America"], correct: 3, explanation: "Brazil is the largest country in South America.", category: "geography" },
  { question: "What is the capital of Japan?", answers: ["Seoul", "Beijing", "Tokyo", "Bangkok"], correct: 2, explanation: "Tokyo is Japan's capital and most populous city.", category: "geography" },
  { question: "What ocean lies between America and Europe?", answers: ["Pacific", "Indian", "Atlantic", "Arctic"], correct: 2, explanation: "The Atlantic Ocean separates the Americas from Europe/Africa.", category: "geography" },
  { question: "What is the tallest mountain in the world?", answers: ["K2", "Kangchenjunga", "Mount Everest", "Lhotse"], correct: 2, explanation: "Mount Everest stands at 8,849 meters above sea level.", category: "geography" },
  { question: "What country has the largest population?", answers: ["India", "USA", "China", "Indonesia"], correct: 0, explanation: "India surpassed China as the most populous country.", category: "geography" },
  { question: "What is the capital of Australia?", answers: ["Sydney", "Melbourne", "Canberra", "Brisbane"], correct: 2, explanation: "Canberra is the capital (not Sydney or Melbourne).", category: "geography" },
  { question: "Which desert is the largest in the world?", answers: ["Sahara", "Gobi", "Antarctic", "Arabian"], correct: 2, explanation: "Antarctica is the largest desert by area (cold desert).", category: "geography" },
  { question: "What is the capital of Canada?", answers: ["Toronto", "Vancouver", "Ottawa", "Montreal"], correct: 2, explanation: "Ottawa is the capital of Canada.", category: "geography" },
  { question: "Which river flows through London?", answers: ["Seine", "Rhine", "Thames", "Danube"], correct: 2, explanation: "The River Thames flows through central London.", category: "geography" },
  { question: "How many continents are there?", answers: ["5", "6", "7", "8"], correct: 2, explanation: "There are 7 continents on Earth.", category: "geography" },
  { question: "What is the largest island in the world?", answers: ["Madagascar", "Borneo", "Greenland", "New Guinea"], correct: 2, explanation: "Greenland is the largest island at ~2.16 million km².", category: "geography" },
  { question: "What country is home to the Great Barrier Reef?", answers: ["Indonesia", "Philippines", "Australia", "Fiji"], correct: 2, explanation: "The Great Barrier Reef is off the coast of Queensland, Australia.", category: "geography" },
  { question: "What is the deepest ocean trench?", answers: ["Tonga Trench", "Philippine Trench", "Mariana Trench", "Java Trench"], correct: 2, explanation: "The Mariana Trench reaches ~11,034 meters deep.", category: "geography" },
  { question: "What strait separates Europe from Africa?", answers: ["Bosporus", "Gibraltar", "Hormuz", "Malacca"], correct: 1, explanation: "The Strait of Gibraltar separates Spain from Morocco.", category: "geography" },
  { question: "What is the capital of Egypt?", answers: ["Alexandria", "Cairo", "Luxor", "Giza"], correct: 1, explanation: "Cairo is the capital and largest city of Egypt.", category: "geography" },
  { question: "Which country has the most time zones?", answers: ["Russia", "USA", "China", "France"], correct: 3, explanation: "France has 12 time zones due to its overseas territories.", category: "geography" },

  // ── Chemistry (20) ─────────────────────────────────────────────────
  { question: "What is the chemical symbol for gold?", answers: ["Go", "Gd", "Au", "Ag"], correct: 2, explanation: "Au comes from the Latin 'aurum' meaning gold.", category: "chemistry" },
  { question: "What is the atomic number of carbon?", answers: ["4", "6", "8", "12"], correct: 1, explanation: "Carbon has 6 protons, so its atomic number is 6.", category: "chemistry" },
  { question: "What element does 'O' represent on the periodic table?", answers: ["Osmium", "Oganesson", "Oxygen", "Olivine"], correct: 2, explanation: "O is the symbol for Oxygen (atomic number 8).", category: "chemistry" },
  { question: "What is the pH of pure water?", answers: ["0", "5", "7", "14"], correct: 2, explanation: "Pure water is neutral with a pH of 7.", category: "chemistry" },
  { question: "How many elements are in the periodic table (approx)?", answers: ["92", "108", "118", "126"], correct: 2, explanation: "There are currently 118 confirmed elements.", category: "chemistry" },
  { question: "What gas has the chemical formula CO₂?", answers: ["Carbon monoxide", "Carbon dioxide", "Methane", "Ozone"], correct: 1, explanation: "CO₂ = carbon dioxide (one carbon, two oxygen atoms).", category: "chemistry" },
  { question: "What is the lightest element?", answers: ["Helium", "Hydrogen", "Lithium", "Oxygen"], correct: 1, explanation: "Hydrogen (H) has an atomic mass of ~1 u.", category: "chemistry" },
  { question: "What are the products of combustion of a hydrocarbon?", answers: ["CO₂ and H₂O", "CO and H₂", "O₂ and N₂", "CH₄ and O₂"], correct: 0, explanation: "Complete combustion produces carbon dioxide and water.", category: "chemistry" },
  { question: "What is the chemical symbol for iron?", answers: ["Ir", "In", "Fe", "I"], correct: 2, explanation: "Fe comes from the Latin 'ferrum' for iron.", category: "chemistry" },
  { question: "What type of bond shares electrons between atoms?", answers: ["Ionic", "Covalent", "Metallic", "Hydrogen"], correct: 1, explanation: "Covalent bonds involve shared electron pairs.", category: "chemistry" },
  { question: "What is the most abundant gas in Earth's atmosphere?", answers: ["Oxygen", "Carbon dioxide", "Nitrogen", "Argon"], correct: 2, explanation: "Nitrogen makes up about 78% of the atmosphere.", category: "chemistry" },
  { question: "What element has the symbol 'Na'?", answers: ["Nitrogen", "Neon", "Sodium", "Nickel"], correct: 2, explanation: "Na comes from the Latin 'natrium' for sodium.", category: "chemistry" },
  { question: "What is table salt's chemical formula?", answers: ["NaO", "NaCl", "KCl", "CaCl₂"], correct: 1, explanation: "Table salt is sodium chloride: NaCl.", category: "chemistry" },
  { question: "What type of reaction releases heat?", answers: ["Endothermic", "Exothermic", "Catalytic", "Reversible"], correct: 1, explanation: "Exothermic reactions release energy as heat.", category: "chemistry" },
  { question: "What is the chemical symbol for potassium?", answers: ["Po", "Pt", "P", "K"], correct: 3, explanation: "K comes from the Latin 'kalium' for potassium.", category: "chemistry" },
  { question: "What state of matter has a fixed volume but no fixed shape?", answers: ["Solid", "Liquid", "Gas", "Plasma"], correct: 1, explanation: "Liquids conform to their container but maintain volume.", category: "chemistry" },
  { question: "What is the molecular formula for glucose?", answers: ["C₆H₁₂O₆", "C₂H₆O", "CH₄", "C₁₂H₂₂O₁₁"], correct: 0, explanation: "Glucose is C₆H₁₂O₆, a simple sugar used in metabolism.", category: "chemistry" },
  { question: "What element is a diamond made of?", answers: ["Silicon", "Carbon", "Iron", "Boron"], correct: 1, explanation: "Diamond is a crystalline form of pure carbon.", category: "chemistry" },
  { question: "What acid is found in your stomach?", answers: ["Sulfuric acid", "Nitric acid", "Hydrochloric acid", "Acetic acid"], correct: 2, explanation: "The stomach produces HCl (hydrochloric acid) for digestion.", category: "chemistry" },
  { question: "What is the chemical formula for rust?", answers: ["FeO", "Fe₂O₃", "FeCl₃", "FeS"], correct: 1, explanation: "Rust is iron(III) oxide: Fe₂O₃ (hydrated form).", category: "chemistry" },

  // ── Biology (22) ───────────────────────────────────────────────────
  { question: "What is the powerhouse of the cell?", answers: ["Nucleus", "Ribosome", "Mitochondria", "Golgi body"], correct: 2, explanation: "Mitochondria produce ATP, the cell's energy currency.", category: "biology" },
  { question: "How many chromosomes do humans have?", answers: ["23", "44", "46", "48"], correct: 2, explanation: "Humans have 46 chromosomes (23 pairs).", category: "biology" },
  { question: "What process do plants use to make food?", answers: ["Respiration", "Photosynthesis", "Fermentation", "Digestion"], correct: 1, explanation: "Photosynthesis converts CO₂ and water into glucose using light.", category: "biology" },
  { question: "What is the largest organ in the human body?", answers: ["Liver", "Brain", "Skin", "Lungs"], correct: 2, explanation: "Skin is the largest organ by surface area and weight.", category: "biology" },
  { question: "What molecule carries genetic instructions?", answers: ["RNA", "DNA", "ATP", "Protein"], correct: 1, explanation: "DNA (deoxyribonucleic acid) stores genetic information.", category: "biology" },
  { question: "How many bones are in an adult human body?", answers: ["186", "196", "206", "216"], correct: 2, explanation: "Adults have 206 bones (babies have about 270).", category: "biology" },
  { question: "What type of blood cell fights infections?", answers: ["Red blood cell", "Platelet", "White blood cell", "Plasma"], correct: 2, explanation: "White blood cells are part of the immune system.", category: "biology" },
  { question: "What is the process of cell division called?", answers: ["Meiosis", "Mitosis", "Osmosis", "Synthesis"], correct: 1, explanation: "Mitosis produces two identical daughter cells.", category: "biology" },
  { question: "Which gas do humans exhale the most?", answers: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], correct: 2, explanation: "We breathe in O₂ and exhale more CO₂ than we inhale.", category: "biology" },
  { question: "What part of the brain controls balance?", answers: ["Cerebrum", "Cerebellum", "Brain stem", "Hypothalamus"], correct: 1, explanation: "The cerebellum coordinates movement and balance.", category: "biology" },
  { question: "What is the basic unit of life?", answers: ["Atom", "Molecule", "Cell", "Organ"], correct: 2, explanation: "The cell is the fundamental structural unit of all living things.", category: "biology" },
  { question: "What vitamin does the Sun help our body produce?", answers: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], correct: 3, explanation: "UV light triggers vitamin D synthesis in the skin.", category: "biology" },
  { question: "How many chambers does the human heart have?", answers: ["2", "3", "4", "5"], correct: 2, explanation: "The heart has 4 chambers: 2 atria and 2 ventricles.", category: "biology" },
  { question: "What is the function of red blood cells?", answers: ["Fight infection", "Clot blood", "Carry oxygen", "Produce hormones"], correct: 2, explanation: "Red blood cells carry oxygen via hemoglobin.", category: "biology" },
  { question: "Which system breaks down food for nutrients?", answers: ["Respiratory", "Circulatory", "Digestive", "Nervous"], correct: 2, explanation: "The digestive system breaks food into absorbable nutrients.", category: "biology" },
  { question: "What structure in plant cells is not in animal cells?", answers: ["Nucleus", "Cell wall", "Ribosome", "Mitochondria"], correct: 1, explanation: "Plant cells have a rigid cell wall; animal cells do not.", category: "biology" },
  { question: "What is a group of similar cells working together called?", answers: ["Organ", "Tissue", "System", "Organism"], correct: 1, explanation: "Tissues are groups of similar cells performing a function.", category: "biology" },
  { question: "What pigment makes plants green?", answers: ["Carotene", "Melanin", "Chlorophyll", "Xanthophyll"], correct: 2, explanation: "Chlorophyll absorbs light for photosynthesis, reflecting green.", category: "biology" },
  { question: "Which organ filters blood and produces urine?", answers: ["Liver", "Kidney", "Bladder", "Spleen"], correct: 1, explanation: "Kidneys filter waste from blood and produce urine.", category: "biology" },
  { question: "What is the scientific name for the voice box?", answers: ["Pharynx", "Larynx", "Trachea", "Bronchus"], correct: 1, explanation: "The larynx contains the vocal cords for sound production.", category: "biology" },
  { question: "What type of joint is the knee?", answers: ["Ball-and-socket", "Hinge", "Pivot", "Gliding"], correct: 1, explanation: "The knee is a hinge joint allowing flexion and extension.", category: "biology" },
  { question: "What is the term for an organism that makes its own food?", answers: ["Heterotroph", "Autotroph", "Decomposer", "Consumer"], correct: 1, explanation: "Autotrophs (like plants) produce food via photosynthesis.", category: "biology" },
];

// ─── Helpers ─────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const ALL_CATEGORIES: { key: QuizCategory; label: string }[] = [
  { key: "math", label: "Math" },
  { key: "science", label: "Science" },
  { key: "history", label: "History" },
  { key: "geography", label: "Geography" },
  { key: "chemistry", label: "Chemistry" },
  { key: "biology", label: "Biology" },
];

// ─── Component ───────────────────────────────────────────────────────

export function TriviaQuizGame() {
  const [einkMode, toggleEink] = useEinkMode();
  const [phase, setPhase] = useState<Phase>("menu");
  const [selectedCategories, setSelectedCategories] = useState<Set<QuizCategory>>(
    new Set(["math", "science", "history", "geography", "chemistry", "biology"]),
  );
  const [questionCount, setQuestionCount] = useState(10);
  const [showExplanations, setShowExplanations] = useState(true);

  // Game state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const [achievementQueue, setAchievementQueue] = useState<
    { name: string; tier: MedalTier }[]
  >([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!einkMode) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useGameMusic();
  }

  useEffect(() => {
    try {
      setHighScore(getLocalHighScore("trivia-quiz") ?? 0);
    } catch {}
  }, []);

  useEffect(() => {
    if (phase === "playing" || phase === "feedback") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, [phase]);

  const toggleCategory = useCallback((cat: QuizCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size > 1) next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  const startGame = useCallback(() => {
    const pool = QUESTIONS.filter((q) => selectedCategories.has(q.category));
    const shuffled = shuffle(pool);
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));
    setQuestions(selected);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setCorrectCount(0);
    setElapsed(0);
    setPhase("playing");
    if (!einkMode && isSfxEnabled()) sfxClick();
  }, [selectedCategories, questionCount, einkMode]);

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (phase !== "playing" || selectedAnswer !== null) return;
      const q = questions[currentIndex];
      const isCorrect = answerIndex === q.correct;

      setSelectedAnswer(answerIndex);
      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        if (!einkMode && isSfxEnabled()) sfxCorrect();
      } else {
        if (!einkMode && isSfxEnabled()) sfxWrong();
      }

      setPhase("feedback");
    },
    [phase, selectedAnswer, questions, currentIndex, einkMode],
  );

  const nextQuestion = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      // Quiz complete
      if (timerRef.current) clearInterval(timerRef.current);

      const finalCorrect = correctCount;
      const accuracy = questions.length > 0 ? finalCorrect / questions.length : 0;
      const score = Math.round(finalCorrect * 100 + Math.max(0, 300 - elapsed) * accuracy);

      if (!einkMode && isSfxEnabled()) {
        if (accuracy >= 0.8) sfxLevelUp();
        else sfxGameOver();
      }

      try {
        const prev = getLocalHighScore("trivia-quiz") ?? 0;
        if (score > prev) {
          setLocalHighScore("trivia-quiz", score);
          setHighScore(score);
        }
      } catch {}

      try {
        trackGamePlayed("trivia-quiz", score);
        const profile = getProfile();
        const medals = checkAchievements(
          { score, accuracy: Math.round(accuracy * 100), timeSeconds: elapsed },
          profile.totalGamesPlayed,
          profile.gamesPlayedByGameId,
        );
        if (medals.length > 0) {
          setAchievementQueue(
            medals.map((m) => ({ name: m.name, tier: m.tier })),
          );
        }
      } catch {}

      setPhase("complete");
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setPhase("playing");
    }
  }, [currentIndex, questions, correctCount, elapsed, einkMode]);

  const currentQ = questions[currentIndex] || null;
  const accuracy =
    questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;
  const finalScore =
    phase === "complete"
      ? Math.round(
          correctCount * 100 +
            Math.max(0, 300 - elapsed) * (correctCount / Math.max(1, questions.length)),
        )
      : 0;

  // ─── E-ink Render ───────────────────────────────────────────────────
  if (einkMode) {
    return (
      <EinkWrapper einkMode={true}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "8px 12px" }}>
          <EinkBanner einkMode={true} onToggle={toggleEink} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "2px solid #000",
            }}
          >
            <Link href="/games" style={{ color: "#000", textDecoration: "none", fontSize: 18, fontWeight: "bold" }}>
              ← Back
            </Link>
            <span style={{ fontSize: 22, fontWeight: "bold" }}>
              Trivia Quiz
            </span>
            <span style={{ width: 60 }} />
          </div>

          {phase === "menu" && (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <h2 style={{ fontSize: 28, marginBottom: 8 }}>Trivia Quiz</h2>
              <p style={{ fontSize: 18, marginBottom: 20 }}>
                Test your knowledge across multiple subjects.
              </p>

              {/* Categories */}
              <p style={{ fontWeight: "bold", marginBottom: 8 }}>
                Categories (tap to toggle):
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 6,
                  marginBottom: 16,
                }}
              >
                {ALL_CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => toggleCategory(c.key)}
                    style={{
                      border: "2px solid #000",
                      padding: "8px 14px",
                      fontSize: 16,
                      background: selectedCategories.has(c.key) ? "#000" : "#fff",
                      color: selectedCategories.has(c.key) ? "#fff" : "#000",
                      cursor: "pointer",
                      minHeight: 44,
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Question count */}
              <p style={{ fontWeight: "bold", marginBottom: 8 }}>
                Questions: {questionCount}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 6,
                  marginBottom: 16,
                }}
              >
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    style={{
                      border: "2px solid #000",
                      padding: "8px 16px",
                      fontSize: 16,
                      background: questionCount === n ? "#000" : "#fff",
                      color: questionCount === n ? "#fff" : "#000",
                      cursor: "pointer",
                      minHeight: 44,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Explanations toggle */}
              <button
                onClick={() => setShowExplanations(!showExplanations)}
                style={{
                  border: "2px solid #000",
                  padding: "8px 16px",
                  fontSize: 16,
                  background: showExplanations ? "#000" : "#fff",
                  color: showExplanations ? "#fff" : "#000",
                  cursor: "pointer",
                  minHeight: 44,
                  marginBottom: 24,
                }}
              >
                Explanations: {showExplanations ? "ON" : "OFF"}
              </button>

              <button
                onClick={startGame}
                style={{
                  display: "block",
                  width: "100%",
                  border: "2px solid #000",
                  padding: "14px",
                  fontSize: 22,
                  fontWeight: "bold",
                  background: "#fff",
                  color: "#000",
                  cursor: "pointer",
                  minHeight: 60,
                }}
              >
                Start Quiz
              </button>
            </div>
          )}

          {(phase === "playing" || phase === "feedback") && currentQ && (
            <div style={{ padding: "12px 0" }}>
              {/* Progress */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 16,
                  padding: "4px 0",
                  borderBottom: "1px solid #000",
                  marginBottom: 12,
                }}
              >
                <span>
                  Question {currentIndex + 1}/{questions.length}
                </span>
                <span>
                  Correct: {correctCount}
                </span>
                <span>Time: {formatTime(elapsed)}</span>
              </div>

              {/* Category badge */}
              <div
                style={{
                  display: "inline-block",
                  border: "1px solid #000",
                  padding: "2px 8px",
                  fontSize: 14,
                  marginBottom: 8,
                }}
              >
                {currentQ.category.toUpperCase()}
              </div>

              {/* Question */}
              <div
                style={{
                  fontSize: 22,
                  fontWeight: "bold",
                  padding: "12px 0",
                  borderBottom: "1px solid #ccc",
                  marginBottom: 12,
                }}
              >
                {currentQ.question}
              </div>

              {/* Answer buttons */}
              {currentQ.answers.map((ans, i) => {
                const isSelected = selectedAnswer === i;
                const isCorrectAnswer = i === currentQ.correct;
                let prefix = "";
                if (phase === "feedback") {
                  if (isCorrectAnswer) prefix = "✓ ";
                  else if (isSelected && !isCorrectAnswer) prefix = "✗ ";
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={phase === "feedback"}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      border: "2px solid #000",
                      padding: "14px 16px",
                      margin: "6px 0",
                      fontSize: 18,
                      fontWeight:
                        phase === "feedback" && isCorrectAnswer
                          ? "bold"
                          : "normal",
                      background:
                        phase === "feedback" && isSelected && !isCorrectAnswer
                          ? "#eee"
                          : "#fff",
                      color: "#000",
                      cursor: phase === "feedback" ? "default" : "pointer",
                      minHeight: 60,
                    }}
                  >
                    {prefix}
                    {ans}
                  </button>
                );
              })}

              {/* Feedback */}
              {phase === "feedback" && (
                <div style={{ marginTop: 12 }}>
                  {showExplanations && (
                    <div
                      style={{
                        border: "2px solid #000",
                        padding: "10px 14px",
                        fontSize: 16,
                        marginBottom: 12,
                      }}
                    >
                      {currentQ.explanation}
                    </div>
                  )}
                  <button
                    onClick={nextQuestion}
                    style={{
                      display: "block",
                      width: "100%",
                      border: "2px solid #000",
                      padding: "14px",
                      fontSize: 20,
                      fontWeight: "bold",
                      background: "#fff",
                      color: "#000",
                      cursor: "pointer",
                      minHeight: 60,
                    }}
                  >
                    {currentIndex + 1 >= questions.length
                      ? "See Results"
                      : "Next Question →"}
                  </button>
                </div>
              )}

              {phase !== "feedback" && (
                <button
                  onClick={() => setPhase("menu")}
                  style={{
                    display: "block",
                    width: "100%",
                    border: "2px solid #000",
                    padding: "12px",
                    fontSize: 16,
                    background: "#fff",
                    color: "#000",
                    cursor: "pointer",
                    marginTop: 12,
                    minHeight: 48,
                  }}
                >
                  ← Quit
                </button>
              )}
            </div>
          )}

          {phase === "complete" && (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <h2 style={{ fontSize: 28, marginBottom: 8 }}>Quiz Complete!</h2>
              <p style={{ fontSize: 20 }}>
                {correctCount}/{questions.length} correct ({accuracy}%)
              </p>
              <p style={{ fontSize: 18 }}>Time: {formatTime(elapsed)}</p>
              <p
                style={{ fontSize: 24, fontWeight: "bold", margin: "16px 0" }}
              >
                Score: {finalScore}
              </p>
              <button
                onClick={() => setPhase("menu")}
                style={{
                  display: "block",
                  width: "100%",
                  border: "2px solid #000",
                  padding: "14px",
                  fontSize: 20,
                  fontWeight: "bold",
                  background: "#fff",
                  color: "#000",
                  cursor: "pointer",
                  minHeight: 60,
                  marginTop: 16,
                }}
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </EinkWrapper>
    );
  }

  // ─── Standard Render ────────────────────────────────────────────────
  return (
    <EinkWrapper einkMode={false}>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <EinkBanner einkMode={false} onToggle={toggleEink} />

        <div className="flex items-center justify-between py-3">
          <Link
            href="/games"
            className="flex items-center gap-1 text-slate-400 hover:text-white text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain size={20} /> Trivia Quiz
          </h1>
          <AudioToggles />
        </div>

        {phase === "menu" && (
          <div className="text-center py-8">
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Trivia Quiz
            </h2>
            <p className="text-slate-400 mb-8">
              Test your knowledge across multiple subjects.
            </p>

            {highScore > 0 && (
              <div className="mb-4 text-sm text-yellow-400 flex items-center justify-center gap-1">
                <Trophy size={14} /> Best: {highScore}
              </div>
            )}

            {/* Categories */}
            <p className="text-slate-300 font-semibold mb-2">
              Categories (click to toggle):
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {ALL_CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => toggleCategory(c.key)}
                  className={`px-4 py-2 rounded-lg border font-semibold transition-colors ${
                    selectedCategories.has(c.key)
                      ? "bg-amber-600 border-amber-500 text-white"
                      : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Question count */}
            <p className="text-slate-300 font-semibold mb-2">
              Questions: {questionCount}
            </p>
            <div className="flex justify-center gap-2 mb-6">
              {[5, 10, 15, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    questionCount === n
                      ? "bg-orange-600 border-orange-500 text-white"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Explanations */}
            <button
              onClick={() => setShowExplanations(!showExplanations)}
              className={`px-4 py-2 rounded-lg border mb-8 transition-colors ${
                showExplanations
                  ? "bg-purple-600 border-purple-500 text-white"
                  : "bg-white/5 border-white/10 text-slate-400"
              }`}
            >
              Explanations: {showExplanations ? "ON" : "OFF"}
            </button>

            <div>
              <button
                onClick={startGame}
                className="px-10 py-3 rounded-lg font-bold text-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors"
              >
                Start Quiz
              </button>
            </div>
          </div>
        )}

        {(phase === "playing" || phase === "feedback") && currentQ && (
          <div>
            {/* Progress bar */}
            <div className="flex items-center justify-between text-sm text-slate-300 py-2 mb-1">
              <span>
                Q{currentIndex + 1}/{questions.length}
              </span>
              <span>Correct: {correctCount}</span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {formatTime(elapsed)}
              </span>
            </div>

            {/* Progress visual */}
            <div className="w-full h-1.5 bg-white/10 rounded-full mb-4">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{
                  width: `${((currentIndex + (phase === "feedback" ? 1 : 0)) / questions.length) * 100}%`,
                }}
              />
            </div>

            {/* Category */}
            <div className="inline-block px-2 py-0.5 text-xs rounded bg-white/10 text-slate-400 mb-3 capitalize">
              {currentQ.category}
            </div>

            {/* Question */}
            <h3 className="text-xl font-bold mb-6">{currentQ.question}</h3>

            {/* Answer buttons */}
            <div className="space-y-3">
              {currentQ.answers.map((ans, i) => {
                const isSelected = selectedAnswer === i;
                const isCorrectAnswer = i === currentQ.correct;
                let classes =
                  "w-full text-left px-5 py-4 rounded-lg border text-lg transition-colors ";

                if (phase === "feedback") {
                  if (isCorrectAnswer) {
                    classes +=
                      "bg-green-600/20 border-green-500 text-green-300 font-bold";
                  } else if (isSelected) {
                    classes +=
                      "bg-red-600/20 border-red-500 text-red-300";
                  } else {
                    classes += "bg-white/5 border-white/10 text-slate-500";
                  }
                } else {
                  classes +=
                    "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/20 cursor-pointer";
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={phase === "feedback"}
                    className={classes}
                  >
                    {phase === "feedback" && isCorrectAnswer && "✓ "}
                    {phase === "feedback" &&
                      isSelected &&
                      !isCorrectAnswer &&
                      "✗ "}
                    {ans}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {phase === "feedback" && (
              <div className="mt-4">
                {showExplanations && (
                  <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-300 mb-4">
                    {currentQ.explanation}
                  </div>
                )}
                <button
                  onClick={nextQuestion}
                  className="w-full py-3 rounded-lg font-bold text-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                >
                  {currentIndex + 1 >= questions.length
                    ? "See Results"
                    : "Next Question →"}
                </button>
              </div>
            )}

            {phase === "playing" && (
              <button
                onClick={() => setPhase("menu")}
                className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                ← Quit
              </button>
            )}
          </div>
        )}

        {phase === "complete" && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">{accuracy >= 80 ? "🏆" : accuracy >= 50 ? "📚" : "💪"}</div>
            <h2 className="text-3xl font-bold mb-2 text-amber-400">
              Quiz Complete!
            </h2>
            <div className="text-slate-300 space-y-1 mb-4">
              <p>
                Score:{" "}
                <span className="font-semibold">
                  {correctCount}/{questions.length}
                </span>{" "}
                ({accuracy}%)
              </p>
              <p>
                Time:{" "}
                <span className="font-semibold">{formatTime(elapsed)}</span>
              </p>
            </div>
            <div className="text-4xl font-bold text-yellow-400 mb-6">
              {finalScore} pts
            </div>

            <div className="max-w-xs mx-auto mb-6">
              <ScoreSubmit
                game="trivia-quiz"
                score={finalScore}
                level={questionCount >= 15 ? 3 : questionCount >= 10 ? 2 : 1}
                stats={{
                  accuracy,
                  timeSeconds: elapsed,
                }}
              />
            </div>

            <button
              onClick={() => setPhase("menu")}
              className="px-8 py-3 rounded-lg font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors"
            >
              Play Again
            </button>
          </div>
        )}

        {achievementQueue.map((a, i) => (
          <div key={i} className="fixed top-4 right-4 z-50">
            <AchievementToast
              name={a.name}
              tier={a.tier}
              onDismiss={() =>
                setAchievementQueue((q) => q.filter((_, j) => j !== i))
              }
            />
          </div>
        ))}
      </div>
    </EinkWrapper>
  );
}
