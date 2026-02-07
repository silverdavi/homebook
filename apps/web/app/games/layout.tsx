import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Arena | teacher.ninja",
  description:
    "25+ educational games that make learning fun — math, science, history, language, and more!",
  openGraph: {
    title: "Game Arena | teacher.ninja",
    description:
      "25+ educational games that make learning fun — math, science, history, language, and more!",
  },
};

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
