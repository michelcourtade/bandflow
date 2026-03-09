import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = { variable: "font-sans" };
const geistMono = { variable: "font-mono" };

export const metadata: Metadata = {
  title: "BandFlow | Repertoire & Setlist Management",
  description: "The collaborative platform for music bands to orchestrate their success.",
};

import NextTopLoader from 'nextjs-toploader';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-indigo-500/30`}>
        <NextTopLoader 
            color="#6366f1"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #6366f1,0 0 5px #6366f1"
        />
        <TooltipProvider>
          {children}
          <Toaster position="bottom-right" theme="dark" closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}
