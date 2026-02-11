import { BinaryBitsGame } from "@/components/games/BinaryBitsGame";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Binary & Bits | teacher.ninja",
  description: "Learn binary numbers, hexadecimal, and logic gates — the language of computers!",
};

export default function BinaryBitsPage() {
  return <BinaryBitsGame />;
}
