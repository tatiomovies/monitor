import React, { useState } from 'react';
import { motion } from 'motion/react';
import { History, CheckCircle, Clock, Play, ChevronDown, ChevronUp, Trash2, Edit2 } from 'lucide-react';
import { Rental } from '../types';
import { cn, formatCurrency, calculateRentalPrice } from '../lib/utils';

interface RentalTableProps {
  rentals: Rental[];
  totalRentalsOverride?: number;
  title?: string | null;
  action?: React.ReactNode;
  onDelete?: (id: string) => void;
  onEdit?: (rental: Rental) => void;
  onPayDrinks?: (rentalId: string) => void;
  numberingMode?: 'asc' | 'desc';
}

function RentalTableRow({ rental, idx, getStatusBadge, totalRentals, onDelete, onEdit, onPayDrinks, numberingMode = 'desc' }: { key?: React.Key; rental: Rental; idx: number; getStatusBadge: (status: Rental['status']) => React.ReactNode; totalRentals: number; onDelete?: (id: string) => void; onEdit?: (rental: Rental) => void; onPayDrinks?: (rentalId: string) => void; numberingMode?: 'asc' | 'desc' }) {
  const [showDetails, setShowDetails] = useState(false);
  const [liveDuration, setLiveDuration] = useState(rental.durationMinutes || 0);
  const [livePrice, setLivePrice] = useState(rental.totalPrice || 0);
  
  const hasExtras = rental.orderedDrinks && rental.orderedDrinks.length > 0;

  React.useEffect(() => {
    if (rental.status !== 'FINISHED' && rental.status === 'OPEN') {
      const interval = setInterval(() => {
        const now = Date.now();
        const durationMs = now - rental.startTime;
        const durationMins = Math.ceil(durationMs / 60000);
        setLiveDuration(durationMins);
        
        setLivePrice(calculateRentalPrice(durationMins, rental.psType));
      }, 10000);
      
      // Calculate immediate initial
      const now = Date.now();
      const durationMs = now - rental.startTime;
      const durationMins = Math.ceil(durationMs / 60000);
      setLiveDuration(durationMins);
      setLivePrice(calculateRentalPrice(durationMins, rental.psType));

      return () => clearInterval(interval);
    } else if (rental.status !== 'FINISHED' && rental.isHourly) {
      // For active/hourly, just update the live duration up to expected
      const interval = setInterval(() => {
        const now = Date.now();
        const durationMs = now - rental.startTime;
        setLiveDuration(Math.min(rental.durationMinutes, Math.ceil(durationMs / 60000)));
      }, 10000);
      
      const now = Date.now();
      const durationMs = now - rental.startTime;
      setLiveDuration(Math.min(rental.durationMinutes, Math.ceil(durationMs / 60000)));
      setLivePrice(rental.totalPrice || 0);

      return () => clearInterval(interval);
    } else {
      setLiveDuration(rental.durationMinutes || 0);
      setLivePrice(rental.totalPrice || 0);
    }
  }, [rental]);

  const displayPrice = livePrice || rental.totalPrice || 0;
  const displayDuration = liveDuration || rental.durationMinutes || 0;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "hover:bg-zinc-900/50 transition-colors group relative",
          rental.status === 'FINISHED' && "bg-zinc-900/20 opacity-60"
        )}
      >
        <td className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-[11px] text-zinc-500">{numberingMode === 'asc' ? idx + 1 : totalRentals - idx}</td>
        <td className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-[11px]">
          <span className="font-bold text-zinc-300 block">TV {rental.tvName}</span>
          <span className="text-[9px] text-zinc-500 font-bold">{rental.psType}</span>
        </td>
        <td className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-[11px] font-mono text-zinc-400">
          {new Date(rental.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </td>
        <td className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-[11px] font-mono text-zinc-400">
          {rental.endTime ? new Date(rental.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
        </td>
        <td className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-[11px] text-right text-zinc-400">
          {displayDuration}m
        </td>
        <td className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-[11px] text-right font-bold">
          <div className="flex flex-col items-end gap-1">
            <span className={rental.paymentStatus === 'BELUM' ? 'text-red-500' : 'text-emerald-500'}>
              {formatCurrency(displayPrice)}
            </span>
            {rental.paymentStatus === 'BELUM' && (
              <span className="text-[8px] bg-red-500/10 text-red-500 px-1 py-0.5 rounded border border-red-500/20 uppercase tracking-widest whitespace-nowrap">
                Belum Bayar PS
              </span>
            )}

            {hasExtras && (
              <>
                <span className={rental.drinksPaymentStatus === 'BELUM' || !rental.drinksPaymentStatus ? 'text-red-500' : 'text-emerald-500'}>
                  + {formatCurrency(rental.drinksPrice || 0)}
                </span>
                {(rental.drinksPaymentStatus === 'BELUM' || !rental.drinksPaymentStatus) && (
                  <span className="text-[8px] bg-red-500/10 text-red-500 px-1 py-0.5 rounded border border-red-500/20 uppercase tracking-widest whitespace-nowrap">
                    Belum Bayar Minum
                  </span>
                )}
              </>
            )}

            {hasExtras && (
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-0.5 text-[9px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-1.5 py-0.5 rounded transition-colors"
                title="Lihat rincian pembayaran"
              >
                Rincian {showDetails ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
            )}
          </div>
        </td>
        <td className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-[11px] text-right">
          <div className="flex items-center justify-end gap-2">
            {getStatusBadge(rental.status)}
            {(onDelete || onEdit) && (
              <div className="flex items-center gap-1 border-l border-zinc-800 pl-2 ml-1">
                {onEdit && (
                  <button onClick={() => onEdit(rental)} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-blue-400 transition-colors" title="Edit Transaksi">
                    <Edit2 size={12} />
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(rental.id)} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400 transition-colors" title="Hapus Transaksi">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        </td>
      </motion.tr>
      {hasExtras && showDetails && (
        <tr className="bg-black/30">
          <td colSpan={8} className="px-4 py-2 sm:py-3 border-t border-zinc-800/50">
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-1 sm:space-y-1.5 p-2 sm:p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="flex justify-between items-center text-[10px] sm:text-xs">
                  <span className="text-zinc-500 uppercase tracking-widest font-bold">Rincian</span>
                  <button onClick={() => setShowDetails(false)} className="text-zinc-600 hover:text-zinc-400"><ChevronUp size={12} /></button>
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs text-zinc-400 mt-1">
                  <span>{rental.psType} ({Math.floor(displayDuration / 60)}j {displayDuration % 60}m)</span>
                  <span className={rental.paymentStatus === 'BELUM' ? 'text-red-400' : 'text-emerald-400'}>{formatCurrency(displayPrice)}</span>
                </div>
                {rental.orderedDrinks?.map((drink, i) => (
                  <div key={i} className="flex justify-between text-[10px] sm:text-xs text-zinc-400">
                    <span>{drink.name} x{drink.quantity}</span>
                    <span className={rental.drinksPaymentStatus === 'BELUM' || !rental.drinksPaymentStatus ? 'text-red-400' : 'text-emerald-400'}>{formatCurrency(drink.price * drink.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-[10px] sm:text-xs font-bold pt-1 border-t border-zinc-800 mt-1">
                  <span className="text-zinc-300">TOTAL SEMUA</span>
                  <span className="text-white">{formatCurrency(displayPrice + (rental.drinksPrice || 0))}</span>
                </div>
                {hasExtras && (rental.drinksPaymentStatus === 'BELUM' || !rental.drinksPaymentStatus) && onPayDrinks && (
                  <button 
                    onClick={() => onPayDrinks(rental.id)}
                    className="w-full mt-2 py-1.5 text-[10px] bg-green-500/20 text-green-400 rounded border border-green-500/30 uppercase tracking-widest font-bold hover:bg-green-500/30 transition-colors"
                  >
                    PESANAN SUDAH LUNAS
                  </button>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function RentalTable({ rentals, totalRentalsOverride, title = "Riwayat Billing", action, onDelete, onEdit, numberingMode = 'desc' }: RentalTableProps) {
  const getStatusBadge = (status: Rental['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="text-blue-500 font-bold">ACTIVE</span>;
      case 'WARNING':
        return <span className="text-red-500 font-bold">WARNING</span>;
      case 'OPEN':
        return <span className="text-emerald-500 font-bold">OPEN</span>;
      case 'FINISHED':
        return <span className="text-zinc-500 uppercase">FINISHED</span>;
      default:
        return null;
    }
  };

  return (
    <div className="glass rounded-xl overflow-hidden flex flex-col">
      {title !== null && (
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <History size={16} className="text-blue-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">{title}</h2>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead className="bg-zinc-950 text-zinc-500 uppercase font-bold">
            <tr className="border-b border-zinc-800">
              <th className="px-2 py-3 sm:px-4 sm:py-3">No</th>
              <th className="px-2 py-3 sm:px-4 sm:py-3">TV & Console</th>
              <th className="px-2 py-3 sm:px-4 sm:py-3">Mulai</th>
              <th className="px-2 py-3 sm:px-4 sm:py-3">Selesai</th>
              <th className="px-2 py-3 sm:px-4 sm:py-3 text-right">Durasi</th>
              <th className="px-2 py-3 sm:px-4 sm:py-3 text-right">Harga</th>
              <th className="px-2 py-3 sm:px-4 sm:py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {rentals.map((rental, idx) => (
              <RentalTableRow key={rental.id} rental={rental} idx={idx} totalRentals={totalRentalsOverride || rentals.length} getStatusBadge={getStatusBadge} onDelete={onDelete} onEdit={onEdit} numberingMode={numberingMode} />
            ))}
            {rentals.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-10 sm:px-4 text-center text-zinc-600 italic">
                  Belum ada data rental...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
