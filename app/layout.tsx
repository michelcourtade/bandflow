import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = { variable: "font-sans" };
const geistMono = { variable: "font-mono" };

export const metadata: Metadata = {
  title: "BandFlow | Repertoire & Setlist Management",
  description: "The collaborative platform for music bands to orchestrate their success.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-indigo-500/30`}
      >
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
