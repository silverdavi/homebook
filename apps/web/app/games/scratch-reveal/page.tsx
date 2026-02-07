import { ScratchRevealGame } from "@/components/games/ScratchRevealGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Scratch & Reveal | Game Arena | teacher.ninja",
  description: "Think of the answer, then scratch to reveal! A fun self-check game for math, science, history, and vocabulary.",
};

export default function ScratchRevealPage() {
  return (
    <GameErrorBoundary gameName="Scratch & Reveal">
      <ScratchRevealGame />
    </GameErrorBoundary>
  );
}
