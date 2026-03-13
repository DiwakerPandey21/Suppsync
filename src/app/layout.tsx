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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SplashScreen>
          <OfflineBanner />
          <OnboardingFlow />
          {children}
        </SplashScreen>
      </body>
    </html>
  );
}

