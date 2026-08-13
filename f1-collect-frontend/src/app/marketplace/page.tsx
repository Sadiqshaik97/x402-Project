"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import TextNftCard from "@/components/TextNftCard";
import algosdk from "algosdk";
import Link from "next/link";
import { ShoppingBag, Check, ExternalLink, Sparkles } from "lucide-react";

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

const DEMO_CARDS: F1MarketCard[] = [
  {
    id: "demo-1",
    driver: "Kimi Antonelli",
    team: "Mercedes AMG",
    number: 12,
    rarity: "Rare",
    topSpeed: 351,
    acceleration: 2.2,
    corneringG: 4.95,
    championships: 0,
    imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7",
    mintedAt: new Date().toISOString(),
    packType: "Basic",
    priceAlgo: 15,
    isListed: true,
  },
  {
    id: "demo-2",
    driver: "George Russell",
    team: "Mercedes AMG",
    number: 63,
    rarity: "Legendary",
    topSpeed: 354,
    acceleration: 2.15,
    corneringG: 5.1,
    championships: 0,
    imageUrl: "https://images.unsplash.com/photo-1541348263662-e068662d82af",
    mintedAt: new Date().toISOString(),
    packType: "Apex",
    priceAlgo: 25,
    isListed: true,
  },
];

export default function Marketplace() {
  const { activeAddress, transactionSigner } = useWallet();
  const [cards, setCards] = useState<F1MarketCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; loraUrl?: string } | null>(null);

  const fetchMarketplace = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:4021/api/marketplace-cards");
      const data = await res.json();
      if (data.cards && data.cards.length > 0) {
        setCards(data.cards);
      } else {
        setCards(DEMO_CARDS);
      }
    } catch (err) {
      console.error("Failed to fetch marketplace cards:", err);
      setCards(DEMO_CARDS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplace();
  }, []);

  const handleBuyCard = async (card: F1MarketCard) => {
    if (!activeAddress) {
      alert("Please connect your Pera Wallet first.");
      return;
    }

    const price = card.priceAlgo || 10;
    setBuyingId(card.id);
    setStatusMessage(`Preparing ${price} ALGO payment in Pera Wallet...`);

    try {
      // Connect to Algorand TestNet
      const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");
      const params = await algodClient.getTransactionParams().do();
      const amountMicroAlgos = Math.round(price * 1_000_000);

      // Build payment transaction to receiver/seller
      const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: card.owner && card.owner !== "ANONYMOUS" ? card.owner : RECEIVER_ADDRESS,
        amount: amountMicroAlgos,
        suggestedParams: params,
        note: new TextEncoder().encode(`F1 Collect Marketplace Purchase: ${card.driver} Card`),
      });

      setStatusMessage("Awaiting signature in Pera Wallet...");
      const signedBytesArray = await transactionSigner([payTxn], [0]);

      setStatusMessage("Broadcasting transaction to Algorand TestNet...");
      const { txid } = await algodClient.sendRawTransaction(signedBytesArray[0]).do();

      setStatusMessage(`Waiting for TestNet confirmation (TxID: ${txid.slice(0, 8)}...)...`);
      await algosdk.waitForConfirmation(algodClient, txid, 4);

      setStatusMessage("Transferring card ownership in garage...");
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
          message: `Congratulations! ${card.driver} NFT purchased for ${price} ALGO!`,
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/10 pb-6 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">
              Marketplace
            </h1>
            <p className="text-gray-400 font-medium tracking-wider mt-2 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Secondary Market • Verified x402 Algorand TestNet Trading
            </p>
          </div>
          <Link
            href="/collection"
            className="bg-[#E10600] hover:bg-[#b80500] text-white px-5 py-2.5 rounded text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            List Cards from My Garage
          </Link>
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
              <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Card Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#E10600] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {cards.map((card) => {
              const isOwner = activeAddress && card.owner === activeAddress;
              return (
                <div key={card.id} className="relative group">
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
                  <div className="mt-4 flex justify-between items-center bg-[#15151e] p-4 rounded-xl border border-white/5">
                    <div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Asking Price</div>
                      <div className="text-xl font-black text-white">{card.priceAlgo || 10} ALGO</div>
                    </div>
                    {isOwner ? (
                      <span className="bg-white/10 text-gray-400 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider">
                        Listed by You
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleBuyCard(card)}
                        disabled={buyingId === card.id}
                        className="bg-[#E10600] hover:bg-[#b80500] text-white px-6 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs transition-colors disabled:opacity-50 flex items-center gap-2"
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
