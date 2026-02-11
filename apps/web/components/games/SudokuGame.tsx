"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Clock, RotateCcw } from "lucide-react";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { AchievementToast } from "@/components/games/AchievementToast";
import { sfxCorrect, sfxWrong, sfxClick, sfxGameOver, sfxLevelUp, isSfxEnabled } from "@/lib/games/audio";
import { checkAchievements, type MedalTier } from "@/lib/games/achievements";
import { trackGamePlayed, getProfile, getLocalHighScore, setLocalHighScore } from "@/lib/games/use-scores";
import { useEinkMode, EinkBanner, EinkWrapper } from "@/lib/games/eink-utils";
import { createAdaptiveState, adaptiveUpdate, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import { getGradeForLevel } from "@/lib/games/learning-guide";

// ─── Types ───────────────────────────────────────────────────────────

type Difficulty = "easy" | "medium" | "hard";
type Phase = "menu" | "countdown" | "playing" | "complete";

interface Puzzle {
  puzzle: string; // 81 chars, '0' = empty
  solution: string; // 81 chars
}

// ─── Puzzle Bank ─────────────────────────────────────────────────────
// Each puzzle is an 81-char string. '0' = empty cell. Row-major order.

const PUZZLES: Record<Difficulty, Puzzle[]> = {
  easy: [
    { puzzle: "530070000600195000098000060800060003400803001700020006060000280000419005000080079", solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179" },
    { puzzle: "020000300004300209600029040000700000005060100000008000070490008903002400001000020", solution: "129847365874365219653129847218734596345962178796518432572496183963281754481653927" },
    { puzzle: "005300000800000020070010500400005300010070006003200080060500009004000005000009700", solution: "145327698839654127276918543498165372512473896763289481687541239924836715351792864" },
    { puzzle: "000006900030090020006200100700040005001060400500010003003007600090050010002900000", solution: "124536987837194526956278134768342895291865473543719263483927651679453218215681749" },
    { puzzle: "100007090030020008009600500005300900010080002600004000300000010040010070020500003", solution: "162857394534129768789643521475312986913786242628594137357268419846931275291475863" },
    { puzzle: "200080300060070084030500209000105408000000000402706000301007040720040060004010003", solution: "245981376169273584837564219976135428518492637432786195391627845725348961684519723" },
    { puzzle: "000000907000420180000705026100904000050000040000507009920108000034059000507000000", solution: "462831957379426185851795426183964572596273841247587369925148763734659218618327594" },
    { puzzle: "100005007380000000000170204060003050000020000050400080409058000000000012800200009", solution: "124695387385247196976138254261983475847521963753416828419758632632879541598362719" },
    { puzzle: "000020040008035000000070602200004090040060010010900005907080000000510400030040000", solution: "675128349428935761391674852256847193849263517713951285967382174182516439534749628" },
    { puzzle: "020608000580009700000040000370000500600000004008000013000080000001900046000307080", solution: "923618475584239761716545239371864592659723184248195613467382958831957246195476328" },
  ],
  medium: [
    { puzzle: "000075400000000008080190000300001060000030000010400007000049020600000000003510000", solution: "129875463465232198782196354374521869956738241218469537531649872697283415843517926" },
    { puzzle: "300000000970010000600583000200000900500621003008000006000435009000090056000000001", solution: "381246575974815632625583714246758921589621473718394286162435899437192568853267141" },
    { puzzle: "006000200100700000050320090070008030000040000080200010030097060000005001002000900", solution: "896451237134789625257326894671598342923142578485263719318974263749635181562817943" },
    { puzzle: "000700800006000031040002000500040070080000060020060004000200010970000600003004000", solution: "312756849856948231749132568564843972187529463923461784698275314271384695435697128" },
    { puzzle: "060100030000600800300850060000400009005000200400009000010024005009005000020008010", solution: "867142539241639857395857264186423799935716248472589613618294375749365182523978416" },
    { puzzle: "040090008000308010080000900002700600500000003006003200001000060070501000600020050", solution: "345196728926378415187254936832749651514682397796513284251837469479561832668425173" },
    { puzzle: "050030008007000300600080010200060070080000040070050006010070002003000700800040060", solution: "451632978987514326632789514245168873189327645376495286514876239263951487898243761" },
    { puzzle: "000050090020000000090004560800200100001000400004008003046900010000000080050020000", solution: "764351298123689745895724561839246157561873429274518936346997812912435687658172394" },
    { puzzle: "000000060700019000060400001000006040040000030030800000400001020000270004090000000", solution: "914752368783619425265438971821396547546174832637825149478561293159287664392643718" },
    { puzzle: "900000400000073006005060100200800004000040000400006003007050200800390000006000008", solution: "963215487241873596785964132296837514318542679457196823637458291824391765169627348" },
  ],
  hard: [
    { puzzle: "000000000000003085001020000000507000004000100090000000500000073002010000000040009", solution: "987654321246193785351827946168537294724961158593248617815469273632715489479382569" },
    { puzzle: "000200080600004003000070100008000020400060007050000600001080000900100005040003000", solution: "317296584625814793894573162168945321493162857752381649571638214936421875248759436" },
    { puzzle: "000001030020000065009050008000200000700060003000004000100080600540000020030400000", solution: "658721439427398165319456278863215794745169823291874516172583641546937282936142857" },
    { puzzle: "030050040008010500460000012070502080000603000040109030250000098001070600080090070", solution: "132758946978214563465839712673542189829613457541197238256471893391785624784926375" },
    { puzzle: "020000000000600003074000000000030002080401000500020000000000250006300000000005600", solution: "621539487958674213374218965417836592286451739593927841149763258765382194832145676" },
    { puzzle: "000000000000600403074000000000030002080401000500020000000000250006300000000005600", solution: "613589247825674413974213865147836592286451739593927681439768251768342198251195476" },
    { puzzle: "600000803040700000000000000000504070300200000106000000020000050000080600000010000", solution: "617952843843716925925438716298564371374291568156387492462173859731829654589645237" },
    { puzzle: "040100050107003960520006000000000007000010000300000000000600084096200701010003020", solution: "843179256177423968526896413968254137472318695315967842231645784694582371718739529" },
    { puzzle: "000000000079050180800000007007306800450708096003502400300000004018060720000000000", solution: "512647893679853182834219567197326845452781396263592418326978454918465723745138269" },
    { puzzle: "000080000270000054095000100000070800050204060008050000003000570560000021000060000", solution: "614385729278196354395742186932671845751234968468958213123419572546827931987563412" },
  ],
};

// ─── Solver ───────────────────────────────────────────────────────────
// Many hardcoded solution strings are corrupted, so we solve at runtime.

function solveSudoku(grid: number[]): number[] | null {
  const board = [...grid];

  function isValid(pos: number, val: number): boolean {
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    for (let c = 0; c < 9; c++) {
      if (board[row * 9 + c] === val) return false;
    }
    for (let r = 0; r < 9; r++) {
      if (board[r * 9 + col] === val) return false;
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) {
        if (board[r * 9 + c] === val) return false;
      }
    }
    return true;
  }

  function solve(): boolean {
    for (let i = 0; i < 81; i++) {
      if (board[i] === 0) {
        for (let v = 1; v <= 9; v++) {
          if (isValid(i, v)) {
            board[i] = v;
            if (solve()) return true;
            board[i] = 0;
          }
        }
        return false;
      }
    }
    return true;
  }

  return solve() ? board : null;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function parsePuzzle(str: string): number[] {
  return str.split("").map(Number);
}

function getConflicts(grid: number[]): Set<number> {
  const conflicts = new Set<number>();
  // Check rows
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid[r * 9 + c];
      if (v === 0) continue;
      for (let c2 = c + 1; c2 < 9; c2++) {
        if (grid[r * 9 + c2] === v) {
          conflicts.add(r * 9 + c);
          conflicts.add(r * 9 + c2);
        }
      }
    }
  }
  // Check columns
  for (let c = 0; c < 9; c++) {
    for (let r = 0; r < 9; r++) {
      const v = grid[r * 9 + c];
      if (v === 0) continue;
      for (let r2 = r + 1; r2 < 9; r2++) {
        if (grid[r2 * 9 + c] === v) {
          conflicts.add(r * 9 + c);
          conflicts.add(r2 * 9 + c);
        }
      }
    }
  }
  // Check 3×3 boxes
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const cells: { idx: number; val: number }[] = [];
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          const v = grid[r * 9 + c];
          if (v !== 0) cells.push({ idx: r * 9 + c, val: v });
        }
      }
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          if (cells[i].val === cells[j].val) {
            conflicts.add(cells[i].idx);
            conflicts.add(cells[j].idx);
          }
        }
      }
    }
  }
  return conflicts;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Tips ─────────────────────────────────────────────────────────────

