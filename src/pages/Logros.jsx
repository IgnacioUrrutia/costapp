import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Lock, Star, Target, Shield, Flame,
  CreditCard, TrendingDown, Wallet, Calendar, CheckCircle2,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';

const FADE_UP = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function computeStreak(expenses, salary, budgets) {
  const totalBudget = Object.values(budgets || {}).reduce((a, b) => a + b, 0);
  const dailyBudget = totalBudget > 0 ? totalBudget / 30 : (salary || 0) / 30;
  if (!dailyBudget) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayTotal = expenses
      .filter(e => e.date === dateStr)
      .reduce((s, e) => s + (e.amount || 0), 0);
    if (dayTotal <= dailyBudget) streak++;
    else break;
  }
  return streak;
}

const BADGES = [
  {
    id: 'first_expense',
    icon: Star,
    title: 'Primer Paso',
    desc: 'Registraste tu primer gasto',
    color: 'amber',
    check: ({ expenses }) => expenses.length > 0,
  },
  {
    id: 'budget_set',
    icon: Wallet,
    title: 'Presupuestador',
    desc: 'Configuraste al menos un presupuesto por categoría',
    color: 'indigo',
    check: ({ budgets }) => Object.values(budgets || {}).some(v => v > 0),
  },
  {
    id: 'goal_reached',
    icon: Target,
    title: 'Meta Alcanzada',
    desc: 'Completaste una meta de ahorro',
    color: 'emerald',
    check: ({ goals }) => goals.some(g => g.currentAmount >= g.targetAmount && g.targetAmount > 0),
  },
  {
    id: 'no_debts',
    icon: TrendingDown,
    title: 'Libre de Deudas',
    desc: 'No tienes deudas activas registradas',
    color: 'rose',
    check: ({ debts }) => debts.length === 0,
  },
  {
    id: 'streak_7',
    icon: Flame,
    title: '7 Días de Racha',
    desc: '7 días consecutivos dentro del presupuesto',
    color: 'orange',
    check: ({ streak }) => streak >= 7,
  },
  {
    id: 'streak_30',
    icon: Flame,
    title: 'Racha del Mes',
    desc: '30 días consecutivos dentro del presupuesto',
    color: 'red',
    check: ({ streak }) => streak >= 30,
  },
  {
    id: 'emergency_fund',
    icon: Shield,
    title: 'Colchón Inicial',
    desc: 'Tienes al menos 1 mes de gastos en tu fondo de emergencia',
    color: 'sky',
    check: ({ goals, expenses }) => {
      const emFund = goals.find(g =>
        g.isEmergency ||
        g.name?.toLowerCase().includes('emergencia') ||
        g.name?.toLowerCase().includes('emergency')
      );
      if (!emFund) return false;
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const recent = expenses.filter(e => new Date(e.date) >= threeMonthsAgo);
      const monthlyAvg = recent.reduce((a, b) => a + (b.amount || 0), 0) / 3;
      return monthlyAvg > 0 && emFund.currentAmount >= monthlyAvg;
    },
  },
  {
    id: 'multiple_goals',
    icon: Trophy,
    title: 'Planificador',
    desc: 'Tienes 3 o más metas de ahorro activas',
    color: 'violet',
    check: ({ goals }) => goals.length >= 3,
  },
  {
    id: 'month_surplus',
    icon: CheckCircle2,
    title: 'Mes Verde',
    desc: 'Gastaste menos de lo que ingresaste en el mes actual',
    color: 'green',
    check: ({ currentMonthTotal, totalIncome }) =>
      totalIncome > 0 && currentMonthTotal < totalIncome,
  },
  {
    id: 'card_registered',
    icon: CreditCard,
    title: 'Tarjeta Registrada',
    desc: 'Registraste tu primera tarjeta de crédito',
    color: 'slate',
    check: ({ creditCards }) => creditCards.length > 0,
  },
  {
    id: 'consistent_month',
    icon: Calendar,
    title: 'Mes Consistente',
    desc: 'Registraste gastos en al menos 20 días distintos este mes',
    color: 'teal',
    check: ({ expenses }) => {
      const now = new Date();
      const m = now.getMonth();
      const y = now.getFullYear();
      const days = new Set(
        expenses
          .filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === m && d.getFullYear() === y;
          })
          .map(e => e.date)
      );
      return days.size >= 20;
    },
  },
];

