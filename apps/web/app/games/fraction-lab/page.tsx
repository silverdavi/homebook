import { FractionLabGame } from "@/components/games/FractionLabGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Fraction Lab | Game Arena | teacher.ninja",
  description: "See, compare, and calculate fractions visually!",
};

export default function FractionLabPage() {
  return (
    <GameErrorBoundary gameName="Fraction Lab">
      <FractionLabGame />
    </GameErrorBoundary>
  );
}
