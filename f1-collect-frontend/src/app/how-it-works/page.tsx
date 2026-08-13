"use client";

import { motion } from "framer-motion";
import { Wallet, CreditCard, ShieldCheck, Repeat } from "lucide-react";
import Link from "next/link";

export default function HowItWorks() {
  const steps = [
    {
      icon: <Wallet className="w-8 h-8 text-[#E10600]" />,
      title: "1. Connect Pera Wallet",
      description:
        "Connect your Algorand Pera Wallet to authenticate your session and access your personal garage.",
    },
    {
      icon: <CreditCard className="w-8 h-8 text-[#E10600]" />,
      title: "2. x402 Micropayments",
      description:
        "Select your pack (Sprint or Grand Prix). Payments are seamlessly handled via x402 HTTP micropayments with sub-second ALGO settlement.",
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-[#E10600]" />,
      title: "3. Text-Based NFT Minting",
      description:
        "Receive verified text-based Algorand Standard Assets (ASAs) featuring official driver data, stats, and rarity tiers directly into your collection.",
    },
    {
      icon: <Repeat className="w-8 h-8 text-[#E10600]" />,
      title: "4. Trade, Burn & Collect",
      description:
        "List your cards on the secondary marketplace or burn unwanted NFTs to maintain proof-of-rarity within the ecosystem.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d14] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-4">
            How It Works
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Demystifying F1 Collect: Algorand text-based NFTs powered by the x402 payment protocol.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#15151e] border border-white/10 p-8 rounded-2xl flex flex-col justify-between hover:border-[#E10600]/50 transition-colors"
            >
              <div>
                <div className="p-3 bg-white/5 w-fit rounded-xl mb-6">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-black italic uppercase mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center bg-gradient-to-r from-red-950/40 via-[#15151e] to-black border border-white/10 p-12 rounded-3xl max-w-4xl mx-auto">
          <h2 className="text-3xl font-black italic uppercase mb-4">
            Ready to Build Your Garage?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Experience ultra-fast micropayments on Algorand TestNet and start collecting driver cards today.
          </p>
          <Link
            href="/buy-packs"
            className="inline-block bg-[#E10600] hover:bg-[#b80500] text-white px-8 py-4 text-sm font-bold uppercase tracking-wider rounded-sm transition-colors"
          >
            Buy Packs Now
          </Link>
        </div>

      </div>
    </div>
  );
}
