import { TraceLearnGame } from "@/components/games/TraceLearnGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Trace & Learn | Game Arena | teacher.ninja",
  description: "Trace letters, numbers, math symbols, and shapes to improve your writing!",
};

export default function TraceLearnPage() {
  return (
    <GameErrorBoundary gameName="Trace & Learn">
      <TraceLearnGame />
    </GameErrorBoundary>
  );
}
