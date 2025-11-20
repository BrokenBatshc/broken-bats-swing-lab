import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Broken Bats Hitting Club",
  description: "Broken Bats Swing Lab – swing analysis and hitting development.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
