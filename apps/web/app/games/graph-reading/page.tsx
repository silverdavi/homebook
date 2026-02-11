import { GraphReadingGame } from "@/components/games/GraphReadingGame";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Graph Reading | teacher.ninja",
  description:
    "Learn to read and interpret graphs — from bar charts to mathematical functions!",
};

export default function GraphReadingPage() {
  return <GraphReadingGame />;
}
