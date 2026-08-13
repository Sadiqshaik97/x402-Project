"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import TextNftCard from "@/components/TextNftCard";
import Link from "next/link";
import { Flame, Tag, X, Check, ExternalLink } from "lucide-react";

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
  isListed?: boolean;
  priceAlgo?: number;
  listedAt?: string;
}

export default function Collection() {
  const { activeAddress } = useWallet();
  const [cards, setCards] = useState<F1CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Modal states
  const [listingCard, setListingCard] = useState<F1CardData | null>(null);
  const [listPrice, setListPrice] = useState<string>("10");
  const [burningCard, setBurningCard] = useState<F1CardData | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; loraUrl?: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const address = isMounted ? activeAddress : null;

  const fetchUserCards = async () => {
    if (!address) return;
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
  };

  useEffect(() => {
    fetchUserCards();
  }, [address]);

  // Handle Listing
  const submitList = async () => {
    if (!listingCard || !listPrice || isNaN(Number(listPrice)) || Number(listPrice) <= 0) {
      alert("Please enter a valid ALGO price.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch("http://localhost:4021/api/list-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: listingCard.id,
          priceAlgo: Number(listPrice),
          owner: address,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({ message: `${listingCard.driver} listed on Marketplace for ${listPrice} ALGO!` });
        setListingCard(null);
        await fetchUserCards();
      } else {
        alert(data.error || "Failed to list card");
      }
    } catch (err) {
      console.error("Error listing card:", err);
      alert("Error connecting to server to list card.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delisting
  const handleDelist = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await fetch("http://localhost:4021/api/delist-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: id, owner: address }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ message: "Card delisted from marketplace." });
        await fetchUserCards();
      }
    } catch (err) {
      console.error("Error delisting card:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle On-Chain Burn
  const submitBurn = async () => {
    if (!burningCard) return;

    try {
      setActionLoading(true);
      const res = await fetch("http://localhost:4021/api/burn-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: burningCard.id, owner: address }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({
          message: `${burningCard.driver} NFT (#${burningCard.number}) burned on Algorand TestNet!`,
          loraUrl: data.loraUrl,
        });
        setBurningCard(null);
        await fetchUserCards();
      } else {
        alert(data.error || "Failed to burn card");
      }
    } catch (err) {
      console.error("Error burning card:", err);
      alert("Error executing on-chain burn.");
    } finally {
      setActionLoading(false);
    }
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
    <div className="min-h-screen bg-[#0d0d14] py-12 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
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
              href="/marketplace"
              className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded text-sm font-bold uppercase tracking-wider transition-colors"
            >
              Browse Marketplace
            </Link>
            <Link
              href="/buy-packs"
              className="bg-[#E10600] hover:bg-[#b80500] text-white px-5 py-2.5 rounded text-sm font-bold uppercase tracking-wider transition-colors"
            >
              + Mint New Pack
            </Link>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="mb-8 p-4 bg-emerald-500/20 border border-emerald-500 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-200 font-bold text-sm">{notification.message}</span>
            </div>
            <div className="flex items-center gap-3">
              {notification.loraUrl && (
                <a
                  href={notification.loraUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-300 hover:underline flex items-center gap-1 font-mono"
                >
                  Lora Explorer <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
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
                isListed={card.isListed}
                priceAlgo={card.priceAlgo}
                onBurn={() => setBurningCard(card)}
                onList={() => {
                  setListingCard(card);
                  setListPrice("10");
                }}
                onDelist={handleDelist}
              />
            ))}
          </div>
        )}
      </div>

      {/* Listing Modal */}
      {listingCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15151e] border border-white/15 rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setListingCard(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black italic uppercase">List Card for Sale</h3>
                <p className="text-xs text-gray-400">{listingCard.driver} ({listingCard.team})</p>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Listing Price (ALGO)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  className="w-full bg-[#0d0d14] border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-lg focus:outline-none focus:border-[#E10600]"
                  placeholder="10"
                />
                <span className="absolute right-4 top-3 text-gray-400 font-bold text-sm">ALGO</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setListingCard(null)}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl font-bold uppercase tracking-wider text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitList}
                disabled={actionLoading}
                className="flex-1 bg-[#E10600] hover:bg-[#b80500] py-3 rounded-xl font-bold uppercase tracking-wider text-sm disabled:opacity-50"
              >
                {actionLoading ? "Listing..." : "Confirm Listing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Burn Confirmation Modal */}
      {burningCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15151e] border border-red-500/30 rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setBurningCard(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-600/20 text-red-500 rounded-xl border border-red-500/20">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black italic uppercase text-red-400">Burn F1 NFT Card</h3>
                <p className="text-xs text-gray-400">{burningCard.driver} (#{burningCard.number})</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed bg-red-950/20 p-3 rounded-xl border border-red-900/30">
              Are you sure you want to burn this NFT? This action will permanently destroy the ASA token on Algorand TestNet and remove it from your garage.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBurningCard(null)}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl font-bold uppercase tracking-wider text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitBurn}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold uppercase tracking-wider text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Flame className="w-4 h-4" />
                {actionLoading ? "Burning..." : "Confirm Burn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
