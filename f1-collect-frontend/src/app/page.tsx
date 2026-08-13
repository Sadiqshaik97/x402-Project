"use client";

import Link from "next/link";
import { useWallet, WalletId } from "@txnlab/use-wallet-react";
import { ArrowRight, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function Home() {
  const { activeAddress, wallets } = useWallet();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentAddress = isMounted ? activeAddress : null;
  const peraWallet = wallets?.find((w) => w.id === WalletId.PERA);

  const handleConnect = () => {
    if (!currentAddress) {
      peraWallet?.connect();
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] min-h-[600px] flex items-center bg-[#15151e] overflow-hidden">
        {/* Abstract Background patterns */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#E10600]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>
          
          {/* Halftone pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]" 
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-sm border border-white/10 mb-6">
              <span className="text-[#E10600] font-bold tracking-widest uppercase text-xs">Algorand TestNet</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.85] mb-6 drop-shadow-lg text-white">
              Own The <br />
              <span className="text-[#E10600]">Apex</span> Moments.
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl font-light">
              F1 Collect is the ultimate text-based NFT experience powered by x402 micropayments on Algorand.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link 
                href="/buy-packs"
                className="group relative inline-flex items-center justify-center gap-3 bg-[#E10600] text-white px-8 py-4 text-sm font-bold uppercase tracking-wider overflow-hidden rounded-sm hover:bg-[#b80500] transition-colors"
              >
                <span>Buy Packs</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              {!currentAddress ? (
                <button 
                  onClick={handleConnect}
                  className="group inline-flex items-center justify-center gap-3 bg-white text-black px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors rounded-sm"
                >
                  <Wallet size={18} />
                  <span>Connect Wallet</span>
                </button>
              ) : (
                <Link 
                  href="/collection"
                  className="group inline-flex items-center justify-center gap-3 bg-white/10 text-white border border-white/20 px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-white/20 transition-colors rounded-sm backdrop-blur-sm"
                >
                  <span>View Collection</span>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Showcase / Video Section */}
      <section className="py-24 bg-[#0d0d14] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex-1 w-full"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl shadow-[#E10600]/20 border border-white/10 bg-[#15151e] flex items-center justify-center">
                {/* Placeholder for video */}
                <div className="absolute inset-0 halftone-red opacity-20"></div>
                <div className="z-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#E10600] flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-110 transition-transform">
                    <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
                  </div>
                  <p className="text-white font-bold tracking-widest uppercase">Watch Trailer</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-6">
                Pure Racing Data.
              </h2>
              <div className="w-16 h-1 bg-[#E10600] mb-6"></div>
              <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                We stripped away the fluff. No images, no unnecessary 3D models. Just the raw text data of your favorite drivers and moments.
              </p>
              <p className="text-gray-400 text-lg leading-relaxed">
                Connect your Pera Wallet, pay instantly with x402, and build a garage of Common, Rare, and Legendary text-based driver cards.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
