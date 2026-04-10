import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Plus, Trash2, RotateCcw, Wallet, Check, AlertTriangle, Landmark,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { parseAmount } from '../utils/format';

const fmt = (v) => Number(v || 0).toLocaleString('es-CL');

const FADE_UP = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const CARD_COLORS = [
  { bg: 'from-indigo-600 to-violet-700' },
  { bg: 'from-slate-700 to-slate-900' },
  { bg: 'from-emerald-600 to-teal-700' },
  { bg: 'from-rose-600 to-pink-700' },
  { bg: 'from-amber-600 to-orange-700' },
  { bg: 'from-cyan-600 to-blue-700' },
];

const emptyForm = () => ({
  name: '',
  type: 'credit',
  creditLimit: '',
  bank: '',
  lastFourDigits: '',
  colorIndex: 0,
});

const CardVisual = ({ card, onDelete, onReset, expenses }) => {
  const colorSet = CARD_COLORS[card.colorIndex || 0] || CARD_COLORS[0];
  const isDebit = card.type === 'debit';
  const used = card.usedAmount || 0;
  const limit = card.creditLimit || 0;
  const available = limit - used;
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isOver = available < 0;
  const isLowCredit = !isDebit && limit > 0 && available / limit < 0.10 && available >= 0;

  const linkedExpenses = expenses.filter(e => e.creditCardId === card.id);
  const now = new Date();
  const thisMonthLinked = linkedExpenses.filter(e => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Proyección próximo estado de cuenta (gastos del mes en curso)
  const nextStatementTotal = thisMonthLinked.reduce((a, e) => a + e.amount, 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-3"
    >
      {/* Visual card */}
      <div className={`bg-gradient-to-br ${colorSet.bg} rounded-3xl p-6 shadow-xl relative overflow-hidden group`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          {/* Top row */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  isDebit
                    ? 'bg-emerald-500/30 text-emerald-200'
                    : 'bg-white/20 text-white/70'
                }`}>
                  {isDebit ? 'Débito' : 'Crédito'}
                </span>
              </div>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                {card.bank || 'Banco'}
              </p>
              <p className="text-white font-black text-lg tracking-tight">{card.name}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isDebit && (
                <button
                  onClick={() => onReset(card.id)}
                  title="Reiniciar saldo usado"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <RotateCcw size={14} />
                </button>
              )}
              <button
                onClick={() => onDelete(card.id)}
                title="Eliminar tarjeta"
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/50 text-white transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Card number */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-white/40 text-sm font-bold tracking-[0.3em]">••••</span>
            <span className="text-white/40 text-sm font-bold tracking-[0.3em]">••••</span>
            <span className="text-white/40 text-sm font-bold tracking-[0.3em]">••••</span>
            <span className="text-white font-bold text-sm tracking-[0.3em]">
              {card.lastFourDigits || '••••'}
            </span>
          </div>

          {/* Balances */}
          {isDebit ? (
            <div>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-0.5">Saldo Disponible</p>
              <p className="text-3xl font-black text-white">$ {fmt(limit)}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-0.5">Usado</p>
                <p className={`text-xl font-black ${isOver ? 'text-rose-300' : 'text-white'}`}>
                  $ {fmt(used)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-0.5">Disponible</p>
                <p className={`text-xl font-black ${isOver ? 'text-rose-300' : 'text-emerald-300'}`}>
                  $ {fmt(available)}
                </p>
              </div>
            </div>
          )}

          {/* Progress bar — only for credit */}
          {!isDebit && limit > 0 && (
            <div className="mt-4">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${pct > 90 ? 'bg-rose-400' : pct > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] font-bold text-white/40">{pct.toFixed(0)}% utilizado</span>
                <span className="text-[10px] font-bold text-white/40">Cupo: $ {fmt(limit)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alerta cupo bajo */}
      {isLowCredit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl px-4 py-3"
        >
          <AlertTriangle size={15} className="text-rose-500 mt-0.5 shrink-0" />
          <p className="text-xs text-rose-700 dark:text-rose-300 font-bold">
            Menos del 10% de cupo disponible — ${fmt(available)} restantes.
          </p>
        </motion.div>
      )}

      {/* Card stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Cargos este mes</p>
          <p className="text-lg font-black text-slate-800 dark:text-white">{thisMonthLinked.length}</p>
        </div>
        {!isDebit ? (
          <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-3 border border-indigo-100 dark:border-indigo-900">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-0.5">Próximo estado</p>
            <p className="text-lg font-black text-indigo-700 dark:text-indigo-300">${fmt(nextStatementTotal)}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total registros</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">{linkedExpenses.length}</p>
          </div>
        )}
      </div>

      {/* Recent charges */}
      {thisMonthLinked.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <p className="px-4 pt-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Últimos cargos
          </p>
          {thisMonthLinked.slice(0, 3).map((exp) => (
            <div key={exp.id} className="flex items-center justify-between px-4 py-2.5 border-t border-slate-50 dark:border-slate-800/50">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                  {exp.description || exp.category}
                </p>
                <p className="text-[10px] text-slate-400">
                  {new Date(exp.date + 'T00:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                </p>
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-white shrink-0">
                $ {fmt(exp.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default function Tarjetas() {
  const {
    creditCards = [],
    addCreditCard,
    deleteCreditCard,
    resetCardBalance,
    expenses = [],
  } = useExpenses();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const creditCardsList = creditCards.filter(c => c.type !== 'debit');
  const debitCardsList = creditCards.filter(c => c.type === 'debit');

  const totalLimit = useMemo(
    () => creditCardsList.reduce((acc, c) => acc + (c.creditLimit || 0), 0),
    [creditCardsList]
  );
  const totalUsed = useMemo(
    () => creditCardsList.reduce((acc, c) => acc + (c.usedAmount || 0), 0),
    [creditCardsList]
  );

  const isDebitForm = form.type === 'debit';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.creditLimit) return;
    addCreditCard?.({
      name: form.name.trim(),
      type: form.type,
      creditLimit: parseAmount(form.creditLimit) || 0,
      bank: form.bank.trim(),
      lastFourDigits: form.lastFourDigits.trim(),
      colorIndex: parseInt(form.colorIndex) || 0,
    });
    setForm(emptyForm());
    setShowForm(false);
  };

  const inputClass =
    'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-bold';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4 }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 data-tutorial-id="tarjetas-title" className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Mis Tarjetas
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Débito y crédito en un solo lugar
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition"
          >
            <Plus size={16} /> Nueva Tarjeta
          </button>
        </div>
      </motion.div>

      {/* Summary — only credit cards */}
      {creditCardsList.length > 0 && (
        <motion.div
          {...FADE_UP}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { label: 'Cupo Total Crédito', value: `$${fmt(totalLimit)}`, icon: CreditCard, color: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600' },
            { label: 'Total Usado', value: `$${fmt(totalUsed)}`, icon: Wallet, color: 'bg-rose-50 dark:bg-rose-950 text-rose-600' },
            {
              label: 'Disponible Total',
              value: `$${fmt(totalLimit - totalUsed)}`,
              icon: Check,
              color: totalLimit - totalUsed < 0
                ? 'bg-rose-50 dark:bg-rose-950 text-rose-600'
                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600',
            },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center gap-4">
              <div className={`p-3 rounded-2xl shrink-0 ${s.color}`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-xl font-black text-slate-800 dark:text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5"
            >
              <h3 className="font-black text-slate-800 dark:text-white text-lg">Nueva Tarjeta</h3>

              {/* Type selector */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo de tarjeta</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'debit' })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
                      form.type === 'debit'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <Landmark size={16} />
                    Débito
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'credit' })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
                      form.type === 'credit'
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <CreditCard size={16} />
                    Crédito
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nombre (ej: Visa Gold)"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  required
                />
                <input
                  type="text"
                  placeholder="Banco (ej: BancoEstado)"
                  value={form.bank}
                  onChange={(e) => setForm({ ...form, bank: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={isDebitForm ? 'Saldo actual (ej: 500.000)' : 'Cupo total (ej: 2.000.000)'}
                  value={form.creditLimit}
                  onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
                  className={inputClass}
                  required
                />
                <input
                  type="text"
                  placeholder="Últimos 4 dígitos (opcional)"
                  maxLength="4"
                  value={form.lastFourDigits}
                  onChange={(e) => setForm({ ...form, lastFourDigits: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  className={inputClass}
                />
              </div>

              {/* Color picker */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Color</p>
                <div className="flex gap-2">
                  {CARD_COLORS.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setForm({ ...form, colorIndex: i })}
                      className={`w-10 h-7 rounded-lg bg-gradient-to-br ${c.bg} border-2 transition-all ${
                        parseInt(form.colorIndex) === i ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(emptyForm()); }}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-indigo-500/20"
                >
                  Guardar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debit cards section */}
      {debitCardsList.length > 0 && (
        <motion.div {...FADE_UP} transition={{ duration: 0.4, delay: 0.08 }} className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Landmark size={14} />
            Tarjetas de Débito
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence initial={false}>
              {debitCardsList.map((card) => (
                <CardVisual
                  key={card.id}
                  card={card}
                  onDelete={deleteCreditCard}
                  onReset={resetCardBalance}
                  expenses={expenses}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Credit cards section */}
      {creditCardsList.length > 0 && (
        <motion.div {...FADE_UP} transition={{ duration: 0.4, delay: 0.1 }} className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <CreditCard size={14} />
            Tarjetas de Crédito
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence initial={false}>
              {creditCardsList.map((card) => (
                <CardVisual
                  key={card.id}
                  card={card}
                  onDelete={deleteCreditCard}
                  onReset={resetCardBalance}
                  expenses={expenses}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {creditCards.length === 0 && (
        <motion.div {...FADE_UP} transition={{ duration: 0.4, delay: 0.1 }}>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-12 flex flex-col items-center text-slate-400">
            <CreditCard size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-bold">No tienes tarjetas registradas</p>
            <p className="text-xs mt-1">Añade tus tarjetas de débito o crédito</p>
          </div>
        </motion.div>
      )}

      {/* Over limit warning */}
      {creditCardsList.some(c => (c.usedAmount || 0) > (c.creditLimit || 0)) && (
        <motion.div
          {...FADE_UP}
          className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl px-4 py-3"
        >
          <AlertTriangle size={16} className="text-rose-500 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-700 dark:text-rose-300 font-bold">
            ¡Cuidado! Tienes al menos una tarjeta de crédito que ha superado su cupo.
          </p>
        </motion.div>
      )}
    </div>
  );
}
