import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Award, Share2 } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { toast } from 'react-hot-toast';

const fmt = (v) => Number(v || 0).toLocaleString('es-CL');

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const FADE_UP = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

// Custom bar chart tooltip
const CustomTooltip = ({ active, payload, label, salary }) => {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const over = value > salary;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-xl">
      <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-black ${over ? 'text-rose-500' : 'text-indigo-600'}`}>
        ${fmt(value)}
      </p>
      {salary > 0 && (
        <p className={`text-xs font-bold mt-0.5 ${over ? 'text-rose-400' : 'text-emerald-500'}`}>
          {over ? `+$${fmt(value - salary)} sobre sueldo` : `$${fmt(salary - value)} bajo sueldo`}
        </p>
      )}
    </div>
  );
};

export default function ResumenAnual() {
  const { expenses, salary, shareMonth } = useExpenses();

  const handleShare = async (m, y) => {
    const url = await shareMonth(m, y);
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success('¡Link copiado al portapapeles!');
    }
  };

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(new Date().getMonth());

  // Build monthly totals for selected year
  const monthlyData = useMemo(() => {
    return MONTH_SHORT.map((name, month) => {
      const total = expenses
        .filter((exp) => {
          const d = new Date(exp.date + 'T00:00:00');
          return d.getFullYear() === selectedYear && d.getMonth() === month;
        })
        .reduce((acc, exp) => acc + exp.amount, 0);
      return { name, month, total, hasData: total > 0 };
    });
  }, [expenses, selectedYear]);

  const yearTotal = useMemo(() => monthlyData.reduce((a, m) => a + m.total, 0), [monthlyData]);

  const monthsWithData = monthlyData.filter((m) => m.hasData);

  const mostExpensive = useMemo(() => {
    if (!monthsWithData.length) return null;
    return monthsWithData.reduce((a, b) => (b.total > a.total ? b : a));
  }, [monthsWithData]);

  const cheapest = useMemo(() => {
    if (!monthsWithData.length) return null;
    return monthsWithData.reduce((a, b) => (b.total < a.total ? b : a));
  }, [monthsWithData]);

  const average = monthsWithData.length > 0
    ? yearTotal / monthsWithData.length
    : 0;

  const statsCards = [
    {
      label: 'Mes más caro',
      value: mostExpensive ? `${MONTH_SHORT[mostExpensive.month]}` : '—',
      sub: mostExpensive ? `$${fmt(mostExpensive.total)}` : null,
      icon: TrendingUp,
      color: 'bg-rose-50 dark:bg-rose-950 text-rose-600',
    },
    {
      label: 'Mes más económico',
      value: cheapest ? `${MONTH_SHORT[cheapest.month]}` : '—',
      sub: cheapest ? `$${fmt(cheapest.total)}` : null,
      icon: TrendingDown,
      color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600',
    },
    {
      label: 'Promedio mensual',
      value: `$${fmt(average)}`,
      sub: `${monthsWithData.length} meses activos`,
      icon: DollarSign,
      color: 'bg-amber-50 dark:bg-amber-950 text-amber-600',
    },
    {
      label: 'Total del año',
      value: `$${fmt(yearTotal)}`,
      sub: salary > 0 ? `${((yearTotal / (salary * 12)) * 100).toFixed(1)}% del sueldo anual` : null,
      icon: Award,
      color: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600',
    },
  ];

  const compareData = useMemo(() => {
    const getMonthStats = (m) => {
      const filtered = expenses.filter(e => {
        const d = new Date(e.date + 'T00:00:00');
        return d.getFullYear() === selectedYear && d.getMonth() === m;
      });
      const total = filtered.reduce((a, e) => a + e.amount, 0);
      const categories = {};
      filtered.forEach(e => { categories[e.category] = (categories[e.category] || 0) + e.amount; });
      return { total, categories };
    };

    const dataA = getMonthStats(compareA);
    const dataB = getMonthStats(compareB);
    const diff = dataB.total - dataA.total;
    const pct = dataA.total > 0 ? (diff / dataA.total) * 100 : 0;

    return { dataA, dataB, diff, pct };
  }, [expenses, selectedYear, compareA, compareB]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6">

      {/* Header */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4 }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 data-tutorial-id="anual-title" className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Resumen Anual {selectedYear}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Evolución de gastos a lo largo del año
            </p>
          </div>
          {/* Year selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedYear((y) => y - 1)}
              className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              ← {selectedYear - 1}
            </button>
            <span className="px-5 py-2 rounded-2xl bg-indigo-600 text-white font-black text-sm">
              {selectedYear}
            </span>
            {selectedYear < currentYear && (
              <button
                onClick={() => setSelectedYear((y) => y + 1)}
                className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                {selectedYear + 1} →
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        {...FADE_UP}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statsCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center gap-4"
          >
            <div className={`p-3 rounded-2xl shrink-0 ${card.color}`}>
              <card.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 truncate">
                {card.label}
              </p>
              <p className="text-xl font-black text-slate-800 dark:text-white">{card.value}</p>
              {card.sub && (
                <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Bar chart */}
      <motion.div
        {...FADE_UP}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h2 className="text-base font-black text-slate-800 dark:text-white">
            Gastos por mes
          </h2>
          {salary > 0 && (
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />
                <span className="text-slate-500 dark:text-slate-400">Bajo sueldo</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
                <span className="text-slate-500 dark:text-slate-400">Sobre sueldo</span>
              </span>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              width={48}
            />
            <Tooltip content={<CustomTooltip salary={salary} />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
            <Bar dataKey="total" radius={[8, 8, 0, 0]}>
              {monthlyData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={salary > 0 && entry.total > salary ? '#ef4444' : entry.total > 0 ? '#6366f1' : '#e2e8f0'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Comparison Tool */}
      <motion.div
        {...FADE_UP}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-500" />
            Comparar Meses
          </h2>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mes Base</label>
              <select 
                value={compareA} 
                onChange={(e) => setCompareA(parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
              >
                {MONTH_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mes a Comparar</label>
              <select 
                value={compareB} 
                onChange={(e) => setCompareB(parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
              >
                {MONTH_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Diferencia Total</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${compareData.diff > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {compareData.diff > 0 ? '+' : ''}${fmt(compareData.diff)}
              </span>
              <span className={`text-xs font-bold ${compareData.diff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ({compareData.diff > 0 ? '+' : ''}{compareData.pct.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black text-slate-700 dark:text-slate-300">Desglose Comparativo</h2>
            <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-400">{MONTH_SHORT[compareA]}</span>
              <span className="text-indigo-500">{MONTH_SHORT[compareB]}</span>
            </div>
          </div>
          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.keys({ ...compareData.dataA.categories, ...compareData.dataB.categories }).map(cat => {
              const valA = compareData.dataA.categories[cat] || 0;
              const valB = compareData.dataB.categories[cat] || 0;
              const maxVal = Math.max(valA, valB, 1);
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-600 dark:text-slate-400">{cat}</span>
                    <span className="text-slate-400">
                      ${fmt(valA)} → <span className="text-slate-800 dark:text-white">${fmt(valB)}</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden relative">
                    <div 
                      className="absolute left-0 top-0 h-full bg-slate-200 dark:bg-slate-700 rounded-full transition-all duration-500" 
                      style={{ width: `${(valA / maxVal) * 100}%` }} 
                    />
                    <div 
                      className="absolute left-0 top-0 h-full bg-indigo-500/60 rounded-full transition-all duration-500" 
                      style={{ width: `${(valB / maxVal) * 100}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Monthly table */}
      <motion.div
        {...FADE_UP}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-black text-slate-800 dark:text-white">
            Detalle por mes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950">
                <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Mes</th>
                <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Gastado</th>
                <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">vs Sueldo</th>
                <th className="text-right px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Ahorro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {monthlyData.map((row, i) => {
                const vs = salary > 0 && row.hasData
                  ? ((row.total / salary) * 100).toFixed(0)
                  : null;
                const saving = salary - row.total;
                const over = salary > 0 && row.total > salary;
                const isCurrentMonth =
                  i === new Date().getMonth() && selectedYear === currentYear;

                return (
                  <tr
                    key={row.name}
                    className={`transition-colors ${
                      isCurrentMonth ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                    }`}
                  >
                    <td className="px-6 py-3.5 font-bold text-slate-800 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-slate-400" />
                        {MONTH_NAMES[i]}
                        {isCurrentMonth && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full">
                            Actual
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-slate-800 dark:text-white">
                      {row.hasData ? `$${fmt(row.total)}` : <span className="text-slate-300 dark:text-slate-700">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {vs !== null ? (
                        <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                          over
                            ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600'
                            : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                        }`}>
                          {vs}%
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold flex items-center justify-end gap-3">
                      {row.hasData && salary > 0 ? (
                        <span className={saving >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                          {saving >= 0 ? '+' : ''}{`$${fmt(saving)}`}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">—</span>
                      )}
                      
                      {row.hasData && (
                        <button 
                          onClick={() => handleShare(i, selectedYear)}
                          className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 rounded-lg transition-colors"
                          title="Compartir reporte"
                        >
                          <Share2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals row */}
            <tfoot>
              <tr className="bg-indigo-50 dark:bg-indigo-950/30 border-t-2 border-indigo-100 dark:border-indigo-900">
                <td className="px-6 py-4 font-black text-slate-800 dark:text-white text-sm">
                  Total {selectedYear}
                </td>
                <td className="px-4 py-4 text-right font-black text-indigo-700 dark:text-indigo-300">
                  ${fmt(yearTotal)}
                </td>
                <td className="px-4 py-4 text-right">
                  {salary > 0 && yearTotal > 0 && (
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {((yearTotal / (salary * 12)) * 100).toFixed(1)}% anual
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right font-black">
                  {salary > 0 && (
                    <span className={salary * 12 - yearTotal >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                      {salary * 12 - yearTotal >= 0 ? '+' : ''}${fmt(salary * 12 - yearTotal)}
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>

    </div>
  );
}
