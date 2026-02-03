# Templates Agent - Homebook (teacher.ninja)

> Session: homebook-templates-001
> Budget: $25

## YOUR OWNERSHIP
You exclusively own:
- `packages/generator/templates/`
- `packages/generator/src/templates/` (if needed)

## DO NOT TOUCH
- `apps/` (Frontend/Backend)
- `packages/generator/src/generators/` (Generator Agent)
- `infra/`

## YOUR MISSION
Create beautiful, print-optimized HTML/CSS templates for worksheet PDF generation.
**FRACTIONS worksheets are the first priority.**

---

## PHASE 1: Template Structure

```
packages/generator/templates/
├── base.html                # Base layout template
├── worksheet.html           # Main worksheet template
├── answer_key.html          # Answer key template
├── components/
│   ├── header.html          # Worksheet header
│   ├── footer.html          # Page footer
│   ├── problem.html         # Single problem
│   ├── fraction.html        # Fraction display
│   ├── hint_box.html        # Hint styling
│   └── worked_example.html  # Worked solution
├── visuals/
│   ├── fraction_bar.html    # SVG fraction bar
│   └── number_line.html     # Number line
└── styles/
    ├── print.css            # Print-optimized CSS
    └── variables.css        # CSS variables
```

---

## PHASE 2: Base Template

### Task 2.1: Create base.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title | default('Worksheet') }}</title>
  <style>
    {% include 'styles/variables.css' %}
    {% include 'styles/print.css' %}
  </style>
</head>
<body>
  {% block content %}{% endblock %}
