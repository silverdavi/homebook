import { UnitConverterGame } from "@/components/games/UnitConverterGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Unit Converter | Game Arena | teacher.ninja",
  description:
    "Race to convert between units of length, mass, volume, temperature, and time!",
};

export default function UnitConverterPage() {
  return (
    <GameErrorBoundary gameName="Unit Converter">
      <UnitConverterGame />
    </GameErrorBoundary>
  );
}
