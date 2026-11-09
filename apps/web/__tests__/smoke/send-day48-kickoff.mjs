#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-11-13",
  subject: "Day 48 — review. School ends 12:30 today.",
  topic: "Review day: one lap through the whole week. Nothing new.",
  material: "The Friday Day 48 review sheet and Friday World review sheet",
  note: "The World block reviews the whole week. If you finish early, the blue “Finished before 12:30?” box at the end of the schedule has optional extras.",
  endRule:
    "School ends at 12:30, and then the day is over. Have a good weekend.",
});
