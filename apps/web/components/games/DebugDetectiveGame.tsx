"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Bug, Code2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import type { NewAchievement } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxCombo, sfxLevelUp, sfxGameOver, sfxAchievement, sfxCountdown, sfxCountdownGo } from "@/lib/games/audio";
import { createAdaptiveState, adaptiveUpdate, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import { getGradeForLevel } from "@/lib/games/learning-guide";

/* ─── Types ──────────────────────────────────────────────────────── */

type GamePhase = "menu" | "countdown" | "playing" | "feedback" | "complete";

interface Challenge {
  id: string;
  code: string[];
  question: string;
  choices: string[];
  correctIndex: number;
  bugLine?: number;
  explanation: string;
  difficulty: number;
  category: string;
}

interface RoundResult {
  challenge: Challenge;
  selectedIndex: number;
  correct: boolean;
  fast: boolean;
}

/* ─── Challenge Database (50+ challenges) ────────────────────────── */

const CHALLENGES: Challenge[] = [
  // ═══ DIFFICULTY 1: Simple instruction errors (Grade 4-5) ═══
  { id:"d1-01",difficulty:1,category:"Instructions",code:["Recipe for Scrambled Eggs:","1) Crack eggs into bowl","2) Put eggs in oven","3) Mix the eggs with fork","4) Pour into hot pan","5) Stir until cooked"],question:"What's the bug in this recipe?",choices:["Steps 2 and 3 are in the wrong order","You don't need a fork","You should use cold pan","Step 1 is wrong"],correctIndex:0,bugLine:2,explanation:"You need to mix the eggs BEFORE cooking them! Steps 2 and 3 are swapped." },
  { id:"d1-02",difficulty:1,category:"Instructions",code:["How to brush your teeth:","1) Put toothpaste on brush","2) Rinse your mouth","3) Brush for 2 minutes","4) Spit out toothpaste"],question:"What step is in the wrong place?",choices:["Step 2 should come after step 3","Step 1 should come last","Step 4 should come first","All steps are correct"],correctIndex:0,bugLine:2,explanation:"You should rinse AFTER brushing, not before." },
  { id:"d1-03",difficulty:1,category:"Instructions",code:["Directions to the park:","1) Go north 3 blocks","2) Turn left","3) Go east 2 blocks"],question:"What's wrong with these directions?",choices:["After turning left from north, you'd go west, not east","You should go south first","3 blocks is too far","Nothing is wrong"],correctIndex:0,bugLine:3,explanation:"If you face north and turn left, you face WEST. It should say 'Go west 2 blocks'." },
  { id:"d1-04",difficulty:1,category:"Instructions",code:["Making a sandwich:","1) Get two slices of bread","2) Eat the sandwich","3) Add cheese and ham","4) Put bread on top"],question:"Which steps are out of order?",choices:["Step 2 should be last — eat after assembling","Step 1 should be last","Step 4 is unnecessary","All steps are correct"],correctIndex:0,bugLine:2,explanation:"You can't eat before making it! Step 2 (eat) should come after assembling." },
  { id:"d1-05",difficulty:1,category:"Instructions",code:["Getting ready for school:","1) Wake up","2) Put on shoes","3) Get dressed","4) Eat breakfast","5) Walk to school"],question:"What's the bug?",choices:["Get dressed before putting on shoes","Eat breakfast first","Walking should be step 1","Nothing is wrong"],correctIndex:0,bugLine:2,explanation:"You need to get dressed BEFORE putting on shoes. Steps 2 and 3 are swapped!" },
  { id:"d1-06",difficulty:1,category:"Instructions",code:["Washing your hands:","1) Dry your hands","2) Turn on water","3) Put soap on hands","4) Rub for 20 seconds","5) Rinse with water"],question:"Which step is out of order?",choices:["Step 1 should be last — dry after washing","Step 3 is wrong","Step 5 should be removed","All steps are correct"],correctIndex:0,bugLine:1,explanation:"You dry your hands at the END, not the beginning!" },
  { id:"d1-07",difficulty:1,category:"Instructions",code:["Planting a seed:","1) Water the soil","2) Dig a small hole","3) Put the seed in","4) Cover with soil","5) Wait for it to grow"],question:"What's out of order?",choices:["Dig the hole before watering","Seeds don't need water","Step 5 is wrong","Nothing is wrong"],correctIndex:0,bugLine:1,explanation:"Dig the hole first, then plant, cover, and THEN water." },
  // ═══ DIFFICULTY 2: Simple pseudocode reading (Grade 5) ═══
  { id:"d2-01",difficulty:2,category:"Pseudocode",code:["count = 0","REPEAT 5 times:","  count = count + 2","PRINT count"],question:"What does this code print?",choices:["10","5","2","12"],correctIndex:0,explanation:"The loop adds 2 five times: 0\u21922\u21924\u21926\u21928\u219210. Prints 10." },
  { id:"d2-02",difficulty:2,category:"Pseudocode",code:["total = 0","REPEAT 3 times:","  total = total + 10","PRINT total"],question:"What does this code print?",choices:["30","10","3","13"],correctIndex:0,explanation:"Adds 10 three times: 0\u219210\u219220\u219230." },
  { id:"d2-03",difficulty:2,category:"Pseudocode",code:["x = 5","y = 3","z = x + y","PRINT z"],question:"What does this code print?",choices:["8","53","5","3"],correctIndex:0,explanation:"x=5, y=3, so z = 5 + 3 = 8." },
  { id:"d2-04",difficulty:2,category:"Pseudocode",code:["number = 1","REPEAT 4 times:","  number = number * 2","PRINT number"],question:"What does this code print?",choices:["16","8","4","2"],correctIndex:0,explanation:"Doubling 4 times: 1\u21922\u21924\u21928\u219216." },
  { id:"d2-05",difficulty:2,category:"Pseudocode",code:["message = \"Hello\"","REPEAT 3 times:","  PRINT message"],question:"How many times does 'Hello' appear?",choices:["3","1","0","6"],correctIndex:0,explanation:"PRINT is inside REPEAT 3, so 'Hello' appears 3 times." },
  { id:"d2-06",difficulty:2,category:"Pseudocode",code:["count = 10","REPEAT 4 times:","  count = count - 3","PRINT count"],question:"What does this code print?",choices:["-2","1","7","4"],correctIndex:0,explanation:"10\u21927\u21924\u21921\u2192-2. Prints -2." },
  // ═══ DIFFICULTY 3: Off-by-one & simple bugs (Grade 5-6) ═══
  { id:"d3-01",difficulty:3,category:"Off-by-one",code:["// Count from 1 to 5","count = 0","REPEAT 4 times:","  count = count + 1","  PRINT count"],question:"What's the bug?",choices:["Loop should run 5 times, not 4","count should start at 1","PRINT should be outside the loop","Nothing is wrong"],correctIndex:0,bugLine:2,explanation:"Comment says '1 to 5' but loop runs 4 times \u2014 only prints 1,2,3,4." },
  { id:"d3-02",difficulty:3,category:"Off-by-one",code:["// Add up numbers 1 to 5","total = 0","FOR i = 1 TO 4:","  total = total + i","PRINT total"],question:"What's wrong with this code?",choices:["Loop goes to 4 instead of 5 \u2014 misses the last number","total should start at 1","Should subtract","Nothing is wrong"],correctIndex:0,bugLine:2,explanation:"Loop goes to 4 but should go to 5. Gets 10 instead of 15." },
  { id:"d3-03",difficulty:3,category:"Simple Bug",code:["temperature = 30","IF temperature > 25:","  PRINT \"It's cold outside!\"","ELSE:","  PRINT \"It's warm outside!\""],question:"What's the bug?",choices:["Messages swapped \u2014 30\u00B0C is warm, not cold","25 should be 30","IF should use <","Nothing is wrong"],correctIndex:0,bugLine:2,explanation:"When temperature (30) > 25, it says 'cold' but 30\u00B0C is warm! Messages are swapped." },
  { id:"d3-04",difficulty:3,category:"Simple Bug",code:["age = 15","IF age >= 16:","  PRINT \"You can drive!\"","PRINT \"You are old enough.\""],question:"A 15-year-old runs this. What happens?",choices:["Prints 'You are old enough.' which is misleading","Prints 'You can drive!'","Prints nothing","Causes an error"],correctIndex:0,bugLine:3,explanation:"Second PRINT isn't inside the IF, so it ALWAYS runs. Misleading for a 15-year-old!" },
  { id:"d3-05",difficulty:3,category:"Off-by-one",code:["// Print even numbers from 2 to 10","number = 2","WHILE number < 10:","  PRINT number","  number = number + 2"],question:"What does this print?",choices:["2, 4, 6, 8 \u2014 it misses 10!","2, 4, 6, 8, 10","1, 2, 3, 4, 5","Prints nothing"],correctIndex:0,bugLine:2,explanation:"Condition 'number < 10' stops before 10. Should be 'number <= 10'." },
  { id:"d3-06",difficulty:3,category:"Simple Bug",code:["price = 10","discount = 20","finalPrice = price - discount","PRINT \"You pay: \" + finalPrice"],question:"What's wrong?",choices:["Discount should be a % \u2014 gives negative price!","price should be higher","PRINT is wrong","Nothing is wrong"],correctIndex:0,bugLine:2,explanation:"10 - 20 = -10! Should be: price - (price * discount / 100) = $8." },
  { id:"d3-07",difficulty:3,category:"Simple Bug",code:["// Find the biggest number","numbers = [5, 12, 3, 8]","biggest = 0","FOR each n in numbers:","  IF n > biggest:","    biggest = n","PRINT biggest"],question:"What if all numbers were negative?",choices:["biggest starts at 0, so negatives never beat it","Prints the smallest","It would crash","Works for all cases"],correctIndex:0,bugLine:2,explanation:"If numbers were [-5,-3,-8], none beat 0. Start with first element instead." },
  // ═══ DIFFICULTY 4: Variable & logic bugs (Grade 6-7) ═══
  { id:"d4-01",difficulty:4,category:"Logic Error",code:["password = \"abc123\"","input = ask(\"Enter password:\")","IF input = \"abc123\":","  PRINT \"Access denied\"","ELSE:","  PRINT \"Welcome!\""],question:"What's the bug?",choices:["Messages swapped \u2014 correct password should say Welcome","Password is too simple","ask() doesn't work","Nothing is wrong"],correctIndex:0,bugLine:3,explanation:"Correct password says 'Access denied'! The messages are backwards." },
  { id:"d4-02",difficulty:4,category:"Logic Error",code:["score = 85","IF score >= 90:","  grade = \"A\"","IF score >= 80:","  grade = \"B\"","IF score >= 70:","  grade = \"C\"","PRINT grade"],question:"What grade does score 85 get?",choices:["C \u2014 each IF overwrites the previous","B \u2014 correct","A \u2014 highest","Error"],correctIndex:0,bugLine:5,explanation:"85\u226580\u2192B, then 85\u226570\u2192C overwrites! Use IF/ELSE IF." },
  { id:"d4-03",difficulty:4,category:"Logic Error",code:["x = 10","y = 5","average = x + y / 2","PRINT average"],question:"What does this print?",choices:["12.5 \u2014 order of operations bug","7.5 \u2014 the correct average","15","5"],correctIndex:0,bugLine:2,explanation:"y/2 = 2.5 first, then 10 + 2.5 = 12.5. Need (x + y) / 2." },
  { id:"d4-04",difficulty:4,category:"Logic Error",code:["// Check if between 1 and 10","number = 15","IF number > 1 OR number < 10:","  PRINT \"In range!\"","ELSE:","  PRINT \"Out of range!\""],question:"What prints for number = 15?",choices:["'In range!' \u2014 should use AND, not OR","'Out of range!'","Error","Nothing"],correctIndex:0,bugLine:2,explanation:"15 > 1 is TRUE. With OR, that's enough. Should use AND." },
  { id:"d4-05",difficulty:4,category:"Logic Error",code:["// Double a number","x = 5","x = x * x","PRINT x"],question:"What's the bug?",choices:["x*x squares it (25), not doubles. Use x*2","x should start at 10","Use addition","Nothing is wrong"],correctIndex:0,bugLine:2,explanation:"x*x = 25 (squared). To double: x = x * 2 = 10." },
  { id:"d4-06",difficulty:4,category:"Variable Bug",code:["// Swap two numbers","a = 5","b = 10","a = b","b = a","PRINT a, b"],question:"What does this print?",choices:["10, 10 \u2014 original a value is lost!","10, 5 \u2014 swapped","5, 10 \u2014 unchanged","5, 5"],correctIndex:0,bugLine:3,explanation:"After 'a = b', a is 10. Then 'b = a' also gives 10. Need a temp variable!" },
  { id:"d4-07",difficulty:4,category:"Logic Error",code:["// Is the number positive?","n = -5","IF n != 0:","  PRINT \"Positive!\"","ELSE:","  PRINT \"Not positive\""],question:"What's wrong?",choices:["!= 0 is true for negatives too \u2014 use n > 0","n should be 0","ELSE is wrong","Nothing is wrong"],correctIndex:0,bugLine:2,explanation:"-5 != 0 is TRUE, so it says 'Positive!' but -5 is negative. Check n > 0." },
  // ═══ DIFFICULTY 5: Loop & condition bugs (Grade 7-8) ═══
  { id:"d5-01",difficulty:5,category:"Loop Bug",code:["total = 0","FOR i = 1 TO 10:","  IF i is even:","    total = total + i","PRINT \"Sum of odd numbers:\", total"],question:"What's the bug?",choices:["Sums EVEN numbers but label says 'odd'","Loop should start at 0","total should start at 1","Nothing is wrong"],correctIndex:0,bugLine:4,explanation:"The IF checks even numbers but the label says 'odd'. Mismatch!" },
  { id:"d5-02",difficulty:5,category:"Loop Bug",code:["// Countdown: 10, 9, 8, ... 1","i = 10","WHILE i > 0:","  PRINT i","  i = i + 1"],question:"What happens?",choices:["Infinite loop \u2014 i increases not decreases","Counts down correctly","Prints 10 once","Error"],correctIndex:0,bugLine:4,explanation:"i increases (10,11,12...) so i > 0 is always true. Should be i = i - 1." },
  { id:"d5-03",difficulty:5,category:"Logic Error",code:["// Is this a leap year?","year = 2024","IF year / 4 has no remainder:","  PRINT \"Leap year!\"","ELSE:","  PRINT \"Not a leap year\""],question:"What does this miss?",choices:["Years \u00F7100 aren't leap years (unless \u00F7400)","Check \u00F7 2","2024 isn't a leap year","Fully correct"],correctIndex:0,bugLine:2,explanation:"1900 \u00F7 4 = 0 remainder, but 1900 is NOT a leap year. Need the full rule." },
  { id:"d5-04",difficulty:5,category:"Loop Bug",code:["// Search for 7","numbers = [3, 5, 7, 9, 11]","found = false","FOR each n in numbers:","  IF n == 7:","    found = true","  ELSE:","    found = false","PRINT found"],question:"What does this print?",choices:["false \u2014 checking 9 resets found","true \u2014 7 is in the list","Error","7"],correctIndex:0,bugLine:7,explanation:"When n=7, found=true. But n=9 sets found=false! Remove the ELSE." },
  { id:"d5-05",difficulty:5,category:"Loop Bug",code:["// Multiply all numbers","numbers = [2, 3, 4]","product = 0","FOR each n in numbers:","  product = product * n","PRINT product"],question:"What does this print?",choices:["0 \u2014 anything times 0 is 0","24 \u2014 correct product","9 \u2014 the sum","Error"],correctIndex:0,bugLine:2,explanation:"product starts at 0. 0\u00D72=0, 0\u00D73=0, 0\u00D74=0. Always 0! Start at 1." },
  { id:"d5-06",difficulty:5,category:"Logic Error",code:["// Discount based on purchase","purchase = 150","IF purchase > 100:","  discount = 10","IF purchase > 50:","  discount = 5","PRINT discount, \"%\""],question:"What discount does $150 get?",choices:["5% \u2014 second IF overwrites 10%","10%","15%","0%"],correctIndex:0,bugLine:4,explanation:"150>100\u2192discount=10. Then 150>50\u2192discount=5 overwrites! Use ELSE IF." },
  { id:"d5-07",difficulty:5,category:"Loop Bug",code:["// Count vowels","word = \"hello\"","vowels = 0","FOR each letter in word:","  IF letter == \"a\" OR \"e\" OR \"i\" OR \"o\" OR \"u\":","    vowels = vowels + 1","PRINT vowels"],question:"What's the bug in the IF?",choices:["Need: letter==\"a\" OR letter==\"e\" ...","Vowel list incomplete","Use AND not OR","Nothing is wrong"],correctIndex:0,bugLine:4,explanation:"'letter == \"a\" OR \"e\"' doesn't compare letter to \"e\". Need full checks." },
  // ═══ DIFFICULTY 6: Trace execution (Grade 8-9) ═══
  { id:"d6-01",difficulty:6,category:"Trace",code:["x = 5","y = 3","x = x + y","y = x - y","x = x - y","PRINT x, y"],question:"What does this print?",choices:["3, 5 (swaps the values!)","5, 3 (unchanged)","8, 5","8, 3"],correctIndex:0,explanation:"x=5+3=8, y=8-3=5, x=8-5=3. So x=3, y=5. Swap without temp!" },
  { id:"d6-02",difficulty:6,category:"Trace",code:["a = 1","b = 1","REPEAT 4 times:","  c = a + b","  a = b","  b = c","PRINT b"],question:"What does this print?",choices:["8","5","13","3"],correctIndex:0,explanation:"Fibonacci: (1,1)\u2192(1,2)\u2192(2,3)\u2192(3,5)\u2192(5,8). Prints 8." },
  { id:"d6-03",difficulty:6,category:"Trace",code:["x = 10","result = 0","WHILE x > 0:","  result = result + x","  x = x - 3","PRINT result"],question:"What does this print?",choices:["22","10","7","15"],correctIndex:0,explanation:"x=10\u2192r=10, x=7\u2192r=17, x=4\u2192r=21, x=1\u2192r=22, x=-2 stop. Prints 22." },
  { id:"d6-04",difficulty:6,category:"Trace",code:["n = 5","result = 1","WHILE n > 1:","  result = result * n","  n = n - 1","PRINT result"],question:"What does this print?",choices:["120","24","60","5"],correctIndex:0,explanation:"5! = 1\u00D75=5, \u00D74=20, \u00D73=60, \u00D72=120. Prints 120." },
  { id:"d6-05",difficulty:6,category:"Trace",code:["text = \"ABCDE\"","result = \"\"","FOR i = length(text) DOWN TO 1:","  result = result + text[i]","PRINT result"],question:"What does this print?",choices:["EDCBA","ABCDE","EEEEE","AABCD"],correctIndex:0,explanation:"Reads backwards: E,D,C,B,A \u2192 'EDCBA'. String reversal!" },
  { id:"d6-06",difficulty:6,category:"Logic Error",code:["// Check if all tests passed","scores = [85, 92, 45, 78]","allPassed = true","FOR each score in scores:","  IF score >= 50:","    allPassed = true","  ELSE:","    allPassed = false","PRINT allPassed"],question:"Score 45 is below 50. What prints?",choices:["true \u2014 78 resets allPassed","false \u2014 correct","45","Error"],correctIndex:0,bugLine:5,explanation:"When score=45, allPassed=false. But score=78 sets it true again! Only set false." },
  // ═══ DIFFICULTY 7: Complex debugging (Grade 9-10) ═══
  { id:"d7-01",difficulty:7,category:"Infinite Loop",code:["x = 100","WHILE x != 0:","  x = x - 3","PRINT \"Done\""],question:"Will this loop ever end?",choices:["No \u2014 100 isn't divisible by 3, x skips past 0","Yes \u2014 counts to 0","Stops at 1","Error"],correctIndex:0,bugLine:1,explanation:"100 mod 3 = 1, so x goes ...4, 1, -2, -5... never exactly 0. Use 'x > 0'." },
  { id:"d7-02",difficulty:7,category:"Index Error",code:["// Get the last element","list = [10, 20, 30, 40, 50]","last = list[5]","PRINT last"],question:"What's wrong?",choices:["Index 5 is out of bounds \u2014 last index is 4","List is too short","Use list[-1]","Nothing is wrong"],correctIndex:0,bugLine:2,explanation:"Arrays start at 0. Five elements \u2192 indices 0-4. Index 5 is out of bounds!" },
  { id:"d7-03",difficulty:7,category:"Scope Error",code:["IF true:","  message = \"Hello!\"","","PRINT message"],question:"In some languages, what's the issue?",choices:["message inside IF may not exist outside (scope)","true is not valid","Empty line error","Nothing is wrong"],correctIndex:0,bugLine:1,explanation:"In many languages, variables inside a block only exist there. Define before IF." },
  { id:"d7-04",difficulty:7,category:"Logic Error",code:["function isEven(n):","  IF n / 2 == 0:","    RETURN true","  ELSE:","    RETURN false"],question:"Is isEven(4) correct?",choices:["No \u2014 4/2=2 (not 0). Use n % 2 == 0","Yes \u2014 returns true","Error","Returns false for all"],correctIndex:0,bugLine:1,explanation:"n/2 gives quotient (4/2=2), not remainder. Use modulo: 4 % 2 = 0." },
  { id:"d7-05",difficulty:7,category:"Trace",code:["function mystery(n):","  IF n <= 1:","    RETURN n","  RETURN mystery(n-1) + mystery(n-2)","","PRINT mystery(6)"],question:"What does mystery(6) return?",choices:["8","6","13","21"],correctIndex:0,explanation:"Fibonacci! f(0)=0, f(1)=1, f(2)=1, f(3)=2, f(4)=3, f(5)=5, f(6)=8." },
  { id:"d7-06",difficulty:7,category:"Logic Error",code:["// Return true if n is prime","function isPrime(n):","  FOR i = 2 TO n:","    IF n % i == 0:","      RETURN false","  RETURN true"],question:"What's the bug?",choices:["Loop goes to n \u2014 n%n always 0, so always false","Start at 1","Return values swapped","Nothing is wrong"],correctIndex:0,bugLine:2,explanation:"n % n = 0 always, returns false for ALL numbers. Loop to n-1 (or \u221An)." },
  { id:"d7-07",difficulty:7,category:"Index Error",code:["// Reverse array in place","arr = [1, 2, 3, 4, 5]","FOR i = 0 TO length(arr):","  j = length(arr) - 1 - i","  swap arr[i] and arr[j]","PRINT arr"],question:"What's the bug?",choices:["Swaps all then swaps back \u2014 go to half only","j is wrong","Start at 1","Nothing is wrong"],correctIndex:0,bugLine:2,explanation:"Loop swaps pairs twice! i=0 swaps [0]\u2194[4], i=4 swaps [4]\u2194[0] undoing it. Go to length/2." },
  // ═══ DIFFICULTY 8: Complex/Advanced (Grade 11+) ═══
  { id:"d8-01",difficulty:8,category:"Infinite Loop",code:["list = [1, 2, 3]","FOR each item in list:","  IF item == 2:","    list.append(4)","  PRINT item"],question:"What happens?",choices:["Modifying list while iterating \u2014 potentially infinite","Prints 1, 2, 3, 4","Prints 1, 2, 3","Skips 2"],correctIndex:0,bugLine:3,explanation:"Modifying a collection while iterating is dangerous. May loop endlessly." },
  { id:"d8-02",difficulty:8,category:"Logic Error",code:["function binarySearch(arr, target):","  low = 0","  high = length(arr) - 1","  WHILE low <= high:","    mid = (low + high) / 2","    IF arr[mid] == target:","      RETURN mid","    ELSE IF arr[mid] < target:","      low = mid","    ELSE:","      high = mid","  RETURN -1"],question:"What's the bug?",choices:["low=mid can cause infinite loop \u2014 use mid\u00B11","mid calculation wrong","Use < not <=","Nothing is wrong"],correctIndex:0,bugLine:8,explanation:"When low=mid (not mid+1), search space may never shrink. Use mid\u00B11." },
  { id:"d8-03",difficulty:8,category:"Type Error",code:["age = ask(\"Enter your age: \")","IF age >= 18:","  PRINT \"You can vote!\"","ELSE:","  PRINT \"Too young.\""],question:"User types '25'. What might go wrong?",choices:["ask() returns string '25', not number","25 >= 18 always true","ELSE never runs","Nothing is wrong"],correctIndex:0,bugLine:0,explanation:"User input is a STRING. String '25' >= 18 doesn't compare correctly. Need toNumber()." },
  { id:"d8-04",difficulty:8,category:"Edge Case",code:["function divide(a, b):","  RETURN a / b","","result = divide(10, 0)","PRINT result"],question:"What happens?",choices:["Division by zero error \u2014 no check for b=0","Prints 0","Prints infinity","Prints 10"],correctIndex:0,bugLine:1,explanation:"Dividing by zero crashes. The function should check if b == 0 first." },
  { id:"d8-05",difficulty:8,category:"Concurrency",code:["counter = 0","","function increment():","  temp = counter","  temp = temp + 1","  counter = temp","","// Run increment() 1000x in parallel","PRINT counter"],question:"After 1000 parallel calls, what might counter be?",choices:["Less than 1000 \u2014 race condition","Exactly 1000","More than 1000","Error"],correctIndex:0,bugLine:3,explanation:"Race condition! Two threads read same value, both write same result. Need locks." },
  { id:"d8-06",difficulty:8,category:"Logic Error",code:["// Sort ascending","function bubbleSort(arr):","  FOR i = 0 TO length(arr)-1:","    FOR j = 0 TO length(arr)-1:","      IF arr[j] > arr[j+1]:","        swap arr[j], arr[j+1]","  RETURN arr"],question:"What's the bug?",choices:["Inner loop: arr[j+1] out of bounds on last index","Use < not >","Outer loop unnecessary","Nothing is wrong"],correctIndex:0,bugLine:3,explanation:"When j=length-1, arr[j+1] is beyond the array! Inner loop should go to length-2." },
  { id:"d8-07",difficulty:8,category:"Trace",code:["function power(base, exp):","  IF exp == 0:","    RETURN 1","  IF exp is even:","    half = power(base, exp/2)","    RETURN half * half","  ELSE:","    RETURN base * power(base, exp-1)","","PRINT power(2, 10)"],question:"What does power(2, 10) return?",choices:["1024","20","100","512"],correctIndex:0,explanation:"Fast exponentiation: 2^10 = 1024." },
  { id:"d8-08",difficulty:8,category:"Edge Case",code:["function findMax(arr):","  IF length(arr) == 0:","    RETURN null","  max = arr[0]","  FOR i = 0 TO length(arr)-1:","    IF arr[i] > max:","      max = arr[i]","  RETURN max"],question:"What's the subtle inefficiency?",choices:["Loop starts at 0, compares arr[0] to itself. Start at 1","Doesn't handle negatives","Should return index","Nothing is wrong"],correctIndex:0,bugLine:4,explanation:"max is arr[0], so arr[0]>arr[0] on first iteration is wasted. Start at i=1." },
  { id:"d8-09",difficulty:8,category:"Logic Error",code:["// Check palindrome","function isPalindrome(s):","  reversed = reverse(s)","  IF s == reversed:","    RETURN true","  RETURN false"],question:"isPalindrome(\"Racecar\") returns false. Why?",choices:["Capital R doesn't match lowercase r \u2014 need toLower()","reverse() is wrong","Racecar isn't a palindrome","Always returns false"],correctIndex:0,bugLine:3,explanation:"'Racecar' reversed is 'racecaR'. Capital R \u2260 lowercase r. Use toLower() first." },
  { id:"d8-10",difficulty:8,category:"Trace",code:["function gcd(a, b):","  WHILE b != 0:","    temp = b","    b = a % b","    a = temp","  RETURN a","","PRINT gcd(48, 18)"],question:"What does gcd(48, 18) return?",choices:["6","3","18","48"],correctIndex:0,explanation:"Euclid: (48,18)\u2192(18,12)\u2192(12,6)\u2192(6,0)\u2192return 6." },
];

/* ─── Helpers ─────────────────────────────────────────────────────── */

const GAME_ID = "debug-detective";
const QUESTIONS_PER_GAME = 10;
const COUNTDOWN_SECS = 3;

function difficultyForLevel(level: number): number {
  if (level <= 5) return 1;
  if (level <= 10) return 2;
  if (level <= 14) return 3;
  if (level <= 18) return 4;
  if (level <= 25) return 5;
  if (level <= 32) return 6;
  if (level <= 40) return 7;
  return 8;
}

function pickChallenges(level: number): Challenge[] {
  const target = difficultyForLevel(level);
  const eligible = CHALLENGES.filter(c => Math.abs(c.difficulty - target) <= 1);
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, QUESTIONS_PER_GAME).map(c => {
    const indices = c.choices.map((_, i) => i);
    const si = [...indices].sort(() => Math.random() - 0.5);
    const nc = si.indexOf(c.correctIndex);
    return { ...c, choices: si.map(i => c.choices[i]), correctIndex: nc };
  });
}

