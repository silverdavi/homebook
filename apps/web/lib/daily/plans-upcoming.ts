import type { DayPlan } from "./types";

interface Copy {
  material: string;
  extraMaterials?: string[];
  fromDad?: string;
  deeper?: string;
  introduction: {
    newToday: string;
    buildsOn: string;
    whyItMatters: string;
  };
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
    materials: [copy.material, ...(copy.extraMaterials ?? []), "Pencil"],
    fromDad: copy.fromDad,
    finishedEarly: {
      deeper: copy.deeper,
      life: [
        "Shower and get dressed for the afternoon.",
        "Go outside for 20 minutes: walk, bike, or shoot hoops.",
        "Tidy your desk and put today's sheets in the folder.",
        "Make yourself lunch and clean up after.",
        "Read a paper book you choose.",
      ],
    },
    introduction: copy.introduction,
    blocks: [
      {
        kind: "work",
        time: "9:30–10:10",
        title: copy.learn.title,
        steps: [
          { minutes: 8, task: copy.learn.read, doneWhen: copy.learn.readDone },
          {
            minutes: 12,
            task: copy.learn.example,
            doneWhen: copy.learn.exampleDone,
          },
          {
            minutes: 15,
            task: copy.learn.practice,
            doneWhen: copy.learn.practiceDone,
          },
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
          {
            minutes: 20,
            task: copy.practice.finish,
            doneWhen: copy.practice.finishDone,
          },
          {
            minutes: 10,
            task: copy.practice.check,
            doneWhen: copy.practice.checkDone,
          },
          {
            minutes: 10,
            task: copy.practice.correct,
            doneWhen: copy.practice.correctDone,
          },
        ],
      },
      { kind: "break", time: "11:10–11:30", title: "Break. No phone." },
      {
        kind: "work",
        time: "11:30–12:10",
        title: copy.apply.title,
        steps: [
          {
            minutes: 10,
            task: copy.apply.review,
            doneWhen: copy.apply.reviewDone,
          },
          { minutes: 20, task: copy.apply.task, doneWhen: copy.apply.taskDone },
          {
            minutes: 10,
            task: copy.apply.explain,
            doneWhen: copy.apply.explainDone,
          },
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
    introduction: {
      newToday:
        "Percent is a new way to describe a part as an amount out of 100.",
      buildsOn: "Fractions, division, and the 10-times pattern.",
      whyItMatters:
        "Discounts, tips, taxes, polls, and statistics all use percentages.",
    },
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
      explain:
        "Write 2 sentences explaining discount amount versus final price.",
      explainDone: "Both quantities are distinguished clearly.",
    },
  }),
  "2026-10-19": fullDay({
    material: "Monday • Day 32 double-sided unit-rate sheet",
    introduction: {
      newToday: "A unit rate compares an amount to exactly 1 unit.",
      buildsOn:
        "Division and reading units such as miles, hours, dollars, and items.",
      whyItMatters: "Unit rates let you compare prices and speeds fairly.",
    },
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
    extraMaterials: ["World • Tuesday maps and flags sheet"],
    introduction: {
      newToday:
        "Geometry uses different measurements for a boundary, a flat surface, and space inside a box.",
      buildsOn:
        "Multiplication, addition, and recognizing rectangles and triangles.",
      whyItMatters:
        "Building, maps, rooms, screens, fabric, and storage all require the right measurement.",
    },
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
      title: "World: maps, flags, and power",
      review:
        "Read the World block below and locate Japan, Brazil, Canada, and South Africa on the printed map.",
      reviewDone: "All 4 countries and continents are labeled.",
      task: "Complete Tuesday's flags, hemispheres, and map-projection questions on the World sheet.",
      taskDone: "Every Tuesday World question has an answer.",
      explain:
        "Write who can gain or lose when a map or border is treated as neutral.",
      explainDone: "One complete sentence mentions people and power.",
    },
  }),
  "2026-10-21": fullDay({
    material: "Wednesday • Day 34 perimeter-and-area restart sheet and ruler",
    extraMaterials: ["World • Wednesday biomes and climate sheet"],
    introduction: {
      newToday:
        "Perimeter and area, slowly and from the beginning. Start with the “Around vs. inside” animation just below this schedule.",
      buildsOn:
        "Addition, multiplication, and recognizing the four sides of a rectangle.",
      whyItMatters:
        "Rooms, screens, fences, floors, maps, and building plans require the correct measurement.",
    },
    learn: {
      title: "See around versus inside",
      read: "Play all 3 steps of the “Around vs. inside” animation below, then read the short explanation under it.",
      readDone: "You can say perimeter means around and area means inside.",
      example:
        "Trace a 4-by-3 rectangle, then draw and count its 12 inside squares.",
      exampleDone: "The drawing shows perimeter 14 cm and area 12 cm².",
      practice:
        "Do only the 4 problems marked GUIDED on the sheet (1, 2, 7, 8).",
      practiceDone:
        "Each answer names perimeter or area and includes the correct unit.",
    },
    practice: {
      title: "Practice one idea at a time",
      finish:
        "Finish the perimeter section first; then finish the separate area section.",
      finishDone: "All 12 problems show work and use cm or cm² correctly.",
      check: "Check one section at a time with the answer side.",
      checkDone: "Every answer is marked right or circled without copying.",
      correct: "Redo each miss by drawing the edge or the inside squares.",
      correctDone: "Every miss has a corrected drawing, calculation, and unit.",
    },
    apply: {
      title: "World: biomes and climate justice",
      review:
        "Read the World block and underline one defining feature of tundra, desert, rainforest, and grassland.",
      reviewDone: "All 4 biomes have one correct feature.",
      task: "Complete Wednesday's biome and climate-justice questions on the World sheet.",
      taskDone: "Every Wednesday World question has an answer.",
      explain:
        "Write why climate harm and responsibility are not distributed equally.",
      explainDone:
        "One complete sentence connects emissions, power, and exposure.",
    },
  }),
  "2026-10-22": fullDay({
    deeper:
      "Read “Extra — if you finished early” at the bottom of the lesson: why the unit is g/cm³, and why ice floats.",
    material: "Thursday • Day 35 double-sided density sheet",
    extraMaterials: ["World • Thursday flags, borders, and migration sheet"],
    fromDad:
      "Today there are no questions or negotiations: not about the schedule, not about the end time, not about the work. Everything is written on this page. Read it and do exactly what it says, in order. School ends at 1:00, after the exam. The phone stays away until 1:30. If something is truly broken (the page won't load, or a question makes no sense), write it in the exam's note box. Do not message me about it.",
    introduction: {
      newToday:
        "Density measures the amount of mass packed into each unit of volume.",
      buildsOn:
        "Wednesday's area, multiplication, division, and reading measurement units.",
      whyItMatters:
        "Density helps explain why materials feel heavy and why some objects float.",
    },
    learn: {
      title: "Learn one density rule",
      read: "Read the density explanation and the worked mass-divided-by-volume example below.",
      readDone: "You can explain density as mass in each cm³.",
      example: "Copy and label the 24 g ÷ 6 cm³ example.",
      exampleDone:
        "The calculation ends with 4 g/cm³ and a written interpretation.",
      practice: "Do density questions 1–4 on the practice side.",
      practiceDone: "4 answers show division and include g/cm³.",
    },
    practice: {
      title: "Density first, then mass",
      finish:
        "Finish the remaining density problems, then use mass = density × volume.",
      finishDone: "All 12 answers show the operation and unit.",
      check:
        "Check whether each problem asks for density or mass before checking the arithmetic.",
      checkDone: "Every operation and unit is checked.",
      correct: "Redo each miss from the named rule at the top of its section.",
      correctDone:
        "Each missed problem has a corrected rule, calculation, and unit.",
    },
    apply: {
      title: "World: flags, borders, and migration",
      review:
        "Read the World block and identify the 4 flags on Thursday's World sheet.",
      reviewDone: "Ukraine, Israel, Palestine, and South Africa are labeled.",
      task: "Complete Thursday's state, nation, refugee, and border questions.",
      taskDone: "Every Thursday World question has an answer.",
      explain:
        "Write why studying migration requires listening to people, not only governments.",
      explainDone: "One complete sentence mentions lived experience.",
    },
  }),
  "2026-10-26": fullDay({
    material: "Monday • Day 36 double-sided units sheet",
    extraMaterials: ["World • Monday current-crises sheet"],
    deeper:
      "Read “Extra — only if you finished early” at the bottom of the lesson: converting units, why m² is 10,000 cm², and the NASA units mistake.",
    introduction: {
      newToday:
        "Units decide the math: when to multiply, when to divide, and when to flip. Start with the “Let the units decide” animation just below this schedule.",
      buildsOn:
        "Area in cm², density in g/cm³, and multiplying and dividing whole numbers.",
      whyItMatters:
        "Speed, prices, recipes, medicine doses, and science all depend on choosing the right operation.",
    },
    learn: {
      title: "See what units do",
      read: "Play all 3 steps of the “Let the units decide” animation, then read sections 1–4 below it.",
      readDone:
        "You can say: per means divide; multiply to use a per; divide by the rate to get the bottom unit.",
      example:
        "On the sheet, draw the 4 × 3 × 2 box as 2 layers of 12 cubes and write its volume.",
      exampleDone: "The drawing shows 24 cm³ with the units.",
      practice:
        "Do only the 4 problems marked GUIDED on the sheet (1, 3, 6, 9).",
      practiceDone:
        "Each answer has its unit, and you wrote which units cancelled.",
    },
    practice: {
      title: "Let the units choose",
      finish:
        "Finish the other 8 problems. For each one, write the unit you want BEFORE you calculate.",
      finishDone:
        "All 12 problems show the wanted unit, the operation, and the answer.",
      check: "Check with the answer side.",
      checkDone: "Every answer is marked right or circled without copying.",
      correct:
        "Redo each miss by writing the units out and crossing off the ones that cancel.",
      correctDone: "Every miss has crossed-off units and a corrected answer.",
    },
    apply: {
      title: "World: current crises",
      review:
        "Read the World block and find Ukraine, Sudan, Gaza, and Myanmar on a map.",
      reviewDone: "You can name the region of all 4 places without looking.",
      task: "Complete Monday's current-crises questions, separating place, cause, and civilian impact.",
      taskDone: "Every World question has an answer.",
      explain:
        "Write one way colonial rule shaped one of these conflicts today.",
      explainDone: "One complete sentence names a place and a colonial cause.",
    },
  }),
};
