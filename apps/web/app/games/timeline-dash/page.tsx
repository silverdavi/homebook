import { TimelineDashGame } from "@/components/games/TimelineDashGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Timeline Dash | Game Arena | teacher.ninja",
  description: "Place historical events on a timeline in the correct order!",
};

export default function TimelineDashPage() {
  return (
    <GameErrorBoundary gameName="Timeline Dash">
      <TimelineDashGame />
    </GameErrorBoundary>
  );
}
