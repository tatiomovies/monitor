import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gamepad2, Timer, Calculator, Play, CreditCard, MonitorPlay, Tv } from 'lucide-react';
import { SewaPS, TV } from '../types';
import { cn, calculateSewaPSPrice } from '../lib/utils'; // if you exported it

interface SewaPSFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<SewaPS>) => void;
  allTVs: TV[];
}

export function SewaPSForm({ isOpen, onClose, onSubmit, allTVs }: SewaPSFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [tvId, setTvId] = useState('');
  const [psType, setPsType] = useState<'PS2' | 'PS3' | 'PS4'>('PS3');
  const [paket, setPaket] = useState<'PS_ONLY' | 'PS_TV'>('PS_ONLY');
  const [durationJam, setDurationJam] = useState<12 | 24>(12);
  const [paymentStatus, setPaymentStatus] = useState<'LUNAS' | 'BELUM'>('LUNAS');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTVs = allTVs.filter(t => t.status === 'OFF' && !['10', '11', '12', '13'].includes(t.name));

  useEffect(() => {
    if (availableTVs.length > 0 && !tvId) {
      setTvId(availableTVs[0].id);
    }
  }, [availableTVs, tvId]);

  useEffect(() => {
    const tv = allTVs.find(t => t.id === tvId);
    if (tv) {
      if (['A', 'B', 'C'].includes(tv.name)) {
        setPsType('PS2');
      } else {
        setPsType('PS3');
      }
    }
  }, [tvId, allTVs]);

  // If PS2, paket = PS_ONLY unconditionally
  useEffect(() => {
    if (psType === 'PS2') {
      setPaket('PS_ONLY');
    }
  }, [psType]);

  const priceDetails = calculateSewaPSPrice(psType, paket, durationJam, Date.now(), Date.now()); // base price calculation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !customerName.trim() || !tvId) return;

    setIsSubmitting(true);
    try {
      const now = Date.now();
      const targetEndTime = now + (durationJam * 60 * 60 * 1000);
      
      const payload: Partial<SewaPS> = {
        customerName: customerName.trim(),
        tvId,
        tvName: allTVs.find(t => t.id === tvId)?.name || '',
        psType,
        paket,
        durationJam,
        startTime: now,
        endTime: null,
        targetEndTime,
        status: 'ACTIVE',
        paymentStatus,
        basePrice: priceDetails.basePrice,
        denda: 0,
        totalPrice: priceDetails.basePrice
      };

      onSubmit(payload);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCustomerName('');
    setPsType('PS3');
    setPaket('PS_ONLY');
    setDurationJam(12);
    setPaymentStatus('LUNAS');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Gamepad2 className="text-purple-500" />
              Sewa PS (Take Home)
            </h2>
            <p className="text-[10px] sm:text-xs text-zinc-400 mt-1 uppercase tracking-widest font-bold">
              Buat Penyewaan Baru
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
          
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
              Nama Pelanggan / ID
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Masukkan nama penyewa..."
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
              <Tv size={14} /> Ambil Dari TV (Stock PS)
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {allTVs.filter(t => !['10', '11', '12', '13'].includes(t.name)).map(tv => {
                const isUnavailable = tv.status !== 'OFF';
                return (
                  <button
                    key={tv.id}
                    type="button"
                    disabled={isUnavailable || isSubmitting}
                    onClick={() => setTvId(tv.id)}
                    className={cn(
                      "py-2 rounded-lg border text-xs font-bold transition-all",
                      isUnavailable 
                        ? "border-transparent bg-zinc-900/30 text-zinc-700 cursor-not-allowed"
                        : tvId === tv.id 
                          ? "border-purple-500 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                          : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700"
                    )}
                  >
                    {tv.name}
                  </button>
                );
              })}
              {allTVs.filter(t => !['10', '11', '12', '13'].includes(t.name)).every(t => t.status !== 'OFF') && (
                <div className="col-span-full py-4 text-center text-sm text-zinc-500 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  Semua TV/PS sedang digunakan
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
              <Gamepad2 size={14} /> Paket
            </label>
            <div className="flex gap-2">
              {(['PS2', 'PS3'] as const).map((type) => {
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPsType(type)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 border",
                      psType === type 
                        ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                    )}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {psType === 'PS3' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
                  <MonitorPlay size={14} /> Paket Pilihan
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaket('PS_ONLY')}
                    className={cn(
                      "flex-1 py-3 rounded-lg border font-bold transition-all",
                      paket === 'PS_ONLY' ? "border-purple-500/50 bg-purple-500/10 text-purple-400" : "border-zinc-800 bg-zinc-900/50 text-zinc-500"
                    )}
                  >
                    PS Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaket('PS_TV')}
                    className={cn(
                      "flex-1 py-3 rounded-lg border font-bold transition-all",
                      paket === 'PS_TV' ? "border-purple-500/50 bg-purple-500/10 text-purple-400" : "border-zinc-800 bg-zinc-900/50 text-zinc-500"
                    )}
                  >
                    PS + TV (+30K)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
              <Timer size={14} /> Durasi Sewa
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDurationJam(12)}
                className={cn(
                  "flex-1 py-3 rounded-lg border font-bold transition-all",
                  durationJam === 12 ? "border-purple-500/50 bg-purple-500/10 text-purple-400" : "border-zinc-800 bg-zinc-900/50 text-zinc-500"
                )}
              >
                12 Jam
              </button>
              <button
                type="button"
                onClick={() => setDurationJam(24)}
                className={cn(
                  "flex-1 py-3 rounded-lg border font-bold transition-all",
                  durationJam === 24 ? "border-purple-500/50 bg-purple-500/10 text-purple-400" : "border-zinc-800 bg-zinc-900/50 text-zinc-500"
                )}
              >
                24 Jam
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
              <CreditCard size={14} /> Pembayaran
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('LUNAS')}
                className={cn(
                  "flex-1 py-3 rounded-lg border font-bold transition-all",
                  paymentStatus === 'LUNAS' ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-zinc-800 bg-zinc-900/50 text-zinc-500"
                )}
              >
                Bayar Sekarang
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('BELUM')}
                className={cn(
                  "flex-1 py-3 rounded-lg border font-bold transition-all",
                  paymentStatus === 'BELUM' ? "border-orange-500/50 bg-orange-500/10 text-orange-400" : "border-zinc-800 bg-zinc-900/50 text-zinc-500"
                )}
              >
                Bayar Nanti
              </button>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <Calculator size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Detail Harga</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Harga Paket ({durationJam} Jam)</span>
              <span className="font-bold text-white">Rp {priceDetails.basePrice.toLocaleString('id-ID')}</span>
            </div>
            {paymentStatus === 'BELUM' && (
              <div className="text-[11px] text-orange-500 font-bold block mt-[-4px]">
                Pelanggan belum membayar
              </div>
            )}
            <div className="text-[11px] text-zinc-500 italic mt-2 border-t border-zinc-800/50 pt-2">
              * Denda overtime: Rp {psType === 'PS2' ? '2.000' : (paket === 'PS_TV' ? '5.000' : '4.000')}/Jam
            </div>
          </div>

        </form>

        <div className="p-4 sm:p-6 border-t border-zinc-800 bg-zinc-950/50 rounded-b-2xl">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !customerName.trim() || !tvId}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
          >
            <Play size={18} className="fill-current" />
            <span className="uppercase tracking-wider">Mulai Sewa</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
