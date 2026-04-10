import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, Plus, Download, FileText,
  Home, Utensils, Truck, HeartPulse, Play, GraduationCap,
  User, CreditCard, PiggyBank, Pencil, Check, X,
  AlertCircle, ChevronRight, Bell, CalendarClock,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useExpenses } from '../context/ExpenseContext';
import { exportExpensesToExcel } from '../utils/excelExport';
import { exportToPDF } from '../utils/pdfExport';
import ExpenseList from '../components/Expenses/ExpenseList';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import Modal from '../components/UI/Modal';

const ICON_MAP = {
  'Vivienda': Home, 'Alimentación': Utensils, 'Transporte': Truck,
  'Salud': HeartPulse, 'Entretenimiento': Play, 'Educación': GraduationCap,
  'Personal': User, 'Financiero': CreditCard, 'Ahorro/Inversión': PiggyBank,
};

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#14b8a6','#475569'];

const fmt = (v) => Number(v || 0).toLocaleString('es-CL');

// ── Editable balance input ────────────────────────────────────────────────────
const EditableBalance = ({ value, onSave, label, placeholder = '0' }) => {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');

  const start = () => { setInput(value > 0 ? value.toString() : ''); setEditing(true); };
  const confirm = async () => {
    const v = parseFloat(input.replace(/\./g, '').replace(',', '.')) || 0;
    await onSave(v);
    setEditing(false);
  };
  const cancel = () => setEditing(false);

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-white/60 font-black text-xl">$</span>
        <input
          autoFocus
          type="text"
          inputMode="numeric"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') cancel(); }}
          className="bg-white/10 text-white font-black text-2xl rounded-xl px-3 py-1 outline-none border border-white/30 w-40"
          placeholder={placeholder}
        />
        <button onClick={confirm} className="p-1.5 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"><Check size={14} /></button>
        <button onClick={cancel} className="p-1.5 bg-white/10 rounded-lg text-white/50 hover:bg-white/20 transition-colors"><X size={14} /></button>
      </div>
    );
  }

  return (
    <button onClick={start} className="flex items-end gap-2 group text-left">
      <span className={`font-black tracking-tighter leading-none ${value > 0 ? 'text-white text-4xl sm:text-5xl' : 'text-white/30 text-3xl'}`}>
        {value > 0 ? `$ ${fmt(value)}` : 'Toca para ingresar'}
      </span>
      <span className="mb-1 p-1.5 rounded-lg bg-white/0 group-hover:bg-white/10 text-white/30 group-hover:text-white/60 transition-all">
        <Pencil size={13} />
      </span>
    </button>
  );
};

