import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, AlertCircle, Gamepad2, Timer, Calculator, CheckCircle2 } from 'lucide-react';
import { SewaPS } from '../types';
import { formatCurrency, calculateSewaPSPrice } from '../lib/utils';
import { finishSewaPsFirestore } from '../services/db';

interface StopSewaModalProps {
  sewa: SewaPS | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StopSewaModal({ sewa, isOpen, onClose }: StopSewaModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(() => setTick(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [isOpen]);

  if (!isOpen || !sewa) return null;

  const now = Date.now();
  const detail = calculateSewaPSPrice(sewa.psType, sewa.paket, sewa.durationJam, sewa.startTime, now);
  const extraMs = Math.max(0, now - sewa.targetEndTime);
  const extraMinutes = Math.floor(extraMs / 60000);
  const isOvertime = extraMs > 0;

  const handleStop = async () => {
    setIsSubmitting(true);
    try {
      await finishSewaPsFirestore(sewa.id, sewa.tvId, 'public_user_123', {
        endTime: now,
        denda: detail.denda,
        totalPrice: detail.total
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-zinc-950 border border-purple-500/30 rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.15)] flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Gamepad2 className="text-purple-500" />
              Sewa Selesai
            </h2>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest font-bold">
              Konfirmasi Selesai
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Penyewa</div>
              <div className="text-sm font-bold text-white mt-1">{sewa.customerName}</div>
            </div>
            <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Paket</div>
              <div className="text-sm font-bold text-white mt-1">TV {sewa.tvName} <span className="text-purple-400">•</span> {sewa.psType}</div>
            </div>
          </div>

          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
             <div className="flex justify-between items-center mb-2">
               <span className="text-xs text-zinc-400">Harga Paket ({sewa.durationJam} Jam)</span>
               <span className="text-sm font-mono text-white">{formatCurrency(detail.basePrice)}</span>
             </div>
             {isOvertime && (
               <div className="flex justify-between items-center mb-2 border-t border-zinc-800/50 pt-2">
                 <div>
                   <span className="text-xs text-red-400 block font-bold">Waktu Lebih (Overtime)</span>
                   <span className="text-[10px] text-zinc-500">
                     +{extraMinutes} Menit {detail.denda > 0 ? '(Kena Denda)' : '(Belum 1 Jam)'}
                   </span>
                 </div>
                 {detail.denda > 0 ? (
                   <span className="text-sm font-mono text-red-400 font-bold">+{formatCurrency(detail.denda)}</span>
                 ) : (
                   <span className="text-sm font-mono text-zinc-500">-</span>
                 )}
               </div>
             )}
             <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
               <span className="text-sm font-bold text-white">Total Akhir • {sewa.paymentStatus === 'BELUM' ? 'BELUM BAYAR' : 'SUDAH BAYAR'}</span>
               <span className={`text-lg font-mono font-bold ${sewa.paymentStatus === 'BELUM' ? 'text-red-500' : 'text-purple-400'}`}>
                 {formatCurrency(detail.total)}
               </span>
             </div>
          </div>

          {sewa.paymentStatus === 'BELUM' && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-400">
                Penyewa belum melakukan pembayaran (Bayar Nanti). Harap tagih sejumlah <strong className="font-mono text-xl block mt-1">{formatCurrency(detail.total)}</strong>
              </p>
            </div>
          )}

          {sewa.paymentStatus === 'LUNAS' && detail.denda > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl flex items-start gap-2">
              <AlertCircle size={16} className="text-orange-500 mt-0.5 shrink-0" />
              <p className="text-xs text-orange-400">
                Penyewa sudah bayar awal, tapi waktu over lebih dari 1 jam. Harap tagih denda (tambahan biaya) sejumlah <strong className="font-mono block mt-1">{formatCurrency(detail.denda)}</strong>
              </p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-zinc-800 bg-zinc-950/50 rounded-b-2xl">
          <button
            onClick={handleStop}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
          >
            <CheckCircle2 size={18} className="fill-current" />
            <span className="uppercase tracking-wider">Selesaikan Sewa PS</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
