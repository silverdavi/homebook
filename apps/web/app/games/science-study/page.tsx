import { ScienceStudyGame } from "@/components/games/ScienceStudyGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Science Study | Game Arena | teacher.ninja",
  description:
    "Learn chemistry, biology, physics, and earth science with interactive quizzes and adaptive difficulty!",
};

export default function ScienceStudyPage() {
  return (
    <GameErrorBoundary gameName="Science Study">
      <ScienceStudyGame />
    </GameErrorBoundary>
  );
}
