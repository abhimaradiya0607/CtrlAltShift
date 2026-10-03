import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CTRLALTFIX",
  description: "AI-powered developer workspace",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const fontVariables = `${geistSans.variable} ${geistMono.variable}`;

  return (
    <SessionProvider session={session}>
    <html lang="en" className={`${fontVariables} dark`}>
      <body className={`${fontVariables} antialiased`}>{children}</body>
    </html>
    </SessionProvider>
  );
}