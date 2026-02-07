import { LetterRainGame } from "@/components/games/LetterRainGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Letter Rain | Game Arena | teacher.ninja",
  description: "Catch falling letters to rebuild educational sentences.",
};

export default function LetterRainPage() {
  return (
    <GameErrorBoundary gameName="Letter Rain">
      <LetterRainGame />
    </GameErrorBoundary>
  );
}
