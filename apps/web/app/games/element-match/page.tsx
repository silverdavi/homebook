import { ElementMatchGame } from "@/components/games/ElementMatchGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Element Match | Game Arena | teacher.ninja",
  description: "Match chemical element symbols to their names!",
};

export default function ElementMatchPage() {
  return (
    <GameErrorBoundary gameName="Element Match">
      <ElementMatchGame />
    </GameErrorBoundary>
  );
}
