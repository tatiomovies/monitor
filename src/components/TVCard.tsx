import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, Clock, Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { TV, Rental, SewaPS } from '../types';
import { cn } from '../lib/utils';

export interface TVCardProps {
  key?: React.Key;
  tv: TV;
  rental?: Rental;
  sewa?: SewaPS;
  onClick: (tv: TV) => void;
}

export function TVCard({ tv, rental, sewa, onClick }: TVCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [sewaTimeLeft, setSewaTimeLeft] = useState<string>('');
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      if (tv.status === 'SEWA' && sewa) {
        const remaining = sewa.targetEndTime - now.getTime();
        const isMinus = remaining < 0;
        const absRemaining = Math.abs(remaining);
        const h = Math.floor(absRemaining / 3600000);
        const m = Math.floor((absRemaining % 3600000) / 60000);
        const s = Math.floor((absRemaining % 60000) / 1000);
        
        const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        setSewaTimeLeft(isMinus ? `- ${timeString}` : timeString);
        return;
      }
      
      if (!rental || rental.status === 'FINISHED') return;
      
      if (rental.isHourly && rental.endTime) {
        // Countdown mode
        const end = new Date(rental.endTime);
        const diffMs = end.getTime() - now.getTime();
        
        if (diffMs <= 0) {
          const absDiff = Math.abs(diffMs);
          const diffMinsTotal = Math.floor(absDiff / 60000);
          const h = Math.floor(diffMinsTotal / 60);
          const m = diffMinsTotal % 60;
          const s = Math.floor((absDiff % 60000) / 1000);
          setTimeLeft(`- ${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
          setIsWarning(false);
          setIsCritical(true); // make it keep pulsing if it's over
        } else {
          const diffMinsTotal = Math.floor(diffMs / 60000);
          const h = Math.floor(diffMinsTotal / 60);
          const m = diffMinsTotal % 60;
          const s = Math.floor((diffMs % 60000) / 1000);
          setTimeLeft(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
          setIsWarning(diffMs <= 600000 && diffMs > 300000);
          setIsCritical(diffMs <= 300000);
        }
      } else {
        // Running time mode (OPEN)
        const start = new Date(rental.startTime);
        const diffMs = now.getTime() - start.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        
        const h = Math.floor(diffSecs / 3600);
        const m = Math.floor((diffSecs % 3600) / 60);
        const s = diffSecs % 60;
        
        const pad = (n: number) => n.toString().padStart(2, '0');
        setTimeLeft(`${pad(h)}:${pad(m)}:${pad(s)}`);
        setIsWarning(false);
        setIsCritical(false);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [rental, tv.status, sewa]);

  const getStatusConfig = () => {
    if (tv.status === 'SEWA') return { color: 'neon-purple', text: 'SEWA', icon: <Monitor className="text-purple-500" /> };
    if (tv.status === 'OFF') return { color: 'neon-gray', text: 'OFF', icon: <Monitor className="text-zinc-500" /> };
    if (isCritical) return { color: 'neon-red animate-pulse', text: 'CRITICAL', icon: <AlertCircle className="text-red-500" /> };
    if (isWarning) return { color: 'neon-red', text: 'WARNING', icon: <AlertCircle className="text-red-500" /> };
    if (rental?.isHourly) return { color: 'neon-blue', text: 'ACTIVE', icon: <Clock className="text-blue-500" /> };
    if (rental?.status === 'OPEN') return { color: 'neon-green', text: 'OPEN', icon: <Play className="text-emerald-500" /> };
    return { color: 'neon-gray', text: 'OFF', icon: <Monitor className="text-zinc-500" /> };
  };

  const config = getStatusConfig();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(tv)}
      className={cn(
        "glass p-3 sm:p-5 cursor-pointer transition-all duration-300 relative overflow-hidden group",
        config.color
      )}
    >
      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">TV {tv.name}</h3>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {tv.status === 'SEWA' ? 'DI SEWA LUAR' + (sewa ? ` • ${sewa.psType}` : '') : (rental?.psType || 'SIAP RENTAL')}
          </p>
        </div>
        <div className="p-1.5 sm:p-2 rounded-lg bg-zinc-800/50">
          {React.cloneElement(config.icon as React.ReactElement, { size: 18, className: cn((config.icon as React.ReactElement).props.className, "sm:w-6 sm:h-6") })}
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {rental && rental.status !== 'FINISHED' ? (
          <>
            <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
              <span className="text-zinc-500 font-bold uppercase tracking-tighter">Mulai</span>
              <span className="font-mono text-white">{new Date(rental.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {rental.endTime && (
              <div className="flex justify-between items-center text-[10px] sm:text-[11px]">
                <span className="text-zinc-500 font-bold uppercase tracking-tighter">Selesai</span>
                <span className="font-mono text-white">{new Date(rental.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-white/5">
              <div className="text-center">
                <p className={cn(
                  "text-[9px] sm:text-[10px] uppercase font-bold mb-0.5 sm:mb-1",
                  (isWarning || isCritical) ? "text-red-500" : rental.isHourly ? "text-blue-400" : "text-emerald-400"
                )}>
                  {rental.isHourly ? 'Sisa Waktu' : 'Running Time'}
                </p>
                <p className={cn(
                  "text-lg sm:text-2xl font-mono font-bold",
                  (isWarning || isCritical) ? "text-red-500 glow-text-red" : 
                  rental.isHourly ? "text-blue-400 glow-text-blue" : 
                  "text-emerald-400 glow-text-green"
                )}>
                  {rental.isHourly ? timeLeft : timeLeft}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="py-2 sm:py-4 flex flex-col items-center justify-center text-zinc-600">
            {tv.status === 'SEWA' && sewa ? (
              <div className="flex flex-col items-center w-full">
                <div className="grid grid-cols-2 gap-2 w-full mb-3 text-center border-b border-zinc-800 pb-2">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">MULAI</span>
                    <span className="text-white text-[10px] font-bold block">
                      {new Date(sewa.startTime).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-zinc-400 text-[10px] block">
                      Jam {new Date(sewa.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">SELESAI</span>
                    <span className="text-white text-[10px] font-bold block">
                      {new Date(sewa.targetEndTime).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-zinc-400 text-[10px] block">
                      Jam {new Date(sewa.targetEndTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className={cn(
                  "text-lg sm:text-2xl font-mono font-bold tracking-wider",
                  sewaTimeLeft.startsWith('-') ? "text-red-500" : "text-purple-400"
                )}>
                  {sewaTimeLeft}
                </div>
                {sewaTimeLeft.startsWith('-') && (
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1 animate-pulse">
                    Kena Denda
                  </span>
                )}
              </div>
            ) : (
              <>
                <Monitor size={32} className="mb-2 opacity-50" />
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">Siap Rental</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Decorative corner glow */}
      <div className={cn(
        "absolute -bottom-4 -right-4 w-16 h-16 blur-2xl opacity-20",
        (isWarning || isCritical) ? "bg-neon-red" : 
        tv.status === 'SEWA' ? "bg-purple-500" :
        rental?.isHourly ? "bg-neon-blue" : "bg-neon-green"
      )} />
    </motion.div>
  );
}
