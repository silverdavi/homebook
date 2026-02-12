/**
 * Generate 100 game/UI icons using OpenAI gpt-image-1
 * Generates at 1024x1024 then resizes to 256x256 and 512x512
 *
 * Usage: npx tsx scripts/generate-icons.ts
 *
 * Set OPENAI_API_KEY in .env or environment.
 */

import OpenAI from "openai";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const OUT_DIR = path.join(__dirname, "../apps/web/public/icons/games");

/* ── Style prompt prefix for consistent design ──────────────────────── */

const STYLE = `A game icon asset. Style: flat modern vector illustration on a vibrant gradient rounded-square background. Clean, bold, minimal detail, centered composition, NO TEXT, no labels, no words, no letters. Should be recognizable at 64px. Thick outlines, bright saturated colors, slight 3D depth with soft shadows. Think: premium mobile game icon.`;

/* ── Icon definitions (100 total) ─────────────────────────────────── */

interface IconDef {
  id: string;
  prompt: string;
  bgGradient?: string; // hint for gradient
}

const ICONS: IconDef[] = [
  // ─── 25 Game Icons ───────────────────────────────────────────────
  { id: "letter-rain", prompt: "Colorful alphabet letters falling like raindrops from a cloud, on an indigo-to-purple gradient background" },
  { id: "word-builder", prompt: "Wooden letter blocks stacking up to form a tower, on an amber-to-orange gradient background" },
  { id: "math-blitz", prompt: "A lightning bolt crackling with energy, surrounded by floating math symbols (plus, minus, multiply, divide), on an emerald-to-teal gradient background" },
  { id: "fraction-fighter", prompt: "Two fraction bars (like swords) crossed in an X shape with sparks, on a red-to-orange gradient background" },
  { id: "times-table", prompt: "A glowing multiplication sign (×) at the center with numbers orbiting around it, on a violet-to-purple gradient background" },
  { id: "fraction-lab", prompt: "A pie chart being examined with a magnifying glass next to a science beaker, on an orange-to-pink gradient background" },
  { id: "decimal-dash", prompt: "A number line with a glowing decimal point and a speedometer needle, on a teal-to-cyan gradient background" },
  { id: "graph-plotter", prompt: "A coordinate grid with a colorful plotted curve/line and data points, on an indigo-to-blue gradient background" },
  { id: "element-match", prompt: "Two cards flipping to reveal periodic table element symbols, matching pair with glow effect, on a blue-to-indigo gradient background" },
  { id: "equation-balancer", prompt: "A golden balance scale with molecule symbols on each side, chemistry theme, on a violet-to-purple gradient background" },
  { id: "genetics-lab", prompt: "A colorful DNA double helix with a Punnett square grid in the background, on a green-to-emerald gradient background" },
  { id: "unit-converter", prompt: "A ruler and measuring tape crossing with conversion arrows between them, on a sky-to-blue gradient background" },
  { id: "timeline-dash", prompt: "A horizontal timeline with pins/markers and a clock face behind it, on a purple-to-violet gradient background" },
  { id: "maze-runner", prompt: "A bird's-eye view of a maze with a glowing path through it, on a cyan-to-teal gradient background" },
  { id: "trace-learn", prompt: "A pencil drawing/tracing dotted letter outlines on paper, on a purple-to-pink gradient background" },
  { id: "color-lab", prompt: "A paint palette with a brush making colorful strokes, on a pink-to-rose gradient background" },
  { id: "connect-dots", prompt: "Numbered dots connected by lines forming a star shape, on a blue-to-indigo gradient background" },
  { id: "scratch-reveal", prompt: "A golden scratch card being scratched to reveal a shining star underneath, on a yellow-to-amber gradient background" },
  { id: "sudoku", prompt: "A 3x3 mini grid with some numbers filled in, pencil marks, on a slate-to-gray gradient background" },
  { id: "crossword", prompt: "A crossword puzzle grid with some filled black and white squares, on a slate-to-blue gradient background" },
  { id: "word-search", prompt: "A grid of letters with a magnifying glass highlighting a word, on a slate-to-teal gradient background" },
  { id: "trivia-quiz", prompt: "A large question mark with four answer option buttons (A B C D) around it, on a slate-to-indigo gradient background" },
  { id: "nonogram", prompt: "A pixel-art style grid with some cells filled creating a pattern, on a slate-to-violet gradient background" },
  { id: "number-puzzle", prompt: "A sliding tile puzzle with numbered tiles and one empty space, on a slate-to-gray gradient background" },
  { id: "daily-challenge", prompt: "A calendar page with a flame/fire icon on it, on an orange-to-red gradient background" },
  { id: "science-study", prompt: "A laboratory desk with a textbook, beaker, and atom model, on a blue-to-indigo gradient background" },
  { id: "geography", prompt: "A colorful globe with a compass needle and mountain peaks, on a cyan-to-teal gradient background" },
  { id: "graph-reading", prompt: "A bar chart and line graph side by side with a magnifying glass analyzing trends, on an indigo-to-violet gradient background" },
  { id: "fake-news-detective", prompt: "A newspaper with a large red FAKE stamp and a detective magnifying glass, on an amber-to-yellow gradient background" },

  // ─── 8 New Game Icons (CS + Design) ────────────────────────────
  { id: "pattern-machine", prompt: "Colorful gears and cogs forming a repeating pattern sequence, with arrows showing the cycle, on a violet-to-fuchsia gradient background" },
  { id: "binary-bits", prompt: "Glowing 1s and 0s forming a stream, with a light switch toggling ON/OFF, on a cyan-to-blue gradient background" },
  { id: "debug-detective", prompt: "A magnifying glass examining a ladybug/bug on a code scroll, detective hat, on an amber-to-yellow gradient background" },
  { id: "algorithm-arena", prompt: "Colorful bar chart bars being sorted by arrows, with a stopwatch, on a violet-to-purple gradient background" },
  { id: "design-eye", prompt: "A large stylized eye with a ruler/grid reflected in the iris, alignment guides around it, on a pink-to-rose gradient background" },
  { id: "font-explorer", prompt: "A large letter A shown in different font styles (serif, sans-serif, bold, italic) overlapping, on a purple-to-violet gradient background" },
  { id: "layout-lab", prompt: "A grid/layout wireframe with boxes being arranged, alignment rulers and guides, on an orange-to-amber gradient background" },
  { id: "color-harmony", prompt: "A color wheel with palette swatches fanning out, paint drops, on a teal-to-cyan gradient background" },

  // ─── 8 Category Icons ───────────────────────────────────────────
  { id: "cat-language", prompt: "An open book with letters floating out of it, magical glow, on an amber-to-orange gradient background" },
  { id: "cat-math", prompt: "A colorful abacus with calculation symbols floating around, on an emerald-to-cyan gradient background" },
  { id: "cat-science", prompt: "A microscope with colorful molecules floating around it, on a blue-to-violet gradient background" },
  { id: "cat-history", prompt: "A globe with a compass and ancient map elements, on a purple-to-pink gradient background" },
  { id: "cat-touch", prompt: "A hand holding a stylus drawing on a tablet screen, on a pink-to-rose gradient background" },
  { id: "cat-ereader", prompt: "An e-reader device showing content on screen with high contrast, on a slate-to-gray gradient background" },
  { id: "cat-cs", prompt: "A terminal/code window with angle brackets and curly braces, glowing cursor, on a cyan-to-blue gradient background" },
  { id: "cat-design", prompt: "A paint palette with a ruler, pen tool cursor, and grid lines, on a rose-to-purple gradient background" },

  // ─── 3 Medal Icons ──────────────────────────────────────────────
  { id: "medal-bronze", prompt: "A shiny bronze medal with a ribbon, engraved star pattern, warm bronze metallic finish, on a warm brown-to-amber gradient background" },
  { id: "medal-silver", prompt: "A shiny silver medal with a ribbon, engraved star pattern, cool silver metallic finish, on a cool gray-to-slate gradient background" },
  { id: "medal-gold", prompt: "A shiny gold medal with a ribbon, engraved star pattern, brilliant gold metallic finish, on a golden yellow-to-amber gradient background" },

  // ─── 8 Fraction Lab Type Icons ──────────────────────────────────
  { id: "fl-identify", prompt: "A magnifying glass examining a fraction bar, detective theme, on a blue gradient background" },
  { id: "fl-compare", prompt: "A balance scale comparing two fraction pies of different sizes, on a purple gradient background" },
  { id: "fl-add", prompt: "Two fraction bars merging together with a plus sign, on a green gradient background" },
  { id: "fl-equivalent", prompt: "Two equal signs with fraction bars that look different but are the same value, on a teal gradient background" },
  { id: "fl-simplify", prompt: "Scissors cutting a fraction bar into a simpler form, on an orange gradient background" },
  { id: "fl-gcf", prompt: "Overlapping circles (Venn diagram) with numbers, finding common factors, on a indigo gradient background" },
  { id: "fl-lcm", prompt: "Number lines meeting at a common point, multiple rays converging, on a cyan gradient background" },
  { id: "fl-mixed", prompt: "A dice showing different math symbols on each face, random/mixed theme, on a rainbow gradient background" },

  // ─── 3 Times Table Mode Icons ───────────────────────────────────
  { id: "mode-sprint", prompt: "A running shoe with a stopwatch/timer, speed lines, on a blue-to-cyan gradient background" },
  { id: "mode-survival", prompt: "A glowing heart with a protective shield around it, on a red-to-pink gradient background" },
  { id: "mode-target", prompt: "A bullseye target with an arrow hitting the center, on a green-to-emerald gradient background" },

  // ─── 5 Subject Icons ───────────────────────────────────────────
  { id: "subj-math", prompt: "Floating numbers and math operators (+ - × ÷ =), on a blue gradient background" },
  { id: "subj-science", prompt: "A bubbling beaker/flask with colorful liquid, on a green gradient background" },
  { id: "subj-history", prompt: "An ancient scroll unrolling with a quill pen, on a amber gradient background" },
  { id: "subj-vocabulary", prompt: "A dictionary book open with words and definitions, on a purple gradient background" },
  { id: "subj-general", prompt: "A glowing lightbulb with rays of inspiration, on a yellow gradient background" },

  // ─── 3 Result/Status Icons ──────────────────────────────────────
  { id: "result-trophy", prompt: "A golden trophy cup with sparkles and confetti, celebration theme, on a gold-to-yellow gradient background" },
  { id: "result-study", prompt: "A stack of colorful books with reading glasses on top, on a blue gradient background" },
  { id: "result-strength", prompt: "A flexed muscular arm with energy/power aura, on a orange gradient background" },

  // ─── 6 UI Element Icons ─────────────────────────────────────────
  { id: "ui-fire", prompt: "A bright orange-red flame/fire, dynamic and energetic, on a dark gradient background" },
  { id: "ui-star", prompt: "A bright golden five-pointed star with sparkle effects, on a dark blue gradient background" },
  { id: "ui-heart", prompt: "A glossy red heart with a subtle shine/glow, on a pink gradient background" },
  { id: "ui-heart-empty", prompt: "A gray/empty heart outline, dim and faded, on a dark gradient background" },
  { id: "ui-check", prompt: "A bold green checkmark in a circle, success/correct theme, on a green gradient background" },
  { id: "ui-cross", prompt: "A bold red X mark in a circle, error/wrong theme, on a red gradient background" },

  // ─── Extra Library Icons (for future use) ───────────────────────
  { id: "extra-rocket", prompt: "A colorful rocket ship launching with flames, on a dark blue-to-purple gradient background" },
  { id: "extra-brain", prompt: "A colorful brain with neural connections glowing, on a pink-to-purple gradient background" },
  { id: "extra-clock", prompt: "A colorful analog clock face showing time, on a blue gradient background" },
  { id: "extra-compass", prompt: "A navigation compass with cardinal directions, on a teal gradient background" },
  { id: "extra-telescope", prompt: "A telescope pointed at stars and planets, on a dark blue gradient background" },
  { id: "extra-atom", prompt: "An atom model with orbiting electrons, on a blue-to-cyan gradient background" },
  { id: "extra-paintbrush", prompt: "A paintbrush making a colorful rainbow stroke, on a white-to-gray gradient background" },
  { id: "extra-calculator", prompt: "A modern calculator with colorful buttons, on a gray-to-blue gradient background" },
  { id: "extra-globe", prompt: "A colorful Earth globe showing continents, on a blue-to-teal gradient background" },
  { id: "extra-music", prompt: "Musical notes floating from a treble clef, on a purple gradient background" },
  { id: "extra-puzzle", prompt: "Colorful jigsaw puzzle pieces fitting together, on a green gradient background" },
  { id: "extra-trophy-silver", prompt: "A silver trophy cup with blue ribbons, on a silver-to-gray gradient background" },
  { id: "extra-trophy-bronze", prompt: "A bronze trophy cup with green ribbons, on a bronze-to-brown gradient background" },
  { id: "extra-notebook", prompt: "A spiral notebook with a pen and colorful sticky notes, on a yellow gradient background" },
  { id: "extra-microscope", prompt: "A detailed microscope with a slide, on a teal gradient background" },
  { id: "extra-magnet", prompt: "A horseshoe magnet attracting colorful particles, on a red gradient background" },
  { id: "extra-chemistry", prompt: "Test tubes in a rack with colorful bubbling liquids, on a green-to-teal gradient background" },
  { id: "extra-ruler", prompt: "A ruler and protractor with measurement marks, on a blue gradient background" },
  { id: "extra-map", prompt: "A treasure map with X marks the spot and a compass rose, on an amber gradient background" },
  { id: "extra-binoculars", prompt: "Binoculars with a nature/exploration scene in the lenses, on a green gradient background" },
  { id: "extra-hourglass", prompt: "An hourglass with golden sand flowing, on an amber-to-orange gradient background" },
  { id: "extra-lightbulb", prompt: "A bright lightbulb with creative ideas/gears inside, on a yellow gradient background" },
  { id: "extra-robot", prompt: "A friendly cartoon robot with antennas, on a blue-to-cyan gradient background" },
  { id: "extra-castle", prompt: "A medieval castle with towers and flags, on a purple gradient background" },
  { id: "extra-volcano", prompt: "An erupting volcano with lava and ash cloud, on a red-to-orange gradient background" },
  { id: "extra-dinosaur", prompt: "A friendly cartoon T-Rex dinosaur, on a green gradient background" },
  { id: "extra-solar", prompt: "The solar system with planets orbiting the sun, on a dark blue gradient background" },
  { id: "extra-leaf", prompt: "A green leaf with photosynthesis symbols, on a green gradient background" },
  { id: "extra-wave", prompt: "An ocean wave with physics wave patterns, on a blue gradient background" },
  { id: "extra-crystal", prompt: "A glowing crystal/gem with facets reflecting light, on a purple gradient background" },
  { id: "extra-magicwand", prompt: "A magic wand with sparkles and stars trailing, on a indigo gradient background" },
  { id: "extra-shield", prompt: "A protective shield with a star emblem, on a blue gradient background" },
  { id: "extra-scroll", prompt: "An ancient scroll with mathematical formulas, on an amber gradient background" },
  { id: "extra-beaker", prompt: "A beaker with a chemical reaction creating colorful smoke, on a teal gradient background" },
  { id: "extra-flag", prompt: "A checkered racing flag waving, on a black-to-gray gradient background" },
  { id: "extra-crown", prompt: "A golden royal crown with jewels, on a purple-to-gold gradient background" },
  { id: "extra-keyboard", prompt: "A keyboard with glowing keys being pressed, on a gray-to-blue gradient background" },
  { id: "extra-headphones", prompt: "Colorful headphones with sound waves, on a purple gradient background" },
  { id: "extra-plant", prompt: "A growing plant seedling with progress stages, on a green gradient background" },
  { id: "extra-coin", prompt: "A spinning golden coin with a star emblem, on a gold gradient background" },
];

