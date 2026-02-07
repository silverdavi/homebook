import { CrosswordGame } from "@/components/games/CrosswordGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Crossword | Game Arena | teacher.ninja",
  description:
    "Solve educational crossword puzzles covering science, math, history and geography!",
};

export default function CrosswordPage() {
  return (
    <GameErrorBoundary gameName="Crossword">
      <CrosswordGame />
    </GameErrorBoundary>
  );
}
