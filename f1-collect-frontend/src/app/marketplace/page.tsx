"use client";

import TextNftCard, { TextNftCardProps } from "@/components/TextNftCard";

const MARKET_CARDS: (TextNftCardProps & { price: string })[] = [
  {
    id: "m-1",
    name: "Kimi Antonelli",
    type: "Driver",
    rarity: "Epic",
    description: "The highly anticipated rookie stepping up to Mercedes.",
    edition: 12,
    maxEdition: 250,
    price: "15.0 ALGO"
  },
  {
    id: "m-2",
    name: "George Russell",
    type: "Driver",
    rarity: "Epic",
    description: "Mercedes lead driver, consistent and precise.",
    edition: 63,
    maxEdition: 250,
    price: "12.5 ALGO"
  },
  {
    id: "m-3",
    name: "Oscar Piastri",
    type: "Driver",
    rarity: "Rare",
    description: "The calm and collected prodigy driving for McLaren.",
    edition: 81,
    maxEdition: 500,
    price: "8.0 ALGO"
  }
];

export default function Marketplace() {
  return (
    <div className="min-h-screen bg-[#0d0d14] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/10 pb-6 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">
              Marketplace
            </h1>
            <p className="text-[#E10600] font-bold uppercase tracking-wider mt-2 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              Buying is temporarily disabled
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {MARKET_CARDS.map((card) => (
            <div key={card.id} className="relative group">
              <TextNftCard 
                id={card.id}
                name={card.name}
                type={card.type}
                rarity={card.rarity}
                description={card.description}
                edition={card.edition}
                maxEdition={card.maxEdition}
              />
              <div className="mt-4 flex justify-between items-center bg-[#15151e] p-4 rounded-lg border border-white/5">
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Asking Price</div>
                  <div className="text-xl font-black text-white">{card.price}</div>
                </div>
                <button 
                  disabled 
                  className="bg-white/10 text-white/50 px-6 py-2 rounded font-bold uppercase tracking-wider text-sm cursor-not-allowed"
                >
                  Buy Disabled
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
