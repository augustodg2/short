import "./globals.css";

import type { Metadata } from "next";
import { Header } from "./_components/Header";
import { Providers } from "./_context/providers";
import { Footer } from "./_components/Footer";

export const metadata: Metadata = {
  title: "Short - A URL shortner",
  description: "A URL shortner.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <html lang="en">
        <body className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 p-4">{children}</main>
          <Footer />
        </body>
      </html>
    </Providers>
  );
}
