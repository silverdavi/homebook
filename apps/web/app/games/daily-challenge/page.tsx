import { DailyChallengeGame } from "@/components/games/DailyChallengeGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Daily Challenge | Game Arena | teacher.ninja",
  description: "A new challenge every day — build your streak!",
};

export default function DailyChallengePage() {
  return (
    <GameErrorBoundary gameName="Daily Challenge">
      <DailyChallengeGame />
    </GameErrorBoundary>
  );
}
