import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Plus, Trash2, RotateCcw, Wallet, Check, AlertTriangle,
  Landmark, FileText, Layers, Calculator, ChevronDown, ChevronUp, ShieldAlert,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { parseAmount, formatAmount } from '../utils/format';
import { CATEGORY_ICONS } from '../utils/constants';

const CATEGORIES = [
  'Vivienda', 'Alimentación', 'Transporte', 'Salud',
  'Entretenimiento', 'Educación', 'Personal', 'Financiero', 'Ahorro/Inversión',
];

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
  name: '', type: 'credit', creditLimit: '',
  bank: '', lastFourDigits: '', colorIndex: 0, cutoffDay: '15',
});

// ── Physical card visual ──────────────────────────────────

const CardVisual = ({ card, onDelete, onReset, expenses }) => {
  const colorSet = CARD_COLORS[card.colorIndex || 0] || CARD_COLORS[0];
  const isDebit  = card.type === 'debit';
  const used      = card.usedAmount || 0;
  const limit     = card.creditLimit || 0;
  const available = limit - used;
  const pct       = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isLowCredit = !isDebit && limit > 0 && available / limit < 0.10 && available >= 0;

  const now = new Date();
  const thisMonthLinked = (expenses || []).filter(e => {
    if (e.creditCardId !== card.id) return false;
    const d = new Date(e.date + 'T00:00:00');
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const nextStatementTotal = thisMonthLinked.reduce((a, e) => a + e.amount, 0);

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-3">
      {/* Physical card */}
      <div className={`bg-gradient-to-br ${colorSet.bg} rounded-3xl p-6 shadow-xl relative overflow-hidden group`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        {/* EMV chip */}
        <div className="absolute top-6 right-6 w-8 h-6 rounded-md bg-amber-300/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-6 h-4 rounded-sm border border-amber-500/50 grid grid-cols-2 gap-px p-0.5">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-amber-500/40 rounded-sm" />)}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-5">
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isDebit ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/20 text-white/70'}`}>
                {isDebit ? 'Débito' : 'Crédito'}
              </span>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">{card.bank || 'Banco'}</p>
              <p className="text-white font-black text-lg tracking-tight mt-0.5">{card.name}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isDebit && (
                <button onClick={() => onReset(card.id)} title="Reiniciar saldo" className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                  <RotateCcw size={14} />
                </button>
              )}
              <button onClick={() => onDelete(card.id)} title="Eliminar" className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/50 text-white transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-5">
            {['••••', '••••', '••••'].map((g, i) => (
              <span key={i} className="text-white/40 text-sm font-bold tracking-[0.3em]">{g}</span>
            ))}
            <span className="text-white font-bold text-sm tracking-[0.3em]">{card.lastFourDigits || '••••'}</span>
          </div>

          {isDebit ? (
            <div>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-0.5">Saldo Disponible</p>
              <p className="text-3xl font-black text-white">$ {fmt(limit)}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-0.5">Usado</p>
                  <p className={`text-xl font-black ${available < 0 ? 'text-rose-300' : 'text-white'}`}>$ {fmt(used)}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-0.5">Disponible</p>
                  <p className={`text-xl font-black ${available < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>$ {fmt(available)}</p>
                </div>
              </div>
              {limit > 0 && (
                <div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${pct > 90 ? 'bg-rose-400' : pct > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] font-bold text-white/40">{pct.toFixed(0)}% utilizado</span>
                    <span className="text-[10px] font-bold text-white/40">Cupo: $ {fmt(limit)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isLowCredit && (
        <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl px-4 py-3">
          <AlertTriangle size={15} className="text-rose-500 mt-0.5 shrink-0" />
          <p className="text-xs text-rose-700 dark:text-rose-300 font-bold">Menos del 10% de cupo disponible — ${fmt(available)} restantes.</p>
        </div>
      )}

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
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Corte día</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">{card.cutoffDay || '—'}</p>
          </div>
        )}
      </div>

      {thisMonthLinked.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <p className="px-4 pt-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Últimos cargos</p>
          {thisMonthLinked.slice(0, 3).map(exp => (
            <div key={exp.id} className="flex items-center justify-between px-4 py-2.5 border-t border-slate-50 dark:border-slate-800/50">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{exp.description || exp.category}</p>
                <p className="text-[10px] text-slate-400">{new Date(exp.date + 'T00:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}</p>
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-white shrink-0">$ {fmt(exp.amount)}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ── Tab: Estado de Cuenta ─────────────────────────────────

const EstadoCuenta = ({ expenses, creditCards }) => {
  const [selectedCard, setSelectedCard] = useState(creditCards[0]?.id || '');
  const card = creditCards.find(c => c.id === selectedCard);

  const { periodExpenses, periodTotal, cutoffFrom, cutoffTo, paymentDate } = useMemo(() => {
    if (!card) return { periodExpenses: [], periodTotal: 0, cutoffFrom: null, cutoffTo: null, paymentDate: null };

    const cutoffDay = parseInt(card.cutoffDay) || 15;
    const payDay    = parseInt(card.paymentDay) || (cutoffDay + 10);
    const now       = new Date();

    // Compute billing period
    let cutFrom = new Date(now.getFullYear(), now.getMonth(), cutoffDay + 1);
    if (now.getDate() <= cutoffDay) {
      cutFrom = new Date(now.getFullYear(), now.getMonth() - 1, cutoffDay + 1);
    }
    const cutTo = new Date(cutFrom.getFullYear(), cutFrom.getMonth() + 1, cutoffDay);
    const pay   = new Date(cutTo.getFullYear(), cutTo.getMonth(), payDay);

    const filtered = expenses.filter(e => {
      if (e.creditCardId !== card.id) return false;
      const d = new Date(e.date + 'T00:00:00');
      return d >= cutFrom && d <= cutTo;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      periodExpenses: filtered,
      periodTotal: filtered.reduce((a, e) => a + e.amount, 0),
      cutoffFrom: cutFrom,
      cutoffTo: cutTo,
      paymentDate: pay,
    };
  }, [card, expenses]);

  const byCategory = useMemo(() => {
    const map = {};
    periodExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [periodExpenses]);

  if (creditCards.length === 0) {
    return <div className="text-center py-12 text-slate-400 text-sm">No tienes tarjetas de crédito registradas.</div>;
  }

  const fmtDate = (d) => d ? d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' }) : '—';

  return (
    <div className="space-y-5">
      {/* Card selector */}
      <div className="flex gap-2 flex-wrap">
        {creditCards.map(c => (
          <button key={c.id} onClick={() => setSelectedCard(c.id)}
            className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all border ${
              selectedCard === c.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
            }`}
          >
            {c.bank} ····{c.lastFourDigits}
          </button>
        ))}
      </div>

      {card && (
        <>
          {/* Period info */}
          <div className="c-card p-5 flex flex-wrap gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Período de corte</p>
              <p className="text-sm font-black text-slate-800 dark:text-white">{fmtDate(cutoffFrom)} → {fmtDate(cutoffTo)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Vencimiento pago</p>
              <p className="text-sm font-black text-amber-500">{fmtDate(paymentDate)}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total período</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white tabular-nums">{formatAmount(periodTotal)}</p>
            </div>
          </div>

          {/* Category breakdown */}
          {byCategory.length > 0 && (
            <div className="c-card p-5 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Por categoría</p>
              {byCategory.map(([cat, amount]) => {
                const pct = periodTotal > 0 ? Math.round((amount / periodTotal) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-slate-700 dark:text-slate-200">{cat}</span>
                      <span className="font-black text-slate-800 dark:text-white tabular-nums">{formatAmount(amount)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Expense list */}
          <div className="c-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Movimientos del período ({periodExpenses.length})
              </p>
            </div>
            {periodExpenses.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">Sin movimientos en este período</div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {periodExpenses.map(exp => (
                  <div key={exp.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{exp.description || exp.category}</p>
                      <p className="text-[10px] text-slate-400">
                        {exp.category} · {new Date(exp.date + 'T00:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                        {exp.isInstallment && ` · Cuota ${exp.currentInstallment}/${exp.installmentsCount}`}
                      </p>
                    </div>
                    <p className="text-sm font-black text-slate-800 dark:text-white shrink-0 ml-4">{formatAmount(exp.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Tab: Cuotas Activas ───────────────────────────────────

const CuotasActivas = ({ expenses, creditCards }) => {
  const groups = useMemo(() => {
    const installments = expenses.filter(e => e.isInstallment);
    const map = {};

    installments.forEach(e => {
      const key = `${e.description || e.category}__${e.installmentsCount}__${e.creditCardId || 'cash'}`;
      if (!map[key]) {
        map[key] = {
          key,
          description: e.description || e.category,
          category: e.category,
          totalInstallments: e.installmentsCount || 1,
          creditCardId: e.creditCardId,
          amount: e.amount, // monthly amount
          payments: [],
        };
      }
      map[key].payments.push(e.currentInstallment || 1);
    });

    return Object.values(map)
      .map(g => {
        const maxPaid = Math.max(...g.payments);
        const remaining = g.totalInstallments - maxPaid;
        const card = creditCards.find(c => c.id === g.creditCardId);
        return { ...g, maxPaid, remaining, card };
      })
      .filter(g => g.remaining > 0)
      .sort((a, b) => a.remaining - b.remaining);
  }, [expenses, creditCards]);

  if (groups.length === 0) {
    return (
      <div className="c-card p-12 flex flex-col items-center text-slate-400 gap-3">
        <Layers size={32} className="opacity-30" />
        <p className="text-sm font-bold">No hay cuotas activas</p>
        <p className="text-xs text-center">Las compras en cuotas aparecerán aquí mientras estén pendientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.length === 1 && <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl">
        <AlertTriangle size={14} className="text-amber-500" />
        <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Solo queda 1 cuota en una compra</p>
      </div>}
      {groups.map(g => {
        const pct = Math.round((g.maxPaid / g.totalInstallments) * 100);
        const isLast = g.remaining === 1;
        return (
          <div key={g.key} className={`c-card p-5 ${isLast ? 'border-amber-300 dark:border-amber-500/30' : ''}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-800 dark:text-white truncate">{g.description}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{g.category}</span>
                  {g.card && <span className="text-[10px] font-bold text-slate-400">{g.card.bank} ····{g.card.lastFourDigits}</span>}
                  {isLast && <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">¡Última cuota!</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{formatAmount(g.amount)}</p>
                <p className="text-[10px] font-semibold text-slate-400">por cuota</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>Cuota {g.maxPaid} de {g.totalInstallments}</span>
                <span className="text-slate-600 dark:text-slate-300 font-black">{g.remaining} restante{g.remaining !== 1 ? 's' : ''} = {formatAmount(g.amount * g.remaining)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Tab: Simulador CAE ────────────────────────────────────

const SimuladorCAE = () => {
  const [monto,  setMonto]  = useState('');
  const [cuotas, setCuotas] = useState('12');
  const [tasa,   setTasa]   = useState('1.5');
  const [showTable, setShowTable] = useState(false);

  const result = useMemo(() => {
    const pv = parseAmount(monto) || 0;
    const n  = parseInt(cuotas) || 12;
    const r  = (parseFloat(tasa) || 0) / 100;

    if (pv <= 0 || n <= 0 || r <= 0) return null;

    const pmt   = pv * r / (1 - Math.pow(1 + r, -n));
    const total = pmt * n;
    const cost  = total - pv;
    const cae   = (Math.pow(1 + r, 12) - 1) * 100;

    // Amortization schedule
    let balance = pv;
    const schedule = [];
    for (let i = 1; i <= Math.min(n, 36); i++) {
      const interest  = balance * r;
      const principal = pmt - interest;
      balance -= principal;
      schedule.push({
        cuota: i,
        pmt: Math.round(pmt),
        interest: Math.round(interest),
        principal: Math.round(principal),
        balance: Math.max(0, Math.round(balance)),
      });
    }

    return { pmt: Math.round(pmt), total: Math.round(total), cost: Math.round(cost), cae, schedule };
  }, [monto, cuotas, tasa]);

  return (
    <div className="space-y-5">
      {/* Inputs */}
      <div className="c-card p-6 space-y-4">
        <div className="c-card-header mb-1">
          <div className="c-card-icon bg-violet-50 dark:bg-violet-500/10 text-violet-600">
            <Calculator size={20} />
          </div>
          <div>
            <h2 className="c-card-title">Simulador de cuotas</h2>
            <p className="c-card-subtitle">Calcula el costo real de una compra en cuotas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="f-label">Monto de compra</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input type="text" inputMode="numeric" placeholder="ej: 300000"
                value={monto} onChange={e => setMonto(e.target.value)}
                className="f-input pl-7 w-full" />
            </div>
          </div>
          <div>
            <label className="f-label">N° de cuotas</label>
            <input type="number" min="1" max="72" placeholder="12"
              value={cuotas} onChange={e => setCuotas(e.target.value)}
              className="f-input w-full" />
          </div>
          <div>
            <label className="f-label">Tasa mensual (%)</label>
            <input type="number" step="0.01" min="0" placeholder="1.5"
              value={tasa} onChange={e => setTasa(e.target.value)}
              className="f-input w-full" />
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Cuota mensual',   value: formatAmount(result.pmt),             color: 'text-slate-800 dark:text-white' },
              { label: 'Total a pagar',   value: formatAmount(result.total),            color: 'text-rose-600 dark:text-rose-400' },
              { label: 'Costo financiero',value: formatAmount(result.cost),             color: 'text-amber-600 dark:text-amber-400' },
              { label: 'CAE anual',       value: `${result.cae.toFixed(2)}%`,           color: 'text-violet-600 dark:text-violet-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="c-card p-4 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                <p className={`text-lg font-black tabular-nums ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Visual cost bar */}
          <div className="c-card p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Distribución del pago total</p>
            <div className="h-6 rounded-full overflow-hidden flex">
              <div className="bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white transition-all"
                style={{ width: `${(parseAmount(monto) / result.total) * 100}%` }}>
                Capital
              </div>
              <div className="bg-rose-400 flex items-center justify-center text-[10px] font-black text-white transition-all flex-1">
                Intereses
              </div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
              <span>{formatAmount(parseAmount(monto))} capital</span>
              <span>{formatAmount(result.cost)} intereses ({Math.round((result.cost/result.total)*100)}%)</span>
            </div>
          </div>

          {/* Amortization toggle */}
          <div className="c-card overflow-hidden">
            <button
              onClick={() => setShowTable(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <p className="text-sm font-black text-slate-700 dark:text-slate-200">Tabla de amortización</p>
              {showTable ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>
            <AnimatePresence>
              {showTable && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                          {['Cuota', 'Pago', 'Interés', 'Capital', 'Saldo'].map(h => (
                            <th key={h} className="px-4 py-2 text-left font-black text-slate-400 uppercase tracking-widest text-[9px]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {result.schedule.map(row => (
                          <tr key={row.cuota} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-2.5 font-black text-slate-500">{row.cuota}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-white tabular-nums">{formatAmount(row.pmt)}</td>
                            <td className="px-4 py-2.5 font-bold text-rose-500 tabular-nums">{formatAmount(row.interest)}</td>
                            <td className="px-4 py-2.5 font-bold text-emerald-500 tabular-nums">{formatAmount(row.principal)}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-600 dark:text-slate-300 tabular-nums">{formatAmount(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {!result && monto && (
        <p className="text-center text-sm text-slate-400 py-4">Completa los campos para ver los resultados</p>
      )}
    </div>
  );
};

// ── Tab: Límites por categoría ────────────────────────────

const LimitesPorTarjeta = ({ creditCards, expenses, updateCreditCard }) => {
  const creditOnly = creditCards.filter(c => c.type !== 'debit');
  const [selectedId, setSelectedId] = useState(creditOnly[0]?.id || '');
  const [localLimits, setLocalLimits] = useState({});
  const [saving, setSaving] = useState(false);

  const card = creditOnly.find(c => c.id === selectedId);

  useEffect(() => {
    setLocalLimits(card?.categoryLimits || {});
  }, [selectedId, card]);

  const now = new Date();
  const monthSpending = useMemo(() => {
    if (!card) return {};
    const result = {};
    expenses
      .filter(e => {
        if (e.creditCardId !== card.id) return false;
        const d = new Date(e.date + 'T00:00:00');
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .forEach(e => { result[e.category] = (result[e.category] || 0) + e.amount; });
    return result;
  }, [card, expenses]);

  const handleSave = async () => {
    if (!card) return;
    setSaving(true);
    const cleaned = {};
    Object.entries(localLimits).forEach(([cat, val]) => {
      const num = parseAmount(String(val));
      if (num > 0) cleaned[cat] = num;
    });
    await updateCreditCard(card.id, { categoryLimits: cleaned });
    setSaving(false);
  };

  if (creditOnly.length === 0) {
    return <div className="c-card p-12 flex flex-col items-center text-slate-400 gap-2"><ShieldAlert size={32} className="opacity-30" /><p className="text-sm font-bold">No tienes tarjetas de crédito registradas</p></div>;
  }

  const hasAlerts = CATEGORIES.some(cat => {
    const limitNum = parseAmount(String(card?.categoryLimits?.[cat] || 0));
    const spent = monthSpending[cat] || 0;
    return limitNum > 0 && spent / limitNum >= 0.8;
  });

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {creditOnly.map(c => (
          <button key={c.id} onClick={() => setSelectedId(c.id)}
            className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all border ${
              selectedId === c.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
            }`}
          >
            {c.bank} ····{c.lastFourDigits}
          </button>
        ))}
      </div>

      {card && (
        <>
          {hasAlerts && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl px-4 py-3">
              <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                Hay categorías cerca de su límite o excedidas este mes.
              </p>
            </div>
          )}

          <div className="c-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-200">
                {card.bank} ····{card.lastFourDigits} — límites mensuales por categoría
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Gasto del mes vs tu límite. Deja vacío para sin límite.</p>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {CATEGORIES.map(cat => {
                const Icon = CATEGORY_ICONS[cat] || CATEGORY_ICONS['Default'];
                const rawVal = localLimits[cat] !== undefined ? localLimits[cat] : (card.categoryLimits?.[cat] || '');
                const limitNum = parseAmount(String(rawVal)) || 0;
                const spent = monthSpending[cat] || 0;
                const pct = limitNum > 0 ? Math.min((spent / limitNum) * 100, 100) : 0;
                const isOver = limitNum > 0 && spent > limitNum;
                const isWarn = limitNum > 0 && !isOver && spent / limitNum >= 0.8;

                return (
                  <div key={cat} className={`px-5 py-4 ${isOver ? 'bg-rose-50/50 dark:bg-rose-500/5' : isWarn ? 'bg-amber-50/30 dark:bg-amber-500/5' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${isOver ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600' : isWarn ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{cat}</span>
                            {spent > 0 && (
                              <span className={`text-xs font-black tabular-nums shrink-0 ${isOver ? 'text-rose-500' : isWarn ? 'text-amber-500' : 'text-slate-400'}`}>
                                {formatAmount(spent)}
                              </span>
                            )}
                          </div>
                          <div className="relative shrink-0">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="Sin límite"
                              value={rawVal}
                              onChange={e => setLocalLimits(prev => ({ ...prev, [cat]: e.target.value }))}
                              className="w-28 pl-6 pr-2 py-1.5 rounded-xl text-xs font-bold text-right bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                        {limitNum > 0 && (
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5 }}
                              className={`h-full rounded-full ${isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-400' : 'bg-indigo-500'}`}
                            />
                          </div>
                        )}
                        {isOver && (
                          <p className="text-[10px] font-black text-rose-500 mt-1">
                            Excedido en {formatAmount(spent - limitNum)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition disabled:opacity-50"
            >
              {saving
                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                : <Check size={14} />
              }
              Guardar límites
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────

const TABS = [
  { key: 'tarjetas',  label: 'Mis Tarjetas',     icon: CreditCard  },
  { key: 'estado',    label: 'Estado de Cuenta',  icon: FileText    },
  { key: 'cuotas',    label: 'Cuotas Activas',    icon: Layers      },
  { key: 'limites',   label: 'Límites',           icon: ShieldAlert },
  { key: 'simulador', label: 'Simulador CAE',     icon: Calculator  },
];

export default function Tarjetas() {
  const { creditCards = [], addCreditCard, deleteCreditCard, updateCreditCard, resetCardBalance, expenses = [] } = useExpenses();
  const [tab, setTab]         = useState('tarjetas');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm());

  const creditCardsList = creditCards.filter(c => c.type !== 'debit');
  const debitCardsList  = creditCards.filter(c => c.type === 'debit');
  const totalLimit = useMemo(() => creditCardsList.reduce((a, c) => a + (c.creditLimit || 0), 0), [creditCardsList]);
  const totalUsed  = useMemo(() => creditCardsList.reduce((a, c) => a + (c.usedAmount || 0), 0), [creditCardsList]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addCreditCard?.({
      name: form.name.trim(), type: form.type,
      creditLimit: parseAmount(form.creditLimit) || 0,
      bank: form.bank.trim(), lastFourDigits: form.lastFourDigits.trim(),
      colorIndex: parseInt(form.colorIndex) || 0,
      cutoffDay: parseInt(form.cutoffDay) || 15,
      paymentDay: parseInt(form.cutoffDay) + 10 || 25,
    });
    setForm(emptyForm());
    setShowForm(false);
  };

  return (
    <div className="pg-container">
      {/* Header */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4 }}>
        <div className="pg-header">
          <div>
            <h1 data-tutorial-id="tarjetas-title" className="pg-title">Mis Tarjetas</h1>
            <p className="pg-subtitle">Débito, crédito, cuotas y simulaciones</p>
          </div>
          {tab === 'tarjetas' && (
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition"
            >
              <Plus size={16} /> Nueva Tarjeta
            </button>
          )}
        </div>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-1 justify-center ${
                tab === t.key
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Summary — credit only, shown on tarjetas tab */}
      {tab === 'tarjetas' && creditCardsList.length > 0 && (
        <motion.div {...FADE_UP} transition={{ duration: 0.4, delay: 0.05 }} className="grid grid-cols-3 gap-3">
          {[
            { label: 'Cupo Total', value: `$${fmt(totalLimit)}`, icon: CreditCard, color: 'text-indigo-600' },
            { label: 'Usado', value: `$${fmt(totalUsed)}`, icon: Wallet, color: 'text-rose-600' },
            { label: 'Disponible', value: `$${fmt(totalLimit - totalUsed)}`, icon: Check, color: totalLimit - totalUsed < 0 ? 'text-rose-600' : 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="c-card p-4 flex items-center gap-3">
              <s.icon size={16} className={`shrink-0 ${s.color}`} />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 truncate">{s.label}</p>
                <p className="text-base font-black text-slate-800 dark:text-white tabular-nums">{s.value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && tab === 'tarjetas' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleSubmit} className="c-card p-6 space-y-4">
              <h3 className="font-black text-slate-800 dark:text-white text-lg">Nueva Tarjeta</h3>

              <div className="grid grid-cols-2 gap-3">
                {['debit', 'credit'].map(t => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
                      form.type === t
                        ? t === 'debit'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                          : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    {t === 'debit' ? <Landmark size={16} /> : <CreditCard size={16} />}
                    {t === 'debit' ? 'Débito' : 'Crédito'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Nombre (ej: Visa Gold)" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} className="f-input font-bold" required />
                <input type="text" placeholder="Banco (ej: BancoEstado)" value={form.bank}
                  onChange={e => setForm({ ...form, bank: e.target.value })} className="f-input font-bold" />
                <input type="text" inputMode="numeric"
                  placeholder={form.type === 'debit' ? 'Saldo actual' : 'Cupo total'}
                  value={form.creditLimit}
                  onChange={e => setForm({ ...form, creditLimit: e.target.value })} className="f-input font-bold" required />
                <input type="text" placeholder="Últimos 4 dígitos" maxLength="4" value={form.lastFourDigits}
                  onChange={e => setForm({ ...form, lastFourDigits: e.target.value.replace(/\D/g, '').slice(0, 4) })} className="f-input font-bold" />
                {form.type === 'credit' && (
                  <input type="number" min="1" max="28" placeholder="Día de corte (ej: 15)"
                    value={form.cutoffDay}
                    onChange={e => setForm({ ...form, cutoffDay: e.target.value })} className="f-input font-bold" />
                )}
              </div>

              <div>
                <p className="f-label mb-2">Color</p>
                <div className="flex gap-2">
                  {CARD_COLORS.map((c, i) => (
                    <button key={i} type="button" onClick={() => setForm({ ...form, colorIndex: i })}
                      className={`w-10 h-7 rounded-lg bg-gradient-to-br ${c.bg} border-2 transition-all ${parseInt(form.colorIndex) === i ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm()); }}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-indigo-500/20">
                  Guardar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {tab === 'tarjetas' && (
            <div className="space-y-6">
              {debitCardsList.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Landmark size={14} /> Tarjetas de Débito
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence initial={false}>
                      {debitCardsList.map(card => <CardVisual key={card.id} card={card} onDelete={deleteCreditCard} onReset={resetCardBalance} expenses={expenses} />)}
                    </AnimatePresence>
                  </div>
                </div>
              )}
              {creditCardsList.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <CreditCard size={14} /> Tarjetas de Crédito
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence initial={false}>
                      {creditCardsList.map(card => <CardVisual key={card.id} card={card} onDelete={deleteCreditCard} onReset={resetCardBalance} expenses={expenses} />)}
                    </AnimatePresence>
                  </div>
                </div>
              )}
              {creditCards.length === 0 && (
                <div className="c-card p-12 flex flex-col items-center text-slate-400">
                  <CreditCard size={48} className="mb-3 opacity-30" />
                  <p className="text-sm font-bold">No tienes tarjetas registradas</p>
                  <p className="text-xs mt-1">Pulsa "Nueva Tarjeta" para añadir una</p>
                </div>
              )}
              {creditCardsList.some(c => (c.usedAmount || 0) > (c.creditLimit || 0)) && (
                <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl px-4 py-3">
                  <AlertTriangle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-rose-700 dark:text-rose-300 font-bold">¡Cuidado! Una tarjeta ha superado su cupo.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'estado' && <EstadoCuenta expenses={expenses} creditCards={creditCardsList} />}
          {tab === 'cuotas' && <CuotasActivas expenses={expenses} creditCards={creditCards} />}
          {tab === 'limites' && <LimitesPorTarjeta creditCards={creditCards} expenses={expenses} updateCreditCard={updateCreditCard} />}
          {tab === 'simulador' && <SimuladorCAE />}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
