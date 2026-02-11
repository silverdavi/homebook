import { AlgorithmArenaGame } from "@/components/games/AlgorithmArenaGame";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Algorithm Arena | teacher.ninja",
  description: "Visualize sorting algorithms, predict outputs, and learn algorithmic thinking!",
};

export default function AlgorithmArenaPage() {
  return <AlgorithmArenaGame />;
}
