# GCF — Greatest Common Factor

The **greatest common factor** (GCF) of two numbers is the **biggest**
number that divides both of them with no remainder.

Other names you'll see: *greatest common divisor*, *GCD*, *highest common
factor*. Same thing.

---

## Why it matters

GCF lets you simplify a fraction to lowest terms in **one step** instead
of dividing top and bottom over and over.

```
12 / 18  →  GCF(12, 18) = 6  →  (12 ÷ 6) / (18 ÷ 6) = 2 / 3
```

If you don't use the GCF, you'd divide by 2, then by 3 — same answer, two
steps. GCF makes it one step.

---

## How to find a GCF (the slow, sure way)

1. List **all factors** of the first number.
2. List **all factors** of the second number.
3. The **biggest number that appears in both lists** is the GCF.

### Example 1: GCF(12, 18)

- Factors of 12: **1, 2, 3, 4, 6, 12**
- Factors of 18: **1, 2, 3, 6, 9, 18**
- Common: 1, 2, 3, **6**
- GCF = **6**

### Example 2: GCF(15, 20)

- Factors of 15: **1, 3, 5, 15**
- Factors of 20: **1, 2, 4, 5, 10, 20**
- Common: 1, **5**
- GCF = **5**

### Example 3: GCF(7, 9)

- Factors of 7: **1, 7**  (7 is prime)
- Factors of 9: **1, 3, 9**
- Common: **1**
- GCF = **1** — these are *coprime*.

---

## Faster way for two-digit numbers — Euclid's algorithm

This is the trick. Divide the bigger by the smaller, take the remainder,
then divide the smaller by the remainder. Keep going. When the remainder
is 0, the **last non-zero remainder** is the GCF.

### Example: GCF(48, 18)

```
48 ÷ 18 = 2 remainder 12
18 ÷ 12 = 1 remainder 6
12 ÷ 6  = 2 remainder 0   ← stop
GCF = 6
```

### Example: GCF(91, 26)

```
91 ÷ 26 = 3 remainder 13
26 ÷ 13 = 2 remainder 0   ← stop
GCF = 13
```

You can do this in your head once you see the pattern.

---

## Things to remember

- **GCF(a, 1) = 1** always.
- **GCF(a, a) = a** always.
- **GCF(a, b) ≤ min(a, b)** always — it can never be bigger than the
  smaller number.
- If one number divides the other, the smaller one **is** the GCF.
  - GCF(8, 24) = 8 (because 8 divides 24).

---

## Try these (answers below)

1. GCF(9, 16)
2. GCF(20, 50)
3. GCF(36, 24)
4. GCF(7, 14)

<details>
<summary>Answers</summary>

1. **1** (9 and 16 share only the factor 1)
2. **10**
3. **12**
4. **7**

</details>

---

## Where this shows up

Look at the live tool at [/fractions](/fractions) and switch to the **GCF**
mode. You'll see factor lists exactly like the ones above.
