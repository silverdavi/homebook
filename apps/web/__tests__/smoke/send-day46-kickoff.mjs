#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-11-11",
  subject: "Day 46 — order of operations. School ends 12:30 today.",
  topic: "Order of operations: brackets, then × and ÷, then + and −.",
  material: "The Wednesday Day 46 order-of-operations sheet and Wednesday World sheet",
  note: "Today is Veterans Day, so the World block is about World War I and why it ended on November 11. If you finish early, the blue “Finished before 12:30?” box at the end of the schedule has optional extras.",
  endRule:
    "School ends at 12:30. From 12:30 to 1:30 it's TV only: no phone and no computer. Phone and computer at 1:30.",
});
