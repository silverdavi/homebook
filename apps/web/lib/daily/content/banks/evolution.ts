import type { EvolutionQuestion } from "../../types";

const HELP = "/daily/lessons/evolution-timeline";

interface Event {
  key: string;
  event: string;
  /** Approximate millions of years ago. */
  mya: number;
}

export const EVOLUTION: Event[] = [
  { key: "bigBang",      event: "Big Bang",                     mya: 13800 },
  { key: "earthForms",   event: "Earth forms",                  mya: 4540  },
  { key: "firstLife",    event: "First life (single cells)",    mya: 3700  },
  { key: "cambrian",     event: "Cambrian explosion",           mya: 540   },
  { key: "firstFish",    event: "First fish",                   mya: 520   },
  { key: "firstPlants",  event: "First land plants",            mya: 470   },
  { key: "firstDinos",   event: "First dinosaurs",              mya: 230   },
  { key: "firstMammals", event: "First mammals",                mya: 210   },
  { key: "ktExtinction", event: "KT extinction (asteroid)",     mya: 66    },
  { key: "firstHominids",event: "First hominids",               mya: 7     },
  { key: "homoSapiens",  event: "Homo sapiens",                 mya: 0.3   },
];

export function evoByKey(key: string): Event {
  const e = EVOLUTION.find((x) => x.key === key);
  if (!e) throw new Error(`evoByKey: unknown key "${key}"`);
  return e;
}

/**
 * Evolution question. Tolerance is ±10% of the canonical mya, with a
 * minimum of 1 mya so very-recent events (e.g. Homo sapiens, 0.3 mya)
 * stay forgiving.
 */
export function evolutionQ(id: string, key: string): EvolutionQuestion {
  const e = evoByKey(key);
  const tol = Math.max(e.mya * 0.10, 1);
  return {
    id,
    kind: "evolution",
    helpHref: HELP,
    event: e.event,
    answerMya: e.mya,
    tolerance: tol,
  };
}
