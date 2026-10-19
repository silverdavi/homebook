import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { numericQ } from "./banks/numeric";
import { choiceQ } from "./banks/choice";

const DATE = "2026-10-22";
const HELP = `/daily/${DATE}`;

function integerQ(id: string, expression: string, answer: number): Question {
  return numericQ(id, `${expression} = ?`, answer, `${expression} = ${answer}.`, HELP);
}

function temperatureQ(id: string, start: number, change: number): Question {
  const answer = start + change;
  const direction = change >= 0 ? `rises ${change}` : `falls ${Math.abs(change)}`;
  return numericQ(
    id,
    `The temperature starts at ${start}°F and ${direction} degrees. What is the new temperature?`,
    answer,
    `${start} ${change >= 0 ? "+" : "−"} ${Math.abs(change)} = ${answer}°F.`,
    HELP,
    { unit: "°F" },
  );
}

const versionA: Question[] = [
  integerQ("a-i1", "−3 + 8", 5),
  integerQ("a-i2", "5 − 12", -7),
  integerQ("a-i3", "−6 + 2", -4),
  integerQ("a-i4", "−4 − 7", -11),
  integerQ("a-i5", "9 + (−13)", -4),
  integerQ("a-i6", "−10 + 17", 7),
  integerQ("a-i7", "2 − 9", -7),
  integerQ("a-i8", "−12 + 5", -7),
  integerQ("a-i9", "−8 − 6", -14),
  temperatureQ("a-t1", -4, 9),
  temperatureQ("a-t2", 5, -7),
  temperatureQ("a-t3", -8, 3),
  choiceQ("a-g1", "geography", "Which colors form Ukraine's flag?", ["Blue over yellow", "Red circle on white", "Green and gold", "Black and orange"], 0, "Ukraine's flag is blue over yellow, often associated with sky and wheat fields.", HELP),
  choiceQ("a-g2", "geography", "Which description matches the Palestinian flag?", ["Black, white, and green stripes with a red triangle", "Blue cross on white", "Red maple leaf", "Yellow stars on blue"], 0, "The Palestinian flag has black, white, and green horizontal stripes with a red triangle at the hoist.", HELP),
  choiceQ("a-h1", "history", "Which forces have changed borders over time?", ["Empire, colonization, war, and negotiation", "Only weather", "Only elections", "Borders never change"], 0, "Borders are historical political arrangements, often shaped by unequal power.", HELP),
  choiceQ("a-h2", "history", "Why is migration part of history?", ["People move for family, work, safety, climate, and many other reasons", "Nobody moved before airplanes", "Only governments migrate", "Migration has one cause"], 0, "Human movement has always shaped languages, economies, families, and political communities.", HELP),
  choiceQ("a-k1", "generalKnowledge", "A refugee is a person who has done what?", ["Crossed a border after being forced to flee persecution, war, or violence", "Taken any vacation", "Changed schools", "Bought a passport"], 0, "Refugees cross borders because serious danger forces them from home.", HELP),
  choiceQ("a-k2", "generalKnowledge", "What does an asylum seeker request?", ["Legal protection in another country", "A weather forecast", "A new flag design", "A trade discount"], 0, "An asylum seeker asks a country to recognize a need for protection.", HELP),
];

const versionB: Question[] = [
  integerQ("b-i1", "−5 + 12", 7),
  integerQ("b-i2", "4 − 11", -7),
  integerQ("b-i3", "−7 + 3", -4),
  integerQ("b-i4", "−2 − 9", -11),
  integerQ("b-i5", "8 + (−14)", -6),
  integerQ("b-i6", "−11 + 19", 8),
  integerQ("b-i7", "3 − 10", -7),
  integerQ("b-i8", "−13 + 6", -7),
  integerQ("b-i9", "−9 − 5", -14),
  temperatureQ("b-t1", -6, 10),
  temperatureQ("b-t2", 7, -9),
  temperatureQ("b-t3", -9, 4),
  choiceQ("b-g1", "geography", "Which symbol is centered on Israel's flag?", ["A Star of David", "A maple leaf", "A red sun", "A crescent moon"], 0, "Israel's blue-and-white flag centers a Star of David.", HELP),
  choiceQ("b-g2", "geography", "Which feature appears on South Africa's flag?", ["A sideways green Y", "One red circle", "One blue star", "A black maple leaf"], 0, "South Africa's multicolor flag has a distinctive sideways green Y.", HELP),
  choiceQ("b-h1", "history", "Which statement about borders is accurate?", ["They may divide communities that existed before the border", "They are always mountains", "They never move", "They contain only one culture"], 0, "Colonial and other political borders have often cut across older communities and movement routes.", HELP),
  choiceQ("b-h2", "history", "Why should migration history include migrants' own accounts?", ["They describe lived experience that official records may omit", "Governments never keep records", "Only migrants know geography", "Personal accounts replace all evidence"], 0, "History is stronger when official sources are read alongside the experiences of affected people.", HELP),
  choiceQ("b-k1", "generalKnowledge", "What is a nation?", ["A community connected by identity, culture, language, or history", "Any line on a weather map", "Only a government building", "A unit of temperature"], 0, "A nation is a human community; it may or may not have a state of its own.", HELP),
  choiceQ("b-k2", "generalKnowledge", "What is a state in political geography?", ["A territory with a government and political authority", "A biome", "A language family only", "A type of flag"], 0, "A state is a political organization governing a territory and population.", HELP),
];

export const day20261022: Day = {
  date: DATE,
  title: "Day 35 — Left and right of zero",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: ["Integers", "Flags and borders", "Migration"],
  versionA,
  versionB,
};
