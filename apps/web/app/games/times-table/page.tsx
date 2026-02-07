import { TimesTableGame } from "@/components/games/TimesTableGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Times Tables | Game Arena | teacher.ninja",
  description: "Master multiplication with visual grids and smart drills!",
};

export default function TimesTablePage() {
  return (
    <GameErrorBoundary gameName="Times Tables">
      <TimesTableGame />
    </GameErrorBoundary>
  );
}
