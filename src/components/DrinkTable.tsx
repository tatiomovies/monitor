import React from 'react';
import { Drink } from '../types';

interface DrinkTableProps {
  drinks: Drink[];
}

export function DrinkTable({ drinks }: DrinkTableProps) {
  const formatIDR = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="glass overflow-hidden shadow-xl border border-white/5">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-full">
          <thead>
            <tr className="border-b border-white/5 bg-black/40">
              <th className="px-1.5 py-2 sm:px-4 sm:py-2.5 text-[8px] sm:text-[10px] uppercase font-bold text-zinc-500 tracking-tight sm:tracking-wider">Minuman</th>
              <th className="px-1.5 py-2 sm:px-4 sm:py-2.5 text-[8px] sm:text-[10px] uppercase font-bold text-zinc-500 tracking-tight sm:tracking-wider">Harga</th>
              <th className="px-1.5 py-2 sm:px-4 sm:py-2.5 text-[8px] sm:text-[10px] uppercase font-bold text-zinc-500 tracking-tight sm:tracking-wider text-center">Sisa</th>
              <th className="px-1.5 py-2 sm:px-4 sm:py-2.5 text-[8px] sm:text-[10px] uppercase font-bold text-zinc-500 tracking-tight sm:tracking-wider text-center">Habis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {drinks.map((drink) => {
              const habis = Math.max(0, drink.initialStock - drink.currentStock);

              return (
                <tr key={drink.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-1.5 py-1.5 sm:px-4 sm:py-2">
                    <span className="font-bold text-white text-[9px] sm:text-sm">{drink.name}</span>
                  </td>
                  <td className="px-1.5 py-1.5 sm:px-4 sm:py-2">
                    <span className="text-zinc-400 text-[9px] sm:text-sm">{formatIDR(drink.price)}</span>
                  </td>
                  <td className="px-1.5 py-1.5 sm:px-4 sm:py-2 text-center">
                    <span className="text-zinc-300 text-[9px] sm:text-sm font-mono whitespace-nowrap">{drink.currentStock} <span className="text-zinc-600">/ {drink.initialStock}</span></span>
                  </td>
                  <td className="px-1.5 py-1.5 sm:px-4 sm:py-2 text-center">
                    <span className="font-bold text-orange-500 text-[9px] sm:text-sm">{habis}</span>
                  </td>
                </tr>
              );
            })}
            {drinks.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 text-sm">
                  Belum ada minuman yang terdaftar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