const TIPS = [
  "Look for rows or columns with only 2 empty cells first",
  "Each 3×3 box must contain digits 1–9",
  "Cross-hatching: scan rows and columns to eliminate possibilities",
  "Naked pairs: two cells with the same two candidates eliminate those elsewhere",
  "If a number can only go in one place in a row, column, or box — it goes there!",
  "Start with the most constrained areas — they have fewer possibilities",
  "Pencil marks help track possible values for each cell",
  "Hidden singles: a digit that can only go in one cell within a unit",
  "Practice improves pattern recognition over time",
  "Sudoku is pure logic — no math or guessing needed",
];

// ─── Component ───────────────────────────────────────────────────────

export function SudokuGame() {
  const [einkMode, toggleEink] = useEinkMode();
  const [phase, setPhase] = useState<Phase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [showConflicts, setShowConflicts] = useState(true);
  const [showTimer, setShowTimer] = useState(true);

  // Game state
  const [initialGrid, setInitialGrid] = useState<number[]>([]);
  const [grid, setGrid] = useState<number[]>([]);
  const [solution, setSolution] = useState<number[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [tipIndex, setTipIndex] = useState(0);

  // Adaptive difficulty
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(5));
  const [adjustAnim, setAdjustAnim] = useState<"up" | "down" | null>(null);
  const [hintCount, setHintCount] = useState(0);
  const puzzleStartRef = useRef(Date.now());

  // Achievement
  const [achievementQueue, setAchievementQueue] = useState<
    { name: string; tier: MedalTier }[]
  >([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio — only in standard mode
  useGameMusic();

  useEffect(() => {
    try {
      setHighScore(getLocalHighScore("sudoku") ?? 0);
    } catch {}
  }, []);

  // Timer
  useEffect(() => {
    if (phase === "playing" && showTimer) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, [phase, showTimer]);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => {
      setCountdown((c) => {
        if (c <= 1) { setPhase("playing"); return 3; }
        return c - 1;
      });
    }, 800);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Tip rotation
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 8000);
    return () => clearInterval(t);
  }, [phase]);

  // Adjust animation when difficulty changes
  useEffect(() => {
    if (adaptive.lastAdjustTime === 0) return;
    setAdjustAnim(adaptive.lastAdjust);
    const t = setTimeout(() => setAdjustAnim(null), 1500);
    return () => clearTimeout(t);
  }, [adaptive.lastAdjustTime, adaptive.lastAdjust]);

  const startGame = useCallback(
    (diff: Difficulty) => {
      const puzzles = PUZZLES[diff];
      const idx = Math.floor(Math.random() * puzzles.length);
      const p = puzzles[idx];
      const initial = parsePuzzle(p.puzzle);
      // Solve at runtime — hardcoded solutions are unreliable
      const solved = solveSudoku(initial);
      if (!solved) {
        // Fallback: try another puzzle if this one is unsolvable
        const fallbackIdx = (idx + 1) % puzzles.length;
        const fb = puzzles[fallbackIdx];
        const fbInitial = parsePuzzle(fb.puzzle);
        const fbSolved = solveSudoku(fbInitial);
        if (!fbSolved) return; // shouldn't happen
        setInitialGrid(fbInitial);
        setGrid([...fbInitial]);
        setSolution(fbSolved);
      } else {
        setInitialGrid(initial);
        setGrid([...initial]);
        setSolution(solved);
      }
      setDifficulty(diff);
      setSelectedCell(null);
      setElapsed(0);
      setMoveCount(0);
      setHintCount(0);
      setCountdown(3);
      setPhase("countdown");
      puzzleStartRef.current = Date.now();
      if (!einkMode && isSfxEnabled()) sfxClick();
    },
    [einkMode],
  );

  const placeDigit = useCallback(
    (digit: number) => {
      if (selectedCell === null || phase !== "playing") return;
      if (initialGrid[selectedCell] !== 0) return; // can't change given cells

      const newGrid = [...grid];
      newGrid[selectedCell] = digit;
      setGrid(newGrid);
      setMoveCount((c) => c + 1);

      // Check if correct
      if (digit === solution[selectedCell]) {
        if (!einkMode && isSfxEnabled()) sfxCorrect();
      } else if (digit !== 0) {
        if (!einkMode && isSfxEnabled()) sfxWrong();
      }

      // Check completion
      const filled = newGrid.every((v) => v !== 0);
      if (filled) {
        const correct = newGrid.every((v, i) => v === solution[i]);
        if (correct) {
          // Win!
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase("complete");

          // Adaptive update: fast if under expected time, penalize if too many hints
          const expectedTime = difficulty === "easy" ? 300 : difficulty === "medium" ? 600 : 900;
          const fast = elapsed < expectedTime;
          if (hintCount >= 5) {
            setAdaptive(prev => adaptiveUpdate(prev, false, false));
          } else {
            setAdaptive(prev => adaptiveUpdate(prev, true, fast));
          }

          // Score: base by difficulty + time bonus
          const diffBonus =
            difficulty === "hard" ? 500 : difficulty === "medium" ? 300 : 100;
          const timeBonus = Math.max(0, 600 - elapsed) * 2;
          const score = diffBonus + timeBonus;

          if (!einkMode && isSfxEnabled()) sfxLevelUp();

          try {
            const prev = getLocalHighScore("sudoku") ?? 0;
            if (score > prev) {
              setLocalHighScore("sudoku", score);
              setHighScore(score);
            }
          } catch {}

          try {
            trackGamePlayed("sudoku", score);
            const profile = getProfile();
            const medals = checkAchievements(
              { gameId: "sudoku", score, moves: moveCount + 1, timeSeconds: elapsed },
              profile.totalGamesPlayed,
              profile.gamesPlayedByGameId,
            );
            if (medals.length > 0) {
              setAchievementQueue(
                medals.map((m) => ({ name: m.name, tier: m.tier })),
              );
            }
          } catch {}
        }
      }
    },
    [
      selectedCell,
      phase,
      initialGrid,
      grid,
      solution,
      einkMode,
      difficulty,
      elapsed,
      moveCount,
      hintCount,
    ],
  );

  const clearCell = useCallback(() => {
    placeDigit(0);
  }, [placeDigit]);

  // Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        placeDigit(num);
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        clearCell();
      } else if (e.key === "ArrowUp" && selectedCell !== null && selectedCell >= 9) {
        setSelectedCell(selectedCell - 9);
      } else if (e.key === "ArrowDown" && selectedCell !== null && selectedCell < 72) {
        setSelectedCell(selectedCell + 9);
      } else if (e.key === "ArrowLeft" && selectedCell !== null && selectedCell % 9 > 0) {
        setSelectedCell(selectedCell - 1);
      } else if (e.key === "ArrowRight" && selectedCell !== null && selectedCell % 9 < 8) {
        setSelectedCell(selectedCell + 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, selectedCell, placeDigit, clearCell]);

  const conflicts = showConflicts ? getConflicts(grid) : new Set<number>();
  const diffLabel = getDifficultyLabel(adaptive.level);
  const gradeInfo = getGradeForLevel(adaptive.level);

  const score =
    phase === "complete"
      ? (difficulty === "hard" ? 500 : difficulty === "medium" ? 300 : 100) +
        Math.max(0, 600 - elapsed) * 2
      : 0;

  // ─── E-ink Render ───────────────────────────────────────────────────
  if (einkMode) {
    return (
      <EinkWrapper einkMode={true}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "8px 12px" }}>
          <EinkBanner einkMode={true} onToggle={toggleEink} />

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "2px solid #000",
            }}
          >
            <Link href="/games" style={{ color: "#000", textDecoration: "none", fontSize: 18, fontWeight: "bold" }}>
              ← Back
            </Link>
            <span style={{ fontSize: 22, fontWeight: "bold" }}>Sudoku</span>
            <span style={{ width: 60 }} />
          </div>

          {/* Menu */}
          {phase === "menu" && (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <h2 style={{ fontSize: 28, marginBottom: 16 }}>Sudoku</h2>
              <p style={{ fontSize: 18, marginBottom: 24 }}>
                Fill every row, column, and 3×3 box with digits 1–9.
              </p>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontWeight: "bold", marginBottom: 8 }}>Settings:</p>
                <button
                  onClick={() => setShowConflicts(!showConflicts)}
                  style={{
                    border: "2px solid #000",
                    padding: "8px 16px",
                    margin: 4,
                    fontSize: 16,
                    background: showConflicts ? "#000" : "#fff",
                    color: showConflicts ? "#fff" : "#000",
                    cursor: "pointer",
                    minHeight: 44,
                  }}
                >
                  Conflicts: {showConflicts ? "ON" : "OFF"}
                </button>
                <button
                  onClick={() => setShowTimer(!showTimer)}
                  style={{
                    border: "2px solid #000",
                    padding: "8px 16px",
                    margin: 4,
                    fontSize: 16,
                    background: showTimer ? "#000" : "#fff",
                    color: showTimer ? "#fff" : "#000",
                    cursor: "pointer",
                    minHeight: 44,
                  }}
                >
                  Timer: {showTimer ? "ON" : "OFF"}
                </button>
              </div>

              <p style={{ fontWeight: "bold", marginBottom: 8 }}>Select Difficulty:</p>
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => startGame(d)}
                  style={{
                    display: "block",
                    width: "100%",
                    border: "2px solid #000",
                    padding: "14px",
                    margin: "8px 0",
                    fontSize: 20,
                    fontWeight: "bold",
                    background: "#fff",
                    color: "#000",
                    cursor: "pointer",
                    minHeight: 60,
                  }}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Countdown */}
          {phase === "countdown" && (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <div style={{ fontSize: 72, fontWeight: "bold", color: "#000" }}>
                {countdown}
              </div>
            </div>
          )}

          {/* Playing */}
          {phase === "playing" && (
            <div style={{ padding: "8px 0" }}>
              {/* HUD */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 16,
                  padding: "4px 0",
                  borderBottom: "1px solid #000",
                  marginBottom: 8,
                }}
              >
                <span>
                  Difficulty:{" "}
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </span>
                <span>Moves: {moveCount}</span>
                {showTimer && <span>Time: {formatTime(elapsed)}</span>}
              </div>

              {/* Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(9, 1fr)",
                  border: "4px solid #000",
                  maxWidth: 450,
                  margin: "0 auto",
                }}
              >
                {grid.map((val, idx) => {
                  const row = Math.floor(idx / 9);
                  const col = idx % 9;
                  const isGiven = initialGrid[idx] !== 0;
                  const isSelected = selectedCell === idx;
                  const isConflict = conflicts.has(idx);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (!isGiven) setSelectedCell(idx);
                      }}
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                        fontWeight: isGiven ? "bold" : "normal",
                        cursor: isGiven ? "default" : "pointer",
                        borderRight:
                          col % 3 === 2 && col < 8
                            ? "3px solid #000"
                            : "1px solid #666",
                        borderBottom:
                          row % 3 === 2 && row < 8
                            ? "3px solid #000"
                            : "1px solid #666",
                        background: isSelected ? "#ddd" : "#fff",
                        border: isSelected ? "4px solid #000" : undefined,
                        textDecoration:
                          isConflict && val !== 0 ? "line-through" : "none",
                        color: "#000",
                        minHeight: 40,
                      }}
                    >
                      {val !== 0 ? val : ""}
                    </div>
                  );
                })}
              </div>

              {/* Digit buttons */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 6,
                  maxWidth: 450,
                  margin: "12px auto",
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
                  <button
                    key={d}
                    onClick={() => (d === 0 ? clearCell() : placeDigit(d))}
                    style={{
                      border: "2px solid #000",
                      padding: "12px",
                      fontSize: 22,
                      fontWeight: "bold",
                      background: "#fff",
                      color: "#000",
                      cursor: "pointer",
                      minHeight: 60,
                    }}
                  >
                    {d === 0 ? "✕" : d}
                  </button>
                ))}
              </div>

              <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, fontStyle: "italic", color: "#666" }}>
                {TIPS[tipIndex]}
              </div>

              <button
                onClick={() => setPhase("menu")}
                style={{
                  display: "block",
                  width: "100%",
                  border: "2px solid #000",
                  padding: "12px",
                  fontSize: 18,
                  background: "#fff",
                  color: "#000",
                  cursor: "pointer",
                  marginTop: 8,
                  minHeight: 48,
                }}
              >
                ← Back to Menu
              </button>
            </div>
          )}

          {/* Complete */}
          {phase === "complete" && (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <h2 style={{ fontSize: 28, marginBottom: 8 }}>
                Puzzle Complete!
              </h2>
              <p style={{ fontSize: 18 }}>
                Difficulty:{" "}
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </p>
              <p style={{ fontSize: 18 }}>Time: {formatTime(elapsed)}</p>
              <p style={{ fontSize: 18 }}>Moves: {moveCount}</p>
              <p style={{ fontSize: 22, fontWeight: "bold", margin: "16px 0" }}>
                Score: {score}
              </p>
              <button
                onClick={() => setPhase("menu")}
                style={{
                  display: "block",
                  width: "100%",
                  border: "2px solid #000",
                  padding: "14px",
                  fontSize: 20,
                  fontWeight: "bold",
                  background: "#fff",
                  color: "#000",
                  cursor: "pointer",
                  minHeight: 60,
                  marginTop: 16,
                }}
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </EinkWrapper>
    );
  }

  // ─── Standard Render ────────────────────────────────────────────────
  return (
    <EinkWrapper einkMode={false}>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <EinkBanner einkMode={false} onToggle={toggleEink} />

        {/* Header */}
        <div className="flex items-center justify-between py-3">
          <Link
            href="/games"
            className="flex items-center gap-1 text-slate-400 hover:text-white text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <h1 className="text-xl font-bold">Sudoku</h1>
          <AudioToggles />
        </div>

        {/* Menu */}
        {phase === "menu" && (
          <div className="text-center py-8">
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Sudoku
            </h2>
            <p className="text-slate-400 mb-8">
              Fill every row, column, and 3×3 box with digits 1–9.
            </p>

            {highScore > 0 && (
              <div className="mb-4 text-sm text-yellow-400 flex items-center justify-center gap-1">
                <Trophy size={14} /> Best: {highScore}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 mb-6 text-sm">
              <button
                onClick={() => setShowConflicts(!showConflicts)}
                className={`px-3 py-1.5 rounded border ${
                  showConflicts
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-white/5 border-white/10 text-slate-400"
                }`}
              >
                Conflicts: {showConflicts ? "ON" : "OFF"}
              </button>
              <button
                onClick={() => setShowTimer(!showTimer)}
                className={`px-3 py-1.5 rounded border ${
                  showTimer
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-white/5 border-white/10 text-slate-400"
                }`}
              >
                Timer: {showTimer ? "ON" : "OFF"}
              </button>
            </div>

            <p className="text-slate-300 font-semibold mb-3">
              Select Difficulty:
            </p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => startGame(d)}
                  className={`py-3 rounded-lg font-bold text-lg border transition-colors ${
                    d === "easy"
                      ? "bg-green-600/20 border-green-500/40 text-green-300 hover:bg-green-600/30"
                      : d === "medium"
                        ? "bg-yellow-600/20 border-yellow-500/40 text-yellow-300 hover:bg-yellow-600/30"
                        : "bg-red-600/20 border-red-500/40 text-red-300 hover:bg-red-600/30"
                  }`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Countdown */}
        {phase === "countdown" && (
          <div className="text-center py-16">
            <div className="text-7xl font-bold text-blue-400 animate-pulse">
              {countdown}
            </div>
          </div>
        )}

        {/* Playing */}
        {phase === "playing" && (
          <div>
            {/* HUD */}
            <div className="flex items-center justify-between text-sm text-slate-300 py-2 mb-2 flex-wrap gap-2">
              <span className="capitalize">{difficulty}</span>
              <div className="flex items-center gap-2">
                <div
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  style={{ color: diffLabel.color, borderColor: diffLabel.color + "40", backgroundColor: diffLabel.color + "15" }}
                >
                  {diffLabel.emoji} Lv {Math.round(adaptive.level)} {diffLabel.label}
                </div>
                <span className="text-[10px] text-slate-500">{gradeInfo.label}</span>
                {adjustAnim && (
                  <span className={`text-[10px] font-bold animate-bounce ${adjustAnim === "up" ? "text-red-400" : "text-green-400"}`}>
                    {adjustAnim === "up" ? "↑ Harder!" : "↓ Easier"}
                  </span>
                )}
              </div>
              <span>Moves: {moveCount}</span>
              {showTimer && (
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatTime(elapsed)}
                </span>
              )}
            </div>

            {/* Grid */}
            <div
              className="grid border-2 border-blue-400 mx-auto"
              style={{
                gridTemplateColumns: `repeat(9, minmax(36px, 1fr))`,
                maxWidth: 450,
              }}
            >
              {grid.map((val, idx) => {
                const row = Math.floor(idx / 9);
                const col = idx % 9;
                const isGiven = initialGrid[idx] !== 0;
                const isSelected = selectedCell === idx;
                const isConflict = conflicts.has(idx) && val !== 0;
                const sameValue =
                  selectedCell !== null &&
                  val !== 0 &&
                  grid[selectedCell] === val;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (!isGiven) setSelectedCell(idx);
                      else setSelectedCell(idx);
                    }}
                    className={`
                      flex items-center justify-center cursor-pointer
                      aspect-square text-lg font-mono
                      ${col % 3 === 2 && col < 8 ? "border-r-2 border-r-blue-400" : "border-r border-r-white/10"}
                      ${row % 3 === 2 && row < 8 ? "border-b-2 border-b-blue-400" : "border-b border-b-white/10"}
                      ${isSelected ? "bg-blue-500/30 ring-2 ring-blue-400" : sameValue ? "bg-blue-500/10" : "bg-white/[0.02] hover:bg-white/[0.06]"}
                      ${isConflict ? "text-red-400" : isGiven ? "text-white font-bold" : "text-blue-300"}
                    `}
                  >
                    {val !== 0 ? val : ""}
                  </div>
                );
              })}
            </div>

            {/* Digit buttons */}
            <div
              className="grid gap-2 mx-auto mt-4"
              style={{
                gridTemplateColumns: "repeat(5, 1fr)",
                maxWidth: 450,
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
                <button
                  key={d}
                  onClick={() => (d === 0 ? clearCell() : placeDigit(d))}
                  className="py-3 rounded-lg font-bold text-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
                >
                  {d === 0 ? "✕" : d}
                </button>
              ))}
            </div>

            <div className="text-center mt-3">
              <span className="text-[10px] text-slate-500 italic">{TIPS[tipIndex]}</span>
            </div>

            <button
              onClick={() => setPhase("menu")}
              className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              <RotateCcw size={14} className="inline mr-1" />
              Back to Menu
            </button>
          </div>
        )}

        {/* Complete */}
        {phase === "complete" && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-2 text-green-400">
              Puzzle Complete!
            </h2>
            <div className="text-slate-300 space-y-1 mb-4">
              <p>
                Difficulty:{" "}
                <span className="capitalize font-semibold">{difficulty}</span>
              </p>
              <p>
                Time: <span className="font-semibold">{formatTime(elapsed)}</span>
              </p>
              <p>
                Moves: <span className="font-semibold">{moveCount}</span>
              </p>
            </div>
            <div className="text-4xl font-bold text-yellow-400 mb-6">
              {score} pts
            </div>

            <div className="max-w-xs mx-auto mb-6">
              <ScoreSubmit
                game="sudoku"
                score={score}
                level={Math.round(adaptive.level)}
                stats={{ moves: moveCount, timeSeconds: elapsed }}
              />
            </div>

            <button
              onClick={() => setPhase("menu")}
              className="px-8 py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Achievement toasts */}
        {achievementQueue.map((a, i) => (
          <div key={i} className="fixed top-4 right-4 z-50">
            <AchievementToast
              name={a.name}
              tier={a.tier}
              onDismiss={() =>
                setAchievementQueue((q) => q.filter((_, j) => j !== i))
              }
            />
          </div>
        ))}
      </div>
    </EinkWrapper>
  );
}
