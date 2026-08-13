"use client";

import Link from "next/link";
import { useWallet, WalletId } from "@txnlab/use-wallet-react";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { activeAddress, wallets } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const peraWallet = wallets?.find((w) => w.id === WalletId.PERA);

  const handleConnect = async () => {
    if (activeAddress) {
      peraWallet?.disconnect();
    } else {
      peraWallet?.connect();
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Buy Packs", href: "/buy-packs" },
    { name: "Collection", href: "/collection" },
    { name: "Marketplace", href: "/marketplace" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#15151e] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-[#E10600] font-black text-3xl italic tracking-tighter">F1</span>
              <span className="text-white font-bold text-xl tracking-tight hidden sm:block">COLLECT</span>
            </Link>
            
            <nav className="hidden md:flex gap-1 h-full">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`relative px-4 h-20 flex items-center text-sm font-bold tracking-wide uppercase transition-colors ${
                      isActive ? "text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-1 bg-[#E10600]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleConnect}
              className={`hidden sm:flex items-center gap-2 px-6 py-2.5 rounded text-sm font-bold uppercase tracking-wider transition-all ${
                activeAddress
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-[#E10600] text-white hover:bg-[#b80500]"
              }`}
            >
              {activeAddress ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {activeAddress.slice(0, 4)}...{activeAddress.slice(-4)}
                </>
              ) : (
                "Connect Wallet"
              )}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-gray-300 hover:text-white p-2"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-[#0d0d14] border-b border-white/10">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-4 text-base font-bold uppercase tracking-wider border-b border-white/5 ${
                  pathname === link.href ? "text-[#E10600]" : "text-gray-300"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4">
              <button
                onClick={handleConnect}
                className="w-full flex justify-center items-center gap-2 px-6 py-3 rounded bg-[#E10600] text-white text-base font-bold uppercase tracking-wider"
              >
                {activeAddress ? `Disconnect (${activeAddress.slice(0, 4)}...${activeAddress.slice(-4)})` : "Connect Wallet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
