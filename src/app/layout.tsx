import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionProvider } from "@/components/MotionProvider";
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
          {children}
          {modal}
        </MotionProvider>
      </body>
    </html>
  );
}
