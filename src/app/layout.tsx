import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
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
    <html lang="en">
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} bg-[#FAFAFA] font-sans text-[#0A0A0A] antialiased dark:bg-[#0A0A0A] dark:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
