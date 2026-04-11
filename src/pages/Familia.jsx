import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Trash2, X, Save, DollarSign,
  CheckCircle2, Receipt, ArrowRightLeft, User,
  ChevronDown, Wallet,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { parseAmount } from '../utils/format';

const fmt = (v) => Number(v || 0).toLocaleString('es-CL');
const FADE_UP = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const TODAY = new Date().toISOString().split('T')[0];

const PERSON_COLORS = [
  { key: 'rose',    bg: 'bg-rose-400',    ring: 'ring-rose-400',    light: 'bg-rose-50 dark:bg-rose-950/40',    text: 'text-rose-600' },
  { key: 'amber',   bg: 'bg-amber-400',   ring: 'ring-amber-400',   light: 'bg-amber-50 dark:bg-amber-950/40',  text: 'text-amber-600' },
  { key: 'emerald', bg: 'bg-emerald-400', ring: 'ring-emerald-400', light: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600' },
  { key: 'sky',     bg: 'bg-sky-400',     ring: 'ring-sky-400',     light: 'bg-sky-50 dark:bg-sky-950/40',      text: 'text-sky-600' },
  { key: 'violet',  bg: 'bg-violet-400',  ring: 'ring-violet-400',  light: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600' },
  { key: 'pink',    bg: 'bg-pink-400',    ring: 'ring-pink-400',    light: 'bg-pink-50 dark:bg-pink-950/40',    text: 'text-pink-600' },
  { key: 'orange',  bg: 'bg-orange-400',  ring: 'ring-orange-400',  light: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-600' },
  { key: 'teal',    bg: 'bg-teal-400',    ring: 'ring-teal-400',    light: 'bg-teal-50 dark:bg-teal-950/40',    text: 'text-teal-600' },
];

const colorOf = (key) => PERSON_COLORS.find(c => c.key === key) || PERSON_COLORS[0];

// Initials from name
const initials = (name) => name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);

const Avatar = ({ name, colorKey, size = 'md' }) => {
  const c = colorOf(colorKey);
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';
  return (
    <div className={`${sz} ${c.bg} rounded-xl flex items-center justify-center font-black text-white shrink-0`}>
      {initials(name || '?')}
    </div>
  );
};

const ME = { id: 'me', name: 'Tú', colorKey: 'sky' };

const TABS = [
  { key: 'grupo',    label: 'Grupo',    icon: Users },
  { key: 'gastos',   label: 'Gastos',   icon: Receipt },
  { key: 'balances', label: 'Balances', icon: ArrowRightLeft },
];

// ── Compute net balances (from "me" perspective) ──────────────────────────
function computeBalances(splitExpenses, splitPersons) {
  const net = {}; // { personId: number }  positive = they owe me
  splitPersons.forEach(p => { net[p.id] = 0; });

  splitExpenses.filter(e => !e.settled).forEach(e => {
    const participants = e.participants || [];
    if (e.paidById === 'me') {
      // I paid — others owe me their share
      participants.forEach(pt => {
        if (pt.personId !== 'me') {
          net[pt.personId] = (net[pt.personId] || 0) + (pt.share || 0);
        }
      });
    } else {
      // Someone else paid — I owe them my share (if I'm a participant)
      const myPart = participants.find(pt => pt.personId === 'me');
      if (myPart) {
        net[e.paidById] = (net[e.paidById] || 0) - (myPart.share || 0);
      }
    }
  });

  return net;
}

// ── Grupo Tab ─────────────────────────────────────────────────────────────
function GrupoTab({ splitPersons, addSplitPerson, deleteSplitPerson }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName]         = useState('');
  const [colorKey, setColorKey] = useState('rose');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addSplitPerson({ name: name.trim(), colorKey });
    setName('');
    setColorKey('rose');
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Me (fixed) */}
      <div className="c-card p-4 flex items-center gap-4">
        <Avatar name="Tú" colorKey="sky" />
        <div className="flex-1">
          <p className="font-black text-slate-800 dark:text-white text-sm">Tú</p>
          <p className="text-xs text-slate-400">Tu cuenta — siempre incluida</p>
        </div>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">Fijo</span>
      </div>

      {/* People */}
      <AnimatePresence initial={false}>
        {splitPersons.map(p => {
          const c = colorOf(p.colorKey);
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="c-card p-4 flex items-center gap-4"
            >
              <Avatar name={p.name} colorKey={p.colorKey} />
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800 dark:text-white text-sm truncate">{p.name}</p>
              </div>
              <button
                onClick={() => deleteSplitPerson(p.id)}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-xl transition shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={handleAdd}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="c-inner-card p-4 space-y-4">
              <input
                type="text"
                placeholder="Nombre (ej: María, Juan, Papá)"
                value={name}
                onChange={e => setName(e.target.value)}
                className="f-input w-full"
                autoFocus
                required
              />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Color</p>
                <div className="flex gap-2 flex-wrap">
                  {PERSON_COLORS.map(c => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setColorKey(c.key)}
                      className={`w-7 h-7 ${c.bg} rounded-lg transition-all ${colorKey === c.key ? `ring-2 ring-offset-2 ${c.ring} scale-110` : 'opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">Cancelar</button>
                <button type="submit" className="btn-accent px-5 py-2 rounded-2xl text-sm flex items-center gap-2">
                  <Save size={14} /> Agregar
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full c-card p-4 flex items-center gap-3 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/30 transition-all border-dashed"
        >
          <Plus size={18} />
          <span className="text-sm font-bold">Agregar persona</span>
        </button>
      )}
    </div>
  );
}

// ── Gastos Tab ────────────────────────────────────────────────────────────
function GastosTab({ splitPersons, splitExpenses, addSplitExpense, deleteSplitExpense, settleSplitExpense }) {
  const allPeople = [ME, ...splitPersons];
  const [showForm, setShowForm] = useState(false);
  const [showSettled, setShowSettled] = useState(false);

  const emptyForm = () => ({
    description: '',
    amount: '',
    date: TODAY,
    paidById: 'me',
    participants: allPeople.map(p => ({ personId: p.id, share: '', selected: true })),
  });

  const [form, setForm] = useState(emptyForm);

  const totalAmt = parseAmount(form.amount) || 0;
  const selectedParticipants = form.participants.filter(p => p.selected);

  const autoSplit = () => {
    if (!totalAmt || selectedParticipants.length === 0) return;
    const even = Math.round(totalAmt / selectedParticipants.length);
    setForm(f => ({
      ...f,
      participants: f.participants.map(p =>
        p.selected ? { ...p, share: String(even) } : { ...p, share: '' }
      ),
    }));
  };

  const sharesTotal = form.participants
    .filter(p => p.selected)
    .reduce((s, p) => s + (parseAmount(p.share) || 0), 0);
  const sharesOk = Math.abs(sharesTotal - totalAmt) < 2; // allow $1 rounding

  const toggleParticipant = (personId) => {
    setForm(f => ({
      ...f,
      participants: f.participants.map(p =>
        p.personId === personId ? { ...p, selected: !p.selected, share: '' } : p
      ),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description.trim() || !totalAmt || !sharesOk) return;
    addSplitExpense({
      description: form.description.trim(),
      amount: totalAmt,
      date: form.date,
      paidById: form.paidById,
      participants: form.participants
        .filter(p => p.selected)
        .map(p => ({ personId: p.personId, share: parseAmount(p.share) || 0 })),
    });
    setForm(emptyForm());
    setShowForm(false);
  };

  const active   = splitExpenses.filter(e => !e.settled);
  const settled  = splitExpenses.filter(e => e.settled);

  const personName = (id) => {
    if (id === 'me') return 'Tú';
    return splitPersons.find(p => p.id === id)?.name || '?';
  };
  const personColor = (id) => {
    if (id === 'me') return 'sky';
    return splitPersons.find(p => p.id === id)?.colorKey || 'slate';
  };

  return (
    <div className="space-y-4">
      {/* New expense form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="c-card p-5 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-black text-slate-800 dark:text-white text-sm">Nuevo gasto compartido</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text" placeholder="Descripción"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="f-input sm:col-span-1"
                  autoFocus required
                />
                <input
                  type="text" inputMode="numeric" placeholder="Monto total"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="f-input" required
                />
                <input
                  type="date" value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="f-input"
                />
              </div>

              {/* Paid by */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">¿Quién pagó?</p>
                <div className="flex gap-2 flex-wrap">
                  {allPeople.map(p => (
                    <button
                      key={p.id} type="button"
                      onClick={() => setForm({ ...form, paidById: p.id })}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        form.paidById === p.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent hover:border-slate-300'
                      }`}
                    >
                      <Avatar name={p.name} colorKey={p.colorKey || 'sky'} size="sm" />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Participants + shares */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Participantes y cuotas</p>
                  <button
                    type="button" onClick={autoSplit}
                    className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Dividir parejo
                  </button>
                </div>
                <div className="space-y-2">
                  {form.participants.map(pt => {
                    const person = allPeople.find(p => p.id === pt.personId);
                    if (!person) return null;
                    return (
                      <div key={pt.personId} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleParticipant(pt.personId)}
                          className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${
                            pt.selected
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-transparent'
                              : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-700 opacity-50'
                          }`}
                        >
                          <Avatar name={person.name} colorKey={person.colorKey || 'sky'} size="sm" />
                          {person.name}
                        </button>
                        {pt.selected && (
                          <div className="relative shrink-0">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                            <input
                              type="text" inputMode="numeric"
                              placeholder="0"
                              value={pt.share}
                              onChange={e => setForm(f => ({
                                ...f,
                                participants: f.participants.map(p =>
                                  p.personId === pt.personId ? { ...p, share: e.target.value } : p
                                ),
                              }))}
                              className="f-input w-32 pl-6 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {totalAmt > 0 && (
                  <p className={`text-xs font-bold mt-2 ${sharesOk ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {sharesOk
                      ? `✓ Cuotas correctas ($${fmt(sharesTotal)})`
                      : `Cuotas: $${fmt(sharesTotal)} — faltan $${fmt(totalAmt - sharesTotal)}`}
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">Cancelar</button>
                <button
                  type="submit"
                  disabled={!sharesOk || !form.description.trim() || !totalAmt}
                  className="btn-accent px-5 py-2 rounded-2xl text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={14} /> Registrar
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {!showForm && (
        <button
          onClick={() => { setForm(emptyForm()); setShowForm(true); }}
          className="btn-accent flex items-center gap-2 px-5 py-3 rounded-2xl text-sm"
        >
          <Plus size={16} /> Nuevo gasto compartido
        </button>
      )}

      {/* Active expenses */}
      {active.length === 0 && !showForm && (
        <div className="c-card p-8 text-center text-slate-400 text-sm font-bold">
          No hay gastos compartidos activos
        </div>
      )}

      <AnimatePresence initial={false}>
        {active.map(exp => (
          <SplitExpenseCard
            key={exp.id}
            exp={exp}
            splitPersons={splitPersons}
            personName={personName}
            personColor={personColor}
            onSettle={settleSplitExpense}
            onDelete={deleteSplitExpense}
          />
        ))}
      </AnimatePresence>

      {/* Settled toggle */}
      {settled.length > 0 && (
        <div>
          <button
            onClick={() => setShowSettled(v => !v)}
            className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3"
          >
            <ChevronDown size={14} className={`transition-transform ${showSettled ? 'rotate-180' : ''}`} />
            Liquidados · {settled.length}
          </button>
          <AnimatePresence>
            {showSettled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-3"
              >
                {settled.map(exp => (
                  <SplitExpenseCard
                    key={exp.id}
                    exp={exp}
                    splitPersons={splitPersons}
                    personName={personName}
                    personColor={personColor}
                    onDelete={deleteSplitExpense}
                    isSettled
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function SplitExpenseCard({ exp, splitPersons, personName, personColor, onSettle, onDelete, isSettled }) {
  const paidByName  = personName(exp.paidById);
  const paidByColor = personColor(exp.paidById);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`c-card p-4 space-y-3 ${isSettled ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="c-card-icon bg-slate-50 dark:bg-slate-800 shrink-0 mt-0.5">
            <DollarSign size={16} className="text-slate-500" />
          </div>
          <div className="min-w-0">
            <p className="font-black text-slate-800 dark:text-white text-sm truncate">{exp.description}</p>
            <p className="text-xs text-slate-400">
              {new Date(exp.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              {' · '}Pagó <span className="font-bold">{paidByName}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-black text-slate-800 dark:text-white tabular-nums">${fmt(exp.amount)}</span>
          {!isSettled && onSettle && (
            <button
              onClick={() => onSettle(exp.id)}
              title="Marcar como liquidado"
              className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg transition"
            >
              <CheckCircle2 size={16} />
            </button>
          )}
          <button
            onClick={() => onDelete(exp.id)}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Participant shares */}
      {(exp.participants || []).length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          {(exp.participants || []).map(pt => {
            const name  = personName(pt.personId);
            const color = personColor(pt.personId);
            const c = colorOf(color);
            return (
              <div key={pt.personId} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${c.light}`}>
                <Avatar name={name} colorKey={color} size="sm" />
                <span className={c.text}>{name}</span>
                <span className="text-slate-500 dark:text-slate-400">·</span>
                <span className="text-slate-700 dark:text-slate-300 tabular-nums">${fmt(pt.share)}</span>
              </div>
            );
          })}
        </div>
      )}

      {isSettled && (
        <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
          <CheckCircle2 size={13} /> Liquidado
        </div>
      )}
    </motion.div>
  );
}

// ── Balances Tab ──────────────────────────────────────────────────────────
function BalancesTab({ splitPersons, splitExpenses, settleAllWithPerson }) {
  const netBalances = useMemo(
    () => computeBalances(splitExpenses, splitPersons),
    [splitExpenses, splitPersons]
  );

  const allSettled = splitPersons.every(p => Math.abs(netBalances[p.id] || 0) < 1);

  if (splitPersons.length === 0) {
    return (
      <div className="c-card p-8 text-center text-slate-400 text-sm font-bold">
        Agrega personas en la pestaña Grupo para ver balances
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allSettled ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="c-card p-8 text-center"
        >
          <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
          <p className="font-black text-slate-800 dark:text-white text-lg mb-1">¡Todo en orden!</p>
          <p className="text-sm text-slate-400">No hay deudas pendientes</p>
        </motion.div>
      ) : null}

      {splitPersons.map((person, i) => {
        const balance = netBalances[person.id] || 0;
        if (Math.abs(balance) < 1) return (
          <motion.div
            key={person.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="c-card p-4 flex items-center gap-4"
          >
            <Avatar name={person.name} colorKey={person.colorKey} />
            <div className="flex-1">
              <p className="font-black text-slate-800 dark:text-white text-sm">{person.name}</p>
              <p className="text-xs text-emerald-500 font-bold">Sin deudas ✓</p>
            </div>
          </motion.div>
        );

        const owesMe = balance > 0;
        return (
          <motion.div
            key={person.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`c-card p-4 ${owesMe ? 'ring-1 ring-emerald-500/30' : 'ring-1 ring-rose-500/30'}`}
          >
            <div className="flex items-center gap-4">
              <Avatar name={person.name} colorKey={person.colorKey} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800 dark:text-white">{person.name}</p>
                {owesMe ? (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                    Te debe <span className="text-lg font-black">${fmt(Math.round(balance))}</span>
                  </p>
                ) : (
                  <p className="text-sm text-rose-600 dark:text-rose-400 font-bold">
                    Le debes <span className="text-lg font-black">${fmt(Math.round(Math.abs(balance)))}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => settleAllWithPerson(person.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  owesMe
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100'
                }`}
              >
                <CheckCircle2 size={13} /> Liquidar
              </button>
            </div>

            {/* Expense breakdown */}
            <BalanceBreakdown personId={person.id} splitExpenses={splitExpenses} splitPersons={splitPersons} />
          </motion.div>
        );
      })}

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="income-total-card"
      >
        <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-3">Resumen global</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-indigo-300 text-xs mb-1">Te deben en total</p>
            <p className="text-2xl font-black text-white tabular-nums">
              ${fmt(Math.round(Object.values(netBalances).filter(v => v > 0).reduce((a, b) => a + b, 0)))}
            </p>
          </div>
          <div>
            <p className="text-indigo-300 text-xs mb-1">Debes en total</p>
            <p className="text-2xl font-black text-white tabular-nums">
              ${fmt(Math.round(Math.abs(Object.values(netBalances).filter(v => v < 0).reduce((a, b) => a + b, 0))))}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function BalanceBreakdown({ personId, splitExpenses, splitPersons }) {
  const [open, setOpen] = useState(false);
  const personName = (id) => id === 'me' ? 'Tú' : splitPersons.find(p => p.id === id)?.name || '?';

  const relevant = splitExpenses.filter(e => !e.settled && (
    e.paidById === personId ||
    e.paidById === 'me' ||
    (e.participants || []).some(pt => pt.personId === personId || pt.personId === 'me')
  ) && (
    e.paidById === personId || e.paidById === 'me'
  ));

  if (relevant.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400"
      >
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        {relevant.length} gasto{relevant.length !== 1 ? 's' : ''} relacionado{relevant.length !== 1 ? 's' : ''}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-2 space-y-1"
          >
            {relevant.map(e => {
              const myPart  = (e.participants || []).find(pt => pt.personId === 'me');
              const hisPart = (e.participants || []).find(pt => pt.personId === personId);
              return (
                <div key={e.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 truncate max-w-[160px]">{e.description}</span>
                  <span className="font-bold text-slate-600 dark:text-slate-300 tabular-nums shrink-0 ml-2">
                    ${fmt(e.paidById === 'me' ? (hisPart?.share || 0) : (myPart?.share || 0))}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function Familia() {
  const {
    splitPersons, addSplitPerson, deleteSplitPerson,
    splitExpenses, addSplitExpense, deleteSplitExpense,
    settleSplitExpense, settleAllWithPerson,
  } = useExpenses();

  const [tab, setTab] = useState('grupo');

  const activeCount = splitExpenses.filter(e => !e.settled).length;

  return (
    <div className="pg-container">
      {/* Header */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4 }}>
        <h1 className="pg-title">Gastos Compartidos</h1>
        <p className="pg-subtitle">Split entre pareja, amigos o familia — sin apps externas</p>
      </motion.div>

      {/* Tab bar */}
      <motion.div {...FADE_UP} transition={{ duration: 0.4, delay: 0.05 }}
        className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/50"
      >
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black transition-all ${
                active
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{t.label}</span>
              {t.key === 'gastos' && activeCount > 0 && (
                <span className="w-4 h-4 bg-rose-500 rounded-full text-white text-[9px] font-black flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Tab content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {tab === 'grupo' && (
          <GrupoTab
            splitPersons={splitPersons}
            addSplitPerson={addSplitPerson}
            deleteSplitPerson={deleteSplitPerson}
          />
        )}
        {tab === 'gastos' && (
          <GastosTab
            splitPersons={splitPersons}
            splitExpenses={splitExpenses}
            addSplitExpense={addSplitExpense}
            deleteSplitExpense={deleteSplitExpense}
            settleSplitExpense={settleSplitExpense}
          />
        )}
        {tab === 'balances' && (
          <BalancesTab
            splitPersons={splitPersons}
            splitExpenses={splitExpenses}
            settleAllWithPerson={settleAllWithPerson}
          />
        )}
      </motion.div>
    </div>
  );
}
