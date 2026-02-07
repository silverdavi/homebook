import { FractionFighterGame } from "@/components/games/FractionFighterGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Fraction Fighter | Game Arena | teacher.ninja",
  description: "Compare fractions in a fast-paced battle!",
};

export default function FractionFighterPage() {
  return (
    <GameErrorBoundary gameName="Fraction Fighter">
      <FractionFighterGame />
    </GameErrorBoundary>
  );
}