// ── Main account hero ─────────────────────────────────────────────────────────
const AccountHero = ({ debitBalance, setDebitBalance, currentMonthTotal, recurringExpenses, totalIncome }) => {
  const activeRecurring = recurringExpenses.filter(r => r.active);
  const recurringTotal = activeRecurring.reduce((a, r) => a + (parseFloat(r.amount) || 0), 0);

  // Two perspectives:
  // 1. Cuenta: what's physically in the bank
  const afterSpending = debitBalance - currentMonthTotal;
  const afterCommitments = afterSpending - recurringTotal;

  // 2. Sueldo: budget vs actual
  const pctSpent = totalIncome > 0 ? Math.min((currentMonthTotal / totalIncome) * 100, 100) : 0;
  const remaining = totalIncome - currentMonthTotal;

  const hasBalance = debitBalance > 0;
  const hasSalary = totalIncome > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      data-tutorial-id="hero-balance"
      className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-950/40 border border-indigo-900/30 relative"
    >
      {/* decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="relative p-6 sm:p-8">
        {/* Top: cuenta bancaria */}
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-200 mb-2">
            Saldo en tu Cuenta
          </p>
          <EditableBalance value={debitBalance} onSave={setDebitBalance} />
          {!hasBalance && (
            <p className="text-indigo-300/60 text-xs font-bold mt-1 flex items-center gap-1">
              <AlertCircle size={11} /> Ingresa tu saldo para ver cuánto te queda
            </p>
          )}
        </div>

        {/* Flow: 3 numbers */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200/70 mb-1">Gastado</p>
            <p className="text-lg font-black text-white">-$ {fmt(currentMonthTotal)}</p>
            <p className="text-[10px] text-indigo-300/60 mt-0.5">este mes</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm border border-amber-400/20">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-300/70 mb-1">Comprometido</p>
            <p className="text-lg font-black text-amber-300">-$ {fmt(recurringTotal)}</p>
            <p className="text-[10px] text-indigo-300/60 mt-0.5">{activeRecurring.length} fijos</p>
          </div>
          <div className={`rounded-2xl p-3.5 backdrop-blur-sm ${hasBalance ? (afterCommitments >= 0 ? 'bg-emerald-500/20 border border-emerald-400/30' : 'bg-rose-500/20 border border-rose-400/30') : 'bg-white/10'}`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200/70 mb-1">Te Quedará</p>
            <p className={`text-lg font-black ${hasBalance ? (afterCommitments >= 0 ? 'text-emerald-300' : 'text-rose-300') : 'text-white/30'}`}>
              {hasBalance ? `$ ${fmt(afterCommitments)}` : '—'}
            </p>
            <p className="text-[10px] text-indigo-300/60 mt-0.5">fin de mes</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-white/10 mb-5" />

        {/* Bottom: sueldo progress */}
        {hasSalary ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-indigo-200">Presupuesto mensual</p>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-white">$ {fmt(currentMonthTotal)}</span>
                <span className="text-indigo-300/60 text-xs">/</span>
                <span className="text-xs font-bold text-indigo-300">$ {fmt(totalIncome)}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  pctSpent > 100 ? 'bg-rose-500/30 text-rose-300' :
                  pctSpent > 80 ? 'bg-amber-500/30 text-amber-300' :
                  'bg-emerald-500/30 text-emerald-300'
                }`}>
                  {pctSpent.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pctSpent}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className={`h-full rounded-full ${pctSpent > 100 ? 'bg-rose-400' : pctSpent > 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-indigo-300/50">
              <span>$ 0</span>
              <span className={remaining >= 0 ? 'text-emerald-300/70' : 'text-rose-300/70'}>
                {remaining >= 0 ? `Disponible: $ ${fmt(remaining)}` : `Excedido: $ ${fmt(Math.abs(remaining))}`}
              </span>
            </div>
          </div>
        ) : (
          <Link to="/config" className="flex items-center justify-between group">
            <p className="text-sm font-bold text-indigo-300/60">Configura tu sueldo para ver el presupuesto</p>
            <span className="flex items-center gap-1 text-indigo-300/60 group-hover:text-white transition-colors text-xs font-black">
              Configurar <ChevronRight size={12} />
            </span>
          </Link>
        )}

        {/* Recurring pills */}
        {activeRecurring.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {activeRecurring.slice(0, 4).map(r => {
              const Icon = ICON_MAP[r.category] || Wallet;
              return (
                <div key={r.id} className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full">
                  <Icon size={10} className="text-amber-300" />
                  <span className="text-[10px] font-bold text-indigo-100">{r.description || r.category}</span>
                  <span className="text-[10px] font-black text-white">$ {fmt(r.amount)}</span>
                </div>
              );
            })}
            {activeRecurring.length > 4 && (
              <div className="bg-white/10 px-2.5 py-1 rounded-full">
                <span className="text-[10px] font-bold text-indigo-300">+{activeRecurring.length - 4} más</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const {
    filteredExpenses: expenses,
    categories,
    salary,
    currentMonthTotal,
    categoryTotals,
    budgets,
    realAvailable,
    totalIncome,
    totalDebtPayment,
    filters,
    debitBalance,
    setDebitBalance,
    recurringExpenses,
    upcomingDueDebt,
    financialHealth,
    weeklySpendingData,
    financialScore,
    balanceProjection,
  } = useExpenses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const handleEditExpense = (expense) => { setEditingExpense(expense); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingExpense(null); };

  const { pieData, topCat, topCatAmt } = useMemo(() => {
    const pieData = Object.entries(categoryTotals)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    let topCat = '—', topCatAmt = 0;
    pieData.forEach(({ name, value }) => { if (value > topCatAmt) { topCatAmt = value; topCat = name; } });
    return { pieData, topCat, topCatAmt };
  }, [categoryTotals]);

  const hasBudgets = Object.values(budgets).some((v) => v > 0);
  const catWithBudget = categories.filter(c => (budgets[c.name] || 0) > 0 || (categoryTotals[c.name] || 0) > 0);

  const handleExport = () => exportExpensesToExcel(expenses, categories, salary, budgets, categoryTotals);
  const handlePDF = () => exportToPDF(expenses, salary, budgets, categoryTotals, filters);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">

      {/* Header */}
      <div data-tutorial-id="dashboard-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            Panel de Control
          </h1>
          <p className="text-slate-400 font-medium mt-0.5 text-sm">Tu situación financiera de hoy.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePDF}
            className="px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-500 rounded-xl font-bold shadow-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs"
          >
            <FileText size={14} /> PDF
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-500 rounded-xl font-bold shadow-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs"
          >
            <Download size={14} /> Excel
          </button>
          <motion.button
            data-tutorial-id="btn-nuevo-gasto"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center gap-2 text-sm"
          >
            <Plus size={16} strokeWidth={3} /> Nuevo Gasto
          </motion.button>
        </div>
      </div>

      {/* Main hero: account + budget */}
      <AccountHero
        debitBalance={debitBalance}
        setDebitBalance={setDebitBalance}
        currentMonthTotal={currentMonthTotal}
        recurringExpenses={recurringExpenses}
        totalIncome={totalIncome}
      />

      {/* Score + Semáforo + Próximo vencimiento + Comparación semanal */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

        {/* Score financiero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm flex flex-col items-center justify-center gap-2 col-span-1"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Score Financiero</p>
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3"
                className="text-slate-100 dark:text-slate-800" />
              <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${financialScore} 100`}
                className={financialScore >= 70 ? 'text-emerald-500' : financialScore >= 40 ? 'text-amber-500' : 'text-rose-500'}
                stroke="currentColor" />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-lg font-black ${
              financialScore >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
              financialScore >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
            }`}>{financialScore}</span>
          </div>
          <p className={`text-xs font-bold ${
            financialScore >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
            financialScore >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {financialScore >= 70 ? 'Excelente' : financialScore >= 40 ? 'Regular' : 'Crítico'}
          </p>
        </motion.div>

        {/* Salud financiera */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`rounded-3xl border p-5 shadow-sm flex items-center gap-4 ${
            financialHealth === 'good'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
              : financialHealth === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            financialHealth === 'good' ? 'bg-emerald-500' :
            financialHealth === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
          }`}>
            <span className="text-2xl">
              {financialHealth === 'good' ? '🟢' : financialHealth === 'warning' ? '🟡' : '🔴'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Salud Financiera</p>
            <p className={`text-sm font-black ${
              financialHealth === 'good' ? 'text-emerald-700 dark:text-emerald-300' :
              financialHealth === 'warning' ? 'text-amber-700 dark:text-amber-300' : 'text-rose-700 dark:text-rose-300'
            }`}>
              {financialHealth === 'good' ? 'Todo en orden' :
               financialHealth === 'warning' ? 'Atención requerida' : 'Situación crítica'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight">
              {financialHealth === 'good' ? 'Gastos dentro del presupuesto' :
               financialHealth === 'warning' ? 'Vencimiento próximo o >80% gastado' :
               'Gastos superan ingresos o cupo agotado'}
            </p>
          </div>
        </motion.div>

        {/* Próximo vencimiento */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm flex items-center gap-4"
        >
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 rounded-2xl shrink-0">
            <CalendarClock size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Próximo Vencimiento</p>
            {upcomingDueDebt ? (() => {
              const diff = Math.ceil(
                (new Date(upcomingDueDebt.dueDate + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24)
              );
              return (
                <>
                  <p className="text-sm font-black text-slate-800 dark:text-white truncate">{upcomingDueDebt.name}</p>
                  <p className={`text-[10px] font-bold mt-0.5 ${diff <= 7 ? 'text-rose-500' : 'text-amber-500'}`}>
                    {diff === 0 ? '¡Vence hoy!' : `En ${diff} día${diff > 1 ? 's' : ''} — $${fmt(upcomingDueDebt.monthlyPayment)}`}
                  </p>
                </>
              );
            })() : (
              <p className="text-sm font-bold text-slate-400">Sin vencimientos próximos</p>
            )}
          </div>
        </motion.div>

        {/* Comparación semanal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.21 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm flex items-center gap-4"
        >
          <div className={`p-3 rounded-2xl shrink-0 ${
            weeklySpendingData.changePct === null ? 'bg-slate-100 dark:bg-slate-800' :
            weeklySpendingData.changePct <= 0 ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-rose-50 dark:bg-rose-950'
          }`}>
            {weeklySpendingData.changePct !== null && weeklySpendingData.changePct <= 0
              ? <TrendingDown size={20} className="text-emerald-600 dark:text-emerald-400" />
              : <TrendingUp size={20} className={weeklySpendingData.changePct === null ? 'text-slate-400' : 'text-rose-600 dark:text-rose-400'} />
            }
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Esta Semana</p>
            <p className="text-sm font-black text-slate-800 dark:text-white">
              ${fmt(weeklySpendingData.thisWeek)}
            </p>
            {weeklySpendingData.changePct !== null ? (
              <p className={`text-[10px] font-bold mt-0.5 ${weeklySpendingData.changePct <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {weeklySpendingData.changePct <= 0
                  ? `${Math.abs(weeklySpendingData.changePct)}% menos que la semana pasada`
                  : `${weeklySpendingData.changePct}% más que la semana pasada`}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Sin datos semana anterior</p>
            )}
          </div>
        </motion.div>

        {/* Proyección de saldo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm flex items-center gap-3 col-span-1"
        >
          <div className={`p-3 rounded-2xl shrink-0 ${
            !balanceProjection ? 'bg-slate-100 dark:bg-slate-800' :
            balanceProjection.projectedEnd >= 0 ? 'bg-teal-50 dark:bg-teal-950' : 'bg-rose-50 dark:bg-rose-950'
          }`}>
            <Wallet size={18} className={
              !balanceProjection ? 'text-slate-400' :
              balanceProjection.projectedEnd >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
            } />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Fin de Mes</p>
            {balanceProjection ? (
              <>
                <p className={`text-sm font-black truncate ${balanceProjection.projectedEnd >= 0 ? 'text-slate-800 dark:text-white' : 'text-rose-600'}`}>
                  {balanceProjection.projectedEnd >= 0
                    ? `$${fmt(balanceProjection.projectedEnd)}`
                    : `−$${fmt(Math.abs(balanceProjection.projectedEnd))}`}
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {balanceProjection.projectedEnd < 0
                    ? `Sin saldo en ~${balanceProjection.daysUntilZero} días`
                    : `Quema $${fmt(balanceProjection.dailyBurn)}/día`}
                </p>
              </>
            ) : (
              <p className="text-sm font-bold text-slate-400">Sin saldo ingresado</p>
            )}
          </div>
        </motion.div>

      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
            <ExpenseForm onClose={handleCloseModal} initialData={editingExpense} />
          </Modal>
        )}
      </AnimatePresence>

      {/* Middle row: pie + budget bars */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Pie chart — 2/5 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col"
        >
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Por categoría</p>
          {pieData.length > 0 ? (
            <>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={5} dataKey="value" stroke="none">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={5} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 12 }}
                      formatter={(v) => [`$ ${fmt(v)}`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5">
                {pieData.slice(0, 4).map(({ name, value }, i) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">$ {fmt(value)}</span>
                  </div>
                ))}
                {pieData.length > 4 && (
                  <p className="text-[10px] text-slate-400 font-bold pl-4">+{pieData.length - 4} categorías más</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-300 dark:text-slate-600 text-sm font-bold">
              Sin gastos este período
            </div>
          )}
        </motion.div>

        {/* Budget bars — 3/5 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Presupuesto vs real</p>
            {!hasBudgets && (
              <Link to="/config" className="text-[10px] font-black text-indigo-500 hover:text-indigo-400 flex items-center gap-1">
                Configurar <ChevronRight size={10} />
              </Link>
            )}
          </div>

          {catWithBudget.length > 0 ? (
            <div className="space-y-4">
              {catWithBudget.slice(0, 6).map(cat => {
                const spent = categoryTotals[cat.name] || 0;
                const budget = budgets[cat.name] || 0;
                const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
                const over = budget > 0 && spent > budget;
                const Icon = ICON_MAP[cat.name] || Wallet;
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon size={12} className="text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-black">
                        <span className={over ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}>$ {fmt(spent)}</span>
                        {budget > 0 && <span className="text-slate-300 dark:text-slate-600">/ $ {fmt(budget)}</span>}
                      </div>
                    </div>
                    {budget > 0 && (
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                          className={`h-full rounded-full ${over ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-300 dark:text-slate-600 text-sm font-bold h-32">
              Sin datos este período
            </div>
          )}

          {/* Quick summary row */}
          {totalIncome > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3">
              {[
                { label: 'Ingresos', value: `$ ${fmt(totalIncome)}`, color: 'text-indigo-600 dark:text-indigo-400' },
                { label: 'Gastos', value: `$ ${fmt(currentMonthTotal)}`, color: 'text-rose-500' },
                { label: 'Disponible', value: realAvailable !== null ? `$ ${fmt(realAvailable)}` : '—', color: realAvailable !== null && realAvailable < 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{s.label}</p>
                  <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent transactions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Últimos movimientos</p>
          <Link to="/movimientos" className="text-[10px] font-black text-indigo-500 hover:text-indigo-400 flex items-center gap-1">
            Ver todos <ChevronRight size={10} />
          </Link>
        </div>
        <ExpenseList limit={6} onEditExpense={handleEditExpense} />
      </motion.div>

    </motion.div>
  );
};

export default Dashboard;
