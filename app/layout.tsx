import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AinovaHealth Medical",
    template: "%s · AinovaHealth Medical",
  },
  description: "Historias clínicas para profesionales de salud.",
  icons: {
    icon: "/ainovahealth-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${plex.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-ink">{children}</body>
    </html>
  );
}
