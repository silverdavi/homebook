#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-11-09",
  subject: "Day 44 — volume. School ends 12:30 today.",
  topic: "Volume: how much space is inside a box. Length × width × height.",
  material: "The Monday Day 44 volume sheet, Monday World sheet, and a ruler",
  note: "Sorry this is late. Start now and follow the schedule on the page; if you're behind, skip the “Finished before 12:30?” box. The World block is about the Berlin Wall, which fell 37 years ago today.",
  endRule:
    "School ends at 12:30. From 12:30 to 1:30 it's TV only: no phone and no computer. Phone and computer at 1:30.",
});
