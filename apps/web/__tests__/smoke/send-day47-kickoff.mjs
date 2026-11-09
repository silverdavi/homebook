#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-11-12",
  subject: "Day 47 — speed. School ends 12:30 today.",
  topic: "Speed, distance, and time: one triangle, three rules.",
  material: "The Thursday Day 47 speed sheet and Thursday World sheet",
  note: "The World block is about refugees: who they are, why they flee, and where they go. If you finish early, the blue “Finished before 12:30?” box at the end of the schedule has optional extras.",
  endRule:
    "School ends at 12:30. From 12:30 to 1:30 it's TV only: no phone and no computer. Phone and computer at 1:30.",
});
