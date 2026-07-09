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
        {/* Low-opacity fixed cosmic background image */}
        <div 
          className="fixed inset-0 pointer-events-none z-0 bg-no-repeat bg-cover bg-center select-none"
          style={{ 
            backgroundImage: "url('/bg-cosmic.jpg')",
            opacity: 0.32 
          }}
        />
        
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

