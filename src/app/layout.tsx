import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const interFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Lost & Found | Favor Church",
  description: "Official lost and found tracker for Favor Church.",
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${interFont.variable} ${plexMono.variable} antialiased`}>
      <body className="min-h-screen bg-bg text-text-main selection:bg-brand/30">
        <Providers>
          <Toaster 
            position="bottom-right" 
            theme="light" 
            toastOptions={{ 
              style: { 
                background: '#ffffff', 
                border: '1px solid #e5e7eb',
                color: '#1a1a1a'
              } 
            }} 
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}
