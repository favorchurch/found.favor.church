import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const interFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Lost & Found | Favor Church",
  description: "Official lost and found tracker for Favor Church.",
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${interFont.variable} antialiased`}>
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
          {modal}
        </Providers>
      </body>
    </html>
  );
}
