#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-11-13",
  subject: "Day 47 — speed. School ends 12:30 today.",
  topic: "Speed, distance, and time: one triangle, three rules.",
  material: "The Friday Day 47 speed sheet and Friday World sheet, from the printer",
  note: "The World block is about refugees: who they are, why they flee, and where they go. If you finish early, the blue “Finished before 12:30?” box at the end of the schedule has optional extras.",
  endRule:
    "School ends at 12:30, and then the day is over. Have a good weekend.",
});
