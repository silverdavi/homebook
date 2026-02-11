import { FontExplorerGame } from "@/components/games/FontExplorerGame";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Font Explorer | teacher.ninja",
  description: "Learn about fonts! Serif vs sans-serif, font pairing, readability, and choosing the right typeface.",
};

export default function FontExplorerPage() {
  return <FontExplorerGame />;
}
