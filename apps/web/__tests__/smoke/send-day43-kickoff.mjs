#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-11-06",
  subject: "Day 43 — probability. School ends 12:30 today.",
  topic: "Probability: how likely something is, and how many times to expect it.",
  material: "The Friday Day 43 probability sheet, Friday World sheet, and a coin",
  note: "The World block is about Native nations today, for Native American Heritage Month. If you finish early, the blue “Finished before 12:30?” box at the end of the schedule has optional extras.",
  endRule: "School ends at 12:30, and then the day is over. Have a good weekend.",
});
