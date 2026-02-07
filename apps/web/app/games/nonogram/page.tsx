import { NonogramGame } from "@/components/games/NonogramGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Nonogram | Game Arena | teacher.ninja",
  description:
    "Solve picture logic puzzles — fill cells using number clues to reveal a hidden image!",
};

export default function NonogramPage() {
  return (
    <GameErrorBoundary gameName="Nonogram">
      <NonogramGame />
    </GameErrorBoundary>
  );
}
