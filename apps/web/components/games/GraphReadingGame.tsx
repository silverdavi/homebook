"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, BarChart3 } from "lucide-react";
import Link from "next/link";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import type { NewAchievement } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxCombo, sfxLevelUp, sfxGameOver, sfxAchievement, sfxCountdown, sfxCountdownGo, sfxStreakLost, sfxPerfect } from "@/lib/games/audio";
import { createAdaptiveState, adaptiveUpdate, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import { getGradeForLevel } from "@/lib/games/learning-guide";

/* ━━━ Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

type GamePhase = "menu" | "countdown" | "playing" | "feedback" | "complete";
type GraphType = "line" | "bar" | "scatter" | "multi-line" | "curve";

interface DataSeries {
  label: string;
  color: string;
  points: { x: number; y: number }[];
}

interface GraphDef {
  id: string;
  title: string;
  xLabel: string;
  yLabel: string;
  xValues?: string[];          // categorical x labels (for bar charts)
  type: GraphType;
  series: DataSeries[];
  difficulty: number;          // 1-8
  questions: QuestionDef[];
}

interface QuestionDef {
  question: string;
  choices: string[];
  answer: number;             // index into choices
  explanation: string;
  skill: string;              // e.g., "axis-reading", "trend", "shape-recognition"
}

/* ━━━ Graph + Question Database ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const GRAPHS: GraphDef[] = [
  // ── Difficulty 1: Basic axis reading (Grade 1-2) ──
  {
    id: "fruit-bar", title: "Favorite Fruits in Our Class", xLabel: "Fruit", yLabel: "Number of Students",
    xValues: ["Apple", "Banana", "Orange", "Grape", "Mango"],
    type: "bar",
    series: [{ label: "Students", color: "#f59e0b", points: [{ x: 0, y: 8 }, { x: 1, y: 5 }, { x: 2, y: 6 }, { x: 3, y: 3 }, { x: 4, y: 4 }] }],
    difficulty: 1,
    questions: [
      { question: "What does the Y-axis (up-and-down) show?", choices: ["Types of fruit", "Number of students", "Prices", "Colors"], answer: 1, explanation: "The Y-axis label says 'Number of Students' — that tells us what the height of each bar means.", skill: "axis-reading" },
      { question: "Which fruit is the most popular?", choices: ["Banana", "Orange", "Apple", "Mango"], answer: 2, explanation: "Apple has the tallest bar at 8 students. Look for the tallest bar to find the most popular.", skill: "value-reading" },
      { question: "How many students chose Banana?", choices: ["3", "5", "6", "8"], answer: 1, explanation: "The Banana bar reaches up to 5 on the Y-axis.", skill: "value-reading" },
    ],
  },
  {
    id: "pet-bar", title: "Pets Owned by Students", xLabel: "Pet", yLabel: "Count",
    xValues: ["Dog", "Cat", "Fish", "Bird", "Hamster"],
    type: "bar",
    series: [{ label: "Count", color: "#3b82f6", points: [{ x: 0, y: 10 }, { x: 1, y: 7 }, { x: 2, y: 4 }, { x: 3, y: 2 }, { x: 4, y: 3 }] }],
    difficulty: 1,
    questions: [
      { question: "What does the X-axis (left-to-right) show?", choices: ["Numbers", "Types of pets", "Names of students", "School subjects"], answer: 1, explanation: "The X-axis shows categories — in this case, different types of pets.", skill: "axis-reading" },
      { question: "Which pet is least common?", choices: ["Cat", "Hamster", "Bird", "Fish"], answer: 2, explanation: "Bird has the shortest bar (2). The shortest bar shows the least common item.", skill: "value-reading" },
    ],
  },

  // ── Difficulty 2: Labels and legends (Grade 3) ──
  {
    id: "temp-week", title: "Temperature This Week", xLabel: "Day", yLabel: "Temperature (°F)",
    xValues: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    type: "line",
    series: [{ label: "Temperature", color: "#ef4444", points: [{ x: 0, y: 62 }, { x: 1, y: 65 }, { x: 2, y: 70 }, { x: 3, y: 68 }, { x: 4, y: 72 }, { x: 5, y: 75 }, { x: 6, y: 71 }] }],
    difficulty: 2,
    questions: [
      { question: "What is the title of this graph?", choices: ["Weekly Weather", "Temperature This Week", "Days of the Week", "Hot and Cold"], answer: 1, explanation: "Always read the title first — it tells you what the graph is about.", skill: "title-reading" },
      { question: "What was the temperature on Wednesday?", choices: ["65°F", "68°F", "70°F", "72°F"], answer: 2, explanation: "Find Wednesday on the X-axis, go up to the line, then read across to the Y-axis: 70°F.", skill: "value-reading" },
      { question: "Which day was the warmest?", choices: ["Wednesday", "Friday", "Saturday", "Sunday"], answer: 2, explanation: "Saturday has the highest point on the line at 75°F.", skill: "extremes" },
    ],
  },
  {
    id: "rain-sun", title: "Weather in Two Cities", xLabel: "Month", yLabel: "Rainy Days",
    xValues: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    type: "multi-line",
    series: [
      { label: "Seattle", color: "#3b82f6", points: [{ x: 0, y: 18 }, { x: 1, y: 16 }, { x: 2, y: 14 }, { x: 3, y: 12 }, { x: 4, y: 9 }, { x: 5, y: 7 }] },
      { label: "Phoenix", color: "#f97316", points: [{ x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 2 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }] },
    ],
    difficulty: 2,
    questions: [
      { question: "Which line represents Seattle?", choices: ["The orange line", "The blue line", "Both lines", "Neither line"], answer: 1, explanation: "Check the legend! Seattle is the blue line, Phoenix is orange. The legend tells you which data each line shows.", skill: "legend-reading" },
      { question: "Which city has more rainy days?", choices: ["Phoenix", "Seattle", "They're equal", "Can't tell"], answer: 1, explanation: "Seattle's line (blue) is much higher than Phoenix's (orange) for every month. Seattle gets far more rain.", skill: "comparison" },
    ],
  },

  // ── Difficulty 3: Reading values and simple comparison (Grade 4) ──
  {
    id: "book-month", title: "Books Read Per Month", xLabel: "Month", yLabel: "Books",
    xValues: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
    type: "line",
    series: [{ label: "Books", color: "#8b5cf6", points: [{ x: 0, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 1 }, { x: 4, y: 4 }, { x: 5, y: 5 }, { x: 6, y: 6 }, { x: 7, y: 5 }] }],
    difficulty: 3,
    questions: [
      { question: "In which month were the FEWEST books read?", choices: ["September", "December", "October", "April"], answer: 1, explanation: "December has the lowest point at 1 book. The lowest point on a line graph shows the minimum.", skill: "extremes" },
      { question: "Between which two months did reading increase the most?", choices: ["Sep→Oct", "Dec→Jan", "Jan→Feb", "Feb→Mar"], answer: 1, explanation: "Dec→Jan went from 1 to 4 (increase of 3). That's the biggest single jump.", skill: "rate-of-change" },
      { question: "What is the overall trend from September to March?", choices: ["Decreasing", "Staying the same", "Increasing", "No pattern"], answer: 2, explanation: "Despite a dip in December, the overall trend goes up from 2 books (Sep) to 6 books (Mar). That's an increasing trend.", skill: "trend" },
    ],
  },
  {
    id: "scores-bar", title: "Quiz Scores by Subject", xLabel: "Subject", yLabel: "Average Score (%)",
    xValues: ["Math", "Science", "English", "History", "Art"],
    type: "bar",
    series: [{ label: "Score", color: "#22c55e", points: [{ x: 0, y: 85 }, { x: 1, y: 78 }, { x: 2, y: 92 }, { x: 3, y: 71 }, { x: 4, y: 88 }] }],
    difficulty: 3,
    questions: [
      { question: "What is the difference between the highest and lowest scores?", choices: ["14%", "17%", "21%", "24%"], answer: 2, explanation: "Highest is English (92%) and lowest is History (71%). 92 - 71 = 21%.", skill: "calculation" },
      { question: "Which subject score is closest to 80%?", choices: ["Math", "Science", "English", "Art"], answer: 1, explanation: "Science at 78% is only 2% away from 80%. Math (85%) is 5% away.", skill: "estimation" },
    ],
  },

  // ── Difficulty 4: Trends and patterns (Grade 5) ──
  {
    id: "population-city", title: "City Population Growth", xLabel: "Year", yLabel: "Population (thousands)",
    xValues: ["1960", "1970", "1980", "1990", "2000", "2010", "2020"],
    type: "line",
    series: [{ label: "Population", color: "#06b6d4", points: [{ x: 0, y: 50 }, { x: 1, y: 65 }, { x: 2, y: 85 }, { x: 3, y: 110 }, { x: 4, y: 145 }, { x: 5, y: 190 }, { x: 6, y: 250 }] }],
    difficulty: 4,
    questions: [
      { question: "Is this growth linear (steady) or accelerating?", choices: ["Linear — same amount each decade", "Accelerating — growing faster each decade", "Decelerating — slowing down", "Random — no pattern"], answer: 1, explanation: "The gap between points gets bigger each decade (15, 20, 25, 35, 45, 60). This is accelerating growth — each decade adds more than the last.", skill: "trend" },
      { question: "What kind of real-world data often looks like this?", choices: ["Temperature over a day", "Population growth", "Speed of a falling ball", "Coin flips"], answer: 1, explanation: "Population growth often follows this accelerating pattern because more people means more births. This is exponential-like growth.", skill: "real-world-interpretation" },
      { question: "If the trend continues, what might the population be around 2030?", choices: ["About 270K", "About 320K", "About 380K", "About 500K"], answer: 1, explanation: "The growth has been accelerating. From 2010→2020 it grew by 60K. If it keeps accelerating, around 320K is reasonable. Prediction from trends is called extrapolation.", skill: "prediction" },
    ],
  },
  {
    id: "ice-cream-temp", title: "Ice Cream Sales vs Temperature", xLabel: "Temperature (°F)", yLabel: "Daily Sales ($)",
    type: "scatter",
    series: [{ label: "Sales", color: "#ec4899", points: [
      { x: 55, y: 120 }, { x: 60, y: 200 }, { x: 65, y: 280 }, { x: 70, y: 350 },
      { x: 72, y: 320 }, { x: 75, y: 450 }, { x: 78, y: 480 }, { x: 80, y: 550 },
      { x: 82, y: 520 }, { x: 85, y: 620 }, { x: 88, y: 680 }, { x: 90, y: 700 },
      { x: 92, y: 750 }, { x: 95, y: 800 },
    ] }],
    difficulty: 4,
    questions: [
      { question: "What is the relationship between temperature and ice cream sales?", choices: ["No relationship", "As temperature goes up, sales go down", "As temperature goes up, sales go up", "Sales stay the same"], answer: 2, explanation: "The dots trend upward from left to right — higher temperatures correlate with higher sales. This is a positive correlation.", skill: "correlation" },
      { question: "This graph shows correlation. Does that mean hot weather CAUSES people to buy ice cream?", choices: ["Yes, correlation always means causation", "Maybe — but we'd need more evidence", "No — correlation never means anything", "The graph doesn't show correlation"], answer: 1, explanation: "Correlation shows a relationship but doesn't prove causation by itself. In this case, it's plausible that heat causes ice cream buying, but a scientist would want to control for other factors.", skill: "critical-thinking" },
    ],
  },

  // ── Difficulty 5: Interpretation & what-could-this-be (Grade 6) ──
  {
    id: "mystery-growth", title: "Mystery Data", xLabel: "Year (since 1990)", yLabel: "Units (millions)",
    xValues: ["0", "5", "10", "15", "20", "25", "30"],
    type: "curve",
    series: [{ label: "Data", color: "#8b5cf6", points: [{ x: 0, y: 3 }, { x: 5, y: 16 }, { x: 10, y: 70 }, { x: 15, y: 200 }, { x: 20, y: 500 }, { x: 25, y: 800 }, { x: 30, y: 900 }] }],
    difficulty: 5,
    questions: [
      { question: "This graph shows rapid growth that eventually slows. What real data could this be?", choices: ["Daily temperature", "Internet users worldwide", "Height of a person", "Number of planets"], answer: 1, explanation: "Internet adoption grew explosively in the 1990s-2010s and is now leveling off as most people are online. This S-shaped curve (logistic growth) is common in technology adoption.", skill: "real-world-interpretation" },
      { question: "What is this growth pattern called?", choices: ["Linear growth", "Exponential decay", "S-curve (logistic growth)", "Random walk"], answer: 2, explanation: "This S-shaped curve starts slow, accelerates rapidly, then levels off. It's called logistic or S-curve growth. Technology adoption, disease spread, and population in limited areas often follow this pattern.", skill: "pattern-recognition" },
    ],
  },
  {
    id: "mystery-decline", title: "Global Trend Since 1960", xLabel: "Year", yLabel: "Rate (per 1,000)",
    xValues: ["1960", "1970", "1980", "1990", "2000", "2010", "2020"],
    type: "line",
    series: [{ label: "Rate", color: "#ef4444", points: [{ x: 0, y: 180 }, { x: 1, y: 140 }, { x: 2, y: 100 }, { x: 3, y: 75 }, { x: 4, y: 55 }, { x: 5, y: 40 }, { x: 6, y: 30 }] }],
    difficulty: 5,
    questions: [
      { question: "This shows a rate that has dropped dramatically since 1960. What could it be?", choices: ["Child mortality rate", "Average income", "Number of schools", "Life expectancy"], answer: 0, explanation: "Child mortality has dropped from ~180 per 1,000 in 1960 to ~30 today thanks to vaccines, clean water, and better healthcare. Declining rates of bad outcomes often follow this pattern.", skill: "real-world-interpretation" },
      { question: "The rate dropped by about 150 points total. Was the drop even across decades?", choices: ["Yes, same drop each decade", "No, it dropped more in earlier decades", "No, it dropped more in later decades", "Can't tell"], answer: 1, explanation: "1960-1970: dropped 40 points. 2010-2020: dropped 10 points. The rate of decline slowed over time — the biggest improvements came first.", skill: "rate-of-change" },
    ],
  },
  {
    id: "two-country-gdp", title: "GDP Per Capita: Two Countries", xLabel: "Year", yLabel: "GDP per capita ($)",
    xValues: ["1990", "1995", "2000", "2005", "2010", "2015", "2020"],
    type: "multi-line",
    series: [
      { label: "Country A", color: "#3b82f6", points: [{ x: 0, y: 2000 }, { x: 1, y: 3500 }, { x: 2, y: 6000 }, { x: 3, y: 10000 }, { x: 4, y: 16000 }, { x: 5, y: 22000 }, { x: 6, y: 28000 }] },
      { label: "Country B", color: "#f97316", points: [{ x: 0, y: 15000 }, { x: 1, y: 17000 }, { x: 2, y: 19000 }, { x: 3, y: 21000 }, { x: 4, y: 23000 }, { x: 5, y: 25000 }, { x: 6, y: 27000 }] },
    ],
    difficulty: 5,
    questions: [
      { question: "Which country started poorer but grew faster?", choices: ["Country A", "Country B", "They grew equally", "Can't tell"], answer: 0, explanation: "Country A started at $2,000 but grew exponentially, nearly catching Country B by 2020. Country B grew linearly at about $2,000/5yr.", skill: "comparison" },
      { question: "If trends continue, when might Country A surpass Country B?", choices: ["Already did", "Around 2022-2025", "Around 2030", "Never"], answer: 1, explanation: "By 2020, Country A ($28K) is almost at Country B ($27K). The lines are about to cross. Extrapolating, A passes B in the early 2020s.", skill: "prediction" },
    ],
  },

  // ── Difficulty 6: Statistical and multi-dataset (Grade 7-8) ──
  {
    id: "study-hours", title: "Study Hours vs Test Score", xLabel: "Hours Studied", yLabel: "Test Score (%)",
    type: "scatter",
    series: [{ label: "Students", color: "#22c55e", points: [
      { x: 1, y: 45 }, { x: 1, y: 55 }, { x: 2, y: 50 }, { x: 2, y: 65 }, { x: 3, y: 60 },
      { x: 3, y: 72 }, { x: 4, y: 68 }, { x: 4, y: 78 }, { x: 5, y: 75 }, { x: 5, y: 85 },
      { x: 6, y: 80 }, { x: 6, y: 90 }, { x: 7, y: 82 }, { x: 7, y: 95 }, { x: 8, y: 88 },
      { x: 8, y: 92 }, { x: 10, y: 70 },
    ] }],
    difficulty: 6,
    questions: [
      { question: "What is the general correlation?", choices: ["Negative — more study = lower scores", "Positive — more study = higher scores", "No correlation", "Curved relationship"], answer: 1, explanation: "Overall, the dots trend upward: more hours studied generally means higher scores. But there's scatter — studying doesn't guarantee a specific score.", skill: "correlation" },
      { question: "There's one dot at (10 hours, 70%). What might this represent?", choices: ["A student who's very smart", "An outlier — maybe they studied the wrong material", "Normal variation", "A data error"], answer: 1, explanation: "This point is an outlier — much lower than expected for 10 hours of study. Possible explanations include studying ineffectively, being tired, or the data being wrong. Good analysts investigate outliers.", skill: "outlier-detection" },
      { question: "If someone studied for 9 hours, what score would you predict?", choices: ["About 70%", "About 85-90%", "About 95%", "Can't predict"], answer: 1, explanation: "Following the trend, 9 hours should give roughly 85-90%. But the scatter shows it's a prediction with uncertainty — not an exact answer.", skill: "prediction" },
    ],
  },
  {
    id: "energy-source", title: "Energy Sources Over Time", xLabel: "Year", yLabel: "% of Total Energy",
    xValues: ["2000", "2005", "2010", "2015", "2020"],
    type: "multi-line",
    series: [
      { label: "Fossil Fuels", color: "#64748b", points: [{ x: 0, y: 85 }, { x: 1, y: 82 }, { x: 2, y: 78 }, { x: 3, y: 72 }, { x: 4, y: 65 }] },
      { label: "Renewable", color: "#22c55e", points: [{ x: 0, y: 8 }, { x: 1, y: 10 }, { x: 2, y: 14 }, { x: 3, y: 20 }, { x: 4, y: 28 }] },
      { label: "Nuclear", color: "#8b5cf6", points: [{ x: 0, y: 7 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 7 }] },
    ],
    difficulty: 6,
    questions: [
      { question: "Which energy source is growing the fastest?", choices: ["Fossil Fuels", "Renewable", "Nuclear", "All growing equally"], answer: 1, explanation: "Renewable went from 8% to 28% (3.5x growth). Fossil fuels are declining, and nuclear is roughly flat.", skill: "comparison" },
      { question: "If trends continue, approximately when might renewables surpass fossil fuels?", choices: ["Around 2030", "Around 2040-2045", "Around 2060", "Never at this rate"], answer: 1, explanation: "Renewables are growing ~4% per 5 years and accelerating, while fossil fuels drop ~5% per 5 years. They'd meet around 45-50% each, roughly 2040-2045.", skill: "prediction" },
      { question: "Do the three sources always add up to 100%?", choices: ["Yes, exactly", "Approximately, yes", "No, they're independent", "Can't tell"], answer: 1, explanation: "Energy source percentages should add to ~100% (with minor rounding). In 2020: 65+28+7 = 100%. This is an important check — percentages of a whole must sum to 100%.", skill: "data-integrity" },
    ],
  },

  // ── Difficulty 7: Recognize mathematical shapes (Grade 9-10) ──
  {
    id: "parabola", title: "Data Pattern A", xLabel: "x", yLabel: "y",
    type: "curve",
    series: [{ label: "y", color: "#6366f1", points: [
      { x: -4, y: 16 }, { x: -3, y: 9 }, { x: -2, y: 4 }, { x: -1, y: 1 },
      { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 4 }, { x: 3, y: 9 }, { x: 4, y: 16 },
    ] }],
    difficulty: 7,
    questions: [
      { question: "What function does this graph most likely represent?", choices: ["y = x", "y = x²", "y = 2ˣ", "y = |x|"], answer: 1, explanation: "This is a parabola — the classic U-shape of y = x². Key features: symmetric around x=0, passes through (0,0), and y values are perfect squares of x values.", skill: "shape-recognition" },
      { question: "This shape is called a...", choices: ["Hyperbola", "Parabola", "Circle", "Logarithm"], answer: 1, explanation: "The U-shape of y = x² is a parabola. It's one of the most important shapes in math and physics — projectile motion, satellite dishes, and headlights all use parabolas.", skill: "shape-naming" },
      { question: "What real-world data might follow this pattern?", choices: ["Braking distance vs speed", "Temperature vs time", "Height vs age", "Coin flips"], answer: 0, explanation: "Braking distance increases with the square of speed — double your speed and braking distance quadruples. This is why speeding is so dangerous.", skill: "real-world-interpretation" },
    ],
  },
  {
    id: "exponential", title: "Data Pattern B", xLabel: "x", yLabel: "y",
    type: "curve",
    series: [{ label: "y", color: "#ef4444", points: [
      { x: 0, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 8 },
      { x: 4, y: 16 }, { x: 5, y: 32 }, { x: 6, y: 64 },
    ] }],
    difficulty: 7,
    questions: [
      { question: "What function does this represent?", choices: ["y = 2x", "y = x²", "y = 2ˣ", "y = log(x)"], answer: 2, explanation: "Each time x increases by 1, y doubles. That's exponential growth: y = 2ˣ. Notice how it starts slow (1, 2, 4) then explodes (16, 32, 64).", skill: "shape-recognition" },
      { question: "What is the key difference between this and y = x²?", choices: ["This grows slower", "This grows faster eventually", "They're the same shape", "This one decreases"], answer: 1, explanation: "Exponential (2ˣ) eventually grows faster than any polynomial (x²). For x=10: x²=100 but 2ˣ=1024. Exponential growth always wins in the long run.", skill: "comparison" },
    ],
  },
  {
    id: "semicircle", title: "Data Pattern C", xLabel: "x", yLabel: "y",
    type: "curve",
    series: [{ label: "y", color: "#22c55e", points: (() => {
      const pts: { x: number; y: number }[] = [];
      for (let i = -10; i <= 10; i++) { const x = i / 10; pts.push({ x, y: Math.sqrt(Math.max(0, 1 - x * x)) }); }
      return pts;
    })() }],
    difficulty: 7,
    questions: [
      { question: "This curve looks like a semicircle. What equation could produce it?", choices: ["y = x²", "y = √(1 - x²)", "y = sin(x)", "y = 1/x"], answer: 1, explanation: "The equation x² + y² = 1 describes a circle with radius 1. Solving for y: y = √(1 - x²) gives the top half — a semicircle.", skill: "shape-recognition" },
      { question: "If we plotted the negative version too (y = -√(1-x²)), what shape would we get?", choices: ["A parabola", "A full circle", "A line", "A wave"], answer: 1, explanation: "The top half (positive square root) plus the bottom half (negative square root) together make a complete circle. This is the unit circle with radius 1.", skill: "shape-recognition" },
    ],
  },
  {
    id: "sine-wave", title: "Data Pattern D", xLabel: "x", yLabel: "y",
    type: "curve",
    series: [{ label: "y", color: "#f59e0b", points: (() => {
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= 24; i++) { const x = i * Math.PI / 4; pts.push({ x: Math.round(x * 100) / 100, y: Math.round(Math.sin(x) * 100) / 100 }); }
      return pts;
    })() }],
    difficulty: 7,
    questions: [
      { question: "This repeating wave pattern is characteristic of which function?", choices: ["y = x²", "y = eˣ", "y = sin(x)", "y = log(x)"], answer: 2, explanation: "The sine function produces a smooth wave that oscillates between -1 and 1, repeating every 2π ≈ 6.28 units. It's the fundamental periodic function.", skill: "shape-recognition" },
      { question: "What real-world phenomena follow this pattern?", choices: ["Population growth", "Sound waves and tides", "Stock prices", "Gravity"], answer: 1, explanation: "Sound waves, ocean tides, AC electricity, pendulums, and light waves all follow sinusoidal patterns. It's the most common wave shape in nature.", skill: "real-world-interpretation" },
    ],
  },

  // ── Difficulty 8: Advanced interpretation (Grade 11+) ──
  {
    id: "log-curve", title: "Data Pattern E", xLabel: "x", yLabel: "y",
    type: "curve",
    series: [{ label: "y", color: "#a855f7", points: [
      { x: 0.5, y: -0.69 }, { x: 1, y: 0 }, { x: 2, y: 0.69 }, { x: 4, y: 1.39 },
      { x: 8, y: 2.08 }, { x: 16, y: 2.77 }, { x: 32, y: 3.47 },
    ] }],
    difficulty: 8,
    questions: [
      { question: "This curve grows quickly at first then flattens. What function is it?", choices: ["y = x²", "y = √x", "y = ln(x)", "y = 1/x"], answer: 2, explanation: "This is the natural logarithm. It's the inverse of exponential growth: when x doubles, y increases by a constant amount (≈0.69). Logarithmic growth is common in diminishing returns.", skill: "shape-recognition" },
      { question: "The logarithm is the inverse of which function?", choices: ["The square root", "The exponential function", "The sine function", "The quadratic"], answer: 1, explanation: "If y = eˣ (exponential), then x = ln(y) (logarithm). They 'undo' each other. This relationship is fundamental in mathematics.", skill: "function-relationships" },
    ],
  },
  {
    id: "inverse", title: "Data Pattern F", xLabel: "x", yLabel: "y",
    type: "curve",
    series: [{ label: "y", color: "#06b6d4", points: [
      { x: 0.5, y: 2 }, { x: 1, y: 1 }, { x: 2, y: 0.5 }, { x: 4, y: 0.25 },
      { x: 5, y: 0.2 }, { x: 8, y: 0.125 }, { x: 10, y: 0.1 },
    ] }],
    difficulty: 8,
    questions: [
      { question: "What function describes this decreasing curve?", choices: ["y = -x", "y = 1/x", "y = e⁻ˣ", "y = -x²"], answer: 1, explanation: "This is an inverse (reciprocal) function: y = 1/x. As x doubles, y halves. It approaches but never reaches zero — an asymptote.", skill: "shape-recognition" },
      { question: "What real-world relationship follows this pattern (y = k/x)?", choices: ["Speed vs time to travel a fixed distance", "Height vs age", "Temperature vs altitude", "Population vs time"], answer: 0, explanation: "If you need to travel 100 miles: at 50 mph it takes 2 hours, at 100 mph it takes 1 hour. Time = Distance/Speed is an inverse relationship.", skill: "real-world-interpretation" },
    ],
  },
  {
    id: "normal-dist", title: "Test Score Distribution", xLabel: "Score", yLabel: "Number of Students",
    type: "curve",
    series: [{ label: "Students", color: "#ec4899", points: [
      { x: 40, y: 2 }, { x: 50, y: 5 }, { x: 55, y: 10 }, { x: 60, y: 20 },
      { x: 65, y: 35 }, { x: 70, y: 50 }, { x: 75, y: 55 }, { x: 80, y: 50 },
      { x: 85, y: 35 }, { x: 90, y: 20 }, { x: 95, y: 10 }, { x: 100, y: 5 },
    ] }],
    difficulty: 8,
    questions: [
      { question: "This bell-shaped curve is called a...", choices: ["Parabola", "Logarithm", "Normal distribution (bell curve)", "Sigmoid"], answer: 2, explanation: "The normal distribution (Gaussian/bell curve) is symmetric, with most data clustered around the mean. It appears everywhere: test scores, heights, measurement errors, etc.", skill: "shape-recognition" },
      { question: "About what percentage of students scored between 65 and 85?", choices: ["About 25%", "About 50%", "About 68%", "About 95%"], answer: 2, explanation: "In a normal distribution, about 68% of data falls within one standard deviation of the mean (roughly 65-85 here). This is called the 68-95-99.7 rule.", skill: "statistical-interpretation" },
    ],
  },
];

/* ━━━ SVG Graph Renderer ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const W = 360, H = 240, PAD = { top: 30, right: 20, bottom: 40, left: 50 };
const PW = W - PAD.left - PAD.right;
const PH = H - PAD.top - PAD.bottom;

function SVGGraph({ graph }: { graph: GraphDef }) {
  // compute ranges
  const allPts = graph.series.flatMap(s => s.points);
  let xMin = Math.min(...allPts.map(p => p.x));
  let xMax = Math.max(...allPts.map(p => p.x));
  let yMin = Math.min(...allPts.map(p => p.y), 0);
  let yMax = Math.max(...allPts.map(p => p.y));
  if (xMax === xMin) xMax = xMin + 1;
  if (yMax === yMin) yMax = yMin + 1;
  // Add 5% padding
  const yRange = yMax - yMin;
  yMax += yRange * 0.05;
  yMin -= yRange * 0.05;

  const sx = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin)) * PW;
  const sy = (y: number) => PAD.top + PH - ((y - yMin) / (yMax - yMin)) * PH;

  // Y-axis ticks (5 ticks)
  const yTicks: number[] = [];
  for (let i = 0; i <= 4; i++) {
    yTicks.push(yMin + (yRange + yRange * 0.1) * i / 4);
  }

  const isBar = graph.type === "bar";
  const barW = isBar ? PW / (allPts.length + 1) * 0.7 : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[420px]" style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12 }}>
      {/* Title */}
      <text x={W / 2} y={14} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">{graph.title}</text>

      {/* Grid lines */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={sy(v)} x2={W - PAD.right} y2={sy(v)} stroke="rgba(255,255,255,0.08)" />
          <text x={PAD.left - 4} y={sy(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize={8}>
            {Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + "K" : Number.isInteger(v) ? v : v.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Axes */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="rgba(255,255,255,0.3)" />
      <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="rgba(255,255,255,0.3)" />

      {/* Axis labels */}
      <text x={W / 2} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={9}>{graph.xLabel}</text>
      <text x={10} y={H / 2} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={9} transform={`rotate(-90, 10, ${H / 2})`}>{graph.yLabel}</text>

      {/* X-axis labels */}
      {graph.xValues ? graph.xValues.map((label, i) => (
        <text key={i} x={sx(i)} y={H - PAD.bottom + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={7}>{label}</text>
      )) : (
        // numeric x labels
        allPts.filter((_, i) => i % Math.max(1, Math.floor(allPts.length / 6)) === 0).map((p, i) => (
          <text key={i} x={sx(p.x)} y={H - PAD.bottom + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={7}>
            {Number.isInteger(p.x) ? p.x : p.x.toFixed(1)}
          </text>
        ))
      )}

      {/* Data */}
      {graph.series.map((series, si) => {
        if (isBar) {
          return series.points.map((p, pi) => (
            <rect key={`${si}-${pi}`} x={sx(p.x) - barW / 2} y={sy(p.y)} width={barW} height={Math.max(0, sy(yMin) - sy(p.y))}
              fill={series.color} opacity={0.8} rx={2} />
          ));
        }
        // Line / curve / scatter / multi-line
        const pathD = series.points.map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(" ");
        return (
          <g key={si}>
            {graph.type !== "scatter" && <path d={pathD} fill="none" stroke={series.color} strokeWidth={2} opacity={0.9} />}
            {series.points.map((p, pi) => (
              <circle key={pi} cx={sx(p.x)} cy={sy(p.y)} r={graph.type === "scatter" ? 3.5 : 2.5} fill={series.color} opacity={0.9} />
            ))}
          </g>
        );
      })}

      {/* Legend (for multi-series) */}
      {graph.series.length > 1 && (
        <g>
          {graph.series.map((s, i) => (
            <g key={i} transform={`translate(${PAD.left + 8 + i * 90}, ${PAD.top + 4})`}>
              <rect width={10} height={10} fill={s.color} rx={2} opacity={0.9} />
              <text x={14} y={9} fill="rgba(255,255,255,0.7)" fontSize={8}>{s.label}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

/* ━━━ Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const GAME_ID = "graph-reading";
const COUNTDOWN_SECS = 3;

function diffForLevel(level: number): number {
  if (level <= 5) return 1;
  if (level <= 10) return 2;
  if (level <= 14) return 3;
  if (level <= 18) return 4;
  if (level <= 25) return 5;
  if (level <= 32) return 6;
  if (level <= 40) return 7;
  return 8;
}

function pickQuestions(level: number, count: number): { graph: GraphDef; question: QuestionDef }[] {
  const target = diffForLevel(level);
  const eligible = GRAPHS.filter(g => Math.abs(g.difficulty - target) <= 1);
  const pool: { graph: GraphDef; question: QuestionDef }[] = [];
  for (const g of eligible) {
    for (const q of g.questions) {
      pool.push({ graph: g, question: q });
    }
  }
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const SKILL_LABELS: Record<string, string> = {
  "axis-reading": "Reading Axes",
  "value-reading": "Reading Values",
  "title-reading": "Reading Titles",
  "legend-reading": "Reading Legends",
  "extremes": "Finding Min/Max",
  "comparison": "Comparing Data",
  "rate-of-change": "Rate of Change",
  "trend": "Identifying Trends",
  "correlation": "Understanding Correlation",
  "critical-thinking": "Critical Thinking",
  "real-world-interpretation": "Real-World Connections",
  "prediction": "Making Predictions",
  "estimation": "Estimation",
  "calculation": "Calculations from Graphs",
  "pattern-recognition": "Pattern Recognition",
  "shape-recognition": "Recognizing Function Shapes",
  "shape-naming": "Naming Function Shapes",
  "function-relationships": "Function Relationships",
  "outlier-detection": "Spotting Outliers",
  "data-integrity": "Data Integrity Checks",
  "statistical-interpretation": "Statistical Interpretation",
};

/* ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function GraphReadingGame() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));
  const [questions, setQuestions] = useState<{ graph: GraphDef; question: QuestionDef }[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [highScore, setHighScoreState] = useState(0);
  const [medals, setMedals] = useState<NewAchievement[]>([]);
  const [adjustAnim, setAdjustAnim] = useState<"up" | "down" | null>(null);
  const [skillsCorrect, setSkillsCorrect] = useState<Record<string, number>>({});
  const [skillsTotal, setSkillsTotal] = useState<Record<string, number>>({});
  const roundStart = useRef(Date.now());

  useGameMusic();

  useEffect(() => { setHighScoreState(getLocalHighScore(GAME_ID)); }, []);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      sfxCountdownGo();
      setQuestions(pickQuestions(adaptive.level, 12));
      setCurrentIdx(0);
      roundStart.current = Date.now();
      setPhase("playing");
      return;
    }
    sfxCountdown();
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, adaptive.level]);

  const startGame = useCallback((startLevel: number) => {
    setAdaptive(createAdaptiveState(startLevel));
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setTotalCorrect(0);
    setTotalWrong(0);
    setSelected(null);
    setSkillsCorrect({});
    setSkillsTotal({});
    setCountdown(COUNTDOWN_SECS);
    setPhase("countdown");
  }, []);

  const current = questions[currentIdx];

  const handleAnswer = useCallback((choiceIdx: number) => {
    if (!current || selected !== null) return;
    setSelected(choiceIdx);
    const correct = choiceIdx === current.question.answer;
    const elapsed = Date.now() - roundStart.current;
    const fast = elapsed < 8000;

    const { mult } = getMultiplierFromStreak(streak);
    const pts = correct ? Math.round((fast ? 120 : 80) * mult) : 0;
    setScore(s => s + pts);

    if (correct) {
      sfxCorrect();
      setTotalCorrect(c => c + 1);
      const ns = streak + 1;
      setStreak(ns);
      if (ns > maxStreak) setMaxStreak(ns);
      if (ns > 0 && ns % 5 === 0) sfxCombo(ns);
    } else {
      if (streak > 0) sfxStreakLost();
      sfxWrong();
      setTotalWrong(w => w + 1);
      setStreak(0);
    }

    // Track skill
    const skill = current.question.skill;
    setSkillsTotal(prev => ({ ...prev, [skill]: (prev[skill] || 0) + 1 }));
    if (correct) setSkillsCorrect(prev => ({ ...prev, [skill]: (prev[skill] || 0) + 1 }));

    // Adaptive
    const newAd = adaptiveUpdate(adaptive, correct, fast && correct);
    setAdaptive(newAd);
    if (newAd.lastAdjust && newAd.lastAdjustTime > adaptive.lastAdjustTime) {
      setAdjustAnim(newAd.lastAdjust);
      setTimeout(() => setAdjustAnim(null), 1200);
      if (newAd.lastAdjust === "up") sfxLevelUp();
    }

    setPhase("feedback");
  }, [current, selected, streak, maxStreak, adaptive]);

  const nextQuestion = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      // Game over
      const finalScore = score;
      if (finalScore > highScore) {
        setLocalHighScore(GAME_ID, finalScore);
        setHighScoreState(finalScore);
      }
      const profile = getProfile();
      const gameStats = {
        gameId: GAME_ID,
        score: finalScore,
        bestStreak: maxStreak,
        bestCombo: maxStreak,
        accuracy: Math.round(totalCorrect / Math.max(1, totalCorrect + totalWrong) * 100),
      };
      const gamesById = profile?.gamesPlayedByGameId ?? {};
      const newMedals = checkAchievements(gameStats, profile?.totalGamesPlayed ?? 0, gamesById);
      setMedals(newMedals);
      if (newMedals.length > 0) sfxAchievement();
      trackGamePlayed(GAME_ID, finalScore, { bestStreak: maxStreak, adaptiveLevel: Math.round(adaptive.level) });
      const acc = total > 0 ? totalCorrect / total : 0;
      if (acc >= 1.0) sfxPerfect();
      else if (acc >= 0.8) sfxLevelUp();
      else sfxGameOver();
      setPhase("complete");
    } else {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      roundStart.current = Date.now();
      setPhase("playing");
    }
  }, [currentIdx, questions.length, score, highScore, maxStreak, totalCorrect, totalWrong, adaptive]);

  const dl = getDifficultyLabel(adaptive.level);
  const gradeInfo = getGradeForLevel(adaptive.level);
  const total = totalCorrect + totalWrong;
  const accPct = total > 0 ? Math.round(totalCorrect / total * 100) : 0;

  /* ── MENU ── */
  if (phase === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col">
        <div className="p-4 flex items-center gap-3">
          <Link href="/games" className="text-white/60 hover:text-white"><ArrowLeft size={24} /></Link>
          <h1 className="text-2xl font-bold">Graph Reading</h1>
          <AudioToggles />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto gap-6">
          <div className="text-center">
            <BarChart3 size={56} className="text-indigo-400 mx-auto mb-3" />
            <h2 className="text-3xl font-extrabold mb-2">Read Graphs Like a Pro</h2>
            <p className="text-white/50 text-sm">From reading axes to identifying mathematical functions — master graph comprehension!</p>
          </div>

          <div className="w-full bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-bold text-indigo-400 mb-2">Skills You&apos;ll Build</h3>
            <div className="grid grid-cols-2 gap-1.5 text-xs text-white/70">
              <div>📊 Read axes &amp; labels</div>
              <div>📈 Identify trends</div>
              <div>🔍 Spot real-world patterns</div>
              <div>📉 Understand correlation</div>
              <div>🧮 Recognize function shapes</div>
              <div>🌍 Connect data to reality</div>
            </div>
          </div>

          <div className="w-full space-y-2">
            <p className="text-xs text-white/40 text-center">Choose starting level</p>
            {[
              { label: "Grade 1-3", desc: "Axes, labels, bar charts", level: 1, color: "#22c55e" },
              { label: "Grade 4-5", desc: "Trends, comparisons, prediction", level: 11, color: "#eab308" },
              { label: "Grade 6-8", desc: "Correlation, statistics, multi-data", level: 19, color: "#ef4444" },
              { label: "Grade 9+", desc: "Function shapes, advanced interpretation", level: 33, color: "#a855f7" },
            ].map(opt => (
              <button key={opt.level} onClick={() => startGame(opt.level)}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-between hover:scale-[1.02] transition-transform"
                style={{ backgroundColor: opt.color + "22", border: `1px solid ${opt.color}44` }}>
                <span>{opt.label}</span>
                <span className="text-white/50 text-xs font-normal">{opt.desc}</span>
              </button>
            ))}
          </div>
          {highScore > 0 && <p className="text-xs text-white/40">Personal best: {highScore.toLocaleString()}</p>}
        </div>
      </div>
    );
  }

  /* ── COUNTDOWN ── */
  if (phase === "countdown") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl font-black tabular-nums animate-pulse">{countdown || "GO!"}</div>
          <p className="text-white/40 mt-2">Time to read some graphs...</p>
        </div>
      </div>
    );
  }

  /* ── HUD ── */
  const HUD = (
    <div className="p-3 flex items-center justify-between bg-black/30 text-sm">
      <div className="flex items-center gap-2">
        <Link href="/games" className="text-white/40 hover:text-white"><ArrowLeft size={18} /></Link>
        <BarChart3 size={16} className="text-indigo-400" />
        <span className="font-bold">{score.toLocaleString()}</span>
        {streak >= 3 && <StreakBadge streak={streak} />}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold" style={{ color: dl.color }}>{dl.emoji} {dl.label}</span>
        <span className="text-xs text-white/50">Lvl {Math.round(adaptive.level)} · {gradeInfo.label}</span>
        {adjustAnim && (
          <span className={`text-xs font-bold animate-bounce ${adjustAnim === "up" ? "text-green-400" : "text-red-400"}`}>
            {adjustAnim === "up" ? "▲" : "▼"}
          </span>
        )}
      </div>
      <div className="text-xs text-white/40">{currentIdx + 1}/{questions.length}</div>
    </div>
  );

  /* ── PLAYING / FEEDBACK ── */
  if ((phase === "playing" || phase === "feedback") && current) {
    const { graph, question } = current;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col">
        {HUD}
        <div className="flex-1 flex flex-col items-center p-4 max-w-xl mx-auto overflow-y-auto">
          {/* Graph */}
          <SVGGraph graph={graph} />

          {/* Question */}
          <p className="font-bold text-sm mt-4 mb-3 text-center leading-snug">{question.question}</p>

          {/* Choices */}
          <div className="w-full space-y-2 mb-4">
            {question.choices.map((choice, i) => {
              let cls = "bg-white/5 border border-white/10 hover:bg-white/10";
              if (selected !== null) {
                if (i === question.answer) cls = "bg-emerald-600/30 border border-emerald-500/40";
                else if (i === selected) cls = "bg-red-600/30 border border-red-500/40";
                else cls = "bg-white/5 border border-white/10 opacity-40";
              }
              return (
                <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm text-left transition-all ${cls}`}>
                  {choice}
                  {selected !== null && i === question.answer && <span className="ml-2 text-emerald-400">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Explanation (feedback phase) */}
          {phase === "feedback" && (
            <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-indigo-400 mb-1">{SKILL_LABELS[question.skill] || question.skill}</p>
              <p className="text-sm text-white/70 leading-relaxed">{question.explanation}</p>
            </div>
          )}

          {phase === "feedback" && (
            <button onClick={nextQuestion}
              className="w-full py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 transition-colors">
              {currentIdx + 1 >= questions.length ? "See Results" : "Next Question →"}
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── COMPLETE ── */
  if (phase === "complete") {
    const masteredSkills = Object.entries(skillsTotal)
      .filter(([skill]) => (skillsCorrect[skill] || 0) === skillsTotal[skill])
      .map(([skill]) => skill);
    const weakSkills = Object.entries(skillsTotal)
      .filter(([skill]) => (skillsCorrect[skill] || 0) < skillsTotal[skill])
      .map(([skill]) => skill);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col">
        <div className="p-4 flex items-center gap-3">
          <Link href="/games" className="text-white/60 hover:text-white"><ArrowLeft size={24} /></Link>
          <h1 className="text-xl font-bold">Analysis Complete</h1>
        </div>
        <div className="flex-1 flex flex-col items-center p-4 max-w-lg mx-auto gap-4">
          <div className="text-center">
            <Trophy size={48} className="text-amber-400 mx-auto mb-2" />
            <div className="text-4xl font-black">{score.toLocaleString()}</div>
            <p className="text-white/40 text-sm">Graph Reading Score</p>
            {score > 0 && score >= highScore && <p className="text-amber-400 text-xs font-bold mt-1">New Personal Best!</p>}
          </div>

          <div className="w-full grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{totalCorrect}/{total}</div>
              <p className="text-xs text-white/40">Correct</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{accPct}%</div>
              <p className="text-xs text-white/40">Accuracy</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{maxStreak}</div>
              <p className="text-xs text-white/40">Best Streak</p>
            </div>
          </div>

          <div className="w-full bg-white/5 rounded-xl p-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/40">Difficulty Reached</span>
              <span className="font-bold" style={{ color: dl.color }}>{dl.emoji} {dl.label}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Grade Level</span>
              <span className="font-bold">{gradeInfo.label} · Lvl {Math.round(adaptive.level)}</span>
            </div>
          </div>

          {masteredSkills.length > 0 && (
            <div className="w-full bg-emerald-600/10 border border-emerald-500/20 rounded-xl p-3">
              <p className="text-xs font-bold text-emerald-400 mb-1">Skills Mastered</p>
              <div className="flex flex-wrap gap-1.5">
                {masteredSkills.map(s => <span key={s} className="text-xs bg-emerald-600/20 text-emerald-300 px-2 py-0.5 rounded">{SKILL_LABELS[s] || s}</span>)}
              </div>
            </div>
          )}

          {weakSkills.length > 0 && (
            <div className="w-full bg-amber-600/10 border border-amber-500/20 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-400 mb-1">Keep Practicing</p>
              <div className="flex flex-wrap gap-1.5">
                {weakSkills.map(s => <span key={s} className="text-xs bg-amber-600/20 text-amber-300 px-2 py-0.5 rounded">{SKILL_LABELS[s] || s}</span>)}
              </div>
            </div>
          )}

          <ScoreSubmit game={GAME_ID} score={score} level={Math.round(adaptive.level)}
            stats={{ streak: maxStreak, accuracy: accPct, graphs: total }} />

          {medals.length > 0 && (
            <AchievementToast name={medals[0].name} tier={medals[0].tier} onDismiss={() => setMedals([])} />
          )}

          <div className="flex gap-3 w-full">
            <button onClick={() => startGame(adaptive.level)}
              className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 transition flex items-center justify-center gap-2">
              <RotateCcw size={16} /> Play Again
            </button>
            <Link href="/games" className="flex-1 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition text-center">All Games</Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
