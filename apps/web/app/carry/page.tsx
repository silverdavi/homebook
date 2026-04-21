import type { Metadata } from "next";
import { CarryLab } from "@/components/carry-lab/CarryLab";

export const metadata: Metadata = {
  title: "Carry Lab | teacher.ninja",
  description:
    "Learn long multiplication the way your brain wants to learn it. "
    + "Interactive column-by-column practice with live place-value hints.",
  openGraph: {
    title: "Carry Lab | teacher.ninja",
    description:
      "Interactive long multiplication — fill each column, see the carry, master the place values.",
  },
};

export default function CarryPage() {
  return <CarryLab />;
}
