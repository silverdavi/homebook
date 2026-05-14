import { describe, expect, it } from "vitest";
import {
  buildDigest,
  renderEmailHtml,
  renderExplanation,
  type Digest,
} from "@/lib/daily/summary";
import type { Day, ExamResult } from "@/lib/daily/types";
import type { Profile } from "@/lib/db";
import { gcfQ } from "@/lib/daily/content/banks/gcf";
import { fracAddQ } from "@/lib/daily/content/banks/frac-add";
import { periodicQ } from "@/lib/daily/content/banks/periodic";
import { warQ } from "@/lib/daily/content/banks/wars";
import { gradeExam } from "@/lib/daily/grading";

function makeProfile(): Profile {
  return {
    id: "test-profile",
    name: "Adam",
    avatarColor: "#6366f1",
    accessCode: "BLUE-FOX-99",
    createdAt: "2026-05-12 09:00:00",
    lastActiveAt: "2026-05-12 12:30:00",
  };
}

function makeDay(): Day {
  const versionA = [
    gcfQ("a-gcf-1", 12, 18),
    gcfQ("a-gcf-2", 8, 20),
    fracAddQ("a-add-1", [1, 2], [1, 4]),
    periodicQ("a-pt-1", "H", "P"),
    warQ("a-war-1", "wwii"),
  ];
  return {
    date: "2026-05-12",
    title: "Day 1 — Test",
    brief: "test brief",
    topics: ["GCF", "frac add", "H", "WWII"],
    versionA,
    versionB: [],
  };
}

function makeResult(day: Day): ExamResult {
  const startedAt = 1747049400000; // arbitrary
  const T = startedAt;
  const graded = gradeExam(day.versionA, [
    {
      questionId: "a-gcf-1",
      raw: { kind: "integer", value: 6 },
      note: "easy",
      usedHelp: false,
      firstInputAt: T + 5_000,
      lastInputAt: T + 15_000,
    },
    {
      questionId: "a-gcf-2",
      raw: { kind: "integer", value: 5 }, // wrong, correct=4
      note: "got confused",
      usedHelp: true,
      firstInputAt: T + 20_000,
      lastInputAt: T + 80_000,
    },
    {
      questionId: "a-add-1",
      raw: { kind: "fraction", num: 3, den: 4 },
      note: "",
      usedHelp: false,
      firstInputAt: T + 90_000,
      lastInputAt: T + 100_000,
    },
    {
      questionId: "a-pt-1",
      raw: { kind: "integer", value: 1 },
      note: "",
      usedHelp: false,
      firstInputAt: null,
      lastInputAt: null,
    },
    {
      questionId: "a-war-1",
      raw: { kind: "integer", value: null },
      note: "no idea",
      usedHelp: false,
      firstInputAt: null,
      lastInputAt: null,
    },
  ]).graded;

  return {
    date: day.date,
    version: "a",
    submittedAt: "2026-05-12 12:30:00",
    score: 3, // a-gcf-1, a-add-1, a-pt-1
    total: 5,
    startedAt,
    durationSec: 130,
    answers: graded,
  };
}

describe("summary digest", () => {
  it("aggregates per-kind correct/total/time", () => {
    const day = makeDay();
    const result = makeResult(day);
    const d = buildDigest({ profile: makeProfile(), day, result });
    expect(d.score).toBe(3);
    expect(d.total).toBe(5);
    expect(d.pct).toBe(60);
    expect(d.durationSec).toBe(130);
    expect(d.studentName).toBe("Adam");

    const gcfAgg = d.perKind.find((k) => k.kind === "gcf");
    expect(gcfAgg).toBeTruthy();
    expect(gcfAgg!.total).toBe(2);
    expect(gcfAgg!.correct).toBe(1);
    expect(gcfAgg!.totalSeconds).toBe(70); // 10 + 60

    expect(d.notesCount).toBe(3);
    expect(d.helpUsedCount).toBe(1);
    expect(d.blankCount).toBe(1); // war-1 is blank
  });

  it("renders prompts with the same shape as on screen", () => {
    const day = makeDay();
    const result = makeResult(day);
    const d = buildDigest({ profile: makeProfile(), day, result });
    expect(d.lines[0].prompt).toBe("GCF(12, 18)");
    expect(d.lines[2].prompt).toBe("1/2 + 1/4");
    expect(d.lines[3].prompt).toContain("protons in H");
    expect(d.lines[4].prompt).toContain("World War II");
  });
});

