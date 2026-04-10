import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Wallet, TrendingUp, DollarSign, Save, X,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { parseAmount } from '../utils/format';

const fmt = (v) => Number(v || 0).toLocaleString('es-CL');

const FADE_UP = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// ---------- local state helpers ----------
const emptyIncome = () => ({
  description: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
});

export default function Ingresos() {
  const {
    salary, setSalary,
    additionalIncomes = [],
    addIncome,
    deleteIncome,
  } = useExpenses();

  const [salaryInput, setSalaryInput] = useState(salary > 0 ? String(salary) : '');
  const [editingSalary, setEditingSalary] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyIncome());

  const totalAdditional = useMemo(
    () => additionalIncomes.reduce((acc, inc) => acc + (inc.amount || 0), 0),
    [additionalIncomes]
  );
  const totalIncome = (salary || 0) + totalAdditional;

  // Sync salary input when context value loads
  React.useEffect(() => {
    if (!editingSalary) setSalaryInput(salary > 0 ? String(salary) : '');
  }, [salary, editingSalary]);

  const handleSaveSalary = () => {
    setSalary(parseAmount(salaryInput));
    setEditingSalary(false);
  };

  const handleAddIncome = (e) => {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return;
    addIncome?.({
      description: form.description.trim(),
      amount: parseAmount(form.amount) || 0,
      date: form.date,
    });
    setForm(emptyIncome());
    setShowForm(false);
  };

  const inputClass =
    'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6">

      {/* Header */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4 }}>
        <h1 data-tutorial-id="ingresos-title" className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
          Ingresos del Mes
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Administra tu sueldo y otros ingresos adicionales
        </p>
      </motion.div>

      {/* Sueldo principal */}
      <motion.div
        {...FADE_UP}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 rounded-2xl">
            <Wallet size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="font-black text-slate-800 dark:text-white text-lg">Sueldo Principal</h2>
            <p className="text-xs text-slate-400">Ingreso mensual fijo</p>
          </div>
        </div>

        {editingSalary ? (
          <div className="flex gap-3 items-center">
            <input
              type="text"
              inputMode="numeric"
              value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value)}
              placeholder="0"
              className={inputClass + ' flex-1'}
              autoFocus
            />
            <button
              onClick={handleSaveSalary}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-sm font-bold transition"
            >
              <Save size={15} /> Guardar
            </button>
            <button
              onClick={() => setEditingSalary(false)}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
              ${fmt(salary)}
            </span>
            <button
              onClick={() => setEditingSalary(true)}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-bold transition"
            >
              Editar
            </button>
          </div>
        )}
      </motion.div>

      {/* Ingresos adicionales */}
      <motion.div
        {...FADE_UP}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-2xl">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 dark:text-white text-lg">Ingresos Adicionales</h2>
              <p className="text-xs text-slate-400">Freelance, bonos, comisiones…</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl text-sm font-bold transition"
          >
            <Plus size={15} /> Agregar
          </button>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              onSubmit={handleAddIncome}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Descripción (ej: Freelance)"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={inputClass + ' sm:col-span-1'}
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
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Income list */}
        {additionalIncomes.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">
            No hay ingresos adicionales registrados
          </p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {additionalIncomes.map((inc) => (
                <motion.div
                  key={inc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3"
                >
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                    <DollarSign size={15} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                      {inc.description}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(inc.date + 'T00:00:00').toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <span className="text-sm font-black text-emerald-600 shrink-0">
                    +${fmt(inc.amount)}
                  </span>
                  <button
                    onClick={() => deleteIncome?.(inc.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-xl transition shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Summary card */}
      <motion.div
        {...FADE_UP}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-indigo-600 rounded-3xl p-6 shadow-lg shadow-indigo-500/20"
      >
        <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-4">
          Total Ingresos del Mes
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-200 text-sm">
              <Wallet size={14} />
              <span>Sueldo:</span>
              <span className="font-bold text-white">${fmt(salary)}</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-200 text-sm">
              <TrendingUp size={14} />
              <span>Adicionales:</span>
              <span className="font-bold text-white">${fmt(totalAdditional)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-xs uppercase tracking-wider mb-1">Total</p>
            <p className="text-4xl font-black text-white tracking-tighter">
              ${fmt(totalIncome)}
            </p>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
