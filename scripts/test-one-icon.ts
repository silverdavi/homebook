/**
 * Test: Generate 1 icon to validate the pipeline works.
 */
import OpenAI from "openai";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OUT_DIR = path.join(__dirname, "../apps/web/public/icons/games");

const STYLE = `A game icon asset. Style: flat modern vector illustration on a vibrant gradient rounded-square background. Clean, bold, minimal detail, centered composition, NO TEXT, no labels, no words, no letters. Should be recognizable at 64px. Thick outlines, bright saturated colors, slight 3D depth with soft shadows. Think: premium mobile game icon.`;

async function main() {
  const id = "math-blitz";
  const prompt = `${STYLE}\n\nSubject: A lightning bolt crackling with energy, surrounded by floating math symbols (plus, minus, multiply, divide), on an emerald-to-teal gradient background`;

  console.log(`Testing generation of 1 icon: ${id}`);
  console.log(`Model: gpt-image-1 @ 1024x1024`);

  const t0 = Date.now();

  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
    quality: "medium",
    n: 1,
  });

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`Generated in ${elapsed}s`);

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) {
    console.error("No image data returned!");
    console.log("Full response:", JSON.stringify(result, null, 2));
    return;
  }

  const buf = Buffer.from(b64, "base64");
  console.log(`Image size: ${(buf.length / 1024).toFixed(0)} KB`);

  // Save all 3 sizes
  for (const size of [1024, 512, 256]) {
    const dir = path.join(OUT_DIR, String(size));
    await fs.mkdir(dir, { recursive: true });
    const resized = size === 1024 ? buf : await sharp(buf).resize(size, size, { fit: "cover" }).png().toBuffer();
    const outPath = path.join(dir, `${id}.png`);
    await fs.writeFile(outPath, resized);
    console.log(`Saved: ${outPath} (${(resized.length / 1024).toFixed(0)} KB)`);
  }

  console.log(`\n✅ Test passed! Pipeline works. Now run generate-icons.ts with CONCURRENCY=50`);
}

main().catch((err) => {
  console.error("Test failed:", err.message || err);
  process.exit(1);
});
