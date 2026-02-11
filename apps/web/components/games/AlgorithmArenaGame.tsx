"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Zap, BarChart3, CheckCircle2, XCircle } from "lucide-react";
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

type GamePhase = "menu" | "countdown" | "playing" | "feedback" | "complete";
interface Question { id: string; arrayViz?: number[]; highlightIndices?: number[]; question: string; choices: string[]; correctIndex: number; explanation: string; difficulty: number; category: string; }
interface RoundResult { question: Question; selectedIndex: number; correct: boolean; fast: boolean; }

const QS: Question[] = [
{id:"a1-01",difficulty:1,category:"Sorting Basics",arrayViz:[5,2,8,1],question:"Sort smallest to largest. What\u2019s the smallest number?",choices:["1","2","5","8"],correctIndex:0,explanation:"Scan all numbers: 5,2,8,1. The smallest is 1."},
{id:"a1-02",difficulty:1,category:"Sorting Basics",arrayViz:[3,7,1,4],question:"To sort this list, which number goes first?",choices:["1","3","4","7"],correctIndex:0,explanation:"In ascending order, the smallest (1) goes first."},
{id:"a1-03",difficulty:1,category:"Linear Search",arrayViz:[4,8,2,6,9],question:"Search for 6. Starting left, how many checks?",choices:["4","3","5","2"],correctIndex:0,explanation:"Check 4,8,2,6 \u2014 found on check 4."},
{id:"a1-04",difficulty:1,category:"Linear Search",arrayViz:[1,3,5,7,9],question:"Search for 7. How many checks from the left?",choices:["4","3","5","2"],correctIndex:0,explanation:"Check 1,3,5,7 \u2014 found on check 4."},
{id:"a1-05",difficulty:1,category:"Sorting Basics",arrayViz:[9,4,6,2],question:"What\u2019s the largest number?",choices:["9","6","4","2"],correctIndex:0,explanation:"Scan: 9,4,6,2. Largest is 9."},
{id:"a1-06",difficulty:1,category:"Linear Search",arrayViz:[2,4,6,8,10],question:"Is 5 in this list? How many checks to be sure?",choices:["5 (check all)","3","1","4"],correctIndex:0,explanation:"Must check every element: 5 checks to confirm 5 is NOT present."},
{id:"a1-07",difficulty:1,category:"Sorting Basics",arrayViz:[7,3,5,1,9],question:"Sort ascending. What\u2019s in position 2?",choices:["3","1","5","7"],correctIndex:0,explanation:"Sorted: [1,3,5,7,9]. Position 2 is 3."},
{id:"a2-01",difficulty:2,category:"Bubble Sort",arrayViz:[4,2,7,1,3],question:"Bubble sort: compare 4 and 2. Swap?",choices:["Yes \u2014 4>2, so swap","No \u2014 in order","Only if 4>7","Never swap first"],correctIndex:0,explanation:"In bubble sort, left>right means swap. 4>2, so swap to [2,4,7,1,3]."},
{id:"a2-02",difficulty:2,category:"Bubble Sort",arrayViz:[4,2,7,1,3],question:"After ONE bubble sort pass, the array is?",choices:["[2,4,1,3,7]","[1,2,3,4,7]","[4,2,1,3,7]","[2,4,7,1,3]"],correctIndex:0,explanation:"Pass: swap(4,2), ok(4,7), swap(7,1), swap(7,3) \u2192 [2,4,1,3,7]."},
{id:"a2-03",difficulty:2,category:"Bubble Sort",arrayViz:[4,2,7,1,3],question:"After one pass, which number is in final position?",choices:["7 \u2014 largest bubbles to end","4","1","3"],correctIndex:0,explanation:"Bubble sort moves largest to end each pass. 7 is now last."},
{id:"a2-04",difficulty:2,category:"Bubble Sort",arrayViz:[3,1,4,2],question:"How many swaps in first bubble sort pass?",choices:["2","1","3","0"],correctIndex:0,explanation:"3,1\u2192swap, 3,4\u2192ok, 4,2\u2192swap. Two swaps."},
{id:"a2-05",difficulty:2,category:"Bubble Sort",arrayViz:[1,2,3,4,5],question:"Bubble sort on already-sorted list. Swaps?",choices:["0 \u2014 already sorted!","4","5","10"],correctIndex:0,explanation:"No neighbor is out of order. Zero swaps!"},
{id:"a2-06",difficulty:2,category:"Bubble Sort",arrayViz:[5,4,3,2,1],question:"Reverse-sorted list. After pass 1, where is 5?",choices:["At the end","Still at start","Position 3","Position 4"],correctIndex:0,explanation:"5 swaps right each comparison until it reaches the end."},
{id:"a3-01",difficulty:3,category:"Selection Sort",arrayViz:[8,3,5,1],question:"Selection sort: find min, swap with first. Result?",choices:["[1,3,5,8]","[1,8,5,3]","[3,1,5,8]","[8,1,3,5]"],correctIndex:0,highlightIndices:[0,3],explanation:"Min=1 at index 3. Swap with index 0: [1,3,5,8]."},
{id:"a3-02",difficulty:3,category:"Selection Sort",arrayViz:[6,4,2,8,5],question:"Selection sort step 1: find min, swap with pos 0?",choices:["[2,4,6,8,5]","[4,6,2,8,5]","[2,6,4,8,5]","[6,2,4,8,5]"],correctIndex:0,highlightIndices:[0,2],explanation:"Min=2 at index 2. Swap with index 0: [2,4,6,8,5]."},
{id:"a3-03",difficulty:3,category:"Binary Search",arrayViz:[1,2,3,4,5,6,7,8,9,10],question:"Binary search for 7. First middle checked?",choices:["5","7","6","1"],correctIndex:0,highlightIndices:[4],explanation:"Mid of [1..10] = index 4 = 5. Since 5<7, search right half."},
{id:"a3-04",difficulty:3,category:"Binary Search",arrayViz:[1,2,3,4,5,6,7,8,9,10],question:"Binary search for 7. After checking 5, what\u2019s next?",choices:["8","7","6","9"],correctIndex:0,highlightIndices:[7],explanation:"Right half [6..10], mid=index 7=8. Since 8>7, search left."},
{id:"a3-05",difficulty:3,category:"Binary Search",arrayViz:[2,5,8,12,16,23,38,56,72,91],question:"Binary search for 23. First check?",choices:["16","23","8","56"],correctIndex:0,highlightIndices:[4],explanation:"Mid of 10 elements: index 4=16. 16<23, search right."},
{id:"a3-06",difficulty:3,category:"Selection Sort",arrayViz:[7,3,9,1,5],question:"Selection sort: how many times find minimum?",choices:["4 (n-1)","5","3","1"],correctIndex:0,explanation:"n-1 = 4 times for 5 elements. Last element auto-placed."},
{id:"a4-01",difficulty:4,category:"Search Comparison",question:"Sorted list of 1000: linear or binary search faster?",choices:["Binary \u2014 ~10 checks vs 1000","Linear \u2014 simpler","Same","Depends on item"],correctIndex:0,explanation:"Binary: log\u2082(1000)\u224810 checks. Linear: up to 1000."},
{id:"a4-02",difficulty:4,category:"Search Comparison",question:"Binary search: 1000 items \u2192 ~10 checks. How many for 2000?",choices:["~11 \u2014 just one more!","~20","~2000","~100"],correctIndex:0,explanation:"log\u2082(2000)\u224811. Doubling data adds just 1 step!"},
{id:"a4-03",difficulty:4,category:"Sort Analysis",arrayViz:[1,2,3,4,5],question:"Bubble sort on [1,2,3,4,5]. Swaps needed?",choices:["0 \u2014 already sorted!","4","10","5"],correctIndex:0,explanation:"Already sorted \u2192 zero swaps."},
{id:"a4-04",difficulty:4,category:"Sort Analysis",question:"Which sort always makes exactly n-1 swaps?",choices:["Selection sort","Bubble sort","Both","Neither"],correctIndex:0,explanation:"Selection sort: exactly n-1 swaps (one per pass)."},
{id:"a4-05",difficulty:4,category:"Search Comparison",question:"Can binary search work on unsorted lists?",choices:["No \u2014 requires sorted list","Yes","Only numbers","Only strings"],correctIndex:0,explanation:"Binary search needs sorted data to decide which half to search."},
{id:"a4-06",difficulty:4,category:"Sort Analysis",arrayViz:[5,4,3,2,1],question:"Bubble sort on [5,4,3,2,1]. Passes to fully sort?",choices:["4 passes","5","3","1"],correctIndex:0,explanation:"Worst case: n-1=4 passes for 5 reverse-sorted elements."},
{id:"a4-07",difficulty:4,category:"Search Comparison",question:"Linear search worst case for n items?",choices:["n comparisons","n/2","log(n)","1"],correctIndex:0,explanation:"Must check all n items when target is last or absent."},
{id:"a5-01",difficulty:5,category:"Big-O Basics",question:"Bubble sort: ~100 steps for 10 items. How many for 20?",choices:["~400 (quadratic)","~200","~100","~800"],correctIndex:0,explanation:"O(n\u00b2): double n \u2192 4x steps. 100\u00d74=400."},
{id:"a5-02",difficulty:5,category:"Big-O Basics",question:"Binary search: list doubles. Extra steps?",choices:["Just 1 more (logarithmic)","Double","4x","Same"],correctIndex:0,explanation:"O(log n): doubling adds exactly 1 comparison."},
{id:"a5-03",difficulty:5,category:"Big-O Basics",question:"Which grows faster: O(n) or O(n\u00b2)?",choices:["O(n\u00b2) grows much faster","O(n)","Same","Depends"],correctIndex:0,explanation:"At n=100: O(n)=100, O(n\u00b2)=10,000."},
{id:"a5-04",difficulty:5,category:"Big-O Basics",question:"O(n) algo: 1s for 1000 items. Time for 10,000?",choices:["~10 seconds","~100s","~1s","~1000s"],correctIndex:0,explanation:"Linear: 10x items = 10x time."},
{id:"a5-05",difficulty:5,category:"Big-O Basics",question:"O(n\u00b2) algo: 1s for 100 items. Time for 1000?",choices:["~100 seconds","~10s","~1000s","~1s"],correctIndex:0,explanation:"Quadratic: 10x items = 100x time."},
{id:"a5-06",difficulty:5,category:"Algorithm Choice",question:"1 million sorted items. Best search?",choices:["Binary search \u2014 ~20 steps","Linear search","Random","Every 10th"],correctIndex:0,explanation:"log\u2082(1M)\u224820. Binary search: ~20 steps!"},
{id:"a5-07",difficulty:5,category:"Big-O Basics",question:"Rank fastest to slowest: O(1), O(n), O(log n), O(n\u00b2)",choices:["O(1), O(log n), O(n), O(n\u00b2)","O(n\u00b2), O(n), O(log n), O(1)","O(1), O(n), O(log n), O(n\u00b2)","O(log n), O(1), O(n), O(n\u00b2)"],correctIndex:0,explanation:"Constant < logarithmic < linear < quadratic."},
{id:"a6-01",difficulty:6,category:"Merge Sort",question:"Merge sort splits [8,3,5,1] into?",choices:["[8,3] and [5,1]","[8] and [3,5,1]","[1,3] and [5,8]","[3,8] and [1,5]"],correctIndex:0,explanation:"Always split in half: [8,3] and [5,1]."},
{id:"a6-02",difficulty:6,category:"Merge Sort",question:"Merge sorted [3,8] with sorted [1,5]?",choices:["[1,3,5,8]","[3,8,1,5]","[1,5,3,8]","[3,1,5,8]"],correctIndex:0,explanation:"Compare fronts: 1<3\u2192take 1, 3<5\u2192take 3, 5<8\u2192take 5, take 8."},
{id:"a6-03",difficulty:6,category:"Merge Sort",question:"Merge sort on 8 items: splitting levels?",choices:["3 (log\u2082 8)","8","4","2"],correctIndex:0,explanation:"8\u21924\u21922\u21921 = 3 splits."},
{id:"a6-04",difficulty:6,category:"Efficiency",question:"Merge sort O(n log n): 1000 items, comparisons?",choices:["~10,000","~1,000,000","~1,000","~100"],correctIndex:0,explanation:"1000\u00d710 = ~10,000. Much better than bubble sort!"},
{id:"a6-05",difficulty:6,category:"Stability",question:"Stable sort keeps equal elements\u2019 order. Which is stable?",choices:["Merge sort","Selection sort","Neither","Both"],correctIndex:0,explanation:"Merge sort is stable. Selection sort is not."},
{id:"a6-06",difficulty:6,category:"Efficiency",question:"1 million items: merge sort operations?",choices:["~20 million (n log n)","~1 trillion (n\u00b2)","~1 million","~20"],correctIndex:0,explanation:"1M\u00d720 = 20M. vs bubble sort: 1 trillion!"},
{id:"a7-01",difficulty:7,category:"Algorithm Design",question:"Quicksort pivot=5 in [3,8,5,2,7,1]. Left partition?",choices:["[3,2,1]","[3,8,2]","[8,7]","[5,2,1]"],correctIndex:0,explanation:"Elements < 5: [3,2,1]. Elements > 5: [8,7]."},
{id:"a7-02",difficulty:7,category:"Algorithm Design",question:"Quicksort average O(n log n). Worst case?",choices:["O(n\u00b2) \u2014 pivot always min/max","O(n log n)","O(n)","O(log n)"],correctIndex:0,explanation:"Bad pivot = one empty partition \u2192 O(n\u00b2)."},
{id:"a7-03",difficulty:7,category:"Data Structures",question:"Hash table: O(1) average search. Why not always use it?",choices:["O(n) worst case, extra memory","Always O(1)","Slower than binary","Can\u2019t store strings"],correctIndex:0,explanation:"Collisions cause O(n) worst case. Also uses extra memory."},
{id:"a7-04",difficulty:7,category:"Recursion",question:"Merge sort on 8 items: total recursive calls?",choices:["15","8","3","7"],correctIndex:0,explanation:"1+2+4+8 = 15 total function calls."},
{id:"a7-05",difficulty:7,category:"Algorithm Design",question:"Find 3rd smallest in [7,2,9,1,5,8,3]. Most efficient?",choices:["Quickselect \u2014 O(n) average","Full sort O(n log n)","Check triples O(n\u00b3)","Binary search"],correctIndex:0,explanation:"Quickselect finds k-th element in O(n) average."},
{id:"a8-01",difficulty:8,category:"Complexity",question:"Comparison sort lower bound is O(n log n). Meaning?",choices:["No comparison sort can be faster","Bubble sort is optimal","All sorts equal","O(n) sort impossible"],correctIndex:0,explanation:"Proven minimum for comparison sorts. Radix sort beats this differently."},
{id:"a8-02",difficulty:8,category:"Complexity",question:"Counting sort O(n+k). When better than merge sort?",choices:["When k is small relative to n","Always","Never","When k>n"],correctIndex:0,explanation:"Small k: O(n+k)\u2248O(n), beating O(n log n)."},
{id:"a8-03",difficulty:8,category:"Graph Algorithms",question:"BFS explores level-by-level. Data structure?",choices:["Queue (FIFO)","Stack (LIFO)","Array","Binary tree"],correctIndex:0,explanation:"BFS uses a queue for level-order traversal."},
{id:"a8-04",difficulty:8,category:"Graph Algorithms",question:"DFS uses which data structure?",choices:["Stack (or recursion)","Queue","Hash table","Sorted array"],correctIndex:0,explanation:"DFS goes deep first, using stack or recursion."},
{id:"a8-05",difficulty:8,category:"Complexity",question:"Traveling salesman (shortest path visiting all cities) is?",choices:["NP-hard \u2014 no efficient solution known","O(n\u00b2)","O(n log n)","O(n)"],correctIndex:0,explanation:"TSP is NP-hard. Best algorithms are exponential."},
{id:"a8-06",difficulty:8,category:"Advanced Sort",question:"Radix sort processes digits. Complexity?",choices:["O(d\u00b7n) where d=digit count","O(n\u00b2)","O(n log n)","O(n)"],correctIndex:0,explanation:"d passes of O(n) each. Fixed-size integers: d constant \u2192 O(n)!"},
];

