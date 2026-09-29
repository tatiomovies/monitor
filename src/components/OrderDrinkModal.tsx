import React, { useState } from 'react';
import { Drink, DrinkOrder, TV } from '../types';
import { motion } from 'framer-motion';
import { X, Plus, Minus, ShoppingCart, Tv } from 'lucide-react';

interface OrderDrinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  drinks: Drink[];
  activeTVs?: TV[];
  onOrder: (order: Omit<DrinkOrder, 'id' | 'timestamp'>) => void;
}

export function OrderDrinkModal({ isOpen, onClose, drinks, activeTVs = [], onOrder }: OrderDrinkModalProps) {
  const [orderQty, setOrderQty] = useState<Record<string, number>>({});
  const [selectedTvName, setSelectedTvName] = useState<string>('');

  if (!isOpen) return null;

  const handlePlus = (id: string, max: number) => {
    const current = orderQty[id] || 0;
    if (current < max) {
      setOrderQty(prev => ({ ...prev, [id]: current + 1 }));
    }
  };

  const handleMinus = (id: string) => {
    const current = orderQty[id] || 0;
    if (current > 0) {
      setOrderQty(prev => ({ ...prev, [id]: current - 1 }));
    }
  };

  const totalItemCount = Object.values(orderQty).reduce((a: number, b: any) => a + (b as number), 0);
  
  const totalPrice = Object.entries(orderQty).reduce((acc: number, [id, qty]: [string, any]) => {
    const drink = drinks.find(d => d.id === id);
    return acc + (drink ? drink.price * (qty as number) : 0);
  }, 0);

  const handleSubmit = () => {
    if (totalItemCount === 0) return;
    
    const items = Object.entries(orderQty)
      .filter(([id, qty]: [string, any]) => (qty as number) > 0)
      .map(([id, qty]: [string, any]) => {
        const drink = drinks.find(d => d.id === id)!;
        return {
          drinkId: id,
          name: drink.name,
          quantity: qty as number,
          price: drink.price
        };
      });

    const orderPayload: Omit<DrinkOrder, 'id' | 'timestamp'> = { 
      items, 
      totalPrice,
    };
    if (selectedTvName) {
      orderPayload.tvName = selectedTvName;
    }
    onOrder(orderPayload);
    setOrderQty({});
    setSelectedTvName('');
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
        className="relative w-full max-w-md glass border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-4 sm:p-6 border-b border-white/5 bg-zinc-900/50 flex justify-between items-center shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-blue-500" />
            Order Minuman
          </h2>
          <button onClick={onClose} className="p-2 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg text-zinc-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
          {activeTVs && activeTVs.length > 0 && (
            <div className="space-y-2 pb-2 border-b border-white/5">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
                <Tv size={14} /> Pilih TV Pemesan (Opsional)
              </label>
              <select
                value={selectedTvName}
                onChange={(e) => setSelectedTvName(e.target.value)}
                className="w-full bg-zinc-900/80 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="">Bukan dari TV / Umum</option>
                {activeTVs.map(tv => (
                  <option key={tv.id} value={tv.name}>
                    TV {tv.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">
              Daftar Minuman
            </label>
            {drinks.map(drink => {
              const qty = orderQty[drink.id] || 0;
              return (
                <div key={drink.id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base">{drink.name}</h4>
                    <p className="text-xs text-zinc-500">
                      Sisa stok: <span className="text-zinc-300 font-mono">{drink.currentStock}</span> 
                      <span className="mx-2 text-zinc-700">•</span>
                      Rp {drink.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleMinus(drink.id)}
                      disabled={qty === 0}
                      className="p-1.5 sm:p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-bold text-white w-4 text-center">{qty}</span>
                    <button 
                      onClick={() => handlePlus(drink.id, drink.currentStock)}
                      disabled={qty >= drink.currentStock}
                      className="p-1.5 sm:p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-500 rounded-lg transition-colors border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="p-4 sm:p-6 border-t border-white/5 bg-zinc-900/80 shrink-0 mt-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Total Bayar</span>
            <span className="text-xl font-bold text-emerald-400">Rp {totalPrice.toLocaleString('id-ID')}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={totalItemCount === 0}
            className="w-full py-3.5 sm:py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-sm sm:text-base font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:shadow-none shadow-lg shadow-blue-500/20"
          >
            ORDER SEKARANG
          </button>
        </div>
      </motion.div>
    </div>
  );
}
