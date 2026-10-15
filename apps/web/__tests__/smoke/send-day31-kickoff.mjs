#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-10-16",
  subject: "Day 31 — percent means out of 100.",
  topic: "Use 50%, 25%, 10%, and 5% to calculate discounts and tips.",
  material: "The Friday Day 31 percentages sheet",
});
