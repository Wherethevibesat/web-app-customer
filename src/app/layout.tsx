import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-urbanist",
});

export const metadata: Metadata = {
  title: {
    default: "Where The Vibes At — Events & Nightlife",
    template: "%s · Where The Vibes At",
  },
  description:
    "Discover events, clubs, and venues. Find where the vibes are tonight in your city.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${urbanist.variable} h-full`}>
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
