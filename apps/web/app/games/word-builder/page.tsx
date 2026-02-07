import { WordBuilderGame } from "@/components/games/WordBuilderGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Word Builder | Game Arena | teacher.ninja",
  description: "Unscramble letters to build vocabulary words!",
};

export default function WordBuilderPage() {
  return (
    <GameErrorBoundary gameName="Word Builder">
      <WordBuilderGame />
    </GameErrorBoundary>
  );
}
