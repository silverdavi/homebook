#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-11-05",
  subject: "Day 42 — percent change. School ends 12:30 today.",
  topic: "Percent increase and decrease: find the change, then add it or take it away.",
  material: "The Thursday Day 42 percent-change sheet and Thursday World sheet",
  note: "The World block is about climate change: who caused it, who gets hurt, and what works. If you finish early, the blue “Finished before 12:30?” box at the end of the schedule has optional extras.",
  endRule:
    "School ends at 12:30. From 12:30 to 1:30 it's TV only: no phone and no computer. Phone and computer at 1:30.",
});
