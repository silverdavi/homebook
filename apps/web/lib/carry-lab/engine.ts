/**
 * Backward-compatible facade. The original single-operation engine has
 * been split into per-operation modules under `./operations/` plus a
 * `registry.ts`. Anything that used to import from `engine` continues to
 * work — but new code should prefer the typed registry.
 */

export * from "./shared";
export * from "./types";
export {
  buildTableau,
  carryForAddAtCol,
  carryForPartialAtCol,
  firstEditableId,
  genProblem,
  LEVELS,
  naturalOrderIds,
} from "./operations/multiply";
