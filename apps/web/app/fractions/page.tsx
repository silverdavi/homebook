import type { Metadata } from "next";
import { FractionsLab } from "@/components/fractions/FractionsLab";

export const metadata: Metadata = {
  title: "Fractions Lab | teacher.ninja",
  description:
    "Learn fractions step by step — GCF, LCM, simplify, add, subtract, "
    + "multiply and divide, with live pizza diagrams and a coach that "
    + "explains every step.",
  openGraph: {
    title: "Fractions Lab | teacher.ninja",
    description:
      "Interactive fractions — pizzas, factor lists, equivalent forms and full step-by-step coaching.",
  },
};

export default function FractionsPage() {
  return <FractionsLab />;
}
