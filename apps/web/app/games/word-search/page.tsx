import { WordSearchGame } from "@/components/games/WordSearchGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Word Search | Game Arena | teacher.ninja",
  description:
    "Find hidden educational words in a letter grid. Choose a category and grid size. Works on e-readers!",
};

export default function WordSearchPage() {
  return (
    <GameErrorBoundary gameName="Word Search">
      <WordSearchGame />
    </GameErrorBoundary>
  );
}
