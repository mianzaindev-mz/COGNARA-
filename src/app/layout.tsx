import type { Metadata } from "next";
import { Kodchasan, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const kodchasan = Kodchasan({
  subsets: ["latin"],
  variable: "--font-kodchasan",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "COGNARA™",
    template: "%s · COGNARA™",
  },
  description:
    "AI-powered educational platform aligned with SDG 4 — where knowledge finds its place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${kodchasan.variable} ${jetbrainsMono.variable} min-h-screen bg-cn-canvas font-sans text-cn-ink antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
