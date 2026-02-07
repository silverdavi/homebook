import { MathBlitzGame } from "@/components/games/MathBlitzGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Math Blitz | Game Arena | teacher.ninja",
  description: "Solve as many math problems as you can in 60 seconds!",
};

export default function MathBlitzPage() {
  return (
    <GameErrorBoundary gameName="Math Blitz">
      <MathBlitzGame />
    </GameErrorBoundary>
  );
}
