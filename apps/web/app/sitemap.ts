import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://teacher.ninja";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/generate`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/games`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/games/progress`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
  ];

  const games = [
    "letter-rain", "word-builder",
    "math-blitz", "fraction-fighter", "times-table", "fraction-lab", "decimal-dash", "graph-plotter",
    "element-match", "equation-balancer", "genetics-lab", "unit-converter",
    "timeline-dash",
    "maze-runner", "trace-learn", "color-lab", "connect-dots", "scratch-reveal",
    "sudoku", "crossword", "word-search", "trivia-quiz", "nonogram", "number-puzzle",
    "daily-challenge",
  ];

  const gamePages: MetadataRoute.Sitemap = games.map((g) => ({
    url: `${base}/games/${g}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...gamePages];
}
