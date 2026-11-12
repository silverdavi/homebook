#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-11-16",
  subject: "Day 48 — review. School ends 12:30 today.",
  topic: "Review day: one lap through the whole week. Nothing new.",
  material: "The Monday Day 48 review sheet and Monday World review sheet, from the printer",
  note: "Review day: one lap through last week, nothing new. The World block reviews last week too. If you finish early, the blue “Finished before 12:30?” box at the end of the schedule has optional extras.",
  endRule:
    "School ends at 12:30. From 12:30 to 1:30 it's TV only: no phone and no computer. Phone and computer at 1:30.",
});
