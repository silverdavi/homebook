#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-11-10",
  subject: "Day 45 — equations. School ends 12:30 today.",
  topic: "One-step equations: undo what was done to x.",
  material: "The Tuesday Day 45 equations sheet and Tuesday World sheet",
  note: "The World block is about fair wages: the minimum wage, unions, and who sews our clothes. If you finish early, the blue “Finished before 12:30?” box at the end of the schedule has optional extras.",
  endRule:
    "School ends at 12:30. From 12:30 to 1:30 it's TV only: no phone and no computer. Phone and computer at 1:30.",
});
