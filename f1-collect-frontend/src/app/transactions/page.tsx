"use client";

import { motion } from "framer-motion";
import { ExternalLink, CheckCircle2, Clock } from "lucide-react";

interface TxRecord {
  txId: string;
  type: string;
  amount: string;
  timestamp: string;
  status: "Confirmed" | "Pending";
  loraUrl: string;
  explorerUrl: string;
}

const MOCK_TRANSACTIONS: TxRecord[] = [
  {
    txId: "TX-7K9A...4M2N",
    type: "Pack Purchase (Grand Prix)",
    amount: "5.0 ALGO",
    timestamp: "2 mins ago",
    status: "Confirmed",
    loraUrl: "https://lora.algokit.io/testnet/transaction/TX-7K9A4M2N",
    explorerUrl: "https://testnet.algoexplorer.io/tx/TX-7K9A4M2N",
  },
  {
    txId: "TX-3B1C...9P8Q",
    type: "Pack Purchase (Sprint)",
    amount: "1.0 ALGO",
    timestamp: "15 mins ago",
    status: "Confirmed",
    loraUrl: "https://lora.algokit.io/testnet/transaction/TX-3B1C9P8Q",
    explorerUrl: "https://testnet.algoexplorer.io/tx/TX-3B1C9P8Q",
  },
  {
    txId: "TX-8X2Y...1Z3W",
    type: "NFT Burn (Common Card)",
    amount: "0.0 ALGO",
    timestamp: "1 hour ago",
    status: "Confirmed",
    loraUrl: "https://lora.algokit.io/testnet/transaction/TX-8X2Y1Z3W",
    explorerUrl: "https://testnet.algoexplorer.io/tx/TX-8X2Y1Z3W",
  },
];

export default function Transactions() {
  return (
    <div className="min-h-screen bg-[#0d0d14] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-4">
            Recent Transactions
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Real-time Algorand blockchain ledger activity for x402 payments and NFT actions.
          </p>
        </div>

        <div className="bg-[#15151e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-w-5xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="py-4 px-6">Transaction ID</th>
                  <th className="py-4 px-6">Action</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Time</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Explorer Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {MOCK_TRANSACTIONS.map((tx, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono text-[#E10600] font-bold">
                      {tx.txId}
                    </td>
                    <td className="py-4 px-6 font-bold text-white">
                      {tx.type}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-gray-300">
                      {tx.amount}
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-xs">
                      {tx.timestamp}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full border border-green-500/20">
                        <CheckCircle2 size={12} />
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-3 text-xs">
                        <a
                          href={tx.loraUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors bg-white/5 px-2.5 py-1 rounded"
                        >
                          Lora <ExternalLink size={12} />
                        </a>
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors bg-white/5 px-2.5 py-1 rounded"
                        >
                          Explorer <ExternalLink size={12} />
                        </a>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
