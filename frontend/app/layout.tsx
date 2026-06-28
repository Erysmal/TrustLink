import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrustLink",
  description: "Escrow-backed USDC deals with clear milestones and fast release.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen bg-[#080D1A] text-slate-100">
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080D1A]/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
              <Link href="/" className="text-sm font-semibold tracking-[0.22em] text-white">
                TRUSTLINK
              </Link>
              <nav className="flex items-center gap-2">
                <Link
                  href="/create"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-[#F59E0B]/40 hover:text-white"
                >
                  Create
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-full bg-[#F59E0B] px-4 py-2 text-sm font-semibold text-[#080D1A] transition hover:bg-[#f7b733]"
                >
                  Dashboard
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
