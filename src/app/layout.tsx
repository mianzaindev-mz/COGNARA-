import type { Metadata } from "next";
import { JetBrains_Mono, Kodchasan, Source_Serif_4, Manrope, Hanken_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { AIAssistant } from "@/components/ai-assistant/AIAssistant";
import "material-symbols/outlined.css";
import "./globals.css";

const kodchasan = Kodchasan({ subsets: ["latin"], variable: "--font-kodchasan", weight: ["400", "500", "600", "700"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", weight: ["400", "500"] });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", weight: ["400", "500"] });

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", weight: ["200", "300", "400", "500", "600", "700", "800"] });
const hankenGrotesk = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken-grotesk", weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: {
    default: "COGNARA™",
    template: "%s · COGNARA™",
  },
  description: "AI-powered educational platform aligned with SDG 4 — where knowledge finds its place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${kodchasan.variable} ${jetbrainsMono.variable} ${sourceSerif.variable} ${manrope.variable} ${hankenGrotesk.variable} min-h-screen bg-cn-canvas font-sans text-cn-ink antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>
            {children}
            <AIAssistant />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
