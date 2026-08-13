"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import TextNftCard from "@/components/TextNftCard";
import Link from "next/link";

interface F1CardData {
  id: string;
  driver: string;
  team: string;
  number: number;
  rarity: "Common" | "Rare" | "Legendary";
  topSpeed: number;
  acceleration: number;
  corneringG: number;
  championships: number;
  imageUrl: string;
  mintedAt: string;
  packType: "Basic" | "Apex";
  assetId?: number;
  txId?: string;
  loraUrl?: string;
}

export default function Collection() {
  const { activeAddress } = useWallet();
  const [cards, setCards] = useState<F1CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const address = isMounted ? activeAddress : null;

  useEffect(() => {
    if (!address) return;

    async function fetchUserCards() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:4021/api/my-cards?address=${address}`);
        const data = await res.json();
        if (data.cards) {
          setCards(data.cards);
        }
      } catch (err) {
        console.error("Failed to fetch user cards:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserCards();
  }, [address]);

  const handleBurn = (id: string) => {
    alert(`Initiating on-chain burn for card ${id}...`);
  };

  const handleList = (id: string) => {
    alert(`Listing card ${id} on the marketplace...`);
  };

  if (!isMounted || !address) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex flex-col items-center justify-center py-20 px-4 text-white">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-4 text-center">
          Wallet Disconnected
        </h1>
        <p className="text-gray-400 max-w-md text-center">
          Please connect your Pera Wallet to view your F1 Collect garage and manage your cards.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14] py-12 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/10 pb-6 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">
              My Garage
            </h1>
            <p className="text-[#E10600] font-bold uppercase tracking-wider mt-2 text-sm">
              {cards.length} F1 NFT Cards Owned
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/buy-packs"
              className="bg-[#E10600] hover:bg-[#b80500] text-white px-5 py-2.5 rounded text-sm font-bold uppercase tracking-wider transition-colors"
            >
              + Mint New Pack
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#E10600] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20 bg-[#15151e] border border-white/10 rounded-2xl p-8 max-w-xl mx-auto">
            <h3 className="text-2xl font-black italic uppercase mb-3">Your Garage is Empty</h3>
            <p className="text-gray-400 text-sm mb-6">
              You haven't minted any F1 driver cards yet. Head over to Buy Packs to open your first pack!
            </p>
            <Link
              href="/buy-packs"
              className="inline-block py-3 px-8 bg-[#E10600] hover:bg-[#b80500] text-white font-bold uppercase tracking-wider rounded-xl transition-colors text-sm"
            >
              Buy Packs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {cards.map((card) => (
              <TextNftCard
                key={card.id}
                id={card.id}
                name={card.driver}
                type="Driver"
                rarity={card.rarity as any}
                description={`${card.team} • #${card.number} • ${card.championships}x Champion`}
                edition={card.number}
                maxEdition={100}
                onBurn={handleBurn}
                onList={handleList}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
