import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { WalletProvider } from "@/providers/WalletProvider";
import Navbar from "@/components/Navbar";

const titillium = Titillium_Web({
  weight: ["300", "400", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "F1 Collect | Algorand NFTs",
  description: "Collect and trade F1 text-based NFTs on Algorand",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${titillium.variable} antialiased min-h-screen flex flex-col`}>
        <WalletProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-[#15151e] border-t border-white/10 py-8 text-center text-gray-500 text-sm font-bold uppercase tracking-wider">
            <p>&copy; {new Date().getFullYear()} F1 Collect. Not affiliated with Formula 1.</p>
            <div className="mt-4 flex justify-center gap-6">
              <Link href="/how-it-works" className="hover:text-white transition-colors">How it works</Link>
              <Link href="/transactions" className="hover:text-white transition-colors">Transactions</Link>
            </div>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
