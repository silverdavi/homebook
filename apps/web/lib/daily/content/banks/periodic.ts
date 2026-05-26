import type { PeriodicQuestion } from "../../types";

const HELP = "/daily/lessons/periodic-table-rows-1-3";

interface ElementRow {
  symbol: string;
  name: string;
  protons: number;
  neutrons: number;
  electrons: number;
  /**
   * Valence electrons: electrons in the outermost shell. Drives
   * bonding behavior. Group 1 = 1, group 2 = 2, … group 17 = 7,
   * group 18 (noble gases) = 8 (He is the historical exception:
   * full K shell, only 2 electrons total — we encode 2 here).
   */
  valence: number;
}

/**
 * Rows 1-3 of the periodic table. Neutron count is for the most common
 * naturally occurring isotope. Electrons assumes a neutral atom (= P).
 */
export const ELEMENTS: Record<string, ElementRow> = {
  H:  { symbol: "H",  name: "Hydrogen",   protons: 1,  neutrons: 0,  electrons: 1,  valence: 1 },
  He: { symbol: "He", name: "Helium",     protons: 2,  neutrons: 2,  electrons: 2,  valence: 2 },
  Li: { symbol: "Li", name: "Lithium",    protons: 3,  neutrons: 4,  electrons: 3,  valence: 1 },
  Be: { symbol: "Be", name: "Beryllium",  protons: 4,  neutrons: 5,  electrons: 4,  valence: 2 },
  B:  { symbol: "B",  name: "Boron",      protons: 5,  neutrons: 6,  electrons: 5,  valence: 3 },
  C:  { symbol: "C",  name: "Carbon",     protons: 6,  neutrons: 6,  electrons: 6,  valence: 4 },
  N:  { symbol: "N",  name: "Nitrogen",   protons: 7,  neutrons: 7,  electrons: 7,  valence: 5 },
  O:  { symbol: "O",  name: "Oxygen",     protons: 8,  neutrons: 8,  electrons: 8,  valence: 6 },
  F:  { symbol: "F",  name: "Fluorine",   protons: 9,  neutrons: 10, electrons: 9,  valence: 7 },
  Ne: { symbol: "Ne", name: "Neon",       protons: 10, neutrons: 10, electrons: 10, valence: 8 },
  Na: { symbol: "Na", name: "Sodium",     protons: 11, neutrons: 12, electrons: 11, valence: 1 },
  Mg: { symbol: "Mg", name: "Magnesium",  protons: 12, neutrons: 12, electrons: 12, valence: 2 },
  Al: { symbol: "Al", name: "Aluminum",   protons: 13, neutrons: 14, electrons: 13, valence: 3 },
  Si: { symbol: "Si", name: "Silicon",    protons: 14, neutrons: 14, electrons: 14, valence: 4 },
  P:  { symbol: "P",  name: "Phosphorus", protons: 15, neutrons: 16, electrons: 15, valence: 5 },
  S:  { symbol: "S",  name: "Sulfur",     protons: 16, neutrons: 16, electrons: 16, valence: 6 },
  Cl: { symbol: "Cl", name: "Chlorine",   protons: 17, neutrons: 18, electrons: 17, valence: 7 },
  Ar: { symbol: "Ar", name: "Argon",      protons: 18, neutrons: 22, electrons: 18, valence: 8 },
};

export const ROW_1 = ["H", "He"] as const;
export const ROW_2 = ["Li", "Be", "B", "C", "N", "O", "F", "Ne"] as const;
export const ROW_3 = ["Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar"] as const;

export function periodicQ(
  id: string,
  symbol: string,
  ask: "P" | "N" | "e" | "v",
): PeriodicQuestion {
  const row = ELEMENTS[symbol];
  if (!row) throw new Error(`periodicQ: unknown symbol "${symbol}"`);
  const answer =
    ask === "P"
      ? row.protons
      : ask === "N"
        ? row.neutrons
        : ask === "e"
          ? row.electrons
          : row.valence;
  // Valence lessons get their own help page so they don't get drowned
  // out by the rows-1-3 P/N/e cheat sheet.
  const helpHref = ask === "v" ? "/daily/lessons/valence" : HELP;
  return {
    id,
    kind: "periodic",
    helpHref,
    symbol: row.symbol,
    elementName: row.name,
    ask,
    answer,
  };
}
