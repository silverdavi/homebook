import type { DayPlan } from "./types";

interface Copy {
  material: string;
  learn: {
    title: string;
    read: string;
    readDone: string;
    example: string;
    exampleDone: string;
    practice: string;
    practiceDone: string;
  };
  practice: {
    title: string;
    finish: string;
    finishDone: string;
    check: string;
    checkDone: string;
    correct: string;
    correctDone: string;
  };
  apply: {
    title: string;
    review: string;
    reviewDone: string;
    task: string;
    taskDone: string;
    explain: string;
    explainDone: string;
  };
}

function fullDay(copy: Copy): DayPlan {
  return {
    startTime: "9:30",
    scheduledEndTime: "1:00",
    phoneUntil: "1:30",
    deviceRule:
      "Phone away. Computer only for teacher.ninja and the lesson links on this page.",
    materials: [copy.material, "Pencil"],
    blocks: [
      {
        kind: "work",
        time: "9:30–10:10",
        title: copy.learn.title,
        steps: [
          { minutes: 8, task: copy.learn.read, doneWhen: copy.learn.readDone },
          { minutes: 12, task: copy.learn.example, doneWhen: copy.learn.exampleDone },
          { minutes: 15, task: copy.learn.practice, doneWhen: copy.learn.practiceDone },
          {
            minutes: 5,
            task: "Check that work with the answer side.",
            doneWhen: "Every checked answer is marked right or circled.",
          },
        ],
      },
      { kind: "break", time: "10:10–10:30", title: "Break. No phone." },
      {
        kind: "work",
        time: "10:30–11:10",
        title: copy.practice.title,
        steps: [
          { minutes: 20, task: copy.practice.finish, doneWhen: copy.practice.finishDone },
          { minutes: 10, task: copy.practice.check, doneWhen: copy.practice.checkDone },
          { minutes: 10, task: copy.practice.correct, doneWhen: copy.practice.correctDone },
        ],
      },
      { kind: "break", time: "11:10–11:30", title: "Break. No phone." },
      {
        kind: "work",
        time: "11:30–12:10",
        title: copy.apply.title,
        steps: [
          { minutes: 10, task: copy.apply.review, doneWhen: copy.apply.reviewDone },
          { minutes: 20, task: copy.apply.task, doneWhen: copy.apply.taskDone },
          { minutes: 10, task: copy.apply.explain, doneWhen: copy.apply.explainDone },
        ],
      },
      { kind: "break", time: "12:10–12:30", title: "Break. No phone." },
      {
        kind: "exam",
        time: "12:30–1:00",
        title: "Exam A or B",
        expectedMinutes: 15,
        maxMinutes: 30,
        instruction:
          "Put the sheet away and submit when finished. The window is not required sitting time.",
      },
    ],
  };
}

