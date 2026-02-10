import { GeographyChallengeGame } from "@/components/games/GeographyChallengeGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Geography Challenge | Game Arena | teacher.ninja",
  description:
    "Learn world geography — capitals, countries, rivers, mountains, landmarks, and more!",
};

export default function GeographyPage() {
  return (
    <GameErrorBoundary gameName="Geography Challenge">
      <GeographyChallengeGame />
    </GameErrorBoundary>
  );
}
