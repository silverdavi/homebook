import { ColorHarmonyGame } from "@/components/games/ColorHarmonyGame";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Color Harmony | teacher.ninja",
  description: "Master color theory! Build palettes, check contrast, and learn about color harmony and accessibility.",
};

export default function ColorHarmonyPage() {
  return <ColorHarmonyGame />;
}
