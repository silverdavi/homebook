#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-10-23",
  subject: "Day 36 — center and spread.",
  topic: "Mean, median, and range describe different parts of a data set.",
  material: "The Friday Day 36 data sheet",
});
