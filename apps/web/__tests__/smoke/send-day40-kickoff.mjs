#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-11-02",
  subject: "Day 40 — coordinates.",
  topic: "Two numbers find any point: across first, then up or down.",
  material: "The Monday Day 40 coordinates sheet and Monday World sheet",
  note: "Start with the “Find any point” animation at the top of the page. The World block uses the same idea on the globe: latitude, longitude, and time zones. If you finish early, the blue “Finished before 1:00?” box at the end of the schedule has optional extras. School ends at 1:00, after the exam.",
});
