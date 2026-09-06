import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionProvider } from "@/components/MotionProvider";
import { VinylDock } from "@/components/player/VinylDock";
import { DockMobileBar } from "@/components/player/DockMobileBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jayden Maloto — Portfolio",
  description: "Selected product work, presented as records.",
};

export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <MotionProvider>
          {/* The content column. pl-[var(--dock-w)] is a no-op below lg,
              where the token is 0px, so no breakpoint variant is needed. */}
          <main className="flex min-h-full flex-1 flex-col pl-[var(--dock-w)]">{children}</main>
          {/* Sibling of <main>, not a child: the modal is fixed and sets its
              own left inset, so nesting it inside a padded flex child would
              add nothing and risk a stray stacking context. */}
          {modal}
          <VinylDock />
          <DockMobileBar />
        </MotionProvider>
      </body>
    </html>
  );
}
