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
  title: "teacher.ninja — Worksheet Generator",
  description:
    "Generate beautiful, personalized math worksheets in seconds. Fractions, multiplication, division, and more.",
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
