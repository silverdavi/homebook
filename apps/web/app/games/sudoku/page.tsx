import { SudokuGame } from "@/components/games/SudokuGame";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";

export const metadata = {
  title: "Sudoku | Game Arena | teacher.ninja",
  description:
    "Classic 9x9 Sudoku puzzle. Choose your difficulty and test your logic skills. Works on e-readers!",
};

export default function SudokuPage() {
  return (
    <GameErrorBoundary gameName="Sudoku">
      <SudokuGame />
    </GameErrorBoundary>
  );
}
