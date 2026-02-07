import { ColorLabGame } from "@/components/games/ColorLabGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Color Lab | Game Arena | teacher.ninja",
  description: "Color educational diagrams and learn about cells, continents, and the periodic table!",
};

export default function ColorLabPage() {
  return (
    <GameErrorBoundary gameName="Color Lab">
      <ColorLabGame />
    </GameErrorBoundary>
  );
}
