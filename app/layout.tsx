import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doceria Brigadeiro & Beijinho | Bolos e doces personalizados em BH",
  description: "Bolos personalizados, doces, bombons e presentes feitos sob encomenda em Belo Horizonte.",
  icons: { icon: "/assets/brand-mark.webp", shortcut: "/assets/brand-mark.webp" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