</body>
</html>
```

### Task 2.2: Create styles/variables.css

```css
:root {
  /* Colors */
  --color-primary: #6366f1;        /* Indigo - math */
  --color-primary-light: #a5b4fc;
  --color-secondary: #22c55e;      /* Green - correct */
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --color-bg-muted: #f8fafc;
  --color-hint: #fef3c7;           /* Amber light */
  --color-hint-border: #fbbf24;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-display: 'Outfit', var(--font-sans);
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Borders */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### Task 2.3: Create styles/print.css

```css
/* Print-optimized styles for WeasyPrint */

@page {
  size: letter;
  margin: 0.75in;
  
  @bottom-center {
    content: "Page " counter(page) " of " counter(pages);
    font-size: 9pt;
    color: var(--color-text-muted);
  }
}

@page :first {
  @bottom-center {
    content: "";
  }
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-sans);
  font-size: 12pt;
  line-height: 1.5;
  color: var(--color-text);
}

/* Prevent page breaks in middle of problems */
.problem {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Force answer key to new page */
.answer-key {
  page-break-before: always;
  break-before: always;
}

/* Headers */
h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 600;
}

h1 {
  font-size: 20pt;
  color: #0f172a;
  margin-bottom: var(--spacing-sm);
}

h2 {
  font-size: 14pt;
  color: var(--color-primary);
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

/* Fraction display */
.fraction {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  vertical-align: middle;
  font-size: 1em;
  margin: 0 0.2em;
  line-height: 1.2;
}

.fraction-numerator {
  border-bottom: 1.5px solid currentColor;
  padding: 0 0.3em 0.1em;
  min-width: 1.2em;
  text-align: center;
}

.fraction-denominator {
  padding: 0.1em 0.3em 0;
  min-width: 1.2em;
  text-align: center;
}

/* Mixed numbers */
.mixed-number {
  display: inline-flex;
  align-items: center;
  gap: 0.15em;
}

.mixed-whole {
  font-size: 1.1em;
}

/* Answer lines */
.answer-line {
  display: inline-block;
  border-bottom: 1px solid var(--color-text-muted);
  min-width: 60px;
  height: 1.2em;
  margin-left: 0.5em;
}

/* Hint boxes */
.hint-box {
  background: var(--color-hint);
  border-left: 3px solid var(--color-hint-border);
  padding: var(--spacing-sm) var(--spacing-md);
  margin-top: var(--spacing-sm);
  font-size: 10pt;
  color: #92400e;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.hint-icon {
  margin-right: 0.3em;
}

/* Worked examples */
.worked-example {
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-top: var(--spacing-md);
  font-size: 10pt;
}

.worked-example-title {
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.worked-step {
  margin: var(--spacing-xs) 0;
  padding-left: var(--spacing-md);
}

/* Visual elements */
.visual-container {
  margin: var(--spacing-md) 0;
  text-align: center;
}

.visual-container svg {
  max-width: 100%;
  height: auto;
}

/* Reference boxes (LCD/GCF) */
.reference-box {
  background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
  border: 1px solid #bae6fd;
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  font-size: 10pt;
}

.reference-title {
  font-weight: 600;
  color: #0369a1;
  margin-bottom: var(--spacing-xs);
}
```

---

## PHASE 3: Worksheet Template

### Task 3.1: Create worksheet.html

```html
{% extends 'base.html' %}

{% block content %}
<div class="worksheet">
  
  <!-- Header -->
  <header class="worksheet-header">
    <div class="header-left">
      <h1 class="worksheet-title">{{ title }}</h1>
      {% if subtitle %}
      <p class="worksheet-subtitle">{{ subtitle }}</p>
      {% endif %}
    </div>
    <div class="header-right">
      <div class="meta-field">
        <span class="meta-label">Name:</span>
        <span class="meta-input">{{ student_name | default('') }}</span>
      </div>
      <div class="meta-field">
        <span class="meta-label">Date:</span>
        <span class="meta-input">{{ date | default('') }}</span>
      </div>
    </div>
  </header>
  
  <!-- LCD/GCF Reference (optional) -->
  {% if show_lcd_reference %}
  <div class="reference-box">
    <div class="reference-title">📐 Adding Fractions with Unlike Denominators</div>
    <ol>
      <li><strong>Find the LCD</strong> (Least Common Denominator) of both fractions</li>
      <li><strong>Convert</strong> each fraction to an equivalent fraction with the LCD</li>
      <li><strong>Add</strong> the numerators, keep the denominator</li>
      <li><strong>Simplify</strong> if possible (divide by GCF)</li>
    </ol>
  </div>
  {% endif %}
  
  <!-- Problems -->
  <div class="problems">
    {% for problem in problems %}
    <div class="problem">
      <div class="problem-row">
        <span class="problem-number">{{ loop.index }}.</span>
        <div class="problem-content">
          
          <!-- Question -->
          <div class="problem-question">
            {{ problem.question_html | safe }}
          </div>
          
          <!-- Hint (optional) -->
          {% if problem.hint %}
          <div class="hint-box">
            <span class="hint-icon">💡</span>
            {{ problem.hint }}
          </div>
          {% endif %}
          
          <!-- Visual (optional) -->
          {% if problem.visual_svg %}
          <div class="visual-container">
            {{ problem.visual_svg | safe }}
          </div>
          {% endif %}
          
          <!-- Worked example (optional) -->
          {% if problem.worked_solution %}
          <div class="worked-example">
            <div class="worked-example-title">Step-by-step:</div>
            <div class="worked-steps">
              {{ problem.worked_solution | replace('\n', '<br>') | safe }}
            </div>
          </div>
          {% endif %}
          
        </div>
      </div>
    </div>
    {% endfor %}
  </div>
  
  <!-- Answer Key (optional) -->
  {% if include_answer_key %}
  <div class="answer-key">
    <h2>Answer Key</h2>
    <div class="answer-grid">
      {% for problem in problems %}
      <div class="answer-item">
        <span class="answer-number">{{ loop.index }}.</span>
        <span class="answer-value">{{ problem.answer_text }}</span>
      </div>
      {% endfor %}
    </div>
  </div>
  {% endif %}
  
  <!-- Footer -->
  <footer class="worksheet-footer">
    Generated by teacher.ninja • {{ date }}
  </footer>
  
</div>

<style>
/* Worksheet-specific styles */
.worksheet-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.worksheet-subtitle {
  font-size: 11pt;
  color: var(--color-text-muted);
  margin-top: var(--spacing-xs);
}

.header-right {
  text-align: right;
}

.meta-field {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.meta-label {
  font-weight: 500;
  color: var(--color-text-muted);
}

.meta-input {
  display: inline-block;
  border-bottom: 1px solid var(--color-text-muted);
  min-width: 120px;
  height: 1.2em;
}

.problems {
  margin-top: var(--spacing-lg);
}

.problem {
  margin-bottom: var(--spacing-xl);
}

.problem-row {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.problem-number {
  font-weight: 600;
  color: var(--color-primary);
  min-width: 2rem;
  font-size: 12pt;
}

.problem-content {
  flex: 1;
}

.problem-question {
  font-size: 14pt;
  line-height: 1.8;
}

/* Answer key grid */
.answer-key h2 {
  color: #0f172a;
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: var(--spacing-sm);
}

.answer-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.answer-item {
  display: flex;
  gap: var(--spacing-sm);
  font-size: 11pt;
}

.answer-number {
  font-weight: 600;
  color: var(--color-primary);
}

/* Footer */
.worksheet-footer {
  text-align: center;
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  font-size: 9pt;
  color: var(--color-text-muted);
}
</style>

{% endblock %}
```

---

## PHASE 4: Component Templates

### Task 4.1: Create components/fraction.html

```html
{# Render a fraction display #}
{# Usage: {% include 'components/fraction.html' with num=3, den=4 %} #}

<span class="fraction">
  <span class="fraction-numerator">{{ num }}</span>
  <span class="fraction-denominator">{{ den }}</span>
</span>
```

### Task 4.2: Create components/hint_box.html

```html
<div class="hint-box">
  <span class="hint-icon">💡</span>
  <span class="hint-text">{{ hint_text }}</span>
</div>
```

---

## PHASE 5: Fraction Visuals

### Task 5.1: Document SVG specifications

The Generator Agent creates SVG visuals. You provide CSS for styling:

```css
/* Fraction bar visuals */
.fraction-bar-svg {
  max-width: 350px;
}

.fraction-bar-svg rect {
  stroke-width: 0.5;
}

.fraction-bar-svg .filled {
  /* Filled segments */
}

.fraction-bar-svg .empty {
  fill: #f1f5f9;
}

.fraction-bar-svg text {
  font-family: var(--font-sans);
  font-size: 12px;
  fill: var(--color-text);
}
```

---

## TESTING

Create sample worksheets to test:

1. **Simple fraction addition** - 10 problems, no visuals
2. **With hints** - 10 problems with hints
3. **With visuals** - 10 problems with fraction bars
4. **Full featured** - hints, visuals, worked examples, answer key

---

## GIT RULES
- Commit after each template: `git add packages/generator/templates && git commit -m "agent/templates: add [template]"`
- Push after each phase

## STATUS UPDATES
Update `scripts/agents/templates-status.md`

## REMEMBER
- Use WeasyPrint-compatible CSS (no flexbox issues)
- Test print at 100% scale
- Ensure page breaks don't split problems
- Keep fonts readable (min 10pt for body)
- High contrast for print (dark text on white)
