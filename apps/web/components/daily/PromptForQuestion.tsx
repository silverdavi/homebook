import type { Question } from "@/lib/daily/types";
import { fmtFrac } from "@/lib/daily/math";

const KIND_VERB: Record<string, string> = {
  fracAdd: "+",
  fracSub: "−",
  fracMul: "×",
  fracDiv: "÷",
};

/**
 * Render the actual problem text for a question. Pure presentation,
 * shared by the exam runner and the results review.
 */
export function PromptForQuestion({ question }: { question: Question }) {
  switch (question.kind) {
    case "gcf":
    case "lcm":
      return (
        <span>
          <span className="font-mono">{question.kind === "gcf" ? "GCF" : "LCM"}</span>
          (<span className="font-mono">{question.a}</span>,{" "}
          <span className="font-mono">{question.b}</span>) ={" "}
          <span className="text-slate-400">?</span>
        </span>
      );
    case "fracAdd":
    case "fracSub":
    case "fracMul":
    case "fracDiv":
      return (
        <span className="font-mono">
          {fmtFrac(question.x)} {KIND_VERB[question.kind]} {fmtFrac(question.y)} ={" "}
          <span className="text-slate-400">?</span>
        </span>
      );
    case "fracInverse": {
      const v = typeof question.value === "number"
        ? `${question.value}`
        : fmtFrac(question.value);
      return (
        <span>
          Inverse of <span className="font-mono font-semibold">{v}</span> ={" "}
          <span className="text-slate-400">?</span>
        </span>
      );
    }
    case "mult":
      return (
        <span className="font-mono">
          {question.a} × {question.b} ={" "}
          <span className="text-slate-400">?</span>
        </span>
      );
    case "periodic": {
      const askLabel =
        question.ask === "P"
          ? "protons"
          : question.ask === "N"
            ? "neutrons"
            : question.ask === "e"
              ? "electrons"
              : "valence electrons";
      return (
        <span>
          How many <span className="font-semibold">{askLabel}</span> in{" "}
          <span className="font-mono font-semibold">{question.symbol}</span>{" "}
          <span className="text-slate-500">({question.elementName})</span>?
        </span>
      );
    }
    case "war":
      return (
        <span>
          What year did the{" "}
          <span className="font-semibold">{question.name}</span> start?
        </span>
      );
    case "peace":
      return (
        <span>
          What year was the{" "}
          <span className="font-semibold">{question.name}</span> signed?
        </span>
      );
    case "evolution":
      return (
        <span>
          About how many <span className="font-semibold">million years ago</span>{" "}
          did this happen:{" "}
          <span className="font-semibold">{question.event}</span>?
        </span>
      );
  }
}
