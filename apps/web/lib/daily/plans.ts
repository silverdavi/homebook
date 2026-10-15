import type { DayPlan } from "./types";

const SCHOOL_DEVICE_RULE =
  "Phone away. Computer only for teacher.ninja and the lesson links on this page.";

const plans: Record<string, DayPlan> = {
  "2026-10-06": {
    startTime: "10:10",
    scheduledEndTime: "12:40",
    phoneUntil: "1:10",
    deviceRule: SCHOOL_DEVICE_RULE,
    materials: [
      "Tuesday • Day 26 double-sided valence sheet",
      "Pencil",
    ],
    blocks: [
      {
        kind: "work",
        time: "10:10–10:50",
        title: "Learn the column pattern",
        steps: [
          {
            minutes: 7,
            task: "Read the valence explanation and table below.",
            doneWhen: "You can say what valence means without looking.",
          },
          {
            minutes: 13,
            task: "Study the filled side of the printed sheet, then turn it face down.",
            doneWhen: "You can write the pattern 1 through 8.",
          },
          {
            minutes: 15,
            task: "Answer the first 4 elements on the practice side.",
            doneWhen: "4 answers are written.",
          },
          {
            minutes: 5,
            task: "Turn the sheet over, check, and circle anything wrong.",
            doneWhen: "Every answer is checked.",
          },
        ],
      },
      { kind: "break", time: "10:50–11:10", title: "Break. No phone." },
      {
        kind: "work",
        time: "11:10–11:50",
        title: "Finish and correct",
        steps: [
          {
            minutes: 20,
            task: "Do the last 4 elements with the filled side down.",
            doneWhen: "All 8 answers are written.",
          },
          {
            minutes: 10,
            task: "Check every answer and rewrite each miss once.",
            doneWhen: "There are no unchecked answers.",
          },
          {
            minutes: 10,
            task: "Mix the elements and say each valence number aloud.",
            doneWhen: "You get 8 in a row without looking.",
          },
        ],
      },
      { kind: "break", time: "11:50–12:10", title: "Break. No phone." },
      {
        kind: "exam",
        time: "12:10–12:40",
        title: "Exam A or B",
        expectedMinutes: 10,
        maxMinutes: 30,
        instruction:
          "Put the sheet away. Submit when you finish; do not sit until 12:40.",
      },
    ],
  },
  "2026-10-07": {
    startTime: "9:30",
    scheduledEndTime: "1:00",
    phoneUntil: "1:30",
    deviceRule: SCHOOL_DEVICE_RULE,
    materials: [
      "Wednesday • Day 27 double-sided multiplication sheet",
      "Pencil",
    ],
    blocks: [
      {
        kind: "work",
        time: "9:30–10:10",
        title: "Learn the split",
        steps: [
          {
            minutes: 6,
            task: "Read the worked 24 × 13 example below.",
            doneWhen: "You can name its 2 partial products.",
          },
          {
            minutes: 9,
            task: "Copy the example once, including the final addition.",
            doneWhen: "The full 4-line solution is written.",
          },
          {
            minutes: 20,
            task: "Solve the first 4 problems on the practice side.",
            doneWhen: "Each problem shows both pieces and the sum.",
          },
          {
            minutes: 5,
            task: "Check those 4 against the filled side.",
            doneWhen: "Misses are circled.",
          },
        ],
      },
      { kind: "break", time: "10:10–10:30", title: "Break. No phone." },
      {
        kind: "work",
        time: "10:30–11:10",
        title: "Finish the sheet",
        steps: [
          {
            minutes: 25,
            task: "Solve the last 4 problems with the filled side down.",
            doneWhen: "All 8 problems have a final sum.",
          },
          {
            minutes: 10,
            task: "Check every answer.",
            doneWhen: "All 8 are marked right or corrected.",
          },
          {
            minutes: 5,
            task: "Rewrite the hardest missed problem.",
            doneWhen: "One clean corrected solution is written.",
          },
        ],
      },
      { kind: "break", time: "11:10–11:30", title: "Break. No phone." },
      {
        kind: "work",
        time: "11:30–12:10",
        title: "Make it automatic",
        steps: [
          {
            minutes: 15,
            task: "Choose 3 sheet problems and solve them again without answers.",
            doneWhen: "3 complete solutions are written.",
          },
          {
            minutes: 15,
            task: "Make 3 new two-digit multiplication problems and solve them.",
            doneWhen: "3 new problems include pieces and final sums.",
          },
          {
            minutes: 10,
            task: "Check the arithmetic with a calculator, then put the sheet away.",
            doneWhen: "Any calculator disagreement is corrected.",
          },
        ],
      },
      { kind: "break", time: "12:10–12:30", title: "Break. No phone." },
      {
        kind: "exam",
        time: "12:30–1:00",
        title: "Exam A or B",
        expectedMinutes: 12,
        maxMinutes: 30,
        instruction:
          "Submit when you finish. The window is 30 minutes; it is not 30 minutes of required sitting.",
      },
    ],
  },
  "2026-10-08": {
    startTime: "9:30",
    scheduledEndTime: "1:00",
    phoneUntil: "1:30",
    deviceRule: SCHOOL_DEVICE_RULE,
    materials: [
      "Thursday • Day 28 double-sided timeline sheet",
      "Pencil",
    ],
    blocks: [
      {
        kind: "work",
        time: "9:30–10:10",
        title: "Build the long line",
        steps: [
          {
            minutes: 8,
            task: "Read the timeline below from oldest to newest.",
            doneWhen: "You can name the first and last events.",
          },
          {
            minutes: 17,
            task: "Study the filled side of the printed sheet.",
            doneWhen: "You can place life, fish, dinosaurs, and humans in order.",
          },
          {
            minutes: 10,
            task: "Turn it over and write the first 4 dates.",
            doneWhen: "4 dates are written.",
          },
          {
            minutes: 5,
            task: "Check the 4 dates.",
            doneWhen: "Misses are circled.",
          },
        ],
      },
      { kind: "break", time: "10:10–10:30", title: "Break. No phone." },
      {
        kind: "work",
        time: "10:30–11:10",
        title: "Finish and correct",
        steps: [
          {
            minutes: 20,
            task: "Write the remaining 4 dates with the filled side down.",
            doneWhen: "All practice dates are written.",
          },
          {
            minutes: 10,
            task: "Check and rewrite each miss.",
            doneWhen: "All answers are checked.",
          },
          {
            minutes: 10,
            task: "Draw one line and place all 11 events in order without dates.",
            doneWhen: "No event is out of order.",
          },
        ],
      },
      { kind: "break", time: "11:10–11:30", title: "Break. No phone." },
      {
        kind: "work",
        time: "11:30–12:10",
        title: "Keep yesterday alive",
        steps: [
          {
            minutes: 20,
            task: "Solve 4 new two-digit multiplication problems using the split.",
            doneWhen: "4 problems show pieces and final sums.",
          },
          {
            minutes: 10,
            task: "Cover the timeline and say the anchor dates aloud.",
            doneWhen: "You get Big Bang, Earth, life, fish, dinosaurs, asteroid, and humans.",
          },
          {
            minutes: 10,
            task: "Check the 4 multiplication answers with a calculator.",
            doneWhen: "All 4 are checked and corrected.",
          },
        ],
      },
      { kind: "break", time: "12:10–12:30", title: "Break. No phone." },
      {
        kind: "exam",
        time: "12:30–1:00",
        title: "Exam A or B",
        expectedMinutes: 12,
        maxMinutes: 30,
        instruction:
          "Put the sheet away. Submit when you finish; there is no reason to wait for 1:00.",
      },
    ],
  },
  "2026-10-09": {
    startTime: "9:30",
    scheduledEndTime: "1:00",
    phoneUntil: "1:30",
    deviceRule: SCHOOL_DEVICE_RULE,
    materials: [
      "Friday • Day 29 double-sided LCM sheet",
      "Pencil",
    ],
    blocks: [
      {
        kind: "work",
        time: "9:30–10:10",
        title: "Find the first shared number",
        steps: [
          {
            minutes: 7,
            task: "Read the 3 LCM examples below.",
            doneWhen: "You can explain why 4 and 6 meet at 12.",
          },
          {
            minutes: 13,
            task: "Study the filled side, then turn it face down.",
            doneWhen: "You know what to list for each number.",
          },
          {
            minutes: 15,
            task: "Do the first 3 problems on the practice side.",
            doneWhen: "3 pairs have multiples and an answer.",
          },
          {
            minutes: 5,
            task: "Check those 3.",
            doneWhen: "Misses are circled.",
          },
        ],
      },
      { kind: "break", time: "10:10–10:30", title: "Break. No phone." },
      {
        kind: "work",
        time: "10:30–11:10",
        title: "Finish the sheet",
        steps: [
          {
            minutes: 20,
            task: "Do the last 3 practice pairs.",
            doneWhen: "All 6 answers are written.",
          },
          {
            minutes: 10,
            task: "Check every answer.",
            doneWhen: "All 6 are marked right or corrected.",
          },
          {
            minutes: 10,
            task: "Redo each miss without looking.",
            doneWhen: "Every missed pair is now correct.",
          },
        ],
      },
      { kind: "break", time: "11:10–11:30", title: "Break. No phone." },
      {
        kind: "work",
        time: "11:30–12:10",
        title: "Use LCM for fractions",
        steps: [
          {
            minutes: 15,
            task: "Find the LCM of the denominators in 1/4 + 1/6, 1/3 + 1/5, and 1/6 + 1/8.",
            doneWhen: "3 common denominators are written.",
          },
          {
            minutes: 15,
            task: "Convert and add those 3 fraction pairs.",
            doneWhen: "3 fraction answers are in lowest terms.",
          },
          {
            minutes: 10,
            task: "Check with the fraction lesson, then put the sheet away.",
            doneWhen: "All 3 are checked and corrected.",
          },
        ],
      },
      { kind: "break", time: "12:10–12:30", title: "Break. No phone." },
      {
        kind: "exam",
        time: "12:30–1:00",
        title: "Exam A or B",
        expectedMinutes: 12,
        maxMinutes: 30,
        instruction:
          "Submit when you finish. The exam window is a ceiling, not a target.",
      },
    ],
  },
  "2026-10-15": {
    startTime: "10:10",
    scheduledEndTime: "1:40",
    phoneUntil: "1:40",
    deviceRule: SCHOOL_DEVICE_RULE,
    materials: [
      "Thursday • Day 30 double-sided estimate-and-mass sheet",
      "Pencil",
    ],
    blocks: [
      {
        kind: "work",
        time: "10:10–10:50",
        title: "Estimate, then calculate",
        steps: [
          {
            minutes: 8,
            task: "Read the estimate-first explanation and the 47 × 6 example below.",
            doneWhen: "You can explain why 282 is believable.",
          },
          {
            minutes: 12,
            task: "Copy the example with an estimate, exact work, and check.",
            doneWhen: "All 3 lines are written.",
          },
          {
            minutes: 15,
            task: "Do the first 4 multiplication rows on the printed sheet.",
            doneWhen: "Each row has an estimate and exact answer.",
          },
          {
            minutes: 5,
            task: "Turn to the answer side and check those 4 rows.",
            doneWhen: "Every miss is circled.",
          },
        ],
      },
      { kind: "break", time: "10:50–11:10", title: "Break. No phone." },
      {
        kind: "work",
        time: "11:10–11:50",
        title: "Finish and use the estimate",
        steps: [
          {
            minutes: 20,
            task: "Finish the last 4 multiplication rows with the answers face down.",
            doneWhen: "All 8 rows have estimates and exact answers.",
          },
          {
            minutes: 10,
            task: "Check every exact answer and correct each miss.",
            doneWhen: "All 8 rows are checked.",
          },
          {
            minutes: 10,
            task: "For each answer, mark whether it is reasonably close to its estimate.",
            doneWhen: "All 8 rows are marked reasonable or corrected.",
          },
        ],
      },
      { kind: "break", time: "11:50–12:10", title: "Break. No phone." },
      {
        kind: "work",
        time: "12:10–12:50",
        title: "Build atomic mass",
        steps: [
          {
            minutes: 8,
            task: "Read the mass-number explanation below.",
            doneWhen: "You can state the mass-number rule without looking.",
          },
          {
            minutes: 12,
            task: "Study the 4 atom examples on the sheet, then cover the answer side.",
            doneWhen: "You know which 2 particle counts are added.",
          },
          {
            minutes: 15,
            task: "Complete the 6 atom rows on the practice side.",
            doneWhen: "Every row has protons, neutrons, and mass number.",
          },
          {
            minutes: 5,
            task: "Check all 6 rows and put the sheet away.",
            doneWhen: "Every row is correct and the sheet is away.",
          },
        ],
      },
      { kind: "break", time: "12:50–1:10", title: "Break. No phone." },
      {
        kind: "exam",
        time: "1:10–1:40",
        title: "Exam A or B",
        expectedMinutes: 12,
        maxMinutes: 30,
        instruction:
          "Submit when you finish. The 30-minute window is not required sitting time.",
      },
    ],
  },
};

export function getDayPlan(date: string): DayPlan | null {
  return plans[date] ?? null;
}