const COLOR_MAP = {
  amber:   { bg: 'bg-amber-50 dark:bg-amber-950/30',   icon: 'text-amber-500',   ring: 'ring-amber-500/30',   badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' },
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-950/30', icon: 'text-indigo-500',  ring: 'ring-indigo-500/30',  badge: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: 'text-emerald-500', ring: 'ring-emerald-500/30', badge: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-950/30',     icon: 'text-rose-500',    ring: 'ring-rose-500/30',    badge: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-950/30', icon: 'text-orange-500',  ring: 'ring-orange-500/30',  badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300' },
  red:     { bg: 'bg-red-50 dark:bg-red-950/30',       icon: 'text-red-500',     ring: 'ring-red-500/30',     badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' },
  sky:     { bg: 'bg-sky-50 dark:bg-sky-950/30',       icon: 'text-sky-500',     ring: 'ring-sky-500/30',     badge: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-950/30', icon: 'text-violet-500',  ring: 'ring-violet-500/30',  badge: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300' },
  green:   { bg: 'bg-green-50 dark:bg-green-950/30',   icon: 'text-green-500',   ring: 'ring-green-500/30',   badge: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' },
  slate:   { bg: 'bg-slate-50 dark:bg-slate-800/30',   icon: 'text-slate-500',   ring: 'ring-slate-500/30',   badge: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
  teal:    { bg: 'bg-teal-50 dark:bg-teal-950/30',     icon: 'text-teal-500',    ring: 'ring-teal-500/30',    badge: 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300' },
};

export default function Logros() {
  const {
    expenses, goals, debts, creditCards, budgets,
    salary, currentMonthTotal, totalIncome,
  } = useExpenses();

  const streak = useMemo(
    () => computeStreak(expenses, salary, budgets),
    [expenses, salary, budgets]
  );

  const ctx = {
    expenses, goals, debts, creditCards, budgets,
    salary, streak, currentMonthTotal, totalIncome,
  };

  const evaluated = useMemo(
    () => BADGES.map(b => ({ ...b, unlocked: b.check(ctx) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenses, goals, debts, creditCards, budgets, salary, streak, currentMonthTotal, totalIncome]
  );

  const unlocked = evaluated.filter(b => b.unlocked);
  const locked   = evaluated.filter(b => !b.unlocked);
  const pct = Math.round((unlocked.length / evaluated.length) * 100);

  return (
    <div className="pg-container">
      {/* Header */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4 }}>
        <h1 className="pg-title">Logros</h1>
        <p className="pg-subtitle">Tus hitos financieros — cada uno desbloqueado con acción real</p>
      </motion.div>

      {/* Progress banner */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4, delay: 0.05 }} className="income-total-card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-1">Progreso total</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-white tracking-tighter">{unlocked.length}</span>
              <span className="text-indigo-300 font-bold mb-1">/ {evaluated.length} logros</span>
            </div>
          </div>
          <Trophy size={44} className="text-amber-400 opacity-90" />
        </div>
        <div className="mt-4 h-2 bg-indigo-900/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300"
          />
        </div>
        <p className="text-indigo-300 text-xs font-bold mt-2 text-right">{pct}% completado</p>
      </motion.div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <motion.div {...FADE_UP} transition={{ duration: 0.4, delay: 0.1 }}>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 px-1">
            Desbloqueados · {unlocked.length}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unlocked.map((badge, i) => {
              const colors = COLOR_MAP[badge.color] || COLOR_MAP.slate;
              const Icon = badge.icon;
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                  className={`c-card p-4 flex items-start gap-4 ring-1 ${colors.ring}`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={22} className={colors.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-black text-slate-800 dark:text-white text-sm">{badge.title}</p>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${colors.badge}`}>✓</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">{badge.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <motion.div {...FADE_UP} transition={{ duration: 0.4, delay: 0.15 }}>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 px-1">
            Por desbloquear · {locked.length}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {locked.map((badge, i) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                  className="c-card p-4 flex items-start gap-4 opacity-60"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 relative">
                    <Icon size={22} className="text-slate-300 dark:text-slate-600" />
                    <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-slate-100/60 dark:bg-slate-900/60">
                      <Lock size={14} className="text-slate-400 dark:text-slate-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-400 dark:text-slate-500 text-sm mb-1">{badge.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-600 leading-snug">{badge.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* All done */}
      {unlocked.length === evaluated.length && (
        <motion.div {...FADE_UP} transition={{ duration: 0.4, delay: 0.2 }} className="c-card p-8 text-center">
          <Trophy size={48} className="text-amber-400 mx-auto mb-4" />
          <p className="text-xl font-black text-slate-800 dark:text-white mb-2">¡Logros completados!</p>
          <p className="text-sm text-slate-400">Has desbloqueado todos los logros disponibles. Excelente trabajo.</p>
        </motion.div>
      )}
    </div>
  );
}
