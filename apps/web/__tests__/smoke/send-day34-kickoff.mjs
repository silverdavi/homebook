#!/usr/bin/env node
import { runKickoff } from "./kickoff-helper.mjs";

await runKickoff({
  date: "2026-10-21",
  subject: "Day 34 — density packs matter.",
  topic: "Use mass and volume to calculate how tightly matter is packed.",
  material: "The Wednesday Day 34 density sheet",
});
