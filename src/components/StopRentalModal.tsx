import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { TV, Rental } from '../types';
import { finishRentalFirestore } from '../services/db';
import { calculateRentalPrice, getBilledDurationMinutes } from '../lib/utils';

interface StopRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  tv: TV | null;
  rental: Rental | undefined;
}

export function StopRentalModal({ isOpen, onClose, tv, rental }: StopRentalModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen || !tv || !rental) return null;

  let currentDurationMins = rental.durationMinutes;
  if (rental.status === 'OPEN') {
    const durationMs = Date.now() - rental.startTime;
    currentDurationMins = Math.ceil(durationMs / 60000);
  }
  const hours = Math.floor(currentDurationMins / 60);
  const minutes = currentDurationMins % 60;
  const durationText = `${hours} jam ${minutes} menit`;

  const psPrice = rental.status === 'OPEN' ? calculateRentalPrice(currentDurationMins, rental.psType) : rental.totalPrice;
  const drinksPrice = rental.drinksPrice || 0;
  const isPsBelum = rental.paymentStatus === 'BELUM';
  const isDrinksBelum = rental.drinksPaymentStatus === 'BELUM' || (drinksPrice > 0 && !rental.drinksPaymentStatus);

  const psColor = isPsBelum ? 'text-red-500' : (rental.isHourly ? 'text-blue-400' : 'text-emerald-400');
  const psBg = isPsBelum ? 'bg-red-500/10 border-red-500/20' : (rental.isHourly ? 'bg-blue-500/10 border-blue-500/20' : 'bg-emerald-500/10 border-emerald-500/20');
  
  const handleStop = async () => {
    const now = Date.now();
    let durationMins = rental.durationMinutes;
    let totalPrice = rental.totalPrice || 0;

    if (rental.status === 'OPEN') {
      const durationMs = now - rental.startTime;
      durationMins = Math.ceil(durationMs / 60000);
      totalPrice = calculateRentalPrice(durationMins, rental.psType);
    }

    setIsSubmitting(true);
    // Close immediately as requested
    onClose();
    try {
      const billingDurationMins = rental.status === 'OPEN' ? getBilledDurationMinutes(durationMins) : durationMins;
      const finalPrice = rental.status === 'OPEN' ? calculateRentalPrice(durationMins, rental.psType) : totalPrice;

      await finishRentalFirestore(rental.id, tv.id, { 
        endTime: now, 
        durationMinutes: billingDurationMins, 
        totalPrice: finalPrice 
      });
    } catch (error) {
      console.error("Failed to stop rental:", error);
      alert("Gagal menghentikan rental. Periksa koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-rose-500" />
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white tracking-tight">Konfirmasi Selesai</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="text-zinc-400 text-sm mb-8 text-center leading-relaxed">
          <p className="mb-2">Apakah Anda yakin ingin menyelesaikan sesi rental untuk <strong className="text-white">TV {tv.name}</strong> sekarang?</p>
          <div className="flex flex-col gap-2 mt-4">
            <p className="text-blue-400 font-medium bg-blue-500/10 py-2 rounded-lg border border-blue-500/20">Durasi: {durationText}</p>
            <div className={`font-bold py-3 px-4 rounded-lg border flex justify-between items-center ${psBg}`}>
               <span className="text-xs uppercase block">PS {isPsBelum ? '(BELUM BAYAR)' : '(LUNAS)'}</span>
               <span className={`text-lg ${psColor}`}>Rp {psPrice.toLocaleString('id-ID')}</span>
            </div>
            {drinksPrice > 0 && (
              <div className={`font-bold py-3 px-4 rounded-lg border flex justify-between items-center ${isDrinksBelum ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                 <span className="text-xs text-zinc-500 uppercase block">Minuman {isDrinksBelum ? '(BELUM BAYAR)' : '(LUNAS)'}</span>
                 <span className={`text-lg ${isDrinksBelum ? 'text-red-500' : 'text-emerald-500'}`}>Rp {drinksPrice.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className={`font-bold mt-2 py-3 px-4 rounded-lg border border-zinc-800 bg-zinc-900 flex justify-between items-center`}>
                 <span className="text-xs text-zinc-400 uppercase block">Total Semua</span>
                 <span className="text-xl text-white">Rp {(psPrice + drinksPrice).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleStop}
            disabled={isSubmitting}
            className="flex-1 py-3 text-sm font-bold rounded-xl border border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50"
          >
            {isSubmitting ? "Memproses..." : "Rental Selesai"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
