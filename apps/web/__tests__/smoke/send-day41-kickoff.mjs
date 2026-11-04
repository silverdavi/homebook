#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-11-04",
  subject: "Day 41 — ratios. School ends 12:30 today.",
  topic: "Ratios and unit rates: comparing two amounts, and finding the cost of one.",
  material: "The Wednesday Day 41 ratios sheet and Wednesday World sheet",
  note: "The World block is about yesterday's election: how votes are counted, and how people won the right to vote. If you finish early, the blue “Finished before 12:30?” box at the end of the schedule has optional extras.",
  endRule:
    "New end time: school ends at 12:30. From 12:30 to 1:30 it's TV only: no phone and no computer. Phone and computer at 1:30. Same tomorrow.",
});
