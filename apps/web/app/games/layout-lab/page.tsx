import { LayoutLabGame } from "@/components/games/LayoutLabGame";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Layout Lab | teacher.ninja",
  description: "Master visual layout! Align elements, fix spacing, and create balanced compositions.",
};

export default function LayoutLabPage() {
  return <LayoutLabGame />;
}
