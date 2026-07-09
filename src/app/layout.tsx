import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SplashScreen } from "@/components/splash-screen";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { OfflineBanner } from "@/components/ui/offline-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SuppSync — AI Supplement Tracker",
  description: "Your AI-powered daily supplement companion. Track supplements, get insights, and optimize your biohacking stack.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground relative min-h-screen overflow-x-hidden`}
      >
        {/* Ambient atmospheric glows */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
          <div className="absolute top-[-10%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute top-[20%] right-[-30%] w-[80vw] h-[80vw] rounded-full bg-purple-500/8 blur-[150px]" />
          <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/6 blur-[100px]" />
        </div>
        
        <div className="relative z-10">
          <SplashScreen>
            <OfflineBanner />
            <OnboardingFlow />
            {children}
          </SplashScreen>
        </div>
      </body>
    </html>
  );
}

