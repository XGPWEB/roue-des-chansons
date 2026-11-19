import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Roue des Chansons",
  description: "Roue de tirage au sort musicale pour animations karaoké",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#14052b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
