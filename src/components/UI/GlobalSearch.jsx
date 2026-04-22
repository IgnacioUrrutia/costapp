import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Wallet, Target, CreditCard, TrendingDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../../context/ExpenseContext';
import { formatAmount } from '../../utils/format';

const GlobalSearch = () => {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { filteredExpenses, goals, debts, creditCards } = useExpenses();

  // Open on Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelected(0);
    }
  }, [open]);

  const q = query.toLowerCase().trim();

  const results = useMemo(() => {
    if (!q) return [];
    const items = [];

    // Expenses
    (filteredExpenses || []).forEach(e => {
      const haystack = `${e.description || ''} ${e.category || ''}`.toLowerCase();
      if (haystack.includes(q)) {
        items.push({
          type: 'expense',
          id: e.id,
          label: e.description || e.category,
          sub: e.category,
          value: formatAmount(e.amount),
          icon: Wallet,
          color: 'text-indigo-500',
          action: () => navigate('/movimientos'),
        });
      }
    });

    // Goals
    (goals || []).forEach(g => {
      if (`${g.name || ''} ${g.description || ''}`.toLowerCase().includes(q)) {
        items.push({
          type: 'goal',
          id: g.id,
          label: g.name || 'Meta',
          sub: 'Meta de ahorro',
          value: formatAmount(g.targetAmount || 0),
          icon: Target,
          color: 'text-emerald-500',
          action: () => navigate('/metas'),
        });
      }
    });

    // Debts
    (debts || []).forEach(d => {
      if (`${d.name || ''} ${d.description || ''}`.toLowerCase().includes(q)) {
        items.push({
          type: 'debt',
          id: d.id,
          label: d.name || 'Deuda',
          sub: 'Deuda',
          value: formatAmount(d.amount || 0),
          icon: TrendingDown,
          color: 'text-rose-500',
          action: () => navigate('/deudas'),
        });
      }
    });

    // Credit cards
    (creditCards || []).filter(c => c.type === 'credit').forEach(c => {
      if (`${c.bank || ''} ${c.lastFourDigits || ''}`.toLowerCase().includes(q)) {
        items.push({
          type: 'card',
          id: c.id,
          label: `${c.bank} ····${c.lastFourDigits}`,
          sub: 'Tarjeta de crédito',
          value: formatAmount(c.usedAmount || 0),
          icon: CreditCard,
          color: 'text-violet-500',
          action: () => navigate('/tarjetas'),
        });
      }
    });

    return items.slice(0, 8);
  }, [q, filteredExpenses, goals, debts, creditCards, navigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(p => Math.min(p + 1, results.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(p => Math.max(p - 1, 0)); }
      if (e.key === 'Enter' && results[selected]) {
        results[selected].action();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, selected]);

  // Reset selection when results change
  useEffect(() => { setSelected(0); }, [results]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
        onPointerDown={() => setOpen(false)}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -10 }}
          transition={{ duration: 0.15 }}
          onPointerDown={e => e.stopPropagation()}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <Search size={17} className="text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar gastos, metas, deudas, tarjetas…"
              className="flex-1 bg-transparent text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={15} />
              </button>
            )}
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="max-h-80 overflow-y-auto py-2">
              {results.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => { item.action(); setOpen(false); }}
                    onMouseEnter={() => setSelected(i)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors touch-manipulation ${
                      i === selected
                        ? 'bg-slate-50 dark:bg-slate-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 ${item.color}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{item.label}</p>
                      <p className="text-[10px] font-semibold text-slate-400">{item.sub}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-black text-slate-700 dark:text-slate-200 tabular-nums">
                        {item.value}
                      </span>
                      <ChevronRight size={13} className="text-slate-300" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {q && results.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-400">
              <Search size={24} className="mx-auto mb-2 opacity-30" strokeWidth={1.5} />
              <p className="text-sm font-semibold">Sin resultados para "{query}"</p>
            </div>
          )}

          {/* Hint when empty query */}
          {!q && (
            <div className="px-4 py-6 text-center text-slate-300 dark:text-slate-600">
              <p className="text-xs font-semibold">Escribe para buscar en gastos, metas, deudas y tarjetas</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-[10px] font-bold text-slate-400">
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px]">↑↓</kbd> navegar</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px]">↵</kbd> abrir</span>
            <span className="ml-auto flex items-center gap-1"><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px]">Ctrl K</kbd> abrir/cerrar</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalSearch;
