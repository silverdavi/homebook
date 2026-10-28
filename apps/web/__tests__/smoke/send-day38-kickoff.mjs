#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-10-29",
  subject: "Day 38 — map scale.",
  topic:
    "A map shrinks the world by one number. Today uses Monday's units rule to go from map to real and back.",
  material:
    "The Thursday Day 38 map-scale sheet, Thursday World sheet, and ruler",
  note: "You were right about the patterns: the numbers and the answer order were picked by AI, which isn't really random — it likes 7 and it rotated A, B, C, D. Thanks for catching it. From today, a Python program with a real random number generator picks every number and shuffles every answer order, on the exam and the sheet. Start with the “Map scale” animation at the top of the page. The World block shows why Greenland looks as big as Africa on many maps, when Africa is 14 times larger. If you finish early, the blue “Finished before 1:00?” box at the end of the schedule has optional extras. School ends at 1:00, after the exam.",
});
