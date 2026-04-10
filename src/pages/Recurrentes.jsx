import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Plus, Trash2, Calendar, Check,
  Home, Utensils, Truck, HeartPulse, Play,
  GraduationCap, User, CreditCard, PiggyBank, Wallet,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { parseAmount } from '../utils/format';

const fmt = (v) => Number(v || 0).toLocaleString('es-CL');

const FADE_UP = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const ICON_MAP = {
  Vivienda: Home, Alimentación: Utensils, Transporte: Truck,
  Salud: HeartPulse, Entretenimiento: Play, Educación: GraduationCap,
  Personal: User, Financiero: CreditCard, 'Ahorro/Inversión': PiggyBank,
};

const COLOR_MAP = {
  Vivienda: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600',
  Alimentación: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600',
  Transporte: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600',
  Salud: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600',
  Entretenimiento: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600',
  Educación: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600',
  Personal: 'bg-pink-100 dark:bg-pink-900/40 text-pink-600',
  Financiero: 'bg-slate-100 dark:bg-slate-800 text-slate-600',
  'Ahorro/Inversión': 'bg-teal-100 dark:bg-teal-900/40 text-teal-600',
};

const CATEGORIES = [
  'Vivienda', 'Alimentación', 'Transporte', 'Salud',
  'Entretenimiento', 'Educación', 'Personal', 'Financiero', 'Ahorro/Inversión',
];

const emptyForm = () => ({
  description: '',
  amount: '',
  category: 'Vivienda',
  dayOfMonth: '1',
});

// Toggle switch component
const ToggleSwitch = ({ active, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        active ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export default function Recurrentes() {
  const {
    recurringExpenses = [],
    addRecurring,
    deleteRecurring,
    toggleRecurring,
    registerAllRecurring,
  } = useExpenses();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [registering, setRegistering] = useState(false);

  const totalMonthly = useMemo(
    () => recurringExpenses
      .filter((r) => r.active)
      .reduce((acc, r) => acc + (r.amount || 0), 0),
    [recurringExpenses]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return;
    addRecurring?.({
      description: form.description.trim(),
      amount: parseAmount(form.amount) || 0,
      category: form.category,
      dayOfMonth: parseInt(form.dayOfMonth, 10) || 1,
      active: true,
    });
    setForm(emptyForm());
    setShowForm(false);
  };

  const handleRegisterAll = async () => {
    setRegistering(true);
    await registerAllRecurring?.();
    setRegistering(false);
  };

  const inputClass =
    'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6">

      {/* Header */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4 }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 data-tutorial-id="recurrentes-title" className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Gastos Recurrentes
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Gastos fijos que se repiten cada mes
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition"
          >
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </motion.div>

      {/* Info banner */}
      <motion.div
        {...FADE_UP}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 rounded-2xl px-4 py-3"
      >
        <RefreshCw size={16} className="text-indigo-500 mt-0.5 shrink-0" />
        <p className="text-sm text-indigo-700 dark:text-indigo-300">
          Estos gastos se pueden registrar con un clic cada mes. Activa o desactiva los que
          correspondan y luego pulsa <strong>"Registrar todos este mes"</strong>.
        </p>
      </motion.div>

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
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4"
            >
              <h3 className="font-black text-slate-800 dark:text-white">Nuevo Gasto Recurrente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Descripción (ej: Netflix)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputClass}
                  required
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Monto"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className={inputClass}
                  required
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={inputClass}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Día del mes (1-31)"
                    min="1"
                    max="31"
                    value={form.dayOfMonth}
                    onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })}
                    className={inputClass}
                  />
                  <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition"
                >
                  Guardar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <motion.div
        {...FADE_UP}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden"
      >
        {recurringExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw size={40} className="mb-3 opacity-30" />
            <p className="text-sm">No hay gastos recurrentes</p>
            <p className="text-xs mt-1">Agrega tus pagos fijos mensuales</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {recurringExpenses.map((rec, i) => {
              const Icon = ICON_MAP[rec.category] || Wallet;
              const colorClass = COLOR_MAP[rec.category] || 'bg-slate-100 text-slate-600';
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-4 px-6 py-4 border-b border-slate-50 dark:border-slate-800/50 last:border-b-0 ${
                    !rec.active ? 'opacity-50' : ''
                  }`}
                >
                  <div className={`p-2.5 rounded-2xl shrink-0 ${colorClass}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                      {rec.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{rec.category}</span>
                      <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={10} />
                        Día {rec.dayOfMonth}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-800 dark:text-white shrink-0">
                    ${fmt(rec.amount)}
                  </span>
                  <ToggleSwitch
                    active={rec.active}
                    onChange={() => toggleRecurring?.(rec.id)}
                  />
                  <button
                    onClick={() => deleteRecurring?.(rec.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-xl transition shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Footer actions */}
      <motion.div
        {...FADE_UP}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm"
      >
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-black mb-1">
            Compromiso mensual (activos)
          </p>
          <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
            ${fmt(totalMonthly)}
          </p>
        </div>
        <button
          onClick={handleRegisterAll}
          disabled={registering || recurringExpenses.filter((r) => r.active).length === 0}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition"
        >
          {registering ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Check size={16} />
          )}
          Registrar todos este mes
        </button>
      </motion.div>

    </div>
  );
}
