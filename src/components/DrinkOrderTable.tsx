import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Coffee, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { DrinkOrder } from '../types';
import { cn, formatCurrency } from '../lib/utils';

interface DrinkOrderTableProps {
  orders: DrinkOrder[];
  onViewAll?: () => void;
  title?: string | null;
  limit?: number;
  action?: React.ReactNode;
  numberingMode?: 'asc' | 'desc';
}

function DrinkOrderTableRow({ order, idx, totalOrders, numberingMode = 'desc' }: { key?: React.Key; order: DrinkOrder; idx: number; totalOrders: number; numberingMode?: 'asc' | 'desc' }) {
  const [showDetails, setShowDetails] = useState(false);

  const hasRokok = order.items.some(item => item.name.toLowerCase().includes('rokok'));
  const hasMinuman = order.items.some(item => !item.name.toLowerCase().includes('rokok'));

  let jenisText = '';
  if (hasMinuman && hasRokok) {
    jenisText = 'Minuman & Rokok';
  } else if (hasRokok) {
    jenisText = 'Rokok';
  } else if (hasMinuman) {
    jenisText = 'Minuman';
  } else {
    jenisText = '-';
  }

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hover:bg-zinc-900/50 transition-colors group relative"
      >
        <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] text-zinc-500">{numberingMode === 'asc' ? idx + 1 : totalOrders - idx}</td>
        <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] font-mono text-zinc-400">
          {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </td>
        <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] text-center text-zinc-300">
          {jenisText}
        </td>
        <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] text-center text-zinc-400 font-mono">
          {order.items.reduce((acc, item) => acc + item.quantity, 0)} items
        </td>
        <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] text-right font-bold text-emerald-500">
          <div className="flex flex-col items-end gap-1">
            <span>{formatCurrency(order.totalPrice)}</span>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-0.5 text-[9px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-1.5 py-0.5 rounded transition-colors"
              title="Lihat rincian pesanan"
            >
              Rincian {showDetails ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          </div>
        </td>
      </motion.tr>
      {showDetails && (
        <tr className="bg-black/30">
          <td colSpan={5} className="px-4 py-2 sm:py-3 border-t border-zinc-800/50">
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-1 sm:space-y-1.5 p-2 sm:p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="flex justify-between items-center text-[10px] sm:text-xs">
                  <span className="text-zinc-500 uppercase tracking-widest font-bold">Rincian</span>
                  <button onClick={() => setShowDetails(false)} className="text-zinc-600 hover:text-zinc-400"><ChevronUp size={12} /></button>
                </div>
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-[10px] sm:text-xs text-zinc-400 mt-1">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-[10px] sm:text-xs font-bold pt-1 border-t border-zinc-800 mt-1">
                  <span className="text-zinc-300">TOTAL</span>
                  <span className="text-emerald-400">{formatCurrency(order.totalPrice)}</span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function DrinkOrderTable({ orders, onViewAll, title = "Riwayat Pesanan Minuman", limit, action, numberingMode = 'desc' }: DrinkOrderTableProps) {
  const displayOrders = limit ? orders.slice(0, limit) : orders;

  return (
    <div className="glass rounded-xl overflow-hidden flex flex-col mb-4 mt-6">
      {title !== null && (
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <Coffee size={16} className="text-blue-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">{title}</h2>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead className="bg-zinc-950 text-zinc-500 uppercase font-bold">
            <tr className="border-b border-zinc-800">
              <th className="px-2 py-2 sm:px-3 sm:py-2.5">No</th>
              <th className="px-2 py-2 sm:px-3 sm:py-2.5">Jam</th>
              <th className="px-2 py-2 sm:px-3 sm:py-2.5 text-center">Jenis</th>
              <th className="px-2 py-2 sm:px-3 sm:py-2.5 text-center">Jumlah</th>
              <th className="px-2 py-2 sm:px-3 sm:py-2.5 text-right">Harga</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {displayOrders.map((order, idx) => (
              <DrinkOrderTableRow key={order.id} order={order} idx={idx} totalOrders={orders.length} numberingMode={numberingMode} />
            ))}
            {displayOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-10 sm:px-4 text-center text-zinc-600 italic">
                  Belum ada riwayat pesanan...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {onViewAll && limit && displayOrders.length > 0 && orders.length > limit && (
        <div className="p-3 bg-zinc-900/40 border-t border-zinc-800/50 flex justify-between items-center hidden-scrollbar">
          <span className="text-xs text-zinc-400 italic">
            ({orders.length - limit}) lis pesanan lainnya
          </span>
          <button 
            onClick={onViewAll}
            className="text-[10px] flex items-center gap-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider transition-colors"
          >
            Selengkapnya <ExternalLink size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
