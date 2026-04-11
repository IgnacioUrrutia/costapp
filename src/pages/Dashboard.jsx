import React, { useState, useMemo } from 'react';
import {
  Plus, Download, FileText, ChevronRight,
  TrendingUp, TrendingDown, Wallet, RefreshCw,
  CreditCard, AlertTriangle, CheckCircle,
  CalendarDays, Flame, Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer } from 'recharts';

import { useExpenses } from '../context/ExpenseContext';
import { exportExpensesToExcel } from '../utils/excelExport';
import { exportToPDF } from '../utils/pdfExport';
import { formatAmount } from '../utils/format';
import { CATEGORY_ICONS, CHART_COLORS } from '../utils/constants';

import ExpenseList from '../components/Expenses/ExpenseList';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import Modal from '../components/UI/Modal';
import AICoach from '../components/Dashboard/AICoach';
import FinancialTips from '../components/Dashboard/FinancialTips';

// ── Subcomponentes ────────────────────────────────────────

const Label = ({ children }) => (
  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 mb-0">{children}</p>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm ${className}`}>
    {children}
  </div>
);

// Barra de utilización de tarjeta
const UsageBar = ({ used, limit }) => {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black tabular-nums text-slate-500">
          {formatAmount(used)}
          <span className="font-medium text-slate-300 dark:text-slate-600"> / {formatAmount(limit)}</span>
        </span>
        <span className={`text-[10px] font-black tabular-nums ${pct >= 90 ? 'text-rose-500' : pct >= 70 ? 'text-amber-500' : 'text-slate-400'}`}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────

const Dashboard = () => {
  const {
    filteredExpenses: expenses,
    categories,
    salary,
    currentMonthTotal,
    categoryTotals,
    budgets,
    totalIncome,
    filters,
    debitBalance,
    recurringExpenses,
    financialHealth,
    weeklySpendingData,
    financialScore,
    creditCards: allCards,
  } = useExpenses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const handleEditExpense = (e) => { setEditingExpense(e); setIsModalOpen(true); };
  const handleCloseModal  = () => { setIsModalOpen(false); setEditingExpense(null); };
  const handleExport      = () => exportExpensesToExcel(expenses, categories, salary, budgets, categoryTotals);
  const handlePDF         = () => exportToPDF(expenses, salary, budgets, categoryTotals, filters);

  // ── Computadas ──────────────────────────────────────────
  const debitCardsArr  = useMemo(() => (allCards || []).filter(c => c.type === 'debit'),  [allCards]);
  const creditCardsArr = useMemo(() => (allCards || []).filter(c => c.type === 'credit'), [allCards]);

  const totalCreditUsed  = useMemo(() => creditCardsArr.reduce((a, c) => a + (c.usedAmount  || 0), 0), [creditCardsArr]);
  const totalCreditLimit = useMemo(() => creditCardsArr.reduce((a, c) => a + (c.creditLimit || 0), 0), [creditCardsArr]);

  const activeRecurring = useMemo(() => (recurringExpenses || []).filter(r => r.active), [recurringExpenses]);
  const recurringTotal  = useMemo(() => activeRecurring.reduce((a, r) => a + (parseFloat(r.amount) || 0), 0), [activeRecurring]);

  const budgetPct = totalIncome > 0 ? Math.min((currentMonthTotal / totalIncome) * 100, 100) : 0;
  const netAvailable = debitBalance - currentMonthTotal - recurringTotal;

  const topCategories = useMemo(() =>
    Object.entries(categoryTotals)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
  [categoryTotals]);

  const currentMonth = new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  const healthColor =
    financialHealth === 'good'    ? 'text-emerald-500' :
    financialHealth === 'warning' ? 'text-amber-500'   : 'text-rose-500';

  const heroBg = budgetPct > 85
    ? 'from-rose-950 via-slate-900 to-slate-900'
    : 'from-slate-900 via-slate-900 to-indigo-950';

  // ── Proyección fin de mes ────────────────────────────────
  const today = new Date();
  const dayOfMonth = today.getDate();
  const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = totalDaysInMonth - dayOfMonth;
  const dailyAvg = dayOfMonth > 0 ? currentMonthTotal / dayOfMonth : 0;
  const projectedMonthTotal = currentMonthTotal + dailyAvg * daysRemaining;
  const projectedBalance = debitBalance - projectedMonthTotal;

  // ── Racha de presupuesto ─────────────────────────────────
  const dailyBudget = totalIncome > 0 ? totalIncome / totalDaysInMonth : 0;

  const streak = useMemo(() => {
    if (dailyBudget <= 0) return 0;
    const byDay = {};
    expenses.forEach(e => {
      const d = new Date(e.date);
      const key = d.getDate();
      byDay[key] = (byDay[key] || 0) + (e.amount || 0);
    });
    let count = 0;
    for (let d = dayOfMonth; d >= 1; d--) {
      if ((byDay[d] || 0) <= dailyBudget) count++;
      else break;
    }
    return count;
  }, [expenses, dailyBudget, dayOfMonth]);

  // ── Fondo de emergencia ──────────────────────────────────
  const emergencyGoal = salary * 3;
  const emergencyPct  = emergencyGoal > 0 ? Math.min((debitBalance / emergencyGoal) * 100, 100) : 0;

  // ── Gasto de hoy (para racha) ────────────────────────────
  const todaySpent = useMemo(() => {
    const byDay = {};
    expenses.forEach(e => {
      const d = new Date(e.date);
      byDay[d.getDate()] = (byDay[d.getDate()] || 0) + (e.amount || 0);
    });
    return byDay[dayOfMonth] || 0;
  }, [expenses, dayOfMonth]);

  // ── Datos PieChart ───────────────────────────────────────
  const pieData = topCategories.map(([name, value]) => ({ name, value }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pg-container">

      {/* ── Header ────────────────────────────────────────── */}
      <div data-tutorial-id="dashboard-header" className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black capitalize tracking-[0.15em] text-slate-400 mb-0.5">
            {currentMonth}
          </p>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Panel Financiero
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
            <button onClick={handlePDF}    title="PDF"   className="p-2 text-slate-400 hover:text-accent rounded-lg transition-colors"><FileText size={15} /></button>
            <button onClick={handleExport} title="Excel" className="p-2 text-slate-400 hover:text-accent rounded-lg transition-colors"><Download size={15} /></button>
          </div>
          <motion.button
            data-tutorial-id="btn-nuevo-gasto"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 btn-accent rounded-xl font-black text-sm flex items-center gap-2"
          >
            <Plus size={15} strokeWidth={3} /> Nuevo Gasto
          </motion.button>
        </div>
      </div>

      {/* ── Hero: Flujo del Mes ───────────────────────────── */}
      <div data-tutorial-id="hero-balance" className={`bg-gradient-to-br ${heroBg} rounded-2xl p-6 text-white relative overflow-hidden`}>
        {/* Decoración */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/[0.02] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative">
          {/* Top row */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">
                Disponible estimado
              </p>
              <div className="flex items-baseline gap-3">
                <span className={`text-4xl sm:text-5xl font-black tracking-tight ${netAvailable < 0 ? 'text-rose-400' : 'text-white'}`}>
                  {formatAmount(netAvailable)}
                </span>
                {weeklySpendingData.changePct !== null && (
                  <div className={`flex items-center gap-1 text-xs font-black ${weeklySpendingData.changePct <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {weeklySpendingData.changePct <= 0
                      ? <TrendingDown size={13} />
                      : <TrendingUp   size={13} />}
                    {Math.abs(weeklySpendingData.changePct)}% semana
                  </div>
                )}
              </div>
            </div>

            {/* Score badge */}
            <div className="flex flex-col items-end gap-1">
              <div className={`text-2xl font-black ${healthColor}`}>{financialScore}</div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${healthColor}`}>
                {financialHealth === 'good' ? 'Saludable' : financialHealth === 'warning' ? 'Atención' : 'Crítico'}
              </p>
            </div>
          </div>

          {/* Budget bar */}
          <div className="space-y-2">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${budgetPct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${budgetPct > 90 ? 'bg-rose-400' : budgetPct > 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-white/40">
              <span>Gastado {formatAmount(currentMonthTotal)}</span>
              <span className="font-black text-white/60">{budgetPct.toFixed(0)}%</span>
              <span>Ingreso {formatAmount(totalIncome)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Coach ──────────────────────────────────────── */}
      <AICoach />

      {/* ── Educación Financiera ──────────────────────────── */}
      <FinancialTips />

      {/* ── 3 Pilares Financieros ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* DÉBITO */}
        <Card className="p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
              <Wallet size={16} className="text-emerald-500" />
            </div>
            <div className="min-w-0">
              <Label>Cuenta Débito</Label>
              {debitCardsArr[0] && (
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">
                  {debitCardsArr[0].bank} ····{debitCardsArr[0].lastFourDigits}
                </p>
              )}
            </div>
          </div>

          <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-0.5">
            {formatAmount(debitBalance)}
          </p>
          <p className="text-[10px] font-semibold text-slate-400 mb-4">Saldo actual</p>

          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-slate-400">Gastado este mes</span>
              <span className="text-[11px] font-black text-rose-500 tabular-nums">
                -{formatAmount(currentMonthTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-slate-400">Proyección final</span>
              <span className={`text-[11px] font-black tabular-nums ${debitBalance - currentMonthTotal >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatAmount(debitBalance - currentMonthTotal)}
              </span>
            </div>
          </div>
        </Card>

        {/* CRÉDITO */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-violet-50 dark:bg-violet-500/10 rounded-xl shrink-0">
                <CreditCard size={16} className="text-violet-500" />
              </div>
              <div className="min-w-0">
                <Label>Tarjetas Crédito</Label>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {creditCardsArr.length} tarjeta{creditCardsArr.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {totalCreditLimit > 0 && (totalCreditUsed / totalCreditLimit) > 0.80 && (
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
            )}
          </div>

          <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-0.5">
            {formatAmount(totalCreditUsed)}
          </p>
          <p className="text-[10px] font-semibold text-slate-400 mb-4">Total utilizado</p>

          {creditCardsArr.length > 0 ? (
            <div className="space-y-3">
              {creditCardsArr.map(card => (
                <div key={card.id}>
                  <p className="text-[10px] font-bold text-slate-500 mb-1.5 truncate">
                    {card.bank} ····{card.lastFourDigits}
                  </p>
                  <UsageBar used={card.usedAmount || 0} limit={card.creditLimit || 0} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-semibold text-slate-300 dark:text-slate-600">Sin tarjetas registradas</p>
          )}

          {totalCreditLimit > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] font-semibold text-slate-400">Disponible total</span>
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 tabular-nums">
                {formatAmount(totalCreditLimit - totalCreditUsed)}
              </span>
            </div>
          )}
        </Card>

        {/* COMPROMISOS FIJOS */}
        <Card className="p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
              <RefreshCw size={16} className="text-amber-500" />
            </div>
            <div>
              <Label>Compromisos Fijos</Label>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                {activeRecurring.length} recurrentes activos
              </p>
            </div>
          </div>

          <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-0.5">
            {formatAmount(recurringTotal)}
          </p>
          <p className="text-[10px] font-semibold text-slate-400 mb-4">Total mensual fijo</p>

          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            {activeRecurring.length > 0 ? (
              activeRecurring.slice(0, 4).map(r => {
                const Icon = CATEGORY_ICONS[r.category] || Wallet;
                return (
                  <div key={r.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon size={11} className="text-slate-400 shrink-0" />
                      <span className="text-[10px] font-semibold text-slate-500 truncate capitalize">
                        {r.description || r.category}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 tabular-nums shrink-0">
                      -{formatAmount(r.amount)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center gap-1.5 text-slate-300 dark:text-slate-600">
                <CheckCircle size={12} />
                <span className="text-[10px] font-semibold">Sin recurrentes configurados</span>
              </div>
            )}
          </div>
        </Card>

      </div>

      {/* ── Insights: Proyección + Racha + Fondo Emergencia ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Proyección fin de mes */}
        <Card className="p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 bg-sky-50 dark:bg-sky-500/10 rounded-xl">
              <CalendarDays size={16} className="text-sky-500" />
            </div>
            <Label>Proyección fin de mes</Label>
          </div>
          <p className={`text-2xl font-black tracking-tight mb-0.5 ${projectedBalance < 0 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
            {formatAmount(projectedBalance)}
          </p>
          <p className="text-[10px] font-semibold text-slate-400 mb-3">saldo estimado al día {totalDaysInMonth}</p>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-slate-400">Gasto proyectado</span>
              <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 tabular-nums">
                {formatAmount(projectedMonthTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-slate-400">Promedio diario</span>
              <span className="text-[10px] font-black text-slate-400 tabular-nums">
                {formatAmount(Math.round(dailyAvg))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-slate-400">Días restantes</span>
              <span className="text-[10px] font-black text-slate-400 tabular-nums">{daysRemaining}d</span>
            </div>
          </div>
        </Card>

        {/* Racha de presupuesto */}
        <Card className="p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`p-2 rounded-xl ${streak >= 7 ? 'bg-orange-50 dark:bg-orange-500/10' : 'bg-slate-50 dark:bg-slate-800'}`}>
              <Flame size={16} className={streak >= 7 ? 'text-orange-500' : streak >= 3 ? 'text-amber-400' : 'text-slate-400'} />
            </div>
            <Label>Racha de presupuesto</Label>
          </div>
          <p className={`text-4xl font-black tracking-tight mb-0.5 ${streak >= 7 ? 'text-orange-500' : streak >= 3 ? 'text-amber-500' : 'text-slate-800 dark:text-white'}`}>
            {streak}
          </p>
          <p className="text-[10px] font-semibold text-slate-400 mb-3">
            {streak === 1 ? 'día' : 'días'} consecutivos bajo presupuesto
          </p>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-slate-400">Límite diario</span>
              <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 tabular-nums">
                {formatAmount(Math.round(dailyBudget))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-slate-400">Hoy gastado</span>
              <span className={`text-[10px] font-black tabular-nums ${todaySpent > dailyBudget ? 'text-rose-500' : 'text-emerald-500'}`}>
                {formatAmount(todaySpent)}
              </span>
            </div>
          </div>
        </Card>

        {/* Fondo de emergencia */}
        <Card className="p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 bg-teal-50 dark:bg-teal-500/10 rounded-xl">
              <Shield size={16} className="text-teal-500" />
            </div>
            <Label>Fondo de emergencia</Label>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-0.5">
            {formatAmount(debitBalance)}
          </p>
          <p className="text-[10px] font-semibold text-slate-400 mb-3">
            de {formatAmount(emergencyGoal)} (meta 3 meses)
          </p>
          <div className="space-y-1.5">
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${emergencyPct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${emergencyPct >= 100 ? 'bg-emerald-400' : emergencyPct >= 66 ? 'bg-teal-400' : emergencyPct >= 33 ? 'bg-amber-400' : 'bg-rose-400'}`}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span className={`font-black ${emergencyPct >= 100 ? 'text-emerald-500' : emergencyPct >= 66 ? 'text-teal-500' : emergencyPct >= 33 ? 'text-amber-500' : 'text-rose-500'}`}>
                {emergencyPct.toFixed(0)}%
              </span>
              <span>3× sueldo mensual</span>
            </div>
          </div>
        </Card>

      </div>

      {/* ── Analytics: Categorías + Últimos Movimientos ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top categorías + PieChart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Distribución del Gasto
            </p>
            <Link to="/movimientos" className="text-[10px] font-black text-accent hover:opacity-70 transition-opacity uppercase tracking-widest">
              Ver todo
            </Link>
          </div>

          {pieData.length > 0 ? (
            <>
              {/* Mini donut chart */}
              <div className="h-[140px] mb-4 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={62}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RTooltip
                      formatter={(value) => [formatAmount(value), '']}
                      contentStyle={{
                        background: 'var(--tw-bg-opacity, #fff)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '6px 10px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Barras */}
              <div className="space-y-3">
                {topCategories.map(([name, value], i) => {
                  const pct = currentMonthTotal > 0 ? Math.round((value / currentMonthTotal) * 100) : 0;
                  const Icon = CATEGORY_ICONS[name] || Wallet;
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{name}</span>
                          <span className="text-xs font-black text-slate-800 dark:text-white tabular-nums ml-2 shrink-0">
                            {formatAmount(value)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.07 }}
                            className="h-full rounded-full"
                            style={{ background: CHART_COLORS[i % CHART_COLORS.length], opacity: 1 - i * 0.1 }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 w-7 text-right tabular-nums shrink-0">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-36 gap-2 text-slate-300 dark:text-slate-700">
              <Wallet size={28} strokeWidth={1.5} />
              <p className="text-xs font-bold">Sin gastos este mes</p>
            </div>
          )}
        </Card>

        {/* Últimos movimientos */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Últimos Movimientos
            </p>
            <Link to="/movimientos" className="text-[10px] font-black text-accent hover:opacity-70 transition-opacity uppercase tracking-widest">
              Ver todo <ChevronRight size={11} className="inline" />
            </Link>
          </div>
          <ExpenseList limit={5} onEditExpense={handleEditExpense} />
        </Card>

      </div>

      {/* ── Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
            <ExpenseForm onClose={handleCloseModal} initialData={editingExpense} />
          </Modal>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default Dashboard;
