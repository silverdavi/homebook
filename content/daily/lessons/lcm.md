# LCM — Least Common Multiple

The **least common multiple** (LCM) of two numbers is the **smallest**
number that **both** divide evenly.

It is the opposite kind of question to GCF. GCF goes *down*, LCM goes *up*.

---

## Why it matters

LCM gives you the **common denominator** when you add or subtract
fractions with different denominators. That's its whole job.

```
1/4 + 1/6   →   LCM(4, 6) = 12   →   3/12 + 2/12 = 5/12
```

Pick a *bigger* common denominator and the math still works, but you waste
effort. The LCM is the smallest one that works.

---

## How to find an LCM (the slow, sure way)

1. List the first several **multiples** of each number.
2. Look for the **first number that appears in both lists**.

### Example 1: LCM(4, 6)

- Multiples of 4: 4, 8, **12**, 16, 20, 24, 28, …
- Multiples of 6: 6, **12**, 18, 24, …
- First common: **12**
- LCM = **12**

### Example 2: LCM(5, 7)

- Multiples of 5: 5, 10, 15, 20, 25, 30, **35**, …
- Multiples of 7: 7, 14, 21, 28, **35**, …
- LCM = **35**

When two numbers are coprime (like 5 and 7), the LCM is just their product.

### Example 3: LCM(8, 12)

- Multiples of 8: 8, 16, **24**, 32, …
- Multiples of 12: 12, **24**, 36, …
- LCM = **24**

---

## Fast formula

For any two positive integers a and b:

```
LCM(a, b) = (a × b) / GCF(a, b)
```

So if you already know the GCF, you get the LCM almost for free.

### Example: LCM(18, 24)

- GCF(18, 24) = 6
- LCM = (18 × 24) / 6 = 432 / 6 = **72**

Sanity check: 72 ÷ 18 = 4 ✓, 72 ÷ 24 = 3 ✓.

---

## Things to remember

- **LCM(a, 1) = a** always.
- **LCM(a, a) = a** always.
- **LCM(a, b) ≥ max(a, b)** always.
- If one number divides the other, the **bigger** one **is** the LCM.
  - LCM(6, 18) = 18 (because 6 divides 18).
- If a and b share no factors (coprime), LCM = a × b.

---

## Try these (answers below)

1. LCM(3, 4)
2. LCM(6, 9)
3. LCM(10, 15)
4. LCM(12, 18)

<details>
<summary>Answers</summary>

1. **12** (3 × 4, coprime)
2. **18** (GCF=3, so LCM = 54/3)
3. **30**
4. **36**

</details>
