import "server-only";
import type { Day, Question } from "../types";
import { loadMarkdown } from "./loader";
import { applyOrder, choiceQ } from "./banks/choice";
import { boxQ, missingQ } from "./day-2026-11-09";
import { equationQ } from "./day-2026-11-10";
import { bracketsQ, mixedQ, plainQ } from "./day-2026-11-12";
import { distanceQ, speedQ, timeQ } from "./day-2026-11-13";
import generated from "./generated/2026-11-16.json";

const DATE = "2026-11-16";
const HELP = `/daily/${DATE}`;

type Form = "add" | "sub" | "mul" | "div";
type Set = (typeof generated)["a"];

function numeric(v: Set, p: "a" | "b"): Question[] {
  const [plain] = v.plain;
  const [brackets] = v.brackets;
  const [mixed] = v.mixed;
  return [
    ...v.box.map(([l, w, h], i) => boxQ(`${p}-v${i + 1}`, l, w, h)),
    ...v.missing.map(([vol, l, w], i) => missingQ(`${p}-m${i + 1}`, vol, l, w)),
    ...[...v.addsub, ...v.muldiv].map(([f, a, b], i) =>
      equationQ(`${p}-x${i + 1}`, f as Form, Number(a), Number(b)),
    ),
    plainQ(`${p}-o1`, plain[0], plain[1], plain[2]),
    bracketsQ(`${p}-o2`, brackets[0], brackets[1], brackets[2]),
    mixedQ(`${p}-o3`, mixed[0], mixed[1], mixed[2], mixed[3]),
    ...v.distance.map(([s, t]) => distanceQ(`${p}-d1`, s, t)),
    ...v.speed.map(([d, t]) => speedQ(`${p}-s1`, d, t)),
    ...v.time.map(([d, s]) => timeQ(`${p}-t1`, d, s)),
  ];
}

const versionA: Question[] = [
  ...numeric(generated.a, "a"),
  choiceQ(
    "a-g1",
    "geography",
    "Which city was split by a wall from 1961 to 1989?",
    ["Berlin", "Paris", "Rome", "Madrid"],
    0,
    "East Germany built it to stop its own people from leaving.",
    HELP,
  ),
  choiceQ(
    "a-g2",
    "geography",
    "Where do most of the world's refugees live?",
    [
      "In poorer countries next door to the one they fled",
      "In the richest countries of Europe and North America",
      "In camps set up on islands far out in the ocean",
      "In big cities on the other side of the world",
    ],
    0,
    "About 70% stay in neighboring countries.",
    HELP,
  ),
  choiceQ(
    "a-h1",
    "history",
    "What happened at 11 a.m. on November 11, 1918?",
    [
      "World War I fighting stopped",
      "The Berlin Wall went up",
      "World War II began in Europe",
      "The League of Nations closed",
    ],
    0,
    "That's why Veterans Day is November 11.",
    HELP,
  ),
  choiceQ(
    "a-h2",
    "history",
    "What did fast-food workers start in New York in 2012?",
    [
      "The Fight for $15, for higher pay and a union",
      "A plan to close every restaurant on Sundays",
      "A contest to invent the cheapest new burger",
      "A law that let teenagers work longer hours",
    ],
    0,
    "Many states and cities have since raised wages to $15 or more.",
    HELP,
  ),
  choiceQ(
    "a-k1",
    "generalKnowledge",
    "What is a labor union?",
    [
      "Workers who join together to bargain with their employer",
      "A company that owns many shops in different cities",
      "A government office that collects workers' taxes",
      "A bank that lends money to workers who need it",
    ],
    0,
    "Together, workers can win more than one person alone.",
    HELP,
  ),
  choiceQ(
    "a-k2",
    "generalKnowledge",
    "What was the Cold War?",
    [
      "A US–Soviet rivalry with no direct war between them",
      "A war fought only near the North and South Poles",
      "A winter battle in World War I in the Alps",
      "A war between Canada and Russia over ice",
    ],
    0,
    "About 1947 to 1991: arms race, space race, and wars fought by other countries.",
    HELP,
  ),
];

const versionB: Question[] = [
  ...numeric(generated.b, "b"),
  choiceQ(
    "b-g1",
    "geography",
    "World War I began after a shooting in which city?",
    ["Sarajevo", "Berlin", "Leipzig", "Dhaka"],
    0,
    "Archduke Franz Ferdinand was shot there in June 1914.",
    HELP,
  ),
  choiceQ(
    "b-g2",
    "geography",
    "The Rana Plaza garment factory collapsed in 2013 in…",
    ["Bangladesh", "Germany", "Turkey", "Ukraine"],
    0,
    "1,134 workers died, which led to the Bangladesh Accord on factory safety.",
    HELP,
  ),
  choiceQ(
    "b-h1",
    "history",
    "What brought the Berlin Wall down in 1989?",
    [
      "Peaceful protests, and a border opened by mistake",
      "An army that drove its tanks through in the night",
      "An earthquake that knocked down the whole wall",
      "A vote of the United Nations to tear it down",
    ],
    0,
    "Ordinary people, protesting together, did what armies couldn't.",
    HELP,
  ),
  choiceQ(
    "b-h2",
    "history",
    "The 1951 Refugee Convention promised…",
    [
      "Not to send refugees back to danger",
      "To give every refugee a free house",
      "To close all borders to new arrivals",
      "To let refugees vote in every country",
    ],
    0,
    "It was written after World War II left millions without a safe home.",
    HELP,
  ),
  choiceQ(
    "b-k1",
    "generalKnowledge",
    "What is the US federal minimum wage per hour?",
    ["$7.25", "$15.00", "$2.50", "$20.00"],
    0,
    "Unchanged since 2009.",
    HELP,
  ),
  choiceQ(
    "b-k2",
    "generalKnowledge",
    "Who is honored on Veterans Day?",
    [
      "Everyone who has served in the military",
      "Only soldiers who died in World War I",
      "Only generals and admirals",
      "Only presidents of the US",
    ],
    0,
    "Memorial Day, in May, honors those who died.",
    HELP,
  ),
];

export const day20261116: Day = {
  date: DATE,
  title: "Day 48 — Review: the whole week",
  brief: loadMarkdown(`day-${DATE}.md`),
  topics: [
    "Volume",
    "Equations",
    "Order of operations",
    "Speed",
    "World review",
  ],
  versionA: applyOrder(versionA, generated.order),
  versionB: applyOrder(versionB, generated.order),
};