describe("summary html", () => {
  function digestForTest(): Digest {
    const day = makeDay();
    const result = makeResult(day);
    return buildDigest({ profile: makeProfile(), day, result });
  }

  it("renders required sections", () => {
    const d = digestForTest();
    const html = renderEmailHtml(d, "Bottom line: uneven day.\n\nSubject patterns: ...");
    expect(html).toContain("Daily homeschool trial");
    expect(html).toContain("Adam");
    expect(html).toContain("2026-05-12");
    expect(html).toContain("Day 1 — Test");
  });

  it("escapes HTML in prompts and notes", () => {
    const d = digestForTest();
    // Inject a note with markup
    const dWithMarkup: Digest = {
      ...d,
      lines: d.lines.map((l, i) =>
        i === 0
          ? { ...l, note: '<script>alert("x")</script> & "quoted"' }
          : l,
      ),
    };
    const html = renderEmailHtml(dWithMarkup, "narrative");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
    expect(html).toContain("&quot;quoted&quot;");
  });

  it("renders narrative paragraphs without raw newlines bleeding", () => {
    const d = digestForTest();
    const html = renderEmailHtml(d, "Para one.\n\nPara two with *star*.\nNew line.");
    expect(html).toMatch(/<p[^>]*>Para one\.<\/p>/);
    expect(html).toMatch(/Para two with \*star\*\.<br \/>New line\./);
  });

  it("uses red header color for low scores", () => {
    const d = digestForTest();
    const lowD: Digest = { ...d, score: 1, pct: 20 };
    expect(renderEmailHtml(lowD, "narr")).toContain("#dc2626");
    const midD: Digest = { ...d, score: 4, pct: 70 };
    expect(renderEmailHtml(midD, "narr")).toContain("#d97706");
    const highD: Digest = { ...d, score: 5, pct: 100 };
    expect(renderEmailHtml(highD, "narr")).toContain("#059669");
  });
});

describe("explanations", () => {
  it("walks through GCF as factor lists with the largest common", () => {
    const q = gcfQ("e-1", 12, 18);
    const text = renderExplanation(q);
    expect(text).toContain("Factors of 12: 1, 2, 3, 4, 6, 12");
    expect(text).toContain("Factors of 18: 1, 2, 3, 6, 9, 18");
    expect(text).toMatch(/GCF: 6/);
  });

  it("walks through fraction add as LCM + rewrite + sum", () => {
    const q = fracAddQ("e-2", [1, 3], [1, 4]);
    const text = renderExplanation(q);
    expect(text).toContain("LCM(3, 4) = 12");
    expect(text).toContain("4/12");
    expect(text).toContain("3/12");
    expect(text).toContain("7/12");
  });

  it("calls out same-denominator fraction add explicitly", () => {
    const q = fracAddQ("e-3", [3, 7], [2, 7]);
    const text = renderExplanation(q);
    expect(text.toLowerCase()).toContain("same denominator");
    expect(text).toContain("5/7");
  });

  it("explains periodic table answers in plain English", () => {
    const q = periodicQ("e-4", "C", "P");
    const text = renderExplanation(q);
    expect(text).toContain("Carbon");
    expect(text).toContain("6 protons");
  });

  it("attaches an explanation to every line in the digest", () => {
    const day = makeDay();
    const result = makeResult(day);
    const d = buildDigest({ profile: makeProfile(), day, result });
    for (const l of d.lines) {
      expect(typeof l.explanation).toBe("string");
      expect(l.explanation.length).toBeGreaterThan(0);
    }
  });

  it("renders the explanation block in the email html", () => {
    const day = makeDay();
    const result = makeResult(day);
    const d = buildDigest({ profile: makeProfile(), day, result });
    const html = renderEmailHtml(d, "narr");
    expect(html.toLowerCase()).toContain("here's the correct path");
    expect(html.toLowerCase()).toContain("how it works");
  });
});

describe("grading: timing fields", () => {
  it("computes secondsSpent from first/last input timestamps", () => {
    const day = makeDay();
    const T = 1700000000000;
    const { graded } = gradeExam(day.versionA, [
      {
        questionId: "a-gcf-1",
        raw: { kind: "integer", value: 6 },
        note: "",
        usedHelp: false,
        firstInputAt: T,
        lastInputAt: T + 12_000,
      },
    ]);
    expect(graded[0].secondsSpent).toBe(12);
  });

  it("treats untouched answers as 0 seconds", () => {
    const day = makeDay();
    const { graded } = gradeExam([day.versionA[0]], []);
    expect(graded[0].secondsSpent).toBe(0);
    expect(graded[0].correct).toBe(false);
  });
});
