import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle, Save, Share2 } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { formatAmount, parseAmount } from '../utils/format';
import { toast } from 'react-hot-toast';

const CATEGORIES = [
  'Vivienda', 'Alimentación', 'Transporte', 'Salud',
  'Entretenimiento', 'Educación', 'Personal', 'Financiero', 'Ahorro/Inversión',
];

const FADE_UP = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export default function Presupuesto() {
  const { totalIncome, budgets, setBudgets, categoryTotals, shareBudgets } = useExpenses();

  const [localBudgets, setLocalBudgets] = useState(() =>
    Object.fromEntries(CATEGORIES.map(c => [c, budgets[c] || 0]))
  );
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    const url = await shareBudgets();
    setSharing(false);
    if (url) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('¡Link copiado al portapapeles!', { icon: '🔗' });
      } catch {
        toast.success(`Link generado: ${url}`, { duration: 6000 });
      }
    }
  };

  const totalAllocated = useMemo(
    () => CATEGORIES.reduce((a, c) => a + (parseFloat(localBudgets[c]) || 0), 0),
    [localBudgets]
  );

  const unallocated = totalIncome - totalAllocated;
  const isBalanced  = Math.abs(unallocated) < 1;
  const allocPct    = totalIncome > 0 ? Math.min((totalAllocated / totalIncome) * 100, 100) : 0;

  const handleInput = (cat, val) => {
    setLocalBudgets(prev => ({ ...prev, [cat]: val }));
  };

  // Distribute remaining amount evenly across unset categories
  const handleDistribute = () => {
    if (unallocated <= 0) return;
    const zeroCats = CATEGORIES.filter(c => !parseFloat(localBudgets[c]));
    if (zeroCats.length === 0) return;
    const share = Math.floor(unallocated / zeroCats.length);
    setLocalBudgets(prev => {
      const next = { ...prev };
      zeroCats.forEach(c => { next[c] = share; });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const cleaned = Object.fromEntries(
      CATEGORIES.map(c => [c, parseFloat(localBudgets[c]) || 0])
    );
    await setBudgets(cleaned);
    setSaving(false);
  };

  return (
    <div className="pg-container">
      <motion.div {...FADE_UP} transition={{ duration: 0.4 }}>
        <h1 className="pg-title">Presupuesto Base Cero</h1>
        <p className="pg-subtitle">
          Asigna cada peso de tu ingreso a una categoría hasta llegar a $0 sin asignar
        </p>
      </motion.div>

      {/* Summary */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4, delay: 0.05 }} className="c-card p-6">
        <div className="grid grid-cols-3 gap-4 text-center mb-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Ingreso total</p>
            <p className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{formatAmount(totalIncome)}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Asignado</p>
            <p className="text-lg font-black text-indigo-500 tabular-nums">{formatAmount(totalAllocated)}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Sin asignar</p>
            <p className={`text-lg font-black tabular-nums ${isBalanced ? 'text-emerald-500' : unallocated < 0 ? 'text-rose-500' : 'text-amber-500'}`}>
              {formatAmount(unallocated)}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
          <motion.div
            animate={{ width: `${allocPct}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full rounded-full transition-colors ${isBalanced ? 'bg-emerald-400' : unallocated < 0 ? 'bg-rose-400' : 'bg-indigo-500'}`}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
          <span>{allocPct.toFixed(0)}% asignado</span>
          {isBalanced && (
            <span className="text-emerald-500 font-black flex items-center gap-1">
              <CheckCircle size={11} /> ¡Presupuesto balanceado!
            </span>
          )}
          {unallocated > 1 && (
            <button
              onClick={handleDistribute}
              className="text-indigo-500 font-black hover:opacity-70 transition-opacity"
            >
              Distribuir restante →
            </button>
          )}
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4, delay: 0.1 }} className="c-card p-6">
        <div className="c-card-header mb-6">
          <div className="c-card-icon bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600">
            <Target size={20} />
          </div>
          <div>
            <h2 className="c-card-title">Categorías</h2>
            <p className="c-card-subtitle">Fija cuánto quieres gastar en cada área este mes</p>
          </div>
        </div>

        <div className="space-y-5">
          {CATEGORIES.map(cat => {
            const allocated = parseFloat(localBudgets[cat]) || 0;
            const spent     = categoryTotals[cat] || 0;
            const spentPct  = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
            const over      = allocated > 0 && spent > allocated;

            return (
              <div key={cat}>
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex-1">{cat}</span>
                  {spent > 0 && (
                    <span className={`text-[10px] font-black tabular-nums ${over ? 'text-rose-500' : 'text-slate-400'}`}>
                      Gastado: {formatAmount(spent)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold pointer-events-none">$</span>
                    <input
                      type="text" inputMode="numeric"
                      value={localBudgets[cat] || ''}
                      onChange={e => handleInput(cat, e.target.value)}
                      placeholder="0"
                      className="f-input w-full pl-7 py-2.5 text-sm"
                    />
                  </div>
                  {allocated > 0 && (
                    <span className={`text-[10px] font-black w-9 text-right tabular-nums shrink-0 ${over ? 'text-rose-500' : 'text-slate-400'}`}>
                      {spentPct.toFixed(0)}%
                    </span>
                  )}
                </div>
                {allocated > 0 && (
                  <div className="mt-1.5 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${spentPct}%` }}
                      className={`h-full rounded-full ${over ? 'bg-rose-400' : spentPct > 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleShare}
            disabled={sharing}
            title="Loud budgeting — comparte tus límites públicamente"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all disabled:opacity-50"
          >
            <Share2 size={15} /> {sharing ? 'Generando…' : 'Compartir límites'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="btn-accent flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm disabled:opacity-60"
          >
            <Save size={15} /> {saving ? 'Guardando…' : 'Guardar presupuesto'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
