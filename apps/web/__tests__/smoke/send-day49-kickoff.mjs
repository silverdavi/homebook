#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-11-18",
  subject: "Day 49 — area of triangles. School ends 12:30 today.",
  topic: "Area of a triangle: base × height ÷ 2. A triangle is half a rectangle.",
  material: "The Wednesday Day 49 triangle sheet and Wednesday World sheet, from the printer",
  note: "The World block is about apartheid in South Africa and Nelson Mandela. If you finish early, the blue “Finished before 12:30?” box at the end of the schedule has optional extras.",
  reminder: "area is in square units (cm²), volume in cubic units (cm³) (Days 34 and 44).",
  endRule:
    "School ends at 12:30. From 12:30 to 1:30 it's TV only: no phone and no computer. Phone and computer at 1:30.",
});
