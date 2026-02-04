# Word Problems Templates Agent

> Session: wordproblems-templates
> Budget: $25
> Started: 2026-02-04

## YOUR OWNERSHIP
You exclusively own and can edit:
- `packages/generator/templates/` (all template files)
- `packages/generator/src/renderer.py`

## DO NOT TOUCH
These directories are owned by other agents:
- `apps/web/` (Frontend Agent)
- `packages/generator/src/generators/` (Generator Agent)
- `packages/generator/src/cache.py` (Caching Agent)

## YOUR MISSION
Update the HTML/Jinja2 templates to properly render word problems. Word problems need different styling than computational problems.

## CONTEXT
Currently, problems are rendered in `templates/worksheet.html` using the `problem.html` component. Word problems will have:
- `is_word_problem: True`
- `word_problem_context.story` - The story/scenario text
- `word_problem_context.question` - The question to answer
- The same `answer`, `hint`, `solution` as regular problems

## IMMEDIATE TASKS (in order)

### 1. Update templates/components/problem.html
Modify the problem component to handle word problems:

```html
{% if problem.is_word_problem and problem.word_problem_context %}
  <div class="problem word-problem">
    <div class="problem-number">{{ loop.index }}.</div>
    <div class="problem-content">
      <div class="word-problem-story">
        {{ problem.word_problem_context.story }}
      </div>
      <div class="word-problem-question">
        <strong>Question:</strong> {{ problem.word_problem_context.question }}
      </div>
      <div class="answer-space word-problem-answer">
        Answer: _________________
      </div>
      {% if show_hints and problem.hint %}
        {% include "components/hint_box.html" %}
      {% endif %}
    </div>
  </div>
{% else %}
  {# Existing computational problem rendering #}
  <div class="problem">
    <div class="problem-number">{{ loop.index }}.</div>
    <div class="problem-content">
      {{ problem.content | safe }}
      <div class="answer-space">
        = _________________
      </div>
      {% if show_hints and problem.hint %}
        {% include "components/hint_box.html" %}
      {% endif %}
    </div>
  </div>
{% endif %}
```

### 2. Update templates/styles/print.css
Add styles for word problems:

```css
/* Word Problem Styles */
.word-problem {
  margin-bottom: 2rem;
  page-break-inside: avoid;
}

.word-problem-story {
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background-color: #f8fafc;
  border-left: 3px solid #3b82f6;
  border-radius: 0 0.25rem 0.25rem 0;
}

.word-problem-question {
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  padding-left: 0.75rem;
}

.word-problem-answer {
  font-size: 1rem;
  padding-left: 0.75rem;
}

/* Print-specific adjustments */
@media print {
  .word-problem-story {
    background-color: #f8fafc !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

### 3. Update templates/answer_key.html
Ensure word problem answers display correctly in the answer key:

```html
{% for problem in problems %}
  <div class="answer-item">
    <span class="answer-number">{{ loop.index }}.</span>
    {% if problem.is_word_problem %}
      <span class="answer-value">{{ problem.answer }}</span>
      {% if show_worked_examples and problem.solution %}
        <div class="worked-solution word-problem-solution">
          <p class="solution-step"><em>From the story:</em> {{ problem.word_problem_context.story | truncate(100) }}</p>
          {{ problem.solution | safe }}
        </div>
      {% endif %}
    {% else %}
      <span class="answer-value">{{ problem.answer }}</span>
      {% if show_worked_examples and problem.solution %}
        <div class="worked-solution">
          {{ problem.solution | safe }}
        </div>
      {% endif %}
    {% endif %}
  </div>
{% endfor %}
```

### 4. Update templates/components/worked_example.html
Add support for word problem worked examples:

```html
{% if problem.is_word_problem %}
  <div class="worked-example word-problem-worked">
    <div class="worked-header">Worked Example (Word Problem)</div>
    <div class="worked-story">
      <strong>Problem:</strong> {{ problem.word_problem_context.story }}
      {{ problem.word_problem_context.question }}
    </div>
    <div class="worked-steps">
      <p><strong>Step 1:</strong> Identify the fractions in the problem</p>
      <p><strong>Step 2:</strong> Determine the operation needed</p>
      {{ problem.solution | safe }}
    </div>
  </div>
{% else %}
  {# Existing worked example rendering #}
{% endif %}
```

### 5. Update renderer.py
Ensure the renderer passes word problem data to templates:

Check that `render_worksheet()` correctly passes:
- `problem.is_word_problem`
- `problem.word_problem_context`

The Problem dataclass should be serialized to dict properly for Jinja2.

### 6. Add visual differentiation
Consider adding an icon or label to distinguish word problems:

```html
{% if problem.is_word_problem %}
  <span class="problem-type-badge">📖 Word Problem</span>
{% endif %}
```

## STYLING GUIDELINES
- Word problems should feel more "story-like" - readable paragraphs
- Use a subtle background color to distinguish from computational problems
- Ensure good print styling (backgrounds print correctly)
- Answer space should be appropriate for word problem answers
- Maintain consistent spacing with existing problem styles

## GIT RULES
- Pull before editing: `git pull`
- Commit after each task: `git add packages/generator/templates/ packages/generator/src/renderer.py && git commit -m "agent/wordproblems-templates: desc"`
- Push immediately: `git push`

## STATUS UPDATES
After each major task, update `scripts/agents/wordproblems-templates-status.md`:
- What you completed
- What you're doing next
- Any blockers

## ON COMPLETION
1. Update your status file with COMPLETE
2. Verify templates are valid: `cd packages/generator && python -c "from jinja2 import Environment, FileSystemLoader; env = Environment(loader=FileSystemLoader('templates')); env.get_template('worksheet.html')"`
3. Commit all changes
4. Push to remote

## REMEMBER
- Stay in your directories
- Commit frequently
- Update status after each task
- Test that templates render without errors
- Ensure print styles work correctly
