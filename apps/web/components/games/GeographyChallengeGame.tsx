"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Zap, RotateCcw, ChevronRight, CheckCircle2, XCircle, Lightbulb, Trophy, Star, Globe } from "lucide-react";
import { createAdaptiveState, adaptiveUpdate, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import { getGradeForLevel } from "@/lib/games/learning-guide";
import { trackGamePlayed, setLocalHighScore, getLocalHighScore } from "@/lib/games/use-scores";
import { checkAchievements, type GameStats } from "@/lib/games/achievements";
import { sfxCorrect, sfxWrong, sfxCombo, sfxStreakLost, sfxPerfect, sfxTick } from "@/lib/games/audio";

// ── Types ──

interface GeoQuestion {
  id: string;
  category: "capitals" | "countries" | "physical" | "landmarks" | "flags";
  topic: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  funFact?: string;
}

type Category = GeoQuestion["category"];
type GameMode = "learn" | "challenge" | "practice";
type Phase = "menu" | "topic-select" | "playing" | "result" | "review";

const CATEGORIES: { id: Category; label: string; color: string; bg: string; border: string; topics: { id: string; label: string }[] }[] = [
  {
    id: "capitals", label: "World Capitals", color: "#6366f1", bg: "bg-indigo-500/10", border: "border-indigo-500/30",
    topics: [
      { id: "european-capitals", label: "European Capitals" },
      { id: "asian-capitals", label: "Asian Capitals" },
      { id: "african-capitals", label: "African Capitals" },
      { id: "americas-capitals", label: "Americas Capitals" },
      { id: "oceania-capitals", label: "Oceania Capitals" },
    ],
  },
  {
    id: "countries", label: "Countries & Continents", color: "#22c55e", bg: "bg-emerald-500/10", border: "border-emerald-500/30",
    topics: [
      { id: "continents", label: "Continents" },
      { id: "country-facts", label: "Country Facts" },
      { id: "borders-neighbors", label: "Borders & Neighbors" },
      { id: "populations", label: "Populations & Sizes" },
    ],
  },
  {
    id: "physical", label: "Physical Geography", color: "#06b6d4", bg: "bg-cyan-500/10", border: "border-cyan-500/30",
    topics: [
      { id: "rivers", label: "Major Rivers" },
      { id: "mountains", label: "Mountain Ranges" },
      { id: "oceans-seas", label: "Oceans & Seas" },
      { id: "deserts", label: "Deserts" },
      { id: "lakes", label: "Lakes & Waterfalls" },
    ],
  },
  {
    id: "landmarks", label: "World Landmarks", color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/30",
    topics: [
      { id: "famous-landmarks", label: "Famous Landmarks" },
      { id: "natural-wonders", label: "Natural Wonders" },
    ],
  },
  {
    id: "flags", label: "Flags & Symbols", color: "#f43f5e", bg: "bg-rose-500/10", border: "border-rose-500/30",
    topics: [
      { id: "flag-identification", label: "Flag Identification" },
      { id: "national-symbols", label: "National Symbols" },
    ],
  },
];

const CATEGORY_INTROS: Record<string, string> = {
  "european-capitals": "Europe has 44 countries, from tiny Vatican City (0.44 km²) to vast Russia. Many European capitals are centuries old, rich in history, architecture, and culture. Can you match each country to its capital?",
  "asian-capitals": "Asia is the world's largest and most populous continent with 48 countries. From ancient cities like Beijing and Delhi to modern ones like Tokyo and Seoul, Asian capitals represent incredible diversity.",
  "african-capitals": "Africa has 54 countries — the most of any continent. Many African capitals have changed names as nations gained independence. Some capitals are inland, while others sit on the coast.",
  "americas-capitals": "The Americas span from the Arctic to near Antarctica, with 35 countries. Be careful — the capital isn't always the biggest or most famous city! (Hint: It's not New York, and it's not Sydney.)",
  "oceania-capitals": "Oceania includes Australia, New Zealand, and thousands of Pacific islands across 14 countries. Many island nations here have fascinating capitals you might not have heard of.",
  "continents": "Earth has 7 continents: Africa, Antarctica, Asia, Australia/Oceania, Europe, North America, and South America. They differ hugely in size, population, and number of countries.",
  "country-facts": "There are 195 countries in the world (193 UN members + 2 observers). Each has unique features — from the smallest (Vatican City) to the largest (Russia spanning 11 time zones).",
  "borders-neighbors": "Country borders can be natural (rivers, mountains) or drawn by humans. Some countries are islands with no land borders, while others border many neighbors.",
  "populations": "The world has over 8 billion people, but population is very unevenly distributed. China and India alone have over 2.8 billion combined. Some countries have fewer people than a large city.",
  "rivers": "Rivers are vital waterways that have shaped civilizations for millennia. The longest rivers flow thousands of kilometers, providing water, food, transport, and power to billions of people.",
  "mountains": "Mountains cover about 22% of Earth's land surface. They affect weather, create biodiversity hotspots, and have inspired awe throughout human history. The highest peaks challenge even the best climbers.",
  "oceans-seas": "Oceans cover about 71% of Earth's surface and contain 97% of all water. There are five oceans, many seas, and we've explored less than 20% of the ocean floor.",
  "deserts": "Deserts cover about 33% of Earth's land. They're defined by low rainfall (under 250mm/year), not heat — Antarctica is technically the world's largest desert!",
  "lakes": "Lakes are inland bodies of standing water. They can be freshwater or saltwater, and range from tiny ponds to the massive Caspian Sea. The Great Lakes hold 21% of Earth's fresh surface water.",
  "famous-landmarks": "Landmarks are structures or places of great importance or beauty. Many have stood for centuries and attract millions of visitors each year, representing humanity's greatest achievements.",
  "natural-wonders": "Nature has created breathtaking wonders — from the Grand Canyon carved over millions of years to the Great Barrier Reef built by tiny coral polyps. These places showcase Earth's incredible diversity.",
  "flag-identification": "Every country has a flag that represents its identity, history, and values. Colors and symbols on flags often have deep meanings — red might represent courage, while stars can symbolize unity.",
  "national-symbols": "Countries adopt symbols — animals, plants, and objects — that represent their identity. The bald eagle represents the USA, the maple leaf represents Canada, and the kiwi bird represents New Zealand.",
};

// ── Questions ──

const QUESTIONS: GeoQuestion[] = [
  // ─── CAPITALS: Europe ───
  { id:"g01", category:"capitals", topic:"european-capitals", difficulty:1, question:"What is the capital of France?", choices:["Lyon","Marseille","Paris","Nice"], correctIndex:2, explanation:"Paris is France's capital and largest city with ~2.2 million people (12 million in the metro area). It's known for the Eiffel Tower, the Louvre, and French cuisine.", funFact:"The Eiffel Tower was supposed to be temporary — built for the 1889 World's Fair!" },
  { id:"g02", category:"capitals", topic:"european-capitals", difficulty:1, question:"What is the capital of the United Kingdom?", choices:["Edinburgh","Manchester","London","Liverpool"], correctIndex:2, explanation:"London is the UK's capital with about 9 million people. It's home to Buckingham Palace, Big Ben, and the Tower of London." },
  { id:"g03", category:"capitals", topic:"european-capitals", difficulty:1, question:"What is the capital of Germany?", choices:["Munich","Frankfurt","Hamburg","Berlin"], correctIndex:3, explanation:"Berlin is Germany's capital and largest city. It was divided into East and West Berlin (1961-1989) during the Cold War.", funFact:"Berlin has more bridges than Venice — over 1,700!" },
  { id:"g04", category:"capitals", topic:"european-capitals", difficulty:1, question:"What is the capital of Spain?", choices:["Barcelona","Madrid","Seville","Valencia"], correctIndex:1, explanation:"Madrid is Spain's capital and largest city, located in the center of the country. It's known for the Prado Museum and the Royal Palace." },
  { id:"g05", category:"capitals", topic:"european-capitals", difficulty:1, question:"What is the capital of Italy?", choices:["Milan","Venice","Rome","Florence"], correctIndex:2, explanation:"Rome (Roma) is Italy's capital, founded in 753 BCE. It was the heart of the Roman Empire and is home to the Colosseum and Vatican City." },
  { id:"g06", category:"capitals", topic:"european-capitals", difficulty:2, question:"What is the capital of Poland?", choices:["Krakow","Warsaw","Gdansk","Wroclaw"], correctIndex:1, explanation:"Warsaw (Warszawa) is Poland's capital. It was almost entirely destroyed in WWII but was painstakingly rebuilt, and the historic center is a UNESCO World Heritage Site." },
  { id:"g07", category:"capitals", topic:"european-capitals", difficulty:2, question:"What is the capital of Sweden?", choices:["Gothenburg","Malmo","Stockholm","Uppsala"], correctIndex:2, explanation:"Stockholm is Sweden's capital, built on 14 islands where a lake meets the sea. It's home to the Nobel Prize ceremony and the ABBA Museum." },
  { id:"g08", category:"capitals", topic:"european-capitals", difficulty:2, question:"What is the capital of Greece?", choices:["Thessaloniki","Athens","Sparta","Crete"], correctIndex:1, explanation:"Athens is one of the world's oldest cities (3,400+ years). It was the birthplace of democracy and is named after the goddess Athena." },
  { id:"g09", category:"capitals", topic:"european-capitals", difficulty:3, question:"What is the capital of Switzerland?", choices:["Zurich","Geneva","Bern","Basel"], correctIndex:2, explanation:"Bern is Switzerland's capital (officially 'Federal City'). Many people guess Zurich or Geneva, but Bern has been the capital since 1848." },
  { id:"g10", category:"capitals", topic:"european-capitals", difficulty:3, question:"What is the capital of Finland?", choices:["Turku","Helsinki","Tampere","Espoo"], correctIndex:1, explanation:"Helsinki is Finland's capital and largest city, located on the coast of the Baltic Sea. Finland is often ranked as the world's happiest country." },
  { id:"g11", category:"capitals", topic:"european-capitals", difficulty:3, question:"What is the capital of Croatia?", choices:["Split","Dubrovnik","Zagreb","Rijeka"], correctIndex:2, explanation:"Zagreb is Croatia's capital and largest city. Croatia joined the EU in 2013 and adopted the euro in 2023." },
  { id:"g12", category:"capitals", topic:"european-capitals", difficulty:4, question:"What is the capital of Montenegro?", choices:["Pristina","Podgorica","Tirana","Skopje"], correctIndex:1, explanation:"Podgorica is Montenegro's capital and largest city. Montenegro declared independence from Serbia in 2006 and is one of Europe's newest countries." },
  { id:"g13", category:"capitals", topic:"european-capitals", difficulty:4, question:"What is the capital of Slovenia?", choices:["Zagreb","Bratislava","Ljubljana","Sarajevo"], correctIndex:2, explanation:"Ljubljana is Slovenia's capital, known for its dragon-decorated bridges and beautiful old town. Fun fact: the name means 'beloved' in Slovenian." },

  // ─── CAPITALS: Asia ───
  { id:"g14", category:"capitals", topic:"asian-capitals", difficulty:1, question:"What is the capital of Japan?", choices:["Osaka","Kyoto","Tokyo","Yokohama"], correctIndex:2, explanation:"Tokyo is Japan's capital and the world's most populous metro area with ~37 million people. It hosted the Olympics in 1964 and 2021.", funFact:"Tokyo's original name was Edo, changed to Tokyo ('Eastern Capital') in 1868." },
  { id:"g15", category:"capitals", topic:"asian-capitals", difficulty:1, question:"What is the capital of China?", choices:["Shanghai","Beijing","Guangzhou","Hong Kong"], correctIndex:1, explanation:"Beijing has been China's capital for most of the last 800 years. It's home to the Forbidden City and the Great Wall is nearby." },
  { id:"g16", category:"capitals", topic:"asian-capitals", difficulty:1, question:"What is the capital of India?", choices:["Mumbai","Kolkata","New Delhi","Bangalore"], correctIndex:2, explanation:"New Delhi is India's capital. India is the world's most populous country (1.4+ billion people) and the world's largest democracy." },
  { id:"g17", category:"capitals", topic:"asian-capitals", difficulty:2, question:"What is the capital of South Korea?", choices:["Busan","Seoul","Incheon","Daegu"], correctIndex:1, explanation:"Seoul is South Korea's capital with ~10 million people (25 million metro). It's a global tech hub, home to Samsung and Hyundai." },
  { id:"g18", category:"capitals", topic:"asian-capitals", difficulty:2, question:"What is the capital of Thailand?", choices:["Chiang Mai","Phuket","Bangkok","Pattaya"], correctIndex:2, explanation:"Bangkok is Thailand's capital and largest city. Its full ceremonial name is the longest city name in the world at 168 characters!" },
  { id:"g19", category:"capitals", topic:"asian-capitals", difficulty:3, question:"What is the capital of Vietnam?", choices:["Ho Chi Minh City","Hanoi","Da Nang","Hue"], correctIndex:1, explanation:"Hanoi is Vietnam's capital. Many people guess Ho Chi Minh City (formerly Saigon), which is larger but is not the capital." },
  { id:"g20", category:"capitals", topic:"asian-capitals", difficulty:3, question:"What is the capital of Pakistan?", choices:["Karachi","Lahore","Islamabad","Faisalabad"], correctIndex:2, explanation:"Islamabad became Pakistan's capital in 1967, replacing Karachi. It was purpose-built as a planned capital city." },
  { id:"g21", category:"capitals", topic:"asian-capitals", difficulty:4, question:"What is the capital of Myanmar?", choices:["Yangon","Mandalay","Naypyidaw","Bago"], correctIndex:2, explanation:"Naypyidaw became Myanmar's capital in 2006, replacing Yangon (Rangoon). It was purpose-built and is one of the least populated capitals." },

  // ─── CAPITALS: Africa ───
  { id:"g22", category:"capitals", topic:"african-capitals", difficulty:1, question:"What is the capital of Egypt?", choices:["Alexandria","Cairo","Luxor","Giza"], correctIndex:1, explanation:"Cairo is Africa's largest city with ~20 million people. It sits on the Nile River near the ancient pyramids of Giza." },
  { id:"g23", category:"capitals", topic:"african-capitals", difficulty:2, question:"What is the capital of South Africa? (legislative capital)", choices:["Johannesburg","Pretoria","Cape Town","Durban"], correctIndex:2, explanation:"South Africa uniquely has THREE capitals: Cape Town (legislative), Pretoria (executive), and Bloemfontein (judicial)." },
  { id:"g24", category:"capitals", topic:"african-capitals", difficulty:2, question:"What is the capital of Kenya?", choices:["Mombasa","Nairobi","Kisumu","Nakuru"], correctIndex:1, explanation:"Nairobi is Kenya's capital and a major hub for East Africa. It's near a national park where you can see wildlife with the city skyline in the background!" },
  { id:"g25", category:"capitals", topic:"african-capitals", difficulty:3, question:"What is the capital of Nigeria?", choices:["Lagos","Abuja","Kano","Ibadan"], correctIndex:1, explanation:"Abuja became Nigeria's capital in 1991, replacing Lagos. Lagos is much larger but Abuja was chosen for its central location." },
  { id:"g26", category:"capitals", topic:"african-capitals", difficulty:3, question:"What is the capital of Morocco?", choices:["Casablanca","Marrakech","Rabat","Fez"], correctIndex:2, explanation:"Rabat is Morocco's capital, though Casablanca is larger and more famous. Rabat's medina is a UNESCO World Heritage Site." },
  { id:"g27", category:"capitals", topic:"african-capitals", difficulty:4, question:"What is the capital of Tanzania?", choices:["Dar es Salaam","Dodoma","Arusha","Zanzibar City"], correctIndex:1, explanation:"Dodoma is Tanzania's official capital since 1996, though Dar es Salaam remains the economic center and largest city." },

  // ─── CAPITALS: Americas ───
  { id:"g28", category:"capitals", topic:"americas-capitals", difficulty:1, question:"What is the capital of the United States?", choices:["New York","Los Angeles","Washington, D.C.","Chicago"], correctIndex:2, explanation:"Washington, D.C. has been the U.S. capital since 1800. 'D.C.' stands for 'District of Columbia' — it's not in any state." },
  { id:"g29", category:"capitals", topic:"americas-capitals", difficulty:1, question:"What is the capital of Canada?", choices:["Toronto","Vancouver","Montreal","Ottawa"], correctIndex:3, explanation:"Ottawa is Canada's capital, not Toronto (which is the largest city). Ottawa was chosen partly because it's between English-speaking Ontario and French-speaking Quebec." },
  { id:"g30", category:"capitals", topic:"americas-capitals", difficulty:1, question:"What is the capital of Brazil?", choices:["Rio de Janeiro","Sao Paulo","Brasilia","Salvador"], correctIndex:2, explanation:"Brasilia became Brazil's capital in 1960, replacing Rio de Janeiro. It was purpose-built in the shape of an airplane!" },
  { id:"g31", category:"capitals", topic:"americas-capitals", difficulty:2, question:"What is the capital of Mexico?", choices:["Guadalajara","Cancun","Mexico City","Monterrey"], correctIndex:2, explanation:"Mexico City is one of the world's largest cities with ~22 million metro. It was built on the ruins of the Aztec capital Tenochtitlan." },
  { id:"g32", category:"capitals", topic:"americas-capitals", difficulty:2, question:"What is the capital of Argentina?", choices:["Cordoba","Mendoza","Buenos Aires","Rosario"], correctIndex:2, explanation:"Buenos Aires is Argentina's capital, known as the 'Paris of South America' for its European-influenced architecture and vibrant tango culture." },
  { id:"g33", category:"capitals", topic:"americas-capitals", difficulty:3, question:"What is the capital of Colombia?", choices:["Medellin","Bogota","Cartagena","Cali"], correctIndex:1, explanation:"Bogota is Colombia's capital, sitting at 2,640m (8,661 ft) above sea level in the Andes mountains. It's the third-highest capital in South America." },
  { id:"g34", category:"capitals", topic:"americas-capitals", difficulty:3, question:"What is the capital of Peru?", choices:["Cusco","Arequipa","Lima","Trujillo"], correctIndex:2, explanation:"Lima is Peru's capital and largest city, located on the Pacific coast. It was founded by Spanish conquistador Francisco Pizarro in 1535." },

  // ─── COUNTRIES & CONTINENTS ───
  { id:"g35", category:"countries", topic:"continents", difficulty:1, question:"Which is the largest continent by area?", choices:["Africa","North America","Asia","Europe"], correctIndex:2, explanation:"Asia is the largest continent at about 44.6 million km² — it covers 30% of Earth's land area and is home to 60% of the world's population." },
  { id:"g36", category:"countries", topic:"continents", difficulty:1, question:"Which continent is the Sahara Desert in?", choices:["Asia","South America","Africa","Australia"], correctIndex:2, explanation:"The Sahara Desert is in northern Africa. It's the world's largest hot desert at 9.2 million km² — roughly the size of the United States!" },
  { id:"g37", category:"countries", topic:"continents", difficulty:1, question:"How many continents are there?", choices:["5","6","7","8"], correctIndex:2, explanation:"There are 7 continents: Africa, Antarctica, Asia, Australia/Oceania, Europe, North America, and South America." },
  { id:"g38", category:"countries", topic:"country-facts", difficulty:1, question:"What is the largest country in the world by area?", choices:["Canada","China","United States","Russia"], correctIndex:3, explanation:"Russia is by far the largest country at 17.1 million km², spanning 11 time zones from Europe to the Pacific Ocean.", funFact:"Russia is so big that it has more surface area than Pluto!" },
  { id:"g39", category:"countries", topic:"country-facts", difficulty:2, question:"What is the smallest country in the world?", choices:["Monaco","Liechtenstein","Vatican City","San Marino"], correctIndex:2, explanation:"Vatican City is the smallest country at just 0.44 km² (about 120 acres). It's an independent city-state within Rome, home to the Pope." },
  { id:"g40", category:"countries", topic:"country-facts", difficulty:2, question:"Which country has the most people?", choices:["China","India","United States","Indonesia"], correctIndex:1, explanation:"India surpassed China as the world's most populous country around 2023, with over 1.4 billion people." },
  { id:"g41", category:"countries", topic:"country-facts", difficulty:2, question:"On which continent is Australia?", choices:["Asia","Oceania","It is its own continent","Europe"], correctIndex:2, explanation:"Australia is both a country and a continent (sometimes called Australia/Oceania). It's the world's smallest continent but sixth-largest country." },
  { id:"g42", category:"countries", topic:"borders-neighbors", difficulty:2, question:"Which country borders both the Atlantic and Pacific Oceans?", choices:["Brazil","Mexico","Colombia","Panama"], correctIndex:3, explanation:"Panama borders both oceans and the Panama Canal connects them. Mexico, Colombia, and other countries also touch both oceans, but Panama is the most famous for its canal." },
  { id:"g43", category:"countries", topic:"borders-neighbors", difficulty:3, question:"How many countries share a land border with China?", choices:["8","11","14","17"], correctIndex:2, explanation:"China borders 14 countries — the most of any country (tied with Russia). They include India, Pakistan, Mongolia, Russia, Vietnam, and more." },
  { id:"g44", category:"countries", topic:"populations", difficulty:3, question:"Which is the most densely populated country (by population density)?", choices:["India","Singapore","Monaco","Bangladesh"], correctIndex:2, explanation:"Monaco has the highest population density at ~26,000 people per km². It's a tiny city-state of just 2 km² on the French Riviera." },
  { id:"g45", category:"countries", topic:"country-facts", difficulty:3, question:"What is the only country in the world that is also a continent?", choices:["Greenland","Russia","Australia","Antarctica"], correctIndex:2, explanation:"Australia is the only country that is also a continent. Antarctica is a continent but not a country (it's governed by international treaty)." },

  // ─── PHYSICAL: Rivers ───
  { id:"g46", category:"physical", topic:"rivers", difficulty:1, question:"What is the longest river in the world?", choices:["Amazon","Mississippi","Yangtze","Nile"], correctIndex:3, explanation:"The Nile River is about 6,650 km long, flowing through northeastern Africa to the Mediterranean. Ancient Egyptian civilization developed along its banks.", funFact:"The Nile flows northward — one of the few major rivers to do so!" },
  { id:"g47", category:"physical", topic:"rivers", difficulty:1, question:"Which river flows through London?", choices:["Seine","Rhine","Thames","Danube"], correctIndex:2, explanation:"The River Thames (pronounced 'Temz') flows 346 km through southern England, passing through London. It was once so polluted that it was declared 'biologically dead' in the 1950s, but has since recovered." },
  { id:"g48", category:"physical", topic:"rivers", difficulty:2, question:"Which river carries the most water (by volume)?", choices:["Nile","Mississippi","Amazon","Congo"], correctIndex:2, explanation:"The Amazon River carries more water than any other — about 20% of all river water that flows into the oceans! It's also the second-longest river in the world." },
  { id:"g49", category:"physical", topic:"rivers", difficulty:2, question:"Through which country does the Ganges River primarily flow?", choices:["China","Pakistan","India","Thailand"], correctIndex:2, explanation:"The Ganges flows through India and Bangladesh. It's considered sacred in Hinduism, and about 400 million people live in its basin." },
  { id:"g50", category:"physical", topic:"rivers", difficulty:3, question:"Which river forms much of the border between the US and Mexico?", choices:["Colorado","Mississippi","Missouri","Rio Grande"], correctIndex:3, explanation:"The Rio Grande flows 3,051 km from Colorado to the Gulf of Mexico, forming about 2/3 of the US-Mexico border." },

  // ─── PHYSICAL: Mountains ───
  { id:"g51", category:"physical", topic:"mountains", difficulty:1, question:"What is the tallest mountain in the world?", choices:["K2","Kangchenjunga","Mount Everest","Makalu"], correctIndex:2, explanation:"Mount Everest stands at 8,849 meters (29,032 feet). It's on the border of Nepal and Tibet and was first summited by Edmund Hillary and Tenzing Norgay in 1953.", funFact:"Everest grows about 4mm taller each year due to tectonic activity!" },
  { id:"g52", category:"physical", topic:"mountains", difficulty:1, question:"On which continent are the Andes Mountains?", choices:["Africa","Asia","Europe","South America"], correctIndex:3, explanation:"The Andes are the world's longest mountain range, stretching 7,000 km along the western coast of South America through 7 countries." },
  { id:"g53", category:"physical", topic:"mountains", difficulty:2, question:"In which mountain range is Mount Everest?", choices:["Alps","Andes","Rockies","Himalayas"], correctIndex:3, explanation:"The Himalayas stretch across five countries: Bhutan, China, India, Nepal, and Pakistan. They contain all 14 of the world's peaks above 8,000 meters." },
  { id:"g54", category:"physical", topic:"mountains", difficulty:3, question:"What is the tallest mountain in Africa?", choices:["Mount Kenya","Atlas Mountains","Mount Kilimanjaro","Simien Mountains"], correctIndex:2, explanation:"Mount Kilimanjaro in Tanzania stands at 5,895m. It's a dormant volcano and the tallest freestanding mountain in the world (not part of a range)." },

  // ─── PHYSICAL: Oceans ───
  { id:"g55", category:"physical", topic:"oceans-seas", difficulty:1, question:"What is the largest ocean?", choices:["Atlantic","Indian","Pacific","Arctic"], correctIndex:2, explanation:"The Pacific Ocean is the largest and deepest, covering about 165 million km² — more than all the land on Earth combined!", funFact:"The Pacific is so big it contains the point farthest from any land, called 'Point Nemo.'" },
  { id:"g56", category:"physical", topic:"oceans-seas", difficulty:1, question:"How many oceans are there?", choices:["3","4","5","7"], correctIndex:2, explanation:"There are 5 oceans: Pacific, Atlantic, Indian, Southern (Antarctic), and Arctic. The Southern Ocean was officially recognized in 2000." },
  { id:"g57", category:"physical", topic:"oceans-seas", difficulty:2, question:"What is the deepest point in the ocean?", choices:["Puerto Rico Trench","Mariana Trench","Java Trench","Tonga Trench"], correctIndex:1, explanation:"The Mariana Trench in the Pacific is about 11,034 meters deep at its lowest point, Challenger Deep. Mount Everest could fit inside with room to spare!" },
  { id:"g58", category:"physical", topic:"oceans-seas", difficulty:3, question:"Which is the saltiest body of water on Earth?", choices:["Dead Sea","Red Sea","Great Salt Lake","Don Juan Pond"], correctIndex:3, explanation:"Don Juan Pond in Antarctica has about 40% salinity, making it the saltiest water body. The Dead Sea (34% salinity) is the most famous salty lake." },

  // ─── PHYSICAL: Deserts ───
  { id:"g59", category:"physical", topic:"deserts", difficulty:1, question:"What is the largest hot desert in the world?", choices:["Gobi","Arabian","Sahara","Kalahari"], correctIndex:2, explanation:"The Sahara is the world's largest hot desert at 9.2 million km² in northern Africa. However, Antarctica is technically the largest overall desert by the dry-climate definition." },
  { id:"g60", category:"physical", topic:"deserts", difficulty:2, question:"What is the driest place on Earth?", choices:["Sahara Desert","Death Valley","Atacama Desert","Gobi Desert"], correctIndex:2, explanation:"The Atacama Desert in Chile is the driest non-polar place, with some areas having received no rain in recorded history. It's used to test Mars rovers!", funFact:"Some parts of the Atacama have been dry for 15 million years." },
  { id:"g61", category:"physical", topic:"deserts", difficulty:3, question:"On which continent is the Gobi Desert?", choices:["Africa","Asia","Australia","North America"], correctIndex:1, explanation:"The Gobi Desert is in northern China and southern Mongolia. It's a cold desert — temperatures can drop to -40°C in winter!" },

  // ─── LANDMARKS ───
  { id:"g62", category:"landmarks", topic:"famous-landmarks", difficulty:1, question:"In which country is the Eiffel Tower?", choices:["Italy","Germany","Spain","France"], correctIndex:3, explanation:"The Eiffel Tower is in Paris, France. Built in 1889 for the World's Fair, it stands 330 meters tall and is the most-visited paid monument in the world." },
  { id:"g63", category:"landmarks", topic:"famous-landmarks", difficulty:1, question:"In which country are the Pyramids of Giza?", choices:["Sudan","Morocco","Egypt","Iraq"], correctIndex:2, explanation:"The Great Pyramids are near Cairo, Egypt. The Great Pyramid (built ~2560 BCE) was the tallest structure in the world for over 3,800 years!" },
  { id:"g64", category:"landmarks", topic:"famous-landmarks", difficulty:1, question:"In which country is the Great Wall?", choices:["Japan","India","China","Mongolia"], correctIndex:2, explanation:"The Great Wall of China stretches over 21,000 km across northern China. It was built over many centuries to protect against invasions." },
  { id:"g65", category:"landmarks", topic:"famous-landmarks", difficulty:2, question:"In which country is the Colosseum?", choices:["Greece","Italy","Turkey","Spain"], correctIndex:1, explanation:"The Colosseum is in Rome, Italy. Built around 70-80 CE, it could hold 50,000-80,000 spectators who watched gladiator contests and public spectacles." },
  { id:"g66", category:"landmarks", topic:"famous-landmarks", difficulty:2, question:"In which country is Machu Picchu?", choices:["Colombia","Bolivia","Peru","Ecuador"], correctIndex:2, explanation:"Machu Picchu is an Incan citadel in the Andes of Peru, built around 1450 CE. It sits at 2,430 meters and was unknown to the outside world until 1911." },
  { id:"g67", category:"landmarks", topic:"famous-landmarks", difficulty:2, question:"In which country is the Taj Mahal?", choices:["Pakistan","Bangladesh","India","Sri Lanka"], correctIndex:2, explanation:"The Taj Mahal in Agra, India was built by Emperor Shah Jahan as a tomb for his wife. Made of white marble, it took 22 years and 20,000 workers to build." },
  { id:"g68", category:"landmarks", topic:"natural-wonders", difficulty:1, question:"In which country is the Grand Canyon?", choices:["Mexico","Canada","United States","Chile"], correctIndex:2, explanation:"The Grand Canyon is in Arizona, USA. It's 446 km long, up to 29 km wide, and 1,800 meters deep, carved by the Colorado River over millions of years." },
  { id:"g69", category:"landmarks", topic:"natural-wonders", difficulty:2, question:"In which country is the Great Barrier Reef?", choices:["Indonesia","Philippines","Australia","Fiji"], correctIndex:2, explanation:"The Great Barrier Reef is off Queensland, Australia. It's the world's largest coral reef system, visible from space, and home to thousands of species." },
  { id:"g70", category:"landmarks", topic:"natural-wonders", difficulty:3, question:"Victoria Falls is on the border of which two countries?", choices:["Kenya & Tanzania","Zambia & Zimbabwe","Congo & Uganda","South Africa & Mozambique"], correctIndex:1, explanation:"Victoria Falls sits on the Zambezi River between Zambia and Zimbabwe. It's 1,708 meters wide and 108 meters tall — one of the largest waterfalls in the world." },

  // ─── FLAGS ───
  { id:"g71", category:"flags", topic:"flag-identification", difficulty:1, question:"Which country's flag has a red maple leaf?", choices:["Japan","Switzerland","Canada","Denmark"], correctIndex:2, explanation:"Canada's flag features a red maple leaf on a white background flanked by red bands. It was adopted in 1965." },
  { id:"g72", category:"flags", topic:"flag-identification", difficulty:1, question:"Which country's flag is red with a white cross?", choices:["Denmark","Norway","Switzerland","Finland"], correctIndex:2, explanation:"Switzerland's flag is a white cross on a red background (one of only two square national flags, along with Vatican City)." },
  { id:"g73", category:"flags", topic:"flag-identification", difficulty:2, question:"Which is the only country with a non-rectangular flag?", choices:["Bhutan","Switzerland","Nepal","Vatican City"], correctIndex:2, explanation:"Nepal's flag is made of two stacked triangles (pennants). It's the only national flag that is not rectangular or square." },
  { id:"g74", category:"flags", topic:"flag-identification", difficulty:2, question:"Which country's flag is a red circle on a white background?", choices:["South Korea","China","Japan","Bangladesh"], correctIndex:2, explanation:"Japan's flag (Nisshōki or Hinomaru) is a red disc on a white background, representing the rising sun. Japan is called 'the Land of the Rising Sun.'" },
  { id:"g75", category:"flags", topic:"national-symbols", difficulty:2, question:"The bald eagle is the national symbol of which country?", choices:["Canada","Germany","Russia","United States"], correctIndex:3, explanation:"The bald eagle has been the national emblem of the United States since 1782. It represents freedom and strength." },
  { id:"g76", category:"flags", topic:"national-symbols", difficulty:3, question:"What animal appears on the Australian coat of arms alongside the emu?", choices:["Koala","Platypus","Kangaroo","Wombat"], correctIndex:2, explanation:"Australia's coat of arms features a kangaroo and an emu. Both animals were chosen because they can't easily walk backwards, symbolizing moving forward." },

  // ─── More varied questions ───
  { id:"g77", category:"countries", topic:"country-facts", difficulty:2, question:"Which is the only country in the world with a Bible on its flag?", choices:["Vatican City","Dominican Republic","Israel","Portugal"], correctIndex:1, explanation:"The Dominican Republic's flag features an open Bible in the center of its coat of arms. It's the only national flag to include a Bible." },
  { id:"g78", category:"physical", topic:"lakes", difficulty:2, question:"What is the largest lake in the world by surface area?", choices:["Lake Superior","Lake Victoria","Lake Baikal","Caspian Sea"], correctIndex:3, explanation:"The Caspian Sea is technically the world's largest lake at 371,000 km². Despite its name, it's enclosed by land and is considered a lake." },
  { id:"g79", category:"physical", topic:"lakes", difficulty:3, question:"What is the deepest lake in the world?", choices:["Caspian Sea","Lake Tanganyika","Lake Baikal","Lake Superior"], correctIndex:2, explanation:"Lake Baikal in Russia is 1,642 meters deep and holds about 20% of the world's unfrozen fresh surface water. It's also the world's oldest lake at ~25 million years." },
  { id:"g80", category:"countries", topic:"continents", difficulty:2, question:"Which is the only continent with no countries?", choices:["Australia","Arctic","Antarctica","Oceania"], correctIndex:2, explanation:"Antarctica has no countries or permanent population. It's governed by the Antarctic Treaty (1959), which dedicates the continent to peaceful scientific research." },
  { id:"g81", category:"landmarks", topic:"famous-landmarks", difficulty:3, question:"In which city is the Parthenon?", choices:["Rome","Istanbul","Athens","Cairo"], correctIndex:2, explanation:"The Parthenon sits atop the Acropolis in Athens, Greece. It was built in 447-432 BCE as a temple to the goddess Athena." },
  { id:"g82", category:"physical", topic:"mountains", difficulty:2, question:"What is the tallest mountain in Europe?", choices:["Mont Blanc","Mount Elbrus","Matterhorn","Mount Olympus"], correctIndex:1, explanation:"Mount Elbrus in Russia's Caucasus Mountains is 5,642m tall. If you consider only Western Europe, Mont Blanc (4,808m) in the Alps is the highest." },
  { id:"g83", category:"countries", topic:"country-facts", difficulty:1, question:"Which country has the most time zones?", choices:["Russia","United States","China","France"], correctIndex:3, explanation:"France has 12 time zones (including overseas territories like French Polynesia, Guadeloupe, etc.). Russia has 11 time zones across its mainland." },
  { id:"g84", category:"physical", topic:"rivers", difficulty:3, question:"Which river runs through the most capital cities?", choices:["Rhine","Danube","Nile","Mekong"], correctIndex:1, explanation:"The Danube flows through four capital cities: Vienna (Austria), Bratislava (Slovakia), Budapest (Hungary), and Belgrade (Serbia)." },
  { id:"g85", category:"countries", topic:"country-facts", difficulty:4, question:"What is the newest generally recognized country?", choices:["Kosovo","South Sudan","East Timor","Montenegro"], correctIndex:1, explanation:"South Sudan declared independence from Sudan on July 9, 2011, making it the newest widely recognized sovereign state." },
];

// ── Helpers ──

function pickQuestions(all: GeoQuestion[], cat: Category | null, topic: string | null, level: number, count: number, used: Set<string>): GeoQuestion[] {
  let pool = all.filter((q) => {
    if (cat && q.category !== cat) return false;
    if (topic && q.topic !== topic) return false;
    if (used.has(q.id)) return false;
    return true;
  });
  if (pool.length === 0) { used.clear(); pool = all.filter((q) => { if (cat && q.category !== cat) return false; if (topic && q.topic !== topic) return false; return true; }); }

  const targetDiff = Math.max(1, Math.min(5, Math.round(level / 8)));
  const weighted = pool.map((q) => { const d = Math.abs(q.difficulty - targetDiff); return { q, w: d === 0 ? 4 : d === 1 ? 2 : 1 }; });
  const total = weighted.reduce((s, x) => s + x.w, 0);
  const picked: GeoQuestion[] = [];
  for (let i = 0; i < count && weighted.length > 0; i++) {
    let r = Math.random() * total; let idx = 0;
    for (let j = 0; j < weighted.length; j++) { r -= weighted[j].w; if (r <= 0) { idx = j; break; } }
    picked.push(weighted.splice(idx, 1)[0].q);
  }
  picked.forEach((q) => used.add(q.id));
  return picked;
}

// ── Component ──

export function GeographyChallengeGame() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [category, setCategory] = useState<Category | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [mode, setMode] = useState<GameMode>("learn");
  const [questions, setQuestions] = useState<GeoQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showExp, setShowExp] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [adaptive, setAdaptive] = useState<AdaptiveState>(createAdaptiveState(5));
  const [timer, setTimer] = useState(90);
  const [wrongAs, setWrongAs] = useState<{ q: GeoQuestion; sel: number }[]>([]);
  const usedRef = useRef(new Set<string>());
  const startRef = useRef(Date.now());
  const qStart = useRef(Date.now());

  useEffect(() => {
    if (phase !== "playing" || mode !== "challenge") return;
    if (timer <= 0) { finish(); return; }
    const t = setTimeout(() => {
      setTimer((v) => {
        if (v <= 5 && v > 1) sfxTick();
        return v - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode, timer]);

  const start = useCallback((m: GameMode, c: Category | null, t: string | null) => {
    setMode(m); setCategory(c); setTopic(t); setScore(0); setStreak(0); setBestStreak(0);
    setCorrect(0); setWrong(0); setIdx(0); setSelected(null); setFeedback(null); setShowExp(false);
    setTimer(90); setWrongAs([]); setAdaptive(createAdaptiveState(5)); usedRef.current.clear();
    startRef.current = Date.now(); qStart.current = Date.now();
    const count = m === "challenge" ? 20 : 10;
    setQuestions(pickQuestions(QUESTIONS, c, t, 5, count, usedRef.current));
    setPhase("playing");
  }, []);

  const finish = useCallback(() => {
    const acc = correct + wrong > 0 ? correct / (correct + wrong) : 0;
    if (acc >= 1.0) sfxPerfect();
    const highKey = "geography_highScore";
    const prev = getLocalHighScore(highKey);
    if (score > prev) setLocalHighScore(highKey, score);
    trackGamePlayed("geography", score);
    const stats: GameStats = { gameId: "geography", score, accuracy: correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0, bestStreak, solved: correct };
    checkAchievements(stats, 0, {});
    setPhase("result");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, correct, wrong, bestStreak]);

  const answer = useCallback((ci: number) => {
    if (feedback !== null) return;
    const q = questions[idx]; if (!q) return;
    const ok = ci === q.correctIndex;
    setSelected(ci);
    const fast = (Date.now() - qStart.current) / 1000 < 5;
    if (ok) { sfxCorrect(); setScore((s) => s + Math.round((100 + (fast ? 50 : 0)) * (1 + streak * 0.1))); setStreak((s) => s + 1); setBestStreak((b) => Math.max(b, streak + 1)); setCorrect((c) => c + 1); setFeedback("correct"); if ((streak + 1) % 5 === 0 && streak > 0) sfxCombo(streak + 1); }
    else { if (streak > 0) sfxStreakLost(); sfxWrong(); setStreak(0); setWrong((w) => w + 1); setFeedback("wrong"); setWrongAs((p) => [...p, { q, sel: ci }]); }
    setAdaptive((p) => adaptiveUpdate(p, ok, fast)); setShowExp(true);
  }, [feedback, questions, idx, streak]);

  const next = useCallback(() => {
    const ni = idx + 1;
    if (ni >= questions.length) {
      if (mode === "challenge") { finish(); } else {
        const more = pickQuestions(QUESTIONS, category, topic, adaptive.level, 10, usedRef.current);
        if (more.length > 0) { setQuestions(more); setIdx(0); } else finish();
      }
    } else setIdx(ni);
    setSelected(null); setFeedback(null); setShowExp(false); qStart.current = Date.now();
  }, [idx, questions.length, mode, category, topic, adaptive.level, finish]);

  const curQ = questions[idx];
  const dl = getDifficultyLabel(adaptive.level);
  const catConf = category ? CATEGORIES.find((c) => c.id === category) : null;

  // ── Menu ──
  if (phase === "menu") {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-white/5"><div className="mx-auto max-w-4xl px-6 py-4 flex items-center gap-3">
          <Link href="/games" className="text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <Globe className="w-5 h-5 text-cyan-400" /><h1 className="text-xl font-bold">Geography Challenge</h1>
        </div></header>
        <div className="mx-auto max-w-4xl px-6 py-8">
          <p className="text-slate-400 mb-8 text-center">Explore the world! Choose a category to start learning geography.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => { setCategory(c.id); setPhase("topic-select"); }}
                className={`${c.bg} ${c.border} border rounded-2xl p-6 text-left hover:scale-[1.02] transition-all`}>
                <div className="text-lg font-bold mb-1" style={{ color: c.color }}>{c.label}</div>
                <div className="text-sm text-slate-400">{c.topics.length} topics &middot; {QUESTIONS.filter((q) => q.category === c.id).length} questions</div>
              </button>
            ))}
          </div>
          <button onClick={() => start("challenge", null, null)}
            className="mt-6 w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
            <Zap className="w-5 h-5" /> Mixed Geography Challenge
          </button>
        </div>
      </div>
    );
  }

  // ── Topic Select ──
  if (phase === "topic-select" && catConf) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-white/5"><div className="mx-auto max-w-4xl px-6 py-4 flex items-center gap-3">
          <button onClick={() => setPhase("menu")} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold" style={{ color: catConf.color }}>{catConf.label}</h1>
        </div></header>
        <div className="mx-auto max-w-4xl px-6 py-8 space-y-4">
          {catConf.topics.map((t) => {
            const cnt = QUESTIONS.filter((q) => q.category === category && q.topic === t.id).length;
            const intro = CATEGORY_INTROS[t.id] || "";
            return (
              <div key={t.id} className="bg-slate-900 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white">{t.label}</h3>
                  <span className="text-xs text-slate-500">{cnt} questions</span>
                </div>
                {intro && <p className="text-sm text-slate-400 mb-4 leading-relaxed">{intro}</p>}
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => start("learn", category, t.id)} className="px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-600/30 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Learn</button>
                  <button onClick={() => start("challenge", category, t.id)} className="px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-600/30 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Challenge</button>
                  <button onClick={() => start("practice", category, t.id)} className="px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 text-sm font-medium hover:bg-purple-600/30 flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Practice</button>
                </div>
              </div>
            );
          })}
          <button onClick={() => start("challenge", category, null)}
            className="w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: catConf.color + "22", borderColor: catConf.color + "44", color: catConf.color, borderWidth: 1 }}>
            <Zap className="w-5 h-5" /> Challenge All {catConf.label}
          </button>
        </div>
      </div>
    );
  }

  // ── Playing ──
  if (phase === "playing" && curQ) {
    const topicLabel = (() => { for (const c of CATEGORIES) for (const t of c.topics) if (t.id === curQ.topic) return t.label; return curQ.topic; })();
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-white/5"><div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-between">
          <button onClick={() => { if (mode !== "challenge" || confirm("Quit?")) finish(); }} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">{idx + 1}/{questions.length}</span>
            {mode === "challenge" && <span className="font-mono text-amber-400">{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}</span>}
            <span className="text-xs font-bold" style={{ color: dl.color }}>{dl.emoji} {dl.label}</span>
            <span className="text-xs text-white/60">Lvl {Math.round(adaptive.level)} &middot; {getGradeForLevel(adaptive.level).label}</span>
          </div>
          <div className="text-right"><span className="text-amber-400 font-bold">{score}</span>{streak > 1 && <span className="text-xs text-orange-400 ml-2">x{streak}</span>}</div>
        </div></header>
        <div className="mx-auto max-w-2xl px-6 py-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: (CATEGORIES.find((c) => c.id === curQ.category)?.color || "#666") + "22", color: CATEGORIES.find((c) => c.id === curQ.category)?.color }}>{CATEGORIES.find((c) => c.id === curQ.category)?.label}</span>
            <span className="text-xs text-slate-500">{topicLabel}</span>
          </div>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 mb-6"><p className="text-lg font-medium leading-relaxed">{curQ.question}</p></div>
          <div className="grid gap-3 sm:grid-cols-2 mb-6">
            {curQ.choices.map((ch, ci) => {
              let st = "bg-white/5 border-white/10 hover:bg-white/10 text-white";
              if (feedback !== null) {
                if (ci === curQ.correctIndex) st = "bg-emerald-600/20 border-emerald-500/50 text-emerald-300";
                else if (ci === selected && feedback === "wrong") st = "bg-red-600/20 border-red-500/50 text-red-300";
                else st = "bg-white/[0.03] border-white/5 text-slate-500";
              }
              return <button key={ci} onClick={() => answer(ci)} disabled={feedback !== null} className={`${st} border rounded-xl p-4 text-left transition-all font-medium disabled:cursor-default`}><span className="text-xs text-slate-500 mr-2">{String.fromCharCode(65 + ci)}.</span>{ch}</button>;
            })}
          </div>
          {showExp && (
            <div className={`rounded-2xl border p-5 mb-6 ${feedback === "correct" ? "bg-emerald-950/30 border-emerald-500/20" : "bg-red-950/30 border-red-500/20"}`}>
              <div className="flex items-center gap-2 mb-2">
                {feedback === "correct" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                <span className={`font-bold ${feedback === "correct" ? "text-emerald-400" : "text-red-400"}`}>{feedback === "correct" ? "Correct!" : "Not quite!"}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{curQ.explanation}</p>
              {curQ.funFact && feedback === "correct" && (
                <div className="mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" /><p className="text-sm text-amber-300">{curQ.funFact}</p>
                </div>
              )}
              <button onClick={next} className="mt-4 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors flex items-center justify-center gap-2">
                {idx + 1 >= questions.length && mode === "challenge" ? "See Results" : "Next Question"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Results ──
  if (phase === "result") {
    const acc = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{mode === "challenge" ? "Challenge Complete!" : "Session Complete!"}</h2>
          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-white/5 rounded-xl p-4"><div className="text-2xl font-bold text-amber-400">{score}</div><div className="text-xs text-slate-500">Score</div></div>
            <div className="bg-white/5 rounded-xl p-4"><div className="text-2xl font-bold text-emerald-400">{acc}%</div><div className="text-xs text-slate-500">Accuracy</div></div>
            <div className="bg-white/5 rounded-xl p-4"><div className="text-2xl font-bold text-blue-400">{correct}</div><div className="text-xs text-slate-500">Correct</div></div>
            <div className="bg-white/5 rounded-xl p-4"><div className="text-2xl font-bold text-purple-400">{bestStreak}</div><div className="text-xs text-slate-500">Best Streak</div></div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-6"><Star className="w-4 h-4" style={{ color: dl.color }} /><span className="text-sm" style={{ color: dl.color }}>Difficulty: {dl.emoji} {dl.label}</span><span className="text-xs text-white/60">Lvl {Math.round(adaptive.level)} &middot; {getGradeForLevel(adaptive.level).label}</span></div>
          {wrongAs.length > 0 && <button onClick={() => setPhase("review")} className="w-full mb-3 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">Review Wrong Answers ({wrongAs.length})</button>}
          <div className="flex gap-3">
            <button onClick={() => setPhase("menu")} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">Menu</button>
            <button onClick={() => start(mode, category, topic)} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors">Play Again</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Review ──
  if (phase === "review") {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-white/5"><div className="mx-auto max-w-4xl px-6 py-4 flex items-center gap-3">
          <button onClick={() => setPhase("result")} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold">Review Wrong Answers</h1>
        </div></header>
        <div className="mx-auto max-w-2xl px-6 py-6 space-y-4">
          {wrongAs.map(({ q, sel }, i) => (
            <div key={i} className="bg-slate-900 border border-red-500/20 rounded-2xl p-5">
              <p className="font-medium mb-3">{q.question}</p>
              <div className="flex flex-col gap-1.5 mb-3">
                <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400" /><span className="text-sm text-red-400">Your answer: {q.choices[sel]}</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-sm text-emerald-400">Correct: {q.choices[q.correctIndex]}</span></div>
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
