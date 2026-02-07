import { EquationBalancerGame } from "@/components/games/EquationBalancerGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Equation Balancer | Game Arena | teacher.ninja",
  description:
    "Balance chemical equations by adjusting coefficients. Learn conservation of mass!",
};

export default function EquationBalancerPage() {
  return (
    <GameErrorBoundary gameName="Equation Balancer">
      <EquationBalancerGame />
    </GameErrorBoundary>
  );
}
