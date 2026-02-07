import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import { VersionFooter } from "@/components/VersionFooter";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "teacher.ninja — Worksheet Generator & Game Arena",
  description:
    "Generate beautiful worksheets and play 25+ educational games. Math, science, history, and more — for students of all ages.",
  openGraph: {
    title: "teacher.ninja — Worksheets & Educational Games",
    description:
      "Generate beautiful worksheets and play 25+ educational games. Math, science, history, and more.",
    siteName: "teacher.ninja",
    type: "website",
    url: "https://teacher.ninja",
  },
  twitter: {
    card: "summary_large_image",
    title: "teacher.ninja — Worksheets & Educational Games",
    description:
      "Generate beautiful worksheets and play 25+ educational games.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${inter.variable} font-sans antialiased pb-8`}
      >
        {children}
        <VersionFooter />
      </body>
    </html>
  );
}