/* ─── Component ──────────────────────────────────────────────────── */

export function DebugDetectiveGame() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [highScore, setHighScoreState] = useState(0);
  const [medals, setMedals] = useState<NewAchievement[]>([]);
  const [adjustAnim, setAdjustAnim] = useState<"up" | "down" | null>(null);
  const roundStartRef = useRef(Date.now());

  useGameMusic();

  useEffect(() => { setHighScoreState(getLocalHighScore(GAME_ID)); }, []);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      sfxCountdownGo();
      setChallenges(pickChallenges(adaptive.level));
      setCurrentIdx(0);
      setPhase("playing");
      roundStartRef.current = Date.now();
      return;
    }
    sfxCountdown();
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, adaptive.level]);

  const startGame = useCallback((startLevel: number) => {
    setAdaptive(createAdaptiveState(startLevel));
    setScore(0); setStreak(0); setMaxStreak(0); setResults([]);
    setCurrentIdx(0); setSelectedChoice(null);
    setCountdown(COUNTDOWN_SECS); setPhase("countdown");
  }, []);

  const challenge = challenges[currentIdx];

  const handleAnswer = useCallback((idx: number) => {
    if (!challenge || selectedChoice !== null) return;
    setSelectedChoice(idx);
    const correct = idx === challenge.correctIndex;
    const elapsed = Date.now() - roundStartRef.current;
    const fast = elapsed < 8000;
    const { mult } = getMultiplierFromStreak(streak);
    let pts = 0;
    if (correct) { pts = Math.round((fast ? 150 : 100) * mult); sfxCorrect(); }
    else { sfxWrong(); }
    setScore(s => s + pts);
    const newStreak = correct ? streak + 1 : 0;
    setStreak(newStreak);
    if (newStreak > maxStreak) setMaxStreak(newStreak);
    if (newStreak > 0 && newStreak % 5 === 0) sfxCombo(newStreak);
    const newAdaptive = adaptiveUpdate(adaptive, correct, fast && correct);
    setAdaptive(newAdaptive);
    if (newAdaptive.lastAdjust && newAdaptive.lastAdjustTime > adaptive.lastAdjustTime) {
      setAdjustAnim(newAdaptive.lastAdjust);
      setTimeout(() => setAdjustAnim(null), 1200);
      if (newAdaptive.lastAdjust === "up") sfxLevelUp();
    }
    setResults(prev => [...prev, { challenge, selectedIndex: idx, correct, fast }]);
    setPhase("feedback");
  }, [challenge, selectedChoice, streak, maxStreak, adaptive]);

  const nextChallenge = useCallback(() => {
    if (currentIdx + 1 >= challenges.length) {
      const finalScore = score;
      if (finalScore > highScore) { setLocalHighScore(GAME_ID, finalScore); setHighScoreState(finalScore); }
      const profile = getProfile();
      const cc = results.filter(r => r.correct).length;
      const gameStats = { gameId: GAME_ID, score: finalScore, bestStreak: maxStreak, bestCombo: maxStreak, accuracy: Math.round(cc / Math.max(1, results.length) * 100), solved: cc, perfectLevels: cc === results.length ? 1 : 0 };
      const nm = checkAchievements(gameStats, profile.totalGamesPlayed, profile.gamesPlayedByGameId);
      setMedals(nm);
      if (nm.length > 0) sfxAchievement();
      trackGamePlayed(GAME_ID, finalScore, { bestStreak: maxStreak, adaptiveLevel: Math.round(adaptive.level) });
      sfxGameOver(); setPhase("complete");
    } else {
      setCurrentIdx(i => i + 1); setSelectedChoice(null);
      roundStartRef.current = Date.now(); setPhase("playing");
    }
  }, [currentIdx, challenges.length, score, highScore, maxStreak, results, adaptive]);

  const dl = getDifficultyLabel(adaptive.level);
  const gradeInfo = getGradeForLevel(adaptive.level);
  const accuracy = results.length > 0 ? Math.round(results.filter(r => r.correct).length / results.length * 100) : 0;

  /* ── MENU ── */
  if (phase === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 text-white flex flex-col">
        <div className="p-4 flex items-center gap-3">
          <Link href="/games" className="text-white/60 hover:text-white"><ArrowLeft size={24} /></Link>
          <h1 className="text-2xl font-bold">Debug Detective</h1>
          <AudioToggles />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto gap-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🐛</div>
            <h2 className="text-3xl font-extrabold mb-2">Find the Bug!</h2>
            <p className="text-white/60 text-sm">Read code snippets and spot errors. Think like a programmer and debug like a pro!</p>
          </div>
          <div className="w-full bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-bold text-amber-400 mb-2">Skills You&apos;ll Learn</h3>
            <div className="grid grid-cols-2 gap-1.5 text-xs text-white/70">
              <div>🟢 Spot wrong order</div>
              <div>🟡 Read pseudocode</div>
              <div>🟠 Off-by-one bugs</div>
              <div>🔴 Trace variables</div>
              <div>💥 Logic errors</div>
              <div>🔥 Infinite loops</div>
              <div>⚡ Scope &amp; index bugs</div>
              <div>👑 Edge cases</div>
            </div>
          </div>
          <div className="w-full space-y-2">
            <p className="text-xs text-white/40 text-center">Choose starting level</p>
            {[
              { label: "Grade 4-5", desc: "Simple instructions", level: 1, color: "#22c55e" },
              { label: "Grade 5-6", desc: "Pseudocode & off-by-one", level: 11, color: "#eab308" },
              { label: "Grade 7-8", desc: "Logic & loop bugs", level: 26, color: "#ef4444" },
              { label: "Grade 9+", desc: "Trace & advanced bugs", level: 33, color: "#a855f7" },
            ].map(opt => (
              <button key={opt.level} onClick={() => startGame(opt.level)} className="w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-between hover:scale-[1.02] transition-transform" style={{ backgroundColor: opt.color + "22", border: `1px solid ${opt.color}44` }}>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl font-black tabular-nums animate-pulse">{countdown || "GO!"}</div>
          <p className="text-white/40 mt-2">Time to find some bugs...</p>
        </div>
      </div>
    );
  }

  /* ── HUD ── */
  const HUD = (
    <div className="p-3 flex items-center justify-between bg-black/30 text-sm">
      <div className="flex items-center gap-2">
        <Link href="/games" className="text-white/40 hover:text-white"><ArrowLeft size={18} /></Link>
        <Bug size={16} className="text-amber-400" />
        <span className="font-bold">{score.toLocaleString()}</span>
        {streak >= 3 && <StreakBadge streak={streak} />}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold" style={{ color: dl.color }}>{dl.emoji} {dl.label}</span>
        <span className="text-xs text-white/50">Lvl {Math.round(adaptive.level)} · {gradeInfo.label}</span>
        {adjustAnim && <span className={`text-xs font-bold animate-bounce ${adjustAnim === "up" ? "text-green-400" : "text-red-400"}`}>{adjustAnim === "up" ? "▲" : "▼"}</span>}
      </div>
      <div className="text-xs text-white/40">{currentIdx + 1}/{challenges.length}</div>
    </div>
  );

  /* ── PLAYING ── */
  if (phase === "playing" && challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 text-white flex flex-col">
        {HUD}
        <div className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-3">
            <Code2 size={14} className="text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">{challenge.category}</span>
          </div>
          <div className="rounded-xl overflow-hidden border border-white/10 mb-4">
            <div className="bg-slate-800/80 px-4 py-2 flex items-center gap-2 text-xs text-white/40 border-b border-white/5">
              <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-green-500/60" /></div>
              <span className="ml-2 font-mono">code.pseudo</span>
            </div>
            <div className="bg-slate-900/90 p-4 font-mono text-sm leading-relaxed overflow-x-auto">
              {challenge.code.map((line, i) => (
                <div key={i} className="flex">
                  <span className="text-white/20 select-none w-8 text-right mr-4 shrink-0">{i + 1}</span>
                  <span className={`whitespace-pre ${line.startsWith("//") ? "text-green-400/70" : "text-white/90"}`}>{line || "\u00A0"}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="font-bold text-white/90 mb-3 text-center">{challenge.question}</p>
          <div className="space-y-2">
            {challenge.choices.map((choice, i) => (
              <button key={i} onClick={() => handleAnswer(i)} className="w-full py-3 px-4 rounded-xl text-sm text-left transition-all bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20">
                <span className="text-white/40 mr-2 font-mono">{String.fromCharCode(65 + i)}.</span>{choice}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── FEEDBACK ── */
  if (phase === "feedback" && challenge && selectedChoice !== null) {
    const correct = selectedChoice === challenge.correctIndex;
    const lastResult = results[results.length - 1];
    const pts = lastResult?.correct ? (lastResult.fast ? 150 : 100) : 0;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 text-white flex flex-col">
        {HUD}
        <div className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
          <div className={`rounded-xl p-3 mb-4 text-center text-sm font-bold ${correct ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-400" : "bg-red-600/20 border border-red-500/30 text-red-400"}`}>
            {correct ? <div className="flex items-center justify-center gap-2"><CheckCircle2 size={18} /> Correct! {pts > 0 && `+${pts} points`}</div> : <div className="flex items-center justify-center gap-2"><XCircle size={18} /> Not quite!</div>}
          </div>
          <div className="rounded-xl overflow-hidden border border-white/10 mb-4">
            <div className="bg-slate-800/80 px-4 py-2 flex items-center gap-2 text-xs text-white/40 border-b border-white/5">
              <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-green-500/60" /></div>
              <span className="ml-2 font-mono">code.pseudo</span>
            </div>
            <div className="bg-slate-900/90 p-4 font-mono text-sm leading-relaxed overflow-x-auto">
              {challenge.code.map((line, i) => {
                const isBug = challenge.bugLine !== undefined && i === challenge.bugLine;
                return (
                  <div key={i} className={`flex rounded px-1 -mx-1 ${isBug ? (correct ? "bg-emerald-500/15 border-l-2 border-emerald-400" : "bg-red-500/15 border-l-2 border-red-400") : ""}`}>
                    <span className="text-white/20 select-none w-8 text-right mr-4 shrink-0">{i + 1}</span>
                    <span className={`whitespace-pre ${line.startsWith("//") ? "text-green-400/70" : "text-white/90"}`}>{line || "\u00A0"}</span>
                    {isBug && <span className="ml-2 shrink-0"><AlertTriangle size={14} className={correct ? "text-emerald-400" : "text-red-400"} /></span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-2 mb-4">
            {challenge.choices.map((choice, i) => {
              const isSel = selectedChoice === i;
              const isCor = i === challenge.correctIndex;
              let bg = "bg-white/5 border border-white/10 opacity-50";
              if (isSel && isCor) bg = "bg-emerald-600/30 border border-emerald-500/40";
              else if (isSel && !isCor) bg = "bg-red-600/30 border border-red-500/40";
              else if (isCor) bg = "bg-emerald-600/20 border border-emerald-500/30";
              return (
                <div key={i} className={`w-full py-3 px-4 rounded-xl text-sm text-left ${bg}`}>
                  <span className="text-white/40 mr-2 font-mono">{String.fromCharCode(65 + i)}.</span>{choice}
                  {isCor && <span className="ml-2 text-emerald-400">✓</span>}
                  {isSel && !isCor && <span className="ml-2 text-red-400">✗</span>}
                </div>
              );
            })}
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-amber-400 mb-1">Explanation</p>
            <p className="text-sm text-white/90 leading-relaxed">{challenge.explanation}</p>
          </div>
          <button onClick={nextChallenge} className="w-full py-3 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 transition-colors">
            {currentIdx + 1 >= challenges.length ? "See Results" : "Next Challenge →"}
          </button>
        </div>
      </div>
    );
  }

  /* ── COMPLETE ── */
  if (phase === "complete") {
    const cc = results.filter(r => r.correct).length;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 text-white flex flex-col">
        <div className="p-4 flex items-center gap-3">
          <Link href="/games" className="text-white/60 hover:text-white"><ArrowLeft size={24} /></Link>
          <h1 className="text-xl font-bold">Investigation Complete</h1>
        </div>
        <div className="flex-1 flex flex-col items-center p-4 max-w-lg mx-auto gap-4">
          <div className="text-center">
            <Trophy size={48} className="text-amber-400 mx-auto mb-2" />
            <div className="text-4xl font-black">{score.toLocaleString()}</div>
            <p className="text-white/40 text-sm">Debug Score</p>
            {score > highScore && score > 0 && <p className="text-amber-400 text-xs font-bold mt-1">New Personal Best!</p>}
          </div>
          <div className="w-full grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center"><div className="text-2xl font-bold">{cc}/{results.length}</div><p className="text-xs text-white/40">Correct</p></div>
            <div className="bg-white/5 rounded-xl p-3 text-center"><div className="text-2xl font-bold">{accuracy}%</div><p className="text-xs text-white/40">Accuracy</p></div>
            <div className="bg-white/5 rounded-xl p-3 text-center"><div className="text-2xl font-bold">{maxStreak}</div><p className="text-xs text-white/40">Best Streak</p></div>
          </div>
          <div className="w-full bg-white/5 rounded-xl p-3">
            <div className="flex justify-between text-xs mb-1"><span className="text-white/40">Difficulty Reached</span><span className="font-bold" style={{ color: dl.color }}>{dl.emoji} {dl.label}</span></div>
            <div className="flex justify-between text-xs"><span className="text-white/40">Grade Level</span><span className="font-bold">{gradeInfo.label} · Lvl {Math.round(adaptive.level)}</span></div>
          </div>
          <div className="w-full bg-white/5 rounded-xl p-3">
            <p className="text-xs font-bold text-white/60 mb-2">Round by Round</p>
            <div className="space-y-1">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${r.correct ? "bg-emerald-600/30 text-emerald-400" : "bg-red-600/30 text-red-400"}`}>{r.correct ? "✓" : "✗"}</span>
                  <span className="text-white/60 truncate flex-1">{r.challenge.question}</span>
                  <span className="text-white/30 text-[10px]">{r.challenge.category}</span>
                </div>
              ))}
            </div>
          </div>
          <ScoreSubmit game={GAME_ID} score={score} level={Math.round(adaptive.level)} stats={{ streak: maxStreak, accuracy, correct: cc, total: results.length }} />
          {medals.length > 0 && <AchievementToast name={medals[0].name} tier={medals[0].tier} onDismiss={() => setMedals([])} />}
          <div className="flex gap-3 w-full">
            <button onClick={() => startGame(adaptive.level)} className="flex-1 py-3 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 transition flex items-center justify-center gap-2"><RotateCcw size={16} /> Play Again</button>
            <Link href="/games" className="flex-1 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition text-center">All Games</Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
