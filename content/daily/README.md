# Daily — Independent Homeschool Trial

> Week of **May 12 – 15, 2026**
> Student: **Adam**
> Route: `https://teacher.ninja/daily`

---

## What This Is

A four-day, **fully independent** homeschool trial. Each morning Adam opens
`/daily/<today's date>`, reads the brief, studies on his own, and takes
**one** exam (he picks Version A or Version B). Parents do not coach, do not
hint, do not grade in real time. The exam is graded automatically and stored
on Adam's profile.

The point is not to ace every question. The point is to learn the *system*:

1. Read what's expected.
2. Decide how to prepare.
3. Take the test.
4. Use the **note** field on every question to write down what was hard, what
   was confusing, or what he wants to argue.

That's it. Adam owns the day.

---

## Folder Map

```
content/daily/
  README.md                       you are here
  ADAM-PRINCIPLES.md              the trial itself, in his words
  WEEK-2026-05-12.md              the four-day curriculum at a glance

  day-2026-05-12.md               morning brief, Day 1
  day-2026-05-13.md               morning brief, Day 2
  day-2026-05-14.md               morning brief, Day 3
  day-2026-05-15.md               morning brief, Day 4

  lessons/
    gcf.md                        greatest common factor, with examples
    lcm.md                        least common multiple
    fraction-add.md               adding fractions (num/den < 20)
    fraction-sub.md               subtracting fractions (any order)
    fraction-mul.md               multiplying fractions (each < 10)
    fraction-div.md               dividing fractions (each < 10)
    fraction-inverse.md           reciprocals and 1/n of integers
    periodic-table-rows-1-3.md    H to Ar: P, N, e
    history-wars.md               15 wars and the years they started
    evolution-timeline.md         major evolutionary milestones
```

These markdown files are the **source of truth**. The Next.js routes under
`apps/web/app/daily/` import them at build time so the morning brief and
lesson pages render the same text Adam (or his parents) can read here in the
repo.

---

## How a Day Works

1. Adam goes to `/daily/2026-05-12` (or whatever today is).
2. He reads the **morning brief**:
   - Today's exam topics, with 2 worked examples each.
   - The new periodic-table elements for today.
   - The new wars for today.
   - The new evolution events for today.
   - Links to every lesson page.
3. When he's ready, he clicks **Begin Exam (A)** or **Begin Exam (B)**.
   He may take **only one**. The choice is his.
4. The exam runs question-by-question. Every question has:
   - The problem.
   - An input area.
   - A **Note** textarea (always visible, optional).
   - A **Need help?** link to the relevant lesson.
5. After the last question, he submits. He sees his score and which
   questions were right/wrong. The submission is permanent.

---

## "He cannot ask for help" — what that means in practice

- Adam may **not** ask a parent or sibling.
- Adam **may** read any lesson page or wander to `/fractions`.
- Adam **may** write down anything in the Note field, including "this
  question was unfair" or "I think the answer is X but the system says Y".
- Parents review the notes after Adam submits. The notes are how he
  communicates back without breaking independence.

---

## If Adam needs to redo a day

Each day is **single attempt** by design (UNIQUE constraint on
`profile_id, date` in `daily_exams`). If a parent decides a redo is
warranted, run:

```sql
DELETE FROM daily_exams WHERE profile_id = '<adam-id>' AND date = '2026-05-12';
```

against `apps/web/.data/profiles.db`. That clears the row and the day is
fresh again.
