"use client";

import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { motion } from "framer-motion";
import { Check, ExternalLink, Sparkles, X } from "lucide-react";
import algosdk from "algosdk";
import TextNftCard from "@/components/TextNftCard";

const BACKEND_URL = "http://localhost:4021";
const RECEIVER_ADDRESS = "AAF4IUHBUGHLHXXX352AZKFLGURDJVZVNJYGSAMETU7VRGQ62UOJE5CMRQ";

interface MintedCardResult {
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

export default function BuyPacks() {
  const { activeAddress, transactionSigner } = useWallet();
  const [loading, setLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [mintedCard, setMintedCard] = useState<MintedCardResult | null>(null);

  const handleBuy = async (packType: "Basic" | "Apex", priceAlgo: number, endpoint: string) => {
    if (!activeAddress) {
      alert("Please connect your Pera Wallet first.");
      return;
    }

    const packLabel = packType === "Basic" ? "Sprint Pack" : "Grand Prix Pack";
    setLoading(packLabel);
    setStatusMessage(`Requesting x402 endpoint (${priceAlgo} ALGO)...`);

    try {
      // 1. Send initial request to backend endpoint
      const fullUrl = `${BACKEND_URL}${endpoint}`;
      let res = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-address": activeAddress,
        },
      });

      // 2. If 402 Payment Required or needs payment
      if (res.status === 402 || res.status === 200) {
        setStatusMessage(`Pera Wallet popup: Please confirm ${priceAlgo} ALGO payment...`);

        // Connect to Algorand TestNet
        const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");
        const params = await algodClient.getTransactionParams().do();

        // Calculate amount in microAlgos
        const amountMicroAlgos = Math.round(priceAlgo * 1_000_000);

        // Build Payment Transaction from active user wallet to receiver address
        const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          sender: activeAddress,
          receiver: RECEIVER_ADDRESS,
          amount: amountMicroAlgos,
          suggestedParams: params,
          note: new TextEncoder().encode(`F1 Collect x402 ${packType} Pack Payment`),
        });

        // Prompt Pera Wallet to sign payment transaction
        setStatusMessage("Awaiting transaction signature in Pera Wallet...");
        const signedBytesArray = await transactionSigner([payTxn], [0]);
        const signedTxn = signedBytesArray[0];

        // Broadcast transaction to Algorand TestNet
        setStatusMessage("Broadcasting ALGO payment to Algorand TestNet...");
        const { txid } = await algodClient.sendRawTransaction(signedTxn).do();
        
        setStatusMessage(`Waiting for TestNet confirmation (TxID: ${txid.slice(0, 8)}...)...`);
        await algosdk.waitForConfirmation(algodClient, txid, 4);

