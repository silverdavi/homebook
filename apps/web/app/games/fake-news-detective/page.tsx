import { FakeNewsDetectiveGame } from "@/components/games/FakeNewsDetectiveGame";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fake News Detective | teacher.ninja",
  description:
    "Can you spot fake news? Learn media literacy and critical thinking skills by identifying misinformation!",
};

export default function FakeNewsDetectivePage() {
  return <FakeNewsDetectiveGame />;
}
