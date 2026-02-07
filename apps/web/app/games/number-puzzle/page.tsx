import { NumberPuzzleGame } from "@/components/games/NumberPuzzleGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Number Puzzle | Game Arena | teacher.ninja",
  description:
    "Slide numbered tiles into order — a classic puzzle with a math twist!",
};

export default function NumberPuzzlePage() {
  return (
    <GameErrorBoundary gameName="Number Puzzle">
      <NumberPuzzleGame />
    </GameErrorBoundary>
  );
}
