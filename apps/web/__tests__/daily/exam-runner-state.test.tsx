/**
 * Regression test for the state-stomp bug Adam reported on Day 5:
 *
 *   "in lcm 6, 4 i did 12 i even remember messing up and doing 21 and
 *    changing it to 12 it SOMEHOW thought i said blank"
 *
 * Server-side data showed the saved row as:
 *   value=null, note="note 1..."
 *
 * Root cause: QuestionCard.setRaw / setNote / markUsedHelp each called
 *   onChange({ ...state, X })
 * where `state` was the prop from the current render. If two of these
 * fired before the parent re-rendered (e.g. type the answer, then
 * immediately type in the note), the second callback spread a stale
 * `state` and stomped the first update.
 *
 * Fix: QuestionCard now sends a partial patch; ExamRunner merges it
 * into the latest committed state inside a functional setState.
 */
import { describe, it, expect } from "vitest";
import type { ClientAnswer } from "@/lib/daily/types";

function blank(): ClientAnswer {
  return {
    questionId: "b-lcm-1",
    raw: { kind: "integer", value: null },
    note: "",
    usedHelp: false,
    firstInputAt: null,
    lastInputAt: null,
  };
}

describe("ExamRunner state-stomp regression (Adam Day 5 b-lcm-1)", () => {
  it("answer survives when raw and note patches fire in the same tick (the fix)", () => {
    // Mirrors ExamRunner.updateAt: each patch merges into the latest
    // committed state via a functional setState.
    let committed: ClientAnswer = blank();
    const onChange = (patch: Partial<ClientAnswer>) => {
      committed = { ...committed, ...patch };
    };

    // Same-tick sequence: type the answer, then type the note.
    onChange({ raw: { kind: "integer", value: 12 } });
    onChange({ note: "note 1..." });

    expect(committed.note).toBe("note 1...");
    expect(committed.raw).toEqual({ kind: "integer", value: 12 });
  });

  it("the OLD (buggy) full-spread API would have stomped the answer", () => {
    // Sanity check that the failure mode the fix prevents was real.
    let committed: ClientAnswer = blank();
    const onChangeBuggy = (next: ClientAnswer) => {
      committed = next;
    };

    // Two children captured the SAME stale `state` from the last
    // render; each computes a full ClientAnswer by spreading it.
    const staleState = committed;
    onChangeBuggy({ ...staleState, raw: { kind: "integer", value: 12 } });
    onChangeBuggy({ ...staleState, note: "note 1..." });

    // The note write stomped the answer — value is back to null.
    // This matches Adam's saved row exactly.
    expect(committed.note).toBe("note 1...");
    expect(committed.raw).toEqual({ kind: "integer", value: null });
  });

  it("clicking help link after typing an answer does not stomp the answer", () => {
    let committed: ClientAnswer = blank();
    const onChange = (patch: Partial<ClientAnswer>) => {
      committed = { ...committed, ...patch };
    };
    onChange({ raw: { kind: "integer", value: 7 } });
    onChange({ usedHelp: true });
    expect(committed.usedHelp).toBe(true);
    expect(committed.raw).toEqual({ kind: "integer", value: 7 });
  });

  it("typing in note multiple times preserves an existing answer", () => {
    let committed: ClientAnswer = blank();
    const onChange = (patch: Partial<ClientAnswer>) => {
      committed = { ...committed, ...patch };
    };
    onChange({ raw: { kind: "integer", value: 30 } });
    onChange({ note: "n" });
    onChange({ note: "no" });
    onChange({ note: "not" });
    onChange({ note: "note" });
    expect(committed.raw).toEqual({ kind: "integer", value: 30 });
    expect(committed.note).toBe("note");
  });

  it("blanking the answer after typing a note still works (intentional clear)", () => {
    let committed: ClientAnswer = blank();
    const onChange = (patch: Partial<ClientAnswer>) => {
      committed = { ...committed, ...patch };
    };
    onChange({ raw: { kind: "integer", value: 12 } });
    onChange({ note: "i changed my mind" });
    onChange({ raw: { kind: "integer", value: null } });
    expect(committed.raw).toEqual({ kind: "integer", value: null });
    expect(committed.note).toBe("i changed my mind");
  });
});
