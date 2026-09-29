import React, { useState, useEffect } from 'react';
import { SewaPS } from '../types';
import { formatCurrency, calculateSewaPSPrice } from '../lib/utils';
import { Check, Gamepad2 } from 'lucide-react';
import { finishSewaPsFirestore, updateSewaPsFirestore } from '../services/db';

interface SewaPSTableProps {
  sewaList: SewaPS[];
  title?: string;
  onStop?: (sewa: SewaPS) => void;
}

export function SewaPSTable({ sewaList, title, onStop }: SewaPSTableProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSelesai = async (sewa: SewaPS) => {
    if (onStop) {
      onStop(sewa);
      return;
    }
    const now = Date.now();
    const detail = calculateSewaPSPrice(sewa.psType, sewa.paket, sewa.durationJam, sewa.startTime, now);
    await finishSewaPsFirestore(sewa.id, sewa.tvId, 'public_user_123', {
      endTime: now,
      denda: detail.denda,
      totalPrice: detail.total
    });
  };

  const handleBayar = async (sewa: SewaPS) => {
    if (confirm(`Lunasi pembayaran untuk ${sewa.customerName}?`)) {
      await updateSewaPsFirestore(sewa.id, 'public_user_123', {
        paymentStatus: 'LUNAS'
      });
    }
  };

  return (
    <div className="glass rounded-xl overflow-hidden flex flex-col">
      {title && (
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
          <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Gamepad2 size={16} className="text-zinc-500" />
            {title}
          </h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead className="bg-purple-950/20 text-purple-400 uppercase font-bold text-[10px] tracking-wider border-b border-purple-500/20">
            <tr>
              <th className="px-3 py-3">Penyewa</th>
              <th className="px-3 py-3">Paket</th>
              <th className="px-3 py-3">Waktu</th>
              <th className="px-3 py-3">Durasi</th>
              <th className="px-3 py-3 text-right">Target Selesai</th>
              <th className="px-3 py-3 text-right">Pembayaran</th>
              <th className="px-3 py-3 text-right">Harga</th>
              <th className="px-3 py-3 text-center">Status</th>
              <th className="px-3 py-3 w-20 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 block-rows">
            {sewaList.map(sewa => {
              const liveDetail = sewa.status === 'ACTIVE' 
                ? calculateSewaPSPrice(sewa.psType, sewa.paket, sewa.durationJam, sewa.startTime, Date.now())
                : { basePrice: sewa.basePrice, denda: sewa.denda, total: sewa.totalPrice };
                
              const targetDate = new Date(sewa.targetEndTime);
              const targetStr = `${targetDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} ${targetDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}`;
              const startStr = new Date(sewa.startTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'});
              
              const isOvertime = sewa.status === 'ACTIVE' && Date.now() > sewa.targetEndTime;
              let overtimeStr = '';
              if (isOvertime) {
                 const absRemaining = Math.abs(sewa.targetEndTime - Date.now());
                 const h = Math.floor(absRemaining / 3600000);
                 const m = Math.floor((absRemaining % 3600000) / 60000);
                 overtimeStr = `- ${h.toString().padStart(2, '0')}j ${m.toString().padStart(2, '0')}m`;
              }

              return (
                <tr key={sewa.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-3 py-3">
                    <span className="font-medium text-zinc-300 block">{sewa.customerName}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400">TV: {sewa.tvName}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-bold text-white block">{sewa.psType}</span>
                    <span className="text-[10px] text-zinc-500">{sewa.paket === 'PS_TV' ? '+ TV' : 'Only'}</span>
                  </td>
                  <td className="px-3 py-3 text-zinc-400 font-mono">
                    {startStr}
                  </td>
                  <td className="px-3 py-3 text-zinc-400 font-mono">
                    {sewa.durationJam} Jam
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={`font-mono ${isOvertime ? 'text-red-400 font-bold' : 'text-zinc-400'}`}>
                      {targetStr}
                    </span>
                    {isOvertime && <span className="block text-[10px] text-red-500 font-bold tracking-widest mt-1 animate-pulse">{overtimeStr}</span>}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {sewa.paymentStatus === 'LUNAS' ? (
                      <span className="px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase bg-green-500/10 text-green-400 border border-green-500/20">
                        LUNAS
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleBayar(sewa)}
                        className="px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
                        title="Klik untuk melunasi"
                      >
                        NGUTANG
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-mono">
                    <span className="font-bold text-white block">{formatCurrency(liveDetail.total)}</span>
                    {liveDetail.denda > 0 && (
                      <span className="text-red-400 text-[10px]">Denda: {formatCurrency(liveDetail.denda)}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-[9px] uppercase font-bold tracking-widest border ${
                      sewa.status === 'FINISHED' 
                        ? 'bg-zinc-800/50 text-zinc-400 border-zinc-700' 
                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                    }`}>
                      {sewa.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {sewa.status === 'ACTIVE' && (
                      <button 
                        onClick={() => handleSelesai(sewa)}
                        className="p-1.5 sm:p-2 bg-zinc-800 hover:bg-green-600/20 hover:text-green-400 text-zinc-400 rounded-lg transition-colors ml-auto flex items-center justify-center border border-zinc-700 hover:border-green-500/50"
                        title="Selesaikan"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
