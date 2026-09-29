import React, { useState } from 'react';
import { Drink } from '../types';
import { motion } from 'framer-motion';
import { X, Save, Settings } from 'lucide-react';

interface StockManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  drinks: Drink[];
  onUpdateDrinks: (drinks: Drink[]) => void;
}

export function StockManagerModal({ isOpen, onClose, drinks, onUpdateDrinks }: StockManagerModalProps) {
  const [localDrinks, setLocalDrinks] = useState<Drink[]>(drinks);

  if (!isOpen) return null;

  const handleChange = (id: string, field: keyof Drink, value: string) => {
    const numValue = parseInt(value) || 0;
    setLocalDrinks(prev => prev.map(d => d.id === id ? { ...d, [field]: numValue } : d));
  };

  const handleSave = () => {
    onUpdateDrinks(localDrinks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-xl glass border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-4 sm:p-6 border-b border-white/5 bg-zinc-900/50 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Settings className="text-zinc-400" />
            Set Ketersediaan Minuman
          </h2>
          <button onClick={onClose} className="p-2 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg text-zinc-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="space-y-3">
            {localDrinks.map(drink => (
              <div key={drink.id} className="grid grid-cols-12 gap-3 items-center p-3 sm:p-4 rounded-xl bg-black/40 border border-white/5">
                <div className="col-span-12 sm:col-span-6">
                  <h4 className="font-bold text-white text-sm">{drink.name}</h4>
                  <p className="text-xs text-zinc-500">Harga: Rp {drink.price}</p>
                </div>
                
                <div className="col-span-12 sm:col-span-6">
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Stok Awal (Disediakan)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="0"
                      value={drink.initialStock}
                      onChange={(e) => handleChange(drink.id, 'initialStock', e.target.value)}
                      className="w-full bg-zinc-900/80 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <div className="text-white text-sm bg-zinc-800 px-3 py-2 rounded-lg whitespace-nowrap" title="Sisa Stok Saat Ini">
                      <span className="text-zinc-500 mr-1 hidden sm:inline">Sisa:</span>
                      <span className={drink.currentStock <= 5 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>{drink.currentStock}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 sm:p-6 border-t border-white/5 bg-zinc-900/80">
          <button
            onClick={handleSave}
            className="w-full py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm sm:text-base font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Save size={18} />
            SIMPAN PENGATURAN
          </button>
        </div>
      </motion.div>
    </div>
  );
}
