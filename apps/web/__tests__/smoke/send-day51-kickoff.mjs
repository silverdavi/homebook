#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-11-20",
  subject: "Day 51 — negative numbers. Friday: school ends 12:30.",
  topic: "Multiplying and dividing negatives: same signs give +, different signs give −.",
  material: "The Friday Day 51 negatives sheet and Friday World sheet, from the printer",
  note: "The World block is about children's rights: today is World Children's Day. If you finish early, the blue “Finished before 12:30?” box at the end of the schedule has optional extras.",
  reminder: "distance = speed × time; cover the one you want in the triangle (Day 47).",
  endRule:
    "School ends at 12:30. Then the day is over. Have a good weekend.",
});
