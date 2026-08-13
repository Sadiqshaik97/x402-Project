"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import TextNftCard from "@/components/TextNftCard";
import algosdk from "algosdk";
import Link from "next/link";
import { ShoppingBag, Check, ExternalLink, Sparkles, RefreshCw, Zap, ShieldCheck, Trophy, Gauge } from "lucide-react";

interface F1MarketCard {
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
  owner?: string;
  assetId?: number;
  txId?: string;
  loraUrl?: string;
  isListed?: boolean;
  priceAlgo?: number;
  listedAt?: string;
}

const RECEIVER_ADDRESS = "AAF4IUHBUGHLHXXX352AZKFLGURDJVZVNJYGSAMETU7VRGQ62UOJE5CMRQ";

export default function Marketplace() {
  const { activeAddress, transactionSigner } = useWallet();
  const [cards, setCards] = useState<F1MarketCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; loraUrl?: string } | null>(null);

  const fetchMarketplace = async (showRefreshState = false) => {
    try {
      if (showRefreshState) setRefreshing(true);
      const res = await fetch("http://localhost:4021/api/marketplace-cards");
      const data = await res.json();
      if (data.cards && Array.isArray(data.cards)) {
        setCards(data.cards);
      } else {
        setCards([]);
      }
    } catch (err) {
      console.error("Failed to fetch real-time marketplace cards:", err);
      setCards([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketplace();

    // Real-time polling every 4 seconds to sync active listings across users
    const interval = setInterval(() => {
      fetchMarketplace();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleBuyCard = async (card: F1MarketCard) => {
    if (!activeAddress) {
      alert("Please connect your Pera Wallet first to buy F1 NFTs.");
      return;
    }

    const price = card.priceAlgo || 10;
    setBuyingId(card.id);
    setStatusMessage(`Preparing ${price} ALGO payment in Pera Wallet for ${card.driver} NFT...`);

    try {
      // Connect to Algorand TestNet
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");
      const params = await algodClient.getTransactionParams().do();
      const amountMicroAlgos = Math.round(price * 1_000_000);

      // Build payment transaction to seller/receiver
      const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: card.owner && card.owner !== "ANONYMOUS" ? card.owner : RECEIVER_ADDRESS,
        amount: amountMicroAlgos,
        suggestedParams: params,
        note: new TextEncoder().encode(`F1 Collect Marketplace Purchase: ${card.driver} (#${card.number}) Card ASA:${card.assetId || 'N/A'}`),
      });

      setStatusMessage("Awaiting transaction signature in Pera Wallet...");
      const signedBytesArray = await transactionSigner([payTxn], [0]);

      setStatusMessage("Broadcasting payment transaction to Algorand TestNet...");
      const { txid } = await algodClient.sendRawTransaction(signedBytesArray[0]).do();

      setStatusMessage(`Waiting for Algorand block confirmation (TxID: ${txid.slice(0, 8)}...)...`);
      await algosdk.waitForConfirmation(algodClient, txid, 4);

      setStatusMessage("Transferring NFT ownership in backend database...");
      const res = await fetch("http://localhost:4021/api/buy-marketplace-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: card.id,
          buyerAddress: activeAddress,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({
          message: `Success! You bought ${card.driver} (${card.team}) NFT for ${price} ALGO!`,
          loraUrl: `https://testnet.lora.algokit.io/transaction/${txid}`,
        });
        await fetchMarketplace();
      } else {
        alert(data.error || "Failed to finalize card purchase.");
      }
    } catch (err: any) {
      console.error("Error during marketplace purchase:", err);
      alert(`Purchase cancelled or failed: ${err.message || err}`);
    } finally {
      setBuyingId(null);
      setStatusMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] py-12 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-white/10 pb-6 gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">
                F1 Marketplace
              </h1>
              <button
                onClick={() => fetchMarketplace(true)}
                title="Refresh Real-Time Listings"
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin text-[#E10600]" : ""}`} />
              </button>
            </div>
            <p className="text-gray-400 font-medium tracking-wider mt-2 text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Real-Time Market • {cards.length} Real NFT{cards.length !== 1 ? "s" : ""} Listed on Algorand TestNet
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/collection"
              className="bg-[#E10600] hover:bg-[#b80500] text-white px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-red-900/30"
            >
              <ShoppingBag className="w-4 h-4" />
              List Cards from My Garage
            </Link>
          </div>
        </div>

        {/* Status indicator bar */}
        {statusMessage && (
          <div className="max-w-xl mx-auto mb-10 p-4 bg-blue-600/20 border border-blue-500 rounded-xl text-center flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-200 font-bold text-sm">{statusMessage}</span>
          </div>
        )}

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
              <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white font-bold">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Card Grid or Empty State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-[#E10600] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-mono text-sm">Fetching real-time F1 marketplace listings...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20 bg-[#15151e]/80 border border-white/10 rounded-3xl p-8 md:p-12 max-w-2xl mx-auto backdrop-blur-md shadow-2xl">
            <div className="w-16 h-16 bg-[#E10600]/10 border border-[#E10600]/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-[#E10600]" />
            </div>
            <h3 className="text-3xl font-black italic uppercase mb-3">No NFTs Currently Listed</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-md mx-auto">
              There are no user-listed F1 NFT cards on the marketplace right now. Open your garage to list your cards or mint new driver packs!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/collection"
                className="py-3 px-8 bg-[#E10600] hover:bg-[#b80500] text-white font-bold uppercase tracking-wider rounded-xl transition-all text-sm shadow-lg shadow-red-900/30"
              >
                Go to My Garage
              </Link>
              <Link
                href="/buy-packs"
                className="py-3 px-8 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider rounded-xl transition-all text-sm"
              >
                Mint New Pack
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cards.map((card) => {
              const isOwner = activeAddress && card.owner === activeAddress;
              return (
                <div key={card.id} className="relative group flex flex-col bg-[#15151e] rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-all hover:border-[#E10600]/50">
                  {/* NFT Visual Card */}
                  <div className="p-4">
                    <TextNftCard 
                      id={card.id}
                      name={card.driver}
                      type="Driver"
                      rarity={card.rarity as any}
                      description={`${card.team} • #${card.number} • ${card.championships}x Champion`}
                      edition={card.number}
                      maxEdition={100}
                      isListed={true}
                      priceAlgo={card.priceAlgo || 10}
                    />
                  </div>

                  {/* F1 Telemetry & Specs Breakdown */}
                  <div className="px-5 py-4 border-t border-white/5 bg-[#0d0d14]/60 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-white">
                        <Gauge className="w-3.5 h-3.5 text-[#E10600]" /> Telemetry Specs
                      </span>
                      <span className="text-gray-500 font-mono text-[11px]">{card.packType} Pack</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <span className="text-gray-400 block text-[10px] uppercase font-sans">Top Speed</span>
                        <span className="text-white font-bold">{card.topSpeed} km/h</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <span className="text-gray-400 block text-[10px] uppercase font-sans">0-100 km/h</span>
                        <span className="text-white font-bold">{card.acceleration}s</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <span className="text-gray-400 block text-[10px] uppercase font-sans">Cornering G</span>
                        <span className="text-white font-bold">{card.corneringG} G</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <span className="text-gray-400 block text-[10px] uppercase font-sans">Titles</span>
                        <span className="text-white font-bold">{card.championships} World Titles</span>
                      </div>
                    </div>

                    {/* Algorand ASA Info */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono text-gray-400">
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ASA #{card.assetId || "Verified"}</span>
                      </div>
                      {card.loraUrl && (
                        <a
                          href={card.loraUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#E10600] hover:underline flex items-center gap-1 text-[11px]"
                        >
                          Explorer <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Buy Footer */}
                  <div className="p-4 bg-[#1a1a24] border-t border-white/10 flex justify-between items-center mt-auto">
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Asking Price</div>
                      <div className="text-xl font-black text-white flex items-center gap-1">
                        {card.priceAlgo || 10} <span className="text-xs text-[#E10600] font-bold">ALGO</span>
                      </div>
                    </div>

                    {isOwner ? (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider">
                        Listed by You
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleBuyCard(card)}
                        disabled={buyingId === card.id}
                        className="bg-[#E10600] hover:bg-[#b80500] text-white px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-900/30"
                      >
                        {buyingId === card.id ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Buying...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Buy Now
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
