import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gamepad2, Info } from 'lucide-react';
import { Rental } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shift: string;
  data: Rental[];
}

export function RincianBillingModal({ isOpen, onClose, shift, data }: Props) {
  if (!isOpen) return null;

  // Calculate stats
  // We want PS 2, PS 3, PS 4 sesi & jam.
  const stats = data.reduce((acc, curr) => {
    const type = curr.psType; // e.g. 'PS 2', 'PS 3', 'PS 4'
    if (!acc[type]) acc[type] = { sesi: 0, menit: 0 };
    acc[type].sesi += 1;
    acc[type].menit += (curr.durationMinutes || 0);
    return acc;
  }, {} as Record<string, {sesi: number, menit: number}>);

  const psTypes = ['PS 2', 'PS 3', 'PS 4'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass w-full max-w-sm relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-zinc-900/80 p-4 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Info size={20} className="text-blue-400" />
            <h2 className="text-lg font-bold text-white">Rincian Billing - {shift}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-zinc-400">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {psTypes.map(type => {
              const stat = stats[type] || { sesi: 0, menit: 0 };
              const jam = Math.floor(stat.menit / 60);
              const sisaMenit = stat.menit % 60;
              return (
                <div key={type} className="bg-zinc-900/50 border border-white/5 p-3 rounded-lg flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20 text-blue-400">
                       <Gamepad2 size={16} />
                     </div>
                     <div>
                       <div className="font-bold text-white">{type}</div>
                       <div className="text-xs text-zinc-500">{stat.sesi} Sesi</div>
                     </div>
                   </div>
                   <div className="text-right">
                     <span className="font-mono text-zinc-300 text-sm">{jam}j {sisaMenit}m</span>
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
