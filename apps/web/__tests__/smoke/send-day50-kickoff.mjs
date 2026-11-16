#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-11-19",
  subject: "Day 50 — circles and π. School ends 12:30 today.",
  topic: "Circles: around is π × diameter, inside is π × radius × radius. Use π ≈ 3.14.",
  material: "The Thursday Day 50 circle sheet and Thursday World sheet, from the printer",
  note: "The World block is about Lincoln's Gettysburg Address, given 163 years ago today. If you finish early, the blue “Finished before 12:30?” box at the end of the schedule has optional extras.",
  reminder: "brackets first, then × and ÷, then + and − (Day 46).",
  endRule:
    "School ends at 12:30. From 12:30 to 1:30 it's TV only: no phone and no computer. Phone and computer at 1:30.",
});
