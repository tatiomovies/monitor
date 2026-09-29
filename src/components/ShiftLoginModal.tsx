import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, LogIn } from 'lucide-react';

interface Props {
  isOpen: boolean;
  shiftName: string;
  onLogin: (operator: string) => void;
}

const OPERATORS = ['BAGAS', 'WAWAN', 'ARKAN'];

export function ShiftLoginModal({ isOpen, shiftName, onLogin }: Props) {
  const [selectedOperator, setSelectedOperator] = useState<string>('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass w-full max-w-sm relative z-10 overflow-hidden flex flex-col rounded-3xl"
      >
        <div className="bg-zinc-950/80 p-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
            <User size={32} className="text-blue-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Pilih Penjaga</h2>
          <p className="text-zinc-400 text-center text-sm mb-8">
            Silakan pilih nama penjaga untuk memulai <strong className="text-white">SHIFT {shiftName}</strong>.
          </p>

          <div className="w-full space-y-3">
            {OPERATORS.map(op => (
              <button
                key={op}
                onClick={() => setSelectedOperator(op)}
                className={`w-full p-4 rounded-xl border flex justify-center items-center font-bold tracking-wider transition-all
                  ${selectedOperator === op 
                    ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                    : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:bg-zinc-800'
                  }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 border-t border-white/5">
          <button
            onClick={() => onLogin(selectedOperator)}
            disabled={!selectedOperator}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors uppercase tracking-widest"
          >
            <LogIn size={20} />
            Masuk Shift
          </button>
        </div>
      </motion.div>
    </div>
  );
}
