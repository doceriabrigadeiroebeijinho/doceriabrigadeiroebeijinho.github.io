import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Doceria Brigadeiro & Beijinho | Bolos e doces personalizados em BH",
  description: "Bolos personalizados, doces, bombons e presentes feitos sob encomenda em Belo Horizonte.",
  other: { "codex-preview": "development" },
  icons: { icon: "/assets/brand-mark.webp", shortcut: "/assets/brand-mark.webp" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${cormorant.variable} ${manrope.variable}`}>{children}</body>
    </html>
  );
}
