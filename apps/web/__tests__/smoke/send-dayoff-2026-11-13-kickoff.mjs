#!/usr/bin/env node
import { runNote } from "./kickoff-helper.mjs";

// Day off. The morning job finds this file by the date below.
await runNote({
  date: "2026-11-13",
  subject: "Day off today. Three jobs.",
  paragraphs: [
    "No school today: no exam, no sheets, no website.",
    "<strong>Three jobs today:</strong><br>1. Clean up a bit: your room and your desk.<br>2. Help Mom make food.<br>3. Finish reading the Asimov story.",
    "School is back on Monday with Day 47 (speed, distance, and time). Enjoy the long weekend.",
  ],
});
