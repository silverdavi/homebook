import { GraphPlotterGame } from "@/components/games/GraphPlotterGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Graph Plotter | Game Arena | teacher.ninja",
  description: "Plot points, find slopes, and draw lines on an interactive coordinate grid!",
};

export default function GraphPlotterPage() {
  return (
    <GameErrorBoundary gameName="Graph Plotter">
      <GraphPlotterGame />
    </GameErrorBoundary>
  );
}
