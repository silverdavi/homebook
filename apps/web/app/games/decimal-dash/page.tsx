import { DecimalDashGame } from "@/components/games/DecimalDashGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Decimal Dash | Game Arena | teacher.ninja",
  description:
    "Fast-paced decimal challenges with number lines, operations, and conversions!",
};

export default function DecimalDashPage() {
  return (
    <GameErrorBoundary gameName="Decimal Dash">
      <DecimalDashGame />
    </GameErrorBoundary>
  );
}
