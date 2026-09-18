import type { Metadata } from "next";
import { Sora } from 'next/font/google';
import "./globals.css";
import ConditionalNavbar from "@/components/layout/conditionalNavbar";
import ConditionalFooter from "@/components/layout/conditionalFooter";
import ConditionalTagLineBar from "@/components/layout/conditionalTagLineBar";
import ConditionalBackToTop from "@/components/layout/conditionalBackToTop";
import CookieConsent from "@/components/layout/CookieConsent";
import { NavigationHistoryProvider } from "@/components/NavigationHistoryProvider";
import PopupProvider from "@/components/layout/PopupProvider";

import LiveChatWidget from "@/components/common/LiveChatWidget";

const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'], 
  variable: '--font-sora', 
});

export const metadata: Metadata = {
  title: "Oriyon International Ltd.",
  description: "Transforming livestock farming through sustainability, innovation, and real economic opportunity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} font-sans`}>
        <PopupProvider>
          <NavigationHistoryProvider>
            <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
              <div className="pointer-events-auto">
                <ConditionalNavbar />
              </div>
            </div>
            <main>{children}</main>
            <ConditionalFooter />
            <ConditionalBackToTop />
            <ConditionalTagLineBar />
            <CookieConsent />
            <LiveChatWidget />
          </NavigationHistoryProvider>
        </PopupProvider>
      </body>
    </html>
  );
}