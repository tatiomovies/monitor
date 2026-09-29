import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { Rental } from '../types';

interface EditRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: Rental;
  onSave: (rentalId: string, updates: Partial<Rental>) => Promise<void>;
}

export function EditRentalModal({ isOpen, onClose, rental, onSave }: EditRentalModalProps) {
  const [durationMinutes, setDurationMinutes] = useState(rental.durationMinutes || 0);
  const [totalPrice, setTotalPrice] = useState(rental.totalPrice || 0);
  const [status, setStatus] = useState(rental.status);
  const [paymentStatus, setPaymentStatus] = useState(rental.paymentStatus || 'LUNAS');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDurationMinutes(rental.durationMinutes || 0);
    setTotalPrice(rental.totalPrice || 0);
    setStatus(rental.status);
    setPaymentStatus(rental.paymentStatus || 'LUNAS');
  }, [rental]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(rental.id, {
        durationMinutes,
        totalPrice,
        status,
        paymentStatus
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert("Gagal mengupdate transaksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-sm glass rounded-2xl border border-white/10 p-6 flex flex-col overflow-hidden"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white tracking-tight">Edit Transaksi</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
             <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Status</label>
             <select 
               value={status}
               onChange={e => setStatus(e.target.value as any)}
               className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500 transition-colors"
             >
               <option value="OPEN">OPEN (Sedang jalan)</option>
               <option value="FINISHED">FINISHED (Selesai)</option>
             </select>
          </div>

          <div>
             <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Durasi (Menit)</label>
             <input 
               type="number" 
               value={durationMinutes}
               onChange={e => setDurationMinutes(parseInt(e.target.value) || 0)}
               className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500 transition-colors"
             />
          </div>

          <div>
             <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Total Harga Rental</label>
             <input 
               type="number" 
               value={totalPrice}
               onChange={e => setTotalPrice(parseInt(e.target.value) || 0)}
               className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-emerald-400 outline-none focus:border-emerald-500 transition-colors"
             />
          </div>

          <div>
             <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Status Pembayaran</label>
             <select 
               value={paymentStatus}
               onChange={e => setPaymentStatus(e.target.value as any)}
               className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-blue-500 transition-colors"
             >
               <option value="LUNAS">LUNAS (Sudah Bayar)</option>
               <option value="BELUM">BELUM (Bayar Nanti)</option>
             </select>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition-colors"
          >
            {isSubmitting ? 'Menyimpan...' : (
              <>
                <Check size={18} /> Simpan Perubahan
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