export const UPCOMING_PLANS: Record<string, DayPlan> = {
  "2026-10-16": fullDay({
    material: "Friday • Day 31 double-sided percentages sheet",
    learn: {
      title: "Build percent anchors",
      read: "Read the percentage explanation and 2 worked examples below.",
      readDone: "You can explain 50%, 25%, 10%, and 5% without looking.",
      example: "Copy the 25% and 15% examples, showing each step.",
      exampleDone: "2 complete examples are written.",
      practice: "Do questions 1–4 on the practice side.",
      practiceDone: "4 answers include their calculation.",
    },
    practice: {
      title: "Discounts and tips",
      finish: "Finish questions 5–10 with the answer side down.",
      finishDone: "All 10 practice questions have answers.",
      check: "Check every answer and circle each miss.",
      checkDone: "All 10 answers are checked.",
      correct: "Redo each miss without copying the answer.",
      correctDone: "Every circled answer has a corrected calculation.",
    },
    apply: {
      title: "Use percentages on prices",
      review: "Cover the sheet and write the 50%, 25%, 10%, and 5% shortcuts.",
      reviewDone: "All 4 shortcuts are written correctly.",
      task: "Create 4 price tags and calculate a different discount on each.",
      taskDone: "4 original prices, discounts, and final prices are written.",
      explain: "Write 2 sentences explaining discount amount versus final price.",
      explainDone: "Both quantities are distinguished clearly.",
    },
  }),
  "2026-10-19": fullDay({
    material: "Monday • Day 32 double-sided unit-rate sheet",
    learn: {
      title: "Make the denominator 1",
      read: "Read the unit-rate explanation and both examples below.",
      readDone: "You can explain why the word per means divide.",
      example: "Copy the miles-per-hour and price-per-notebook examples.",
      exampleDone: "Both divisions and units are written.",
      practice: "Do questions 1–4 on the practice side.",
      practiceDone: "4 answers include a number and unit.",
    },
    practice: {
      title: "Compare equal amounts",
      finish: "Finish questions 5–10 with the answers face down.",
      finishDone: "All 10 unit rates are written.",
      check: "Check the arithmetic and units.",
      checkDone: "Every number and unit is checked.",
      correct: "Redo each miss and underline the word per.",
      correctDone: "Every missed rate is corrected.",
    },
    apply: {
      title: "Choose the better buy",
      review: "Write the rule total ÷ count = amount per 1.",
      reviewDone: "The rule and 2 example units are written.",
      task: "Use the 4 store pairs on the sheet to find each unit price and choose the cheaper one.",
      taskDone: "4 choices are supported by 8 unit prices.",
      explain: "Write why the lower total price is not always the better buy.",
      explainDone: "One complete explanation is written.",
    },
  }),
  "2026-10-20": fullDay({
    material: "Tuesday • Day 33 double-sided geometry sheet and ruler",
    learn: {
      title: "Around, across, and inside",
      read: "Read the perimeter, area, triangle, and volume examples below.",
      readDone: "You can match cm, cm², and cm³ to the right measurement.",
      example: "Copy one perimeter, one area, and one volume formula.",
      exampleDone: "3 labeled formulas are written.",
      practice: "Do geometry questions 1–4 on the practice side.",
      practiceDone: "4 answers include units.",
    },
    practice: {
      title: "Choose the formula",
      finish: "Finish geometry questions 5–10.",
      finishDone: "All 10 answers have work and units.",
      check: "Check the answer side, including units.",
      checkDone: "All 10 are marked right or circled.",
      correct: "Redo each miss and write which formula it uses.",
      correctDone: "Every miss has a corrected formula and answer.",
    },
    apply: {
      title: "Measure real objects",
      review: "Write the formulas from memory.",
      reviewDone: "Rectangle perimeter, rectangle area, triangle area, and box volume are present.",
      task: "Measure 2 rectangular objects and calculate both perimeter and area.",
      taskDone: "2 measurements produce 4 labeled answers.",
      explain: "Write why area uses square units while perimeter does not.",
      explainDone: "One clear sentence uses boundary and surface.",
    },
  }),
  "2026-10-21": fullDay({
    material: "Wednesday • Day 34 double-sided density sheet",
    learn: {
      title: "Pack mass into volume",
      read: "Read the density, mass, and volume examples below.",
      readDone: "You can state all 3 rearranged rules.",
      example: "Copy one example for density, mass, and volume.",
      exampleDone: "3 equations with units are written.",
      practice: "Do density questions 1–4 on the practice side.",
      practiceDone: "4 answers include the correct units.",
    },
    practice: {
      title: "Find the missing quantity",
      finish: "Finish questions 5–10 with the answers face down.",
      finishDone: "All 10 missing quantities are calculated.",
      check: "Check the operation and unit for every answer.",
      checkDone: "All 10 are checked.",
      correct: "Redo each miss from the written rule.",
      correctDone: "Each missed problem is corrected.",
    },
    apply: {
      title: "Compare materials",
      review: "Write density = mass ÷ volume and its unit.",
      reviewDone: "The equation and g/cm³ are written.",
      task: "Calculate the density of 4 sample blocks on the sheet and rank them.",
      taskDone: "4 densities and a least-to-most ranking are written.",
      explain: "Write what a larger density means physically.",
      explainDone: "One sentence mentions more mass in the same space.",
    },
  }),
  "2026-10-22": fullDay({
    material: "Thursday • Day 35 double-sided integers sheet",
    learn: {
      title: "Move on the number line",
      read: "Read the integer and temperature examples below.",
      readDone: "You can explain adding as right and subtracting as left.",
      example: "Draw a number line from −15 to 15 and copy 2 examples.",
      exampleDone: "The line and both moves are shown.",
      practice: "Do integer questions 1–5 on the practice side.",
      practiceDone: "5 signed answers are written.",
    },
    practice: {
      title: "Keep the minus sign",
      finish: "Finish questions 6–12 with the answers face down.",
      finishDone: "All 12 integer answers are written.",
      check: "Check each move on the number line.",
      checkDone: "Every answer is marked right or circled.",
      correct: "Redo each miss by drawing its start and movement.",
      correctDone: "Every miss has a corrected number-line move.",
    },
    apply: {
      title: "Track temperature",
      review: "Write one rule for rise and one for fall.",
      reviewDone: "Both rules include the correct operation.",
      task: "Complete the 6-temperature weather log on the sheet.",
      taskDone: "All 6 new temperatures include signs.",
      explain: "Write why −8 is colder than −3.",
      explainDone: "One sentence refers to position left of zero.",
    },
  }),
  "2026-10-23": fullDay({
    material: "Friday • Day 36 double-sided data sheet",
    learn: {
      title: "Center and spread",
      read: "Read the mean, median, and range examples below.",
      readDone: "You can state the procedure for all 3.",
      example: "Copy the worked data set and calculate all 3 measures.",
      exampleDone: "Mean, median, and range are labeled.",
      practice: "Do data sets 1–3 on the practice side.",
      practiceDone: "Each set has 3 labeled answers.",
    },
    practice: {
      title: "Do not mix the measures",
      finish: "Finish data sets 4–6 with the answers face down.",
      finishDone: "All 6 sets have mean, median, and range.",
      check: "Check each sum, ordered list, and subtraction.",
      checkDone: "All 18 results are checked.",
      correct: "Redo each miss using the named procedure.",
      correctDone: "Every miss has corrected work.",
    },
    apply: {
      title: "Describe a week",
      review: "Write the 3 procedures from memory.",
      reviewDone: "Mean, median, and range each have a distinct rule.",
      task: "Use the 7-day data set on the sheet to calculate all 3 measures and draw a bar graph.",
      taskDone: "3 measures and 7 bars are complete.",
      explain: "Write which measure best describes the typical day and why.",
      explainDone: "One choice is supported by the data.",
    },
  }),
};
