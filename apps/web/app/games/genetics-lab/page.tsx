import { GeneticsLabGame } from "@/components/games/GeneticsLabGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Genetics Lab | Game Arena | teacher.ninja",
  description:
    "Master Mendelian genetics with interactive Punnett squares and phenotype predictions!",
};

export default function GeneticsLabPage() {
  return (
    <GameErrorBoundary gameName="Genetics Lab">
      <GeneticsLabGame />
    </GameErrorBoundary>
  );
}
