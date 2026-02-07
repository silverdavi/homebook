import { MazeRunnerGame } from "@/components/games/MazeRunnerGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Maze Runner | Game Arena | teacher.ninja",
  description: "Navigate mazes and answer questions at every fork!",
};

export default function MazeRunnerPage() {
  return (
    <GameErrorBoundary gameName="Maze Runner">
      <MazeRunnerGame />
    </GameErrorBoundary>
  );
}
