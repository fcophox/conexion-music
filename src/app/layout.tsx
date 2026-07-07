import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Conexión",
  description: "Escucha la discografía completa de conexión. Explora sus álbumes, letras y música alternativa en un solo lugar.",
  openGraph: {
    title: "Conexión",
    description: "Escucha la discografía completa de conexión. Explora sus álbumes, letras y música alternativa en un solo lugar.",
    siteName: "Conexión",
    locale: "es_ES",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
