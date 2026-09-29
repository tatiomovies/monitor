import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Coffee, Info } from 'lucide-react';
import { DrinkOrder } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shift: string;
  data: DrinkOrder[];
}

export function RincianOrderModal({ isOpen, onClose, shift, data }: Props) {
  if (!isOpen) return null;

  // Calculate stats
  // We want to count each drink name and sum the quantities.
  const stats = data.reduce((acc, curr) => {
    curr.items.forEach(item => {
      const name = item.name;
      if (!acc[name]) acc[name] = 0;
      acc[name] += item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  const drinksList = [
    'Es Teh', 'Good Day', 'Coffeemix', 'White Coffee', 
    'Bengbeng', 'Nutrisari', 'Kopi Hitam', 'Kukubima', 
    'Air Es', 'Rokok'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass w-full max-w-sm relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-zinc-900/80 p-4 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Info size={20} className="text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Rincian Pesanan - {shift}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-zinc-400">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-2">
          {drinksList.map(name => {
            // Also handle lowercase match just in case
            const exactMatch = stats[name] || 0;
            const looseMatchKey = Object.keys(stats).find(k => k.toLowerCase() === name.toLowerCase());
            const qty = exactMatch || (looseMatchKey ? stats[looseMatchKey] : 0);
            
            return (
              <div key={name} className="bg-zinc-900/50 border border-white/5 px-3 py-2.5 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-emerald-400">
                    <Coffee size={14} />
                  </div>
                  <span className="font-medium text-zinc-200 text-sm">{name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Terjual</span>
                  <span className="font-mono font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded text-sm min-w-[2rem] text-center">{qty}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
