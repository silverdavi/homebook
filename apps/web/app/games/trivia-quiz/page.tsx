import { TriviaQuizGame } from "@/components/games/TriviaQuizGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Trivia Quiz | Game Arena | teacher.ninja",
  description:
    "Test your knowledge with educational trivia across math, science, history, geography, chemistry, and biology. Works on e-readers!",
};

export default function TriviaQuizPage() {
  return (
    <GameErrorBoundary gameName="Trivia Quiz">
      <TriviaQuizGame />
    </GameErrorBoundary>
  );
}
