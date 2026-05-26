import type { PeaceQuestion } from "../../types";

const HELP = "/daily/lessons/peace-accords";

interface Peace {
  key: string;
  name: string;
  /** Year the accord/treaty was signed. */
  year: number;
  /** Optional short framing — used by the lesson, not the prompt. */
  blurb?: string;
}

/**
 * Twelve peace accords / treaties. The list is intentionally diverse
 * across centuries and outcomes — some held (Westphalia, Good Friday),
 * some failed catastrophically (Versailles → WWII; Oslo → ongoing
 * Israel-Palestine crisis; Abraham Accords sidelined Palestinians).
 * The brief frames *that* as the lesson: signing paper is not the
 * same as peace.
 */
export const PEACE: Peace[] = [
  {
    key: "westphalia",
    name: "Peace of Westphalia",
    year: 1648,
    blurb:
      "Ended the Thirty Years' War. The treaty that invented the modern sovereign state.",
  },
  {
    key: "parisAmerican",
    name: "Treaty of Paris (US Independence)",
    year: 1783,
    blurb: "Britain formally recognized the United States as independent.",
  },
  {
    key: "vienna",
    name: "Congress of Vienna",
    year: 1815,
    blurb:
      "Restored a balance of power in Europe after Napoleon. Held for almost a century.",
  },
  {
    key: "versailles",
    name: "Treaty of Versailles",
    year: 1919,
    blurb:
      "Ended WWI but punished Germany so harshly that historians point to it as a direct cause of WWII. The classic 'peace that started the next war.'",
  },
  {
    key: "unCharter",
    name: "UN Charter",
    year: 1945,
    blurb:
      "Founded the United Nations after WWII. Tried to make 'never again' a system, not just a slogan.",
  },
  {
    key: "geneva",
    name: "Geneva Conventions (modern)",
    year: 1949,
    blurb:
      "Four treaties setting the rules of humane conduct in war: prisoners, civilians, the wounded.",
  },
  {
    key: "campDavid",
    name: "Camp David Accords",
    year: 1978,
    blurb:
      "Framework that produced the Egypt-Israel peace treaty the following year. First Arab country to recognize Israel.",
  },
  {
    key: "israelEgypt",
    name: "Israel-Egypt Peace Treaty",
    year: 1979,
    blurb:
      "Egypt traded recognition of Israel for the return of the Sinai. Has held — coldly — ever since.",
  },
  {
    key: "osloI",
    name: "Oslo I Accord",
    year: 1993,
    blurb:
      "Israel and the PLO recognized each other. Was supposed to be the path to a Palestinian state. Instead the process stalled, settlements expanded, and the situation has deteriorated.",
  },
  {
    key: "dayton",
    name: "Dayton Accords",
    year: 1995,
    blurb:
      "Ended the Bosnian War. Created a strange power-sharing arrangement that's frozen the conflict more than it's resolved it.",
  },
  {
    key: "goodFriday",
    name: "Good Friday Agreement",
    year: 1998,
    blurb:
      "Ended most of 'The Troubles' in Northern Ireland. Brexit has put parts of it under strain, but the violence has largely held off.",
  },
  {
    key: "abraham",
    name: "Abraham Accords",
    year: 2020,
    blurb:
      "Normalization between Israel and UAE/Bahrain (later Morocco, Sudan). Notably skipped the Palestinian question — a deliberate sidelining many critics say has made a just peace harder, not easier.",
  },
];

export function peaceByKey(key: string): Peace {
  const p = PEACE.find((x) => x.key === key);
  if (!p) throw new Error(`peaceByKey: unknown key "${key}"`);
  return p;
}

export function peaceQ(id: string, key: string, tolerance = 2): PeaceQuestion {
  const p = peaceByKey(key);
  return {
    id,
    kind: "peace",
    helpHref: HELP,
    name: p.name,
    answer: p.year,
    tolerance,
  };
}
