import React from 'react';
import { motion } from 'framer-motion';

export interface TextNftCardProps {
  id: string;
  name: string;
  type: string;
  rarity: 'Common' | 'Rare' | 'Legendary' | 'Epic';
  description: string;
  edition: number;
  maxEdition?: number;
  onBurn?: (id: string) => void;
  onList?: (id: string) => void;
}

export default function TextNftCard({
  id,
  name,
  type,
  rarity,
  description,
  edition,
  maxEdition = 1000,
  onBurn,
  onList
}: TextNftCardProps) {
  // Determine gradient color class based on rarity
  const getGradientClass = (rarityLevel: string) => {
    switch (rarityLevel) {
      case 'Legendary': return 'halftone-gold';
      case 'Epic': return 'halftone-purple';
      case 'Rare': return 'halftone-teal';
      case 'Common': return 'halftone-blue';
      default: return 'halftone-blue';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative w-full h-80 rounded-2xl overflow-hidden flex flex-col p-6 shadow-2xl ${getGradientClass(rarity)}`}
    >
      {/* Top section: Rarity Badge and Edition */}
      <div className="flex justify-between items-start z-10">
        <span className="bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border border-white/10">
          {rarity}
        </span>
        <span className="text-white/80 font-mono text-sm bg-black/20 px-2 py-1 rounded">
          #{edition}/{maxEdition}
        </span>
      </div>

      {/* Main Content (Center) */}
      <div className="flex-1 flex flex-col justify-center z-10 mt-4">
        <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-md">
          {name}
        </h3>
        <p className="text-white/90 font-bold uppercase tracking-widest mt-2 text-sm drop-shadow-md">
          {type}
        </p>
      </div>

      {/* Bottom section: Description and Actions */}
      <div className="z-10 mt-auto">
        <p className="text-white/80 text-sm leading-snug line-clamp-2 mb-4 bg-black/20 p-2 rounded backdrop-blur-sm border border-white/5">
          {description}
        </p>
        
        {(onBurn || onList) && (
          <div className="flex gap-2">
            {onList && (
              <button 
                onClick={() => onList(id)}
                className="flex-1 bg-white text-black py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors"
              >
                List
              </button>
            )}
            {onBurn && (
              <button 
                onClick={() => onBurn(id)}
                className="flex-1 bg-red-600/80 text-white border border-red-400 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-colors backdrop-blur-md"
              >
                Burn
              </button>
            )}
          </div>
        )}
      </div>

      {/* Aesthetic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-0"></div>
    </motion.div>
  );
}
