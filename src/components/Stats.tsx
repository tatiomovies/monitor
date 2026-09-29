import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, DollarSign, Users, Award, Coffee, CalendarDays, Gamepad2 } from 'lucide-react';
import { Rental, DrinkOrder, SewaPS } from '../types';
import { getLogicalDate } from '../lib/utils';

interface StatsProps {
  rentals: Rental[];
  drinkOrders: DrinkOrder[];
  sewaPs: SewaPS[];
}

export function Stats({ rentals, drinkOrders, sewaPs }: StatsProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const { filteredRentals, filteredOrders, filteredSewa } = useMemo(() => {
    const todayLogical = getLogicalDate(Date.now());
    
    // Start of week (Monday)
    const weekStart = new Date(todayLogical);
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1));
    
    // Start of month
    const monthStart = new Date(todayLogical.getFullYear(), todayLogical.getMonth(), 1);

    const filterByDate = (d: number) => {
      if (period === 'all') return true;
      const logical = getLogicalDate(d);
      if (period === 'today') return logical.getTime() === todayLogical.getTime();
      if (period === 'week') return logical >= weekStart;
      if (period === 'month') return logical >= monthStart;
      return true;
    };

    return {
      filteredRentals: rentals.filter(r => r.status === 'FINISHED' && filterByDate(r.startTime)),
      filteredOrders: drinkOrders.filter(o => filterByDate(o.timestamp)),
      filteredSewa: sewaPs.filter(s => s.status === 'FINISHED' && filterByDate(s.startTime))
    };
  }, [rentals, drinkOrders, sewaPs, period]);
  
  // Calculate realtime revenue (per 1 jam) - ONLY FOR TODAY
  const revenueData = useMemo(() => {
    const bins: Record<string, { time: string; rental: number; minuman: number; sewa: number }> = {};
    
    // rentals
    filteredRentals.forEach(r => {
      const d = new Date(r.startTime);
      const timeStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2, '0')}:00`;
      if (!bins[timeStr]) bins[timeStr] = { time: timeStr, rental: 0, minuman: 0, sewa: 0 };
      bins[timeStr].rental += (r.totalPrice || 0);
      if (r.drinksPrice) bins[timeStr].minuman += r.drinksPrice;
    });

    // drink orders
    filteredOrders.forEach(o => {
      const d = new Date(o.timestamp);
      const timeStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2, '0')}:00`;
      if (!bins[timeStr]) bins[timeStr] = { time: timeStr, rental: 0, minuman: 0, sewa: 0 };
      bins[timeStr].minuman += o.totalPrice;
    });

    // sewa PS
    filteredSewa.forEach(s => {
      const d = new Date(s.startTime);
      const timeStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2, '0')}:00`;
      if (!bins[timeStr]) bins[timeStr] = { time: timeStr, rental: 0, minuman: 0, sewa: 0 };
      bins[timeStr].sewa += s.totalPrice;
    });

    return Object.values(bins).sort((a, b) => a.time.localeCompare(b.time)).slice(-24); // Show last 24 entries
  }, [filteredRentals, filteredOrders, filteredSewa]);

  // Calculate PS popularity
  const psPopularity: Record<string, number> = {};
  filteredRentals.forEach(r => {
    psPopularity[r.psType] = (psPopularity[r.psType] || 0) + 1;
  });
  filteredSewa.forEach(s => {
    psPopularity[s.psType] = (psPopularity[s.psType] || 0) + 1;
  });

  const psData = Object.entries(psPopularity).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => a.name.localeCompare(b.name));

  const totalRentalRevenue = filteredRentals.reduce((acc, r) => acc + (r.totalPrice || 0), 0);
  const totalSewaRevenue = filteredSewa.reduce((acc, s) => acc + s.totalPrice, 0);
  const totalDrinkRevenue = filteredOrders.reduce((acc, order) => acc + (order.totalPrice || 0), 0) + filteredRentals.reduce((acc, r) => acc + (r.drinksPrice || 0), 0);
  const totalRevenue = totalRentalRevenue + totalSewaRevenue + totalDrinkRevenue;

  const totalSessions = filteredRentals.length + filteredSewa.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
           <TrendingUp className="text-blue-500" />
           Laporan Keuangan
        </h3>
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shrink-0">
          {(['today', 'week', 'month', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-2 sm:px-4 text-[10px] sm:text-xs font-bold uppercase transition-colors ${
                period === p 
                  ? 'bg-blue-600 text-white' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {p === 'today' ? 'Hari Ini' : p === 'week' ? 'Minggu Ini' : p === 'month' ? 'Bulan Ini' : 'Semua'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="glass p-4 sm:p-5 border-l-4 border-l-blue-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Pendapatan</p>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalRevenue)}
              </h3>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-blue-600/10 text-blue-500 hidden sm:block">
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        <div className="glass p-4 sm:p-5 border-l-4 border-l-emerald-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Pendapatan Minum</p>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalDrinkRevenue)}
              </h3>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-emerald-600/10 text-emerald-500 hidden sm:block">
              <Coffee size={20} />
            </div>
          </div>
        </div>

        <div className="glass p-4 sm:p-5 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Pendapatan Rental</p>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalRentalRevenue)}
              </h3>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-amber-500/10 text-amber-500 hidden sm:block">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
        
        <div className="glass p-4 sm:p-5 border-l-4 border-l-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Pendapatan Sewa</p>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalSewaRevenue)}
              </h3>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-purple-500/10 text-purple-500 hidden sm:block">
              <Gamepad2 size={20} />
            </div>
          </div>
        </div>

        <div className="glass p-4 sm:p-5 border-l-4 border-l-cyan-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Sesi</p>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {totalSessions} <span className="text-sm font-normal text-zinc-400">Main</span>
              </h3>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-cyan-600/10 text-cyan-500 hidden sm:block">
              <Users size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 h-[400px]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-8 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" /> Grafik Pendapatan
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#71717a' }}
                />
                <Bar dataKey="rental" name="Rental" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="sewa" name="Sewa PS" fill="#a855f7" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="minuman" name="Minuman" fill="#10b981" stackId="a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6 h-[400px]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-8 flex items-center gap-2">
            <Award size={16} className="text-purple-500" /> PlayStation Terpopuler
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={psData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#27272a" />
                <XAxis type="number" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} width={60} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#71717a' }}
                />
                <Bar dataKey="value" name="Sesi" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
