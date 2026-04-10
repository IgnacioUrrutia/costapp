import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2, Award, TrendingUp } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';

const fmt = (v) => Number(v || 0).toLocaleString('es-CL');

const FADE_UP = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const PRESET_EMOJIS = ['🏠', '🚗', '✈️', '🎓', '💻', '🏖️', '💍', '🐾', '🏋️', '📱', '🎸', '🌱'];

const GOAL_COLORS = [
  'from-indigo-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-sky-500 to-cyan-500',
  'from-violet-500 to-fuchsia-500',
];

const emptyForm = () => ({
  name: '',
  targetAmount: '',
  deadline: '',
  icon: '🎯',
  color: GOAL_COLORS[0],
});

// Progress bar with gradient
const GoalProgress = ({ current, target, color }) => {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const done = pct >= 100;
  return (
    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${done ? 'from-emerald-400 to-emerald-600' : color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  );
};

// Days remaining badge
const DaysRemaining = ({ deadline }) => {
  if (!deadline) return null;
  const due = new Date(deadline + 'T00:00:00');
  const now = new Date();
  const days = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (days < 0) {
    return <span className="text-xs font-bold text-rose-500">Vencida</span>;
  }
  if (days === 0) {
    return <span className="text-xs font-bold text-amber-500">¡Hoy!</span>;
  }
  const color = days <= 30 ? 'text-amber-500' : 'text-slate-400';
  return (
    <span className={`text-xs font-bold ${color}`}>
      {days} {days === 1 ? 'día' : 'días'} restantes
    </span>
  );
};

export default function Metas() {
  const {
    goals = [],
    addGoal,
    deleteGoal,
    contributeToGoal,
  } = useExpenses();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [contributeId, setContributeId] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');

  const totalSaved = useMemo(
    () => goals.reduce((acc, g) => acc + (g.currentAmount || 0), 0),
    [goals]
  );
  const totalTarget = useMemo(
    () => goals.reduce((acc, g) => acc + (g.targetAmount || 0), 0),
    [goals]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.targetAmount) return;
    addGoal?.({
      name: form.name.trim(),
      targetAmount: parseFloat(form.targetAmount) || 0,
      currentAmount: 0,
      deadline: form.deadline,
      icon: form.icon,
      color: form.color,
    });
    setForm(emptyForm());
    setShowForm(false);
  };

  const handleContribute = (e) => {
    e.preventDefault();
    if (!contributeAmount || !contributeId) return;
    contributeToGoal?.(contributeId, parseFloat(contributeAmount) || 0);
    setContributeId(null);
    setContributeAmount('');
  };

  const inputClass =
    'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6">

      {/* Header */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4 }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 data-tutorial-id="metas-title" className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Metas de Ahorro
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Visualiza y alcanza tus objetivos financieros
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition"
          >
            <Plus size={16} /> Nueva Meta
          </button>
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div
        {...FADE_UP}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 rounded-2xl shrink-0">
            <TrendingUp size={20} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Ahorrado</p>
            <p className="text-xl font-black text-slate-800 dark:text-white">${fmt(totalSaved)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-2xl shrink-0">
            <Target size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Objetivos</p>
            <p className="text-xl font-black text-slate-800 dark:text-white">${fmt(totalTarget)}</p>
          </div>
        </div>
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
              <h3 className="font-black text-slate-800 dark:text-white">Nueva Meta de Ahorro</h3>

              {/* Emoji picker */}
              <div>
                <p className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider">Icono</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm({ ...form, icon: emoji })}
                      className={`text-xl p-2 rounded-xl border-2 transition ${
                        form.icon === emoji
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                          : 'border-transparent bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <p className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider">Color</p>
                <div className="flex gap-2">
                  {GOAL_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-xl bg-gradient-to-r ${c} transition ${
                        form.color === c ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nombre de la meta"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  required
                />
                <input
                  type="number"
                  placeholder="Monto objetivo"
                  min="0"
                  step="0.01"
                  value={form.targetAmount}
                  onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                  className={inputClass}
                  required
                />
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className={inputClass}
                />
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
                  Crear Meta
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals grid */}
      {goals.length === 0 ? (
        <motion.div
          {...FADE_UP}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-12 flex flex-col items-center text-slate-400"
        >
          <Target size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Sin metas de ahorro</p>
          <p className="text-xs mt-1">Crea tu primera meta financiera</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence initial={false}>
            {goals.map((goal, i) => {
              const pct = goal.targetAmount > 0
                ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                : 0;
              const done = pct >= 100;
              const isContributing = contributeId === goal.id;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-sm transition-shadow ${
                    done
                      ? 'border-emerald-200 dark:border-emerald-800 shadow-emerald-500/10 shadow-lg'
                      : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${goal.color} flex items-center justify-center text-2xl shadow-sm`}>
                        {goal.icon}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 dark:text-white">
                          {goal.name}
                        </h3>
                        <DaysRemaining deadline={goal.deadline} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {done && (
                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                          <Award size={14} className="text-emerald-600" />
                        </div>
                      )}
                      <button
                        onClick={() => deleteGoal?.(goal.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-white">
                        ${fmt(goal.currentAmount)}
                      </span>
                      <span className="text-slate-400">
                        ${fmt(goal.targetAmount)}
                      </span>
                    </div>
                    <GoalProgress
                      current={goal.currentAmount}
                      target={goal.targetAmount}
                      color={goal.color}
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{pct.toFixed(1)}% completado</span>
                      <span>
                        Faltan ${fmt(Math.max(goal.targetAmount - goal.currentAmount, 0))}
                      </span>
                    </div>
                  </div>

                  {/* Contribute */}
                  {!done && (
                    <AnimatePresence>
                      {isContributing ? (
                        <motion.form
                          key="form"
                          onSubmit={handleContribute}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Monto a abonar"
                              min="0"
                              step="0.01"
                              value={contributeAmount}
                              onChange={(e) => setContributeAmount(e.target.value)}
                              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl transition"
                            >
                              Abonar
                            </button>
                            <button
                              type="button"
                              onClick={() => setContributeId(null)}
                              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm font-bold rounded-2xl transition"
                            >
                              ✕
                            </button>
                          </div>
                        </motion.form>
                      ) : (
                        <motion.button
                          key="btn"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => setContributeId(goal.id)}
                          className={`w-full py-2.5 rounded-2xl text-sm font-bold transition bg-gradient-to-r ${goal.color} text-white hover:opacity-90`}
                        >
                          + Abonar a esta meta
                        </motion.button>
                      )}
                    </AnimatePresence>
                  )}

                  {done && (
                    <div className="flex items-center justify-center gap-2 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                      <Award size={16} className="text-emerald-600" />
                      <span className="text-sm font-black text-emerald-600">
                        ¡Meta alcanzada!
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
