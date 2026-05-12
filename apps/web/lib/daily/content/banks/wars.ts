import type { WarQuestion } from "../../types";

const HELP = "/daily/lessons/history-wars";

interface War {
  key: string;
  name: string;
  startYear: number;
}

/** The 15 wars Adam will study this week. The keys are stable; rename freely. */
export const WARS: War[] = [
  { key: "americanRevolution", name: "American Revolutionary War", startYear: 1775 },
  { key: "warOf1812",          name: "War of 1812",                startYear: 1812 },
  { key: "mexicanAmerican",    name: "Mexican-American War",       startYear: 1846 },
  { key: "americanCivil",      name: "American Civil War",         startYear: 1861 },
  { key: "francoPrussian",     name: "Franco-Prussian War",        startYear: 1870 },
  { key: "spanishAmerican",    name: "Spanish-American War",       startYear: 1898 },
  { key: "russoJapanese",      name: "Russo-Japanese War",         startYear: 1904 },
  { key: "wwi",                name: "World War I",                startYear: 1914 },
  { key: "russianCivil",       name: "Russian Civil War",          startYear: 1917 },
  { key: "spanishCivil",       name: "Spanish Civil War",          startYear: 1936 },
  { key: "wwii",               name: "World War II",               startYear: 1939 },
  { key: "korean",             name: "Korean War",                 startYear: 1950 },
  { key: "vietnam",            name: "Vietnam War",                startYear: 1955 },
  { key: "gulf",               name: "Gulf War",                   startYear: 1990 },
  { key: "iraq",               name: "Iraq War",                   startYear: 2003 },
];

export function warByKey(key: string): War {
  const w = WARS.find((x) => x.key === key);
  if (!w) throw new Error(`warByKey: unknown key "${key}"`);
  return w;
}

export function warQ(id: string, key: string, tolerance = 1): WarQuestion {
  const w = warByKey(key);
  return {
    id,
    kind: "war",
    helpHref: HELP,
    name: w.name,
    answer: w.startYear,
    tolerance,
  };
}
