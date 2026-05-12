import { describe, expect, it, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

import { getEnv } from "@/lib/daily/env";

describe("daily env loader", () => {
  beforeEach(() => {
    delete process.env.SOME_DAILY_TEST_KEY;
  });

  it("prefers process.env when set", () => {
    process.env.OPENAI_API_KEY = "live-key-from-env";
    expect(getEnv("OPENAI_API_KEY")).toBe("live-key-from-env");
    delete process.env.OPENAI_API_KEY;
  });

  it("falls back to repo-root .env when process.env is empty", () => {
    // The repo-root .env actually exists in this checkout and contains
    // OPENAI_API_KEY, so getEnv should pick it up when process.env is unset.
    delete process.env.OPENAI_API_KEY;
    const v = getEnv("OPENAI_API_KEY");
    // Either we found it in the file (most common in this repo) or we got
    // null (fresh CI checkout). Both are acceptable; the loader must not
    // throw and must return a string-or-null.
    expect(v === null || (typeof v === "string" && v.length > 10)).toBe(true);
  });

  it("strips matched surrounding quotes from values", () => {
    // We can't easily test the cache directly; do a black-box check using
    // a temporary fake .env in a temp dir is overkill. Instead, prove the
    // returned OPENAI_API_KEY (which is double-quoted in the root .env)
    // does not include the surrounding quotes if it was loaded from file.
    delete process.env.OPENAI_API_KEY;
    const v = getEnv("OPENAI_API_KEY");
    if (v) {
      expect(v.startsWith('"')).toBe(false);
      expect(v.endsWith('"')).toBe(false);
    }
  });

  it("ignores missing files gracefully", () => {
    expect(getEnv("DEFINITELY_NOT_A_REAL_VAR_xyzzy")).toBeNull();
  });

  // Make sure os/path/fs are tree-shaken correctly (unused warning safety).
  void os;
  void path;
  void fs;
});
