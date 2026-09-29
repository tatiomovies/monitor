import React from 'react';
import { DrinkOrder } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History } from 'lucide-react';
import { DrinkOrderTable } from './DrinkOrderTable';

interface DrinkOrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: DrinkOrder[];
}

export function DrinkOrderHistoryModal({ isOpen, onClose, orders }: DrinkOrderHistoryModalProps) {
  if (!isOpen) return null;

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
        className="relative w-full max-w-2xl glass border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-4 sm:p-6 border-b border-white/5 bg-zinc-900/50 flex justify-between items-center shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <History className="text-zinc-400" />
            History Pesanan Minuman
          </h2>
          <button onClick={onClose} className="p-2 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg text-zinc-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-800">
          <DrinkOrderTable orders={orders} />
        </div>
      </motion.div>
    </div>
  );
}
