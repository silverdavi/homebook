import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Arena | teacher.ninja",
  description:
    "Educational games that make learning fun. Play letter rain, math blitz, and more!",
};

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