const GAME_ID = "algorithm-arena";
const Q_PER_GAME = 10;
const CD_SECS = 3;

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

function pickQuestions(level: number): Question[] {
  const t = diffForLevel(level);
  const eligible = QS.filter((q) => Math.abs(q.difficulty - t) <= 1);
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Q_PER_GAME).map((q) => {
    const idx = q.choices.map((_, i) => i);
    const si = [...idx].sort(() => Math.random() - 0.5);
    return {
      ...q,
      choices: si.map((i) => q.choices[i]),
      correctIndex: si.indexOf(q.correctIndex),
    };
  });
}

function ArrayBars({
  arr,
  highlights,
}: {
  arr: number[];
  highlights?: number[];
}) {
  const max = Math.max(...arr);
  const hl = new Set(highlights || []);
  return (
    <div className="flex items-end gap-1 h-32 w-full justify-center my-4">
      {arr.map((v, i) => {
        const h = Math.max(8, (v / max) * 100);
        const isHl = hl.has(i);
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`rounded-t-md transition-all duration-300 ${isHl ? "bg-amber-400" : "bg-indigo-500/70"}`}
              style={{
                height: `${h}%`,
                width: Math.max(24, Math.min(48, 280 / arr.length)),
              }}
            />
            <span
              className={`text-xs font-mono ${isHl ? "text-amber-400 font-bold" : "text-white/60"}`}
            >
              {v}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AlgorithmArenaGame() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() =>
    createAdaptiveState(1),
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(CD_SECS);
  const [highScore, setHighScoreState] = useState(0);
  const [medals, setMedals] = useState<NewAchievement[]>([]);
  const [adjustAnim, setAdjustAnim] = useState<"up" | "down" | null>(null);
  const roundStartRef = useRef(Date.now());

  useGameMusic();
  useEffect(() => {
    setHighScoreState(getLocalHighScore(GAME_ID));
  }, []);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      sfxCountdownGo();
      setQuestions(pickQuestions(adaptive.level));
      setCurrentIdx(0);
      setPhase("playing");
      roundStartRef.current = Date.now();
      return;
    }
    sfxCountdown();
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, adaptive.level]);

  const startGame = useCallback((sl: number) => {
    setAdaptive(createAdaptiveState(sl));
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setResults([]);
    setCurrentIdx(0);
    setSelectedChoice(null);
    setCountdown(CD_SECS);
    setPhase("countdown");
  }, []);

  const q = questions[currentIdx];

  const handleAnswer = useCallback(
    (idx: number) => {
      if (!q || selectedChoice !== null) return;
      setSelectedChoice(idx);
      const correct = idx === q.correctIndex;
      const elapsed = Date.now() - roundStartRef.current;
      const fast = elapsed < 8000;
      const { mult } = getMultiplierFromStreak(streak);
      let pts = 0;
      if (correct) {
        pts = Math.round((fast ? 150 : 100) * mult);
        sfxCorrect();
      } else {
        if (streak > 0) sfxStreakLost();
        sfxWrong();
      }
      setScore((s) => s + pts);
      const ns = correct ? streak + 1 : 0;
      setStreak(ns);
      if (ns > maxStreak) setMaxStreak(ns);
      if (ns > 0 && ns % 5 === 0) sfxCombo(ns);
      const na = adaptiveUpdate(adaptive, correct, fast && correct);
      setAdaptive(na);
      if (na.lastAdjust && na.lastAdjustTime > adaptive.lastAdjustTime) {
        setAdjustAnim(na.lastAdjust);
        setTimeout(() => setAdjustAnim(null), 1200);
        if (na.lastAdjust === "up") sfxLevelUp();
      }
      setResults((p) => [
        ...p,
        { question: q, selectedIndex: idx, correct, fast },
      ]);
      setPhase("feedback");
    },
    [q, selectedChoice, streak, maxStreak, adaptive],
  );

  const nextQuestion = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      const fs = score;
      if (fs > highScore) {
        setLocalHighScore(GAME_ID, fs);
        setHighScoreState(fs);
      }
      const pr = getProfile();
      const cc = results.filter((r) => r.correct).length;
      const gs = {
        gameId: GAME_ID,
        score: fs,
        bestStreak: maxStreak,
        bestCombo: maxStreak,
        accuracy: Math.round(
          (cc / Math.max(1, results.length)) * 100,
        ),
        solved: cc,
        perfectLevels: cc === results.length ? 1 : 0,
      };
      const nm = checkAchievements(
        gs,
        pr.totalGamesPlayed,
        pr.gamesPlayedByGameId,
      );
      setMedals(nm);
      if (nm.length > 0) sfxAchievement();
      trackGamePlayed(GAME_ID, fs, {
        bestStreak: maxStreak,
        adaptiveLevel: Math.round(adaptive.level),
      });
      const acc = results.length > 0 ? cc / results.length : 0;
      if (acc >= 1.0) sfxPerfect();
      else if (acc >= 0.8) sfxLevelUp();
      else sfxGameOver();
      setPhase("complete");
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedChoice(null);
      roundStartRef.current = Date.now();
      setPhase("playing");
    }
  }, [currentIdx, questions.length, score, highScore, maxStreak, results, adaptive]);

  const dl = getDifficultyLabel(adaptive.level);
  const gi = getGradeForLevel(adaptive.level);
  const accuracy =
    results.length > 0
      ? Math.round(
          (results.filter((r) => r.correct).length / results.length) * 100,
        )
      : 0;

  /* ---- MENU ---- */
  if (phase === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950/30 to-slate-900 text-white flex flex-col">
        <div className="p-4 flex items-center gap-3">
          <Link href="/games" className="text-white/60 hover:text-white">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold">Algorithm Arena</h1>
          <AudioToggles />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto gap-6">
          <div className="text-center">
            <div className="text-6xl mb-4">⚡</div>
            <h2 className="text-3xl font-extrabold mb-2">
              Master Algorithms!
            </h2>
            <p className="text-white/60 text-sm">
              Sort, search, and predict. Visualize how algorithms work step by
              step!
            </p>
          </div>
          <div className="w-full bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-bold text-violet-400 mb-2">
              Skills You&apos;ll Learn
            </h3>
            <div className="grid grid-cols-2 gap-1.5 text-xs text-white/70">
              <div>🟢 Sorting basics</div>
              <div>🟡 Bubble sort</div>
              <div>🟠 Selection sort</div>
              <div>🔴 Binary search</div>
              <div>💥 Algorithm comparison</div>
              <div>🔥 Big-O notation</div>
              <div>⚡ Merge sort</div>
              <div>👑 Advanced algorithms</div>
            </div>
          </div>
          <div className="w-full space-y-2">
            <p className="text-xs text-white/40 text-center">
              Choose starting level
            </p>
            {[
              {
                label: "Grade 5-6",
                desc: "Sorting & search basics",
                level: 1,
                color: "#22c55e",
              },
              {
                label: "Grade 6-7",
                desc: "Bubble & selection sort",
                level: 11,
                color: "#eab308",
              },
              {
                label: "Grade 8-9",
                desc: "Binary search & comparison",
                level: 26,
                color: "#ef4444",
              },
              {
                label: "Grade 10+",
                desc: "Big-O & advanced",
                level: 33,
                color: "#a855f7",
              },
            ].map((o) => (
              <button
                key={o.level}
                onClick={() => startGame(o.level)}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-between hover:scale-[1.02] transition-transform"
                style={{
                  backgroundColor: o.color + "22",
                  border: `1px solid ${o.color}44`,
                }}
              >
                <span>{o.label}</span>
                <span className="text-white/50 text-xs font-normal">
                  {o.desc}
                </span>
              </button>
            ))}
          </div>
          {highScore > 0 && (
            <p className="text-xs text-white/40">
              Personal best: {highScore.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ---- COUNTDOWN ---- */
  if (phase === "countdown") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950/30 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl font-black tabular-nums animate-pulse">
            {countdown || "GO!"}
          </div>
          <p className="text-white/40 mt-2">Algorithms incoming...</p>
        </div>
      </div>
    );
  }

  /* ---- HUD ---- */
  const HUD = (
    <div className="p-3 flex items-center justify-between bg-black/30 text-sm">
      <div className="flex items-center gap-2">
        <Link href="/games" className="text-white/40 hover:text-white">
          <ArrowLeft size={18} />
        </Link>
        <Zap size={16} className="text-violet-400" />
        <span className="font-bold">{score.toLocaleString()}</span>
        {streak >= 3 && <StreakBadge streak={streak} />}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold" style={{ color: dl.color }}>
          {dl.emoji} {dl.label}
        </span>
        <span className="text-xs text-white/50">
          Lvl {Math.round(adaptive.level)} &middot; {gi.label}
        </span>
        {adjustAnim && (
          <span
            className={`text-xs font-bold animate-bounce ${adjustAnim === "up" ? "text-green-400" : "text-red-400"}`}
          >
            {adjustAnim === "up" ? "▲" : "▼"}
          </span>
        )}
      </div>
      <div className="text-xs text-white/40">
        {currentIdx + 1}/{questions.length}
      </div>
    </div>
  );

  /* ---- PLAYING ---- */
  if (phase === "playing" && q) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950/30 to-slate-900 text-white flex flex-col">
        {HUD}
        <div className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-violet-400" />
            <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
              {q.category}
            </span>
          </div>
          {q.arrayViz && (
            <ArrayBars arr={q.arrayViz} highlights={q.highlightIndices} />
          )}
          <p className="font-bold text-white/90 mb-4 text-center">
            {q.question}
          </p>
          <div className="space-y-2">
            {q.choices.map((ch, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="w-full py-3 px-4 rounded-xl text-sm text-left transition-all bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
              >
                <span className="text-white/40 mr-2 font-mono">
                  {String.fromCharCode(65 + i)}.
                </span>
                {ch}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---- FEEDBACK ---- */
  if (phase === "feedback" && q && selectedChoice !== null) {
    const correct = selectedChoice === q.correctIndex;
    const lr = results[results.length - 1];
    const pts = lr?.correct ? (lr.fast ? 150 : 100) : 0;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950/30 to-slate-900 text-white flex flex-col">
        {HUD}
        <div className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
          <div
            className={`rounded-xl p-3 mb-4 text-center text-sm font-bold ${correct ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-400" : "bg-red-600/20 border border-red-500/30 text-red-400"}`}
          >
            {correct ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 size={18} /> Correct! {pts > 0 && `+${pts}`}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <XCircle size={18} /> Not quite!
              </div>
            )}
          </div>
          {q.arrayViz && (
            <ArrayBars arr={q.arrayViz} highlights={q.highlightIndices} />
          )}
          <div className="space-y-2 mb-4">
            {q.choices.map((ch, i) => {
              const isSel = selectedChoice === i;
              const isCor = i === q.correctIndex;
              let bg = "bg-white/5 border border-white/10 opacity-50";
              if (isSel && isCor)
                bg = "bg-emerald-600/30 border border-emerald-500/40";
              else if (isSel && !isCor)
                bg = "bg-red-600/30 border border-red-500/40";
              else if (isCor)
                bg = "bg-emerald-600/20 border border-emerald-500/30";
              return (
                <div
                  key={i}
                  className={`w-full py-3 px-4 rounded-xl text-sm text-left ${bg}`}
                >
                  <span className="text-white/40 mr-2 font-mono">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {ch}
                  {isCor && (
                    <span className="ml-2 text-emerald-400">✓</span>
                  )}
                  {isSel && !isCor && (
                    <span className="ml-2 text-red-400">✗</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-violet-400 mb-1">
              Explanation
            </p>
            <p className="text-sm text-white/90 leading-relaxed">
              {q.explanation}
            </p>
          </div>
          <button
            onClick={nextQuestion}
            className="w-full py-3 rounded-xl font-bold bg-violet-600 hover:bg-violet-500 transition-colors"
          >
            {currentIdx + 1 >= questions.length
              ? "See Results"
              : "Next Question →"}
          </button>
        </div>
      </div>
    );
  }

  /* ---- COMPLETE ---- */
  if (phase === "complete") {
    const cc = results.filter((r) => r.correct).length;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950/30 to-slate-900 text-white flex flex-col">
        <div className="p-4 flex items-center gap-3">
          <Link href="/games" className="text-white/60 hover:text-white">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold">Arena Complete</h1>
        </div>
        <div className="flex-1 flex flex-col items-center p-4 max-w-lg mx-auto gap-4">
          <div className="text-center">
            <Trophy size={48} className="text-violet-400 mx-auto mb-2" />
            <div className="text-4xl font-black">
              {score.toLocaleString()}
            </div>
            <p className="text-white/40 text-sm">Algorithm Score</p>
            {score > highScore && score > 0 && (
              <p className="text-violet-400 text-xs font-bold mt-1">
                New Personal Best!
              </p>
            )}
          </div>
          <div className="w-full grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">
                {cc}/{results.length}
              </div>
              <p className="text-xs text-white/40">Correct</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{accuracy}%</div>
              <p className="text-xs text-white/40">Accuracy</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{maxStreak}</div>
              <p className="text-xs text-white/40">Best Streak</p>
            </div>
          </div>
          <div className="w-full bg-white/5 rounded-xl p-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/40">Difficulty</span>
              <span className="font-bold" style={{ color: dl.color }}>
                {dl.emoji} {dl.label}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Grade</span>
              <span className="font-bold">
                {gi.label} &middot; Lvl {Math.round(adaptive.level)}
              </span>
            </div>
          </div>
          <div className="w-full bg-white/5 rounded-xl p-3">
            <p className="text-xs font-bold text-white/60 mb-2">
              Round by Round
            </p>
            <div className="space-y-1">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${r.correct ? "bg-emerald-600/30 text-emerald-400" : "bg-red-600/30 text-red-400"}`}
                  >
                    {r.correct ? "✓" : "✗"}
                  </span>
                  <span className="text-white/60 truncate flex-1">
                    {r.question.question}
                  </span>
                  <span className="text-white/30 text-[10px]">
                    {r.question.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <ScoreSubmit
            game={GAME_ID}
            score={score}
            level={Math.round(adaptive.level)}
            stats={{
              streak: maxStreak,
              accuracy,
              correct: cc,
              total: results.length,
            }}
          />
          {medals.length > 0 && (
            <AchievementToast
              name={medals[0].name}
              tier={medals[0].tier}
              onDismiss={() => setMedals([])}
            />
          )}
          <div className="flex gap-3 w-full">
            <button
              onClick={() => startGame(adaptive.level)}
              className="flex-1 py-3 rounded-xl font-bold bg-violet-600 hover:bg-violet-500 transition flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} /> Play Again
            </button>
            <Link
              href="/games"
              className="flex-1 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition text-center"
            >
              All Games
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