        // Send payment confirmation signature header back to x402 backend endpoint
        setStatusMessage("Payment confirmed! Minting F1 NFT on-chain via CollectContract...");
        res = await fetch(fullUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-address": activeAddress,
            "payment-signature": txid,
          },
        });
      }

      const data = await res.json();
      if (data.card) {
        setMintedCard(data.card);
        setStatusMessage(null);
      } else {
        alert(data.message || "Successfully completed purchase!");
      }
    } catch (error: any) {
      console.error("Error during pack purchase:", error);
      alert(`Transaction failed or cancelled: ${error.message || error}`);
    } finally {
      setLoading(null);
      setStatusMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-4 text-white">
            Mint Your Garage
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Purchase text-based NFT driver cards instantly with real ALGO via the x402 payment protocol on Algorand TestNet.
          </p>
        </div>

        {/* Status indicator bar when processing */}
        {statusMessage && (
          <div className="max-w-xl mx-auto mb-10 p-4 bg-blue-600/20 border border-blue-500 rounded-xl text-center flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-200 font-bold text-sm">{statusMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          {/* Basic Pack */}
          <motion.div
            whileHover={{ y: -10 }}
            className="bg-[#15151e] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col"
          >
            <div className="h-32 halftone-blue relative flex items-center justify-center">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white drop-shadow-md z-10">
                Sprint Pack
              </h2>
              <div className="absolute inset-0 bg-gradient-to-t from-[#15151e] to-transparent"></div>
            </div>

            <div className="p-8 flex flex-col flex-1">
              <div className="flex justify-between items-end mb-6">
                <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                  Basic Tier
                </span>
                <div className="text-right">
                  <span className="text-3xl font-black text-white">1.0</span>
                  <span className="text-gray-500 font-bold ml-1">ALGO</span>
                </div>
              </div>

              <p className="text-gray-400 mb-6 text-sm">
                Contains 1 random Driver Card. High chance of dropping Common and Rare drivers.
              </p>

              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Check size={16} className="text-blue-500" />
                  <span>Common Drop Rate: <strong className="text-white">70%</strong></span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Check size={16} className="text-blue-500" />
                  <span>Rare Drop Rate: <strong className="text-white">30%</strong></span>
                </li>
              </ul>

              <button
                onClick={() => handleBuy("Basic", 1.0, "/api/buy-basic-pack")}
                disabled={!!loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading === "Sprint Pack" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing x402...
                  </>
                ) : (
                  "Buy Pack (1.0 ALGO)"
                )}
              </button>
            </div>
          </motion.div>

          {/* Premium Pack */}
          <motion.div
            whileHover={{ y: -10 }}
            className="bg-[#15151e] border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/10 flex flex-col relative"
          >
            <div className="absolute top-4 right-4 z-20">
              <span className="bg-amber-500 text-black px-2 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-lg">
                Popular
              </span>
            </div>

            <div className="h-32 halftone-gold relative flex items-center justify-center">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white drop-shadow-md z-10">
                Grand Prix Pack
              </h2>
              <div className="absolute inset-0 bg-gradient-to-t from-[#15151e] to-transparent"></div>
            </div>

            <div className="p-8 flex flex-col flex-1">
              <div className="flex justify-between items-end mb-6">
                <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                  Premium Tier
                </span>
                <div className="text-right">
                  <span className="text-3xl font-black text-amber-500">5.0</span>
                  <span className="text-gray-500 font-bold ml-1">ALGO</span>
                </div>
              </div>

              <p className="text-gray-400 mb-6 text-sm">
                Contains 1 premium Driver Card. Guarantees Rare or Legendary World Champions.
              </p>

              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Check size={16} className="text-amber-500" />
                  <span>Rare Drop Rate: <strong className="text-white">50%</strong></span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Check size={16} className="text-amber-500" />
                  <span>Legendary Drop Rate: <strong className="text-white">50%</strong></span>
                </li>
              </ul>

              <button
                onClick={() => handleBuy("Apex", 5.0, "/api/buy-premium-pack")}
                disabled={!!loading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-[#E10600] hover:opacity-90 text-white font-bold uppercase tracking-wider rounded transition-opacity disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading === "Grand Prix Pack" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing x402...
                  </>
                ) : (
                  "Buy Apex Pack (5.0 ALGO)"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* SUCCESS MODAL FOR MINTED CARD */}
      {mintedCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#15151e] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl relative"
          >
            <button
              onClick={() => setMintedCard(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>

            <div className="flex items-center justify-center gap-2 text-amber-400 font-bold uppercase tracking-widest text-xs mb-2">
              <Sparkles size={16} /> F1 NFT Card Minted On-Chain!
            </div>

            <h3 className="text-2xl font-black italic uppercase text-white mb-6">
              Congratulations!
            </h3>

            <div className="mb-6">
              <TextNftCard
                id={mintedCard.id}
                name={mintedCard.driver}
                type="Driver"
                rarity={mintedCard.rarity as any}
                description={`${mintedCard.team} • #${mintedCard.number} • ${mintedCard.championships}x Champion`}
                edition={mintedCard.number}
                maxEdition={100}
              />
            </div>

            {mintedCard.loraUrl && (
              <a
                href={mintedCard.loraUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase text-amber-400 hover:text-amber-300 underline mb-4"
              >
                View Transaction on Lora Explorer <ExternalLink size={14} />
              </a>
            )}

            <button
              onClick={() => setMintedCard(null)}
              className="w-full py-3 bg-[#E10600] hover:bg-[#b80500] text-white font-bold uppercase tracking-wider rounded-xl transition-colors mt-2"
            >
              Close & View Garage
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