/* ── Generation logic ──────────────────────────────────────────────── */

const CONCURRENCY = 50;      // Parallel requests
const RETRY_LIMIT = 2;       // Retries per icon
const DELAY_BETWEEN_MS = 200; // Delay between batches

async function generateIcon(icon: IconDef): Promise<Buffer | null> {
  const fullPrompt = `${STYLE}\n\nSubject: ${icon.prompt}`;

  for (let attempt = 0; attempt <= RETRY_LIMIT; attempt++) {
    try {
      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt: fullPrompt,
        size: "1024x1024",
        quality: "medium",
        n: 1,
      });

      const b64 = result.data?.[0]?.b64_json;
      if (!b64) throw new Error("No image data returned");
      return Buffer.from(b64, "base64");
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error(`  [attempt ${attempt + 1}] Error generating ${icon.id}: ${msg}`);

      if (attempt < RETRY_LIMIT) {
        // Exponential backoff
        await sleep(2000 * (attempt + 1));
      }
    }
  }
  return null;
}

async function saveIcon(id: string, buf: Buffer): Promise<void> {
  const dir256 = path.join(OUT_DIR, "256");
  const dir512 = path.join(OUT_DIR, "512");
  const dir1024 = path.join(OUT_DIR, "1024");

  await fs.mkdir(dir256, { recursive: true });
  await fs.mkdir(dir512, { recursive: true });
  await fs.mkdir(dir1024, { recursive: true });

  // Save original 1024
  await fs.writeFile(path.join(dir1024, `${id}.png`), buf);

  // Resize to 512
  const buf512 = await sharp(buf).resize(512, 512, { fit: "cover" }).png().toBuffer();
  await fs.writeFile(path.join(dir512, `${id}.png`), buf512);

  // Resize to 256
  const buf256 = await sharp(buf).resize(256, 256, { fit: "cover" }).png().toBuffer();
  await fs.writeFile(path.join(dir256, `${id}.png`), buf256);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`\n🎨 Generating ${ICONS.length} game icons...\n`);
  console.log(`Output: ${OUT_DIR}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Model: gpt-image-1 @ 1024x1024 → resized to 512 + 256\n`);

  await fs.mkdir(OUT_DIR, { recursive: true });

  // Check which icons already exist (skip regeneration)
  const existing = new Set<string>();
  try {
    const dir256 = path.join(OUT_DIR, "256");
    const files = await fs.readdir(dir256);
    for (const f of files) {
      if (f.endsWith(".png")) existing.add(f.replace(".png", ""));
    }
  } catch {}

  const toGenerate = ICONS.filter((i) => !existing.has(i.id));
  console.log(`Already generated: ${existing.size}`);
  console.log(`To generate: ${toGenerate.length}\n`);

  if (toGenerate.length === 0) {
    console.log("✅ All icons already exist! Nothing to do.");
    return;
  }

  let completed = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < toGenerate.length; i += CONCURRENCY) {
    const batch = toGenerate.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (icon) => {
        console.log(`  ⏳ Generating: ${icon.id}...`);
        const buf = await generateIcon(icon);
        if (buf) {
          await saveIcon(icon.id, buf);
          completed++;
          console.log(`  ✅ ${icon.id} (${completed}/${toGenerate.length})`);
        } else {
          failed++;
          console.log(`  ❌ ${icon.id} FAILED after retries`);
        }
      })
    );

    // Small delay between batches
    if (i + CONCURRENCY < toGenerate.length) {
      await sleep(DELAY_BETWEEN_MS);
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ Completed: ${completed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Icons saved to: ${OUT_DIR}/{256,512,1024}/`);
}

main().catch(console.error);
