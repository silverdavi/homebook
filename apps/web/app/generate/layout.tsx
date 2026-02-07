import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Worksheet Generator | teacher.ninja",
  description:
    "Generate beautiful, personalized math and science worksheets in seconds. Customize subjects, difficulty, and format.",
  openGraph: {
    title: "Worksheet Generator | teacher.ninja",
    description:
      "Generate beautiful, personalized worksheets in seconds.",
  },
};

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
