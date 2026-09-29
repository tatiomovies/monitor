import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Tv, Gamepad2, Timer, Smartphone, Calculator, Plus, Play, Clock, Coffee, Minus } from 'lucide-react';
import { TV, Rental, Drink } from '../types';
import { cn, calculateRentalPrice } from '../lib/utils';

interface RentalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Rental>, drinkOrder?: { items: { drinkId: string; name: string; quantity: number; price: number }[], totalPrice: number }) => void;
  selectedTV?: TV | null;
  allTVs: TV[];
  drinks: Drink[];
}

export function RentalForm({ isOpen, onClose, onSubmit, selectedTV, allTVs, drinks }: RentalFormProps) {
  const [tvId, setTvId] = useState('');
  const [psType, setPsType] = useState<'PS2' | 'PS3' | 'PS4'>('PS3');
  const [isHourly, setIsHourly] = useState(true);
  const [duration, setDuration] = useState(60); // minutes
  const [pricePerHour, setPricePerHour] = useState(5000);
  const [customPrice, setCustomPrice] = useState(false);
  const [orderQty, setOrderQty] = useState<Record<string, number>>({});
  const [showDrinks, setShowDrinks] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'LUNAS' | 'BELUM'>('LUNAS');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedTV) {
      setTvId(selectedTV.id);
    } else if (allTVs.length > 0 && !tvId) {
      const firstAvailable = allTVs.find(t => t.status === 'OFF');
      if (firstAvailable) setTvId(firstAvailable.id);
    }
  }, [selectedTV, allTVs, tvId]);

  useEffect(() => {
    const tv = allTVs.find(t => t.id === tvId);
    if (tv) {
      const tvName = tv.name;
      // TV A, B, C
      if (['A', 'B', 'C'].includes(tvName)) {
        setPsType('PS2'); // select ke PS2 by default
      }
      // TV 10-13 = PS4
      else if (['10', '11', '12', '13'].includes(tvName)) {
        setPsType('PS4');
      }
      // Everything else = PS3
      else {
        setPsType('PS3');
      }
    }
  }, [tvId]);

  useEffect(() => {
    // Default prices
    if (!customPrice) {
      switch (psType) {
        case 'PS2': setPricePerHour(3000); break;
        case 'PS3': setPricePerHour(4000); break;
        case 'PS4': setPricePerHour(6000); break;
      }
    }
  }, [psType, customPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !tvId) return;

    setIsSubmitting(true);
    const startTime = Date.now();
    const endTime = isHourly ? startTime + duration * 60 * 1000 : null;
    const totalPrice = isHourly ? calculateRentalPrice(duration, psType) : 0;

    const orderedItems = Object.entries(orderQty)
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

    const drinksPrice = orderedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const drinkOrder = orderedItems.length > 0 ? { items: orderedItems, totalPrice: drinksPrice } : undefined;

    try {
      const payload: Partial<Rental> = {
        tvId,
        tvName: allTVs.find(t => t.id === tvId)?.name || '',
        psType,
        startTime,
        endTime,
        durationMinutes: isHourly ? duration : 0,
        isHourly,
        status: isHourly ? 'ACTIVE' : 'OPEN',
        pricePerHour,
        totalPrice,
        rounding: 0,
        paymentStatus,
      };

      if (orderedItems.length > 0) {
        payload.orderedDrinks = orderedItems;
        payload.drinksPrice = drinksPrice;
      }

      await onSubmit(payload, drinkOrder);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass w-full max-w-md shadow-2xl border-white/10 flex flex-col max-h-[90vh]"
      >
        <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <Plus className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold tracking-tight">New Rental</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">

          {/* TV Selection */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
              <Tv size={14} /> Pilih TV Unit
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {allTVs.map((tv) => {
                const isUnavailable = tv.status !== 'OFF';
                return (
                  <button
                    key={tv.id}
                    type="button"
                    onClick={() => {
                      if (!isUnavailable) setTvId(tv.id);
                    }}
                    disabled={isUnavailable}
                    className={cn(
                      "py-2 rounded-lg border text-xs font-bold transition-all",
                      isUnavailable 
                        ? "border-transparent bg-zinc-900/30 text-zinc-700 cursor-not-allowed"
                        : tvId === tv.id 
                          ? "border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                          : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-800"
                    )}
                  >
                    {tv.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PS Type */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
              <Gamepad2 size={14} /> Tipe Console
            </label>
            <div className="flex gap-2">
              {(['PS2', 'PS3', 'PS4'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPsType(type)}
                  className={cn(
                    "flex-1 py-3 rounded-lg border font-bold transition-all",
                    psType === type 
                      ? "border-white/20 bg-white/10 text-white" 
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
              <Timer size={14} /> Mode Billing
            </label>
            <div className="flex gap-2 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setIsHourly(true)}
                className={cn(
                  "flex-1 py-2 rounded-md text-xs font-bold transition-all",
                  isHourly ? "bg-zinc-800 text-blue-400 shadow-sm" : "text-zinc-600"
                )}
              >
                PER JAM
              </button>
              <button
                type="button"
                onClick={() => setIsHourly(false)}
                className={cn(
                  "flex-1 py-2 rounded-md text-xs font-bold transition-all",
                  !isHourly ? "bg-zinc-800 text-emerald-400 shadow-sm" : "text-zinc-600"
                )}
              >
                OPEN
              </button>
            </div>
          </div>

          {/* Duration */}
          <AnimatePresence mode="wait">
            {isHourly && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
                    <Clock size={14} /> Durasi
                  </label>
                  <span className="font-mono text-xs font-bold text-blue-400">
                    {Math.floor(duration / 60)}j {duration % 60}m
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="600"
                  step="30"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drink Orders */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
                <Coffee size={14} /> Pesan Minuman (Opsional)
              </label>
              <button
                type="button"
                onClick={() => setShowDrinks(!showDrinks)}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold"
              >
                {showDrinks ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            
            <AnimatePresence>
              {showDrinks && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800"
                >
                  {drinks.map(drink => {
                    const qty = orderQty[drink.id] || 0;
                    return (
                      <div key={drink.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-zinc-900/50 border border-white/5 gap-2">
                        <div>
                          <h4 className="font-bold text-white text-xs">{drink.name}</h4>
                          <p className="text-[10px] text-zinc-500">
                            Sisa: {drink.currentStock} • Rp {drink.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => handleMinus(drink.id)}
                            disabled={qty === 0}
                            className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-bold text-white w-4 text-center text-xs">{qty}</span>
                          <button 
                            type="button"
                            onClick={() => handlePlus(drink.id, drink.currentStock)}
                            disabled={qty >= drink.currentStock}
                            className="p-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Payment Status */}
          <div className="space-y-3 pt-2 mb-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
              <Calculator size={14} /> Pembayaran
            </label>
            <div className="flex gap-2 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setPaymentStatus('LUNAS')}
                className={cn(
                  "flex-1 py-3 rounded-lg border font-bold transition-all text-xs",
                  paymentStatus === 'LUNAS' ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800"
                )}
              >
                BAYAR SEKARANG
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('BELUM')}
                className={cn(
                  "flex-1 py-3 rounded-lg border font-bold transition-all text-xs",
                  paymentStatus === 'BELUM' ? "border-orange-500/50 bg-orange-500/10 text-orange-400" : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800"
                )}
              >
                BAYAR NANTI
              </button>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                 <span className="text-zinc-400">Total Harga {isHourly ? '(Perkiraan)' : '(Running)'}</span>
                 <span className={`font-bold font-mono text-lg ${paymentStatus === 'BELUM' ? 'text-red-500' : 'text-blue-400'}`}>
                    Rp {(isHourly ? calculateRentalPrice(duration, psType) : 0).toLocaleString('id-ID')}
                 </span>
              </div>
              {paymentStatus === 'BELUM' && (
                 <div className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1">
                   * Pelanggan belum membayar (Bayar Nanti)
                 </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 shrink-0 mt-4">
            <button
              type="submit"
              disabled={!tvId || isSubmitting}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2",
                !tvId || isSubmitting
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : isHourly 
                    ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500" 
                    : "bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-500"
              )}
            >
              {isSubmitting ? (
                "MENYIMPAN..."
              ) : (
                <>MULAI RENTAL <Play size={14} fill="currentColor" /></>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
