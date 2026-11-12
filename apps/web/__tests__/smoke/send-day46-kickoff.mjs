#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-11-12",
  subject: "Day 46 — order of operations. Use the PRINTED SHEETS in the printer.",
  topic: "Order of operations: brackets, then × and ÷, then + and −.",
  material: "Yesterday's PRINTED SHEETS are in the printer: take them out now. The Day 46 order-of-operations sheet, the World War I sheet (it says Wednesday), and the paintings extra",
  note: "Yesterday was Veterans Day and a day off, so today is Day 46. The World block is about World War I and why it ended on November 11. Do the PRINTED SHEETS from the printer: they are today's sheets. If you finish early, the blue “Finished before 12:30?” box at the end of the schedule has optional extras.",
  endRule:
    "School ends at 12:30. From 12:30 to 1:30 it's TV only: no phone and no computer. Phone and computer at 1:30.",
});
