import { ConnectDotsGame } from "@/components/games/ConnectDotsGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Connect the Dots | Game Arena | teacher.ninja",
  description: "Connect numbered dots in order to reveal shapes! Learn counting sequences, constellations, and circuits.",
};

export default function ConnectDotsPage() {
  return (
    <GameErrorBoundary gameName="Connect the Dots">
      <ConnectDotsGame />
    </GameErrorBoundary>
  );
}
