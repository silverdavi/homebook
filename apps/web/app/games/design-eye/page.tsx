import { DesignEyeGame } from "@/components/games/DesignEyeGame";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design Eye | teacher.ninja",
  description: "Train your eye! Spot alignment issues, bad spacing, and design flaws like a professional designer.",
};

export default function DesignEyePage() {
  return <DesignEyeGame />;
}
