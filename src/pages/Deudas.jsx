import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, AlertTriangle, CheckCircle, Plus, Trash2, Wallet, Landmark, Calculator,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { parseAmount } from '../utils/format';

const fmt = (v) => Number(v || 0).toLocaleString('es-CL');

const FADE_UP = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const DEBT_TYPES = ['Tarjeta', 'Préstamo', 'Cuota', 'Otro'];

const TYPE_COLORS = {
  Tarjeta: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  Préstamo: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
  Cuota: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  Otro: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
};

const emptyForm = () => ({
  name: '',
  totalAmount: '',
  remainingAmount: '',
  monthlyPayment: '',
  installmentsCount: '',
  startDate: new Date().toISOString().slice(0, 7), // YYYY-MM
  dueDate: '',
  category: 'Tarjeta',
  creditCardId: '',
  useInstallments: false,
});

// Progress bar
const DebtProgress = ({ total, remaining }) => {
  const paid = total - remaining;
  const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  return (
    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full bg-indigo-500 rounded-full transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const getDebtStatus = (dueDate) => {
  if (!dueDate) return 'normal';
  const due = new Date(dueDate + 'T00:00:00');
  const now = new Date();
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 30) return 'near';
  return 'normal';
};

const STATUS_BORDER = {
  overdue: 'border-l-4 border-l-rose-500',
  near: 'border-l-4 border-l-amber-500',
  normal: '',
};

const STATUS_ICON_COLOR = {
  overdue: 'text-rose-500',
  near: 'text-amber-500',
  normal: 'text-slate-400',
};

export default function Deudas() {
  const {
    debts = [],
    addDebt,
    deleteDebt,
    payDebt,
    creditCards = [],
  } = useExpenses();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  // { debtId, accountId } — null = no pendiente
  const [payPending, setPayPending] = useState(null);
  // calculadora: debtId abierta
  const [calcOpen, setCalcOpen] = useState(null);
  const [extraPayment, setExtraPayment] = useState('');

  // ── Cálculo automático de cuotas ─────────────────────────────────────────────
  const autoMonthly = useMemo(() => {
    if (!form.useInstallments) return null;
    const total = parseAmount(form.totalAmount) || 0;
    const n = parseInt(form.installmentsCount) || 0;
    return n > 0 ? Math.round(total / n) : null;
  }, [form.useInstallments, form.totalAmount, form.installmentsCount]);

  const autoDueDate = useMemo(() => {
    if (!form.useInstallments || !form.startDate || !form.installmentsCount) return '';
    const [y, m] = form.startDate.split('-').map(Number);
    const n = parseInt(form.installmentsCount) || 0;
    if (n <= 0) return '';
    const end = new Date(y, m - 1 + n, 1);
    return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-01`;
  }, [form.useInstallments, form.startDate, form.installmentsCount]);

  const totalRemaining = useMemo(
    () => debts.reduce((acc, d) => acc + (d.remainingAmount || 0), 0),
    [debts]
  );
  const totalMonthlyPayment = useMemo(
    () => debts.reduce((acc, d) => acc + (d.monthlyPayment || 0), 0),
    [debts]
  );
  const paidThisMonth = useMemo(
    () => debts.filter((d) => d.paidThisMonth).length,
    [debts]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const total = parseAmount(form.totalAmount) || 0;
    const monthly = form.useInstallments && autoMonthly ? autoMonthly : (parseAmount(form.monthlyPayment) || 0);
    const dueDate = form.useInstallments ? autoDueDate : form.dueDate;

    addDebt?.({
      name: form.name.trim(),
      totalAmount: total,
      remainingAmount: parseAmount(form.remainingAmount) || total,
      monthlyPayment: monthly,
      installmentsCount: form.useInstallments ? (parseInt(form.installmentsCount) || null) : null,
      startDate: form.useInstallments ? form.startDate : null,
      dueDate,
      category: form.category,
      creditCardId: form.creditCardId,
      paid: false,
    });
    setForm(emptyForm());
    setShowForm(false);
  };

  // Iniciar flujo de pago — primero pedir cuenta
  const handlePayClick = (debtId) => {
    setPayPending({ debtId, accountId: '' });
  };

  const confirmPay = async () => {
    if (!payPending) return;
    const fromId = payPending.accountId || null;
    await payDebt?.(payPending.debtId, fromId);
    setPayPending(null);
  };

  const debitCards = creditCards.filter(c => c.type === 'debit');

  const inputClass =
    'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6">

      {/* Header */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4 }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 data-tutorial-id="deudas-title" className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Deudas y Compromisos
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Control de tus deudas y pagos pendientes
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition"
          >
            <Plus size={16} /> Nueva Deuda
          </button>
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div
        {...FADE_UP}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          {
            label: 'Total Deudas',
            value: `$${fmt(totalRemaining)}`,
            icon: CreditCard,
            color: 'bg-rose-50 dark:bg-rose-950 text-rose-600',
          },
          {
            label: 'Pago Mensual',
            value: `$${fmt(totalMonthlyPayment)}`,
            icon: Wallet,
            color: 'bg-amber-50 dark:bg-amber-950 text-amber-600',
          },
          {
            label: 'Pagadas Este Mes',
            value: `${paidThisMonth} / ${debts.length}`,
            icon: CheckCircle,
            color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center gap-4"
          >
            <div className={`p-3 rounded-2xl shrink-0 ${card.color}`}>
              <card.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                {card.label}
              </p>
              <p className="text-xl font-black text-slate-800 dark:text-white">
                {card.value}
              </p>
            </div>
          </div>
        ))}
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
              <h3 className="font-black text-slate-800 dark:text-white">Nueva Deuda</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nombre (ej: Tarjeta Visa)"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  required
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={inputClass}
                >
                  {DEBT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Monto total"
                  value={form.totalAmount}
                  onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                  className={inputClass}
                  required
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Saldo restante (opcional)"
                  value={form.remainingAmount}
                  onChange={(e) => setForm({ ...form, remainingAmount: e.target.value })}
                  className={inputClass}
                />
              </div>

              {/* Toggle cuotas */}
              <div className={`rounded-2xl border p-4 space-y-3 transition-all ${
                form.useInstallments
                  ? 'bg-violet-50/60 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800/50'
                  : 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={15} className={form.useInstallments ? 'text-violet-500' : 'text-slate-400'} />
                    <span className={`text-sm font-bold ${form.useInstallments ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500'}`}>
                      Pago en Cuotas
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, useInstallments: !form.useInstallments })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.useInstallments ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      form.useInstallments ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <AnimatePresence>
                  {form.useInstallments && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-violet-500 block mb-1">
                            N° de cuotas
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="12"
                            value={form.installmentsCount}
                            onChange={(e) => setForm({ ...form, installmentsCount: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-violet-500 block mb-1">
                            Mes de inicio
                          </label>
                          <input
                            type="month"
                            value={form.startDate}
                            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                      </div>
                      {autoMonthly && (
                        <div className="mt-3 bg-white dark:bg-slate-900 rounded-xl p-3 border border-violet-100 dark:border-violet-800/30">
                          <p className="text-xs font-bold text-violet-600 dark:text-violet-400">
                            Cuota mensual calculada: <span className="text-violet-700 dark:text-violet-300 font-black">$ {fmt(autoMonthly)}</span>
                          </p>
                          {autoDueDate && (
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                              Fecha de término aprox.: {new Date(autoDueDate + 'T00:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pago manual (sin cuotas) */}
              {!form.useInstallments && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Pago mensual"
                    value={form.monthlyPayment}
                    onChange={(e) => setForm({ ...form, monthlyPayment: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    type="date"
                    placeholder="Fecha límite"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
              )}

              {/* Card selector */}
              {creditCards.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Vincular tarjeta (opcional)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, creditCardId: '' })}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-bold transition text-left ${
                        form.creditCardId === ''
                          ? 'border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                          : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <Wallet size={15} className="shrink-0" />
                      Sin tarjeta
                    </button>
                    {creditCards.map((card) => {
                      const isDebit = card.type === 'debit';
                      const selected = form.creditCardId === card.id;
                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => setForm({ ...form, creditCardId: card.id })}
                          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-bold transition text-left ${
                            selected
                              ? isDebit
                                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                : 'border-blue-400 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          {isDebit ? <Landmark size={15} className="shrink-0" /> : <CreditCard size={15} className="shrink-0" />}
                          <span className="truncate">{card.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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

      {/* Debt list */}
      <motion.div
        {...FADE_UP}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-3"
      >
        {debts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-12 flex flex-col items-center text-slate-400">
            <CheckCircle size={40} className="mb-3 opacity-30" />
            <p className="text-sm">¡Sin deudas registradas!</p>
            <p className="text-xs mt-1">Agrega tus compromisos financieros</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {debts.map((debt, i) => {
              const status = getDebtStatus(debt.dueDate);
              const paid = debt.totalAmount - debt.remainingAmount;
              const pct = debt.totalAmount > 0 ? Math.round((paid / debt.totalAmount) * 100) : 0;
              const StatusIcon = status === 'overdue' || status === 'near' ? AlertTriangle : CheckCircle;
              const linkedCard = debt.creditCardId
                ? creditCards.find((c) => c.id === debt.creditCardId)
                : null;
              const isPaying = payPending?.debtId === debt.id;

              return (
                <motion.div
                  key={debt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm ${STATUS_BORDER[status]}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0">
                      <CreditCard size={18} className="text-slate-600 dark:text-slate-300" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white">
                          {debt.name}
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[debt.category] || TYPE_COLORS.Otro}`}>
                          {debt.category}
                        </span>
                        {debt.installmentsCount && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                            {debt.installmentsCount} cuotas
                          </span>
                        )}
                        {debt.paid && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                            Pagado
                          </span>
                        )}
                        {linkedCard && (
                          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            linkedCard.type === 'debit'
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                          }`}>
                            {linkedCard.type === 'debit' ? <Landmark size={9} /> : <CreditCard size={9} />}
                            {linkedCard.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mb-3 flex-wrap">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Restante</p>
                          <p className="text-lg font-black text-slate-800 dark:text-white">
                            ${fmt(debt.remainingAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cuota mensual</p>
                          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                            ${fmt(debt.monthlyPayment)}
                          </p>
                        </div>
                        {debt.dueDate && (
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vencimiento</p>
                            <p className={`text-sm font-bold ${STATUS_ICON_COLOR[status]}`}>
                              {new Date(debt.dueDate + 'T00:00:00').toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Pagado {pct}%</span>
                          <span>${fmt(paid)} / ${fmt(debt.totalAmount)}</span>
                        </div>
                        <DebtProgress total={debt.totalAmount} remaining={debt.remainingAmount} />
                      </div>

                      {/* Account selector when paying */}
                      <AnimatePresence>
                        {isPaying && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 overflow-hidden"
                          >
                            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3">
                              <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                ¿De qué cuenta sale el dinero?
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPayPending({ ...payPending, accountId: '' })}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                                    payPending.accountId === ''
                                      ? 'border-slate-400 bg-white dark:bg-slate-700 text-slate-700 dark:text-white'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-400'
                                  }`}
                                >
                                  <Wallet size={13} /> No especificar
                                </button>
                                {debitCards.map(card => (
                                  <button
                                    key={card.id}
                                    type="button"
                                    onClick={() => setPayPending({ ...payPending, accountId: card.id })}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                                      payPending.accountId === card.id
                                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-400'
                                    }`}
                                  >
                                    <Landmark size={13} /> {card.name}
                                  </button>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPayPending(null)}
                                  className="flex-1 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={confirmPay}
                                  className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
                                >
                                  Confirmar pago
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        onClick={() => deleteDebt?.(debt.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl transition"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => { setCalcOpen(calcOpen === debt.id ? null : debt.id); setExtraPayment(''); }}
                        title="Calculadora de deuda"
                        className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-xl transition"
                      >
                        <Calculator size={14} />
                      </button>
                      {!isPaying && (
                        <button
                          onClick={() => handlePayClick(debt.id)}
                          disabled={debt.paid}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                            debt.paid
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {debt.paid ? 'Pagado ✓' : 'Pagar este mes'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Calculadora de deuda */}
                  <AnimatePresence>
                    {calcOpen === debt.id && (() => {
                      const base = debt.monthlyPayment || 0;
                      const extra = parseFloat(extraPayment.replace(/\./g, '').replace(',', '.')) || 0;
                      const total = base + extra;
                      const rem = debt.remainingAmount || 0;
                      const monthsBase = base > 0 ? Math.ceil(rem / base) : null;
                      const monthsNew  = total > 0 ? Math.ceil(rem / total) : null;
                      const saved = (monthsBase && monthsNew) ? monthsBase - monthsNew : null;
                      return (
                        <motion.div
                          key="calc"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden"
                        >
                          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-2xl p-4 space-y-3">
                            <p className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                              <Calculator size={13} /> ¿Cuánto ahorras pagando más?
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-bold shrink-0">+ $</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Pago extra mensual"
                                value={extraPayment}
                                onChange={e => setExtraPayment(e.target.value)}
                                className="flex-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400"
                              />
                            </div>
                            {monthsBase && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white dark:bg-slate-900 rounded-xl p-3 text-center">
                                  <p className="text-[10px] font-black text-slate-400 uppercase">Sin extra</p>
                                  <p className="text-lg font-black text-slate-700 dark:text-slate-200">{monthsBase} <span className="text-xs font-bold">meses</span></p>
                                </div>
                                <div className={`rounded-xl p-3 text-center ${saved > 0 ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-white dark:bg-slate-900'}`}>
                                  <p className="text-[10px] font-black text-slate-400 uppercase">Con +${fmt(extra)}</p>
                                  <p className={`text-lg font-black ${saved > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {monthsNew ?? '—'} <span className="text-xs font-bold">meses</span>
                                  </p>
                                  {saved > 0 && <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">¡{saved} mes{saved>1?'es':''} menos!</p>}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>

    </div>
  );
}
