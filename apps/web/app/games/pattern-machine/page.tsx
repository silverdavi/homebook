import { PatternMachineGame } from "@/components/games/PatternMachineGame";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pattern Machine | teacher.ninja",
  description: "Complete sequences, find patterns, and learn the building blocks of computational thinking!",
};

export default function PatternMachinePage() {
  return <PatternMachineGame />;
}
