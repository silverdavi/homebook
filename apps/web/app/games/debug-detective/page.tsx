import { DebugDetectiveGame } from "@/components/games/DebugDetectiveGame";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Debug Detective | teacher.ninja",
  description: "Find bugs in code! Learn debugging skills by spotting errors in pseudocode and simple programs.",
};

export default function DebugDetectivePage() {
  return <DebugDetectiveGame />;
}
